import { supabase } from './supabase';

export interface BucketDefinition {
  name: string;
  public: boolean;
}

export const ALL_BUCKETS: BucketDefinition[] = [
  { name: 'profile-photos', public: true },
  { name: 'farm-photos', public: true },
  { name: 'product-photos', public: true },
  { name: 'organization-logos', public: true },
  { name: 'organization-banners', public: true },
  { name: 'team-photos', public: true },
  { name: 'identity-documents', public: false },
  { name: 'certifications', public: false },
  { name: 'business-documents', public: false },
  { name: 'lab-analyses', public: false },
  { name: 'verifications', public: true },
  { name: 'products', public: true }
];

let bucketsChecked = false;

export async function ensureBucketsExist(): Promise<void> {
  if (bucketsChecked) return;
  bucketsChecked = true;

  try {
    for (const b of ALL_BUCKETS) {
      const { error } = await supabase.storage.createBucket(b.name, {
        public: b.public,
        fileSizeLimit: 10 * 1024 * 1024,
      });
      if (error && !error.message?.includes('already exists') && !error.message?.includes('Duplicate')) {
        console.warn(`Bucket ${b.name} creation check note:`, error.message);
      }
    }
  } catch (e) {
    console.warn('ensureBucketsExist failed silently:', e);
  }
}
