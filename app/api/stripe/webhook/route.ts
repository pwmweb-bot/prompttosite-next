import { supabaseUpsertCustomer, supabaseLookupUserByCustomer, stripeRequest, verifyStripeWebhook } from '@/lib/server/helpers';

export async function POST(req: Request) {
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

  let event: Record<string, unknown>;
  try {
    event = await verifyStripeWebhook(req, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  const type = (event.type as string) || '';
  const obj  = (event.data as { object: Record<string, unknown> })?.object || {};

  try {
    if (type === 'checkout.session.completed') {
      const meta   = (obj.metadata as { user_id?: string }) || {};
      const userId = meta.user_id;
      const customer = obj.customer as string;
      const subId    = obj.subscription as string;
      if (userId && customer) {
        const sub       = await stripeRequest('GET', `subscriptions/${subId}`);
        const periodEnd = sub.current_period_end
          ? new Date((sub.current_period_end as number) * 1000).toISOString() : null;
        await supabaseUpsertCustomer({
          user_id: userId, stripe_customer_id: customer, stripe_subscription_id: subId,
          plan: 'pro', status: 'active', current_period_end: periodEnd,
          cancel_at_period_end: false, updated_at: new Date().toISOString(),
        });
      }

    } else if (type === 'customer.subscription.updated') {
      let userId = (obj.metadata as { user_id?: string })?.user_id;
      if (!userId) userId = await supabaseLookupUserByCustomer(obj.customer as string);
      if (userId) {
        const status = obj.status as string;
        const plan   = (status === 'active' || status === 'trialing') ? 'pro' : 'free';
        await supabaseUpsertCustomer({
          user_id: userId, stripe_customer_id: obj.customer,
          stripe_subscription_id: obj.id, plan, status,
          current_period_end: new Date((obj.current_period_end as number) * 1000).toISOString(),
          cancel_at_period_end: !!obj.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        });
      }

    } else if (type === 'customer.subscription.deleted') {
      let userId = (obj.metadata as { user_id?: string })?.user_id;
      if (!userId) userId = await supabaseLookupUserByCustomer(obj.customer as string);
      if (userId) {
        await supabaseUpsertCustomer({
          user_id: userId, stripe_subscription_id: obj.id,
          plan: 'free', status: 'cancelled',
          cancel_at_period_end: false, updated_at: new Date().toISOString(),
        });
      }

    } else if (type === 'invoice.payment_failed') {
      const userId = await supabaseLookupUserByCustomer(obj.customer as string);
      if (userId) {
        await supabaseUpsertCustomer({
          user_id: userId, status: 'past_due', updated_at: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  return new Response('OK', { status: 200 });
}
