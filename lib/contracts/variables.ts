import { siteConfig } from "@/lib/site";
import { contactDisplayName } from "@/lib/crm/normalize";

export type ContractVariableDefinition = {
  key: string;
  label: string;
  required?: boolean;
};

export const CONTRACT_VARIABLE_DEFINITIONS: ContractVariableDefinition[] = [
  { key: "client_company_name", label: "Client company name" },
  { key: "client_contact_name", label: "Client contact name", required: true },
  { key: "client_contact_email", label: "Client contact email", required: true },
  { key: "proposal_number", label: "Proposal number" },
  { key: "proposal_title", label: "Proposal title" },
  { key: "accepted_total", label: "Accepted total", required: true },
  { key: "currency", label: "Currency", required: true },
  { key: "accepted_date", label: "Accepted date" },
  { key: "scope_summary", label: "Scope summary" },
  { key: "deliverables_summary", label: "Deliverables summary" },
  { key: "project_number", label: "Project number" },
  { key: "project_name", label: "Project name" },
  { key: "agency_name", label: "Agency name", required: true },
  { key: "agency_email", label: "Agency email", required: true },
  { key: "contract_date", label: "Contract date", required: true },
  { key: "contract_expiry_date", label: "Contract expiry date" },
];

const VARIABLE_PATTERN = /\{\{\s*([a-z0-9_]+)\s*\}\}/gi;

export function extractVariableKeys(content: string) {
  const keys = new Set<string>();
  for (const match of content.matchAll(VARIABLE_PATTERN)) {
    keys.add(match[1]);
  }
  return [...keys];
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function mergeContractVariables(
  template: string,
  values: Record<string, string>,
) {
  return template.replace(VARIABLE_PATTERN, (_, key: string) => {
    const value = values[key];
    return value != null ? escapeHtml(value) : `{{${key}}}`;
  });
}

export type ContractVariableSource = {
  contact?: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    email?: string | null;
  } | null;
  company?: { name?: string | null } | null;
  proposal?: { proposalNumber?: string; title?: string } | null;
  acceptance?: {
    acceptedAt?: Date;
    acceptedTotal?: unknown;
    currency?: string;
    scopeHash?: string | null;
  } | null;
  acceptedVersion?: {
    scopeSummary?: string | null;
    deliverables?: Array<{ title: string; quantity: number }>;
  } | null;
  project?: { projectNumber?: string; name?: string } | null;
  contractDate?: Date;
  contractExpiryDate?: Date | null;
};

export function buildContractVariableValues(source: ContractVariableSource) {
  const deliverables =
    source.acceptedVersion?.deliverables
      ?.map((d) => `${d.title}${d.quantity > 1 ? ` × ${d.quantity}` : ""}`)
      .join(", ") ?? "";

  const values: Record<string, string> = {
    client_company_name: source.company?.name?.trim() || "",
    client_contact_name: source.contact ? contactDisplayName(source.contact) : "",
    client_contact_email: source.contact?.email?.trim() || "",
    proposal_number: source.proposal?.proposalNumber ?? "",
    proposal_title: source.proposal?.title ?? "",
    accepted_total:
      source.acceptance?.acceptedTotal != null
        ? Number(source.acceptance.acceptedTotal).toFixed(2)
        : "",
    currency: source.acceptance?.currency ?? "USD",
    accepted_date: source.acceptance?.acceptedAt
      ? source.acceptance.acceptedAt.toISOString().slice(0, 10)
      : "",
    scope_summary: source.acceptedVersion?.scopeSummary?.trim() || "",
    deliverables_summary: deliverables,
    project_number: source.project?.projectNumber ?? "",
    project_name: source.project?.name ?? "",
    agency_name: siteConfig.legalName || siteConfig.name,
    agency_email: siteConfig.email,
    contract_date: (source.contractDate ?? new Date()).toISOString().slice(0, 10),
    contract_expiry_date: source.contractExpiryDate
      ? source.contractExpiryDate.toISOString().slice(0, 10)
      : "",
  };

  return values;
}

export function findUnresolvedRequiredVariables(input: {
  content: string;
  values: Record<string, string>;
}) {
  const keys = extractVariableKeys(input.content);
  const unresolved: string[] = [];
  for (const key of keys) {
    const def = CONTRACT_VARIABLE_DEFINITIONS.find((d) => d.key === key);
    if (!def?.required) continue;
    if (!input.values[key]?.trim()) {
      unresolved.push(def.label);
    }
  }
  return unresolved;
}
