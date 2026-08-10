import { PUBLIC_CTAS } from "@/lib/public/cta-map";
import {
  AI_AUTOMATION_HUB,
  aiAutomationPaths,
  type AiAutomationSlug,
} from "@/lib/public/ai-automation-routes";

export type WorkflowStep = { label: string; note?: string };

export type AiAutomationPageContent = {
  slug: AiAutomationSlug;
  title: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  heroTitle: string;
  heroSupporting: string;
  intro: string;
  sections: Array<{
    id?: string;
    title: string;
    body: string;
    bullets?: string[];
    workflow?: WorkflowStep[];
    callout?: string;
  }>;
  useCases?: Array<{ title: string; description: string }>;
  relatedLinks: Array<{ label: string; href: string }>;
  ctaTitle: string;
  ctaDescription: string;
};

export const aiHubProblems = [
  {
    title: "Leads take too long to follow up",
    description:
      "Enquiries sit in inboxes while response time slips — and interest cools.",
    href: "/solutions/respond-to-leads-faster",
  },
  {
    title: "Your team repeats the same manual tasks",
    description:
      "Copying data, sending the same updates, and chasing the same steps every week.",
    href: "/solutions/automate-repetitive-work",
  },
  {
    title: "Customer enquiries consume too much time",
    description:
      "Staff answer the same questions instead of focusing on higher-value work.",
    href: "/solutions/automate-customer-enquiries",
  },
  {
    title: "Business information is spread across systems",
    description:
      "Answers live in email, documents, CRM notes and people's heads — not one useful place.",
    href: "/solutions/centralize-business-knowledge",
  },
  {
    title: "Website leads disappear into inboxes",
    description:
      "Forms submit successfully, but nothing consistent happens next.",
    href: "/solutions/stop-leads-falling-through-the-cracks",
  },
  {
    title: "Data has to be copied manually between tools",
    description:
      "CRM, spreadsheets, email and operations tools do not share information cleanly.",
    href: "/solutions/connect-business-tools",
  },
];

export const aiHubCapabilities = [
  {
    title: "AI Agents",
    outcome: "Focused assistants for specific workflows — with human handoff where it matters.",
    href: aiAutomationPaths["ai-agents"].path,
  },
  {
    title: "Workflow Automation",
    outcome: "Move information between tools automatically instead of by hand.",
    href: aiAutomationPaths["workflow-automation"].path,
  },
  {
    title: "CRM & Lead Automation",
    outcome: "Capture, qualify, assign and follow up on leads consistently.",
    href: aiAutomationPaths["crm-lead-automation"].path,
  },
  {
    title: "Voice AI",
    outcome: "Handle inbound enquiries, capture requests and route calls professionally.",
    href: aiAutomationPaths["voice-ai"].path,
  },
  {
    title: "Integrations",
    outcome: "Connect websites, CRM, email, messaging and business APIs.",
    href: aiAutomationPaths.integrations.path,
  },
  {
    title: "Custom AI Tools",
    outcome: "Focused internal or customer-facing tools when off-the-shelf software does not fit.",
    href: aiAutomationPaths["custom-ai-tools"].path,
  },
];

export const aiHubApproach = {
  title: "AI where it actually makes sense",
  body: "Smartlance starts with the business problem — not the technology label. We look at the current process, the systems involved, the information available, the risk, and where human review is needed before deciding whether AI, deterministic automation, or a simpler integration is the right answer.",
  notAlways: "Some workflows are better solved with straightforward automation and clear business rules. AI is useful when language, unstructured information or decision support adds real value — not when it adds complexity for its own sake.",
};

export const aiHubPlatformLink = {
  label: "Explore platforms we build with",
  href: "/platforms",
};

export const homepageCapabilityPillars = [
  { label: "Web", href: "/services", description: "Design · Development · Commerce" },
  { label: "Growth", href: "/seo", description: "SEO · Conversion · Marketing" },
  { label: "AI", href: AI_AUTOMATION_HUB, description: "Agents · Assistants · Voice" },
  {
    label: "Automation",
    href: aiAutomationPaths["workflow-automation"].path,
    description: "Workflows · CRM · Integrations",
  },
];

