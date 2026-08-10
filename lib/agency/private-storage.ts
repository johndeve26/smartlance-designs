import { createReadStream } from "node:fs";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AGENCY_PRIVATE_STORAGE_PREFIX } from "@/lib/agency/constants";

const LOCAL_ROOT = path.join(process.cwd(), "storage", "agency", "private");
const SIGNED_URL_TTL_SECONDS = 10 * 60;

export type AgencyPrivateStorageDriver = "local" | "s3";

export type StoredObjectMeta = {
  storageKey: string;
  byteSize: number;
  contentType?: string;
  lastModified?: Date;
};

function isProductionLike() {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  );
}

export function getAgencyPrivateStorageDriver(): AgencyPrivateStorageDriver {
  const raw = (
    process.env.AGENCY_PRIVATE_STORAGE_DRIVER ||
    process.env.AGENCY_STORAGE_PROVIDER ||
    process.env.MEDIA_STORAGE_PROVIDER ||
    "local"
  ).toLowerCase();
  if (raw === "s3" || raw === "r2" || raw === "s3-compatible") return "s3";
  return "local";
}

export function validateAgencyPrivateStorageConfig(options?: {
  throwOnError?: boolean;
}): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  const driver = getAgencyPrivateStorageDriver();

  if (isProductionLike()) {
    if (driver !== "s3") {
      issues.push(
        "Production requires AGENCY_PRIVATE_STORAGE_DRIVER=s3 (local disk is not permitted).",
      );
    } else {
      const bucket = process.env.AGENCY_S3_BUCKET || process.env.MEDIA_S3_BUCKET;
      const accessKeyId =
        process.env.AGENCY_S3_ACCESS_KEY_ID || process.env.MEDIA_S3_ACCESS_KEY_ID;
      const secretAccessKey =
        process.env.AGENCY_S3_SECRET_ACCESS_KEY || process.env.MEDIA_S3_SECRET_ACCESS_KEY;
      if (!bucket) issues.push("AGENCY_S3_BUCKET or MEDIA_S3_BUCKET is required in production.");
      if (!accessKeyId || !secretAccessKey) {
        issues.push("S3 access credentials are required for agency private file storage.");
      }
    }
  }

  const throwOnError = options?.throwOnError ?? isProductionLike();
  if (throwOnError && issues.length > 0) {
    throw new Error(`Agency private storage validation failed:\n${issues.join("\n")}`);
  }

  return { ok: issues.length === 0, issues };
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "file";
}

export function buildAgencyStorageKey(projectId: string, filename: string) {
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

function localPath(storageKey: string) {
  const relative = storageKey.replace(`${AGENCY_PRIVATE_STORAGE_PREFIX}/`, "");
  const resolved = path.resolve(LOCAL_ROOT, relative);
  if (!resolved.startsWith(path.resolve(LOCAL_ROOT))) {
    throw new Error("Invalid storage key.");
  }
  return resolved;
}

async function putLocal(storageKey: string, buffer: Buffer) {
  if (isProductionLike() && process.env.AGENCY_ALLOW_LOCAL_IN_PRODUCTION !== "1") {
    throw new Error(
      "Local agency file storage is development-only. Configure S3-compatible storage.",
    );
  }
  const full = localPath(storageKey);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, buffer);
}

async function getLocalBuffer(storageKey: string) {
  return readFile(localPath(storageKey));
}

async function deleteLocal(storageKey: string) {
  try {
    await unlink(localPath(storageKey));
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw err;
  }
}

async function putS3(storageKey: string, buffer: Buffer, mimeType: string) {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getS3Bucket(),
      Key: storageKey,
      Body: buffer,
      ContentType: mimeType,
    }),
  );
}

async function getS3Buffer(storageKey: string) {
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

async function deleteS3(storageKey: string) {
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: getS3Bucket(),
      Key: storageKey,
    }),
  );
}

export async function putAgencyPrivateObject(input: {
  storageKey: string;
  buffer: Buffer;
  mimeType: string;
}) {
  validateAgencyPrivateStorageConfig({ throwOnError: true });
  const driver = getAgencyPrivateStorageDriver();
  if (driver === "s3") {
    await putS3(input.storageKey, input.buffer, input.mimeType);
  } else {
    await putLocal(input.storageKey, input.buffer);
  }
  return { storageProvider: driver, byteSize: input.buffer.byteLength };
}

export async function readAgencyPrivateObject(storageKey: string, storageProvider: string) {
  validateAgencyPrivateStorageConfig({ throwOnError: true });
  if (storageProvider === "s3") {
    const buffer = await getS3Buffer(storageKey);
    return { buffer, storageProvider: "s3" as const };
  }
  const buffer = await getLocalBuffer(storageKey);
  return { buffer, storageProvider: "local" as const };
}

export async function deleteAgencyPrivateObject(storageKey: string, storageProvider: string) {
  if (storageProvider === "s3") {
    await deleteS3(storageKey);
  } else {
    await deleteLocal(storageKey);
  }
}

export async function getAgencyPrivateSignedDownloadUrl(input: {
  storageKey: string;
  filename: string;
  mimeType: string;
}) {
  validateAgencyPrivateStorageConfig({ throwOnError: true });
  if (getAgencyPrivateStorageDriver() !== "s3") {
    return null;
  }

  const command = new GetObjectCommand({
    Bucket: getS3Bucket(),
    Key: input.storageKey,
    ResponseContentDisposition: buildContentDisposition(input.filename, input.mimeType),
    ResponseContentType: input.mimeType,
  });

  return getSignedUrl(getS3Client(), command, { expiresIn: SIGNED_URL_TTL_SECONDS });
}

export function buildContentDisposition(filename: string, mimeType: string) {
  const safeName = sanitizeFilename(filename);
  const inline = isInlineSafeMime(mimeType);
  const type = inline ? "inline" : "attachment";
  return `${type}; filename="${safeName.replace(/"/g, "")}"`;
}

export function isInlineSafeMime(mimeType: string) {
  if (!mimeType) return false;
  const lower = mimeType.toLowerCase();
  if (lower.startsWith("text/html")) return false;
  if (lower.includes("javascript")) return false;
  if (lower.startsWith("application/x-")) return false;
  if (lower.startsWith("image/")) return true;
  if (lower === "application/pdf") return true;
  if (lower.startsWith("text/plain")) return true;
  return false;
}

export async function statAgencyPrivateObject(storageKey: string, storageProvider: string) {
  if (storageProvider === "s3") {
    try {
      const head = await getS3Client().send(
        new HeadObjectCommand({
          Bucket: getS3Bucket(),
          Key: storageKey,
        }),
      );
      return {
        storageKey,
        byteSize: head.ContentLength ?? 0,
        contentType: head.ContentType,
        lastModified: head.LastModified,
      } satisfies StoredObjectMeta;
    } catch {
      return null;
    }
  }

  try {
    const info = await stat(localPath(storageKey));
    return {
      storageKey,
      byteSize: info.size,
      lastModified: info.mtime,
    } satisfies StoredObjectMeta;
  } catch {
    return null;
  }
}

export function streamLocalAgencyFile(storageKey: string) {
  return createReadStream(localPath(storageKey));
}

export function getSignedUrlTtlSeconds() {
  return SIGNED_URL_TTL_SECONDS;
}
