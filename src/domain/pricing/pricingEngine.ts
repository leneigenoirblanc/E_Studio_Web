/**
 * E-Studio Pricing Calculation & Resolution Engine
 *
 * Moteur mathématique et typographique dédié pour tous les éléments de prix :
 * - Décomposition granulaire en sous-parties (slots)
 * - Calculs de prix au kilo/litre réglementaires
 * - Calculs de remises (% et montants économisés)
 * - Conversion multi-devises
 * - Génération de configurations par défaut prêtes à l'emploi
 */

import {
  PriceBlockElementPayload,
  PromoPriceElementPayload,
  UnitPriceElementPayload,
  TierPriceElementPayload,
  DiscountBadgeElementPayload,
  DualCurrencyPriceElementPayload,
  PriceSlotTypography,
} from './types';
import { fontRegistry } from '../elements/v2/fontRegistry';
import { numberFormatter, FormattedPriceSlots } from '../elements/v2/numberFormatter';
import { ProductRecord } from '../../types';

export class PricingEngine {
  private static instance: PricingEngine | null = null;

  public static getInstance(): PricingEngine {
    if (!this.instance) {
      this.instance = new PricingEngine();
    }
    return this.instance;
  }

  /**
   * Crée un ensemble de slots typographiques par défaut pour un prix
   */
  public createDefaultPriceTypography(overrides: Partial<PriceSlotTypography> = {}): PriceSlotTypography {
    const oswald = fontRegistry.createFontReference('Oswald');
    const roboto = fontRegistry.createFontReference('Roboto');

    return {
      integer: fontRegistry.createDefaultTypography({
        font: oswald,
        sizePt: 36,
        weight: '700',
        color: '#0f172a',
        openTypeFeatures: { tnum: true, lnum: true },
      }),
      decimalSeparator: fontRegistry.createDefaultTypography({
        font: oswald,
        sizePt: 22,
        weight: '700',
        color: '#0f172a',
        baselineShiftPt: 10,
      }),
      fraction: fontRegistry.createDefaultTypography({
        font: oswald,
        sizePt: 20,
        weight: '700',
        color: '#0f172a',
        baselineShiftPt: 10,
        openTypeFeatures: { tnum: true, lnum: true },
      }),
      currency: fontRegistry.createDefaultTypography({
        font: roboto,
        sizePt: 14,
        weight: '600',
        color: '#475569',
      }),
      unit: fontRegistry.createDefaultTypography({
        font: roboto,
        sizePt: 11,
        weight: '500',
        color: '#64748b',
      }),
      prefix: fontRegistry.createDefaultTypography({
        font: roboto,
        sizePt: 10,
        weight: '500',
        color: '#64748b',
      }),
      suffix: fontRegistry.createDefaultTypography({
        font: roboto,
        sizePt: 10,
        weight: '500',
        color: '#64748b',
      }),
      ...overrides,
    };
  }

  /**
   * Résout et décompose un prix en slots pour un produit donné
   */
  public resolvePriceSlots(
    payload: PriceBlockElementPayload,
    product: ProductRecord
  ): FormattedPriceSlots {
    const rawValue = product[payload.valueBinding] || product.SELLING_PRICE || 0;
    const currency = payload.currency.symbol || product.CURRENCY || 'FCFA';
    const position = payload.currency.position || 'after';

    return numberFormatter.formatPrice(rawValue, payload.format, currency, position);
  }

  /**
   * Calcule le prix unitaire légal (ex: au kg ou au litre)
   */
  public calculateUnitPrice(
    payload: UnitPriceElementPayload,
    product: ProductRecord
  ): { unitPriceFormatted: string; rawUnitPrice: number } | null {
    const price = Number(product[payload.priceBinding] || product.SELLING_PRICE);
    const weightVol = Number(product[payload.weightVolumeBinding] || product.UNIT_WEIGHT_VALUE || product.CASE_SIZE);

    if (isNaN(price) || price <= 0 || isNaN(weightVol) || weightVol <= 0) {
      return null;
    }

    let multiplier = 1;
    let targetUnit: string = payload.measureUnit;

    switch (payload.calculationMode) {
      case 'per_kg':
        multiplier = payload.measureUnit === 'g' ? 1000 : 1;
        targetUnit = 'kg';
        break;
      case 'per_liter':
        multiplier = payload.measureUnit === 'cl' ? 100 : payload.measureUnit === 'ml' ? 1000 : 1;
        targetUnit = 'L';
        break;
      case 'per_100g':
        multiplier = payload.measureUnit === 'g' ? 100 : 0.1;
        targetUnit = '100g';
        break;
      case 'per_100ml':
        multiplier = payload.measureUnit === 'ml' ? 100 : payload.measureUnit === 'cl' ? 10 : 0.1;
        targetUnit = '100ml';
        break;
      case 'custom_multiplier':
        multiplier = payload.customMultiplier || 1;
        break;
    }

    const rawUnitPrice = (price / weightVol) * multiplier;
    const formattedSlots = numberFormatter.formatPrice(
      rawUnitPrice,
      payload.format,
      product.CURRENCY || 'FCFA'
    );

    const pricePart = formattedSlots.fullFormatted;
    const unitPriceFormatted = payload.suffixPattern
      .replace('{price}', pricePart)
      .replace('{unit}', targetUnit);

    return {
      rawUnitPrice,
      unitPriceFormatted: `${payload.prefixText || ''}${unitPriceFormatted}`.trim(),
    };
  }

