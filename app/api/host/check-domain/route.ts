import { NextRequest } from 'next/server';
import { vercelRequest, VERCEL_TOKEN } from '@/lib/server/helpers';

export async function GET(req: NextRequest) {
  if (!VERCEL_TOKEN) return Response.json({ error: 'Hosting not configured' }, { status: 500 });

  const domain = (req.nextUrl.searchParams.get('domain') || '').trim().toLowerCase();
  if (!domain || !/^[a-z0-9][a-z0-9\-\.]+\.[a-z]{2,}$/.test(domain)) {
    return Response.json({ error: 'Invalid domain name' }, { status: 400 });
  }

  try {
    const [availRes, priceRes] = await Promise.all([
      vercelRequest('GET', `/v1/registrar/domains/${encodeURIComponent(domain)}/availability`),
      vercelRequest('GET', `/v1/registrar/domains/${encodeURIComponent(domain)}/price?years=1`),
    ]);

    return Response.json({
      domain,
      available:     (availRes as { available: boolean }).available,
      purchasePrice: (priceRes as { purchasePrice: number }).purchasePrice,
      renewalPrice:  (priceRes as { renewalPrice: number }).renewalPrice,
      currency:      'GBP',
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
