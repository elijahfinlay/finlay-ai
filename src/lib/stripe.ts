import Stripe from "stripe";

let _stripe: Stripe;

export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-01-28.clover",
    });
  }
  return _stripe;
}

// Re-export as `stripe` for convenience - callers use stripe.xxx()
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const CREDIT_PACKAGES = [
  {
    id: "100",
    credits: 100,
    price: 500, // cents
    label: "100 Credits",
    description: "$5.00",
    priceId: process.env.STRIPE_PRICE_100!,
  },
  {
    id: "500",
    credits: 500,
    price: 2000,
    label: "500 Credits",
    description: "$20.00 (Save 20%)",
    priceId: process.env.STRIPE_PRICE_500!,
  },
  {
    id: "2000",
    credits: 2000,
    price: 6000,
    label: "2,000 Credits",
    description: "$60.00 (Save 40%)",
    priceId: process.env.STRIPE_PRICE_2000!,
  },
] as const;

export function getPackageByPriceId(priceId: string) {
  return CREDIT_PACKAGES.find((p) => p.priceId === priceId);
}
