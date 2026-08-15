import { supabase } from './supabase';
import type {
  CertificationMessageTemplate,
  CertificationMessageTemplateInsert,
  CertificationMessageTemplateUpdate,
  VerificationChannel,
  TemplateVariables,
  TemplateVersionSnapshot
} from './supabase';
import { resolveTemplateVariables } from './certificationVerificationService';

export const KNOWN_TEMPLATE_VARIABLES = [
  'producer_name',
  'certificate_number',
  'standard_name',
  'body_name',
  'verification_url',
  'expiry_date',
  'issue_date',
  'platform_name',
  'admin_name',
  'admin_email',
  'certification_type',
  'certification_body_name',
  'issued_at',
  'expires_at',
  'document_url'
] as const;

/**
 * Normalise un template brut retourné par la base pour garantir la cohérence
 */
export function normalizeTemplate(raw: Record<string, unknown>): CertificationMessageTemplate {
  const title = (raw.title as string) || (raw.name as string) || 'Sans titre';
  const name = (raw.name as string) || (raw.title as string) || title;

  return {
    id: raw.id as string,
    title,
    name,
    language: (raw.language as string) || 'fr',
    channel: (raw.channel as VerificationChannel) || 'email',
    subject: (raw.subject as string) || null,
    body: (raw.body as string) || '',
    variables: Array.isArray(raw.variables) ? raw.variables : [],
    is_default: Boolean(raw.is_default),
    version: typeof raw.version === 'number' ? raw.version : 1,
    previous_version: (raw.previous_version as TemplateVersionSnapshot) || null,
    last_modified_by: (raw.last_modified_by as string) || null,
    created_by: (raw.created_by as string) || null,
    created_at: (raw.created_at as string) || new Date().toISOString(),
    updated_at: (raw.updated_at as string) || new Date().toISOString()
  };
}

/**
 * 1. Récupère la liste des modèles de messages avec filtres et recherche
 */
export async function getTemplates(filters?: {
  language?: string;
  channel?: VerificationChannel;
  search?: string;
}): Promise<{
  data: CertificationMessageTemplate[];
  error: string | null;
}> {
  try {
    let query = supabase
      .from('certification_message_templates')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters?.language && filters.language !== 'all') {
      query = query.eq('language', filters.language);
    }
    if (filters?.channel && (filters.channel as string) !== 'all') {
      query = query.eq('channel', filters.channel);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: error.message };
    }

    let results = ((data || []) as Record<string, unknown>[]).map(normalizeTemplate);

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      results = results.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.subject && t.subject.toLowerCase().includes(q)) ||
          t.body.toLowerCase().includes(q)
      );
    }

    return { data: results, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur lors du chargement des modèles';
    return { data: [], error: msg };
  }
}

/**
 * 2. Récupère un modèle par son identifiant unique
 */
export async function getTemplateById(
  id: string
): Promise<{
  data: CertificationMessageTemplate | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('certification_message_templates')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: 'Modèle introuvable' };
    }

    return { data: normalizeTemplate(data as Record<string, unknown>), error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur récupération modèle';
    return { data: null, error: msg };
  }
}

/**
 * 3. Récupère le modèle par défaut pour un canal et une langue donnés (avec repli)
 */
