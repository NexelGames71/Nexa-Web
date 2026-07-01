import { ID, Query } from "node-appwrite";

import {
  createAdminDatabases,
  databaseId,
  requireAdminFromRequest,
  supportNotesCollectionId,
  supportTicketsCollectionId,
} from "../../../../lib/server/appwrite";
import { createAdminAuditLog } from "../../../../lib/server/admin-audit";

function ticketFromDocument(document: any, notes: any[]) {
  return {
    id: document.ticketId || document.$id,
    userId: document.userId || "",
    user: document.userId || "User",
    email: "",
    subject: document.subject || "Support ticket",
    message: document.message || "",
    category: document.category || "technical",
    priority: document.priority || "normal",
    status: document.status || "open",
    assignedAdmin: document.assignedAdminId || "Unassigned",
    createdAt: document.createdAt || document.$createdAt || "",
    updatedAt: document.updatedAt || document.$updatedAt || "",
    resolvedAt: document.resolvedAt || "",
    slaMinutes: 0,
    plan: "",
    subscriptionStatus: "",
    recentErrors: [],
    notes: notes
      .filter((note) => note.ticketId === (document.ticketId || document.$id))
      .map((note) => ({
        id: note.noteId || note.$id,
        adminId: note.adminId || "",
        note: note.note || "",
        visibility: note.visibility || "internal",
        createdAt: note.createdAt || note.$createdAt || "",
      })),
  };
}

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ((auth as any).error) {
    return Response.json({ error: (auth as any).error }, { status: (auth as any).status });
  }

  try {
    const databases = createAdminDatabases();
    const [tickets, notes] = await Promise.all([
      databases.listDocuments(databaseId, supportTicketsCollectionId, [
        Query.orderDesc("updatedAt"),
        Query.limit(300),
      ]),
      databases.listDocuments(databaseId, supportNotesCollectionId, [
        Query.orderDesc("createdAt"),
        Query.limit(500),
      ]),
    ]);

    return Response.json({
      items: (tickets.documents || []).map((document) => ticketFromDocument(document, notes.documents || [])),
      meta: {
        ticketCount: tickets.total || tickets.documents?.length || 0,
        noteCount: notes.total || notes.documents?.length || 0,
      },
    });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to load support operations." },
      { status: 500 },
    );
  }
}

async function findTicketDocument(ticketId: string) {
  const databases = createAdminDatabases();
  const result = await databases.listDocuments(databaseId, supportTicketsCollectionId, [
    Query.equal("ticketId", ticketId),
    Query.limit(1),
  ]);
  return result.documents[0] || null;
}

export async function POST(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ((auth as any).error) {
    return Response.json({ error: (auth as any).error }, { status: (auth as any).status });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid support action payload." }, { status: 400 });
  }

  const ticketId = String(body.ticketId || "").trim();
  const action = String(body.action || "").trim();
  if (!ticketId || !action) {
    return Response.json({ error: "ticketId and action are required." }, { status: 400 });
  }

  try {
    const databases = createAdminDatabases();
    const ticket = await findTicketDocument(ticketId);
    if (!ticket) {
      return Response.json({ error: "Support ticket not found." }, { status: 404 });
    }

    const now = new Date().toISOString();
    let result: any = ticket;

    if (action === "reply" || action === "note") {
      const note = String(body.note || "").trim();
      if (!note) {
        return Response.json({ error: "Support note is required." }, { status: 400 });
      }

      result = await databases.createDocument(
        databaseId,
        supportNotesCollectionId,
        ID.unique(),
        {
          noteId: `note_${Date.now().toString(36)}`,
          ticketId,
          adminId: (auth as any).user.$id,
          note,
          visibility: action === "reply" ? "customer" : "internal",
          createdAt: now,
        },
      );
    } else if (action === "escalate" || action === "resolve" || action === "pending") {
      const nextStatus = action === "resolve" ? "resolved" : action === "pending" ? "pending" : "escalated";
      result = await databases.updateDocument(
        databaseId,
        supportTicketsCollectionId,
        ticket.$id,
        {
          status: nextStatus,
          assignedAdminId: (auth as any).user.$id,
          updatedAt: now,
          resolvedAt: nextStatus === "resolved" ? now : ticket.resolvedAt || "",
        },
      );
    } else {
      return Response.json({ error: "Unsupported support action." }, { status: 400 });
    }

    await createAdminAuditLog({
      adminId: (auth as any).user.$id,
      action: `support.${action}`,
      targetType: "support_ticket",
      targetId: ticketId,
      metadata: { ticketId, action },
    });

    return Response.json({ ok: true, result });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Failed to apply support action." },
      { status: 500 },
    );
  }
}
