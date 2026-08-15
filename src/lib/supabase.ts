import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://placeholder.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  phone: string | null;
  whatsapp: string | null;
  country: string | null;
  city: string | null;
  role: string;
  is_admin?: boolean;
  avatar_url: string | null;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  emoji: string;
  product_count: number;
  slug: string;
  image_url?: string | null;
};

export type Producer = {
  id: string;
  name: string;
  slug: string;
  country: string;
  country_flag: string;
  description: string | null;
  avatar_initials: string;
  avatar_color: string;
  rating: number;
  review_count: number;
  product_count: number;
  order_count: number;
  satisfaction_rate: number;
  response_time: string;
  verified: boolean;
  top_seller: boolean;
  founded_year: number | null;
  employee_count: number | null;
  banner_color: string;
  certifications: string[];
  user_id: string | null;
  region: string | null;
  story: string | null;
  website: string | null;
  logo_url: string | null;
  banner_url: string | null;
  org_type: string | null;
  registration_number: string | null;
  city: string | null;
  address: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  product_types: string[];
  surface_value: number | null;
  surface_unit: string | null;
  annual_capacity: string | null;
  farming_methods: string[];
  seasonality: string[];
  delivery_countries: string[];
  transport_modes: string[];
  delivery_days_avg: number | null;
  packaging_types: string[];
  has_insurance: boolean | null;
  min_wage: string | null;
  working_conditions: string | null;
  co2_saved: string | null;
  water_saved: string | null;
  trees_preserved: string | null;
  social_actions: string | null;
  ethical_score: number | null;
  whatsapp: string | null;
  linkedin: string | null;
  facebook: string | null;
  instagram: string | null;
  youtube: string | null;
  languages_spoken: string[];
  farm_photos: string[];
  team_photos: string[];
  video_url: string | null;
  profile_complete: boolean | null;
  profile_status: string | null;
  profile_completion: number;
  ethimarket_score: number;
  badge_level: 'bronze' | 'silver' | 'gold' | null;
  last_score_update: string | null;
  score_details: ScoreDetails | null;
  families_impacted: number | null;
  phone: string | null;
  identity_type: 'cni' | 'passport' | 'license' | null;
  identity_number: string | null;
  identity_expiry: string | null;
  identity_recto_url: string | null;
  identity_verso_url: string | null;
  identity_verified: boolean | null;
  business_documents: Record<string, string | null>;
  lab_analysis_url: string | null;
  ethical_charter_url: string | null;
  ethical_charter_signed: boolean | null;
  short_description: string | null;
  long_description: string | null;
  birth_date: string | null;
  identity_country: string | null;
  identity_issue_date: string | null;
  identity_verified_at: string | null;
  business_email: string | null;
  landmark: string | null;
  average_yield: string | null;
  techniques_description: string | null;
  current_available_volume: string | null;
  full_time_employees: number | null;
  part_time_employees: number | null;
  minimum_wage: string | null;
  minimum_wage_currency: string | null;
  working_hours_per_week: number | null;
  paid_leave: string | null;
  health_insurance: boolean | null;
  protected_area: string | null;
  signature_url: string | null;
  ethical_charter_signed_at: string | null;
  product_photos: string[];
  last_updated_at: string | null;
  shipping_paid_by: string | null;
  logistics_partners: string | null;
  verification_status?: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'suspended' | 'banned' | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  rejection_reason?: string | null;
  rejection_details?: Record<string, unknown>[] | Record<string, unknown> | null;
  verification_notes?: string | null;
  last_audit_date?: string | null;
  next_audit_date?: string | null;
  audit_count?: number | null;
};

export type ScoreCategory = {
  score: number;
  max: number;
  [key: string]: number | boolean | string;
};

