import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  updateTemplate,
  restorePreviousVersion,
  rollbackTemplate
} from '../lib/certificationTemplatesService';
import { mockSupabaseResponse, resetSupabaseMock } from './mocks/supabaseMock';
import {
  mockEmailTemplateFR,
  mockTemplateWithVersion,
  mockAdminUserId
} from './fixtures/templateFixtures';

describe('Template Versioning & Rollback System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSupabaseMock();
  });

  describe('updateTemplate avec gestion des snapshots de version', () => {
    it('crée un snapshot automatique et incrémente la version de 1 à 2', async () => {
      // 1. getTemplateById
      mockSupabaseResponse({
        ...mockEmailTemplateFR,
        version: 1,
        previous_version: null
      });

      // 2. update call
      mockSupabaseResponse({
        ...mockEmailTemplateFR,
        version: 2,
        subject: 'Nouveau sujet v2',
        body: 'Nouveau body v2',
        previous_version: {
          version: 1,
          subject: mockEmailTemplateFR.subject,
          body: mockEmailTemplateFR.body,
          variables: mockEmailTemplateFR.variables,
          saved_at: '2026-08-15T00:00:00.000Z',
          modified_by: mockAdminUserId
        }
      });

      const res = await updateTemplate(
        mockEmailTemplateFR.id,
        {
          subject: 'Nouveau sujet v2',
          body: 'Nouveau body v2'
        },
        mockAdminUserId,
        true // saveVersionSnapshot = true
      );

      expect(res.error).toBeNull();
      expect(res.data).not.toBeNull();
      expect(res.data?.version).toBe(2);
      expect(res.data?.previous_version).toBeDefined();
      expect(res.data?.previous_version?.subject).toBe(mockEmailTemplateFR.subject);
    });

    it('met à jour sans snapshot si saveVersionSnapshot est false', async () => {
      // 1. getTemplateById
      mockSupabaseResponse({
        ...mockEmailTemplateFR,
        version: 1,
        previous_version: null
      });

      // 2. update call
      mockSupabaseResponse({
        ...mockEmailTemplateFR,
        version: 1,
        is_active: false,
        previous_version: null
      });

      const res = await updateTemplate(
        mockEmailTemplateFR.id,
        { is_active: false },
        mockAdminUserId,
        false
      );

      expect(res.error).toBeNull();
      expect(res.data?.version).toBe(1);
      expect(res.data?.previous_version).toBeNull();
    });

    it('désactive les autres templates par défaut quand is_default passe à true', async () => {
      // 1. getTemplateById
      mockSupabaseResponse({
        ...mockEmailTemplateFR,
        is_default: false,
        version: 1
      });

      // 2. reset existing default
      mockSupabaseResponse([{ id: 'other-default-tpl', is_default: false }]);

      // 3. update template to default
      mockSupabaseResponse({
        ...mockEmailTemplateFR,
        is_default: true,
        version: 2
      });

      const res = await updateTemplate(
        mockEmailTemplateFR.id,
        { is_default: true },
        mockAdminUserId,
        true
      );

      expect(res.error).toBeNull();
      expect(res.data?.is_default).toBe(true);
    });

    it('enregistre le last_modified_by avec le userId fourni', async () => {
      // 1. getTemplateById
      mockSupabaseResponse({
        ...mockEmailTemplateFR,
        version: 1
      });

      // 2. update
      mockSupabaseResponse({
        ...mockEmailTemplateFR,
        subject: 'Modif test',
        last_modified_by: mockAdminUserId,
        version: 2
      });

      const res = await updateTemplate(
        mockEmailTemplateFR.id,
        { subject: 'Modif test' },
        mockAdminUserId,
        true
      );

      expect(res.error).toBeNull();
      expect(res.data?.last_modified_by).toBe(mockAdminUserId);
    });
  });

  describe('restorePreviousVersion & rollbackTemplate', () => {
    it('restaure correctement les valeurs précédentes et archive l\'état actuel', async () => {
      // 1. getTemplateById -> returns template with previous_version
      mockSupabaseResponse(mockTemplateWithVersion);

      // 2. update to restore v1
      mockSupabaseResponse({
        ...mockTemplateWithVersion,
        version: 3,
        subject: mockTemplateWithVersion.previous_version?.subject,
        body: mockTemplateWithVersion.previous_version?.body,
        previous_version: {
          version: 2,
          subject: mockTemplateWithVersion.subject,
          body: mockTemplateWithVersion.body,
          variables: mockTemplateWithVersion.variables,
          saved_at: '2026-08-15T00:00:00.000Z',
          modified_by: mockAdminUserId
        }
      });

      const res = await restorePreviousVersion(mockTemplateWithVersion.id, mockAdminUserId);

      expect(res.error).toBeNull();
      expect(res.data).not.toBeNull();
      expect(res.data?.version).toBe(3);
      expect(res.data?.subject).toBe(mockTemplateWithVersion.previous_version?.subject);
      expect(res.data?.body).toBe(mockTemplateWithVersion.previous_version?.body);
    });

    it('gère correctement deux rollbacks successifs en cascade', async () => {
      // Premier rollback
      mockSupabaseResponse(mockTemplateWithVersion);
      mockSupabaseResponse({
        ...mockTemplateWithVersion,
        version: 3,
        subject: mockTemplateWithVersion.previous_version?.subject,
        previous_version: {
          version: 2,
          subject: mockTemplateWithVersion.subject
        }
      });

      const res1 = await restorePreviousVersion(mockTemplateWithVersion.id, mockAdminUserId);
      expect(res1.error).toBeNull();
      expect(res1.data?.version).toBe(3);

      // Deuxième rollback
      mockSupabaseResponse({
        ...mockTemplateWithVersion,
        version: 3,
        previous_version: {
          version: 2,
          subject: mockTemplateWithVersion.subject,
          body: mockTemplateWithVersion.body,
          variables: mockTemplateWithVersion.variables
        }
      });
      mockSupabaseResponse({
        ...mockTemplateWithVersion,
        version: 4,
        subject: mockTemplateWithVersion.subject
      });

      const res2 = await restorePreviousVersion(mockTemplateWithVersion.id, mockAdminUserId);
      expect(res2.error).toBeNull();
      expect(res2.data?.version).toBe(4);
    });

    it('retourne une erreur si le template n\'a aucune version précédente', async () => {
      mockSupabaseResponse({
        ...mockEmailTemplateFR,
        previous_version: null
      });

      const res = await restorePreviousVersion(mockEmailTemplateFR.id, mockAdminUserId);

      expect(res.data).toBeNull();
      expect(res.error).toContain('Aucune version antérieure disponible');
    });

    it('retourne une erreur si le template est introuvable', async () => {
      mockSupabaseResponse(null, 'Not found');

      const res = await restorePreviousVersion('non-existent-id', mockAdminUserId);

      expect(res.data).toBeNull();
      expect(res.error).not.toBeNull();
    });

    it('confirme que l\'alias rollbackTemplate est identique à restorePreviousVersion', () => {
      expect(rollbackTemplate).toBe(restorePreviousVersion);
    });
  });
});
