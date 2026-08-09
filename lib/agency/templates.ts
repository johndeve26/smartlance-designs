import type { AgencyServiceType, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

type TemplateSeed = {
  name: string;
  description: string;
  serviceType: AgencyServiceType;
  milestones: Array<{
    title: string;
    description?: string;
    offsetDaysStart?: number;
    offsetDaysDue?: number;
    tasks: Array<{
      title: string;
      description?: string;
      offsetDaysDue?: number;
      priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
      clientVisible?: boolean;
    }>;
    requirements?: Array<{
      title: string;
      description?: string;
      type?: "CONTENT" | "BRAND_ASSET" | "ACCESS" | "APPROVAL" | "INFORMATION" | "OTHER";
      offsetDaysDue?: number;
    }>;
  }>;
};

const SYSTEM_TEMPLATE_SEEDS: TemplateSeed[] = [
  {
    name: "Website Design",
    description: "Standard new website design engagement from discovery through launch.",
    serviceType: "WEBSITE_DESIGN",
    milestones: [
      {
        title: "Discovery & Strategy",
        description: "Understand goals, audience, and scope.",
        offsetDaysStart: 0,
        offsetDaysDue: 7,
        tasks: [
          { title: "Kickoff call", offsetDaysDue: 2, clientVisible: true },
          { title: "Gather brand and content inputs", offsetDaysDue: 5 },
          { title: "Define sitemap and page list", offsetDaysDue: 7, clientVisible: true },
        ],
        requirements: [
          { title: "Brand guidelines or logo files", type: "BRAND_ASSET", offsetDaysDue: 5 },
          { title: "Existing website access (if applicable)", type: "ACCESS", offsetDaysDue: 5 },
        ],
      },
      {
        title: "Design",
        description: "Visual design for key templates and pages.",
        offsetDaysStart: 8,
        offsetDaysDue: 21,
        tasks: [
          { title: "Homepage design concepts", offsetDaysDue: 14, clientVisible: true },
          { title: "Inner page templates", offsetDaysDue: 18 },
          { title: "Design review and revisions", offsetDaysDue: 21, clientVisible: true },
        ],
      },
      {
        title: "Development",
        description: "Build responsive pages and CMS integration.",
        offsetDaysStart: 22,
        offsetDaysDue: 42,
        tasks: [
          { title: "Set up development environment", offsetDaysDue: 24 },
          { title: "Build core templates", offsetDaysDue: 35 },
          { title: "Populate initial content", offsetDaysDue: 40, clientVisible: true },
        ],
        requirements: [
          { title: "Final copy for priority pages", type: "CONTENT", offsetDaysDue: 30 },
        ],
      },
      {
        title: "QA & Launch",
        description: "Testing, approvals, and go-live.",
        offsetDaysStart: 43,
        offsetDaysDue: 49,
        tasks: [
          { title: "Cross-browser and mobile QA", offsetDaysDue: 46 },
          { title: "Client UAT", offsetDaysDue: 48, clientVisible: true },
          { title: "Launch and post-launch checks", offsetDaysDue: 49, clientVisible: true },
        ],
        requirements: [
          { title: "DNS/hosting access for launch", type: "ACCESS", offsetDaysDue: 45 },
        ],
      },
    ],
  },
  {
    name: "Website Redesign",
    description: "Redesign an existing website while preserving SEO and content continuity.",
    serviceType: "WEBSITE_REDESIGN",
    milestones: [
      {
        title: "Audit & Planning",
        offsetDaysStart: 0,
        offsetDaysDue: 10,
        tasks: [
          { title: "Current site audit", offsetDaysDue: 5 },
          { title: "Redesign goals workshop", offsetDaysDue: 7, clientVisible: true },
          { title: "Migration and redirect plan", offsetDaysDue: 10 },
        ],
        requirements: [
          { title: "CMS/admin access", type: "ACCESS", offsetDaysDue: 3 },
          { title: "Analytics access", type: "ACCESS", offsetDaysDue: 5 },
        ],
      },
      {
        title: "UX & Design",
        offsetDaysStart: 11,
        offsetDaysDue: 28,
        tasks: [
          { title: "Wireframes for key pages", offsetDaysDue: 18, clientVisible: true },
          { title: "Visual design system", offsetDaysDue: 24 },
          { title: "Design approval", offsetDaysDue: 28, clientVisible: true },
        ],
      },
      {
        title: "Build & Migration",
        offsetDaysStart: 29,
        offsetDaysDue: 49,
        tasks: [
          { title: "Implement new templates", offsetDaysDue: 40 },
          { title: "Content migration", offsetDaysDue: 46 },
          { title: "Redirect mapping implementation", offsetDaysDue: 49 },
        ],
      },
      {
        title: "Launch",
        offsetDaysStart: 50,
        offsetDaysDue: 56,
        tasks: [
          { title: "Pre-launch QA", offsetDaysDue: 53 },
          { title: "Go-live", offsetDaysDue: 55, clientVisible: true },
          { title: "Post-launch monitoring", offsetDaysDue: 56 },
        ],
      },
    ],
  },
  {
    name: "Landing Page",
    description: "Single high-converting landing page campaign build.",
    serviceType: "LANDING_PAGE",
    milestones: [
      {
        title: "Brief & Copy",
        offsetDaysStart: 0,
        offsetDaysDue: 5,
        tasks: [
          { title: "Campaign brief review", offsetDaysDue: 2, clientVisible: true },
          { title: "Outline page sections", offsetDaysDue: 4 },
        ],
        requirements: [
          { title: "Offer and audience details", type: "INFORMATION", offsetDaysDue: 2 },
          { title: "Draft copy or bullet points", type: "CONTENT", offsetDaysDue: 5 },
        ],
      },
      {
        title: "Design & Build",
        offsetDaysStart: 6,
        offsetDaysDue: 14,
        tasks: [
          { title: "Landing page design", offsetDaysDue: 10, clientVisible: true },
          { title: "Responsive build", offsetDaysDue: 13 },
          { title: "Form/tracking integration", offsetDaysDue: 14 },
        ],
      },
      {
        title: "Review & Publish",
        offsetDaysStart: 15,
        offsetDaysDue: 17,
        tasks: [
          { title: "Client review", offsetDaysDue: 16, clientVisible: true },
          { title: "Publish landing page", offsetDaysDue: 17, clientVisible: true },
        ],
      },
    ],
  },
  {
    name: "E-commerce Website",
    description: "Online store setup with catalog, checkout, and launch.",
    serviceType: "ECOMMERCE",
    milestones: [
      {
        title: "Store Planning",
        offsetDaysStart: 0,
        offsetDaysDue: 10,
        tasks: [
          { title: "Platform and catalog planning", offsetDaysDue: 5 },
          { title: "Shipping/tax/payment requirements", offsetDaysDue: 8, clientVisible: true },
          { title: "Store architecture sign-off", offsetDaysDue: 10, clientVisible: true },
        ],
        requirements: [
          { title: "Product data spreadsheet", type: "CONTENT", offsetDaysDue: 8 },
          { title: "Payment gateway credentials", type: "ACCESS", offsetDaysDue: 10 },
        ],
      },
      {
        title: "Design & Theme",
        offsetDaysStart: 11,
        offsetDaysDue: 28,
        tasks: [
          { title: "Homepage and PDP design", offsetDaysDue: 20, clientVisible: true },
          { title: "Cart/checkout UX review", offsetDaysDue: 24 },
          { title: "Theme implementation", offsetDaysDue: 28 },
        ],
      },
      {
        title: "Catalog & Integrations",
        offsetDaysStart: 29,
        offsetDaysDue: 42,
        tasks: [
          { title: "Import products", offsetDaysDue: 35 },
          { title: "Configure shipping zones", offsetDaysDue: 38 },
          { title: "Test checkout flows", offsetDaysDue: 42 },
        ],
      },
      {
        title: "Launch",
        offsetDaysStart: 43,
        offsetDaysDue: 49,
        tasks: [
          { title: "UAT with test orders", offsetDaysDue: 46, clientVisible: true },
          { title: "Store launch", offsetDaysDue: 49, clientVisible: true },
        ],
      },
    ],
  },
  {
    name: "SEO Project",
    description: "Technical and on-page SEO improvement engagement.",
    serviceType: "SEO",
    milestones: [
      {
        title: "SEO Audit",
        offsetDaysStart: 0,
        offsetDaysDue: 10,
        tasks: [
          { title: "Technical crawl and audit", offsetDaysDue: 7 },
          { title: "Keyword and competitor review", offsetDaysDue: 9 },
          { title: "Audit presentation", offsetDaysDue: 10, clientVisible: true },
        ],
        requirements: [
          { title: "Search Console access", type: "ACCESS", offsetDaysDue: 3 },
          { title: "Analytics access", type: "ACCESS", offsetDaysDue: 3 },
        ],
      },
      {
        title: "On-Page Optimization",
        offsetDaysStart: 11,
        offsetDaysDue: 28,
        tasks: [
          { title: "Priority page metadata updates", offsetDaysDue: 18 },
          { title: "Content optimization recommendations", offsetDaysDue: 24, clientVisible: true },
          { title: "Internal linking improvements", offsetDaysDue: 28 },
        ],
      },
      {
        title: "Technical Fixes",
        offsetDaysStart: 29,
        offsetDaysDue: 42,
        tasks: [
          { title: "Fix crawl/indexation issues", offsetDaysDue: 36 },
          { title: "Performance improvements", offsetDaysDue: 40 },
          { title: "Validation and reporting", offsetDaysDue: 42, clientVisible: true },
        ],
      },
    ],
  },
  {
    name: "Branding",
    description: "Brand identity development from discovery to guidelines.",
    serviceType: "BRANDING",
    milestones: [
      {
        title: "Brand Discovery",
        offsetDaysStart: 0,
        offsetDaysDue: 7,
        tasks: [
          { title: "Brand questionnaire review", offsetDaysDue: 3, clientVisible: true },
          { title: "Moodboard directions", offsetDaysDue: 7, clientVisible: true },
        ],
        requirements: [
          { title: "Brand questionnaire responses", type: "INFORMATION", offsetDaysDue: 3 },
          { title: "Inspiration references", type: "INFORMATION", offsetDaysDue: 5 },
        ],
      },
      {
        title: "Concept Development",
        offsetDaysStart: 8,
        offsetDaysDue: 21,
        tasks: [
          { title: "Logo concept exploration", offsetDaysDue: 14, clientVisible: true },
          { title: "Color and typography exploration", offsetDaysDue: 18 },
          { title: "Concept presentation", offsetDaysDue: 21, clientVisible: true },
        ],
      },
      {
        title: "Refinement & Guidelines",
        offsetDaysStart: 22,
        offsetDaysDue: 35,
        tasks: [
          { title: "Logo refinement", offsetDaysDue: 28, clientVisible: true },
          { title: "Brand asset kit", offsetDaysDue: 32 },
          { title: "Brand guidelines document", offsetDaysDue: 35, clientVisible: true },
        ],
      },
    ],
  },
  {
    name: "Website Maintenance",
    description: "Ongoing website care, updates, and support retainer.",
    serviceType: "WEBSITE_MAINTENANCE",
    milestones: [
      {
        title: "Onboarding",
        offsetDaysStart: 0,
        offsetDaysDue: 7,
        tasks: [
          { title: "Access and environment audit", offsetDaysDue: 3 },
          { title: "Maintenance checklist setup", offsetDaysDue: 5 },
          { title: "Support workflow briefing", offsetDaysDue: 7, clientVisible: true },
        ],
        requirements: [
          { title: "Hosting/CMS credentials", type: "ACCESS", offsetDaysDue: 3 },
          { title: "Emergency contact details", type: "INFORMATION", offsetDaysDue: 5 },
        ],
      },
      {
        title: "Monthly Care",
        offsetDaysStart: 8,
        offsetDaysDue: 38,
        tasks: [
          { title: "Plugin/theme updates", offsetDaysDue: 15 },
          { title: "Security and uptime review", offsetDaysDue: 22 },
          { title: "Performance check", offsetDaysDue: 30 },
          { title: "Monthly report", offsetDaysDue: 38, clientVisible: true },
        ],
      },
      {
        title: "Support Queue",
        offsetDaysStart: 8,
        offsetDaysDue: 38,
        tasks: [
          { title: "Triage incoming requests", offsetDaysDue: 10 },
          { title: "Implement approved changes", offsetDaysDue: 25 },
          { title: "Close out support tickets", offsetDaysDue: 38 },
        ],
      },
    ],
  },
];

async function createTemplateFromSeed(
  seed: TemplateSeed,
  createdById: string,
  db: Pick<
    PrismaClient,
    "agencyProjectTemplate" | "agencyProjectTemplateMilestone" | "agencyProjectTemplateTask" | "agencyProjectTemplateRequirement"
  >,
) {
  const template = await db.agencyProjectTemplate.create({
    data: {
      name: seed.name,
      description: seed.description,
      serviceType: seed.serviceType,
      isSystem: true,
      createdById,
    },
  });

  for (let mi = 0; mi < seed.milestones.length; mi++) {
    const milestoneSeed = seed.milestones[mi];
    const milestone = await db.agencyProjectTemplateMilestone.create({
      data: {
        templateId: template.id,
        title: milestoneSeed.title,
        description: milestoneSeed.description ?? null,
        position: mi,
        offsetDaysStart: milestoneSeed.offsetDaysStart ?? null,
        offsetDaysDue: milestoneSeed.offsetDaysDue ?? null,
        clientVisible: true,
      },
    });

    for (let ti = 0; ti < milestoneSeed.tasks.length; ti++) {
      const taskSeed = milestoneSeed.tasks[ti];
      await db.agencyProjectTemplateTask.create({
        data: {
          templateId: template.id,
          milestoneId: milestone.id,
          title: taskSeed.title,
          description: taskSeed.description ?? null,
          position: ti,
          priority: taskSeed.priority ?? "NORMAL",
          offsetDaysDue: taskSeed.offsetDaysDue ?? null,
          clientVisible: taskSeed.clientVisible ?? false,
        },
      });
    }

    for (const reqSeed of milestoneSeed.requirements ?? []) {
      await db.agencyProjectTemplateRequirement.create({
        data: {
          templateId: template.id,
          title: reqSeed.title,
          description: reqSeed.description ?? null,
          type: reqSeed.type ?? "OTHER",
          offsetDaysDue: reqSeed.offsetDaysDue ?? null,
          clientVisible: true,
        },
      });
    }
  }

  return template;
}

export async function listTemplates(input?: {
  includeArchived?: boolean;
  serviceType?: AgencyServiceType;
}) {
  return prisma.agencyProjectTemplate.findMany({
    where: {
      ...(input?.includeArchived ? {} : { isArchived: false }),
      ...(input?.serviceType ? { serviceType: input.serviceType } : {}),
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          milestones: true,
          tasks: true,
          requirements: true,
        },
      },
    },
  });
}

