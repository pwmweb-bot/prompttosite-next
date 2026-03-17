'use client';

import { create } from 'zustand';
import {
  allPages,
  allSections,
  fontPairings,
  moodTagList,
  toneOptions,
  layoutFeatureList,
  industryDefaults,
  industryDesign,
  palettePresets,
  templates,
  pageDetailConfigs,
  PageOption,
  SectionOption,
  LayoutFeature,
  Template,
} from '@/lib/builder/constants';
import type { BuilderStateSnapshot, ImageUrl, PageDetailData } from '@/lib/builder/promptBuilder';

// ─── Generated File Type ──────────────────────────────────────────────────────

export interface GeneratedFile {
  name: string;
  content: string;
}

// ─── Store Shape ─────────────────────────────────────────────────────────────

export interface BuilderStore {
  // Business info
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

  // SEO
  seoKeywords: string;
  seoMeta: string;
  seoSchema: boolean;

  // Brand / competitor
  currentSiteUrl: string;
  brandIdentity: string;
  competitorUrl: string;
  styleNotes: string;
  competitorSeoNotes: string;

  // Design
  selectedToneId: string;
  selectedFontId: string;
  activeMoods: string[];
  paletteColors: { primary: string; secondary: string; accent: string; bg: string };

  // Layout
  checkedLayoutFeatureIds: string[];

  // Pages & sections
  pages: PageOption[];
  sections: SectionOption[];
  pageDetails: PageDetailData[];

  // Image pre-fetch
  imageUrls: ImageUrl[];

  // Generation state
  isGenerating: boolean;
  generationProgress: string;
  generatedFiles: GeneratedFile[];
  currentFileIdx: number;
  showGenerationModal: boolean;

  // ─── Actions ───────────────────────────────────────────────────────────────

  setField: <K extends keyof BuilderStore>(key: K, value: BuilderStore[K]) => void;
  setIndustry: (raw: string, label: string) => void;
  togglePage: (pageId: string) => void;
  toggleSection: (sectionId: string) => void;
  toggleMood: (mood: string) => void;
  toggleLayoutFeature: (id: string) => void;
  selectFont: (fontId: string) => void;
  setTone: (toneId: string) => void;
  setPalette: (colors: BuilderStore['paletteColors']) => void;
  applyPalettePreset: (idx: number) => void;
  setPageDetail: (pageId: string, partial: Partial<Omit<PageDetailData, 'pageId'>>) => void;
  loadTemplate: (templateId: string) => void;
  toSnapshot: () => BuilderStateSnapshot;
  reset: () => void;
}

// ─── Initial Page Detail Data ─────────────────────────────────────────────────

function makeInitialPageDetails(): PageDetailData[] {
  return Object.keys(pageDetailConfigs).map((pageId) => ({
    pageId,
    fields: {},
    checkgroups: {},
    dynamicItems: [],
  }));
}

// ─── Initial State ────────────────────────────────────────────────────────────

const DEFAULT_PALETTE = { primary: '#2563eb', secondary: '#1e40af', accent: '#f59e0b', bg: '#ffffff' };

