import { NextRequest } from 'next/server';
import { supabaseGetCustomer, stripeRequest } from '@/lib/server/helpers';

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return Response.json({ error: 'userId is required' }, { status: 400 });

  try {
    const row = await supabaseGetCustomer(userId);
    if (!row?.stripe_customer_id) return Response.json({ invoices: [] });

    const data = await stripeRequest('GET',
      `invoices?customer=${row.stripe_customer_id}&limit=24&expand[]=data.subscription`
    );
    if (data.error) return Response.json({ error: data.error.message }, { status: 500 });

    const invoices = (data.data || []).map((inv: Record<string, unknown>) => ({
      id:           inv.id,
      number:       inv.number || inv.id,
      status:       inv.status,
      amount:       (inv.amount_paid as number) ?? (inv.amount_due as number),
      currency:     ((inv.currency as string) || 'gbp').toUpperCase(),
      created:      inv.created,
      period_start: inv.period_start,
      period_end:   inv.period_end,
      pdf:          inv.invoice_pdf   || null,
      hosted_url:   inv.hosted_invoice_url || null,
      description:  (inv.lines as { data?: { description?: string }[] })?.data?.[0]?.description || 'Subscription',
    }));

    return Response.json({ invoices });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
