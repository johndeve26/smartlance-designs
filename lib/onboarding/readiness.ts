import { prisma } from "@/lib/db";
import { ACTIVE_ONBOARDING_STATUSES } from "@/lib/onboarding/constants";
import { getActiveProjectOnboarding, loadProgressContext } from "@/lib/onboarding/onboarding";

export type ReadinessGate = {
  key: string;
  label: string;
  state: "complete" | "incomplete" | "not_required";
  detail?: string;
};

export type ProjectReadiness = {
  gates: ReadinessGate[];
  overall: "ready" | "not_ready";
};

export async function getProjectDeliveryReadiness(projectId: string): Promise<ProjectReadiness> {
  const project = await prisma.agencyProject.findUniqueOrThrow({
    where: { id: projectId },
    select: {
      requireOnboarding: true,
      requireSignedContract: true,
      requireDeposit: true,
      requireInternalKickoff: true,
      internalKickoffCompletedAt: true,
    },
  });

  const gates: ReadinessGate[] = [];

  if (project.requireOnboarding) {
    const active = await getActiveProjectOnboarding(projectId);
    const completed = await prisma.agencyProjectOnboarding.findFirst({
      where: { projectId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
    });
    const onboarding = active ?? completed;
    let state: ReadinessGate["state"] = "incomplete";
    let detail = "Not started";
    if (onboarding?.status === "COMPLETED") {
      state = "complete";
      detail = "Complete";
    } else if (onboarding) {
      const ctx = await loadProgressContext(onboarding.id);
      detail = `${ctx.progress.percentComplete}% complete`;
    }
    gates.push({ key: "onboarding", label: "Client onboarding", state, detail });
  } else {
    gates.push({
      key: "onboarding",
      label: "Client onboarding",
      state: "not_required",
      detail: "Not required",
    });
  }

  const outstandingRequirements = await prisma.agencyClientRequirement.count({
    where: {
      projectId,
      required: true,
      status: { notIn: ["ACCEPTED", "NOT_NEEDED"] },
    },
  });
  gates.push({
    key: "requirements",
    label: "Required client requirements",
    state: outstandingRequirements === 0 ? "complete" : "incomplete",
    detail:
      outstandingRequirements === 0
        ? "Complete"
        : `${outstandingRequirements} outstanding`,
  });

  if (project.requireSignedContract) {
    const signed = await prisma.agencyContract.findFirst({
      where: { projectId, status: "SIGNED" },
      select: { id: true, contractNumber: true },
    });
    gates.push({
      key: "contract",
      label: "Contract",
      state: signed ? "complete" : "incomplete",
      detail: signed ? `Signed (${signed.contractNumber})` : "Not signed",
    });
  } else {
    gates.push({
      key: "contract",
      label: "Contract",
      state: "not_required",
      detail: "Not required",
    });
  }

  if (project.requireDeposit) {
    const depositInstallment = await prisma.agencyBillingInstallment.findFirst({
      where: {
        schedule: { projectId },
        type: "DEPOSIT",
      },
      include: {
        invoice: { select: { status: true, amountPaidMinor: true, totalMinor: true } },
      },
    });
    const depositPaid =
      depositInstallment?.invoice?.status === "PAID" ||
      (depositInstallment?.invoice != null &&
        depositInstallment.invoice.amountPaidMinor >= depositInstallment.invoice.totalMinor &&
        depositInstallment.invoice.totalMinor > 0);
    gates.push({
      key: "deposit",
      label: "Deposit",
      state: depositPaid ? "complete" : "incomplete",
      detail: depositPaid ? "Paid" : "Unpaid",
    });
  } else {
    gates.push({
      key: "deposit",
      label: "Deposit",
      state: "not_required",
      detail: "Not required",
    });
  }

  if (project.requireInternalKickoff) {
    gates.push({
      key: "internal_kickoff",
      label: "Internal kickoff",
      state: project.internalKickoffCompletedAt ? "complete" : "incomplete",
      detail: project.internalKickoffCompletedAt ? "Complete" : "Pending",
    });
  } else {
    gates.push({
      key: "internal_kickoff",
      label: "Internal kickoff",
      state: "not_required",
      detail: "Not required",
    });
  }

  const overall = gates.every(
    (g) => g.state === "complete" || g.state === "not_required",
  )
    ? "ready"
    : "not_ready";

  return { gates, overall };
}

export async function countOnboardingDashboardMetrics() {
  const [active, waitingOnClient, needsReview, overdue] = await Promise.all([
    prisma.agencyProjectOnboarding.count({
      where: { status: { in: ACTIVE_ONBOARDING_STATUSES } },
    }),
    prisma.agencyProjectOnboarding.count({
      where: { status: "WAITING_ON_CLIENT" },
    }),
    prisma.agencyProjectOnboarding.count({
      where: { status: "UNDER_REVIEW" },
    }),
    prisma.agencyProjectOnboarding.count({
      where: {
        status: { in: ACTIVE_ONBOARDING_STATUSES },
        targetCompletionDate: { lt: new Date() },
      },
    }),
  ]);

  return { active, waitingOnClient, needsReview, overdue };
}
