import type { PrismaClient } from "@prisma/client";
import { recordCrmActivity, touchLastContactedAt } from "@/lib/crm/activities";
import { renderOutreachEmail } from "@/lib/crm/outreach/personalization";
import { prepareTrackedOutreachEmail } from "@/lib/crm/outreach/engagement/prepare";
import { getOutreachSettings } from "@/lib/crm/outreach/settings";
import { stopActiveEnrollmentsForContact } from "@/lib/crm/outreach/suppression";
import {
  computeNextRunAt,
  scheduleExecutionForStep,
} from "@/lib/crm/sequences/enrollment";
import {
  CLAIM_LEASE_MS,
  EXECUTION_MAX_ATTEMPTS,
  POST_SEND_PERSISTENCE_FAILURE,
  SCHEDULER_BATCH_MAX,
} from "@/lib/crm/sequences/constants";
import {
  claimExecution,
  completeExecutionRecord,
  createSendingEmailRecord,
  failExecutionRecord,
  finalizeEmailAmbiguous,
  finalizeEmailSent,
  releaseClaimToPending,
  skipExecutionRecord,
} from "@/lib/crm/sequences/execution-state";
import {
  classifySendFailure,
  isSmtpAuthOrConfigFailure,
  shouldRetryExecution,
} from "@/lib/crm/sequences/failure-classification";
import { validateBeforeTransportSend } from "@/lib/crm/sequences/pre-send-validation";
import { recoverStaleProcessingExecutions } from "@/lib/crm/sequences/stale-claim-recovery";
import type { SchedulerDeps } from "@/lib/crm/sequences/scheduler-deps";
import { mergeSchedulerDeps } from "@/lib/crm/sequences/scheduler-deps";
import { createTask } from "@/lib/crm/tasks";
import { normalizeOutboundMessageId } from "@/lib/crm/inbound/matching";

export type SchedulerRunResult = {
  claimed: number;
  processed: number;
  sent: number;
  skipped: number;
  suppressed: number;
  failed: number;
  ambiguous: number;
  deferred: number;
  completed: number;
  staleRecovered: number;
  dailyLimitReached: boolean;
  smtpUnavailable: boolean;
  remainingDue?: number;
};

