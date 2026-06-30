import JSZip from "jszip";

import { exportUserData } from "../../../../lib/server/memory";
import { requireUserFromRequest } from "../../../../lib/server/appwrite";

export async function POST(request) {
  const auth = await requireUserFromRequest(request);
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const exported = await exportUserData(auth.user.$id);
    const zip = new JSZip();

    zip.file("nexa_export.jsonl", exported.jsonl || "");
    zip.file("profile.json", JSON.stringify(exported.memory, null, 2));
    zip.file("preferences.json", JSON.stringify(exported.preferences, null, 2));
    zip.file("conversations.json", JSON.stringify(exported.conversations, null, 2));
    zip.file("messages.json", JSON.stringify(exported.messages, null, 2));

    const blob = await zip.generateAsync({ type: "nodebuffer" });

    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="nexa-data-export.zip"',
      },
    });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to export data." },
      { status: 500 },
    );
  }
}
