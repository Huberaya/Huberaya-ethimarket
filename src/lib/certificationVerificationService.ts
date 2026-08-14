import { supabase } from './supabase';
import type {
  ProducerCertification,
  ProducerCertificationFilters,
  ProducerCertificationStatus,
  VerificationChannel,
  VerificationResult,
  CertificationDashboardStats,
  TemplateVariables,
  CertificationRegion
} from './supabase';
import { DAYS_BEFORE_EXPIRY_ALERT } from './supabase';
import {
  DEMO_PRODUCER_CERTIFICATIONS,
  DEMO_VERIFICATION_LOGS,
  DEMO_VERIFICATION_REQUESTS
} from './mockCertificationsData';

// Stockage mémoire local des certifications de démonstration (pour permettre les tests interactifs même sans BDD)
let localDemoCertifications = [...DEMO_PRODUCER_CERTIFICATIONS];
let localDemoLogs = { ...DEMO_VERIFICATION_LOGS };
let localDemoRequests = { ...DEMO_VERIFICATION_REQUESTS };

/**
 * Remplace toutes les variables {{nom_variable}} ou {nom_variable} dans un texte
 */
export function resolveTemplateVariables(
  template: string,
  variables: TemplateVariables
): string {
  if (!template) return '';
  return template
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
      const val = variables[key as keyof TemplateVariables];
      return val !== undefined && val !== null ? String(val) : '';
    })
    .replace(/\{(\w+)\}/g, (_, key) => {
      const val = variables[key as keyof TemplateVariables];
      return val !== undefined && val !== null ? String(val) : '';
    });
}

