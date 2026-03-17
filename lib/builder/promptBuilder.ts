import {
  fontPairings,
  toneOptions,
  layoutFeatureList,
  pageDetailConfigs,
} from './constants';

// ─── BuilderStateSnapshot ─────────────────────────────────────────────────────
// A plain-data snapshot of the builder form, free of DOM dependencies.

export interface ImageUrl {
  url: string;
  alt: string;
  credit?: string;
}

export interface DynamicItem {
  /** Arbitrary key-value pairs collected from a dynamic list row */
  values: string[];
  toggleLabels: string[];
}

export interface PageDetailData {
  pageId: string;
  /** Values from static fields: fieldLabel → value */
  fields: Record<string, string>;
  /** Values from checkgroups: groupLabel → checkedLabels[] */
  checkgroups: Record<string, string[]>;
  /** Dynamic list items */
  dynamicItems: DynamicItem[];
}

export interface BuilderStateSnapshot {
  businessName: string;
  industryRaw: string;
  industryLabel: string;
  customIndustry: string;
  whatTheyDo: string;
  audience: string;
  primaryCtaRaw: string;
  customCta: string;
  designStyleRaw: string;
  customDesign: string;
  techStack: string;
  extras: string;
  seoKeywords: string;
  seoMeta: string;
  seoSchema: boolean;
  currentSiteUrl: string;
  brandIdentity: string;
  competitorUrl: string;
  styleNotes: string;
  competitorSeoNotes: string;
  selectedToneId: string;
  selectedFontId: string;
  activeMoods: string[];
  checkedLayoutFeatureIds: string[];
  checkedSections: string[];
  checkedPages: string[];
  pageDetails: PageDetailData[];
}

// ─── Design Prompt Text ───────────────────────────────────────────────────────

export function getDesignPromptText(state: BuilderStateSnapshot): string {
  const font = fontPairings.find((f) => f.id === state.selectedFontId) ?? fontPairings[0];

  const features = state.checkedLayoutFeatureIds
    .map((id) => layoutFeatureList.find((f) => f.id === id)?.label)
    .filter((label): label is string => Boolean(label));

  let out = '';
  out += `\n### Colour Palette\n`;
  // Colours are embedded in the state via designStyleRaw or separately — we'll just include
  // the font/mood/feature portion here; colour hex values are stored in paletteColors if needed.
  // For now we expose whatever is in state:
  out += `\n### Typography\n`;
  out += `- Heading font: ${font.heading}\n`;
  out += `- Body font: ${font.body}\n`;
  out += `- Pairing style: ${font.name} — ${font.desc}\n`;

  if (state.activeMoods.length > 0) {
    out += `\n### Mood & Feel\n${state.activeMoods.join(', ')}\n`;
  }

  if (features.length > 0) {
    out += `\n### Layout Features\n`;
    features.forEach((f) => {
      out += `- ${f}\n`;
    });
  }

  return out;
}

// ─── Colour Palette section (separate, needs hex values) ─────────────────────

export interface ColourValues {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
}

export function getColourPromptText(colours: ColourValues): string {
  let out = `\n### Colour Palette\n`;
  out += `- Primary: ${colours.primary}\n`;
  out += `- Secondary: ${colours.secondary}\n`;
  out += `- Accent: ${colours.accent}\n`;
  out += `- Background: ${colours.bg}\n`;
  return out;
}

// ─── Page Detail Text ─────────────────────────────────────────────────────────

export function getPageDetailText(state: BuilderStateSnapshot): string {
  if (!state.pageDetails.length) return '';

  let out = '\n## Page Details\n';

  for (const pd of state.pageDetails) {
    const config = pageDetailConfigs[pd.pageId];
    if (!config) continue;

    out += `\n### ${config.icon} ${config.label}\n`;

    // Static field values
    for (const [label, value] of Object.entries(pd.fields)) {
      if (value.trim()) out += `- ${label}: ${value.trim()}\n`;
    }

    // Checkgroup values
    for (const [groupLabel, checkedLabels] of Object.entries(pd.checkgroups)) {
      if (checkedLabels.length) {
        out += `- ${groupLabel} ${checkedLabels.join(', ')}\n`;
      }
    }

    // Dynamic list values
    pd.dynamicItems.forEach((item, i) => {
      const parts = item.values.filter(Boolean);
      if (parts.length || item.toggleLabels.length) {
        out += `  ${i + 1}. ${parts.join(' · ')}`;
        if (item.toggleLabels.length) out += ` [${item.toggleLabels.join(', ')}]`;
        out += '\n';
      }
    });
  }

  return out;
}

