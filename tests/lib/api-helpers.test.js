import { describe, it, expect } from 'vitest';
import { success, created, notFound, badRequest } from '@/lib/api-helpers';

describe('success', () => {
  it('returns 200 with JSON body', async () => {
    const res = success({ data: [1, 2, 3], total: 3 });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data).toEqual([1, 2, 3]);
    expect(body.total).toBe(3);
  });

  it('wraps non-object in data', async () => {
    const res = success([1, 2, 3]);
    const body = await res.json();
    expect(body).toEqual([1, 2, 3]);
  });
});

describe('created', () => {
  it('returns 201 with the body', async () => {
    const res = created({ id: 'abc', name: 'Test' });
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.id).toBe('abc');
    expect(body.name).toBe('Test');
  });
});

describe('notFound', () => {
  it('returns 404 with entity name', async () => {
    const res = notFound('Service');
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error).toBe('Service not found');
  });
});

describe('badRequest', () => {
  it('returns 400 with message', async () => {
    const res = badRequest('Name is required');
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe('Name is required');
  });
});