/**
 * Alias pour le rendu de templates avec un dictionnaire de variables
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string | number | undefined | null>
): string {
  if (!template) return '';
  return template
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
      const val = variables[key];
      return val !== undefined && val !== null ? String(val) : '';
    })
    .replace(/\{(\w+)\}/g, (_, key) => {
      const val = variables[key];
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

    // Si Supabase contient des données réelles, on les retourne
    if (!error && data && data.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const alertLimit = new Date();
      alertLimit.setDate(alertLimit.getDate() + DAYS_BEFORE_EXPIRY_ALERT);
      const alertLimitStr = alertLimit.toISOString().split('T')[0];

      const processedData: ProducerCertification[] = data.map((item) => {
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
        count: count || processedData.length,
        error: null
      };
    }

    // Fallback dynamique sur le jeu de données de référence / démo si la BDD est vierge
    let demoList = [...localDemoCertifications];

    if (filters) {
      if (filters.status && filters.status !== 'ALL') {
        demoList = demoList.filter((c) => c.status === filters.status);
      }
      if (filters.certification_body_id) {
        demoList = demoList.filter((c) => c.certification_body_id === filters.certification_body_id);
      }
      if (filters.expires_before) {
        demoList = demoList.filter((c) => c.expires_at && c.expires_at <= (filters.expires_before as string));
      }
      if (filters.expires_after) {
        demoList = demoList.filter((c) => c.expires_at && c.expires_at >= (filters.expires_after as string));
      }
      if (filters.country) {
        demoList = demoList.filter(
          (c) =>
            c.country_of_issue?.toLowerCase() === filters.country?.toLowerCase() ||
            c.producer?.country?.toLowerCase() === filters.country?.toLowerCase()
        );
      }
      if (filters.search && filters.search.trim()) {
        const s = filters.search.trim().toLowerCase();
        demoList = demoList.filter(
          (c) =>
            c.certificate_number?.toLowerCase().includes(s) ||
            c.producer?.name?.toLowerCase().includes(s) ||
            c.certification_body?.name?.toLowerCase().includes(s) ||
            c.certification_type?.toLowerCase().includes(s)
        );
      }
    }

    const totalDemoCount = demoList.length;
    const paginatedDemo = demoList.slice(from, to + 1);

    return {
      data: paginatedDemo,
      count: totalDemoCount,
      error: null
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue lors du chargement des certifications';
    return { data: localDemoCertifications.slice(0, pageSize), count: localDemoCertifications.length, error: msg };
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

    if (!error && data) {
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
    }

    // Fallback sur le jeu de données de démonstration
    const demoItem = localDemoCertifications.find((c) => c.id === id);
    if (demoItem) {
      const today = new Date().toISOString().split('T')[0];
      const alertLimit = new Date();
      alertLimit.setDate(alertLimit.getDate() + DAYS_BEFORE_EXPIRY_ALERT);
      const alertLimitStr = alertLimit.toISOString().split('T')[0];

      let is_expired = false;
      let expires_soon = false;

      if (demoItem.expires_at) {
        if (demoItem.expires_at < today) {
          is_expired = true;
        } else if (demoItem.expires_at <= alertLimitStr) {
          expires_soon = true;
        }
      }

      const itemWithAudit: ProducerCertification = {
        ...demoItem,
        is_expired,
        expires_soon,
        verification_requests: localDemoRequests[id] || [],
        logs: localDemoLogs[id] || []
      };

      return { data: itemWithAudit, error: null };
    }

    return { data: null, error: 'Certification introuvable' };
  } catch (err: unknown) {
    const demoItem = localDemoCertifications.find((c) => c.id === id);
    if (demoItem) {
      return {
        data: {
          ...demoItem,
          verification_requests: localDemoRequests[id] || [],
          logs: localDemoLogs[id] || []
        },
        error: null
      };
    }
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

    // Mise à jour de l'état local démo en mémoire si présent
    const demoIndex = localDemoCertifications.findIndex((c) => c.id === certificationId);
    if (demoIndex >= 0) {
      localDemoCertifications[demoIndex] = {
        ...localDemoCertifications[demoIndex],
        status: newStatus,
        admin_notes: `Réponse manuelle enregistrée : ${response}`,
        verified_by: newStatus === 'verified' ? adminId : null,
        verified_at: newStatus === 'verified' ? now : null
      };

      if (!localDemoLogs[certificationId]) {
        localDemoLogs[certificationId] = [];
      }
      localDemoLogs[certificationId].unshift({
        id: `log-demo-${Date.now()}`,
        producer_certification_id: certificationId,
        admin_id: adminId,
        action: 'MANUAL_RESPONSE_RECORDED',
        new_status: newStatus,
        previous_status: localDemoCertifications[demoIndex].status,
        channel_used: 'manual',
        details: { requestId, response },
        created_at: now,
        admin_profile: {
          id: adminId,
          first_name: 'Administrateur',
          last_name: 'Audit',
          email: 'admin.audit@ethimarket.com'
        }
      });
    }

    // 1. Mise à jour de la requête dans Supabase
    const { error: reqErr } = await supabase
      .from('certification_verification_requests')
      .update({
        response_received: response,
        responded_at: now,
        status: newStatus === 'verified' ? 'success' : newStatus === 'rejected' ? 'failed' : 'pending'
      })
      .eq('id', requestId);

    if (reqErr) {
      // Si la ligne locale a été mise à jour, on renvoie quand même un succès
      if (demoIndex >= 0) return { success: true, error: null };
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
      if (demoIndex >= 0) return { success: true, error: null };
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
    const now = new Date().toISOString();

    // Mise à jour de l'état local démo en mémoire
    const demoIndex = localDemoCertifications.findIndex((c) => c.id === certificationId);
    let previousStatus: ProducerCertificationStatus | null = null;

    if (demoIndex >= 0) {
      previousStatus = localDemoCertifications[demoIndex].status;
      localDemoCertifications[demoIndex] = {
        ...localDemoCertifications[demoIndex],
        status: newStatus,
        admin_notes: adminNotes !== undefined ? adminNotes : localDemoCertifications[demoIndex].admin_notes,
        verified_by: newStatus === 'verified' ? adminId : null,
        verified_at: newStatus === 'verified' ? now : null
      };

      if (!localDemoLogs[certificationId]) {
        localDemoLogs[certificationId] = [];
      }
      localDemoLogs[certificationId].unshift({
        id: `log-demo-${Date.now()}`,
        producer_certification_id: certificationId,
        admin_id: adminId,
        action: 'STATUS_UPDATED',
        previous_status: previousStatus,
        new_status: newStatus,
        channel_used: 'manual',
        details: { adminNotes },
        created_at: now,
        admin_profile: {
          id: adminId,
          first_name: 'Administrateur',
          last_name: 'Audit',
          email: 'admin.audit@ethimarket.com'
        }
      });
    }

    // Récupération du statut précédent dans Supabase
    const { data: current } = await supabase
      .from('producer_certifications')
      .select('status')
      .eq('id', certificationId)
      .single();

    if (current) {
      previousStatus = current.status as ProducerCertificationStatus;
    }

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
      if (demoIndex >= 0) {
        return { success: true, error: null };
      }
      return { success: false, error: error.message };
    }

    // Journalisation
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

    // Utilisation des données Supabase si disponibles
    const dataset = (!error && data) ? data : localDemoCertifications.map((c) => ({
      id: c.id,
      status: c.status,
      expires_at: c.expires_at,
      certification_body: { region: c.certification_body?.region || 'Europe' }
    }));

    const stats: CertificationDashboardStats = {
      total: dataset.length,
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

    dataset.forEach((row) => {
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
 * Réinitialise ou peuple les certifications de démonstration
 */
