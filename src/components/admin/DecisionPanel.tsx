import { useState } from 'react';
import { CheckCircle2, XCircle, RefreshCw, ShieldAlert, Lock, Loader2 } from 'lucide-react';
import { VerificationChecklist, type VerificationChecklistState } from './VerificationChecklist';

interface DecisionPanelProps {
  currentStatus: string;
  onApprove: (internalNotes: string, producerComment: string, checklist: VerificationChecklistState) => Promise<void>;
  onReject: (internalNotes: string, producerComment: string, checklist: VerificationChecklistState) => Promise<void>;
  onRequestChanges: (internalNotes: string, producerComment: string, checklist: VerificationChecklistState) => Promise<void>;
  loading?: boolean;
}

export function DecisionPanel({
  onApprove,
  onReject,
  onRequestChanges,
  loading = false,
}: DecisionPanelProps) {
  const [internalNotes, setInternalNotes] = useState('');
  const [producerComment, setProducerComment] = useState('');
  const [checklist, setChecklist] = useState<VerificationChecklistState>({
    identityVerified: false,
    businessDocsCompliant: false,
    certificationValid: false,
    farmPhotosCoherent: false,
    ethicalEngagementSatisfactory: false,
    charterSigned: false,
  });

  const allChecklistDone = Object.values(checklist).every(Boolean);

  const handleAction = async (action: 'approve' | 'reject' | 'changes') => {
    if (action === 'approve') {
      await onApprove(internalNotes, producerComment, checklist);
    } else if (action === 'reject') {
      await onReject(internalNotes, producerComment, checklist);
    } else {
      await onRequestChanges(internalNotes, producerComment, checklist);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-lg space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
          ⚖️
        </div>
        <div>
          <h3 className="font-black text-gray-900 text-base">SECTION G : DÉCISION FINALE D'AUDIT</h3>
          <p className="text-xs text-gray-500">
            Validation selon le référentiel d'accréditation EthiMarket x Bureau Veritas
          </p>
        </div>
      </div>

      {/* Checklist */}
      <VerificationChecklist state={checklist} onChange={setChecklist} disabled={loading} />

      {/* Internal Notes */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-gray-400" />
          Notes d'audit internes (Confidencielles — Non visibles par le producteur)
        </label>
        <textarea
          rows={3}
          value={internalNotes}
          onChange={e => setInternalNotes(e.target.value)}
          placeholder="Remarques de l'auditeur, vérifications téléphoniques faites, références externes vérifiées..."
          className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-gray-50/50 resize-none"
        />
      </div>

      {/* Comment for Producer */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-gray-700">
          Commentaire pour le producteur (Inclus dans l'email & l'interface du producteur)
        </label>
        <textarea
          rows={3}
          value={producerComment}
          onChange={e => setProducerComment(e.target.value)}
          placeholder="Précisez les points forts ou les corrections nécessaires (ex: Merci de fournir une photo plus nette de votre CNI et le certificat Bio renouvelé)."
          className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none bg-white resize-none"
        />
      </div>

      {!allChecklistDone && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Note : Certains critères de la checklist ne sont pas cochés. Vous pouvez toujours rejeter ou demander des modifications.</span>
        </div>
      )}

      {/* Decision Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        {/* Approve Button */}
        <button
          type="button"
          disabled={loading || !allChecklistDone}
          onClick={() => handleAction('approve')}
          className="btn-primary py-3.5 text-xs font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed bg-brand-600 hover:bg-brand-700 text-white"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          <span>APPROUVER DOSSIER</span>
        </button>

        {/* Reject Button */}
        <button
          type="button"
          disabled={loading || (!producerComment && !internalNotes)}
          onClick={() => handleAction('reject')}
          className="py-3.5 text-xs font-bold flex items-center justify-center gap-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700 text-white shadow-sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          <span>REJETER DOSSIER</span>
        </button>

        {/* Request Changes Button */}
        <button
          type="button"
          disabled={loading}
          onClick={() => handleAction('changes')}
          className="py-3.5 text-xs font-bold flex items-center justify-center gap-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span>DEMANDER MODIFICATIONS</span>
        </button>
      </div>
    </div>
  );
}
