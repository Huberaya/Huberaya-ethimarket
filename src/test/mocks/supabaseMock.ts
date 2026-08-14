import { vi } from 'vitest';

export interface MockResponseConfig<T = unknown> {
  data: T | null;
  error: { message: string; code?: string; details?: string } | null;
  count?: number | null;
}

let responseQueue: MockResponseConfig<unknown>[] = [];
let defaultResponse: MockResponseConfig<unknown> = { data: null, error: null, count: 0 };
export const executedQueries: Array<{ table: string; method: string; args: unknown[] }> = [];

/**
 * Configure la prochaine réponse que le client Supabase retournera
 */
export function mockSupabaseResponse<T>(
  data: T | null,
  error: string | { message: string; code?: string; details?: string } | null = null,
  count?: number
): void {
  const formattedError = typeof error === 'string' ? { message: error, code: 'ERROR' } : error;
  responseQueue.push({
    data,
    error: formattedError,
    count: count !== undefined ? count : (Array.isArray(data) ? data.length : data ? 1 : 0)
  });
}

/**
 * Réinitialise la file d'attente et l'historique des requêtes
 */
export function resetSupabaseMock(): void {
  responseQueue = [];
  defaultResponse = { data: null, error: null, count: 0 };
  executedQueries.length = 0;
}

function getNextResponse() {
  if (responseQueue.length > 0) {
    return responseQueue.shift()!;
  }
  return defaultResponse;
}

/**
 * Constructeur de requête Supabase chaînable simulé
 */
export function createMockQueryBuilder(tableName: string) {
  const queryState: {
    table: string;
    filters: Record<string, unknown>;
    selectedColumns?: string;
    isSingle?: boolean;
    isMaybeSingle?: boolean;
    isDelete?: boolean;
    isInsert?: boolean;
    isUpdate?: boolean;
    insertPayload?: unknown;
    updatePayload?: unknown;
    hasCount?: boolean;
  } = {
    table: tableName,
    filters: {}
  };

  const builder: Record<string, unknown> = {
    select: vi.fn((columns?: string, options?: { count?: 'exact' }) => {
      queryState.selectedColumns = columns;
      if (options?.count) queryState.hasCount = true;
      executedQueries.push({ table: tableName, method: 'select', args: [columns, options] });
      return builder;
    }),
    insert: vi.fn((payload: unknown) => {
      queryState.isInsert = true;
      queryState.insertPayload = payload;
      executedQueries.push({ table: tableName, method: 'insert', args: [payload] });
      return builder;
    }),
    update: vi.fn((payload: unknown) => {
      queryState.isUpdate = true;
      queryState.updatePayload = payload;
      executedQueries.push({ table: tableName, method: 'update', args: [payload] });
      return builder;
    }),
    delete: vi.fn(() => {
      queryState.isDelete = true;
      executedQueries.push({ table: tableName, method: 'delete', args: [] });
      return builder;
    }),
    upsert: vi.fn((payload: unknown) => {
      executedQueries.push({ table: tableName, method: 'upsert', args: [payload] });
      return builder;
    }),
    eq: vi.fn((col: string, val: unknown) => {
      queryState.filters[col] = val;
      executedQueries.push({ table: tableName, method: 'eq', args: [col, val] });
      return builder;
    }),
    neq: vi.fn((col: string, val: unknown) => {
      executedQueries.push({ table: tableName, method: 'neq', args: [col, val] });
      return builder;
    }),
    gt: vi.fn((col: string, val: unknown) => {
      executedQueries.push({ table: tableName, method: 'gt', args: [col, val] });
      return builder;
    }),
    gte: vi.fn((col: string, val: unknown) => {
      executedQueries.push({ table: tableName, method: 'gte', args: [col, val] });
      return builder;
    }),
    lt: vi.fn((col: string, val: unknown) => {
      executedQueries.push({ table: tableName, method: 'lt', args: [col, val] });
      return builder;
    }),
    lte: vi.fn((col: string, val: unknown) => {
      executedQueries.push({ table: tableName, method: 'lte', args: [col, val] });
      return builder;
    }),
    is: vi.fn((col: string, val: unknown) => {
      executedQueries.push({ table: tableName, method: 'is', args: [col, val] });
      return builder;
    }),
    not: vi.fn((col: string, operator: string, val: unknown) => {
      executedQueries.push({ table: tableName, method: 'not', args: [col, operator, val] });
      return builder;
    }),
    or: vi.fn((conditions: string) => {
      executedQueries.push({ table: tableName, method: 'or', args: [conditions] });
      return builder;
    }),
    order: vi.fn((col: string, options?: { ascending?: boolean }) => {
      executedQueries.push({ table: tableName, method: 'order', args: [col, options] });
      return builder;
    }),
    range: vi.fn((from: number, to: number) => {
      executedQueries.push({ table: tableName, method: 'range', args: [from, to] });
      return builder;
    }),
    limit: vi.fn((limitNum: number) => {
      executedQueries.push({ table: tableName, method: 'limit', args: [limitNum] });
      return builder;
    }),
    single: vi.fn(() => {
      queryState.isSingle = true;
      executedQueries.push({ table: tableName, method: 'single', args: [] });
      const resp = getNextResponse();
      const singleData = Array.isArray(resp.data) ? (resp.data[0] ?? null) : resp.data;
      return Promise.resolve({
        data: singleData,
        error: resp.error,
        count: resp.count
      });
    }),
    maybeSingle: vi.fn(() => {
      queryState.isMaybeSingle = true;
      executedQueries.push({ table: tableName, method: 'maybeSingle', args: [] });
      const resp = getNextResponse();
      const singleData = Array.isArray(resp.data) ? (resp.data[0] ?? null) : resp.data;
      return Promise.resolve({
        data: singleData,
        error: resp.error,
        count: resp.count
      });
    }),
    then: <TResult1 = { data: unknown; error: unknown; count: number | null }, TResult2 = never>(
      resolve?: ((value: { data: unknown; error: unknown; count: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
      reject?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ) => {
      const resp = getNextResponse();
      return Promise.resolve({
        data: resp.data,
        error: resp.error,
        count: resp.count
      }).then(resolve, reject);
    }
  };

  return builder;
}

export const mockSupabaseClient = {
  from: vi.fn((tableName: string) => createMockQueryBuilder(tableName)),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-uuid-123' } }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null })
  }
};

// Injection du mock global dans le module supabase
vi.mock('../supabase', () => {
  return {
    supabase: mockSupabaseClient,
    DAYS_BEFORE_EXPIRY_ALERT: 30
  };
});
vi.mock('../../lib/supabase', () => {
  return {
    supabase: mockSupabaseClient,
    DAYS_BEFORE_EXPIRY_ALERT: 30
  };
});
