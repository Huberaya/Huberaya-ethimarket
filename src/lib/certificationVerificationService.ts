import { supabase } from './supabase';
import type {
  ProducerCertification,
  ProducerCertificationFilters,
  ProducerCertificationStatus,
  VerificationChannel,
  VerificationResult,
  CertificationDashboardStats,
  CertificationVerificationLog,
  TemplateVariables,
  CertificationRegion
} from './supabase';
import { DAYS_BEFORE_EXPIRY_ALERT } from './supabase';

/**
 * Remplace toutes les variables {{nom_variable}} dans un texte
 */
export function resolveTemplateVariables(
  template: string,
  variables: TemplateVariables
): string {
  if (!template) return '';
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const val = variables[key as keyof TemplateVariables];
    return val !== undefined && val !== null ? String(val) : '';
  });
}

/**
 * Journalise une action d'audit de manière immuable (absorbe les erreurs)
 */
async function logVerificationAction(params: {
  producer_certification_id: string;
  admin_id: string;
  action: string;
  previous_status?: ProducerCertificationStatus | null;
  new_status?: ProducerCertificationStatus | null;
  channel_used?: VerificationChannel | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    await supabase.from('certification_verification_logs').insert({
      producer_certification_id: params.producer_certification_id,
      admin_id: params.admin_id,
      action: params.action,
      previous_status: params.previous_status || null,
      new_status: params.new_status || null,
      channel_used: params.channel_used || null,
      details: params.details || {},
      created_at: new Date().toISOString()
    });
  } catch (err) {
    // Absorption silencieuse de l'erreur pour ne jamais bloquer le flux principal
    console.warn('Silent log verification error:', err);
  }
}

/**
 * Récupère la liste paginée et filtrée des certifications producteurs
 */
export async function getProducerCertifications(
  filters?: ProducerCertificationFilters,
  page: number = 1,
  pageSize: number = 20
): Promise<{
  data: ProducerCertification[];
  count: number;
  error: string | null;
}> {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('producer_certifications')
      .select(`
        *,
        producer:producers!producer_id (id, name, country),
        certification_body:certification_bodies!certification_body_id (
          id, name, acronym, region, country, email_contact, api_endpoint,
          verification_url, whatsapp, phone, contact_form_url, trust_level, logo_url
        ),
        certification_standard:certification_standards!certification_standard_id (*),
        verified_by_profile:profiles!verified_by (id, first_name, last_name, email)
      `, { count: 'exact' });

    if (filters) {
      if (filters.status && filters.status !== 'ALL') {
        query = query.eq('status', filters.status);
      }
      if (filters.certification_body_id) {
        query = query.eq('certification_body_id', filters.certification_body_id);
      }
      if (filters.expires_before) {
        query = query.lte('expires_at', filters.expires_before);
      }
      if (filters.expires_after) {
        query = query.gte('expires_at', filters.expires_after);
      }
      if (filters.country) {
        query = query.eq('country_of_issue', filters.country);
      }
      if (filters.search && filters.search.trim()) {
        const term = `%${filters.search.trim()}%`;
        query = query.or(`certificate_number.ilike.${term}`);
      }
    }

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return { data: [], count: 0, error: error.message };
    }

    const today = new Date().toISOString().split('T')[0];
    const alertLimit = new Date();
    alertLimit.setDate(alertLimit.getDate() + DAYS_BEFORE_EXPIRY_ALERT);
    const alertLimitStr = alertLimit.toISOString().split('T')[0];

    const processedData: ProducerCertification[] = (data || []).map((item) => {
      let is_expired = false;
      let expires_soon = false;

      if (item.expires_at) {
        if (item.expires_at < today) {
          is_expired = true;
        } else if (item.expires_at <= alertLimitStr) {
          expires_soon = true;
        }
      }

      return {
        ...item,
        is_expired,
        expires_soon
      };
    });

    return {
      data: processedData,
      count: count || 0,
      error: null
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue lors du chargement des certifications';
    return { data: [], count: 0, error: msg };
  }
}

/**
 * Récupère une certification producteur par son identifiant avec tout son historique
 */
