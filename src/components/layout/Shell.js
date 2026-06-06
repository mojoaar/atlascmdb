'use client';
import { useState, useEffect } from 'react';
import {
  Home,
  Search,
  Server,
  Layers,
  Database,
  Users,
  UserCircle,
  MapPin,
  Upload,
  Monitor,
  LayoutDashboard,
  GitBranch,
  Shield,
  Palette,
  Settings,
  UserCog,
  Boxes,
  Sun,
  Moon,
  LayoutGrid,
  LogOut,
  BookOpenText,
  FileCode,
  Bell,
} from 'lucide-react';
import styles from './Shell.module.css';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/components/auth/AuthProvider';

const PORTAL_NAV = [
  { label: 'Home', href: '/portal', icon: Home },
  { label: 'Search', href: '/portal/search', icon: Search },
  { label: 'Services', href: '/portal/services', icon: Server },
  { label: 'Applications', href: '/portal/applications', icon: Layers },
  { label: 'CIs', href: '/portal/cis', icon: Database },
  { label: 'Assets', href: '/portal/assets', icon: Monitor },
  { label: 'Teams', href: '/portal/teams', icon: Users },
  { label: 'Locations', href: '/portal/locations', icon: MapPin },
  { label: 'Imports', href: '/portal/imports', icon: Upload },
  { label: 'Settings', href: '/portal/settings', icon: UserCog },
  { label: 'Docs', href: '/docs', icon: BookOpenText, external: true },
  { label: 'API Docs', href: '/apidocs', icon: FileCode, external: true },
];

const ADMIN_NAV = [
  {
    label: 'PLATFORM',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Services', href: '/admin/services', icon: Server },
      { label: 'Applications', href: '/admin/applications', icon: Layers },
      { label: 'CIs', href: '/admin/cis', icon: Database },
      { label: 'Racks', href: '/admin/racks', icon: LayoutGrid },
      { label: 'Assets', href: '/admin/assets', icon: Monitor },
      { label: 'Relationships', href: '/admin/relationships', icon: GitBranch },
      { label: 'Locations', href: '/admin/locations', icon: MapPin },
      { label: 'Users', href: '/admin/users', icon: UserCircle },
      { label: 'Teams', href: '/admin/teams', icon: Users },
      { label: 'Roles', href: '/admin/roles', icon: Shield },
      { label: 'Docs', href: '/docs', icon: BookOpenText, external: true },
      { label: 'API Docs', href: '/apidocs', icon: FileCode, external: true },
    ],
  },
  {
    label: 'CONFIGURATION',
    items: [
      { label: 'Imports', href: '/admin/imports', icon: Upload },
      { label: 'Themes', href: '/admin/themes', icon: Palette },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export default function Shell({ children, user, activeRoute, mode = 'portal', onNavigate }) {
  const auth = useAuth();
  const liveUser = auth?.user || user;
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Boxes size={20} />
          <span>Atlas</span>
        </div>
        <nav className={styles.nav}>
          {mode === 'admin'
            ? ADMIN_NAV.filter(g => liveUser?.roles?.includes('admin') || g.label !== 'CONFIGURATION').map(group => (
                <div key={group.label}>
                  <div className={styles.sectionLabel}>{group.label}</div>
                  {group.items
                    .filter(item => liveUser?.roles?.includes('admin') || !['Users', 'Roles'].includes(item.label))
                    .map(item => {
                    const Icon = item.icon;
                    const linkProps = item.external
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {};
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        className={`${styles.navItem} ${activeRoute === item.href ? styles.navItemActive : ''}`}
                        onClick={item.external ? undefined : (e) => { e.preventDefault(); onNavigate?.(item.href); }}
                        {...linkProps}
                      >
                        <Icon size={18} />
                        {item.label}
                      </a>
                    );
                  })}
                </div>
              ))
            : <>
                <div className={styles.sectionLabel}>Portal</div>
                {PORTAL_NAV.filter(item => liveUser?.roles?.includes('admin') || item.label !== 'Imports').map(item => {
                const Icon = item.icon;
                const linkProps = item.external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {};
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`${styles.navItem} ${activeRoute === item.href ? styles.navItemActive : ''}`}
                    onClick={item.external ? undefined : (e) => { e.preventDefault(); onNavigate?.(item.href); }}
                    {...linkProps}
                  >
                    <Icon size={18} />
                    {item.label}
                  </a>
                );
              })}
              </>}
        </nav>
        <div
          className={styles.userSection}
          onClick={() => onNavigate?.('/portal/settings')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') onNavigate?.('/portal/settings'); }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Avatar user={liveUser} size={36} />
            <div>
              <div className={styles.userName}>{liveUser?.displayName || 'User'}</div>
              <div className={styles.userEmail}>{liveUser?.email}</div>
            </div>
          </div>
          <div className={styles.userLinks}>
            {(liveUser?.roles?.includes('admin') || liveUser?.roles?.includes('editor')) && (
              <a href="/admin/dashboard"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNavigate?.('/admin/dashboard'); }}>
                <Shield size={14} />
                Admin
              </a>
            )}
            <a href="/portal"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNavigate?.('/portal'); }}>
              <LayoutGrid size={14} />
              Portal
            </a>
            <a href="/api/auth/logout" className={styles.logoutLink}>
              <LogOut size={14} />
              Logout
            </a>
          </div>
        </div>
      </aside>
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            {mode === 'admin' ? 'Admin Console' : 'Atlas Portal'}
          </div>
          <div className={styles.headerActions}>
            <NotificationBell onNavigate={onNavigate} />
            <ThemeToggle />
          </div>
        </header>
        {liveUser?.impersonatedBy && (
          <div style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            background: '#1a1a2e',
            color: '#fff',
            padding: '0.75rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            borderRadius: '6px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}>
            <span>Impersonating <strong>{liveUser.displayName}</strong> ({liveUser.email})</span>
            <button
              onClick={async () => {
                await fetch('/api/admin/unimpersonate', { method: 'POST' });
                window.location.href = '/admin/users';
              }}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff',
                padding: '0.3rem 0.85rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Stop
            </button>
          </div>
        )}
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}

