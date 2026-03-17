const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// ─── Generate (streaming) ─────────────────────────────────────────────────────

export async function generateStream(
  system: string,
  messages: object[],
): Promise<Response> {
  return fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, messages }),
  });
}

// ─── Competitor URL analysis ──────────────────────────────────────────────────

export async function analyseUrl(url: string): Promise<{
  style?: string;
  seo?: string;
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/api/analyse-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return res.json();
}

// ─── Brand extraction ─────────────────────────────────────────────────────────

export async function extractBrand(url: string): Promise<{
  brand?: string;
  error?: string;
}> {
  const res = await fetch(`${API_BASE}/api/extract-brand`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return res.json();
}

// ─── Images ──────────────────────────────────────────────────────────────────

export interface ImageResult {
  url: string;
  alt: string;
  credit?: string;
}

export async function fetchImages(
  query: string,
  count = 15,
): Promise<{ images: ImageResult[] }> {
  const params = new URLSearchParams({
    query,
    count: String(count),
  });
  const res = await fetch(`${API_BASE}/api/images?${params.toString()}`);
  return res.json();
}

// ─── Config ───────────────────────────────────────────────────────────────────

export async function fetchConfig(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/api/config`);
  return res.json();
}

// ─── Stripe ───────────────────────────────────────────────────────────────────

export async function stripeCheckout(
  userId: string,
  userEmail: string,
): Promise<{ url?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/api/stripe/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, userEmail }),
  });
  return res.json();
}

export async function stripeInvoices(
  userId: string,
): Promise<{ invoices?: unknown[]; error?: string }> {
  const res = await fetch(`${API_BASE}/api/stripe/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  return res.json();
}

export async function stripePortal(
  userId: string,
): Promise<{ url?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/api/stripe/portal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  return res.json();
}
