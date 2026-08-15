import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  detectBestChannel,
  getCertificationBodies,
  importCertificationBodies,
  deactivateCertificationBody
} from '../lib/certificationBodiesService';
import { mockSupabaseResponse, executedQueries } from './mocks/supabaseMock';
import {
  mockCertificationBody,
  mockCertificationBodyNoChannel,
  mockBodyId
} from './fixtures/certificationFixtures';
import type { CertificationBody, CertificationBodyInsert } from '../lib/supabase';

describe('certificationBodiesService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // GROUPE 1 — detectBestChannel (Canaux manuels sans API externe)
  // =========================================================================
  describe('GROUPE 1 — detectBestChannel', () => {
    it('Test 1.1 : Email prioritaire', () => {
      const body: CertificationBody = {
        ...mockCertificationBody,
        email_contact: 'contact@cert.com',
        whatsapp: '+33600000000',
        phone: '+33100000000'
      };
      expect(detectBestChannel(body)).toBe('email');
    });

    it('Test 1.2 : WhatsApp si pas d email', () => {
      const body: CertificationBody = {
        ...mockCertificationBody,
        email_contact: undefined,
        whatsapp: '+33600000000',
        phone: '+33100000000'
      };
      expect(detectBestChannel(body)).toBe('whatsapp');
    });

    it('Test 1.3 : Formulaire / Portail si pas d email ni de WhatsApp', () => {
      const body: CertificationBody = {
        ...mockCertificationBody,
        email_contact: undefined,
        whatsapp: undefined,
        contact_form_url: 'https://cert.com/contact',
        phone: '+33100000000'
      };
      expect(detectBestChannel(body)).toBe('form');
    });

    it('Test 1.4 : Téléphone si pas de formulaire', () => {
      const body: CertificationBody = {
        ...mockCertificationBody,
        email_contact: undefined,
        whatsapp: undefined,
        contact_form_url: undefined,
        verification_url: undefined,
        phone: '+33100000000'
      };
      expect(detectBestChannel(body)).toBe('phone');
    });

    it('Test 1.5 : Phone si pas de WhatsApp', () => {
      const body: CertificationBody = {
        ...mockCertificationBody,
        api_endpoint: null,
        email_contact: null,
        contact_form_url: null,
        verification_url: null,
        whatsapp: null,
        phone: '+33100000000'
      };
      expect(detectBestChannel(body)).toBe('phone');
    });

    it('Test 1.6 : Manual si aucun canal', () => {
      expect(detectBestChannel(mockCertificationBodyNoChannel)).toBe('manual');
    });

    it('Test 1.7 : api_endpoint vide string replie sur le canal suivant', () => {
      const body: CertificationBody = {
        ...mockCertificationBody,
        api_endpoint: '   ',
        email_contact: 'contact@cert.com'
      };
      expect(detectBestChannel(body)).toBe('email');
    });
  });

  // =========================================================================
  // GROUPE 2 — getCertificationBodies
  // =========================================================================
  describe('GROUPE 2 — getCertificationBodies', () => {
    it('Test 2.1 : Retour paginé sans filtre', async () => {
      mockSupabaseResponse([mockCertificationBody], null, 1);

      const res = await getCertificationBodies(undefined, 1, 20);
      expect(res.data).toHaveLength(1);
      expect(res.count).toBe(1);
      expect(res.error).toBeNull();
    });

    it('Test 2.2 : Filtre par région appliqué', async () => {
      mockSupabaseResponse([mockCertificationBody], null, 1);

      const res = await getCertificationBodies({ region: 'Europe' });
      expect(res.data).toHaveLength(1);

      const eqQueries = executedQueries.filter((q) => q.method === 'eq');
      expect(eqQueries.some((q) => q.args[0] === 'region' && q.args[1] === 'Europe')).toBe(true);
    });

    it('Test 2.3 : Filtre has_email appliqué', async () => {
      mockSupabaseResponse([mockCertificationBody], null, 1);

      await getCertificationBodies({ has_email: true });

      const notQueries = executedQueries.filter((q) => q.method === 'not');
      expect(notQueries.some((q) => q.args[0] === 'email_contact')).toBe(true);
    });

    it('Test 2.4 : Filtre de recherche texte', async () => {
      mockSupabaseResponse([mockCertificationBody], null, 1);

      await getCertificationBodies({ search: 'Ecocert' });

      const orQueries = executedQueries.filter((q) => q.method === 'or');
      expect(orQueries.length).toBeGreaterThan(0);
      expect(orQueries[0].args[0]).toContain('Ecocert');
    });

    it('Test 2.5 : Filtre is_active appliqué', async () => {
      mockSupabaseResponse([mockCertificationBody], null, 1);

      await getCertificationBodies({ is_active: true });

      const eqQueries = executedQueries.filter((q) => q.method === 'eq');
      expect(eqQueries.some((q) => q.args[0] === 'is_active' && q.args[1] === true)).toBe(true);
    });

    it('Test 2.6 : Erreur Supabase propagée', async () => {
      mockSupabaseResponse(null, 'Erreur de connexion base');

      const res = await getCertificationBodies();
      expect(res.data).toEqual([]);
      expect(res.error).toContain('Erreur de connexion base');
    });
  });

  // =========================================================================
  // GROUPE 3 — importCertificationBodies
  // =========================================================================
  describe('GROUPE 3 — importCertificationBodies', () => {
    it('Test 3.1 : Import réussi de 3 organismes', async () => {
      const bodiesToImport: CertificationBodyInsert[] = [
        { name: 'Cert A', country: 'France', region: 'Europe' },
        { name: 'Cert B', country: 'Kenya', region: 'Africa' },
        { name: 'Cert C', country: 'Brazil', region: 'Latin America' }
      ];

      mockSupabaseResponse({ id: '1', ...bodiesToImport[0] });
      mockSupabaseResponse({ id: '2', ...bodiesToImport[1] });
      mockSupabaseResponse({ id: '3', ...bodiesToImport[2] });

      const res = await importCertificationBodies(bodiesToImport);
      expect(res.inserted).toBe(3);
      expect(res.errors).toHaveLength(0);
    });

    it('Test 3.2 : Import partiel avec 1 erreur', async () => {
      const bodiesToImport: CertificationBodyInsert[] = [
        { name: 'Cert A', country: 'France', region: 'Europe' },
        { name: 'Cert B', country: 'Kenya', region: 'Africa' },
        { name: 'Cert Duplicate', country: 'France', region: 'Europe' }
      ];

      mockSupabaseResponse({ id: '1', ...bodiesToImport[0] });
      mockSupabaseResponse({ id: '2', ...bodiesToImport[1] });
      mockSupabaseResponse(null, 'duplicate key value violates unique constraint');

      const res = await importCertificationBodies(bodiesToImport);
      expect(res.inserted).toBe(2);
      expect(res.errors).toHaveLength(1);
      expect(res.errors[0]).toContain('Cert Duplicate');
    });

    it('Test 3.3 : Import tableau vide', async () => {
      const res = await importCertificationBodies([]);
      expect(res.inserted).toBe(0);
      expect(res.errors).toEqual([]);
    });
  });

  // =========================================================================
  // GROUPE 4 — deactivateCertificationBody
  // =========================================================================
  describe('GROUPE 4 — deactivateCertificationBody', () => {
    it('Test 4.1 : Soft delete (is_active = false) — DELETE jamais appelé', async () => {
      mockSupabaseResponse({ id: mockBodyId, is_active: false });

      const res = await deactivateCertificationBody(mockBodyId);
      expect(res.success).toBe(true);

      const deleteQueries = executedQueries.filter((q) => q.method === 'delete');
      expect(deleteQueries).toHaveLength(0);

      const updateQuery = executedQueries.find(
        (q) => q.table === 'certification_bodies' && q.method === 'update'
      );
      expect(updateQuery).toBeDefined();
      const payload = updateQuery?.args[0] as Record<string, unknown>;
      expect(payload.is_active).toBe(false);
    });
  });
});
