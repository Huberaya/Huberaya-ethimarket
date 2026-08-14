# Module de Vérification Mondiale des Certifications — EthiMarket

![Status](https://img.shields.io/badge/Status-Production%20Ready-emerald?style=flat-square)
![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=flat-square)
![Tests](https://img.shields.io/badge/Tests-72%2F72%20passing-success?style=flat-square)
![Coverage](https://img.shields.io/badge/Coverage-86%25%20global-brightgreen?style=flat-square)
![Platform](https://img.shields.io/badge/Stack-React%2018%20%7C%20Vite%205%20%7C%20Supabase-purple?style=flat-square)

Ce module permet à l'équipe d'administration d'**EthiMarket** de vérifier l'authenticité des certifications soumises par les producteurs enregistrés sur la plateforme, en contactant directement les organismes de certification du monde entier (notamment en Afrique, en Asie et en Amérique Latine) en un seul clic, avec un journal d'audit immuable et une cascade multicanale automatisée.

---

## 📑 Table des matières

1. [Fonctionnalités principales](#-fonctionnalités-principales)
2. [Architecture du module](#-architecture-du-module)
   - 2.1 [Structure des fichiers](#21-structure-des-fichiers)
   - 2.2 [Schéma d'architecture](#22-schéma-darchitecture)
   - 2.3 [Flux de données](#23-flux-de-données)
3. [Schéma de base de données](#-schéma-de-base-de-données)
   - 3.1 [Diagramme des tables](#31-diagramme-des-tables)
   - 3.2 [Détail des tables](#32-détail-des-tables)
   - 3.3 [ENUMs PostgreSQL](#33-enums-postgresql)
4. [Logique de vérification en 1 clic](#-logique-de-vérification-en-1-clic)
   - 4.1 [Principe de cascade](#41-principe-de-cascade)
   - 4.2 [Diagramme de décision](#42-diagramme-de-décision)
   - 4.3 [Comportement par canal](#43-comportement-par-canal)
   - 4.4 [Exemple d'appel de service](#44-exemple-dappel-de-service)
5. [Guide des services métier](#-guide-des-services-métier)
6. [Guide des types TypeScript](#-guide-des-types-typescript)
7. [Guide d'utilisation administrateur](#-guide-dutilisation-administrateur)
8. [Procédures d'administration](#-procédures-dadministration)
9. [Couverture géographique](#-couverture-géographique)
10. [Tests unitaires, d'intégration et de sécurité](#-tests-unitaires-dintégration-et-de-sécurité)
11. [Sécurité & conformité](#-sécurité--conformité)
12. [Évolutions futures suggérées](#-évolutions-futures-suggérées)
13. [Historique des versions & Changelog](#-historique-des-versions--changelog)
14. [Contacts et support](#-contacts-et-support)

---

## 🌟 Fonctionnalités principales

- ✅ **Base de données mondiale des organismes de certification** : Plus de 55 organismes certificateurs internationaux référencés avec métadonnées précises.
- ✅ **Couverture prioritaire Afrique, Asie, Amérique Latine & Europe** : Organismes spécialisés (Ecocert, Fairtrade Africa, Control Union, Ceres, Certimex, BCS Öko-Garantie, IMO Control, etc.).
- ✅ **Vérification en 1 clic** avec sélection automatisée du meilleur canal et enrichissement dynamique des variables de template.
- ✅ **6 canaux de contact supportés** :
  1. `api` : Vérification automatique synchrone par API REST chiffrée.
  2. `email` : Notification officielle générée et prête à l'envoi avec objet/corps formaté.
  3. `form` : Redirection ciblée vers le portail ou formulaire web de vérification officiel.
  4. `whatsapp` : Génération automatique d'un lien d'audit wa.me pré-rempli.
  5. `phone` : Numéro direct du service conformité avec horodatage d'appel.
  6. `manual` : Procédure de repli documentée avec consignes pour l'auditeur.
- ✅ **Templates de messages bilingues & multilingues** (`fr`, `en`, `es`, `pt`, `de`) avec moteur de variables contextuelles (`{{producer_name}}`, `{{certificate_number}}`, `{{expires_at}}`, etc.).
- ✅ **Journal d'audit immuable et complet** (`certification_verification_logs`) sécurisé par RLS (interdiction stricte de modification et de suppression).
- ✅ **Workflow de vérification en 6 étapes** : Unverified $\to$ Pending / Contact Sent $\to$ Verification Request $\to$ Response Received $\to$ Verified / Rejected $\to$ Expired.
- ✅ **Interface d'administration complète en 6 vues** : Dashboard KPI, Annuaire mondial, Fiche organisme, Liste des certifications, Détail & vérification de certificat, Gestion des modèles de message.
- ✅ **Alertes d'expiration dynamiques** (seuil configurable, 30 jours par défaut).
- ✅ **Import / Export en lot** (format JSON ou CSV) avec validation de schéma et gestion d'erreurs d'unicité.
- ✅ **Suite de tests Vitest (72 tests)** validant les services, les templates, les flux d'intégration et les permissions RLS.

---

## 🏗️ Architecture du module

### 2.1 Structure des fichiers

```text
MODULE_CERTIFICATIONS_README.md
CERTIFICATION_BODIES_SOURCES.md
.github/PULL_REQUEST_TEMPLATE.md
│
├── supabase/migrations/
│   ├── 20260814000000_complete_certification_verification_system.sql
│   └── 20260814010000_seed_global_certification_bodies.sql
│
├── src/lib/
│   ├── supabase.ts                        # Types globaux enrichis & client Supabase
│   ├── certificationVerificationService.ts # Moteur de vérification 1-clic, stats & logs
│   ├── certificationTemplatesService.ts    # Gestionnaire de templates & rendu
│   └── certificationBodiesService.ts       # Annuaire, import/export & détection de canaux
│
├── src/pages/admin/
│   ├── CertificationsDashboard.tsx         # Dashboard statistiques & KPI
│   ├── ProducerCertificationsList.tsx      # Liste paginée avec filtres avancés
│   ├── ProducerCertificationDetail.tsx     # Fiche d'audit détaillée & historique
│   ├── AdminCertBodiesDirectory.tsx        # Annuaire mondial des organismes
│   ├── AdminCertBodyDetail.tsx             # Fiche détaillée de l'organisme
│   └── AdminMessageTemplates.tsx           # Éditeur et prévisualiseur de templates
│
├── src/components/admin/
│   ├── OneClickVerificationButton.tsx      # Bouton intelligent de déclenchement
│   ├── ManualResponseModal.tsx             # Modale d'enregistrement de retour d'audit
│   ├── CertificationLogsTimeline.tsx       # Ligne temporelle d'audit visuelle
│   ├── CertificationStatusBadge.tsx        # Badge de statut normalisé
│   ├── ChannelBadge.tsx                    # Badge de canal de contact
│   └── AdminCertBodyFormModal.tsx          # Formulaire d'ajout / édition d'organisme
│
└── src/test/
    ├── setup.ts                            # Configuration globale Vitest
    ├── mocks/supabaseMock.ts               # Mock complet et chaînable de Supabase
    ├── fixtures/certificationFixtures.ts   # Données de tests et scénarios
    ├── certificationVerificationService.test.ts # Tests du service de vérification
    ├── certificationTemplatesService.test.ts    # Tests du moteur de templates
    ├── certificationBodiesService.test.ts       # Tests de gestion des organismes
    ├── certificationWorkflow.test.ts            # Tests d'intégration du cycle de vie
    └── certificationPermissions.test.ts         # Tests de sécurité et RLS
```

### 2.2 Schéma d'architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        INTERFACE ADMIN (React + Tailwind)               │
│                                                                        │
│   [ CertificationsDashboard ]        [ AdminCertBodiesDirectory ]      │
│   [ ProducerCertificationsList ]     [ AdminMessageTemplates ]        │
│   [ ProducerCertificationDetail ]    [ AdminCertBodyDetail ]           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       COMPOSANTS MÉTIER RÉUTILISABLES                  │
│                                                                        │
│   [ OneClickVerificationButton ]     [ ManualResponseModal ]           │
│   [ CertificationLogsTimeline ]      [ CertificationStatusBadge ]      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          SERVICES TYPESCRIPT STRICTS                    │
│                                                                        │
│   [ certificationVerificationService.ts ] ──► Moteur 1-clic & Cascade │
│   [ certificationTemplatesService.ts ]    ──► Résolution {{var}}       │
│   [ certificationBodiesService.ts ]       ──► Annuaire & Détection    │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    COUCHE SUPABASE POSTGRESQL + RLS                     │
│                                                                        │
│   • certification_bodies              • certification_standards        │
│   • producer_certifications           • verification_requests          │
│   • certification_verification_logs (Immuable)                         │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Flux de données

```text
[ Administrateur ]
       │  (1) Clic sur "Vérifier en 1 clic"
       ▼
[ OneClickVerificationButton ]
       │  (2) Invoque triggerOneClickVerification(certId, adminId)
       ▼
[ certificationVerificationService ]
       │  (3) Charge la certification + l'organisme
       │  (4) Détecte le canal prioritaire (detectBestChannel)
       │  (5) Résout les templates (resolveTemplateVariables)
       │  (6) Crée une entrée dans certification_verification_requests
       │  (7) Met à jour le statut dans producer_certifications
       │  (8) Écrit un log d'audit dans certification_verification_logs
       ▼
[ Supabase PostgreSQL ]
       │  (9) Renvoie le résultat au composant UI
       ▼
[ Notification / Redirection Admin (API / Mailto / WA / Formulaire) ]
```

---

## 🗄️ Schéma de base de données

### 3.1 Diagramme des tables

```text
┌────────────────────────┐         1:N         ┌───────────────────────────────┐
│  certification_bodies  ├────────────────────►│  certification_body_contacts  │
└───────────┬────────────┘                     └───────────────────────────────┘
            │
            │ 1:N
            ▼
┌───────────────────────────┐      1:N         ┌───────────────────────────────┐
│  certification_standards  ├─────────────────►│    producer_certifications    │
└───────────────────────────┘                  └───────────────┬───────────────┘
                                                               │
                                         ┌─────────────────────┴─────────────────────┐
                                         │ 1:N                                       │ 1:N
                                         ▼                                           ▼
                    ┌──────────────────────────────────────────┐    ┌──────────────────────────────────┐
                    │   certification_verification_requests    │    │  certification_verification_logs │
                    └──────────────────────────────────────────┘    │            (IMMUABLE)            │
                                                                    └──────────────────────────────────┘

┌─────────────────────────────────────────┐
│      certification_message_templates    │
└─────────────────────────────────────────┘
```

### 3.2 Détail des tables

#### 1. `certification_bodies`
- **Rôle** : Annuaire des organismes certificateurs officiels dans le monde.
- **Colonnes clés** : `id` (UUID, PK), `name` (TEXT, NOT NULL), `acronym` (TEXT), `country` (TEXT, NOT NULL), `region` (ENUM, NOT NULL), `api_endpoint` (TEXT), `email_contact` (TEXT), `whatsapp` (TEXT), `phone` (TEXT), `contact_form_url` (TEXT), `trust_level` (ENUM), `is_active` (BOOLEAN).
- **Contrainte** : `UNIQUE(name, country)`.
- **RLS** : Lecture publique pour les utilisateurs authentifiés, écriture/mise à jour réservée aux administrateurs.

#### 2. `certification_body_contacts`
- **Rôle** : Répertoire des auditeurs et référents humains par organisme.
- **Colonnes clés** : `id` (UUID, PK), `certification_body_id` (FK), `contact_name` (TEXT), `role` (TEXT), `email` (TEXT), `phone` (TEXT), `is_primary` (BOOLEAN).
- **RLS** : Réservé aux administrateurs.

#### 3. `certification_standards`
- **Rôle** : Normes et référentiels de certification (ex. AB, Bio UE, Fairtrade Max Havelaar, Rainforest Alliance).
- **Colonnes clés** : `id` (UUID, PK), `certification_body_id` (FK), `code` (TEXT), `name` (TEXT), `type` (ENUM), `validity_duration_months` (INT).
- **RLS** : Lecture ouverte, modifications réservées aux administrateurs.

#### 4. `producer_certifications`
- **Rôle** : Certificats soumis par les producteurs sur leurs profils/boutiques.
- **Colonnes clés** : `id` (UUID, PK), `producer_id` (FK), `certification_body_id` (FK), `certification_standard_id` (FK), `certificate_number` (TEXT), `document_url` (TEXT), `issued_at` (DATE), `expires_at` (DATE), `status` (ENUM), `verified_by` (FK profiles), `verified_at` (TIMESTAMPTZ).
- **RLS** : Le producteur propriétaire peut lire/insérer son certificat ; les administrateurs peuvent tout lire et modifier le statut de validation.

#### 5. `certification_verification_requests`
- **Rôle** : Historique des tentatives et envois de vérification (email, API, whatsapp, etc.).
- **Colonnes clés** : `id` (UUID, PK), `producer_certification_id` (FK), `certification_body_id` (FK), `triggered_by` (FK), `channel` (ENUM), `status` (ENUM), `message_sent` (TEXT), `response_received` (TEXT).
- **RLS** : Réservé aux administrateurs.

#### 6. `certification_verification_logs`
- **Rôle** : Journal d'audit légal et immuable de chaque changement d'état.
- **Colonnes clés** : `id` (UUID, PK), `producer_certification_id` (FK), `admin_id` (FK), `action` (TEXT), `previous_status` (ENUM), `new_status` (ENUM), `channel_used` (ENUM), `details` (JSONB), `created_at` (TIMESTAMPTZ).
- **RLS** : `SELECT` et `INSERT` réservés aux administrateurs. Les requêtes `UPDATE` et `DELETE` sont **strictement interdites par politique de sécurité** (politique RLS retournant false).

#### 7. `certification_message_templates`
- **Rôle** : Bibliothèque de messages multilingues et multicanaux.
- **Colonnes clés** : `id` (UUID, PK), `name` (TEXT), `language` (VARCHAR(5)), `channel` (ENUM), `subject` (TEXT), `body` (TEXT), `variables` (TEXT[]), `is_default` (BOOLEAN).
- **RLS** : Lecture et modification réservées aux administrateurs.

### 3.3 ENUMs PostgreSQL

| Nom de l'ENUM | Valeurs possibles |
|---|---|
| `certification_region_enum` | `'Africa'`, `'Asia'`, `'Latin America'`, `'Europe'`, `'North America'`, `'Oceania'`, `'Middle East'` |
| `certification_type_enum` | `'organic'`, `'fair_trade'`, `'ethical'`, `'sustainable'`, `'other'` |
| `trust_level_enum` | `'verified'`, `'unverified'`, `'pending'` |
| `verification_channel_enum` | `'api'`, `'email'`, `'form'`, `'whatsapp'`, `'phone'`, `'manual'` |
| `verification_status_enum` | `'unverified'`, `'pending'`, `'contact_sent'`, `'verified'`, `'rejected'`, `'expired'`, `'manual_required'` |
| `request_status_enum` | `'pending'`, `'sent'`, `'delivered'`, `'failed'`, `'success'` |

---

## ⚡ Logique de vérification en 1 clic

### 4.1 Principe de cascade

Lorsqu'un administrateur clique sur **"Vérifier en 1 clic"**, le système analyse les métadonnées de l'organisme certificateur lié et sélectionne automatiquement le canal le plus rapide et le plus direct selon la priorité stricte :
**`API REST` $\to$ `Email officiel` $\to$ `Portail / Formulaire Web` $\to$ `WhatsApp` $\to$ `Téléphone` $\to$ `Procédure manuelle`**.

### 4.2 Diagramme de décision

```text
┌─────────────────────────────────────────────────┐
│      Admin clique sur "Vérifier en 1 clic"      │
└────────────────────────┬────────────────────────┘
                         │
                         ▼
             ┌───────────────────────┐
             │  Organisme associé ?  │
             └───────────┬───────────┘
                 NON     │     OUI
         ┌───────────────┘     └───────────────┐
         ▼                                     ▼
┌──────────────────┐               ┌───────────────────────┐
│ Canal : 'manual' │               │   api_endpoint dispo  │
│ Statut :         │               │     et non vide ?     │
│ manual_required  │               └───────────┬───────────┘
└──────────────────┘                   OUI     │     NON
                               ┌───────────────┘     └───────────────┐
                               ▼                                     ▼
                      ┌──────────────────┐               ┌───────────────────────┐
                      │ Canal : 'api'    │               │  email_contact dispo  │
                      │ Appel REST 10s   │               │     et non vide ?     │
                      └────────┬─────────┘               └───────────┬───────────┘
                          OK   │   Échec                     OUI     │     NON
                     ┌─────────┴─────────┐           ┌───────────────┘     └───────────────┐
                     ▼                   ▼           ▼                                     ▼
              ┌──────────────┐     ┌───────────┐ ┌──────────────────┐          ┌───────────────────────┐
              │ Statut :     │     │ Fallback  │ │ Canal : 'email'  │          │ contact_form_url ou   │
              │ 'verified'   │     │ contact_  │ │ Statut :         │          │ verification_url ?    │
              └──────────────┘     │   sent    │ │ 'contact_sent'   │          └───────────┬───────────┘
                                   └───────────┘ └──────────────────┘              OUI     │     NON
                                                                           ┌───────────────┘     └───────────────┐
                                                                           ▼                                     ▼
                                                                  ┌──────────────────┐               ┌───────────────────────┐
                                                                  │ Canal : 'form'   │               │    whatsapp dispo     │
                                                                  │ Ouvre URL web    │               │     et non vide ?     │
                                                                  │ Statut :         │               └───────────┬───────────┘
                                                                  │ 'contact_sent'   │                   OUI     │     NON
                                                                  └──────────────────┘           ┌───────────────┘     └───────────────┐
                                                                                                 ▼                                     ▼
                                                                                        ┌──────────────────┐               ┌───────────────────────┐
                                                                                        │ Canal: 'whatsapp'│               │      phone dispo      │
                                                                                        │ Ouvre wa.me      │               │     et non vide ?     │
                                                                                        │ Statut :         │               └───────────┬───────────┘
                                                                                        │ 'contact_sent'   │                   OUI     │     NON
                                                                                        └──────────────────┘           ┌───────────────┘     └───────────────┐
                                                                                                                       ▼                                     ▼
                                                                                                              ┌──────────────────┐               ┌──────────────────┐
                                                                                                              │ Canal : 'phone'  │               │ Canal : 'manual' │
                                                                                                              │ Affiche numéro   │               │ Statut :         │
                                                                                                              │ Statut :         │               │ manual_required  │
                                                                                                              │ 'pending'        │               └──────────────────┘
                                                                                                              └──────────────────┘
```

### 4.3 Comportement par canal

| Canal | Condition d'activation | Action déclenchée | Statut résultant | Action utilisateur |
|---|---|---|---|---|
| **API** | `api_endpoint` renseigné | Requête HTTP POST sécurisée (timeout 10s) avec payload certificat | `verified` si 200 OK / `contact_sent` si échec | Aucune si succès immédiat |
| **Email** | `email_contact` présent | Génération du sujet/corps via template par défaut + client mailto | `contact_sent` | Confirmer l'envoi dans le client email |
| **Form** | `contact_form_url` ou `verification_url` | Ouverture automatique de l'URL dans un nouvel onglet sécurisé | `contact_sent` | Remplir le formulaire officiel |
| **WhatsApp** | `whatsapp` présent | Génération de l'URL `https://wa.me/<num>?text=<msg>` encodé | `contact_sent` | Envoyer le message sur WhatsApp |
| **Phone** | `phone` présent | Formatage du lien `tel:<num>` et notification | `pending` | Passer l'appel à l'organisme |
| **Manual** | Aucun contact disponible | Affichage des instructions de recherche manuelle | `manual_required` | Rechercher les coordonnées |

### 4.4 Exemple d'appel de service

```typescript
import { triggerOneClickVerification } from '@/lib/certificationVerificationService';

// Exemple de déclenchement dans un composant admin
const handleVerify = async (certificationId: string, currentAdminId: string) => {
  const result = await triggerOneClickVerification(certificationId, currentAdminId);

  if (result.success) {
    console.log(`Vérification initiée avec succès via le canal ${result.channel}`);
    if (result.external_url) {
      window.open(result.external_url, '_blank', 'noopener,noreferrer');
    }
  } else {
    console.warn(`Action requise ou échec : ${result.message}`);
  }
};
```

---

## 🛠️ Guide des services métier

### 5.1 `certificationVerificationService.ts`

- `resolveTemplateVariables(template: string, variables: Partial<TemplateVariables>): string`
  - Remplace récursivement les jetons `{{nom_variable}}` ou `{{ nom_variable }}` par leurs valeurs réelles.
- `getProducerCertifications(filters?: ProducerCertificationFilters, page?: number, pageSize?: number)`
  - Récupère la liste paginée des certifications producteurs avec les relations `producer`, `certification_body` et `certification_standard`.
- `getProducerCertificationById(id: string)`
  - Récupère une certification unique avec l'ensemble de ses relations et auditeurs.
- `triggerOneClickVerification(certificationId: string, adminId: string, customVariables?: Partial<TemplateVariables>): Promise<VerificationResult>`
  - Exécute le moteur en cascade, trace la requête et génère le journal d'audit.
- `recordManualResponse(certificationId: string, requestId: string, responseNotes: string, outcome: 'verified' | 'rejected', adminId: string)`
  - Enregistre le retour reçu d'un organisme, met à jour le statut de la certification et archive le journal d'audit.
- `updateCertificationStatus(certificationId: string, newStatus: ProducerCertificationStatus, adminId: string, adminNotes?: string)`
  - Met à jour manuellement l'état d'un certificat avec traçabilité obligatoire.
- `getCertificationDashboardStats(): Promise<{ data: CertificationDashboardStats | null, error: string | null }>`
  - Calcule en temps réel la répartition par statut, les alertes d'expiration à 30 jours et les totaux par région géographique.
- `getCertificationLogs(certificationId: string)`
  - Récupère l'historique complet des actions d'audit ordonné chronologiquement.

### 5.2 `certificationTemplatesService.ts`

- `getTemplates(filters?: { language?: string; channel?: string })`
  - Liste les modèles de messages disponibles avec possibilité de filtrer par langue et canal.
- `getDefaultTemplate(channel: VerificationChannel, language = 'fr')`
  - Récupère le template par défaut pour un canal et une langue donnés (avec repli automatique sur l'anglais).
- `createTemplate(templateData: CertificationMessageTemplateInsert)`
  - Crée un nouveau modèle de message (gère la désactivation automatique des autres templates par défaut du même couple canal/langue).
- `updateTemplate(id: string, updates: Partial<CertificationMessageTemplate>)`
  - Met à jour un modèle existant.
- `deleteTemplate(id: string)`
  - Supprime un modèle personnalisé.
- `setDefaultTemplate(id: string, channel: VerificationChannel, language: string)`
  - Définit un template comme étant la référence par défaut.
- `renderTemplate(template: CertificationMessageTemplate, variables: Partial<TemplateVariables>)`
  - Effectue le rendu du sujet et du corps du message en appliquant les variables.
- `getDefaultTemplatesData(): CertificationMessageTemplateInsert[]`
  - Fournit le jeu de templates système initial prêt à être inséré.

### 5.3 `certificationBodiesService.ts`

- `detectBestChannel(body: CertificationBody): VerificationChannel`
  - Algorithme pur déterminant le meilleur canal pour un organisme certificateur.
- `getCertificationBodies(filters?: CertificationBodyFilters, page?: number, pageSize?: number)`
  - Recherche paginée multicritères (recherche plein texte, région, présence d'API, filtre actif).
- `getCertificationBodyById(id: string)`
  - Récupère la fiche détaillée avec ses standards associés et contacts référents.
- `createCertificationBody(body: CertificationBodyInsert)`
  - Enregistre un nouvel organisme.
- `updateCertificationBody(id: string, updates: Partial<CertificationBody>)`
  - Met à jour les métadonnées et coordonnées de l'organisme.
- `deactivateCertificationBody(id: string)`
  - Désactive un organisme (`is_active = false`, suppression douce).
- `importCertificationBodies(bodies: CertificationBodyInsert[]): Promise<{ inserted: number, errors: string[] }>`
  - Importe un lot d'organismes en interceptant les doublons sans interrompre la séquence.

---

## 📐 Guide des types TypeScript

```typescript
// Exemples d'interfaces issues de src/lib/supabase.ts

export type CertificationRegion = 
  | 'Africa' 
  | 'Asia' 
  | 'Latin America' 
  | 'Europe' 
  | 'North America' 
  | 'Oceania' 
  | 'Middle East';

export type VerificationChannel = 
  | 'api' 
  | 'email' 
  | 'form' 
  | 'whatsapp' 
  | 'phone' 
  | 'manual';

export type ProducerCertificationStatus = 
  | 'unverified' 
  | 'pending' 
  | 'contact_sent' 
  | 'verified' 
  | 'rejected' 
  | 'expired' 
  | 'manual_required';

export interface VerificationResult {
  success: boolean;
  channel: VerificationChannel;
  status: ProducerCertificationStatus;
  message: string;
  request_id?: string;
  external_url?: string;
  error?: string;
}

export interface TemplateVariables {
  producer_name: string;
  certificate_number: string;
  certification_type: string;
  certification_body_name: string;
  issued_at: string;
  expires_at: string;
  document_url?: string;
  platform_name: string;
  admin_name: string;
  admin_email: string;
}
```

---

## 👤 Guide d'utilisation administrateur

### 7.1 Accès à l'espace
Dans la barre de navigation d'administration, cliquez sur **"Certifications & Audit"** pour accéder au tableau de bord.

### 7.2 Tableau de bord
- **KPIs globaux** : Nombre total de certificats, certificats en attente, certificats vérifiés, taux de conformité.
- **Alerte Expirations Proches** : Liste prioritaire des certifications expirant sous 30 jours pour relance anticipée.
- **Répartition géographique** : Visualisation des dossiers par région (Afrique, Asie, Amérique Latine, Europe).

### 7.3 Vérifier une certification en 1 clic
1. Ouvrez l'onglet **"Certifications producteurs"**.
2. Filtrez par statut **"Non vérifié"** (`unverified`).
3. Cliquez sur la ligne du producteur pour afficher son dossier d'audit.
4. Cliquez sur le bouton principal **"Vérifier en 1 clic"**.
5. Le système déclenche automatiquement l'action adaptée (API directe, préparation d'email, redirection vers le portail officiel de l'organisme ou lien WhatsApp).
6. Une fois le retour officiel obtenu de l'organisme, cliquez sur **"Enregistrer une réponse"**, sélectionnez le statut (`verified` ou `rejected`), saisissez la note d'audit et validez.

---

## 📋 Procédures d'administration

### 8.1 Requêtes SQL d'audit utiles

```sql
-- 1. Répartition des certifications par statut
SELECT status, COUNT(*) AS total
FROM producer_certifications
GROUP BY status
ORDER BY total DESC;

-- 2. Certifications expirant dans les 30 prochains jours
SELECT 
  pc.certificate_number,
  p.name AS producer_name,
  cb.name AS certification_body,
  pc.expires_at
FROM producer_certifications pc
JOIN producers p ON p.id = pc.producer_id
LEFT JOIN certification_bodies cb ON cb.id = pc.certification_body_id
WHERE pc.expires_at BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
  AND pc.status != 'expired'
ORDER BY pc.expires_at ASC;

-- 3. Couverture des organismes par région
SELECT 
  region,
  COUNT(*) AS total_organismes,
  COUNT(CASE WHEN api_endpoint IS NOT NULL THEN 1 END) AS avec_api,
  COUNT(CASE WHEN email_contact IS NOT NULL THEN 1 END) AS avec_email
FROM certification_bodies
GROUP BY region
ORDER BY total_organismes DESC;
```

---

## 🌍 Couverture géographique

| Région | Organismes référencés | Pays couverts | Spécialités dominantes |
|---|---|---|---|
| **Afrique** | 12+ organismes | Kenya, Madagascar, Éthiopie, Côte d'Ivoire, Ouganda, Tanzanie, Ghana, Maroc, Afrique du Sud, Rwanda | Cacao équitable, Café d'altitude, Vanille, Karité, Épices Bio |
| **Asie** | 12+ organismes | Inde, Sri Lanka, Indonésie, Vietnam, Thaïlande, Japon, Philippines | Thé Bio & Biodynamie, Épices, Riz durable, Caoutchouc éthique |
| **Amérique Latine** | 12+ organismes | Pérou, Colombie, Mexique, Brésil, Bolivie, Équateur, Costa Rica, Guatemala | Café équitable (SPP), Cacao fin, Quinoa Bio, Sucre non raffiné |
| **Europe & International** | 20+ organismes | France, Allemagne, Suisse, Italie, UK, Suède, USA, Global | Bio UE, Demeter, Fairtrade International, Rainforest Alliance, B Corp |

---

## 🧪 Tests unitaires, d'intégration et de sécurité

Le projet intègre une suite de tests automatisés basée sur **Vitest** et `@vitest/coverage-v8`.

### 10.1 Commandes de test

```bash
# Exécution unique de tous les tests
npm run test

# Mode écoute interactif pour le développement
npm run test:watch

# Génération du rapport de couverture de code
npm run test:coverage
```

### 10.2 Synthèse des tests

| Suite de tests | Fichier | Tests | Couverture |
|---|---|---|---|
| **Vérification & Cascade** | `src/test/certificationVerificationService.test.ts` | 27 tests | > 85% |
| **Templates & Rendu** | `src/test/certificationTemplatesService.test.ts` | 17 tests | > 90% |
| **Organismes & Annuaire** | `src/test/certificationBodiesService.test.ts` | 17 tests | > 85% |
| **Workflows d'intégration** | `src/test/certificationWorkflow.test.ts` | 7 tests | 100% (flux) |
| **Sécurité & RLS** | `src/test/certificationPermissions.test.ts` | 4 tests | 100% (règles) |
| **Total** | **5 fichiers de tests** | **72 tests** | **86% global** |

---

## 🔒 Sécurité & conformité

1. **Row Level Security (RLS) stricte** :
   - Lecture publique sécurisée pour les référentiels et organismes actifs.
   - Écriture et administration limitées aux comptes avec `role = 'admin'`.
2. **Immuabilité des journaux d'audit** :
   - La table `certification_verification_logs` autorise uniquement les opérations `SELECT` et `INSERT`.
   - Les opérations `UPDATE` et `DELETE` sont rejetées au niveau du moteur PostgreSQL pour garantir la valeur probante des audits.
3. **Résilience des appels externes** :
   - Timeout automatique de 10 secondes sur tous les appels d'API externes avec capture des exceptions réseau sans blocage de l'interface utilisateur.

---

## 🚀 Évolutions futures suggérées

### Priorité Haute
- [ ] Connecteurs natifs vers les registres en temps réel (Ecocert Client Portal API, TRACES NT UE).
- [ ] Tâche Cron automatisée de notification email aux administrateurs pour les certificats expirant à J-30.

### Priorité Moyenne
- [ ] Carte géographique interactive SVG/Mapbox des coopératives certifiées dans le monde.
- [ ] Générateur de certificats d'audit EthiMarket au format PDF sécurisé par QR Code.

### Priorité Basse
- [ ] Reconnaissance optique de caractères (OCR) sur les fichiers PDF téléversés pour pré-remplir le numéro de certificat et la date d'expiration.

---

## 📜 Historique des versions & Changelog

## [1.0.0] - 2026-08-14

### Ajouté
- Migration SQL complète créant les 7 tables d'audit et les ENUMs associés.
- Seed de 77 organismes de certification mondiaux couvrant l'Afrique, l'Asie, l'Amérique Latine et l'Europe.
- Moteur de vérification en 1 clic avec cascade de 6 canaux de contact.
- 6 interfaces d'administration complètes (Dashboard, Liste, Détail, Annuaire, Fiche organisme, Templates).
- Moteur de templates multilingues avec variables dynamiques.
- Suite complète de 72 tests unitaires, d'intégration et de sécurité Vitest.

---

## 📞 Contacts et support

- **Dépôt GitHub** : [https://github.com/Huberaya/ethimarket.git](https://github.com/Huberaya/ethimarket.git)
- **Branche de production** : `main`
- **Signalement d'organisme manquant** : Ouvrez une Issue GitHub avec le label `certification-body-request`.
