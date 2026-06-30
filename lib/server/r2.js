import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID || "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
export const r2BucketName = process.env.R2_BUCKET_NAME || "";

function getR2Endpoint() {
  if (!accountId) {
    return "";
  }

  return `https://${accountId}.r2.cloudflarestorage.com`;
}

export function ensureR2Config() {
  const missing = [];

  if (!accountId) missing.push("R2_ACCOUNT_ID");
  if (!accessKeyId) missing.push("R2_ACCESS_KEY_ID");
  if (!secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
  if (!r2BucketName) missing.push("R2_BUCKET_NAME");

  if (missing.length > 0) {
    throw new Error(`Missing R2 config: ${missing.join(", ")}`);
  }
}

function createR2Client() {
  ensureR2Config();

  return new S3Client({
    region: "auto",
    endpoint: getR2Endpoint(),
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function uploadR2Object({ key, body, contentType }) {
  const client = createR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: r2BucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function createSignedDownloadUrl(key, expiresIn = 3600) {
  const client = createR2Client();
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: r2BucketName,
      Key: key,
    }),
    { expiresIn },
  );
}
