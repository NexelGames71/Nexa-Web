import { AppwriteException, Query } from "node-appwrite";

import {
  createAdminDatabases,
  databaseId,
  promotionRewardsCollectionId,
  promotionsCollectionId,
} from "../../../lib/server/appwrite";

export const dynamic = "force-dynamic";

function parseJson(value: unknown, fallback: any) {
  if (!value) return fallback;
  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

function isMissingCollection(error: any) {
  return error instanceof AppwriteException && [400, 404].includes(Number(error.code));
}

function isVisibleNow(promotion: any, now = Date.now()) {
  if (promotion.status !== "ACTIVE") return false;
  if (!promotion.publicCampaign) return false;

  const startsAt = promotion.startsAt ? new Date(promotion.startsAt).getTime() : 0;
  const endsAt = promotion.endsAt ? new Date(promotion.endsAt).getTime() : 0;
  if (startsAt && startsAt > now) return false;
  if (endsAt && endsAt < now) return false;
  return true;
}

function publicPromotionFromDocument(document: any, rewards: any[] = []) {
  return {
    id: document.promotionId || document.$id,
    name: document.name || "Nexa promotion",
    title: document.title || document.name || "Nexa promotion",
    description: document.description || "",
    promotionType: document.promotionType || "",
    applicationMode: document.applicationMode || "CODE",
    code: document.code || "",
    startsAt: document.startsAt || "",
    endsAt: document.endsAt || "",
    priority: Number(document.priority || 0),
    rewards: rewards.map((reward) => ({
      rewardType: reward.rewardType || "",
      value: reward.value || "",
      config: parseJson(reward.config, {}),
    })),
  };
}

export async function GET() {
  try {
    const databases = createAdminDatabases();
    const records = await databases.listDocuments(databaseId, promotionsCollectionId, [
      Query.equal("status", "ACTIVE"),
      Query.orderDesc("updatedAt"),
      Query.limit(25),
    ]);

    const visible = (records.documents || [])
      .filter(isVisibleNow)
      .sort((left: any, right: any) => Number(right.priority || 0) - Number(left.priority || 0))
      .slice(0, 6);

    const promotions = await Promise.all(
      visible.map(async (promotion: any) => {
        let rewards: any[] = [];
        try {
          const rewardRecords = await databases.listDocuments(databaseId, promotionRewardsCollectionId, [
            Query.equal("promotionId", promotion.promotionId || promotion.$id),
            Query.limit(10),
          ]);
          rewards = rewardRecords.documents || [];
        } catch (error: any) {
          if (!isMissingCollection(error)) throw error;
        }
        return publicPromotionFromDocument(promotion, rewards);
      }),
    );

    return Response.json({ promotions });
  } catch (error: any) {
    if (isMissingCollection(error)) {
      return Response.json({ promotions: [] });
    }
    return Response.json({ error: error?.message || "Failed to load promotions." }, { status: 500 });
  }
}