export async function getDefaultTemplate(
  channel: VerificationChannel,
  language: string = 'fr'
): Promise<{
  data: CertificationMessageTemplate | null;
  error: string | null;
}> {
  try {
    // Tentative directe dans la langue demandée
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

    // Repli sur le premier disponible pour ce canal
    if (!data) {
      const { data: anyData } = await supabase
        .from('certification_message_templates')
        .select('*')
        .eq('channel', channel)
        .limit(1)
        .maybeSingle();

      if (anyData) {
        data = anyData;
      }
    }

    return {
      data: data ? normalizeTemplate(data as Record<string, unknown>) : null,
      error: null
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur template par défaut';
    return { data: null, error: msg };
  }
}

/**
 * 4. Crée un nouveau modèle de message
 */
export async function createTemplate(
  template: CertificationMessageTemplateInsert,
  userId?: string
): Promise<{
  data: CertificationMessageTemplate | null;
  error: string | null;
}> {
  try {
    const titleVal = template.title || template.name || 'Nouveau modèle';

    // Si marqué par défaut, désactiver les autres templates pour le même couple
    if (template.is_default) {
      await supabase
        .from('certification_message_templates')
        .update({ is_default: false })
        .eq('channel', template.channel)
        .eq('language', template.language);
    }

    const payload: Record<string, unknown> = {
      title: titleVal,
      name: titleVal,
      language: template.language,
      channel: template.channel,
      subject: template.subject || null,
      body: template.body,
      variables: template.variables || [],
      is_default: template.is_default ?? false,
      version: 1,
      previous_version: null,
      created_by: userId || template.created_by || null,
      last_modified_by: userId || null
    };

    const { data, error } = await supabase
      .from('certification_message_templates')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: normalizeTemplate(data as Record<string, unknown>), error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur création modèle';
    return { data: null, error: msg };
  }
}

/**
 * 5. Met à jour un modèle existant avec auto-incrémentation de version et capture d'instantané
 */
export async function updateTemplate(
  id: string,
  updates: CertificationMessageTemplateUpdate,
  userId?: string,
  saveVersionSnapshot: boolean = true
): Promise<{
  data: CertificationMessageTemplate | null;
  error: string | null;
}> {
  try {
    // 1. Récupération de l'état actuel pour snapshot
    const { data: current, error: fetchErr } = await supabase
      .from('certification_message_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !current) {
      return { data: null, error: fetchErr?.message || 'Modèle introuvable' };
    }

    const currentNormalized = normalizeTemplate(current as Record<string, unknown>);

    const targetChannel = updates.channel || currentNormalized.channel;
    const targetLang = updates.language || currentNormalized.language;

    if (updates.is_default) {
      await supabase
        .from('certification_message_templates')
        .update({ is_default: false })
        .eq('channel', targetChannel)
        .eq('language', targetLang);
    }

    const payload: Record<string, unknown> = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (updates.title || updates.name) {
      const unifiedName = updates.title || updates.name;
      payload.title = unifiedName;
      payload.name = unifiedName;
    }

    if (userId) {
      payload.last_modified_by = userId;
    }

    // Gestion du snapshot de version
    if (saveVersionSnapshot) {
      const snapshot: TemplateVersionSnapshot = {
        version: currentNormalized.version || 1,
        subject: currentNormalized.subject,
        body: currentNormalized.body,
        variables: currentNormalized.variables,
        saved_at: currentNormalized.updated_at,
        modified_by: currentNormalized.last_modified_by || currentNormalized.created_by
      };

      payload.previous_version = snapshot;
      payload.version = (currentNormalized.version || 1) + 1;
    }

    const { data, error } = await supabase
      .from('certification_message_templates')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: normalizeTemplate(data as Record<string, unknown>), error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur mise à jour modèle';
    return { data: null, error: msg };
  }
}

/**
 * 6. Restaure la version précédente stockée dans previous_version (Rollback)
 */
export async function restorePreviousVersion(
  id: string,
  userId?: string
): Promise<{
  data: CertificationMessageTemplate | null;
  error: string | null;
}> {
  try {
    const { data: current, error: fetchErr } = await supabase
      .from('certification_message_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !current) {
      return { data: null, error: fetchErr?.message || 'Modèle introuvable' };
    }

    const currentNormalized = normalizeTemplate(current as Record<string, unknown>);
    const prev = currentNormalized.previous_version;

    if (!prev) {
      return { data: null, error: 'Aucune version antérieure disponible pour ce modèle' };
    }

    // Instantané de l'état actuel avant rollback
    const newSnapshot: TemplateVersionSnapshot = {
      version: currentNormalized.version || 1,
      subject: currentNormalized.subject,
      body: currentNormalized.body,
      variables: currentNormalized.variables,
      saved_at: new Date().toISOString(),
      modified_by: userId || null
    };

    const payload: Record<string, unknown> = {
      subject: prev.subject,
      body: prev.body,
      variables: prev.variables,
      previous_version: newSnapshot,
      version: (currentNormalized.version || 1) + 1,
      last_modified_by: userId || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('certification_message_templates')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: normalizeTemplate(data as Record<string, unknown>), error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur restauration version';
    return { data: null, error: msg };
  }
}

/** Alias rétrocompatible pour restorePreviousVersion */
export const rollbackTemplate = restorePreviousVersion;

/**
 * 7. Duplique un modèle existant
 */
export async function duplicateTemplate(
  id: string,
  newTitle?: string,
  userId?: string
): Promise<{
  data: CertificationMessageTemplate | null;
  error: string | null;
}> {
  try {
    const { data: original, error: fetchErr } = await getTemplateById(id);
    if (fetchErr || !original) {
      return { data: null, error: fetchErr || 'Modèle source introuvable' };
    }

    const duplicatedName = newTitle || `${original.name} (Copie)`;

    return await createTemplate(
      {
        title: duplicatedName,
        name: duplicatedName,
        language: original.language,
        channel: original.channel,
        subject: original.subject ? `[Copie] ${original.subject}` : null,
        body: original.body,
        variables: [...original.variables],
        is_default: false,
        created_by: userId || null
      },
      userId
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur duplication modèle';
    return { data: null, error: msg };
  }
}

/**
 * 8. Supprime un modèle de message
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
 * 9. Définit un modèle comme étant le modèle par défaut pour son canal et sa langue
 */
export async function setDefaultTemplate(
  id: string,
  channel: VerificationChannel,
  language: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    await supabase
      .from('certification_message_templates')
      .update({ is_default: false })
      .eq('channel', channel)
      .eq('language', language);

    const { error } = await supabase
      .from('certification_message_templates')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur configuration défaut';
    return { success: false, error: msg };
  }
}

/**
 * 10. Effectue le rendu du sujet et du corps d'un modèle en remplaçant les variables
 */
export function renderTemplate(
  template: CertificationMessageTemplate | { subject?: string | null; body: string },
  variables: TemplateVariables | Record<string, unknown>
): { subject: string | null; body: string } {
  return {
    subject: template.subject ? resolveTemplateVariables(template.subject, variables as TemplateVariables) : null,
    body: resolveTemplateVariables(template.body, variables as TemplateVariables)
  };
}

/**
 * 11. Valide la syntaxe des variables du template (détection des variables invalides et alertes)
 */
export function validateTemplateSyntax(
  body: string,
  subject?: string | null
): {
  valid: boolean;
  isValid: boolean;
  detectedVariables: string[];
  invalidVariables: string[];
  warnings: string[];
} {
  const fullText = `${subject || ''} ${body || ''}`;
  const variableRegex = /\{([a-zA-Z0-9_]+)\}|\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  const detected = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = variableRegex.exec(fullText)) !== null) {
    const varName = match[1] || match[2];
    if (varName) {
      detected.add(varName);
    }
  }

  const detectedArray = Array.from(detected);
  const invalidVariables = detectedArray.filter(
    (v) => !KNOWN_TEMPLATE_VARIABLES.includes(v as typeof KNOWN_TEMPLATE_VARIABLES[number])
  );

  const warnings: string[] = [];
  if (invalidVariables.length > 0) {
    warnings.push(`Variables non répertoriées détectées : ${invalidVariables.join(', ')}`);
  }
  if (!detectedArray.includes('producer_name')) {
    warnings.push("La variable recommandée '{producer_name}' n'est pas utilisée.");
  }
  if (!detectedArray.includes('certificate_number')) {
    warnings.push("La variable recommandée '{certificate_number}' n'est pas utilisée.");
  }

  const valid = invalidVariables.length === 0;

  return {
    valid,
    isValid: valid,
    detectedVariables: detectedArray,
    invalidVariables,
    warnings
  };
}