export async function runSequenceSchedulerWithDeps(
  overrides?: Partial<SchedulerDeps>,
): Promise<SchedulerRunResult> {
  const deps = mergeSchedulerDeps(overrides);
  const db = deps.db;
  const now = deps.now();

  const result: SchedulerRunResult = {
    claimed: 0,
    processed: 0,
    sent: 0,
    skipped: 0,
    suppressed: 0,
    failed: 0,
    ambiguous: 0,
    deferred: 0,
    completed: 0,
    staleRecovered: 0,
    dailyLimitReached: false,
    smtpUnavailable: false,
  };

  const stale = await recoverStaleProcessingExecutions(db, now);
  result.staleRecovered = stale.recovered + stale.markedAmbiguous;
  result.ambiguous += stale.markedAmbiguous;

  const transport = await deps.resolveTransport();
  const settings = await getOutreachSettings();

  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  const sentToday = await db.crmEmail.count({
    where: {
      origin: "SEQUENCE",
      deliveryStatus: "SENT",
      sentAt: { gte: todayStart },
    },
  });

  if (sentToday >= settings.maxDailySequenceEmails) {
    result.dailyLimitReached = true;
    return result;
  }

  let remainingDaily = settings.maxDailySequenceEmails - sentToday;
  let smtpAbortRun = false;

  const dueEnrollments = await db.crmSequenceEnrollment.findMany({
    where: {
      status: "ACTIVE",
      nextRunAt: { lte: now },
    },
    orderBy: [{ nextRunAt: "asc" }, { id: "asc" }],
    take: SCHEDULER_BATCH_MAX,
    include: {
      sequence: {
        include: { steps: { orderBy: { position: "asc" } } },
      },
    },
  });

  for (const enrollment of dueEnrollments) {
    if (result.processed >= SCHEDULER_BATCH_MAX || smtpAbortRun) break;

    const step = enrollment.sequence.steps.find(
      (s) => s.position === enrollment.currentStep,
    );
    if (!step) {
      await completeEnrollment(db, enrollment.id);
      result.completed++;
      continue;
    }

    let execution = await db.crmSequenceExecution.findUnique({
      where: {
        enrollmentId_stepId: {
          enrollmentId: enrollment.id,
          stepId: step.id,
        },
      },
    });

    if (!execution) {
      await scheduleExecutionForStep({
        enrollmentId: enrollment.id,
        step,
        scheduledAt: enrollment.nextRunAt ?? now,
      });
      continue;
    }

    if (
      execution.status === "SENT" ||
      execution.status === "COMPLETED" ||
      execution.status === "SKIPPED" ||
      execution.status === "AMBIGUOUS"
    ) {
      if (execution.status !== "AMBIGUOUS") {
        await advanceEnrollment(db, enrollment.id, step, settings);
      }
      continue;
    }

    if (execution.status === "PROCESSING") {
      continue;
    }

    if (execution.status === "FAILED") {
      continue;
    }

    const claimExpiresAt = new Date(deps.now().getTime() + CLAIM_LEASE_MS);
    const claimed = await claimExecution(db, execution.id, claimExpiresAt);
    if (claimed.count === 0) {
      continue;
    }

    result.claimed++;
    result.processed++;

    await deps.hooks?.afterClaim?.({
      executionId: execution.id,
      enrollmentId: enrollment.id,
    });

    try {
      if (step.type === "WAIT") {
        await completeExecutionRecord(db, execution.id, "COMPLETED");
        await advanceEnrollment(db, enrollment.id, step, settings);
        result.completed++;
        continue;
      }

      if (step.type === "TASK") {
        await processTaskStep(db, {
          execution,
          enrollment,
          step,
          settings,
          result,
        });
        continue;
      }

      if (step.type === "EMAIL") {
        if (transport.kind === "none") {
          result.smtpUnavailable = true;
          smtpAbortRun = true;
          await releaseClaimToPending(db, execution.id);
          break;
        }

        if (remainingDaily <= 0) {
          result.dailyLimitReached = true;
          await releaseClaimToPending(db, execution.id);
          break;
        }

        const preSend = await validateBeforeTransportSend({
          db,
          enrollmentId: enrollment.id,
          contactId: enrollment.contactId,
          sequenceId: enrollment.sequenceId,
          settings,
          now: deps.now(),
        });

        if (preSend.action !== "PROCEED") {
          await handlePreSendBlock(db, {
            executionId: execution.id,
            enrollmentId: enrollment.id,
            contactId: enrollment.contactId,
            preSend,
            result,
          });
          continue;
        }

        const contact = await db.crmContact.findUniqueOrThrow({
          where: { id: enrollment.contactId },
          include: {
            company: true,
            leads: {
              where: { status: { notIn: ["UNQUALIFIED", "CLOSED"] } },
              take: 1,
            },
          },
        });

        const adminUser = await db.adminUser.findUnique({
          where: { id: enrollment.createdById },
        });
        const senderName = adminUser?.name ?? "Smartlance Designs";

        const rendered = renderOutreachEmail({
          subject: execution.subjectSnap ?? step.subject ?? "",
          body: execution.bodySnap ?? step.body ?? "",
          contact,
          senderName,
          footer: settings.outreachFooter,
        });

        if (rendered.hasUnresolved) {
          await failExecutionRecord(
            db,
            execution.id,
            "UNRESOLVED_VARIABLES",
            "PERMANENT",
          );
          await db.crmSequenceEnrollment.update({
            where: { id: enrollment.id },
            data: { status: "FAILED", stopReason: "ERROR", stopNote: "UNRESOLVED_VARIABLES" },
          });
          result.failed++;
          continue;
        }

        const emailRecord = await createSendingEmailRecord(db, {
          contactId: contact.id,
          enrollmentId: enrollment.id,
          executionId: execution.id,
          subject: rendered.subject,
          bodyText: rendered.body,
          createdById: enrollment.createdById,
        });

        const tracked = await prepareTrackedOutreachEmail({
          db,
          emailId: emailRecord.id,
          contactId: contact.id,
          bodyText: rendered.body,
        });

        await deps.hooks?.beforeTransport?.({
          executionId: execution.id,
          emailId: emailRecord.id,
        });

        const sendResult = await deps.sendEmail({
          category: "CRM_SEQUENCE",
          to: contact.email!,
          subject: rendered.subject,
          text: tracked.text,
          html: tracked.html ?? undefined,
          snapshotTarget: { crmEmailId: emailRecord.id },
        });

        await deps.hooks?.afterTransport?.({
          executionId: execution.id,
          emailId: emailRecord.id,
          sendResult,
        });

        if (!sendResult.success) {
          await handleSendFailure(db, {
            execution,
            enrollmentId: enrollment.id,
            emailId: emailRecord.id,
            code: sendResult.errorCode ?? "DELIVERY_FAILED",
            result,
            smtpAbortRunRef: { value: smtpAbortRun },
          });
          if (isSmtpAuthOrConfigFailure(sendResult.errorCode ?? "")) {
            smtpAbortRun = true;
          }
          continue;
        }

        try {
          await deps.hooks?.beforeFinalize?.({
            executionId: execution.id,
            emailId: emailRecord.id,
          });

          await finalizeEmailSent(db, {
            emailId: emailRecord.id,
            executionId: execution.id,
            providerMessageId: sendResult.messageId,
            internetMessageId: normalizeOutboundMessageId(sendResult.messageId),
            sentAt: deps.now(),
          });

          await recordCrmActivity({
            contactId: contact.id,
            leadId: enrollment.leadId,
            type: "EMAIL_SENT",
            subject: rendered.subject,
            metadata: {
              emailId: emailRecord.id,
              origin: "SEQUENCE",
              enrollmentId: enrollment.id,
              sequenceId: enrollment.sequenceId,
            },
            createdById: enrollment.createdById,
          });

          await touchLastContactedAt(contact.id);
          remainingDaily--;
          result.sent++;
          await advanceEnrollment(db, enrollment.id, step, settings);
        } catch (finalizeErr) {
          console.error(
            "[crm:scheduler:finalize]",
            finalizeErr instanceof Error ? finalizeErr.message : finalizeErr,
          );
          try {
            await finalizeEmailAmbiguous(db, {
              emailId: emailRecord.id,
              executionId: execution.id,
              providerMessageId: sendResult.messageId,
            });
          } catch {
            await db.crmEmail.update({
              where: { id: emailRecord.id },
              data: {
                deliveryStatus: "SENT_UNCONFIRMED",
                providerMessageId: sendResult.messageId ?? null,
              },
            });
            await db.crmSequenceExecution.update({
              where: { id: execution.id },
              data: {
                status: "AMBIGUOUS",
                failureCode: POST_SEND_PERSISTENCE_FAILURE,
                failureCategory: "AMBIGUOUS_DO_NOT_AUTO_RETRY",
              },
            });
          }
          result.ambiguous++;
        }
      }
    } catch (err) {
      console.error("[crm:scheduler]", err instanceof Error ? err.message : err);
      await failExecutionRecord(
        db,
        execution.id,
        err instanceof Error ? err.message.slice(0, 80) : "ERROR",
        "PERMANENT",
      );
      result.failed++;
    }
  }

  result.remainingDue = await db.crmSequenceEnrollment.count({
    where: { status: "ACTIVE", nextRunAt: { lte: deps.now() } },
  });

  return result;
}

