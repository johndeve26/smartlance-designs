import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordContractActivity } from "@/lib/contracts/activity";
import { generateAgencyContractNumber } from "@/lib/contracts/contract-number";
import { computeContractContentHash } from "@/lib/contracts/content-hash";
import {
  CONTRACT_PAGE_SIZE_DEFAULT,
  CONTRACT_PAGE_SIZE_MAX,
} from "@/lib/contracts/constants";
import type { ContractFilters } from "@/lib/contracts/schema";
import { grantContractAccess } from "@/lib/contracts/portal-access";
import { resolveTemplateContent } from "@/lib/contracts/templates";

function boundedPage(input?: { page?: number; pageSize?: number }) {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(input?.pageSize ?? CONTRACT_PAGE_SIZE_DEFAULT, CONTRACT_PAGE_SIZE_MAX);
  return { page, pageSize };
}

const listInclude = {
  company: { select: { id: true, name: true } },
  primaryContact: {
    select: { id: true, firstName: true, lastName: true, displayName: true, email: true },
  },
  owner: { select: { id: true, name: true } },
  proposal: { select: { id: true, proposalNumber: true, title: true } },
  project: { select: { id: true, projectNumber: true, name: true } },
  versions: {
    orderBy: { versionNumber: "desc" as const },
    take: 1,
    select: { id: true, versionNumber: true, publishedAt: true },
  },
  signers: {
    where: { isRequired: true },
    select: { id: true, status: true, signerType: true, role: true },
  },
} satisfies Prisma.AgencyContractInclude;

export async function listContracts(input?: {
  filters?: ContractFilters;
  page?: number;
  pageSize?: number;
}) {
  const { page, pageSize } = boundedPage(input);
  const where: Prisma.AgencyContractWhereInput = {};
  if (input?.filters?.status) where.status = input.filters.status;
  if (input?.filters?.ownerId) where.ownerId = input.filters.ownerId;
  if (input?.filters?.companyId) where.companyId = input.filters.companyId;
  if (input?.filters?.proposalId) where.proposalId = input.filters.proposalId;
  if (input?.filters?.projectId) where.projectId = input.filters.projectId;
  if (input?.filters?.q?.trim()) {
    const q = input.filters.q.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { contractNumber: { contains: q, mode: "insensitive" } },
      { company: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.agencyContract.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: listInclude,
    }),
    prisma.agencyContract.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getContractById(contractId: string) {
  return prisma.agencyContract.findUnique({
    where: { id: contractId },
    include: {
      ...listInclude,
      createdBy: { select: { id: true, name: true } },
      proposalAcceptance: true,
      versions: {
        orderBy: { versionNumber: "desc" },
        include: {
          createdBy: { select: { id: true, name: true } },
          signatures: {
            include: {
              signer: true,
            },
          },
        },
      },
      signers: {
        orderBy: [{ signingOrder: "asc" }, { createdAt: "asc" }],
        include: {
          contact: { select: { id: true, displayName: true, email: true } },
          adminUser: { select: { id: true, name: true, email: true } },
        },
      },
      clientAccess: {
        include: {
          contact: { select: { id: true, displayName: true, email: true } },
        },
      },
      responses: { orderBy: { createdAt: "desc" }, take: 20 },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          actorUser: { select: { id: true, name: true } },
          actorPortalUser: { select: { id: true, email: true } },
        },
      },
      signatures: { orderBy: { signedAt: "desc" } },
    },
  });
}

export async function listContractsByProposalId(proposalId: string) {
  return prisma.agencyContract.findMany({
    where: { proposalId },
    orderBy: { updatedAt: "desc" },
    include: listInclude,
  });
}

export async function getContractDashboardCounts() {
  const [draft, awaiting, partial, correction, signed, expired] = await Promise.all([
    prisma.agencyContract.count({ where: { status: "DRAFT" } }),
    prisma.agencyContract.count({ where: { status: "SENT" } }),
    prisma.agencyContract.count({ where: { status: "PARTIALLY_SIGNED" } }),
    prisma.agencyContract.count({ where: { status: "CORRECTION_REQUESTED" } }),
    prisma.agencyContract.count({ where: { status: "SIGNED" } }),
    prisma.agencyContract.count({ where: { status: "EXPIRED" } }),
  ]);
  return { draft, awaiting, partial, correction, signed, expired };
}

