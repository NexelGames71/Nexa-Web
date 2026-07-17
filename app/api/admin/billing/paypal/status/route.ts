import { requireAdminFromRequest } from "../../../../../../lib/server/appwrite";
import { getIdentityPayPalStatus } from "../../../../../../lib/server/identity-billing";

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  return Response.json({ paypal: await getIdentityPayPalStatus() });
}
