import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Download,
  Copy,
  Check,
  X,
  FileJson,
  Layers,
  Settings2,
  Eye,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Mail,
  MessageSquare,
  Globe,
  Code,
  Inbox
} from 'lucide-react';
import type {
  CertificationMessageTemplate,
  VerificationChannel
} from '../../lib/supabase';

export type TemplateExportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  templates: CertificationMessageTemplate[];
};

// Flags et libellés de langue
const LANGUAGE_FLAGS: Record<string, { label: string; flag: string }> = {
  fr: { label: 'FR', flag: '🇫🇷' },
  en: { label: 'EN', flag: '🇬🇧' },
  es: { label: 'ES', flag: '🇪🇸' },
  pt: { label: 'PT', flag: '🇵🇹' }
};

// Badges des canaux
const CHANNEL_BADGES: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  email: { label: 'Email', bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700', icon: <Mail className="w-3 h-3" /> },
  whatsapp: { label: 'WhatsApp', bg: 'bg-green-50 text-green-700 border-green-200', text: 'text-green-700', icon: <MessageSquare className="w-3 h-3" /> },
  form: { label: 'Formulaire', bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-700', icon: <Globe className="w-3 h-3" /> },
  api: { label: 'API', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', text: 'text-indigo-700', icon: <Code className="w-3 h-3" /> },
  letter: { label: 'Courrier', bg: 'bg-orange-50 text-orange-700 border-orange-200', text: 'text-orange-700', icon: <Inbox className="w-3 h-3" /> }
};

function formatTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
}

export default function TemplateExportModal({
  isOpen,
  onClose,
  templates
}: TemplateExportModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [includeMetadata, setIncludeMetadata] = useState<boolean>(true);
  const [includePreviousVersions, setIncludePreviousVersions] = useState<boolean>(false);
  const [isMinified, setIsMinified] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [showFullPreview, setShowFullPreview] = useState<boolean>(false);

  // Initialisation à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(templates.map((t) => t.id)));
      setFileName(`ethimarket_templates_${formatTimestamp()}.json`);
      setCopied(false);
      setShowFullPreview(false);
    }
  }, [isOpen, templates]);

  // Fermeture sur la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Bascule de sélection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === templates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(templates.map((t) => t.id)));
    }
  };

  // Construction du JSON d'export
  const generatedJSON = useMemo(() => {
    const selectedList = templates.filter((t) => selectedIds.has(t.id));

    const exportPayload = {
      exported_at: new Date().toISOString(),
      generator: 'EthiMarket B2B Platform - Certification Engine',
      version: '1.0',
      total_count: selectedList.length,
      templates: selectedList.map((t) => {
        const item: Record<string, unknown> = {
          title: t.title || t.name,
          name: t.name,
          language: t.language,
          channel: t.channel,
          subject: t.subject || null,
          body: t.body,
          variables: t.variables || [],
          is_default: Boolean(t.is_default),
          version: t.version || 1
        };

        if (includeMetadata) {
          item.id = t.id;
          item.created_at = t.created_at;
          item.updated_at = t.updated_at;
          item.created_by = t.created_by;
          item.updated_by = t.updated_by;
        }

        if (includePreviousVersions && t.previous_version) {
          item.previous_version = t.previous_version;
        }

        return item;
      })
    };

    return isMinified
      ? JSON.stringify(exportPayload)
      : JSON.stringify(exportPayload, null, 2);
  }, [templates, selectedIds, includeMetadata, includePreviousVersions, isMinified]);

  // Coloration syntaxique basique
  const syntaxHighlightedLines = useMemo(() => {
    const lines = generatedJSON.split('\n');
    const displayLines = showFullPreview ? lines : lines.slice(0, 20);

    return displayLines.map((line, idx) => {
      // Coloration via regex basique
      const formatted = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match) => {
          let cls = 'text-amber-400'; // number
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = 'text-sky-300 font-bold'; // key
            } else {
              cls = 'text-emerald-300'; // string
            }
          } else if (/true|false/.test(match)) {
            cls = 'text-purple-400 font-bold'; // boolean
          } else if (/null/.test(match)) {
            cls = 'text-rose-400 italic'; // null
          }
          return `<span class="${cls}">${match}</span>`;
        });

      return (
        <div key={idx} className="leading-5 flex">
          <span className="text-gray-600 select-none pr-3 w-8 text-right shrink-0">
            {idx + 1}
          </span>
          <span dangerouslySetInnerHTML={{ __html: formatted }} />
        </div>
      );
    });
  }, [generatedJSON, showFullPreview]);

  // Copier dans le presse-papier
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedJSON);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  }, [generatedJSON]);

  // Déclencher le téléchargement du fichier
  const handleDownload = useCallback(() => {
    try {
      const blob = new Blob([generatedJSON], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.trim().endsWith('.json') ? fileName.trim() : `${fileName.trim()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
    }
  }, [generatedJSON, fileName, onClose]);

  if (!isOpen) return null;

  const allSelected = selectedIds.size === templates.length && templates.length > 0;
  const totalLines = generatedJSON.split('\n').length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* EN-TÊTE */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 id="export-modal-title" className="text-base font-black text-gray-900 tracking-tight flex items-center gap-2">
                <span>Exporter les modèles de messages</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 font-bold">
                  JSON
                </span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Téléchargez tous vos templates au format JSON pour sauvegarde ou transfert
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la modale"
            className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CORPS SCROLLABLE */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs">
          {/* SECTION 1 : SÉLECTION DES TEMPLATES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-600" />
                <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                  1. Sélection des modèles à exporter
                </span>
              </div>
              <button
                type="button"
                onClick={handleSelectAll}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:text-brand-800 hover:underline"
              >
                {allSelected ? (
                  <>
                    <Square className="w-3.5 h-3.5" />
                    <span>Tout désélectionner</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Tout sélectionner</span>
                  </>
                )}
              </button>
            </div>

            {/* Liste scrollable des templates avec cases à cocher */}
            <div className="border border-gray-200 rounded-2xl p-2 bg-gray-50/50 max-h-48 overflow-y-auto space-y-1 divide-y divide-gray-100">
              {templates.map((tpl) => {
                const isSelected = selectedIds.has(tpl.id);
                const channelStyle = CHANNEL_BADGES[tpl.channel as VerificationChannel] || {
                  label: tpl.channel,
                  bg: 'bg-gray-100 text-gray-700 border-gray-200',
                  icon: <Mail className="w-3 h-3" />
                };
                const langInfo = LANGUAGE_FLAGS[tpl.language] || { label: tpl.language.toUpperCase(), flag: '🌐' };

                return (
                  <label
                    key={tpl.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white shadow-2xs border border-brand-200 text-gray-900 font-bold'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(tpl.id)}
                        className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500 cursor-pointer"
                      />
                      <div className="truncate">
                        <span className="text-xs truncate">{tpl.title || tpl.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {tpl.is_default && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          Défaut
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${channelStyle.bg}`}>
                        {channelStyle.icon}
                        <span>{channelStyle.label}</span>
                      </span>
                      <span className="text-[10px] font-bold bg-white text-gray-700 border border-gray-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                        <span>{langInfo.flag}</span>
                        <span>{langInfo.label}</span>
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Compteur de sélection */}
            <div className="flex items-center justify-between text-[11px] text-gray-500 px-1 font-medium">
              <span>
                <strong>{selectedIds.size}</strong> modèle{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''} sur <strong>{templates.length}</strong>
              </span>
              {selectedIds.size === 0 && (
                <span className="text-red-500 font-bold">⚠️ Veuillez sélectionner au moins 1 modèle</span>
              )}
            </div>
          </div>

          {/* SECTION 2 : OPTIONS D'EXPORT */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-brand-600" />
              <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                2. Options de configuration du fichier
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Toggle Métadonnées */}
              <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50/80 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                />
                <div>
                  <span className="font-bold text-gray-800 text-xs block">Inclure les métadonnées</span>
                  <span className="text-[10px] text-gray-500">Dates de création, auteur et versions</span>
                </div>
              </label>

              {/* Toggle Versions précédentes */}
              <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50/80 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={includePreviousVersions}
                  onChange={(e) => setIncludePreviousVersions(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                />
                <div>
                  <span className="font-bold text-gray-800 text-xs block">Inclure versions précédentes</span>
                  <span className="text-[10px] text-gray-500">Conserve l'historique de rollback</span>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Format JSON */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700">Format du fichier :</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setIsMinified(false)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                      !isMinified ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Formaté (Indenté)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMinified(true)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                      isMinified ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Minifié (Compact)
                  </button>
                </div>
              </div>

              {/* Nom du fichier */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700">Nom du fichier cible :</label>
                <div className="relative">
                  <FileJson className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="nom_du_fichier.json"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs text-gray-800 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3 : PRÉVISUALISATION DU JSON */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-brand-600" />
                <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                  3. Prévisualisation du payload ({totalLines} lignes)
                </span>
              </div>
              {totalLines > 20 && (
                <button
                  type="button"
                  onClick={() => setShowFullPreview(!showFullPreview)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:text-brand-800"
                >
                  {showFullPreview ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Réduire à 20 lignes</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Voir tout le JSON ({totalLines} lignes)</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="bg-gray-900 text-gray-100 rounded-2xl p-4 font-mono text-[11px] max-h-52 overflow-auto border border-gray-800 shadow-inner">
              {syntaxHighlightedLines}
              {!showFullPreview && totalLines > 20 && (
                <div className="pt-2 text-center text-gray-500 italic text-[10px] border-t border-gray-800/80 mt-2">
                  ... +{totalLines - 20} lignes masquées. Cliquez sur "Voir tout" ci-dessus pour déplier.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BARRE D'ACTIONS */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-xs border border-gray-200 transition-colors shadow-2xs"
          >
            Annuler
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={selectedIds.size === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-xs border border-gray-200 transition-colors shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">JSON copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-gray-500" />
                  <span>Copier le JSON</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={selectedIds.size === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-xl text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger le fichier (.json)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
