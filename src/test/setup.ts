import { vi, beforeEach } from 'vitest';
import { resetSupabaseMock } from './mocks/supabaseMock';

// Configuration globale des mocks avant chaque test
beforeEach(() => {
  vi.clearAllMocks();
  resetSupabaseMock();
});