export async function getProducerCertificationById(
  id: string
): Promise<{
  data: ProducerCertification | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('producer_certifications')
      .select(`
        *,
        producer:producers!producer_id (id, name, country),
        certification_body:certification_bodies!certification_body_id (*),
        certification_standard:certification_standards!certification_standard_id (*),
        verified_by_profile:profiles!verified_by (id, first_name, last_name, email),
        verification_requests:certification_verification_requests (
          *,
          triggered_by_profile:profiles!triggered_by (id, first_name, last_name, email)
        ),
        logs:certification_verification_logs (
          *,
          admin_profile:profiles!admin_id (id, first_name, last_name, email)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return { data: null, error: error ? error.message : 'Certification introuvable' };
    }

    const today = new Date().toISOString().split('T')[0];
    const alertLimit = new Date();
    alertLimit.setDate(alertLimit.getDate() + DAYS_BEFORE_EXPIRY_ALERT);
    const alertLimitStr = alertLimit.toISOString().split('T')[0];

    let is_expired = false;
    let expires_soon = false;

    if (data.expires_at) {
      if (data.expires_at < today) {
        is_expired = true;
      } else if (data.expires_at <= alertLimitStr) {
        expires_soon = true;
      }
    }

    // Tri des requêtes et logs par date décroissante
    if (Array.isArray(data.verification_requests)) {
      data.verification_requests.sort((a: { sent_at: string }, b: { sent_at: string }) => 
        new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
      );
    }
    if (Array.isArray(data.logs)) {
      data.logs.sort((a: { created_at: string }, b: { created_at: string }) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return {
      data: {
        ...data,
        is_expired,
        expires_soon
      },
      error: null
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    return { data: null, error: msg };
  }
}

/**
 * Fonction maîtresse : Déclenche la vérification en 1 clic selon la cascade de canaux
 */
export async function triggerOneClickVerification(
  certificationId: string,
  adminId: string,
  templateId?: string
): Promise<VerificationResult> {
  try {
    // 1. Récupération de la certification et de son organisme
    const { data: cert, error: fetchErr } = await getProducerCertificationById(certificationId);
    if (fetchErr || !cert) {
      return {
        success: false,
        channel: 'manual',
        error: 'Certification introuvable'
      };
    }

    const previousStatus = cert.status;
    const body = cert.certification_body;

    // Récupération des infos de l'admin déclencheur pour les variables
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', adminId)
      .single();

    const adminName = adminProfile
      ? `${adminProfile.first_name || ''} ${adminProfile.last_name || ''}`.trim() || 'Équipe Audit EthiMarket'
      : 'Équipe Audit EthiMarket';
    const adminEmail = adminProfile?.email || 'verification@ethimarket.com';

    const templateVariables: TemplateVariables = {
      producer_name: cert.producer?.name || 'Producteur EthiMarket',
      certificate_number: cert.certificate_number || 'N/A',
      certification_type: cert.certification_standard?.name || 'Certification Bio / Éthique',
      certification_body_name: body?.name || 'Organisme de certification',
      issued_at: cert.issued_at || 'Date non précisée',
      expires_at: cert.expires_at || 'Date non précisée',
      document_url: cert.document_path || undefined,
      platform_name: 'EthiMarket',
      admin_name: adminName,
      admin_email: adminEmail
    };

    // 2. Si aucun organisme n'est lié -> Passage en manual_required
    if (!body) {
      await updateCertificationStatus(certificationId, 'manual_required', adminId, 'Aucun organisme certificateur associé');
      await logVerificationAction({
        producer_certification_id: certificationId,
        admin_id: adminId,
        action: 'MANUAL_REQUIRED_NO_BODY',
        previous_status: previousStatus,
        new_status: 'manual_required',
        channel_used: 'manual',
        details: { reason: 'Aucun organisme lié' }
      });
      return {
        success: false,
        channel: 'manual',
        status: 'manual_required',
        message: 'Aucun organisme de certification associé. Vérification manuelle requise.'
      };
    }

    // =========================================================================
    // CASCADE DE SÉLECTION DU CANAL
    // =========================================================================

    // CANAL 1 — API AUTOMATISÉE
    if (body.api_endpoint && body.api_endpoint.trim().length > 0) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      let apiSuccess = false;
      let apiResponseText = '';

      try {
        const fullUrl = `${body.api_endpoint}?cert_number=${encodeURIComponent(cert.certificate_number || '')}`;
        const res = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            ...(body.api_key_encrypted ? { 'Authorization': `Bearer ${body.api_key_encrypted}` } : {})
          },
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        apiSuccess = res.ok;
        const rawText = await res.text();
        apiResponseText = rawText.slice(0, 2000);
      } catch (e: unknown) {
        clearTimeout(timeoutId);
        apiSuccess = false;
        apiResponseText = e instanceof Error ? e.message : 'Erreur timeout/réseau lors de l appel API';
      }

      const reqStatus = apiSuccess ? 'success' : 'failed';
      const newCertStatus = apiSuccess ? 'verified' : 'contact_sent';

      // Enregistrement de la requête
      const { data: reqData } = await supabase
        .from('certification_verification_requests')
        .insert({
          producer_certification_id: certificationId,
          certification_body_id: body.id,
          triggered_by: adminId,
          channel: 'api',
          status: reqStatus,
          message_sent: `Appel GET: ${body.api_endpoint} (cert: ${cert.certificate_number})`,
          response_received: apiResponseText,
          sent_at: new Date().toISOString(),
          responded_at: new Date().toISOString()
        })
        .select('id')
        .single();

      await updateCertificationStatus(certificationId, newCertStatus, adminId, `Vérification API: ${reqStatus}`);

      await logVerificationAction({
        producer_certification_id: certificationId,
        admin_id: adminId,
        action: `API_VERIFY_${reqStatus.toUpperCase()}`,
        previous_status: previousStatus,
        new_status: newCertStatus,
        channel_used: 'api',
        details: { response: apiResponseText, requestId: reqData?.id }
      });

      return {
        success: apiSuccess,
        channel: 'api',
        status: newCertStatus,
        request_id: reqData?.id,
        message: apiSuccess
          ? 'Certificat vérifié et validé avec succès par API officielle.'
          : 'L appel API a échoué ou a retourné une erreur. Statut basculé en attente de réponse.'
      };
    }

    // CANAL 2 — EMAIL DIRECT
    if (body.email_contact && body.email_contact.trim().length > 0) {
      let emailSubject = `Demande de vérification de certificat — ${body.name}`;
      let emailBodyText = `Bonjour,\n\nNous souhaitons vérifier la validité du certificat ${cert.certificate_number || ''} pour ${cert.producer?.name || ''}.\nMerci de nous confirmer son authenticité.`;

      // Chargement du template si spécifié ou par défaut
      if (templateId) {
        const { data: tpl } = await supabase
          .from('certification_message_templates')
          .select('*')
          .eq('id', templateId)
          .single();
        if (tpl) {
          emailSubject = resolveTemplateVariables(tpl.subject || emailSubject, templateVariables);
          emailBodyText = resolveTemplateVariables(tpl.body, templateVariables);
        }
      } else {
        const { data: defaultTpl } = await supabase
          .from('certification_message_templates')
          .select('*')
          .eq('channel', 'email')
          .eq('is_default', true)
          .single();
        if (defaultTpl) {
          emailSubject = resolveTemplateVariables(defaultTpl.subject || emailSubject, templateVariables);
          emailBodyText = resolveTemplateVariables(defaultTpl.body, templateVariables);
        }
      }

      // Création de la requête en base
      const { data: reqData } = await supabase
        .from('certification_verification_requests')
        .insert({
          producer_certification_id: certificationId,
          certification_body_id: body.id,
          triggered_by: adminId,
          channel: 'email',
          status: 'sent',
          message_sent: `Objet: ${emailSubject}\n\nDestinataire: ${body.email_contact}\n\n${emailBodyText}`,
          sent_at: new Date().toISOString()
        })
        .select('id')
        .single();

      await updateCertificationStatus(certificationId, 'contact_sent', adminId, `Email envoyé à ${body.email_contact}`);

      await logVerificationAction({
        producer_certification_id: certificationId,
        admin_id: adminId,
        action: 'EMAIL_VERIFY_SENT',
        previous_status: previousStatus,
        new_status: 'contact_sent',
        channel_used: 'email',
        details: { to: body.email_contact, subject: emailSubject, requestId: reqData?.id }
      });

      return {
        success: true,
        channel: 'email',
        status: 'contact_sent',
        request_id: reqData?.id,
        message: `Demande de vérification par email générée et enregistrée pour ${body.email_contact}.`
      };
    }

    // CANAL 3 — FORMULAIRE / PORTAIL WEB
    if (body.verification_url || body.contact_form_url) {
      const portalUrl = body.verification_url || body.contact_form_url || '';

      const { data: reqData } = await supabase
        .from('certification_verification_requests')
        .insert({
          producer_certification_id: certificationId,
          certification_body_id: body.id,
          triggered_by: adminId,
          channel: 'form',
          status: 'sent',
          message_sent: `Ouverture portail officiel de vérification: ${portalUrl}`,
          sent_at: new Date().toISOString()
        })
        .select('id')
        .single();

      await updateCertificationStatus(certificationId, 'contact_sent', adminId, `Ouverture portail: ${portalUrl}`);

      await logVerificationAction({
        producer_certification_id: certificationId,
        admin_id: adminId,
        action: 'PORTAL_VERIFY_TRIGGERED',
        previous_status: previousStatus,
        new_status: 'contact_sent',
        channel_used: 'form',
        details: { url: portalUrl, requestId: reqData?.id }
      });

      return {
        success: true,
        channel: 'form',
        status: 'contact_sent',
        request_id: reqData?.id,
        external_url: portalUrl,
        message: 'Portail officiel de vérification accessible.'
      };
    }

    // CANAL 4 — WHATSAPP
    if (body.whatsapp && body.whatsapp.trim().length > 0) {
      const cleanPhone = body.whatsapp.replace(/[^0-9]/g, '');
      const defaultText = `Bonjour ${body.name}, nous souhaitons vérifier l authenticité du certificat N° ${cert.certificate_number || ''} émis pour ${cert.producer?.name || ''} sur la plateforme EthiMarket. Merci de nous confirmer sa validité.`;
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultText)}`;

      const { data: reqData } = await supabase
        .from('certification_verification_requests')
        .insert({
          producer_certification_id: certificationId,
          certification_body_id: body.id,
          triggered_by: adminId,
          channel: 'whatsapp',
          status: 'sent',
          message_sent: defaultText,
          sent_at: new Date().toISOString()
        })
        .select('id')
        .single();

      await updateCertificationStatus(certificationId, 'contact_sent', adminId, `Contact WhatsApp ouvert pour ${body.whatsapp}`);

      await logVerificationAction({
        producer_certification_id: certificationId,
        admin_id: adminId,
        action: 'WHATSAPP_VERIFY_TRIGGERED',
        previous_status: previousStatus,
        new_status: 'contact_sent',
        channel_used: 'whatsapp',
        details: { phone: body.whatsapp, requestId: reqData?.id }
      });

      return {
        success: true,
        channel: 'whatsapp',
        status: 'contact_sent',
        request_id: reqData?.id,
        external_url: waUrl,
        message: 'Lien direct WhatsApp généré avec message prérempli.'
      };
    }

    // CANAL 5 — TÉLÉPHONE
    if (body.phone && body.phone.trim().length > 0) {
      const { data: reqData } = await supabase
        .from('certification_verification_requests')
        .insert({
          producer_certification_id: certificationId,
          certification_body_id: body.id,
          triggered_by: adminId,
          channel: 'phone',
          status: 'pending',
          message_sent: `Contact téléphonique à effectuer au : ${body.phone}`,
          sent_at: new Date().toISOString()
        })
        .select('id')
        .single();

      await updateCertificationStatus(certificationId, 'pending', adminId, `Contact téléphonique en attente: ${body.phone}`);

      await logVerificationAction({
        producer_certification_id: certificationId,
        admin_id: adminId,
        action: 'PHONE_VERIFY_QUEUED',
        previous_status: previousStatus,
        new_status: 'pending',
        channel_used: 'phone',
        details: { phone: body.phone, requestId: reqData?.id }
      });

      return {
        success: true,
        channel: 'phone',
        status: 'pending',
        request_id: reqData?.id,
        message: `Numéro direct de l organisme : ${body.phone}`
      };
    }

    // CANAL 6 — MANUEL (FALLBACK)
    await updateCertificationStatus(certificationId, 'manual_required', adminId, 'Aucun canal de communication directe disponible');

    await logVerificationAction({
      producer_certification_id: certificationId,
      admin_id: adminId,
      action: 'MANUAL_REQUIRED_FALLBACK',
      previous_status: previousStatus,
      new_status: 'manual_required',
      channel_used: 'manual',
      details: { reason: 'Aucun canal disponible sur l organisme' }
    });

    return {
      success: false,
      channel: 'manual',
      status: 'manual_required',
      message: 'Aucun canal automatique disponible. Vérification manuelle requise.'
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur critique lors de la vérification en 1 clic';
    return {
      success: false,
      channel: 'manual',
      error: msg
    };
  }
}

