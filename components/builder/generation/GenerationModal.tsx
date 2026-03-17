'use client';

import { useState, useCallback } from 'react';
import { useBuilderStore } from '@/store/builderStore';
import { downloadAsZip } from '@/lib/builder/zipDownload';
import { supabase } from '@/lib/supabase/client';
import { streamOneCall } from '@/hooks/useGenerationFlow';
import { parseGeneratedFiles } from '@/lib/builder/fileParser';
import {
  buildSystemPrompt,
} from '@/lib/builder/promptBuilder';
import BrowserPreview from './BrowserPreview';
import styles from './GenerationModal.module.css';

// ─── Stage definitions ────────────────────────────────────────────────────────

const STAGES = [
  { id: 'build', label: 'Building website structure' },
  { id: 'design', label: 'Applying design & branding' },
  { id: 'content', label: 'Writing copy & content' },
  { id: 'seo', label: 'Optimising for SEO' },
  { id: 'finalise', label: 'Finalising output' },
];

function getStageFromProgress(progress: string): number {
  if (!progress || progress === '') return -1;
  if (progress.includes('Error')) return -1;
  if (progress === 'Done!') return STAGES.length;
  if (progress.includes('pages 1')) return 0;
  if (progress.includes('pages')) return 2;
  if (progress.includes('Generating')) return 1;
  if (progress.includes('Building')) return 0;
  return 0;
}

// ─── GenerationModal ──────────────────────────────────────────────────────────

