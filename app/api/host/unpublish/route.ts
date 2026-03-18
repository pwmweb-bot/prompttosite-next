import { NextRequest } from 'next/server';
import {
  vercelRequest, verifySupabaseJWT, supabaseUpdateHostedSite,
  sbFetch, VERCEL_TOKEN,
} from '@/lib/server/helpers';

export async function POST(req: NextRequest) {
  if (!VERCEL_TOKEN) return Response.json({ error: 'Hosting not configured' }, { status: 500 });

  const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
  let user: { id: string };
  try {
    user = await verifySupabaseJWT(token);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 401 });
  }

  const { siteId } = await req.json();
  if (!siteId) return Response.json({ error: 'siteId is required' }, { status: 400 });

  // Fetch site and confirm ownership
  const siteRes = await sbFetch(`/hosted_sites?id=eq.${siteId}&user_id=eq.${user.id}&limit=1`);
  const sites   = await siteRes.json() as { vercel_project_id?: string }[];
  if (!sites.length) return Response.json({ error: 'Site not found' }, { status: 404 });

  const site = sites[0];

  try {
    if (site.vercel_project_id) {
      await vercelRequest('DELETE', `/v9/projects/${site.vercel_project_id}`);
    }
    await supabaseUpdateHostedSite(siteId, { status: 'cancelled' });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
