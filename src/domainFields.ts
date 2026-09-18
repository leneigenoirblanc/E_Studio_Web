import { DomainField } from './types';

export const DOMAIN_FIELDS: DomainField[] = [
  { key: 'STORE_NAME', label: 'Nom du magasin', value_type: 'text', aliases: ['STORE', 'MAGASIN', 'ENSEIGNE'] },
  { key: 'PRODUCT_SCAN', label: 'Code-barres produit (EAN/GTIN)', value_type: 'barcode', aliases: ['EAN', 'GTIN', 'BARCODE', 'CB', 'CODE_BARRE', 'GENCOD'] },
  { key: 'PARTNO', label: 'Référence / SKU', value_type: 'text', aliases: ['SKU', 'PART NUMBER', 'REF', 'REFERENCE', 'CODE_ARTICLE'] },
  { key: 'ITEMNAME', label: 'Nom / Désignation article', value_type: 'text', aliases: ['PRODUCT NAME', 'NAME', 'DESIGNATION', 'LIBELLE', 'ARTICLE', 'PRODUIT'] },
  { key: 'ITEMDESCRIPTION', label: 'Description détaillée', value_type: 'text', aliases: ['DESCRIPTION', 'DETAIL', 'SOUS_TITRE'] },
  { key: 'DIV_NAME', label: 'Division', value_type: 'text', aliases: ['DIV.NAME', 'DIVISION', 'SECTEUR'] },
  { key: 'DEPT_NAME', label: 'Département', value_type: 'text', aliases: ['DEPARTMENT', 'DEP'] },
  { key: 'CATEGORY_NAME', label: 'Catégorie / Rayon', value_type: 'text', aliases: ['CATEGORY', 'FAMILLE', 'RAYON'] },
  { key: 'SUB_CATEGORY_NAME', label: 'Sous-catégorie', value_type: 'text', aliases: ['SUBCATEGORY', 'SOUS_FAMILLE'] },
  { key: 'BRAND_INFO', label: 'Marque', value_type: 'text', aliases: ['BRAND', 'MARQUE', 'FABRICANT'] },
  { key: 'PACK_UNIT', label: 'Conditionnement', value_type: 'text', aliases: ['PACK', 'CONDITIONNEMENT', 'FORMAT', 'CONTENANCE'] },
  { key: 'VENDOR_NAME', label: 'Fournisseur', value_type: 'text', aliases: ['VENDOR', 'FOURNISSEUR'] },
  { key: 'SELLING_UNIT', label: 'Unité de vente', value_type: 'text', aliases: ['UNITE', 'UNIT', 'UVC'] },
  { key: 'SELLING_PRICE', label: 'Prix de vente (Standard)', value_type: 'currency', aliases: ['PRICE', 'PRIX', 'PRIX_VENTE', 'PV', 'PRIX_UNITAIRE', 'PRIX_STD'], numeric: true },
  
  // Comprehensive Promotion fields
  { key: 'PROMOPRICE', label: 'Prix promotionnel (Prix Choc)', value_type: 'currency', aliases: ['PROMO PRICE', 'PROMO', 'PRIX_PROMO', 'PV_PROMO', 'NOUVEAU_PRIX'], numeric: true },
  { key: 'DISCOUNT_PCT', label: 'Taux de Remise (%)', value_type: 'number', aliases: ['REMISE', 'POURCENTAGE', 'DISCOUNT', 'REDUC', 'PROMO_%', 'TAUX_REMISE'], numeric: true },
  { key: 'PROMO_LABEL', label: 'Libellé Promo (BOGO / Flash)', value_type: 'promo', aliases: ['OFFRE', 'PROMO_TEXT', 'PROMOTION', 'TYPE_PROMO', 'MESSAGE_PROMO', 'BADGE'] },
  { key: 'PROMO_PERIOD', label: 'Période de Validité Promo', value_type: 'date', aliases: ['DATES_PROMO', 'VALIDITE', 'PERIODE', 'DATE_PROMO', 'VALID_UNTIL'] },
  { key: 'UNIT_PRICE_TEXT', label: 'Prix au Kg / Litre / Unité', value_type: 'text', aliases: ['PRIX_KILO', 'PRIX_LITRE', 'PRIX_POIDS', 'PRIX_MESURE', 'UNIT_PRICE'] },
  { key: 'ECO_TAX', label: 'Éco-participation / DIB', value_type: 'text', aliases: ['ECO_PART', 'ECO_TAXE', 'DEEE', 'TAXE_ECO'] },
  { key: 'ORIGIN_COUNTRY', label: 'Pays d\'Origine', value_type: 'text', aliases: ['ORIGINE', 'PAYS', 'ORIGIN', 'PROVENANCE'] },

  { key: 'ITEM_TYPE', label: 'Type article', value_type: 'text', aliases: ['TYPE'] },
  { key: 'CASE_SIZE', label: 'Taille carton / Colisage', value_type: 'number', aliases: ['CASE QTY', 'COLISAGE', 'PCB'], numeric: true },
  { key: 'CASE_UNIT', label: 'Unité carton', value_type: 'text', aliases: ['UNITE_COLIS'] },
  { key: 'TAX', label: 'Taxe / TVA', value_type: 'text', aliases: ['TVA', 'TAX'] },
  { key: 'TAX_RATE', label: 'Taux de taxe (%)', value_type: 'number', aliases: ['VAT RATE', 'TAUX_TVA'], numeric: true },
  { key: 'TAX_TYPE', label: 'Type de taxe', value_type: 'text', aliases: ['TYPE_TAXE'] },
  { key: 'IMAGE_PATH', label: 'Image produit', value_type: 'text', aliases: ['IMAGE', 'PHOTO', 'PICTURE'] },
];

export const DOMAIN_FIELD_MAP = new Map(DOMAIN_FIELDS.map(f => [f.key, f]));

export function resolveCanonicalKey(inputHeader: string): string | null {
  if (!inputHeader) return null;
  const norm = inputHeader.trim().toUpperCase().replace(/[\s\.\-]+/g, '_');
  if (DOMAIN_FIELD_MAP.has(norm)) return norm;

  // 1. Enhanced Regex for Promo Price detection
  if (
    /^(PRIX_?PROMO|PROMO_?PRIX|PROMO_?PRICE|PV_?PROMO|NOUVEAU_?PRIX|PRIX_?SOLDE|SOLDE|SPECIAL_?PRICE|PRIX_?SPECIAL|DISCOUNT_?PRICE|PRIX_?REMISE|REMISE_?PRIX|PRIX_?CHOC|BARRE_?PRIX|PROMO)$/i.test(norm) ||
    (norm.includes('PROMO') && !norm.includes('TEXT') && !norm.includes('LABEL') && !norm.includes('PERIODE') && !norm.includes('DATE') && !norm.includes('MESSAGE') && !norm.includes('BADGE') && !norm.includes('%') && !norm.includes('PCT'))
  ) {
    return 'PROMOPRICE';
  }

  // 2. Enhanced Regex for Standard Selling Price
  if (/^(PRIX|PRICE|PRIX_?VENTE|PV|PRIX_?STD|PRIX_?UNITAIRE|PRIX_?STANDARD|STANDARD_?PRICE|SELLING_?PRICE)$/i.test(norm)) {
    return 'SELLING_PRICE';
  }

  // 3. Check explicit domain aliases
  for (const field of DOMAIN_FIELDS) {
    for (const alias of field.aliases) {
      const aliasNorm = alias.trim().toUpperCase().replace(/[\s\.\-]+/g, '_');
      if (norm === aliasNorm) return field.key;
    }
  }

  return null;
}
