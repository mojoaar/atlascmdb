'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import styles from './Charts.module.css';

const COLORS = ['#003d7a', '#c8102e', '#2e7d32', '#ed6c02', '#4d8cc7', '#e0556b', '#7b6faf'];

export function PieChartCard({ title, data }) {
  if (!data?.length) return null;
  return (
    <div className={styles.chartCard}>
      <div className={styles.chartTitle}>{title}</div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
            {data.map((_, i) => <Cell key={i} fill={_.color || COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarChartCard({ title, data, dataKey, xKey }) {
  if (!data?.length) return null;
  return (
    <div className={styles.chartCard}>
      <div className={styles.chartTitle}>{title}</div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey={xKey} stroke="var(--muted-foreground)" fontSize={12} />
          <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey={dataKey} fill="var(--primary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
