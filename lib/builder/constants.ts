// ─── TypeScript Interfaces ────────────────────────────────────────────────────

export interface PageOption {
  id: string;
  label: string;
  checked: boolean;
  locked: boolean;
}

export interface SectionOption {
  id: string;
  label: string;
  checked: boolean;
}

export interface FontPairing {
  id: string;
  name: string;
  heading: string;
  body: string;
  headFont: string;
  bodyFont: string;
  desc: string;
}

export interface ToneOption {
  id: string;
  label: string;
  desc: string;
}

export interface LayoutFeature {
  id: string;
  icon: string;
  label: string;
  checked: boolean;
}

export interface PalettePreset {
  name: string;
  colors: [string, string, string, string];
}

export interface Template {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  desc: string;
  industry: string;
  whatTheyDo: string;
  audience: string;
  primaryCta: string;
  designStyle: string;
  colors: { primary: string; secondary: string; accent: string; bg: string };
  font: string;
  tone: string;
  moods: string[];
  pages: string[];
  seoKeywords: string;
}

export type PageDetailFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'checkgroup'
  | 'toggle'
  | 'row2';

export interface CheckgroupOption {
  id: string;
  label: string;
  checked: boolean;
}

export interface PageDetailField {
  type: PageDetailFieldType;
  id?: string;
  label?: string;
  placeholder?: string;
  rows?: number;
  options?: string[] | CheckgroupOption[];
  children?: PageDetailField[];
}

export interface DynamicConfig {
  key: string;
  addLabel: string;
  singularLabel: string;
  itemFields: PageDetailField[];
  defaultCount: number;
}

export interface PageDetailConfig {
  label: string;
  icon: string;
  fields?: PageDetailField[];
  dynamic?: DynamicConfig;
}

// ─── Website Pages ────────────────────────────────────────────────────────────

export const allPages: PageOption[] = [
  { id: 'pg_home',         label: '🏠 Home',                      checked: true,  locked: true  },
  { id: 'pg_about',        label: '👤 About Us',                  checked: true,  locked: false },
  { id: 'pg_services',     label: '🛠️ Services / Offerings',      checked: false, locked: false },
  { id: 'pg_contact',      label: '📬 Contact',                   checked: true,  locked: false },
  { id: 'pg_pricing',      label: '💰 Pricing',                   checked: false, locked: false },
  { id: 'pg_blog',         label: '📝 Blog / News',               checked: false, locked: false },
  { id: 'pg_testimonials', label: '⭐ Testimonials',              checked: false, locked: false },
  { id: 'pg_portfolio',    label: '🖼️ Portfolio / Case Studies',  checked: false, locked: false },
  { id: 'pg_faq',          label: '❓ FAQ',                       checked: false, locked: false },
  { id: 'pg_team',         label: '👥 Meet the Team',             checked: false, locked: false },
  { id: 'pg_gallery',      label: '📸 Gallery',                   checked: false, locked: false },
  { id: 'pg_booking',      label: '📅 Book / Schedule Online',    checked: false, locked: false },
  { id: 'pg_privacy',      label: '🔒 Privacy Policy',            checked: false, locked: false },
  { id: 'pg_terms',        label: '📄 Terms & Conditions',        checked: false, locked: false },
];

// ─── Default Sections ─────────────────────────────────────────────────────────

export const allSections: SectionOption[] = [
  { id: 'hero',         label: 'Hero / Header',       checked: true  },
  { id: 'problem',      label: 'Problem / Pain',      checked: true  },
  { id: 'solution',     label: 'Solution / Benefits', checked: true  },
  { id: 'how',          label: 'How It Works',        checked: true  },
  { id: 'testimonials', label: 'Testimonials',        checked: true  },
  { id: 'pricing',      label: 'Pricing / Packages',  checked: false },
  { id: 'about',        label: 'About / Credibility', checked: true  },
  { id: 'faq',          label: 'FAQ',                 checked: false },
  { id: 'cta',          label: 'Final CTA',           checked: true  },
  { id: 'footer',       label: 'Footer',              checked: true  },
  { id: 'gallery',      label: 'Gallery / Portfolio', checked: false },
  { id: 'menu',         label: 'Menu / Service List', checked: false },
];

// ─── Font Pairings ────────────────────────────────────────────────────────────

