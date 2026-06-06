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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    let isRefreshing = false;
    let failedQueue = [];

    const processQueue = (error, token = null) => {
      failedQueue.forEach((prom) => {
        if (error) {
          prom.reject(error);
        } else {
          prom.resolve(token);
        }
      });
      failedQueue = [];
    };

    window.fetch = async function (...args) {
      const res = await originalFetch(...args);

      if (res.status === 401) {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;

        // Do not intercept authentication-related endpoints to prevent infinite loops
        if (url && (
          url.includes('/api/auth/login') ||
          url.includes('/api/auth/refresh') ||
          url.includes('/api/auth/logout') ||
          url.includes('/api/auth/me') ||
          url.includes('/api/config/public')
        )) {
          return res;
        }

        // If already rotating, queue this request's retry promise
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => originalFetch(...args))
            .catch(() => res);
        }

        isRefreshing = true;

        try {
          const refreshRes = await originalFetch('/api/auth/refresh', { method: 'POST' });
          if (refreshRes.ok) {
            processQueue(null);
            isRefreshing = false;
            // Re-try original request
            return originalFetch(...args);
          } else {
            throw new Error('Session expired');
          }
        } catch (err) {
          processQueue(err);
          isRefreshing = false;
          
          // Log out user cleanly and redirect to login
          originalFetch('/api/auth/logout', { method: 'POST' });
          localStorage.removeItem('atlas_access');
          localStorage.removeItem('atlas_refresh');
          window.location.href = '/login?expired=true';
          return res;
        }
      }

      return res;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

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
