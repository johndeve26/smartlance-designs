import type { ProcessStep } from "@/types";
import { PUBLIC_CTAS } from "@/lib/public/cta-map";

export const homepageProcessSteps: ProcessStep[] = [
  {
    step: 1,
    title: "Understand",
    description:
      "We learn your business, audience, current website and the outcomes you need the site to support.",
  },
  {
    step: 2,
    title: "Plan",
    description:
      "We define scope, pages, content needs, functionality and priorities so everyone knows what comes next.",
  },
  {
    step: 3,
    title: "Design & Build",
    description:
      "We shape structure, UX, visual design and development with search and conversion in mind from the start.",
  },
  {
    step: 4,
    title: "Review & Launch",
    description:
      "You review key deliverables, we run final checks, and launch with the technical foundations in place.",
  },
  {
    step: 5,
    title: "Improve & Grow",
    description:
      "After launch we can support SEO, maintenance, content and ongoing improvements where they make sense.",
  },
];

export const howWeWorkBeforeProject = [
  {
    title: "Free Website Review",
    description:
      "For an existing site — practical notes on what to improve first, without committing to a project.",
    href: PUBLIC_CTAS.freeReview.href,
    cta: PUBLIC_CTAS.reviewMyWebsite.label,
  },
  {
    title: "Website Brief Builder",
    description:
      "For a planned website — turn goals and requirements into a structured brief you can share with us.",
    href: PUBLIC_CTAS.websiteBrief.href,
    cta: PUBLIC_CTAS.buildMyBrief.label,
  },
  {
    title: "Project Planner",
    description:
      "Not sure what kind of help you need? Work through the project type and support that fits.",
    href: PUBLIC_CTAS.projectPlanner.href,
    cta: PUBLIC_CTAS.projectPlanner.label,
  },
  {
    title: "Project enquiry",
    description:
      "Ready to talk? Tell us what you are building or improving and we will help figure out the right next step.",
    href: PUBLIC_CTAS.project.href,
    cta: PUBLIC_CTAS.project.label,
  },
];

export const howWeWorkJourney = [
  {
    title: "Discovery & planning",
    description:
      "We clarify the business problem, recommend the right approach and define scope before design begins.",
  },
  {
    title: "Proposal",
    description:
      "You receive clear deliverables, commercial details and next steps — no vague scope or surprise add-ons.",
  },
  {
    title: "Agreement",
    description:
      "When you are ready to proceed, acceptance and contract steps are handled in a structured way.",
  },
  {
    title: "Onboarding",
    description:
      "We collect business details, content, assets and access so the project can move without unnecessary delays.",
  },
  {
    title: "Delivery",
    description:
      "Work moves through milestones, reviews, files and approvals so you always know where things stand.",
  },
  {
    title: "Changes outside scope",
    description:
      "If something falls outside the agreed scope, it is documented and reviewed before it becomes part of the project.",
  },
  {
    title: "Launch",
    description:
      "Final review, handoff and launch — with the site ready for real visitors and measurable next steps.",
  },
  {
    title: "After launch",
    description:
      "Website care, maintenance, support and ongoing SEO or improvement work can continue where it adds value.",
  },
];

export const clientPortalHighlights = [
  "Projects and milestones in one place",
  "Approvals and files without email chaos",
  "Documents, billing and support when you need them",
];

export const howWeWorkTechnology = {
  title: "Technology should solve the problem, not complicate it",
  body: "Depending on the project, Smartlance may combine websites, APIs, CRM systems, automation and AI — rather than forcing every business into the same stack.",
  discovery: [
    "Current process and where information gets stuck",
    "Tools and systems already in use",
    "Data sources and what can be trusted",
    "Repetitive steps and decision points",
    "Exceptions and where human review is required",
  ],
  delivery: [
    "Map the workflow and define rules",
    "Build connections between systems",
    "Test edge cases and failure paths",
    "Launch carefully with monitoring",
    "Improve based on real usage",
  ],
};