export default function GenerationModal() {
  const store = useBuilderStore();
  const [currentTab, setCurrentTab] = useState(0);
  const [refineText, setRefineText] = useState('');
  const [refineLoading, setRefineLoading] = useState(false);
  const [refineStatus, setRefineStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const { isGenerating, generationProgress, generatedFiles, showGenerationModal } = store;

  const isDone = !isGenerating && generatedFiles.length > 0;
  const hasError = generationProgress.startsWith('Error');
  const stageIdx = getStageFromProgress(generationProgress);

  // ── Close ──────────────────────────────────────────────────────────────────
  const handleClose = () => {
    if (isGenerating) return; // Don't close while generating
    store.setField('showGenerationModal', false);
  };

  // ── Download ZIP ──────────────────────────────────────────────────────────
  const handleDownload = async () => {
    await downloadAsZip(generatedFiles, store.businessName || 'website');
  };

  // ── Save to Supabase ──────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSavedMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSavedMsg('Not signed in.');
        return;
      }
      const snapshot = store.toSnapshot();
      const { error } = await supabase.from('generations').insert({
        user_id: session.user.id,
        business_name: store.businessName,
        industry: store.industryLabel || store.industryRaw,
        page_count: generatedFiles.length,
        files: generatedFiles,
        form_data: snapshot,
      });
      if (error) {
        setSavedMsg(`Error: ${error.message}`);
      } else {
        setSavedMsg('Saved to dashboard!');
      }
    } catch (err) {
      setSavedMsg('Failed to save.');
      console.error(err);
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMsg(''), 4000);
    }
  };

  // ── Refinement ────────────────────────────────────────────────────────────
  const handleRefine = useCallback(async () => {
    if (!refineText.trim() || refineLoading) return;
    setRefineLoading(true);
    setRefineStatus('Applying refinement…');

    try {
      const currentFile = generatedFiles[currentTab];
      const rawContent = currentFile?.content ?? '';

      const system = buildSystemPrompt(store.imageUrls);
      const userPrompt = `Here is the current HTML file "${currentFile?.name ?? 'page'}":

\`\`\`html
${rawContent}
\`\`\`

Please apply the following changes and return the complete updated HTML:
${refineText}

Return the result in the same format: ===FILE: filename.html=== followed by the full HTML.`;

      let raw = '';
      await streamOneCall(system, userPrompt, (chunk) => {
        raw += chunk;
      });

      const refined = parseGeneratedFiles(raw);
      if (refined.length > 0) {
        // Replace current file
        const newFiles = [...generatedFiles];
        newFiles[currentTab] = refined[0];
        store.setField('generatedFiles', newFiles);
        setRefineStatus('Done! Changes applied.');
        setRefineText('');
      } else {
        setRefineStatus('Could not parse refinement.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setRefineStatus(`Error: ${msg}`);
    } finally {
      setRefineLoading(false);
      setTimeout(() => setRefineStatus(''), 4000);
    }
  }, [refineText, refineLoading, generatedFiles, currentTab, store]);

  if (!showGenerationModal) return null;

  return (
    <div className={styles.genModal}>
      {/* Loading screen */}
      {!isDone && !hasError && (
        <div className={styles.genLoading}>
          {/* Orb */}
          <div className={styles.loadingOrb}>
            <div className={`${styles.orbRing} ${styles.orbRing1}`} />
            <div className={`${styles.orbRing} ${styles.orbRing2}`} />
            <div className={styles.orbCore}>✨</div>
          </div>

          <h2 className={styles.loadingTitle}>Building your website…</h2>
          <p className={styles.loadingSubtitle}>
            {generationProgress || 'Preparing your prompt…'}
          </p>

          {/* Progress track */}
          <div className={styles.loadingProgressTrack}>
            <div
              className={styles.loadingProgressFill}
              style={{
                width: isGenerating ? '70%' : '0%',
              }}
            />
          </div>

          {/* Stages */}
          <div className={styles.loadingStages}>
            {STAGES.map((stage, idx) => {
              const isDoneStage = idx < stageIdx;
              const isActiveStage = idx === stageIdx;
              return (
                <div
                  key={stage.id}
                  className={`${styles.stageItem} ${isDoneStage ? styles.stageDone : ''} ${isActiveStage ? styles.stageActive : ''}`}
                >
                  <div className={styles.stageIcon}>
                    {isDoneStage ? '✓' : isActiveStage ? '●' : '○'}
                  </div>
                  <span className={styles.stageLabel}>{stage.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error screen */}
      {hasError && (
        <div className={styles.genLoading}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2 className={styles.loadingTitle} style={{ color: '#ef4444' }}>Generation failed</h2>
          <p className={styles.loadingSubtitle}>{generationProgress}</p>
          <button type="button" className={styles.btnClose} onClick={handleClose}>
            Close
          </button>
        </div>
      )}

      {/* Preview screen */}
      {isDone && (
        <div className={styles.genPreview}>
          {/* Browser chrome */}
          <div className={styles.browserChrome}>
            <div className={styles.browserTl}>
              <div className={`${styles.tl} ${styles.tlR}`} onClick={handleClose} title="Close" />
              <div className={`${styles.tl} ${styles.tlY}`} />
              <div className={`${styles.tl} ${styles.tlG}`} />
            </div>

            <div className={styles.browserUrlBar}>
              <span className={styles.browserLock}>🔒</span>
              <span>{store.businessName ? store.businessName.toLowerCase().replace(/\s+/g, '') + '.com' : 'yoursite.com'}</span>
            </div>

            <div className={styles.browserActions}>
              <button type="button" className={styles.btnBrowser} onClick={handleDownload}>
                ⬇ Download ZIP
              </button>
              <button
                type="button"
                className={`${styles.btnBrowser} ${styles.btnBrowserAccent}`}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : '💾 Save to dashboard'}
              </button>
              {savedMsg && (
                <span className={styles.savedMsg}>{savedMsg}</span>
              )}
              <button type="button" className={styles.btnBrowserClose} onClick={handleClose}>
                ✕
              </button>
            </div>
          </div>

          {/* Page Tabs */}
          {generatedFiles.length > 1 && (
            <div className={styles.browserPageTabs}>
              {generatedFiles.map((file, idx) => (
                <button
                  key={file.name}
                  type="button"
                  className={`${styles.browserTab} ${currentTab === idx ? styles.browserTabActive : ''}`}
                  onClick={() => setCurrentTab(idx)}
                >
                  <span className={styles.browserTabDot} />
                  {file.name}
                </button>
              ))}
            </div>
          )}

          {/* iframe preview */}
          <BrowserPreview files={generatedFiles} currentIdx={currentTab} />

          {/* Refine panel */}
          <div className={styles.refinePanel}>
            <div className={styles.refineRow}>
              <textarea
                className={styles.refineInput}
                placeholder="Describe changes for this page… e.g. 'Make the hero background dark navy' or 'Add a pricing section with 3 tiers'"
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleRefine();
                  }
                }}
                rows={1}
                disabled={refineLoading}
              />
              <button
                type="button"
                className={styles.btnRefine}
                onClick={handleRefine}
                disabled={refineLoading || !refineText.trim()}
              >
                {refineLoading ? '…' : 'Refine'}
              </button>
            </div>
            {refineStatus && (
              <div className={styles.refineStatus}>
                {refineLoading && <span className={styles.refineSpinner} />}
                {refineStatus}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
