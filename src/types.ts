export interface Margins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export type ItemType =
  | 'text'
  | 'shape'
  | 'ellipse'
  | 'line'
  | 'image'
  | 'qrcode'
  | 'barcode'
  | 'tier_price'
  | 'restricted_area';

export interface BaseItemProperties {
  id: string;
  type: ItemType;
  x_mm: number;
  y_mm: number;
  w_mm: number;
  h_mm: number;
  rotation: number;
  z_index: number;
  locked: boolean;
  binding_key?: string;
}

export interface TextShadowConfig {
  enabled: boolean;
  color: string;
  blur_px: number;
  offset_x_px: number;
  offset_y_px: number;
}

export interface TextItemProperties extends BaseItemProperties {
  type: 'text';
  text: string;
  font_family: string;
  font_size_pt: number;
  font_weight: 'normal' | '500' | '600' | 'bold' | '800';
  font_style: 'normal' | 'italic';
  text_decoration: 'none' | 'underline' | 'line-through' | 'underline line-through';
  text_color: string;
  alignment: 'left' | 'center' | 'right' | 'justify';
  valign: 'top' | 'middle' | 'bottom';
  wrap: boolean;
  overflow: 'autofit_shrink' | 'clip' | 'overflow';
  letter_spacing_pt?: number;
  line_height_multiplier?: number;
  text_transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  prefix_text?: string;
  suffix_text?: string;
  fill_color?: string;
  border_color?: string;
  border_width?: number;
  corner_radius?: number;
  placeholder?: string;

  // Rich Typography & Advanced Styling Tools
  highlight_color?: string; // background text highlight
  text_shadow?: TextShadowConfig;
  subscript_superscript?: 'none' | 'subscript' | 'superscript';
  strikethrough_color?: string;

  // Dedicated Price & Currency separate typography & configuration
  is_price?: boolean;
  currency_symbol?: string; // e.g. "FCFA", "€", "$", "MAD", "DZD", "CHF", "£"
  currency_position?: 'after' | 'before' | 'superscript' | 'subscript';
  currency_font_family?: string;
  currency_font_size_pt?: number;
  currency_font_weight?: 'normal' | '500' | '600' | 'bold' | '800';
  currency_font_style?: 'normal' | 'italic';
  currency_color?: string;
  currency_spacing_pt?: number;

  // Promotion badge presets
  promo_badge_type?:
    | 'standard'
    | 'discount_pct'
    | 'slashed_price'
    | 'bogo'
    | 'flash_sale'
    | 'unit_price'
    | 'promo_period'
    | 'eco_tax';
}

export interface ShapeItemProperties extends BaseItemProperties {
  type: 'shape';
  fill_color: string;
  border_color: string;
  border_width: number;
  corner_radius: number;
}

export interface EllipseItemProperties extends BaseItemProperties {
  type: 'ellipse';
  fill_color: string;
  border_color: string;
  border_width: number;
}

export interface LineItemProperties extends BaseItemProperties {
  type: 'line';
  color: string;
  thickness: number;
  style: 'solid' | 'dashed' | 'dotted';
}

export interface ImageItemProperties extends BaseItemProperties {
  type: 'image';
  source?: string;
  keep_aspect_ratio: boolean;
  opacity: number;
}

export interface QRCodeItemProperties extends BaseItemProperties {
  type: 'qrcode';
  content: string;
  module_color: string;
  background_color: string;
}

export interface BarcodeItemProperties extends BaseItemProperties {
  type: 'barcode';
  code: string;
  barcode_type: 'code128' | 'ean13';
  show_text: boolean;
  bar_color: string;
}

export interface TierPriceItemProperties extends BaseItemProperties {
  type: 'tier_price';
  primary_tier: number; // 1, 2, 3...
  prefix_text: string; // e.g. "À partir de", "Par carton de"
  unit_label: string; // "FCFA", "€", "$"
  strict_required: boolean;
  fallback_to_base_price?: boolean;
}