/**
 * 12. Exporte les modèles sous forme de chaîne JSON structurée et standardisée
 */
export async function exportTemplatesAsJSON(
  templatesList?: CertificationMessageTemplate[]
): Promise<string> {
  let list = templatesList;
  if (!list) {
    const { data } = await getTemplates();
    list = data;
  }

  const exportPayload = {
    exported_at: new Date().toISOString(),
    version: '1.0',
    count: list.length,
    templates: list.map((t) => ({
      title: t.title || t.name,
      name: t.name,
      language: t.language,
      channel: t.channel,
      subject: t.subject,
      body: t.body,
      variables: t.variables,
      is_default: t.is_default,
      version: t.version || 1
    }))
  };

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * 13. Importe des templates depuis une chaîne JSON avec gestion des doublons et validation de schéma
 */
export async function importTemplatesFromJSON(
  jsonString: string,
  overwriteExisting: boolean = false,
  userId?: string
): Promise<{ importedCount: number; errors: string[] }> {
  const errors: string[] = [];
  let importedCount = 0;

  try {
    const parsed = JSON.parse(jsonString);
    const list: Array<Record<string, unknown>> = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.templates)
      ? parsed.templates
      : [];

    if (list.length === 0) {
      return { importedCount: 0, errors: ['Aucun modèle trouvé dans le payload JSON fourni'] };
    }

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const title = (item.title as string) || (item.name as string);
      const language = (item.language as string) || 'fr';
      const channel = (item.channel as VerificationChannel) || 'email';
      const body = item.body as string;

      if (!title || !body) {
        errors.push(`Élément ${i + 1} : 'title'/'name' ou 'body' manquant`);
        continue;
      }

      // Vérifier si un template existe déjà
      const { data: existing } = await supabase
        .from('certification_message_templates')
        .select('id')
        .or(`title.eq.${title},name.eq.${title}`)
        .eq('language', language)
        .eq('channel', channel)
        .maybeSingle();

      if (existing && overwriteExisting) {
        await updateTemplate(
          existing.id,
          {
            title,
            name: title,
            subject: (item.subject as string) || null,
            body,
            variables: (item.variables as string[]) || [],
            is_default: Boolean(item.is_default)
          },
          userId
        );
        importedCount++;
      } else if (!existing) {
        await createTemplate(
          {
            title,
            name: title,
            language,
            channel,
            subject: (item.subject as string) || null,
            body,
            variables: (item.variables as string[]) || [],
            is_default: Boolean(item.is_default),
            created_by: userId || null
          },
          userId
        );
        importedCount++;
      }
    }

    return { importedCount, errors };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur de syntaxe JSON';
    return { importedCount: 0, errors: [msg] };
  }
}

