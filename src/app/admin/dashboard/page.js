'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import { PieChartCard, BarChartCard } from '@/components/ui/Charts';
import { useAuth } from '@/components/auth/AuthProvider';
import styles from '../page.module.css';

export default function AdminDashboard() {
  const router = useRouter();
  const auth = useAuth();
  const isAdmin = auth?.user?.roles?.includes('admin');
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState(null);

  useEffect(() => {
    fetch('/api/portal/overview').then(r => { if (r.ok) return r.json(); throw new Error('auth'); }).then(setOverview).catch(() => {});
    fetch('/api/portal/overview/trends').then(r => { if (r.ok) return r.json(); throw new Error('auth'); }).then(r => setTrends(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Admin Dashboard</h1>

      {overview && (
        <div className={styles.grid}>
          <StatCard label="Services" value={overview.services} href="/admin/services" router={router} />
          <StatCard label="Applications" value={overview.applications} href="/admin/applications" router={router} />
          <StatCard label="CIs" value={overview.cis} href="/admin/cis" router={router} />
          <StatCard label="Assets" value={overview.assets || 0} href="/admin/assets" router={router} />
          <StatCard label="Teams" value={overview.teams} href="/admin/teams" router={router} />
          <StatCard label="Locations" value={overview.locations} href="/admin/locations" router={router} />
          {isAdmin && <StatCard label="Imports" value={overview.imports} href="/admin/imports" router={router} />}
          {isAdmin && <StatCard label="Users" value={overview.users || 0} href="/admin/users" router={router} />}
          {isAdmin && <StatCard label="Roles" value={overview.roles || 0} href="/admin/roles" router={router} />}
        </div>
      )}

      {trends && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
            <PieChartCard title="Entity Distribution" data={trends.distribution} />
            <BarChartCard title="Monthly Activity" data={trends.monthlyActivity} dataKey="activities" xKey="month" />
          </div>
          {trends.serviceTypeBreakdown && (
            <div style={{ marginTop: '1rem' }}>
              <PieChartCard title="Services by Type" data={trends.serviceTypeBreakdown} />
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <QuickLink label="Relationships" href="/admin/relationships" router={router} />
        {isAdmin && <QuickLink label="Audit Events" href="/admin/audit" router={router} />}
        {isAdmin && <QuickLink label="Themes" href="/admin/themes" router={router} />}
        {isAdmin && <QuickLink label="Settings" href="/admin/settings" router={router} />}
      </div>
    </div>
  );
}

function StatCard({ label, value, href, router }) {
  return (
    <Card
      title={label}
      actions={<span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{value}</span>}
      className={styles.statCard}
    >
      <a href={href} onClick={(e) => { e.preventDefault(); router.push(href); }}
        style={{ fontSize: '0.8125rem' }}>
        Manage &rarr;
      </a>
    </Card>
  );
}

function QuickLink({ label, href, router }) {
  return (
    <a
      href={href}
      onClick={(e) => { e.preventDefault(); router.push(href); }}
      style={{
        padding: '0.5rem 1rem',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        fontSize: '0.8125rem',
        textDecoration: 'none',
        color: 'var(--foreground)',
        background: 'var(--background)',
      }}
    >
      {label} &rarr;
    </a>
  );
}
