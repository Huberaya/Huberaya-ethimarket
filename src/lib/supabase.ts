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
  type: 'new_producer' | 'dispute' | 'expiring_cert' | 'fraud' | 'new_order';
  title: string;
  message: string;
  link: string | null;
  priority: 'low' | 'normal' | 'urgent';
  read: boolean;
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

