import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Eye,
  Sparkles,
  User,
  Hash,
  Award,
  Building2,
  Link as LinkIcon,
  Calendar,
  Globe,
  RotateCcw,
  Shuffle,
  Copy,
  Mail,
  MessageSquare,
  FileText,
  Terminal,
  Download,
  AlertTriangle,
  CheckCircle2,
  MousePointerClick,
  History,
  Columns,
  Check,
  Zap
} from 'lucide-react';
import { renderTemplate } from '../../lib/certificationTemplatesService';
import type {
  CertificationMessageTemplate,
  VerificationChannel
} from '../../lib/supabase';

export type TemplateSimulatorProps = {
  selectedTemplate?: CertificationMessageTemplate | null;
  onTemplateChange?: (templateId: string) => void;
  templates?: CertificationMessageTemplate[];
  compact?: boolean;
};

type TestData = {
  producer_name: string;
  certificate_number: string;
  standard_name: string;
  body_name: string;
  verification_url: string;
  expiry_date: string;
  issue_date: string;
  platform_name: string;
  admin_name: string;
  admin_email: string;
};

const DEFAULT_TEST_DATA: TestData = {
  producer_name: 'Coopérative Cacao Bio Sambirano',
  certificate_number: 'ECO-2024-8881',
  standard_name: 'Agriculture Biologique UE',
  body_name: 'Ecocert Greenlife',
  verification_url: 'https://certi.ethimarket.io/verify/abc123',
  expiry_date: '2026-12-31',
  issue_date: '2024-01-15',
  platform_name: 'EthiMarket',
  admin_name: 'Sophie Auditeur',
  admin_email: 'compliance@ethimarket.com'
};

const PRESET_EXAMPLES: { name: string; desc: string; data: TestData }[] = [
  {
    name: "1. Cacao Côte d'Ivoire",
    desc: 'Coopérative équitable & bio certifiée Ecocert',
    data: {
      producer_name: "Coopérative Cacao Bio d'Abengourou (CI)",
      certificate_number: 'CI-ECO-2024-912',
      standard_name: 'Fairtrade Max Havelaar & Bio UE',
      body_name: 'Ecocert Greenlife France',
      verification_url: 'https://certi.ethimarket.io/verify/ci-912',
      expiry_date: '2026-12-31',
      issue_date: '2024-01-15',
      platform_name: 'EthiMarket B2B',
      admin_name: 'Sophie Auditeur',
      admin_email: 'compliance@ethimarket.com'
    }
  },
  {
    name: '2. Café Éthiopie',
    desc: 'Union de caféiculteurs d’altitude Rainforest Alliance',
    data: {
      producer_name: 'Yirgacheffe Coffee Farmers Union',
      certificate_number: 'ETH-COF-8821-A',
      standard_name: 'Rainforest Alliance Certified',
      body_name: 'SGS Agricultural Services',
      verification_url: 'https://certi.ethimarket.io/verify/eth-8821',
      expiry_date: '2027-06-30',
      issue_date: '2024-03-10',
      platform_name: 'EthiMarket B2B',
      admin_name: 'Marc Auditeur Senior',
      admin_email: 'audit.africa@ethimarket.com'
    }
  },
  {
    name: '3. Riz Inde',
    desc: 'Producteurs de riz Basmati biologique USDA',
    data: {
      producer_name: 'Punjab Organic Basmati Growers Collective',
      certificate_number: 'IN-NPOP-5542',
      standard_name: 'USDA Organic & India Organic',
      body_name: 'Control Union Inspections India',
      verification_url: 'https://certi.ethimarket.io/verify/in-5542',
      expiry_date: '2025-11-20',
      issue_date: '2023-11-20',
      platform_name: 'EthiMarket B2B',
      admin_name: 'Amrita Patel',
      admin_email: 'compliance.asia@ethimarket.com'
    }
  }
];

const LOCAL_STORAGE_KEY = 'ethimarket_simulator_test_data';