export const fontPairings: FontPairing[] = [
  {
    id: 'modern-sans',
    name: 'Modern Sans',
    heading: 'Inter',
    body: 'Inter',
    headFont: "'Inter', sans-serif",
    bodyFont: "'Inter', sans-serif",
    desc: 'Clean & contemporary',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    heading: 'Playfair Display',
    body: 'Lato',
    headFont: "'Playfair Display', serif",
    bodyFont: "'Lato', sans-serif",
    desc: 'Elegant & premium',
  },
  {
    id: 'friendly',
    name: 'Friendly',
    heading: 'Nunito',
    body: 'Open Sans',
    headFont: "'Nunito', sans-serif",
    bodyFont: "'Open Sans', sans-serif",
    desc: 'Warm & approachable',
  },
  {
    id: 'bold-impact',
    name: 'Bold Impact',
    heading: 'Oswald',
    body: 'Lato',
    headFont: "'Oswald', sans-serif",
    bodyFont: "'Lato', sans-serif",
    desc: 'Strong & energetic',
  },
  {
    id: 'ultra-minimal',
    name: 'Ultra Minimal',
    heading: 'DM Sans',
    body: 'DM Sans',
    headFont: "'DM Sans', sans-serif",
    bodyFont: "'DM Sans', sans-serif",
    desc: 'Sleek & refined',
  },
  {
    id: 'classic',
    name: 'Classic',
    heading: 'Merriweather',
    body: 'Lato',
    headFont: "'Merriweather', serif",
    bodyFont: "'Lato', sans-serif",
    desc: 'Traditional & trusted',
  },
];

// ─── Mood Tags ────────────────────────────────────────────────────────────────

export const moodTagList: string[] = [
  'Professional', 'Friendly', 'Bold', 'Minimal', 'Luxurious', 'Playful',
  'Energetic', 'Calm', 'Trustworthy', 'Modern', 'Traditional', 'Creative',
  'Corporate', 'Warm', 'Premium', 'Youthful', 'Sophisticated', 'Edgy',
];

// ─── Tone Options ─────────────────────────────────────────────────────────────

export const toneOptions: ToneOption[] = [
  { id: 'professional',  label: 'Professional',  desc: 'clear, expert, authoritative' },
  { id: 'friendly',      label: 'Friendly',       desc: 'warm, approachable, conversational' },
  { id: 'luxury',        label: 'Luxury',         desc: 'refined, elegant, aspirational' },
  { id: 'playful',       label: 'Playful',        desc: 'fun, energetic, personality-led' },
  { id: 'casual',        label: 'Casual',         desc: 'relaxed, honest, down-to-earth' },
  { id: 'authoritative', label: 'Authoritative',  desc: 'commanding, results-focused, confident' },
];

// ─── Layout Features ──────────────────────────────────────────────────────────

export const layoutFeatureList: LayoutFeature[] = [
  { id: 'lf_sticky_nav',   icon: '📌', label: 'Sticky navigation',       checked: true  },
  { id: 'lf_fullscreen',   icon: '🖥️', label: 'Full-screen hero',         checked: true  },
  { id: 'lf_scroll_anim',  icon: '✨', label: 'Scroll animations',        checked: true  },
  { id: 'lf_rounded',      icon: '⬜', label: 'Rounded corners',          checked: true  },
  { id: 'lf_cards',        icon: '🃏', label: 'Card-based layout',        checked: true  },
  { id: 'lf_floating_cta', icon: '🔔', label: 'Floating CTA button',      checked: false },
  { id: 'lf_darkmode',     icon: '🌙', label: 'Dark mode support',        checked: false },
  { id: 'lf_gradient',     icon: '🎨', label: 'Gradient accents',         checked: false },
  { id: 'lf_parallax',     icon: '🔄', label: 'Parallax scrolling',       checked: false },
  { id: 'lf_video_bg',     icon: '🎥', label: 'Video background (hero)',  checked: false },
  { id: 'lf_countdown',    icon: '⏱️', label: 'Countdown timer',          checked: false },
  { id: 'lf_chatwidget',   icon: '💬', label: 'Live chat widget',         checked: false },
];

// ─── Industry Defaults ────────────────────────────────────────────────────────

export interface IndustryDefault {
  whatTheyDo: string;
  audience: string;
  primaryCta: string;
  designStyle: string;
}

