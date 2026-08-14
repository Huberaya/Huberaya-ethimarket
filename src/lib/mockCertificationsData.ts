import type {
  ProducerCertification,
  CertificationBody,
  CertificationVerificationLog,
  CertificationVerificationRequest
} from './supabase';

export const DEMO_CERTIFICATION_BODIES: Record<string, CertificationBody> = {
  ecocert: {
    id: 'b0000000-0000-0000-0000-000000000001',
    name: 'Ecocert International',
    acronym: 'ECOCERT',
    country: 'France',
    region: 'Europe',
    sub_region: 'Western Europe',
    website: 'https://www.ecocert.com',
    verification_url: 'https://certstatus.ecocert.com',
    api_endpoint: 'https://api.ecocert.com/v1/verify',
    api_key_required: true,
    email_contact: 'compliance@ecocert.com',
    phone: '+33562071101',
    whatsapp: '+33600000000',
    contact_form_url: 'https://www.ecocert.com/fr/contact-verification',
    logo_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=100',
    languages: ['fr', 'en', 'es'],
    is_active: true,
    trust_level: 'verified',
    internal_notes: 'Organisme international leader de la certification bio',
    created_at: '2026-01-01T00:00:00.000Z',
    last_updated_at: '2026-01-01T00:00:00.000Z'
  },
  flocert: {
    id: 'b0000000-0000-0000-0000-000000000002',
    name: 'FLOCERT (Fairtrade International)',
    acronym: 'FLOCERT',
    country: 'Allemagne',
    region: 'Europe',
    sub_region: 'Western Europe',
    website: 'https://www.flocert.net',
    verification_url: 'https://www.flocert.net/find-fairtrade-partners/',
    api_endpoint: null,
    api_key_required: false,
    email_contact: 'applications@flocert.net',
    phone: '+4922824930',
    whatsapp: '+491700000000',
    contact_form_url: 'https://www.flocert.net/contact/',
    logo_url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=100',
    languages: ['en', 'fr', 'es', 'de'],
    is_active: true,
    trust_level: 'verified',
    internal_notes: 'Organisme certificateur officiel du label Fairtrade',
    created_at: '2026-01-01T00:00:00.000Z',
    last_updated_at: '2026-01-01T00:00:00.000Z'
  },
  africert: {
    id: 'b0000000-0000-0000-0000-000000000003',
    name: 'Africert Limited',
    acronym: 'AFRICERT',
    country: 'Kenya',
    region: 'Africa',
    sub_region: 'Eastern Africa',
    website: 'http://www.africertlimited.co.ke',
    verification_url: null,
    api_endpoint: null,
    api_key_required: false,
    email_contact: 'info@africertlimited.co.ke',
    phone: '+25420808133',
    whatsapp: '+254715000000',
    contact_form_url: 'http://www.africertlimited.co.ke/contact-us/',
    logo_url: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=100',
    languages: ['en', 'sw'],
    is_active: true,
    trust_level: 'verified',
    internal_notes: 'Spécialiste Afrique de l\'Est (Café, Thé, Horticulture)',
    created_at: '2026-01-01T00:00:00.000Z',
    last_updated_at: '2026-01-01T00:00:00.000Z'
  },
  biolatina: {
    id: 'b0000000-0000-0000-0000-000000000004',
    name: 'Biolatina Certificadora',
    acronym: 'BIOLATINA',
    country: 'Pérou',
    region: 'Latin America',
    sub_region: 'South America',
    website: 'http://www.biolatina.com',
    verification_url: 'http://www.biolatina.com/operadores-certificados',
    api_endpoint: null,
    api_key_required: false,
    email_contact: 'info@biolatina.com',
    phone: '+5114451234',
    whatsapp: '+51987654321',
    contact_form_url: 'http://www.biolatina.com/contacto',
    logo_url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=100',
    languages: ['es', 'en', 'pt'],
    is_active: true,
    trust_level: 'verified',
    internal_notes: 'Leader de la certification bio et SPP en Amérique Andine',
    created_at: '2026-01-01T00:00:00.000Z',
    last_updated_at: '2026-01-01T00:00:00.000Z'
  },
  controlUnion: {
    id: 'b0000000-0000-0000-0000-000000000005',
    name: 'Control Union Sri Lanka',
    acronym: 'CU',
    country: 'Sri Lanka',
    region: 'Asia',
    sub_region: 'Southern Asia',
    website: 'https://www.controlunion.com',
    verification_url: 'https://www.controlunion.com/certifications/search',
    api_endpoint: 'https://api.controlunion.com/v2/certifications/verify',
    api_key_required: true,
    email_contact: 'cusrilanka@controlunion.com',
    phone: '+94112678888',
    whatsapp: '+94770000000',
    contact_form_url: 'https://www.controlunion.com/contact',
    logo_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100',
    languages: ['en', 'si', 'ta'],
    is_active: true,
    trust_level: 'verified',
    internal_notes: 'Organisme international spécialisé dans le thé et les épices bio',
    created_at: '2026-01-01T00:00:00.000Z',
    last_updated_at: '2026-01-01T00:00:00.000Z'
  },
  aditiOrganic: {
    id: 'b0000000-0000-0000-0000-000000000006',
    name: 'Aditi Organic Certifications',
    acronym: 'ADITI',
    country: 'Inde',
    region: 'Asia',
    sub_region: 'Southern Asia',
    website: 'https://www.aditicert.net',
    verification_url: 'https://www.aditicert.net/certified-clients',
    api_endpoint: null,
    api_key_required: false,
    email_contact: 'aditi@aditicert.net',
    phone: '+91802360703',
    whatsapp: '+919448000000',
    contact_form_url: 'https://www.aditicert.net/contact-us',
    logo_url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=100',
    languages: ['en', 'hi', 'kn'],
    is_active: true,
    trust_level: 'verified',
    internal_notes: 'Accréditation NPOP, NOP (USDA) et Bio UE',
    created_at: '2026-01-01T00:00:00.000Z',
    last_updated_at: '2026-01-01T00:00:00.000Z'
  },
  certimex: {
    id: 'b0000000-0000-0000-0000-000000000007',
    name: 'Certimex (Certificadora Mexicana)',
    acronym: 'CERTIMEX',
    country: 'Mexique',
    region: 'Latin America',
    sub_region: 'Central America',
    website: 'http://www.certimex.org',
    verification_url: 'http://www.certimex.org/directorio-operadores',
    api_endpoint: null,
    api_key_required: false,
    email_contact: 'certimex@certimex.org',
    phone: '+529515169046',
    whatsapp: '+529511234567',
    contact_form_url: 'http://www.certimex.org/contacto',
    logo_url: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=100',
    languages: ['es', 'en'],
    is_active: true,
    trust_level: 'verified',
    internal_notes: 'Pionnier de la certification café bio et équitable au Mexique',
    created_at: '2026-01-01T00:00:00.000Z',
    last_updated_at: '2026-01-01T00:00:00.000Z'
  },
  envirocert: {
    id: 'b0000000-0000-0000-0000-000000000008',
    name: 'Envirocert Côte d\'Ivoire',
    acronym: 'ENVIROCERT',
    country: 'Côte d\'Ivoire',
    region: 'Africa',
    sub_region: 'Western Africa',
    website: 'http://www.envirocert-ci.org',
    verification_url: null,
    api_endpoint: null,
    api_key_required: false,
    email_contact: 'audit@envirocert-ci.org',
    phone: '+22527224488',
    whatsapp: '+2250708091011',
    contact_form_url: null,
    logo_url: 'https://images.unsplash.com/photo-1534951009808-766178b47a4f?w=100',
    languages: ['fr'],
    is_active: true,
    trust_level: 'verified',
    internal_notes: 'Organisme auditeur filière Cacao et Anacarde durable',
    created_at: '2026-01-01T00:00:00.000Z',
    last_updated_at: '2026-01-01T00:00:00.000Z'
  }
};

