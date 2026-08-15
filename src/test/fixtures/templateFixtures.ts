import type {
  CertificationMessageTemplate,
  TemplateVariables
} from '../../lib/supabase';

export const mockAdminUserId = 'a0000000-0000-0000-0000-000000000001';

export const mockTemplateVariables: TemplateVariables = {
  producer_name: 'Coopérative Bio Sud',
  producer_company: 'Bio Sud SAS',
  producer_email: 'contact@biosud.fr',
  producer_phone: '+33 6 12 34 56 78',
  producer_address: '12 Rue des Oliviers, 13001 Marseille, France',
  certificate_number: 'FR-BIO-01-998822',
  certification_body_name: 'Ecocert France SAS',
  certification_body_email: 'certif@ecocert.com',
  certification_body_phone: '+33 5 62 07 34 24',
  certification_body_website: 'https://www.ecocert.com',
  standards_list: 'Agriculture Biologique (AB), Bio Européen (Eurofeuille)',
  issue_date: '15/01/2024',
  expiry_date: '14/01/2027',
  verification_link: 'https://ethimarket.com/verify/cert/abc123xyz',
  product_name: 'Huile d\'Olive Vierge Extra Bio 500ml',
  today_date: '15/08/2026'
};

export const mockEmailTemplateFR: CertificationMessageTemplate = {
  id: 'tpl-email-fr-1',
  name: 'Email de vérification standard (FR)',
  title: 'Email de vérification standard (FR)',
  language: 'fr',
  channel: 'email',
  subject: 'Demande de vérification de certification - {certificate_number}',
  body: `Bonjour l'équipe {certification_body_name},

Nous vous contactons dans le cadre de la vérification de la certification du producteur {producer_name}.

Détails du certificat :
- Numéro : {certificate_number}
- Producteur : {producer_name} ({producer_company})
- Normes : {standards_list}
- Date d'émission : {issue_date}
- Date d'expiration : {expiry_date}

Vous pouvez confirmer la validité de ce certificat en cliquant sur ce lien :
{verification_link}

Cordialement,
L'équipe EthiMarket`,
  variables: [
    'certification_body_name',
    'producer_name',
    'certificate_number',
    'producer_company',
    'standards_list',
    'issue_date',
    'expiry_date',
    'verification_link'
  ],
  is_default: true,
  is_active: true,
  version: 1,
  created_at: '2026-08-14T00:00:00.000Z',
  updated_at: '2026-08-14T00:00:00.000Z'
};

export const mockEmailTemplateEN: CertificationMessageTemplate = {
  id: 'tpl-email-en-1',
  name: 'Standard Verification Email (EN)',
  title: 'Standard Verification Email (EN)',
  language: 'en',
  channel: 'email',
  subject: 'Certification Verification Request - {certificate_number}',
  body: `Dear {certification_body_name} team,

We are contacting you regarding the verification of certification for producer {producer_name}.

Certificate details:
- Number: {certificate_number}
- Producer: {producer_name} ({producer_company})
- Standards: {standards_list}
- Expiration: {expiry_date}

Please confirm certificate validity at:
{verification_link}

Best regards,
The EthiMarket Verification Team`,
  variables: [
    'certification_body_name',
    'producer_name',
    'certificate_number',
    'producer_company',
    'standards_list',
    'expiry_date',
    'verification_link'
  ],
  is_default: true,
  is_active: true,
  version: 1,
  created_at: '2026-08-14T00:00:00.000Z',
  updated_at: '2026-08-14T00:00:00.000Z'
};

export const mockWhatsAppTemplate: CertificationMessageTemplate = {
  id: 'tpl-wa-fr-1',
  name: 'Notification WhatsApp (FR)',
  title: 'Notification WhatsApp (FR)',
  language: 'fr',
  channel: 'whatsapp',
  subject: null,
  body: `Bonjour {certification_body_name}, merci de confirmer le certificat N° {certificate_number} pour {producer_name}. Lien direct : {verification_link}`,
  variables: ['certification_body_name', 'certificate_number', 'producer_name', 'verification_link'],
  is_default: true,
  is_active: true,
  version: 1,
  created_at: '2026-08-14T00:00:00.000Z',
  updated_at: '2026-08-14T00:00:00.000Z'
};

