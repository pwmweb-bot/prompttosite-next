import Link from 'next/link';
import styles from './home.module.css';

const INDUSTRIES = [
  { id: 'coaching',   icon: '🎯', label: 'Life Coaching',      bg: '#eff6ff', desc: 'Conversion-focused sites that attract ideal clients and showcase your methodology.' },
  { id: 'restaurant', icon: '🍽️', label: 'Restaurant / Café',   bg: '#fff7ed', desc: 'Mouth-watering menus, online booking, and atmosphere that drives covers.' },
  { id: 'realestate', icon: '🏠', label: 'Real Estate',         bg: '#f0fdf4', desc: 'Property listings, lead capture forms, and local authority content.' },
  { id: 'health',     icon: '💚', label: 'Health & Wellness',   bg: '#fdf2f8', desc: 'Trust-building sites that convert visitors into loyal patients or clients.' },
  { id: 'ecommerce',  icon: '🛒', label: 'E-commerce',          bg: '#fffbeb', desc: 'Product showcases, social proof, and frictionless checkout flows.' },
  { id: 'legal',      icon: '⚖️', label: 'Law Firm',            bg: '#f1f5f9', desc: 'Professional credibility that attracts high-value clients.' },
  { id: 'fitness',    icon: '💪', label: 'Gym / PT Studio',     bg: '#fff1f2', desc: 'High-energy sites that sell memberships and personal training packages.' },
  { id: 'education',  icon: '📚', label: 'Education / Tutoring', bg: '#f0f9ff', desc: 'Course pages, testimonials, and enrolment flows that fill cohorts.' },
  { id: 'beauty',     icon: '✨', label: 'Beauty & Hair',       bg: '#fdf4ff', desc: 'Stunning portfolios, booking integration, and price lists that convert.' },
  { id: 'finance',    icon: '📊', label: 'Financial Services',  bg: '#f0fdf4', desc: 'Authoritative sites that build trust and generate qualified leads.' },
];

const STEPS = [
  { num: '01', title: 'Describe your business', desc: 'Tell us your industry, what you do, who you serve, and what action you want visitors to take.' },
  { num: '02', title: 'Customise the design',   desc: 'Choose your colour palette, fonts, mood tags, and layout features. Preview the prompt live.' },
  { num: '03', title: 'Generate in seconds',    desc: 'Claude AI writes every page — real copy, real structure, real code. No Lorem Ipsum.' },
  { num: '04', title: 'Download & go live',     desc: 'Get a complete ZIP of production-ready HTML/CSS/JS files. Hand to your host or upload directly.' },
];

const FEATURES = [
  { icon: '✍️', title: 'Real copy, not filler',      desc: 'AI writes genuine content tailored to your business — headlines, body copy, CTAs, and more.' },
  { icon: '📱', title: 'Mobile-first & responsive',  desc: 'Every generated site looks great on phones, tablets, and desktops from the start.' },
  { icon: '🔍', title: 'SEO built in',               desc: 'Title tags, meta descriptions, JSON-LD schema, and keyword-rich headings included automatically.' },
  { icon: '🖼️', title: 'Royalty-free images',        desc: 'Pexels integration pulls contextually relevant photography — no placeholder boxes.' },
  { icon: '⚡', title: 'Multi-page in one go',       desc: 'Generate up to 14 pages in a single session using multi-call stitching with consistent design.' },
  { icon: '🎨', title: '8 industry templates',       desc: 'Start from a fully configured template and customise every detail before generating.' },
];

export default function HomePage() {
  return (
    <div className={styles.page}>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className={styles.nav}>
        <div className={`${styles.container} ${styles.navInner}`}>
          <Link href="/" className={styles.navLogo}>Prompt<span>ToSite</span></Link>
          <ul className={styles.navLinks}>
            <li><a href="#how-it-works">How it works</a></li>
            <li><a href="#industries">Industries</a></li>
            <li><a href="#features">Features</a></li>
            <li><Link href="/auth" className={styles.navCta}>Start free →</Link></li>
          </ul>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.tag}>AI Website Generator</div>
          <h1>
            From prompt to<br />
            <em>production-ready site</em><br />
            in under a minute.
          </h1>
          <p className={styles.heroSub}>
            Describe your business. Choose your design. Let Claude AI build every page,
            write all the copy, and generate clean HTML/CSS/JS you can go live with today.
          </p>
          <div className={styles.heroActions}>
            <Link href="/build" className={styles.btnPrimary}>Build my website →</Link>
            <Link href="/auth" className={styles.btnSecondary}>Sign in / Sign up</Link>
          </div>
          <p className={styles.heroNote}>No credit card required to start · Free account included</p>

          <div className={styles.previewStrip}>
            <div className={styles.previewScroll}>
              {INDUSTRIES.map((ind) => (
                <Link key={ind.id} href={`/build?industry=${ind.id}`} className={styles.previewChip}>
                  <span className={styles.dot} />
                  {ind.icon} {ind.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className={styles.section} id="how-it-works">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.tag}>Simple process</div>
            <h2>Four steps to a complete website</h2>
            <p>No design skills. No code. Just your business knowledge and our AI.</p>
          </div>
          <div className={styles.steps}>
            {STEPS.map((step) => (
              <div key={step.num} className={styles.step}>
                <div className={styles.stepNum}>{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Industries ───────────────────────────────────────────────────── */}
      <section className={`${styles.section} ${styles.sectionLight}`} id="industries">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.tag}>24+ industries</div>
            <h2>Built for every type of business</h2>
            <p>
              Each industry has its own defaults — copy angle, design style, page structure, and
              SEO keywords — so your site feels purpose-built, not generic.
            </p>
          </div>
          <div className={styles.industriesGrid}>
            {INDUSTRIES.map((ind) => (
              <Link key={ind.id} href={`/build?industry=${ind.id}`} className={styles.industryCard}>
                <div className={styles.industryIcon} style={{ background: ind.bg }}>{ind.icon}</div>
                <h3>{ind.label}</h3>
                <p>{ind.desc}</p>
                <span className={styles.industryLink}>
                  Build this site
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className={styles.section} id="features">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.tag}>What you get</div>
            <h2>Everything a good website needs</h2>
            <p>Not just a pretty template — real content, real code, real results.</p>
          </div>
          <div className={styles.featuresGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className={styles.ctaBanner}>
        <div className={styles.container}>
          <h2>Ready to build your website?</h2>
          <p>Start free, upgrade when you need more. No design skills required.</p>
          <Link href="/build" className={styles.btnPrimaryLg}>Start building now →</Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerInner}>
            <span className={styles.footerLogo}>Prompt<span>ToSite</span></span>
            <div className={styles.footerLinks}>
              <Link href="/auth">Sign in</Link>
              <Link href="/build">Builder</Link>
              <Link href="/dashboard">Dashboard</Link>
            </div>
          </div>
          <p className={styles.footerCopy}>
            © {new Date().getFullYear()} PromptToSite. AI-powered website generation.
          </p>
        </div>
      </footer>

    </div>
  );
}
