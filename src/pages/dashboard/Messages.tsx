import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MessageSquare, ShieldCheck, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { supabase, type Conversation, type Profile, type Producer } from '../../lib/supabase';
import ChatView from './ChatView';

interface ConversationItem {
  conversation: Conversation;
  interlocutorName: string;
  interlocutorInitials: string;
  interlocutorColor: string;
  interlocutorAvatar?: string | null;
  interlocutorCountry?: string | null;
  interlocutorFlag?: string | null;
  isVerifiedProducer: boolean;
  unreadCount: number;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeParamId = searchParams.get('id') || searchParams.get('conversation');

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(activeParamId);

  // Sync state if URL query param changes
  useEffect(() => {
    if (activeParamId) {
      setSelectedConversationId(activeParamId);
    }
  }, [activeParamId]);

  // Load conversations
  const loadConversations = async () => {
    if (!user) return;

    try {
      // Query conversations involving current user
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error || !data) {
        setLoading(false);
        return;
      }

      const convList = data as Conversation[];

      // Gather interlocutor user IDs
      const interlocutorIds = convList.map(c => c.participant_1 === user.id ? c.participant_2 : c.participant_1);

      if (interlocutorIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Fetch profiles & producers for all interlocutors
      const [{ data: profiles }, { data: producers }] = await Promise.all([
        supabase.from('profiles').select('*').in('id', interlocutorIds),
        supabase.from('producers').select('*').in('user_id', interlocutorIds),
      ]);

      const profMap = new Map((profiles as Profile[] || []).map(p => [p.id, p]));
      const prodMap = new Map((producers as Producer[] || []).map(p => [p.user_id!, p]));

      const items: ConversationItem[] = convList.map(conv => {
        const interlocutorId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;
        const prof = profMap.get(interlocutorId);
        const prod = prodMap.get(interlocutorId);

        const name = prod?.name || prof?.full_name || prof?.company || prof?.email?.split('@')[0] || 'Utilisateur';
        const initials = prod?.avatar_initials || name.slice(0, 2).toUpperCase();
        const color = prod?.avatar_color || '#15803d';
        const isParticipant1 = conv.participant_1 === user.id;
        const unread = isParticipant1 ? conv.unread_count_1 : conv.unread_count_2;

        return {
          conversation: conv,
          interlocutorName: name,
          interlocutorInitials: initials,
          interlocutorColor: color,
          interlocutorAvatar: prof?.avatar_url || prod?.logo_url,
          interlocutorCountry: prod?.country || prof?.country || 'France',
          interlocutorFlag: prod?.country_flag || '🌍',
          isVerifiedProducer: !!prod?.verified,
          unreadCount: unread || 0,
        };
      });

      setConversations(items);

      // Auto-select first conversation if none active and on desktop
      if (!selectedConversationId && items.length > 0 && window.innerWidth >= 1024) {
        setSelectedConversationId(items[0].conversation.id);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();

    if (!user) return;

    // Realtime channel for conversation updates
    const channel = supabase
      .channel(`user-conversations:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
      }, () => {
        loadConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const selectConversation = (id: string) => {
    setSelectedConversationId(id);
    setSearchParams({ id });
  };

  const filteredConversations = conversations.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.interlocutorName.toLowerCase().includes(q) ||
      (item.conversation.last_message || '').toLowerCase().includes(q)
    );
  });

  const activeItem = conversations.find(c => c.conversation.id === selectedConversationId);

  const formatMessageDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-900 mb-2">Connexion requise</h2>
        <p className="text-gray-500 text-sm mb-4">Veuillez vous connecter pour accéder à vos messages.</p>
        <Link to="/connexion" className="btn-primary py-2 px-5">Se connecter</Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex h-[calc(100vh-140px)] min-h-[500px]">
      {/* ── LEFT COLUMN: CONVERSATION LIST ── */}
      <div
        className={`w-full lg:w-80 xl:w-96 flex flex-col border-r border-gray-100 flex-shrink-0 ${
          selectedConversationId ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {/* Header & Search */}
        <div className="p-4 border-b border-gray-100 space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-600" />
              Messagerie
            </h1>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {conversations.length}
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un interlocuteur..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-gray-900 outline-none focus:border-brand-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Conversations Scroll List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loading ? (
            <div className="p-8 text-center text-gray-400 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
              <span className="text-xs">Chargement...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400 my-auto">
              <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-3">
                💬
              </div>
              <p className="font-bold text-gray-700 text-sm mb-1">
                {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
              </p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto mb-4">
                Contactez un producteur directement depuis la fiche d'un produit ou sa boutique !
              </p>
              <Link
                to="/catalogue"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors"
              >
                Explorer le catalogue <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            filteredConversations.map((item) => {
              const isActive = item.conversation.id === selectedConversationId;

              return (
                <button
                  key={item.conversation.id}
                  onClick={() => selectConversation(item.conversation.id)}
                  className={`w-full text-left p-4 flex items-start gap-3.5 transition-all hover:bg-gray-50 ${
                    isActive ? 'bg-brand-50/60 border-l-4 border-brand-500 pl-3' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-xs relative"
                    style={{ backgroundColor: item.interlocutorColor }}
                  >
                    {item.interlocutorAvatar ? (
                      <img src={item.interlocutorAvatar} alt="" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      item.interlocutorInitials
                    )}
                    {item.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white font-extrabold text-[10px] flex items-center justify-center rounded-full border-2 border-white shadow-xs">
                        {item.unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-bold text-gray-900 text-xs truncate">
                          {item.interlocutorName}
                        </span>
                        {item.isVerifiedProducer && (
                          <ShieldCheck className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" title="Vérifié" />
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {formatMessageDate(item.conversation.last_message_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs truncate ${item.unreadCount > 0 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                        {item.conversation.last_message || 'Nouvelle conversation'}
                      </p>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {item.interlocutorFlag}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── RIGHT COLUMN: ACTIVE CHAT ── */}
      <div
        className={`flex-1 flex flex-col bg-gray-50 h-full ${
          selectedConversationId ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {activeItem ? (
          <ChatView
            conversation={activeItem.conversation}
            currentUserId={user.id}
            onBack={() => setSelectedConversationId(null)}
            onMessageSent={loadConversations}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-400 bg-white">
            <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center mb-4 shadow-xs">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-1">
              Vos échanges EthiMarket
            </h2>
            <p className="text-xs text-gray-500 max-w-sm mb-6 leading-relaxed">
              Sélectionnez une conversation dans la liste pour discuter des produits, négocier les volumes ou demander un devis sur-mesure.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
