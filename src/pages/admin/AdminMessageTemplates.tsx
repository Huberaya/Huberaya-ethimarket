import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import ChannelBadge from '../../components/admin/ChannelBadge';
import {
  getMessageTemplates,
  createMessageTemplate,
  updateMessageTemplate,
  deleteMessageTemplate,
  renderTemplate
} from '../../lib/certificationVerificationService';
import type {
  CertificationMessageTemplate,
  VerificationChannel
} from '../../lib/supabase';

const AVAILABLE_VARIABLES = [
  { key: '{producer_name}', label: 'Nom du producteur', example: 'Coopérative Cacao Bio Sambirano' },
  { key: '{certificate_number}', label: 'N° Certificat', example: 'ECO-2024-8891' },
  { key: '{standard_name}', label: 'Standard / Label', example: 'Agriculture Biologique (CE 834/2007)' },
  { key: '{body_name}', label: 'Organisme certificateur', example: 'Ecocert Greenlife' },
  { key: '{verification_url}', label: 'Lien de validation', example: 'https://cert.agritrace.io/verify/8891' },
  { key: '{expiry_date}', label: "Date d'expiration", example: '31/12/2026' },
  { key: '{issue_date}', label: "Date d'émission", example: '15/01/2024' },
  { key: '{platform_name}', label: 'Nom plateforme', example: 'AgriTrace B2B' }
];

