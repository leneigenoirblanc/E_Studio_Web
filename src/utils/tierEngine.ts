import { PriceTier, ProductRecord } from '../types';

export interface TierTargetSpec {
  primary_index: number; // 0-based index
  fallback_indexes?: number[];
  fallback_to_base_price?: boolean;
  strict_required?: boolean;
  keyword_prefix?: string;
  unit_label?: string;
}

export interface ResolvedTierResult {
  unit_price: number;
  qty: number;
  text_qty: string;
  formatted_price: string;
  is_fallback: boolean;
  error?: string;
}

export class TierEngine {
  static resolve(
    spec: TierTargetSpec,
    record: ProductRecord
  ): ResolvedTierResult | null {
    const prefix = spec.keyword_prefix || 'À partir de';
    const unit = spec.unit_label || 'FCFA';
    const fallbackToBase = spec.fallback_to_base_price !== false;
    const strict = !!spec.strict_required;

    const tiers: PriceTier[] = Array.isArray(record.TIERS) ? record.TIERS : [];

    // Check primary index
    if (tiers[spec.primary_index] && typeof tiers[spec.primary_index].unit_price === 'number') {
      const tier = tiers[spec.primary_index];
      return {
        unit_price: tier.unit_price,
        qty: tier.qty,
        text_qty: `${prefix} ${tier.qty} ${record.SELLING_UNIT || 'unités'}`,
        formatted_price: `${tier.unit_price.toLocaleString('fr-FR')} ${unit}`,
        is_fallback: false,
      };
    }

    // Check fallback indexes if provided
    if (spec.fallback_indexes) {
      for (const idx of spec.fallback_indexes) {
        if (tiers[idx] && typeof tiers[idx].unit_price === 'number') {
          const tier = tiers[idx];
          return {
            unit_price: tier.unit_price,
            qty: tier.qty,
            text_qty: `${prefix} ${tier.qty} ${record.SELLING_UNIT || 'unités'}`,
            formatted_price: `${tier.unit_price.toLocaleString('fr-FR')} ${unit}`,
            is_fallback: true,
          };
        }
      }
    }

    // Strict required: cannot fall back to base
    if (strict) {
      return {
        unit_price: 0,
        qty: 0,
        text_qty: '[Palier requis indisponible]',
        formatted_price: '—',
        is_fallback: false,
        error: `Palier #${spec.primary_index + 1} manquant (strict)`,
      };
    }

    // Fallback to selling price
    if (fallbackToBase && typeof record.SELLING_PRICE === 'number' && !isNaN(record.SELLING_PRICE)) {
      return {
        unit_price: record.SELLING_PRICE,
        qty: 1,
        text_qty: `Prix unitaire standard`,
        formatted_price: `${record.SELLING_PRICE.toLocaleString('fr-FR')} ${unit}`,
        is_fallback: true,
      };
    }

    return null;
  }
}
