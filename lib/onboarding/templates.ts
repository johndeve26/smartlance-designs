import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type Tx = Prisma.TransactionClient;

export async function createOnboardingTemplate(input: {
  name: string;
  description?: string | null;
  serviceType?: Prisma.AgencyOnboardingTemplateCreateInput["serviceType"];
  welcomeText?: string | null;
  createdById: string;
}) {
  return prisma.$transaction(async (tx) => {
    const template = await tx.agencyOnboardingTemplate.create({
      data: {
        name: input.name.trim(),
        description: input.description?.trim() || null,
        serviceType: input.serviceType ?? null,
        welcomeText: input.welcomeText?.trim() || null,
        status: "DRAFT",
        createdById: input.createdById,
      },
    });

    const version = await tx.agencyOnboardingTemplateVersion.create({
      data: {
        templateId: template.id,
        versionNumber: 1,
        welcomeText: input.welcomeText?.trim() || null,
        createdById: input.createdById,
      },
    });

    return tx.agencyOnboardingTemplate.update({
      where: { id: template.id },
      data: { currentVersionId: version.id },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          include: {
            sections: { orderBy: { position: "asc" } },
            questions: { orderBy: { position: "asc" } },
            requirements: { orderBy: { position: "asc" } },
          },
        },
      },
    });
  });
}

export async function listOnboardingTemplates(filters?: {
  includeArchived?: boolean;
}) {
  return prisma.agencyOnboardingTemplate.findMany({
    where: filters?.includeArchived ? {} : { status: { not: "ARCHIVED" } },
    orderBy: { updatedAt: "desc" },
    include: {
      versions: { orderBy: { versionNumber: "desc" }, take: 1 },
    },
  });
}

export async function getOnboardingTemplateById(templateId: string) {
  return prisma.agencyOnboardingTemplate.findUnique({
    where: { id: templateId },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        include: {
          sections: { orderBy: { position: "asc" } },
          questions: { orderBy: { position: "asc" } },
          requirements: { orderBy: { position: "asc" } },
        },
      },
    },
  });
}

export async function getOnboardingTemplateVersion(versionId: string) {
  return prisma.agencyOnboardingTemplateVersion.findUnique({
    where: { id: versionId },
    include: {
      sections: { orderBy: { position: "asc" } },
      questions: { orderBy: [{ sectionId: "asc" }, { position: "asc" }] },
      requirements: { orderBy: { position: "asc" } },
      template: true,
    },
  });
}

export async function publishOnboardingTemplateVersion(input: {
  templateId: string;
  versionId: string;
}) {
  const version = await prisma.agencyOnboardingTemplateVersion.findFirst({
    where: { id: input.versionId, templateId: input.templateId },
  });
  if (!version) throw new Error("Template version not found.");

  return prisma.agencyOnboardingTemplate.update({
    where: { id: input.templateId },
    data: {
      currentVersionId: version.id,
      status: "ACTIVE",
    },
  });
}

export async function createOnboardingTemplateVersion(input: {
  templateId: string;
  createdById: string;
  welcomeText?: string | null;
  copyFromVersionId?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const latest = await tx.agencyOnboardingTemplateVersion.findFirst({
      where: { templateId: input.templateId },
      orderBy: { versionNumber: "desc" },
    });

    const version = await tx.agencyOnboardingTemplateVersion.create({
      data: {
        templateId: input.templateId,
        versionNumber: (latest?.versionNumber ?? 0) + 1,
        welcomeText: input.welcomeText?.trim() || latest?.welcomeText || null,
        createdById: input.createdById,
      },
    });

    const sourceVersionId = input.copyFromVersionId ?? latest?.id;
    if (sourceVersionId) {
      await copyTemplateVersionContent(tx, sourceVersionId, version.id);
    }

    await tx.agencyOnboardingTemplate.update({
      where: { id: input.templateId },
      data: { currentVersionId: version.id },
    });

    return version;
  });
}

