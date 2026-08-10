import type { AdminRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { can } from "@/lib/admin/rbac";
import {
  AGENCY_FILE_MAX_BYTES,
  isAllowedAgencyUpload,
} from "@/lib/agency/constants";
import {
  buildAgencyStorageKey,
  buildContentDisposition,
  deleteAgencyPrivateObject,
  getAgencyPrivateSignedDownloadUrl,
  getAgencyPrivateStorageDriver,
  isInlineSafeMime,
  putAgencyPrivateObject,
  readAgencyPrivateObject,
  statAgencyPrivateObject,
  streamLocalAgencyFile,
  validateAgencyPrivateStorageConfig,
} from "@/lib/agency/private-storage";
import { hasProjectAccess } from "@/lib/portal/access";

export type AgencyFileUploadInput = {
  projectId: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
  createdById: string;
  versionId?: string | null;
};

export type AgencyStoredFile = {
  id: string;
  storageKey: string;
  storageProvider: string;
  filename: string;
  mimeType: string;
  byteSize: number;
};

export function assertAgencyUploadAllowed(input: {
  filename: string;
  mimeType: string;
  byteSize: number;
}) {
  if (input.byteSize > AGENCY_FILE_MAX_BYTES) {
    throw new Error(`File exceeds maximum size of ${AGENCY_FILE_MAX_BYTES / (1024 * 1024)} MB.`);
  }
  if (!isAllowedAgencyUpload(input.filename, input.mimeType)) {
    throw new Error("File type is not permitted for project uploads.");
  }
}

export async function uploadAgencyFile(input: AgencyFileUploadInput): Promise<AgencyStoredFile> {
  validateAgencyPrivateStorageConfig({ throwOnError: true });
  assertAgencyUploadAllowed({
    filename: input.filename,
    mimeType: input.mimeType,
    byteSize: input.buffer.byteLength,
  });

  await prisma.agencyProject.findUniqueOrThrow({ where: { id: input.projectId } });

  const storageKey = buildAgencyStorageKey(input.projectId, input.filename);
  const stored = await putAgencyPrivateObject({
    storageKey,
    buffer: input.buffer,
    mimeType: input.mimeType,
  });

  const file = await prisma.agencyProjectFile.create({
    data: {
      projectId: input.projectId,
      versionId: input.versionId ?? null,
      filename: input.filename,
      mimeType: input.mimeType,
      byteSize: stored.byteSize,
      storageProvider: stored.storageProvider,
      storageKey,
      createdById: input.createdById,
    },
  });

  return {
    id: file.id,
    storageKey: file.storageKey,
    storageProvider: file.storageProvider,
    filename: file.filename,
    mimeType: file.mimeType,
    byteSize: file.byteSize,
  };
}

export async function readAgencyFile(fileId: string): Promise<{
  file: AgencyStoredFile;
  buffer: Buffer;
}> {
  const file = await prisma.agencyProjectFile.findUniqueOrThrow({
    where: { id: fileId },
  });

  const { buffer } = await readAgencyPrivateObject(file.storageKey, file.storageProvider);

  return {
    file: {
      id: file.id,
      storageKey: file.storageKey,
      storageProvider: file.storageProvider,
      filename: file.filename,
      mimeType: file.mimeType,
      byteSize: file.byteSize,
    },
    buffer,
  };
}

export async function deleteAgencyFile(fileId: string) {
  const file = await prisma.agencyProjectFile.findUniqueOrThrow({
    where: { id: fileId },
  });

  try {
    await deleteAgencyPrivateObject(file.storageKey, file.storageProvider);
  } catch {
    // DB row removed even if object cleanup fails; operator can reconcile orphans.
  }

  await prisma.agencyProjectFile.delete({ where: { id: fileId } });
}

export async function getAgencyFileMetadata(fileId: string) {
  const file = await prisma.agencyProjectFile.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      projectId: true,
      filename: true,
      mimeType: true,
      byteSize: true,
      storageProvider: true,
      storageKey: true,
      createdAt: true,
    },
  });
  if (!file) return null;

  const meta = await statAgencyPrivateObject(file.storageKey, file.storageProvider);
  return meta ? { ...file, lastModified: meta.lastModified ?? null } : file;
}

export async function canAccessAgencyFile(input: {
  fileId: string;
  adminRole?: AdminRole | null;
  portalUserId?: string | null;
}) {
  const file = await prisma.agencyProjectFile.findUnique({
    where: { id: input.fileId },
  });
  if (!file) {
    return { ok: false as const, file: null };
  }

  if (input.adminRole && can(input.adminRole, "view_projects")) {
    return { ok: true as const, file };
  }

  if (input.portalUserId) {
    const allowed = await hasProjectAccess({
      projectId: file.projectId,
      portalUserId: input.portalUserId,
    });
    if (allowed) {
      return { ok: true as const, file };
    }

    const supportFile = await prisma.agencySupportRequestFile.findFirst({
      where: {
        projectFileId: file.id,
        clientVisible: true,
        supportRequest: {
          submittedByPortalUserId: input.portalUserId,
        },
      },
      select: { id: true },
    });
    if (supportFile) {
      return { ok: true as const, file };
    }

    const supportFileViaWebsite = await prisma.agencySupportRequestFile.findFirst({
      where: {
        projectFileId: file.id,
        clientVisible: true,
        supportRequest: {
          website: {
            clientAccess: {
              some: {
                portalUserId: input.portalUserId,
                revokedAt: null,
              },
            },
          },
        },
      },
      select: { id: true },
    });
    if (supportFileViaWebsite) {
      return { ok: true as const, file };
    }
  }

  return { ok: false as const, file: null };
}

export async function resolveAgencyFileDownload(input: {
  fileId: string;
  adminRole?: AdminRole | null;
  portalUserId?: string | null;
}) {
  const access = await canAccessAgencyFile(input);
  if (!access.ok || !access.file) {
    return { ok: false as const, reason: "forbidden" as const };
  }

  const file = access.file;

  if (file.storageProvider === "s3" && getAgencyPrivateStorageDriver() === "s3") {
    const signedUrl = await getAgencyPrivateSignedDownloadUrl({
      storageKey: file.storageKey,
      filename: file.filename,
      mimeType: file.mimeType,
    });
    if (signedUrl) {
      return { ok: true as const, kind: "redirect" as const, url: signedUrl };
    }
  }

  const { buffer } = await readAgencyPrivateObject(file.storageKey, file.storageProvider);
  return {
    ok: true as const,
    kind: "buffer" as const,
    buffer,
    mimeType: file.mimeType,
    filename: file.filename,
    byteSize: file.byteSize,
    inline: isInlineSafeMime(file.mimeType),
  };
}

export async function resolveAgencyFilePath(storageKey: string) {
  const file = await prisma.agencyProjectFile.findUnique({
    where: { storageKey },
  });
  if (!file) {
    throw new Error("File not found.");
  }

  if (file.storageProvider === "local") {
    const { buffer } = await readAgencyPrivateObject(file.storageKey, file.storageProvider);
    return { full: null as string | null, byteSize: buffer.byteLength, buffer };
  }

  const { buffer } = await readAgencyPrivateObject(file.storageKey, file.storageProvider);
  return { full: null as string | null, byteSize: buffer.byteLength, buffer };
}

export function streamAgencyFile(fullPath: string) {
  return streamLocalAgencyFile(fullPath);
}

export { buildContentDisposition, validateAgencyPrivateStorageConfig };