/**
 * Enregistre une réponse manuelle reçue de l'organisme certificateur
 */
export async function recordManualResponse(
  certificationId: string,
  requestId: string,
  response: string,
  newStatus: ProducerCertificationStatus,
  adminId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const now = new Date().toISOString();

    // 1. Mise à jour de la requête
    const { error: reqErr } = await supabase
      .from('certification_verification_requests')
      .update({
        response_received: response,
        responded_at: now,
        status: newStatus === 'verified' ? 'success' : newStatus === 'rejected' ? 'failed' : 'pending'
      })
      .eq('id', requestId);

    if (reqErr) {
      return { success: false, error: reqErr.message };
    }

    // 2. Mise à jour de la certification
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      admin_notes: `Réponse manuelle enregistrée : ${response}`
    };

    if (newStatus === 'verified') {
      updatePayload.verified_by = adminId;
      updatePayload.verified_at = now;
    }

    const { error: certErr } = await supabase
      .from('producer_certifications')
      .update(updatePayload)
      .eq('id', certificationId);

    if (certErr) {
      return { success: false, error: certErr.message };
    }

    // 3. Log
    await logVerificationAction({
      producer_certification_id: certificationId,
      admin_id: adminId,
      action: 'MANUAL_RESPONSE_RECORDED',
      new_status: newStatus,
      channel_used: 'manual',
      details: { requestId, response }
    });

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur lors de l enregistrement de la réponse';
    return { success: false, error: msg };
  }
}

