import { NextRequest } from 'next/server';
import { supabaseGetCustomer, supabaseUpsertCustomer, stripeRequest, getOrigin } from '@/lib/server/helpers';

export async function POST(req: NextRequest) {
  const { userId, userEmail } = await req.json();
  if (!userId || !userEmail) {
    return Response.json({ error: 'userId and userEmail are required' }, { status: 400 });
  }

  const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || '';

  try {
    const existing = await supabaseGetCustomer(userId);
    let stripeCustomerId = existing?.stripe_customer_id || null;

    if (!stripeCustomerId) {
      const customer = await stripeRequest('POST', 'customers', {
        email:    userEmail,
        metadata: { user_id: userId },
      });
      if (customer.error) return Response.json({ error: customer.error.message }, { status: 500 });
      stripeCustomerId = customer.id;
      await supabaseUpsertCustomer({ user_id: userId, stripe_customer_id: stripeCustomerId });
    }

    const origin  = getOrigin(req);
    const session = await stripeRequest('POST', 'checkout/sessions', {
      customer:                   stripeCustomerId,
      mode:                       'subscription',
      'line_items[0][price]':     STRIPE_PRICE_ID,
      'line_items[0][quantity]':  1,
      success_url:                `${origin}/dashboard?upgraded=1`,
      cancel_url:                 `${origin}/dashboard?cancelled=1`,
      allow_promotion_codes:      'true',
      billing_address_collection: 'auto',
      'subscription_data[metadata][user_id]': userId,
      'metadata[user_id]':        userId,
    });

    if (session.error) return Response.json({ error: session.error.message }, { status: 500 });
    return Response.json({ url: session.url });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