const initialState = {
  businessName: '',
  industryRaw: '',
  industryLabel: '',
  customIndustry: '',
  whatTheyDo: '',
  audience: '',
  primaryCtaRaw: '',
  customCta: '',
  designStyleRaw: '',
  customDesign: '',
  techStack: '',
  extras: '',
  seoKeywords: '',
  seoMeta: '',
  seoSchema: true,
  currentSiteUrl: '',
  brandIdentity: '',
  competitorUrl: '',
  styleNotes: '',
  competitorSeoNotes: '',
  selectedToneId: toneOptions[0]?.id ?? '',
  selectedFontId: fontPairings[0]?.id ?? '',
  activeMoods: [] as string[],
  paletteColors: DEFAULT_PALETTE,
  checkedLayoutFeatureIds: layoutFeatureList.filter((f) => f.checked).map((f) => f.id),
  pages: allPages.map((p) => ({ ...p })),
  sections: allSections.map((s) => ({ ...s })),
  pageDetails: makeInitialPageDetails(),
  imageUrls: [] as ImageUrl[],
  isGenerating: false,
  generationProgress: '',
  generatedFiles: [] as GeneratedFile[],
  currentFileIdx: 0,
  showGenerationModal: false,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  ...initialState,

  setField: (key, value) => set({ [key]: value } as Partial<BuilderStore>),

  setIndustry: (raw, label) => {
    const defaults     = industryDefaults[raw];
    const design       = industryDesign[raw];
    const paletteIdx   = design?.palette ?? -1;
    const palettePreset = paletteIdx >= 0 ? palettePresets[paletteIdx] : undefined;
    const designPalette = palettePreset
      ? { primary: palettePreset.colors[0], secondary: palettePreset.colors[1], accent: palettePreset.colors[2], bg: palettePreset.colors[3] }
      : DEFAULT_PALETTE;

    set((s) => ({
      industryRaw:   raw,
      industryLabel: label,
      // Apply industry defaults only if the user hasn't typed anything
      whatTheyDo: s.whatTheyDo || defaults?.whatTheyDo || '',
      audience:   s.audience   || defaults?.audience   || '',
      primaryCtaRaw: s.primaryCtaRaw || defaults?.primaryCta || '',
      designStyleRaw: s.designStyleRaw || defaults?.designStyle || '',
      selectedFontId: s.selectedFontId === (fontPairings[0]?.id ?? '') ? (design?.font ?? s.selectedFontId) : s.selectedFontId,
      activeMoods: s.activeMoods.length ? s.activeMoods : (design?.moods ?? []),
      paletteColors: designPalette,
    }));
  },

  togglePage: (pageId) =>
    set((s) => ({
      pages: s.pages.map((p) =>
        p.id === pageId && !p.locked ? { ...p, checked: !p.checked } : p,
      ),
    })),

  toggleSection: (sectionId) =>
    set((s) => ({
      sections: s.sections.map((sec) =>
        sec.id === sectionId ? { ...sec, checked: !sec.checked } : sec,
      ),
    })),

  toggleMood: (mood) =>
    set((s) => ({
      activeMoods: s.activeMoods.includes(mood)
        ? s.activeMoods.filter((m) => m !== mood)
        : [...s.activeMoods, mood],
    })),

  toggleLayoutFeature: (id) =>
    set((s) => ({
      checkedLayoutFeatureIds: s.checkedLayoutFeatureIds.includes(id)
        ? s.checkedLayoutFeatureIds.filter((x) => x !== id)
        : [...s.checkedLayoutFeatureIds, id],
    })),

  selectFont: (fontId) => set({ selectedFontId: fontId }),

  setTone: (toneId) => set({ selectedToneId: toneId }),

  setPalette: (colors) => set({ paletteColors: colors }),

  applyPalettePreset: (idx) => {
    const preset = palettePresets[idx];
    if (!preset) return;
    set({
      paletteColors: {
        primary:   preset.colors[0],
        secondary: preset.colors[1],
        accent:    preset.colors[2],
        bg:        preset.colors[3],
      },
    });
  },

  setPageDetail: (pageId, partial) =>
    set((s) => ({
      pageDetails: s.pageDetails.map((pd) =>
        pd.pageId === pageId ? { ...pd, ...partial } : pd,
      ),
    })),

  loadTemplate: (templateId) => {
    const tpl = templates.find((t: Template) => t.id === templateId);
    if (!tpl) return;

    const industryDef = industryDefaults[tpl.industry] ?? {};
    const design      = industryDesign[tpl.industry]   ?? {};

    // Build new pages array with template pages checked
    const newPages = allPages.map((p) => ({
      ...p,
      checked: p.locked || tpl.pages.includes(p.id),
    }));

    set({
      industryRaw:    tpl.industry,
      industryLabel:  tpl.industry,
      whatTheyDo:     tpl.whatTheyDo,
      audience:       tpl.audience,
      primaryCtaRaw:  tpl.primaryCta,
      designStyleRaw: tpl.designStyle,
      seoKeywords:    tpl.seoKeywords,
      selectedToneId: tpl.tone,
      selectedFontId: tpl.font,
      activeMoods:    tpl.moods,
      paletteColors: {
        primary:   tpl.colors.primary,
        secondary: tpl.colors.secondary,
        accent:    tpl.colors.accent,
        bg:        tpl.colors.bg,
      },
      pages: newPages,
    });
  },

  toSnapshot: (): BuilderStateSnapshot => {
    const s = get();
    return {
      businessName:           s.businessName,
      industryRaw:            s.industryRaw,
      industryLabel:          s.industryLabel,
      customIndustry:         s.customIndustry,
      whatTheyDo:             s.whatTheyDo,
      audience:               s.audience,
      primaryCtaRaw:          s.primaryCtaRaw,
      customCta:              s.customCta,
      designStyleRaw:         s.designStyleRaw,
      customDesign:           s.customDesign,
      techStack:              s.techStack,
      extras:                 s.extras,
      seoKeywords:            s.seoKeywords,
      seoMeta:                s.seoMeta,
      seoSchema:              s.seoSchema,
      currentSiteUrl:         s.currentSiteUrl,
      brandIdentity:          s.brandIdentity,
      competitorUrl:          s.competitorUrl,
      styleNotes:             s.styleNotes,
      competitorSeoNotes:     s.competitorSeoNotes,
      selectedToneId:         s.selectedToneId,
      selectedFontId:         s.selectedFontId,
      activeMoods:            s.activeMoods,
      checkedLayoutFeatureIds: s.checkedLayoutFeatureIds,
      checkedSections:        s.sections.filter((s) => s.checked).map((s) => s.id),
      checkedPages:           s.pages.filter((p) => p.checked).map((p) => p.id),
      pageDetails:            s.pageDetails,
    };
  },

  reset: () => set({ ...initialState, pageDetails: makeInitialPageDetails() }),
}));
