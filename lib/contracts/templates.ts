import { prisma } from "@/lib/db";
import { recordContractActivity } from "@/lib/contracts/activity";
import { computeContractContentHash } from "@/lib/contracts/content-hash";
import { CONTRACT_MAX_CONTENT_LENGTH } from "@/lib/contracts/constants";
import {
  buildContractVariableValues,
  findUnresolvedRequiredVariables,
  mergeContractVariables,
} from "@/lib/contracts/variables";

export async function createTemplate(input: {
  name: string;
  description?: string | null;
  content: string;
  createdById: string;
}) {
  if (input.content.length > CONTRACT_MAX_CONTENT_LENGTH) {
    throw new Error("Template content is too large.");
  }

  return prisma.$transaction(async (tx) => {
    const template = await tx.agencyContractTemplate.create({
      data: {
        name: input.name.trim(),
        description: input.description?.trim() || null,
        status: "DRAFT",
        createdById: input.createdById,
      },
    });

    const version = await tx.agencyContractTemplateVersion.create({
      data: {
        templateId: template.id,
        versionNumber: 1,
        name: input.name.trim(),
        content: input.content,
        createdById: input.createdById,
      },
    });

    return tx.agencyContractTemplate.update({
      where: { id: template.id },
      data: { currentVersionId: version.id, status: "ACTIVE" },
      include: { versions: { orderBy: { versionNumber: "desc" } } },
    });
  });
}

export async function listTemplates() {
  return prisma.agencyContractTemplate.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { updatedAt: "desc" },
    include: {
      versions: { orderBy: { versionNumber: "desc" }, take: 1 },
    },
  });
}

export async function getTemplateById(templateId: string) {
  return prisma.agencyContractTemplate.findUnique({
    where: { id: templateId },
    include: { versions: { orderBy: { versionNumber: "desc" } } },
  });
}

export async function createTemplateVersion(input: {
  templateId: string;
  name: string;
  content: string;
  createdById: string;
}) {
  const latest = await prisma.agencyContractTemplateVersion.findFirst({
    where: { templateId: input.templateId },
    orderBy: { versionNumber: "desc" },
  });

  const version = await prisma.agencyContractTemplateVersion.create({
    data: {
      templateId: input.templateId,
      versionNumber: (latest?.versionNumber ?? 0) + 1,
      name: input.name.trim(),
      content: input.content,
      createdById: input.createdById,
    },
  });

  await prisma.agencyContractTemplate.update({
    where: { id: input.templateId },
    data: { currentVersionId: version.id },
  });

  return version;
}

export async function resolveTemplateContent(input: {
  templateContent: string;
  variableSource: Parameters<typeof buildContractVariableValues>[0];
}) {
  const values = buildContractVariableValues(input.variableSource);
  const unresolved = findUnresolvedRequiredVariables({
    content: input.templateContent,
    values,
  });
  if (unresolved.length) {
    throw new Error(`Unresolved required variables: ${unresolved.join(", ")}`);
  }
  return {
    values,
    content: mergeContractVariables(input.templateContent, values),
  };
}

export { mergeContractVariables, buildContractVariableValues, findUnresolvedRequiredVariables };
