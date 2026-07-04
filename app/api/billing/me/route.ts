import { requireUserFromRequest } from "../../../../lib/server/appwrite";
import { getBillingProfileForUser } from "../../../../lib/server/billing";

export async function GET(request: Request) {
  const auth = await requireUserFromRequest(request);
  if ((auth as any).error) {
    return Response.json({ error: (auth as any).error }, { status: (auth as any).status });
  }

  try {
    const billingProfile = await getBillingProfileForUser((auth as any).user.$id);
    return Response.json(billingProfile);
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to load billing profile." },
      { status: 500 },
    );
  }
}
