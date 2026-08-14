import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  triggerOneClickVerification,
  updateCertificationStatus,
  recordManualResponse,
  resolveTemplateVariables
} from '../lib/certificationVerificationService';
import { mockSupabaseResponse, executedQueries } from './mocks/supabaseMock';
import {
  mockCertificationBodyEmailOnly,
  mockCertificationBodyNoChannel,
  mockProducerCertification,
  mockTemplateVariables,
  mockAdminId,
  mockCertificationId,
  mockRequestId
} from './fixtures/certificationFixtures';

describe('certificationWorkflow Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // GROUPE 1 — Workflow complet de vérification
  // =========================================================================
  describe('GROUPE 1 — Workflow complet de vérification', () => {
    it('Test 1.1 : Workflow email complet (Envoi email puis validation manuelle de retour)', async () => {
      const certEmailOnly = {
        ...mockProducerCertification,
        certification_body: mockCertificationBodyEmailOnly
      };

      // 1. Déclenchement vérification OneClick
      mockSupabaseResponse(certEmailOnly); // getProducerCertificationById
      mockSupabaseResponse({
        id: 'tpl-email',
        subject: 'Demande {{certificate_number}}',
        body: 'Bonjour, merci de confirmer {{certificate_number}}.'
      }); // get template
      mockSupabaseResponse({ id: mockRequestId }); // insert request
      mockSupabaseResponse({ status: 'unverified' }); // get status
      mockSupabaseResponse({ id: mockCertificationId, status: 'contact_sent' }); // update cert
      mockSupabaseResponse({ id: 'log-1' }); // log

      const step1 = await triggerOneClickVerification(
        mockCertificationId,
        mockAdminId,
        mockTemplateVariables
      );

      expect(step1.channel).toBe('email');
      expect(step1.success).toBe(true);
      expect(step1.status).toBe('contact_sent');

      // 2. Réception de la réponse par retour email et validation par l'auditeur
      mockSupabaseResponse({ id: mockRequestId, status: 'success' }); // update request
      mockSupabaseResponse({ id: mockCertificationId, status: 'verified' }); // update cert
      mockSupabaseResponse({ id: 'log-2' }); // log

      const step2 = await recordManualResponse(
        mockCertificationId,
        mockRequestId,
        'Réponse de Fairtrade Africa : Producteur en règle jusqu au 31/12/2026',
        'verified',
        mockAdminId
      );

      expect(step2.success).toBe(true);

      // Vérification de la création des 2 entrées de logs
      const logQueries = executedQueries.filter(
        (q) => q.table === 'certification_verification_logs' && q.method === 'insert'
      );
      expect(logQueries.length).toBeGreaterThanOrEqual(2);
    });

    it('Test 1.2 : Workflow API complet (Validation directe instantanée et log audit)', async () => {
      mockSupabaseResponse(mockProducerCertification);
      mockSupabaseResponse({ id: mockRequestId });
      mockSupabaseResponse({ status: 'unverified' });
      mockSupabaseResponse({ id: mockCertificationId, status: 'verified' });
      mockSupabaseResponse({ id: 'log-1' });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('{"status": "ACTIVE", "producer": "Coop Sambava"}')
      });

      const res = await triggerOneClickVerification(
        mockCertificationId,
        mockAdminId,
        mockTemplateVariables
      );

      expect(res.channel).toBe('api');
      expect(res.success).toBe(true);
      expect(res.status).toBe('verified');

      const logQuery = executedQueries.find(
        (q) =>
          q.table === 'certification_verification_logs' &&
          (q.args[0] as Record<string, unknown>).action === 'API_VERIFY_SUCCESS'
      );
      expect(logQuery).toBeDefined();
    });

    it('Test 1.3 : Workflow avec changement manuel de statut successif', async () => {
      // 1. Rejet initial
      mockSupabaseResponse({ status: 'unverified' });
      mockSupabaseResponse({ id: mockCertificationId, status: 'rejected' });
      mockSupabaseResponse({ id: 'log-1' });

      const res1 = await updateCertificationStatus(
        mockCertificationId,
        'rejected',
        mockAdminId,
        'Pièce jointe illisible'
      );
      expect(res1.success).toBe(true);

      // 2. Re-passage en pending après soumission nouvelle pièce
      mockSupabaseResponse({ status: 'rejected' });
      mockSupabaseResponse({ id: mockCertificationId, status: 'pending' });
      mockSupabaseResponse({ id: 'log-2' });

      const res2 = await updateCertificationStatus(
        mockCertificationId,
        'pending',
        mockAdminId,
        'Nouveau document reçu du producteur'
      );
      expect(res2.success).toBe(true);

      const logs = executedQueries.filter(
        (q) => q.table === 'certification_verification_logs' && q.method === 'insert'
      );
      expect(logs.length).toBeGreaterThanOrEqual(2);
    });

    it('Test 1.4 : Workflow cascade complète (Fallback manuel si aucun canal)', async () => {
      const certNoChannel = {
        ...mockProducerCertification,
        certification_body: mockCertificationBodyNoChannel
      };

      mockSupabaseResponse(certNoChannel);
      mockSupabaseResponse({ status: 'unverified' });
      mockSupabaseResponse({ id: mockCertificationId, status: 'manual_required' });
      mockSupabaseResponse({ id: 'log-1' });

      const res = await triggerOneClickVerification(
        mockCertificationId,
        mockAdminId,
        mockTemplateVariables
      );

      expect(res.channel).toBe('manual');
      expect(res.status).toBe('manual_required');

      const logQuery = executedQueries.find(
        (q) =>
          q.table === 'certification_verification_logs' &&
          (q.args[0] as Record<string, unknown>).action === 'MANUAL_REQUIRED_FALLBACK'
      );
      expect(logQuery).toBeDefined();
    });
  });

  // =========================================================================
  // GROUPE 2 — Tests de non-régression
  // =========================================================================
  describe('GROUPE 2 — Tests de non-régression', () => {
    it('Test 2.1 : resolveTemplateVariables ne modifie pas le template original (immuabilité)', () => {
      const original = 'Hello {{producer_name}}';
      const copy = original;
      const res = resolveTemplateVariables(original, { producer_name: 'Alpha' });

      expect(res).toBe('Hello Alpha');
      expect(original).toBe(copy);
    });

    it('Test 2.2 : logVerificationAction ne fait jamais planter le flux principal même si Supabase crash', async () => {
      const certEmailOnly = {
        ...mockProducerCertification,
        certification_body: mockCertificationBodyEmailOnly
      };

      mockSupabaseResponse(certEmailOnly);
      mockSupabaseResponse(null); // No template
      mockSupabaseResponse({ id: mockRequestId });
      mockSupabaseResponse({ status: 'unverified' });
      mockSupabaseResponse({ id: mockCertificationId, status: 'contact_sent' });
      // Erreur simulée sur l'écriture du log d'audit
      mockSupabaseResponse(null, 'Database log table locked / Error');

      const result = await triggerOneClickVerification(
        mockCertificationId,
        mockAdminId,
        mockTemplateVariables
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe('contact_sent');
    });

    it('Test 2.3 : Timeout API absorbé proprement sans crash', async () => {
      mockSupabaseResponse(mockProducerCertification);
      mockSupabaseResponse({ id: mockRequestId });
      mockSupabaseResponse({ status: 'unverified' });
      mockSupabaseResponse({ id: mockCertificationId, status: 'contact_sent' });
      mockSupabaseResponse({ id: 'log-1' });

      global.fetch = vi.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AbortError: The operation was aborted')), 50);
        });
      });

      const result = await triggerOneClickVerification(
        mockCertificationId,
        mockAdminId,
        mockTemplateVariables
      );

      expect(result.success).toBe(false);
      expect(result.channel).toBe('api');
      expect(result.status).toBe('contact_sent');
    });
  });
});