async function handlePreSendBlock(
  db: PrismaClient,
  input: {
    executionId: string;
    enrollmentId: string;
    contactId: string;
    preSend: Exclude<
      Awaited<ReturnType<typeof validateBeforeTransportSend>>,
      { action: "PROCEED" }
    >;
    result: SchedulerRunResult;
  },
) {
  const { preSend } = input;

  if (preSend.action === "DEFER") {
    await releaseClaimToPending(db, input.executionId, {
      scheduledAt: preSend.deferUntil,
    });
    if (preSend.deferUntil) {
      await db.crmSequenceEnrollment.update({
        where: { id: input.enrollmentId },
        data: { nextRunAt: preSend.deferUntil },
      });
    }
    input.result.deferred++;
    return;
  }

  if (preSend.action === "STOP") {
    await skipExecutionRecord(db, input.executionId, preSend.reason, "SUPPRESSED");
    await stopActiveEnrollmentsForContact({
      contactId: input.contactId,
      reason: preSend.stopReason ?? "SUPPRESSED",
      note: preSend.reason,
    });
    input.result.suppressed++;
    input.result.skipped++;
    return;
  }

  await skipExecutionRecord(db, input.executionId, preSend.reason);
  input.result.skipped++;
}

async function handleSendFailure(
  db: PrismaClient,
  input: {
    execution: { id: string; attemptCount: number };
    enrollmentId: string;
    emailId: string;
    code: string;
    result: SchedulerRunResult;
    smtpAbortRunRef: { value: boolean };
  },
) {
  const category = classifySendFailure(input.code);
  const attempts = input.execution.attemptCount + 1;

  await db.crmEmail.update({
    where: { id: input.emailId },
    data: {
      deliveryStatus: "FAILED",
      failedAt: new Date(),
      safeFailureCode: input.code,
    },
  });

  if (shouldRetryExecution({ category, attemptCount: attempts })) {
    const retryAt = new Date(Date.now() + 30 * 60 * 1000);
    await releaseClaimToPending(db, input.execution.id, {
      scheduledAt: retryAt,
      attemptCount: attempts,
      failureCode: input.code,
      failureCategory: category,
    });
    await db.crmSequenceEnrollment.update({
      where: { id: input.enrollmentId },
      data: { nextRunAt: retryAt },
    });
  } else {
    await failExecutionRecord(db, input.execution.id, input.code, category);
    if (category === "PERMANENT") {
      await db.crmSequenceEnrollment.update({
        where: { id: input.enrollmentId },
        data: {
          status: "FAILED",
          stopReason: "ERROR",
          stopNote: input.code,
        },
      });
    }
    if (isSmtpAuthOrConfigFailure(input.code)) {
      input.smtpAbortRunRef.value = true;
    }
  }

  input.result.failed++;
}

