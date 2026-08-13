import { useState } from 'react';
import { FileText, ExternalLink, ZoomIn, CheckCircle2, XCircle, AlertCircle, Eye, Download } from 'lucide-react';

interface DocumentViewerProps {
  title: string;
  url: string | null | undefined;
  docType?: string;
  status?: 'valid' | 'invalid' | 'pending';
  comment?: string;
  onStatusChange?: (status: 'valid' | 'invalid', comment: string) => void;
  required?: boolean;
}

export function DocumentViewer({
  title,
  url,
  docType = 'document',
  status = 'pending',
  comment = '',
  onStatusChange,
  required = false,
}: DocumentViewerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [localComment, setLocalComment] = useState(comment);
  const [showCommentBox, setShowCommentBox] = useState(false);

  const isImage = url ? (url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || docType === 'image') : false;

  const handleStatus = (newStatus: 'valid' | 'invalid') => {
    if (onStatusChange) {
      onStatusChange(newStatus, localComment);
    }
  };

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      status === 'valid'
        ? 'bg-brand-50/40 border-brand-200'
        : status === 'invalid'
        ? 'bg-red-50/40 border-red-200'
        : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-gray-900">{title}</h4>
            {required && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Obligatoire</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {url ? (isImage ? 'Fichier image' : 'Document PDF / Officiel') : 'Non téléversé'}
          </p>
        </div>

        {/* Status Badge */}
        <div>
          {status === 'valid' && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 bg-brand-100/80 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" /> Conforme
            </span>
          )}
          {status === 'invalid' && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100/80 px-2.5 py-1 rounded-full">
              <XCircle className="w-3.5 h-3.5 text-red-600" /> Non conforme
            </span>
          )}
          {status === 'pending' && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> À examiner
            </span>
          )}
        </div>
      </div>

      {/* Document Content / Preview */}
      {url ? (
        <div className="space-y-3">
          {isImage ? (
            <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 max-h-48 flex items-center justify-center">
              <img src={url} alt={title} className="max-h-48 object-contain w-full" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  onClick={() => setModalOpen(true)}
                  className="px-3 py-1.5 bg-white/90 hover:bg-white text-gray-900 font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow"
                >
                  <ZoomIn className="w-3.5 h-3.5" /> Agrandir
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white/90 hover:bg-white text-gray-900 font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Ouvrir
                </a>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{title}</p>
                  <span className="text-[10px] text-gray-500">Aperçu disponible en haute résolution</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5 text-brand-600" /> Voir le document
                </a>
                <a
                  href={url}
                  download
                  className="p-1.5 text-gray-500 hover:text-gray-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  title="Télécharger"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Verification Buttons */}
          {onStatusChange && (
            <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStatus('valid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                    status === 'valid'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Valide
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCommentBox(true);
                    handleStatus('invalid');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                    status === 'invalid'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" /> Invalide
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowCommentBox(!showCommentBox)}
                className="text-xs text-gray-500 hover:text-gray-700 font-semibold"
              >
                {showCommentBox ? 'Masquer la note' : localComment ? 'Note active 📝' : 'Ajouter une note'}
              </button>
            </div>
          )}

          {/* Comment text area */}
          {showCommentBox && (
            <div className="mt-2">
              <input
                type="text"
                value={localComment}
                onChange={e => {
                  setLocalComment(e.target.value);
                  if (status !== 'pending' && onStatusChange) {
                    onStatusChange(status, e.target.value);
                  }
                }}
                placeholder="Remarque/motif de non-conformité pour le producteur..."
                className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl text-center">
          <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xs text-amber-800 font-medium">Document non encore téléversé par le producteur.</p>
        </div>
      )}

      {/* Modal Zoom */}
      {modalOpen && url && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">{title}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-700 text-sm font-bold px-2 py-1">
                Fermer ✕
              </button>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[80vh] overflow-auto">
              <img src={url} alt={title} className="max-h-[75vh] object-contain rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
