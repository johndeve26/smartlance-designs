import type {
  AgencyClientRequirement,
  AgencyOnboardingQuestion,
  AgencyOnboardingResponse,
} from "@prisma/client";
import { REQUIREMENT_COMPLETE_STATUSES } from "@/lib/onboarding/constants";
import { isQuestionAnswered, isResponseCompleteForProgress } from "@/lib/onboarding/responses";

export type OnboardingProgress = {
  requiredQuestionsTotal: number;
  requiredQuestionsAnswered: number;
  requiredQuestionsComplete: number;
  requiredRequirementsTotal: number;
  requiredRequirementsComplete: number;
  clarificationsOutstanding: number;
  overdueRequirements: number;
  percentComplete: number;
};

export function computeOnboardingProgress(input: {
  questions: AgencyOnboardingQuestion[];
  responses: AgencyOnboardingResponse[];
  requirements: AgencyClientRequirement[];
  fileCountsByQuestionId: Map<string, number>;
  now?: Date;
}): OnboardingProgress {
  const now = input.now ?? new Date();
  const responseByQuestion = new Map(input.responses.map((r) => [r.questionId, r]));

  const requiredQuestions = input.questions.filter((q) => q.required && q.clientVisible);
  let requiredQuestionsAnswered = 0;
  let requiredQuestionsComplete = 0;

  for (const q of requiredQuestions) {
    const response = responseByQuestion.get(q.id);
    const fileCount = input.fileCountsByQuestionId.get(q.id) ?? 0;
    const answered = isQuestionAnswered({
      question: q,
      valueText: response?.valueText,
      valueJson: response?.valueJson,
      fileCount,
    });
    if (answered) requiredQuestionsAnswered++;
    if (
      isResponseCompleteForProgress({
        question: q,
        valueText: response?.valueText,
        valueJson: response?.valueJson,
        fileCount,
        reviewStatus: response?.reviewStatus,
      })
    ) {
      requiredQuestionsComplete++;
    }
  }

  const requiredRequirements = input.requirements.filter((r) => r.required && r.clientVisible);
  let requiredRequirementsComplete = 0;
  let clarificationsOutstanding = 0;
  let overdueRequirements = 0;

  for (const r of input.requirements) {
    if (r.status === "NEEDS_CLARIFICATION") clarificationsOutstanding++;
    if (
      r.required &&
      r.dueDate &&
      r.dueDate < now &&
      !REQUIREMENT_COMPLETE_STATUSES.includes(r.status as (typeof REQUIREMENT_COMPLETE_STATUSES)[number])
    ) {
      overdueRequirements++;
    }
  }

  for (const r of requiredRequirements) {
    if (REQUIREMENT_COMPLETE_STATUSES.includes(r.status as (typeof REQUIREMENT_COMPLETE_STATUSES)[number])) {
      requiredRequirementsComplete++;
    }
  }

  const requiredTotal = requiredQuestions.length + requiredRequirements.length;
  const completeTotal = requiredQuestionsComplete + requiredRequirementsComplete;
  const percentComplete =
    requiredTotal === 0 ? 100 : Math.round((completeTotal / requiredTotal) * 100);

  return {
    requiredQuestionsTotal: requiredQuestions.length,
    requiredQuestionsAnswered,
    requiredQuestionsComplete,
    requiredRequirementsTotal: requiredRequirements.length,
    requiredRequirementsComplete,
    clarificationsOutstanding,
    overdueRequirements,
    percentComplete,
  };
}

export function isEligibleToComplete(progress: OnboardingProgress): boolean {
  return (
    progress.requiredQuestionsComplete === progress.requiredQuestionsTotal &&
    progress.requiredRequirementsComplete === progress.requiredRequirementsTotal &&
    progress.clarificationsOutstanding === 0
  );
}

export function hasOutstandingClientWork(input: {
  questions: AgencyOnboardingQuestion[];
  responses: AgencyOnboardingResponse[];
  requirements: AgencyClientRequirement[];
  fileCountsByQuestionId: Map<string, number>;
}): boolean {
  const responseByQuestion = new Map(input.responses.map((r) => [r.questionId, r]));

  for (const q of input.questions) {
    if (!q.required || !q.clientVisible) continue;
    const response = responseByQuestion.get(q.id);
    const fileCount = input.fileCountsByQuestionId.get(q.id) ?? 0;
    if (
      !isQuestionAnswered({
        question: q,
        valueText: response?.valueText,
        valueJson: response?.valueJson,
        fileCount,
      })
    ) {
      return true;
    }
    if (response?.reviewStatus === "NEEDS_CLARIFICATION") return true;
  }

  for (const r of input.requirements) {
    if (!r.required || !r.clientVisible) continue;
    if (["REQUESTED", "NEEDS_CLARIFICATION"].includes(r.status)) return true;
  }

  return false;
}

export function hasPendingReview(input: {
  responses: AgencyOnboardingResponse[];
  requirements: AgencyClientRequirement[];
}): boolean {
  if (input.responses.some((r) => r.reviewStatus === "PENDING")) return true;
  return input.requirements.some((r) =>
    ["SUBMITTED", "UNDER_REVIEW", "RECEIVED"].includes(r.status),
  );
}
