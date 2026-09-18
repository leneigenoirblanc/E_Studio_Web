# E-Studio Desktop (Python / PySide6 / ReportLab)

Une application bureautique autonome complète pour la conception vectorielle d'étiquettes de prix de vente, la gestion des paliers de prix (grossiste & demi-gros), la liaison de données Excel/CSV et l'imposition automatique en planches d'impression PDF.

## 📦 Dépendances requises

Installez les dépendances via `pip` :

```bash
pip install -r requirements.txt
```

Ou individuellement :

```bash
pip install PySide6 reportlab python-barcode openpyxl qrcode[pil] pillow
```

## 🚀 Lancement de l'application

Lancez simplement le script avec Python 3 :

```bash
python estudio_desktop.py
```

## 🛠️ Fonctionnalités incluses

1. **Onglet 1 : Éditeur de Gabarit (Canvas interactif)** :
   - Manipulation directe sur un canvas millimétrique à échelle réelle (96 DPI).
   - Ajout de blocs textes, codes-barres (EAN-13, Code 128), formes géométriques, lignes séparatrices et composants de prix par palier.
   - Enregistrement et chargement de gabarits au format universel `.json`.

2. **Onglet 2 : Données & Paliers (Excel / CSV)** :
   - Import direct de feuilles de calcul Excel (`.xlsx`, `.xls`) ou de fichiers CSV.
   - Détection automatique des colonnes canoniques : magasin, rayon, désignation article, prix de vente, code EAN/GTIN.
   - Support des colonnes de paliers multi-niveaux (`TIER_1_QTY`, `TIER_1_PRICE`, `TIER_2_QTY`, etc.).

3. **Onglet 3 : Imposition & Export PDF Vectoriel** :
   - Calcul mathématique automatique du nombre de poses selon le format papier (A4, A3, Letter) et l'orientation (portrait/paysage).
   - Centrage automatique des marges pour éliminer les chutes de papier.
   - Tracé des repères et traits de coupe d'imprimerie (*crop marks*).
   - Génération directe de fichiers PDF vectoriels ultra-haute fidélité via ReportLab.