export default function AdminMessageTemplates() {
  const [templates, setTemplates] = useState<CertificationMessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filtres
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');

  // Preview & Editor Modals
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] = useState<CertificationMessageTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<CertificationMessageTemplate | null>(null);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Formulaire d'édition / création
  const [formData, setFormData] = useState<{
    name: string;
    channel: VerificationChannel;
    language: string;
    subject: string;
    body: string;
    variables: string[];
    is_default: boolean;
  }>({
    name: '',
    channel: 'email',
    language: 'fr',
    subject: '',
    body: '',
    variables: ['{producer_name}', '{certificate_number}'],
    is_default: false
  });

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const channelParam = filterChannel !== 'all' ? (filterChannel as VerificationChannel) : undefined;
      const langParam = filterLanguage !== 'all' ? filterLanguage : undefined;
      const res = await getMessageTemplates(channelParam, langParam);
      if (res.error) {
        setError(res.error);
      } else {
        setTemplates(res.data || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur chargement';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [filterChannel, filterLanguage]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleOpenCreateModal = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      channel: 'email',
      language: 'fr',
      subject: 'Demande de vérification de conformité : {certificate_number} - {producer_name}',
      body: `Bonjour l'équipe {body_name},\n\nDans le cadre de l'audit de référencement sur notre plateforme {platform_name}, nous vous sollicitons afin de vérifier l'authenticité et la validité du certificat ci-dessous :\n\n- Producteur : {producer_name}\n- Référence certificat : {certificate_number}\n- Norme / Standard : {standard_name}\n- Date annoncée d'expiration : {expiry_date}\n\nPourriez-vous nous confirmer son statut actif dans vos registres ?\nLien d'attestation rapide : {verification_url}\n\nBien cordialement,\nL'équipe Conformité & Qualité`,
      variables: ['{producer_name}', '{certificate_number}', '{standard_name}', '{body_name}', '{verification_url}', '{expiry_date}'],
      is_default: false
    });
    setIsEditorModalOpen(true);
  };

  const handleOpenEditModal = (tpl: CertificationMessageTemplate) => {
    setEditingTemplate(tpl);
    setFormData({
      name: tpl.name,
      channel: tpl.channel,
      language: tpl.language || 'fr',
      subject: tpl.subject || '',
      body: tpl.body,
      variables: tpl.variables || [],
      is_default: tpl.is_default ?? false
    });
    setIsEditorModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.body.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingTemplate) {
        // Update
        const res = await updateMessageTemplate(editingTemplate.id, {
          name: formData.name.trim(),
          channel: formData.channel,
          language: formData.language,
          subject: formData.subject.trim() || null,
          body: formData.body,
          variables: formData.variables,
          is_default: formData.is_default
        });
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMessage('Modèle de message mis à jour');
          setIsEditorModalOpen(false);
          loadTemplates();
        }
      } else {
        // Create
        const res = await createMessageTemplate({
          name: formData.name.trim(),
          channel: formData.channel,
          language: formData.language,
          subject: formData.subject.trim() || null,
          body: formData.body,
          variables: formData.variables,
          is_default: formData.is_default
        });
        if (res.error) {
          setError(res.error);
        } else {
          setSuccessMessage('Nouveau modèle de message enregistré');
          setIsEditorModalOpen(false);
          loadTemplates();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur enregistrement';
      setError(msg);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleDeleteTemplate = async (templateId: string, name: string) => {
    if (!window.confirm(`Confirmez-vous la suppression du modèle "${name}" ?`)) return;
    try {
      const res = await deleteMessageTemplate(templateId);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMessage(`Modèle "${name}" supprimé`);
        if (selectedTemplateForPreview?.id === templateId) {
          setSelectedTemplateForPreview(null);
        }
        loadTemplates();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur suppression';
      setError(msg);
    } finally {
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleInsertVariable = (variableKey: string) => {
    setFormData(prev => {
      const updatedBody = prev.body + ' ' + variableKey;
      const updatedVars = prev.variables.includes(variableKey)
        ? prev.variables
        : [...prev.variables, variableKey];
      return {
        ...prev,
        body: updatedBody,
        variables: updatedVars
      };
    });
  };

  // Aperçu compilé
  const previewContext = {
    producer_name: 'Coopérative Cacao Bio Sambirano',
    certificate_number: 'ECO-2024-8891',
    standard_name: 'Agriculture Biologique (CE 834/2007)',
    body_name: 'Ecocert Greenlife France',
    verification_url: 'https://cert.agritrace.io/verify/8891-bio',
    expiry_date: '31/12/2026',
    issue_date: '15/01/2024',
    platform_name: 'AgriTrace B2B Marketplace'
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">Modèles de Messages</h1>
            <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200">
              {templates.length} modèles
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Gérez les trames de courriels, messages WhatsApp et requêtes formelles envoyées aux certificateurs
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau modèle</span>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-xs">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="font-bold">
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filtres par canal & langue */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-700">Canal :</span>
          <div className="flex items-center gap-1">
            {['all', 'email', 'whatsapp', 'form', 'api'].map(ch => (
              <button
                key={ch}
                type="button"
                onClick={() => setFilterChannel(ch)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  filterChannel === ch
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {ch === 'all' ? 'Tous' : ch.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-700">Langue :</span>
          <select
            value={filterLanguage}
            onChange={e => setFilterLanguage(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-700 focus:outline-none"
          >
            <option value="all">Toutes les langues</option>
            <option value="fr">Français (FR)</option>
            <option value="en">Anglais (EN)</option>
            <option value="es">Espagnol (ES)</option>
            <option value="pt">Portugais (PT)</option>
          </select>
        </div>
      </div>

      {/* Grille des Modèles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Liste des modèles (2 colonnes sur écran large) */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 space-y-3 animate-pulse">
              <div className="h-6 bg-gray-200 rounded-lg w-1/4 mx-auto" />
              <div className="h-20 bg-gray-100 rounded-xl" />
            </div>
          ) : templates.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 space-y-3">
              <FileText className="w-10 h-10 text-gray-300 mx-auto" />
              <h3 className="text-sm font-bold text-gray-800">Aucun modèle de message configuré</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Créez des modèles prédéfinis pour automatiser la rédaction des demandes de vérification.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl"
              >
                Créer le premier modèle
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map(tpl => {
                const isSelected = selectedTemplateForPreview?.id === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    className={`bg-white p-5 rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-brand-500 shadow-md ring-2 ring-brand-100'
                        : 'border-gray-100 hover:border-gray-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-gray-900">{tpl.name}</h3>
                          <ChannelBadge channel={tpl.channel} size="sm" />
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold uppercase rounded-md">
                            {tpl.language}
                          </span>
                          {tpl.is_default && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                              Par défaut
                            </span>
                          )}
                        </div>
                        {tpl.subject && (
                          <p className="text-xs text-gray-600 font-medium truncate">
                            <span className="text-gray-400">Objet :</span> {tpl.subject}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {tpl.body}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedTemplateForPreview(tpl)}
                          className={`p-2 rounded-xl transition-colors ${
                            isSelected
                              ? 'bg-brand-50 text-brand-700'
                              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                          title="Prévisualiser ce modèle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(tpl)}
                          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Variables chips */}
                    {tpl.variables && tpl.variables.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Variables :</span>
                        {tpl.variables.map(v => (
                          <span
                            key={v}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 font-mono text-[10px] rounded-md"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Colonne Aperçu Simulateur & Variables */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-1.5 font-bold text-sm text-gray-900">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Simulateur d'envoi dynamique</span>
              </div>
              {selectedTemplateForPreview && (
                <span className="text-[10px] text-gray-400">Rendu avec données test</span>
              )}
            </div>

            {selectedTemplateForPreview ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Canal sélectionné :</span>
                  <div className="mt-1">
                    <ChannelBadge channel={selectedTemplateForPreview.channel} size="sm" />
                  </div>
                </div>

                {selectedTemplateForPreview.subject && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Objet généré :</span>
                    <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900">
                      {renderTemplate(selectedTemplateForPreview.subject, previewContext)}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Corps du message compilé :</span>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl whitespace-pre-wrap font-sans text-gray-800 leading-relaxed text-[11px] max-h-96 overflow-y-auto">
                    {renderTemplate(selectedTemplateForPreview.body, previewContext)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 space-y-2">
                <Eye className="w-8 h-8 mx-auto text-gray-300" />
                <p className="text-xs">
                  Sélectionnez un modèle à gauche pour tester la substitution en temps réel des variables.
                </p>
              </div>
            )}
          </div>

          {/* Guide des variables disponibles */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3 text-xs">
            <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-blue-500" />
              <span>Variables dynamiques supportées</span>
            </h4>
            <p className="text-gray-500 text-[11px]">
              Insérez ces balises dans vos sujets et messages pour qu'elles soient automatiquement remplacées lors de l'envoi.
            </p>
            <div className="space-y-2 pt-1">
              {AVAILABLE_VARIABLES.map(v => (
                <div key={v.key} className="p-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="font-mono font-bold text-brand-700">{v.key}</span>
                    <p className="text-gray-500">{v.label}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 italic truncate max-w-[120px]">{v.example}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CRÉATION / ÉDITION DE TEMPLATE */}
      {isEditorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                {editingTemplate ? 'Modifier le modèle de message' : 'Créer un nouveau modèle de message'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditorModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-gray-700">Nom du modèle *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Demande initiale - Organismes Européens"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Canal cible *</label>
                  <select
                    value={formData.channel}
                    onChange={e => setFormData({ ...formData, channel: e.target.value as VerificationChannel })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500"
                  >
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="form">Formulaire / Portail</option>
                    <option value="api">API</option>
                    <option value="letter">Courrier / Document</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Langue de rédaction</label>
                  <select
                    value={formData.language}
                    onChange={e => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                  >
                    <option value="fr">Français (FR)</option>
                    <option value="en">Anglais (EN)</option>
                    <option value="es">Espagnol (ES)</option>
                    <option value="pt">Portugais (PT)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded-md border-gray-300"
                  />
                  <label htmlFor="is_default" className="font-bold text-gray-700">
                    Modèle par défaut pour ce canal
                  </label>
                </div>
              </div>

              {formData.channel === 'email' && (
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Objet de l'email</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Ex: Demande de vérification de conformité - {certificate_number}"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                  />
                </div>
              )}

              {/* Barre d'insertion rapide des variables */}
              <div className="space-y-1.5 p-3 bg-brand-50/50 rounded-2xl border border-brand-100">
                <span className="font-bold text-brand-900 text-[11px]">
                  Cliquez pour insérer une variable dans le corps :
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {AVAILABLE_VARIABLES.map(v => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => handleInsertVariable(v.key)}
                      className="px-2 py-1 bg-white hover:bg-brand-100 text-brand-700 font-mono text-[10px] font-bold rounded-lg border border-brand-200 transition-colors shadow-2xs"
                    >
                      + {v.key}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Corps du message *</label>
                <textarea
                  rows={8}
                  required
                  value={formData.body}
                  onChange={e => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Rédigez le texte du message ici..."
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-sans leading-relaxed focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditorModalOpen(false)}
                  className="px-4 py-2 text-gray-500 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer le modèle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