async function ensurePortalUser(contactId: string) {
  const contact = await prisma.crmContact.findUniqueOrThrow({ where: { id: contactId } });
  if (!contact.email?.trim()) throw new Error("Contact must have an email.");
  return prisma.clientPortalUser.upsert({
    where: { contactId },
    create: { contactId, email: contact.email.trim().toLowerCase(), status: "INVITED" },
    update: { email: contact.email.trim().toLowerCase() },
  });
}

export async function createContractFromAcceptance(input: {
  proposalId: string;
  createdById: string;
  ownerId: string;
  title?: string;
  contractType?: Prisma.AgencyContractCreateInput["contractType"];
  templateVersionId?: string | null;
  clientSignerContactId: string;
  agencySignerRequired?: boolean;
  agencySignerAdminId?: string;
  expiresAt?: Date | null;
}) {
  const proposal = await prisma.agencyProposal.findUniqueOrThrow({
    where: { id: input.proposalId },
    include: {
      acceptance: true,
      company: true,
      primaryContact: true,
      project: true,
    },
  });

  if (proposal.status !== "ACCEPTED" || !proposal.acceptance) {
    throw new Error("Only accepted proposals can create contracts.");
  }

  const acceptedVersion = await prisma.agencyProposalVersion.findUnique({
    where: { id: proposal.acceptance.acceptedVersionId },
    include: { deliverables: { orderBy: { position: "asc" } } },
  });

  let templateVersion = null;
  if (input.templateVersionId) {
    templateVersion = await prisma.agencyContractTemplateVersion.findUniqueOrThrow({
      where: { id: input.templateVersionId },
      include: { template: true },
    });
  }

  const clientContact = await prisma.crmContact.findUniqueOrThrow({
    where: { id: input.clientSignerContactId },
    include: { company: true },
  });
  const clientPortalUser = await ensurePortalUser(clientContact.id);

  const variableSource = {
    contact: clientContact,
    company: proposal.company ?? clientContact.company,
    proposal,
    acceptance: proposal.acceptance,
    acceptedVersion: acceptedVersion ?? undefined,
    project: proposal.project ?? undefined,
    contractDate: new Date(),
    contractExpiryDate: input.expiresAt ?? null,
  };

  let content = `# ${input.title ?? proposal.title}\n\nScope and terms to be finalized.`;
  let resolvedVariables: Record<string, string> = {};
  if (templateVersion) {
    const resolved = await resolveTemplateContent({
      templateContent: templateVersion.content,
      variableSource,
    });
    content = resolved.content;
    resolvedVariables = resolved.values;
  }

  const contract = await prisma.$transaction(async (tx) => {
    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const contractNumber = await generateAgencyContractNumber(tx);
      try {
        const created = await tx.agencyContract.create({
          data: {
            contractNumber,
            proposalId: proposal.id,
            proposalAcceptanceId: proposal.acceptance!.id,
            projectId: proposal.project?.id ?? null,
            companyId: proposal.companyId ?? clientContact.companyId,
            primaryContactId: clientContact.id,
            title: (input.title ?? proposal.title).trim(),
            contractType: (input.contractType ?? "SERVICE_AGREEMENT") as never,
            source: "PROPOSAL_ACCEPTANCE",
            ownerId: input.ownerId,
            createdById: input.createdById,
            expiresAt: input.expiresAt ?? null,
          },
        });

        const contentHash = computeContractContentHash({
          contractId: created.id,
          versionNumber: 1,
          content,
          proposalAcceptanceId: proposal.acceptance!.id,
          proposalScopeHash: proposal.acceptance!.scopeHash,
          resolvedVariables,
        });

        const version = await tx.agencyContractVersion.create({
          data: {
            contractId: created.id,
            versionNumber: 1,
            title: created.title,
            content,
            resolvedVariables,
            sourceTemplateId: templateVersion?.templateId ?? null,
            sourceTemplateVersionId: templateVersion?.id ?? null,
            proposalAcceptanceId: proposal.acceptance!.id,
            proposalScopeHash: proposal.acceptance!.scopeHash,
            contentHash,
            createdById: input.createdById,
          },
        });

        await tx.agencyContractSigner.create({
          data: {
            contractId: created.id,
            contractVersionId: version.id,
            signerType: "CLIENT",
            portalUserId: clientPortalUser.id,
            contactId: clientContact.id,
            nameSnapshot: clientContact.displayName ?? clientContact.email ?? "Client",
            emailSnapshot: clientContact.email!,
            companySnapshot: proposal.company?.name ?? clientContact.company?.name ?? null,
            role: "CLIENT_SIGNATORY",
            isRequired: true,
          },
        });

        if (input.agencySignerRequired && input.agencySignerAdminId) {
          const admin = await tx.adminUser.findUniqueOrThrow({
            where: { id: input.agencySignerAdminId },
          });
          await tx.agencyContractSigner.create({
            data: {
              contractId: created.id,
              contractVersionId: version.id,
              signerType: "AGENCY",
              adminUserId: admin.id,
              nameSnapshot: admin.name,
              emailSnapshot: admin.email,
              role: "AGENCY_SIGNATORY",
              isRequired: true,
            },
          });
        }

        await tx.agencyContract.update({
          where: { id: created.id },
          data: { currentVersionId: version.id },
        });

        await recordContractActivity(
          {
            contractId: created.id,
            type: "CONTRACT_CREATED",
            summary: `Contract ${created.contractNumber} created from accepted proposal.`,
            actorUserId: input.createdById,
          },
          tx,
        );

        return created;
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code === "P2002" && attempt < maxAttempts - 1) continue;
        throw err;
      }
    }
    throw new Error("Failed to allocate contract number.");
  });

  await grantContractAccess({
    contractId: contract.id,
    contactId: clientContact.id,
    role: "CLIENT_SIGNATORY",
    grantedById: input.createdById,
  });

  return getContractById(contract.id);
}

