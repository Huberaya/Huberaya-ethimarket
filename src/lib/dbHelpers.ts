// src/lib/dbHelpers.ts
// Universal helper functions for sanitizing payloads and saving producer data to Supabase

export function cleanPayload(data: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Ignore empty strings and undefined
    if (value === '' || value === undefined) continue;

    // Keep explicit null
    if (value === null) {
      cleaned[key] = null;
      continue;
    }

    // Keep everything else
    cleaned[key] = value;
  }

  return cleaned;
}

export const toIntOrNull = (val: unknown): number | null => {
  if (val === '' || val === null || val === undefined) return null;
  const num = parseInt(String(val).trim(), 10);
  return isNaN(num) ? null : num;
};

export const toFloatOrNull = (val: unknown): number | null => {
  if (val === '' || val === null || val === undefined) return null;
  const num = parseFloat(String(val).trim());
  return isNaN(num) ? null : num;
};

export const toStringOrNull = (val: unknown): string | null => {
  if (val === '' || val === null || val === undefined) return null;
  const str = String(val).trim();
  return str === '' ? null : str;
};

export const toDateOrNull = (val: unknown): string | null => {
  if (val === '' || val === null || val === undefined) return null;
  const str = String(val).trim();
  return str === '' ? null : str;
};

export const toBooleanOrNull = (val: unknown): boolean | null => {
  if (val === null || val === undefined || val === '') return null;
  return Boolean(val);
};

export const toArrayOrNull = (val: unknown): unknown[] | null => {
  if (val === null || val === undefined) return null;
  if (Array.isArray(val)) return val.length > 0 ? val : null;
  return null;
};

/**
 * Known producer field type definitions for auto-sanitization across the platform
 */
export const PRODUCER_FIELD_TYPES: Record<string, 'int' | 'float' | 'string' | 'date' | 'boolean' | 'array'> = {
  // Integer columns
  founded_year: 'int',
  employee_count: 'int',
  employees_count: 'int',
  families_impacted: 'int',
  delivery_days: 'int',
  delivery_days_avg: 'int',
  full_time_employees: 'int',
  part_time_employees: 'int',
  working_hours_per_week: 'int',
  profile_completion: 'int',
  ethimarket_score: 'int',
  review_count: 'int',
  product_count: 'int',
  order_count: 'int',
  satisfaction_rate: 'int',
  environmental_score: 'int',
  social_score: 'int',
  governance_score: 'int',
  traceability_score: 'int',
  quality_score: 'int',

  // Float / Decimal columns
  latitude: 'float',
  longitude: 'float',
  surface_value: 'float',
  surface_area: 'float',
  annual_capacity: 'float',
  average_yield: 'float',
  minimum_wage: 'float',
  min_wage: 'float',
  co2_saved: 'float',
  water_saved: 'float',
  trees_preserved: 'float',
  protected_area: 'float',
  rating: 'float',

  // Date / Timestamp columns
  birth_date: 'date',
  identity_issue_date: 'date',
  identity_expiry: 'date',
  identity_expiry_date: 'date',
  organization_creation_date: 'date',
  ethical_charter_signed_at: 'date',
  identity_verified_at: 'date',
  last_updated_at: 'date',

  // Boolean columns
  verified: 'boolean',
  identity_verified: 'boolean',
  has_insurance: 'boolean',
  ethical_charter_signed: 'boolean',
  health_insurance: 'boolean',
  top_seller: 'boolean',

  // Array columns
  product_types: 'array',
  farming_methods: 'array',
  seasonality: 'array',
  delivery_countries: 'array',
  transport_modes: 'array',
  packaging_types: 'array',
  languages_spoken: 'array',
  farm_photos: 'array',
  team_photos: 'array',
  product_photos: 'array',
  certifications: 'array',
};

export const sanitizePayload = (
  data: Record<string, unknown>,
  types?: Record<string, 'int' | 'float' | 'string' | 'date' | 'boolean' | 'array'>
): Record<string, unknown> => {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const type = types?.[key];

    if (type === 'int') cleaned[key] = toIntOrNull(value);
    else if (type === 'float') cleaned[key] = toFloatOrNull(value);
    else if (type === 'date') cleaned[key] = toDateOrNull(value);
    else if (type === 'boolean') cleaned[key] = toBooleanOrNull(value);
    else if (type === 'array') cleaned[key] = toArrayOrNull(value);
    else if (type === 'string') cleaned[key] = toStringOrNull(value);
    else {
      if (value === '' || value === undefined) {
        cleaned[key] = null;
      } else if (typeof value === 'string' && value.trim() === '') {
        cleaned[key] = null;
      } else {
        cleaned[key] = value;
      }
    }
  }

  return cleaned;
};

export const sanitizeProducerPayload = (data: Record<string, unknown>): Record<string, unknown> => {
  return sanitizePayload(data, PRODUCER_FIELD_TYPES);
};

type SupabaseClientLike = {
  from: (table: string) => {
    update: (data: Record<string, unknown>) => {
      eq: (col: string, val: string) => {
        select: (cols: string) => Promise<{ data: unknown[] | null; error: { message: string } | null }>;
      } & Promise<{ data: unknown[] | null; error: { message: string } | null }>;
    };
  };
};

export async function saveProducerField(
  supabase: SupabaseClientLike,
  producerIdOrUserId: string,
  field: string,
  value: unknown
) {
  const cleanValue = (value === '' || value === undefined) ? null : value;
  const sanitized = sanitizeProducerPayload({ [field]: cleanValue });

  const { data: res, error: err1 } = await supabase
    .from('producers')
    .update(sanitized)
    .eq('id', producerIdOrUserId)
    .select('id');

  if (!err1 && res && res.length > 0) {
    return { error: null };
  }

  const { error: err2 } = await supabase
    .from('producers')
    .update(sanitized)
    .eq('user_id', producerIdOrUserId);

  return { error: err2 };
}

export async function saveProducerFields(
  supabase: SupabaseClientLike,
  producerIdOrUserId: string,
  data: Record<string, unknown>
) {
  const cleaned = cleanPayload(data);
  const sanitized = sanitizeProducerPayload(cleaned);

  if (Object.keys(sanitized).length === 0) return { error: null };

  const updatePayload = {
    ...sanitized,
    last_updated_at: new Date().toISOString(),
  };

  const { data: res, error: err1 } = await supabase
    .from('producers')
    .update(updatePayload)
    .eq('id', producerIdOrUserId)
    .select('id');

  if (!err1 && res && res.length > 0) {
    return { error: null };
  }

  const { error: err2 } = await supabase
    .from('producers')
    .update(updatePayload)
    .eq('user_id', producerIdOrUserId);

  return { error: err2 };
}
