import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  exportTemplatesAsJSON,
  importTemplatesFromJSON
} from '../lib/certificationTemplatesService';
import { mockSupabaseResponse, resetSupabaseMock } from './mocks/supabaseMock';
import {
  mockEmailTemplateFR,
  mockWhatsAppTemplate,
  mockTemplatesArray,
  mockValidExportJSON,
  mockInvalidJSON,
  mockJSONWithDuplicates,
  mockAdminUserId
} from './fixtures/templateFixtures';

describe('Template Import / Export Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSupabaseMock();
  });

  describe('exportTemplatesAsJSON', () => {
    it('retourne une chaîne JSON valide et parseable', async () => {
      const json = await exportTemplatesAsJSON([mockEmailTemplateFR, mockWhatsAppTemplate]);
      expect(typeof json).toBe('string');
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('produit une structure avec exported_at, version, count et templates', async () => {
      const json = await exportTemplatesAsJSON([mockEmailTemplateFR]);
      const parsed = JSON.parse(json);

      expect(parsed).toHaveProperty('exported_at');
      expect(typeof parsed.exported_at).toBe('string');
      expect(parsed).toHaveProperty('version', '1.0');
      expect(parsed).toHaveProperty('count', 1);
      expect(Array.isArray(parsed.templates)).toBe(true);
    });

    it('garantit la cohérence du nombre de templates exportés', async () => {
      const json = await exportTemplatesAsJSON(mockTemplatesArray);
      const parsed = JSON.parse(json);

      expect(parsed.count).toBe(mockTemplatesArray.length);
      expect(parsed.templates.length).toBe(mockTemplatesArray.length);
    });

    it('vérifie la présence des champs essentiels dans chaque template exporté', async () => {
      const json = await exportTemplatesAsJSON([mockEmailTemplateFR]);
      const parsed = JSON.parse(json);
      const tpl = parsed.templates[0];

      expect(tpl).toHaveProperty('title');
      expect(tpl).toHaveProperty('language');
      expect(tpl).toHaveProperty('channel');
      expect(tpl).toHaveProperty('body');
      expect(tpl).toHaveProperty('variables');
    });

    it('gère correctement un export vide (0 template)', async () => {
      const json = await exportTemplatesAsJSON([]);
      const parsed = JSON.parse(json);

      expect(parsed.count).toBe(0);
      expect(parsed.templates).toEqual([]);
    });

    it('effectue un fetch automatique si aucun template n\'est passé en argument', async () => {
      mockSupabaseResponse([mockEmailTemplateFR, mockWhatsAppTemplate]);

      const json = await exportTemplatesAsJSON();
      const parsed = JSON.parse(json);

      expect(parsed.count).toBe(2);
      expect(parsed.templates.length).toBe(2);
    });
  });

  describe('importTemplatesFromJSON', () => {
    it('importe avec succès un JSON valide contenant plusieurs modèles', async () => {
      // 1. Template 1: check existing -> null
      mockSupabaseResponse(null);
      // createTemplate -> insert
      mockSupabaseResponse({ ...mockEmailTemplateFR, id: 'new-id-1' });

      // 2. Template 2: check existing -> null
      mockSupabaseResponse(null);
      // createTemplate -> insert
      mockSupabaseResponse({ ...mockWhatsAppTemplate, id: 'new-id-2' });

      const res = await importTemplatesFromJSON(mockValidExportJSON, false, mockAdminUserId);

      expect(res.errors).toEqual([]);
      expect(res.importedCount).toBe(2);
    });

    it('ignore les doublons si overwriteExisting est false', async () => {
      // 1. Template 1 (existant) -> returns existing
      mockSupabaseResponse({ id: 'existing-tpl-1' });

      // 2. Template 2 (inédit) -> null
      mockSupabaseResponse(null);
      // insert
      mockSupabaseResponse({ id: 'new-tpl-2' });

      const res = await importTemplatesFromJSON(mockJSONWithDuplicates, false, mockAdminUserId);

      // Sur les 2 templates, 1 existe déjà et est ignoré, 1 est inséré
      expect(res.importedCount).toBe(1);
    });

    it('écrase et met à jour les doublons si overwriteExisting est true', async () => {
      // 1. Template 1: check existing -> returns existing
      mockSupabaseResponse({ id: 'existing-tpl-1' });
      // getTemplateById
      mockSupabaseResponse({ ...mockEmailTemplateFR, id: 'existing-tpl-1', version: 1 });
      // updateTemplate
      mockSupabaseResponse({ ...mockEmailTemplateFR, id: 'existing-tpl-1', version: 2 });

      // 2. Template 2: check existing -> null
      mockSupabaseResponse(null);
      // createTemplate -> insert
      mockSupabaseResponse({ id: 'new-tpl-2' });

      const res = await importTemplatesFromJSON(mockJSONWithDuplicates, true, mockAdminUserId);

      expect(res.importedCount).toBe(2);
    });

    it('retourne une erreur si le JSON est malformé', async () => {
      const res = await importTemplatesFromJSON(mockInvalidJSON);

      expect(res.importedCount).toBe(0);
      expect(res.errors.length).toBeGreaterThan(0);
    });

    it('retourne une erreur si le schéma JSON ne contient aucun modèle valide', async () => {
      const res = await importTemplatesFromJSON(JSON.stringify({ foo: 'bar' }));

      expect(res.importedCount).toBe(0);
      expect(res.errors.length).toBeGreaterThan(0);
      expect(res.errors[0]).toMatch(/aucun modèle/i);
    });

    it('signale une erreur si un template du JSON n\'a pas de body requis', async () => {
      const invalidItemJSON = JSON.stringify({
        templates: [
          {
            title: 'Sans Corps',
            language: 'fr',
            channel: 'email'
          }
        ]
      });

      const res = await importTemplatesFromJSON(invalidItemJSON);

      expect(res.importedCount).toBe(0);
      expect(res.errors.length).toBeGreaterThan(0);
      expect(res.errors[0]).toMatch(/body/i);
    });

    it('accepte l\'import via un tableau direct JSON sans wrapper "templates"', async () => {
      const arrayJSON = JSON.stringify([
        {
          title: 'Direct Array 1',
          language: 'fr',
          channel: 'email',
          body: 'Corps array 1'
        },
        {
          title: 'Direct Array 2',
          language: 'en',
          channel: 'whatsapp',
          body: 'Corps array 2'
        }
      ]);

      mockSupabaseResponse(null);
      mockSupabaseResponse({ id: 'arr-1' });
      mockSupabaseResponse(null);
      mockSupabaseResponse({ id: 'arr-2' });

      const res = await importTemplatesFromJSON(arrayJSON, false, mockAdminUserId);

      expect(res.importedCount).toBe(2);
      expect(res.errors).toEqual([]);
    });

    it('accepte l\'import standard avec métadonnées objet { templates: [...] }', async () => {
      const standardObjJSON = JSON.stringify({
        version: '1.0',
        exported_at: new Date().toISOString(),
        templates: [
          {
            title: 'Std Object 1',
            language: 'fr',
            channel: 'email',
            body: 'Corps std 1'
          }
        ]
      });

      mockSupabaseResponse(null);
      mockSupabaseResponse({ id: 'std-1' });

      const res = await importTemplatesFromJSON(standardObjJSON, false, mockAdminUserId);

      expect(res.importedCount).toBe(1);
      expect(res.errors).toEqual([]);
    });
  });
});