export const industryDefaults: Record<string, IndustryDefault> = {
  coaching: {
    whatTheyDo: 'Helping business owners align their strategy, team, and systems to scale past their next revenue milestone in 90 days.',
    audience: 'Business owners doing £100k–£500k who are overwhelmed, stuck at a plateau, and unsure what to focus on next to grow.',
    primaryCta: 'Book a free consultation',
    designStyle: 'High-converting sales page with bold headline hierarchy, urgency elements, benefit-stacked sections, testimonial blocks, pricing anchors, money-back guarantee badges, countdown timers, and sticky CTA buttons',
  },
  restaurant: {
    whatTheyDo: 'A neighbourhood restaurant serving seasonally inspired dishes made with locally sourced ingredients in a warm, welcoming setting.',
    audience: 'Local diners, couples celebrating special occasions, and food lovers looking for a memorable dining experience.',
    primaryCta: 'Reserve a table',
    designStyle: 'Warm, sensory-driven hospitality brand with rich photography, ambient colour palette, immersive storytelling, and reservation-focused layout',
  },
  realestate: {
    whatTheyDo: 'Helping buyers, sellers, and landlords navigate the property market with expert local knowledge and a proven track record.',
    audience: 'First-time buyers, homeowners looking to upsize, and landlords wanting to maximise their property investments.',
    primaryCta: 'Book a free valuation',
    designStyle: 'Premium, trust-led professional services site with conservative colour palette, clean grid layout, credential highlights, and consultation-focused flow',
  },
  health: {
    whatTheyDo: 'A holistic wellness clinic offering acupuncture, massage therapy, and nutritional coaching to help clients feel their best.',
    audience: 'Professionals aged 30–55 dealing with stress, chronic pain, or burnout who want a natural, personalised approach to feeling better.',
    primaryCta: 'Book a free discovery call',
    designStyle: 'Calm, reassuring wellness aesthetic with soft tones, breathing room in the layout, practitioner trust signals, and gentle booking flow',
  },
  ecommerce: {
    whatTheyDo: 'An independent lifestyle brand offering curated homewares and gifts that bring warmth and personality to everyday living.',
    audience: 'Gift-givers and home enthusiasts aged 25–45 who value quality, sustainability, and unique design over mass-market products.',
    primaryCta: 'Shop the collection',
    designStyle: 'Product-forward e-commerce layout with featured collections, social proof, urgency elements, gift/bundle sections, and cart-optimised flow',
  },
  legal: {
    whatTheyDo: 'A boutique law firm specialising in employment law, commercial disputes, and contract advice for SMEs and individuals.',
    audience: 'Business owners and employees facing legal challenges who need clear, jargon-free advice and a trusted advocate in their corner.',
    primaryCta: 'Get a free case evaluation',
    designStyle: 'Premium, trust-led professional services site with conservative colour palette, clean grid layout, credential highlights, and consultation-focused flow',
  },
  fitness: {
    whatTheyDo: 'A personal training studio helping busy professionals build strength, lose weight, and feel confident — in 12 weeks or less.',
    audience: 'Busy professionals aged 30–50 who\'ve tried diets and gym memberships before but never got lasting results without accountability.',
    primaryCta: 'Claim your free session',
    designStyle: 'High-energy fitness brand with bold typography, transformation photography, strong social proof, and high-urgency free trial CTA',
  },
  education: {
    whatTheyDo: 'An online tutoring service providing 1-to-1 and small group sessions in Maths, English, and Sciences for students aged 8–18.',
    audience: 'Parents of students who are falling behind, preparing for exams, or simply want to build confidence and love of learning.',
    primaryCta: 'Book a free trial lesson',
    designStyle: 'Friendly, approachable education brand with bright colours, student success stories, clear course structure, and low-friction enrolment flow',
  },
  beauty: {
    whatTheyDo: 'A premium hair and beauty salon offering cuts, colour, skincare treatments, and bridal packages in a relaxed, luxurious environment.',
    audience: 'Women aged 25–55 who want to look and feel their best and value a skilled, attentive stylist they can trust long-term.',
    primaryCta: 'Book an appointment',
    designStyle: 'Elegant, visual-first beauty brand with editorial photography, refined typography, service showcase, and seamless online booking',
  },
  finance: {
    whatTheyDo: 'A chartered accounting firm helping SMEs and self-employed professionals with tax planning, bookkeeping, and growth strategy.',
    audience: 'Business owners and sole traders who are tired of being confused by finances and want a proactive accountant who helps them keep more of what they earn.',
    primaryCta: 'Book a free discovery call',
    designStyle: 'Premium, trust-led professional services site with conservative colour palette, clean grid layout, credential highlights, and consultation-focused flow',
  },
  solicitor: {
    whatTheyDo: 'A family law and private client solicitor providing clear, compassionate legal advice on divorce, wills, probate, and property matters.',
    audience: 'Individuals facing personal legal challenges who want jargon-free guidance, a fair fixed fee, and a solicitor they can actually talk to.',
    primaryCta: 'Get a free initial consultation',
    designStyle: 'Premium, trust-led professional services site with conservative colour palette, clean grid layout, credential highlights, and consultation-focused flow',
  },
  accountant: {
    whatTheyDo: 'A friendly local accountant and bookkeeper helping sole traders, freelancers, and small businesses stay on top of their finances and avoid tax headaches.',
    audience: 'Sole traders and small business owners who hate doing their own accounts, want to pay less tax legally, and need someone reliable they can call on.',
    primaryCta: 'Book a free intro call',
    designStyle: 'Approachable, trust-led professional services site with a clean layout, friendly imagery, clear pricing, and low-friction enquiry flow',
  },
  agency: {
    whatTheyDo: 'A full-service marketing and creative agency helping growing businesses build their brand, generate leads, and turn browsers into buyers.',
    audience: 'Ambitious SMEs and scale-ups who know they need better marketing but don\'t have the in-house team or time to do it themselves.',
    primaryCta: 'Book a free strategy session',
    designStyle: 'Bold, creative agency portfolio site with striking typography, showcase work grid, case study highlights, and confident CTA sections',
  },
  architect: {
    whatTheyDo: 'An award-winning architecture and interior design studio delivering thoughtful residential and commercial projects from concept to completion.',
    audience: 'Homeowners planning extensions or renovations, and developers looking for a trusted design partner with a strong aesthetic and proven process.',
    primaryCta: 'Book a free consultation',
    designStyle: 'Minimal, editorial architecture portfolio with full-bleed project imagery, refined typography, process timeline, and enquiry-focused flow',
  },
  tech: {
    whatTheyDo: 'A B2B SaaS platform that automates repetitive back-office tasks, giving operations teams hours back every week and reducing costly errors.',
    audience: 'Ops managers and founders at 10–200 person companies who are drowning in manual processes and need a reliable, affordable automation tool.',
    primaryCta: 'Start your free trial',
    designStyle: 'Clean, minimal SaaS-inspired layout with clear value proposition, feature highlights, social proof metrics, and frictionless sign-up',
  },
  gym: {
    whatTheyDo: 'A modern gym and fitness studio offering open-floor gym access, group classes, personal training, and nutrition coaching under one roof.',
    audience: 'Local adults aged 18–50 who want a well-equipped, welcoming gym without the big-box feel — and real results with expert support if they want it.',
    primaryCta: 'Get your first week free',
    designStyle: 'High-energy fitness brand with bold typography, transformation photography, strong social proof, class schedule, and high-urgency free trial CTA',
  },
  dentist: {
    whatTheyDo: 'A modern, NHS and private dental practice offering routine check-ups, cosmetic dentistry, implants, and Invisalign in a relaxed, anxiety-free environment.',
    audience: 'Local families and adults who want a dentist they can actually trust — especially nervous patients who\'ve put it off for too long.',
    primaryCta: 'Book an appointment',
    designStyle: 'Calm, reassuring healthcare brand with clean white layout, friendly practitioner photos, treatment showcases, and easy online booking flow',
  },
  veterinary: {
    whatTheyDo: 'A caring, independent veterinary practice offering routine care, surgery, dental treatments, and emergency appointments for dogs, cats, and small animals.',
    audience: 'Pet owners who treat their animals like family and want a vet they trust — not a corporate chain — with transparent pricing and genuine compassion.',
    primaryCta: 'Book an appointment',
    designStyle: 'Warm, reassuring pet-care brand with friendly imagery, clear service listing, team profiles, and easy appointment booking flow',
  },
  cafe: {
    whatTheyDo: 'An independent speciality café serving expertly sourced single-origin coffee, fresh seasonal food, and a genuinely warm welcome every morning.',
    audience: 'Local regulars, remote workers, and weekend brunch-seekers who value quality coffee, a relaxed atmosphere, and a place that feels like a second home.',
    primaryCta: 'Find us',
    designStyle: 'Warm, artisan café brand with rich food and coffee photography, ambient colour palette, menu highlights, and Google Maps integration',
  },
  salon: {
    whatTheyDo: 'A boutique hair salon specialising in precision cuts, balayage, colour correction, and bridal hair — with a team trained at the best in the industry.',
    audience: 'Women and men aged 20–50 who are particular about their hair, tired of disappointing results, and want a stylist they can trust for years.',
    primaryCta: 'Book online',
    designStyle: 'Elegant, visual-first beauty brand with editorial photography, refined typography, stylist showcase, service menu, and seamless online booking',
  },
  wedding: {
    whatTheyDo: 'A luxury wedding planning and coordination service that takes care of every detail — from venue sourcing and supplier management to on-the-day coordination.',
    audience: 'Engaged couples who want their dream wedding without the stress — and are willing to invest in a planner who handles everything with elegance and precision.',
    primaryCta: 'Start planning together',
    designStyle: 'Romantic, luxury wedding brand with soft editorial photography, elegant serif typography, real wedding gallery, testimonials, and enquiry-focused flow',
  },
  photographer: {
    whatTheyDo: 'A professional photographer specialising in weddings, portraits, and brand photography — with a natural, editorial style that captures real emotion.',
    audience: 'Couples planning their wedding, families wanting beautiful portraits, and brands that need authentic imagery to tell their story.',
    primaryCta: 'Check my availability',
    designStyle: 'Minimal, image-led photography portfolio with full-screen gallery, editorial typography, package pricing, and simple enquiry form',
  },
  childcare: {
    whatTheyDo: 'An Ofsted Outstanding nursery and childcare setting providing a safe, stimulating, play-based environment for children aged 3 months to 5 years.',
    audience: 'Parents returning to work or seeking social development for their child — who want a nurturing setting they can trust completely.',
    primaryCta: 'Book a visit',
    designStyle: 'Warm, friendly childcare brand with bright colours, joyful imagery, Ofsted badge, key staff bios, fee guide, and easy visit-booking flow',
  },
  plumber: {
    whatTheyDo: 'A reliable, Gas Safe registered plumbing and heating engineer covering boiler installations, central heating, bathroom fitting, and emergency callouts.',
    audience: 'Homeowners who need a trustworthy, fairly-priced tradesperson — fast. No cowboys, no hidden charges, just the job done right.',
    primaryCta: 'Get a free quote',
    designStyle: 'Clean, trust-led trades site with strong credentials, services grid, before/after photos, customer reviews, and prominent click-to-call CTA',
  },
};

