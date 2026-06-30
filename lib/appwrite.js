import { Account, Client, ID } from "appwrite";

const endpoint =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://sgp.cloud.appwrite.io/v1";
const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
const publicAdminEmails = (process.env.NEXT_PUBLIC_APPWRITE_ADMIN_EMAILS || "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export const appwriteConfigured = Boolean(project);

const client = new Client();
client.setEndpoint(endpoint);

if (project) {
  client.setProject(project);
}

export const account = new Account(client);

export function isAdminEmail(email) {
  return publicAdminEmails.includes(String(email || "").trim().toLowerCase());
}

export async function createSessionJwt() {
  const jwt = await account.createJWT();
  return jwt.jwt;
}

export { ID };
