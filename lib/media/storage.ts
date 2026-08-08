import { mkdir, unlink, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type {
  MediaStorageProvider,
  MediaStorageProviderName,
  StoredObjectMetadata,
  UploadInput,
  UploadedObject,
} from "@/lib/media/types";

const LOCAL_ROOT = path.join(process.cwd(), "storage", "media");

function isProductionLike() {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  );
}

class LocalMediaStorage implements MediaStorageProvider {
  readonly name: MediaStorageProviderName = "local";

  constructor() {
    if (isProductionLike() && process.env.MEDIA_ALLOW_LOCAL_IN_PRODUCTION !== "1") {
      throw new Error(
        "Local media storage is development-only. Configure S3-compatible storage (MEDIA_STORAGE_PROVIDER=s3).",
      );
    }
  }

  getPublicUrl(storageKey: string): string {
    const base =
      process.env.MEDIA_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
      "/api/media";
    return `${base}/${storageKey.split("/").map(encodeURIComponent).join("/")}`;
  }

  async upload(
    input: UploadInput & { storageKey: string },
  ): Promise<UploadedObject> {
    const full = path.join(LOCAL_ROOT, input.storageKey);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, input.buffer);
    return {
      storageKey: input.storageKey,
      publicUrl: this.getPublicUrl(input.storageKey),
      byteSize: input.buffer.byteLength,
      contentType: input.contentType || input.mimeType,
    };
  }

  async delete(storageKey: string): Promise<void> {
    const full = path.join(LOCAL_ROOT, storageKey);
    try {
      await unlink(full);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") throw err;
    }
  }

  async getMetadata(storageKey: string): Promise<StoredObjectMetadata | null> {
    try {
      const info = await stat(path.join(LOCAL_ROOT, storageKey));
      return {
        storageKey,
        byteSize: info.size,
        lastModified: info.mtime,
      };
    } catch {
      return null;
    }
  }
}

class S3MediaStorage implements MediaStorageProvider {
  readonly name: MediaStorageProviderName = "s3";
  private client: S3Client;
  private bucket: string;
  private publicBase: string;

  constructor() {
    const endpoint = process.env.MEDIA_S3_ENDPOINT;
    const region = process.env.MEDIA_S3_REGION || "auto";
    const accessKeyId = process.env.MEDIA_S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.MEDIA_S3_SECRET_ACCESS_KEY;
    this.bucket = process.env.MEDIA_S3_BUCKET || "";
    this.publicBase =
      process.env.MEDIA_PUBLIC_BASE_URL?.replace(/\/$/, "") || "";

    if (!this.bucket || !accessKeyId || !secretAccessKey || !this.publicBase) {
      throw new Error(
        "S3 media storage requires MEDIA_S3_BUCKET, MEDIA_S3_ACCESS_KEY_ID, MEDIA_S3_SECRET_ACCESS_KEY, MEDIA_PUBLIC_BASE_URL",
      );
    }

    this.client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      forcePathStyle: process.env.MEDIA_S3_FORCE_PATH_STYLE === "1",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  getPublicUrl(storageKey: string): string {
    return `${this.publicBase}/${storageKey
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`;
  }

  async upload(
    input: UploadInput & { storageKey: string },
  ): Promise<UploadedObject> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.storageKey,
        Body: input.buffer,
        ContentType: input.contentType || input.mimeType,
        ContentDisposition: "inline",
      }),
    );
    return {
      storageKey: input.storageKey,
      publicUrl: this.getPublicUrl(input.storageKey),
      byteSize: input.buffer.byteLength,
      contentType: input.contentType || input.mimeType,
    };
  }

  async delete(storageKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      }),
    );
  }

  async getMetadata(storageKey: string): Promise<StoredObjectMetadata | null> {
    try {
      const head = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
        }),
      );
      return {
        storageKey,
        byteSize: head.ContentLength ?? 0,
        contentType: head.ContentType,
        lastModified: head.LastModified,
      };
    } catch {
      return null;
    }
  }
}

let cached: MediaStorageProvider | null = null;

export function getConfiguredStorageProviderName(): MediaStorageProviderName {
  const raw = (process.env.MEDIA_STORAGE_PROVIDER || "local").toLowerCase();
  if (raw === "s3" || raw === "r2" || raw === "s3-compatible") return "s3";
  return "local";
}

export function isMediaStorageConfigured(): boolean {
  try {
    getMediaStorage();
    return true;
  } catch {
    return false;
  }
}

export function getMediaStorage(): MediaStorageProvider {
  if (cached) return cached;
  const name = getConfiguredStorageProviderName();
  if (name === "s3") {
    cached = new S3MediaStorage();
  } else {
    if (isProductionLike() && process.env.MEDIA_ALLOW_LOCAL_IN_PRODUCTION !== "1") {
      throw new Error(
        "Production media uploads require MEDIA_STORAGE_PROVIDER=s3 (or MEDIA_ALLOW_LOCAL_IN_PRODUCTION=1 for explicit override).",
      );
    }
    cached = new LocalMediaStorage();
  }
  return cached;
}

/** Test helper */
export function resetMediaStorageCache() {
  cached = null;
}