export const mockAPITemplate: CertificationMessageTemplate = {
  id: 'tpl-api-fr-1',
  name: 'Payload JSON Requête API (FR)',
  title: 'Payload JSON Requête API (FR)',
  language: 'fr',
  channel: 'api',
  subject: 'POST /v1/certifications/verify',
  body: JSON.stringify(
    {
      action: 'verify_certificate',
      certificate_number: '{certificate_number}',
      producer_name: '{producer_name}',
      standards: '{standards_list}',
      verification_url: '{verification_link}'
    },
    null,
    2
  ),
  variables: ['certificate_number', 'producer_name', 'standards_list', 'verification_link'],
  is_default: true,
  is_active: true,
  version: 1,
  created_at: '2026-08-14T00:00:00.000Z',
  updated_at: '2026-08-14T00:00:00.000Z'
};

export const mockTemplateWithVersion: CertificationMessageTemplate = {
  id: 'tpl-versioned-1',
  name: 'Modèle avec Version 2',
  title: 'Modèle avec Version 2',
  language: 'fr',
  channel: 'email',
  subject: 'Objet Modifié Version 2 - {certificate_number}',
  body: 'Corps modifié pour {producer_name} et {certificate_number}',
  variables: ['producer_name', 'certificate_number'],
  is_default: false,
  is_active: true,
  version: 2,
  previous_version: {
    version: 1,
    saved_at: '2026-08-14T10:00:00.000Z',
    subject: 'Objet Initial Version 1 - {certificate_number}',
    body: 'Corps initial v1 pour {producer_name}',
    variables: ['producer_name']
  },
  created_at: '2026-08-14T09:00:00.000Z',
  updated_at: '2026-08-14T11:00:00.000Z'
};

export const mockTemplateWithInvalidVariables: CertificationMessageTemplate = {
  id: 'tpl-invalid-vars-1',
  name: 'Modèle Variables Invalides',
  title: 'Modèle Variables Invalides',
  language: 'fr',
  channel: 'email',
  subject: 'Vérification {random_custom_var}',
  body: 'Bonjour {producer_name}, voici votre faux code {invalid_token_code} et {secret_foo_bar}.',
  variables: ['random_custom_var', 'producer_name', 'invalid_token_code', 'secret_foo_bar'],
  is_default: false,
  is_active: true,
  version: 1,
  created_at: '2026-08-14T00:00:00.000Z',
  updated_at: '2026-08-14T00:00:00.000Z'
};

