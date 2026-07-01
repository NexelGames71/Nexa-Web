import { requireAdminFromRequest } from "../../../../../../lib/server/appwrite";
import { createPayPalPlan } from "../../../../../../lib/server/paypal";

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const productId = String(body.productId || "").trim();
    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    const amount = String(body.amount || "").trim();
    const currency = String(body.currency || "USD").trim().toUpperCase();

    if (!productId || !name || !description || !amount) {
      return Response.json(
        { error: "Product ID, plan name, description, and amount are required." },
        { status: 400 },
      );
    }

    const plan = await createPayPalPlan({ productId, name, description, amount, currency });
    return Response.json({ plan });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to create PayPal plan." },
      { status: error?.status || 500 },
    );
  }
}