export async function createManualContract(input: {
  title: string;
  createdById: string;
  ownerId: string;
  primaryContactId?: string | null;
  companyId?: string | null;
  contractType?: Prisma.AgencyContractCreateInput["contractType"];
  content?: string;
  templateVersionId?: string | null;
}) {
  let content = input.content?.trim() || "# Contract\n\nTerms to be defined.";
  if (input.templateVersionId) {
    const templateVersion = await prisma.agencyContractTemplateVersion.findUniqueOrThrow({
      where: { id: input.templateVersionId },
    });
    content = templateVersion.content;
  }

  const contract = await prisma.$transaction(async (tx) => {
    const contractNumber = await generateAgencyContractNumber(tx);
    const created = await tx.agencyContract.create({
      data: {
        contractNumber,
        title: input.title.trim(),
        contractType: (input.contractType ?? "OTHER") as never,
        source: "MANUAL",
        companyId: input.companyId ?? null,
        primaryContactId: input.primaryContactId ?? null,
        ownerId: input.ownerId,
        createdById: input.createdById,
      },
    });

    const contentHash = computeContractContentHash({
      contractId: created.id,
      versionNumber: 1,
      content,
    });

    const version = await tx.agencyContractVersion.create({
      data: {
        contractId: created.id,
        versionNumber: 1,
        title: created.title,
        content,
        contentHash,
        createdById: input.createdById,
      },
    });

    await tx.agencyContract.update({
      where: { id: created.id },
      data: { currentVersionId: version.id },
    });

    await recordContractActivity(
      {
        contractId: created.id,
        type: "CONTRACT_CREATED",
        summary: `Manual contract ${created.contractNumber} created.`,
        actorUserId: input.createdById,
      },
      tx,
    );

    return created;
  });

  return getContractById(contract.id);
}