async function copyTemplateVersionContent(tx: Tx, fromVersionId: string, toVersionId: string) {
  const [sections, questions, requirements] = await Promise.all([
    tx.agencyOnboardingTemplateSection.findMany({
      where: { versionId: fromVersionId },
      orderBy: { position: "asc" },
    }),
    tx.agencyOnboardingTemplateQuestion.findMany({
      where: { versionId: fromVersionId },
      orderBy: { position: "asc" },
    }),
    tx.agencyOnboardingTemplateRequirement.findMany({
      where: { versionId: fromVersionId },
      orderBy: { position: "asc" },
    }),
  ]);

  const sectionIdMap = new Map<string, string>();
  for (const section of sections) {
    const created = await tx.agencyOnboardingTemplateSection.create({
      data: {
        versionId: toVersionId,
        title: section.title,
        description: section.description,
        position: section.position,
        clientVisible: section.clientVisible,
      },
    });
    sectionIdMap.set(section.id, created.id);
  }

  for (const question of questions) {
    await tx.agencyOnboardingTemplateQuestion.create({
      data: {
        versionId: toVersionId,
        sectionId: sectionIdMap.get(question.sectionId)!,
        key: question.key,
        label: question.label,
        description: question.description,
        type: question.type,
        required: question.required,
        position: question.position,
        placeholder: question.placeholder,
        helpText: question.helpText,
        optionsJson: question.optionsJson ?? undefined,
        validationJson: question.validationJson ?? undefined,
        clientVisible: question.clientVisible,
      },
    });
  }

  for (const req of requirements) {
    await tx.agencyOnboardingTemplateRequirement.create({
      data: {
        versionId: toVersionId,
        sectionId: req.sectionId ? sectionIdMap.get(req.sectionId) ?? null : null,
        sourceKey: req.sourceKey,
        title: req.title,
        description: req.description,
        type: req.type,
        required: req.required,
        position: req.position,
        clientVisible: req.clientVisible,
        offsetDaysDue: req.offsetDaysDue,
      },
    });
  }
}

export async function updateOnboardingTemplateDraft(input: {
  templateId: string;
  versionId: string;
  name?: string;
  description?: string | null;
  welcomeText?: string | null;
  serviceType?: Prisma.AgencyOnboardingTemplateUpdateInput["serviceType"];
}) {
  const template = await prisma.agencyOnboardingTemplate.findUniqueOrThrow({
    where: { id: input.templateId },
  });
  if (template.status === "ARCHIVED") {
    throw new Error("Archived templates cannot be edited.");
  }

  await prisma.$transaction([
    prisma.agencyOnboardingTemplate.update({
      where: { id: input.templateId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined
          ? { description: input.description?.trim() || null }
          : {}),
        ...(input.serviceType !== undefined ? { serviceType: input.serviceType } : {}),
        ...(input.welcomeText !== undefined ? { welcomeText: input.welcomeText?.trim() || null } : {}),
      },
    }),
    prisma.agencyOnboardingTemplateVersion.update({
      where: { id: input.versionId },
      data: {
        ...(input.welcomeText !== undefined ? { welcomeText: input.welcomeText?.trim() || null } : {}),
      },
    }),
  ]);
}

export async function addTemplateSection(input: {
  versionId: string;
  title: string;
  description?: string | null;
  position?: number;
}) {
  const max = await prisma.agencyOnboardingTemplateSection.aggregate({
    where: { versionId: input.versionId },
    _max: { position: true },
  });
  return prisma.agencyOnboardingTemplateSection.create({
    data: {
      versionId: input.versionId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      position: input.position ?? (max._max.position ?? -1) + 1,
    },
  });
}

export async function addTemplateQuestion(input: {
  versionId: string;
  sectionId: string;
  key: string;
  label: string;
  type: Prisma.AgencyOnboardingTemplateQuestionCreateInput["type"];
  required?: boolean;
  description?: string | null;
  placeholder?: string | null;
  helpText?: string | null;
  optionsJson?: Prisma.InputJsonValue;
}) {
  const max = await prisma.agencyOnboardingTemplateQuestion.aggregate({
    where: { sectionId: input.sectionId },
    _max: { position: true },
  });
  return prisma.agencyOnboardingTemplateQuestion.create({
    data: {
      versionId: input.versionId,
      sectionId: input.sectionId,
      key: input.key.trim(),
      label: input.label.trim(),
      type: input.type ?? "SHORT_TEXT",
      required: input.required ?? false,
      description: input.description?.trim() || null,
      placeholder: input.placeholder?.trim() || null,
      helpText: input.helpText?.trim() || null,
      optionsJson: input.optionsJson,
      position: (max._max.position ?? -1) + 1,
    },
  });
}

export async function addTemplateRequirement(input: {
  versionId: string;
  sectionId?: string | null;
  sourceKey: string;
  title: string;
  type?: Prisma.AgencyOnboardingTemplateRequirementCreateInput["type"];
  required?: boolean;
  description?: string | null;
  offsetDaysDue?: number | null;
}) {
  const max = await prisma.agencyOnboardingTemplateRequirement.aggregate({
    where: { versionId: input.versionId },
    _max: { position: true },
  });
  return prisma.agencyOnboardingTemplateRequirement.create({
    data: {
      versionId: input.versionId,
      sectionId: input.sectionId ?? null,
      sourceKey: input.sourceKey.trim(),
      title: input.title.trim(),
      type: input.type ?? "OTHER",
      required: input.required ?? true,
      description: input.description?.trim() || null,
      offsetDaysDue: input.offsetDaysDue ?? null,
      position: (max._max.position ?? -1) + 1,
    },
  });
}

export async function archiveOnboardingTemplate(templateId: string) {
  return prisma.agencyOnboardingTemplate.update({
    where: { id: templateId },
    data: { status: "ARCHIVED" },
  });
}
