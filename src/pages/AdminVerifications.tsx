import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, Search, CheckCircle2, XCircle, Loader2,
  ChevronRight, FileText, MapPin, Award, FlaskConical, Heart, Filter,
} from 'lucide-react';
import { supabase, type ProducerVerification, type Producer } from '../lib/supabase';

type VerificationWithProducer = ProducerVerification & { producers?: Producer };

const SECTIONS = [
  { id: 1, title: 'Documents d\'identité', icon: FileText },
  { id: 2, title: 'Localisation', icon: MapPin },
  { id: 3, title: 'Certifications', icon: Award },
  { id: 4, title: 'Analyses qualité', icon: FlaskConical },
  { id: 5, title: 'Engagement éthique', icon: Heart },
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  submitted: 'bg-amber-100 text-amber-700',
  approved: 'bg-brand-100 text-brand-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function AdminVerifications() {
  const [verifications, setVerifications] = useState<VerificationWithProducer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selected, setSelected] = useState<VerificationWithProducer | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSection, setRejectSection] = useState<number | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('producer_verifications')
      .select('*, producers(*)')
      .order('created_at', { ascending: false });
    setVerifications((data as VerificationWithProducer[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = verifications.filter(v => {
    const name = v.producers?.name ?? '';
    if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== 'all') {
      const statuses = [v.section_1_status, v.section_2_status, v.section_3_status, v.section_4_status, v.section_5_status];
      if (!statuses.includes(filterStatus)) return false;
    }
    return true;
  });

  const updateSection = async (section: number, action: 'approve' | 'reject', reason?: string) => {
    if (!selected) return;
    setActionLoading(true);
    const col = `section_${section}_status`;
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const update: Record<string, unknown> = { [col]: newStatus };
    if (action === 'reject' && reason) {
      const reasons = { ...selected.rejection_reasons, [String(section)]: reason };
      update.rejection_reasons = reasons;
    }

    // Check if all approved → complete
    const statuses = [selected.section_1_status, selected.section_2_status, selected.section_3_status, selected.section_4_status, selected.section_5_status];
    statuses[section - 1] = newStatus;
    if (statuses.every(s => s === 'approved')) {
      update.onboarding_complete = true;
      update.badge_level = 'silver';
      update.validated_at = new Date().toISOString();
    }

    await supabase.from('producer_verifications').update(update).eq('id', selected.id);
    await supabase.from('verification_logs').insert({
      verification_id: selected.id,
      action,
      section,
      message: reason ?? '',
    });

    setActionLoading(false);
    setRejectSection(null);
    setRejectReason('');
    await load();
    const updated = verifications.find(v => v.id === selected.id);
    if (updated) setSelected({ ...updated, [col]: newStatus } as VerificationWithProducer);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-brand-500" />
          <div>
            <h1 className="text-lg font-black text-gray-900">Admin — Vérifications producteurs</h1>
            <p className="text-xs text-gray-500">Validez ou rejetez les sections soumises par les producteurs</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un producteur..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white appearance-none cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="submitted">Soumis</option>
              <option value="approved">Validé</option>
              <option value="rejected">Rejeté</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="grid gap-3">
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm">Aucune vérification trouvée.</div>
          )}
          {filtered.map(v => {
            const statuses = [v.section_1_status, v.section_2_status, v.section_3_status, v.section_4_status, v.section_5_status];
            const approved = statuses.filter(s => s === 'approved').length;
            const submitted = statuses.filter(s => s === 'submitted').length;
            return (
              <button
                key={v.id}
                onClick={() => setSelected(v)}
                className="bg-white rounded-2xl border border-gray-100 p-5 text-left hover:border-brand-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{v.producers?.name ?? 'Producteur inconnu'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{v.producers?.country} • {approved}/5 validées • {submitted} en attente</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {v.onboarding_complete && (
                      <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-full">{v.badge_level}</span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div className="flex gap-1.5 mt-3">
                  {statuses.map((s, i) => (
                    <div key={i} className={`flex-1 h-1.5 rounded-full ${STATUS_COLORS[s]}`} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-black text-gray-900">{selected.producers?.name}</h2>
                <p className="text-sm text-gray-500">{selected.producers?.country} • Créé le {new Date(selected.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="space-y-3">
              {SECTIONS.map(section => {
                const status = (selected as unknown as Record<string, string>)[`section_${section.id}_status`];
                const Icon = section.icon;
                return (
                  <div key={section.id} className="border border-gray-100 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400">SECTION {section.id}/5</p>
                          <p className="font-bold text-sm text-gray-900">{section.title}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[status]}`}>
                        {status === 'approved' ? 'Validé' : status === 'rejected' ? 'Rejeté' : status === 'submitted' ? 'À valider' : 'En attente'}
                      </span>
                    </div>

                    {selected.rejection_reasons[String(section.id)] && (
                      <p className="text-xs text-red-600 mb-2">Motif: {selected.rejection_reasons[String(section.id)]}</p>
                    )}

                    {status === 'submitted' && (
                      <div className="space-y-2">
                        {rejectSection === section.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={rejectReason}
                              onChange={e => setRejectReason(e.target.value)}
                              placeholder="Motif du rejet..."
                              rows={2}
                              className="w-full px-3 py-2 text-sm border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none resize-none"
                            />
                            <div className="flex gap-2">
                              <button onClick={() => { setRejectSection(null); setRejectReason(''); }} className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
                              <button disabled={!rejectReason || actionLoading} onClick={() => updateSection(section.id, 'reject', rejectReason)}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg disabled:opacity-40">Confirmer le rejet</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button disabled={actionLoading} onClick={() => updateSection(section.id, 'approve')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg disabled:opacity-40">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Valider
                            </button>
                            <button onClick={() => setRejectSection(section.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg">
                              <XCircle className="w-3.5 h-3.5" /> Rejeter
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selected.onboarding_complete && (
              <div className="mt-4 flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-xl p-4">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                <p className="text-sm font-semibold text-brand-700">Vérification complète — Badge {selected.badge_level} attribué</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
