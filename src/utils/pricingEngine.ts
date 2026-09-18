import { ProductRecord, TextItemProperties, TemplateItem } from '../types';

/**
 * Advanced Retail & Pricing Engine for E-Studio
 * Handles automatic unit price per kg/L, discount percentage, 
 * secondary currency conversion, dynamic dates (DLC/DLUO), and conditional display rules.
 */
export class PricingEngine {
  /**
   * Evaluates whether an item should be rendered based on its conditional display configuration
   */
  static shouldDisplayItem(item: TemplateItem, record?: ProductRecord | null): boolean {
    if (!item.conditional_display || !item.conditional_display.enabled) {
      return true;
    }

    if (!record) return true;

    const { rule, field_key } = item.conditional_display;

    switch (rule) {
      case 'has_promo':
        return (
          record.PROMOPRICE !== undefined &&
          record.PROMOPRICE !== null &&
          record.PROMOPRICE > 0 &&
          record.PROMOPRICE < record.SELLING_PRICE
        );

      case 'has_barcode':
        return Boolean(record.PRODUCT_SCAN && record.PRODUCT_SCAN.trim().length > 0);

      case 'has_tiers':
        return Boolean(record.TIERS && record.TIERS.length > 0);

      case 'field_gt_zero': {
        const key = field_key || item.binding_key;
        if (!key) return true;
        const val = record[key];
        const num = typeof val === 'number' ? val : parseFloat(String(val || 0));
        return !isNaN(num) && num > 0;
      }

      case 'field_not_empty': {
        const key = field_key || item.binding_key;
        if (!key) return true;
        const val = record[key];
        return val !== undefined && val !== null && String(val).trim() !== '';
      }

      case 'always':
      default:
        return true;
    }
  }

  /**
   * Resolves dynamic calculated text values for text items (Unit price / Discount % / Secondary currency / Dynamic dates)
   */
  static resolveCalculatedText(item: TextItemProperties, record?: ProductRecord | null): string {
    // If no record is provided, return preview placeholders
    if (!record) {
      if (item.calculation_mode === 'unit_price') return '7,80 € / kg';
      if (item.calculation_mode === 'discount_pct') return '-20%';
      if (item.calculation_mode === 'secondary_currency') return '(~ 3,73 €)';
      if (item.calculation_mode === 'dynamic_date') return `DLC : ${PricingEngine.formatDateOffset(3, 'DD/MM/YYYY')}`;
      return item.text;
    }

    // 1. Unit Price Calculation (Prix au kilo / litre / pièce)
    if (item.calculation_mode === 'unit_price' && item.unit_price_config?.enabled) {
      const cfg = item.unit_price_config;
      const basePrice = (record.PROMOPRICE && record.PROMOPRICE > 0) ? record.PROMOPRICE : record.SELLING_PRICE;
      
      // Determine quantity / weight from explicit record fields or fallback heuristics
      let quantity = 1.0;
      if (cfg.weight_volume_key && record[cfg.weight_volume_key] !== undefined) {
        const raw = record[cfg.weight_volume_key];
        quantity = typeof raw === 'number' ? raw : parseFloat(String(raw)) || 1.0;
      } else if (record.NET_WEIGHT_KG) {
        quantity = record.NET_WEIGHT_KG;
      } else if (record.VOLUME_L) {
        quantity = record.VOLUME_L;
      } else if (record.CASE_SIZE) {
        quantity = record.CASE_SIZE;
      } else {
        // Try parsing numbers from pack unit or item name (e.g. "250g" -> 0.25kg, "1L" -> 1.0)
        quantity = PricingEngine.extractQuantityFromText(record.PACK_UNIT || record.ITEMNAME, cfg.measure_unit);
      }

      if (quantity <= 0) quantity = 1.0;

      const unitPrice = basePrice / quantity;
      const formattedUnitPrice = unitPrice >= 100 
        ? Math.round(unitPrice).toLocaleString('fr-FR')
        : unitPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      
      const currency = item.currency_symbol || (record.SELLING_PRICE > 500 ? 'FCFA' : '€');
      return `${formattedUnitPrice} ${currency} / ${cfg.measure_unit}`;
    }

    // 2. Discount Percentage (-25%)
    if (item.calculation_mode === 'discount_pct' || item.promo_badge_type === 'discount_pct') {
      if (record.DISCOUNT_PCT !== undefined && record.DISCOUNT_PCT > 0) {
        return `-${Math.round(record.DISCOUNT_PCT)}%`;
      }
      if (record.PROMOPRICE && record.PROMOPRICE > 0 && record.SELLING_PRICE > record.PROMOPRICE) {
        const pct = Math.round(((record.SELLING_PRICE - record.PROMOPRICE) / record.SELLING_PRICE) * 100);
        return `-${pct}%`;
      }
      return '-20%';
    }

    // 3. Secondary Currency Conversion (e.g. FCFA -> EUR)
    if (item.calculation_mode === 'secondary_currency' && item.secondary_currency_config?.enabled) {
      const cfg = item.secondary_currency_config;
      const basePrice = (record.PROMOPRICE && record.PROMOPRICE > 0) ? record.PROMOPRICE : record.SELLING_PRICE;
      const rate = cfg.exchange_rate > 0 ? cfg.exchange_rate : 655.957;

      const converted = cfg.mode === 'multiply' ? basePrice * rate : basePrice / rate;
      const formattedConverted = converted >= 100
        ? Math.round(converted).toLocaleString('fr-FR')
        : converted.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      return `(~ ${formattedConverted} ${cfg.target_currency})`;
    }

    // 4. Dynamic Date (DLC / DLUO / Fabrication)
    if (item.calculation_mode === 'dynamic_date' && item.dynamic_date_config?.enabled) {
      const cfg = item.dynamic_date_config;
      const formattedDate = PricingEngine.formatDateOffset(cfg.offset_days || 0, cfg.format || 'DD/MM/YYYY');
      const prefix = cfg.prefix_label ? `${cfg.prefix_label} ` : '';
      return `${prefix}${formattedDate}`;
    }

    // Fallback: standard binding key or static text
    if (item.binding_key && record[item.binding_key] !== undefined) {
      const raw = record[item.binding_key];
      if (typeof raw === 'number') {
        return raw.toLocaleString('fr-FR');
      }
      return String(raw);
    }

    return item.text;
  }

