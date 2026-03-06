import Stripe from "stripe";
import { db } from "./db.js";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" })
  : null;

export const PLANS = {
  pro: {
    name: "Pro",
    amount_cents: 900,
    parses_quota: 500,
    label: "$9/mo — 500 parses",
  },
  scale: {
    name: "Scale",
    amount_cents: 2900,
    parses_quota: 5000,
    label: "$29/mo — 5,000 parses",
  },
} as const;

export type PlanKey = keyof typeof PLANS;

// In-memory price ID cache — valid for the lifetime of this serverless instance
let _cachedPriceIds: { pro: string; scale: string } | null = null;

/**
 * Returns Stripe price IDs, creating products/prices idempotently if needed.
 * Priority: env vars (fastest) > in-memory cache > Stripe search > create new.
 */
async function getOrCreatePriceIds(): Promise<{ pro: string; scale: string }> {
  if (process.env.STRIPE_PRO_PRICE_ID && process.env.STRIPE_SCALE_PRICE_ID) {
    return { pro: process.env.STRIPE_PRO_PRICE_ID, scale: process.env.STRIPE_SCALE_PRICE_ID };
  }
  if (_cachedPriceIds) return _cachedPriceIds;
  if (!stripe) throw new Error("Stripe not configured");

  // Search for existing ParseFlow prices by metadata
  const existing = await stripe.prices.search({
    query: "metadata['app']:'parseflow' AND active:'true'",
    expand: ["data.product"],
    limit: 10,
  });

  const proPrice = existing.data.find(
    (p) => (p.product as Stripe.Product)?.metadata?.plan === "pro"
  );
  const scalePrice = existing.data.find(
    (p) => (p.product as Stripe.Product)?.metadata?.plan === "scale"
  );

  if (proPrice && scalePrice) {
    _cachedPriceIds = { pro: proPrice.id, scale: scalePrice.id };
    console.log(`[stripe] Found existing prices: pro=${proPrice.id} scale=${scalePrice.id}`);
    return _cachedPriceIds;
  }

  // Create missing products and prices
  console.log("[stripe] Bootstrap: creating products and prices...");

  const [proProd, scaleProd] = await Promise.all([
    proPrice
      ? Promise.resolve(proPrice.product as Stripe.Product)
      : stripe.products.create({
          name: "ParseFlow Pro",
          description: "1,000 document parses per month",
          metadata: { app: "parseflow", plan: "pro" },
        }),
    scalePrice
      ? Promise.resolve(scalePrice.product as Stripe.Product)
      : stripe.products.create({
          name: "ParseFlow Scale",
          description: "10,000 document parses per month",
          metadata: { app: "parseflow", plan: "scale" },
        }),
  ]);

  const [newProPrice, newScalePrice] = await Promise.all([
    proPrice
      ? Promise.resolve(proPrice)
      : stripe.prices.create({
          product: proProd.id,
          unit_amount: PLANS.pro.amount_cents,
          currency: "usd",
          recurring: { interval: "month" },
          metadata: { app: "parseflow", plan: "pro" },
        }),
    scalePrice
      ? Promise.resolve(scalePrice)
      : stripe.prices.create({
          product: scaleProd.id,
          unit_amount: PLANS.scale.amount_cents,
          currency: "usd",
          recurring: { interval: "month" },
          metadata: { app: "parseflow", plan: "scale" },
        }),
  ]);

  _cachedPriceIds = { pro: newProPrice.id, scale: newScalePrice.id };
  console.log(`[stripe] Bootstrap complete: pro=${newProPrice.id} scale=${newScalePrice.id}`);
  console.log(`[stripe] Add to Vercel for faster startup:`);
  console.log(`  STRIPE_PRO_PRICE_ID=${newProPrice.id}`);
  console.log(`  STRIPE_SCALE_PRICE_ID=${newScalePrice.id}`);
  return _cachedPriceIds;
}

/**
 * Create a Stripe Checkout Session for plan upgrade.
 * Returns the session URL to redirect the user to.
 * Price IDs are auto-created on first call if not set in env vars.
 */
export async function createCheckoutSession(
  orgId: string,
  plan: PlanKey,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  if (!stripe) throw new Error("Stripe not configured");

  const priceIds = await getOrCreatePriceIds();
  const priceId = priceIds[plan];

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { organization_id: orgId, plan },
    allow_promotion_codes: true,
  });

  if (!session.url) throw new Error("No checkout URL returned from Stripe");
  return session.url;
}

/**
 * Handle a fulfilled Stripe checkout — upgrade org plan and quota in DB.
 */
export async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const orgId = session.metadata?.organization_id;
  const plan = session.metadata?.plan as PlanKey | undefined;

  if (!orgId || !plan || !PLANS[plan]) {
    console.error("handleCheckoutComplete: missing metadata", session.metadata);
    return;
  }

  const { parses_quota } = PLANS[plan];

  const { error } = await db
    .from("pf_organizations")
    .update({
      plan,
      parses_quota,
      stripe_customer_id: session.customer as string | null,
      stripe_subscription_id: session.subscription as string | null,
    })
    .eq("id", orgId);

  if (error) {
    console.error("handleCheckoutComplete DB error:", error);
    throw error;
  }

  console.log(`Upgraded org ${orgId} to ${plan} (${parses_quota} parses/mo)`);
}
