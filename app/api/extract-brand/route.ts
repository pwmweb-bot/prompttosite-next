import { NextRequest } from 'next/server';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) return Response.json({ error: 'API key not configured.' }, { status: 500 });

  const { url } = await req.json();
  if (!url || !/^https?:\/\/.+/.test(url)) {
    return Response.json({ error: 'A valid http/https URL is required.' }, { status: 400 });
  }

  let html: string;
  try {
    const pageRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PromptToSite/1.0)' },
      signal:  AbortSignal.timeout(10000),
    });
    if (!pageRes.ok) return Response.json({ error: `Could not fetch URL (${pageRes.status})` }, { status: 400 });
    html = await pageRes.text();
  } catch {
    return Response.json({ error: 'Could not reach that URL. Is it publicly accessible?' }, { status: 400 });
  }

  const cssHints = [...html.matchAll(/color\s*:\s*(#[0-9a-f]{3,6}|rgba?\([^)]+\)|[a-z]+)/gi)]
    .map(m => m[1]).slice(0, 30).join(', ');

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 8000);

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: { 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001', max_tokens: 500,
      messages: [{ role: 'user', content:
        `Extract the brand identity from this existing business website. Return ONLY a structured list with no preamble, covering:\n- Brand colours: (list any hex codes found or describe: e.g. "Deep navy #1a2b4c, warm gold, white")\n- Typography feel: (e.g. "Serif headings — traditional and authoritative")\n- Brand tone: (3–5 words, e.g. "Professional, warm, approachable")\n- Core message: (what the business promises in one sentence)\n- Imagery style: (e.g. "Real team photos, lifestyle shots, no stock imagery")\n- What to preserve: (2–3 things the new site must keep to feel consistent)\n\nCSS colour hints found: ${cssHints || 'none detected'}\n\nPage content:\n${text}`,
      }],
    }),
  });

  if (!claudeRes.ok) {
    const err = await claudeRes.json().catch(() => ({}));
    return Response.json({ error: (err as { error?: { message?: string } })?.error?.message || 'Analysis failed.' }, { status: 500 });
  }

  const data  = await claudeRes.json() as { content?: { text: string }[] };
  const brand = data.content?.[0]?.text || '';
  return Response.json({ brand });
}