export type ScoreDetails = {
  total: number;
  badge: 'bronze' | 'silver' | 'gold' | null;
  categories: {
    certifications: ScoreCategory;
    traceability: ScoreCategory;
    ethics: ScoreCategory;
    environment: ScoreCategory;
    satisfaction: ScoreCategory;
  };
  penalties: { total: number };
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  producer_id: string | null;
  category_id: string | null;
  country: string;
  country_flag: string;
  description: string | null;
  price: number;
  price_unit: string;
  moq_value: number;
  moq_unit: string;
  stock_value: number;
  stock_unit: string;
  monthly_capacity: number;
  delivery_days: string;
  certifications: string[];
  rating: number;
  review_count: number;
  emoji: string;
  bg_color: string;
  image_url?: string | null;
  featured: boolean;
  top_seller: boolean;
  user_id: string | null;
  short_description: string | null;
  region: string | null;
  currency: string;
  status: string;
  planting_date: string | null;
  harvest_date: string | null;
  packaging_date: string | null;
  farming_method: string | null;
  gps_coordinates: string | null;
  co2_estimate: string | null;
  trace_qr_code: string | null;
  product_score: number;
  score_calculation: ProductScoreCalc | null;
  producers?: Producer | null;
  categories?: Category | null;
};

export type ProductScoreCalc = {
  total: number;
  badge: 'bronze' | 'silver' | 'gold' | null;
  producer_score: number;
  product_specific: { score: number; max: number; gps: boolean; dates: boolean; certs: boolean };
};

export type Review = {
  id: string;
  product_id: string;
  author_name: string;
  author_company: string | null;
  rating: number;
  content: string;
  created_at: string;
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  image_url: string | null;
  author_name: string;
  author_avatar: string | null;
  published_at: string;
  read_time: number;
  featured: boolean;
};

export type VerificationStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

export type ProducerVerification = {
  id: string;
  producer_id: string;
  section_1_status: VerificationStatus;
  section_2_status: VerificationStatus;
  section_3_status: VerificationStatus;
  section_4_status: VerificationStatus;
  section_5_status: VerificationStatus;
  rejection_reasons: Record<string, string>;
  submitted_at_1: string | null;
  submitted_at_2: string | null;
  submitted_at_3: string | null;
  submitted_at_4: string | null;
  submitted_at_5: string | null;
  validated_by: string | null;
  validated_at: string | null;
  overall_score: number;
  badge_level: 'bronze' | 'silver' | 'gold' | null;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
};

export type VerificationDocument = {
  id: string;
  verification_id: string;
  section: number;
  doc_type: string;
  file_path: string;
  label: string;
  created_at: string;
};

export type VerificationCertification = {
  id: string;
  verification_id: string;
  cert_type: string;
  cert_number: string;
  certifying_body: string;
  issued_at: string;
  expires_at: string;
  file_path: string;
  sticker_path: string | null;
  status: VerificationStatus;
  created_at: string;
};

export type VerificationLabAnalysis = {
  id: string;
  verification_id: string;
  lab_name: string;
  analysis_date: string;
  analysis_types: string[];
  file_path: string;
  created_at: string;
};

export type VerificationEthicalCommitment = {
  id: string;
  verification_id: string;
  employee_count: number;
  min_wage: string;
  weekly_hours: string;
  has_paid_leave: boolean;
  has_social_security: boolean;
  working_conditions_desc: string;
  ppe_photos: string[];
  anti_discrimination_path: string | null;
  no_child_labor_path: string | null;
  impacted_families: number;
  community_actions: string;
  environment_policy: string;
  water_management: string;
  waste_management: string;
  uses_renewable_energy: boolean;
  co2_estimate: string;
  charter_signature: string;
  created_at: string;
};

export type VerificationLog = {
  id: string;
  verification_id: string;
  admin_id: string | null;
  action: string;
  section: number | null;
  message: string;
  created_at: string;
};

export type OrderStatus = 'new' | 'processing' | 'shipped' | 'delivered' | 'disputed' | 'cancelled' | 'refunded';

export type Order = {
  id: string;
  buyer_id: string | null;
  producer_id: string | null;
  product_id: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  total_amount: number;
  commission_rate: number;
  commission_amount: number;
  escrow_amount: number;
  status: OrderStatus;
  shipping_method: string | null;
  shipping_cost: number;
  customs_cost: number;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  producers?: Producer | null;
  products?: Product | null;
};

export type DisputeStatus = 'open' | 'investigating' | 'resolved' | 'closed';
export type DisputePriority = 'low' | 'normal' | 'urgent';

export type Dispute = {
  id: string;
  order_id: string;
  buyer_id: string | null;
  producer_id: string | null;
  reason: string;
  description: string;
  status: DisputeStatus;
  priority: DisputePriority;
  resolution: string | null;
  refund_amount: number;
  created_at: string;
  resolved_at: string | null;
  updated_at: string;
  orders?: Order | null;
  producers?: Producer | null;
};