  /**
   * Helper: formats a date offset from today (e.g. +3 days)
   */
  static formatDateOffset(offsetDays: number, format: string): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const shortYear = String(year).slice(-2);

    switch (format) {
      case 'DD.MM.YY':
        return `${day}.${month}.${shortYear}`;
      case 'DD/MM':
        return `${day}/${month}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'DD/MM/YYYY':
      default:
        return `${day}/${month}/${year}`;
    }
  }

  /**
   * Helper: heuristic parser for weight/volume (e.g. "250g" -> 0.25 kg, "500ml" -> 0.5 L)
   */
  static extractQuantityFromText(text: string, targetUnit: string): number {
    if (!text) return 1.0;
    const clean = text.toLowerCase();

    // Check grams (e.g. "250g", "250 g")
    const matchG = clean.match(/(\d+(?:[.,]\d+)?)\s*g\b/);
    if (matchG && targetUnit === 'kg') {
      const g = parseFloat(matchG[1].replace(',', '.'));
      return g / 1000;
    }

    // Check kg
    const matchKg = clean.match(/(\d+(?:[.,]\d+)?)\s*kg\b/);
    if (matchKg && targetUnit === 'kg') {
      return parseFloat(matchKg[1].replace(',', '.'));
    }

    // Check ml / cl / L
    const matchMl = clean.match(/(\d+(?:[.,]\d+)?)\s*ml\b/);
    if (matchMl && targetUnit === 'L') {
      return parseFloat(matchMl[1].replace(',', '.')) / 1000;
    }

    const matchCl = clean.match(/(\d+(?:[.,]\d+)?)\s*cl\b/);
    if (matchCl && targetUnit === 'L') {
      return parseFloat(matchCl[1].replace(',', '.')) / 100;
    }

    const matchL = clean.match(/(\d+(?:[.,]\d+)?)\s*l\b/);
    if (matchL && targetUnit === 'L') {
      return parseFloat(matchL[1].replace(',', '.'));
    }

    return 1.0;
  }
}
