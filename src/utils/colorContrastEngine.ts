// Color & Contrast Engine for E-Studio Web
// Computes WCAG AA/AAA contrast ratios and simulates/converts E-Ink physical palettes

export interface ContrastResult {
  ratio: number;
  scoreText: 'AAA' | 'AA' | 'AA Large' | 'Fail';
  isAccessible: boolean;
  textColor: string;
  bgColor: string;
  recommendedTextColor?: string;
}

// Convert Hex or RGB string to RGB numbers
export function parseColor(colorStr: string): { r: number; g: number; b: number } {
  if (!colorStr) return { r: 255, g: 255, b: 255 };
  let str = colorStr.trim().toLowerCase();

  if (str.startsWith('#')) {
    let hex = str.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16) || 0;
      const g = parseInt(hex.slice(2, 4), 16) || 0;
      const b = parseInt(hex.slice(4, 6), 16) || 0;
      return { r, g, b };
    }
  } else if (str.startsWith('rgb')) {
    const match = str.match(/\d+/g);
    if (match && match.length >= 3) {
      return {
        r: parseInt(match[0], 10),
        g: parseInt(match[1], 10),
        b: parseInt(match[2], 10),
      };
    }
  }

  // Fallback defaults for named colors
  if (str === 'black') return { r: 0, g: 0, b: 0 };
  if (str === 'white') return { r: 255, g: 255, b: 255 };
  if (str === 'red') return { r: 220, g: 38, b: 38 };
  if (str === 'yellow') return { r: 234, g: 179, b: 8 };

  return { r: 255, g: 255, b: 255 };
}

// Relative luminance based on sRGB standard (WCAG 2.1)
export function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const [rs, gs, bs] = [rgb.r, rgb.g, rgb.b].map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate WCAG Contrast Ratio
export function getContrastRatio(fgColor: string, bgColor: string): number {
  const fgRgb = parseColor(fgColor);
  const bgRgb = parseColor(bgColor);
  const l1 = getRelativeLuminance(fgRgb);
  const l2 = getRelativeLuminance(bgRgb);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

// Full Contrast Audit
export function auditColorContrast(
  textColor: string,
  bgColor: string,
  fontSizePt: number = 12,
  isBold: boolean = false
): ContrastResult {
  const ratio = getContrastRatio(textColor, bgColor);
  const isLargeText = fontSizePt >= 18 || (fontSizePt >= 14 && isBold);

  let scoreText: 'AAA' | 'AA' | 'AA Large' | 'Fail' = 'Fail';
  let isAccessible = false;

  if (ratio >= 7.0) {
    scoreText = 'AAA';
    isAccessible = true;
  } else if (ratio >= 4.5) {
    scoreText = 'AA';
    isAccessible = true;
  } else if (isLargeText && ratio >= 3.0) {
    scoreText = 'AA Large';
    isAccessible = true;
  } else {
    scoreText = 'Fail';
    isAccessible = false;
  }

  // Recommend optimal text color if failed
  let recommendedTextColor: string | undefined;
  if (!isAccessible) {
    const bgLuminance = getRelativeLuminance(parseColor(bgColor));
    recommendedTextColor = bgLuminance > 0.5 ? '#000000' : '#ffffff';
  }

  return {
    ratio,
    scoreText,
    isAccessible,
    textColor,
    bgColor,
    recommendedTextColor,
  };
}

// ----------------------------------------------------
// E-Ink Physical Color Conversion & Dithering Engine
// ----------------------------------------------------

export interface EinkPaletteColor {
  name: string;
  rgb: { r: number; g: number; b: number };
  hex: string;
}

export const EINK_PALETTES: Record<string, EinkPaletteColor[]> = {
  eink_bw: [
    { name: 'Black', rgb: { r: 0, g: 0, b: 0 }, hex: '#000000' },
    { name: 'White', rgb: { r: 255, g: 255, b: 255 }, hex: '#ffffff' },
  ],
  eink_bwr: [
    { name: 'Black', rgb: { r: 0, g: 0, b: 0 }, hex: '#000000' },
    { name: 'White', rgb: { r: 255, g: 255, b: 255 }, hex: '#ffffff' },
    { name: 'Red', rgb: { r: 220, g: 38, b: 38 }, hex: '#dc2626' },
  ],
  eink_bwy: [
    { name: 'Black', rgb: { r: 0, g: 0, b: 0 }, hex: '#000000' },
    { name: 'White', rgb: { r: 255, g: 255, b: 255 }, hex: '#ffffff' },
    { name: 'Yellow', rgb: { r: 245, g: 158, b: 11 }, hex: '#f59e0b' },
  ],
  eink_4color: [
    { name: 'Black', rgb: { r: 0, g: 0, b: 0 }, hex: '#000000' },
    { name: 'White', rgb: { r: 255, g: 255, b: 255 }, hex: '#ffffff' },
    { name: 'Red', rgb: { r: 220, g: 38, b: 38 }, hex: '#dc2626' },
    { name: 'Yellow', rgb: { r: 245, g: 158, b: 11 }, hex: '#f59e0b' },
  ],
};

// Euclidean Color Distance
function colorDistance(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) * 0.3 +
    Math.pow(c1.g - c2.g, 2) * 0.59 +
    Math.pow(c1.b - c2.b, 2) * 0.11
  );
}

// Find nearest color in palette
export function getNearestEinkColor(
  colorStr: string,
  paletteName: 'eink_bw' | 'eink_bwr' | 'eink_bwy' | 'eink_4color' = 'eink_bwr'
): string {
  const rgb = parseColor(colorStr);
  const palette = EINK_PALETTES[paletteName] || EINK_PALETTES.eink_bwr;

  let minDistance = Infinity;
  let nearestColor = palette[0].hex;

  for (const p of palette) {
    const d = colorDistance(rgb, p.rgb);
    if (d < minDistance) {
      minDistance = d;
      nearestColor = p.hex;
    }
  }

  return nearestColor;
}
