import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase, type Profile, type Producer } from './supabase';
import type { User } from '@supabase/supabase-js';
import { sanitizeProducerPayload } from './dbHelpers';

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  producer: Producer | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [producer, setProducer] = useState<Producer | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      setProducer(null);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch existing profile and producer in parallel
      const [{ data: prof }, { data: prod }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle(),
        supabase.from('producers').select('*').eq('user_id', currentUser.id).maybeSingle(),
      ]);

      let currentProfile = prof as Profile | null;
      let currentProducer = prod as Producer | null;

      const metadataRole = currentUser.user_metadata?.role;
      const userRole = currentProfile?.role || metadataRole || 'buyer';
      
      const metaFirstName = currentUser.user_metadata?.first_name || '';
      const metaLastName  = currentUser.user_metadata?.last_name || '';
      const metaFullName  = `${metaFirstName} ${metaLastName}`.trim();
      const userFullName  = currentProfile?.full_name || metaFullName || currentUser.email?.split('@')[0] || 'Utilisateur';

      // 2. Auto-heal Profile if missing
      if (!currentProfile) {
        const { data: newProf } = await supabase.from('profiles').upsert({
          id: currentUser.id,
          email: currentUser.email || '',
          full_name: userFullName,
          first_name: metaFirstName,
          last_name: metaLastName,
          role: userRole,
          country: currentUser.user_metadata?.country || 'France',
          phone: currentUser.user_metadata?.phone || null,
        }, { onConflict: 'id' }).select().maybeSingle();

        if (newProf) {
          currentProfile = newProf as Profile;
        }
      }

      // 3. Auto-heal Producer if user is a producer but has no producer record
      if (userRole === 'producer' && !currentProducer) {
        const shopName = userFullName || 'Ma Boutique Producteur';
        const firstName = metaFirstName || userFullName.split(' ')[0] || '';
        const lastName  = metaLastName || userFullName.split(' ')[1] || '';
        const initials  = ((firstName[0] || '') + (lastName[0] || '') || shopName.slice(0, 2)).toUpperCase();
        const colors    = ['#15803d', '#92400e', '#b45309', '#7c2d12', '#451a03', '#0369a1'];
        const color     = colors[Math.floor(Math.random() * colors.length)];
        const generatedSlug = slugify(`${shopName}-${currentUser.id.slice(0, 8)}`);

        const { data: newProd } = await supabase.from('producers').upsert(sanitizeProducerPayload({
          user_id: currentUser.id,
          name: shopName,
          slug: generatedSlug,
          country: currentProfile?.country || currentUser.user_metadata?.country || 'France',
          country_flag: '🌍',
          avatar_initials: initials,
          avatar_color: color,
          banner_color: color,
          phone: currentProfile?.phone || currentUser.user_metadata?.phone || null,
          verified: false,
          top_seller: false,
          rating: 0,
          review_count: 0,
          product_count: 0,
          order_count: 0,
          satisfaction_rate: 100,
          response_time: '24h',
          certifications: [],
          profile_completion: 10,
        }), { onConflict: 'user_id' }).select().maybeSingle();

        if (newProd) {
          currentProducer = newProd as Producer;
        } else {
          // Retry fetch in case upsert created it without returning row
          const { data: retryProd } = await supabase.from('producers').select('*').eq('user_id', currentUser.id).maybeSingle();
          if (retryProd) {
            currentProducer = retryProd as Producer;
          }
        }
      }

      setProfile(currentProfile);
      setProducer(currentProducer);
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    if (user) await loadUserData(user);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      loadUserData(currentUser);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      (async () => { await loadUserData(currentUser); })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setProducer(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, producer, loading, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
