'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import SearchBar from '@/components/ui/SearchBar';
import { PieChartCard, BarChartCard } from '@/components/ui/Charts';
import { useAuth } from '@/components/auth/AuthProvider';
import styles from './page.module.css';

export default function PortalHome() {
  const router = useRouter();
  const auth = useAuth();
  const isAdmin = auth?.user?.roles?.includes('admin');
  const [overview, setOverview] = useState(null);
  const [recent, setRecent] = useState([]);
  const [search, setSearch] = useState('');
  const [trends, setTrends] = useState(null);

  useEffect(() => {
    fetch('/api/portal/overview').then(r => { if (r.ok) return r.json(); throw new Error('auth'); }).then(setOverview).catch(() => {});
    fetch('/api/portal/recent').then(r => { if (r.ok) return r.json(); throw new Error('auth'); }).then(setRecent).catch(() => {});
    fetch('/api/portal/overview/trends').then(r => { if (r.ok) return r.json(); throw new Error('auth'); }).then(r => setTrends(r.data)).catch(() => {});
  }, []);

  function handleSearch() {
    if (search.trim()) {
      router.push(`/portal/search?q=${encodeURIComponent(search)}`);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Portal</h1>

      <div style={{ marginBottom: '1.5rem', maxWidth: 500 }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search services, apps, CIs, teams..." />
        </form>
      </div>

      {overview && (
        <div className={styles.grid}>
          <StatCard label="Services" value={overview.services} href="/portal/services" />
          <StatCard label="Applications" value={overview.applications} href="/portal/applications" />
          <StatCard label="CIs" value={overview.cis} href="/portal/cis" />
          <StatCard label="Assets" value={overview.assets} href="/portal/assets" />
          <StatCard label="Teams" value={overview.teams} href="/portal/teams" />
          <StatCard label="Locations" value={overview.locations} href="/portal/locations" />
          {isAdmin && <StatCard label="Imports" value={overview.imports} href="/portal/imports" />}
        </div>
      )}

      {trends && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          <PieChartCard title="Entity Distribution" data={trends.distribution} />
          <BarChartCard title="Monthly Activity" data={trends.monthlyActivity} dataKey="activities" xKey="month" />
        </div>
      )}

      {recent.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <Card title="Recently Updated">
          <div className={styles.recent}>
            {recent.map((item, i) => (
              <a key={i} href={`/portal/${item.type}s/${item.id}`} className={styles.recentItem}
                onClick={(e) => { e.preventDefault(); router.push(`/portal/${item.type}s/${item.id}`); }}>
                <span className={styles.badge}>{item.type}</span>
                <span>{item.name}</span>
              </a>
            ))}
          </div>
        </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, href }) {
  const router = useRouter();
  return (
    <Card
      title={label}
      actions={<span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{value}</span>}
      className={styles.statCard}
    >
      <a href={href} onClick={(e) => { e.preventDefault(); router.push(href); }}
        style={{ fontSize: '0.8125rem' }}>
        View all &rarr;
      </a>
    </Card>
  );
}