export default function TemplateSimulator({
  selectedTemplate,
  onTemplateChange,
  templates = [],
  compact = false
}: TemplateSimulatorProps) {
  // 1. Initialisation des données de test avec persistance localStorage
  const [testData, setTestData] = useState<TestData>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_TEST_DATA, ...JSON.parse(saved) };
      }
    } catch {
      // Ignorer
    }
    return DEFAULT_TEST_DATA;
  });

  // Sauvegarde automatique dans localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(testData));
    } catch {
      // Ignorer
    }
  }, [testData]);

  // États additionnels
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [comparisonTemplateId, setComparisonTemplateId] = useState<string>('');
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [simulationHistory, setSimulationHistory] = useState<{ id: string; title: string; timestamp: string; data: TestData }[]>([]);
  const [formatJson, setFormatJson] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Avertisseur toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  useEffect(() => {
    if (selectedTemplate) {
      const templateTitle = selectedTemplate.title || selectedTemplate.name;
      setSimulationHistory((prev) => {
        const item = {
          id: `${selectedTemplate.id}-${Date.now()}`,
          title: templateTitle,
          timestamp: new Date().toLocaleTimeString(),
          data: { ...testData }
        };
        const filtered = prev.filter((h) => h.title !== item.title || JSON.stringify(h.data) !== JSON.stringify(item.data));
        return [item, ...filtered].slice(0, 5);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate?.id]);

  // 3. Calcul du rendu en temps réel avec benchmark
  const { renderedSubject, renderedBody, renderDurationMs, detectedVars, unreplacedVars } = useMemo(() => {
    if (!selectedTemplate) {
      return {
        renderedSubject: null,
        renderedBody: '',
        renderDurationMs: 0,
        detectedVars: [],
        unreplacedVars: []
      };
    }

    const start = performance.now();
    const rendered = renderTemplate(selectedTemplate, testData);
    const end = performance.now();

    // Détection des variables non résolues (syntaxe restante {variable})
    const fullRendered = `${rendered.subject || ''} ${rendered.body}`;
    const unreplacedMatches = fullRendered.match(/\{[a-zA-Z0-9_]+\}/g) || [];
    const unreplaced = Array.from(new Set(unreplacedMatches.map((m) => m.replace(/[{}]/g, ''))));

    const detected = selectedTemplate.variables || [];

    return {
      renderedSubject: rendered.subject,
      renderedBody: rendered.body,
      renderDurationMs: Math.max(0.1, Number((end - start).toFixed(2))),
      detectedVars: detected,
      unreplacedVars: unreplaced
    };
  }, [selectedTemplate, testData]);

  // Second template pour le mode comparaison
  const comparisonTemplate = useMemo(() => {
    if (!showComparison || !comparisonTemplateId) return null;
    return templates.find((t) => t.id === comparisonTemplateId) || null;
  }, [showComparison, comparisonTemplateId, templates]);

  const comparisonRender = useMemo(() => {
    if (!comparisonTemplate) return null;
    return renderTemplate(comparisonTemplate, testData);
  }, [comparisonTemplate, testData]);

  // Gestion des modifications d'inputs
  const handleInputChange = (field: keyof TestData, value: string) => {
    setTestData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // Réinitialiser les données de test
  const handleResetData = () => {
    setTestData(DEFAULT_TEST_DATA);
    triggerToast('Données de test réinitialisées');
  };

  // Charger un jeu d'exemples aléatoire
  const handleRandomPreset = () => {
    const randomIndex = Math.floor(Math.random() * PRESET_EXAMPLES.length);
    const preset = PRESET_EXAMPLES[randomIndex];
    setTestData(preset.data);
    triggerToast(`Scénario chargé : ${preset.name}`);
  };

  // Copier le rendu dans le presse-papier
  const handleCopyRendered = () => {
    if (!selectedTemplate) return;
    const fullText = selectedTemplate.channel === 'email' && renderedSubject
      ? `Objet : ${renderedSubject}\n\n${renderedBody}`
      : renderedBody;

    navigator.clipboard.writeText(fullText);
    triggerToast('📋 Contenu du message copié dans le presse-papier !');
  };

  // Télécharger en fichier TXT
  const handleDownloadTxt = () => {
    if (!selectedTemplate) return;
    const tplTitle = (selectedTemplate.title || selectedTemplate.name || 'template')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    const fullText = `=====================================================
SIMULATION DE MESSAGE — ETHIMARKET COMPLIANCE
=====================================================
Modèle : ${selectedTemplate.title || selectedTemplate.name}
Canal  : ${selectedTemplate.channel.toUpperCase()}
Langue : ${selectedTemplate.language.toUpperCase()}
Date   : ${new Date().toLocaleString()}
=====================================================

${selectedTemplate.channel === 'email' && renderedSubject ? `OBJET : ${renderedSubject}\n\n` : ''}CORPS DU MESSAGE :
-----------------------------------------------------
${renderedBody}
-----------------------------------------------------
Généré par EthiMarket Message Simulator`;

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `template_${tplTitle}_test.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast('💾 Fichier TXT téléchargé');
  };

  // Ouvrir dans le client email (mailto:)
  const handleOpenMailClient = () => {
    if (!renderedBody) return;
    const subjectParam = encodeURIComponent(renderedSubject || 'Demande de vérification de certificat');
    const bodyParam = encodeURIComponent(renderedBody);
    const bodySlug = testData.body_name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const toParam = `contact@${bodySlug || 'organism'}.org`;
    window.open(`mailto:${toParam}?subject=${subjectParam}&body=${bodyParam}`, '_blank');
  };

  // Ouvrir dans WhatsApp (wa.me)
  const handleOpenWhatsApp = () => {
    if (!renderedBody) return;
    const textParam = encodeURIComponent(renderedBody);
    window.open(`https://wa.me/?text=${textParam}`, '_blank');
  };

  // Compteur et statut de dépassement selon le canal
  const characterCount = renderedBody.length;
  const channelLimit = useMemo(() => {
    if (!selectedTemplate) return null;
    if (selectedTemplate.channel === 'whatsapp') {
      return {
        max: 1000,
        warningThreshold: 900,
        isWarning: characterCount >= 900,
        isExceeded: characterCount > 1000,
        label: `${characterCount}/1000 caractères`
      };
    }
    if (selectedTemplate.channel === 'email') {
      return {
        max: 3000,
        warningThreshold: 3000,
        isWarning: characterCount > 3000,
        isExceeded: false,
        label: `${characterCount} caractères (sans limite stricte)`
      };
    }
    return {
      max: null,
      warningThreshold: null,
      isWarning: false,
      isExceeded: false,
      label: `${characterCount} caractères`
    };
  }, [selectedTemplate, characterCount]);

  // Rendu avec coloration stylisée des variables résolues
  const renderStyledText = (text: string) => {
    // Remplacer les variables résolues ou manquantes par des tags visuels
    const parts = text.split(/(\{.*?\})/g);
    return parts.map((part, index) => {
      if (part.startsWith('{') && part.endsWith('}')) {
        return (
          <span
            key={index}
            className="inline-block px-1.5 py-0.5 mx-0.5 rounded-md bg-red-100 text-red-800 font-mono text-[11px] font-bold border border-red-300 animate-pulse"
            title="Variable non résolue !"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Badge du canal avec icône
  const getChannelBadge = (ch: VerificationChannel) => {
    switch (ch) {
      case 'email':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-200 text-xs">
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span>EMAIL</span>
          </span>
        );
      case 'whatsapp':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200 text-xs">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>WHATSAPP</span>
          </span>
        );
      case 'form':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 font-bold rounded-lg border border-purple-200 text-xs">
            <Globe className="w-3.5 h-3.5 text-purple-600" />
            <span>FORMULAIRE</span>
          </span>
        );
      case 'api':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 font-bold rounded-lg border border-amber-200 text-xs font-mono">
            <Terminal className="w-3.5 h-3.5 text-amber-600" />
            <span>API JSON</span>
          </span>
        );
      case 'letter':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-200 text-xs">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>COURRIER</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      id="template-simulator"
      className={`bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col transition-all ${
        compact ? 'space-y-3 p-4' : 'space-y-5 p-5 sm:p-6'
      }`}
    >
      {/* Toast de confirmation interne */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 bg-gray-900 text-white text-xs font-bold rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. EN-TÊTE DU SIMULATEUR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-50 rounded-2xl text-brand-700">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-1.5">
                <span>🎬 Simulateur d'envoi dynamique</span>
              </h3>
            </div>
            <p className="text-xs text-gray-500">
              Testez le rendu final de votre message avec des valeurs personnalisables en direct.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedTemplate && getChannelBadge(selectedTemplate.channel)}

          {/* Bouton comparaison */}
          {templates.length > 1 && selectedTemplate && (
            <button
              type="button"
              onClick={() => setShowComparison(!showComparison)}
              className={`p-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                showComparison
                  ? 'bg-brand-50 border-brand-300 text-brand-700'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600'
              }`}
              title="Comparer avec un autre modèle"
            >
              <Columns className="w-4 h-4" />
              <span className="hidden sm:inline">Comparer</span>
            </button>
          )}

          {/* Bouton historique */}
          {simulationHistory.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                showHistory
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600'
              }`}
              title="Historique des tests"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Historique ({simulationHistory.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Tiroir Historique */}
      {showHistory && (
        <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2 text-xs animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-indigo-950 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-600" />
              Historique des 5 dernières simulations
            </span>
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className="text-indigo-500 hover:text-indigo-700 font-bold"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {simulationHistory.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => {
                  setTestData(h.data);
                  triggerToast(`Données rechargées : ${h.title}`);
                }}
                className="text-left p-2 bg-white hover:bg-indigo-100/50 border border-indigo-100 rounded-xl transition-all shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 truncate">{h.title}</span>
                  <span className="text-[10px] text-gray-400">{h.timestamp}</span>
                </div>
                <p className="text-[10px] text-gray-500 truncate mt-0.5">
                  Producteur : {h.data.producer_name} ({h.data.certificate_number})
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 1 — SÉLECTION DU TEMPLATE */}
      {!selectedTemplate ? (
        <div className="p-8 border-2 border-dashed border-gray-200 rounded-3xl text-center space-y-3 bg-gray-50/50">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <MousePointerClick className="w-6 h-6 animate-bounce" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-gray-800">Aucun modèle sélectionné</h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Sélectionnez un modèle dans la liste à gauche en cliquant sur <strong>"👁️ Tester"</strong> ou choisissez-en un directement ci-dessous :
            </p>
          </div>
          {templates.length > 0 && onTemplateChange && (
            <div className="max-w-sm mx-auto pt-2">
              <select
                onChange={(e) => onTemplateChange(e.target.value)}
                defaultValue=""
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-brand-500 shadow-xs cursor-pointer"
              >
                <option value="" disabled>
                  -- Choisir un modèle de message ({templates.length}) --
                </option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.channel.toUpperCase()}] [{t.language.toUpperCase()}] {t.title || t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">
              {selectedTemplate.language === 'fr' && '🇫🇷'}
              {selectedTemplate.language === 'en' && '🇬🇧'}
              {selectedTemplate.language === 'es' && '🇪🇸'}
              {selectedTemplate.language === 'pt' && '🇵🇹'}
              {selectedTemplate.language === 'de' && '🇩🇪'}
            </span>
            <div>
              <h4 className="text-xs font-bold text-gray-900 leading-tight">
                {selectedTemplate.title || selectedTemplate.name}
              </h4>
              <p className="text-[10px] text-gray-500">
                Canal : <strong className="uppercase">{selectedTemplate.channel}</strong> • Langue :{' '}
                <strong className="uppercase">{selectedTemplate.language}</strong> • Version :{' '}
                <strong>v{selectedTemplate.version || 1}</strong>
              </p>
            </div>
          </div>

          {templates.length > 0 && onTemplateChange && (
            <div className="flex items-center gap-1.5">
              <select
                value={selectedTemplate.id}
                onChange={(e) => onTemplateChange(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-700 focus:outline-none focus:border-brand-500"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.channel.toUpperCase()}] {t.title || t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2 — DONNÉES DE TEST ÉDITABLES */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              🧪 Données de test
            </h4>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRandomPreset}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 text-[11px] font-bold rounded-lg border border-brand-200 transition-colors"
              title="Charger un jeu d'exemples aléatoires"
            >
              <Shuffle className="w-3 h-3" />
              <span>Exemple aléatoire</span>
            </button>

            <button
              type="button"
              onClick={handleResetData}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[11px] font-bold rounded-lg transition-colors"
              title="Réinitialiser les valeurs par défaut"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>

        {/* Jeux de presets rapides */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {PRESET_EXAMPLES.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => {
                setTestData(preset.data);
                triggerToast(`Jeu chargé : ${preset.name}`);
              }}
              className="px-2.5 py-1 bg-gray-50 hover:bg-brand-50/80 border border-gray-200 hover:border-brand-200 rounded-lg text-[10px] font-bold text-gray-700 hover:text-brand-800 transition-all"
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Grille 2 colonnes des 8 champs éditables */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50/40 p-3.5 rounded-2xl border border-gray-100">
          {/* 1. producer_name */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="sim-producer_name" className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                <User className="w-3 h-3 text-blue-500" />
                <span>Nom du producteur</span>
              </label>
              {selectedTemplate?.variables?.includes('producer_name') && (
                <span className="text-[9px] font-mono text-brand-600 bg-brand-50 px-1 rounded">Utilisé</span>
              )}
            </div>
            <input
              id="sim-producer_name"
              type="text"
              value={testData.producer_name}
              onChange={(e) => handleInputChange('producer_name', e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-brand-500 shadow-2xs"
            />
          </div>

          {/* 2. certificate_number */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="sim-certificate_number" className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                <Hash className="w-3 h-3 text-blue-500" />
                <span>N° Certificat</span>
              </label>
              {selectedTemplate?.variables?.includes('certificate_number') && (
                <span className="text-[9px] font-mono text-brand-600 bg-brand-50 px-1 rounded">Utilisé</span>
              )}
            </div>
            <input
              id="sim-certificate_number"
              type="text"
              value={testData.certificate_number}
              onChange={(e) => handleInputChange('certificate_number', e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-brand-500 shadow-2xs font-mono"
            />
          </div>

          {/* 3. standard_name */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="sim-standard_name" className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                <Award className="w-3 h-3 text-emerald-500" />
                <span>Standard / Label</span>
              </label>
              {selectedTemplate?.variables?.includes('standard_name') && (
                <span className="text-[9px] font-mono text-brand-600 bg-brand-50 px-1 rounded">Utilisé</span>
              )}
            </div>
            <input
              id="sim-standard_name"
              type="text"
              value={testData.standard_name}
              onChange={(e) => handleInputChange('standard_name', e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-brand-500 shadow-2xs"
            />
          </div>

          {/* 4. body_name */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="sim-body_name" className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-emerald-500" />
                <span>Organisme certificateur</span>
              </label>
              {selectedTemplate?.variables?.includes('body_name') && (
                <span className="text-[9px] font-mono text-brand-600 bg-brand-50 px-1 rounded">Utilisé</span>
              )}
            </div>
            <input
              id="sim-body_name"
              type="text"
              value={testData.body_name}
              onChange={(e) => handleInputChange('body_name', e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-brand-500 shadow-2xs"
            />
          </div>

          {/* 5. verification_url */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="sim-verification_url" className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                <LinkIcon className="w-3 h-3 text-emerald-500" />
                <span>Lien de validation</span>
              </label>
              {selectedTemplate?.variables?.includes('verification_url') && (
                <span className="text-[9px] font-mono text-brand-600 bg-brand-50 px-1 rounded">Utilisé</span>
              )}
            </div>
            <input
              id="sim-verification_url"
              type="text"
              value={testData.verification_url}
              onChange={(e) => handleInputChange('verification_url', e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:border-brand-500 shadow-2xs font-mono"
            />
          </div>

          {/* 6. expiry_date */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="sim-expiry_date" className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-500" />
                <span>Date d'expiration</span>
              </label>
              {selectedTemplate?.variables?.includes('expiry_date') && (
                <span className="text-[9px] font-mono text-brand-600 bg-brand-50 px-1 rounded">Utilisé</span>
              )}
            </div>
            <input
              id="sim-expiry_date"
              type="date"
              value={testData.expiry_date}
              onChange={(e) => handleInputChange('expiry_date', e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-brand-500 shadow-2xs"
            />
          </div>

          {/* 7. issue_date */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="sim-issue_date" className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-500" />
                <span>Date d'émission</span>
              </label>
              {selectedTemplate?.variables?.includes('issue_date') && (
                <span className="text-[9px] font-mono text-brand-600 bg-brand-50 px-1 rounded">Utilisé</span>
              )}
            </div>
            <input
              id="sim-issue_date"
              type="date"
              value={testData.issue_date}
              onChange={(e) => handleInputChange('issue_date', e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-brand-500 shadow-2xs"
            />
          </div>

          {/* 8. platform_name */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="sim-platform_name" className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                <Globe className="w-3 h-3 text-indigo-500" />
                <span>Nom plateforme</span>
              </label>
              {selectedTemplate?.variables?.includes('platform_name') && (
                <span className="text-[9px] font-mono text-brand-600 bg-brand-50 px-1 rounded">Utilisé</span>
              )}
            </div>
            <input
              id="sim-platform_name"
              type="text"
              value={testData.platform_name}
              onChange={(e) => handleInputChange('platform_name', e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-brand-500 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3 — RENDU EN TEMPS RÉEL SELON LE CANAL */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-brand-600" />
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              📩 Aperçu du message final
            </h4>
          </div>

          {channelLimit && (
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                channelLimit.isExceeded
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : channelLimit.isWarning
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {channelLimit.label}
            </span>
          )}
        </div>

        {/* Alertes variables non remplacées */}
        {unreplacedVars.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                <strong>Variables non remplacées détectées :</strong>{' '}
                {unreplacedVars.map((v) => `{${v}}`).join(', ')}
              </span>
            </div>
          </div>
        )}

        {/* Vue côte à côte (Mode comparaison) */}
        {showComparison && (
          <div className="p-3 bg-brand-50/50 border border-brand-200 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-brand-900 flex items-center gap-1.5">
                <Columns className="w-3.5 h-3.5" />
                Mode comparaison : choisir le second modèle
              </span>
              <button
                type="button"
                onClick={() => setShowComparison(false)}
                className="text-brand-600 hover:text-brand-800 font-bold"
              >
                ✕ Fermer comparaison
              </button>
            </div>
            <select
              value={comparisonTemplateId}
              onChange={(e) => setComparisonTemplateId(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-brand-200 rounded-xl font-bold text-gray-800 focus:outline-none"
            >
              <option value="">-- Sélectionner un 2ème modèle pour comparer --</option>
              {templates
                .filter((t) => t.id !== selectedTemplate?.id)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.channel.toUpperCase()}] {t.title || t.name} ({t.language.toUpperCase()})
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* RENDU SELON LE CANAL */}
        <div aria-live="polite" className="space-y-4">
          {showComparison && comparisonRender && comparisonTemplate ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Modèle 1 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 bg-gray-100 p-2 rounded-xl">
                  <span>Modèle 1 : {selectedTemplate?.title || selectedTemplate?.name}</span>
                  {selectedTemplate && getChannelBadge(selectedTemplate.channel)}
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs whitespace-pre-wrap font-sans max-h-96 overflow-y-auto leading-relaxed">
                  {renderedSubject && (
                    <div className="font-bold text-gray-900 border-b border-gray-200 pb-2 mb-2">
                      Objet : {renderedSubject}
                    </div>
                  )}
                  {renderStyledText(renderedBody)}
                </div>
              </div>

              {/* Modèle 2 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 bg-indigo-50 p-2 rounded-xl border border-indigo-100">
                  <span>Modèle 2 : {comparisonTemplate.title || comparisonTemplate.name}</span>
                  {getChannelBadge(comparisonTemplate.channel)}
                </div>
                <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 text-xs whitespace-pre-wrap font-sans max-h-96 overflow-y-auto leading-relaxed">
                  {comparisonRender.subject && (
                    <div className="font-bold text-indigo-950 border-b border-indigo-200 pb-2 mb-2">
                      Objet : {comparisonRender.subject}
                    </div>
                  )}
                  {renderStyledText(comparisonRender.body)}
                </div>
              </div>
            </div>
          ) : selectedTemplate?.channel === 'email' ? (
            /* SIMULATION EMAIL CLIENT */
            <div className="bg-white rounded-2xl border border-gray-300 shadow-sm overflow-hidden text-xs">
              <div className="bg-gray-100/90 px-4 py-3 border-b border-gray-200 space-y-1.5 font-sans">
                <div className="flex items-center justify-between text-[11px] text-gray-600">
                  <span>
                    <strong>De :</strong> {testData.admin_name} &lt;{testData.admin_email}&gt;
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">Aujourd'hui, {new Date().toLocaleTimeString()}</span>
                </div>
                <div className="text-[11px] text-gray-600">
                  <strong>À :</strong> contact@{testData.body_name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'organisme'}.org
                </div>
                <div className="text-xs font-bold text-gray-900 pt-1 border-t border-gray-200">
                  <strong>Objet :</strong> {renderedSubject || '(Sans objet)'}
                </div>
              </div>

              <div className="p-5 font-sans text-gray-800 whitespace-pre-wrap leading-relaxed max-h-[420px] overflow-y-auto text-xs bg-white">
                {renderStyledText(renderedBody)}
              </div>
            </div>
          ) : selectedTemplate?.channel === 'whatsapp' ? (
            /* SIMULATION WHATSAPP BUBBLE */
            <div className="bg-[#efeae2] p-4 sm:p-6 rounded-2xl border border-emerald-200/80 shadow-inner flex flex-col items-center">
              <div className="w-full max-w-lg bg-white rounded-2xl p-4 shadow-sm border border-gray-200 space-y-2 relative">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2 text-[11px] text-emerald-800 font-bold">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Business • Audit Conformité</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-normal">Chiffré de bout en bout</span>
                </div>

                <div className="whitespace-pre-wrap font-sans text-xs text-gray-900 leading-relaxed max-h-80 overflow-y-auto">
                  {renderStyledText(renderedBody)}
                </div>

                <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400 pt-1">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <CheckCircle2 className="w-3 h-3 text-blue-500" />
                </div>
              </div>
            </div>
          ) : selectedTemplate?.channel === 'form' ? (
            /* SIMULATION FORMULAIRE WEB */
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-purple-600" />
                  Portail web de vérification de certificat
                </span>
                <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-bold">
                  Formulaire public
                </span>
              </div>

              <div className="space-y-2 max-w-xl">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-gray-500">Nom du demandeur</span>
                    <input
                      disabled
                      value={testData.admin_name}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-gray-500">Email de contact</span>
                    <input
                      disabled
                      value={testData.admin_email}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600"
                    />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-gray-500">Message transmis</span>
                  <div className="p-3 bg-white border border-gray-200 rounded-xl whitespace-pre-wrap font-sans text-gray-800 text-xs max-h-60 overflow-y-auto leading-relaxed shadow-2xs">
                    {renderStyledText(renderedBody)}
                  </div>
                </div>
              </div>
            </div>
          ) : selectedTemplate?.channel === 'api' ? (
            /* SIMULATION API TERMINAL JSON */
            <div className="bg-gray-950 text-gray-100 rounded-2xl p-4 font-mono text-xs shadow-xl border border-gray-800 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2 text-[11px]">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>POST /api/v1/verifications/dispatch</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormatJson(!formatJson)}
                    className="text-[10px] px-2 py-0.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
                  >
                    {formatJson ? 'Compact' : 'Indenter'}
                  </button>
                  <span className="text-[10px] text-gray-500">HTTP/2 200 OK</span>
                </div>
              </div>

              <pre className="p-2 bg-black/60 rounded-xl overflow-x-auto text-[11px] text-emerald-300 leading-relaxed max-h-80 overflow-y-auto">
                {JSON.stringify(
                  {
                    template_id: selectedTemplate.id,
                    channel: 'api',
                    language: selectedTemplate.language,
                    recipient: {
                      organization: testData.body_name,
                      producer: testData.producer_name,
                      certificate: testData.certificate_number
                    },
                    payload_compiled: {
                      subject: renderedSubject,
                      body: renderedBody
                    },
                    metadata: {
                      platform: testData.platform_name,
                      auditor: testData.admin_name,
                      executed_at: new Date().toISOString()
                    }
                  },
                  null,
                  formatJson ? 2 : 0
                )}
              </pre>
            </div>
          ) : (
            /* SIMULATION COURRIER / AUTRES */
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 font-serif text-xs text-gray-900 max-h-[420px] overflow-y-auto">
              <div className="flex justify-between border-b border-gray-100 pb-3 font-sans text-[11px] text-gray-500">
                <div>
                  <p className="font-bold text-gray-900">{testData.platform_name}</p>
                  <p>Département Audit & Conformité</p>
                  <p>{testData.admin_email}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{testData.body_name}</p>
                  <p>Service Enregistrement</p>
                  <p>{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {renderedSubject && (
                <div className="font-sans font-bold text-gray-900 text-xs">
                  Objet : {renderedSubject}
                </div>
              )}

              <div className="whitespace-pre-wrap leading-relaxed font-sans text-xs">
                {renderStyledText(renderedBody)}
              </div>
            </div>
          )}
        </div>

        {/* STATISTIQUES DU RENDU */}
        {selectedTemplate && (
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] text-gray-600">
            <div>
              <span className="text-[10px] text-gray-400 block uppercase">Caractères corps</span>
              <strong className="text-gray-900 text-xs">{renderedBody.length}</strong>
            </div>

            {selectedTemplate.channel === 'email' && (
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">Caractères objet</span>
                <strong className="text-gray-900 text-xs">{renderedSubject ? renderedSubject.length : 0}</strong>
              </div>
            )}

            <div>
              <span className="text-[10px] text-gray-400 block uppercase">Variables template</span>
              <strong className="text-gray-900 text-xs">{detectedVars.length}</strong>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 block uppercase">Non résolues</span>
              <strong className={`text-xs ${unreplacedVars.length > 0 ? 'text-red-600 font-bold' : 'text-emerald-600'}`}>
                {unreplacedVars.length}
              </strong>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 block uppercase">Temps calcul</span>
              <strong className="text-gray-900 text-xs flex items-center gap-0.5">
                <Zap className="w-3 h-3 text-amber-500" />
                {renderDurationMs} ms
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4 — ACTIONS RAPIDES DU BAS */}
      <div className="border-t border-gray-100 pt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={!selectedTemplate}
            onClick={handleCopyRendered}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-xs font-bold rounded-xl transition-colors shadow-2xs"
            title="Copier le sujet et le corps dans le presse-papier"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copier le rendu</span>
          </button>

          {selectedTemplate?.channel === 'email' && (
            <button
              type="button"
              onClick={handleOpenMailClient}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-colors"
              title="Ouvrir un brouillon prérempli dans votre logiciel de messagerie"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Ouvrir client email</span>
            </button>
          )}

          {selectedTemplate?.channel === 'whatsapp' && (
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-colors"
              title="Ouvrir WhatsApp avec le message prérempli"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ouvrir WhatsApp</span>
            </button>
          )}

          <button
            type="button"
            disabled={!selectedTemplate}
            onClick={handleDownloadTxt}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-xs font-bold rounded-xl transition-colors shadow-2xs"
            title="Télécharger la simulation sous forme de fichier texte .txt"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Télécharger TXT</span>
          </button>
        </div>
      </div>
    </div>
  );
}
