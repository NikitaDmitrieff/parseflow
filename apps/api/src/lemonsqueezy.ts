import { db } from "./db.js";

export const LS_ENABLED = !!(
  process.env.LEMONSQUEEZY_API_KEY &&
  process.env.LEMONSQUEEZY_STORE_ID
);

export const LS_PLANS = {
  pro: {
    name: "Pro",
    amount_cents: 900,
    parses_quota: 500,
    label: "$9/mo — 500 parses",
    variantEnv: "LEMONSQUEEZY_PRO_VARIANT_ID",
  },
  scale: {
    name: "Scale",
    amount_cents: 2900,
    parses_quota: 5000,
    label: "$29/mo — 5,000 parses",
    variantEnv: "LEMONSQUEEZY_SCALE_VARIANT_ID",
  },
} as const;

export type PlanKey = keyof typeof LS_PLANS;

async function lsRequest(path: string, options?: RequestInit) {
  const res = await fetch(`https://api.lemonsqueezy.com${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
      "Accept": "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`LemonSqueezy API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<Record<string, any>>;
}

/**
 * Create a Lemon Squeezy checkout URL for a given plan.
 * Returns the URL to redirect the user to.
 */
export async function createLSCheckout(
  orgId: string,
  plan: PlanKey,
  successUrl: string,
): Promise<string> {
  const variantId = process.env[LS_PLANS[plan].variantEnv];
  if (!variantId) {
    throw new Error(
      `${LS_PLANS[plan].variantEnv} not set — configure Lemon Squeezy variant IDs`
    );
  }

  const storeId = process.env.LEMONSQUEEZY_STORE_ID!;

  const payload = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          custom: { organization_id: orgId, plan },
        },
        product_options: {
          redirect_url: successUrl,
          enabled_variants: [Number(variantId)],
        },
      },
      relationships: {
        store: { data: { type: "stores", id: storeId } },
        variant: { data: { type: "variants", id: variantId } },
      },
    },
  };

  const response = await lsRequest("/v1/checkouts", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const url = response?.data?.attributes?.url;
  if (!url) throw new Error("No checkout URL returned from Lemon Squeezy");
  return url;
}

/**
 * Verify Lemon Squeezy webhook signature.
 * LS uses HMAC-SHA256 with X-Signature header.
 */
export function verifyLSWebhook(rawBody: string, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return false;

  const { createHmac } = require("crypto");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === signature;
}

/**
 * Handle a fulfilled Lemon Squeezy order/subscription — upgrade org plan in DB.
 */
export async function handleLSOrderComplete(
  orgId: string,
  plan: PlanKey,
  orderId: string
) {
  const planConfig = LS_PLANS[plan];
  if (!planConfig) {
    console.error("handleLSOrderComplete: unknown plan", plan);
    return;
  }

  const { error } = await db
    .from("pf_organizations")
    .update({
      plan,
      parses_quota: planConfig.parses_quota,
      stripe_customer_id: null,
      stripe_subscription_id: `ls_order_${orderId}`,
    })
    .eq("id", orgId);

  if (error) {
    console.error("handleLSOrderComplete DB error:", error);
    throw error;
  }

  console.log(`[lemonsqueezy] Upgraded org ${orgId} to ${plan} (order ${orderId})`);
}
