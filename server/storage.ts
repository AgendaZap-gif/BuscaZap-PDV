/**
 * Storage (S3) - DISABLED
 * 
 * This module was previously using Manus Forge API as a proxy.
 * To re-enable, use AWS S3 SDK directly (already installed: @aws-sdk/client-s3).
 * 
 * Original backup: storage.ts.backup
 * 
 * Example integration:
 * 
 * import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
 * import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
 * 
 * const s3Client = new S3Client({
 *   region: process.env.AWS_REGION,
 *   credentials: {
 *     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
 *     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
 *   },
 * });
 * 
 * // Upload file
 * await s3Client.send(new PutObjectCommand({
 *   Bucket: "your-bucket",
 *   Key: "file-key",
 *   Body: fileBuffer,
 * }));
 * 
 * // Get presigned URL
 * const url = await getSignedUrl(s3Client, new GetObjectCommand({
 *   Bucket: "your-bucket",
 *   Key: "file-key",
 * }), { expiresIn: 3600 });
 */

export interface UploadOptions {
  bucket?: string;
  key: string;
  body: Buffer | string;
  contentType?: string;
}

export interface PresignedUrlOptions {
  bucket?: string;
  key: string;
  expiresIn?: number;
}

export async function uploadFile(options: UploadOptions): Promise<string> {
  throw new Error("Storage is disabled. Please integrate with AWS S3 directly using @aws-sdk/client-s3.");
}

export async function getPresignedUrl(options: PresignedUrlOptions): Promise<string> {
  throw new Error("Storage is disabled. Please integrate with AWS S3 directly using @aws-sdk/client-s3.");
}

export async function deleteFile(key: string): Promise<void> {
  throw new Error("Storage is disabled. Please integrate with AWS S3 directly using @aws-sdk/client-s3.");
}
