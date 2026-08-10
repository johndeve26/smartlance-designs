import { prisma } from "@/lib/db";
import { z } from "zod";
import { SEQUENCE_MIN_DELAY_MINUTES } from "@/lib/crm/sequences/constants";

export const sequenceStepSchema = z.object({
  type: z.enum(["EMAIL", "TASK", "WAIT"]),
  delayDays: z.coerce.number().int().min(0).max(365).default(0),
  delayMinutes: z.coerce.number().int().min(0).max(60 * 24 * 30).default(0),
  emailTemplateId: z.string().cuid().optional().or(z.literal("")),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  body: z.string().trim().max(50000).optional().or(z.literal("")),
  taskTitle: z.string().trim().max(200).optional().or(z.literal("")),
  taskDescription: z.string().trim().max(8000).optional().or(z.literal("")),
  taskAdvanceMode: z
    .enum(["AUTO_CONTINUE", "WAIT_FOR_TASK_COMPLETION"])
    .default("AUTO_CONTINUE"),
});

export const createSequenceSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

export async function listSequences(status?: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED") {
  return prisma.crmSequence.findMany({
    where: status ? { status } : undefined,
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          steps: true,
          enrollments: { where: { status: "ACTIVE" } },
        },
      },
      createdBy: { select: { id: true, name: true } },
    },
  });
}

export async function getSequenceById(id: string) {
  return prisma.crmSequence.findUnique({
    where: { id },
    include: {
      steps: { orderBy: { position: "asc" }, include: { emailTemplate: true } },
      createdBy: { select: { id: true, name: true } },
      updatedBy: { select: { id: true, name: true } },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  });
}

export async function createSequence(input: {
  name: string;
  description?: string | null;
  createdById: string;
}) {
  return prisma.crmSequence.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      createdById: input.createdById,
    },
  });
}

export async function updateSequenceMeta(input: {
  id: string;
  name: string;
  description?: string | null;
  updatedById: string;
}) {
  const seq = await prisma.crmSequence.findUniqueOrThrow({ where: { id: input.id } });
  if (seq.status === "ACTIVE") {
    throw new Error("Pause or archive the sequence before editing metadata.");
  }
  return prisma.crmSequence.update({
    where: { id: input.id },
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      updatedById: input.updatedById,
    },
  });
}

export async function replaceSequenceSteps(input: {
  sequenceId: string;
  steps: z.infer<typeof sequenceStepSchema>[];
  updatedById: string;
}) {
  const seq = await prisma.crmSequence.findUniqueOrThrow({
    where: { id: input.sequenceId },
  });
  if (seq.status === "ACTIVE") {
    throw new Error(
      "Cannot edit steps on an active sequence. Pause it or create a new version.",
    );
  }

  validateSteps(input.steps);

  await prisma.$transaction(async (tx) => {
    await tx.crmSequenceStep.deleteMany({ where: { sequenceId: input.sequenceId } });
    for (let i = 0; i < input.steps.length; i++) {
      const s = input.steps[i]!;
      let subject = s.subject?.trim() || null;
      let body = s.body?.trim() || null;

      if (s.type === "EMAIL" && s.emailTemplateId) {
        const tpl = await tx.crmEmailTemplate.findUnique({
          where: { id: s.emailTemplateId },
        });
        if (tpl) {
          subject = subject || tpl.subject;
          body = body || tpl.body;
        }
      }

      await tx.crmSequenceStep.create({
        data: {
          sequenceId: input.sequenceId,
          position: i,
          type: s.type,
          delayDays: s.delayDays,
          delayMinutes: Math.max(s.delayMinutes, s.type === "WAIT" ? 0 : 0),
          emailTemplateId: s.emailTemplateId || null,
          subject,
          body,
          taskTitle: s.taskTitle?.trim() || null,
          taskDescription: s.taskDescription?.trim() || null,
          taskAdvanceMode: s.taskAdvanceMode,
        },
      });
    }
    await tx.crmSequence.update({
      where: { id: input.sequenceId },
      data: { updatedById: input.updatedById },
    });
  });

  return getSequenceById(input.sequenceId);
}