/**
 * Met à jour manuellement le statut d'une certification producteur
 */
export async function updateCertificationStatus(
  certificationId: string,
  newStatus: ProducerCertificationStatus,
  adminId: string,
  adminNotes?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Récupération du statut précédent
    const { data: current } = await supabase
      .from('producer_certifications')
      .select('status')
      .eq('id', certificationId)
      .single();

    const previousStatus = current ? (current.status as ProducerCertificationStatus) : null;
    const now = new Date().toISOString();

    const updatePayload: Record<string, unknown> = {
      status: newStatus
    };

    if (adminNotes !== undefined) {
      updatePayload.admin_notes = adminNotes;
    }

    if (newStatus === 'verified') {
      updatePayload.verified_by = adminId;
      updatePayload.verified_at = now;
    } else {
      updatePayload.verified_by = null;
      updatePayload.verified_at = null;
    }

    const { error } = await supabase
      .from('producer_certifications')
      .update(updatePayload)
      .eq('id', certificationId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Le trigger SQL trace automatiquement le changement de statut, 
    // mais nous journalisons également avec les détails explicites
    await logVerificationAction({
      producer_certification_id: certificationId,
      admin_id: adminId,
      action: 'STATUS_UPDATED',
      previous_status: previousStatus,
      new_status: newStatus,
      channel_used: 'manual',
      details: { adminNotes }
    });

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur mise à jour statut';
    return { success: false, error: msg };
  }
}

