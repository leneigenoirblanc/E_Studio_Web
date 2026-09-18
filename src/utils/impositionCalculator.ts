import { ImpositionCalculation, ImpositionConfig, Margins } from '../types';

export const PAGE_DIMENSIONS_MM: Record<string, [number, number]> = {
  A4: [210.0, 297.0],
  A3: [297.0, 420.0],
  A5: [148.0, 210.0],
  A6: [105.0, 148.0],
  LETTER: [215.9, 279.4],
};

export class ImpositionCalculator {
  static calculate(
    template_w_mm: number,
    template_h_mm: number,
    outer_margins: Margins,
    config: ImpositionConfig
  ): ImpositionCalculation {
    let page_w: number;
    let page_h: number;

    if (config.page_size === 'CUSTOM' && config.custom_page_w_mm && config.custom_page_h_mm) {
      page_w = config.custom_page_w_mm;
      page_h = config.custom_page_h_mm;
    } else {
      const rawDim = PAGE_DIMENSIONS_MM[config.page_size] || PAGE_DIMENSIONS_MM.A4;
      page_w = rawDim[0];
      page_h = rawDim[1];
    }

    if (config.orientation === 'landscape') {
      [page_w, page_h] = [page_h, page_w];
    }

    const gap = Math.max(0, config.gap_mm || 0);
    const label_total_w_mm = template_w_mm + outer_margins.left + outer_margins.right;
    const label_total_h_mm = template_h_mm + outer_margins.top + outer_margins.bottom;

    if (label_total_w_mm <= 0 || label_total_h_mm <= 0) {
      throw new Error('Les dimensions de gabarit doivent être strictement positives.');
    }

    // Number of columns & rows that fit
    // For n items with gap: n * w + (n - 1) * gap <= page_dim => n * (w + gap) - gap <= page_dim => n * (w + gap) <= page_dim + gap
    const cols = Math.max(1, Math.floor((page_w + gap) / (label_total_w_mm + gap)));
    const rows = Math.max(1, Math.floor((page_h + gap) / (label_total_h_mm + gap)));

    const used_w = cols * label_total_w_mm + Math.max(0, cols - 1) * gap;
    const used_h = rows * label_total_h_mm + Math.max(0, rows - 1) * gap;

    const calibX = config.calibration_x_mm || 0;
    const calibY = config.calibration_y_mm || 0;

    const horizontal_offset_mm = Math.max(0, (page_w - used_w) / 2 + calibX);
    const vertical_offset_mm = Math.max(0, (page_h - used_h) / 2 + calibY);

    return {
      page_w_mm: page_w,
      page_h_mm: page_h,
      cols,
      rows,
      total_per_page: cols * rows,
      horizontal_offset_mm,
      vertical_offset_mm,
      label_total_w_mm,
      label_total_h_mm,
    };
  }
}
