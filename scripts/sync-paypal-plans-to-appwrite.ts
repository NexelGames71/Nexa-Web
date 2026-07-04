import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

import { Client, Databases, ID, Query } from "node-appwrite";

import { PLAN_LIMITS } from "../lib/plan-limits";

type PaypalEnvironment = "sandbox" | "live";

type PaypalPlansOutput = {
  environment: PaypalEnvironment;
  product: {
    name: string;
    paypalProductId: string;
  };
  plans: Record<string, {
    name: string;
    price: string;
    currency: string;
    billingType: string;
    unitName?: string;
    paypalPlanId: string;
  }>;
};

const PLAN_FEATURES: Record<string, string[]> = {
  plus: [
    "Advanced models",
    "Advanced image creation with thinking",
    "Expanded memory across chats",
    "Coding assistant access",
    "Expanded research",
    "Projects and custom assistants",
  ],
  pro: [
    "Everything in Plus",
    "About 5x more usage than Plus",
    "Frontier Pro model routing",
    "Maximum access to coding tools",
    "Maximum deep research",
    "Unlimited core chat subject to abuse guardrails",
    "Unlimited and faster image creation subject to abuse guardrails",
    "Maximum memory and context",
    "Early access to experimental features",
  ],
  premium: ["Everything in Pro", "Highest Deep Thinker access", "Premium image quality", "Priority plus support"],
  business: [
    "Access Nexa across desktop and mobile apps",
    "AI for chat, coding, analysis, and workflows",
    "Connect company tools and knowledge sources",
    "Team agent plugins and shared context",
    "Centralized billing and administration",
    "Usage analytics, budgeting, and spend controls",
    "Secure workspace with SSO and MFA readiness",
    "No training on business data by default",
  ],
};

function loadEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function loadEnvironmentVariables() {
  for (const filename of [".env.local", ".env"]) {
    loadEnvFile(path.join(process.cwd(), filename));
  }
}

function getArgValue(name: string) {
  const args = process.argv.slice(2);
  const index = args.indexOf(name);
  if (index >= 0) {
    return args[index + 1] || "";
  }

  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  return inline ? inline.slice(prefix.length) : "";
}

