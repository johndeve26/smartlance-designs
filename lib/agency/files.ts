import { createReadStream } from "node:fs";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { AdminRole } from "@prisma/client";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { prisma } from "@/lib/db";
import { can } from "@/lib/admin/rbac";
import { AGENCY_PRIVATE_STORAGE_PREFIX } from "@/lib/agency/constants";
import { hasProjectAccess } from "@/lib/portal/access";

const LOCAL_ROOT = path.join(process.cwd(), "storage", "agency", "private");

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

function isProductionLike() {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  );
}

function getConfiguredProviderName(): "local" | "s3" {
  const raw = (process.env.AGENCY_STORAGE_PROVIDER || process.env.MEDIA_STORAGE_PROVIDER || "local").toLowerCase();
  if (raw === "s3" || raw === "r2" || raw === "s3-compatible") return "s3";
  return "local";
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "file";
}

function buildStorageKey(projectId: string, filename: string) {
  const safeName = sanitizeFilename(filename);
  const unique = randomBytes(8).toString("hex");
  return `${AGENCY_PRIVATE_STORAGE_PREFIX}/${projectId}/${unique}-${safeName}`;
}

let s3Client: S3Client | null = null;

function getS3Client() {
  if (s3Client) return s3Client;
  const endpoint = process.env.AGENCY_S3_ENDPOINT || process.env.MEDIA_S3_ENDPOINT;
  const region = process.env.AGENCY_S3_REGION || process.env.MEDIA_S3_REGION || "auto";
  const accessKeyId = process.env.AGENCY_S3_ACCESS_KEY_ID || process.env.MEDIA_S3_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.AGENCY_S3_SECRET_ACCESS_KEY || process.env.MEDIA_S3_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("S3 agency storage requires access key credentials.");
  }

  s3Client = new S3Client({
    region,
    endpoint: endpoint || undefined,
    forcePathStyle:
      process.env.AGENCY_S3_FORCE_PATH_STYLE === "1" ||
      process.env.MEDIA_S3_FORCE_PATH_STYLE === "1",
    credentials: { accessKeyId, secretAccessKey },
  });
  return s3Client;
}

function getS3Bucket() {
  const bucket = process.env.AGENCY_S3_BUCKET || process.env.MEDIA_S3_BUCKET;
  if (!bucket) throw new Error("S3 agency storage requires AGENCY_S3_BUCKET or MEDIA_S3_BUCKET.");
  return bucket;
}

async function uploadToLocal(storageKey: string, buffer: Buffer) {
  if (isProductionLike() && process.env.AGENCY_ALLOW_LOCAL_IN_PRODUCTION !== "1") {
    throw new Error(
      "Local agency file storage is development-only. Configure S3-compatible storage.",
    );
  }
  const full = path.join(LOCAL_ROOT, storageKey.replace(`${AGENCY_PRIVATE_STORAGE_PREFIX}/`, ""));
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, buffer);
}

async function readFromLocal(storageKey: string) {
  const full = path.join(LOCAL_ROOT, storageKey.replace(`${AGENCY_PRIVATE_STORAGE_PREFIX}/`, ""));
  return readFile(full);
}

async function deleteFromLocal(storageKey: string) {
  const full = path.join(LOCAL_ROOT, storageKey.replace(`${AGENCY_PRIVATE_STORAGE_PREFIX}/`, ""));
  try {
    await unlink(full);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw err;
  }
}

async function uploadToS3(storageKey: string, buffer: Buffer, mimeType: string) {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getS3Bucket(),
      Key: storageKey,
      Body: buffer,
      ContentType: mimeType,
    }),
  );
}

async function readFromS3(storageKey: string) {
  const response = await getS3Client().send(
    new GetObjectCommand({
      Bucket: getS3Bucket(),
      Key: storageKey,
    }),
  );
  const body = response.Body;
  if (!body) throw new Error("Empty S3 object body.");
  return Buffer.from(await body.transformToByteArray());
}

async function deleteFromS3(storageKey: string) {
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: getS3Bucket(),
      Key: storageKey,
    }),
  );
}

export async function uploadAgencyFile(input: AgencyFileUploadInput): Promise<AgencyStoredFile> {
  await prisma.agencyProject.findUniqueOrThrow({ where: { id: input.projectId } });

  const storageProvider = getConfiguredProviderName();
  const storageKey = buildStorageKey(input.projectId, input.filename);

  if (storageProvider === "s3") {
    await uploadToS3(storageKey, input.buffer, input.mimeType);
  } else {
    await uploadToLocal(storageKey, input.buffer);
  }

  const file = await prisma.agencyProjectFile.create({
    data: {
      projectId: input.projectId,
      versionId: input.versionId ?? null,
      filename: input.filename,
      mimeType: input.mimeType,
      byteSize: input.buffer.byteLength,
      storageProvider,
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

  const buffer =
    file.storageProvider === "s3"
      ? await readFromS3(file.storageKey)
      : await readFromLocal(file.storageKey);

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

  if (file.storageProvider === "s3") {
    await deleteFromS3(file.storageKey);
  } else {
    await deleteFromLocal(file.storageKey);
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

  if (file.storageProvider === "local") {
    try {
      const info = await stat(
        path.join(LOCAL_ROOT, file.storageKey.replace(`${AGENCY_PRIVATE_STORAGE_PREFIX}/`, "")),
      );
      return { ...file, lastModified: info.mtime };
    } catch {
      return file;
    }
  }

  try {
    const head = await getS3Client().send(
      new HeadObjectCommand({
        Bucket: getS3Bucket(),
        Key: file.storageKey,
      }),
    );
    return { ...file, lastModified: head.LastModified ?? null };
  } catch {
    return file;
  }
}

function localFilePath(storageKey: string) {
  return path.join(LOCAL_ROOT, storageKey.replace(`${AGENCY_PRIVATE_STORAGE_PREFIX}/`, ""));
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
  }

  return { ok: false as const, file: null };
}

export async function resolveAgencyFilePath(storageKey: string) {
  const file = await prisma.agencyProjectFile.findUnique({
    where: { storageKey },
  });
  if (!file) {
    throw new Error("File not found.");
  }

  if (file.storageProvider === "s3") {
    const buffer = await readFromS3(storageKey);
    const tempRoot = path.join(LOCAL_ROOT, ".stream-cache");
    await mkdir(tempRoot, { recursive: true });
    const full = path.join(tempRoot, `${file.id}-${path.basename(storageKey)}`);
    await writeFile(full, buffer);
    return { full, byteSize: buffer.byteLength };
  }

  const full = localFilePath(storageKey);
  const info = await stat(full);
  return { full, byteSize: info.size };
}

export function streamAgencyFile(fullPath: string) {
  return createReadStream(fullPath);
}
