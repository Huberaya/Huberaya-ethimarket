import { supabase } from './supabase';
import type {
  CertificationBody,
  CertificationBodyInsert,
  CertificationBodyUpdate,
  CertificationBodyFilters,
  CertificationBodyContact,
  CertificationStandard,
  VerificationChannel
} from './supabase';

/**
 * Détecte le meilleur canal de vérification disponible selon la priorité stricte :
 * api → email → form → whatsapp → phone → manual
 */
export function detectBestChannel(body: CertificationBody): VerificationChannel {
  if (body.api_endpoint && body.api_endpoint.trim().length > 0) {
    return 'api';
  }
  if (body.email_contact && body.email_contact.trim().length > 0) {
    return 'email';
  }
  if (body.verification_url || body.contact_form_url) {
    return 'form';
  }
  if (body.whatsapp && body.whatsapp.trim().length > 0) {
    return 'whatsapp';
  }
  if (body.phone && body.phone.trim().length > 0) {
    return 'phone';
  }
  return 'manual';
}

/**
 * Récupère la liste paginée et filtrée des organismes certificateurs
 */
export async function getCertificationBodies(
  filters?: CertificationBodyFilters,
  page: number = 1,
  pageSize: number = 20
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
      .select('*, contacts:certification_body_contacts (*), standards:certification_standards (*)', { count: 'exact' });

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
        query = query.not('api_endpoint', 'is', null).neq('api_endpoint', '');
      }
      if (filters.has_email) {
        query = query.not('email_contact', 'is', null).neq('email_contact', '');
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
 * Récupère un organisme par son identifiant avec ses contacts et standards associés
 */
export async function getCertificationBodyById(
  id: string
): Promise<{
  data: CertificationBody | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('certification_bodies')
      .select(`
        *,
        contacts:certification_body_contacts (*),
        standards:certification_standards (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data as CertificationBody) || null, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur récupération organisme';
    return { data: null, error: msg };
  }
}

/**
 * Crée un nouvel organisme certificateur
 */
export async function createCertificationBody(
  body: CertificationBodyInsert
): Promise<{
  data: CertificationBody | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('certification_bodies')
      .insert({
        ...body,
        last_updated_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data as CertificationBody) || null, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur création organisme';
    return { data: null, error: msg };
  }
}

/**
 * Met à jour un organisme certificateur
 */
export async function updateCertificationBody(
  id: string,
  updates: CertificationBodyUpdate
): Promise<{
  data: CertificationBody | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('certification_bodies')
      .update({
        ...updates,
        last_updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data as CertificationBody) || null, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur mise à jour organisme';
    return { data: null, error: msg };
  }
}

/**
 * Désactive un organisme certificateur (soft delete)
 */
export async function deactivateCertificationBody(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('certification_bodies')
      .update({ is_active: false, last_updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur désactivation organisme';
    return { success: false, error: msg };
  }
}

/**
 * Importe en lot plusieurs organismes certificateurs (upsert par nom et pays)
 */
export async function importCertificationBodies(
  bodies: CertificationBodyInsert[]
): Promise<{
  inserted: number;
  errors: string[];
  error: string | null;
}> {
  try {
    let inserted = 0;
    const errors: string[] = [];

    for (const body of bodies) {
      const { error } = await supabase
        .from('certification_bodies')
        .upsert(
          {
            ...body,
            last_updated_at: new Date().toISOString()
          },
          { onConflict: 'name,country' }
        );

      if (error) {
        errors.push(`${body.name} (${body.country}): ${error.message}`);
      } else {
        inserted++;
      }
    }

    return {
      inserted,
      errors,
      error: errors.length > 0 ? `${errors.length} erreurs lors de l import` : null
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur critique lors de l import';
    return { inserted: 0, errors: [msg], error: msg };
  }
}

/**
 * Recherche rapide d'organismes pour autocomplétion
 */
export async function searchCertificationBodies(
  query: string,
  limit: number = 10
): Promise<{
  data: Pick<CertificationBody, 'id' | 'name' | 'acronym' | 'country' | 'region' | 'trust_level' | 'certification_types'>[];
  error: string | null;
}> {
  try {
    const term = `%${query.trim()}%`;
    const { data, error } = await supabase
      .from('certification_bodies')
      .select('id, name, acronym, country, region, trust_level, certification_types')
      .or(`name.ilike.${term},acronym.ilike.${term}`)
      .eq('is_active', true)
      .limit(limit);

    if (error) {
      return { data: [], error: error.message };
    }

    return {
      data: (data as Pick<CertificationBody, 'id' | 'name' | 'acronym' | 'country' | 'region' | 'trust_level' | 'certification_types'>[]) || [],
      error: null
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur recherche organismes';
    return { data: [], error: msg };
  }
}

/**
 * Ajoute un contact référent à un organisme certificateur
 */
export async function addContact(
  bodyId: string,
  contact: Omit<CertificationBodyContact, 'id' | 'certification_body_id' | 'created_at'>
): Promise<{ data: CertificationBodyContact | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('certification_body_contacts')
      .insert({
        ...contact,
        certification_body_id: bodyId
      })
      .select('*')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data as CertificationBodyContact) || null, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur ajout contact';
    return { data: null, error: msg };
  }
}

/**
 * Supprime un contact référent
 */
export async function removeContact(
  contactId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('certification_body_contacts')
      .delete()
      .eq('id', contactId);

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
 * Ajoute un standard / label audité à un organisme certificateur
 */
export async function addStandard(
  bodyId: string,
  standard: Omit<CertificationStandard, 'id' | 'certification_body_id' | 'created_at'>
): Promise<{ data: CertificationStandard | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('certification_standards')
      .insert({
        ...standard,
        certification_body_id: bodyId
      })
      .select('*')
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data as CertificationStandard) || null, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur ajout standard';
    return { data: null, error: msg };
  }
}

/**
 * Supprime un standard
 */
export async function removeStandard(
  standardId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('certification_standards')
      .delete()
      .eq('id', standardId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur suppression standard';
    return { success: false, error: msg };
  }
}
