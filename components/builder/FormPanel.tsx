'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useBuilderStore } from '@/store/builderStore';
import {
  allPages,
  allSections,
  fontPairings,
  moodTagList,
  toneOptions,
  layoutFeatureList,
  palettePresets,
  templates,
  pageDetailConfigs,
  PageDetailConfig,
  PageDetailField,
  CheckgroupOption,
} from '@/lib/builder/constants';
import { extractBrand, analyseUrl } from '@/lib/api';
import styles from './FormPanel.module.css';

// ─── Industry Groups ──────────────────────────────────────────────────────────

const industryGroups = [
  {
    label: 'General',
    options: [{ value: 'general', label: 'General Business' }],
  },
  {
    label: 'Professional Services',
    options: [
      { value: 'coaching', label: 'Business Coach / Consultant' },
      { value: 'agency', label: 'Marketing / Creative Agency' },
      { value: 'architect', label: 'Architect / Interior Designer' },
      { value: 'legal', label: 'Law Firm' },
      { value: 'solicitor', label: 'Solicitor' },
      { value: 'accountant', label: 'Accountant / Bookkeeper' },
      { value: 'finance', label: 'Financial Services' },
    ],
  },
  {
    label: 'Health & Wellness',
    options: [
      { value: 'health', label: 'Health & Wellness Clinic' },
      { value: 'fitness', label: 'Personal Trainer / Fitness Coach' },
      { value: 'gym', label: 'Gym / Fitness Studio' },
      { value: 'dentist', label: 'Dental Practice' },
      { value: 'veterinary', label: 'Veterinary Practice' },
    ],
  },
  {
    label: 'Food & Hospitality',
    options: [
      { value: 'restaurant', label: 'Restaurant' },
      { value: 'cafe', label: 'Café / Coffee Shop' },
    ],
  },
  {
    label: 'Retail & Ecommerce',
    options: [
      { value: 'ecommerce', label: 'Ecommerce / Online Store' },
    ],
  },
  {
    label: 'Education',
    options: [
      { value: 'education', label: 'Tutoring / Education' },
      { value: 'childcare', label: 'Nursery / Childcare' },
    ],
  },
  {
    label: 'Creative',
    options: [
      { value: 'photographer', label: 'Photographer' },
      { value: 'beauty', label: 'Beauty Salon / Spa' },
      { value: 'salon', label: 'Hair Salon' },
    ],
  },
  {
    label: 'Real Estate',
    options: [
      { value: 'realestate', label: 'Estate Agent / Real Estate' },
    ],
  },
  {
    label: 'Technology',
    options: [
      { value: 'tech', label: 'SaaS / Tech Product' },
    ],
  },
  {
    label: 'Home & Garden',
    options: [
      { value: 'plumber', label: 'Plumber / Tradesperson' },
    ],
  },
  {
    label: 'Wedding & Events',
    options: [
      { value: 'wedding', label: 'Wedding Planner' },
    ],
  },
  {
    label: 'Custom',
    options: [
      { value: 'custom', label: 'Other / Custom Industry' },
    ],
  },
];

// ─── CheckIcon ────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── PageDetailCard ───────────────────────────────────────────────────────────

interface PageDetailCardProps {
  pageId: string;
  config: PageDetailConfig;
}

