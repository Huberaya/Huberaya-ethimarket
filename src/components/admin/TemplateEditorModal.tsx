import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  Mail,
  User,
  Award,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Building2,
  FileBadge2,
  AtSign,
  Loader2,
  Eye
} from 'lucide-react';
import {
  createTemplate,
  updateTemplate,
  restorePreviousVersion,
  validateTemplateSyntax,
  renderTemplate
} from '../../lib/certificationTemplatesService';
import type {
  CertificationMessageTemplate,
  VerificationChannel
} from '../../lib/supabase';

export type TemplateEditorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (template: CertificationMessageTemplate) => void;
  initialTemplate?: CertificationMessageTemplate | null;
  userId?: string;
};

type VariableItem = {
  key: string;
  name: string;
  desc: string;
  example: string;
  icon: React.ReactNode;
};

type VariableGroup = {
  title: string;
  items: VariableItem[];
};

const VARIABLE_GROUPS: VariableGroup[] = [
  {
    title: 'Bloc 1 — Producteur',
    items: [
      {
        key: '{producer_name}',
        name: 'Nom du producteur',
        desc: "Raison sociale ou nom de l'exploitation",
        example: 'Coopérative Cacao Bio Sambirano',
        icon: <User className="w-3.5 h-3.5 text-blue-500" />
      },
      {
        key: '{certificate_number}',
        name: 'N° de certificat',
        desc: "Identifiant officiel d'enregistrement",
        example: 'ECO-2024-8881',
        icon: <FileBadge2 className="w-3.5 h-3.5 text-blue-500" />
      }
    ]
  },
  {
    title: 'Bloc 2 — Certification',
    items: [
      {
        key: '{standard_name}',
        name: 'Standard / Label',
        desc: 'Norme ou cahier des charges audité',
        example: 'Agriculture Biologique (CE 834/2007)',
        icon: <Award className="w-3.5 h-3.5 text-emerald-500" />
      },
      {
        key: '{body_name}',
        name: 'Organisme certificateur',
        desc: 'Autorité tierce de contrôle',
        example: 'Ecocert Greenlife France',
        icon: <Building2 className="w-3.5 h-3.5 text-emerald-500" />
      },
      {
        key: '{issue_date}',
        name: "Date d'émission",
        desc: "Date d'octroi du certificat",
        example: '15/01/2024',
        icon: <Calendar className="w-3.5 h-3.5 text-emerald-500" />
      },
      {
        key: '{expiry_date}',
        name: "Date d'expiration",
        desc: 'Date de fin de validité',
        example: '31/12/2026',
        icon: <Calendar className="w-3.5 h-3.5 text-emerald-500" />
      },
      {
        key: '{verification_url}',
        name: 'Lien du document',
        desc: 'URL sécurisée de consultation',
        example: 'https://cert.agritrace.io/verify/8881',
        icon: <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
      }
    ]
  },
  {
    title: 'Bloc 3 — Plateforme',
    items: [
      {
        key: '{platform_name}',
        name: 'Nom de la plateforme',
        desc: "Nom de l'application",
        example: 'EthiMarket B2B',
        icon: <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
      },
      {
        key: '{admin_name}',
        name: "Nom de l'auditeur",
        desc: 'Gestionnaire ou auditeur connecté',
        example: 'Sophie Auditeur',
        icon: <User className="w-3.5 h-3.5 text-indigo-500" />
      },
      {
        key: '{admin_email}',
        name: "Email de l'auditeur",
        desc: 'Courriel officiel de contact',
        example: 'compliance@ethimarket.com',
        icon: <AtSign className="w-3.5 h-3.5 text-indigo-500" />
      }
    ]
  }
];

const PREVIEW_MOCK_CONTEXT = {
  producer_name: 'Coopérative Cacao Bio Sambirano',
  certificate_number: 'ECO-2024-8881',
  standard_name: 'Agriculture Biologique (CE 834/2007)',
  body_name: 'Ecocert Greenlife France',
  verification_url: 'https://cert.agritrace.io/verify/8881',
  expiry_date: '31/12/2026',
  issue_date: '15/01/2024',
  platform_name: 'EthiMarket B2B',
  admin_name: 'Sophie Auditeur',
  admin_email: 'compliance@ethimarket.com'
};

