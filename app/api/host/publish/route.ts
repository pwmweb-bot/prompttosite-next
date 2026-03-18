import { NextRequest } from 'next/server';
import {
  vercelRequest, verifySupabaseJWT,
  supabaseInsertHostedSite, supabaseUpdateHostedSite,
  VERCEL_TOKEN,
} from '@/lib/server/helpers';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!VERCEL_TOKEN) return Response.json({ error: 'Hosting not configured' }, { status: 500 });

  // 1. Authenticate
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
  let user: { id: string; email: string };
  try {
    user = await verifySupabaseJWT(token);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 401 });
  }

  const { generationId, files, domain, businessName, plan = 'monthly', contactInfo } = await req.json();

  if (!files?.length) return Response.json({ error: 'files are required' }, { status: 400 });
  if (!domain)        return Response.json({ error: 'domain is required' }, { status: 400 });

  const slug        = (businessName || domain).toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 40);
  const projectName = `pts-${user.id.slice(0, 8)}-${slug}`;

  // Insert initial record
  let siteRow: { id: string };
  try {
    siteRow = await supabaseInsertHostedSite({
      user_id:       user.id,
      generation_id: generationId || null,
      domain,
      business_name: businessName || null,
      billing_plan:  plan,
      status:        'deploying',
    });
  } catch (err) {
    return Response.json({ error: `DB error: ${(err as Error).message}` }, { status: 500 });
  }

  const siteId = siteRow?.id;

  async function failSite(msg: string) {
    if (siteId) await supabaseUpdateHostedSite(siteId, { status: 'error', error_message: msg });
    return Response.json({ error: msg }, { status: 500 });
  }

  try {
    // 2. Create Vercel project
    const project = await vercelRequest('POST', '/v11/projects', {
      name: projectName, framework: null,
    }) as { id: string };
    const projectId = project.id;
    await supabaseUpdateHostedSite(siteId, {
      vercel_project_id:   projectId,
      vercel_project_name: projectName,
    });

    // 3. Deploy files
    const vercelFiles = (files as { name: string; content: string }[]).map(f => ({
      file:     f.name,
      data:     f.content,
      encoding: 'utf-8',
    }));

    const deployment = await vercelRequest('POST', '/v13/deployments', {
      name: projectName, project: projectId, target: 'production',
      files: vercelFiles,
      projectSettings: { framework: null, outputDirectory: null },
    }) as { id: string; url?: string };

    const deploymentId  = deployment.id;
    const deploymentUrl = deployment.url ? `https://${deployment.url}` : null;
    await supabaseUpdateHostedSite(siteId, {
      vercel_deployment_id:  deploymentId,
      vercel_deployment_url: deploymentUrl,
    });

    // 4. Buy domain (if contact info provided)
    let domainPurchased = false;
    let domainPrice: number | null = null;
    if (contactInfo) {
      try {
        const priceData = await vercelRequest('GET',
          `/v1/registrar/domains/${encodeURIComponent(domain)}/price?years=1`
        ) as { purchasePrice: number };
        domainPrice = priceData.purchasePrice;
        await vercelRequest('POST', `/v1/registrar/domains/${encodeURIComponent(domain)}/buy`, {
          autoRenew: true, years: 1, expectedPrice: domainPrice, contactInformation: contactInfo,
        });
        domainPurchased = true;
      } catch (domainErr) {
        console.error('Domain purchase failed:', (domainErr as Error).message);
      }
    }

    // 5. Assign domain to project
    try {
      await vercelRequest('POST', `/v10/projects/${projectId}/domains`, { name: domain });
    } catch (assignErr) {
      console.error('Domain assign error:', (assignErr as Error).message);
    }

    // 6. Mark live
    const renewsAt = new Date();
    renewsAt.setFullYear(renewsAt.getFullYear() + 1);

    await supabaseUpdateHostedSite(siteId, {
      status:            'live',
      domain_purchased:  domainPurchased,
      domain_price:      domainPrice ? Math.round(domainPrice * 100) : null,
      renews_at:         renewsAt.toISOString(),
      domain_expires_at: domainPurchased ? renewsAt.toISOString() : null,
    });

    return Response.json({ success: true, siteId, projectId, deploymentUrl, domain, domainPurchased });

  } catch (err) {
    return failSite((err as Error).message);
  }
}