export interface RestrictedAreaItemProperties extends BaseItemProperties {
  type: 'restricted_area';
  label: string; // e.g. "Zone Réservée / Capteur", "Marge d'encollage"
  pattern: 'diagonal_stripes' | 'solid' | 'cross' | 'outline';
  zone_color: string; // e.g. "#ef4444"
  opacity: number; // 0.15 to 0.75
  warn_on_overlap: boolean;
}

export type TemplateItem =
  | TextItemProperties
  | ShapeItemProperties
  | EllipseItemProperties
  | LineItemProperties
  | ImageItemProperties
  | QRCodeItemProperties
  | BarcodeItemProperties
  | TierPriceItemProperties
  | RestrictedAreaItemProperties;

export interface CalibrationImageConfig {
  url: string;
  opacity: number; // 0 to 1
  offset_x_mm: number;
  offset_y_mm: number;
  scale_pct: number; // 50 to 200
  visible: boolean;
  locked: boolean;
  print_in_output: boolean; // whether to include in print/PDF output or keep as reference overlay only
}

export interface LabelTemplate {
  schema_version: number;
  name: string;
  width_mm: number;
  height_mm: number;
  inner_margins_mm: Margins;
  outer_margins_mm: Margins;
  bg_color: string;
  bg_opacity: number;
  background_image_path?: string | null;
  background_image_opacity?: number;
  background_image_fit?: 'contain' | 'cover' | 'stretch';
  background_image_visible?: boolean;
  background_image_locked?: boolean;
  background_image_in_output?: boolean;
  calibration_image?: CalibrationImageConfig | null;
  items: TemplateItem[];
}

export interface DomainField {
  key: string;
  label: string;
  value_type: 'text' | 'currency' | 'barcode' | 'number' | 'date' | 'promo';
  aliases: string[];
  numeric?: boolean;
}

export interface PriceTier {
  qty: number;
  unit_price: number;
}

export interface ProductRecord {
  id: string;
  STORE_NAME?: string;
  PRODUCT_SCAN?: string;
  PARTNO?: string;
  ITEMNAME: string;
  ITEMDESCRIPTION?: string;
  DIV_NAME?: string;
  DEPT_NAME?: string;
  CATEGORY_NAME?: string;
  SUB_CATEGORY_NAME?: string;
  BRAND_INFO?: string;
  PACK_UNIT?: string;
  VENDOR_NAME?: string;
  SELLING_UNIT?: string;
  SELLING_PRICE: number;
  PROMOPRICE?: number;
  DISCOUNT_PCT?: number; // e.g. 20 for -20%
  PROMO_LABEL?: string; // e.g. "1 ACHETÉ = 1 OFFERT", "VENTE FLASH"
  PROMO_START_DATE?: string;
  PROMO_END_DATE?: string;
  PROMO_PERIOD?: string; // e.g. "Du 15 au 30 Mai"
  UNIT_PRICE_TEXT?: string; // e.g. "12.50 € / kg"
  ECO_TAX?: string; // e.g. "Dont 0,15 € d'éco-part"
  ORIGIN_COUNTRY?: string; // e.g. "Origine France"
  ITEM_TYPE?: string;
  CASE_SIZE?: number;
  CASE_UNIT?: string;
  TAX?: string;
  TAX_RATE?: number;
  TAX_TYPE?: string;
  IMAGE_PATH?: string;
  TIERS?: PriceTier[];
  [custom_key: string]: any;
}

export interface ImpositionConfig {
  page_size: 'A4' | 'A3' | 'A5' | 'A6' | 'LETTER' | 'CUSTOM';
  orientation: 'portrait' | 'landscape';
  gap_mm: number;
  gap_x_mm?: number;
  gap_y_mm?: number;
  margin_top_mm?: number;
  margin_bottom_mm?: number;
  margin_left_mm?: number;
  margin_right_mm?: number;
  show_cut_marks: boolean;
  calibration_x_mm?: number;
  calibration_y_mm?: number;
  custom_page_w_mm?: number;
  custom_page_h_mm?: number;
}

export interface ImpositionCalculation {
  page_w_mm: number;
  page_h_mm: number;
  cols: number;
  rows: number;
  total_per_page: number;
  horizontal_offset_mm: number;
  vertical_offset_mm: number;
  label_total_w_mm: number;
  label_total_h_mm: number;
}