// Date helper pour expiration
const now = new Date();
const inDays = (d: number) => {
  const target = new Date(now.getTime() + d * 86400000);
  return target.toISOString().split('T')[0];
};

export const DEMO_PRODUCER_CERTIFICATIONS: ProducerCertification[] = [
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    producer_id: 'p1000000-0000-0000-0000-000000000001',
    certification_body_id: DEMO_CERTIFICATION_BODIES.ecocert.id,
    certification_standard_id: 's1000000-0000-0000-0000-000000000001',
    certification_type: 'organic',
    certificate_number: 'ECO-2026-MG-88912',
    issued_at: '2026-01-10',
    expires_at: inDays(240),
    document_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    document_path: 'certifications/eco-2026-mg-88912.pdf',
    country_of_issue: 'Madagascar',
    status: 'unverified',
    admin_notes: 'Nouveau certificat téléversé pour la vanille Bourbon Grand Cru.',
    verified_by: null,
    verified_at: null,
    is_expired: false,
    expires_soon: false,
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-12T14:20:00Z',
    producer: {
      id: 'p1000000-0000-0000-0000-000000000001',
      name: 'Coopérative Vanille Sambava',
      country: 'Madagascar'
    },
    certification_body: DEMO_CERTIFICATION_BODIES.ecocert,
    certification_standard: {
      id: 's1000000-0000-0000-0000-000000000001',
      certification_body_id: DEMO_CERTIFICATION_BODIES.ecocert.id,
      code: 'BIO-EU',
      name: 'Agriculture Biologique (Union Européenne)',
      type: 'organic',
      description: 'Règlement CE n° 834/2007 et UE 2018/848',
      scope: 'Cultures pérennes, épices et vanille',
      validity_duration_months: 12,
      created_at: '2026-01-01T00:00:00Z'
    }
  },
  {
    id: 'c1000000-0000-0000-0000-000000000002',
    producer_id: 'p1000000-0000-0000-0000-000000000002',
    certification_body_id: DEMO_CERTIFICATION_BODIES.flocert.id,
    certification_standard_id: 's1000000-0000-0000-0000-000000000002',
    certification_type: 'fair_trade',
    certificate_number: 'FLO-ID-CIV-44910',
    issued_at: '2025-11-15',
    expires_at: inDays(190),
    document_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
    document_path: 'certifications/flo-civ-44910.pdf',
    country_of_issue: 'Côte d\'Ivoire',
    status: 'contact_sent',
    admin_notes: 'Email automatique de contrôle envoyé au secrétariat FLOCERT.',
    verified_by: null,
    verified_at: null,
    is_expired: false,
    expires_soon: false,
    created_at: '2026-01-20T08:30:00Z',
    updated_at: '2026-02-14T09:15:00Z',
    producer: {
      id: 'p1000000-0000-0000-0000-000000000002',
      name: 'Coopérative Cacao Équitable San Pedro',
      country: 'Côte d\'Ivoire'
    },
    certification_body: DEMO_CERTIFICATION_BODIES.flocert,
    certification_standard: {
      id: 's1000000-0000-0000-0000-000000000002',
      certification_body_id: DEMO_CERTIFICATION_BODIES.flocert.id,
      code: 'FAIRTRADE-FLO',
      name: 'Standard du Commerce Équitable Fairtrade',
      type: 'fair_trade',
      description: 'Garantie de prix minimum garanti et prime de développement',
      scope: 'Cacao, café, canne à sucre',
      validity_duration_months: 12,
      created_at: '2026-01-01T00:00:00Z'
    }
  },
  {
    id: 'c1000000-0000-0000-0000-000000000003',
    producer_id: 'p1000000-0000-0000-0000-000000000003',
    certification_body_id: DEMO_CERTIFICATION_BODIES.biolatina.id,
    certification_standard_id: 's1000000-0000-0000-0000-000000000003',
    certification_type: 'organic',
    certificate_number: 'SPP-BL-COL-8921',
    issued_at: '2025-06-01',
    expires_at: inDays(110),
    document_url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800',
    document_path: 'certifications/spp-bl-col-8921.pdf',
    country_of_issue: 'Colombie',
    status: 'verified',
    admin_notes: 'Vérifié avec succès via le registre public Biolatina.',
    verified_by: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    verified_at: '2026-01-15T11:00:00Z',
    is_expired: false,
    expires_soon: false,
    created_at: '2026-01-10T14:00:00Z',
    updated_at: '2026-01-15T11:00:00Z',
    producer: {
      id: 'p1000000-0000-0000-0000-000000000003',
      name: 'Café Sierra Nevada Orgánico',
      country: 'Colombie'
    },
    certification_body: DEMO_CERTIFICATION_BODIES.biolatina,
    certification_standard: {
      id: 's1000000-0000-0000-0000-000000000003',
      certification_body_id: DEMO_CERTIFICATION_BODIES.biolatina.id,
      code: 'SPP-GLOBAL',
      name: 'Símbolo de Pequeños Productores (SPP)',
      type: 'fair_trade',
      description: 'Certification équitable gouvernée par les petits producteurs',
      scope: 'Café de haute altitude et fruits tropicaux',
      validity_duration_months: 12,
      created_at: '2026-01-01T00:00:00Z'
    },
    verified_by_profile: {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      first_name: 'Sophie',
      last_name: 'Auditeur',
      email: 'admin.audit@ethimarket.com'
    }
  },
  {
    id: 'c1000000-0000-0000-0000-000000000004',
    producer_id: 'p1000000-0000-0000-0000-000000000004',
    certification_body_id: DEMO_CERTIFICATION_BODIES.ecocert.id,
    certification_standard_id: 's1000000-0000-0000-0000-000000000001',
    certification_type: 'organic',
    certificate_number: 'FR-BIO-01-2025-994',
    issued_at: '2025-03-10',
    expires_at: inDays(25), // Expire bientôt
    document_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
    document_path: 'certifications/fr-bio-01-2025.pdf',
    country_of_issue: 'France',
    status: 'verified',
    admin_notes: 'Attestation AB France vérifiée. Renouvellement à surveiller.',
    verified_by: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    verified_at: '2025-03-20T16:30:00Z',
    is_expired: false,
    expires_soon: true,
    created_at: '2025-03-15T09:00:00Z',
    updated_at: '2026-02-10T11:00:00Z',
    producer: {
      id: 'p1000000-0000-0000-0000-000000000004',
      name: 'Domaine Oléicole de Haute-Provence',
      country: 'France'
    },
    certification_body: DEMO_CERTIFICATION_BODIES.ecocert,
    certification_standard: {
      id: 's1000000-0000-0000-0000-000000000001',
      certification_body_id: DEMO_CERTIFICATION_BODIES.ecocert.id,
      code: 'BIO-EU',
      name: 'Agriculture Biologique (AB France & UE)',
      type: 'organic',
      description: 'Norme européenne Bio',
      scope: 'Huiles d\'olive et herbes aromatiques',
      validity_duration_months: 12,
      created_at: '2026-01-01T00:00:00Z'
    },
    verified_by_profile: {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      first_name: 'Sophie',
      last_name: 'Auditeur',
      email: 'admin.audit@ethimarket.com'
    }
  },
  {
    id: 'c1000000-0000-0000-0000-000000000005',
    producer_id: 'p1000000-0000-0000-0000-000000000005',
    certification_body_id: DEMO_CERTIFICATION_BODIES.controlUnion.id,
    certification_standard_id: 's1000000-0000-0000-0000-000000000005',
    certification_type: 'rainforest_alliance',
    certificate_number: 'RA-LK-2026-1088',
    issued_at: '2025-08-01',
    expires_at: inDays(170),
    document_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
    document_path: 'certifications/ra-lk-2026.pdf',
    country_of_issue: 'Sri Lanka',
    status: 'manual_required',
    admin_notes: 'L\'API Control Union a renvoyé un audit complémentaire nécessaire.',
    verified_by: null,
    verified_at: null,
    is_expired: false,
    expires_soon: false,
    created_at: '2026-01-28T12:00:00Z',
    updated_at: '2026-02-13T16:45:00Z',
    producer: {
      id: 'p1000000-0000-0000-0000-000000000005',
      name: 'Association des Producteurs de Thé Nuwara Eliya',
      country: 'Sri Lanka'
    },
    certification_body: DEMO_CERTIFICATION_BODIES.controlUnion,
    certification_standard: {
      id: 's1000000-0000-0000-0000-000000000005',
      certification_body_id: DEMO_CERTIFICATION_BODIES.controlUnion.id,
      code: 'RAINFOREST-2020',
      name: 'Rainforest Alliance Sustainable Agriculture Standard',
      type: 'rainforest_alliance',
      description: 'Préservation des écosystèmes et droits des travailleurs',
      scope: 'Thé noir, thé vert et épices de Ceylan',
      validity_duration_months: 12,
      created_at: '2026-01-01T00:00:00Z'
    }
  },
  {
    id: 'c1000000-0000-0000-0000-000000000006',
    producer_id: 'p1000000-0000-0000-0000-000000000006',
    certification_body_id: DEMO_CERTIFICATION_BODIES.ecocert.id,
    certification_standard_id: 's1000000-0000-0000-0000-000000000001',
    certification_type: 'organic',
    certificate_number: 'BIO-MA-2024-0091',
    issued_at: '2024-05-10',
    expires_at: inDays(-45), // Expiré
    document_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
    document_path: 'certifications/bio-ma-2024.pdf',
    country_of_issue: 'Maroc',
    status: 'expired',
    admin_notes: 'Certificat expiré il y a 45 jours. Demande de renouvellement envoyée au producteur.',
    verified_by: null,
    verified_at: null,
    is_expired: true,
    expires_soon: false,
    created_at: '2024-05-15T10:00:00Z',
    updated_at: '2026-01-05T09:00:00Z',
    producer: {
      id: 'p1000000-0000-0000-0000-000000000006',
      name: 'Coopérative Féminine Argania Souss',
      country: 'Maroc'
    },
    certification_body: DEMO_CERTIFICATION_BODIES.ecocert,
    certification_standard: {
      id: 's1000000-0000-0000-0000-000000000001',
      certification_body_id: DEMO_CERTIFICATION_BODIES.ecocert.id,
      code: 'BIO-MAROC',
      name: 'Agriculture Biologique Maroc (ONSSA / Ecocert)',
      type: 'organic',
      description: 'Loi n° 39-12 relative à la production biologique',
      scope: 'Huile d\'argan cosmétique et alimentaire',
      validity_duration_months: 12,
      created_at: '2026-01-01T00:00:00Z'
    }
  },
  {
    id: 'c1000000-0000-0000-0000-000000000007',
    producer_id: 'p1000000-0000-0000-0000-000000000007',
    certification_body_id: DEMO_CERTIFICATION_BODIES.aditiOrganic.id,
    certification_standard_id: 's1000000-0000-0000-0000-000000000006',
    certification_type: 'organic',
    certificate_number: 'NPOP-IN-2026-5541',
    issued_at: '2026-01-05',
    expires_at: inDays(320),
    document_url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800',
    document_path: 'certifications/npop-in-5541.pdf',
    country_of_issue: 'Inde',
    status: 'pending',
    admin_notes: 'En attente du retour de confirmation du portail NPOP Inde.',
    verified_by: null,
    verified_at: null,
    is_expired: false,
    expires_soon: false,
    created_at: '2026-01-25T11:30:00Z',
    updated_at: '2026-02-11T14:10:00Z',
    producer: {
      id: 'p1000000-0000-0000-0000-000000000007',
      name: 'Himalayan Organic Basmati Rice Growers',
      country: 'Inde'
    },
    certification_body: DEMO_CERTIFICATION_BODIES.aditiOrganic,
    certification_standard: {
      id: 's1000000-0000-0000-0000-000000000006',
      certification_body_id: DEMO_CERTIFICATION_BODIES.aditiOrganic.id,
      code: 'NPOP-INDIA',
      name: 'National Programme for Organic Production (NPOP India)',
      type: 'organic',
      description: 'Standard national indien reconnu par l\'Union Européenne',
      scope: 'Riz Basmati, curcuma et épices',
      validity_duration_months: 12,
      created_at: '2026-01-01T00:00:00Z'
    }
  },
  {
    id: 'c1000000-0000-0000-0000-000000000008',
    producer_id: 'p1000000-0000-0000-0000-000000000008',
    certification_body_id: DEMO_CERTIFICATION_BODIES.certimex.id,
    certification_standard_id: 's1000000-0000-0000-0000-000000000007',
    certification_type: 'fair_trade',
    certificate_number: 'CERTIMEX-OAX-2025-77',
    issued_at: '2025-04-12',
    expires_at: inDays(60),
    document_url: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800',
    document_path: 'certifications/certimex-oax-77.pdf',
    country_of_issue: 'Mexique',
    status: 'verified',
    admin_notes: 'Certificat vérifié via l\'annuaire public des producteurs certifiés Certimex.',
    verified_by: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    verified_at: '2025-04-20T10:00:00Z',
    is_expired: false,
    expires_soon: false,
    created_at: '2025-04-15T15:00:00Z',
    updated_at: '2025-04-20T10:00:00Z',
    producer: {
      id: 'p1000000-0000-0000-0000-000000000008',
      name: 'Finca Café Pluma Hidalgo Oaxaca',
      country: 'Mexique'
    },
    certification_body: DEMO_CERTIFICATION_BODIES.certimex,
    certification_standard: {
      id: 's1000000-0000-0000-0000-000000000007',
      certification_body_id: DEMO_CERTIFICATION_BODIES.certimex.id,
      code: 'CERTIMEX-BIO-SPP',
      name: 'Norma Orgánica y Comercio Justo CERTIMEX',
      type: 'fair_trade',
      description: 'Café d\'ombre et pratiques agroécologiques de Oaxaca',
      scope: 'Café Arabica Typica et Bourbon',
      validity_duration_months: 12,
      created_at: '2026-01-01T00:00:00Z'
    },
    verified_by_profile: {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      first_name: 'Sophie',
      last_name: 'Auditeur',
      email: 'admin.audit@ethimarket.com'
    }
  },
  {
    id: 'c1000000-0000-0000-0000-000000000009',
    producer_id: 'p1000000-0000-0000-0000-000000000009',
    certification_body_id: DEMO_CERTIFICATION_BODIES.africert.id,
    certification_standard_id: 's1000000-0000-0000-0000-000000000003',
    certification_type: 'organic',
    certificate_number: 'AFRICERT-KE-2025-11',
    issued_at: '2025-02-10',
    expires_at: inDays(-10), // Expiré récemment
    document_url: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800',
    document_path: 'certifications/africert-ke-11.pdf',
    country_of_issue: 'Kenya',
    status: 'rejected',
    admin_notes: 'Document altéré ou falsifié. Le numéro ne correspond à aucun audit officiel.',
    verified_by: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    verified_at: '2026-02-05T14:00:00Z',
    is_expired: true,
    expires_soon: false,
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-05T14:00:00Z',
    producer: {
      id: 'p1000000-0000-0000-0000-000000000009',
      name: 'Mount Kenya Organic Herbs & Macadamia',
      country: 'Kenya'
    },
    certification_body: DEMO_CERTIFICATION_BODIES.africert,
    certification_standard: {
      id: 's1000000-0000-0000-0000-000000000003',
      certification_body_id: DEMO_CERTIFICATION_BODIES.africert.id,
      code: 'EAOPS-ORGANIC',
      name: 'East African Organic Products Standard (Kilimohai)',
      type: 'organic',
      description: 'Standard biologique harmonisé pour l\'Afrique de l\'Est',
      scope: 'Noix de macadamia, avocat et herbes médicinales',
      validity_duration_months: 12,
      created_at: '2026-01-01T00:00:00Z'
    },
    verified_by_profile: {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      first_name: 'Sophie',
      last_name: 'Auditeur',
      email: 'admin.audit@ethimarket.com'
    }
  }
];

