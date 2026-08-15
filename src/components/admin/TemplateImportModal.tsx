import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  UploadCloud,
  FileCode,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  X,
  RotateCcw,
  Check,
  CheckSquare,
  Square,
  Loader2,
  AlertCircle,
  Mail,
  MessageSquare,
  Globe,
  Code,
  Inbox
} from 'lucide-react';
import {
  importTemplatesFromJSON,
  getTemplates
} from '../../lib/certificationTemplatesService';
import type {
  VerificationChannel
} from '../../lib/supabase';

export type TemplateImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onImported: (count: number) => void;
  userId?: string;
};

// Flags et libellés de langue
const LANGUAGE_FLAGS: Record<string, { label: string; flag: string }> = {
  fr: { label: 'FR', flag: '🇫🇷' },
  en: { label: 'EN', flag: '🇬🇧' },
  es: { label: 'ES', flag: '🇪🇸' },
  pt: { label: 'PT', flag: '🇵🇹' }
};

// Badges des canaux
const CHANNEL_BADGES: Record<string, { label: string; bg: string; icon: React.ReactNode }> = {
  email: { label: 'Email', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Mail className="w-3 h-3" /> },
  whatsapp: { label: 'WhatsApp', bg: 'bg-green-50 text-green-700 border-green-200', icon: <MessageSquare className="w-3 h-3" /> },
  form: { label: 'Formulaire', bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: <Globe className="w-3 h-3" /> },
  api: { label: 'API', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <Code className="w-3 h-3" /> },
  letter: { label: 'Courrier', bg: 'bg-orange-50 text-orange-700 border-orange-200', icon: <Inbox className="w-3 h-3" /> }
};

interface ParsedTemplateItem {
  id: string;
  title: string;
  name: string;
  language: string;
  channel: VerificationChannel;
  subject?: string | null;
  body: string;
  variables?: string[];
  is_default?: boolean;
  version?: number;
  existsAlready: boolean;
}