function validateSteps(steps: z.infer<typeof sequenceStepSchema>[]) {
  if (!steps.length) throw new Error("Sequence must have at least one step.");
  if (steps.length > 20) throw new Error("Sequence cannot exceed 20 steps.");

  for (const s of steps) {
    const totalMinutes = s.delayDays * 24 * 60 + s.delayMinutes;
    if (s.type !== "WAIT" && totalMinutes > 0 && totalMinutes < SEQUENCE_MIN_DELAY_MINUTES) {
      throw new Error(
        `Minimum delay between steps is ${SEQUENCE_MIN_DELAY_MINUTES} minutes.`,
      );
    }
    if (s.type === "EMAIL") {
      if (!s.subject?.trim() && !s.emailTemplateId) {
        throw new Error("Email steps require a subject or template.");
      }
      if (!s.body?.trim() && !s.emailTemplateId) {
        throw new Error("Email steps require body content or a template.");
      }
    }
    if (s.type === "TASK" && !s.taskTitle?.trim()) {
      throw new Error("Task steps require a title.");
    }
  }

  let emailCount = 0;
  for (const s of steps) {
    if (s.type === "EMAIL") emailCount++;
    if (emailCount > 1) {
      // enforce min gap between email steps via delay on subsequent steps
    }
  }
}

export async function activateSequence(input: {
  sequenceId: string;
  actorId: string;
}) {
  const seq = await getSequenceById(input.sequenceId);
  if (!seq) throw new Error("Sequence not found.");
  if (!seq.steps.length) throw new Error("Add steps before activating.");
  validateSteps(
    seq.steps.map((s) => ({
      type: s.type,
      delayDays: s.delayDays,
      delayMinutes: s.delayMinutes,
      emailTemplateId: s.emailTemplateId ?? "",
      subject: s.subject ?? "",
      body: s.body ?? "",
      taskTitle: s.taskTitle ?? "",
      taskDescription: s.taskDescription ?? "",
      taskAdvanceMode: s.taskAdvanceMode,
    })),
  );

  return prisma.crmSequence.update({
    where: { id: input.sequenceId },
    data: {
      status: "ACTIVE",
      version: seq.version + (seq.status === "DRAFT" ? 0 : 1),
      updatedById: input.actorId,
    },
  });
}

export async function pauseSequence(sequenceId: string, actorId: string) {
  return prisma.crmSequence.update({
    where: { id: sequenceId },
    data: { status: "PAUSED", updatedById: actorId },
  });
}

export async function archiveSequence(sequenceId: string, actorId: string) {
  return prisma.crmSequence.update({
    where: { id: sequenceId },
    data: { status: "ARCHIVED", updatedById: actorId },
  });
}

export async function previewSequenceEmail(input: {
  sequenceId: string;
  stepPosition: number;
  contactId: string;
  senderName: string;
}) {
  const seq = await getSequenceById(input.sequenceId);
  if (!seq) throw new Error("Sequence not found.");
  const step = seq.steps.find((s) => s.position === input.stepPosition);
  if (!step || step.type !== "EMAIL") throw new Error("Email step not found.");

  const contact = await prisma.crmContact.findUniqueOrThrow({
    where: { id: input.contactId },
    include: { company: true },
  });

  const { renderOutreachEmail } = await import("@/lib/crm/outreach/personalization");
  const rendered = renderOutreachEmail({
    subject: step.subject ?? "",
    body: step.body ?? "",
    contact,
    senderName: input.senderName,
  });

  if (rendered.hasUnresolved) {
    throw new Error("Template contains unresolved variables for this contact.");
  }

  return {
    to: contact.email,
    subject: rendered.subject,
    body: rendered.body,
  };
}