export const DEMO_VERIFICATION_LOGS: Record<string, CertificationVerificationLog[]> = {
  'c1000000-0000-0000-0000-000000000001': [
    {
      id: 'l1000000-0000-0000-0000-000000000001',
      producer_certification_id: 'c1000000-0000-0000-0000-000000000001',
      admin_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      action: 'CERTIFICATION_SUBMITTED',
      previous_status: null,
      new_status: 'unverified',
      channel_used: null,
      details: { certificate_number: 'ECO-2026-MG-88912', producer: 'Coopérative Vanille Sambava' },
      created_at: '2026-02-01T10:00:00Z',
      admin_profile: {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        first_name: 'Système',
        last_name: 'Automatique',
        email: 'system@ethimarket.com'
      }
    }
  ],
  'c1000000-0000-0000-0000-000000000002': [
    {
      id: 'l1000000-0000-0000-0000-000000000002',
      producer_certification_id: 'c1000000-0000-0000-0000-000000000002',
      admin_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      action: 'EMAIL_SENT',
      previous_status: 'unverified',
      new_status: 'contact_sent',
      channel_used: 'email',
      details: { recipient: 'applications@flocert.net', certificate_number: 'FLO-ID-CIV-44910' },
      created_at: '2026-02-14T09:15:00Z',
      admin_profile: {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        first_name: 'Sophie',
        last_name: 'Auditeur',
        email: 'admin.audit@ethimarket.com'
      }
    }
  ],
  'c1000000-0000-0000-0000-000000000003': [
    {
      id: 'l1000000-0000-0000-0000-000000000003',
      producer_certification_id: 'c1000000-0000-0000-0000-000000000003',
      admin_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      action: 'STATUS_UPDATED',
      previous_status: 'unverified',
      new_status: 'verified',
      channel_used: 'manual',
      details: { adminNotes: 'Vérifié avec succès via le registre public Biolatina.' },
      created_at: '2026-01-15T11:00:00Z',
      admin_profile: {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        first_name: 'Sophie',
        last_name: 'Auditeur',
        email: 'admin.audit@ethimarket.com'
      }
    }
  ]
};

