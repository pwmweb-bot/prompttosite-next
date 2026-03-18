import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const PEXELS_KEY = process.env.PEXELS_API_KEY || '';
  const { searchParams } = req.nextUrl;
  const query    = (searchParams.get('query') || '').trim();
  const count    = Math.min(parseInt(searchParams.get('count') || '12'), 20);
  const portrait = searchParams.get('portrait') === '1';

  if (!query) return Response.json({ error: 'query is required' }, { status: 400 });

  if (!PEXELS_KEY) {
    const images = Array.from({ length: count }, (_, i) => ({
      url:    `https://picsum.photos/seed/${encodeURIComponent(query)}-${i}/1200/800`,
      alt:    `${query} image ${i + 1}`,
      credit: 'picsum.photos',
    }));
    return Response.json({ images, source: 'picsum' }, {
      headers: { 'X-Image-Source': 'picsum' },
    });
  }

  try {
    const orientation = portrait ? 'portrait' : 'landscape';
    const pexelsRes = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=${orientation}`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    if (!pexelsRes.ok) {
      const err = await pexelsRes.json().catch(() => ({}));
      return Response.json({ error: (err as { error?: string })?.error || 'Pexels API error' }, { status: 500 });
    }
    const data = await pexelsRes.json() as { photos?: { src: { large2x?: string; large?: string; medium?: string }; alt?: string; photographer: string; url: string }[] };
    const images = (data.photos || []).map(p => ({
      url:    p.src.large2x || p.src.large,
      thumb:  p.src.medium,
      alt:    p.alt || query,
      credit: `Photo by ${p.photographer} on Pexels`,
      pexels: p.url,
    }));
    return Response.json({ images, source: 'pexels' }, {
      headers: { 'X-Image-Source': 'pexels' },
    });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
