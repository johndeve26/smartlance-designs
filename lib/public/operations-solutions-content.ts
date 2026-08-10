export type OperationsSolutionContent = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  heroStatement: string;
  heroSupporting: string;
  whyItHappens: string[];
  betterProcess: string[];
  approach: string;
  capabilities: Array<{ label: string; href: string }>;
  ctaTitle: string;
};

export const operationsSolutions: Record<string, OperationsSolutionContent> = {
  "respond-to-leads-faster": {
    slug: "respond-to-leads-faster",
    title: "Respond to Leads Faster",
    metaTitle: "Respond to Leads Faster",
    metaDescription:
      "When enquiries sit too long before follow-up, interest cools. Smartlance helps businesses capture, route and respond to leads consistently.",
    heroStatement: "Speed matters — but consistency matters more",
    heroSupporting:
      "Leads often arrive successfully. The problem is what happens next: delayed response, unclear ownership and follow-up that depends on memory.",
    whyItHappens: [
      "Enquiries land in a shared inbox with no assignment rules",
      "CRM entry happens manually and inconsistently",
      "No alert when a high-intent lead arrives",
      "Staff are busy with delivery work when enquiries come in",
      "Different channels (form, email, phone) are handled differently",
    ],
    betterProcess: [
      "Capture leads in one structured flow with validation",
      "Assign ownership automatically based on rules you define",
      "Notify the right person immediately",
      "Create a follow-up task with context attached",
      "Track whether first response happened within your target window",
    ],
    approach:
      "Smartlance combines website conversion improvements with CRM and lead automation — so the enquiry path and the response path are designed together.",
    capabilities: [
      { label: "CRM & Lead Automation", href: "/ai-automation/crm-lead-automation" },
      { label: "Workflow Automation", href: "/ai-automation/workflow-automation" },
      { label: "Conversion optimization", href: "/services/conversion-rate-optimization" },
    ],
    ctaTitle: "Leads arriving but response is too slow?",
  },
  "automate-repetitive-work": {
    slug: "automate-repetitive-work",
    title: "Automate Repetitive Work",
    metaTitle: "Automate Repetitive Manual Work",
    metaDescription:
      "Reduce manual copying, repeated updates and routine handoffs by connecting the tools your team already uses.",
    heroStatement: "Your team should not be the integration layer",
    heroSupporting:
      "When people copy data between systems, send the same updates, or chase the same checklist every week, that time is not available for higher-value work.",
    whyItHappens: [
      "Tools were added over time without a connected workflow",
      "No one mapped the full process end to end",
      "Automation felt risky without clear rules and fallbacks",
      "Off-the-shelf software almost fits — but not quite",
      "Manual work became 'how we have always done it'",
    ],
    betterProcess: [
      "Map the repetitive steps and decision points",
      "Define triggers, rules, exceptions and human review",
      "Connect source and destination systems reliably",
      "Test edge cases before launch",
      "Improve the workflow based on real usage",
    ],
    approach:
      "Smartlance uses workflow automation and integrations first — adding AI only where language or unstructured input genuinely helps.",
    capabilities: [
      { label: "Workflow Automation", href: "/ai-automation/workflow-automation" },
      { label: "Integrations", href: "/ai-automation/integrations" },
      { label: "Custom AI Tools", href: "/ai-automation/custom-ai-tools" },
    ],
    ctaTitle: "Spending too much time on repetitive manual work?",
  },
  "stop-leads-falling-through-the-cracks": {
    slug: "stop-leads-falling-through-the-cracks",
    title: "Stop Leads Falling Through the Cracks",
    metaTitle: "Stop Leads Falling Through the Cracks",
    metaDescription:
      "Website and inbound leads should not disappear into inboxes. Build consistent capture, assignment and follow-up.",
    heroStatement: "Interest arrives — then nothing consistent happens",
    heroSupporting:
      "Forms submit, emails arrive and calls get noted — but without a defined process, good opportunities are easy to lose.",
    whyItHappens: [
      "No single place tracks all inbound sources",
      "Duplicate records make it unclear who already contacted whom",
      "Follow-up depends on individual staff habits",
      "Low-intent and high-intent enquiries are treated the same",
      "Reporting on lead outcomes is incomplete or absent",
    ],
    betterProcess: [
      "Unify capture from website forms and other sources",
      "Validate and deduplicate before CRM entry",
      "Qualify and route based on business rules",
      "Assign owners and create follow-up tasks automatically",
      "Review pipeline stages so gaps are visible",
    ],
    approach:
      "This is usually a combination of website enquiry design, CRM discipline and automation — not a single plugin.",
    capabilities: [
      { label: "CRM & Lead Automation", href: "/ai-automation/crm-lead-automation" },
      { label: "Website not generating leads", href: "/solutions/website-not-generating-leads" },
      { label: "Website design", href: "/services/website-design" },
    ],
    ctaTitle: "Losing track of inbound enquiries?",
  },
  "automate-customer-enquiries": {
    slug: "automate-customer-enquiries",
    title: "Automate Customer Enquiries",
    metaTitle: "Automate Customer Enquiry Handling",
    metaDescription:
      "Handle common customer questions faster with approved answers, structured capture and escalation to your team when needed.",
    heroStatement: "Common questions should not consume all your team's time",
    heroSupporting:
      "Customers ask similar questions repeatedly. The goal is to answer approved topics quickly while routing complex cases to people.",
    whyItHappens: [
      "Enquiries arrive across chat, email, forms and phone",
      "Answers live in different documents and people's heads",
      "Staff re-type the same responses manually",
      "No clear boundary between self-service and human support",
      "After-hours enquiries wait until the next working day",
    ],
    betterProcess: [
      "Define approved answers and escalation boundaries",
      "Use AI agents or structured flows for repeatable enquiries",
      "Capture structured request data for complex cases",
      "Route to the right queue with context attached",
      "Review conversations to improve approved content over time",
    ],
    approach:
      "Smartlance focuses on practical enquiry automation with guardrails — not open-ended bots that invent answers.",
    capabilities: [
      { label: "AI Agents", href: "/ai-automation/ai-agents" },
      { label: "Voice AI", href: "/ai-automation/voice-ai" },
      { label: "Workflow Automation", href: "/ai-automation/workflow-automation" },
    ],
    ctaTitle: "Customer enquiries taking too much staff time?",
  },
  "connect-business-tools": {
    slug: "connect-business-tools",
    title: "Connect Business Tools",
    metaTitle: "Connect Business Tools & Systems",
    metaDescription:
      "When CRM, website, email, spreadsheets and operations tools do not share information, manual work multiplies. Smartlance connects systems into practical workflows.",
    heroStatement: "Information exists — but not in the right place at the right time",
    heroSupporting:
      "Disconnected tools force staff to copy data, chase updates and reconcile conflicting records.",
    whyItHappens: [
      "Systems were adopted for one job without integration planning",
      "APIs and webhooks were never configured",
      "Teams built spreadsheet workarounds instead",
      "Ownership of data sync is unclear",
      "Previous integration attempts broke silently",
    ],
    betterProcess: [
      "Map which systems should exchange which data",
      "Define failure behaviour and duplicate handling",
      "Build integrations with logging and alerts",
      "Test realistic edge cases before launch",
      "Document sync rules for ongoing maintenance",
    ],
    approach:
      "Integrations are planned as business workflows — not as a list of logos on a slide.",
    capabilities: [
      { label: "Integrations", href: "/ai-automation/integrations" },
      { label: "Platforms hub", href: "/platforms" },
      { label: "Workflow Automation", href: "/ai-automation/workflow-automation" },
    ],
    ctaTitle: "Tools that should talk to each other but do not?",
  },
  "centralize-business-knowledge": {
    slug: "centralize-business-knowledge",
    title: "Centralize Business Knowledge",
    metaTitle: "Centralize Business Knowledge",
    metaDescription:
      "When answers live in email threads, documents and individual memory, staff waste time searching. Structure knowledge for staff and approved customer assistance.",
    heroStatement: "Your team keeps answering the same internal questions",
    heroSupporting:
      "Policies, product detail, pricing rules and procedures are scattered — so every enquiry starts from scratch.",
    whyItHappens: [
      "Documentation is outdated or hard to find",
      "Knowledge lives in chat history and individual inboxes",
      "New staff take longer to onboard than necessary",
      "Customer-facing teams give inconsistent answers",
      "No clear owner keeps information current",
    ],
    betterProcess: [
      "Identify the knowledge domains that cause the most friction",
      "Structure approved content for staff search and reference",
      "Use internal assistants with access controls where helpful",
      "Define review cycles so content stays accurate",
      "Connect knowledge tools to enquiry and support workflows",
    ],
    approach:
      "Smartlance can help with internal knowledge interfaces and AI-assisted search — always bounded by approved sources and access rules.",
    capabilities: [
      { label: "AI Agents", href: "/ai-automation/ai-agents" },
      { label: "Custom AI Tools", href: "/ai-automation/custom-ai-tools" },
      { label: "Integrations", href: "/ai-automation/integrations" },
    ],
    ctaTitle: "Staff spending too long finding the right answer?",
  },
};

export function getOperationsSolution(slug: string) {
  return operationsSolutions[slug] ?? null;
}

export const operationsSolutionSlugs = Object.keys(operationsSolutions);