export const DEMO_VERIFICATION_REQUESTS: Record<string, CertificationVerificationRequest[]> = {
  'c1000000-0000-0000-0000-000000000002': [
    {
      id: 'r1000000-0000-0000-0000-000000000001',
      producer_certification_id: 'c1000000-0000-0000-0000-000000000002',
      certification_body_id: DEMO_CERTIFICATION_BODIES.flocert.id,
      triggered_by: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      channel: 'email',
      status: 'sent',
      message_sent: 'Objet: Demande de confirmation de certification Fairtrade — Réf: FLO-ID-CIV-44910\n\nÀ l\'attention du département de conformité FLOCERT,\n\nNous vous prions de bien vouloir confirmer l\'authenticité et la validité du certificat ci-dessous :\n- Opérateur : Coopérative Cacao Équitable San Pedro\n- N° de certificat : FLO-ID-CIV-44910\n\nCordialement,\nL\'équipe d\'audit EthiMarket',
      response_received: null,
      sent_at: '2026-02-14T09:15:00Z',
      responded_at: null,
      created_at: '2026-02-14T09:15:00Z',
      triggered_by_profile: {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        first_name: 'Sophie',
        last_name: 'Auditeur',
        email: 'admin.audit@ethimarket.com'
      },
      certification_body: DEMO_CERTIFICATION_BODIES.flocert
    }
  ]
};