export const mockTemplatesArray: CertificationMessageTemplate[] = [
  mockEmailTemplateFR,
  mockEmailTemplateEN,
  {
    id: 'tpl-email-es',
    name: 'Email de verificación (ES)',
    title: 'Email de verificación (ES)',
    language: 'es',
    channel: 'email',
    subject: 'Solicitud de verificación - {certificate_number}',
    body: 'Estimado equipo {certification_body_name}, confirmación para {producer_name} : {verification_link}',
    variables: ['certification_body_name', 'certificate_number', 'producer_name', 'verification_link'],
    is_default: true,
    is_active: true,
    version: 1,
    created_at: '2026-08-14T00:00:00.000Z',
    updated_at: '2026-08-14T00:00:00.000Z'
  },
  {
    id: 'tpl-email-pt',
    name: 'Email de verificação (PT)',
    title: 'Email de verificação (PT)',
    language: 'pt',
    channel: 'email',
    subject: 'Pedido de verificação - {certificate_number}',
    body: 'Prezada equipe {certification_body_name}, confirmação para {producer_name} : {verification_link}',
    variables: ['certification_body_name', 'certificate_number', 'producer_name', 'verification_link'],
    is_default: true,
    is_active: true,
    version: 1,
    created_at: '2026-08-14T00:00:00.000Z',
    updated_at: '2026-08-14T00:00:00.000Z'
  },
  mockWhatsAppTemplate,
  {
    id: 'tpl-wa-en-1',
    name: 'WhatsApp Notification (EN)',
    title: 'WhatsApp Notification (EN)',
    language: 'en',
    channel: 'whatsapp',
    subject: null,
    body: 'Hello {certification_body_name}, please verify certificate {certificate_number} for {producer_name}. Link: {verification_link}',
    variables: ['certification_body_name', 'certificate_number', 'producer_name', 'verification_link'],
    is_default: true,
    is_active: true,
    version: 1,
    created_at: '2026-08-14T00:00:00.000Z',
    updated_at: '2026-08-14T00:00:00.000Z'
  },
  {
    id: 'tpl-form-fr-1',
    name: 'Formulaire de vérification (FR)',
    title: 'Formulaire de vérification (FR)',
    language: 'fr',
    channel: 'form',
    subject: 'Demande formulaire de vérification',
    body: 'Formulaire de confirmation officiel pour {producer_name} - {certificate_number}',
    variables: ['producer_name', 'certificate_number'],
    is_default: true,
    is_active: true,
    version: 1,
    created_at: '2026-08-14T00:00:00.000Z',
    updated_at: '2026-08-14T00:00:00.000Z'
  },
  {
    id: 'tpl-form-en-1',
    name: 'Verification Web Form (EN)',
    title: 'Verification Web Form (EN)',
    language: 'en',
    channel: 'form',
    subject: 'Verification Form Request',
    body: 'Official verification form for {producer_name} - {certificate_number}',
    variables: ['producer_name', 'certificate_number'],
    is_default: true,
    is_active: true,
    version: 1,
    created_at: '2026-08-14T00:00:00.000Z',
    updated_at: '2026-08-14T00:00:00.000Z'
  },
  mockAPITemplate,
  {
    id: 'tpl-api-en-1',
    name: 'API JSON Payload (EN)',
    title: 'API JSON Payload (EN)',
    language: 'en',
    channel: 'api',
    subject: 'POST /v1/certifications/verify',
    body: '{"action":"verify","cert":"{certificate_number}","producer":"{producer_name}"}',
    variables: ['certificate_number', 'producer_name'],
    is_default: true,
    is_active: true,
    version: 1,
    created_at: '2026-08-14T00:00:00.000Z',
    updated_at: '2026-08-14T00:00:00.000Z'
  },
  {
    id: 'tpl-reminder-fr',
    name: 'Email de relance (FR)',
    title: 'Email de relance (FR)',
    language: 'fr',
    channel: 'email',
    subject: 'RAPPEL : Vérification certificat {certificate_number}',
    body: 'Rappel pour {certification_body_name} concernant {producer_name} : {verification_link}',
    variables: ['certification_body_name', 'certificate_number', 'producer_name', 'verification_link'],
    is_default: false,
    is_active: true,
    version: 1,
    created_at: '2026-08-14T00:00:00.000Z',
    updated_at: '2026-08-14T00:00:00.000Z'
  },
  {
    id: 'tpl-reminder-en',
    name: 'Reminder Email (EN)',
    title: 'Reminder Email (EN)',
    language: 'en',
    channel: 'email',
    subject: 'REMINDER: Verification request {certificate_number}',
    body: 'Reminder for {certification_body_name} regarding {producer_name}: {verification_link}',
    variables: ['certification_body_name', 'certificate_number', 'producer_name', 'verification_link'],
    is_default: false,
    is_active: true,
    version: 1,
    created_at: '2026-08-14T00:00:00.000Z',
    updated_at: '2026-08-14T00:00:00.000Z'
  }
];

export const mockValidExportJSON = JSON.stringify(
  {
    exported_at: '2026-08-14T12:00:00.000Z',
    version: '1.0',
    count: 2,
    templates: [
      {
        title: 'Template Importé 1',
        language: 'fr',
        channel: 'email',
        subject: 'Objet {certificate_number}',
        body: 'Corps pour {producer_name} - {certificate_number}',
        variables: ['producer_name', 'certificate_number'],
        is_default: false
      },
      {
        title: 'Template Importé 2',
        language: 'en',
        channel: 'whatsapp',
        subject: null,
        body: 'Hello {producer_name}, cert {certificate_number}',
        variables: ['producer_name', 'certificate_number'],
        is_default: false
      }
    ]
  },
  null,
  2
);

export const mockInvalidJSON = '{"version": "1.0", "templates": [ { "title": "Incomplet"';

export const mockJSONWithDuplicates = JSON.stringify(
  {
    exported_at: '2026-08-14T12:00:00.000Z',
    version: '1.0',
    count: 2,
    templates: [
      {
        title: 'Email de vérification standard (FR)',
        language: 'fr',
        channel: 'email',
        subject: 'Nouveau sujet - {certificate_number}',
        body: 'Nouveau corps pour {producer_name}',
        variables: ['producer_name', 'certificate_number'],
        is_default: true
      },
      {
        title: 'Modèle Inédit Nouveau',
        language: 'fr',
        channel: 'email',
        subject: 'Objet inédit',
        body: 'Corps inédit pour {producer_name}',
        variables: ['producer_name'],
        is_default: false
      }
    ]
  },
  null,
  2
);