export const homepageAiUseCases = [
  {
    title: "Capture & qualify leads",
    description:
      "Route form submissions into CRM, assign owners, trigger follow-up and reduce leads sitting unanswered.",
    href: aiAutomationPaths["crm-lead-automation"].path,
  },
  {
    title: "Automate repetitive work",
    description:
      "Connect the tools you already use so information moves without manual copying.",
    href: aiAutomationPaths["workflow-automation"].path,
  },
  {
    title: "AI customer assistance",
    description:
      "Help visitors or staff find approved answers faster — with escalation to your team when needed.",
    href: aiAutomationPaths["ai-agents"].path,
  },
  {
    title: "Voice AI for enquiries",
    description:
      "Capture inbound calls, handle approved FAQs and route complex requests to the right person.",
    href: aiAutomationPaths["voice-ai"].path,
  },
  {
    title: "Connect business systems",
    description:
      "Websites, CRM, email, messaging and APIs working as one practical workflow.",
    href: aiAutomationPaths.integrations.path,
  },
];

const sharedRelated = [
  { label: "AI & Automation overview", href: AI_AUTOMATION_HUB },
  { label: PUBLIC_CTAS.howWeWork.label, href: PUBLIC_CTAS.howWeWork.href },
  { label: PUBLIC_CTAS.project.label, href: PUBLIC_CTAS.project.href },
];