// ─── Industry Design Suggestions ─────────────────────────────────────────────

export interface IndustryDesign {
  palette: number;
  moods: string[];
  font: string;
}

export const industryDesign: Record<string, IndustryDesign> = {
  coaching:   { palette: 0, moods: ['Professional', 'Bold', 'Trustworthy'],     font: 'modern-sans'  },
  restaurant: { palette: 1, moods: ['Warm', 'Friendly', 'Premium'],             font: 'editorial'    },
  realestate: { palette: 3, moods: ['Professional', 'Trustworthy', 'Premium'],  font: 'editorial'    },
  health:     { palette: 1, moods: ['Calm', 'Friendly', 'Trustworthy'],         font: 'friendly'     },
  ecommerce:  { palette: 4, moods: ['Modern', 'Bold', 'Youthful'],              font: 'modern-sans'  },
  legal:      { palette: 5, moods: ['Professional', 'Traditional', 'Corporate'], font: 'classic'     },
  fitness:    { palette: 7, moods: ['Bold', 'Energetic', 'Modern'],             font: 'bold-impact'  },
  education:  { palette: 0, moods: ['Friendly', 'Trustworthy', 'Modern'],       font: 'friendly'     },
  beauty:     { palette: 7, moods: ['Luxurious', 'Premium', 'Sophisticated'],   font: 'editorial'    },
  finance:    { palette: 3, moods: ['Professional', 'Trustworthy', 'Corporate'], font: 'classic'     },
};

