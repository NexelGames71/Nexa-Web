import { requireAdminFromRequest } from "../../../../../../lib/server/appwrite";
import { getPayPalStatus } from "../../../../../../lib/server/paypal";

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  return Response.json({ paypal: getPayPalStatus() });
}
