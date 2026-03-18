// ─── Server-side helpers (never imported by client code) ─────────────────────

const SUPABASE_URL         = process.env.SUPABASE_URL             || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY|| '';
const STRIPE_SECRET_KEY    = process.env.STRIPE_SECRET_KEY        || '';
export const VERCEL_TOKEN  = process.env.VERCEL_TOKEN             || '';
export const VERCEL_TEAM_ID= process.env.VERCEL_TEAM_ID           || '';

// ── Supabase ──────────────────────────────────────────────────────────────────

export async function sbFetch(path: string, opts: RequestInit = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...opts,
    headers: {
      apikey:        SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers as Record<string, string> || {}),
    },
  });
}

export async function supabaseGetCustomer(userId: string) {
  const res  = await sbFetch(`/stripe_customers?user_id=eq.${encodeURIComponent(userId)}&limit=1`);
  const rows = await res.json();
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

export async function supabaseUpsertCustomer(data: Record<string, unknown>) {
  await sbFetch('/stripe_customers', {
    method:  'POST',
    headers: { Prefer: 'resolution=merge-duplicates' } as Record<string, string>,
    body:    JSON.stringify(data),
  });
}

export async function supabaseLookupUserByCustomer(stripeCustomerId: string) {
  if (!stripeCustomerId) return null;
  const res  = await sbFetch(`/stripe_customers?stripe_customer_id=eq.${encodeURIComponent(stripeCustomerId)}&limit=1&select=user_id`);
  const rows = await res.json();
  return Array.isArray(rows) && rows.length ? rows[0].user_id : null;
}

export async function supabaseInsertHostedSite(data: Record<string, unknown>) {
  const res  = await sbFetch('/hosted_sites', {
    method:  'POST',
    headers: { Prefer: 'return=representation' } as Record<string, string>,
    body:    JSON.stringify(data),
  });
  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function supabaseUpdateHostedSite(id: string, data: Record<string, unknown>) {
  await sbFetch(`/hosted_sites?id=eq.${id}`, {
    method: 'PATCH',
    body:   JSON.stringify(data),
  });
}

export async function verifySupabaseJWT(token: string) {
  if (!token) throw new Error('No auth token provided');
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey:        SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Invalid or expired auth token');
  return res.json() as Promise<{ id: string; email: string }>;
}

// ── Stripe ────────────────────────────────────────────────────────────────────

function flattenParams(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flattenParams(v as Record<string, unknown>, key));
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => { out[`${key}[${i}]`] = String(item); });
    } else {
      out[key] = String(v);
    }
  }
  return out;
}

export async function stripeRequest(method: string, path: string, params: Record<string, unknown> = {}) {
  const url  = `https://api.stripe.com/v1/${path.replace(/^\//, '')}`;
  const opts: RequestInit = {
    method,
    headers: {
      Authorization:  `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };
  if (method === 'POST' && Object.keys(params).length) {
    (opts as { body: string }).body = new URLSearchParams(flattenParams(params)).toString();
  }
  const res = await fetch(url, opts);
  return res.json();
}

export function getOrigin(req: Request): string {
  const ref = req.headers.get('referer') || req.headers.get('origin') || '';
  if (!ref) return 'https://prompttosite-next.vercel.app';
  try {
    return new URL(ref).origin;
  } catch {
    return 'https://prompttosite-next.vercel.app';
  }
}

// ── Vercel ────────────────────────────────────────────────────────────────────

export async function vercelRequest(method: string, path: string, body: unknown = null) {
  const hasQ = path.includes('?');
  const url  = `https://api.vercel.com${path}${hasQ ? '&' : '?'}${VERCEL_TEAM_ID ? `teamId=${VERCEL_TEAM_ID}` : ''}`;
  const opts: RequestInit = {
    method,
    headers: {
      Authorization:  `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) (opts as { body: string }).body = JSON.stringify(body);
  const res  = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: { message?: string }; message?: string })?.error?.message || (data as { message?: string })?.message || `Vercel API error ${res.status}`);
  return data;
}

// ── Stripe webhook verification ───────────────────────────────────────────────

export async function verifyStripeWebhook(req: Request, secret: string) {
  const { createHmac } = await import('crypto');
  const payload = await req.text();
  const sig     = req.headers.get('stripe-signature') || '';

  const parts: Record<string, string> = {};
  for (const part of sig.split(',')) {
    const [k, v] = part.split('=');
    parts[k] = v;
  }
  if (!parts.t || !parts.v1) throw new Error('Missing signature parts');
  if (Math.abs(Date.now() / 1000 - parseInt(parts.t)) > 300) throw new Error('Timestamp too old');

  const expected = createHmac('sha256', secret)
    .update(`${parts.t}.${payload}`)
    .digest('hex');
  if (expected !== parts.v1) throw new Error('Signature mismatch');

  return JSON.parse(payload);
}