// ─── Colour Palette Presets ───────────────────────────────────────────────────

export const palettePresets: PalettePreset[] = [
  { name: 'Ocean Blue',   colors: ['#2563eb', '#1e1e1e', '#f59e0b', '#ffffff'] },
  { name: 'Warm Amber',   colors: ['#d97706', '#1c1917', '#ef4444', '#fffbeb'] },
  { name: 'Forest',       colors: ['#16a34a', '#14532d', '#84cc16', '#f0fdf4'] },
  { name: 'Navy & Gold',  colors: ['#1e3a5f', '#0f172a', '#f59e0b', '#f8fafc'] },
  { name: 'Coral & Teal', colors: ['#ef4444', '#0d9488', '#f97316', '#fff5f5'] },
  { name: 'Charcoal',     colors: ['#374151', '#111827', '#6366f1', '#f9fafb'] },
  { name: 'Purple',       colors: ['#7c3aed', '#4c1d95', '#a78bfa', '#f5f3ff'] },
  { name: 'Rose Blush',   colors: ['#e11d48', '#881337', '#fb7185', '#fff1f2'] },
];

// ─── Templates ────────────────────────────────────────────────────────────────

export const templates: Template[] = [
  {
    id: 'business-coach',
    name: 'Business Coach',
    emoji: '🎯',
    tagline: 'Coaching & consulting',
    desc: 'Authority-led coaching site with testimonials and a strong CTA.',
    industry: 'coaching',
    whatTheyDo: 'We help ambitious entrepreneurs and executives scale past six figures, build high-performing teams, and achieve clarity on their goals through 1:1 coaching and group programmes.',
    audience: 'Business owners and senior managers earning £80k–£500k who feel stuck, overwhelmed, or ready to play a bigger game.',
    primaryCta: 'Book a free strategy call',
    designStyle: 'Minimal',
    colors: { primary: '#1a1a2e', secondary: '#16213e', accent: '#d4a843', bg: '#ffffff' },
    font: 'editorial',
    tone: 'authoritative',
    moods: ['Premium', 'Sophisticated', 'Bold'],
    pages: ['pg_home', 'pg_about', 'pg_services', 'pg_testimonials', 'pg_contact'],
    seoKeywords: 'business coach UK, executive coaching, leadership coaching, business growth consultant',
  },
  {
    id: 'restaurant',
    name: 'Local Restaurant',
    emoji: '🍽️',
    tagline: 'Restaurant & dining',
    desc: 'Warm, photography-led site with menu and reservation CTA.',
    industry: 'restaurant',
    whatTheyDo: 'We serve modern British cuisine using locally sourced seasonal ingredients in a relaxed, welcoming atmosphere. Private dining and events available.',
    audience: 'Couples, families, and food lovers looking for a quality dining experience for date nights, celebrations, or Sunday lunches.',
    primaryCta: 'Reserve a table',
    designStyle: 'Warm, rustic-modern',
    colors: { primary: '#2c1810', secondary: '#8b4513', accent: '#d4a843', bg: '#faf7f2' },
    font: 'editorial',
    tone: 'friendly',
    moods: ['Warm', 'Traditional', 'Premium'],
    pages: ['pg_home', 'pg_about', 'pg_services', 'pg_gallery', 'pg_contact'],
    seoKeywords: 'restaurant near me, local dining, Sunday lunch, private dining, seasonal menu',
  },
  {
    id: 'law-firm',
    name: 'Law Firm',
    emoji: '⚖️',
    tagline: 'Solicitor & legal services',
    desc: 'Authoritative legal firm site with practice areas and consultation CTA.',
    industry: 'solicitor',
    whatTheyDo: 'We provide expert legal advice across family law, property, wills & probate, and civil litigation. Our solicitors combine deep expertise with a personal, client-first approach.',
    audience: 'Individuals and families facing legal challenges who need trustworthy, plain-English advice from a qualified solicitor.',
    primaryCta: 'Book a free consultation',
    designStyle: 'Professional, authoritative',
    colors: { primary: '#1c2331', secondary: '#2e3d5f', accent: '#c9a84c', bg: '#f8f8f6' },
    font: 'classic',
    tone: 'authoritative',
    moods: ['Trustworthy', 'Corporate', 'Sophisticated'],
    pages: ['pg_home', 'pg_about', 'pg_services', 'pg_pricing', 'pg_contact'],
    seoKeywords: 'solicitor near me, family solicitor, conveyancing solicitor, legal advice, wills and probate',
  },
  {
    id: 'fitness-studio',
    name: 'Fitness Studio',
    emoji: '💪',
    tagline: 'Gym & fitness',
    desc: 'High-energy gym site with class schedule and membership CTA.',
    industry: 'gym',
    whatTheyDo: 'We offer personal training, group fitness classes (HIIT, strength, yoga), and nutrition coaching in a supportive, results-driven environment for all fitness levels.',
    audience: 'Adults aged 20–45 who want real results — whether that is fat loss, muscle building, or improved fitness — and value expert coaching over guessing alone.',
    primaryCta: 'Start your free trial',
    designStyle: 'Bold, energetic',
    colors: { primary: '#0a0a0a', secondary: '#1a1a1a', accent: '#84cc16', bg: '#ffffff' },
    font: 'bold-impact',
    tone: 'professional',
    moods: ['Bold', 'Energetic', 'Modern'],
    pages: ['pg_home', 'pg_about', 'pg_services', 'pg_pricing', 'pg_contact'],
    seoKeywords: 'gym near me, personal trainer, fitness classes, HIIT classes, weight loss programme',
  },
  {
    id: 'beauty-salon',
    name: 'Beauty Salon',
    emoji: '💅',
    tagline: 'Beauty & hair salon',
    desc: 'Elegant salon site with services menu, gallery, and booking CTA.',
    industry: 'salon',
    whatTheyDo: 'We offer a full range of hair, beauty, and wellness treatments — from cuts and colour to facials, lash extensions, and massage — in a luxurious yet welcoming salon.',
    audience: 'Women aged 25–55 who value looking and feeling their best and want a reliable, skilled salon they can trust for consistent, high-quality results.',
    primaryCta: 'Book an appointment',
    designStyle: 'Elegant, feminine',
    colors: { primary: '#3d2b2b', secondary: '#6d4c4c', accent: '#e8b4a0', bg: '#fdf8f6' },
    font: 'editorial',
    tone: 'luxury',
    moods: ['Luxurious', 'Warm', 'Sophisticated'],
    pages: ['pg_home', 'pg_about', 'pg_services', 'pg_gallery', 'pg_contact'],
    seoKeywords: 'hair salon near me, beauty salon, hair colouring, eyelash extensions, facial treatment',
  },
  {
    id: 'tech-agency',
    name: 'Tech Agency',
    emoji: '🚀',
    tagline: 'Digital agency & tech',
    desc: 'Sleek agency site with portfolio, case studies, and project CTA.',
    industry: 'agency',
    whatTheyDo: 'We build digital products, websites, and apps for ambitious brands. From strategy and design to development and growth, we partner with clients long-term to drive measurable results.',
    audience: 'SMEs and scale-ups that need a strategic digital partner — not just a vendor — to help them compete and grow online.',
    primaryCta: 'Start a project',
    designStyle: 'Modern, minimal',
    colors: { primary: '#1e1b4b', secondary: '#312e81', accent: '#06b6d4', bg: '#fafafa' },
    font: 'ultra-minimal',
    tone: 'professional',
    moods: ['Modern', 'Creative', 'Corporate'],
    pages: ['pg_home', 'pg_about', 'pg_services', 'pg_portfolio', 'pg_contact'],
    seoKeywords: 'web design agency, digital agency, app development, UI UX design, website development UK',
  },
  {
    id: 'wedding-photographer',
    name: 'Wedding Photographer',
    emoji: '📸',
    tagline: 'Wedding & portrait photography',
    desc: 'Romantic photography portfolio with gallery and inquiry CTA.',
    industry: 'photographer',
    whatTheyDo: 'We capture the authentic, emotional moments of your wedding day in a timeless documentary style — natural, unposed, and full of feeling. Covering the UK and Europe.',
    audience: 'Engaged couples planning their wedding who want photographs that tell their story honestly, rather than stiff posed portraits.',
    primaryCta: 'Check my availability',
    designStyle: 'Minimal, romantic',
    colors: { primary: '#2d2016', secondary: '#5c4a35', accent: '#c9a98c', bg: '#faf8f5' },
    font: 'editorial',
    tone: 'casual',
    moods: ['Warm', 'Luxurious', 'Sophisticated'],
    pages: ['pg_home', 'pg_about', 'pg_portfolio', 'pg_pricing', 'pg_contact'],
    seoKeywords: 'wedding photographer UK, documentary wedding photography, wedding photographer near me, natural wedding photos',
  },
  {
    id: 'dental-practice',
    name: 'Dental Practice',
    emoji: '🦷',
    tagline: 'Dentist & dental care',
    desc: 'Clean, reassuring dental site with treatments and booking CTA.',
    industry: 'dentist',
    whatTheyDo: 'We provide gentle, friendly dental care for the whole family — from routine check-ups and hygiene appointments to cosmetic treatments like whitening, veneers, and Invisalign.',
    audience: 'Families and adults looking for a local dentist they can trust — particularly those who feel anxious and need a calm, patient, reassuring team.',
    primaryCta: 'Book an appointment',
    designStyle: 'Clean, clinical',
    colors: { primary: '#0f4c81', secondary: '#1a6cb5', accent: '#00b4a2', bg: '#f8fcff' },
    font: 'modern-sans',
    tone: 'professional',
    moods: ['Trustworthy', 'Professional', 'Calm'],
    pages: ['pg_home', 'pg_about', 'pg_services', 'pg_faq', 'pg_contact'],
    seoKeywords: 'dentist near me, NHS dentist, teeth whitening, Invisalign, dental check-up',
  },
];

