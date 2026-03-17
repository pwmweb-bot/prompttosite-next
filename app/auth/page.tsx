'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import styles from './auth.module.css';

type Tab = 'login' | 'signup';

export default function AuthPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [tab,          setTab]          = useState<Tab>('login');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [loading,      setLoading]      = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [msg,          setMsg]          = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [magicSent,    setMagicSent]    = useState(false);
  const [checking,     setChecking]     = useState(true);

  // Redirect if already signed in, handle magic-link callback
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) { router.replace('/dashboard'); return; }

      // OAuth / magic-link hash callback
      if (window.location.hash.includes('access_token')) {
        await supabase.auth.getSession();
        router.replace('/dashboard');
        return;
      }

      setChecking(false);
    })();

    // URL param: /auth?tab=signup
    const tabParam = searchParams.get('tab');
    if (tabParam === 'signup') setTab('signup');
  }, [router, searchParams]);

  // ── Tab ─────────────────────────────────────────────────────────────────────
  function switchTab(t: Tab) {
    setTab(t);
    setMsg(null);
  }

  // ── Email + password submit ──────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      if (tab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace('/dashboard');
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user?.identities?.length === 0) {
          setMsg({ text: 'This email is already registered. Try signing in instead.', type: 'error' });
          return;
        }
        setMsg({ text: 'Account created! Check your email for a confirmation link.', type: 'success' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setMsg({ text: message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // ── Magic link ───────────────────────────────────────────────────────────
  async function sendMagicLink() {
    if (!email) {
      setMsg({ text: 'Enter your email address above first.', type: 'error' });
      return;
    }
    setMagicLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      setMagicSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not send magic link. Try again.';
      setMsg({ text: message, type: 'error' });
    } finally {
      setMagicLoading(false);
    }
  }

  if (checking) return null; // Avoid flash before session check

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.navLogo}>
            Prompt<span>ToSite</span>
          </Link>
        </div>
      </nav>

      <div className={styles.authWrap}>
        <div className={styles.authCard}>

          {!magicSent ? (
            <>
              <h1 className={styles.heading} id="authHeading">
                {tab === 'login' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className={styles.subtitle}>
                {tab === 'login'
                  ? 'Sign in to your account to manage your websites.'
                  : 'Free account — save and manage all your generated sites.'}
              </p>

              <div className={styles.tabs}>
                <button
                  className={`${styles.tab} ${tab === 'login' ? styles.tabActive : ''}`}
                  onClick={() => switchTab('login')}
                >
                  Sign in
                </button>
                <button
                  className={`${styles.tab} ${tab === 'signup' ? styles.tabActive : ''}`}
                  onClick={() => switchTab('signup')}
                >
                  Create account
                </button>
              </div>

              {msg && (
                <div className={`${styles.msg} ${msg.type === 'error' ? styles.msgError : styles.msgSuccess}`}>
                  {msg.text}
                </div>
              )}

              <form className={styles.form} onSubmit={handleSubmit}>
                <div>
                  <label className={styles.label} htmlFor="authEmail">Email address</label>
                  <input
                    id="authEmail"
                    type="email"
                    className={styles.input}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className={styles.label} htmlFor="authPassword">Password</label>
                  <input
                    id="authPassword"
                    type="password"
                    className={styles.input}
                    placeholder={tab === 'login' ? 'Your password' : 'Min 8 characters'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  />
                </div>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={loading}
                >
                  {loading
                    ? tab === 'login' ? 'Signing in…' : 'Creating account…'
                    : tab === 'login' ? 'Sign in' : 'Create account'}
                </button>
              </form>

              <div className={styles.divider}>or</div>

              <button
                className={styles.btnMagic}
                onClick={sendMagicLink}
                disabled={magicLoading}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {magicLoading ? 'Sending…' : 'Send magic link instead'}
              </button>
            </>
          ) : (
            <div className={styles.magicSent}>
              <div className={styles.magicIcon}>✉️</div>
              <h2>Check your inbox</h2>
              <p>
                We&apos;ve sent a sign-in link to <strong>{email}</strong>.<br />
                Click the link in the email to sign in instantly.
              </p>
            </div>
          )}

          <p className={styles.footer}>
            By continuing you agree to our{' '}
            <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
