import { requireUserFromRequest } from "../../../../lib/server/appwrite";
import { getUsageSummary } from "../../../../lib/server/plan-usage";

export async function GET(request: Request) {
  const auth = await requireUserFromRequest(request);
  if ((auth as any).error) {
    return Response.json({ error: (auth as any).error }, { status: (auth as any).status });
  }

  try {
    const usage = await getUsageSummary((auth as any).user.$id);
    return Response.json(usage);
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to load plan usage." },
      { status: 500 },
    );
  }
}
