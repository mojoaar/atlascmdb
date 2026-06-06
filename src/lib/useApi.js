import { useState, useEffect, useCallback } from 'react';
import { unwrap } from '@/lib/unwrap';

export function useApi(apiPath, initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!!apiPath);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!apiPath) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiPath);
      if (res.ok) {
        const result = await res.json();
        setData(unwrap(result));
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || 'Failed to fetch data');
      }
    } catch (e) {
      setError(e.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, setData, loading, error, refresh: load };
}
