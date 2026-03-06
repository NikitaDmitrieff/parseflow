import Stripe from "stripe";
import { db } from "./db.js";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" })
  : null;

// Plan configs — prices created once in Stripe dashboard, IDs stored here
export const PLANS = {
  pro: {
    name: "Pro",
    price_id: process.env.STRIPE_PRO_PRICE_ID ?? "",
    parses_quota: 500,
    label: "$9/mo — 500 parses",
  },
  scale: {
    name: "Scale",
    price_id: process.env.STRIPE_SCALE_PRICE_ID ?? "",
    parses_quota: 5000,
    label: "$29/mo — 5,000 parses",
  },
} as const;

export type PlanKey = keyof typeof PLANS;

/**
 * Create a Stripe Checkout Session for plan upgrade.
 * Returns the session URL to redirect the user to.
 */
export async function createCheckoutSession(
  orgId: string,
  plan: PlanKey,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  if (!stripe) throw new Error("Stripe not configured");

  const planConfig = PLANS[plan];
  if (!planConfig.price_id) {
    throw new Error(`Stripe price ID for plan '${plan}' not configured`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: planConfig.price_id, quantity: 1 }],
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
