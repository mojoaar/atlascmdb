'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import Badge from '@/components/ui/Badge';
import { Trash2 } from 'lucide-react';
import styles from './page.module.css';
import LoadingState from '@/components/ui/LoadingState';
import { unwrap } from '@/lib/unwrap';

const TYPE_VARIANT = { info: 'info', warning: 'warning', success: 'success', danger: 'danger' };
const TYPE_BADGE = { info: 'info', warning: 'warning', success: 'success', danger: 'danger' };

const ENTITY_NAV = {
  service: '/portal/services',
  application: '/portal/applications',
  ci: '/portal/cis',
  asset: '/portal/assets',
  team: '/portal/teams',
  location: '/portal/locations',
  relationship: '/admin/relationships',
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const limit = 20;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams({ limit, offset: (page - 1) * limit });
      const res = await fetch(`/api/notifications?${params}`);
      if (res.ok) {
        const result = await res.json();
        setNotifications(unwrap(result, []));
        setTotal(result.total || 0);
      }
      setLoading(false);
    }
    load().catch(() => {});
  }, [page]);

  useEffect(() => {
    fetch('/api/notifications?unread=1&limit=1').then(r => r.json()).then(d => setUnreadCount(d.total || 0)).catch(() => {});
  }, [notifications]);

  async function markRead(id) {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }

  async function markAllRead() {
    await fetch('/api/notifications/read-all', { method: 'POST' });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function dismissNotification(id) {
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    setNotifications(prev => prev.filter(n => n.id !== id));
    setTotal(prev => Math.max(0, prev - 1));
    const n = notifications.find(notif => notif.id === id);
    if (n && !n.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="secondary" size="small" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className={styles.empty}>No notifications</div>
      ) : (
        <div className={styles.list}>
          {notifications.map(n => (
            <div key={n.id} className={`${styles.item} ${!n.read ? styles.unread : ''}`}>
              <div className={styles.itemLeft}>
                <div className={styles.itemTitle}>
                  {n.entityType && n.entityId ? (
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        markRead(n.id);
                        const path = ENTITY_NAV[n.entityType] || '/portal';
                        router.push(`${path}/${n.entityId}`);
                      }}
                    >
                      {n.title}
                    </a>
                  ) : (
                    <span>{n.title}</span>
                  )}
                  {!n.read && <span className={styles.dot} />}
                </div>
                <div className={styles.itemBody}>{n.body}</div>
                <div className={styles.itemMeta}>
                  {n.type && <Badge variant={TYPE_BADGE[n.type] || 'info'}>{n.type}</Badge>}
                  <span>{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {!n.read && (
                  <Button variant="ghost" size="small" onClick={() => markRead(n.id)}>
                    Mark read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => dismissNotification(n.id)}
                  style={{ padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)' }}
                  title="Dismiss notification"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
