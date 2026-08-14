import { supabase } from './supabase';
import type {
  CertificationMessageTemplate,
  CertificationMessageTemplateInsert,
  CertificationMessageTemplateUpdate,
  VerificationChannel,
  TemplateVariables
} from './supabase';
import { resolveTemplateVariables } from './certificationVerificationService';

/**
 * Récupère la liste des modèles de messages avec filtres optionnels
 */
export async function getTemplates(filters?: {
  language?: string;
  channel?: VerificationChannel;
}): Promise<{
  data: CertificationMessageTemplate[];
  error: string | null;
}> {
  try {
    let query = supabase
      .from('certification_message_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.language) {
      query = query.eq('language', filters.language);
    }
    if (filters?.channel) {
      query = query.eq('channel', filters.channel);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data as CertificationMessageTemplate[]) || [], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des modèles';
    return { data: [], error: msg };
  }
}

/**
 * Récupère le modèle par défaut pour un canal et une langue donnés (avec repli sur l'anglais)
 */
export async function getDefaultTemplate(
  channel: VerificationChannel,
  language: string = 'fr'
): Promise<{
  data: CertificationMessageTemplate | null;
  error: string | null;
}> {
  try {
    // Tentative dans la langue demandée
    const { data: directData, error: directError } = await supabase
      .from('certification_message_templates')
      .select('*')
      .eq('channel', channel)
      .eq('language', language)
      .eq('is_default', true)
      .maybeSingle();

    if (directError) {
      return { data: null, error: directError.message };
    }

    let data = directData;

    // Repli sur l'anglais si non trouvé
    if (!data && language !== 'en') {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('certification_message_templates')
        .select('*')
        .eq('channel', channel)
        .eq('language', 'en')
        .eq('is_default', true)
        .maybeSingle();

      if (!fallbackError && fallbackData) {
        data = fallbackData;
      }
    }

    return { data: (data as CertificationMessageTemplate) || null, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur template par défaut';
    return { data: null, error: msg };
  }
}

/**
 * Crée un nouveau modèle de message
 */
export async function createTemplate(
  template: CertificationMessageTemplateInsert
): Promise<{
  data: CertificationMessageTemplate | null;
  error: string | null;
}> {
  try {
    // Si marqué par défaut, désactiver les autres
    if (template.is_default) {
      await supabase
        .from('certification_message_templates')
        .update({ is_default: false })
        .eq('channel', template.channel)
        .eq('language', template.language);
    }

    const { data, error } = await supabase
      .from('certification_message_templates')
      .insert(template)
      .select('*')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data as CertificationMessageTemplate) || null, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur création modèle';
    return { data: null, error: msg };
  }
}

/**
 * Met à jour un modèle de message existant
 */
export async function updateTemplate(
  id: string,
  updates: CertificationMessageTemplateUpdate
): Promise<{
  data: CertificationMessageTemplate | null;
  error: string | null;
}> {
  try {
    if (updates.is_default && updates.channel && updates.language) {
      await supabase
        .from('certification_message_templates')
        .update({ is_default: false })
        .eq('channel', updates.channel)
        .eq('language', updates.language);
    }

    const { data, error } = await supabase
      .from('certification_message_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data as CertificationMessageTemplate) || null, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur mise à jour modèle';
    return { data: null, error: msg };
  }
}

/**
 * Supprime un modèle de message
 */
export async function deleteTemplate(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('certification_message_templates')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur suppression modèle';
    return { success: false, error: msg };
  }
}

/**
 * Définit un modèle comme étant le modèle par défaut pour son canal et sa langue
 */
export async function setDefaultTemplate(
  id: string,
  channel: VerificationChannel,
  language: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // 1. Décocher l'actuel par défaut
    await supabase
      .from('certification_message_templates')
      .update({ is_default: false })
      .eq('channel', channel)
      .eq('language', language);

    // 2. Cocher le nouveau
    const { error } = await supabase
      .from('certification_message_templates')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur configuration template par défaut';
    return { success: false, error: msg };
  }
}

/**
 * Effectue le rendu du sujet et du corps d'un modèle en remplaçant les variables
 */