export function resetDemoCertifications(): void {
  localDemoCertifications = [...DEMO_PRODUCER_CERTIFICATIONS];
  localDemoLogs = { ...DEMO_VERIFICATION_LOGS };
  localDemoRequests = { ...DEMO_VERIFICATION_REQUESTS };
}

/**
 * Récupère le journal d'audit complet d'une certification producteur
 */
/**
 * Récupère la liste filtrée et paginée des organismes certificateurs
 */
export async function getCertificationBodies(
  filters?: CertificationBodyFilters,
  page: number = 1,
  pageSize: number = 50
): Promise<{
  data: CertificationBody[];
  count: number;
  error: string | null;
}> {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('certification_bodies')
      .select(`
        *,
        standards:certification_standards (*),
        contacts:certification_body_contacts (*)
      `, { count: 'exact' });

    if (filters) {
      if (filters.region && filters.region !== 'ALL') {
        query = query.eq('region', filters.region);
      }
      if (filters.country) {
        query = query.eq('country', filters.country);
      }
      if (filters.trust_level && filters.trust_level !== 'ALL') {
        query = query.eq('trust_level', filters.trust_level);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.has_api) {
        query = query.not('api_endpoint', 'is', null);
      }
      if (filters.has_email) {
        query = query.not('email_contact', 'is', null);
      }
      if (filters.search && filters.search.trim()) {
        const term = `%${filters.search.trim()}%`;
        query = query.or(`name.ilike.${term},acronym.ilike.${term},country.ilike.${term}`);
      }
    }

    query = query.order('name', { ascending: true }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return { data: [], count: 0, error: error.message };
    }

    return {
      data: (data as CertificationBody[]) || [],
      count: count || 0,
      error: null
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur chargement organismes';
    return { data: [], count: 0, error: msg };
  }
}

/**
 * Récupère un organisme certificateur par son identifiant avec standards, contacts et certifications
 */
