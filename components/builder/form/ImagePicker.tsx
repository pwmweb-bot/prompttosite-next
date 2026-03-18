'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useBuilderStore } from '@/store/builderStore';
import { fetchImages } from '@/lib/api';
import type { ImageUrl } from '@/lib/builder/promptBuilder';
import styles from './ImagePicker.module.css';

interface PexelsImage extends ImageUrl {
  thumb?: string;
}

const MAX_SELECTED = 12;

export default function ImagePicker() {
  const store = useBuilderStore();

  const [available, setAvailable]     = useState<PexelsImage[]>([]);
  const [selected, setSelected]       = useState<PexelsImage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading]         = useState(false);
  const [loaded, setLoaded]           = useState(false);
  const debounceRef                   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevAutoQuery                 = useRef('');

  // Build auto-query from store fields
  const buildAutoQuery = useCallback(() => {
    return [store.industryLabel, store.businessName]
      .filter(Boolean)
      .join(' ')
      .trim() || '';
  }, [store.industryLabel, store.businessName]);

  // Load images from Pexels
  const loadImages = useCallback(async (query: string) => {
    if (!query) return;
    setLoading(true);
    try {
      const { images } = await fetchImages(query, 18);
      setAvailable(images as PexelsImage[]);
      setLoaded(true);
    } catch {
      // silently fail — generation still works without images
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load when industry or business name changes (debounced)
  useEffect(() => {
    const autoQuery = buildAutoQuery();
    if (!autoQuery || autoQuery === prevAutoQuery.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      prevAutoQuery.current = autoQuery;
      setSearchQuery(autoQuery);
      loadImages(autoQuery);
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [store.industryLabel, store.businessName, buildAutoQuery, loadImages]);

  // Sync selected → store.imageUrls
  useEffect(() => {
    store.setField('imageUrls', selected.map(img => ({
      url:    img.url,
      alt:    img.alt,
      credit: img.credit,
    })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) loadImages(searchQuery.trim());
  };

  const toggleImage = (img: PexelsImage) => {
    setSelected(prev => {
      const isSelected = prev.some(s => s.url === img.url);
      if (isSelected) return prev.filter(s => s.url !== img.url);
      if (prev.length >= MAX_SELECTED) return prev;
      return [...prev, img];
    });
  };

  const clearAll = () => setSelected([]);

  const isSelected = (img: PexelsImage) => selected.some(s => s.url === img.url);

  return (
    <div className={styles.wrapper}>
      {/* Search bar */}
      <form className={styles.searchRow} onSubmit={handleSearch}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="e.g. bakery, coffee shop, yoga studio…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <button type="submit" className={styles.searchBtn} disabled={loading}>
          {loading ? '…' : '🔍'}
        </button>
      </form>

      {/* Status row */}
      {loaded && (
        <div className={styles.statusRow}>
          <span className={styles.statusCount}>
            {selected.length > 0
              ? `${selected.length} selected (max ${MAX_SELECTED})`
              : 'Click images to select them for your site'}
          </span>
          {selected.length > 0 && (
            <button type="button" className={styles.clearBtn} onClick={clearAll}>
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Image grid */}
      {!loaded && !loading && (
        <p className={styles.hint}>
          Fill in your business name or industry above and images will load automatically.
        </p>
      )}

      {loading && (
        <div className={styles.loadingGrid}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      )}

      {!loading && loaded && (
        <div className={styles.grid}>
          {available.map((img, i) => {
            const sel = isSelected(img);
            const atMax = selected.length >= MAX_SELECTED;
            return (
              <button
                key={img.url + i}
                type="button"
                className={`${styles.imgBtn} ${sel ? styles.imgSelected : ''} ${!sel && atMax ? styles.imgDisabled : ''}`}
                onClick={() => toggleImage(img)}
                title={img.alt}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={(img as PexelsImage).thumb || img.url}
                  alt={img.alt}
                  className={styles.thumb}
                  loading="lazy"
                />
                {sel && <span className={styles.checkmark}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
