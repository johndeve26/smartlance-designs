export type MediaStorageProviderName = "local" | "s3";

export type UploadInput = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  contentType?: string;
};

export type UploadedObject = {
  storageKey: string;
  publicUrl: string;
  byteSize: number;
  contentType: string;
};

export type StoredObjectMetadata = {
  storageKey: string;
  byteSize: number;
  contentType?: string;
  lastModified?: Date;
};

export interface MediaStorageProvider {
  readonly name: MediaStorageProviderName;
  upload(input: UploadInput & { storageKey: string }): Promise<UploadedObject>;
  delete(storageKey: string): Promise<void>;
  getPublicUrl(storageKey: string): string;
  getMetadata(storageKey: string): Promise<StoredObjectMetadata | null>;
}
