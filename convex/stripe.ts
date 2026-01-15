// convex/stripe.ts
import { httpAction } from "./_generated/server";

// Note: Full implementation requires:
// 1. STRIPE_SECRET_KEY in Convex environment variables
// 2. STRIPE_WEBHOOK_SECRET in Convex environment variables
// 3. Stripe npm package (add to dependencies)

// This is the structure - actual Stripe integration requires setup
export const webhook = httpAction(async (ctx, request) => {
  // TODO: Implement when Stripe is configured
  // 1. Verify webhook signature
  // 2. Handle checkout.session.completed
  // 3. Handle customer.subscription.created/updated/deleted
  // 4. Update supporters table accordingly

  return new Response("Webhook handler placeholder", { status: 200 });
});

// Internal mutation to create/update supporter record
// Called by webhook handler
export const updateSupporterStatus = async (
  ctx: any,
  args: {
    stripeCustomerId: string;
    userId: string;
    type: "monthly" | "one-time";
    isActive: boolean;
    displayName: string;
    avatarUrl?: string;
  }
) => {
  // TODO: Implement supporter record creation/update
};
