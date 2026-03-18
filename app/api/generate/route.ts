import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!API_KEY) {
    return Response.json({ error: { message: 'API key not configured.' } }, { status: 500 });
  }

  const body = await req.json();

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'x-api-key':         API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({ ...body, stream: true }),
  });

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({}));
    return Response.json(err, { status: upstream.status });
  }

  // Pipe the SSE stream straight through
  return new Response(upstream.body, {
    headers: {
      'Content-Type':     'text/event-stream',
      'Cache-Control':    'no-cache',
      'X-Accel-Buffering':'no',
    },
  });
}