export default function TemplateEditorModal({
  isOpen,
  onClose,
  onSaved,
  initialTemplate,
  userId
}: TemplateEditorModalProps) {
  const isEditMode = Boolean(initialTemplate?.id);

  // Données du formulaire
  const [title, setTitle] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [language, setLanguage] = useState<string>('fr');
  const [channel, setChannel] = useState<VerificationChannel>('email');
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [isDefault, setIsDefault] = useState<boolean>(false);

  // États UI
  const [mobileTab, setMobileTab] = useState<'content' | 'variables' | 'preview'>('content');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState<boolean>(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState<boolean>(false);
  const [showPreviewDrawer, setShowPreviewDrawer] = useState<boolean>(false);

  // Références d'insertion au curseur
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const lastActiveFieldRef = useRef<'subject' | 'body'>('body');
  const lastCursorPosRef = useRef<number | null>(null);

  // Instantané initial pour détecter le dirty state
  const initialSnapshot = useMemo(() => {
    return {
      title: initialTemplate?.title || initialTemplate?.name || '',
      name: initialTemplate?.name || initialTemplate?.title || '',
      language: initialTemplate?.language || 'fr',
      channel: initialTemplate?.channel || 'email',
      subject: initialTemplate?.subject || '',
      body: initialTemplate?.body || '',
      is_default: initialTemplate?.is_default ?? false
    };
  }, [initialTemplate]);

  // Initialisation à l'ouverture
  useEffect(() => {
    if (isOpen) {
      if (initialTemplate) {
        setTitle(initialTemplate.title || initialTemplate.name || '');
        setName(initialTemplate.name || initialTemplate.title || '');
        setLanguage(initialTemplate.language || 'fr');
        setChannel(initialTemplate.channel || 'email');
        setSubject(initialTemplate.subject || '');
        setBody(initialTemplate.body || '');
        setIsDefault(initialTemplate.is_default ?? false);
      } else {
        setTitle('');
        setName('');
        setLanguage('fr');
        setChannel('email');
        setSubject("Demande de confirmation d'authenticité : {certificate_number} — {producer_name}");
        setBody(
          `Madame, Monsieur,\n\nDans le cadre de notre audit de conformité sur {platform_name}, nous souhaitons authentifier le certificat ci-dessous :\n\n- Producteur : {producer_name}\n- N° Certificat : {certificate_number}\n- Standard / Label : {standard_name}\n- Date d'expiration : {expiry_date}\n\nPourriez-vous nous confirmer son statut actif dans vos registres ?\nLien vers le justificatif : {verification_url}\n\nBien cordialement,\nL'Équipe d'Audit & Qualité\n{platform_name}`
        );
        setIsDefault(false);
      }
      setError(null);
      setShowRestoreModal(false);
      setShowUnsavedPrompt(false);
      setShowPreviewDrawer(false);
      lastActiveFieldRef.current = 'body';
      lastCursorPosRef.current = null;
    }
  }, [isOpen, initialTemplate]);

  // Détection des modifications non enregistrées
  const isDirty = useMemo(() => {
    if (!isOpen) return false;
    return (
      title !== initialSnapshot.title ||
      name !== initialSnapshot.name ||
      language !== initialSnapshot.language ||
      channel !== initialSnapshot.channel ||
      subject !== initialSnapshot.subject ||
      body !== initialSnapshot.body ||
      isDefault !== initialSnapshot.is_default
    );
  }, [title, name, language, channel, subject, body, isDefault, initialSnapshot, isOpen]);

  // Gestion de la touche Escape pour fermer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showRestoreModal) {
          setShowRestoreModal(false);
        } else if (showUnsavedPrompt) {
          setShowUnsavedPrompt(false);
        } else if (isDirty) {
          setShowUnsavedPrompt(true);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDirty, showRestoreModal, showUnsavedPrompt, onClose]);

  // Validation syntaxique avec debounce de 200ms
  const [debouncedSyntax, setDebouncedSyntax] = useState(() => validateTemplateSyntax(body, subject));
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSyntax(validateTemplateSyntax(body, channel === 'email' ? subject : null));
    }, 200);
    return () => clearTimeout(timer);
  }, [body, subject, channel]);

  // Limite de caractères par canal
  const characterCount = body.length;
  const channelLimitWarning = useMemo(() => {
    if (channel === 'whatsapp') {
      if (characterCount > 1000) {
        return { isExceeded: true, isWarning: true, message: 'Dépassement de la limite recommandée WhatsApp (1000 car.)' };
      } else if (characterCount >= 900) {
        return { isExceeded: false, isWarning: true, message: 'Attention : limite WhatsApp proche (max 1000 car.)' };
      }
    } else if (channel === 'email') {
      if (characterCount > 3000) {
        return { isExceeded: false, isWarning: true, message: 'Message très volumineux (> 3000 car.)' };
      }
    }
    return { isExceeded: false, isWarning: false, message: null };
  }, [channel, characterCount]);

  // Insertion de variable à la position exacte du curseur
  const handleInsertVariable = (variableKey: string) => {
    const targetField = lastActiveFieldRef.current;

    if (targetField === 'subject' && channel === 'email') {
      const inputEl = subjectInputRef.current;
      const currentPos = lastCursorPosRef.current ?? subject.length;
      const before = subject.slice(0, currentPos);
      const after = subject.slice(currentPos);
      const newSubject = `${before}${variableKey}${after}`;
      setSubject(newSubject);

      setTimeout(() => {
        if (inputEl) {
          inputEl.focus();
          const nextPos = currentPos + variableKey.length;
          inputEl.setSelectionRange(nextPos, nextPos);
          lastCursorPosRef.current = nextPos;
        }
      }, 10);
    } else {
      const textareaEl = bodyTextareaRef.current;
      const currentPos = lastCursorPosRef.current ?? body.length;
      const before = body.slice(0, currentPos);
      const after = body.slice(currentPos);
      const newBody = `${before}${variableKey}${after}`;
      setBody(newBody);

      setTimeout(() => {
        if (textareaEl) {
          textareaEl.focus();
          const nextPos = currentPos + variableKey.length;
          textareaEl.setSelectionRange(nextPos, nextPos);
          lastCursorPosRef.current = nextPos;
        }
      }, 10);
    }
  };

  // Traitement de la sauvegarde
  const handleSave = async (andClose: boolean = true) => {
    if (!title.trim() || !body.trim()) {
      setError('Le titre et le corps du message sont obligatoires.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const finalTitle = title.trim();
    const finalName = name.trim() || finalTitle;
    const finalSubject = channel === 'email' ? subject.trim() || null : null;
    const variablesDetected = debouncedSyntax.detectedVariables;

    try {
      if (isEditMode && initialTemplate) {
        const res = await updateTemplate(
          initialTemplate.id,
          {
            title: finalTitle,
            name: finalName,
            language,
            channel,
            subject: finalSubject,
            body,
            variables: variablesDetected,
            is_default: isDefault
          },
          userId,
          true
        );

        if (res.error || !res.data) {
          setError(res.error || 'Erreur lors de la mise à jour');
        } else {
          onSaved(res.data);
          if (andClose) {
            onClose();
          }
        }
      } else {
        const res = await createTemplate(
          {
            title: finalTitle,
            name: finalName,
            language,
            channel,
            subject: finalSubject,
            body,
            variables: variablesDetected,
            is_default: isDefault,
            created_by: userId || null
          },
          userId
        );

        if (res.error || !res.data) {
          setError(res.error || 'Erreur lors de la création');
        } else {
          onSaved(res.data);
          if (andClose) {
            onClose();
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inattendue';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Restauration de la version précédente
  const handleExecuteRestore = async () => {
    if (!initialTemplate?.id || !initialTemplate.previous_version) return;

    setIsSubmitting(true);
    try {
      const res = await restorePreviousVersion(initialTemplate.id, userId);
      if (res.error || !res.data) {
        setError(res.error || 'Erreur lors du rollback');
      } else {
        // Mettre à jour l'état local avec la version restaurée
        const restored = res.data;
        setSubject(restored.subject || '');
        setBody(restored.body);
        setShowRestoreModal(false);
        onSaved(restored);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur restauration';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fermeture avec vérification du dirty state
  const handleRequestClose = () => {
    if (isDirty) {
      setShowUnsavedPrompt(true);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-modal-title"
    >
      <div className="bg-white w-full max-w-7xl max-h-[92vh] sm:h-[88vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150">
        {/* 1. EN-TÊTE MODALE */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-50 rounded-xl text-brand-700">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="template-modal-title" className="text-base sm:text-lg font-black text-gray-900">
                  {isEditMode ? `Modifier le modèle : ${initialTemplate?.title || initialTemplate?.name}` : 'Nouveau modèle de message'}
                </h2>
                {isEditMode && initialTemplate && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-black rounded-lg border border-blue-200">
                    v{initialTemplate.version || 1}
                  </span>
                )}
                {isDirty && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[11px] font-bold rounded-md border border-amber-200">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    Modifications non enregistrées
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                Configurez les variables d'insertion et les métadonnées de distribution multicanale.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditMode && initialTemplate?.previous_version && (
              <button
                type="button"
                onClick={() => setShowRestoreModal(true)}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors"
                title={`Restaurer la version v${initialTemplate.previous_version.version}`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurer version précédente</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRequestClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="Fermer la modale"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Onglets mobiles (< 768px) */}
        <div className="flex md:hidden border-b border-gray-100 bg-gray-50 p-1.5 gap-1 shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMobileTab('content')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              mobileTab === 'content' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500'
            }`}
          >
            Contenu
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('variables')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              mobileTab === 'variables' ? 'bg-white text-brand-700 shadow-2xs' : 'text-gray-500'
            }`}
          >
            Variables ({VARIABLE_GROUPS.reduce((acc, g) => acc + g.items.length, 0)})
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              mobileTab === 'preview' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500'
            }`}
          >
            Aperçu
          </button>
        </div>

        {/* Message d'erreur global */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* 2. CORPS EN 2 VOLETS (GRID 70% / 30%) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* VOLET GAUCHE (70% - Col 8/12) : FORMULAIRE */}
          <div
            className={`md:col-span-8 lg:col-span-8 p-6 overflow-y-auto space-y-6 border-r border-gray-100 ${
              mobileTab !== 'content' ? 'hidden md:block' : 'block'
            }`}
          >
            {/* Section 1 — Métadonnées */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                1. Métadonnées & Paramètres
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="template-title" className="text-xs font-bold text-gray-700">
                    Titre du modèle <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="template-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (!name) setName(e.target.value);
                    }}
                    placeholder="Ex: Demande de confirmation officielle"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-brand-500 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="template-name" className="text-xs font-bold text-gray-700">
                    Nom interne (facultatif)
                  </label>
                  <input
                    id="template-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Identifiant interne"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:bg-white focus:outline-none focus:border-brand-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="template-lang" className="text-xs font-bold text-gray-700">
                    Langue de rédaction
                  </label>
                  <select
                    id="template-lang"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="fr">🇫🇷 Français (FR)</option>
                    <option value="en">🇬🇧 English (EN)</option>
                    <option value="es">🇪🇸 Español (ES)</option>
                    <option value="pt">🇵🇹 Português (PT)</option>
                    <option value="de">🇩🇪 Deutsch (DE)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="template-channel" className="text-xs font-bold text-gray-700">
                    Canal de transmission
                  </label>
                  <select
                    id="template-channel"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as VerificationChannel)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="email">📧 Email officiel</option>
                    <option value="whatsapp">💬 WhatsApp Messagerie</option>
                    <option value="form">🌐 Formulaire / Portail web</option>
                    <option value="api">🔌 Requête API (JSON)</option>
                    <option value="letter">📬 Courrier postal</option>
                  </select>
                </div>
              </div>

              {/* Toggle Définir par défaut */}
              <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="template-is-default"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500 cursor-pointer"
                  />
                  <label htmlFor="template-is-default" className="text-xs font-bold text-gray-900 cursor-pointer">
                    Définir comme modèle par défaut pour ce canal ({channel.toUpperCase()}) et cette langue ({language.toUpperCase()})
                  </label>
                </div>
                {isDefault && (
                  <p className="text-[11px] text-amber-800 font-medium pl-6">
                    ⚠️ L'activation désactivera automatiquement l'autre modèle par défaut existant pour cette combinaison.
                  </p>
                )}
              </div>
            </div>

            {/* Section 2 — Contenu */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  2. Contenu & Rédaction
                </h3>
                <span className="text-[11px] text-gray-400 font-mono">
                  {characterCount} caractère{characterCount > 1 ? 's' : ''}
                </span>
              </div>

              {/* Objet (si canal = email) */}
              {channel === 'email' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="template-subject" className="text-xs font-bold text-gray-700">
                      Objet du courriel
                    </label>
                    <span className="text-[10px] text-gray-400 font-mono">{subject.length}/200 max conseillé</span>
                  </div>
                  <input
                    id="template-subject"
                    ref={subjectInputRef}
                    type="text"
                    value={subject}
                    onFocus={() => {
                      lastActiveFieldRef.current = 'subject';
                    }}
                    onSelect={(e) => {
                      lastCursorPosRef.current = (e.target as HTMLInputElement).selectionStart;
                    }}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ex: Demande de confirmation de conformité — {standard_name} — {producer_name}"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-brand-500 font-sans"
                  />
                </div>
              )}

              {/* Corps du message */}
              <div className="space-y-1">
                <label htmlFor="template-body" className="text-xs font-bold text-gray-700">
                  Corps du message <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    id="template-body"
                    ref={bodyTextareaRef}
                    rows={14}
                    required
                    value={body}
                    onFocus={() => {
                      lastActiveFieldRef.current = 'body';
                    }}
                    onSelect={(e) => {
                      lastCursorPosRef.current = (e.target as HTMLTextAreaElement).selectionStart;
                    }}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Rédigez le modèle ici. Cliquez sur les variables à droite pour les injecter au curseur..."
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-mono text-gray-900 leading-relaxed focus:bg-white focus:outline-none focus:border-brand-500 shadow-inner"
                  />
                </div>

                {/* Avertissements de longueur */}
                {channelLimitWarning.message && (
                  <p
                    className={`text-[11px] font-bold ${
                      channelLimitWarning.isExceeded ? 'text-red-600' : 'text-amber-600'
                    }`}
                  >
                    {channelLimitWarning.message}
                  </p>
                )}
              </div>
            </div>

            {/* Section 3 — Validation syntaxique en temps réel */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-gray-700">Validation syntaxique :</span>
                {debouncedSyntax.valid ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Syntaxe valide ({debouncedSyntax.detectedVariables.length} variable
                    {debouncedSyntax.detectedVariables.length > 1 ? 's' : ''} détectée
                    {debouncedSyntax.detectedVariables.length > 1 ? 's' : ''})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-800 font-bold bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Variables non reconnues détectées
                  </span>
                )}
              </div>

              {debouncedSyntax.invalidVariables.length > 0 && (
                <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded-xl text-amber-900 text-[11px] space-y-1">
                  <span className="font-bold">Balises non déclarées dans le registre :</span>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {debouncedSyntax.invalidVariables.map((inv) => (
                      <span key={inv} className="px-1.5 py-0.5 bg-white rounded font-mono text-[10px] font-bold text-amber-800 border border-amber-200">
                        {`{${inv}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {debouncedSyntax.warnings.length > 0 && (
                <div className="space-y-1 text-[11px] text-gray-500">
                  {debouncedSyntax.warnings.map((w, i) => (
                    <p key={i} className="flex items-center gap-1">
                      <Info className="w-3 h-3 text-blue-500 shrink-0" />
                      <span>{w}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* VOLET DROIT (30% - Col 4/12) : PALETTE D'AIDE VARIABLES */}
          <div
            className={`md:col-span-4 lg:col-span-4 p-5 bg-gray-50/50 overflow-y-auto space-y-4 ${
              mobileTab !== 'variables' ? 'hidden md:block' : 'block'
            }`}
          >
            <div>
              <div className="flex items-center gap-1.5 text-xs font-black text-gray-900">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Variables dynamiques</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Cliquez pour insérer la balise à la position du curseur dans l'objet ou le corps.
              </p>
            </div>

            <div className="space-y-4">
              {VARIABLE_GROUPS.map((group) => (
                <div key={group.title} className="space-y-2">
                  <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wide">
                    {group.title}
                  </h4>
                  <div className="space-y-1.5">
                    {group.items.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleInsertVariable(item.key)}
                        className="w-full text-left p-2.5 bg-white hover:bg-brand-50/80 border border-gray-200 hover:border-brand-300 rounded-xl transition-all shadow-2xs group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {item.icon}
                            <span className="font-mono text-xs font-black text-brand-700 group-hover:text-brand-900">
                              {item.key}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 group-hover:text-brand-600 font-bold">
                            + Insérer
                          </span>
                        </div>
                        <p className="text-[10px] font-semibold text-gray-700 mt-0.5">{item.name}</p>
                        <p className="text-[9px] text-gray-400 italic truncate mt-0.5">Ex: {item.example}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Onglet Aperçu mobile (< 768px) */}
          <div className={`p-5 overflow-y-auto space-y-4 ${mobileTab !== 'preview' ? 'hidden' : 'block md:hidden'}`}>
            <h3 className="text-xs font-black text-gray-900">Aperçu simulé du message</h3>
            {channel === 'email' && subject && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                <span className="font-bold text-gray-500">Objet :</span>
                <p className="font-bold text-gray-900 mt-1">{renderTemplate({ subject, body }, PREVIEW_MOCK_CONTEXT).subject}</p>
              </div>
            )}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs font-sans whitespace-pre-wrap">
              {renderTemplate({ subject, body }, PREVIEW_MOCK_CONTEXT).body}
            </div>
          </div>
        </div>

        {/* 4. BARRE D'ACTIONS DU BAS */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreviewDrawer(!showPreviewDrawer)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition-colors shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5 text-gray-500" />
              <span>{showPreviewDrawer ? "Masquer l'aperçu" : 'Prévisualiser'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRequestClose}
              className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-600 text-xs font-bold rounded-xl border border-gray-200 transition-colors"
            >
              Annuler
            </button>

            <button
              type="button"
              disabled={isSubmitting || !title.trim() || !body.trim()}
              onClick={() => handleSave(false)}
              className="px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 disabled:opacity-50 text-xs font-bold rounded-xl border border-brand-200 transition-colors"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>

            <button
              type="button"
              disabled={isSubmitting || !title.trim() || !body.trim()}
              onClick={() => handleSave(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Enregistrer et fermer</span>
            </button>
          </div>
        </div>

        {/* Drawer d'aperçu dynamique déployable */}
        {showPreviewDrawer && (
          <div className="border-t border-gray-200 bg-white p-4 max-h-56 overflow-y-auto space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Rendu compilé avec les données d'exemple
              </span>
              <button
                type="button"
                onClick={() => setShowPreviewDrawer(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>
            {channel === 'email' && subject && (
              <p className="font-bold text-gray-800 bg-gray-50 p-2 rounded-lg border border-gray-200">
                Objet : {renderTemplate({ subject, body }, PREVIEW_MOCK_CONTEXT).subject}
              </p>
            )}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl whitespace-pre-wrap font-sans text-gray-800">
              {renderTemplate({ subject, body }, PREVIEW_MOCK_CONTEXT).body}
            </div>
          </div>
        )}
      </div>

      {/* MODALE DE CONFIRMATION DE RESTAURATION AVEC DIFF */}
      {showRestoreModal && initialTemplate?.previous_version && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Restaurer la version précédente</h3>
                <p className="text-xs text-gray-500">
                  Vous êtes sur le point de restaurer la révision antérieure v{initialTemplate.previous_version.version} enregistrée le{' '}
                  {new Date(initialTemplate.previous_version.saved_at).toLocaleString()}.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5">
                <span className="font-bold text-gray-500 uppercase text-[10px]">Version actuelle (v{initialTemplate.version || 1}) :</span>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl h-44 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] text-gray-700">
                  {body}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-indigo-600 uppercase text-[10px]">
                  Version antérieure (v{initialTemplate.previous_version.version}) :
                </span>
                <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl h-44 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] text-indigo-950">
                  {initialTemplate.previous_version.body}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowRestoreModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleExecuteRestore}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {isSubmitting ? 'Restauration...' : 'Confirmer la restauration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROMPT MODIFICATIONS NON ENREGISTRÉES */}
      {showUnsavedPrompt && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-gray-900">Quitter sans enregistrer ?</h3>
              <p className="text-xs text-gray-500">
                Vous avez apporté des modifications à ce modèle. Si vous fermez maintenant, ces changements seront perdus.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUnsavedPrompt(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
              >
                Continuer l'édition
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedPrompt(false);
                  onClose();
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Abandonner les changements
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