// ─── Main Prompt Builder ──────────────────────────────────────────────────────

export function buildPromptText(
  state: BuilderStateSnapshot,
  colours: ColourValues,
  pageOverride?: string[],
): string {
  const name       = state.businessName  || '[Your Business Name]';
  const whatTheyDo = state.whatTheyDo    || '[What your business does]';
  const audience   = state.audience      || '[Your target audience and their pain points]';

  const industryLabel = state.industryRaw === 'custom'
    ? (state.customIndustry || '[Your Industry]')
    : (state.industryLabel  || '[Industry]');

  const cta = state.primaryCtaRaw === 'custom'
    ? (state.customCta || '[Your CTA]')
    : (state.primaryCtaRaw || '[Primary call to action]');

  const design = state.designStyleRaw === 'custom'
    ? (state.customDesign || '[Your design direction]')
    : (state.designStyleRaw || '[Design style and direction]');

  const tech   = state.techStack || 'HTML, CSS, and vanilla JavaScript';
  const extras = state.extras;

  const checkedSectionLines = state.checkedSections.map((label, i) => `${i + 1}. ${label}`);

  const allCheckedPages = state.checkedPages;
  const checkedPages    = pageOverride ?? allCheckedPages;
  const isFirstBatch    = Boolean(pageOverride && pageOverride.length < allCheckedPages.length);

  const toneObj = toneOptions.find((t) => t.id === state.selectedToneId);
  const toneStr = toneObj ? `${toneObj.label} — ${toneObj.desc}` : 'Professional';

  let text = `Create a complete, production-ready website for ${name}.\n\n`;
  text += `## Design Direction\n${design}\n`;
  text += getColourPromptText(colours);
  text += getDesignPromptText(state);
  text += `\n`;

  text += `## Business Context\n`;
  text += `- **Industry:** ${industryLabel}\n`;
  text += `- **What they do:** ${whatTheyDo}\n`;
  text += `- **Target audience:** ${audience}\n`;
  text += `- **Primary CTA:** ${cta}\n`;
  text += `- **Tone of voice:** ${toneStr}\n\n`;

  text += `## Website Pages\n`;
  if (isFirstBatch) {
    text += `This is a multi-call generation. The FULL site will have these pages (include all in the navigation):\n`;
    allCheckedPages.forEach((p, i) => { text += `${i + 1}. ${p}\n`; });
    text += `\nIn THIS call, generate ONLY the following pages:\n`;
    checkedPages.forEach((p, i) => { text += `${i + 1}. ${p}\n`; });
    text += `\nThe remaining pages will be generated in subsequent calls. Ensure the nav links to ALL pages listed above.\n\n`;
  } else {
    text += `Build the following pages, each as a separate HTML file with its own layout and content:\n`;
    checkedPages.forEach((p, i) => { text += `${i + 1}. ${p}\n`; });
    text += `\nEnsure all pages share a consistent navigation bar and footer. The nav should highlight the active page.\n\n`;
  }

  text += `## Homepage Sections\n`;
  text += `The Home page should include these sections in order:\n`;
  text += checkedSectionLines.join('\n');

  // Page detail sub-forms
  text += getPageDetailText(state);

  text += `\n\n## Technical Requirements\n`;
  text += `- Technology: ${tech}\n`;
  text += `- Fully responsive, mobile-first\n`;
  text += `- Smooth scroll animations\n`;
  text += `- Clean component structure\n`;
  text += `- Fast loading, optimised images\n`;
  text += `- Clear visual hierarchy\n`;
  text += `- Compelling copy that speaks to the target audience's pain points\n`;
  if (extras) text += `- ${extras}\n`;

  // SEO
  if (state.seoKeywords || state.seoMeta || state.seoSchema) {
    text += `\n## SEO Requirements\n`;
    if (state.seoKeywords) text += `- **Target keywords:** ${state.seoKeywords}\n`;
    if (state.seoMeta)     text += `- **Homepage meta description:** "${state.seoMeta}"\n`;
    if (state.seoSchema)   text += `- Include JSON-LD LocalBusiness schema markup in the <head> of index.html.\n`;
    text += `- Write <title> and meta description tags for every page, weaving in target keywords naturally.\n`;
    text += `- Use keywords in H1/H2 headings and copy where it reads naturally — no keyword stuffing.\n`;
  }

  // Existing brand identity
  if (state.brandIdentity) {
    text += `\n## Existing Brand Identity\n`;
    if (state.currentSiteUrl) text += `Extracted from current site: ${state.currentSiteUrl}\n`;
    text += `${state.brandIdentity}\n`;
    text += `The new website must feel like a natural evolution of this brand — same colours, tone, and personality, but with better structure and more compelling copy.\n`;
  }

  // Style inspiration
  if (state.styleNotes) {
    text += `\n## Style Inspiration\n`;
    if (state.competitorUrl) text += `Source analysed: ${state.competitorUrl}\n`;
    text += `${state.styleNotes}\n`;
    text += `Use the above as design inspiration — adapt the style to suit the business, do not copy directly.\n`;
  }

  // Competitor SEO
  if (state.competitorSeoNotes) {
    text += `\n## Competitor SEO Intelligence\n`;
    if (state.competitorUrl) text += `Competitor analysed: ${state.competitorUrl}\n`;
    text += `${state.competitorSeoNotes}\n`;
    text += `Use these insights to inform keyword targeting, headings, and meta description — aim to outperform this competitor in search.\n`;
  }

  return text;
}