function NotificationBell({ onNavigate }) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/notifications?unread=1&limit=1');
      if (res.ok) {
        const data = await res.json();
        setUnread(data.total || 0);
      }
    }
    load();
    const interval = setInterval(load, 30000);
    function onVisible() { if (!document.hidden) load(); }
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return (
    <button
      onClick={() => onNavigate?.('/portal/notifications')}
      className={styles.bellButton}
      title="Notifications"
    >
      <Bell size={18} />
      {unread > 0 && <span className={styles.bellBadge}>{unread > 99 ? '99+' : unread}</span>}
    </button>
  );
}

function applyTokens(tokenSet) {
  if (!tokenSet) return;
  const parsed = typeof tokenSet === 'string' ? JSON.parse(tokenSet) : tokenSet;
  if (!parsed?.colors) return;
  for (const [key, value] of Object.entries(parsed.colors)) {
    const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    document.documentElement.style.setProperty(`--${cssVar}`, value);
  }
  if (parsed.borderRadius) document.documentElement.style.setProperty('--radius', parsed.borderRadius);
  if (parsed.fontFamily) document.documentElement.style.setProperty('--font-family', parsed.fontFamily);
  if (parsed.hover) document.documentElement.style.setProperty('--hover', parsed.hover);
}

function ThemeToggle() {
  const [dark, setDark] = useState(typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark');
  const [themeTokens, setThemeTokens] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const tr = await fetch('/api/me/theme');
      if (!tr.ok || cancelled) return;
      const prefs = await tr.json();
      if (!prefs?.themeId || cancelled) return;
      const r = await fetch(`/api/themes/${prefs.themeId}`);
      if (!r.ok || cancelled) return;
      const theme = await r.json();
      if (!theme || cancelled) return;
      setThemeTokens(theme);
      const modePref = prefs.modePreference || 'light';
      const isDark = modePref === 'dark';
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : '');
      setDark(isDark);
      localStorage.setItem('atlas-theme-mode', isDark ? 'dark' : 'light');
      const tokens = isDark ? (theme.tokenSetDark || theme.tokenSetLight) : theme.tokenSetLight;
      applyTokens(tokens);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  function clearTokens() {
    const el = document.documentElement;
    const remove = [];
    for (let i = 0; i < el.style.length; i++) {
      const name = el.style[i];
      if (name.startsWith('--')) remove.push(name);
    }
    remove.forEach(n => el.style.removeProperty(n));
    el.style.removeProperty('--radius');
    el.style.removeProperty('--font-family');
    el.style.removeProperty('--hover');
  }

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : '');
    localStorage.setItem('atlas-theme-mode', next ? 'dark' : 'light');
    if (themeTokens) {
      const tokens = next ? (themeTokens.tokenSetDark || themeTokens.tokenSetLight) : themeTokens.tokenSetLight;
      if (tokens) {
        clearTokens();
        applyTokens(tokens);
      }
    } else {
      clearTokens();
    }
    fetch('/api/me/theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modePreference: next ? 'dark' : 'light' }),
    });
  }

  return (
    <button
      onClick={toggle}
      className={styles.themeToggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
