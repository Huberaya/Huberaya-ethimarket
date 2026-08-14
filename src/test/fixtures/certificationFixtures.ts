import type {
  CertificationBody,
  ProducerCertification,
  CertificationVerificationLog,
  CertificationVerificationRequest,
  CertificationMessageTemplate,
  TemplateVariables,
  CertificationDashboardStats
} from '../../lib/supabase';

export const mockAdminId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
export const mockProducerId = 'b1ffcd88-8b1a-4de7-aa5c-5aa8ac270b22';
export const mockCertificationId = 'c2eebd77-7a2b-4cd6-994b-4997bd160c33';
export const mockStandardId = 'd3ffec66-6f3c-4bc5-883a-3886cd050d44';
export const mockBodyId = 'e4aaeb55-5e4d-4ab4-7729-2775dc940e55';
export const mockRequestId = 'f5bbfa44-4d5e-49a3-6618-1664eb830f66';
export const mockTemplateId = '11aa22bb-33cc-44dd-55ee-66ff77aa88bb';

/**
 * Organisme complet avec tous les canaux disponibles
 */
export const mockCertificationBody: CertificationBody = {
  id: mockBodyId,
  name: 'Ecocert International',
  acronym: 'ECOCERT',
  country: 'France',
  region: 'Europe',
  sub_region: 'Western Europe',
  website: 'https://www.ecocert.com',
  verification_url: 'https://certstatus.ecocert.com',
  api_endpoint: 'https://api.ecocert.com/v1/verify',
  api_key_required: true,
  api_key_encrypted: 'mock_api_key_token_123',
  email_contact: 'compliance@ecocert.com',
  phone: '+33562071101',
  whatsapp: '+33600000000',
  contact_form_url: 'https://www.ecocert.com/fr/contact-verification',
  logo_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=100',
  languages: ['fr', 'en', 'es'],
  is_active: true,
  trust_level: 'verified',
  internal_notes: 'Organisme certificateur accrédité COFRAC',
  created_at: '2026-01-01T00:00:00.000Z',
  last_updated_at: '2026-01-01T00:00:00.000Z'
};

/**
 * Organisme avec seulement l'email disponible
 */
export const mockCertificationBodyEmailOnly: CertificationBody = {
  id: 'e4aaeb55-5e4d-4ab4-7729-2775dc940e56',
  name: 'Fairtrade Africa Secretariat',
  acronym: 'FTA',
  country: 'Kenya',
  region: 'Africa',
  sub_region: 'Eastern Africa',
  website: 'https://fairtradeafrica.net',
  verification_url: null,
  api_endpoint: null,
  api_key_required: false,
  api_key_encrypted: null,
  email_contact: 'verify@fairtradeafrica.net',
  phone: null,
  whatsapp: null,
  contact_form_url: null,
  logo_url: null,
  languages: ['en', 'sw'],
  is_active: true,
  trust_level: 'verified',
  internal_notes: null,
  created_at: '2026-01-01T00:00:00.000Z',
  last_updated_at: '2026-01-01T00:00:00.000Z'
};

/**
 * Organisme sans aucun canal de contact
 */
export const mockCertificationBodyNoChannel: CertificationBody = {
  id: 'e4aaeb55-5e4d-4ab4-7729-2775dc940e57',
  name: 'Local Organic Producers Board',
  acronym: 'LOPB',
  country: 'Madagascar',
  region: 'Africa',
  sub_region: 'Eastern Africa',
  website: null,
  verification_url: null,
  api_endpoint: null,
  api_key_required: false,
  api_key_encrypted: null,
  email_contact: null,
  phone: null,
  whatsapp: null,
  contact_form_url: null,
  logo_url: null,
  languages: ['fr', 'mg'],
  is_active: true,
  trust_level: 'pending',
  internal_notes: 'En attente de transmission des coordonnées',
  created_at: '2026-01-01T00:00:00.000Z',
  last_updated_at: '2026-01-01T00:00:00.000Z'
};

/**
 * Certification producteur unverified
 */
export const mockProducerCertification: ProducerCertification = {
  id: mockCertificationId,
  producer_id: mockProducerId,
  certification_body_id: mockBodyId,
  certification_standard_id: mockStandardId,
  certification_type: 'organic',
  certificate_number: 'ECO-2026-88912',
  issued_at: '2026-01-15T00:00:00.000Z',
  expires_at: '2027-01-15T00:00:00.000Z',
  document_url: 'https://storage.ethimarket.com/certs/eco-2026-88912.pdf',
  status: 'unverified',
  verification_channel: null,
  last_checked_at: null,
  verified_by: null,
  verified_at: null,
  admin_notes: null,
  is_renewable: true,
  created_at: '2026-02-01T10:00:00.000Z',
  updated_at: '2026-02-01T10:00:00.000Z',
  producer: {
    id: mockProducerId,
    name: 'Coopérative Vanille Sambava',
    country: 'Madagascar'
  },
  certification_body: mockCertificationBody,
  certification_standard: {
    id: mockStandardId,
    certification_body_id: mockBodyId,
    code: 'BIO-EU',
    name: 'Agriculture Biologique UE',
    type: 'organic',
    description: 'Règlement européen Bio',
    scope: 'Production agricole',
    validity_duration_months: 12,
    created_at: '2026-01-01T00:00:00.000Z'
  },
  verified_by_profile: null
};

