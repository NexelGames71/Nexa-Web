import { requireUserFromRequest } from "../../../../../lib/server/appwrite";

export async function POST(request: Request) {
  const auth = await requireUserFromRequest(request);
  if ((auth as any).error) {
    return Response.json({ error: (auth as any).error }, { status: (auth as any).status });
  }

  return Response.json(
    {
      error: "PayPal subscription confirmation is owned by Nexa Identity. Web reads the resulting account state from Identity.",
    },
    { status: 410 },
  );
}
