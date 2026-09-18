import { DomainField } from './types';

export const DOMAIN_FIELDS: DomainField[] = [
  { key: 'STORE_NAME', label: 'Nom du magasin', value_type: 'text', aliases: ['STORE', 'MAGASIN'] },
  { key: 'PRODUCT_SCAN', label: 'Code-barres produit', value_type: 'barcode', aliases: ['EAN', 'GTIN', 'BARCODE', 'CB', 'CODE_BARRE'] },
  { key: 'PARTNO', label: 'Référence / SKU', value_type: 'text', aliases: ['SKU', 'PART NUMBER', 'REF', 'REFERENCE'] },
  { key: 'ITEMNAME', label: 'Nom article', value_type: 'text', aliases: ['PRODUCT NAME', 'NAME', 'DESIGNATION', 'LIBELLE', 'ARTICLE'] },
  { key: 'ITEMDESCRIPTION', label: 'Description', value_type: 'text', aliases: ['DESCRIPTION', 'DETAIL'] },
  { key: 'DIV_NAME', label: 'Division', value_type: 'text', aliases: ['DIV.NAME', 'DIVISION', 'RAYON'] },
  { key: 'DEPT_NAME', label: 'Département', value_type: 'text', aliases: ['DEPARTMENT', 'DEP'] },
  { key: 'CATEGORY_NAME', label: 'Catégorie', value_type: 'text', aliases: ['CATEGORY', 'FAMILLE'] },
  { key: 'SUB_CATEGORY_NAME', label: 'Sous-catégorie', value_type: 'text', aliases: ['SUBCATEGORY', 'SOUS_FAMILLE'] },
  { key: 'BRAND_INFO', label: 'Marque', value_type: 'text', aliases: ['BRAND', 'MARQUE'] },
  { key: 'PACK_UNIT', label: 'Unité de conditionnement', value_type: 'text', aliases: ['PACK', 'CONDITIONNEMENT'] },
  { key: 'VENDOR_NAME', label: 'Fournisseur', value_type: 'text', aliases: ['VENDOR', 'FOURNISSEUR'] },
  { key: 'SELLING_UNIT', label: 'Unité de vente', value_type: 'text', aliases: ['UNITE', 'UNIT'] },
  { key: 'SELLING_PRICE', label: 'Prix de vente', value_type: 'currency', aliases: ['PRICE', 'PRIX', 'PRIX_VENTE', 'PV'], numeric: true },
  { key: 'PROMOPRICE', label: 'Prix promotionnel', value_type: 'currency', aliases: ['PROMO PRICE', 'PROMO', 'PRIX_PROMO'], numeric: true },
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
  const norm = inputHeader.trim().toUpperCase().replace(/[\s\.\-]+/g, '_');
  if (DOMAIN_FIELD_MAP.has(norm)) return norm;
  for (const field of DOMAIN_FIELDS) {
    for (const alias of field.aliases) {
      const aliasNorm = alias.trim().toUpperCase().replace(/[\s\.\-]+/g, '_');
      if (norm === aliasNorm) return field.key;
    }
  }
  return null;
}
