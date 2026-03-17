'use client';

import { useState, useCallback, useRef } from 'react';
import { useBuilderStore } from '@/store/builderStore';
import { downloadAsZip } from '@/lib/builder/zipDownload';
import { supabase } from '@/lib/supabase/client';
import { streamOneCall } from '@/hooks/useGenerationFlow';
import { parseGeneratedFiles } from '@/lib/builder/fileParser';
import {
  buildSystemPrompt,
} from '@/lib/builder/promptBuilder';
import { checkDomain, publishSite } from '@/lib/api';
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

  // ── Publish state ──────────────────────────────────────────────────────────
  const [showPublish, setShowPublish]       = useState(false);
  const [domainInput, setDomainInput]       = useState('');
  const [domainChecking, setDomainChecking] = useState(false);
  const [domainResult, setDomainResult]     = useState<{
    available?: boolean;
    purchasePrice?: number;
    renewalPrice?: number;
    error?: string;
  } | null>(null);
  const [publishStep, setPublishStep]       = useState<'idle' | 'deploying' | 'live' | 'error'>('idle');
  const [publishResult, setPublishResult]   = useState<{
    deploymentUrl?: string;
    domain?: string;
    siteId?: string;
  } | null>(null);
  const [publishError, setPublishError]     = useState('');
  const domainDebounce                      = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // ── Domain check ──────────────────────────────────────────────────────────
  const handleDomainChange = (val: string) => {
    setDomainInput(val);
    setDomainResult(null);
    if (domainDebounce.current) clearTimeout(domainDebounce.current);
    const cleaned = val.trim().toLowerCase();
    if (!cleaned || cleaned.length < 4 || !cleaned.includes('.')) return;
    domainDebounce.current = setTimeout(async () => {
      setDomainChecking(true);
      try {
        const result = await checkDomain(cleaned);
        setDomainResult(result);
      } catch {
        setDomainResult({ error: 'Could not check domain availability.' });
      } finally {
        setDomainChecking(false);
      }
    }, 700);
  };

  // ── Publish ───────────────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (publishStep === 'deploying') return;
    setPublishStep('deploying');
    setPublishError('');
    setPublishResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setPublishStep('error');
        setPublishError('Not signed in. Please log in first.');
        return;
      }

      const domain = domainInput.trim().toLowerCase() ||
        `${(store.businessName || 'mysite').toLowerCase().replace(/[^a-z0-9]/g, '')}.vercel.app`;

      const result = await publishSite(session.access_token, {
        files:        generatedFiles,
        domain,
        businessName: store.businessName || undefined,
        plan:         'monthly',
      });

      if (result.error) {
        setPublishStep('error');
        setPublishError(result.error);
        return;
      }

      setPublishResult({
        deploymentUrl: result.deploymentUrl || undefined,
        domain:        result.domain || undefined,
        siteId:        result.siteId || undefined,
      });
      setPublishStep('live');

      // Also save to dashboard if not already saved
      if (!savedMsg) {
        const snapshot = store.toSnapshot();
        await supabase.from('generations').insert({
          user_id:      session.user.id,
          business_name: store.businessName,
          industry:      store.industryLabel || store.industryRaw,
          page_count:    generatedFiles.length,
          files:         generatedFiles,
          form_data:     snapshot,
        });
      }
    } catch (err) {
      setPublishStep('error');
      setPublishError(err instanceof Error ? err.message : 'Publish failed.');
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
                {saving ? 'Saving…' : '💾 Save'}
              </button>
              <button
                type="button"
                className={`${styles.btnBrowser} ${styles.btnBrowserPublish}`}
                onClick={() => { setShowPublish(p => !p); setPublishStep('idle'); }}
              >
                🚀 Publish
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

          {/* Publish panel */}
          {showPublish && (
            <div className={styles.publishPanel}>
              {/* idle / domain step */}
              {(publishStep === 'idle' || publishStep === 'error') && (
                <>
                  <div className={styles.publishHeader}>
                    <span className={styles.publishIcon}>🚀</span>
                    <div>
                      <div className={styles.publishTitle}>Publish your site</div>
                      <div className={styles.publishSub}>Deploy instantly — your site goes live in seconds</div>
                    </div>
                  </div>

                  <div className={styles.publishDomainRow}>
                    <div className={styles.publishDomainWrap}>
                      <input
                        className={styles.publishDomainInput}
                        type="text"
                        placeholder="yourbusiness.co.uk  (optional)"
                        value={domainInput}
                        onChange={e => handleDomainChange(e.target.value)}
                        spellCheck={false}
                        autoComplete="off"
                      />
                      {domainChecking && <span className={styles.publishDomainSpinner} />}
                      {!domainChecking && domainResult && !domainResult.error && (
                        <span className={domainResult.available ? styles.publishAvail : styles.publishTaken}>
                          {domainResult.available
                            ? `✓ Available — £${domainResult.purchasePrice?.toFixed(2)}/yr`
                            : '✗ Unavailable'}
                        </span>
                      )}
                      {domainResult?.error && (
                        <span className={styles.publishTaken}>{domainResult.error}</span>
                      )}
                    </div>
                    <div className={styles.publishDomainHint}>
                      Leave blank to get a free <code>*.vercel.app</code> URL
                    </div>
                  </div>

                  {publishStep === 'error' && (
                    <div className={styles.publishErrorMsg}>⚠ {publishError}</div>
                  )}

                  <button
                    type="button"
                    className={styles.btnPublishGo}
                    onClick={handlePublish}
                  >
                    🚀 Publish &amp; Go Live
                  </button>
                </>
              )}

              {/* deploying step */}
              {publishStep === 'deploying' && (
                <div className={styles.publishDeploying}>
                  <div className={styles.publishSpinOrb} />
                  <div className={styles.publishDeployTitle}>Deploying your site…</div>
                  <div className={styles.publishDeploySub}>Creating project · Uploading files · Assigning domain</div>
                  <div className={styles.publishDeployBar}>
                    <div className={styles.publishDeployBarFill} />
                  </div>
                </div>
              )}

              {/* live step */}
              {publishStep === 'live' && publishResult && (
                <div className={styles.publishLive}>
                  <div className={styles.publishLiveIcon}>🎉</div>
                  <div className={styles.publishLiveTitle}>Your site is live!</div>
                  {publishResult.deploymentUrl && (
                    <a
                      href={publishResult.deploymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.publishLiveUrl}
                    >
                      {publishResult.deploymentUrl}
                    </a>
                  )}
                  {domainInput && domainResult?.available && (
                    <div className={styles.publishDnsNote}>
                      <strong>Domain linked.</strong> DNS changes can take up to 48 hrs to propagate.
                      Point your domain's nameservers to Vercel to complete setup.
                    </div>
                  )}
                  <div className={styles.publishLiveActions}>
                    <a
                      href={publishResult.deploymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.btnPublishOpen}
                    >
                      Open site ↗
                    </a>
                    <button
                      type="button"
                      className={styles.btnPublishDone}
                      onClick={() => setShowPublish(false)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
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
