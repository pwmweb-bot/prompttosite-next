'use client';

import Link from 'next/link';

interface NavProps {
  userEmail?: string | null;
  onSignOut?: () => void;
  showNewWebsite?: boolean;
}

export default function Nav({ userEmail, onSignOut, showNewWebsite }: NavProps) {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          Prompt<span>ToSite</span>
        </Link>

        {(userEmail || onSignOut || showNewWebsite) && (
          <div className="nav-right">
            {userEmail && <span className="nav-email">{userEmail}</span>}
            {showNewWebsite && (
              <Link href="/build" className="btn-sm btn-sm-outline">
                + New website
              </Link>
            )}
            {onSignOut && (
              <button className="btn-sm btn-sm-outline" onClick={onSignOut}>
                Sign out
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
