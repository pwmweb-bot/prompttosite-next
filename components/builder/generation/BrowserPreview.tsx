'use client';

import { useEffect, useRef, useState } from 'react';
import type { GeneratedFile } from '@/store/builderStore';
import styles from './BrowserPreview.module.css';

interface BrowserPreviewProps {
  files: GeneratedFile[];
  currentIdx: number;
}

export default function BrowserPreview({ files, currentIdx }: BrowserPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const prevUrlRef = useRef<string>('');

  const currentFile = files[currentIdx];

  useEffect(() => {
    if (!currentFile) return;

    // Revoke the previous blob URL to free memory
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current);
    }

    const blob = new Blob([currentFile.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    prevUrlRef.current = url;
    setBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [currentFile]);

  if (!currentFile) {
    return (
      <div className={styles.emptyPreview}>
        <p>No file selected.</p>
      </div>
    );
  }

  const iframeWidth =
    viewport === 'desktop' ? '100%' :
    viewport === 'tablet'  ? '768px' :
    '375px';

  return (
    <div className={styles.viewportWrapper}>
      {/* Viewport toggle */}
      <div className={styles.viewportToggles}>
        <button
          type="button"
          className={`${styles.btnViewport} ${viewport === 'desktop' ? styles.btnViewportActive : ''}`}
          onClick={() => setViewport('desktop')}
          title="Desktop"
        >
          🖥
        </button>
        <button
          type="button"
          className={`${styles.btnViewport} ${viewport === 'tablet' ? styles.btnViewportActive : ''}`}
          onClick={() => setViewport('tablet')}
          title="Tablet"
        >
          📱
        </button>
        <button
          type="button"
          className={`${styles.btnViewport} ${viewport === 'mobile' ? styles.btnViewportActive : ''}`}
          onClick={() => setViewport('mobile')}
          title="Mobile"
        >
          📲
        </button>
      </div>

      {/* Viewport container */}
      <div className={`${styles.browserViewport} ${styles[`vp${viewport.charAt(0).toUpperCase() + viewport.slice(1)}`]}`}>
        {blobUrl && (
          <iframe
            ref={iframeRef}
            src={blobUrl}
            title={currentFile.name}
            style={{
              width: iframeWidth,
              height: '100%',
              border: 'none',
              display: 'block',
              transition: 'width 0.25s ease, box-shadow 0.25s ease',
              boxShadow: viewport !== 'desktop' ? '2px 0 20px rgba(0,0,0,0.2), -2px 0 20px rgba(0,0,0,0.2)' : 'none',
            }}
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>
    </div>
  );
}
