import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  renderTemplate,
  getDefaultTemplatesData,
  getDefaultTemplate,
  setDefaultTemplate,
  createTemplate,
  updateTemplate,
  rollbackTemplate,
  duplicateTemplate,
  exportTemplatesAsJSON,
  importTemplatesFromJSON,
  resetToDefaultTemplates,
  normalizeTemplate
} from '../lib/certificationTemplatesService';
import { mockSupabaseResponse, resetSupabaseMock } from './mocks/supabaseMock';
import {
  mockTemplate,
  mockTemplateVariables
} from './fixtures/certificationFixtures';
import {
  mockEmailTemplateFR,
  mockEmailTemplateEN,
  mockWhatsAppTemplate,
  mockAdminUserId
} from './fixtures/templateFixtures';

describe('certificationTemplatesService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetSupabaseMock();
  });

  // =========================================================================
  // GROUPE 1 — renderTemplate & Variable Resolution
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
  // GROUPE — normalizeTemplate
  // =========================================================================
  describe('GROUPE — normalizeTemplate', () => {
    it('Test 1 : Normalisation basique d\'un objet brut vers CertificationMessageTemplate valide', () => {
      const raw = {
        id: 'raw-1',
        title: 'Template Brut',
        name: 'Template Brut',
        channel: 'email',
        language: 'fr',
        subject: 'Sujet test',
        body: 'Corps test',
        variables: ['producer_name'],
        is_default: true,
        is_active: true,
        version: 1,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z'
      };

      const normalized = normalizeTemplate(raw);
      expect(normalized.id).toBe('raw-1');
      expect(normalized.title).toBe('Template Brut');
      expect(normalized.channel).toBe('email');
      expect(normalized.language).toBe('fr');
      expect(normalized.variables).toEqual(['producer_name']);
    });

    it('Test 2 : Remplace les champs manquants par des valeurs par défaut', () => {
      const rawIncomplete = {
        id: 'raw-2',
        body: 'Corps seul sans métadonnées'
      };

      const normalized = normalizeTemplate(rawIncomplete);
      expect(normalized.variables).toEqual([]);
      expect(normalized.version).toBe(1);
      expect(normalized.language).toBe('fr');
      expect(normalized.channel).toBe('email');
      expect(normalized.is_default).toBe(false);
    });

    it('Test 3 : Assure la compatibilité bidirectionnelle title / name', () => {
      const rawOnlyName = { id: 'r1', name: 'Nom Unique', body: '...' };
      const resName = normalizeTemplate(rawOnlyName);
      expect(resName.title).toBe('Nom Unique');
      expect(resName.name).toBe('Nom Unique');

      const rawOnlyTitle = { id: 'r2', title: 'Titre Unique', body: '...' };
      const resTitle = normalizeTemplate(rawOnlyTitle);
      expect(resTitle.title).toBe('Titre Unique');
      expect(resTitle.name).toBe('Titre Unique');
    });

    it('Test 4 : Conserve les dates valides sous forme de chaînes ISO', () => {
      const rawWithDates = {
        id: 'r3',
        title: 'Dates Test',
        body: '...',
        created_at: '2026-06-15T10:00:00.000Z',
        updated_at: '2026-06-16T12:00:00.000Z'
      };

      const normalized = normalizeTemplate(rawWithDates);
      expect(typeof normalized.created_at).toBe('string');
      expect(normalized.created_at).toContain('2026-06-15');
      expect(normalized.updated_at).toContain('2026-06-16');
    });
  });

  // =========================================================================
  // GROUPE 2 — getDefaultTemplatesData (12 templates officiels)
  // =========================================================================
  describe('GROUPE 2 — getDefaultTemplatesData', () => {
    it('Test 2.1 : Retourne exactement 12 templates standards', () => {
      const defaults = getDefaultTemplatesData();
      expect(defaults.length).toBe(12);
    });

    it('Test 2.2 : Contient des templates multilingues (FR, EN, ES, PT)', () => {
      const defaults = getDefaultTemplatesData();
      const languages = new Set(defaults.map((t) => t.language));
      expect(languages.has('fr')).toBe(true);
      expect(languages.has('en')).toBe(true);
      expect(languages.has('es')).toBe(true);
      expect(languages.has('pt')).toBe(true);
    });

    it('Test 2.3 : Contient des templates pour tous les canaux (email, whatsapp, form, api)', () => {
      const defaults = getDefaultTemplatesData();
      const channels = new Set(defaults.map((t) => t.channel));
      expect(channels.has('email')).toBe(true);
      expect(channels.has('whatsapp')).toBe(true);
      expect(channels.has('form')).toBe(true);
      expect(channels.has('api')).toBe(true);
    });

    it('Test 2.4 : Tous les templates ont un titre et un corps non vides', () => {
      const defaults = getDefaultTemplatesData();
      defaults.forEach((tpl) => {
        expect(tpl.title.length).toBeGreaterThan(0);
        expect(tpl.body.length).toBeGreaterThan(0);
        expect(tpl.channel).toBeDefined();
        expect(tpl.language).toBeDefined();
      });
    });
  });

  // =========================================================================
  // GROUPE — getDefaultTemplate (Fallback avancé)
  // =========================================================================
  describe('GROUPE — getDefaultTemplate (Fallback avancé)', () => {
    it('Test 1 : Retourne directement le template par défaut dans la langue demandée (FR)', async () => {
      mockSupabaseResponse(mockEmailTemplateFR);

      const res = await getDefaultTemplate('email', 'fr');
      expect(res.data).not.toBeNull();
      expect(res.data?.language).toBe('fr');
      expect(res.data?.channel).toBe('email');
    });

    it('Test 2 : Si la langue demandée est absente, effectue un fallback vers l\'anglais (EN)', async () => {
      // 1er appel langue 'de' -> null
      mockSupabaseResponse(null);
      // 2e appel fallback 'en' -> mockEmailTemplateEN
      mockSupabaseResponse(mockEmailTemplateEN);

      const res = await getDefaultTemplate('email', 'de');
      expect(res.data).not.toBeNull();
      expect(res.data?.language).toBe('en');
    });

    it('Test 3 : Si aucun template par défaut dans la langue, fallback sur le premier disponible du canal', async () => {
      // Pas de défaut FR
      mockSupabaseResponse(null);
      // Pas de défaut EN
      mockSupabaseResponse(null);
      // Premier template du canal
      mockSupabaseResponse(mockEmailTemplateFR);

      const res = await getDefaultTemplate('email', 'it');
      expect(res.data).not.toBeNull();
      expect(res.data?.channel).toBe('email');
    });

    it('Test 4 : Retourne null sans lever d\'erreur si aucun template n\'existe pour le canal', async () => {
      mockSupabaseResponse(null);
      mockSupabaseResponse(null);
      mockSupabaseResponse(null);

      const res = await getDefaultTemplate('letter', 'fr');
      expect(res.data).toBeNull();
      expect(res.error).toBeNull();
    });
  });

  // =========================================================================
  // GROUPE — duplicateTemplate
  // =========================================================================
  describe('GROUPE — duplicateTemplate', () => {
    it('Test 1 : Duplication basique avec "(Copie)" dans le titre, version=1 et is_default=false', async () => {
      mockSupabaseResponse(mockEmailTemplateFR);
      mockSupabaseResponse({
        ...mockEmailTemplateFR,
        id: 'dup-new-id',
        name: `${mockEmailTemplateFR.name} (Copie)`,
        title: `${mockEmailTemplateFR.title} (Copie)`,
        is_default: false,
        version: 1
      });

      const res = await duplicateTemplate(mockEmailTemplateFR.id, undefined, mockAdminUserId);

      expect(res.error).toBeNull();
      expect(res.data?.id).toBe('dup-new-id');
      expect(res.data?.title).toContain('(Copie)');
      expect(res.data?.is_default).toBe(false);
      expect(res.data?.version).toBe(1);
    });

    it('Test 2 : Duplication avec un titre personnalisé explicite', async () => {
      mockSupabaseResponse(mockEmailTemplateFR);
      mockSupabaseResponse({
        ...mockEmailTemplateFR,
        id: 'dup-custom-id',
        title: 'Mon Titre Sur Mesure',
        name: 'Mon Titre Sur Mesure',
        is_default: false
      });

      const res = await duplicateTemplate(mockEmailTemplateFR.id, 'Mon Titre Sur Mesure', mockAdminUserId);

      expect(res.error).toBeNull();
      expect(res.data?.title).toBe('Mon Titre Sur Mesure');
    });

    it('Test 3 : Duplication d\'un template avec subject ajoute "[Copie]" en préfixe de subject', async () => {
      mockSupabaseResponse(mockEmailTemplateFR);
      mockSupabaseResponse({
        ...mockEmailTemplateFR,
        id: 'dup-subject-id',
        subject: `[Copie] ${mockEmailTemplateFR.subject}`,
        is_default: false
      });

      const res = await duplicateTemplate(mockEmailTemplateFR.id);

      expect(res.error).toBeNull();
      expect(res.data?.subject).toContain('[Copie]');
    });

    it('Test 4 : Duplication d\'un template introuvable retourne une erreur', async () => {
      mockSupabaseResponse(null);

      const res = await duplicateTemplate('unknown-id');

      expect(res.data).toBeNull();
      expect(res.error).toContain('introuvable');
    });
  });

  // =========================================================================
  // GROUPE — Workflows d'Intégration Complets
  // =========================================================================
  describe('GROUPE FINAL — Tests d\'Intégration End-to-End', () => {
    it('Workflow 1 : Create → Update (v2) → Rollback (v3 restauré)', async () => {
      // 1. Create
      mockSupabaseResponse({
        ...mockEmailTemplateFR,
        id: 'workflow-tpl-1',
        version: 1,
        previous_version: null
      });

      const createRes = await createTemplate({
        title: 'Template Workflow',
        language: 'fr',
        channel: 'email',
        subject: 'Objet Initial v1',
        body: 'Corps Initial v1',
        variables: ['producer_name']
      }, mockAdminUserId);

      expect(createRes.data?.version).toBe(1);

      // 2. Update vers v2
      mockSupabaseResponse(createRes.data);
      mockSupabaseResponse({
        ...createRes.data,
        version: 2,
        subject: 'Objet Modifié v2',
        body: 'Corps Modifié v2',
        previous_version: {
          version: 1,
          subject: 'Objet Initial v1',
          body: 'Corps Initial v1',
          variables: ['producer_name']
        }
      });

      const updateRes = await updateTemplate(
        'workflow-tpl-1',
        { subject: 'Objet Modifié v2', body: 'Corps Modifié v2' },
        mockAdminUserId,
        true
      );

      expect(updateRes.data?.version).toBe(2);
      expect(updateRes.data?.previous_version?.subject).toBe('Objet Initial v1');

      // 3. Rollback
      mockSupabaseResponse(updateRes.data);
      mockSupabaseResponse({
        ...updateRes.data,
        version: 3,
        subject: 'Objet Initial v1',
        body: 'Corps Initial v1',
        previous_version: {
          version: 2,
          subject: 'Objet Modifié v2'
        }
      });

      const rollbackRes = await rollbackTemplate('workflow-tpl-1', mockAdminUserId);
      expect(rollbackRes.data?.version).toBe(3);
      expect(rollbackRes.data?.subject).toBe('Objet Initial v1');
      expect(rollbackRes.data?.body).toBe('Corps Initial v1');
    });

    it('Workflow 2 : Export → Import JSON complet', async () => {
      // 1. Exporter les modèles
      const exportedJSON = await exportTemplatesAsJSON([mockEmailTemplateFR, mockWhatsAppTemplate]);
      expect(typeof exportedJSON).toBe('string');

      // 2. Importer le JSON
      // Modèle 1
      mockSupabaseResponse(null); // check existing
      mockSupabaseResponse([]); // reset default
      mockSupabaseResponse({ id: 'reimported-1', name: mockEmailTemplateFR.name }); // insert

      // Modèle 2
      mockSupabaseResponse(null); // check existing
      mockSupabaseResponse([]); // reset default
      mockSupabaseResponse({ id: 'reimported-2', name: mockWhatsAppTemplate.name }); // insert

      const importRes = await importTemplatesFromJSON(exportedJSON, false, mockAdminUserId);
      expect(importRes.importedCount).toBe(2);
      expect(importRes.errors).toEqual([]);
    });

    it('Workflow 3 : Réinitialisation aux modèles standards (Reset)', async () => {
      for (let i = 0; i < 12; i++) {
        mockSupabaseResponse([{ id: 'old-default', is_default: false }]);
        mockSupabaseResponse({ id: `official-${i}`, is_default: true });
      }

      const resetRes = await resetToDefaultTemplates(mockAdminUserId);
      expect(resetRes.success).toBe(true);
      expect(resetRes.count).toBe(12);
      expect(resetRes.error).toBeNull();
    });

    it('Workflow 4 : Duplicate → Modify → Set Default', async () => {
      // 1. Duplication
      mockSupabaseResponse(mockEmailTemplateFR);
      mockSupabaseResponse({
        ...mockEmailTemplateFR,
        id: 'dup-flow-id',
        title: 'Email Copie',
        is_default: false,
        version: 1
      });

      const dupRes = await duplicateTemplate(mockEmailTemplateFR.id, 'Email Copie');
      expect(dupRes.data?.is_default).toBe(false);

      // 2. Modification
      mockSupabaseResponse(dupRes.data);
      mockSupabaseResponse({
        ...dupRes.data,
        body: 'Corps personnalisé',
        version: 2
      });

      const updRes = await updateTemplate('dup-flow-id', { body: 'Corps personnalisé' });
      expect(updRes.data?.version).toBe(2);

      // 3. Définir par défaut: reset previous default + update target
      mockSupabaseResponse([{ id: mockEmailTemplateFR.id, is_default: false }]);
      mockSupabaseResponse({
        ...updRes.data,
        is_default: true
      });

      const defRes = await setDefaultTemplate('dup-flow-id', 'email', 'fr');
      expect(defRes.success).toBe(true);
      expect(defRes.error).toBeNull();
    });
  });
});
