import { useState, useRef, useCallback, useEffect } from 'react';
import { Trash2, Eye, Plus, Loader2, AlertCircle, FileText, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { ensureBucketsExist } from '../../lib/storage';

export interface MultiFileUploadProps {
  bucket: string;
  folder?: string;
  accept?: string;
  maxSizeMB?: number;
  maxFiles?: number;
  minFiles?: number;
  label?: string;
  description?: string;
  currentFiles?: string[];
  onFilesChange: (urls: string[]) => void;
}

export function MultiFileUpload({
  bucket,
  folder,
  accept = '.jpg,.jpeg,.png,.webp,.pdf',
  maxSizeMB = 5,
  maxFiles = 10,
  minFiles = 1,
  label,
  description,
  currentFiles = [],
  onFilesChange,
}: MultiFileUploadProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<string[]>(currentFiles || []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [activePreview, setActivePreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFiles(currentFiles || []);
  }, [currentFiles]);

  const handleUploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      if (!fileList || fileList.length === 0) return;
      const selectedFiles = Array.from(fileList);

      if (files.length + selectedFiles.length > maxFiles) {
        setError(`Vous ne pouvez pas dépasser ${maxFiles} fichiers au total.`);
        return;
      }

      setUploading(true);
      setError('');

      const userId = user?.id || 'guest';
      const uploadedUrls: string[] = [];

      try {
        await ensureBucketsExist();

        for (const file of selectedFiles) {
          if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`Le fichier ${file.name} dépasse ${maxSizeMB} MB.`);
            continue;
          }

          const timestamp = Date.now();
          const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const path = folder
            ? `${userId}/${folder}/${timestamp}_${safeName}`
            : `${userId}/${timestamp}_${safeName}`;

          let fileUrl: string | null = null;

          try {
            const { data, error: uploadError } = await supabase.storage
              .from(bucket)
              .upload(path, file, { cacheControl: '3600', upsert: true });

            if (!uploadError && data) {
              fileUrl = supabase.storage.from(bucket).getPublicUrl(data.path).data?.publicUrl || null;
            }
          } catch (e) {
            console.warn(`Bucket ${bucket} upload error:`, e);
          }

          if (!fileUrl && bucket !== 'products') {
            try {
              const { data, error: fbErr } = await supabase.storage
                .from('products')
                .upload(path, file, { cacheControl: '3600', upsert: true });

              if (!fbErr && data) {
                fileUrl = supabase.storage.from('products').getPublicUrl(data.path).data?.publicUrl || null;
              }
            } catch (e) {
              console.warn('Fallback product storage exception:', e);
            }
          }

          if (!fileUrl) {
            fileUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
              reader.readAsDataURL(file);
            });
          }

          if (fileUrl) {
            uploadedUrls.push(fileUrl);
          }
        }

        if (uploadedUrls.length > 0) {
          const updated = [...files, ...uploadedUrls];
          setFiles(updated);
          onFilesChange(updated);
        }
      } catch (err) {
        console.error('Multi upload error:', err);
        setError("Une erreur est survenue lors du téléversement.");
      } finally {
        setUploading(false);
      }
    },
    [user, files, maxFiles, maxSizeMB, bucket, folder, onFilesChange]
  );

  const handleRemove = useCallback(
    (indexToRemove: number) => {
      const updated = files.filter((_, idx) => idx !== indexToRemove);
      setFiles(updated);
      onFilesChange(updated);
    },
    [files, onFilesChange]
  );

  const isImage = (url: string) =>
    url.match(/\.(jpg|jpeg|png|webp|gif)($|\?)/i) || url.startsWith('data:image/');

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-gray-800">{label}</label>
          <span className="text-xs font-medium text-gray-500">
            {files.length}/{maxFiles} fichiers {minFiles > 1 ? `(min ${minFiles})` : ''}
          </span>
        </div>
      )}

      {description && <p className="text-xs text-gray-500">{description}</p>}

      {/* Grid view of photos/documents */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {files.map((url, index) => {
          const img = isImage(url);
          return (
            <div
              key={index}
              className="group relative bg-gray-50 border border-gray-200 rounded-xl overflow-hidden aspect-square flex flex-col items-center justify-center shadow-2xs hover:shadow transition"
            >
              {img ? (
                <img
                  src={url}
                  alt={`Fichier ${index + 1}`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setActivePreview(url)}
                />
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center p-2 text-center cursor-pointer bg-blue-50/50"
                  onClick={() => window.open(url, '_blank')}
                >
                  <FileText className="w-8 h-8 text-blue-600 mb-1" />
                  <span className="text-[10px] font-semibold text-gray-700 truncate w-full px-1">
                    Document {index + 1}
                  </span>
                </div>
              )}

              {/* Action Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 p-1">
                <button
                  type="button"
                  onClick={() => (img ? setActivePreview(url) : window.open(url, '_blank'))}
                  className="p-1.5 bg-white/90 text-gray-800 rounded-lg hover:bg-white shadow transition"
                  title="Aperçu"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow transition"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-md backdrop-blur-2xs">
                #{index + 1}
              </div>
            </div>
          );
        })}

        {/* Add Button Card */}
        {files.length < maxFiles && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50/40 rounded-xl flex flex-col items-center justify-center p-3 text-center transition cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1 font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-emerald-700">Ajouter</span>
              </>
            )}
          </button>
        )}
      </div>

      {files.length < minFiles && (
        <p className="text-xs text-amber-600 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5" /> Veuillez ajouter au moins {minFiles} fichier(s).
        </p>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError('')} className="text-red-500">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={(e) => {
          if (e.target.files) handleUploadFiles(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Lightbox Modal */}
      {activePreview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActivePreview(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-800">Aperçu du document</span>
              <button
                type="button"
                onClick={() => setActivePreview(null)}
                className="p-1.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-gray-900/5 min-h-[300px]">
              <img src={activePreview} alt="Aperçu" className="max-h-[75vh] w-auto object-contain rounded-lg shadow-sm" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
