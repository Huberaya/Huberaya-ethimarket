import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Mail,
  MessageSquare,
  Phone,
  Globe,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Printer,
  Sparkles,
  ShieldCheck,
  Building2,
  HelpCircle,
  User,
  Package
} from 'lucide-react';
import type { CertificationBody, CertificationMessageTemplate } from '../../lib/supabase';
import { getTemplates } from '../../lib/certificationTemplatesService';
import { resolveTemplateVariables } from '../../lib/certificationVerificationService';
import { printPostalLetter } from '../../lib/postalLetterGenerator';
import { findBestMatchingBody, FindBestMatchResult } from '../../lib/certificationMatchingService';
import MatchingQualityBadge from './MatchingQualityBadge';
import BodyAlternativeSelector from './BodyAlternativeSelector';

export interface UniversalContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  body: CertificationBody | null;
  certificateNumber?: string;
  producerName?: string;
  producerCountry?: string;
  producerProduct?: string;
  declaredStandard?: string;
  onBodySelected?: (body: CertificationBody) => void;
}

type ContactTab = 'email' | 'whatsapp' | 'phone' | 'portal' | 'postal';

export default function UniversalContactModal({
  isOpen,
  onClose,
  body: initialBody,
  certificateNumber = 'BIO-2026-X981',
  producerName = 'Coopérative Bio Partenaire',
  producerCountry = 'Brésil',
  producerProduct = 'Piment Bio d\'Amazonie',
  declaredStandard = 'Rainforest Alliance',
  onBodySelected
}: UniversalContactModalProps) {
  const [currentBody, setCurrentBody] = useState<CertificationBody | null>(initialBody);
  const [matchingResult, setMatchingResult] = useState<FindBestMatchResult | null>(null);
  const [activeTab, setActiveTab] = useState<ContactTab>('email');
  const [templates, setTemplates] = useState<CertificationMessageTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [whatsappText, setWhatsappText] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);

  // Run matching engine when modal opens or standard/country changes
  useEffect(() => {
    if (!isOpen) return;

    const runMatching = async () => {
      setIsMatchingLoading(true);
      try {
        const result = await findBestMatchingBody({
          standardName: declaredStandard,
          producerCountry: producerCountry,
          rawCertificationInput: declaredStandard
        });
        setMatchingResult(result);

        // If no body was directly passed in, or if we want to auto-assign the best match
        if (initialBody) {
          setCurrentBody(initialBody);
        } else if (result.primaryMatch) {
          setCurrentBody(result.primaryMatch);
          if (onBodySelected) onBodySelected(result.primaryMatch);
        }
      } catch (err) {
        console.error('Error running certification matching:', err);
      } finally {
        setIsMatchingLoading(false);
      }
    };

    runMatching();
  }, [isOpen, declaredStandard, producerCountry, initialBody, onBodySelected]);

  // Synchronize when initialBody prop changes
  useEffect(() => {
    if (initialBody) {
      setCurrentBody(initialBody);
    }
  }, [initialBody]);

  const applyTemplate = useCallback((tpl: CertificationMessageTemplate, targetBody: CertificationBody | null) => {
    const activeBody = targetBody || currentBody;
    const vars = {
      producer_name: producerName,
      certificate_number: certificateNumber,
      certification_type: declaredStandard || activeBody?.certification_types?.join(', ') || 'Bio / Équitable',
      certification_body_name: activeBody?.name || 'Organisme Certificateur',
      producer_country: producerCountry,
      product_name: producerProduct,
      issued_at: new Date().toISOString().slice(0, 10),
      expires_at: '2027-12-31',
      platform_name: 'EthiMarket',
      admin_name: 'Service Conformité EthiMarket',
      admin_email: 'conformite@ethimarket.com'
    };

    setEmailSubject(resolveTemplateVariables(tpl.subject || '', vars));
    setEmailBody(resolveTemplateVariables(tpl.body || '', vars));
  }, [currentBody, declaredStandard, producerCountry, producerProduct, certificateNumber, producerName]);

  // Setup channels and templates whenever currentBody changes
  useEffect(() => {
    if (!isOpen || !currentBody) return;

    // Set best default channel
    if (currentBody.whatsapp && (matchingResult?.primaryEvaluation?.recommendedChannel === 'whatsapp')) {
      setActiveTab('whatsapp');
    } else if (currentBody.email_contact) {
      setActiveTab('email');
    } else if (currentBody.whatsapp) {
      setActiveTab('whatsapp');
    } else if (currentBody.verification_url || currentBody.contact_form_url) {
      setActiveTab('portal');
    } else if (currentBody.phone) {
      setActiveTab('phone');
    } else {
      setActiveTab('postal');
    }

    // Load templates and pick best matching language
    const loadTemplates = async () => {
      const { data } = await getTemplates();
      if (data && data.length > 0) {
        setTemplates(data);
        
        // Find best template matching the target language of the certification body
        const targetLang = (currentBody.languages && currentBody.languages[0]) ? currentBody.languages[0].toLowerCase() : 'fr';
        const bestTpl = 
          data.find(t => t.language === targetLang && t.channel === 'email') ||
          data.find(t => t.is_default && t.channel === 'email') ||
          data[0];

        if (bestTpl) {
          setSelectedTemplateId(bestTpl.id);
          applyTemplate(bestTpl, currentBody);
        }
      } else {
        const fallbackSubject = `Demande de confirmation d'authenticité - Certificat N° ${certificateNumber} — ${producerName}`;
        const fallbackBody = `Bonjour l'équipe ${currentBody.name},\n\nDans le cadre de l'audit de conformité sur la plateforme EthiMarket, nous sollicitons votre confirmation quant à la validité du certificat N° ${certificateNumber} (${declaredStandard}) délivré pour le producteur ${producerName} (${producerCountry}).\n\nMerci d'avance pour votre coopération.\n\nCordialement,\nService Conformité EthiMarket`;
        setEmailSubject(fallbackSubject);
        setEmailBody(fallbackBody);
      }
    };

    // Prepare WhatsApp message
    const defaultWa = `Bonjour ${currentBody.name}, nous sollicitons la vérification du certificat N° ${certificateNumber} (${declaredStandard}) émis pour ${producerName} (${producerCountry}) sur EthiMarket. Merci de nous confirmer sa validité.`;
    setWhatsappText(defaultWa);

    loadTemplates();
  }, [isOpen, currentBody, certificateNumber, producerName, declaredStandard, producerCountry, matchingResult, applyTemplate]);

  const handleBodySwitch = (newBody: CertificationBody) => {
    setCurrentBody(newBody);
    if (onBodySelected) {
      onBodySelected(newBody);
    }
  };

  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id);
    const tpl = templates.find(t => t.id === id);
    if (tpl) {
      applyTemplate(tpl, currentBody);
    }
  };

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2500);
  };

  if (!isOpen) return null;

  const hasEmail = Boolean(currentBody?.email_contact && currentBody.email_contact.trim());
  const hasWhatsapp = Boolean(currentBody?.whatsapp && currentBody.whatsapp.trim());
  const hasPhone = Boolean(currentBody?.phone && currentBody.phone.trim());
  const hasPortal = Boolean(currentBody?.verification_url || currentBody?.contact_form_url);
  const hasPostal = Boolean(currentBody?.address || currentBody?.city || currentBody?.country);

  const cleanPhone = (currentBody?.whatsapp || '').replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappText)}`;
  const mailtoUrl = `mailto:${currentBody?.email_contact || ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  const portalUrl = currentBody?.verification_url || currentBody?.contact_form_url || currentBody?.website || '#';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* En-tête avec bannière de matching intelligent */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 p-5 text-white">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Redirection & Vérification Intelligente
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-semibold border border-emerald-400/30">
                    1-Click Verified
                  </span>
                </div>
                <p className="text-emerald-100 text-xs mt-0.5">
                  Mise en relation automatique avec l'organisme certificateur référent
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Fiche récapitulative Producteur & Standard Déclaré */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-black/20 p-3 rounded-xl border border-white/10">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-300 shrink-0" />
              <div className="min-w-0">
                <span className="text-emerald-200/80 block text-[10px] uppercase">Producteur & Pays</span>
                <span className="font-semibold text-white truncate block">{producerName} ({producerCountry})</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-300 shrink-0" />
              <div className="min-w-0">
                <span className="text-emerald-200/80 block text-[10px] uppercase">Produit & N° Certificat</span>
                <span className="font-semibold text-white truncate block">{producerProduct} • {certificateNumber}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
              <div className="min-w-0">
                <span className="text-emerald-200/80 block text-[10px] uppercase">Standard Déclaré</span>
                <span className="font-semibold text-amber-200 truncate block">{declaredStandard}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Sélection Organisme & Alternatives */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-brand-600" />
              Organisme Certificateur Recommandé
            </span>
            {isMatchingLoading ? (
              <span className="text-xs text-gray-400 font-medium animate-pulse">Recherche du meilleur organisme...</span>
            ) : matchingResult ? (
              <MatchingQualityBadge
                quality={matchingResult.matchQuality}
                score={matchingResult.matchScore}
                reasons={matchingResult.matchReasons}
                size="sm"
              />
            ) : null}
          </div>

          <BodyAlternativeSelector
            currentBody={currentBody}
            alternatives={matchingResult?.alternativeMatches || []}
            onSelectBody={handleBodySwitch}
            fuzzyCorrectionSuggestion={matchingResult?.fuzzyCorrectionSuggestion}
            onApplyCorrection={(corrected) => {
              findBestMatchingBody({
                standardName: corrected,
                producerCountry: producerCountry
              }).then(res => {
                setMatchingResult(res);
                if (res.primaryMatch) setCurrentBody(res.primaryMatch);
              });
            }}
          />
        </div>

        {/* Barre des Onglets Canaux */}
        {currentBody ? (
          <>
            <div className="flex border-b border-slate-200 bg-slate-50/80 px-5 pt-3 gap-2 overflow-x-auto">
              {hasEmail && (
                <button
                  type="button"
                  onClick={() => setActiveTab('email')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                    activeTab === 'email'
                      ? 'bg-white text-emerald-700 border-emerald-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 border-transparent'
                  }`}
                >
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Email Direct</span>
                </button>
              )}

              {hasWhatsapp && (
                <button
                  type="button"
                  onClick={() => setActiveTab('whatsapp')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                    activeTab === 'whatsapp'
                      ? 'bg-white text-emerald-700 border-emerald-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 border-transparent'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp Pro</span>
                </button>
              )}

              {hasPortal && (
                <button
                  type="button"
                  onClick={() => setActiveTab('portal')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                    activeTab === 'portal'
                      ? 'bg-white text-emerald-700 border-emerald-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 border-transparent'
                  }`}
                >
                  <Globe className="w-4 h-4 text-teal-600" />
                  <span>Portail d'Audit Web</span>
                </button>
              )}

              {hasPhone && (
                <button
                  type="button"
                  onClick={() => setActiveTab('phone')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                    activeTab === 'phone'
                      ? 'bg-white text-emerald-700 border-emerald-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 border-transparent'
                  }`}
                >
                  <Phone className="w-4 h-4 text-amber-600" />
                  <span>Téléphone</span>
                </button>
              )}

              {hasPostal && (
                <button
                  type="button"
                  onClick={() => setActiveTab('postal')}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                    activeTab === 'postal'
                      ? 'bg-white text-emerald-700 border-emerald-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 border-transparent'
                  }`}
                >
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Courrier Postal A4</span>
                </button>
              )}
            </div>

            {/* Contenu du Canal Sélectionné */}
            <div className="p-5">
              {/* 1. CANAL EMAIL */}
              {activeTab === 'email' && (
                <div className="space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Destinataire vérifié : <span className="text-slate-900 font-mono text-xs sm:text-sm font-bold">{currentBody.email_contact}</span>
                    </div>
                    {templates.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <select
                          value={selectedTemplateId}
                          onChange={(e) => handleTemplateChange(e.target.value)}
                          className="text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-emerald-500"
                        >
                          {templates.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.title || t.name} ({t.language.toUpperCase()})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Objet du message
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full text-xs sm:text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Corps de la demande officielle pré-remplie
                    </label>
                    <textarea
                      rows={6}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-xs leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(emailBody, 'emailBody')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      {copiedField === 'emailBody' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'emailBody' ? 'Copié !' : 'Copier le message'}</span>
                    </button>

                    <a
                      href={mailtoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Envoyer via client Email (mailto:)</span>
                    </a>
                  </div>
                </div>
              )}

              {/* 2. CANAL WHATSAPP */}
              {activeTab === 'whatsapp' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                        Numéro WhatsApp Pro Référencé ({currentBody.country})
                      </div>
                      <div className="text-base font-bold text-emerald-950 font-mono mt-0.5">
                        {currentBody.whatsapp}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentBody.whatsapp || '', 'waNumber')}
                      className="p-2 rounded-lg bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                    >
                      {copiedField === 'waNumber' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Message WhatsApp préformaté
                    </label>
                    <textarea
                      rows={4}
                      value={whatsappText}
                      onChange={(e) => setWhatsappText(e.target.value)}
                      className="w-full text-xs sm:text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Ouvrir WhatsApp Web / Mobile (wa.me)</span>
                    </a>
                  </div>
                </div>
              )}

              {/* 3. CANAL PORTAIL WEB */}
              {activeTab === 'portal' && (
                <div className="space-y-4">
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
                    <h4 className="text-sm font-bold text-teal-900 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-teal-700" />
                      Portail Officiel d'Audit ou Annuaire Public
                    </h4>
                    <p className="text-xs text-teal-800 mt-1">
                      Vérification directe des registres d'authenticité de cet organisme sur son infrastructure sécurisée.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={portalUrl}
                        className="w-full text-xs font-mono bg-white border border-teal-200 rounded-lg px-3 py-2 text-teal-900"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(portalUrl, 'portalUrl')}
                        className="p-2 bg-white border border-teal-200 rounded-lg text-teal-700 hover:bg-teal-100"
                      >
                        {copiedField === 'portalUrl' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">Numéro de certificat à rechercher :</div>
                      <div className="font-mono text-sm text-emerald-700 font-bold mt-0.5">
                        {certificateNumber}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(certificateNumber, 'certNum')}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center gap-1 text-xs"
                    >
                      {copiedField === 'certNum' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copier N°</span>
                    </button>
                  </div>

                  <div className="flex justify-end pt-1">
                    <a
                      href={portalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Accéder au Registre Officiel (Nouvel Onglet)</span>
                    </a>
                  </div>
                </div>
              )}

              {/* 4. CANAL TÉLÉPHONE */}
              {activeTab === 'phone' && (
                <div className="space-y-4">
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Ligne Téléphonique Directe ({currentBody.country})
                    </div>
                    <div className="text-xl font-black text-slate-900 tracking-tight font-mono my-1.5">
                      {currentBody.phone || 'Non renseigné'}
                    </div>
                    {currentBody.contact_hours && (
                      <div className="text-xs text-slate-600">
                        Horaires : <strong>{currentBody.contact_hours}</strong> (Fuseau : {currentBody.timezone || 'UTC'})
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(currentBody.phone || '', 'phoneNumber')}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      {copiedField === 'phoneNumber' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copier le numéro</span>
                    </button>
                    {currentBody.phone && (
                      <a
                        href={`tel:${currentBody.phone.replace(/[^0-9+]/g, '')}`}
                        className="inline-flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Composer l'appel</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* 5. CANAL COURRIER POSTAL */}
              {activeTab === 'postal' && (
                <div className="space-y-4">
                  <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-700" />
                      Génération de Lettre d'Audit Postal A4
                    </h4>
                    <p className="text-xs text-indigo-900 mt-1">
                      Crée une lettre officielle avec mentions légales pour envoi postal au siège ou bureau régional.
                    </p>
                    <div className="mt-3 bg-white p-3 rounded-lg border border-indigo-100 text-xs text-slate-700 space-y-0.5 font-mono">
                      <div><strong>Destinataire :</strong> {currentBody.name}</div>
                      <div><strong>Adresse :</strong> {currentBody.address || 'Siège / Bureau Régional'}</div>
                      <div><strong>Localisation :</strong> {currentBody.city || ''} {currentBody.postal_code || ''}, {currentBody.country}</div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => printPostalLetter({
                        certificationBody: currentBody,
                        certificateNumber,
                        producerName
                      })}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimer / Télécharger le Courrier PDF</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            Veuillez sélectionner un organisme certificateur pour afficher les canaux de contact.
          </div>
        )}

        {/* Pied de modale */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Tous les échanges et canaux sont audités et archivés automatiquement.</span>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}