/**
 * 14. Réinitialise la bibliothèque avec les 12 modèles de messages standards officiels
 */
export async function resetToDefaultTemplates(
  userId?: string
): Promise<{ success: boolean; count: number; error: string | null }> {
  try {
    const defaults = getDefaultTemplatesData();
    let count = 0;

    for (const tpl of defaults) {
      const res = await createTemplate(tpl, userId);
      if (res.data) count++;
    }

    return { success: true, count, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur réinitialisation templates';
    return { success: false, count: 0, error: msg };
  }
}

/**
 * Fournit les 12 modèles de messages multicanaux préconfigurés par défaut
 */
export function getDefaultTemplatesData(): CertificationMessageTemplateInsert[] {
  return [
    {
      title: 'Demande de vérification initiale officielle',
      name: 'Demande de vérification initiale officielle',
      language: 'fr',
      channel: 'email',
      subject: "Demande de confirmation d'authenticité de certification — {standard_name} — {producer_name}",
      body: `Madame, Monsieur l'Auditeur / Service Conformité,

Dans le cadre de la démarche de transparence et d'audit qualité menée par {platform_name}, nous procédons actuellement à la vérification systématique des titres et certifications déclarés par nos producteurs partenaires.

L'établissement référencé ci-dessous a soumis une attestation de conformité délivrée sous votre autorité :

• Entreprise / Producteur : {producer_name}
• Référence / Numéro de certificat : {certificate_number}
• Référentiel / Standard audité : {standard_name}
• Organisme certificateur émetteur : {body_name}
• Date d'émission déclarée : {issue_date}
• Date d'expiration déclarée : {expiry_date}
• Lien vers le document transmis : {verification_url}

Pourriez-vous avoir l'amabilité de nous confirmer par retour de courriel :
1. Que ce certificat est authentique et actuellement valide (sans suspension ni retrait en cours) ;
2. Que le périmètre des activités et produits certifiés couvre bien les éléments mentionnés.

Nous vous remercions vivement par avance pour votre précieux concours à la garantie de la conformité et de l'intégrité des filières durables.

Restant à votre entière disposition pour tout renseignement complémentaire, nous vous prions d'agréer, Madame, Monsieur, l'expression de notre considération distinguée.

L'Équipe d'Audit & Conformité
{platform_name}`,
      variables: [
        'producer_name',
        'certificate_number',
        'standard_name',
        'body_name',
        'verification_url',
        'expiry_date',
        'issue_date',
        'platform_name'
      ],
      is_default: true,
      created_by: null
    },
    {
      title: 'Official Initial Verification Request',
      name: 'Official Initial Verification Request',
      language: 'en',
      channel: 'email',
      subject: 'Certificate Authenticity & Standing Verification — {standard_name} — {producer_name}',
      body: `Dear Compliance & Certification Department,

As part of {platform_name}'s rigorous vendor due diligence and quality verification protocols, we are currently reviewing the certification credentials submitted by our registered suppliers.

The following producer has submitted a certificate issued under your accreditation:

• Producer / Business Name: {producer_name}
• Certificate Registration Number: {certificate_number}
• Applicable Standard / Scheme: {standard_name}
• Issuing Certification Body: {body_name}
• Declared Issue Date: {issue_date}
• Declared Expiry Date: {expiry_date}
• Document Access Link: {verification_url}

Could you kindly confirm by replying to this email:
1. Whether this certificate is active, authentic, and in good standing without any pending suspension or revocation;
2. That the certified scope accurately covers the producer's operations and products.

Thank you very much in advance for your assistance in maintaining trust and high sustainability standards across global supply chains.

Sincerely,

Audit & Verification Department
{platform_name}`,
      variables: [
        'producer_name',
        'certificate_number',
        'standard_name',
        'body_name',
        'verification_url',
        'expiry_date',
        'issue_date',
        'platform_name'
      ],
      is_default: true,
      created_by: null
    },
    {
      title: 'Solicitud oficial de verificación de certificación',
      name: 'Solicitud oficial de verificación de certificación',
      language: 'es',
      channel: 'email',
      subject: 'Solicitud de confirmación de autenticidad de certificado — {standard_name} — {producer_name}',
      body: `Estimado/a responsable del Departamento de Auditoría y Certificación,

En el marco de nuestro proceso continuo de debida diligencia y control de calidad en {platform_name}, solicitamos cordialmente la verificación del certificado emitido por su entidad para el siguiente productor:

• Nombre del productor / Empresa: {producer_name}
• Número de certificado: {certificate_number}
• Norma / Estándar certificado: {standard_name}
• Organismo de certificación emisor: {body_name}
• Fecha de emisión declarada: {issue_date}
• Fecha de caducidad declarada: {expiry_date}
• Enlace al documento presentado: {verification_url}

Agradeceríamos enormemente que nos confirmaran por esta vía si dicho certificado se encuentra actualmente vigente, activo y sin suspensiones.

Agradeciendo de antemano su colaboración y compromiso con la transparencia en las cadenas de valor sostenibles.

Atentamente,

Departamento de Cumplimiento y Auditoría
{platform_name}`,
      variables: [
        'producer_name',
        'certificate_number',
        'standard_name',
        'body_name',
        'verification_url',
        'expiry_date',
        'issue_date',
        'platform_name'
      ],
      is_default: true,
      created_by: null
    },
    {
      title: 'Solicitação oficial de verificação de certificação',
      name: 'Solicitação oficial de verificação de certificação',
      language: 'pt',
      channel: 'email',
      subject: 'Confirmação de autenticidade e validade de certificado — {standard_name} — {producer_name}',
      body: `Prezado(a) Senhor(a) / Departamento de Certificação e Auditoria,

No âmbito do programa de integridade e auditoria de fornecedores da plataforma {platform_name}, solicitamos gentilmente a confirmação da validade do certificado emitido pelo vosso organismo :

• Nome do produtor / Empresa: {producer_name}
• Número do certificado: {certificate_number}
• Norma / Padrão de certificação: {standard_name}
• Organismo certificador emissor: {body_name}
• Data de emissão: {issue_date}
• Data de validade: {expiry_date}
• Documento anexado para consulta: {verification_url}

Agradecemos se puder nos confirmar por este e-mail se o certificado permanece ativo, autêntico e em plena conformidade.

Desde já, agradecemos pela vossa disponibilidade e cooperação em prol do comércio justo e sustentável.

Atenciosamente,

Equipe de Auditoria e Conformidade
{platform_name}`,
      variables: [
        'producer_name',
        'certificate_number',
        'standard_name',
        'body_name',
        'verification_url',
        'expiry_date',
        'issue_date',
        'platform_name'
      ],
      is_default: true,
      created_by: null
    },
    {
      title: 'Message court de vérification WhatsApp',
      name: 'Message court de vérification WhatsApp',
      language: 'fr',
      channel: 'whatsapp',
      subject: null,
      body: `Bonjour l'équipe {body_name},

Ici l'équipe Audit de {platform_name}. Nous réalisons un contrôle de conformité pour le producteur *{producer_name}*.

Pouvez-vous nous confirmer la validité du certificat :
• Standard : {standard_name}
• N° Certificat : {certificate_number}
• Expiration déclarée : {expiry_date}
• Document : {verification_url}

Ce certificat est-il bien actif et conforme ? Merci d'avance pour votre retour rapide !

Équipe Audit {platform_name}`,
      variables: [
        'producer_name',
        'certificate_number',
        'standard_name',
        'body_name',
        'verification_url',
        'expiry_date',
        'platform_name'
      ],
      is_default: true,
      created_by: null
    },
    {
      title: 'Short WhatsApp Verification Message',
      name: 'Short WhatsApp Verification Message',
      language: 'en',
      channel: 'whatsapp',
      subject: null,
      body: `Hello {body_name} team,

This is the Audit Team from {platform_name}. We are verifying the certification status for producer *{producer_name}*.

Could you please confirm if this certificate is active & valid?
• Standard: {standard_name}
• Certificate #: {certificate_number}
• Expiry Date: {expiry_date}
• Document: {verification_url}

Thank you in advance for your assistance!

Audit Team — {platform_name}`,
      variables: [
        'producer_name',
        'certificate_number',
        'standard_name',
        'body_name',
        'verification_url',
        'expiry_date',
        'platform_name'
      ],
      is_default: true,
      created_by: null
    },
    {
      title: 'Message formulaire web et portail de contact',
      name: 'Message formulaire web et portail de contact',
      language: 'fr',
      channel: 'form',
      subject: null,
      body: `Bonjour,

Dans le cadre du processus d'admission sur la place de marché {platform_name}, nous souhaitons authentifier l'attestation délivrée par votre organisme :

- Entreprise : {producer_name}
- Référence de certification : {certificate_number}
- Référentiel audité : {standard_name}
- Date de fin de validité : {expiry_date}
- Justificatif fourni : {verification_url}

Merci de bien vouloir nous certifier la validité de ce titre.
Service Audit {platform_name}`,
      variables: ['producer_name', 'certificate_number', 'standard_name', 'verification_url', 'expiry_date', 'platform_name'],
      is_default: true,
      created_by: null
    },
    {
      title: 'Generic Web Portal Verification Message',
      name: 'Generic Web Portal Verification Message',
      language: 'en',
      channel: 'form',
      subject: null,
      body: `Dear Support Team,

In connection with our vendor verification process on {platform_name}, we request formal validation of the certificate issued under your accreditation:

- Entity Name: {producer_name}
- Certificate ID: {certificate_number}
- Scheme / Standard: {standard_name}
- Declared Expiration: {expiry_date}
- Document Link: {verification_url}

Kindly confirm whether this record is authentic and active.
Audit Department — {platform_name}`,
      variables: ['producer_name', 'certificate_number', 'standard_name', 'verification_url', 'expiry_date', 'platform_name'],
      is_default: true,
      created_by: null
    },
    {
      title: 'Payload de requête technique API de vérification',
      name: 'Payload de requête technique API de vérification',
      language: 'fr',
      channel: 'api',
      subject: null,
      body: `{
  "request_type": "certificate_standing_lookup",
  "requester": "{platform_name} Audit Service",
  "producer_name": "{producer_name}",
  "certificate_number": "{certificate_number}",
  "standard_name": "{standard_name}",
  "issuing_body": "{body_name}",
  "issue_date": "{issue_date}",
  "expiry_date": "{expiry_date}",
  "document_url": "{verification_url}"
}`,
      variables: ['producer_name', 'certificate_number', 'standard_name', 'body_name', 'issue_date', 'expiry_date', 'verification_url', 'platform_name'],
      is_default: true,
      created_by: null
    },
    {
      title: 'API Verification Technical JSON Payload',
      name: 'API Verification Technical JSON Payload',
      language: 'en',
      channel: 'api',
      subject: null,
      body: `{
  "action": "verify_certificate_status",
  "platform": "{platform_name}",
  "query": {
    "holder": "{producer_name}",
    "certificate_id": "{certificate_number}",
    "standard": "{standard_name}",
    "certifier": "{body_name}",
    "valid_until": "{expiry_date}",
    "evidence_uri": "{verification_url}"
  }
}`,
      variables: ['producer_name', 'certificate_number', 'standard_name', 'body_name', 'expiry_date', 'verification_url', 'platform_name'],
      is_default: true,
      created_by: null
    },
    {
      title: 'Relance après 7 jours sans réponse',
      name: 'Relance après 7 jours sans réponse',
      language: 'fr',
      channel: 'email',
      subject: 'RELANCE : Demande de vérification de certification — {standard_name} — {producer_name}',
      body: `Madame, Monsieur,

Nous nous permettons de revenir vers vous concernant notre précédente demande de vérification de certification transmise il y a quelques jours pour le producteur suivant :

• Producteur : {producer_name}
• N° de certificat : {certificate_number}
• Standard : {standard_name}
• Organisme émetteur : {body_name}
• Expiration : {expiry_date}
• Document transmis : {verification_url}

Le dossier du producteur étant en attente de validation finale sur la plateforme {platform_name}, pourriez-vous nous confirmer rapidement si ce certificat est bien authentique et en vigueur ?

Nous vous remercions chaleureusement pour votre réactivité.

Bien cordialement,

L'Équipe d'Audit & Conformité
{platform_name}`,
      variables: ['producer_name', 'certificate_number', 'standard_name', 'body_name', 'verification_url', 'expiry_date', 'platform_name'],
      is_default: false,
      created_by: null
    },
    {
      title: 'Follow-up after 7 days without response',
      name: 'Follow-up after 7 days without response',
      language: 'en',
      channel: 'email',
      subject: 'FOLLOW-UP: Certificate Status Verification Request — {standard_name} — {producer_name}',
      body: `Dear Certification Support Team,

We are following up on our previous inquiry regarding the standing of certificate #{certificate_number} issued to {producer_name}.

Details of the certificate under verification:
• Entity Name: {producer_name}
• Certificate Reference: {certificate_number}
• Certification Standard: {standard_name}
• Issuing Authority: {body_name}
• Declared Expiry Date: {expiry_date}
• Access Link: {verification_url}

As this supplier is currently undergoing our onboarding compliance review on {platform_name}, your prompt validation would be greatly appreciated.

Thank you in advance for your assistance.

Best regards,

Compliance & Audit Team
{platform_name}`,
      variables: ['producer_name', 'certificate_number', 'standard_name', 'body_name', 'verification_url', 'expiry_date', 'platform_name'],
      is_default: false,
      created_by: null
    }
  ];
}
