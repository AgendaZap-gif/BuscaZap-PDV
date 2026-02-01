/**
 * Stripe - checkout e webhook para planos.
 */

import { ENV } from "./env.js";

let stripeInstance: { checkout: { sessions: { create: (opts: unknown) => Promise<{ url: string | null }> } }; webhooks: { constructEvent: (payload: string | Buffer, sig: string, secret: string) => unknown } } | null = null;

function getStripe() {
  if (!ENV.stripeSecretKey?.trim()) return null;
  if (!stripeInstance) {
    const Stripe = require("stripe");
    stripeInstance = new Stripe(ENV.stripeSecretKey, { apiVersion: "2024-11-20.acacia" }) as typeof stripeInstance;
  }
  return stripeInstance;
}

export function isStripeConfigured(): boolean {
  return Boolean(ENV.stripeSecretKey?.trim());
}

export async function createCheckoutSession(companyId: number, plan: "pro" | "premium", successUrl: string, cancelUrl: string): Promise<{ url: string | null }> {
  const stripe = getStripe();
  if (!stripe) return { url: null };
  const priceId = plan === "premium" ? ENV.stripePricePremium : ENV.stripePricePro;
  if (!priceId) return { url: null };
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: String(companyId),
    metadata: { companyId: String(companyId), plan },
  });
  return { url: session.url ?? null };
}

export function constructWebhookEvent(payload: string | Buffer, signature: string): unknown {
  const stripe = getStripe();
  if (!stripe || !ENV.stripeWebhookSecret) throw new Error("Stripe not configured");
  return stripe.webhooks.constructEvent(payload, signature, ENV.stripeWebhookSecret);
}
