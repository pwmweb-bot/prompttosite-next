'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useBuilderStore } from '@/store/builderStore';
import { useGenerationFlow } from '@/hooks/useGenerationFlow';
import { fetchConfig, fetchImages } from '@/lib/api';
import { supabase } from '@/lib/supabase/client';
import FormPanel from '@/components/builder/FormPanel';
import PromptPreview from '@/components/builder/PromptPreview';
import GenerationModal from '@/components/builder/generation/GenerationModal';
import styles from './build.module.css';

export default function BuildPage() {
  const { session, loading } = useRequireAuth();
  const store = useBuilderStore();
  const { generate } = useGenerationFlow();

  // Fetch config on mount
  useEffect(() => {
    fetchConfig().catch(console.error);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleGenerate = async () => {
    // Pre-fetch images before generation
    const query = [store.industryLabel, store.seoKeywords].filter(Boolean).join(' ') || 'business';
    try {
      const { images } = await fetchImages(query, 15);
      store.setField('imageUrls', images);
    } catch {
      // Continue without images
    }
    await generate();
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className={styles.pageRoot}>
      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.navLogo}>
            Prompt<span>To</span>Site
          </Link>
          <div className={styles.navRight}>
            <span className={styles.navTag}>Builder</span>
            <Link href="/dashboard" className={styles.navBack}>
              ← Dashboard
            </Link>
            <button onClick={handleSignOut} className={styles.navSignOut}>
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Two-column layout */}
      <div className={styles.builderLayout}>
        <FormPanel onGenerate={handleGenerate} />
        <PromptPreview />
      </div>

      {/* Generation modal */}
      {store.showGenerationModal && <GenerationModal />}
    </div>
  );
}
