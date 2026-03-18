import { NextRequest } from 'next/server';
import { supabaseGetCustomer, stripeRequest, getOrigin } from '@/lib/server/helpers';

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return Response.json({ error: 'userId is required' }, { status: 400 });

  try {
    const row = await supabaseGetCustomer(userId);
    if (!row?.stripe_customer_id) {
      return Response.json({ error: 'No Stripe customer found for this user' }, { status: 404 });
    }

    const origin  = getOrigin(req);
    const session = await stripeRequest('POST', 'billing_portal/sessions', {
      customer:   row.stripe_customer_id,
      return_url: `${origin}/dashboard`,
    });

    if (session.error) return Response.json({ error: session.error.message }, { status: 500 });
    return Response.json({ url: session.url });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
