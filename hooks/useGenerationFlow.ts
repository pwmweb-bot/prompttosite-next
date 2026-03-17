'use client';

import { useCallback } from 'react';
import { useBuilderStore, GeneratedFile } from '@/store/builderStore';
import {
  buildPromptText,
  buildSystemPrompt,
  buildContinuationSystemPrompt,
  buildContinuationUserPrompt,
} from '@/lib/builder/promptBuilder';
import { parseGeneratedFiles, extractDesignSystem } from '@/lib/builder/fileParser';
import { generateStream } from '@/lib/api';

const BATCH_SIZE = 3;

// ─── Low-level stream helper ──────────────────────────────────────────────────

export async function streamOneCall(
  system: string,
  userPrompt: string,
  onChunk: (text: string) => void,
): Promise<string> {
  const res = await generateStream(system, [{ role: 'user', content: userPrompt }]);

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') break;
      try {
        const json = JSON.parse(raw);
        const delta = json?.delta?.text ?? json?.choices?.[0]?.delta?.content ?? '';
        if (delta) {
          accumulated += delta;
          onChunk(delta);
        }
      } catch {
        // Ignore parse errors for partial chunks
      }
    }
  }

  return accumulated;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGenerationFlow() {
  const store = useBuilderStore();

  const generate = useCallback(async () => {
    const snapshot    = store.toSnapshot();
    const pageIds     = snapshot.checkedPages;
    const colours     = store.paletteColors;
    const imageUrls   = store.imageUrls;
    const isMultiCall = pageIds.length > BATCH_SIZE;

    store.setField('isGenerating', true);
    store.setField('showGenerationModal', true);
    store.setField('generatedFiles', []);
    store.setField('currentFileIdx', 0);

    const allFiles: GeneratedFile[] = [];
    let rawAccumulated = '';

    try {
      if (!isMultiCall) {
        // ── Single call ──────────────────────────────────────────────────────
        store.setField('generationProgress', 'Building your website…');
        const system     = buildSystemPrompt(imageUrls);
        const userPrompt = buildPromptText(snapshot, colours);

        let raw = '';
        await streamOneCall(system, userPrompt, (chunk) => {
          raw += chunk;
          // Update files in real-time as we accumulate
          const files = parseGeneratedFiles(raw);
          if (files.length) {
            store.setField('generatedFiles', files);
          }
        });

        rawAccumulated = raw;

      } else {
        // ── Multi-call ───────────────────────────────────────────────────────
        const batches: string[][] = [];
        for (let i = 0; i < pageIds.length; i += BATCH_SIZE) {
          batches.push(pageIds.slice(i, i + BATCH_SIZE));
        }

        let rootCss = '';
        let navHtml = '';

        for (let bi = 0; bi < batches.length; bi++) {
          const batch       = batches[bi];
          const from        = bi * BATCH_SIZE + 1;
          const to          = Math.min(from + BATCH_SIZE - 1, pageIds.length);
          const isFirstBatch = bi === 0;

          store.setField(
            'generationProgress',
            `Generating pages ${from}–${to} of ${pageIds.length}…`,
          );

          let batchRaw = '';

          if (isFirstBatch) {
            const system     = buildSystemPrompt(imageUrls);
            const userPrompt = buildPromptText(snapshot, colours, batch);
            await streamOneCall(system, userPrompt, (chunk) => {
              batchRaw += chunk;
              const files = parseGeneratedFiles(rawAccumulated + batchRaw);
              if (files.length) store.setField('generatedFiles', files);
            });

            // Extract design system for continuation calls
            const ds = extractDesignSystem(batchRaw);
            rootCss  = ds.rootCss;
            navHtml  = ds.navHtml;

          } else {
            const system     = buildContinuationSystemPrompt(rootCss, navHtml, imageUrls);
            const userPrompt = buildContinuationUserPrompt(
              batch,
              snapshot.businessName,
              snapshot.industryLabel,
              snapshot.whatTheyDo,
            );
            await streamOneCall(system, userPrompt, (chunk) => {
              batchRaw += chunk;
              const files = parseGeneratedFiles(rawAccumulated + batchRaw);
              if (files.length) store.setField('generatedFiles', files);
            });
          }

          rawAccumulated += batchRaw;
        }
      }

      // Final parse
      const finalFiles = parseGeneratedFiles(rawAccumulated);
      store.setField('generatedFiles', finalFiles.length ? finalFiles : allFiles);
      store.setField('generationProgress', 'Done!');

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      store.setField('generationProgress', `Error: ${msg}`);
      console.error('[generation] Error:', err);
    } finally {
      store.setField('isGenerating', false);
    }
  }, [store]);

  return { generate };
}