export async function getCertificationBodyById(
  id: string
): Promise<{
  data: (CertificationBody & { producer_certifications_count?: number }) | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('certification_bodies')
      .select(`
        *,
        standards:certification_standards (*),
        contacts:certification_body_contacts (*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return { data: null, error: error ? error.message : 'Organisme introuvable' };
    }

    // Récupération du nombre de certifications associées
    const { count } = await supabase
      .from('producer_certifications')
      .select('*', { count: 'exact', head: true })
      .eq('certification_body_id', id);

    return {
      data: {
        ...(data as CertificationBody),
        producer_certifications_count: count || 0
      },
      error: null
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue';
    return { data: null, error: msg };
  }
}

/**
 * Crée un nouvel organisme de certification
 */
export async function createCertificationBody(
  bodyData: Partial<CertificationBody>
): Promise<{ data: CertificationBody | null; error: string | null }> {
  try {
    const now = new Date().toISOString();
    const payload = {
      name: bodyData.name,
      acronym: bodyData.acronym || null,
      country: bodyData.country || 'France',
      region: bodyData.region || 'Europe',
      sub_region: bodyData.sub_region || null,
      website: bodyData.website || null,
      verification_url: bodyData.verification_url || null,
      api_endpoint: bodyData.api_endpoint || null,
      api_key_required: bodyData.api_key_required ?? false,
      api_key_encrypted: bodyData.api_key_encrypted || null,
      email_contact: bodyData.email_contact || null,
      phone: bodyData.phone || null,
      whatsapp: bodyData.whatsapp || null,
      contact_form_url: bodyData.contact_form_url || null,
      languages: bodyData.languages || ['fr'],
      certification_types: bodyData.certification_types || ['organic'],
      trust_level: bodyData.trust_level || 'verified',
      is_active: bodyData.is_active ?? true,
      internal_notes: bodyData.internal_notes || null,
      created_at: now,
      last_updated_at: now
    };

    const { data, error } = await supabase
      .from('certification_bodies')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as CertificationBody, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur création organisme';
    return { data: null, error: msg };
  }
}

/**
 * Met à jour un organisme de certification
 */
export async function updateCertificationBody(
  id: string,
  updates: Partial<CertificationBody>
): Promise<{ data: CertificationBody | null; error: string | null }> {
  try {
    const payload = {
      ...updates,
      last_updated_at: new Date().toISOString()
    };
    // Nettoyage des relations jointes avant l'update
    delete (payload as Record<string, unknown>).standards;
    delete (payload as Record<string, unknown>).contacts;
    delete (payload as Record<string, unknown>).producer_certifications_count;

    const { data, error } = await supabase
      .from('certification_bodies')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as CertificationBody, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur mise à jour organisme';
    return { data: null, error: msg };
  }
}

/**
 * Supprime un organisme de certification
 */
export async function deleteCertificationBody(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('certification_bodies')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur suppression organisme';
    return { success: false, error: msg };
  }
}

/**
 * Ajoute un standard de certification à un organisme
 */
export async function addCertificationStandard(
  standard: {
    certification_body_id: string;
    name: string;
    code?: string | null;
    type?: CertificationType | null;
    description?: string | null;
    scope?: string | null;
    geographic_coverage?: string | null;
  }
): Promise<{ data: CertificationStandard | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('certification_standards')
      .insert({
        ...standard,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as CertificationStandard, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur ajout standard';
    return { data: null, error: msg };
  }
}

/**
 * Supprime un standard de certification
 */
export async function deleteCertificationStandard(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('certification_standards')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur suppression standard';
    return { success: false, error: msg };
  }
}

/**
 * Ajoute un contact à un organisme de certification
 */
export async function addCertificationBodyContact(
  contact: {
    certification_body_id: string;
    name: string;
    role?: string | null;
    email?: string | null;
    phone?: string | null;
    language?: string | null;
    is_primary?: boolean;
    notes?: string | null;
  }
): Promise<{ data: CertificationBodyContact | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('certification_body_contacts')
      .insert({
        ...contact,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as CertificationBodyContact, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur ajout contact';
    return { data: null, error: msg };
  }
}

/**
 * Supprime un contact d'organisme de certification
 */
export async function deleteCertificationBodyContact(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('certification_body_contacts')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur suppression contact';
    return { success: false, error: msg };
  }
}

/**
 * Récupère tous les templates de messages de vérification
 */
export async function getCertificationMessageTemplates(): Promise<{
  data: CertificationMessageTemplate[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('certification_message_templates')
      .select('*')
      .order('channel', { ascending: true })
      .order('is_default', { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data as CertificationMessageTemplate[]) || [], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur chargement templates';
    return { data: [], error: msg };
  }
}

/**
 * Crée un nouveau template de message
 */
export async function createCertificationMessageTemplate(
  templateData: Partial<CertificationMessageTemplate>
): Promise<{ data: CertificationMessageTemplate | null; error: string | null }> {
  try {
    const now = new Date().toISOString();
    const payload = {
      name: templateData.name,
      language: templateData.language || 'fr',
      channel: templateData.channel || 'email',
      subject: templateData.subject || null,
      body: templateData.body || '',
      variables: templateData.variables || [
        'producer_name',
        'certificate_number',
        'certification_type',
        'certification_body_name',
        'issued_at',
        'expires_at',
        'platform_name',
        'admin_name',
        'admin_email'
      ],
      is_default: templateData.is_default ?? false,
      created_by: templateData.created_by || null,
      created_at: now,
      updated_at: now
    };

    const { data, error } = await supabase
      .from('certification_message_templates')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as CertificationMessageTemplate, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur création template';
    return { data: null, error: msg };
  }
}

/**
 * Met à jour un template de message
 */
export async function updateCertificationMessageTemplate(
  id: string,
  updates: Partial<CertificationMessageTemplate>
): Promise<{ data: CertificationMessageTemplate | null; error: string | null }> {
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('certification_message_templates')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as CertificationMessageTemplate, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur mise à jour template';
    return { data: null, error: msg };
  }
}

/**
 * Supprime un template de message
 */
export async function deleteCertificationMessageTemplate(
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
    const msg = err instanceof Error ? err.message : 'Erreur suppression template';
    return { success: false, error: msg };
  }
}

// Aliases pour faciliter l'intégration
export const getMessageTemplates = getCertificationMessageTemplates;
export const createMessageTemplate = createCertificationMessageTemplate;
export const updateMessageTemplate = updateCertificationMessageTemplate;
export const deleteMessageTemplate = deleteCertificationMessageTemplate;


