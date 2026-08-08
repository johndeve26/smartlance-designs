/**
 * AI Content Assistants — public barrel (Phase A).
 */

export { getContentAssistant, listContentAssistants, getAssistantActions } from "@/lib/ai/content-assistants/registry";
export {
  createContentProposal,
  applyProposalDecisions,
  rejectProposal,
  getProposal,
  listPendingProposals,
  refreshProposalStaleness,
  proposalFields,
} from "@/lib/ai/content-assistants/proposals";
export type { FieldDecision } from "@/lib/ai/content-assistants/proposals";
export {
  assertCanUseContentAssistant,
  canUseContentAssistant,
} from "@/lib/ai/content-assistants/security";
export type {
  ContentAssistantEntityType,
  ProposalPayload,
  ProposedFieldChange,
} from "@/lib/ai/content-assistants/types";
