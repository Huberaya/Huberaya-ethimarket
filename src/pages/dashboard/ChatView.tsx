import { useState, useEffect, useRef } from 'react';
import {
  Send, Paperclip, FileText, Download, CheckCheck,
  Check, ArrowLeft, Store, ShieldCheck, X, Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase, type Conversation, type Message, type Profile, type Producer } from '../../lib/supabase';

interface ChatViewProps {
  conversation: Conversation;
  currentUserId: string;
  onBack?: () => void;
  onMessageSent?: () => void;
}

interface InterlocutorInfo {
  id: string;
  name: string;
  avatarInitials: string;
  avatarColor: string;
  avatarUrl?: string | null;
  country?: string | null;
  countryFlag?: string | null;
  isVerified: boolean;
  producerSlug?: string | null;
  role: string;
}

export default function ChatView({ conversation, currentUserId, onBack, onMessageSent }: ChatViewProps) {
  const interlocutorId = conversation.participant_1 === currentUserId
    ? conversation.participant_2
    : conversation.participant_1;

  const [interlocutor, setInterlocutor] = useState<InterlocutorInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // 1. Fetch interlocutor details (profile + producer info)
  useEffect(() => {
    async function loadInterlocutor() {
      if (!interlocutorId) return;

      const [{ data: prof }, { data: prod }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', interlocutorId).maybeSingle(),
        supabase.from('producers').select('*').eq('user_id', interlocutorId).maybeSingle(),
      ]);

      const profile = prof as Profile | null;
      const producer = prod as Producer | null;

      const name = producer?.name || profile?.full_name || profile?.company || profile?.email?.split('@')[0] || 'Utilisateur';
      const initials = (name.slice(0, 2)).toUpperCase();
      
      setInterlocutor({
        id: interlocutorId,
        name,
        avatarInitials: producer?.avatar_initials || initials,
        avatarColor: producer?.avatar_color || '#15803d',
        avatarUrl: profile?.avatar_url || producer?.logo_url,
        country: producer?.country || profile?.country || 'France',
        countryFlag: producer?.country_flag || '🌍',
        isVerified: !!producer?.verified,
        producerSlug: producer?.slug || null,
        role: profile?.role || (producer ? 'producer' : 'buyer'),
      });
    }

    loadInterlocutor();
  }, [interlocutorId]);

  // 2. Fetch messages & subscribe to realtime
  useEffect(() => {
    if (!conversation.id) return;
    setLoadingMessages(true);

    async function loadMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data as Message[]);
        markMessagesAsRead(data as Message[]);
      }
      setLoadingMessages(false);
      setTimeout(() => scrollToBottom(false), 100);
    }

    loadMessages();

    // Subscribe to realtime inserts
    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });

        // Mark as read if received from interlocutor
        if (newMsg.sender_id !== currentUserId) {
          markMessageAsRead(newMsg.id);
        }

        setTimeout(() => scrollToBottom(true), 100);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id, currentUserId]);

  // Mark unread messages as read
  const markMessagesAsRead = async (msgList: Message[]) => {
    const unreadReceivedIds = msgList
      .filter(m => m.sender_id !== currentUserId && !m.read_at)
      .map(m => m.id);

    if (unreadReceivedIds.length > 0) {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadReceivedIds);
    }

    // Reset unread counter for current user in conversation
    const isParticipant1 = conversation.participant_1 === currentUserId;
    const updatePayload = isParticipant1 ? { unread_count_1: 0 } : { unread_count_2: 0 };
    await supabase.from('conversations').update(updatePayload).eq('id', conversation.id);
    if (onMessageSent) onMessageSent();
  };

  const markMessageAsRead = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId);

    const isParticipant1 = conversation.participant_1 === currentUserId;
    const updatePayload = isParticipant1 ? { unread_count_1: 0 } : { unread_count_2: 0 };
    await supabase.from('conversations').update(updatePayload).eq('id', conversation.id);
    if (onMessageSent) onMessageSent();
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('La taille du fichier ne doit pas dépasser 10 Mo.');
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Upload file to Supabase Storage bucket 'chat-files'
  const uploadChatFile = async (file: File): Promise<{ fileUrl: string; fileName: string } | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${conversation.id}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (error) {
        console.warn('Storage bucket upload failed, using data URL fallback:', error.message);
        // Fallback to data URL if bucket doesn't exist or RLS blocks upload
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ fileUrl: reader.result as string, fileName: file.name });
          reader.onerror = () => resolve({ fileUrl: '', fileName: file.name });
          reader.readAsDataURL(file);
        });
      }

      const { data: { publicUrl } } = supabase.storage.from('chat-files').getPublicUrl(fileName);
      return { fileUrl: publicUrl, fileName: file.name };
    } catch (err) {
      console.error('File upload error:', err);
      return null;
    }
  };

  // Send message
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputText.trim();
    if (!content && !selectedFile) return;

    setUploading(true);

    let fileUrl: string | undefined = undefined;
    let fileName: string | undefined = undefined;
    let msgType = 'text';

    if (selectedFile) {
      const uploadRes = await uploadChatFile(selectedFile);
      if (uploadRes) {
        fileUrl = uploadRes.fileUrl;
        fileName = uploadRes.fileName;
        msgType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
      }
    }

    const newMessageData = {
      conversation_id: conversation.id,
      sender_id: currentUserId,
      content: content || (selectedFile ? `Fichier joint : ${selectedFile.name}` : ''),
      type: msgType,
      file_url: fileUrl ?? null,
      file_name: fileName ?? null,
      created_at: new Date().toISOString(),
    };

    // Reset input fields immediately
    setInputText('');
    removeSelectedFile();

    // Optimistic state insertion
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      ...newMessageData,
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => scrollToBottom(true), 50);

    // Insert into Supabase
    const { data: insertedMsg, error } = await supabase
      .from('messages')
      .insert(newMessageData)
      .select()
      .single();

    if (!error && insertedMsg) {
      // Replace temp message with real DB message
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? (insertedMsg as Message) : m));

      // Update conversation metadata
      const isParticipant1 = conversation.participant_1 === currentUserId;
      const lastMsgText = content || (fileName ? `📎 ${fileName}` : 'Fichier joint');

      // Increment interlocutor unread count
      const updateData = isParticipant1
        ? { last_message: lastMsgText, last_message_at: new Date().toISOString(), unread_count_2: (conversation.unread_count_2 || 0) + 1 }
        : { last_message: lastMsgText, last_message_at: new Date().toISOString(), unread_count_1: (conversation.unread_count_1 || 0) + 1 };

      await supabase.from('conversations').update(updateData).eq('id', conversation.id);
      if (onMessageSent) onMessageSent();
    } else if (error) {
      console.error('Error sending message:', error);
    }

    setUploading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* ── HEADER ── */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between gap-3 flex-shrink-0 shadow-xs z-10">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button onClick={onBack} className="lg:hidden p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-xs relative"
            style={{ backgroundColor: interlocutor?.avatarColor || '#15803d' }}
          >
            {interlocutor?.avatarUrl ? (
              <img src={interlocutor.avatarUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              interlocutor?.avatarInitials || 'EM'
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="font-bold text-gray-900 text-sm truncate">{interlocutor?.name || 'Chargement...'}</h2>
              {interlocutor?.isVerified && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                  <ShieldCheck className="w-3 h-3 text-brand-600" /> Producteur vérifié
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <span>{interlocutor?.countryFlag}</span>
              <span className="truncate">{interlocutor?.country || 'France'}</span>
            </p>
          </div>
        </div>

        {interlocutor?.producerSlug && (
          <Link
            to={`/boutique/${interlocutor.producerSlug}`}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors border border-brand-200"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Voir boutique</span>
          </Link>
        )}
      </div>

      {/* ── MESSAGES LIST ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
            <span className="text-sm">Chargement des messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
            <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mb-3">
              💬
            </div>
            <p className="font-bold text-gray-700 text-sm mb-1">Début de la conversation</p>
            <p className="text-xs text-gray-500 max-w-xs">
              Posez vos questions sur les produits, MOQ, options de livraison ou certifications.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;

            return (
              <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[82%] sm:max-w-[70%] p-3.5 shadow-xs text-sm transition-all ${
                    isMine
                      ? 'bg-brand-500 text-white rounded-2xl rounded-tr-xs'
                      : 'bg-white text-gray-900 border border-gray-100 rounded-2xl rounded-tl-xs'
                  }`}
                >
                  {/* Text content */}
                  {msg.content && <p className="whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>}

                  {/* Attachment rendering */}
                  {msg.file_url && (
                    <div className={`mt-2 ${msg.content ? 'pt-2 border-t border-white/20' : ''}`}>
                      {msg.type === 'image' || msg.file_url.match(/\.(jpg|jpeg|png|webp|gif)/i) ? (
                        <div className="rounded-xl overflow-hidden my-1 max-w-xs border border-black/10">
                          <img
                            src={msg.file_url}
                            alt={msg.file_name || 'Image'}
                            className="w-full h-auto max-h-60 object-cover cursor-pointer hover:opacity-95"
                            onClick={() => window.open(msg.file_url!, '_blank')}
                          />
                        </div>
                      ) : (
                        <a
                          href={msg.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold transition-colors ${
                            isMine ? 'bg-brand-600 hover:bg-brand-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                          }`}
                        >
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate flex-1">{msg.file_name || 'Télécharger la pièce jointe'}</span>
                          <Download className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Timestamp & Read Receipts */}
                  <div className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${isMine ? 'text-white/80' : 'text-gray-400'}`}>
                    <span>{formatTime(msg.created_at)}</span>
                    {isMine && (
                      <span>
                        {msg.read_at ? (
                          <CheckCheck className="w-3.5 h-3.5 text-blue-200 inline" title="Lu" />
                        ) : (
                          <Check className="w-3 h-3 text-white/70 inline" title="Envoyé" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── FILE PREVIEW CHIP ── */}
      {selectedFile && (
        <div className="bg-white border-t border-gray-100 px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {filePreviewUrl ? (
              <img src={filePreviewUrl} alt="" className="w-9 h-9 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{selectedFile.name}</p>
              <p className="text-[10px] text-gray-400">{(selectedFile.size / (1024 * 1024)).toFixed(2)} Mo</p>
            </div>
          </div>
          <button onClick={removeSelectedFile} className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── INPUT BAR ── */}
      <form onSubmit={handleSend} className="bg-white border-t border-gray-100 p-3 flex items-end gap-2 flex-shrink-0">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx,.zip"
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 text-gray-400 hover:text-brand-600 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
          title="Joindre un fichier (PDF, Image, Doc max 10 Mo)"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-2xl px-3.5 py-2 focus-within:border-brand-500 focus-within:bg-white transition-all">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrire un message..."
            rows={1}
            className="w-full bg-transparent text-sm text-gray-900 outline-none resize-none max-h-24 py-0.5 leading-snug"
          />
        </div>

        <button
          type="submit"
          disabled={uploading || (!inputText.trim() && !selectedFile)}
          className="p-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white rounded-2xl transition-all shadow-sm flex-shrink-0 flex items-center justify-center"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
}
