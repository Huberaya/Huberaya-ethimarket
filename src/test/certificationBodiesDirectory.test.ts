import { describe, it, expect } from 'vitest';
import {
  detectBestChannel
} from '../lib/certificationBodiesService';
import {
  exportCertificationBodiesToJson,
  isDuplicateBody
} from '../lib/certBodiesImportExport';
import { generatePostalLetterHtml } from '../lib/postalLetterGenerator';
import type { CertificationBody } from '../lib/supabase';

describe('Global Certification Bodies Directory & Verification Logic', () => {
  const mockBody: CertificationBody = {
    id: 'body-123',
    name: 'Ecocert West Africa',
    acronym: 'Ecocert WA',
    country: 'Sénégal',
    region: 'Africa',
    sub_region: 'Afrique de l Ouest',
    city: 'Dakar',
    address: 'Route des Almadies, Dakar',
    postal_code: '10200',
    latitude: 14.7408,
    longitude: -17.5186,
    foundation_year: 2004,
    employee_count: '25-50',
    website: 'https://www.ecocert.com',
    verification_url: 'https://directory.ecocert.com',
    email_contact: 'contact.senegal@ecocert.com',
    phone: '+221 33 820 45 67',
    whatsapp: '+221 77 654 32 10',
    contact_form_url: 'https://www.ecocert.com/fr/contact',
    languages: ['Français', 'Wolof', 'English'],
    certification_types: ['organic', 'fair_trade'],
    accreditations: ['IFOAM', 'ISO/IEC 17065', 'COFRAC'],
    domains: ['Agriculture Biologique', 'Commerce Équitable'],
    trust_level: 'verified',
    reliability_score: 98,
    average_cost: '1 200 € - 3 500 €',
    average_duration: '3 à 6 semaines',
    timezone: 'UTC+0',
    contact_hours: 'Lun-Ven: 08:30 - 17:00 (GMT)',
    verification_sources: ['IFOAM Directory'],
    is_active: true,
    created_at: '2026-08-15T00:00:00Z',
    updated_at: '2026-08-15T00:00:00Z'
  };

  it('detects email as primary channel when available without API dependency', () => {
    const channel = detectBestChannel(mockBody);
    expect(channel).toBe('email');
  });

  it('detects whatsapp when email is missing', () => {
    const channel = detectBestChannel({
      ...mockBody,
      email_contact: undefined
    });
    expect(channel).toBe('whatsapp');
  });

  it('detects form/portal when email and whatsapp are missing', () => {
    const channel = detectBestChannel({
      ...mockBody,
      email_contact: undefined,
      whatsapp: undefined
    });
    expect(channel).toBe('form');
  });

  it('detects phone when online channels are missing', () => {
    const channel = detectBestChannel({
      ...mockBody,
      email_contact: undefined,
      whatsapp: undefined,
      verification_url: undefined,
      contact_form_url: undefined
    });
    expect(channel).toBe('phone');
  });

  it('detects postal channel when address is present and all other channels missing', () => {
    const channel = detectBestChannel({
      ...mockBody,
      email_contact: undefined,
      whatsapp: undefined,
      verification_url: undefined,
      contact_form_url: undefined,
      phone: undefined
    });
    expect(channel).toBe('postal');
  });

  it('exports certification bodies to standard JSON schema with regions breakdown', () => {
    const jsonStr = exportCertificationBodiesToJson([mockBody]);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.totalCount).toBe(1);
    expect(parsed.countriesCount).toBe(1);
    expect(parsed.regions['Africa']).toBe(1);
    expect(parsed.bodies[0].name).toBe('Ecocert West Africa');
    expect(parsed.bodies[0].accreditations).toContain('IFOAM');
  });

  it('detects duplicates accurately by normalized name and country', () => {
    const existing = [mockBody];
    const candidateSame = {
      name: '  ECOCERT WEST AFRICA ',
      country: 'sénégal'
    };
    const candidateDifferent = {
      name: 'Ecocert France',
      country: 'France'
    };

    expect(isDuplicateBody(candidateSame, existing)).toBeDefined();
    expect(isDuplicateBody(candidateDifferent, existing)).toBeUndefined();
  });

  it('generates official postal audit letter HTML with all required compliance sections', () => {
    const html = generatePostalLetterHtml({
      certificationBody: mockBody,
      certificateNumber: 'CERT-BIO-9988',
      producerName: 'Ferme Biologique de Casamance',
      certificationType: 'Agriculture Biologique & Équitable'
    });

    expect(html).toContain('Ecocert West Africa');
    expect(html).toContain('CERT-BIO-9988');
    expect(html).toContain('Ferme Biologique de Casamance');
    expect(html).toContain('Département Conformité & Audits');
    expect(html).toContain('Cachet officiel EthiMarket');
  });
});
