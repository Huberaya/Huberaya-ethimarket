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
  MapPin,
  HelpCircle
} from 'lucide-react';
import type { CertificationBody, CertificationMessageTemplate } from '../../lib/supabase';
import { getTemplates } from '../../lib/certificationTemplatesService';
import { resolveTemplateVariables } from '../../lib/certificationVerificationService';
import { printPostalLetter } from '../../lib/postalLetterGenerator';

export interface UniversalContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  body: CertificationBody | null;
  certificateNumber?: string;
  producerName?: string;
}

type ContactTab = 'email' | 'whatsapp' | 'phone' | 'portal' | 'postal';

export default function UniversalContactModal({
  isOpen,
  onClose,
  body,
  certificateNumber = 'BIO-2026-X981',
  producerName = 'Coopérative Bio Partenaire'
}: UniversalContactModalProps) {
  const [activeTab, setActiveTab] = useState<ContactTab>('email');
  const [templates, setTemplates] = useState<CertificationMessageTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [whatsappText, setWhatsappText] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const applyTemplate = useCallback((tpl: CertificationMessageTemplate) => {
    const vars = {
      producer_name: producerName,
      certificate_number: certificateNumber,
      certification_type: body?.certification_types?.join(', ') || 'Bio / Équitable',
      certification_body_name: body?.name || '',
      issued_at: new Date().toISOString().slice(0, 10),
      expires_at: '2027-12-31',
      platform_name: 'EthiMarket',
      admin_name: 'Service Conformité EthiMarket',
      admin_email: 'conformite@ethimarket.com'
    };

    setEmailSubject(resolveTemplateVariables(tpl.subject || '', vars));
    setEmailBody(resolveTemplateVariables(tpl.body || '', vars));
  }, [body?.certification_types, body?.name, certificateNumber, producerName]);

  useEffect(() => {
    if (!isOpen || !body) return;

    // Déterminer le premier canal disponible
    if (body.email_contact) {
      setActiveTab('email');
    } else if (body.whatsapp) {
      setActiveTab('whatsapp');
    } else if (body.verification_url || body.contact_form_url) {
      setActiveTab('portal');
    } else if (body.phone) {
      setActiveTab('phone');
    } else {
      setActiveTab('postal');
    }

    // Charger les templates
    const loadTemplates = async () => {
      const { data } = await getTemplates();
      if (data && data.length > 0) {
        setTemplates(data);
        const defaultTpl = data.find(t => t.is_default && t.channel === 'email') || data[0];
        if (defaultTpl) {
          setSelectedTemplateId(defaultTpl.id);
          applyTemplate(defaultTpl);
        }
      } else {
        // Template par défaut
        const fallbackSubject = `Vérification d authenticité du certificat N° ${certificateNumber} — ${producerName}`;
        const fallbackBody = `Bonjour l équipe ${body.name},\n\nDans le cadre du contrôle de conformité sur notre plateforme EthiMarket, nous sollicitons votre confirmation quant à la validité du certificat N° ${certificateNumber} délivré à ${producerName}.\n\nMerci d avance pour votre collaboration.\n\nCordialement,\nService Conformité EthiMarket`;
        setEmailSubject(fallbackSubject);
        setEmailBody(fallbackBody);
      }
    };

    // Texte WhatsApp par défaut
    const defaultWa = `Bonjour ${body.name}, nous souhaitons vérifier l authenticité du certificat N° ${certificateNumber} émis pour ${producerName} sur la plateforme EthiMarket. Merci de nous confirmer sa validité.`;
    setWhatsappText(defaultWa);

    loadTemplates();
  }, [isOpen, body, certificateNumber, producerName, applyTemplate]);

  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id);
    const tpl = templates.find(t => t.id === id);
    if (tpl) {
      applyTemplate(tpl);
    }
  };

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2500);
  };

  if (!isOpen || !body) return null;

  const hasEmail = Boolean(body.email_contact && body.email_contact.trim());
  const hasWhatsapp = Boolean(body.whatsapp && body.whatsapp.trim());
  const hasPhone = Boolean(body.phone && body.phone.trim());
  const hasPortal = Boolean(body.verification_url || body.contact_form_url);
  const hasPostal = Boolean(body.address || body.city || body.country);

  const cleanPhone = (body.whatsapp || '').replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappText)}`;
  const mailtoUrl = `mailto:${body.email_contact || ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  const portalUrl = body.verification_url || body.contact_form_url || body.website || '#';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* En-tête */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 p-6 text-white flex justify-between items-start">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Contacter {body.name}
                </h3>
                {body.acronym && (
                  <span className="px-2 py-0.5 rounded-md bg-white/20 text-xs font-semibold text-white">
                    {body.acronym}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-emerald-100 text-xs mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{body.city ? `${body.city}, ` : ''}{body.country}</span>
                <span>•</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Fiabilité : {body.reliability_score || 95}%</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barre des Onglets Canaux */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 pt-3 gap-2 overflow-x-auto">
          {hasEmail && (
            <button
              onClick={() => setActiveTab('email')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 ${
                activeTab === 'email'
                  ? 'bg-white text-emerald-700 border-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <Mail className="w-4 h-4 text-blue-600" />
              <span>Email Direct</span>
            </button>
          )}

          {hasWhatsapp && (
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 ${
                activeTab === 'whatsapp'
                  ? 'bg-white text-emerald-700 border-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp</span>
            </button>
          )}

          {hasPortal && (
            <button
              onClick={() => setActiveTab('portal')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 ${
                activeTab === 'portal'
                  ? 'bg-white text-emerald-700 border-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <Globe className="w-4 h-4 text-teal-600" />
              <span>Portail Web</span>
            </button>
          )}

          {hasPhone && (
            <button
              onClick={() => setActiveTab('phone')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 ${
                activeTab === 'phone'
                  ? 'bg-white text-emerald-700 border-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <Phone className="w-4 h-4 text-amber-600" />
              <span>Téléphone</span>
            </button>
          )}

          {hasPostal && (
            <button
              onClick={() => setActiveTab('postal')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 ${
                activeTab === 'postal'
                  ? 'bg-white text-emerald-700 border-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Courrier Postal</span>
            </button>
          )}
        </div>

        {/* Contenu du Canal Sélectionné */}
        <div className="p-6">
          {/* 1. CANAL EMAIL */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Destinataire vérifié : <span className="text-slate-900 font-mono text-sm">{body.email_contact}</span>
                </div>
                {templates.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className="text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-emerald-500"
                    >
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>
                          Template : {t.title || t.name} ({t.language.toUpperCase()})
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
                  className="w-full text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Corps de la demande officielle
                </label>
                <textarea
                  rows={7}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleCopy(emailBody, 'emailBody')}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  {copiedField === 'emailBody' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'emailBody' ? 'Copié !' : 'Copier le message'}</span>
                </button>

                <a
                  href={mailtoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
                >
                  <Mail className="w-4 h-4" />
                  <span>Ouvrir dans mon client Email (mailto:)</span>
                </a>
              </div>
            </div>
          )}

          {/* 2. CANAL WHATSAPP */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                    Numéro WhatsApp Pro Référencé
                  </div>
                  <div className="text-base font-bold text-emerald-950 font-mono mt-0.5">
                    {body.whatsapp}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(body.whatsapp || '', 'waNumber')}
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
                  rows={5}
                  value={whatsappText}
                  onChange={(e) => setWhatsappText(e.target.value)}
                  className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Ouvrir WhatsApp Web / Mobile (wa.me)</span>
                </a>
              </div>
            </div>
          )}

          {/* 3. CANAL PORTAIL WEB */}
          {activeTab === 'portal' && (
            <div className="space-y-5">
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl">
                <h4 className="text-sm font-bold text-teal-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-teal-700" />
                  Portail Officiel d Audit ou Annuaire Public
                </h4>
                <p className="text-xs text-teal-800 mt-1">
                  Vous pouvez vérifier directement les registres d authenticité de cet organisme sur son infrastructure sécurisée.
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

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="font-semibold text-slate-800">Numéro de certificat à rechercher :</div>
                <div className="font-mono text-sm text-emerald-700 font-bold bg-white px-2.5 py-1 rounded border border-slate-200 inline-block">
                  {certificateNumber}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <a
                  href={portalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Accéder au Portail Officiel (Nouvel Onglet)</span>
                </a>
              </div>
            </div>
          )}

          {/* 4. CANAL TÉLÉPHONE */}
          {activeTab === 'phone' && (
            <div className="space-y-4">
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Ligne Téléphonique Internationale
                </div>
                <div className="text-2xl font-black text-slate-900 tracking-tight font-mono my-2">
                  {body.phone || 'Non renseigné'}
                </div>
                {body.contact_hours && (
                  <div className="text-xs text-slate-600">
                    Horaires de permanence : <strong>{body.contact_hours}</strong>
                  </div>
                )}
                {body.timezone && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    Fuseau horaire : {body.timezone}
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleCopy(body.phone || '', 'phoneNumber')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  {copiedField === 'phoneNumber' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>Copier le numéro</span>
                </button>
                {body.phone && (
                  <a
                    href={`tel:${body.phone.replace(/[^0-9+]/g, '')}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Composer l appel (tel:)</span>
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
                  Génération de Lettre d Audit Postal Officielle
                </h4>
                <p className="text-xs text-indigo-900 mt-1">
                  Créez une lettre type normée A4 comprenant les mentions légales, le numéro de certificat, le nom du producteur et les coordonnées du siège de l organisme.
                </p>
                <div className="mt-3 bg-white p-3 rounded-lg border border-indigo-100 text-xs text-slate-700 space-y-0.5 font-mono">
                  <div><strong>Destinataire :</strong> {body.name}</div>
                  <div><strong>Adresse :</strong> {body.address || 'Siège Social'}</div>
                  <div><strong>Ville / Pays :</strong> {body.city || ''} {body.postal_code || ''}, {body.country}</div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => printPostalLetter({
                    certificationBody: body,
                    certificateNumber,
                    producerName
                  })}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer / Télécharger en PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pied de modale */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Tous les canaux sont testés et vérifiés par l équipe de modération.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}
