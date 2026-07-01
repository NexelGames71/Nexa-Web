import { ID } from "node-appwrite";

import {
  adminAuditLogsCollectionId,
  createAdminDatabases,
  databaseId,
} from "./appwrite";

function safeJson(value, maxLength = 7800) {
  const json = JSON.stringify(value || {});
  return json.length <= maxLength ? json : json.slice(0, maxLength);
}

export async function createAdminAuditLog({
  adminId = "system",
  action,
  targetType,
  targetId = "",
  metadata = {},
}) {
  if (!action || !targetType) {
    return null;
  }

  const databases = createAdminDatabases();
  const now = new Date().toISOString();
  const logId = `audit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    return await databases.createDocument(
      databaseId,
      adminAuditLogsCollectionId,
      ID.unique(),
      {
        logId,
        adminId,
        action,
        targetType,
        targetId: String(targetId || ""),
        metadata: safeJson(metadata),
        createdAt: now,
      },
    );
  } catch (error) {
    console.warn("Admin audit log write failed:", error?.message || error);
    return null;
  }
}