export const aiAutomationPages: Record<AiAutomationSlug, AiAutomationPageContent> = {
  "ai-agents": {
    slug: "ai-agents",
    title: "AI Agents",
    metaTitle: "AI Agents for Business Workflows",
    metaDescription:
      "Focused AI agents for customer enquiry handling, lead qualification, internal knowledge and operations — with approved information, access controls and human handoff.",
    eyebrow: "AI & Automation",
    heroTitle: "AI agents built for specific business workflows",
    heroSupporting:
      "Task-focused assistants that use approved business information, connect to your tools and hand off to people when the situation needs it.",
    intro:
      "An AI agent is not a generic chatbot pasted onto a website. It is a focused system designed for a defined job — answering approved questions, helping qualify a lead, surfacing internal knowledge or supporting a repeatable operational step.",
    sections: [
      {
        id: "what-agents-do",
        title: "What AI agents can help with",
        body: "Agents work best when the scope is clear and the information they can use is controlled.",
        bullets: [
          "Customer enquiry assistance using approved answers and escalation paths",
          "Lead qualification based on structured questions and business rules",
          "Internal knowledge assistance for staff searching policies, procedures or product detail",
          "Sales support that prepares context before a human conversation",
          "Operations assistance for repeatable internal requests",
        ],
      },
      {
        id: "information-control",
        title: "Approved information and control",
        body: "Mature implementations define what the agent may access, what it may say, and when a person must take over.",
        bullets: [
          "Approved content sources — not the open internet as a default",
          "Business rules for routing, qualification and next steps",
          "Access controls where internal or customer data is involved",
          "Human escalation for exceptions, complaints or high-value enquiries",
          "Logging and review where appropriate for quality and accountability",
        ],
        callout:
          "Smartlance does not position agents as fully autonomous replacements for your team. They are practical workflow tools with guardrails.",
      },
      {
        id: "connections",
        title: "What agents can connect to",
        body: "Useful agents usually sit inside a wider workflow — not in isolation.",
        bullets: [
          "Website forms and enquiry flows",
          "CRM records and pipeline stages",
          "Email or messaging handoff",
          "Internal documentation and knowledge bases",
          "Task creation and assignment in business tools",
        ],
      },
    ],
    useCases: [
      {
        title: "Customer enquiry assistant",
        description:
          "Help visitors find approved answers and route complex questions to your team.",
      },
      {
        title: "Internal knowledge assistant",
        description:
          "Help staff locate procedures, product detail or operational answers faster.",
      },
      {
        title: "Lead qualification assistant",
        description:
          "Ask structured questions and pass qualified context to sales or operations.",
      },
      {
        title: "Sales support assistant",
        description:
          "Prepare briefing context before a human follow-up — not replace it.",
      },
      {
        title: "Operations assistant",
        description:
          "Handle repeatable internal requests with clear escalation when needed.",
      },
    ],
    relatedLinks: [
      { label: "CRM & Lead Automation", href: aiAutomationPaths["crm-lead-automation"].path },
      { label: "Integrations", href: aiAutomationPaths.integrations.path },
      { label: "See AI work", href: "/work?capability=ai" },
      ...sharedRelated,
    ],
    ctaTitle: "Planning an AI agent workflow?",
    ctaDescription: "Tell us what the agent should help with, what systems are involved and where human review is required.",
  },
  "workflow-automation": {
    slug: "workflow-automation",
    title: "Workflow Automation",
    metaTitle: "Workflow Automation for Business Systems",
    metaDescription:
      "Stop moving information manually between tools. Smartlance maps repetitive processes, connects systems and adds AI only where it adds value.",
    eyebrow: "AI & Automation",
    heroTitle: "Stop moving information manually between tools",
    heroSupporting:
      "Map repetitive processes, connect the systems you already use and automate the steps that do not need a person every time.",
    intro:
      "Workflow automation is about reliable movement of information and actions across your business tools — with clear rules, error handling and human intervention where exceptions matter.",
    sections: [
      {
        id: "discovery",
        title: "How Smartlance approaches workflow automation",
        body: "We start by understanding the process as it works today — not by picking a platform first.",
        bullets: [
          "Identify repetitive steps and manual handoffs",
          "Map triggers, decisions, exceptions and approvals",
          "Choose integrations and automation patterns that fit the risk level",
          "Add AI only where language or unstructured input genuinely helps",
          "Test edge cases before launch and improve from real use",
        ],
      },
      {
        id: "form-to-followup",
        title: "Example: website form to follow-up",
        body: "Illustrative workflow — not a claim about a specific client deployment unless shown in our work.",
        workflow: [
          { label: "Website form submitted", note: "Trigger" },
          { label: "Validate & normalize", note: "Rules" },
          { label: "Create or update CRM record", note: "Integration" },
          { label: "Assign owner", note: "Routing" },
          { label: "Notify team", note: "Alert" },
          { label: "Schedule follow-up", note: "Task" },
        ],
      },
      {
        id: "lead-qualification",
        title: "Example: lead qualification flow",
        body: "A structured path from first contact to the right next action.",
        workflow: [
          { label: "Lead arrives", note: "Source" },
          { label: "Qualification rules", note: "Decision" },
          { label: "CRM stage update", note: "Pipeline" },
          { label: "Task created", note: "Action" },
          { label: "Follow-up email", note: "Communication" },
        ],
      },
      {
        id: "payment-event",
        title: "Example: payment or booking event",
        body: "Operational workflows often start with an event in one system that should trigger work elsewhere.",
        workflow: [
          { label: "Payment / booking event", note: "Trigger" },
          { label: "Record in business system", note: "Data" },
          { label: "Notification", note: "Alert" },
          { label: "Follow-up workflow", note: "Operations" },
        ],
      },
      {
        id: "python",
        title: "Custom automation where needed",
        body: "Some workflows need focused scripts or services — for example data processing, file handling or bespoke API logic. Smartlance uses practical engineering (including Python where appropriate) without turning public projects into developer documentation.",
      },
    ],
    relatedLinks: [
      { label: "CRM & Lead Automation", href: aiAutomationPaths["crm-lead-automation"].path },
      { label: "Integrations", href: aiAutomationPaths.integrations.path },
      { label: "Automate repetitive work", href: "/solutions/automate-repetitive-work" },
      ...sharedRelated,
    ],
    ctaTitle: "Want to automate a repetitive process?",
    ctaDescription: "Describe the workflow, the tools involved and what currently happens manually.",
  },
  "voice-ai": {
    slug: "voice-ai",
    title: "Voice AI",
    metaTitle: "Voice AI for Business Enquiries",
    metaDescription:
      "Professional voice AI for inbound enquiries, approved FAQ handling, lead capture, call routing and structured post-call follow-up — with human escalation.",
    eyebrow: "AI & Automation",
    heroTitle: "Voice systems that handle enquiries professionally",
    heroSupporting:
      "Capture inbound calls, answer approved questions, qualify requests and route complex conversations to your team.",
    intro:
      "Voice AI can reduce friction for callers when the scope is defined carefully — what may be answered automatically, what must escalate, and how information is recorded for follow-up.",
    sections: [
      {
        id: "use-cases",
        title: "Where voice AI can help",
        body: "Useful deployments focus on structured enquiry handling — not pretending to replace every human conversation.",
        bullets: [
          "Inbound enquiry handling with approved FAQ responses",
          "Lead qualification and request capture",
          "Call routing to the right person or queue",
          "Structured post-call data for CRM or follow-up workflows",
          "After-hours capture when staff are unavailable",
        ],
      },
      {
        id: "handoff",
        title: "Human escalation and fallback",
        body: "Professional voice workflows define clear boundaries.",
        bullets: [
          "Escalation paths for complex, sensitive or high-value calls",
          "Fallback when the caller needs a person or the system is uncertain",
          "Approved information boundaries — not open-ended improvisation",
          "Structured handoff notes so staff have context quickly",
        ],
        callout:
          "Smartlance does not claim perfect human replacement, unlimited conversations or guaranteed accuracy. Voice AI is implemented with realistic scope and review.",
      },
      {
        id: "workflow",
        title: "Typical call workflow",
        body: "A structured path from inbound call to follow-up — with escalation where the situation requires a person.",
        workflow: [
          { label: "Inbound call", note: "Trigger" },
          { label: "Intent detection", note: "Scope" },
          { label: "Approved response or capture", note: "Handling" },
          { label: "Escalate if needed", note: "Human" },
          { label: "Structured record", note: "CRM / task" },
          { label: "Follow-up trigger", note: "Automation" },
        ],
      },
    ],
    relatedLinks: [
      { label: "AI Agents", href: aiAutomationPaths["ai-agents"].path },
      { label: "CRM & Lead Automation", href: aiAutomationPaths["crm-lead-automation"].path },
      ...sharedRelated,
    ],
    ctaTitle: "Exploring voice AI for enquiries?",
    ctaDescription: "Tell us about your call volume, common questions and how calls should route today.",
  },
  integrations: {
    slug: "integrations",
    title: "Integrations",
    metaTitle: "Business System Integrations",
    metaDescription:
      "Connect websites, forms, CRM, email, messaging, payment systems and business APIs so information flows reliably between the tools you use.",
    eyebrow: "AI & Automation",
    heroTitle: "Your tools should work together",
    heroSupporting:
      "Connect websites, CRM, email, messaging, payment systems and business APIs into practical workflows — with or without AI.",
    intro:
      "Most operational problems are integration problems in disguise. Information exists, but it lives in the wrong place, arrives too late, or requires someone to copy it manually.",
    sections: [
      {
        id: "areas",
        title: "Integration areas we commonly work with",
        body: "Smartlance integrates systems we can support responsibly in client projects — not every product on the market.",
        bullets: [
          "Websites and form submissions",
          "CRM and pipeline tools",
          "Email and transactional messaging",
          "Payment and booking events",
          "Business APIs and webhooks",
          "AI model providers where language or classification adds value",
          "Automation platforms and custom middleware",
        ],
      },
      {
        id: "approach",
        title: "How integrations are planned",
        body: "Good integrations define ownership, failure behaviour and what happens when data is missing or malformed.",
        bullets: [
          "Map source systems, destination systems and required fields",
          "Define idempotency and duplicate handling",
          "Plan error alerts and manual recovery paths",
          "Test with realistic edge cases before launch",
          "Document what syncs, how often and who owns maintenance",
        ],
      },
      {
        id: "platforms",
        title: "Platforms and systems",
        body: "Explore the platforms Smartlance builds with and connects — from website stacks to CRM and business systems.",
      },
    ],
    relatedLinks: [
      { label: "Platforms hub", href: "/platforms" },
      { label: "Connect business tools", href: "/solutions/connect-business-tools" },
      { label: "Workflow Automation", href: aiAutomationPaths["workflow-automation"].path },
      ...sharedRelated,
    ],
    ctaTitle: "Need systems connected?",
    ctaDescription: "Share the tools involved and what should happen when information moves between them.",
  },
  "crm-lead-automation": {
    slug: "crm-lead-automation",
    title: "CRM & Lead Automation",
    metaTitle: "CRM & Lead Automation",
    metaDescription:
      "Capture, qualify, assign and follow up on leads consistently — from website forms and other sources into CRM with clear ownership and next steps.",
    eyebrow: "AI & Automation",
    heroTitle: "Leads should not disappear after they arrive",
    heroSupporting:
      "Capture enquiries from your website and other sources, qualify them, assign owners and trigger consistent follow-up inside CRM.",
    intro:
      "Many businesses generate interest but lose it in the gap between enquiry and response. CRM and lead automation closes that gap with structured routing, assignment and follow-up — not more inbox chaos.",
    sections: [
      {
        id: "problems",
        title: "Common lead handling problems",
        body: "These patterns show up across service businesses, e-commerce enquiries and B2B sales teams.",
        bullets: [
          "Leads arrive in multiple places — forms, email, phone, marketplaces",
          "Response is slow because no one owns the next step",
          "CRM entry is manual and inconsistent",
          "Duplicate contacts are created for the same person",
          "No clear assignment rules by territory, service or priority",
          "Follow-up depends on individual memory instead of process",
        ],
      },
      {
        id: "workflow",
        title: "Illustrative lead automation workflow",
        body: "Example flow — enrichment only where you have legitimate data sources available.",
        workflow: [
          { label: "Website / form / source", note: "Capture" },
          { label: "Validation", note: "Quality" },
          { label: "Qualification rules", note: "Decision" },
          { label: "CRM record", note: "System of record" },
          { label: "Assignment", note: "Ownership" },
          { label: "Notification", note: "Alert" },
          { label: "Follow-up task", note: "Action" },
        ],
      },
      {
        id: "cross-links",
        title: "Often connected capabilities",
        body: "Lead automation rarely stands alone. It works best alongside conversion-focused website work and reliable integrations.",
        bullets: [
          "Conversion rate optimization for forms and enquiry paths",
          "Website design and development for clearer offers and CTAs",
          "CRM and business platforms such as HubSpot or Salesforce",
          "Problem-led solutions for lead generation and conversion",
        ],
      },
    ],
    relatedLinks: [
      { label: "Respond to leads faster", href: "/solutions/respond-to-leads-faster" },
      { label: "Stop leads falling through", href: "/solutions/stop-leads-falling-through-the-cracks" },
      { label: "Conversion optimization", href: "/services/conversion-rate-optimization" },
      { label: "Website design", href: "/services/website-design" },
      ...sharedRelated,
    ],
    ctaTitle: "Leads arriving but follow-up is inconsistent?",
    ctaDescription: "Tell us where leads come from today and what should happen in the first hour after an enquiry.",
  },
  "custom-ai-tools": {
    slug: "custom-ai-tools",
    title: "Custom AI Tools",
    metaTitle: "Custom AI Tools & Focused Software",
    metaDescription:
      "Focused internal tools, customer utilities and AI-assisted workflows when off-the-shelf software does not fit your process.",
    eyebrow: "AI & Automation",
    heroTitle: "Focused tools when off-the-shelf software does not fit",
    heroSupporting:
      "Custom internal tools, customer-facing utilities and AI-assisted workflows built around how your business actually operates.",
    intro:
      "Not every problem needs a giant platform subscription. Sometimes the right answer is a focused tool — a internal workflow app, a data-processing utility, a business knowledge interface or a customer-facing assistant tied to your rules and data.",
    sections: [
      {
        id: "examples",
        title: "What custom tools can look like",
        body: "Examples of capability — not a promise that every idea should become a product.",
        bullets: [
          "Internal workflow tool for a repeatable operations process",
          "Data-processing utility that prepares information for business systems",
          "Business knowledge interface for staff or approved customers",
          "Custom operations dashboard combining data from multiple sources",
          "AI-assisted task workflow with human review built in",
          "Focused customer utility that supports one clear job well",
        ],
      },
      {
        id: "when-ai",
        title: "When AI belongs in the tool",
        body: "AI is added when it improves the workflow — not because the tool needs a buzzword.",
        bullets: [
          "Summarizing or structuring unstructured input",
          "Assisting with drafting against approved templates",
          "Classification or routing based on message content",
          "Search across approved internal knowledge",
        ],
        callout:
          "Smartlance does not promise that every tool should use AI. Many focused tools are better with clear forms, rules and integrations alone.",
      },
      {
        id: "engineering",
        title: "Practical engineering",
        body: "Custom tools may combine web interfaces, APIs, automation platforms and focused backend logic — including Python scripts or services where that is the sensible implementation choice.",
      },
    ],
    relatedLinks: [
      { label: "AI Agents", href: aiAutomationPaths["ai-agents"].path },
      { label: "Workflow Automation", href: aiAutomationPaths["workflow-automation"].path },
      { label: "See AI work", href: "/work?capability=ai" },
      ...sharedRelated,
    ],
    ctaTitle: "Need a focused tool built around your process?",
    ctaDescription: "Describe the workflow, who uses it and what off-the-shelf options have already fallen short.",
  },
};

export function getAiAutomationPage(slug: string) {
  if (!(slug in aiAutomationPages)) return null;
  return aiAutomationPages[slug as AiAutomationSlug];
}