function PageDetailCard({ pageId, config }: PageDetailCardProps) {
  const [open, setOpen] = useState(false);
  const store = useBuilderStore();
  const detail = store.pageDetails.find((d) => d.pageId === pageId);

  const updateField = (id: string, value: string) => {
    store.setPageDetail(pageId, {
      fields: { ...(detail?.fields ?? {}), [id]: value },
    });
  };

  const updateCheckgroup = (groupLabel: string, optId: string, checked: boolean) => {
    const current = detail?.checkgroups?.[groupLabel] ?? [];
    const next = checked
      ? [...current, optId]
      : current.filter((x) => x !== optId);
    store.setPageDetail(pageId, {
      checkgroups: { ...(detail?.checkgroups ?? {}), [groupLabel]: next },
    });
  };

  const renderField = (field: PageDetailField, idx: number) => {
    if (field.type === 'row2' && field.children) {
      return (
        <div key={idx} className={styles.detailRow2}>
          {field.children.map((child, ci) => renderField(child, ci))}
        </div>
      );
    }
    if (field.type === 'text') {
      return (
        <div key={idx}>
          {field.label && <label className={styles.detailFieldLabel}>{field.label}</label>}
          <input
            className={styles.detailInput}
            type="text"
            placeholder={field.placeholder ?? ''}
            value={detail?.fields?.[field.id ?? ''] ?? ''}
            onChange={(e) => updateField(field.id ?? '', e.target.value)}
          />
        </div>
      );
    }
    if (field.type === 'textarea') {
      return (
        <div key={idx}>
          {field.label && <label className={styles.detailFieldLabel}>{field.label}</label>}
          <textarea
            className={`${styles.detailInput} ${styles.detailTextarea}`}
            placeholder={field.placeholder ?? ''}
            rows={field.rows ?? 3}
            value={detail?.fields?.[field.id ?? ''] ?? ''}
            onChange={(e) => updateField(field.id ?? '', e.target.value)}
          />
        </div>
      );
    }
    if (field.type === 'select' && Array.isArray(field.options)) {
      return (
        <div key={idx}>
          {field.label && <label className={styles.detailFieldLabel}>{field.label}</label>}
          <select
            className={`${styles.detailInput} ${styles.detailSelect}`}
            value={detail?.fields?.[field.id ?? ''] ?? ''}
            onChange={(e) => updateField(field.id ?? '', e.target.value)}
          >
            <option value="">Select…</option>
            {(field.options as string[]).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }
    if (field.type === 'checkgroup') {
      const groupLabel = field.label ?? '';
      const opts = field.options as CheckgroupOption[];
      return (
        <div key={idx}>
          {groupLabel && <label className={styles.detailFieldLabel}>{groupLabel}</label>}
          <div className={styles.checkgroup}>
            {opts.map((opt) => {
              const checked = (detail?.checkgroups?.[groupLabel] ?? []).includes(opt.id);
              return (
                <label key={opt.id} className={styles.checkgroupOption}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => updateCheckgroup(groupLabel, opt.id, e.target.checked)}
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        </div>
      );
    }
    if (field.type === 'toggle') {
      return (
        <div key={idx}>
          <label className={styles.inlineToggle}>
            <input
              type="checkbox"
              checked={detail?.fields?.[field.id ?? ''] === 'true'}
              onChange={(e) => updateField(field.id ?? '', e.target.checked ? 'true' : 'false')}
            />
            {field.label}
          </label>
        </div>
      );
    }
    return null;
  };

  // Dynamic items
  const renderDynamic = () => {
    if (!config.dynamic) return null;
    const { key, addLabel, singularLabel, itemFields, defaultCount } = config.dynamic;
    const items = detail?.dynamicItems ?? [];
    // Ensure at least defaultCount items
    const displayItems = items.length > 0 ? items : Array.from({ length: defaultCount }, () => ({ values: [], toggleLabels: [] }));

    const updateItemField = (itemIdx: number, fieldId: string, value: string) => {
      const newItems = [...displayItems];
      // We store dynamic item fields in the fields map with key `${key}_${itemIdx}_${fieldId}`
      store.setPageDetail(pageId, {
        fields: {
          ...(detail?.fields ?? {}),
          [`${key}_${itemIdx}_${fieldId}`]: value,
        },
      });
    };

    const addItem = () => {
      const newCount = displayItems.length + 1;
      store.setPageDetail(pageId, {
        fields: {
          ...(detail?.fields ?? {}),
          [`${key}_count`]: String(newCount),
        },
      });
    };

    const displayCount = parseInt(detail?.fields?.[`${key}_count`] ?? String(defaultCount), 10);
    const actualCount = Math.max(displayCount, displayItems.length);

    return (
      <div className={styles.dynamicList}>
        {Array.from({ length: actualCount }, (_, itemIdx) => (
          <div key={itemIdx} className={styles.dynamicItem}>
            <div className={styles.dynamicItemHeader}>
              <span className={styles.dynamicItemTitle}>{singularLabel} {itemIdx + 1}</span>
            </div>
            <div className={styles.dynamicItemFields}>
              {itemFields.map((field, fi) => {
                if (field.type === 'row2' && field.children) {
                  return (
                    <div key={fi} className={styles.detailRow2}>
                      {field.children.map((child, ci) => {
                        if (child.type === 'text') {
                          return (
                            <div key={ci}>
                              {child.label && <label className={styles.detailFieldLabel}>{child.label}</label>}
                              <input
                                className={styles.detailInput}
                                type="text"
                                placeholder={child.placeholder ?? ''}
                                value={detail?.fields?.[`${key}_${itemIdx}_${child.id}`] ?? ''}
                                onChange={(e) => updateItemField(itemIdx, child.id ?? '', e.target.value)}
                              />
                            </div>
                          );
                        }
                        if (child.type === 'select' && Array.isArray(child.options)) {
                          return (
                            <div key={ci}>
                              {child.label && <label className={styles.detailFieldLabel}>{child.label}</label>}
                              <select
                                className={`${styles.detailInput} ${styles.detailSelect}`}
                                value={detail?.fields?.[`${key}_${itemIdx}_${child.id}`] ?? ''}
                                onChange={(e) => updateItemField(itemIdx, child.id ?? '', e.target.value)}
                              >
                                <option value="">Select…</option>
                                {(child.options as string[]).map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </div>
                          );
                        }
                        if (child.type === 'toggle') {
                          return (
                            <div key={ci}>
                              <label className={styles.inlineToggle}>
                                <input
                                  type="checkbox"
                                  checked={detail?.fields?.[`${key}_${itemIdx}_${child.id}`] === 'true'}
                                  onChange={(e) => updateItemField(itemIdx, child.id ?? '', e.target.checked ? 'true' : 'false')}
                                />
                                {child.label}
                              </label>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  );
                }
                if (field.type === 'text') {
                  return (
                    <div key={fi}>
                      {field.label && <label className={styles.detailFieldLabel}>{field.label}</label>}
                      <input
                        className={styles.detailInput}
                        type="text"
                        placeholder={field.placeholder ?? ''}
                        value={detail?.fields?.[`${key}_${itemIdx}_${field.id}`] ?? ''}
                        onChange={(e) => updateItemField(itemIdx, field.id ?? '', e.target.value)}
                      />
                    </div>
                  );
                }
                if (field.type === 'textarea') {
                  return (
                    <div key={fi}>
                      {field.label && <label className={styles.detailFieldLabel}>{field.label}</label>}
                      <textarea
                        className={`${styles.detailInput} ${styles.detailTextarea}`}
                        placeholder={field.placeholder ?? ''}
                        rows={field.rows ?? 2}
                        value={detail?.fields?.[`${key}_${itemIdx}_${field.id}`] ?? ''}
                        onChange={(e) => updateItemField(itemIdx, field.id ?? '', e.target.value)}
                      />
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}
        <button type="button" className={styles.btnAddItem} onClick={addItem}>
          + {addLabel}
        </button>
      </div>
    );
  };

  return (
    <div className={styles.pageDetailCard}>
      <div className={styles.pageDetailHeader} onClick={() => setOpen(!open)}>
        <div className={styles.pageDetailHeaderLeft}>
          <span>{config.icon}</span>
          <span>{config.label}</span>
        </div>
        <span className={`${styles.pageDetailToggle} ${open ? styles.pageDetailToggleOpen : ''}`}>▾</span>
      </div>
      {open && (
        <div className={styles.pageDetailBody}>
          {config.fields?.map((field, idx) => renderField(field, idx))}
          {renderDynamic()}
        </div>
      )}
    </div>
  );
}

// ─── Template Library Modal ───────────────────────────────────────────────────

interface TemplateLibraryProps {
  onClose: () => void;
}

function TemplateLibrary({ onClose }: TemplateLibraryProps) {
  const store = useBuilderStore();

  return createPortal(
    <div className={styles.tplOverlay} onClick={onClose}>
      <div className={styles.tplModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.tplModalHead}>
          <h2>Template Library</h2>
          <button type="button" className={styles.tplModalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.tplGrid}>
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className={styles.tplCard}
              onClick={() => {
                store.loadTemplate(tpl.id);
                onClose();
              }}
            >
              <div className={styles.tplEmoji}>{tpl.emoji}</div>
              <div className={styles.tplCardName}>{tpl.name}</div>
              <div className={styles.tplCardTagline}>{tpl.tagline}</div>
              <p className={styles.tplCardDesc}>{tpl.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── FormPanel ────────────────────────────────────────────────────────────────

interface FormPanelProps {
  onGenerate: () => Promise<void>;
}

export default function FormPanel({ onGenerate }: FormPanelProps) {
  const store = useBuilderStore();
  const [showTemplates, setShowTemplates] = useState(false);
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandStatus, setBrandStatus] = useState('');
  const [competitorLoading, setCompetitorLoading] = useState(false);
  const [competitorStatus, setCompetitorStatus] = useState('');
  const [generating, setGenerating] = useState(false);

  // ── Brand extractor ───────────────────────────────────────────────────────
  const handleExtractBrand = async () => {
    if (!store.currentSiteUrl) return;
    setBrandLoading(true);
    setBrandStatus('Extracting brand...');
    try {
      const result = await extractBrand(store.currentSiteUrl);
      if (result.brand) {
        store.setField('brandIdentity', result.brand);
        setBrandStatus('Brand extracted!');
      } else {
        setBrandStatus(result.error ?? 'Could not extract brand.');
      }
    } catch {
      setBrandStatus('Network error.');
    } finally {
      setBrandLoading(false);
      setTimeout(() => setBrandStatus(''), 3000);
    }
  };

  // ── Competitor analysis ───────────────────────────────────────────────────
  const handleAnalyse = async () => {
    if (!store.competitorUrl) return;
    setCompetitorLoading(true);
    setCompetitorStatus('Analysing...');
    try {
      const result = await analyseUrl(store.competitorUrl);
      if (result.style) store.setField('styleNotes', result.style);
      if (result.seo) store.setField('competitorSeoNotes', result.seo);
      setCompetitorStatus('Analysis complete!');
    } catch {
      setCompetitorStatus('Network error.');
    } finally {
      setCompetitorLoading(false);
      setTimeout(() => setCompetitorStatus(''), 3000);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await onGenerate();
    } finally {
      setGenerating(false);
    }
  };

  // Active palette index
  const activePaletteIdx = palettePresets.findIndex((p) => {
    return (
      p.colors[0] === store.paletteColors.primary &&
      p.colors[1] === store.paletteColors.secondary &&
      p.colors[2] === store.paletteColors.accent &&
      p.colors[3] === store.paletteColors.bg
    );
  });

  return (
    <div className={styles.formPanel}>
      {/* Header */}
      <div className={styles.formHeader}>
        <h1>Build your website prompt</h1>
        <p className={styles.subtitle}>
          Fill in your business details and we&apos;ll generate a production-ready website for you.
        </p>

        {/* Template library trigger */}
        <button type="button" className={styles.tplTrigger} onClick={() => setShowTemplates(true)}>
          📚 Browse templates
        </button>
      </div>

      {/* ── Business Basics ─────────────────────────────────────────────── */}
      <div className={styles.sectionTitle}>Business basics</div>

      <div className={styles.formGroup}>
        <label>Business name</label>
        <input
          type="text"
          placeholder="e.g. Bloom Wellness Studio"
          value={store.businessName}
          onChange={(e) => store.setField('businessName', e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Industry</label>
        <select
          value={store.industryRaw}
          onChange={(e) => {
            const opt = e.target.options[e.target.selectedIndex];
            store.setIndustry(e.target.value, opt.text);
          }}
        >
          <option value="">Select an industry…</option>
          {industryGroups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {store.industryRaw === 'custom' && (
        <div className={styles.formGroup}>
          <label>Custom industry</label>
          <input
            type="text"
            placeholder="Describe your industry"
            value={store.customIndustry}
            onChange={(e) => store.setField('customIndustry', e.target.value)}
          />
        </div>
      )}

      <div className={styles.formGroup}>
        <label>What do you do?</label>
        <span className={styles.hint}>Describe your business, services, and unique value proposition.</span>
        <textarea
          placeholder="e.g. We help ambitious entrepreneurs scale past six figures through 1:1 coaching…"
          value={store.whatTheyDo}
          onChange={(e) => store.setField('whatTheyDo', e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Target audience</label>
        <textarea
          placeholder="e.g. Business owners doing £100k–£500k who are overwhelmed and stuck…"
          value={store.audience}
          onChange={(e) => store.setField('audience', e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Primary CTA</label>
        <select
          value={store.primaryCtaRaw}
          onChange={(e) => store.setField('primaryCtaRaw', e.target.value)}
        >
          <option value="">Select a CTA…</option>
          <option value="Book a free consultation">Book a free consultation</option>
          <option value="Get a free quote">Get a free quote</option>
          <option value="Book an appointment">Book an appointment</option>
          <option value="Start your free trial">Start your free trial</option>
          <option value="Shop now">Shop now</option>
          <option value="Get in touch">Get in touch</option>
          <option value="Learn more">Learn more</option>
          <option value="custom">Custom CTA…</option>
        </select>
      </div>

      {store.primaryCtaRaw === 'custom' && (
        <div className={styles.formGroup}>
          <label>Custom CTA text</label>
          <input
            type="text"
            placeholder="Enter your CTA"
            value={store.customCta}
            onChange={(e) => store.setField('customCta', e.target.value)}
          />
        </div>
      )}

      <div className={styles.formDivider} />

      {/* ── Design ──────────────────────────────────────────────────────── */}
      <div className={styles.sectionTitle}>Design</div>

      <div className={styles.formGroup}>
        <label>Design style</label>
        <select
          value={store.designStyleRaw}
          onChange={(e) => store.setField('designStyleRaw', e.target.value)}
        >
          <option value="">Select a style…</option>
          <option value="Minimal">Minimal</option>
          <option value="Bold">Bold</option>
          <option value="Elegant">Elegant</option>
          <option value="Playful">Playful</option>
          <option value="Corporate">Corporate</option>
          <option value="Warm, rustic-modern">Warm, rustic-modern</option>
          <option value="High-converting sales page with bold headline hierarchy, urgency elements, benefit-stacked sections, testimonial blocks, pricing anchors, money-back guarantee badges, countdown timers, and sticky CTA buttons">High-converting</option>
          <option value="custom">Custom…</option>
        </select>
      </div>

      {store.designStyleRaw === 'custom' && (
        <div className={styles.formGroup}>
          <label>Describe your design style</label>
          <textarea
            placeholder="e.g. Minimal, editorial with full-bleed photography…"
            value={store.customDesign}
            onChange={(e) => store.setField('customDesign', e.target.value)}
          />
        </div>
      )}

      {/* Colour Palette */}
      <span className={styles.designSubLabel}>Colour palette</span>

      <div className={styles.palettePresets}>
        {palettePresets.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            className={`${styles.palettePreset} ${activePaletteIdx === idx ? styles.palettePresetActive : ''}`}
            onClick={() => store.applyPalettePreset(idx)}
            title={preset.name}
          >
            <div className={styles.paletteSwatches}>
              {preset.colors.map((color, ci) => (
                <div key={ci} className={styles.paletteSwatch} style={{ background: color }} />
              ))}
            </div>
            <div className={styles.palettePresetName}>{preset.name}</div>
          </button>
        ))}
      </div>

      <div className={styles.colourPickersRow}>
        {(['primary', 'secondary', 'accent', 'bg'] as const).map((key) => (
          <div key={key} className={styles.colourPickerItem}>
            <span className={styles.colourPickerLabel}>{key}</span>
            <div className={styles.colourSwatchWrap}>
              <div className={styles.colourSwatchBg} style={{ background: store.paletteColors[key] }} />
              <input
                type="color"
                value={store.paletteColors[key]}
                onChange={(e) =>
                  store.setPalette({ ...store.paletteColors, [key]: e.target.value })
                }
              />
            </div>
            <span className={styles.colourHex}>{store.paletteColors[key]}</span>
          </div>
        ))}
      </div>

      {/* Font Pairing */}
      <span className={styles.designSubLabel}>Typography</span>
      <div className={styles.fontCards}>
        {fontPairings.map((fp) => (
          <div
            key={fp.id}
            className={`${styles.fontCard} ${store.selectedFontId === fp.id ? styles.fontCardActive : ''}`}
            onClick={() => store.selectFont(fp.id)}
          >
            <div className={styles.fontCardPreview} style={{ fontFamily: fp.headFont }}>
              {fp.heading}
            </div>
            <div className={styles.fontCardBodyPreview} style={{ fontFamily: fp.bodyFont }}>
              {fp.body} — body text
            </div>
            <div className={styles.fontCardMeta}>{fp.name} · {fp.desc}</div>
          </div>
        ))}
      </div>

      {/* Mood Tags */}
      <span className={styles.designSubLabel}>Mood / Aesthetic</span>
      <div className={styles.moodTags}>
        {moodTagList.map((mood) => (
          <span
            key={mood}
            className={`${styles.moodTag} ${store.activeMoods.includes(mood) ? styles.moodTagActive : ''}`}
            onClick={() => store.toggleMood(mood)}
          >
            {mood}
          </span>
        ))}
      </div>

      {/* Layout Features */}
      <span className={styles.designSubLabel}>Layout features</span>
      <div className={styles.layoutFeatures}>
        {layoutFeatureList.map((feat) => {
          const checked = store.checkedLayoutFeatureIds.includes(feat.id);
          return (
            <label
              key={feat.id}
              className={`${styles.layoutFeature} ${checked ? styles.layoutFeatureChecked : ''}`}
              onClick={() => store.toggleLayoutFeature(feat.id)}
            >
              <input type="checkbox" checked={checked} onChange={() => {}} />
              <span className={`${styles.layoutFeatureCheck} ${checked ? styles.layoutFeatureCheckActive : ''}`}>
                {checked && <CheckIcon />}
              </span>
              <span className={styles.layoutFeatureIcon}>{feat.icon}</span>
              {feat.label}
            </label>
          );
        })}
      </div>

      <div className={styles.formDivider} />

      {/* ── Pages ───────────────────────────────────────────────────────── */}
      <div className={styles.sectionTitle}>Pages</div>

      <div className={styles.sectionsGrid}>
        {store.pages.map((page) => {
          const checked = page.checked;
          return (
            <label
              key={page.id}
              className={`${styles.sectionCheck} ${checked ? styles.sectionCheckActive : ''} ${page.locked ? styles.sectionCheckLocked : ''}`}
              onClick={() => !page.locked && store.togglePage(page.id)}
            >
              <input type="checkbox" checked={checked} onChange={() => {}} />
              <span className={`${styles.checkBox} ${checked ? styles.checkBoxActive : ''}`}>
                {checked && <CheckIcon />}
              </span>
              <span className={styles.sectionLabel}>{page.label}</span>
            </label>
          );
        })}
      </div>

      {/* Page detail cards */}
      <div className={styles.pageDetailsSection}>
        {store.pages
          .filter((p) => p.checked && pageDetailConfigs[p.id])
          .map((p) => (
            <PageDetailCard key={p.id} pageId={p.id} config={pageDetailConfigs[p.id]} />
          ))}
      </div>

      <div className={styles.formDivider} />

      {/* ── Sections ────────────────────────────────────────────────────── */}
      <div className={styles.sectionTitle}>Homepage sections</div>
      <div className={styles.sectionsGrid}>
        {store.sections.map((sec) => {
          const checked = sec.checked;
          return (
            <label
              key={sec.id}
              className={`${styles.sectionCheck} ${checked ? styles.sectionCheckActive : ''}`}
              onClick={() => store.toggleSection(sec.id)}
            >
              <input type="checkbox" checked={checked} onChange={() => {}} />
              <span className={`${styles.checkBox} ${checked ? styles.checkBoxActive : ''}`}>
                {checked && <CheckIcon />}
              </span>
              <span className={styles.sectionLabel}>{sec.label}</span>
            </label>
          );
        })}
      </div>

      <div className={styles.formDivider} />

      {/* ── SEO ─────────────────────────────────────────────────────────── */}
      <div className={styles.sectionTitle}>SEO</div>

      <div className={styles.formGroup}>
        <label>SEO keywords</label>
        <span className={styles.hint}>Comma-separated keywords for meta tags and content.</span>
        <input
          type="text"
          placeholder="e.g. business coach UK, executive coaching, leadership coach"
          value={store.seoKeywords}
          onChange={(e) => store.setField('seoKeywords', e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Meta description</label>
        <textarea
          placeholder="e.g. Expert business coaching for ambitious entrepreneurs…"
          value={store.seoMeta}
          onChange={(e) => store.setField('seoMeta', e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.inlineToggle}>
          <input
            type="checkbox"
            checked={store.seoSchema}
            onChange={(e) => store.setField('seoSchema', e.target.checked)}
          />
          Include JSON-LD structured data schema
        </label>
      </div>

      <div className={styles.formDivider} />

      {/* ── Brand Extractor ─────────────────────────────────────────────── */}
      <div className={styles.sectionTitle}>Brand extractor</div>

      <div className={styles.formGroup}>
        <label>Your current website URL</label>
        <span className={styles.hint}>We&apos;ll extract your brand identity and style notes automatically.</span>
        <div className={styles.urlRow}>
          <input
            type="url"
            placeholder="https://yourbusiness.com"
            value={store.currentSiteUrl}
            onChange={(e) => store.setField('currentSiteUrl', e.target.value)}
          />
          <button
            type="button"
            className={styles.btnExtract}
            onClick={handleExtractBrand}
            disabled={brandLoading || !store.currentSiteUrl}
          >
            {brandLoading ? '...' : 'Extract brand'}
          </button>
        </div>
        {brandStatus && <span className={styles.statusMsg}>{brandStatus}</span>}
      </div>

      {store.brandIdentity && (
        <div className={styles.formGroup}>
          <label>Brand identity (extracted)</label>
          <textarea
            value={store.brandIdentity}
            onChange={(e) => store.setField('brandIdentity', e.target.value)}
          />
        </div>
      )}

      <div className={styles.formDivider} />

      {/* ── Competitor Analysis ──────────────────────────────────────────── */}
      <div className={styles.sectionTitle}>Competitor analysis</div>

      <div className={styles.formGroup}>
        <label>Competitor website URL</label>
        <div className={styles.urlRow}>
          <input
            type="url"
            placeholder="https://competitor.com"
            value={store.competitorUrl}
            onChange={(e) => store.setField('competitorUrl', e.target.value)}
          />
          <button
            type="button"
            className={styles.btnExtract}
            onClick={handleAnalyse}
            disabled={competitorLoading || !store.competitorUrl}
          >
            {competitorLoading ? '...' : 'Analyse'}
          </button>
        </div>
        {competitorStatus && <span className={styles.statusMsg}>{competitorStatus}</span>}
      </div>

      {store.styleNotes && (
        <div className={styles.formGroup}>
          <label>Style notes</label>
          <textarea
            value={store.styleNotes}
            onChange={(e) => store.setField('styleNotes', e.target.value)}
          />
        </div>
      )}

      {store.competitorSeoNotes && (
        <div className={styles.formGroup}>
          <label>Competitor SEO notes</label>
          <textarea
            value={store.competitorSeoNotes}
            onChange={(e) => store.setField('competitorSeoNotes', e.target.value)}
          />
        </div>
      )}

      <div className={styles.formDivider} />

      {/* ── Tone of voice ───────────────────────────────────────────────── */}
      <div className={styles.sectionTitle}>Tone of voice</div>
      <div className={styles.toneTags}>
        {toneOptions.map((tone) => (
          <button
            key={tone.id}
            type="button"
            className={`${styles.toneTag} ${store.selectedToneId === tone.id ? styles.toneTagActive : ''}`}
            onClick={() => store.setTone(tone.id)}
            title={tone.desc}
          >
            {tone.label}
          </button>
        ))}
      </div>

      <div className={styles.formDivider} />

      {/* ── Tech Stack & Extras ──────────────────────────────────────────── */}
      <div className={styles.sectionTitle}>Tech stack & extras</div>

      <div className={styles.formGroup}>
        <label>Tech stack preferences</label>
        <span className={styles.hint}>Optional. Leave blank for standard HTML/CSS/JS.</span>
        <input
          type="text"
          placeholder="e.g. Tailwind CSS, Alpine.js, Framer Motion"
          value={store.techStack}
          onChange={(e) => store.setField('techStack', e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Extra instructions</label>
        <textarea
          placeholder="Any additional requirements, integrations, or special notes…"
          value={store.extras}
          onChange={(e) => store.setField('extras', e.target.value)}
        />
      </div>

      {/* ── Generate button ──────────────────────────────────────────────── */}
      <div className={styles.generateBar}>
        <button
          type="button"
          className={styles.btnGenerateMain}
          onClick={handleGenerate}
          disabled={generating || store.isGenerating}
        >
          {generating || store.isGenerating ? (
            <>
              <span className={styles.btnSpinner} />
              Generating…
            </>
          ) : (
            <>
              ✨ Generate website
            </>
          )}
        </button>
        <p className={styles.generateNote}>
          Generates a fully-coded, multi-page website with your branding
        </p>
      </div>

      {/* Template Library Modal */}
      {showTemplates && <TemplateLibrary onClose={() => setShowTemplates(false)} />}
    </div>
  );
}
