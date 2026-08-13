import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MessageSquare, ShoppingBag, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase, type Conversation, type Producer, type Profile } from '../../lib/supabase';
import { ChatView } from './ChatView';

type InterlocutorInfo = {
  id: string;
  name: string;
  email?: string;
  avatar_initials?: string;
  avatar_color?: string;
  avatar_url?: string | null;
  country?: string | null;
  country_flag?: string | null;
  is_verified?: boolean;
  producer_slug?: string | null;
  role?: string;
};

type ConversationWithMeta = Conversation & {
  interlocutor: InterlocutorInfo | null;
  unreadCount: number;
};

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetConvId = searchParams.get('conversation');

  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeConvId, setActiveConvId] = useState<string | null>(targetConvId);

  // Fetch conversations and resolve interlocutor details
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    // Fetch user's conversations
    const { data: convsData, error: convErr } = await supabase
      .from('conversations')
      .select('*')
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (convErr || !convsData) {
      setLoading(false);
      return;
    }

    // Collect all interlocutor IDs
    const interlocutorIds = convsData.map((c) =>
      c.participant_1 === user.id ? c.participant_2 : c.participant_1
    );

    if (interlocutorIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Fetch profiles & producers for these interlocutors
    const [{ data: profilesData }, { data: producersData }] = await Promise.all([
      supabase.from('profiles').select('*').in('id', interlocutorIds),
      supabase.from('producers').select('*').in('user_id', interlocutorIds),
    ]);

    const profileMap = new Map((profilesData as Profile[] || []).map((p) => [p.id, p]));
    const producerMap = new Map((producersData as Producer[] || []).map((p) => [p.user_id!, p]));

    const enriched: ConversationWithMeta[] = convsData.map((c) => {
      const partnerId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
      const partnerProfile = profileMap.get(partnerId);
      const partnerProducer = producerMap.get(partnerId);

      const isParticipant1 = c.participant_1 === user.id;
      const unreadCount = isParticipant1 ? c.unread_count_1 : c.unread_count_2;

      let name = 'Utilisateur';
      let country = null;
      let countryFlag = null;
      let isVerified = false;
      let producerSlug = null;
      let avatarColor = '#15803d';

      if (partnerProducer) {
        name = partnerProducer.name;
        country = partnerProducer.country;
        countryFlag = partnerProducer.country_flag;
        isVerified = partnerProducer.verified;
        producerSlug = partnerProducer.slug;
        avatarColor = partnerProducer.avatar_color || '#15803d';
      } else if (partnerProfile) {
        name = partnerProfile.full_name || partnerProfile.company || partnerProfile.email.split('@')[0];
        country = partnerProfile.country;
      }

      const initials = name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      return {
        ...c,
        unreadCount: unreadCount || 0,
        interlocutor: {
          id: partnerId,
          name,
          email: partnerProfile?.email,
          avatar_initials: initials,
          avatar_color: avatarColor,
          avatar_url: partnerProfile?.avatar_url,
          country,
          country_flag: countryFlag,
          is_verified: isVerified,
          producer_slug: producerSlug,
          role: partnerProfile?.role,
        },
      };
    });

    setConversations(enriched);
    setLoading(false);

    // If targetConvId was passed in searchParams, ensure activeConvId is set
    if (targetConvId && enriched.some((c) => c.id === targetConvId)) {
      setActiveConvId(targetConvId);
    } else if (!activeConvId && enriched.length > 0) {
      // Don't auto-select on mobile, but auto-select on desktop if activeConvId is null
      if (window.innerWidth >= 1024) {
        setActiveConvId(enriched[0].id);
      }
    }
  }, [user, targetConvId, activeConvId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Subscribe to real-time updates on conversations list
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user_conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `participant_1=eq.${user.id}`,
        },
        () => fetchConversations()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `participant_2=eq.${user.id}`,
        },
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  const selectConversation = (id: string) => {
    setActiveConvId(id);
    setSearchParams({ conversation: id }, { replace: true });
  };

  // Filter conversations by search term
  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const nameMatch = c.interlocutor?.name.toLowerCase().includes(search.toLowerCase());
    const emailMatch = c.interlocutor?.email?.toLowerCase().includes(search.toLowerCase());
    const msgMatch = c.last_message?.toLowerCase().includes(search.toLowerCase());
    return nameMatch || emailMatch || msgMatch;
  });

  const activeConv = conversations.find((c) => c.id === activeConvId) || null;

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-500" />
        Chargement de vos conversations...
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-black text-gray-900">Messagerie</h1>
        <p className="text-xs text-gray-500">Échangez directement avec vos producteurs et partenaires</p>
      </div>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center max-w-lg mx-auto my-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-2">Aucune conversation</h3>
          <p className="text-sm text-gray-500 mb-6">
            Vous n'avez pas encore de message. Contactez un producteur depuis sa fiche produit ou sa boutique pour démarrer une discussion !
          </p>
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-bold text-sm rounded-xl hover:bg-brand-700 transition-colors shadow-xs"
          >
            <ShoppingBag className="w-4 h-4" /> Parcourir le catalogue
          </Link>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 bg-white rounded-3xl border border-gray-100 p-3 shadow-xs">
          {/* ── Left Column: Conversations List ── */}
          <div
            className={`lg:col-span-5 flex flex-col h-full border-r border-gray-100 pr-0 lg:pr-3 ${
              activeConvId ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Search Input */}
            <div className="relative mb-3 flex-shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un contact..."
                className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 bg-gray-50/50"
              />
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  Aucun contact correspondant à "{search}".
                </div>
              ) : (
                filtered.map((c) => {
                  const isActive = c.id === activeConvId;
                  const name = c.interlocutor?.name || 'Contact';
                  const initials = c.interlocutor?.avatar_initials || name.slice(0, 2).toUpperCase();
                  const avatarColor = c.interlocutor?.avatar_color || '#15803d';

                  const dateStr = c.last_message_at
                    ? new Date(c.last_message_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : '';

                  return (
                    <button
                      key={c.id}
                      onClick={() => selectConversation(c.id)}
                      className={`w-full text-left p-3 rounded-2xl transition-all flex items-start gap-3 relative ${
                        isActive
                          ? 'bg-brand-50 border border-brand-200/60 shadow-2xs'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xs flex-shrink-0"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {initials}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="font-bold text-gray-900 text-sm truncate">{name}</h4>
                          <span className="text-[10px] text-gray-400 font-medium flex-shrink-0">{dateStr}</span>
                        </div>

                        <p className={`text-xs truncate ${c.unreadCount > 0 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                          {c.last_message || 'Nouvelle conversation'}
                        </p>
                      </div>

                      {c.unreadCount > 0 && (
                        <span className="bg-brand-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs flex-shrink-0">
                          {c.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Right Column: Chat View ── */}
          <div
            className={`lg:col-span-7 flex flex-col h-full ${
              !activeConvId ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {activeConv && user ? (
              <ChatView
                conversation={activeConv}
                currentUserId={user.id}
                interlocutor={activeConv.interlocutor}
                onBack={() => setActiveConvId(null)}
                onMessageSent={() => fetchConversations()}
              />
            ) : (
              <div className="hidden lg:flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="font-bold text-gray-700 text-base mb-1">Sélectionnez une conversation</h3>
                <p className="text-xs text-gray-400 max-w-xs">
                  Choisissez un contact dans la liste de gauche pour afficher l'historique des échanges.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
