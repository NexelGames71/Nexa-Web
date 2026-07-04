import { getUserMemory, upsertUserMemory } from "../../../lib/server/memory";
import { requireUserFromRequest } from "../../../lib/server/appwrite";
import { PLAN_USAGE_METRICS } from "../../../lib/plan-limits";
import {
  checkAbsolutePlanLimit,
  planLimitResponse,
  setPlanUsage,
} from "../../../lib/server/plan-usage";

function countMemoryItems(input = {}) {
  const interests = Array.isArray(input.interests)
    ? input.interests
    : String(input.interests || "").split(",");
  const facts = Array.isArray(input.facts) ? input.facts : [];
  return [
    input.displayName,
    input.preferredTone,
    input.customInstructions,
    ...interests,
    ...facts,
  ].filter((value) => String(value || "").trim()).length;
}

export async function GET(request) {
  const auth = await requireUserFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const memory = await getUserMemory(auth.user.$id);
    return Response.json({ memory });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to load memory." },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  const auth = await requireUserFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const memoryItemCount = countMemoryItems(body);
    const memoryLimit = await checkAbsolutePlanLimit(
      auth.user.$id,
      PLAN_USAGE_METRICS.MEMORY_ITEMS,
      memoryItemCount,
    );
    if (!memoryLimit.allowed) {
      return planLimitResponse(memoryLimit);
    }
    const memory = await upsertUserMemory(auth.user.$id, body);
    await setPlanUsage(auth.user.$id, PLAN_USAGE_METRICS.MEMORY_ITEMS, memoryItemCount);
    return Response.json({ memory });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to save memory." },
      { status: 500 },
    );
  }
}
