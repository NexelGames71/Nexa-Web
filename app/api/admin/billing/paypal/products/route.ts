import { requireAdminFromRequest } from "../../../../../../lib/server/appwrite";
import { createPayPalProduct } from "../../../../../../lib/server/paypal";

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();

    if (!name || !description) {
      return Response.json({ error: "Product name and description are required." }, { status: 400 });
    }

    const product = await createPayPalProduct({ name, description });
    return Response.json({ product });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to create PayPal product." },
      { status: error?.status || 500 },
    );
  }
}
