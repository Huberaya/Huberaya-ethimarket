import { useState } from 'react';
import { ShoppingCart, MessageSquare, Download, Heart, Share2, X } from 'lucide-react';
import type { Product } from '../lib/supabase';

export default function StickyActions({ product, quantity }: { product: Product; quantity: number }) {
  const [favorited, setFavorited] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const total = product.price * quantity;

  return (
    <>
      {/* Desktop sticky bar */}
      <div className="hidden lg:block sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-100 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">Commander — tout inclus</p>
            <p className="text-lg font-black text-gray-900 truncate">{total.toLocaleString('fr-FR')} € <span className="text-sm font-medium text-gray-400">+ livraison</span></p>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" /> Commander
            </button>
            <button className="btn-outline px-3.5 py-2.5 text-sm inline-flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> <span className="hidden xl:inline">Contacter</span>
            </button>
            <button className="btn-outline px-3.5 py-2.5 text-sm inline-flex items-center gap-2">
              <Download className="w-4 h-4" /> <span className="hidden xl:inline">Documents</span>
            </button>
            <button onClick={() => setFavorited(f => !f)} className={`btn-outline px-3.5 py-2.5 ${favorited ? 'text-red-500 border-red-200 bg-red-50' : ''}`}>
              <Heart className={`w-4 h-4 ${favorited ? 'fill-red-500' : ''}`} />
            </button>
            <button onClick={() => setShareOpen(true)} className="btn-outline px-3.5 py-2.5">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sticky bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setFavorited(f => !f)} className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center flex-shrink-0 ${favorited ? 'border-red-200 text-red-500 bg-red-50' : 'border-gray-200 text-gray-500'}`}>
            <Heart className={`w-5 h-5 ${favorited ? 'fill-red-500' : ''}`} />
          </button>
          <button className="w-11 h-11 rounded-xl border-2 border-gray-200 text-gray-500 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5" />
          </button>
          <button className="btn-primary flex-1 py-3 text-sm inline-flex items-center justify-center gap-2">
            <ShoppingCart className="w-4 h-4" /> Commander — {total.toLocaleString('fr-FR')} €
          </button>
        </div>
      </div>

      {/* Share modal */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShareOpen(false)}>
          <div className="bg-white rounded-3xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-900">Partager ce produit</h3>
              <button onClick={() => setShareOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <input
              readOnly
              value={window.location.href}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 font-mono text-gray-600"
              onClick={e => (e.target as HTMLInputElement).select()}
            />
            <p className="text-xs text-gray-400 mt-2">Cliquez pour copier le lien</p>
          </div>
        </div>
      )}
    </>
  );
}