function getTargetEnvironment(): PaypalEnvironment {
  const value = (process.env.PAYPAL_ENV || "sandbox").trim().toLowerCase();
  if (value !== "sandbox" && value !== "live") {
    throw new Error(`Invalid PAYPAL_ENV "${value}". Use "sandbox" or "live".`);
  }
  return value;
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function defaultCollectionId(...parts: string[]) {
  return parts.join("_");
}

function outputPathFor(environment: PaypalEnvironment) {
  return path.join(process.cwd(), `paypal-plans.${environment}.json`);
}

function readPaypalOutput(environment: PaypalEnvironment) {
  const requestedPath = getArgValue("--file");
  const outputPath = requestedPath ? path.resolve(process.cwd(), requestedPath) : outputPathFor(environment);
  if (!existsSync(outputPath)) {
    throw new Error(`PayPal plans output file was not found: ${outputPath}`);
  }

  const output = JSON.parse(readFileSync(outputPath, "utf8")) as PaypalPlansOutput;
  if (output.environment !== environment) {
    throw new Error(
      `PayPal output environment is "${output.environment}", but PAYPAL_ENV is "${environment}".`,
    );
  }
  if (!output.product?.paypalProductId) {
    throw new Error("PayPal output is missing product.paypalProductId.");
  }
  return { output, outputPath };
}

function createDatabasesClient() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://sgp.cloud.appwrite.io/v1";
  const projectId = requiredEnv("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
  const apiKey = requiredEnv("APPWRITE_API_KEY");

  const client = new Client();
  client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  return new Databases(client);
}

function safeErrorDetails(error: unknown) {
  const err = error as any;
  const parts = [
    err?.name ? `name=${err.name}` : "",
    err?.code ? `code=${err.code}` : "",
    err?.status ? `status=${err.status}` : "",
    err?.type ? `type=${err.type}` : "",
    err?.cause?.code ? `causeCode=${err.cause.code}` : "",
    err?.cause?.name ? `causeName=${err.cause.name}` : "",
    err?.cause?.message ? `causeMessage=${err.cause.message}` : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join("; ") : "";
}

function paypalFields(environment: PaypalEnvironment, productId: string, planId: string) {
  if (environment === "live") {
    return {
      paypalProductId: productId,
      paypalPlanId: planId,
      paypalLiveProductId: productId,
      paypalLivePlanId: planId,
    };
  }

  return {
    paypalProductId: productId,
    paypalPlanId: planId,
    paypalSandboxProductId: productId,
    paypalSandboxPlanId: planId,
  };
}

function billingPlanPayload(environment: PaypalEnvironment, productId: string, key: string, plan: PaypalPlansOutput["plans"][string]) {
  const now = new Date().toISOString();
  const planLimits = PLAN_LIMITS[key as keyof typeof PLAN_LIMITS] || {};
  return {
    planId: key,
    name: plan.name,
    priceMonthly: Number(plan.price),
    priceYearly: 0,
    currency: plan.currency,
    ...paypalFields(environment, productId, plan.paypalPlanId),
    limits: JSON.stringify({
      billingType: plan.billingType,
      unitName: plan.unitName || null,
      ...planLimits,
    }),
    features: JSON.stringify(PLAN_FEATURES[key] || []),
    isPublic: true,
    status: "active",
    updatedAt: now,
  };
}

async function ensureBillingPlanSchema(databases: Databases, databaseId: string, collectionId: string) {
  const collection = await databases.getCollection(databaseId, collectionId);
  const attributes = new Set((collection.attributes || []).map((attribute: any) => attribute.key));
  const missing = [
    "paypalSandboxProductId",
    "paypalSandboxPlanId",
    "paypalLiveProductId",
    "paypalLivePlanId",
  ].filter((attribute) => !attributes.has(attribute));

  if (missing.length > 0) {
    throw new Error(
      `Billing plans collection is missing PayPal environment attributes: ${missing.join(", ")}. Run npm run setup:admin-ops before syncing PayPal plan IDs.`,
    );
  }
}

async function upsertBillingPlan(
  databases: Databases,
  databaseId: string,
  collectionId: string,
  environment: PaypalEnvironment,
  productId: string,
  key: string,
  plan: PaypalPlansOutput["plans"][string],
) {
  if (!plan?.paypalPlanId) {
    throw new Error(`PayPal output is missing plans.${key}.paypalPlanId.`);
  }

  const existing = await databases.listDocuments(databaseId, collectionId, [
    Query.equal("planId", key),
    Query.limit(1),
  ]);

  const payload = billingPlanPayload(environment, productId, key, plan);
  if (existing.documents[0]) {
    await databases.updateDocument(databaseId, collectionId, existing.documents[0].$id, payload);
    console.log(`Updated billing plan: ${key}`);
    return;
  }

  await databases.createDocument(databaseId, collectionId, ID.unique(), {
    ...payload,
    createdAt: payload.updatedAt,
  });
  console.log(`Created billing plan: ${key}`);
}

async function main() {
  loadEnvironmentVariables();
  const environment = getTargetEnvironment();
  const { output, outputPath } = readPaypalOutput(environment);
  const databaseId = requiredEnv("APPWRITE_DATABASE_ID");
  const collectionId =
    process.env.APPWRITE_BILLING_PLANS_COLLECTION_ID || defaultCollectionId("billing", "plans");

  console.log("Starting Nexa PayPal plan sync...");
  console.log(`Environment: ${environment}`);
  console.log(`Source: ${path.basename(outputPath)}`);

  const databases = createDatabasesClient();
  await ensureBillingPlanSchema(databases, databaseId, collectionId);

  for (const [key, plan] of Object.entries(output.plans || {})) {
    await upsertBillingPlan(
      databases,
      databaseId,
      collectionId,
      environment,
      output.product.paypalProductId,
      key,
      plan,
    );
  }

  console.log("Done.");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  const details = safeErrorDetails(error);
  if (details) {
    console.error(`Details: ${details}`);
  }
  if (message === "fetch failed" || details.includes("fetch")) {
    console.error(
      "Hint: the Appwrite request did not complete. Check network/DNS, NEXT_PUBLIC_APPWRITE_ENDPOINT, project ID, and API key permissions.",
    );
  }
  process.exitCode = 1;
});
