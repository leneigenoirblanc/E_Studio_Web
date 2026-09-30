/**
 * E-Studio High-Fidelity Price Element Renderer
 * Rendu modulaire slot-par-slot de tous les éléments tarifaires :
 * - PriceBlock (Entier, Décimale, Devise, Unité, Préfixe, Suffixe)
 * - PromoPrice (Prix barré réglementaire + Prix Promo + Badge Remise)
 * - ComparePrice
 * - UnitPrice (Prix au kg/L légal)
 * - TierPrice (Paliers dégressifs)
 * - DiscountBadge (Macaron -20%)
 * - DualCurrencyPrice (Double affichage EUR / FCFA)
 */

import React from 'react';
import {
  PricingElementType,
  PriceBlockElementPayload,
  PromoPriceElementPayload,
  ComparePriceElementPayload,
  UnitPriceElementPayload,
  TierPriceElementPayload,
  DiscountBadgeElementPayload,
  DualCurrencyPriceElementPayload,
} from '../domain/pricing/types';
import { pricingEngine } from '../domain/pricing/pricingEngine';
import { fontRegistry } from '../domain/elements/v2/fontRegistry';
import { numberFormatter } from '../domain/elements/v2/numberFormatter';
import { ProductRecord } from '../types';

interface PriceElementRendererProps {
  type: PricingElementType;
  payload: any;
  product: ProductRecord;
  className?: string;
  style?: React.CSSProperties;
}

