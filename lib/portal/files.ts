import { prisma } from "@/lib/db";
import { listAccessibleProjectIds } from "@/lib/portal/access";
import { formatPortalDate } from "@/lib/portal/status-labels";

export type PortalFileSourceType =
  | "CLIENT_UPLOAD"
  | "DELIVERABLE"
  | "ONBOARDING"
  | "CHANGE_REQUEST";

export type PortalFileCategory =
  | "Brand Assets"
  | "Content"
  | "Images"
  | "Documents"
  | "Deliverables"
  | "Other";

export type PortalFileItem = {
  id: string;
  name: string;
  mimeType: string;
  byteSize: number;
  projectId: string;
  projectName: string;
  category: PortalFileCategory;
  uploadedByLabel: string;
  uploadedAt: Date;
  sourceType: PortalFileSourceType;
  downloadHref: string;
  isDeliveredByAgency: boolean;
};

function categorizeFile(filename: string, mimeType: string): PortalFileCategory {
  const lower = filename.toLowerCase();
  if (mimeType.startsWith("image/")) return "Images";
  if (lower.includes("logo") || lower.includes("brand")) return "Brand Assets";
  if (mimeType === "application/pdf" || lower.endsWith(".doc") || lower.endsWith(".docx"))
    return "Documents";
  if (lower.includes("content") || lower.includes("copy")) return "Content";
  return "Other";
}

export async function getPortalFiles(input: {
  portalUserId: string;
  projectId?: string;
  category?: PortalFileCategory;
  q?: string;
  limit?: number;
}) {
  const projectIds = input.projectId
    ? (await listAccessibleProjectIds(input.portalUserId)).includes(input.projectId)
      ? [input.projectId]
      : []
    : await listAccessibleProjectIds(input.portalUserId);

  if (!projectIds.length) return [];

  const items: PortalFileItem[] = [];

  const [deliverableFiles, onboardingFiles, changeFiles] = await Promise.all([
    prisma.agencyDeliverableVersion.findMany({
      where: {
        file: { isNot: null },
        deliverable: {
          projectId: { in: projectIds },
          clientVisible: true,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        createdAt: true,
        deliverable: {
          select: {
            id: true,
            title: true,
            projectId: true,
            project: { select: { name: true } },
          },
        },
        file: {
          select: { id: true, filename: true, mimeType: true, byteSize: true },
        },
      },
    }),
    prisma.agencyOnboardingFileSubmission.findMany({
      where: {
        supersededAt: null,
        onboarding: { projectId: { in: projectIds } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        createdAt: true,
        submittedByPortalUser: { select: { email: true } },
        onboarding: {
          select: {
            projectId: true,
            project: { select: { name: true } },
          },
        },
        projectFile: {
          select: { id: true, filename: true, mimeType: true, byteSize: true },
        },
      },
    }),
    prisma.agencyChangeRequestFile.findMany({
      where: {
        clientVisible: true,
        changeRequest: { projectId: { in: projectIds } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        submittedByPortalUser: { select: { email: true } },
        changeRequest: {
          select: {
            projectId: true,
            project: { select: { name: true } },
          },
        },
        projectFile: {
          select: { id: true, filename: true, mimeType: true, byteSize: true },
        },
      },
    }),
  ]);

  for (const v of deliverableFiles) {
    if (!v.file) continue;
    items.push({
      id: `dv-${v.id}`,
      name: v.file.filename,
      mimeType: v.file.mimeType,
      byteSize: v.file.byteSize,
      projectId: v.deliverable.projectId,
      projectName: v.deliverable.project.name,
      category: "Deliverables",
      uploadedByLabel: "Smartlance",
      uploadedAt: v.createdAt,
      sourceType: "DELIVERABLE",
      downloadHref: `/api/agency/files/${v.file.id}`,
      isDeliveredByAgency: true,
    });
  }

  for (const s of onboardingFiles) {
    items.push({
      id: `ob-${s.id}`,
      name: s.projectFile.filename,
      mimeType: s.projectFile.mimeType,
      byteSize: s.projectFile.byteSize,
      projectId: s.onboarding.projectId,
      projectName: s.onboarding.project.name,
      category: categorizeFile(s.projectFile.filename, s.projectFile.mimeType),
      uploadedByLabel: s.submittedByPortalUser?.email ?? "You",
      uploadedAt: s.createdAt,
      sourceType: "ONBOARDING",
      downloadHref: `/api/agency/files/${s.projectFile.id}`,
      isDeliveredByAgency: false,
    });
  }

  for (const f of changeFiles) {
    items.push({
      id: `crf-${f.id}`,
      name: f.projectFile.filename,
      mimeType: f.projectFile.mimeType,
      byteSize: f.projectFile.byteSize,
      projectId: f.changeRequest.projectId,
      projectName: f.changeRequest.project.name,
      category: categorizeFile(f.projectFile.filename, f.projectFile.mimeType),
      uploadedByLabel: f.submittedByPortalUser?.email ?? "You",
      uploadedAt: f.createdAt,
      sourceType: "CHANGE_REQUEST",
      downloadHref: `/api/agency/files/${f.projectFile.id}`,
      isDeliveredByAgency: false,
    });
  }

  let filtered = items;
  if (input.category) filtered = filtered.filter((f) => f.category === input.category);
  if (input.q?.trim()) {
    const q = input.q.trim().toLowerCase();
    filtered = filtered.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.projectName.toLowerCase().includes(q),
    );
  }

  filtered.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  return filtered.slice(0, input.limit ?? 100);
}
