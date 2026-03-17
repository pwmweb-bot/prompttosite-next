'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { stripeCheckout, stripeInvoices, stripePortal, unpublishSite } from '@/lib/api';
import { downloadAsZip, triggerDownload } from '@/lib/builder/zipDownload';
import type { Session } from '@supabase/supabase-js';
import type { Generation, HostedSite } from '@/lib/supabase/types';
import styles from './dashboard.module.css';

// ─── Invoice type ─────────────────────────────────────────────────────────────

interface Invoice {
  number: string;
  created: number;
  amount: number;
  currency: string;
  status: string;
  pdf?: string;
  hosted_url?: string;
}

// ─── Billing record type ──────────────────────────────────────────────────────

interface BillingRecord {
  plan: string;
  status: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}

// ─── Industry emoji helper ────────────────────────────────────────────────────

const INDUSTRY_EMOJI: Record<string, string> = {
  coaching: '🎯', restaurant: '🍽️', realestate: '🏠', health: '💚',
  ecommerce: '🛒', legal: '⚖️', fitness: '💪', education: '📚',
  beauty: '✨', finance: '📊',
};

function industryEmoji(industry: string) {
  return INDUSTRY_EMOJI[industry] || '🌐';
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  function show(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3500);
  }

  return { message, show };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardPageInner />
    </Suspense>
  );
}

function DashboardPageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [session,        setSession]        = useState<Session | null>(null);
  const [generations,    setGenerations]    = useState<Generation[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [isAdmin,        setIsAdmin]        = useState(false);
  const [activeTab,      setActiveTab]      = useState<'sites' | 'hosted' | 'billing'>('sites');
  const [deleteTarget,   setDeleteTarget]   = useState<string | null>(null);
  const [deleting,       setDeleting]       = useState(false);

  // Hosted sites
  const [hostedSites,    setHostedSites]    = useState<HostedSite[]>([]);
  const [hostedLoading,  setHostedLoading]  = useState(false);
  const [hostedLoaded,   setHostedLoaded]   = useState(false);
  const [unpublishTarget, setUnpublishTarget] = useState<string | null>(null);
  const [unpublishing,   setUnpublishing]   = useState(false);

  // Billing
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingLoaded,  setBillingLoaded]  = useState(false);
  const [billingRecord,  setBillingRecord]  = useState<BillingRecord | null>(null);
  const [invoices,       setInvoices]       = useState<Invoice[]>([]);
  const [checkoutBusy,   setCheckoutBusy]   = useState(false);
  const [portalBusy,     setPortalBusy]     = useState(false);

  const { message: toastMsg, show: showToast } = useToast();

  // ── Auth guard + boot ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/auth'); return; }
      setSession(session);
      if (session.user.email === 'pwmweb@gmail.com') setIsAdmin(true);
      await loadGenerations(session.user.id);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!s) router.replace('/auth');
      else setSession(s);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // ── Handle Stripe redirect params ─────────────────────────────────────────
  useEffect(() => {
    const upgraded  = searchParams.get('upgraded');
    const cancelled = searchParams.get('cancelled');
    if (upgraded === '1') {
      showToast("🎉 You're now on Pro! Billing updated shortly.");
      window.history.replaceState({}, '', '/dashboard');
      setActiveTab('billing');
    } else if (cancelled === '1') {
      showToast('Checkout cancelled — no charge made.');
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  // ── Load generations ───────────────────────────────────────────────────────
  async function loadGenerations(userId: string) {
    const { data, error } = await supabase
      .from('generations')
      .select('id, business_name, industry, page_count, created_at, form_data, files')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    setLoading(false);
    if (!error && data) setGenerations(data as Generation[]);
  }

  // ── Load hosted sites ──────────────────────────────────────────────────────
  async function loadHostedSites(userId: string) {
    if (hostedLoaded) return;
    setHostedLoading(true);
    const { data, error } = await supabase
      .from('hosted_sites')
      .select('id, domain, domain_purchased, vercel_deployment_url, vercel_project_name, billing_plan, status, business_name, created_at, updated_at, generation_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    setHostedLoading(false);
    setHostedLoaded(true);
    if (!error && data) setHostedSites(data as HostedSite[]);
  }

  // ── Unpublish ──────────────────────────────────────────────────────────────
  async function confirmUnpublish() {
    if (!unpublishTarget || !session) return;
    setUnpublishing(true);

    const { data: { session: freshSession } } = await supabase.auth.getSession();
    if (!freshSession) { setUnpublishing(false); return; }

    const { error } = await unpublishSite(freshSession.access_token, unpublishTarget);
    if (!error) {
      setHostedSites((prev) => prev.filter((s) => s.id !== unpublishTarget));
      showToast('Site unpublished successfully.');
    } else {
      showToast(`Unpublish failed: ${error}`);
    }

    setUnpublishTarget(null);
    setUnpublishing(false);
  }

  // ── Download ZIP ───────────────────────────────────────────────────────────
  async function handleDownload(gen: Generation) {
    const files = Array.isArray(gen.files)
      ? gen.files
      : typeof gen.files === 'string' ? JSON.parse(gen.files) : [];

    if (!files.length) return;

    if (files.length === 1) {
      triggerDownload(files[0].name, files[0].content, 'text/html');
      return;
    }

    await downloadAsZip(files, gen.business_name || 'website');
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    const { error } = await supabase
      .from('generations')
      .delete()
      .eq('id', deleteTarget);

    if (!error) {
      setGenerations((prev) => prev.filter((g) => g.id !== deleteTarget));
    }

    setDeleteTarget(null);
    setDeleting(false);
  }

  // ── Billing ────────────────────────────────────────────────────────────────
  async function loadBilling() {
    if (!session || billingLoaded) return;
    setBillingLoading(true);

    const { data: rows } = await supabase
      .from('stripe_customers')
      .select('plan, status, current_period_end, cancel_at_period_end')
      .eq('user_id', session.user.id)
      .limit(1);

    const rec = rows?.[0] as BillingRecord | undefined;
    setBillingRecord(rec ?? null);

    const isPro = rec?.plan === 'pro' && rec?.status === 'active';
    if (isPro) {
      const data = await stripeInvoices(session.user.id);
      setInvoices((data.invoices as Invoice[]) ?? []);
    }

    setBillingLoading(false);
    setBillingLoaded(true);
  }

  function handleTabChange(tab: 'sites' | 'hosted' | 'billing') {
    setActiveTab(tab);
    if (tab === 'billing' && session) loadBilling();
    if (tab === 'hosted' && session) loadHostedSites(session.user.id);
  }

  async function startCheckout() {
    if (!session) return;
    setCheckoutBusy(true);
    const { url, error } = await stripeCheckout(session.user.id, session.user.email ?? '');
    if (url) window.location.href = url;
    else { showToast(error || 'Could not start checkout.'); setCheckoutBusy(false); }
  }

  async function openPortal() {
    if (!session) return;
    setPortalBusy(true);
    const { url, error } = await stripePortal(session.user.id);
    if (url) window.location.href = url;
    else { showToast(error || 'Could not open portal.'); setPortalBusy(false); }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/auth');
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const isPro = billingRecord?.plan === 'pro' && billingRecord?.status === 'active';

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.navLogo}>Prompt<span>ToSite</span></Link>
          <div className={styles.navRight}>
            {session && <span className={styles.navEmail}>{session.user.email}</span>}
            {isAdmin && (
              <Link href="/admin" className={`${styles.btnSm} ${styles.btnSmOutline}`}>⚙ Admin</Link>
            )}
            <Link href="/build" className={`${styles.btnSm} ${styles.btnSmOutline}`}>+ New website</Link>
            <button className={`${styles.btnSm} ${styles.btnSmOutline}`} onClick={signOut}>Sign out</button>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className={styles.dashTabs}>
        <button
          className={`${styles.dashTab} ${activeTab === 'sites' ? styles.dashTabActive : ''}`}
          onClick={() => handleTabChange('sites')}
        >
          My websites
        </button>
        <button
          className={`${styles.dashTab} ${activeTab === 'hosted' ? styles.dashTabActive : ''}`}
          onClick={() => handleTabChange('hosted')}
        >
          Live sites
        </button>
        <button
          className={`${styles.dashTab} ${activeTab === 'billing' ? styles.dashTabActive : ''}`}
          onClick={() => handleTabChange('billing')}
        >
          Billing
        </button>
      </div>

      {/* Sites panel */}
      {activeTab === 'sites' && (
        <div>
          <div className={styles.pageHeader}>
            <div>
              <h1>My websites</h1>
              <p>
                {loading
                  ? 'Loading your projects…'
                  : generations.length === 0
                    ? 'No websites yet — generate your first one!'
                    : `${generations.length} website${generations.length === 1 ? '' : 's'} generated`}
              </p>
            </div>
          </div>

          <div className={styles.genGrid}>
            {loading ? (
              [0, 1, 2].map((i) => (
                <div key={i} className={styles.skelCard}>
                  <div className={`${styles.skeleton} ${styles.skelPreview}`} />
                  <div className={styles.skelBody}>
                    <div className={`${styles.skeleton} ${styles.skelTitle}`} />
                    <div className={`${styles.skeleton} ${styles.skelMeta}`} />
                    <div className={`${styles.skeleton} ${styles.skelBtns}`} />
                  </div>
                </div>
              ))
            ) : generations.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🌐</div>
                <h2>No websites yet</h2>
                <p>Go to the prompt builder, fill in your business details, and generate your first AI website in about 30 seconds.</p>
                <Link href="/build" className={styles.btnPrimaryLg}>Build my first website →</Link>
              </div>
            ) : (
              generations.map((gen) => {
                const date     = new Date(gen.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                const pages    = gen.page_count || 0;
                const industry = gen.industry || 'custom';
                const name     = gen.business_name || 'Untitled website';
                const emoji    = industryEmoji(industry);

                return (
                  <div key={gen.id} className={styles.genCard}>
                    <div className={styles.cardPreview}>
                      <div className={styles.cardPreviewIcon}>{emoji}</div>
                      <span className={styles.cardPreviewBadge}>{pages} page{pages === 1 ? '' : 's'}</span>
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardTitle} title={name}>{name}</div>
                      <div className={styles.cardMeta}>
                        <span>📅 {date}</span>
                        <span>🏷️ {industry.charAt(0).toUpperCase() + industry.slice(1)}</span>
                      </div>
                      <div className={styles.cardActions}>
                        <button
                          className={`${styles.cardBtn} ${styles.cardBtnPrimary}`}
                          onClick={() => handleDownload(gen)}
                        >
                          ⬇ Download ZIP
                        </button>
                        <button
                          className={styles.cardBtn}
                          onClick={() => setDeleteTarget(gen.id)}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Live sites panel */}
      {activeTab === 'hosted' && (
        <div>
          <div className={styles.pageHeader}>
            <div>
              <h1>Live sites</h1>
              <p>
                {hostedLoading
                  ? 'Loading your live sites…'
                  : hostedSites.length === 0
                    ? 'No live sites yet — publish one from the builder!'
                    : `${hostedSites.length} published site${hostedSites.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>

          <div className={styles.hostedGrid}>
            {hostedLoading ? (
              [0, 1].map((i) => (
                <div key={i} className={styles.skelCard}>
                  <div className={`${styles.skeleton} ${styles.skelPreview}`} />
                  <div className={styles.skelBody}>
                    <div className={`${styles.skeleton} ${styles.skelTitle}`} />
                    <div className={`${styles.skeleton} ${styles.skelMeta}`} />
                    <div className={`${styles.skeleton} ${styles.skelBtns}`} />
                  </div>
                </div>
              ))
            ) : hostedSites.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🚀</div>
                <h2>No live sites yet</h2>
                <p>Generate a website in the builder and click the Publish button to go live with a real domain.</p>
                <a href="/build" className={styles.btnPrimaryLg}>Build &amp; publish →</a>
              </div>
            ) : (
              hostedSites.map((site) => {
                const date       = new Date(site.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                const isLive     = site.status === 'live';
                const isFailed   = site.status === 'failed';
                const liveUrl    = isLive
                  ? (site.domain_purchased ? `https://${site.domain}` : site.vercel_deployment_url ?? '')
                  : site.vercel_deployment_url ?? '';

                return (
                  <div key={site.id} className={styles.hostedCard}>
                    <div className={`${styles.hostedCardHeader} ${isLive ? styles.hostedCardHeaderLive : isFailed ? styles.hostedCardHeaderFail : styles.hostedCardHeaderPending}`}>
                      <div className={styles.hostedGlobe}>🌐</div>
                      <span className={`${styles.hostedBadge} ${isLive ? styles.hostedBadgeLive : isFailed ? styles.hostedBadgeFail : styles.hostedBadgePending}`}>
                        {isLive ? '● Live' : isFailed ? '✕ Failed' : '◌ Pending'}
                      </span>
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardTitle} title={site.domain}>{site.domain}</div>
                      {site.business_name && (
                        <div className={styles.hostedBusiness}>{site.business_name}</div>
                      )}
                      <div className={styles.cardMeta}>
                        <span>📅 {date}</span>
                        <span>💳 {site.billing_plan === 'annual' ? 'Annual' : 'Monthly'}</span>
                      </div>
                      {liveUrl && (
                        <div className={styles.hostedUrl}>
                          <a href={liveUrl} target="_blank" rel="noopener noreferrer" className={styles.hostedUrlLink}>
                            {liveUrl.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                      <div className={styles.cardActions}>
                        {liveUrl && (
                          <a
                            href={liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${styles.cardBtn} ${styles.cardBtnPrimary}`}
                          >
                            🌐 Open site
                          </a>
                        )}
                        <button
                          className={styles.cardBtn}
                          onClick={() => setUnpublishTarget(site.id)}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Billing panel */}
      {activeTab === 'billing' && (
        <div className={styles.billingPanel}>
          {billingLoading ? (
            <div className={styles.billingLoading}>Loading billing info…</div>
          ) : (
            <>
              {!isPro ? (
                <div className={styles.upgradeCard}>
                  <div className={styles.upgradeFeatures}>
                    <span className={styles.upgradeFeature}>✓ Unlimited websites</span>
                    <span className={styles.upgradeFeature}>✓ Save all projects</span>
                    <span className={styles.upgradeFeature}>✓ Download anytime</span>
                    <span className={styles.upgradeFeature}>✓ Edit &amp; refine mode</span>
                  </div>
                  <h2>Upgrade to Pro</h2>
                  <p>Generate unlimited AI websites, save every project, and access advanced editing tools — all for one flat monthly fee.</p>
                  <div className={styles.upgradePrice}>£9 <span>/ month</span></div>
                  <button className={styles.btnUpgrade} onClick={startCheckout} disabled={checkoutBusy}>
                    {checkoutBusy ? 'Loading…' : 'Upgrade now →'}
                  </button>
                </div>
              ) : (
                <div className={styles.planCard}>
                  <div>
                    <span className={`${styles.planBadge} ${billingRecord?.status === 'past_due' ? styles.planBadgePastDue : styles.planBadgePro}`}>
                      {billingRecord?.status === 'past_due' ? 'Past due' : 'Pro'}
                    </span>
                    <div className={styles.planName}>Pro Plan</div>
                    <div className={styles.planMeta}>
                      {billingRecord?.status === 'past_due' ? 'Past due' : 'Active'}
                      {billingRecord?.current_period_end && (
                        billingRecord.cancel_at_period_end
                          ? ` · Cancels ${new Date(billingRecord.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
                          : ` · Renews ${new Date(billingRecord.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
                      )}
                    </div>
                  </div>
                  <button className={`${styles.btnSm} ${styles.btnSmOutline}`} onClick={openPortal} disabled={portalBusy}>
                    {portalBusy ? 'Loading…' : 'Manage subscription →'}
                  </button>
                </div>
              )}

              {isPro && (
                <div className={styles.invoicesSection}>
                  <div className={styles.billingSectionTitle}>Invoice history</div>
                  {invoices.length === 0 ? (
                    <div className={styles.noInvoices}>No invoices yet.</div>
                  ) : (
                    <table className={styles.invoiceTable}>
                      <thead>
                        <tr>
                          <th>Invoice</th>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map((inv) => {
                          const date = new Date(inv.created * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                          const amt  = (inv.amount / 100).toLocaleString('en-GB', { style: 'currency', currency: inv.currency });
                          return (
                            <tr key={inv.number}>
                              <td className={styles.invNumber}>{inv.number}</td>
                              <td>{date}</td>
                              <td className={styles.invAmount}>{amt}</td>
                              <td>
                                <span className={`${styles.invStatus} ${inv.status === 'paid' ? styles.invPaid : inv.status === 'open' ? styles.invOpen : styles.invVoid}`}>
                                  {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                                </span>
                              </td>
                              <td>
                                {inv.pdf
                                  ? <a className={styles.invLink} href={inv.pdf} target="_blank" rel="noopener noreferrer">Download PDF</a>
                                  : inv.hosted_url
                                    ? <a className={styles.invLink} href={inv.hosted_url} target="_blank" rel="noopener noreferrer">View invoice</a>
                                    : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div className={styles.overlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <h3>Delete this website?</h3>
            <p>This will permanently remove the generation and all its files. This cannot be undone.</p>
            <div className={styles.confirmActions}>
              <button className={styles.btnCancel} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className={styles.btnDanger} onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unpublish modal */}
      {unpublishTarget && (
        <div className={styles.overlay} onClick={() => setUnpublishTarget(null)}>
          <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
            <h3>Unpublish this site?</h3>
            <p>This will take the site offline and remove it from Vercel. Your domain registration (if purchased) is separate and not affected.</p>
            <div className={styles.confirmActions}>
              <button className={styles.btnCancel} onClick={() => setUnpublishTarget(null)}>Cancel</button>
              <button className={styles.btnDanger} onClick={confirmUnpublish} disabled={unpublishing}>
                {unpublishing ? 'Unpublishing…' : 'Unpublish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && <div className={styles.toast}>{toastMsg}</div>}
    </div>
  );
}
