import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Paperclip, CheckCheck, Check, FileText, Image as ImageIcon,
  ExternalLink, ShieldCheck, MapPin, X, Loader2, ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase, type ChatMessage, type Conversation, type Producer, type Profile } from '../../lib/supabase';

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

type ChatViewProps = {
  conversation: Conversation;
  currentUserId: string;
  interlocutor: InterlocutorInfo | null;
  onBack?: () => void;
  onMessageSent?: () => void;
};

export function ChatView({
  conversation,
  currentUserId,
  interlocutor,
  onBack,
  onMessageSent,
}: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  // File attachment state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!conversation?.id || !currentUserId) return;

    // Determine if we are participant_1 or participant_2
    const isParticipant1 = conversation.participant_1 === currentUserId;
    const unreadKey = isParticipant1 ? 'unread_count_1' : 'unread_count_2';

    // Update unread count on conversation if > 0
    if ((isParticipant1 ? conversation.unread_count_1 : conversation.unread_count_2) > 0) {
      await supabase
        .from('conversations')
        .update({ [unreadKey]: 0 })
        .eq('id', conversation.id);
    }

    // Mark unread messages from other user as read
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversation.id)
      .neq('sender_id', currentUserId)
      .is('read_at', null);
  }, [conversation, currentUserId]);

  // Load initial messages
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (isMounted) {
        setMessages((data as ChatMessage[]) || []);
        setLoading(false);
        setTimeout(() => scrollToBottom('auto'), 100);
        markAsRead();
      }
    };

    loadMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`chat_${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          if (newMsg.sender_id !== currentUserId) {
            markAsRead();
          }

          setTimeout(() => scrollToBottom('smooth'), 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const updatedMsg = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
          );
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [conversation.id, currentUserId, markAsRead]);

  // Handle send message
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !selectedFile) || sending) return;

    setSending(true);
    setUploadError('');

    try {
      let fileUrl = null;
      let fileName = null;
      let msgType: 'text' | 'file' | 'image' = 'text';

      if (selectedFile) {
        setFileUploading(true);
        // Sanitize file name
        const cleanName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${conversation.id}/${Date.now()}_${cleanName}`;

        const { error: uploadErr } = await supabase.storage
          .from('chat-files')
          .upload(filePath, selectedFile, { upsert: true });

        if (uploadErr) {
          throw new Error(`Erreur lors de l'envoi du fichier: ${uploadErr.message}`);
        }

        const { data: publicData } = supabase.storage
          .from('chat-files')
          .getPublicUrl(filePath);

        fileUrl = publicData.publicUrl;
        fileName = selectedFile.name;
        msgType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
        setFileUploading(false);
      }

      const content = inputText.trim() || (fileName ? `Fichier joint : ${fileName}` : '');

      const newMsgData = {
        conversation_id: conversation.id,
        sender_id: currentUserId,
        content,
        type: msgType,
        file_url: fileUrl,
        file_name: fileName,
        created_at: new Date().toISOString(),
      };

      // Optimistic insert into state
      const { data: insertedMsg, error: insertErr } = await supabase
        .from('messages')
        .insert(newMsgData)
        .select()
        .single();

      if (insertErr) {
        throw insertErr;
      }

      // Update conversation last_message
      const isParticipant1 = conversation.participant_1 === currentUserId;
      const otherUnreadKey = isParticipant1 ? 'unread_count_2' : 'unread_count_1';
      const currentUnreadCount = isParticipant1 ? conversation.unread_count_2 : conversation.unread_count_1;

      await supabase
        .from('conversations')
        .update({
          last_message: content,
          last_message_at: new Date().toISOString(),
          [otherUnreadKey]: (currentUnreadCount || 0) + 1,
        })
        .eq('id', conversation.id);

      setInputText('');
      setSelectedFile(null);
      if (insertedMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === insertedMsg.id)) return prev;
          return [...prev, insertedMsg as ChatMessage];
        });
      }
      setTimeout(() => scrollToBottom('smooth'), 100);
      if (onMessageSent) onMessageSent();
    } catch (err: unknown) {
      console.error('Send message error:', err);
      setUploadError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
      setFileUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Le fichier dépasse la taille maximale autorisée (10 Mo)');
      return;
    }

    setUploadError('');
    setSelectedFile(file);
  };

  const name = interlocutor?.name || 'Interlocuteur';
  const initials = interlocutor?.avatar_initials || name.slice(0, 2).toUpperCase();
  const avatarColor = interlocutor?.avatar_color || '#15803d';

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
      {/* ── Chat Header ── */}
      <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between gap-3 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs flex-shrink-0"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-sm">{name}</h3>
              {interlocutor?.is_verified && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                </span>
              )}
            </div>
            {interlocutor?.country && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-gray-400" />
                {interlocutor.country_flag} {interlocutor.country}
              </p>
            )}
          </div>
        </div>

        {interlocutor?.producer_slug && (
          <Link
            to={`/boutique/${interlocutor.producer_slug}`}
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-600 bg-brand-50 border border-brand-200 rounded-xl hover:bg-brand-100 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Voir boutique
          </Link>
        )}
      </div>

      {/* ── Chat Body (Messages) ── */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 min-h-0 bg-[#f8fafc]">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Chargement des messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
            <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center mb-3">
              💬
            </div>
            <p className="font-bold text-gray-700 text-sm mb-1">Démarrez la conversation</p>
            <p className="text-xs text-gray-500 max-w-xs">
              Posez vos questions sur les produits, la qualité, la logistique ou les prix sur mesure.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            const timeStr = new Date(msg.created_at).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-xs text-sm leading-relaxed ${
                    isMe
                      ? 'bg-brand-600 text-white rounded-br-none'
                      : 'bg-white text-gray-900 border border-gray-100 rounded-bl-none'
                  }`}
                >
                  {/* File Attachment preview */}
                  {msg.file_url && (
                    <div className="mb-2">
                      {msg.type === 'image' ? (
                        <a href={msg.file_url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl">
                          <img
                            src={msg.file_url}
                            alt={msg.file_name || 'Image'}
                            className="max-h-60 rounded-xl object-cover hover:opacity-90 transition-opacity"
                          />
                        </a>
                      ) : (
                        <a
                          href={msg.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                            isMe
                              ? 'bg-brand-700/50 border-brand-400 text-white hover:bg-brand-700'
                              : 'bg-gray-50 border-gray-200 text-brand-600 hover:bg-gray-100'
                          }`}
                        >
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate max-w-[180px]">{msg.file_name || 'Télécharger le fichier'}</span>
                          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 ml-auto" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Text content */}
                  {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}

                  {/* Footer time & read check */}
                  <div className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${isMe ? 'text-brand-100' : 'text-gray-400'}`}>
                    <span>{timeStr}</span>
                    {isMe && (
                      msg.read_at ? (
                        <CheckCheck className="w-3.5 h-3.5 text-blue-300" title="Lu" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-brand-200" title="Envoyé" />
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Selected File Bar ── */}
      {selectedFile && (
        <div className="bg-amber-50 border-t border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center gap-2 truncate">
            <Paperclip className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="font-semibold truncate">{selectedFile.name}</span>
            <span className="text-amber-600">({(selectedFile.size / 1024).toFixed(0)} Ko)</span>
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="p-1 text-amber-600 hover:text-amber-900 rounded-lg hover:bg-amber-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {uploadError && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-1.5 text-xs text-red-600 font-semibold">
          {uploadError}
        </div>
      )}

      {/* ── Input Bar ── */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png,.docx"
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || fileUploading}
          className="p-2.5 rounded-xl text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition-colors disabled:opacity-50"
          title="Joindre un fichier (PDF, JPG, PNG, DOCX)"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Écrire un message..."
          disabled={sending || fileUploading}
          className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
        />

        <button
          type="submit"
          disabled={(!inputText.trim() && !selectedFile) || sending || fileUploading}
          className="p-2.5 rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 disabled:hover:bg-brand-600 transition-colors shadow-xs flex items-center justify-center"
        >
          {sending || fileUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
}