/**
 * Certification producteur expirée
 */
export const mockProducerCertificationExpired: ProducerCertification = {
  ...mockProducerCertification,
  id: 'c2eebd77-7a2b-4cd6-994b-4997bd160c34',
  certificate_number: 'EXP-2025-001',
  expires_at: '2025-12-31T00:00:00.000Z',
  status: 'expired'
};

/**
 * Certification expirant dans 15 jours
 */
const date15DaysAhead = new Date();
date15DaysAhead.setDate(date15DaysAhead.getDate() + 15);

export const mockProducerCertificationExpiringSoon: ProducerCertification = {
  ...mockProducerCertification,
  id: 'c2eebd77-7a2b-4cd6-994b-4997bd160c35',
  certificate_number: 'SOON-2026-002',
  expires_at: date15DaysAhead.toISOString().split('T')[0],
  status: 'verified'
};

/**
 * Log d'audit de vérification
 */
export const mockVerificationLog: CertificationVerificationLog = {
  id: '99aa88bb-77cc-66dd-55ee-44ff33aa22bb',
  producer_certification_id: mockCertificationId,
  admin_id: mockAdminId,
  action: 'STATUS_UPDATED',
  previous_status: 'unverified',
  new_status: 'verified',
  channel_used: 'manual',
  details: { adminNotes: 'Attestation vérifiée sur registre officiel' },
  created_at: '2026-02-14T09:00:00.000Z',
  admin_profile: {
    id: mockAdminId,
    first_name: 'Sophie',
    last_name: 'Auditeur',
    email: 'sophie.audit@ethimarket.com'
  }
};

/**
 * Demande de vérification
 */
export const mockVerificationRequest: CertificationVerificationRequest = {
  id: mockRequestId,
  producer_certification_id: mockCertificationId,
  certification_body_id: mockBodyId,
  triggered_by: mockAdminId,
  channel: 'email',
  status: 'sent',
  message_sent: 'Objet: Demande de vérification\n\nDestinataire: compliance@ecocert.com',
  response_received: null,
  sent_at: '2026-02-14T08:30:00.000Z',
  responded_at: null,
  created_at: '2026-02-14T08:30:00.000Z',
  triggered_by_profile: {
    id: mockAdminId,
    first_name: 'Sophie',
    last_name: 'Auditeur',
    email: 'sophie.audit@ethimarket.com'
  },
  certification_body: mockCertificationBody
};

/**
 * Modèle de message template
 */
export const mockTemplate: CertificationMessageTemplate = {
  id: mockTemplateId,
  name: 'Email officiel de vérification (Français)',
  language: 'fr',
  channel: 'email',
  subject: 'Demande de vérification de certification — {{certification_body_name}} / {{platform_name}}',
  body: 'Bonjour {{admin_name}}, nous vérifions le certificat {{certificate_number}} de {{producer_name}} émis le {{issued_at}} par {{certification_body_name}}.',
  variables: [
    'producer_name',
    'certificate_number',
    'certification_body_name',
    'issued_at',
    'expires_at',
    'platform_name',
    'admin_name',
    'admin_email'
  ],
  is_default: true,
  created_by: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z'
};

/**
 * Dictionnaire complet de variables de templates
 */
export const mockTemplateVariables: TemplateVariables = {
  producer_name: 'Jean Dupont',
  certificate_number: 'ECO-2026-88912',
  certification_type: 'Agriculture Biologique',
  certification_body_name: 'Ecocert International',
  issued_at: '2026-01-15',
  expires_at: '2027-01-15',
  document_url: 'https://storage.ethimarket.com/certs/eco-2026-88912.pdf',
  platform_name: 'EthiMarket',
  admin_name: 'Sophie Auditeur',
  admin_email: 'sophie.audit@ethimarket.com'
};

/**
 * Statistiques complètes pour le tableau de bord
 */
export const mockDashboardStats: CertificationDashboardStats = {
  total: 10,
  unverified: 2,
  pending: 1,
  contact_sent: 2,
  verified: 4,
  rejected: 1,
  expired: 0,
  manual_required: 0,
  expiring_soon: 1,
  by_region: {
    Africa: 4,
    Asia: 2,
    'Latin America': 2,
    Europe: 2,
    'North America': 0,
    Oceania: 0,
    'Middle East': 0
  }
};
