import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resolveTemplateVariables,
  triggerOneClickVerification,
  updateCertificationStatus,
  getCertificationDashboardStats,
  recordManualResponse
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

describe('certificationVerificationService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // GROUPE 1 — resolveTemplateVariables
  // =========================================================================
  describe('GROUPE 1 — resolveTemplateVariables', () => {
    it('Test 1.1 : Remplacement basique des variables', () => {
      const template = 'Bonjour {{producer_name}}';
      const result = resolveTemplateVariables(template, { producer_name: 'Jean Dupont' });
      expect(result).toBe('Bonjour Jean Dupont');
    });

    it('Test 1.2 : Variable manquante remplacée par chaîne vide', () => {
      const template = 'Cert: {{certificate_number}}';
      const result = resolveTemplateVariables(template, {});
      expect(result).toBe('Cert: ');
    });

    it('Test 1.3 : Plusieurs variables dans le même texte', () => {
      const template = 'Cert {{certificate_number}} de {{producer_name}} par {{certification_body_name}} valide jusqu au {{expires_at}} sur {{platform_name}}. Contact: {{admin_name}} ({{admin_email}}).';
      const result = resolveTemplateVariables(template, mockTemplateVariables);
      expect(result).toBe(
        'Cert ECO-2026-88912 de Jean Dupont par Ecocert International valide jusqu au 2027-01-15 sur EthiMarket. Contact: Sophie Auditeur (sophie.audit@ethimarket.com).'
      );
    });

    it('Test 1.4 : Variable avec espaces dans les accolades', () => {
      const template = 'Bonjour {{ producer_name }}';
      const result = resolveTemplateVariables(template, { producer_name: 'Jean Dupont' });
      expect(result).toBe('Bonjour Jean Dupont');
    });

    it('Test 1.5 : Texte sans variable', () => {
      const template = 'Texte sans variable';
      const result = resolveTemplateVariables(template, mockTemplateVariables);
      expect(result).toBe('Texte sans variable');
    });

    it('Test 1.6 : Template vide ou null', () => {
      expect(resolveTemplateVariables('', mockTemplateVariables)).toBe('');
      expect(resolveTemplateVariables(null as unknown as string, mockTemplateVariables)).toBe('');
    });
  });

  // =========================================================================
  // GROUPE 2 — triggerOneClickVerification (cascade des canaux directs)
  // =========================================================================
  describe('GROUPE 2 — triggerOneClickVerification', () => {
    it('Test 2.1 : Canal Email sélectionné en priorité sans API externe', async () => {
      // 1. getProducerCertificationById return
      mockSupabaseResponse(mockProducerCertification);
      // 2. profiles lookup for admin
      mockSupabaseResponse({ first_name: 'Sophie', last_name: 'Audit', email: 'sophie@ethimarket.com' });
      // 3. query default template
      mockSupabaseResponse({
        id: 'template-default-email',
        subject: 'Demande de vérification — {{producer_name}}',
        body: 'Vérification du certificat {{certificate_number}}'
      });
      // 4. insert request return
      mockSupabaseResponse({ id: mockRequestId });
      // 5. updateCertificationStatus internal (get current status)
      mockSupabaseResponse({ status: 'unverified' });
      // 6. updateCertificationStatus update
      mockSupabaseResponse({ id: mockCertificationId, status: 'contact_sent' });
      // 7. logVerificationAction insert
      mockSupabaseResponse({ id: 'log-1' });

      const result = await triggerOneClickVerification(
        mockCertificationId,
        mockAdminId
      );

      expect(result.channel).toBe('email');
      expect(result.success).toBe(true);
      expect(result.status).toBe('contact_sent');
      expect(result.request_id).toBe(mockRequestId);
    });

    it('Test 2.2 : Notification admin lors de l envoi email', async () => {
      mockSupabaseResponse(mockProducerCertification);
      mockSupabaseResponse({ first_name: 'Sophie', last_name: 'Audit', email: 'sophie@ethimarket.com' });
      mockSupabaseResponse({
        id: 'template-default-email',
        subject: 'Demande de vérification — {{producer_name}}',
        body: 'Vérification du certificat {{certificate_number}}'
      });
      mockSupabaseResponse({ id: mockRequestId });
      mockSupabaseResponse({ status: 'unverified' });
      mockSupabaseResponse({ id: mockCertificationId, status: 'contact_sent' });
      mockSupabaseResponse({ id: 'log-1' });

      const result = await triggerOneClickVerification(
        mockCertificationId,
        mockAdminId
      );

      expect(result.channel).toBe('email');
      expect(result.success).toBe(true);
      expect(result.status).toBe('contact_sent');
    });

    it('Test 2.3 : Canal email si pas d API', async () => {
      const certEmailOnly = {
        ...mockProducerCertification,
        certification_body: mockCertificationBodyEmailOnly
      };

      // 1. getProducerCertificationById
      mockSupabaseResponse(certEmailOnly);
      // 2. profiles lookup
      mockSupabaseResponse({ first_name: 'Sophie', last_name: 'Audit', email: 'sophie@ethimarket.com' });
      // 3. query default template
      mockSupabaseResponse({
        id: 'template-default-email',
        subject: 'Demande de vérification — {{producer_name}}',
        body: 'Vérification du certificat {{certificate_number}}'
      });
      // 4. insert request
      mockSupabaseResponse({ id: mockRequestId });
      // 5. updateCertificationStatus (get current)
      mockSupabaseResponse({ status: 'unverified' });
      // 6. updateCertificationStatus (update cert)
      mockSupabaseResponse({ id: mockCertificationId, status: 'contact_sent' });
      // 7. log
      mockSupabaseResponse({ id: 'log-1' });

      const result = await triggerOneClickVerification(
        mockCertificationId,
        mockAdminId
      );

      expect(result.channel).toBe('email');
      expect(result.success).toBe(true);
      expect(result.status).toBe('contact_sent');
      expect(result.message).toContain(mockCertificationBodyEmailOnly.email_contact!);
    });

    it('Test 2.4 : Canal formulaire si pas d email', async () => {
      const certFormOnly = {
        ...mockProducerCertification,
        certification_body: {
          ...mockCertificationBodyNoChannel,
          contact_form_url: 'https://portal.cert.org/verify'
        }
      };

      mockSupabaseResponse(certFormOnly);
      mockSupabaseResponse({ first_name: 'Sophie', last_name: 'Audit', email: 'sophie@ethimarket.com' });
      mockSupabaseResponse({ id: mockRequestId });
      mockSupabaseResponse({ status: 'unverified' });
      mockSupabaseResponse({ id: mockCertificationId, status: 'contact_sent' });
      mockSupabaseResponse({ id: 'log-1' });

      const result = await triggerOneClickVerification(
        mockCertificationId,
        mockAdminId
      );

      expect(result.channel).toBe('form');
      expect(result.status).toBe('contact_sent');
      expect(result.external_url).toBe('https://portal.cert.org/verify');
    });

    it('Test 2.5 : Canal WhatsApp si pas de formulaire', async () => {
      const certWhatsappOnly = {
        ...mockProducerCertification,
        certification_body: {
          ...mockCertificationBodyNoChannel,
          whatsapp: '+33612345678'
        }
      };

      mockSupabaseResponse(certWhatsappOnly);
      mockSupabaseResponse({ first_name: 'Sophie', last_name: 'Audit', email: 'sophie@ethimarket.com' });
      mockSupabaseResponse({ id: mockRequestId });
      mockSupabaseResponse({ status: 'unverified' });
      mockSupabaseResponse({ id: mockCertificationId, status: 'contact_sent' });
      mockSupabaseResponse({ id: 'log-1' });

      const result = await triggerOneClickVerification(
        mockCertificationId,
        mockAdminId
      );

      expect(result.channel).toBe('whatsapp');
      expect(result.status).toBe('contact_sent');
      expect(result.external_url).toContain('wa.me');
      expect(result.external_url).toContain('33612345678');
    });

    it('Test 2.6 : Canal téléphone si pas de WhatsApp', async () => {
      const certPhoneOnly = {
        ...mockProducerCertification,
        certification_body: {
          ...mockCertificationBodyNoChannel,
          phone: '+33123456789'
        }
      };

      mockSupabaseResponse(certPhoneOnly);
      mockSupabaseResponse({ first_name: 'Sophie', last_name: 'Audit', email: 'sophie@ethimarket.com' });
      mockSupabaseResponse({ id: mockRequestId });
      mockSupabaseResponse({ status: 'unverified' });
      mockSupabaseResponse({ id: mockCertificationId, status: 'pending' });
      mockSupabaseResponse({ id: 'log-1' });

      const result = await triggerOneClickVerification(
        mockCertificationId,
        mockAdminId
      );

      expect(result.channel).toBe('phone');
      expect(result.status).toBe('pending');
      expect(result.message).toContain('+33123456789');
    });

    it('Test 2.7 : Fallback manuel si aucun canal', async () => {
      const certNoChannel = {
        ...mockProducerCertification,
        certification_body: mockCertificationBodyNoChannel
      };

      mockSupabaseResponse(certNoChannel);
      mockSupabaseResponse({ first_name: 'Sophie', last_name: 'Audit', email: 'sophie@ethimarket.com' });
      mockSupabaseResponse({ status: 'unverified' });
      mockSupabaseResponse({ id: mockCertificationId, status: 'manual_required' });
      mockSupabaseResponse({ id: 'log-1' });

      const result = await triggerOneClickVerification(
        mockCertificationId,
        mockAdminId
      );

      expect(result.channel).toBe('manual');
      expect(result.success).toBe(false);
      expect(result.status).toBe('manual_required');
    });

    it('Test 2.8 : Certification sans organisme lié', async () => {
      const certNoBody = {
        ...mockProducerCertification,
        certification_body: null
      };

      mockSupabaseResponse(certNoBody);
      mockSupabaseResponse({ first_name: 'Sophie', last_name: 'Audit', email: 'sophie@ethimarket.com' });
      mockSupabaseResponse({ status: 'unverified' });
      mockSupabaseResponse({ id: mockCertificationId, status: 'manual_required' });
      mockSupabaseResponse({ id: 'log-1' });

      const result = await triggerOneClickVerification(
        mockCertificationId,
        mockAdminId
      );

      expect(result.channel).toBe('manual');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Aucun organisme');
    });

    it('Test 2.9 : Certification introuvable', async () => {
      mockSupabaseResponse(null, 'Certification not found');

      const result = await triggerOneClickVerification(
        'unknown-id',
        mockAdminId,
        mockTemplateVariables
      );

      expect(result.success).toBe(false);
      expect(result.error).not.toBeNull();
    });
  });

  // =========================================================================
  // GROUPE 3 — updateCertificationStatus
  // =========================================================================
  describe('GROUPE 3 — updateCertificationStatus', () => {
    it('Test 3.1 : Mise à jour vers verified', async () => {
      mockSupabaseResponse({ status: 'unverified' });
      mockSupabaseResponse({ id: mockCertificationId, status: 'verified' });
      mockSupabaseResponse({ id: 'log-1' });

      const res = await updateCertificationStatus(
        mockCertificationId,
        'verified',
        mockAdminId,
        'Certificat officiel confirmé'
      );

      expect(res.success).toBe(true);
      expect(res.error).toBeNull();

      const updateQuery = executedQueries.find(
        (q) => q.table === 'producer_certifications' && q.method === 'update'
      );
      expect(updateQuery).toBeDefined();
      const payload = updateQuery?.args[0] as Record<string, unknown>;
      expect(payload.status).toBe('verified');
      expect(payload.verified_by).toBe(mockAdminId);
      expect(payload.verified_at).not.toBeNull();
    });

    it('Test 3.2 : Mise à jour vers rejected', async () => {
      mockSupabaseResponse({ status: 'unverified' });
      mockSupabaseResponse({ id: mockCertificationId, status: 'rejected' });
      mockSupabaseResponse({ id: 'log-1' });

      const res = await updateCertificationStatus(
        mockCertificationId,
        'rejected',
        mockAdminId,
        'Certificat non reconnu'
      );

      expect(res.success).toBe(true);

      const updateQuery = executedQueries.find(
        (q) => q.table === 'producer_certifications' && q.method === 'update'
      );
      const payload = updateQuery?.args[0] as Record<string, unknown>;
      expect(payload.status).toBe('rejected');
      expect(payload.verified_by).toBeNull();
      expect(payload.verified_at).toBeNull();
    });

    it('Test 3.3 : Log d audit créé après mise à jour', async () => {
      mockSupabaseResponse({ status: 'unverified' });
      mockSupabaseResponse({ id: mockCertificationId, status: 'pending' });
      mockSupabaseResponse({ id: 'log-1' });

      await updateCertificationStatus(mockCertificationId, 'pending', mockAdminId, 'En attente');

      const logQuery = executedQueries.find(
        (q) => q.table === 'certification_verification_logs' && q.method === 'insert'
      );
      expect(logQuery).toBeDefined();
      const logPayload = logQuery?.args[0] as Record<string, unknown>;
      expect(logPayload.producer_certification_id).toBe(mockCertificationId);
      expect(logPayload.action).toBe('STATUS_UPDATED');
      expect(logPayload.new_status).toBe('pending');
    });

    it('Test 3.4 : Erreur Supabase propagée correctement', async () => {
      mockSupabaseResponse({ status: 'unverified' });
      mockSupabaseResponse(null, 'Erreur de mise à jour RLS');

      const res = await updateCertificationStatus(
        mockCertificationId,
        'verified',
        mockAdminId
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('Erreur de mise à jour RLS');
    });
  });

  // =========================================================================
  // GROUPE 4 — getCertificationDashboardStats
  // =========================================================================
  describe('GROUPE 4 — getCertificationDashboardStats', () => {
    it('Test 4.1 : Calcul correct des totaux par statut', async () => {
      const mockCertRows = [
        { id: '1', status: 'unverified', expires_at: '2027-01-01', certification_body: { region: 'Africa' } },
        { id: '2', status: 'unverified', expires_at: '2027-01-01', certification_body: { region: 'Africa' } },
        { id: '3', status: 'pending', expires_at: '2027-01-01', certification_body: { region: 'Europe' } },
        { id: '4', status: 'contact_sent', expires_at: '2027-01-01', certification_body: { region: 'Europe' } },
        { id: '5', status: 'contact_sent', expires_at: '2027-01-01', certification_body: { region: 'Asia' } },
        { id: '6', status: 'verified', expires_at: '2027-01-01', certification_body: { region: 'Latin America' } },
        { id: '7', status: 'verified', expires_at: '2027-01-01', certification_body: { region: 'Latin America' } },
        { id: '8', status: 'verified', expires_at: '2027-01-01', certification_body: { region: 'Africa' } },
        { id: '9', status: 'verified', expires_at: '2027-01-01', certification_body: { region: 'Asia' } },
        { id: '10', status: 'rejected', expires_at: '2027-01-01', certification_body: { region: 'Africa' } }
      ];

      mockSupabaseResponse(mockCertRows);

      const res = await getCertificationDashboardStats();
      expect(res.data).not.toBeNull();
      expect(res.data?.total).toBe(10);
      expect(res.data?.unverified).toBe(2);
      expect(res.data?.pending).toBe(1);
      expect(res.data?.contact_sent).toBe(2);
      expect(res.data?.verified).toBe(4);
      expect(res.data?.rejected).toBe(1);
    });

    it('Test 4.2 : Calcul correct de expiring_soon', async () => {
      const in10Days = new Date();
      in10Days.setDate(in10Days.getDate() + 10);

      const mockCertRows = [
        { id: '1', status: 'verified', expires_at: in10Days.toISOString().split('T')[0], certification_body: { region: 'Europe' } },
        { id: '2', status: 'verified', expires_at: '2028-01-01', certification_body: { region: 'Europe' } }
      ];

      mockSupabaseResponse(mockCertRows);

      const res = await getCertificationDashboardStats();
      expect(res.data?.expiring_soon).toBe(1);
    });

    it('Test 4.3 : Certification expirée non comptée dans expiring_soon', async () => {
      const mockCertRows = [
        { id: '1', status: 'expired', expires_at: '2025-01-01', certification_body: { region: 'Europe' } }
      ];

      mockSupabaseResponse(mockCertRows);

      const res = await getCertificationDashboardStats();
      expect(res.data?.expiring_soon).toBe(0);
      expect(res.data?.expired).toBe(1);
    });

    it('Test 4.4 : Répartition par région correcte', async () => {
      const mockCertRows = [
        { id: '1', status: 'verified', expires_at: '2027-01-01', certification_body: { region: 'Africa' } },
        { id: '2', status: 'verified', expires_at: '2027-01-01', certification_body: { region: 'Africa' } },
        { id: '3', status: 'verified', expires_at: '2027-01-01', certification_body: { region: 'Asia' } },
        { id: '4', status: 'verified', expires_at: '2027-01-01', certification_body: { region: 'Latin America' } }
      ];

      mockSupabaseResponse(mockCertRows);

      const res = await getCertificationDashboardStats();
      expect(res.data?.by_region.Africa).toBe(2);
      expect(res.data?.by_region.Asia).toBe(1);
      expect(res.data?.by_region['Latin America']).toBe(1);
      expect(res.data?.by_region.Europe).toBe(0);
    });
  });

  // =========================================================================
  // GROUPE 5 — recordManualResponse
  // =========================================================================
  describe('GROUPE 5 — recordManualResponse', () => {
    it('Test 5.1 : Enregistrement réponse verified', async () => {
      // 1. update request
      mockSupabaseResponse({ id: mockRequestId, status: 'success' });
      // 2. update producer_certifications
      mockSupabaseResponse({ id: mockCertificationId, status: 'verified' });
      // 3. log insert
      mockSupabaseResponse({ id: 'log-1' });

      const res = await recordManualResponse(
        mockCertificationId,
        mockRequestId,
        'Confirmation officielle reçue par email le 14/02/2026',
        'verified',
        mockAdminId
      );

      expect(res.success).toBe(true);

      const certUpdateQuery = executedQueries.find(
        (q) => q.table === 'producer_certifications' && q.method === 'update'
      );
      const payload = certUpdateQuery?.args[0] as Record<string, unknown>;
      expect(payload.status).toBe('verified');
      expect(payload.verified_by).toBe(mockAdminId);
      expect(payload.verified_at).not.toBeNull();
    });

    it('Test 5.2 : Enregistrement réponse rejected', async () => {
      mockSupabaseResponse({ id: mockRequestId, status: 'failed' });
      mockSupabaseResponse({ id: mockCertificationId, status: 'rejected' });
      mockSupabaseResponse({ id: 'log-1' });

      const res = await recordManualResponse(
        mockCertificationId,
        mockRequestId,
        'Certificat révoqué par l organisme',
        'rejected',
        mockAdminId
      );

      expect(res.success).toBe(true);

      const certUpdateQuery = executedQueries.find(
        (q) => q.table === 'producer_certifications' && q.method === 'update'
      );
      const payload = certUpdateQuery?.args[0] as Record<string, unknown>;
      expect(payload.status).toBe('rejected');
      expect(payload.verified_by).toBeUndefined();
    });

    it('Test 5.3 : Log d audit créé', async () => {
      mockSupabaseResponse({ id: mockRequestId, status: 'success' });
      mockSupabaseResponse({ id: mockCertificationId, status: 'verified' });
      mockSupabaseResponse({ id: 'log-1' });

      await recordManualResponse(
        mockCertificationId,
        mockRequestId,
        'Valide',
        'verified',
        mockAdminId
      );

      const logQuery = executedQueries.find(
        (q) => q.table === 'certification_verification_logs' && q.method === 'insert'
      );
      expect(logQuery).toBeDefined();
    });

    it('Test 5.4 : Erreur si requestId ou update échoue', async () => {
      mockSupabaseResponse(null, 'Request not found or permission denied');

      const res = await recordManualResponse(
        mockCertificationId,
        'invalid-req-id',
        'Valide',
        'verified',
        mockAdminId
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain('Request not found');
    });
  });
});
