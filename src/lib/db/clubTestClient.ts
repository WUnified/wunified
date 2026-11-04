import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../types/database';

export type QueryCall = { method: string; args: unknown[] };
export type QueryResult = { data: unknown; error: { code?: string; message: string } | null };

// Records every builder call and resolves to the queued result, so repository
// tests can assert on the exact PostgREST query without a database.
export function createFakeClient(
  results: QueryResult[],
  user: { id: string } | null = { id: '10000000-0000-0000-0000-000000000010' },
) {
  const calls: QueryCall[] = [];
  const next = () => Promise.resolve(results.shift() ?? { data: [], error: null });
  const query: Record<string, unknown> = {};

  for (const method of [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'in',
    'ilike',
    'order',
    'range',
  ]) {
    query[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return query;
    };
  }
  query.single = () => {
    calls.push({ method: 'single', args: [] });
    return next();
  };
  query.maybeSingle = () => {
    calls.push({ method: 'maybeSingle', args: [] });
    return next();
  };
  query.then = (resolve: (result: QueryResult) => unknown) => next().then(resolve);

  const client = {
    auth: { getUser: () => Promise.resolve({ data: { user }, error: null }) },
    from: (table: string) => {
      calls.push({ method: 'from', args: [table] });
      return query;
    },
  } as unknown as SupabaseClient<Database>;

  return { client, calls };
}
