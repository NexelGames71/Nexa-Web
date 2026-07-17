export async function POST(request: Request) {
  return Response.json(
    {
      error: "PayPal webhooks are owned by Nexa Identity. Configure the PayPal webhook URL against the Identity deployment.",
    },
    { status: 410 },
  );
}
