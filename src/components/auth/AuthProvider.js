'use client';

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function useFormat() {
  const ctx = useContext(AuthContext);
  if (!ctx) return { formatDateTime: (d) => new Date(d).toLocaleString(), formatDate: (d) => new Date(d).toLocaleDateString(), refresh: () => {} };
  return { formatDateTime: ctx.formatDateTime, formatDate: ctx.formatDate, refresh: ctx.refresh };
}

export function AuthProvider({ children, seededUser }) {
  const [user, setUser] = useState(seededUser || null);
  const [loading, setLoading] = useState(!seededUser);
  const [version, setVersion] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  function refresh() {
    setVersion(v => v + 1);
  }

  useEffect(() => {
    if (seededUser && version === 0) return;
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          if (!pathname.startsWith('/login') && !pathname.startsWith('/forgot-password') && !pathname.startsWith('/reset-password')) {
            router.push('/login');
          }
        }
      } catch {
        if (!pathname.startsWith('/login') && !pathname.startsWith('/forgot-password') && !pathname.startsWith('/reset-password')) {
          router.push('/login');
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [pathname, version]);

  function logout() {
    fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('atlas_access');
    localStorage.removeItem('atlas_refresh');
    setUser(null);
    router.push('/login');
  }

  const locale = useMemo(() => {
    const timezone = user?.timezone || 'Europe/Copenhagen';
    const clockFormat = user?.clockFormat || '24h';
    const dateFormat = user?.dateFormat || 'DD/MM/YYYY';

    const formatDateTime = (dateString) => {
      if (!dateString) return '—';
      const iso = dateString.endsWith('Z') || /\+\d{2}:\d{2}$/.test(dateString)
        ? dateString
        : dateString.replace(' ', 'T') + 'Z';
      const d = new Date(iso);
      const fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: clockFormat === '12h' ? 'h12' : 'h23',
      });
      const parts = fmt.formatToParts(d);
      const h = parts.find(p => p.type === 'hour')?.value || '00';
      const m = parts.find(p => p.type === 'minute')?.value || '00';
      const period = clockFormat === '12h' ? ' ' + (parts.find(p => p.type === 'dayPeriod')?.value || '') : '';
      const timePart = `${h}:${m}${period}`;
      const datePart = formatDate(dateString);
      return `${datePart} ${timePart}`;
    };

    const formatDate = (dateString) => {
      if (!dateString) return '—';
      const iso = dateString.includes('Z') || dateString.includes('+') || dateString.includes('T')
        ? dateString
        : dateString.replace(' ', 'T') + 'Z';
      const d = new Date(iso);
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(d);
      const get = (t) => parts.find(p => p.type === t)?.value || '00';
      const y = get('year'), m = get('month'), day = get('day');
      if (dateFormat === 'MM/DD/YYYY') return `${m}/${day}/${y}`;
      if (dateFormat === 'YYYY-MM-DD') return `${y}-${m}-${day}`;
      return `${day}/${m}/${y}`;
    };

    return { formatDateTime, formatDate };
  }, [user?.timezone, user?.clockFormat, user?.dateFormat]);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refresh, ...locale }}>
      {children}
    </AuthContext.Provider>
  );
}
