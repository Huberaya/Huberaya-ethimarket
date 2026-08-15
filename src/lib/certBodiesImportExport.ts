import type { CertificationBody } from '../lib/supabase';

export interface ExportReport {
  exportedAt: string;
  totalCount: number;
  countriesCount: number;
  regions: Record<string, number>;
  bodies: Partial<CertificationBody>[];
}

export interface ImportResult {
  totalInFile: number;
  inserted: number;
  updated: number;
  duplicatesSkipped: number;
  errors: string[];
}

/**
 * Exporte la liste complète des organismes certificateurs sous format JSON standardisé
 */
export function exportCertificationBodiesToJson(bodies: CertificationBody[]): string {
  const uniqueCountries = new Set(bodies.map(b => b.country.trim()).filter(Boolean));
  const regionBreakdown: Record<string, number> = {};

  bodies.forEach(b => {
    const reg = b.region || 'Unknown';
    regionBreakdown[reg] = (regionBreakdown[reg] || 0) + 1;
  });

  const payload: ExportReport = {
    exportedAt: new Date().toISOString(),
    totalCount: bodies.length,
    countriesCount: uniqueCountries.size,
    regions: regionBreakdown,
    bodies: bodies.map(b => ({
      name: b.name,
      acronym: b.acronym,
      country: b.country,
      region: b.region,
      sub_region: b.sub_region,
      city: b.city,
      address: b.address,
      postal_code: b.postal_code,
      latitude: b.latitude,
      longitude: b.longitude,
      foundation_year: b.foundation_year,
      employee_count: b.employee_count,
      logo_url: b.logo_url,
      website: b.website,
      verification_url: b.verification_url,
      email_contact: b.email_contact,
      phone: b.phone,
      whatsapp: b.whatsapp,
      contact_form_url: b.contact_form_url,
      languages: b.languages || [],
      certification_types: b.certification_types || [],
      accreditations: b.accreditations || [],
      domains: b.domains || [],
      trust_level: b.trust_level || 'verified',
      reliability_score: b.reliability_score || 95,
      average_cost: b.average_cost,
      average_duration: b.average_duration,
      timezone: b.timezone,
      contact_hours: b.contact_hours,
      verification_sources: b.verification_sources || [],
      internal_notes: b.internal_notes,
      is_active: b.is_active !== undefined ? b.is_active : true
    }))
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Déclenche le téléchargement du fichier JSON exporté dans le navigateur
 */
export function downloadJsonFile(content: string, filename: string = `ethimarket_organismes_mondiaux_${new Date().toISOString().slice(0, 10)}.json`) {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Détecte si un organisme existe déjà dans la liste existante (comparaison normalisée)
 */
export function isDuplicateBody(
  candidate: Partial<CertificationBody>,
  existingList: CertificationBody[]
): CertificationBody | undefined {
  const candName = (candidate.name || '').toLowerCase().trim();
  const candCountry = (candidate.country || '').toLowerCase().trim();
  const candAcronym = (candidate.acronym || '').toLowerCase().trim();

  return existingList.find(item => {
    const itemName = item.name.toLowerCase().trim();
    const itemCountry = item.country.toLowerCase().trim();
    const itemAcronym = (item.acronym || '').toLowerCase().trim();

    // Même nom et même pays OU même sigle et même pays
    const sameNameAndCountry = candName === itemName && candCountry === itemCountry;
    const sameAcronymAndCountry = candAcronym.length > 1 && candAcronym === itemAcronym && candCountry === itemCountry;

    return sameNameAndCountry || sameAcronymAndCountry;
  });
}
