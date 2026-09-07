# Prospection — base producteurs

Onglet **Prospection** du dashboard admin (`/admin/prospection`) : la base de prospection
des producteurs réels d'Ethimarket, consultable, filtrable et exportable sans quitter l'app.

## Ce que contient la base

- **3 531 producteurs réels** (coopératives, organisations de petits producteurs,
  exploitations, fabricants) dans **78 pays** et sur les 7 continents.
- **1 449 emails**, **1 657 téléphones**, **196 sites web**, **47 WhatsApp**,
  **66 comptes sociaux**, **1 214 contacts nommés**.
- Catégories : café, cacao, fruits & légumes, épices, thé, huiles (olive, argan),
  sucre/panela, plantes & huiles essentielles, cosmétiques naturels, textile/artisanat,
  miel, céréales…

Sources publiques uniquement : Fairtrade/FLOCERT, WFTO, PromPerú, NSTIAM (Inde),
Spices Board India, TNAU, Conseil Café-Cacao (Côte d'Ivoire), Conseil oléicole
international, IFOAM, sites officiels de coopératives. **Aucune donnée inventée** :
un champ non publié par la source vaut « Non trouvé », un label non confirmé vaut
« À vérifier ».

## Fonctionnalités

| Fonction | Détail |
| --- | --- |
| Recherche plein texte | Nom, pays, région, produits, certification, contact, source |
| Filtres | Continent, pays, catégorie, type de producteur, bio, équitable, disponibilité des coordonnées, statut |
| Fiche producteur | Coordonnées complètes, `mailto:`/`tel:`/`wa.me`, réseaux sociaux, copie en 1 clic |
| Pipeline de prospection | 6 statuts (Nouveau → À qualifier → Contacté → Réponse → Référé → Écarté) + note interne |
| Export CSV | Export de la sélection filtrée (UTF-8 BOM, séparateur `;`, compatible Excel/CRM) |

Le statut et la note interne sont persistés dans le navigateur (`localStorage`,
clé `ethimarket.prospection.v1`) : aucune écriture en base, aucun risque d'écraser
les données producteurs existantes. Une bascule vers une table Supabase
`prospection_producers` est l'étape suivante naturelle si le suivi doit être partagé
entre plusieurs commerciaux.

## Fichiers

```
public/data/prospects.json          données servies à l'app (généré, ne pas éditer à la main)
scripts/generate_prospects.py       générateur : CSV base → prospects.json
data/base_producteurs_ethimarket.csv base complète (21 colonnes, source de vérité)
data-pipeline/build_db.py           agrégation + dédoublonnage des sources
data-pipeline/export_xlsx.py        export CSV/XLSX de la base
src/lib/producerProspects.ts        types, chargement, filtres, export CSV, persistance
src/pages/admin/AdminProspection.tsx page admin
src/pages/admin/ProspectionPreview.tsx prévisualisation sans auth (dev uniquement)
```

## Mettre à jour la base

1. Mettre à jour `data/base_producteurs_ethimarket.csv` (ou rejouer
   `data-pipeline/build_db.py && data-pipeline/export_xlsx.py` si les sources brutes
   sont disponibles).
2. Régénérer l'asset web :

   ```bash
   python3 scripts/generate_prospects.py data/base_producteurs_ethimarket.csv
   ```

3. Vérifier (`npm run build`), committer `public/data/prospects.json` et pousser :
   Vercel redéploie automatiquement.

## Aperçu local

```bash
npm install
npm run dev
# http://localhost:3000/prospection-preview   (sans authentification, dev uniquement)
# http://localhost:3000/admin/propection     (compte admin requis)
```
