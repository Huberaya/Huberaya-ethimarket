import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Copy,
  Download,
  Upload,
  RotateCcw,
  RefreshCw,
  Star,
  Search,
  AlertTriangle,
  Mail,
  MessageSquare,
  Globe,
  Code,
  Inbox,
  Check,
  X
} from 'lucide-react';
import TemplateEditorModal from '../../components/admin/TemplateEditorModal';
import TemplateSimulator from '../../components/admin/TemplateSimulator';
import TemplateExportModal from '../../components/admin/TemplateExportModal';
import TemplateImportModal from '../../components/admin/TemplateImportModal';
import TemplateResetConfirmModal from '../../components/admin/TemplateResetConfirmModal';
import {
  getTemplates,
  deleteTemplate,
  duplicateTemplate,
  restorePreviousVersion,
  setDefaultTemplate
} from '../../lib/certificationTemplatesService';
import type {
  CertificationMessageTemplate,
  VerificationChannel
} from '../../lib/supabase';

// Drapeaux et libellés de langue
const LANGUAGE_FLAGS: Record<string, { label: string; flag: string }> = {
  fr: { label: 'Français', flag: '🇫🇷' },
  en: { label: 'Anglais', flag: '🇬🇧' },
  es: { label: 'Espagnol', flag: '🇪🇸' },
  pt: { label: 'Portugais', flag: '🇵🇹' }
};

// Styles et icônes des canaux
const CHANNEL_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  email: {
    label: 'Email',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: <Mail className="w-3.5 h-3.5" />
  },
  whatsapp: {
    label: 'WhatsApp',
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: <MessageSquare className="w-3.5 h-3.5" />
  },
  form: {
    label: 'Formulaire',
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: <Globe className="w-3.5 h-3.5" />
  },
  api: {
    label: 'API',
    bg: 'bg-indigo-100',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    icon: <Code className="w-3.5 h-3.5" />
  },
  letter: {
    label: 'Courrier',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200',
    icon: <Inbox className="w-3.5 h-3.5" />
  }
};

