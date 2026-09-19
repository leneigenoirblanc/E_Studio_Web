# E-Studio — Solution Complète de Création & Génération d'Étiquettes de Prix

**E-Studio** est une suite logicielle professionnelle conçue pour la création vectorielle, la mise en page assistée et l'impression industrielle en masse d'étiquettes de prix de vente (facing, gondoles, îlots, étiquettes promotionnelles, démarques et étiquettes grossiste/demi-gros).

L'application est disponible sous deux déclinaisons partageant les mêmes concepts et formats de gabarits :
1. **E-Studio Web** : Application moderne full-web en **React 18 / TypeScript / Vite / Tailwind CSS**, déployée dans le cloud et immédiatement utilisable sans installation.
2. **E-Studio Desktop** : Application logicielle autonome en **Python / PySide6 / ReportLab**, pour les postes locaux et les environnements fermés.

---

## Sommaire

- [1. Présentation Générale & Objectifs](#1-présentation-générale--objectifs)
- [2. Fonctionnalités Détaillées](#2-fonctionnalités-détaillées)
  - [2.1 Bibliothèque & Gestion des Gabarits](#21-bibliothèque--gestion-des-gabarits)
  - [2.2 Éditeur Visuel WYSIWYG de Gabarit](#22-éditeur-visuel-wysiwyg-de-gabarit)
  - [2.3 Objets Graphiques & Composants Métiers](#23-objets-graphiques--composants-métiers)
  - [2.4 Moteur Métier Retail & Tarification (PricingEngine)](#24-moteur-métier-retail--tarification-pricingengine)
  - [2.5 Espace de Génération, Import de Données & Mapping](#25-espace-de-génération-import-de-données--mapping)
  - [2.6 Moteur d'Imposition & Planches d'Impression](#26-moteur-dimposition--planches-dimpression)
  - [2.7 Formats d'Exportation Multiples (PDF, PPTX, ZPL, JSON)](#27-formats-dexportation-multiples-pdf-pptx-zpl-json)
- [3. Fonctionnement & Workflow du Programme](#3-fonctionnement--workflow-du-programme)
- [4. Spécifications Techniques du Format de Gabarit (.json)](#4-spécifications-techniques-du-format-de-gabarit-json)
- [5. Raccourcis Clavier](#5-raccourcis-clavier)
- [6. Installation & Démarrage](#6-installation--démarrage)

---

## 1. Présentation Générale & Objectifs

Dans la grande distribution et le commerce de détail, la production d'étiquettes de prix nécessite une grande précision millimétrique, le respect des normes d'affichage légales (prix au kilo/litre, mentions obligatoires, codes-barres lisibles) et la capacité d'automatiser des séries de milliers de produits à partir d'extractions ERP / tableurs (Excel, CSV).

**E-Studio** résout cette problématique en unifiant :
- Un outil de conception visuelle au millimètre près, avec gestion des marges de sécurité d'impression (*inner margins*) et des marges perdues (*bleed / outer margins*).
- Un puissant moteur de liaison de données capable d'associer automatiquement les colonnes d'un fichier source aux éléments de l'étiquette.
- Une détection par Regex et alias canoniques pour réconcilier les libellés de prix courants (`PRIX_PROMO`, `PV_PROMO`, `PRIX_SOLDE`, `PRIX_VENTE`, etc.).
- Une gestion native des paliers tarifaires (dégressivité selon la quantité achetée pour les grossistes).
- Un calculateur d'imposition sur planches papier (A4, A3, Letter) avec espacement millimétrique personnalisable et repères de coupe.

---

## 2. Fonctionnalités Détaillées

### 2.1 Bibliothèque & Gestion des Gabarits
- **Catalogue Avery prédéfini** : Gabarits standardisés prêts à l'emploi (formats étagère 100x50 mm, étiquettes promo choc 70x35 mm, balisage XL 140x70 mm, etc.).
- **Assistant de Création de Gabarit (Wizard)** : Définition intuitive du nom, de la largeur, de la hauteur, des marges intérieures (zone d'impression utile) et des marges extérieures de débord.
- **Import / Export JSON universel** : Sauvegarde et portabilité complète des modèles créés.
- **Duplication & Personnalisation** : Cloner un gabarit en un clic pour décliner une charte graphique.

### 2.2 Éditeur Visuel WYSIWYG de Gabarit
- **Canvas millimétrique à échelle réelle** : Respect strict du ratio millimètre/pixel avec zoom dynamique (50% à 400%) et défilement panoramique.
- **Règles millimétriques interactives (CanvasRulers)** : Barres de mesures horizontales et verticales graduées en millimètres avec indicateur de position du curseur en temps réel.
- **Grille Magnétique Configurable** : Alignement automatique avec réglage du pas de la grille (`0.5 mm`, `1 mm`, `2 mm`, `5 mm`, `10 mm`).
- **Guides Intelligents (Smart Guides)** : Détection dynamique de l'alignement et des espacements entre objets lors du déplacement ou du redimensionnement.
- **Image de Calibration / Fond de Calque** : Possibilité de charger une photo ou un scan d'une étiquette physique existante avec réglage de l'opacité pour reproduire fidèlement une étiquette au millimètre près.
- **Historique Annuler / Rétablir (Undo/Redo)** : Pile d'historique avec indicateur visuel de position (badge `#1/1`).
- **Outil Global "Rechercher et Remplacer" (`Ctrl+F`)** : Modal permettant de chercher et remplacer dans tout le gabarit :
  - Par contenu textuel (avec option sensible à la casse).
  - Par nom de police de caractères.
  - Par couleur hexadécimale (remplacement en masse d'une teinte ou couleur de marque).
- **Aide Raccourcis Clavier** : Modal d'aide détaillant l'ensemble des commandes rapides.
- **Outils d'Agencement Avancés** :
  - Alignements groupés : Gauche, Centre horizontal, Droite, Haut, Milieu vertical, Bas.
  - Distribution équitable : Espacement horizontal ou vertical uniforme.
  - Gestion des plans : Premier plan, Arrière-plan, Avancer, Reculer.
  - Copier et Coller de styles graphiques (polices, couleurs, bordures).
  - Verrouillage d'éléments pour éviter les déplacements accidentels.

### 2.3 Objets Graphiques & Composants Métiers
Le ruban **Insérer** offre une gamme complète d'éléments vectoriels et métier :
- **Texte Standard & Riche** : Choix des polices (standard, monospace, serif), taille en points, graisses, italique, souligné, barré, alignements horizontaux et verticaux, couleur, encadrement et fond.
- **Formes Géométriques** : Rectangles, carrés, arrondis d'angles (*border-radius*), fonds de couleur, bordures vectorielles.
- **Ellipses & Cercles** : Formes arrondies pour pastilles de réduction et médaillons promotionnels.
- **Lignes de Séparation** : Lignes horizontales ou obliques avec épaisseur et couleur personnalisables.
- **Codes-Barres 1D Vectoriels** : Génération native de formats **EAN-13** et **Code 128** avec validation de clé de contrôle et rendu vectoriel haute netteté.
- **QR Codes 2D Vectoriels** : Encodage de liens web, fiches produits ou identifiants internes.
- **Paliers de Prix Dégressifs (`tier_price`)** : Bloc métier affichant automatiquement les prix dégressifs par quantité (ex: *1 carton = 1500 F, 5 cartons = 1350 F*), idéal pour le commerce de gros et demi-gros.
- **Texte Circulaire / Courbé (`curved_text`)** : Texte suivant une trajectoire circulaire (rayons, angle de départ, sens horaire/anti-horaire) pour les tampons ou sceaux de qualité.
- **Zones Restreintes Anti-Impression (`restricted_area`)** : Hachurage visuel délimitant une zone interdite (ex: cellule de détection de capteur d'imprimante thermique, perforation de gondole).
- **Pictogrammes Réglementaires (`pictogram`)** : Symboles normalisés (Origine France, Triman/Recyclage, Bio/AB, Danger, Consigne, etc.).
- **Images & Logos** : Intégration de visuels de marques ou photos produits avec conservation du ratio d'aspect.

### 2.4 Moteur Métier Retail & Tarification (`PricingEngine`)
Le moteur calcule automatiquement et dynamiquement les données complexes :
- **Calcul automatique du Prix Unitaire / Prix au Kilo / au Litre** :
  - Formule : `Prix / Poids ou Volume` selon les unités déclarées (`kg`, `g`, `l`, `cl`, `pièce`).
  - Détection automatique du prix de référence (prix promo prioritaire si actif, sinon prix standard).
- **Calcul automatique du Pourcentage de Remise** :
  - Calcule automatiquement `-XX%` à partir du `SELLING_PRICE` et du `PROMOPRICE`.
- **Conversion Multi-Devises** :
  - Conversion instantanée avec taux de change paramétrable (ex: conversion Francs CFA <-> Euros).
- **Gestion des Règles d'Affichage Conditionnel** :
  - Afficher un bandeau promo ou un prix barré uniquement si le produit est en promotion (`has_promo`).
  - Afficher un code-barres seulement si le code EAN est renseigné (`has_barcode`).
  - Afficher le tableau de paliers uniquement si le produit possède des tarifs de gros (`has_tiers`).
  - Filtrer sur un champ non vide ou strictement supérieur à zéro.
- **Reconnaissance Intelligente par Regex des Prix Promo & Standard** :
  - Résolution automatique des en-têtes de colonnes telles que : `PRIX_PROMO`, `PROMO_PRIX`, `PV_PROMO`, `NOUVEAU_PRIX`, `PRIX_SOLDE`, `DISCOUNT_PRICE`, `PRIX_VENTE`, `PV`, etc.

### 2.5 Espace de Génération, Import de Données & Mapping
- **Importation de Fichiers** : Prise en charge des fichiers **Excel (`.xlsx`, `.xlsm`)** et **CSV** (détection automatique des virgules, points-virgules et tabulations).
- **Assistant de Mise en Correspondance (`DataMappingModal`)** :
  - Détection automatique intelligente entre les en-têtes du fichier et les champs canoniques du commerce de détail (`ITEMNAME`, `SELLING_PRICE`, `PROMOPRICE`, `PRODUCT_SCAN`, `BRAND`, `ORIGIN`, etc.).
  - Aperçu instantané des données brutes avec possibilité d'ajuster chaque colonne manuellement.
- **Éditeur Tabulaire Intégré** :
  - Modification, ajout ou suppression de lignes de données directement dans l'interface sans réexporter le fichier Excel.
  - Ajout rapide de nouvelles références d'appoint.
- **Aperçu Dynamique en Direct** :
  - Carrousel de prévisualisation permettant de naviguer article par article pour vérifier le rendu exact de l'étiquette avant l'impression.

### 2.6 Moteur d'Imposition & Planches d'Impression
- **Support des Formats Papier** : **A4**, **A3**, **Letter**, en orientation **Portrait** ou **Paysage**.
- **Calculateur Mathématique de Poses** : Calcul automatique du nombre maximal d'étiquettes pouvant tenir sur une feuille en tenant compte des dimensions de l'étiquette et des marges de l'imprimante.
- **Espacements Millimétriques Paramétrables** :
  - Réglage indépendant de l'**espacement horizontal X (`gap_x_mm`)** et de l'**espacement vertical Y (`gap_y_mm`)**.
- **Enregistrement de la Disposition dans le Gabarit** :
  - Bouton *"Enregistrer cette disposition dans le gabarit"* permettant d'associer définitivement la planche d'impression (`default_imposition`) au modèle.
- **Réutilisation de Planches Entamées (*Start Offset Slot*)** :
  - Indication de la première case disponible pour réutiliser des planches d'autocollants déjà partiellement imprimées, évitant tout gaspillage.
- **Repères et Traits de Coupe (*Crop Marks*)** :
  - Tracé vectoriel précis des traits de coupe pour massicotage manuel ou massicot électrique.

### 2.7 Formats d'Exportation Multiples (PDF, PPTX, ZPL, JSON)
- **Exportation PDF Haute Définition** : Génération directe de planches d'étiquettes vectorielles ultra-nettes, prêtes pour l'impression jet d'encre, laser ou presse numérique.
- **Exportation Microsoft PowerPoint (`.pptx`)** : Génération de diapositives éditables avec textes et formes vectorielles natives.
- **Exportation Zebra ZPL II** : Traduction du gabarit en code natif ZPL pour l'impression thermique industrielle d'étiquettes adhésives en rouleau (Zebra, Citizen, TSC).
- **Exportation & Sauvegarde JSON** : Stockage léger, versionné et lisible par machine.

---

## 3. Fonctionnement & Workflow du Programme

Le fonctionnement d'E-Studio s'articule autour de 5 étapes clés :

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ 1. Choix ou     │  ───> │ 2. Édition du   │  ───> │ 3. Liaison des  │
│    Création du  │       │    Gabarit      │       │    Champs       │
│    Gabarit      │       │    (WYSIWYG)    │       │    (Data Keys)  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                                             │
                                                             ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ 5. Exportation  │  <─── │ 4. Imposition & │  <─── │ 3b. Import      │
│    & Impression │       │    Espacements  │       │     Excel / CSV │
│    (PDF, ZPL)   │       │    sur Planche  │       │     + Mapping   │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

1. **Étape 1 : Sélection ou création du gabarit**
   - Depuis l'écran d'accueil, choisissez un modèle existant ou cliquez sur **Nouveau Gabarit**.
   - Spécifiez la taille (ex: 100 x 50 mm) et les marges d'impression.
2. **Étape 2 : Conception graphique**
   - Ajoutez des champs texte, des rectangles, des codes-barres ou des logos.
   - Ajustez la typographie, les alignements et la hiérarchie visuelle.
3. **Étape 3 : Liaison des champs de données (*Binding Keys*)**
   - Associez les champs textes aux clés canoniques (`ITEMNAME`, `SELLING_PRICE`, `PROMOPRICE`, etc.).
   - Configurez les conditions (ex: afficher le prix barré uniquement si `has_promo`).
4. **Étape 4 : Import des articles et imposition**
   - Ouvrez l'espace **Générer**, importez votre fichier Excel ou CSV.
   - Validez les correspondances de colonnes.
   - Choisissez le format de feuille (ex: A4 Paysage) et réglez les espacements X/Y entre étiquettes.
5. **Étape 5 : Contrôle et production**
   - Feuilletez les étiquettes générées pour vous assurer du rendu.
   - Cliquez sur **Télécharger le PDF** ou exportez en **ZPL** pour votre imprimante thermique.

---

## 4. Spécifications Techniques du Format de Gabarit (.json)

Les gabarits E-Studio sont stockés dans un format JSON versionné structuré comme suit :

```json
{
  "schema_version": 1,
  "id": "template_promo_100x50",
  "name": "Balisage Promo 100x50",
  "width_mm": 100.0,
  "height_mm": 50.0,
  "inner_margins_mm": {
    "top": 2.0,
    "bottom": 2.0,
    "left": 2.0,
    "right": 2.0
  },
  "outer_margins_mm": {
    "top": 1.0,
    "bottom": 1.0,
    "left": 1.0,
    "right": 1.0
  },
  "bg_color": "#FFFFFF",
  "default_imposition": {
    "page_size": "A4",
    "orientation": "landscape",
    "gap_mm": 2.0,
    "gap_x_mm": 3.0,
    "gap_y_mm": 2.0,
    "show_cut_marks": true,
    "start_offset_slot": 0
  },
  "items": [
    {
      "id": "txt_title",
      "type": "text",
      "name": "Désignation Produit",
      "x_mm": 3.0,
      "y_mm": 4.0,
      "w_mm": 94.0,
      "h_mm": 12.0,
      "text": "Nom de l'article",
      "binding_key": "ITEMNAME",
      "font_family": "Arial",
      "font_size_pt": 14.0,
      "font_weight": "bold",
      "text_color": "#111827",
      "alignment": "left"
    }
  ]
}
```

---

## 5. Raccourcis Clavier

| Raccourci | Action |
| :--- | :--- |
| `Ctrl + Z` | Annuler la dernière action (*Undo*) |
| `Ctrl + Y` ou `Ctrl + Shift + Z` | Rétablir la dernière action (*Redo*) |
| `Ctrl + C` | Copier l'élément ou le style |
| `Ctrl + V` | Coller l'élément ou le style |
| `Ctrl + D` | Dupliquer l'élément sélectionné avec décalage |
| `Ctrl + A` | Sélectionner tous les éléments du canvas |
| `Ctrl + F` | Ouvrir la modal "Rechercher et Remplacer" |
| `Suppr` ou `Retour arrière` | Supprimer les éléments sélectionnés |
| `Flèches directionnelles` | Déplacer les éléments sélectionnés de 1 mm |
| `Shift + Flèches` | Déplacer les éléments sélectionnés de 5 mm |
| `Échap` | Désélectionner / Fermer la fenêtre modale |

---

## 6. Installation & Démarrage

### 6.1 Version Web (React / Vite)

L'application web s'exécute dans un environnement Node.js 18+ :

```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement (accessible sur le port 3000)
npm run dev

# Construction de l'application de production
npm run build
```

### 6.2 Version Desktop (Python / PySide6)

L'application de bureau fonctionne sous Windows, macOS et Linux avec Python 3.10+ :

```bash
# Création et activation de l'environnement virtuel
python -m venv .venv
source .venv/bin/activate  # Sur Windows: .venv\Scripts\activate

# Installation des bibliothèques nécessaires
pip install -r requirements.txt

# Lancement de l'application
python app.py
```

---

*Développé avec passion pour l'excellence opérationnelle et la précision graphique dans le commerce de détail.*
