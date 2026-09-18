/**
 * Object Model Hierarchy & Typography Extensions for E-Studio
 * Provides BaseTemplateItem class and specific typed subclasses,
 * plus helper functions for unified property mutations and multi-selection merging.
 */

import {
  ItemType,
  TemplateItem,
  TextItemProperties,
  ShapeItemProperties,
  EllipseItemProperties,
  LineItemProperties,
  ImageItemProperties,
  QRCodeItemProperties,
  BarcodeItemProperties,
  TierPriceItemProperties,
  BaseItemProperties,
} from '../types';

// Standard available fonts in browser and export engines
export const AVAILABLE_FONTS = [
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans (Moderne)' },
  { value: 'Helvetica', label: 'Helvetica / Arial (Standard)' },
  { value: 'Oswald', label: 'Oswald (Condensé & Impact)' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono (Monospace)' },
  { value: 'Impact', label: 'Impact (Grand Prix / Promo)' },
  { value: 'Georgia', label: 'Georgia (Sérif Classique)' },
  { value: 'Courier New', label: 'Courier New (Code-barres text)' },
];

export const FONT_WEIGHTS = [
  { value: 'normal', label: 'Normal (400)' },
  { value: '500', label: 'Medium (500)' },
  { value: '600', label: 'Semi-Bold (600)' },
  { value: 'bold', label: 'Gras / Bold (700)' },
  { value: '800', label: 'Extra-Bold (800)' },
] as const;

export const TEXT_ALIGNMENTS = [
  { value: 'left', label: 'Gauche' },
  { value: 'center', label: 'Centré' },
  { value: 'right', label: 'Droite' },
  { value: 'justify', label: 'Justifié' },
] as const;

export const VERTICAL_ALIGNMENTS = [
  { value: 'top', label: 'Haut' },
  { value: 'middle', label: 'Milieu' },
  { value: 'bottom', label: 'Bas' },
] as const;

export const TEXT_TRANSFORMS = [
  { value: 'none', label: 'Normal' },
  { value: 'uppercase', label: 'MAJUSCULE' },
  { value: 'lowercase', label: 'minuscule' },
  { value: 'capitalize', label: 'Première Lettre' },
] as const;

/**
 * Base Object Class representing any canvas template element
 */
export abstract class BaseTemplateObject<T extends TemplateItem = TemplateItem> {
  protected props: T;

  constructor(props: T) {
    this.props = { ...props };
  }

  public get id(): string {
    return this.props.id;
  }

  public get type(): ItemType {
    return this.props.type;
  }

  public get properties(): T {
    return { ...this.props };
  }

  public update(patch: Partial<T>): T {
    this.props = { ...this.props, ...patch };
    return this.properties;
  }

  public setPosition(x_mm: number, y_mm: number): void {
    this.props.x_mm = Math.round(x_mm * 10) / 10;
    this.props.y_mm = Math.round(y_mm * 10) / 10;
  }

  public setSize(w_mm: number, h_mm: number): void {
    this.props.w_mm = Math.max(1, Math.round(w_mm * 10) / 10);
    this.props.h_mm = Math.max(1, Math.round(h_mm * 10) / 10);
  }

  public setLocked(locked: boolean): void {
    this.props.locked = locked;
  }

  public setRotation(rotation: number): void {
    this.props.rotation = (rotation % 360 + 360) % 360;
  }

  public abstract clone(newId?: string, offsetMm?: number): TemplateItem;
}

/**
 * Text Element Subclass
 */
export class TextTemplateObject extends BaseTemplateObject<TextItemProperties> {
  public clone(newId?: string, offsetMm: number = 3): TextItemProperties {
    return {
      ...this.properties,
      id: newId || `text_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      x_mm: this.properties.x_mm + offsetMm,
      y_mm: this.properties.y_mm + offsetMm,
      z_index: this.properties.z_index + 1,
    };
  }
}

/**
 * Shape Element Subclass
 */
export class ShapeTemplateObject extends BaseTemplateObject<ShapeItemProperties> {
  public clone(newId?: string, offsetMm: number = 3): ShapeItemProperties {
    return {
      ...this.properties,
      id: newId || `shape_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      x_mm: this.properties.x_mm + offsetMm,
      y_mm: this.properties.y_mm + offsetMm,
      z_index: this.properties.z_index + 1,
    };
  }
}

/**
 * Barcode Element Subclass
 */
export class BarcodeTemplateObject extends BaseTemplateObject<BarcodeItemProperties> {
  public clone(newId?: string, offsetMm: number = 3): BarcodeItemProperties {
    return {
      ...this.properties,
      id: newId || `barcode_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      x_mm: this.properties.x_mm + offsetMm,
      y_mm: this.properties.y_mm + offsetMm,
      z_index: this.properties.z_index + 1,
    };
  }
}

/**
 * Tier Price Element Subclass
 */
export class TierPriceTemplateObject extends BaseTemplateObject<TierPriceItemProperties> {
  public clone(newId?: string, offsetMm: number = 3): TierPriceItemProperties {
    return {
      ...this.properties,
      id: newId || `tier_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      x_mm: this.properties.x_mm + offsetMm,
      y_mm: this.properties.y_mm + offsetMm,
      z_index: this.properties.z_index + 1,
    };
  }
}

/**
 * Factory creating object wrapper instance
 */
export function createObjectInstance(item: TemplateItem): BaseTemplateObject {
  switch (item.type) {
    case 'text':
      return new TextTemplateObject(item);
    case 'shape':
      return new ShapeTemplateObject(item);
    case 'barcode':
      return new BarcodeTemplateObject(item);
    case 'tier_price':
      return new TierPriceTemplateObject(item);
    default:
      return new (class extends BaseTemplateObject {
        clone(newId?: string, offsetMm = 3) {
          return {
            ...this.properties,
            id: newId || `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            x_mm: this.properties.x_mm + offsetMm,
            y_mm: this.properties.y_mm + offsetMm,
            z_index: this.properties.z_index + 1,
          };
        }
      })(item);
  }
}

/**
 * Multi-selection helper:
 * Returns the intersection of shared values for given properties across multiple items.
 * If values differ, returns undefined or special 'mixed' sentinel.
 */
export interface CommonProperties {
  // Geometry & Positioning
  x_mm?: number;
  y_mm?: number;
  w_mm?: number;
  h_mm?: number;
  rotation?: number;
  locked?: boolean;

  // Typography (for text & items supporting typography)
  font_family?: string;
  font_size_pt?: number;
  font_weight?: string;
  font_style?: string;
  text_decoration?: string;
  text_color?: string;
  alignment?: string;
  valign?: string;
  letter_spacing_pt?: number;
  line_height_multiplier?: number;
  text_transform?: string;

  // Colors & Borders
  fill_color?: string;
  border_color?: string;
  border_width?: number;
  corner_radius?: number;

  // Barcode / Elements
  bar_color?: string;
  barcode_type?: string;
  show_text?: boolean;
}

export function extractCommonProperties(items: TemplateItem[]): CommonProperties {
  if (!items || items.length === 0) return {};
  if (items.length === 1) {
    const it = items[0] as any;
    return {
      x_mm: it.x_mm,
      y_mm: it.y_mm,
      w_mm: it.w_mm,
      h_mm: it.h_mm,
      rotation: it.rotation,
      locked: it.locked,
      font_family: it.font_family,
      font_size_pt: it.font_size_pt,
      font_weight: it.font_weight,
      font_style: it.font_style,
      text_decoration: it.text_decoration,
      text_color: it.text_color,
      alignment: it.alignment,
      valign: it.valign,
      letter_spacing_pt: it.letter_spacing_pt,
      line_height_multiplier: it.line_height_multiplier,
      text_transform: it.text_transform,
      fill_color: it.fill_color,
      border_color: it.border_color,
      border_width: it.border_width,
      corner_radius: it.corner_radius,
      bar_color: it.bar_color,
      barcode_type: it.barcode_type,
      show_text: it.show_text,
    };
  }

  const first = items[0] as any;
  const common: CommonProperties = {};

  const keys: (keyof CommonProperties)[] = [
    'w_mm',
    'h_mm',
    'rotation',
    'locked',
    'font_family',
    'font_size_pt',
    'font_weight',
    'font_style',
    'text_decoration',
    'text_color',
    'alignment',
    'valign',
    'letter_spacing_pt',
    'line_height_multiplier',
    'text_transform',
    'fill_color',
    'border_color',
    'border_width',
    'corner_radius',
    'bar_color',
    'barcode_type',
    'show_text',
  ];

  for (const key of keys) {
    const allHaveIt = items.every((it: any) => it[key] !== undefined);
    if (allHaveIt) {
      const allEqual = items.every((it: any) => it[key] === first[key]);
      if (allEqual) {
        (common as any)[key] = first[key];
      }
    }
  }

  return common;
}
