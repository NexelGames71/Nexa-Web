import { requireAdminFromRequest } from "../../../../../../lib/server/appwrite";

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  return Response.json(
    {
      error: "PayPal plans are managed by Nexa Identity. Run npm.cmd run paypal:create-plans in C:\\Nexa Identity.",
    },
    { status: 410 },
  );
}
