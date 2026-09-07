import AdminProspection from './AdminProspection';

/**
 * Coquille de prévisualisation sans authentification.
 * Montée uniquement en développement (route /propection-preview) pour permettre
 * de vérifier l'onglet Prospection du dashboard admin sans compte Supabase.
 */
export default function ProspectionPreview() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <AdminProspection />
      </div>
    </div>
  );
}
