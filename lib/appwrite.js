import { Account, Client, ID } from "appwrite";

const endpoint =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://sgp.cloud.appwrite.io/v1";
const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";

export const appwriteConfigured = Boolean(project);

const client = new Client();
client.setEndpoint(endpoint);

if (project) {
  client.setProject(project);
}

export const account = new Account(client);

export function isAdminEmail(email) {
  const [localPart] = String(email || "").trim().toLowerCase().split("@");
  return localPart.startsWith("admin.");
}

export async function createSessionJwt() {
  const jwt = await account.createJWT();
  return jwt.jwt;
}

export { ID };