export type AdminNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  producer_id?: string | null;
  user_id?: string | null;
  data?: Record<string, unknown> | null;
  link?: string | null;
  priority?: 'low' | 'normal' | 'urgent';
  is_read?: boolean;
  read?: boolean;
  read_at?: string | null;
  created_at: string;
};

export type VerificationHistory = {
  id: string;
  producer_id: string;
  action: string;
  old_status?: string | null;
  new_status?: string | null;
  admin_id?: string | null;
  reason?: string | null;
  details?: Record<string, unknown> | null;
  documents_reviewed?: string[] | null;
  created_at: string;
};

export type AdminAuditLog = {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

export type Conversation = {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message: string | null;
  last_message_at: string;
  unread_count_1: number;
  unread_count_2: number;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type?: 'text' | 'file' | 'image';
  file_url?: string | null;
  file_name?: string | null;
  read_at?: string | null;
  created_at: string;
};

export type CertificationBody = {
  id: string;
  name: string;
  acronym: string | null;
  country: string;
  region: CertificationRegion;
  sub_region: string | null;
  website: string | null;
  verification_url: string | null;
  api_endpoint: string | null;
  api_key_required: boolean;
  api_key_encrypted: string | null;
  email_contact: string | null;
  phone: string | null;
  whatsapp: string | null;
  contact_form_url: string | null;
  languages: string[];
  certification_types: CertificationType[];
  trust_level: TrustLevel;
  is_active: boolean;
  internal_notes: string | null;
  last_updated_at: string;
  created_at: string;
  // Relations optionnelles
  contacts?: CertificationBodyContact[];
  standards?: CertificationStandard[];
  // Rétrocompatibilité d'affichage
  short_name?: string;
  logo_url?: string | null;
  verification_instructions?: string | null;
  description?: string | null;
  headquarters_country?: string | null;
  coverage?: string[] | null;
  contact_email?: string | null;
  contact_phone?: string | null;
};

// ==============================================================================
// MODULE MONDIAL DE VÉRIFICATION DES CERTIFICATIONS (ÉTAPE 3)
// ==============================================================================

export type CertificationRegion =
  | 'Africa'
  | 'Asia'
  | 'Latin America'
  | 'Europe'
  | 'North America'
  | 'Oceania'
  | 'Middle East';

export type CertificationType =
  | 'organic'
  | 'fair_trade'
  | 'ethical'
  | 'sustainable'
  | 'other';

export type TrustLevel =
  | 'verified'
  | 'unverified'
  | 'pending';

export type VerificationChannel =
  | 'api'
  | 'email'
  | 'form'
  | 'phone'
  | 'whatsapp'
  | 'manual';

export type ProducerCertificationStatus =
  | 'unverified'
  | 'pending'
  | 'contact_sent'
  | 'verified'
  | 'rejected'
  | 'expired'
  | 'manual_required';

export type VerificationRequestStatus =
  | 'sent'
  | 'pending'
  | 'success'
  | 'failed'
  | 'no_response';

export type CertificationBodyContact = {
  id: string;
  certification_body_id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  language: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
};

export type CertificationStandard = {
  id: string;
  certification_body_id: string;
  name: string;
  code: string | null;
  type: CertificationType | null;
  description: string | null;
  scope: string | null;
  geographic_coverage: string | null;
  created_at: string;
};

export type ProducerCertification = {
  id: string;
  producer_id: string;
  certification_body_id: string | null;
  certification_standard_id: string | null;
  certificate_number: string | null;
  issued_at: string | null;
  expires_at: string | null;
  document_path: string | null;
  country_of_issue: string | null;
  status: ProducerCertificationStatus;
  admin_notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations optionnelles
  certification_body?: CertificationBody | null;
  certification_standard?: CertificationStandard | null;
  producer?: Pick<Producer, 'id' | 'name' | 'country'> | null;
  verified_by_profile?: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'email'> | null;
  verification_requests?: CertificationVerificationRequest[];
  logs?: CertificationVerificationLog[];
  // Champs calculés UI
  is_expired?: boolean;
  expires_soon?: boolean;
};

export type CertificationVerificationRequest = {
  id: string;
  producer_certification_id: string;
  certification_body_id: string | null;
  triggered_by: string;
  channel: VerificationChannel;
  status: VerificationRequestStatus;
  message_sent: string | null;
  response_received: string | null;
  sent_at: string;
  responded_at: string | null;
  created_at: string;
  // Relations optionnelles
  triggered_by_profile?: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'email'> | null;
  certification_body?: CertificationBody | null;
};

export type CertificationVerificationLog = {
  id: string;
  producer_certification_id: string;
  admin_id: string;
  action: string;
  previous_status: ProducerCertificationStatus | null;
  new_status: ProducerCertificationStatus | null;
  channel_used: VerificationChannel | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
  // Relations optionnelles
  admin_profile?: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'email'> | null;
};

export type TemplateVersionSnapshot = {
  version: number;
  subject: string | null;
  body: string;
  variables: string[];
  saved_at: string;
  modified_by: string | null;
};

export type CertificationMessageTemplate = {
  id: string;
  title?: string;
  name: string; // Rétrocompatibilité : name ou title
  language: string;
  channel: VerificationChannel;
  subject: string | null;
  body: string;
  variables: string[];
  is_default: boolean;
  version?: number;
  previous_version?: TemplateVersionSnapshot | null;
  last_modified_by?: string | null;
  last_modified_by_profile?: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'email'> | null;
  created_by: string | null;
  created_by_profile?: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'email'> | null;
  created_at: string;
  updated_at: string;
};

// ==============================================================================
// TYPES UTILITAIRES CRUD & SERVICES (FORMULAIRES & FILTRES)
// ==============================================================================

export type CertificationBodyInsert = Omit<CertificationBody, 'id' | 'created_at' | 'last_updated_at' | 'contacts' | 'standards' | 'short_name' | 'logo_url' | 'verification_instructions' | 'description' | 'headquarters_country' | 'coverage' | 'contact_email' | 'contact_phone'>;
export type CertificationBodyUpdate = Partial<CertificationBodyInsert>;

export type ProducerCertificationInsert = {
  producer_id: string;
  certification_body_id?: string | null;
  certification_standard_id?: string | null;
  certificate_number?: string | null;
  issued_at?: string | null;
  expires_at?: string | null;
  document_path?: string | null;
  country_of_issue?: string | null;
  status?: ProducerCertificationStatus;
  admin_notes?: string | null;
};

export type ProducerCertificationUpdate = Partial<ProducerCertificationInsert> & {
  status?: ProducerCertificationStatus;
  admin_notes?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
};

export type CertificationMessageTemplateInsert = Omit<CertificationMessageTemplate, 'id' | 'created_at' | 'updated_at'>;
export type CertificationMessageTemplateUpdate = Partial<CertificationMessageTemplateInsert>;

export type VerificationResult = {
  success: boolean;
  channel: VerificationChannel;
  message?: string;
  error?: string;
  request_id?: string;
  status?: ProducerCertificationStatus;
  external_url?: string;
};

export type CertificationDashboardStats = {
  total: number;
  unverified: number;
  pending: number;
  contact_sent: number;
  verified: number;
  rejected: number;
  expired: number;
  manual_required: number;
  expiring_soon: number;
  by_region: Record<CertificationRegion, number>;
};

export type CertificationBodyFilters = {
  search?: string;
  region?: CertificationRegion | 'ALL';
  country?: string;
  certification_type?: CertificationType | 'ALL';
  trust_level?: TrustLevel | 'ALL';
  is_active?: boolean;
  has_api?: boolean;
  has_email?: boolean;
};

export type ProducerCertificationFilters = {
  search?: string;
  status?: ProducerCertificationStatus | 'ALL';
  region?: CertificationRegion | 'ALL';
  country?: string;
  certification_type?: CertificationType | 'ALL';
  expires_before?: string;
  expires_after?: string;
  certification_body_id?: string;
};

export type TemplateVariables = {
  producer_name: string;
  certificate_number: string;
  certification_type: string;
  certification_body_name: string;
  issued_at: string;
  expires_at: string;
  document_url?: string;
  platform_name: string;
  admin_name: string;
  admin_email: string;
};

// ==============================================================================
// CONSTANTES GLOBALES UI & MÉTIER
// ==============================================================================

export const DAYS_BEFORE_EXPIRY_ALERT = 30;

export const CERTIFICATION_REGIONS: { value: CertificationRegion; labelFr: string; labelEn: string }[] = [
  { value: 'Africa', labelFr: 'Afrique', labelEn: 'Africa' },
  { value: 'Asia', labelFr: 'Asie', labelEn: 'Asia' },
  { value: 'Latin America', labelFr: 'Amérique Latine', labelEn: 'Latin America' },
  { value: 'Europe', labelFr: 'Europe', labelEn: 'Europe' },
  { value: 'North America', labelFr: 'Amérique du Nord', labelEn: 'North America' },
  { value: 'Oceania', labelFr: 'Océanie', labelEn: 'Oceania' },
  { value: 'Middle East', labelFr: 'Moyen-Orient', labelEn: 'Middle East' }
];

export const CERTIFICATION_TYPES: { value: CertificationType; labelFr: string; labelEn: string; icon: string }[] = [
  { value: 'organic', labelFr: 'Agriculture Biologique (Bio)', labelEn: 'Organic', icon: 'Leaf' },
  { value: 'fair_trade', labelFr: 'Commerce Équitable', labelEn: 'Fair Trade', icon: 'Scale' },
  { value: 'ethical', labelFr: 'Éthique & Social', labelEn: 'Ethical & Social', icon: 'HeartHandshake' },
  { value: 'sustainable', labelFr: 'Durable & Environnement', labelEn: 'Sustainable & Environment', icon: 'Globe' },
  { value: 'other', labelFr: 'Autre certification', labelEn: 'Other', icon: 'Award' }
];

export const VERIFICATION_CHANNELS: { 
  value: VerificationChannel; 
  labelFr: string; 
  labelEn: string; 
  iconName: string; 
  badgeColor: string 
}[] = [
  { value: 'api', labelFr: 'API Automatique', labelEn: 'Automated API', iconName: 'Cpu', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'email', labelFr: 'Email direct', labelEn: 'Direct Email', iconName: 'Mail', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'form', labelFr: 'Portail Web', labelEn: 'Web Portal', iconName: 'Globe', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'whatsapp', labelFr: 'WhatsApp', labelEn: 'WhatsApp', iconName: 'MessageSquare', badgeColor: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'phone', labelFr: 'Téléphone', labelEn: 'Phone Call', iconName: 'Phone', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'manual', labelFr: 'Contact Manuel', labelEn: 'Manual Contact', iconName: 'UserCheck', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' }
];

export const PRODUCER_CERTIFICATION_STATUSES: {
  value: ProducerCertificationStatus;
  labelFr: string;
  labelEn: string;
  badgeColor: string;
  iconName: string;
}[] = [
  { value: 'unverified', labelFr: 'Non vérifié', labelEn: 'Unverified', badgeColor: 'bg-gray-100 text-gray-700 border-gray-300', iconName: 'HelpCircle' },
  { value: 'pending', labelFr: 'En attente', labelEn: 'Pending', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200', iconName: 'Clock' },
  { value: 'contact_sent', labelFr: 'Demande envoyée', labelEn: 'Contact Sent', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200', iconName: 'Send' },
  { value: 'verified', labelFr: 'Vérifié & Conforme', labelEn: 'Verified', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200', iconName: 'CheckCircle2' },
  { value: 'rejected', labelFr: 'Rejeté / Invalide', labelEn: 'Rejected', badgeColor: 'bg-red-50 text-red-700 border-red-200', iconName: 'XCircle' },
  { value: 'expired', labelFr: 'Certificat Expiré', labelEn: 'Expired', badgeColor: 'bg-orange-50 text-orange-700 border-orange-200', iconName: 'AlertTriangle' },
  { value: 'manual_required', labelFr: 'Action manuelle requise', labelEn: 'Manual Required', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200', iconName: 'AlertOctagon' }
];

export const TRUST_LEVELS: {
  value: TrustLevel;
  labelFr: string;
  labelEn: string;
  badgeColor: string;
  iconName: string;
}[] = [
  { value: 'verified', labelFr: 'Organisme Officiel Vérifié', labelEn: 'Verified Body', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200', iconName: 'ShieldCheck' },
  { value: 'pending', labelFr: 'En cours de validation', labelEn: 'Pending Review', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200', iconName: 'Clock' },
  { value: 'unverified', labelFr: 'Non vérifié', labelEn: 'Unverified', badgeColor: 'bg-gray-100 text-gray-700 border-gray-300', iconName: 'HelpCircle' }
];

