import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  renderTemplate,
  getDefaultTemplatesData,
  getDefaultTemplate,
  setDefaultTemplate
} from '../lib/certificationTemplatesService';
import { mockSupabaseResponse, executedQueries } from './mocks/supabaseMock';
import {
  mockTemplate,
  mockTemplateVariables,
  mockTemplateId
} from './fixtures/certificationFixtures';

describe('certificationTemplatesService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // GROUPE 1 — renderTemplate
  // =========================================================================
  describe('GROUPE 1 — renderTemplate', () => {
    it('Test 1.1 : Rendu complet sujet + corps', () => {
      const rendered = renderTemplate(mockTemplate, mockTemplateVariables);

      expect(rendered.subject).toBe(
        'Demande de vérification de certification — Ecocert International / EthiMarket'
      );
      expect(rendered.body).toContain('Bonjour Sophie Auditeur');
      expect(rendered.body).toContain('ECO-2026-88912');
      expect(rendered.body).toContain('Jean Dupont');
      expect(rendered.body).toContain('2026-01-15');
      expect(rendered.body).toContain('Ecocert International');
    });

    it('Test 1.2 : Template sans sujet', () => {
      const tplNoSubject = {
        ...mockTemplate,
        subject: null
      };

      const rendered = renderTemplate(tplNoSubject, mockTemplateVariables);
      expect(rendered.subject).toBeNull();
      expect(rendered.body).toContain('Bonjour Sophie Auditeur');
    });

    it('Test 1.3 : Variables partielles', () => {
      const partialVariables = {
        producer_name: 'Jean Dupont'
      };

      const rendered = renderTemplate(mockTemplate, partialVariables);
      expect(rendered.subject).toContain('Demande de vérification de certification —  / ');
      expect(rendered.body).toContain('Jean Dupont');
      expect(rendered.body).toContain('Bonjour ,');
    });
  });

  // =========================================================================
  // GROUPE 2 — getDefaultTemplatesData
  // =========================================================================
  describe('GROUPE 2 — getDefaultTemplatesData', () => {
    it('Test 2.1 : Retourne au moins 4 templates', () => {
      const defaults = getDefaultTemplatesData();
      expect(defaults.length).toBeGreaterThanOrEqual(4);
    });

    it('Test 2.2 : Contient un template email français', () => {
      const defaults = getDefaultTemplatesData();
      const frEmail = defaults.find((t) => t.channel === 'email' && t.language === 'fr');
      expect(frEmail).toBeDefined();
      expect(frEmail?.name).toContain('Français');
    });

    it('Test 2.3 : Contient un template email anglais', () => {
      const defaults = getDefaultTemplatesData();
      const enEmail = defaults.find((t) => t.channel === 'email' && t.language === 'en');
      expect(enEmail).toBeDefined();
      expect(enEmail?.name).toContain('English');
    });

    it('Test 2.4 : Contient un template WhatsApp', () => {
      const defaults = getDefaultTemplatesData();
      const wa = defaults.find((t) => t.channel === 'whatsapp');
      expect(wa).toBeDefined();
    });

    it('Test 2.5 : Tous les templates ont is_default === true', () => {
      const defaults = getDefaultTemplatesData();
      defaults.forEach((t) => {
        expect(t.is_default).toBe(true);
      });
    });

    it('Test 2.6 : Aucun template n a created_by défini (null)', () => {
      const defaults = getDefaultTemplatesData();
      defaults.forEach((t) => {
        expect(t.created_by).toBeNull();
      });
    });
  });

  // =========================================================================
  // GROUPE 3 — getDefaultTemplate
  // =========================================================================
  describe('GROUPE 3 — getDefaultTemplate', () => {
    it('Test 3.1 : Retourne le template par défaut pour email + français', async () => {
      mockSupabaseResponse(mockTemplate);

      const res = await getDefaultTemplate('email', 'fr');
      expect(res.data).not.toBeNull();
      expect(res.data?.language).toBe('fr');
      expect(res.data?.channel).toBe('email');
    });

    it('Test 3.2 : Fallback sur anglais si français non trouvé', async () => {
      // 1. Direct query returns null
      mockSupabaseResponse(null);
      // 2. Fallback query returns English template
      mockSupabaseResponse({
        ...mockTemplate,
        id: 'tpl-en',
        language: 'en',
        name: 'Official Verification Email'
      });

      const res = await getDefaultTemplate('email', 'es');
      expect(res.data).not.toBeNull();
      expect(res.data?.language).toBe('en');
    });

    it('Test 3.3 : Retourne null si aucun template pour ce canal (sans erreur)', async () => {
      mockSupabaseResponse(null);
      mockSupabaseResponse(null);

      const res = await getDefaultTemplate('manual', 'fr');
      expect(res.data).toBeNull();
      expect(res.error).toBeNull();
    });
  });

  // =========================================================================
  // GROUPE 4 — setDefaultTemplate
  // =========================================================================
  describe('GROUPE 4 — setDefaultTemplate', () => {
    it('Test 4.1 : Désactive les autres templates du même canal + langue avant d activer le nouveau', async () => {
      // 1. Désactivation des anciens
      mockSupabaseResponse([{ id: 'old-tpl', is_default: false }]);
      // 2. Activation du nouveau
      mockSupabaseResponse({ id: mockTemplateId, is_default: true });

      const res = await setDefaultTemplate(mockTemplateId, 'email', 'fr');
      expect(res.success).toBe(true);

      const updateQueries = executedQueries.filter(
        (q) => q.table === 'certification_message_templates' && q.method === 'update'
      );
      expect(updateQueries.length).toBeGreaterThanOrEqual(2);

      const firstUpdatePayload = updateQueries[0].args[0] as Record<string, unknown>;
      expect(firstUpdatePayload.is_default).toBe(false);

      const secondUpdatePayload = updateQueries[1].args[0] as Record<string, unknown>;
      expect(secondUpdatePayload.is_default).toBe(true);
    });
  });

  // =========================================================================
  // GROUPE 5 — CRUD Templates (getTemplates, createTemplate, updateTemplate, deleteTemplate)
  // =========================================================================
  describe('GROUPE 5 — CRUD Templates', () => {
    it('Test 5.1 : getTemplates avec filtres', async () => {
      mockSupabaseResponse([mockTemplate]);

      const { getTemplates } = await import('../lib/certificationTemplatesService');
      const res = await getTemplates({ language: 'fr', channel: 'email' });
      expect(res.data).toHaveLength(1);
      expect(res.error).toBeNull();
    });

    it('Test 5.2 : createTemplate avec is_default', async () => {
      mockSupabaseResponse([{ id: 'old-tpl', is_default: false }]);
      mockSupabaseResponse(mockTemplate);

      const { createTemplate } = await import('../lib/certificationTemplatesService');
      const res = await createTemplate({
        name: 'Nouveau template',
        language: 'fr',
        channel: 'email',
        subject: 'Sujet',
        body: 'Corps',
        variables: ['producer_name'],
        is_default: true,
        created_by: null
      });

      expect(res.data).not.toBeNull();
      expect(res.error).toBeNull();
    });

    it('Test 5.3 : updateTemplate avec is_default', async () => {
      mockSupabaseResponse([{ id: 'old-tpl', is_default: false }]);
      mockSupabaseResponse({ ...mockTemplate, name: 'Modifié' });

      const { updateTemplate } = await import('../lib/certificationTemplatesService');
      const res = await updateTemplate(mockTemplateId, {
        name: 'Modifié',
        is_default: true,
        channel: 'email',
        language: 'fr'
      });

      expect(res.data?.name).toBe('Modifié');
    });

    it('Test 5.4 : deleteTemplate supprime avec succès', async () => {
      mockSupabaseResponse(null);

      const { deleteTemplate } = await import('../lib/certificationTemplatesService');
      const res = await deleteTemplate(mockTemplateId);
      expect(res.success).toBe(true);
    });
  });
});
