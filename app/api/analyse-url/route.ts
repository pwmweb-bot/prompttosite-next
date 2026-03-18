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
    return Response.json({ error: 'Could not reach that URL. Check it is publicly accessible.' }, { status: 400 });
  }

  const getTag  = (pattern: RegExp) => { const m = html.match(pattern); return m ? m[1].trim() : ''; };
  const getTags = (pattern: RegExp, limit = 5) => [...html.matchAll(pattern)].slice(0, limit).map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);

  const seoSignals = {
    title:       getTag(/<title[^>]*>([^<]{1,120})<\/title>/i),
    description: getTag(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,200})["']/i) || getTag(/<meta[^>]+content=["']([^"']{1,200})["'][^>]+name=["']description["']/i),
    keywords:    getTag(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']{1,200})["']/i) || getTag(/<meta[^>]+content=["']([^"']{1,200})["'][^>]+name=["']keywords["']/i),
    h1s:         getTags(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, 3),
    h2s:         getTags(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, 5),
    hasSchema:   /<script[^>]+type=["']application\/ld\+json["']/i.test(html),
    canonical:   getTag(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i),
    ogTitle:     getTag(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']{1,120})["']/i),
  };

  const seoContext = [
    seoSignals.title       && `Title tag: "${seoSignals.title}"`,
    seoSignals.description && `Meta description: "${seoSignals.description}"`,
    seoSignals.keywords    && `Meta keywords: "${seoSignals.keywords}"`,
    seoSignals.h1s.length  && `H1 headings: ${seoSignals.h1s.map(h => `"${h}"`).join(', ')}`,
    seoSignals.h2s.length  && `H2 headings: ${seoSignals.h2s.map(h => `"${h}"`).join(', ')}`,
    seoSignals.hasSchema   && `Has JSON-LD schema markup: yes`,
    seoSignals.canonical   && `Canonical URL: ${seoSignals.canonical}`,
  ].filter(Boolean).join('\n');

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 6000);

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: { 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001', max_tokens: 700,
      messages: [{ role: 'user', content:
        `Analyse this competitor website and produce two sections of notes for a web developer building a competing site.\n\nReturn EXACTLY this structure with no preamble:\n\n## Style & Design\n(5 bullets covering: colour palette mood, typography, layout approach, tone of voice, key design patterns)\n\n## SEO Insights\n(5–7 bullets covering: primary target keywords inferred from headings/copy, content gaps to exploit, messaging angles they use, what their meta description focuses on, schema/structured data usage, any obvious SEO weaknesses to outperform)\n\n---\nSEO SIGNALS EXTRACTED:\n${seoContext || '(none found)'}\n\nPAGE CONTENT:\n${text}`,
      }],
    }),
  });

  if (!claudeRes.ok) {
    const err = await claudeRes.json().catch(() => ({}));
    return Response.json({ error: (err as { error?: { message?: string } })?.error?.message || 'Claude analysis failed.' }, { status: 500 });
  }

  const data     = await claudeRes.json() as { content?: { text: string }[] };
  const fullText = data.content?.[0]?.text || '';
  const styleMatch = fullText.match(/##\s*Style[^\n]*\n([\s\S]*?)(?=##\s*SEO|$)/i);
  const seoMatch   = fullText.match(/##\s*SEO[^\n]*\n([\s\S]*?)$/i);

  return Response.json({
    style: styleMatch ? styleMatch[1].trim() : fullText,
    seo:   seoMatch   ? seoMatch[1].trim()   : '',
  });
}
