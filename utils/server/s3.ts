import "server-only";
import { S3Client } from "@aws-sdk/client-s3";

// AWS_S3_ENDPOINT is optional: set it to use an S3-compatible store
// (e.g. Cloudflare R2: https://<account_id>.r2.cloudflarestorage.com, region "auto").
export const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION as string,
  ...(process.env.AWS_S3_ENDPOINT ? { endpoint: process.env.AWS_S3_ENDPOINT } : {}),
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY as string,
  },
});

export const s3Bucket = process.env.AWS_S3_BUCKET_NAME as string;

export const RAFFLES_PREFIX = "raffles/";
