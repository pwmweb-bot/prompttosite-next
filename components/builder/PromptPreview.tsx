'use client';

import { useMemo, useState, useCallback } from 'react';
import { useBuilderStore } from '@/store/builderStore';
import { buildPromptText } from '@/lib/builder/promptBuilder';
import type { ColourValues } from '@/lib/builder/promptBuilder';
import styles from './PromptPreview.module.css';

// ─── Syntax highlighting ──────────────────────────────────────────────────────
// Applies color coding to the prompt text for readability.

function highlightPrompt(text: string): string {
  // Escape HTML first
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped
    // ## Headers (h2) — purple/violet
    .replace(
      /^(## .+)$/gm,
      '<span class="t-head">$1</span>',
    )
    // ### Sub-headers (h3) — lighter purple
    .replace(
      /^(### .+)$/gm,
      '<span class="t-head" style="color:#a5b4fc">$1</span>',
    )
    // **Bold** text — sky blue
    .replace(
      /\*\*(.+?)\*\*/g,
      '<strong style="color:#7dd3fc">$1</strong>',
    )
    // `[placeholder]` — amber
    .replace(
      /\[([^\]]+)\]/g,
      '<span class="t-ph">[$1]</span>',
    )
    // Bullet list items (- …)
    .replace(
      /^(- )(.+)$/gm,
      '<span class="t-bullet">$1</span><span class="t-val">$2</span>',
    )
    // Lines starting with a number (1. …)
    .replace(
      /^(\d+\. )(.+)$/gm,
      '<span class="t-num">$1</span>$2',
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PromptPreview() {
  const [copied, setCopied] = useState(false);

  // Read individual slices so changes trigger re-renders
  const toSnapshot = useBuilderStore((s) => s.toSnapshot);
  const paletteColors: ColourValues = useBuilderStore((s) => s.paletteColors);

  const promptText = useMemo(() => {
    const snapshot = toSnapshot();
    return buildPromptText(snapshot, paletteColors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toSnapshot, paletteColors]);

  const wordCount = useMemo(() => {
    return promptText.trim().split(/\s+/).filter(Boolean).length;
  }, [promptText]);

  const charCount = promptText.length;

  const highlightedHtml = useMemo(() => highlightPrompt(promptText), [promptText]);

  const handleCopy = useCallback(async () => {
    if (!promptText) return;
    try {
      await navigator.clipboard.writeText(promptText);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = promptText;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [promptText]);

  return (
    <div className={styles.previewPanel}>
      {/* Header */}
      <div className={styles.previewHeader}>
        <div className={styles.previewHeaderLeft}>
          <div className={styles.previewDots}>
            <span className={`${styles.dot} ${styles.dotR}`} />
            <span className={`${styles.dot} ${styles.dotY}`} />
            <span className={`${styles.dot} ${styles.dotG}`} />
          </div>
          <span className={styles.previewFilename}>prompt.md</span>
        </div>
        <div className={styles.previewActions}>
          <span className={styles.charCount}>
            {wordCount.toLocaleString()} words · {charCount.toLocaleString()} chars
          </span>
          <button
            type="button"
            className={`${styles.btnCopy} ${copied ? styles.btnCopyCopied : ''}`}
            onClick={handleCopy}
          >
            {copied ? (
              <>✓ Copied!</>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy prompt
              </>
            )}
          </button>
        </div>
      </div>

      {/* Prompt body */}
      <div className={styles.previewBody}>
        {promptText.trim() ? (
          <div
            className={styles.promptContent}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : (
          <span className={styles.emptyState}>
            Start filling in the form to see your prompt preview here…
          </span>
        )}
      </div>

      {/* Completion bar */}
      <div className={styles.completionBar}>
        <div className={styles.barTrack}>
          <div
            className={styles.barFill}
            style={{
              width: `${Math.min(100, Math.round((charCount / 8000) * 100))}%`,
            }}
          />
        </div>
        <span className={styles.barLabel}>
          Prompt length: <span>{charCount.toLocaleString()}</span> chars
        </span>
      </div>
    </div>
  );
}
