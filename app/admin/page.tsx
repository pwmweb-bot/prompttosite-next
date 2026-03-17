'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import styles from './admin.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

interface StripeRow {
  user_id: string;
  plan: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface GenCount {
  user_id: string;
  count: number;
  last_at: string | null;
}

interface UserRow {
  id: string;
  email: string;
  is_admin: boolean;
  joined: string;
  plan: string;
  status: string;
  periodEnd: string | null;
  cancelAtEnd: boolean;
  siteCount: number;
  lastActive: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [users,    setUsers]    = useState<UserRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState<'all' | 'pro' | 'free'>('all');

  useEffect(() => {
    (async () => {
      // 1. Check session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/auth'); return; }

      // 2. Check admin — superuser email gate
      if (session.user.email !== 'pwmweb@gmail.com') {
        router.replace('/dashboard');
        return;
      }

      setChecking(false);
      await loadData();
    })();
  }, [router]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      // Fetch all profiles
      const { data: profiles, error: pe } = await supabase
        .from('profiles')
        .select('id, email, is_admin, created_at')
        .order('created_at', { ascending: false });

      if (pe) throw pe;

      // Fetch all stripe_customers
      const { data: stripeRows } = await supabase
        .from('stripe_customers')
        .select('user_id, plan, status, current_period_end, cancel_at_period_end');

      // Fetch generation counts per user
      const { data: genRows } = await supabase
        .from('generations')
        .select('user_id, created_at');

      // Build lookup maps
      const stripeMap = new Map<string, StripeRow>();
      (stripeRows ?? []).forEach((r: StripeRow) => stripeMap.set(r.user_id, r));

      const genMap = new Map<string, GenCount>();
      (genRows ?? []).forEach((g: { user_id: string; created_at: string }) => {
        const existing = genMap.get(g.user_id);
        if (!existing) {
          genMap.set(g.user_id, { user_id: g.user_id, count: 1, last_at: g.created_at });
        } else {
          existing.count += 1;
          if (!existing.last_at || g.created_at > existing.last_at) {
            existing.last_at = g.created_at;
          }
        }
      });

      // Merge
      const rows: UserRow[] = (profiles ?? []).map((p: Profile) => {
        const stripe = stripeMap.get(p.id);
        const gen    = genMap.get(p.id);
        return {
          id:          p.id,
          email:       p.email,
          is_admin:    p.is_admin,
          joined:      p.created_at,
          plan:        stripe?.plan   ?? 'free',
          status:      stripe?.status ?? '—',
          periodEnd:   stripe?.current_period_end ?? null,
          cancelAtEnd: stripe?.cancel_at_period_end ?? false,
          siteCount:   gen?.count  ?? 0,
          lastActive:  gen?.last_at ?? null,
        };
      });

      setUsers(rows);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalUsers    = users.length;
  const proUsers      = users.filter(u => u.plan === 'pro' && u.status === 'active').length;
  const totalSites    = users.reduce((sum, u) => sum + u.siteCount, 0);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const matchSearch = !search || u.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ? true :
      filter === 'pro' ? (u.plan === 'pro' && u.status === 'active') :
      !(u.plan === 'pro' && u.status === 'active');
    return matchSearch && matchFilter;
  });

  if (checking) return null;

  return (
    <div className={styles.page}>
      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.navLogo}>
            Prompt<span>ToSite</span>
          </Link>
          <div className={styles.navRight}>
            <span className={styles.adminBadge}>Admin</span>
            <Link href="/dashboard" className={styles.navBack}>← Dashboard</Link>
          </div>
        </div>
      </nav>

      <div className={styles.content}>
        <div className={styles.pageHeader}>
          <h1>Admin Panel</h1>
          <p>Overview of all users and subscriptions</p>
        </div>

        {/* Stat cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{totalUsers}</div>
            <div className={styles.statLabel}>Total users</div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statValue} ${styles.statValuePro}`}>{proUsers}</div>
            <div className={styles.statLabel}>Pro subscribers</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{totalUsers - proUsers}</div>
            <div className={styles.statLabel}>Free users</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{totalSites}</div>
            <div className={styles.statLabel}>Sites generated</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <input
            className={styles.search}
            type="search"
            placeholder="Search by email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className={styles.filterTabs}>
            {(['all', 'pro', 'free'] as const).map(f => (
              <button
                key={f}
                className={`${styles.filterTab} ${filter === f ? styles.filterTabActive : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button className={styles.refreshBtn} onClick={loadData} disabled={loading}>
            {loading ? '↻ Loading…' : '↻ Refresh'}
          </button>
        </div>

        {/* Error */}
        {error && <div className={styles.errorMsg}>{error}</div>}

        {/* Table */}
        {loading ? (
          <div className={styles.loadingMsg}>Loading users…</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Renewal / Cancels</th>
                  <th>Sites</th>
                  <th>Last active</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyRow}>No users match.</td>
                  </tr>
                ) : (
                  filtered.map(u => {
                    const isPro   = u.plan === 'pro' && u.status === 'active';
                    const joined  = new Date(u.joined).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                    const period  = u.periodEnd
                      ? new Date(u.periodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—';
                    const last    = u.lastActive
                      ? new Date(u.lastActive).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—';

                    return (
                      <tr key={u.id} className={u.is_admin ? styles.adminRow : ''}>
                        <td className={styles.emailCell}>
                          {u.email}
                          {u.is_admin && <span className={styles.adminPill}>admin</span>}
                        </td>
                        <td>{joined}</td>
                        <td>
                          <span className={`${styles.planBadge} ${isPro ? styles.planPro : styles.planFree}`}>
                            {isPro ? 'Pro' : 'Free'}
                          </span>
                        </td>
                        <td className={styles.statusCell}>
                          {u.status !== '—' ? u.status.charAt(0).toUpperCase() + u.status.slice(1) : '—'}
                        </td>
                        <td>
                          {isPro && u.periodEnd
                            ? `${u.cancelAtEnd ? 'Cancels' : 'Renews'} ${period}`
                            : '—'}
                        </td>
                        <td className={styles.countCell}>{u.siteCount}</td>
                        <td>{last}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