export default function AdminMessageTemplates() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [templates, setTemplates] = useState<CertificationMessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Toasts
  const [toast, setToast] = useState<{ id: number; message: string; type: 'success' | 'error' } | null>(null);

  // Filtres synchronisés avec les Query Params
  const filterChannel = searchParams.get('channel') || 'all';
  const filterLanguage = searchParams.get('lang') || 'all';
  const searchQueryParam = searchParams.get('q') || '';

  const [searchInput, setSearchInput] = useState<string>(searchQueryParam);

  // Synchronisation debounce de la recherche vers l'URL
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (searchInput.trim()) {
            next.set('q', searchInput.trim());
          } else {
            next.delete('q');
          }
          return next;
        },
        { replace: true }
      );
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput, setSearchParams]);

  // Synchronisation initiale du champ de recherche
  useEffect(() => {
    setSearchInput(searchQueryParam);
  }, [searchQueryParam]);

  // Modales & confirmation
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] = useState<CertificationMessageTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<CertificationMessageTemplate | null>(null);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isResetConfirmModalOpen, setIsResetConfirmModalOpen] = useState<boolean>(false);
  const [deletingTemplate, setDeletingTemplate] = useState<CertificationMessageTemplate | null>(null);
  const [restoringTemplate, setRestoringTemplate] = useState<CertificationMessageTemplate | null>(null);

  // Afficher un toast éphémère (3 secondes)
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ id: Date.now(), message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Chargement des templates
  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const channelParam = filterChannel !== 'all' ? (filterChannel as VerificationChannel) : undefined;
      const langParam = filterLanguage !== 'all' ? filterLanguage : undefined;
      const res = await getTemplates({
        channel: channelParam,
        language: langParam,
        search: searchQueryParam
      });
      if (res.error) {
        setError(res.error);
        showToast(res.error, 'error');
      } else {
        setTemplates(res.data || []);
        if (selectedTemplateForPreview) {
          const refreshed = res.data?.find((t) => t.id === selectedTemplateForPreview.id);
          if (refreshed) setSelectedTemplateForPreview(refreshed);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur chargement des modèles';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filterChannel, filterLanguage, searchQueryParam, selectedTemplateForPreview, showToast]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Mise à jour des filtres dans l'URL
  const updateFilterChannel = (channel: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (channel === 'all') {
          next.delete('channel');
        } else {
          next.set('channel', channel);
        }
        return next;
      },
      { replace: true }
    );
  };

  const updateFilterLanguage = (lang: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (lang === 'all') {
          next.delete('lang');
        } else {
          next.set('lang', lang);
        }
        return next;
      },
      { replace: true }
    );
  };

  // Calcul indicateur de couverture par canal
  const channelCoverage = useMemo(() => {
    const requiredChannels: VerificationChannel[] = ['email', 'whatsapp', 'form', 'api'];
    const covered = requiredChannels.every((ch) =>
      templates.some((t) => t.channel === ch && t.is_default)
    );
    return {
      isComplete: covered,
      missingChannels: requiredChannels.filter(
        (ch) => !templates.some((t) => t.channel === ch && t.is_default)
      )
    };
  }, [templates]);

  // Ouverture des modales
  const handleOpenCreateModal = () => {
    setEditingTemplate(null);
    setIsEditorModalOpen(true);
  };

  const handleOpenEditModal = (tpl: CertificationMessageTemplate) => {
    setEditingTemplate(tpl);
    setIsEditorModalOpen(true);
  };

  const handleDuplicate = async (tpl: CertificationMessageTemplate) => {
    try {
      const res = await duplicateTemplate(tpl.id);
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast(`Modèle dupliqué : "${res.data?.name}"`);
        loadTemplates();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur duplication';
      showToast(msg, 'error');
    }
  };

  const handleExecuteRollback = async () => {
    if (!restoringTemplate) return;
    try {
      const res = await restorePreviousVersion(restoringTemplate.id);
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast(`Version antérieure restaurée (v${res.data?.version})`);
        loadTemplates();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur restauration';
      showToast(msg, 'error');
    } finally {
      setRestoringTemplate(null);
    }
  };

  const handleSetDefault = async (tpl: CertificationMessageTemplate) => {
    try {
      const res = await setDefaultTemplate(tpl.id, tpl.channel, tpl.language);
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast(`Modèle défini par défaut pour [${tpl.channel.toUpperCase()} - ${tpl.language.toUpperCase()}]`);
        loadTemplates();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur configuration par défaut';
      showToast(msg, 'error');
    }
  };

  const handleExecuteDelete = async () => {
    if (!deletingTemplate) return;
    try {
      const res = await deleteTemplate(deletingTemplate.id);
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast(`Modèle "${deletingTemplate.name}" supprimé`);
        if (selectedTemplateForPreview?.id === deletingTemplate.id) {
          setSelectedTemplateForPreview(null);
        }
        loadTemplates();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur suppression';
      showToast(msg, 'error');
    } finally {
      setDeletingTemplate(null);
    }
  };

  // Helper pour colorer les variables {nom} dans l'aperçu tronqué
  const renderHighlightedBodySnippet = (text: string) => {
    const snippet = text.slice(0, 200);
    const parts = snippet.split(/(\{[a-zA-Z0-9_]+\}|\{\{\s*[a-zA-Z0-9_]+\s*\}\})/g);

    return (
      <span className="text-xs text-gray-600 leading-relaxed font-sans">
        {parts.map((part, i) => {
          if (part.startsWith('{') && part.endsWith('}')) {
            return (
              <span
                key={i}
                className="bg-blue-50 text-blue-700 font-mono font-medium px-1 py-0.5 rounded text-[11px] border border-blue-100"
              >
                {part}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
        {text.length > 200 && (
          <span className="text-gray-400 font-medium">...</span>
        )}
      </span>
    );
  };

  const handleSelectForTest = (tpl: CertificationMessageTemplate) => {
    setSelectedTemplateForPreview(tpl);
    setTimeout(() => {
      const el = document.getElementById('template-simulator');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast de notification flottant en haut à droite */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border ${
              toast.type === 'success'
                ? 'bg-emerald-500 text-white border-emerald-600'
                : 'bg-red-500 text-white border-red-600'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-white" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-white" />
            )}
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 text-white/80 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* EN-TÊTE & STATISTIQUES */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Modèles de Messages</h1>
            <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-extrabold border border-brand-200">
              {templates.length} modèles actifs
            </span>
            {channelCoverage.isComplete ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Couverture complète
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Canaux incomplets
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Gérez et personnalisez les courriels, alertes WhatsApp, requêtes API et formulaires de vérification de certification.
          </p>
        </div>

        {/* Boutons d'actions rapides */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition-all shadow-2xs hover:border-gray-300"
            title="Exporter des modèles au format JSON"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Exporter JSON</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition-all shadow-2xs hover:border-gray-300"
            title="Importer des modèles depuis un fichier ou JSON"
          >
            <Upload className="w-3.5 h-3.5 text-gray-500" />
            <span>Importer JSON</span>
          </button>

          <button
            type="button"
            onClick={() => setIsResetConfirmModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition-all shadow-2xs hover:border-gray-300"
            title="Réinitialiser et restaurer les 12 modèles d'usine"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
            <span>Réinitialiser modèles d'usine</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau modèle</span>
          </button>
        </div>
      </div>

      {/* État d'erreur avec bandeau rouge et bouton Réessayer */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button
            type="button"
            onClick={loadTemplates}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Réessayer</span>
          </button>
        </div>
      )}

      {/* FILTRES INTERACTIFS & RECHERCHE */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Barre de filtres par Canal */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-gray-500 mr-1">Canal :</span>
            {[
              { key: 'all', label: 'Tous' },
              { key: 'email', label: 'Email' },
              { key: 'whatsapp', label: 'WhatsApp' },
              { key: 'form', label: 'Formulaire' },
              { key: 'api', label: 'API' },
              { key: 'letter', label: 'Courrier' }
            ].map((ch) => {
              const isActive = filterChannel === ch.key;
              return (
                <button
                  key={ch.key}
                  type="button"
                  onClick={() => updateFilterChannel(ch.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gray-900 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  {ch.label}
                </button>
              );
            })}
          </div>

          {/* Sélecteur de langue & Barre de recherche */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-500">Langue :</span>
              <select
                value={filterLanguage}
                onChange={(e) => updateFilterLanguage(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-brand-500"
              >
                <option value="all">Toutes les langues</option>
                <option value="fr">🇫🇷 Français (FR)</option>
                <option value="en">🇬🇧 Anglais (EN)</option>
                <option value="es">🇪🇸 Espagnol (ES)</option>
                <option value="pt">🇵🇹 Portugais (PT)</option>
              </select>
            </div>

            {/* Barre de recherche avec icône et debounce */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Rechercher par nom, sujet ou contenu..."
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:border-brand-500"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GRILLE DES CARTES DE TEMPLATES & SIMULATEUR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Cartes (2 colonnes desktop) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Skeleton Loaders pendant le chargement */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-gray-200 rounded-md w-1/2" />
                    <div className="h-4 bg-gray-100 rounded-full w-16" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-5/6" />
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-6 bg-gray-100 rounded-lg w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : templates.length === 0 ? (
            /* État vide */
            <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-xs space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto text-gray-400 border border-gray-100">
                <FileText className="w-8 h-8 text-gray-300" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">Aucun modèle de message configuré</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Aucun résultat ne correspond à vos filtres actuels ou aucun modèle n'a encore été créé.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Créer le premier modèle
                </button>
                <button
                  type="button"
                  onClick={() => setIsResetConfirmModalOpen(true)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors"
                >
                  Restaurer les 12 modèles par défaut
                </button>
              </div>
            </div>
          ) : (
            /* Grille responsive des templates (2 colonnes desktop, 1 colonne mobile) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((tpl) => {
                const isSelected = selectedTemplateForPreview?.id === tpl.id;
                const channelStyle = CHANNEL_CONFIG[tpl.channel] || CHANNEL_CONFIG.email;
                const langInfo = LANGUAGE_FLAGS[tpl.language] || { label: tpl.language.toUpperCase(), flag: '🌐' };
                const hasPreviousVersion = Boolean(tpl.previous_version);
                const variableCount = tpl.variables?.length || 0;

                return (
                  <div
                    key={tpl.id}
                    className={`bg-white rounded-2xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-brand-500 ring-2 ring-brand-100 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-xs'
                    }`}
                  >
                    {/* En-tête de carte */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-extrabold text-sm text-gray-900 line-clamp-2 leading-snug">
                          {tpl.title || tpl.name}
                        </h3>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-extrabold rounded-md border border-blue-200 shrink-0">
                          v{tpl.version || 1}
                        </span>
                      </div>

                      {/* Badges canal, langue, par défaut */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${channelStyle.bg} ${channelStyle.text} ${channelStyle.border}`}
                        >
                          {channelStyle.icon}
                          {channelStyle.label}
                        </span>

                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-lg border border-gray-200">
                          <span>{langInfo.flag}</span>
                          <span>{tpl.language.toUpperCase()}</span>
                        </span>

                        {tpl.is_default && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                            Par défaut
                          </span>
                        )}
                      </div>

                      {/* Objet si email */}
                      {tpl.subject && (
                        <div className="text-[11px] text-gray-600 bg-gray-50 p-2 rounded-xl border border-gray-100">
                          <span className="font-semibold text-gray-400 mr-1">Objet :</span>
                          <span className="italic font-medium text-gray-800 line-clamp-1">{tpl.subject}</span>
                        </div>
                      )}

                      {/* Corps avec surlignage des balises et fadeout */}
                      <div className="relative pt-1">
                        <div className="max-h-24 overflow-hidden relative">
                          {renderHighlightedBodySnippet(tpl.body)}
                        </div>
                        <div className="text-[10px] text-gray-400 font-semibold mt-2 flex items-center justify-between">
                          <span>{variableCount} variable{variableCount > 1 ? 's' : ''} utilisée{variableCount > 1 ? 's' : ''}</span>
                          {hasPreviousVersion && (
                            <span className="text-indigo-600 font-bold flex items-center gap-1">
                              <RotateCcw className="w-2.5 h-2.5" />
                              v{tpl.previous_version?.version} disponible
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pied de carte (Barre d'actions) */}
                    <div className="p-3 bg-gray-50 border-t border-gray-100 rounded-b-2xl flex items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSelectForTest(tpl)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold transition-colors ${
                            isSelected
                              ? 'bg-brand-600 text-white'
                              : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                          title="Tester ce modèle dans le simulateur"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Tester</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(tpl)}
                          className="p-1.5 bg-white hover:bg-gray-100 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg transition-colors"
                          title="Modifier le modèle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(tpl)}
                          className="p-1.5 bg-white hover:bg-gray-100 text-gray-600 hover:text-blue-600 border border-gray-200 rounded-lg transition-colors"
                          title="Dupliquer ce modèle"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {!tpl.is_default && (
                          <button
                            type="button"
                            onClick={() => handleSetDefault(tpl)}
                            className="p-1.5 bg-white hover:bg-amber-50 text-gray-400 hover:text-amber-600 border border-gray-200 rounded-lg transition-colors"
                            title="Définir comme modèle par défaut"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {hasPreviousVersion && (
                          <button
                            type="button"
                            onClick={() => setRestoringTemplate(tpl)}
                            className="p-1.5 bg-white hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 border border-gray-200 rounded-lg transition-colors"
                            title={`Restaurer version précédente (v${tpl.previous_version?.version})`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setDeletingTemplate(tpl)}
                        className="p-1.5 bg-white hover:bg-red-50 text-gray-400 hover:text-red-600 border border-gray-200 rounded-lg transition-colors"
                        title="Supprimer le modèle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Colonne Simulateur de rendu en direct (LIVRABLE 5) */}
        <div className="space-y-4">
          <TemplateSimulator
            selectedTemplate={selectedTemplateForPreview}
            onTemplateChange={(templateId) => {
              const tpl = templates.find((t) => t.id === templateId);
              if (tpl) setSelectedTemplateForPreview(tpl);
            }}
            templates={templates}
          />
        </div>
      </div>

      {/* MODALE DE CONFIRMATION DE SUPPRESSION */}
      {deletingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-gray-900">Supprimer ce modèle ?</h3>
              <p className="text-xs text-gray-500">
                Êtes-vous sûr de vouloir supprimer définitivement le modèle <strong>"{deletingTemplate.name}"</strong> ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTemplate(null)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE CONFIRMATION DE RESTAURATION (ROLLBACK) */}
      {restoringTemplate && restoringTemplate.previous_version && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-gray-900">Restaurer la version précédente ?</h3>
              <p className="text-xs text-gray-500">
                Voulez-vous restaurer la version <strong>v{restoringTemplate.previous_version.version}</strong> sauvegardée le{' '}
                <strong>{new Date(restoringTemplate.previous_version.saved_at).toLocaleDateString()}</strong> ?
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-700 max-h-36 overflow-y-auto whitespace-pre-wrap">
              {restoringTemplate.previous_version.body}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestoringTemplate(null)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleExecuteRollback}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Restaurer cette version
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE D'ÉDITION AVANCÉE (LIVRABLE 4) */}
      <TemplateEditorModal
        isOpen={isEditorModalOpen}
        onClose={() => {
          setIsEditorModalOpen(false);
          setEditingTemplate(null);
        }}
        onSaved={(savedTemplate) => {
          showToast(
            editingTemplate
              ? `Modèle "${savedTemplate.title || savedTemplate.name}" mis à jour (v${savedTemplate.version || 1})`
              : `Modèle "${savedTemplate.title || savedTemplate.name}" créé avec succès`
          );
          loadTemplates();
        }}
        initialTemplate={editingTemplate}
      />

      {/* MODALE D'EXPORTATION JSON (LIVRABLE 6) */}
      <TemplateExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        templates={templates}
      />

      {/* MODALE D'IMPORTATION JSON (LIVRABLE 6) */}
      <TemplateImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImported={(count) => {
          showToast(`${count} modèle${count > 1 ? 's' : ''} importé${count > 1 ? 's' : ''} ou synchronisé${count > 1 ? 's' : ''} avec succès`);
          loadTemplates();
        }}
      />

      {/* MODALE DE RÉINITIALISATION D'USINE (LIVRABLE 6) */}
      <TemplateResetConfirmModal
        isOpen={isResetConfirmModalOpen}
        onClose={() => setIsResetConfirmModalOpen(false)}
        onConfirmed={(count) => {
          showToast(`Bibliothèque réinitialisée avec succès (${count} modèles standards)`);
          loadTemplates();
        }}
        currentTemplatesCount={templates.length}
      />
    </div>
  );
}