/**
 * Calcule les statistiques complètes pour le tableau de bord des certifications
 */
export async function getCertificationDashboardStats(): Promise<{
  data: CertificationDashboardStats | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('producer_certifications')
      .select(`
        id,
        status,
        expires_at,
        certification_body:certification_bodies!certification_body_id (region)
      `);

    if (error) {
      return { data: null, error: error.message };
    }

    const stats: CertificationDashboardStats = {
      total: data ? data.length : 0,
      unverified: 0,
      pending: 0,
      contact_sent: 0,
      verified: 0,
      rejected: 0,
      expired: 0,
      manual_required: 0,
      expiring_soon: 0,
      by_region: {
        'Africa': 0,
        'Asia': 0,
        'Latin America': 0,
        'Europe': 0,
        'North America': 0,
        'Oceania': 0,
        'Middle East': 0
      }
    };

    const today = new Date().toISOString().split('T')[0];
    const alertLimit = new Date();
    alertLimit.setDate(alertLimit.getDate() + DAYS_BEFORE_EXPIRY_ALERT);
    const alertLimitStr = alertLimit.toISOString().split('T')[0];

    (data || []).forEach((row) => {
      const st = row.status as ProducerCertificationStatus;
      if (st in stats) {
        (stats[st as keyof CertificationDashboardStats] as number)++;
      }

      // Expiring soon
      if (row.expires_at && st !== 'expired') {
        if (row.expires_at >= today && row.expires_at <= alertLimitStr) {
          stats.expiring_soon++;
        }
      }

      // Region stats
      const bodyRegion = (row.certification_body as { region?: CertificationRegion } | null)?.region;
      if (bodyRegion && bodyRegion in stats.by_region) {
        stats.by_region[bodyRegion]++;
      }
    });

    return { data: stats, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur calcul stats';
    return { data: null, error: msg };
  }
}

/**
 * Récupère le journal d'audit complet d'une certification producteur
 */
export async function getCertificationLogs(
  certificationId: string
): Promise<{
  data: CertificationVerificationLog[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('certification_verification_logs')
      .select(`
        *,
        admin_profile:profiles!admin_id (id, first_name, last_name, email)
      `)
      .eq('producer_certification_id', certificationId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data as CertificationVerificationLog[]) || [], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur récupération logs';
    return { data: [], error: msg };
  }
}
