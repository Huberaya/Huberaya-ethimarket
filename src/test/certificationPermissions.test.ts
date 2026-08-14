import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updateCertificationStatus,
  triggerOneClickVerification
} from '../lib/certificationVerificationService';
import {
  createCertificationBody
} from '../lib/certificationBodiesService';
import { mockSupabaseResponse, executedQueries } from './mocks/supabaseMock';
import {
  mockCertificationId,
  mockAdminId,
  mockTemplateVariables
} from './fixtures/certificationFixtures';

describe('certificationPermissions & RLS Security', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Test 1 : Non-admin ne peut pas updateCertificationStatus (rejet RLS 403)', async () => {
    mockSupabaseResponse({ status: 'unverified' });
    mockSupabaseResponse(null, 'new row violates row-level security policy for table "producer_certifications"');

    const result = await updateCertificationStatus(
      mockCertificationId,
      'verified',
      'non-admin-user-id'
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('row-level security');
  });

  it('Test 2 : Non-admin ne peut pas createCertificationBody (rejet RLS)', async () => {
    mockSupabaseResponse(null, 'permission denied for table certification_bodies');

    const result = await createCertificationBody({
      name: 'Hacked Body',
      country: 'France',
      region: 'Europe'
    });

    expect(result.data).toBeNull();
    expect(result.error).toContain('permission denied');
  });

  it('Test 3 : Non-admin ne peut pas triggerOneClickVerification', async () => {
    // Si la récupération de la certification échoue par RLS
    mockSupabaseResponse(null, 'permission denied: only admins can view verification requests');

    const result = await triggerOneClickVerification(
      mockCertificationId,
      'non-admin-user-id',
      mockTemplateVariables
    );

    expect(result.success).toBe(false);
    expect(result.error).not.toBeNull();
  });

  it('Test 4 : Log immuable : le service ne tente jamais un UPDATE sur certification_verification_logs', async () => {
    mockSupabaseResponse({ status: 'unverified' });
    mockSupabaseResponse({ id: mockCertificationId, status: 'verified' });
    mockSupabaseResponse({ id: 'log-1' });

    await updateCertificationStatus(
      mockCertificationId,
      'verified',
      mockAdminId,
      'Validation normale'
    );

    // Vérification stricte : aucun update ni delete sur les logs
    const updateLogs = executedQueries.filter(
      (q) => q.table === 'certification_verification_logs' && (q.method === 'update' || q.method === 'delete')
    );
    expect(updateLogs).toHaveLength(0);
  });
});