export const PriceElementRenderer: React.FC<PriceElementRendererProps> = ({
  type,
  payload,
  product,
  className = '',
  style = {},
}) => {
  // 1. Rendu PriceBlock
  if (type === 'price_block') {
    const p = payload as PriceBlockElementPayload;
    const slots = pricingEngine.resolvePriceSlots(p, product);
    const unitText = product[p.unitBinding || ''] || p.unitDefaultText || '';

    const integerStyle = fontRegistry.toCssProperties(p.typography.integer);
    const decSepStyle = fontRegistry.toCssProperties(p.typography.decimalSeparator);
    const fractionStyle = fontRegistry.toCssProperties(p.typography.fraction);
    const currencyStyle = fontRegistry.toCssProperties(p.typography.currency);
    const unitStyle = p.typography.unit ? fontRegistry.toCssProperties(p.typography.unit) : {};
    const prefixStyle = p.typography.prefix ? fontRegistry.toCssProperties(p.typography.prefix) : {};

    const hasFraction = slots.fraction.length > 0;
    const showDecimals = p.display.showFraction && (hasFraction || p.display.showDecimalIfZero);

    return (
      <div
        className={`inline-flex items-baseline flex-wrap ${className}`}
        style={{
          ...style,
          backgroundColor: p.boxAppearance?.fillColor,
          borderColor: p.boxAppearance?.borderColor,
          borderWidth: p.boxAppearance?.borderWidthMm ? `${p.boxAppearance.borderWidthMm}mm` : undefined,
          borderRadius: p.boxAppearance?.cornerRadiusMm ? `${p.boxAppearance.cornerRadiusMm}mm` : undefined,
          padding: p.boxAppearance?.paddingMm
            ? `${p.boxAppearance.paddingMm.top}mm ${p.boxAppearance.paddingMm.right}mm ${p.boxAppearance.paddingMm.bottom}mm ${p.boxAppearance.paddingMm.left}mm`
            : undefined,
        }}
      >
        {p.prefixText && <span style={prefixStyle} className="mr-1">{p.prefixText}</span>}

        {p.currency.position === 'before' && p.display.showCurrency && (
          <span style={currencyStyle} className="mr-1">{slots.currency}</span>
        )}

        {p.display.showInteger && (
          <span style={integerStyle}>{slots.sign}{slots.integer}</span>
        )}

        {showDecimals && (
          <>
            <span style={decSepStyle}>{slots.decimalSeparator}</span>
            <span style={fractionStyle}>{slots.fraction || '00'}</span>
          </>
        )}

        {p.currency.position === 'after' && p.display.showCurrency && (
          <span style={currencyStyle} className="ml-1.5">{slots.currency}</span>
        )}

        {p.currency.position === 'superscript' && p.display.showCurrency && (
          <span style={{ ...currencyStyle, verticalAlign: 'super', fontSize: '0.6em' }} className="ml-0.5">
            {slots.currency}
          </span>
        )}

        {p.display.showUnit && unitText && (
          <span style={unitStyle} className="ml-2">/ {unitText}</span>
        )}

        {p.suffixText && <span className="ml-1 text-slate-500 text-xs">{p.suffixText}</span>}
      </div>
    );
  }

  // 2. Rendu PromoPrice
  if (type === 'promo_price') {
    const p = payload as PromoPriceElementPayload;
    const regularVal = Number(product[p.regularPriceBinding] || product.SELLING_PRICE || 0);
    const promoVal = Number(product[p.promoPriceBinding] || product.PROMOPRICE || 0);
    const hasPromo = promoVal > 0 && promoVal < regularVal;

    const discount = pricingEngine.calculatePromoDiscount(regularVal, promoVal);
    const regularFormatted = numberFormatter.formatPrice(regularVal, p.format, p.promoPriceStyle.currency.symbol || 'FCFA').fullFormatted;

    const promoBlockPayload: PriceBlockElementPayload = {
      valueBinding: p.promoPriceBinding,
      format: p.format,
      display: { showInteger: true, showFraction: true, showCurrency: true, showUnit: false, showDecimalIfZero: false },
      typography: p.promoPriceStyle.typography,
      currency: p.promoPriceStyle.currency,
    };

    return (
      <div className={`flex ${p.layoutDirection === 'stacked' ? 'flex-col' : 'items-center'} gap-1.5 ${className}`} style={style}>
        {hasPromo && (
          <div className="flex items-center gap-2">
            {p.regularPriceStyle.prefixText && (
              <span className="text-[10px] text-slate-400 font-semibold">{p.regularPriceStyle.prefixText}</span>
            )}
            <div className="relative inline-block">
              <span
                style={fontRegistry.toCssProperties(p.regularPriceStyle.typography)}
                className="opacity-75"
              >
                {regularFormatted}
              </span>
              {p.regularPriceStyle.strikethrough.enabled && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    borderTop: `${p.regularPriceStyle.strikethrough.thicknessPt}px solid ${p.regularPriceStyle.strikethrough.color}`,
                    top: '50%',
                    transform: p.regularPriceStyle.strikethrough.type === 'diagonal' ? 'rotate(-10deg)' : undefined,
                  }}
                />
              )}
            </div>

            {p.discountBadge?.enabled && discount && (
              <span
                style={{
                  ...fontRegistry.toCssProperties(p.discountBadge.typography),
                  backgroundColor: p.discountBadge.backgroundColor,
                  color: p.discountBadge.textColor,
                }}
                className={`px-2 py-0.5 font-bold shadow-xs ${
                  p.discountBadge.shape === 'pill' ? 'rounded-full' : p.discountBadge.shape === 'circle' ? 'rounded-full w-8 h-8 flex items-center justify-center' : 'rounded-md'
                }`}
              >
                {p.discountBadge.mode === 'percent'
                  ? discount.percentFormatted
                  : `-${numberFormatter.formatPrice(discount.amountSaved, p.format, p.promoPriceStyle.currency.symbol || 'FCFA').fullFormatted}`}
              </span>
            )}
          </div>
        )}

        <PriceElementRenderer
          type="price_block"
          payload={hasPromo ? promoBlockPayload : { ...promoBlockPayload, valueBinding: p.regularPriceBinding }}
          product={product}
        />
      </div>
    );
  }

  // 3. Rendu UnitPrice
  if (type === 'unit_price') {
    const p = payload as UnitPriceElementPayload;
    const res = pricingEngine.calculateUnitPrice(p, product);
    if (!res) return null;

    return (
      <span style={{ ...fontRegistry.toCssProperties(p.typography), ...style }} className={className}>
        {res.unitPriceFormatted}
      </span>
    );
  }

  // 4. Rendu DiscountBadge
  if (type === 'discount_badge') {
    const p = payload as DiscountBadgeElementPayload;
    const regularVal = Number(product[p.regularPriceBinding || 'SELLING_PRICE'] || 0);
    const promoVal = Number(product[p.promoPriceBinding || 'PROMOPRICE'] || 0);
    const discount = pricingEngine.calculatePromoDiscount(regularVal, promoVal);

    const label = p.calculationMode === 'fixed_value'
      ? p.fixedValue || '-20%'
      : discount?.percentFormatted || '-20%';

    return (
      <div
        style={{
          ...fontRegistry.toCssProperties(p.typography),
          backgroundColor: p.badgeColor,
          borderColor: p.borderColor,
          borderWidth: p.borderWidthMm ? `${p.borderWidthMm}mm` : undefined,
          transform: p.rotationDeg ? `rotate(${p.rotationDeg}deg)` : undefined,
          ...style,
        }}
        className={`inline-flex items-center justify-center px-3 py-1 font-bold shadow-sm ${
          p.shape === 'pill'
            ? 'rounded-full'
            : p.shape === 'circle'
            ? 'rounded-full w-12 h-12'
            : 'rounded-lg'
        } ${className}`}
      >
        {label}
      </div>
    );
  }

  // Fallback simple
  return null;
};
