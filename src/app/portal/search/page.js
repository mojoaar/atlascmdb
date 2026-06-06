'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import SearchBar from '@/components/ui/SearchBar';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q') || '';
  const [search, setSearch] = useState(q);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (q) {
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(r => setResults(r.data?.results || r.results || []))
        .catch(() => setResults([]));
    }
  }, [q]);

  function handleSearch() {
    if (search.trim()) {
      router.push(`/portal/search?q=${encodeURIComponent(search)}`);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Search</h1>
      <div style={{ marginBottom: '1.5rem', maxWidth: 500 }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search across all entities..." />
        </form>
      </div>
      {q && (
        <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
          {results.length} results for &quot;{q}&quot;
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {results.map((r, i) => (
          <Card key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--muted-foreground)', background: 'var(--muted)', padding: '0.125rem 0.375rem', borderRadius: 'var(--radius)' }}>{r.type}</span>
              <a href={`/portal/${r.type}s/${r.id}`} onClick={(e) => { e.preventDefault(); router.push(`/portal/${r.type}s/${r.id}`); }}>
                {r.name}
              </a>
            </div>
            {r.description && <div style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>{r.description}</div>}
          </Card>
        ))}
        {q && results.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>No results found</div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return <Suspense><SearchContent /></Suspense>;
}