export function renderTemplate(
  template: CertificationMessageTemplate,
  variables: TemplateVariables
): { subject: string | null; body: string } {
  return {
    subject: template.subject ? resolveTemplateVariables(template.subject, variables) : null,
    body: resolveTemplateVariables(template.body, variables)
  };
}

/**
 * Fournit les modèles de messages multicanaux préconfigurés par défaut
 */
export function getDefaultTemplatesData(): CertificationMessageTemplateInsert[] {
  return [
    {
      name: 'Email officiel de vérification (Français)',
      language: 'fr',
      channel: 'email',
      subject: 'Demande de vérification de certification — {{certification_body_name}} / {{platform_name}}',
      body: `Bonjour Madame, Monsieur,

L'équipe d'audit de la plateforme EthiMarket réalise actuellement la vérification de conformité des partenaires producteurs référencés.

Nous vous sollicitons afin de confirmer l'authenticité et la validité du certificat ci-dessous émis par votre organisme :

• Nom du producteur / entreprise : {{producer_name}}
• Numéro de certificat : {{certificate_number}}
• Standard / Type de certification : {{certification_type}}
• Date d'émission : {{issued_at}}
• Date d'expiration : {{expires_at}}
{{#if document_url}}• Copie du document joint : {{document_url}}{{/if}}

Pourriez-vous nous confirmer par retour de courriel si ce certificat est valide, actif et sans suspension en cours ?

Nous vous remercions par avance pour votre collaboration en faveur de la transparence et de l'agriculture durable.

Bien cordialement,

{{admin_name}}
Service Audit & Conformité EthiMarket
Courriel : {{admin_email}}
Site : https://ethimarket.com`,
      variables: [
        'producer_name',
        'certificate_number',
        'certification_type',
        'certification_body_name',
        'issued_at',
        'expires_at',
        'document_url',
        'platform_name',
        'admin_name',
        'admin_email'
      ],
      is_default: true,
      created_by: null
    },
    {
      name: 'Official Verification Email (English)',
      language: 'en',
      channel: 'email',
      subject: 'Certification Verification Request — {{certification_body_name}} / {{platform_name}}',
      body: `Dear Certification Team,

The EthiMarket compliance and audit department is currently conducting routine verification of certificates submitted by our registered producers.

We kindly request your confirmation regarding the validity and standing of the following certificate issued by your organization:

• Producer / Business Name: {{producer_name}}
• Certificate Number: {{certificate_number}}
• Standard / Certification Type: {{certification_type}}
• Issue Date: {{issued_at}}
• Expiration Date: {{expires_at}}
{{#if document_url}}• Document Attachment URL: {{document_url}}{{/if}}

Could you please confirm by replying to this email whether this certificate is currently active, valid, and in good standing?

Thank you in advance for your assistance and commitment to agricultural integrity.

Sincerely,

{{admin_name}}
Compliance & Verification Department — EthiMarket
Email: {{admin_email}}
Website: https://ethimarket.com`,
      variables: [
        'producer_name',
        'certificate_number',
        'certification_type',
        'certification_body_name',
        'issued_at',
        'expires_at',
        'document_url',
        'platform_name',
        'admin_name',
        'admin_email'
      ],
      is_default: true,
      created_by: null
    },
    {
      name: 'Message WhatsApp de vérification (Français)',
      language: 'fr',
      channel: 'whatsapp',
      subject: null,
      body: `Bonjour, EthiMarket souhaite vérifier la validité du certificat N° {{certificate_number}} délivré à {{producer_name}} (Standard : {{certification_type}}). Pouvez-vous nous confirmer sa validité ? Merci d'avance, {{admin_name}}.`,
      variables: [
        'producer_name',
        'certificate_number',
        'certification_type',
        'admin_name'
      ],
      is_default: true,
      created_by: null
    },
    {
      name: 'WhatsApp Verification Request (English)',
      language: 'en',
      channel: 'whatsapp',
      subject: null,
      body: `Hello, EthiMarket is verifying certificate #{{certificate_number}} issued to {{producer_name}} (Standard: {{certification_type}}). Could you please confirm if it is active and valid? Thank you, {{admin_name}}.`,
      variables: [
        'producer_name',
        'certificate_number',
        'certification_type',
        'admin_name'
      ],
      is_default: true,
      created_by: null
    }
  ];
}