// ─── System Prompts ───────────────────────────────────────────────────────────

export function buildSystemPrompt(imageUrls?: ImageUrl[]): string {
  let imageRule: string;
  if (imageUrls && imageUrls.length > 0) {
    const list = imageUrls
      .map((img) => `  - ${img.url} (${img.alt}${img.credit ? ' — ' + img.credit : ''})`)
      .join('\n');
    imageRule =
      `- Use ONLY these pre-approved royalty-free images where contextually relevant (choose by subject matter):\n${list}\n` +
      `  For any additional images not covered above, use https://picsum.photos/[width]/[height]`;
  } else {
    imageRule = `- Use https://picsum.photos/[width]/[height] for all placeholder images`;
  }

  return `You are an expert web developer creating production-ready websites.

Output EVERY file using EXACTLY this separator format — no exceptions:

=== FILE: filename.html ===
[complete file contents]

Rules:
- Each file must be a complete, standalone HTML document with all CSS in <style> and JS in <script> tags
- Use Google Fonts via a <link> tag (already specified in the prompt)
- ${imageRule}
- All pages must share an identical navigation bar and footer
- The nav must link to every page in the site and visually highlight the active page
- Include a mobile hamburger menu in the nav
- Apply the exact hex colours, fonts, mood, and layout features from the prompt faithfully
- Write real, compelling copy — not lorem ipsum — based on the business context
- Start with index.html, then generate every other page specified
- If content runs long, write complete code rather than truncating with comments`;
}

export function buildContinuationSystemPrompt(
  rootCss: string,
  navHtml: string,
  imageUrls?: ImageUrl[],
): string {
  let imageRule: string;
  if (imageUrls && imageUrls.length > 0) {
    const list = imageUrls
      .map((img) => `  - ${img.url} (${img.alt}${img.credit ? ' — ' + img.credit : ''})`)
      .join('\n');
    imageRule = `- Reuse these pre-approved images where contextually relevant:\n${list}`;
  } else {
    imageRule = `- Use https://picsum.photos/[width]/[height] for any images`;
  }

  return `You are continuing a multi-page website generation. The design system is already established — do NOT redefine it.

Output each file using EXACTLY this separator format:

=== FILE: filename.html ===
[complete file contents]

Design system already in use (copy :root variables exactly, do not alter values):
${rootCss || '(see index.html for CSS variables)'}

Navigation reference (replicate the nav and footer HTML exactly in every page — only update the active link):
${navHtml || '(replicate nav from index.html)'}

Rules:
- Each page must be a complete HTML document with all CSS in <style> and JS in <script>
- Do NOT include a :root block — inherit the design tokens from the shared stylesheet context
- Use Google Fonts via a <link> tag matching the original
- ${imageRule}
- Nav and footer must be pixel-identical to index.html (same structure, same links, same styling)
- Write real, specific copy for each page — not lorem ipsum
- Do not repeat pages that were already generated`;
}

export function buildContinuationUserPrompt(
  batchPages: string[],
  businessName: string,
  industry: string,
  whatTheyDo: string,
): string {
  const pageList = batchPages.map((p, i) => `${i + 1}. ${p}`).join('\n');
  return (
    `Generate ONLY the following pages for the ${businessName || industry} website:\n\n` +
    `${pageList}\n\n` +
    `Match the established design system, navigation structure, tone of voice, and brand identity from the previously generated pages. Each page should have unique, relevant content.`
  );
}
