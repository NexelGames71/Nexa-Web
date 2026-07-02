import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

type PaypalEnvironment = "sandbox" | "live";

type NexaPaypalPlan = {
  key: "plus" | "pro" | "premium" | "business";
  name: string;
  description: string;
  price: string;
  currency: string;
  billingType: "fixed" | "per_seat";
  intervalUnit: "DAY" | "WEEK" | "MONTH" | "YEAR";
  intervalCount: number;
  paypalEnabled: true;
  unitName?: string;
};

type PaypalPlanOutput = {
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
  createdAt: string;
};

const PRODUCT_NAME = "Nexa AI Subscription";
const PRODUCT_DESCRIPTION = "Recurring subscription plans for Nexa AI.";

const NEXA_PAYPAL_PLANS: NexaPaypalPlan[] = [
  {
    key: "plus",
    name: "Nexa Plus",
    description: "Nexa Plus monthly subscription",
    price: "17.00",
    currency: "USD",
    billingType: "fixed",
    intervalUnit: "MONTH",
    intervalCount: 1,
    paypalEnabled: true,
  },
  {
    key: "pro",
    name: "Nexa Pro",
    description: "Nexa Pro monthly subscription",
    price: "90.00",
    currency: "USD",
    billingType: "fixed",
    intervalUnit: "MONTH",
    intervalCount: 1,
    paypalEnabled: true,
  },
  {
    key: "premium",
    name: "Nexa Premium",
    description: "Nexa Premium monthly subscription",
    price: "120.00",
    currency: "USD",
    billingType: "fixed",
    intervalUnit: "MONTH",
    intervalCount: 1,
    paypalEnabled: true,
  },
  {
    key: "business",
    name: "Nexa Business",
    description: "Nexa Business monthly subscription billed per seat",
    price: "20.00",
    currency: "USD",
    billingType: "per_seat",
    intervalUnit: "MONTH",
    intervalCount: 1,
    paypalEnabled: true,
    unitName: "seat",
  },
];

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