  /**
   * Calcule le pourcentage de remise et le montant économisé pour une promo
   */
  public calculatePromoDiscount(
    regularPrice: number,
    promoPrice: number
  ): { percent: number; percentFormatted: string; amountSaved: number } | null {
    if (regularPrice <= 0 || promoPrice <= 0 || promoPrice >= regularPrice) {
      return null;
    }

    const amountSaved = regularPrice - promoPrice;
    const percent = Math.round((amountSaved / regularPrice) * 100);

    return {
      percent,
      percentFormatted: `-${percent}%`,
      amountSaved,
    };
  }

  /**
   * Factory : Crée un payload PriceBlock par défaut
   */
  public createDefaultPriceBlockPayload(overrides: Partial<PriceBlockElementPayload> = {}): PriceBlockElementPayload {
    return {
      valueBinding: 'SELLING_PRICE',
      format: numberFormatter.createDefaultFormat({ decimalSeparator: ',', maximumFractionDigits: 2 }),
      display: {
        showInteger: true,
        showFraction: true,
        showCurrency: true,
        showUnit: false,
        showDecimalIfZero: false,
      },
      typography: this.createDefaultPriceTypography(),
      currency: {
        code: 'XAF',
        symbol: 'FCFA',
        position: 'after',
        spacingSpace: true,
      },
      prefixText: '',
      suffixText: '',
      ...overrides,
    };
  }

  /**
   * Factory : Crée un payload PromoPrice par défaut
   */
  public createDefaultPromoPricePayload(): PromoPriceElementPayload {
    const roboto = fontRegistry.createFontReference('Roboto');
    const oswald = fontRegistry.createFontReference('Oswald');

    return {
      regularPriceBinding: 'SELLING_PRICE',
      promoPriceBinding: 'PROMOPRICE',
      format: numberFormatter.createDefaultFormat({ decimalSeparator: ',' }),
      regularPriceStyle: {
        typography: fontRegistry.createDefaultTypography({
          font: roboto,
          sizePt: 16,
          weight: '600',
          color: '#94a3b8',
        }),
        strikethrough: {
          enabled: true,
          type: 'diagonal',
          color: '#ef4444',
          thicknessPt: 2,
        },
        prefixText: 'Au lieu de :',
      },
      promoPriceStyle: {
        typography: this.createDefaultPriceTypography({
          integer: fontRegistry.createDefaultTypography({
            font: oswald,
            sizePt: 42,
            weight: '800',
            color: '#dc2626',
          }),
        }),
        currency: {
          code: 'XAF',
          symbol: 'FCFA',
          position: 'after',
          spacingSpace: true,
        },
        prefixText: '',
      },
      discountBadge: {
        enabled: true,
        mode: 'percent',
        shape: 'pill',
        backgroundColor: '#dc2626',
        textColor: '#ffffff',
        typography: fontRegistry.createDefaultTypography({
          font: oswald,
          sizePt: 14,
          weight: '700',
          color: '#ffffff',
        }),
        prefix: '-',
      },
      layoutDirection: 'stacked',
      gapMm: 1.5,
    };
  }

  /**
   * Factory : Crée un payload UnitPrice par défaut
   */
  public createDefaultUnitPricePayload(): UnitPriceElementPayload {
    const roboto = fontRegistry.createFontReference('Roboto');
    return {
      priceBinding: 'SELLING_PRICE',
      weightVolumeBinding: 'UNIT_WEIGHT_VALUE',
      measureUnit: 'kg',
      calculationMode: 'per_kg',
      format: numberFormatter.createDefaultFormat({ maximumFractionDigits: 2 }),
      typography: fontRegistry.createDefaultTypography({
        font: roboto,
        sizePt: 9,
        weight: '500',
        color: '#64748b',
      }),
      prefixText: 'Soit ',
      suffixPattern: '{price} / {unit}',
    };
  }
}

export const pricingEngine = PricingEngine.getInstance();
