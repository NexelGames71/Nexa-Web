import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID || "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
export const r2BucketName = process.env.R2_BUCKET_NAME || "";
export const r2UserStorageBucketName = process.env.R2_USER_STORAGE_BUCKET_NAME || "";
export const r2TrainingExportsBucketName =
  process.env.R2_TRAINING_EXPORTS_BUCKET_NAME || process.env.R2_BUCKET_NAME || "";

function getR2Endpoint() {
  if (!accountId) {
    return "";
  }

  return `https://${accountId}.r2.cloudflarestorage.com`;
}

export function ensureR2Config(bucketName = r2BucketName, bucketEnvName = "R2_BUCKET_NAME") {
  const missing = [];

  if (!accountId) missing.push("R2_ACCOUNT_ID");
  if (!accessKeyId) missing.push("R2_ACCESS_KEY_ID");
  if (!secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
  if (!bucketName) missing.push(bucketEnvName);

  if (missing.length > 0) {
    throw new Error(`Missing R2 config: ${missing.join(", ")}`);
  }
}

function createR2Client(bucketName = r2BucketName, bucketEnvName = "R2_BUCKET_NAME") {
  ensureR2Config(bucketName, bucketEnvName);

  return new S3Client({
    region: "auto",
    endpoint: getR2Endpoint(),
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function uploadR2Object({
  key,
  body,
  contentType,
  bucketName = r2BucketName,
  bucketEnvName = "R2_BUCKET_NAME",
}) {
  const client = createR2Client(bucketName, bucketEnvName);
  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function createSignedDownloadUrl(
  key,
  expiresIn = 3600,
  bucketName = r2BucketName,
  bucketEnvName = "R2_BUCKET_NAME",
) {
  const client = createR2Client(bucketName, bucketEnvName);
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    }),
    { expiresIn },
  );
}
