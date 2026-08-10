const ALLOWED_VARS = [
  "firstName",
  "lastName",
  "displayName",
  "companyName",
  "senderName",
  "serviceInterest",
] as const;

export function renderOutreachEmail(input: {
  subject: string;
  body: string;
  contact: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    email?: string | null;
    company?: { name: string } | null;
    leads?: Array<{ servicesInterested: string[] }>;
  };
  senderName: string;
  footer?: string | null;
}) {
  const serviceInterest =
    input.contact.leads?.[0]?.servicesInterested?.[0] ?? "";

  const vars: Record<string, string> = {
    firstName: input.contact.firstName?.trim() || "",
    lastName: input.contact.lastName?.trim() || "",
    displayName:
      input.contact.displayName?.trim() ||
      [input.contact.firstName, input.contact.lastName].filter(Boolean).join(" ") ||
      "there",
    companyName: input.contact.company?.name?.trim() || "your company",
    senderName: input.senderName,
    serviceInterest,
  };

  let hasUnresolved = false;
  const replace = (text: string) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      if (!ALLOWED_VARS.includes(key as (typeof ALLOWED_VARS)[number])) {
        hasUnresolved = true;
        return "";
      }
      const val = vars[key];
      if (!val) {
        if (key === "firstName" || key === "displayName") {
          return vars.displayName || "there";
        }
        if (key === "companyName") return "your company";
        return "";
      }
      return val;
    });

  let body = replace(input.body);
  if (input.footer?.trim()) {
    body = `${body}\n\n---\n${input.footer.trim()}`;
  }

  const subject = replace(input.subject);

  if (/\{\{\w+\}\}/.test(subject) || /\{\{\w+\}\}/.test(body)) {
    hasUnresolved = true;
  }

  return { subject, body, hasUnresolved };
}

export { ALLOWED_VARS };
