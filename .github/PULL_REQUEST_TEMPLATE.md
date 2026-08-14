## 📝 Description du changement

<!-- Résumez brièvement les modifications apportées et le contexte -->

### Type de changement
- [ ] 🐛 Correction de bug (fix non-bloquant)
- [ ] ✨ Nouvelle fonctionnalité (ajout dans l'interface ou les services)
- [ ] 🏛️ Ajout d'un nouvel organisme de certification dans la base
- [ ] 🔄 Mise à jour des coordonnées d'un organisme existant
- [ ] 🧪 Ajout ou mise à jour des tests (unitaires, intégration, RLS)
- [ ] 📚 Documentation technique

---

## 🔍 Détail des modifications

<!-- Décrivez les modifications techniques principales (fichiers modifiés, nouveaux endpoints, etc.) -->

- 
- 

---

## ✅ Checklist de validation avant merge

Merci de vous assurer que les points suivants sont validés avant de demander une relecture :

- [ ] **Tests unitaires et d'intégration réussis** : `npm run test` (100% de réussite)
- [ ] **Vérification TypeScript stricte** : `npx tsc --noEmit` (aucune erreur de typage)
- [ ] **Linter conforme** : `npm run lint` (aucune infraction critique)
- [ ] **Build de production vérifié** : `npm run build`
- [ ] **Données d'organismes vérifiées sur sources officielles** (si applicable, documenté dans `CERTIFICATION_BODIES_SOURCES.md`)
- [ ] **Sécurité RLS testée** (si modification de schémas ou de requêtes Supabase)
- [ ] **Documentation mise à jour** (notamment `MODULE_CERTIFICATIONS_README.md`)
