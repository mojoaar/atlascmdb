'use client';
import { useState, useEffect } from 'react';
import {
  Home,
  Search,
  Box,
  Layers,
  Database,
  Bolt,
  Users,
  UserCircle,
  MapPin,
  Upload,
  Monitor,
  LayoutDashboard,
  GitBranch,
  Shield,
  History,
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
  Plug2,
  Menu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import styles from './Shell.module.css';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/components/auth/AuthProvider';
import { unwrap } from '@/lib/unwrap';

const PORTAL_NAV = [
  {
    label: 'Portal',
    items: [
      { label: 'Home', href: '/portal', icon: Home },
      { label: 'Search', href: '/portal/search', icon: Search },
      { label: 'Services', href: '/portal/services', icon: Box },
      { label: 'Applications', href: '/portal/applications', icon: Layers },
      { label: 'CIs', href: '/portal/cis', icon: Bolt },
      { label: 'Assets', href: '/portal/assets', icon: Monitor },
      { label: 'Teams', href: '/portal/teams', icon: Users },
      { label: 'Locations', href: '/portal/locations', icon: MapPin },
      { label: 'Imports', href: '/portal/imports', icon: Upload },
      { label: 'Settings', href: '/portal/settings', icon: UserCog },
    ],
  },
  {
    label: 'Documentation',
    items: [
      { label: 'Docs', href: '/docs', icon: BookOpenText, external: true },
      { label: 'API Docs', href: '/apidocs', icon: FileCode, external: true },
    ],
  },
];

const ADMIN_NAV = [
  {
    label: 'PLATFORM',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Services', href: '/admin/services', icon: Box },
      { label: 'Applications', href: '/admin/applications', icon: Layers },
      { label: 'CIs', href: '/admin/cis', icon: Bolt },
      { label: 'Racks', href: '/admin/racks', icon: LayoutGrid },
      { label: 'Assets', href: '/admin/assets', icon: Monitor },
      { label: 'Relationships', href: '/admin/relationships', icon: GitBranch },
      { label: 'Locations', href: '/admin/locations', icon: MapPin },
      { label: 'Users', href: '/admin/users', icon: UserCircle },
      { label: 'Teams', href: '/admin/teams', icon: Users },
      { label: 'Roles', href: '/admin/roles', icon: Shield },
      { label: 'Audit Events', href: '/admin/audit', icon: History },
    ],
  },
  {
    label: 'CONFIGURATION',
    items: [
      { label: 'Imports', href: '/admin/imports', icon: Upload },
      { label: 'Integrations', href: '/admin/integrations', icon: Plug2 },
      { label: 'Table Explorer', href: '/admin/database', icon: Database },
      { label: 'Themes', href: '/admin/themes', icon: Palette },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
  {
    label: 'DOCUMENTATION',
    items: [
      { label: 'Docs', href: '/docs', icon: BookOpenText, external: true },
      { label: 'API Docs', href: '/apidocs', icon: FileCode, external: true },
    ],
  },
];

export default function Shell({ children, user, activeRoute, mode = 'portal', onNavigate }) {
  const auth = useAuth();
  const liveUser = auth?.user || user;

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('atlas-sidebar-collapsed');
    if (saved === 'true') {
      setCollapsed(true);
    }
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  const handleToggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('atlas-sidebar-collapsed', String(next));
  };

  const handleNavigate = (href) => {
    setMobileOpen(false);
    onNavigate?.(href);
  };

  const sidebarClass = [
    styles.sidebar,
    collapsed ? styles.sidebarCollapsed : '',
    mobileOpen ? styles.sidebarMobileOpen : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.shell}>
      {mobileOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={sidebarClass}>
        <div className={styles.brand}>
          <Boxes size={20} />
          <span className={styles.brandText}>Atlas</span>
        </div>
        <nav className={styles.nav}>
          {mode === 'admin'
            ? ADMIN_NAV.filter(g => liveUser?.roles?.includes('admin') || g.label !== 'CONFIGURATION').map(group => (
                <div key={group.label} className={styles.sectionGroup}>
                  <div className={styles.sectionLabel}>{group.label}</div>
                  {group.items
                    .filter(item => liveUser?.roles?.includes('admin') || !['Users', 'Roles', 'Audit Events'].includes(item.label))
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
                        onClick={item.external ? undefined : (e) => { e.preventDefault(); handleNavigate(item.href); }}
                        title={collapsed ? item.label : ''}
                        {...linkProps}
                      >
                        <Icon size={18} />
                        <span className={styles.navLabel}>{item.label}</span>
                      </a>
                    );
                  })}
                </div>
              ))
            : PORTAL_NAV.map(group => (
                <div key={group.label} className={styles.sectionGroup}>
                  <div className={styles.sectionLabel}>{group.label}</div>
                  {group.items
                    .filter(item => liveUser?.roles?.includes('admin') || item.label !== 'Imports')
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
                        onClick={item.external ? undefined : (e) => { e.preventDefault(); handleNavigate(item.href); }}
                        title={collapsed ? item.label : ''}
                        {...linkProps}
                      >
                        <Icon size={18} />
                        <span className={styles.navLabel}>{item.label}</span>
                      </a>
                    );
                  })}
                </div>
              ))}
        </nav>
        <button
          className={styles.collapseBtn}
          onClick={handleToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        <div
          className={styles.userSection}
          onClick={() => handleNavigate('/portal/settings')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') handleNavigate('/portal/settings'); }}
          title={collapsed ? 'User Settings' : ''}
        >
          <div className={styles.userInfoWrapper}>
            <Avatar user={liveUser} size={36} />
            <div className={styles.userDetails}>
              <div className={styles.userName}>{liveUser?.displayName || 'User'}</div>
              <div className={styles.userEmail}>{liveUser?.email}</div>
            </div>
          </div>
          <div className={styles.userLinks}>
            {(liveUser?.roles?.includes('admin') || liveUser?.roles?.includes('editor')) && (
              <a href="/admin/dashboard"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleNavigate('/admin/dashboard'); }}>
                <Shield size={14} />
                Admin
              </a>
            )}
            <a href="/portal"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleNavigate('/portal'); }}>
              <LayoutGrid size={14} />
              Portal
            </a>
            <a href="/api/auth/logout" className={styles.logoutLink}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); auth.logout(); }}>
              <LogOut size={14} />
              Logout
            </a>
          </div>
        </div>
      </aside>
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              className={styles.hamburger}
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <span className={styles.headerTitle}>
              {mode === 'admin' ? 'Admin Console' : 'Atlas Portal'}
            </span>
          </div>
          <div className={styles.headerActions}>
            <NotificationBell onNavigate={handleNavigate} />
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
                try {
                  await fetch('/api/admin/unimpersonate', { method: 'POST' });
                } catch {}
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
      try {
        const res = await fetch('/api/notifications?unread=1&limit=1');
        if (res.ok) {
          const data = await res.json();
          setUnread(data.total || 0);
        }
      } catch (err) {
        // Ignored silently to prevent unhandled promise rejections in background
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
  try {
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
  } catch (err) {
    console.error('Failed to apply theme tokens:', err);
  }
}