// ─── Page Detail Configs ──────────────────────────────────────────────────────

export const pageDetailConfigs: Record<string, PageDetailConfig> = {

  pg_about: {
    label: 'About Us',
    icon: '👤',
    fields: [
      {
        type: 'row2',
        children: [
          { type: 'text',     id: 'about_founded',  label: 'Year founded', placeholder: 'e.g. 2018' },
          { type: 'text',     id: 'about_teamsize',  label: 'Team size',   placeholder: 'e.g. Solo, 5, 20+' },
        ],
      },
      { type: 'textarea', id: 'about_story',  label: 'Brand story / mission',         placeholder: 'What\'s the origin story? What drives the business?', rows: 3 },
      { type: 'textarea', id: 'about_values', label: 'Core values (one per line)',     placeholder: 'Integrity\nResults-focused\nClient-first', rows: 3 },
    ],
  },

  pg_services: {
    label: 'Services / Offerings',
    icon: '🛠️',
    dynamic: {
      key: 'services',
      addLabel: 'Add a service',
      singularLabel: 'Service',
      itemFields: [
        { type: 'text',     id: 'svc_name',  label: 'Service name',      placeholder: 'e.g. 1:1 Strategy Coaching' },
        { type: 'textarea', id: 'svc_desc',  label: 'Short description', placeholder: 'What\'s included? Who is it for?', rows: 2 },
        { type: 'text',     id: 'svc_price', label: 'Price (optional)',  placeholder: 'e.g. £500/session, From £99/mo' },
      ],
      defaultCount: 2,
    },
  },

  pg_contact: {
    label: 'Contact',
    icon: '📬',
    fields: [
      {
        type: 'checkgroup',
        label: 'Include on this page:',
        options: [
          { id: 'cnt_phone',   label: 'Phone number',               checked: true  },
          { id: 'cnt_email',   label: 'Email address',              checked: true  },
          { id: 'cnt_address', label: 'Physical address / map embed', checked: false },
          { id: 'cnt_form',    label: 'Contact / enquiry form',     checked: true  },
          { id: 'cnt_social',  label: 'Social media links',         checked: true  },
          { id: 'cnt_hours',   label: 'Opening hours',              checked: false },
        ] as CheckgroupOption[],
      },
      { type: 'text', id: 'cnt_response', label: 'Response time promise (optional)', placeholder: 'e.g. We reply within 24 hours' },
    ],
  },

  pg_pricing: {
    label: 'Pricing',
    icon: '💰',
    fields: [
      {
        type: 'select',
        id: 'price_model',
        label: 'Pricing model',
        options: [
          'Monthly subscription',
          'One-off payment',
          'Both monthly and one-off options',
          'Per session / per project',
          'Custom quote only',
        ],
      },
    ],
    dynamic: {
      key: 'pricingTiers',
      addLabel: 'Add a pricing tier',
      singularLabel: 'Tier',
      itemFields: [
        {
          type: 'row2',
          children: [
            { type: 'text', id: 'tier_name',  label: 'Tier name', placeholder: 'e.g. Starter, Pro, Enterprise' },
            { type: 'text', id: 'tier_price', label: 'Price',     placeholder: 'e.g. £49, Free, £299' },
          ],
        },
        {
          type: 'row2',
          children: [
            { type: 'select', id: 'tier_period',  label: 'Billing period', options: ['/ month', '/ year', 'one-off', '/ session', '/ project', 'free'] },
            { type: 'toggle', id: 'tier_popular', label: "⭐ Mark as 'Most Popular'" },
          ],
        },
        { type: 'textarea', id: 'tier_features', label: 'Features included (one per line)', placeholder: '3 coaching sessions per month\nEmail support\nResource library access', rows: 3 },
      ],
      defaultCount: 3,
    },
  },

  pg_blog: {
    label: 'Blog / News',
    icon: '📝',
    fields: [
      {
        type: 'select',
        id: 'blog_style',
        label: 'Content style',
        options: ['Blog articles', 'News & updates', 'Case studies', 'Tutorials / how-tos', 'Mixed content'],
      },
      { type: 'textarea', id: 'blog_cats', label: 'Categories (one per line, optional)', placeholder: 'Business Growth\nMindset\nStrategy Tips', rows: 3 },
      { type: 'text',     id: 'blog_cta',  label: 'Newsletter / subscribe CTA (optional)', placeholder: 'e.g. Get weekly business tips straight to your inbox' },
    ],
  },

  pg_testimonials: {
    label: 'Testimonials',
    icon: '⭐',
    fields: [
      {
        type: 'select',
        id: 'test_layout',
        label: 'Display layout',
        options: ['Card grid (2–3 columns)', 'Carousel / slider', 'Large pull quotes', 'With client photos', 'Video testimonials'],
      },
      { type: 'text', id: 'test_count',  label: 'Number of testimonials to display',         placeholder: 'e.g. 6, 9, 12' },
      { type: 'text', id: 'test_filter', label: 'Filter by category / service? (optional)',   placeholder: 'e.g. Coaching, Strategy, Online Course' },
    ],
  },

  pg_portfolio: {
    label: 'Portfolio / Case Studies',
    icon: '🖼️',
    fields: [
      { type: 'text', id: 'port_count', label: 'Number of projects to showcase', placeholder: 'e.g. 6' },
      {
        type: 'checkgroup',
        label: 'Each project entry should include:',
        options: [
          { id: 'port_results',   label: 'Results & metrics achieved',     checked: true  },
          { id: 'port_challenge', label: 'Challenge & solution narrative',  checked: true  },
          { id: 'port_client',    label: 'Client name / industry',         checked: false },
          { id: 'port_images',    label: 'Before / after images',          checked: false },
          { id: 'port_quote',     label: 'Client quote / testimonial',     checked: true  },
          { id: 'port_timeline',  label: 'Project timeline / duration',    checked: false },
        ] as CheckgroupOption[],
      },
    ],
  },

  pg_faq: {
    label: 'FAQ',
    icon: '❓',
    dynamic: {
      key: 'faqItems',
      addLabel: 'Add a question',
      singularLabel: 'Question',
      itemFields: [
        { type: 'text',     id: 'faq_q', label: 'Question', placeholder: 'e.g. How long does it take to see results?' },
        { type: 'textarea', id: 'faq_a', label: 'Answer',   placeholder: 'e.g. Most clients see measurable progress within the first 30 days…', rows: 2 },
      ],
      defaultCount: 3,
    },
  },

  pg_team: {
    label: 'Meet the Team',
    icon: '👥',
    dynamic: {
      key: 'teamMembers',
      addLabel: 'Add a team member',
      singularLabel: 'Team member',
      itemFields: [
        {
          type: 'row2',
          children: [
            { type: 'text', id: 'tm_name', label: 'Full name',    placeholder: 'e.g. Sarah Johnson' },
            { type: 'text', id: 'tm_role', label: 'Role / title', placeholder: 'e.g. Lead Coach' },
          ],
        },
        { type: 'textarea', id: 'tm_bio', label: 'Short bio (optional)', placeholder: 'e.g. 10+ years\' experience in business strategy…', rows: 2 },
      ],
      defaultCount: 2,
    },
  },

  pg_gallery: {
    label: 'Gallery',
    icon: '📸',
    fields: [
      {
        type: 'select',
        id: 'gal_layout',
        label: 'Gallery layout',
        options: ['Masonry grid', 'Uniform grid', 'Horizontal scroll', 'Lightbox / carousel'],
      },
      { type: 'textarea', id: 'gal_cats', label: 'Filter categories (one per line, optional)', placeholder: 'Before & After\nEvents\nProducts\nBehind the Scenes', rows: 3 },
    ],
  },

  pg_booking: {
    label: 'Book / Schedule Online',
    icon: '📅',
    fields: [
      {
        type: 'select',
        id: 'book_platform',
        label: 'Booking platform to embed',
        options: [
          'Calendly embed',
          'Acuity Scheduling',
          'Google Calendar booking link',
          'Custom contact / request form',
          'Phone or email only',
          'Other (describe in notes below)',
        ],
      },
      { type: 'textarea', id: 'book_services', label: 'Appointment types / services to book (one per line)', placeholder: '30-min discovery call (free)\n90-min strategy session\nMonthly retainer kick-off call', rows: 3 },
      { type: 'text',     id: 'book_notes',    label: 'Any booking notes or requirements',                   placeholder: 'e.g. 24 hours advance notice required, online only' },
    ],
  },
};