function getArgs() {
  const args = new Set(process.argv.slice(2));
  return {
    force: args.has("--force"),
    confirmLive: args.has("--confirm-live"),
  };
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

function getCredentials(environment: PaypalEnvironment) {
  if (environment === "live") {
    return {
      clientId: requiredEnv("PAYPAL_LIVE_CLIENT_ID"),
      clientSecret: requiredEnv("PAYPAL_LIVE_CLIENT_SECRET"),
      existingProductId: process.env.PAYPAL_LIVE_PRODUCT_ID?.trim() || "",
    };
  }

  return {
    clientId: requiredEnv("PAYPAL_SANDBOX_CLIENT_ID"),
    clientSecret: requiredEnv("PAYPAL_SANDBOX_CLIENT_SECRET"),
    existingProductId: process.env.PAYPAL_SANDBOX_PRODUCT_ID?.trim() || "",
  };
}

function paypalBaseUrl(environment: PaypalEnvironment) {
  return environment === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

function outputPathFor(environment: PaypalEnvironment) {
  return path.join(process.cwd(), `paypal-plans.${environment}.json`);
}

function readExistingOutput(environment: PaypalEnvironment): PaypalPlanOutput | null {
  const outputPath = outputPathFor(environment);
  if (!existsSync(outputPath)) {
    return null;
  }
  try {
    const parsed = JSON.parse(readFileSync(outputPath, "utf8"));
    if (parsed?.environment !== environment) {
      throw new Error(`Output file environment is ${parsed?.environment || "missing"}.`);
    }
    return parsed;
  } catch (error) {
    throw new Error(
      `Existing output file ${path.basename(outputPath)} is not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function outputHasAllRequiredIds(output: PaypalPlanOutput) {
  if (!output.product?.paypalProductId) {
    return false;
  }

  return NEXA_PAYPAL_PLANS.every((plan) => Boolean(output.plans?.[plan.key]?.paypalPlanId));
}

function validatePlanConfig() {
  const seen = new Set<string>();
  for (const plan of NEXA_PAYPAL_PLANS) {
    if (!plan.key || !plan.name || !plan.description) {
      throw new Error(`Invalid plan config for ${plan.key || "unknown"}: missing identity fields.`);
    }
    if (seen.has(plan.key)) {
      throw new Error(`Duplicate plan key in PayPal config: ${plan.key}`);
    }
    seen.add(plan.key);
    if (!/^\d+\.\d{2}$/.test(plan.price)) {
      throw new Error(`Invalid price for ${plan.name}: ${plan.price}. Use a string like "17.00".`);
    }
    if (Number(plan.price) <= 0) {
      throw new Error(`Invalid price for ${plan.name}: must be greater than zero.`);
    }
    if (plan.intervalCount < 1) {
      throw new Error(`Invalid intervalCount for ${plan.name}.`);
    }
    if (plan.billingType === "per_seat" && !plan.unitName) {
      throw new Error(`Per-seat plan ${plan.name} must define unitName.`);
    }
  }
}

async function parsePaypalResponse(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function paypalRequest(
  environment: PaypalEnvironment,
  pathname: string,
  accessToken: string,
  options: RequestInit = {},
) {
  const response = await fetch(`${paypalBaseUrl(environment)}${pathname}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });
  const data = await parsePaypalResponse(response);
  if (!response.ok) {
    const detail =
      typeof data === "object" && data
        ? (data as any).message || (data as any).name || JSON.stringify(data)
        : String(data || "");
    throw new Error(`PayPal request failed (${response.status}) ${pathname}: ${detail}`);
  }
  return data;
}

async function getAccessToken(environment: PaypalEnvironment, clientId: string, clientSecret: string) {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${paypalBaseUrl(environment)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await parsePaypalResponse(response);
  if (!response.ok || !data?.access_token) {
    const detail =
      typeof data === "object" && data
        ? (data as any).error_description || (data as any).error || JSON.stringify(data)
        : String(data || "");
    throw new Error(`PayPal authentication failed: ${detail || response.status}`);
  }
  return String(data.access_token);
}

async function findProductByName(environment: PaypalEnvironment, accessToken: string, productName: string) {
  const data = await paypalRequest(
    environment,
    "/v1/catalogs/products?page_size=20&page=1&total_required=true",
    accessToken,
  );
  const products = Array.isArray(data?.products) ? data.products : [];
  return products.find((product: any) => product?.name === productName) || null;
}

async function createProduct(environment: PaypalEnvironment, accessToken: string) {
  return paypalRequest(environment, "/v1/catalogs/products", accessToken, {
    method: "POST",
    headers: {
      "PayPal-Request-Id": `nexa-${environment}-subscription-product`,
    },
    body: JSON.stringify({
      name: PRODUCT_NAME,
      description: PRODUCT_DESCRIPTION,
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });
}

async function getOrCreateProduct(
  environment: PaypalEnvironment,
  accessToken: string,
  existingProductId: string,
  outputProductId = "",
) {
  if (existingProductId) {
    console.log(`Using product from env: ${existingProductId}`);
    return { id: existingProductId, name: PRODUCT_NAME };
  }

  if (outputProductId) {
    console.log(`Using product from existing output: ${outputProductId}`);
    return { id: outputProductId, name: PRODUCT_NAME };
  }

  try {
    const existingProduct = await findProductByName(environment, accessToken, PRODUCT_NAME);
    if (existingProduct?.id) {
      console.log(`Using existing product: ${PRODUCT_NAME} (${existingProduct.id})`);
      return existingProduct;
    }
  } catch (error) {
    console.warn(
      `Could not list PayPal products, creating a new product instead: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  console.log(`Creating product: ${PRODUCT_NAME}`);
  const product = await createProduct(environment, accessToken);
  if (!product?.id) {
    throw new Error("PayPal product creation succeeded but did not return an id.");
  }
  return product;
}

function planRequestId(environment: PaypalEnvironment, plan: NexaPaypalPlan) {
  return `nexa-${environment}-${plan.key}-${plan.price}-${plan.intervalUnit.toLowerCase()}-${plan.intervalCount}`;
}

async function createPlan(
  environment: PaypalEnvironment,
  accessToken: string,
  productId: string,
  plan: NexaPaypalPlan,
) {
  return paypalRequest(environment, "/v1/billing/plans", accessToken, {
    method: "POST",
    headers: {
      "PayPal-Request-Id": planRequestId(environment, plan),
    },
    body: JSON.stringify({
      product_id: productId,
      name: plan.name,
      description: plan.description,
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: {
            interval_unit: plan.intervalUnit,
            interval_count: plan.intervalCount,
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: plan.price,
              currency_code: plan.currency,
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
    }),
  });
}

function planLogPrice(plan: NexaPaypalPlan) {
  return plan.billingType === "per_seat"
    ? `$${Number(plan.price).toFixed(0)}/${plan.unitName}/month`
    : `$${Number(plan.price).toFixed(0)}/month`;
}

function outputPlanEntry(plan: NexaPaypalPlan, paypalPlanId: string) {
  return {
    name: plan.name,
    price: plan.price,
    currency: plan.currency,
    billingType: plan.billingType,
    ...(plan.unitName ? { unitName: plan.unitName } : {}),
    paypalPlanId,
  };
}

async function main() {
  loadEnvironmentVariables();
  validatePlanConfig();

  const { force, confirmLive } = getArgs();
  const environment = getTargetEnvironment();
  if (environment === "live" && !confirmLive) {
    throw new Error("Live PayPal plan creation requires --confirm-live.");
  }

  console.log("Starting Nexa PayPal plan setup...");
  console.log(`Environment: ${environment}`);
  if (environment === "live") {
    console.warn("Warning: this will create live PayPal billing plans.");
  }

  const outputPath = outputPathFor(environment);
  const existingOutput = readExistingOutput(environment);
  if (existingOutput && !force && outputHasAllRequiredIds(existingOutput)) {
    console.log(`Existing output file found: ${path.basename(outputPath)}`);
    console.log("Reusing existing PayPal product and plan IDs. Pass --force to recreate plans.");
    for (const plan of NEXA_PAYPAL_PLANS) {
      if (existingOutput.plans?.[plan.key]?.paypalPlanId) {
        console.log(`Existing PayPal plan found for ${plan.name}. Skipping creation.`);
      }
    }
    console.log("Done.");
    return;
  }

  if (existingOutput && !force) {
    console.warn(
      `Existing output file found but it is missing one or more PayPal IDs. Reusing available IDs and creating missing plans.`,
    );
  }

  const credentials = getCredentials(environment);
  console.log("Authenticating with PayPal...");
  const accessToken = await getAccessToken(environment, credentials.clientId, credentials.clientSecret);
  const product = await getOrCreateProduct(
    environment,
    accessToken,
    credentials.existingProductId,
    !force ? existingOutput?.product?.paypalProductId : "",
  );
  console.log(`Using product: ${PRODUCT_NAME}`);

  const output: PaypalPlanOutput = {
    environment,
    product: {
      name: PRODUCT_NAME,
      paypalProductId: product.id,
    },
    plans: {},
    createdAt: new Date().toISOString(),
  };

  for (const plan of NEXA_PAYPAL_PLANS) {
    const existingPlanId = !force ? existingOutput?.plans?.[plan.key]?.paypalPlanId : "";
    if (existingPlanId) {
      console.log(`Existing PayPal plan found for ${plan.name}. Skipping creation.`);
      output.plans[plan.key] = outputPlanEntry(plan, existingPlanId);
      continue;
    }

    console.log(`Creating plan: ${plan.name} - ${planLogPrice(plan)}`);
    const paypalPlan = await createPlan(environment, accessToken, product.id, plan);
    if (!paypalPlan?.id) {
      throw new Error(`PayPal plan creation for ${plan.name} did not return an id.`);
    }
    console.log(`Created PayPal plan: ${paypalPlan.id}`);
    output.plans[plan.key] = outputPlanEntry(plan, paypalPlan.id);
  }

  writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Saved output to ${path.basename(outputPath)}`);
  console.log("Done.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