async function processTaskStep(
  db: PrismaClient,
  input: {
    execution: {
      id: string;
      createdTaskId: string | null;
    };
    enrollment: {
      id: string;
      contactId: string;
      leadId: string | null;
      createdById: string;
    };
    step: {
      taskTitle: string | null;
      taskDescription: string | null;
      taskAdvanceMode: string;
      position: number;
      delayDays: number;
      delayMinutes: number;
      id: string;
      type: string;
      subject: string | null;
      body: string | null;
    };
    settings: Awaited<ReturnType<typeof getOutreachSettings>>;
    result: SchedulerRunResult;
  },
) {
  const fresh = await db.crmSequenceExecution.findUnique({
    where: { id: input.execution.id },
    select: { status: true, createdTaskId: true },
  });
  if (!fresh || fresh.status !== "PROCESSING") {
    return;
  }

  let taskId = fresh.createdTaskId;
  if (!taskId) {
    const task = await createTask({
      title: input.step.taskTitle ?? "Sequence task",
      description: input.step.taskDescription,
      contactId: input.enrollment.contactId,
      leadId: input.enrollment.leadId,
      createdById: input.enrollment.createdById,
      assignedToId: input.enrollment.createdById,
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    taskId = task.id;
    await db.crmSequenceExecution.update({
      where: { id: input.execution.id },
      data: { createdTaskId: taskId },
    });
  }

  await completeExecutionRecord(db, input.execution.id, "COMPLETED");

  if (input.step.taskAdvanceMode === "WAIT_FOR_TASK_COMPLETION") {
    await db.crmSequenceEnrollment.update({
      where: { id: input.enrollment.id },
      data: { nextRunAt: null },
    });
  } else {
    await advanceEnrollment(db, input.enrollment.id, input.step, input.settings);
  }

  input.result.completed++;
}

async function completeEnrollment(db: PrismaClient, enrollmentId: string) {
  const enrollment = await db.crmSequenceEnrollment.update({
    where: { id: enrollmentId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      nextRunAt: null,
    },
  });

  await recordCrmActivity({
    contactId: enrollment.contactId,
    type: "SEQUENCE_COMPLETED",
    subject: "Sequence completed",
    metadata: { enrollmentId },
  });
}

async function advanceEnrollment(
  db: PrismaClient,
  enrollmentId: string,
  currentStep: {
    position: number;
    delayDays: number;
    delayMinutes: number;
    id: string;
    type: string;
    subject: string | null;
    body: string | null;
  },
  settings: Awaited<ReturnType<typeof getOutreachSettings>>,
) {
  const enrollment = await db.crmSequenceEnrollment.findUniqueOrThrow({
    where: { id: enrollmentId },
    include: {
      sequence: { include: { steps: { orderBy: { position: "asc" } } } },
    },
  });

  const nextPosition = currentStep.position + 1;
  const nextStep = enrollment.sequence.steps.find((s) => s.position === nextPosition);

  if (!nextStep) {
    await completeEnrollment(db, enrollmentId);
    return;
  }

  const nextRunAt = computeNextRunAt(
    nextStep.delayDays,
    nextStep.delayMinutes,
    settings,
  );

  await db.crmSequenceEnrollment.update({
    where: { id: enrollmentId },
    data: {
      currentStep: nextPosition,
      nextRunAt,
    },
  });

  await scheduleExecutionForStep({
    enrollmentId,
    step: nextStep,
    scheduledAt: nextRunAt,
  });
}

/** Resume sequence after task completion (WAIT_FOR_TASK_COMPLETION mode). */
export async function advanceEnrollmentAfterTask(taskId: string) {
  const { prisma } = await import("@/lib/db");
  const task = await prisma.crmTask.findUnique({
    where: { id: taskId },
    include: { contact: true },
  });
  if (!task?.contactId || task.status !== "COMPLETED") return;

  const enrollment = await prisma.crmSequenceEnrollment.findFirst({
    where: {
      contactId: task.contactId,
      status: "ACTIVE",
      nextRunAt: null,
    },
    include: {
      sequence: { include: { steps: { orderBy: { position: "asc" } } } },
    },
  });
  if (!enrollment) return;

  const settings = await getOutreachSettings();
  const currentStep = enrollment.sequence.steps.find(
    (s) => s.position === enrollment.currentStep,
  );
  if (!currentStep) return;

  const nextRunAt = computeNextRunAt(0, settings.minStepDelayMinutes, settings);
  await prisma.crmSequenceEnrollment.update({
    where: { id: enrollment.id },
    data: { nextRunAt },
  });
}