function getEffectiveTokens(theme, isDark, allThemes = []) {
  if (!theme) return null;
  if (isDark) {
    if (theme.tokenSetDark) return theme.tokenSetDark;
    const prefix = theme.name.split(' ')[0];
    const sibling = allThemes.find(t => t.name.startsWith(prefix) && t.tokenSetDark);
    if (sibling) return sibling.tokenSetDark;
    const blueLine = allThemes.find(t => t.name === 'Blue Line');
    if (blueLine) return blueLine.tokenSetDark;
    return theme.tokenSetLight;
  } else {
    if (theme.tokenSetLight) return theme.tokenSetLight;
    const prefix = theme.name.split(' ')[0];
    const sibling = allThemes.find(t => t.name.startsWith(prefix) && t.tokenSetLight);
    if (sibling) return sibling.tokenSetLight;
    const blueLine = allThemes.find(t => t.name === 'Blue Line');
    if (blueLine) return blueLine.tokenSetLight;
    return theme.tokenSetDark;
  }
}

function ThemeToggle() {
  const [dark, setDark] = useState(typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark');
  const [themeTokens, setThemeTokens] = useState(null);
  const [allThemes, setAllThemes] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        let listThemes = [];
        const listRes = await fetch('/api/themes');
        if (listRes.ok && !cancelled) {
          const listData = await listRes.json();
          listThemes = unwrap(listData, []);
          setAllThemes(listThemes);
        }

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
        const tokens = getEffectiveTokens(theme, isDark, listThemes);
        applyTokens(tokens);
      } catch (err) {
        // Ignored silently to prevent unhandled promise rejections in background
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function handleThemeChanged(e) {
      const theme = e.detail?.theme;
      if (theme) {
        setThemeTokens(theme);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const tokens = getEffectiveTokens(theme, isDark, allThemes);
        applyTokens(tokens);
      }
    }
    window.addEventListener('atlas-theme-changed', handleThemeChanged);
    return () => {
      window.removeEventListener('atlas-theme-changed', handleThemeChanged);
    };
  }, [allThemes]);

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
      const tokens = getEffectiveTokens(themeTokens, next, allThemes);
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
    }).catch(() => {});
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