export async function getTemplateById(templateId: string) {
  return prisma.agencyProjectTemplate.findUnique({
    where: { id: templateId },
    include: {
      milestones: {
        orderBy: { position: "asc" },
        include: {
          tasks: { orderBy: { position: "asc" } },
        },
      },
      tasks: { orderBy: { position: "asc" } },
      requirements: true,
    },
  });
}

export async function createTemplate(input: {
  name: string;
  description?: string | null;
  serviceType: AgencyServiceType;
  createdById: string;
}) {
  return prisma.agencyProjectTemplate.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim() || null,
      serviceType: input.serviceType,
      createdById: input.createdById,
    },
  });
}

export async function updateTemplate(input: {
  templateId: string;
  name?: string;
  description?: string | null;
  serviceType?: AgencyServiceType;
  isArchived?: boolean;
  updatedById: string;
}) {
  const data: Prisma.AgencyProjectTemplateUpdateInput = {
    updatedBy: { connect: { id: input.updatedById } },
  };
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.description !== undefined) {
    data.description = input.description?.trim() || null;
  }
  if (input.serviceType !== undefined) data.serviceType = input.serviceType;
  if (input.isArchived !== undefined) data.isArchived = input.isArchived;

  return prisma.agencyProjectTemplate.update({
    where: { id: input.templateId },
    data,
  });
}

