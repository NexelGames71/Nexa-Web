import {
  adminAuditLogsCollectionId,
  billingPlansCollectionId,
  paymentsCollectionId,
  requireAdminFromRequest,
  subscriptionsCollectionId,
  supportNotesCollectionId,
  supportTicketsCollectionId,
} from "../../../../../lib/server/appwrite";
import { getPayPalStatus } from "../../../../../lib/server/paypal";
import {
  r2TrainingExportsBucketName,
  r2UserStorageBucketName,
} from "../../../../../lib/server/r2";

function envStatus(name: string, configured: boolean) {
  return { name, configured };
}

export async function GET(request: Request) {
  const auth = await requireAdminFromRequest(request);
  if ((auth as any).error) {
    return Response.json({ error: (auth as any).error }, { status: (auth as any).status });
  }

  const paypal = getPayPalStatus();
  const checks = [
    envStatus("R2_USER_STORAGE_BUCKET_NAME", Boolean(r2UserStorageBucketName)),
    envStatus("R2_TRAINING_EXPORTS_BUCKET_NAME", Boolean(r2TrainingExportsBucketName)),
    envStatus("PAYPAL_CLIENT_ID", paypal.clientIdConfigured),
    envStatus("PAYPAL_CLIENT_SECRET", paypal.secretConfigured),
    envStatus("PAYPAL_WEBHOOK_ID", paypal.webhookConfigured),
    envStatus("APPWRITE_BILLING_PLANS_COLLECTION_ID", Boolean(billingPlansCollectionId)),
    envStatus("APPWRITE_SUBSCRIPTIONS_COLLECTION_ID", Boolean(subscriptionsCollectionId)),
    envStatus("APPWRITE_PAYMENTS_COLLECTION_ID", Boolean(paymentsCollectionId)),
    envStatus("APPWRITE_SUPPORT_TICKETS_COLLECTION_ID", Boolean(supportTicketsCollectionId)),
    envStatus("APPWRITE_SUPPORT_NOTES_COLLECTION_ID", Boolean(supportNotesCollectionId)),
    envStatus("APPWRITE_ADMIN_AUDIT_LOGS_COLLECTION_ID", Boolean(adminAuditLogsCollectionId)),
  ];

  return Response.json({
    ok: checks.every((check) => check.configured),
    checks,
    paypal: {
      environment: paypal.environment,
      configured: paypal.configured,
      supportedEvents: paypal.supportedEvents,
    },
  });
}
