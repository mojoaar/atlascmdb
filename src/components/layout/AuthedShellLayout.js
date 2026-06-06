'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Shell from '@/components/layout/Shell';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { FeedbackProvider } from '@/components/ui/FeedbackProvider';

export default function AuthedShellLayout({ mode, children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (mode === 'admin' && !data.roles?.includes('admin')) {
            router.push('/portal');
            return;
          }
          setUser(data);
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      }
      setLoading(false);
    }
    load();
  }, [mode, router]);

  function navigate(href) {
    router.push(href);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--muted-foreground)' }}>
        Loading...
      </div>
    );
  }

  return (
    <AuthProvider seededUser={user}>
      <FeedbackProvider>
        <Shell user={user} mode={mode} activeRoute={pathname} onNavigate={navigate}>
          {children}
        </Shell>
      </FeedbackProvider>
    </AuthProvider>
  );
}