export default function TemplateImportModal({
  isOpen,
  onClose,
  onImported,
  userId
}: TemplateImportModalProps) {
  // Mode de saisie : fichier vs texte collé
  const [inputMode, setInputMode] = useState<'file' | 'paste'>('file');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [rawJSON, setRawJSON] = useState<string>('');

  // Analyse et validation
  const [isValidFormat, setIsValidFormat] = useState<boolean | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [exportDate, setExportDate] = useState<string | null>(null);
  const [formatVersion, setFormatVersion] = useState<string>('1.0');
  const [parsedTemplates, setParsedTemplates] = useState<ParsedTemplateItem[]>([]);
  const [selectedTemplateIndices, setSelectedTemplateIndices] = useState<Set<number>>(new Set());

  // Options d'import
  const [overwriteExisting, setOverwriteExisting] = useState<boolean>(false);
  const [tagAsImported, setTagAsImported] = useState<boolean>(true);

  // État de chargement et étape
  const [currentStep, setCurrentStep] = useState<1 | 2 | 4>(1); // 1: sélection, 2: prévisualisation & options, 4: résultat
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{ count: number; errors: string[] } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Réinitialisation lors de l'ouverture
  useEffect(() => {
    if (isOpen) {
      setInputMode('file');
      setIsDragOver(false);
      setFileMeta(null);
      setRawJSON('');
      setIsValidFormat(null);
      setValidationErrors([]);
      setExportDate(null);
      setFormatVersion('1.0');
      setParsedTemplates([]);
      setSelectedTemplateIndices(new Set());
      setOverwriteExisting(false);
      setTagAsImported(true);
      setCurrentStep(1);
      setIsSubmitting(false);
      setImportResult(null);
    }
  }, [isOpen]);

  // Fermeture sur Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSubmitting]);

  // Parser et valider le JSON
  const analyzeJSONContent = useCallback(async (content: string, sourceName?: string, sourceSize?: number) => {
    setRawJSON(content);
    setValidationErrors([]);

    if (!content.trim()) {
      setIsValidFormat(false);
      setValidationErrors(['Le contenu JSON est vide.']);
      return;
    }

    try {
      const parsed = JSON.parse(content);
      let list: Array<Record<string, unknown>> = [];
      let detectedExportDate: string | null = null;
      let detectedVersion = '1.0';

      if (Array.isArray(parsed)) {
        list = parsed;
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.templates)) {
          list = parsed.templates;
        }
        if (parsed.exported_at && typeof parsed.exported_at === 'string') {
          detectedExportDate = parsed.exported_at;
        }
        if (parsed.version && typeof parsed.version === 'string') {
          detectedVersion = parsed.version;
        }
      }

      if (list.length === 0) {
        setIsValidFormat(false);
        setValidationErrors(['Aucun modèle valide trouvé dans ce fichier JSON (clé "templates" ou tableau d\'objets attendu).']);
        setCurrentStep(2);
        return;
      }

      // Récupérer les templates actuels en base pour détecter les doublons
      const { data: currentDbTemplates } = await getTemplates();
      const dbTemplates = currentDbTemplates || [];

      const errors: string[] = [];
      const validatedList: ParsedTemplateItem[] = [];

      list.forEach((item, index) => {
        const title = (item.title as string) || (item.name as string) || '';
        const body = (item.body as string) || '';
        const channel = (item.channel as VerificationChannel) || 'email';
        const language = (item.language as string) || 'fr';

        if (!title.trim()) {
          errors.push(`Template #${index + 1} : 'title' ou 'name' manquant`);
        }
        if (!body.trim()) {
          errors.push(`Template #${index + 1} ("${title || 'Sans titre'}") : 'body' manquant`);
        }

        if (title.trim() && body.trim()) {
          // Vérifier si existe déjà
          const exists = dbTemplates.some(
            (existing) =>
              (existing.title?.toLowerCase() === title.toLowerCase() ||
                existing.name?.toLowerCase() === title.toLowerCase()) &&
              existing.language === language &&
              existing.channel === channel
          );

          validatedList.push({
            id: `item-${index}`,
            title,
            name: title,
            language,
            channel,
            subject: (item.subject as string) || null,
            body,
            variables: Array.isArray(item.variables) ? (item.variables as string[]) : [],
            is_default: Boolean(item.is_default),
            version: typeof item.version === 'number' ? item.version : 1,
            existsAlready: exists
          });
        }
      });

      if (errors.length > 0 && validatedList.length === 0) {
        setIsValidFormat(false);
        setValidationErrors(errors);
        setCurrentStep(2);
        return;
      }

      setFileMeta({
        name: sourceName || 'Données JSON collées',
        size: sourceSize || new Blob([content]).size
      });
      setExportDate(detectedExportDate);
      setFormatVersion(detectedVersion);
      setParsedTemplates(validatedList);
      setSelectedTemplateIndices(new Set(validatedList.map((_, i) => i)));
      setIsValidFormat(true);
      setValidationErrors(errors);
      setCurrentStep(2);
    } catch (err: unknown) {
      setIsValidFormat(false);
      const msg = err instanceof Error ? err.message : 'Erreur de syntaxe JSON';
      setValidationErrors([`Syntaxe JSON invalide : ${msg}`]);
      setCurrentStep(2);
    }
  }, []);

  // Gestion du drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        analyzeJSONContent(text, file.name, file.size);
      };
      reader.readAsText(file);
    }
  };

  // Gestion de la sélection de fichier
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      analyzeJSONContent(text, file.name, file.size);
    };
    reader.readAsText(file);
  };

  // Gestion de sélection / désélection des templates
  const handleToggleTemplateSelect = (idx: number) => {
    setSelectedTemplateIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedTemplateIndices.size === parsedTemplates.length) {
      setSelectedTemplateIndices(new Set());
    } else {
      setSelectedTemplateIndices(new Set(parsedTemplates.map((_, i) => i)));
    }
  };

  // Déclencher l'importation
  const handleExecuteImport = async () => {
    if (selectedTemplateIndices.size === 0) return;

    setIsSubmitting(true);
    try {
      // Filtrer les templates sélectionnés
      const templatesToImport = parsedTemplates
        .filter((_, idx) => selectedTemplateIndices.has(idx))
        .map((t) => {
          const bodyText = t.body;
          if (tagAsImported && !bodyText.includes('[Source : Import JSON]')) {
            // Optionnel : métadonnée interne
          }
          return {
            title: t.title,
            name: t.name,
            language: t.language,
            channel: t.channel,
            subject: t.subject,
            body: bodyText,
            variables: t.variables,
            is_default: t.is_default
          };
        });

      const payloadToSubmit = JSON.stringify({ templates: templatesToImport });
      const result = await importTemplatesFromJSON(payloadToSubmit, overwriteExisting, userId);

      setImportResult({
        count: result.importedCount,
        errors: result.errors
      });
      setCurrentStep(4);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur critique lors de l\'importation';
      setImportResult({
        count: 0,
        errors: [msg]
      });
      setCurrentStep(4);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const newCount = parsedTemplates.filter((t) => !t.existsAlready).length;
  const existingCount = parsedTemplates.filter((t) => t.existsAlready).length;
  const allSelected = selectedTemplateIndices.size === parsedTemplates.length && parsedTemplates.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* EN-TÊTE */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 id="import-modal-title" className="text-base font-black text-gray-900 tracking-tight flex items-center gap-2">
                <span>Importer des modèles de messages</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 font-bold">
                  JSON
                </span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Restaurez une sauvegarde ou importez des templates depuis un autre environnement
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

        {/* CORPS DE LA MODALE SELON L'ÉTAPE */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* ÉTAPE 1 : SÉLECTION DU FICHIER OU COLLER JSON */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Onglets de mode */}
              <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => setInputMode('file')}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                    inputMode === 'file'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Fichier .json (Recommandé)
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('paste')}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                    inputMode === 'paste'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Coller du JSON manuellement
                </button>
              </div>

              {inputMode === 'file' ? (
                /* Zone de glisser-déposer */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                    isDragOver
                      ? 'border-brand-500 bg-brand-50/50 scale-[0.99]'
                      : 'border-gray-300 bg-gray-50/80 hover:bg-gray-100/80 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 text-brand-600 flex items-center justify-center shadow-xs">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900">
                      Glissez-déposez votre fichier JSON ici
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      ou cliquez pour parcourir les fichiers de votre ordinateur
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-gray-200">
                    Format attendu : .json (Standard EthiMarket)
                  </span>
                </div>
              ) : (
                /* Textarea manuelle */
                <div className="space-y-3">
                  <label className="font-bold text-gray-700 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-brand-600" />
                    <span>Collez le contenu JSON ci-dessous :</span>
                  </label>
                  <textarea
                    rows={9}
                    value={rawJSON}
                    onChange={(e) => setRawJSON(e.target.value)}
                    placeholder={`{\n  "version": "1.0",\n  "templates": [\n    {\n      "title": "Email de confirmation",\n      "language": "fr",\n      "channel": "email",\n      "body": "Bonjour..."\n    }\n  ]\n}`}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-mono text-[11px] text-gray-800 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => analyzeJSONContent(rawJSON)}
                      disabled={!rawJSON.trim()}
                      className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
                    >
                      Analyser et valider le JSON collé
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ÉTAPE 2 : PRÉVISUALISATION, VALIDATION & SÉLECTION */}
          {currentStep === 2 && (
            <div className="space-y-5">
              {/* Résumé de l'analyse */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-brand-600 shadow-2xs">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs">
                      {fileMeta?.name || 'Fichier JSON analysé'}
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Taille : {fileMeta ? `${(fileMeta.size / 1024).toFixed(1)} Ko` : 'N/A'}
                      {exportDate && ` • Exporté le : ${new Date(exportDate).toLocaleDateString()}`}
                      {` • Version : ${formatVersion}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isValidFormat ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Format valide ({parsedTemplates.length} modèles)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span>Format non conforme</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(1);
                      setRawJSON('');
                      setParsedTemplates([]);
                    }}
                    className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-600 text-xs font-bold inline-flex items-center gap-1"
                    title="Changer de fichier"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Recommencer</span>
                  </button>
                </div>
              </div>

              {/* Erreurs de validation si invalide */}
              {!isValidFormat && validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Erreurs de structure détectées :</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-[11px]">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Si format valide : liste des templates détectés */}
              {isValidFormat && (
                <>
                  {/* Barre de sélection et compteurs */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                          Modèles à importer ({selectedTemplateIndices.size}/{parsedTemplates.length})
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-bold">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            +{newCount} nouveaux
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                            {existingCount} existants
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:text-brand-800"
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

                    {/* Liste des modèles */}
                    <div className="border border-gray-200 rounded-2xl p-2 bg-gray-50/50 max-h-52 overflow-y-auto space-y-1 divide-y divide-gray-100">
                      {parsedTemplates.map((tpl, idx) => {
                        const isSelected = selectedTemplateIndices.has(idx);
                        const channelStyle = CHANNEL_BADGES[tpl.channel] || {
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
                                : 'hover:bg-gray-100 text-gray-500'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleTemplateSelect(idx)}
                                className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500 cursor-pointer"
                              />
                              <div className="truncate">
                                <span className="text-xs truncate">{tpl.title}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {tpl.existsAlready ? (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                  Existe déjà
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                  Nouveau
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
                  </div>

                  {/* Options d'import */}
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <span className="font-bold text-gray-900 uppercase tracking-wider text-[11px] block">
                      Options d'importation
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Toggle Écraser les existants */}
                      <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50/80 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={overwriteExisting}
                          onChange={(e) => setOverwriteExisting(e.target.checked)}
                          className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500 mt-0.5"
                        />
                        <div>
                          <span className="font-bold text-gray-800 text-xs block">
                            Écraser les modèles existants
                          </span>
                          <span className="text-[10px] text-gray-500 leading-snug">
                            Si désactivé, les doublons seront ignorés sans modifier vos versions actuelles.
                          </span>
                        </div>
                      </label>

                      {/* Toggle Note d'audit */}
                      <label className="flex items-start gap-2.5 p-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50/80 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={tagAsImported}
                          onChange={(e) => setTagAsImported(e.target.checked)}
                          className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500 mt-0.5"
                        />
                        <div>
                          <span className="font-bold text-gray-800 text-xs block">
                            Marquer comme "importé"
                          </span>
                          <span className="text-[10px] text-gray-500 leading-snug">
                            Enregistre l'origine pour faciliter l'audit et la traçabilité.
                          </span>
                        </div>
                      </label>
                    </div>

                    {overwriteExisting && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-center gap-2 text-[11px]">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          Attention : Les {existingCount} modèles existants sélectionnés seront mis à jour avec le nouveau contenu.
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ÉTAPE 4 : RÉSULTAT FINAL */}
          {currentStep === 4 && importResult && (
            <div className="space-y-6 py-4 text-center">
              {importResult.count > 0 ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">
                      Importation terminée avec succès !
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      <strong>{importResult.count}</strong> modèle{importResult.count > 1 ? 's ont été importés ou mis à jour' : ' a été importé ou mis à jour'} dans votre bibliothèque.
                    </p>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left text-amber-800 text-xs space-y-1.5">
                      <span className="font-bold block">Avertissements / Erreurs partielles :</span>
                      <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                        {importResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto shadow-sm">
                    <AlertTriangle className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">
                      Échec de l'importation
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Aucun modèle n'a pu être importé. Consultez le rapport d'erreurs ci-dessous.
                    </p>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-left text-red-800 text-xs space-y-1.5">
                      <span className="font-bold block">Détail des erreurs :</span>
                      <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                        {importResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* BARRE D'ACTIONS */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex flex-wrap items-center justify-between gap-3">
          {currentStep !== 4 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-xs border border-gray-200 transition-colors shadow-2xs disabled:opacity-50"
              >
                Annuler
              </button>

              {currentStep === 2 && isValidFormat && (
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isSubmitting || selectedTemplateIndices.size === 0}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-md hover:shadow-lg transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Importation en cours...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirmer l'import ({selectedTemplateIndices.size} modèles)</span>
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            <div className="w-full flex justify-end gap-2">
              {importResult && importResult.count === 0 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-xs"
                >
                  Réessayer avec un autre fichier
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (importResult && importResult.count > 0) {
                      onImported(importResult.count);
                    }
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-xl text-xs shadow-md"
                >
                  Fermer et rafraîchir la liste
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