function addDays(base: Date, days: number | null | undefined) {
  if (days == null) return null;
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function instantiateTemplateIntoProject(
  input: {
    projectId: string;
    templateId: string;
    actorUserId: string;
    startDate?: Date | null;
  },
  db: PrismaClient | Pick<
    PrismaClient,
    | "agencyProject"
    | "agencyProjectTemplate"
    | "agencyProjectMilestone"
    | "agencyProjectTask"
    | "agencyClientRequirement"
  > = prisma,
) {
  const [project, template] = await Promise.all([
    db.agencyProject.findUniqueOrThrow({ where: { id: input.projectId } }),
    db.agencyProjectTemplate.findUniqueOrThrow({
      where: { id: input.templateId },
      include: {
        milestones: {
          orderBy: { position: "asc" },
          include: { tasks: { orderBy: { position: "asc" } } },
        },
        requirements: true,
      },
    }),
  ]);

  const anchor = input.startDate ?? project.startDate ?? new Date();
  const milestoneIdMap = new Map<string, string>();

  for (const milestone of template.milestones) {
    const createdMilestone = await db.agencyProjectMilestone.create({
      data: {
        projectId: project.id,
        title: milestone.title,
        description: milestone.description,
        position: milestone.position,
        startDate: addDays(anchor, milestone.offsetDaysStart),
        dueDate: addDays(anchor, milestone.offsetDaysDue),
        clientVisible: milestone.clientVisible,
      },
    });
    milestoneIdMap.set(milestone.id, createdMilestone.id);

    for (const task of milestone.tasks) {
      await db.agencyProjectTask.create({
        data: {
          projectId: project.id,
          milestoneId: createdMilestone.id,
          title: task.title,
          description: task.description,
          position: task.position,
          priority: task.priority,
          dueDate: addDays(anchor, task.offsetDaysDue),
          clientVisible: task.clientVisible,
          createdById: input.actorUserId,
        },
      });
    }
  }

  for (const requirement of template.requirements) {
    await db.agencyClientRequirement.create({
      data: {
        projectId: project.id,
        milestoneId: requirement.templateId
          ? null
          : null,
        title: requirement.title,
        description: requirement.description,
        type: requirement.type,
        dueDate: addDays(anchor, requirement.offsetDaysDue),
        clientVisible: requirement.clientVisible,
      },
    });
  }

  return {
    projectId: project.id,
    milestonesCreated: template.milestones.length,
    tasksCreated: template.milestones.reduce((sum, m) => sum + m.tasks.length, 0),
    requirementsCreated: template.requirements.length,
  };
}

export async function seedSystemTemplatesIfEmpty(createdById: string) {
  const existing = await prisma.agencyProjectTemplate.count({
    where: { isSystem: true },
  });
  if (existing > 0) {
    return { seeded: false, count: existing };
  }

  await prisma.$transaction(async (tx) => {
    for (const seed of SYSTEM_TEMPLATE_SEEDS) {
      await createTemplateFromSeed(seed, createdById, tx);
    }
  });

  return { seeded: true, count: SYSTEM_TEMPLATE_SEEDS.length };
}
