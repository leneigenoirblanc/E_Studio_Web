/**
 * Export Domain Service
 * Encapsulates all document generation logic (PDF batch generation, PPTX slides,
 * and ZPL II industrial thermal label commands) away from React view components.
 */

import { jsPDF } from 'jspdf';
import pptxgen from 'pptxgenjs';
import { LabelTemplate, ProductRecord } from '../types';

export interface ExportProgressEvent {
  current: number;
  total: number;
  percentage: number;
  phase: 'preparing' | 'rendering' | 'packing' | 'done';
}

export interface ZplExportOptions {
  dpi: 203 | 300 | 600;
  darkness?: number; // 0-30
  speed?: number; // 2-6 inch/sec
}

export class ExportService {
  /**
   * Generates industrial standard Zebra Programming Language (ZPL II) code
   * for direct execution on Zebra / Honeywell / Sato thermal printers.
   */
  public static generateZplBatch(
    template: LabelTemplate,
    products: ProductRecord[],
    options: ZplExportOptions = { dpi: 203 }
  ): string {
    const dotsPerMm = options.dpi === 600 ? 23.62 : options.dpi === 300 ? 11.81 : 8.0;
    const labelWidthDots = Math.round(template.width_mm * dotsPerMm);
    const labelHeightDots = Math.round(template.height_mm * dotsPerMm);

    const zplCommands: string[] = [];

    products.forEach((prod) => {
      zplCommands.push('^XA'); // Start of Label format
      zplCommands.push(`^PW${labelWidthDots}`); // Print Width
      zplCommands.push(`^LL${labelHeightDots}`); // Label Length
      zplCommands.push(`^PR${options.speed || 4},${options.speed || 4}`); // Print Speed
      if (options.darkness) zplCommands.push(`~SD${options.darkness}`); // Darkness

      // Iterate through elements and generate ZPL field data
      (template.items || []).forEach((elem: any) => {
        const xDots = Math.round((elem.x_mm || 0) * dotsPerMm);
        const yDots = Math.round((elem.y_mm || 0) * dotsPerMm);

        if (elem.type === 'text') {
          let text = elem.text || '';
          if (elem.binding_key || elem.binding) {
            const key = elem.binding_key || elem.binding;
            text = (prod as any)[key] || text;
          }
          const fontH = Math.round((elem.font_size_pt || elem.fontSize || 10) * (dotsPerMm / 2.8));
          zplCommands.push(`^FO${xDots},${yDots}`);
          zplCommands.push(`^A0N,${fontH},${fontH}`);
          zplCommands.push(`^FD${text}^FS`);
        } else if (elem.type === 'barcode') {
          const barcodeValue = prod.PRODUCT_SCAN || prod.barcode || elem.barcodeValue || '123456789012';
          const bcH = Math.round((elem.h_mm || 15) * dotsPerMm);
          zplCommands.push(`^FO${xDots},${yDots}`);
          // EAN-13 / Code 128 command
          zplCommands.push(`^BCN,${bcH},Y,N,N`);
          zplCommands.push(`^FD${barcodeValue}^FS`);
        } else if (elem.type === 'qrcode') {
          const qrVal = prod.PRODUCT_SCAN || prod.sku || 'https://estudio.internal';
          zplCommands.push(`^FO${xDots},${yDots}`);
          zplCommands.push(`^BQN,2,4`);
          zplCommands.push(`^FDLA,${qrVal}^FS`);
        } else if (elem.type === 'shape') {
          const wDots = Math.round((elem.w_mm || 20) * dotsPerMm);
          const hDots = Math.round((elem.h_mm || 10) * dotsPerMm);
          const borderDots = Math.max(1, Math.round((elem.stroke_width_mm || 1) * (dotsPerMm / 4)));
          zplCommands.push(`^FO${xDots},${yDots}`);
          zplCommands.push(`^GB${wDots},${hDots},${borderDots}^FS`);
        }
      });

      zplCommands.push('^XZ'); // End of Label format
    });

    return zplCommands.join('\n');
  }

  /**
   * Generates a native Microsoft PowerPoint (.pptx) presentation with one slide per label
   * or imposed slides for client review and marketing teams.
   */
  public static async generatePptxPresentation(
    template: LabelTemplate,
    products: ProductRecord[],
    onProgress?: (event: ExportProgressEvent) => void
  ): Promise<void> {
    const ppt = new pptxgen();
    ppt.author = 'E-Studio Retail Production';
    ppt.company = 'E-Studio Enterprise';
    ppt.title = `Planches d'Étiquettes - ${template.name}`;

    const total = products.length;
    for (let i = 0; i < total; i++) {
      const prod = products[i];
      if (onProgress) {
        onProgress({
          current: i + 1,
          total,
          percentage: Math.round(((i + 1) / total) * 100),
          phase: 'rendering',
        });
      }

      const slide = ppt.addSlide();
      slide.background = { color: 'FFFFFF' };

      // Slide header
      slide.addText(`${template.name} - ${prod.ITEMNAME || 'Article'}`, {
        x: 0.5,
        y: 0.3,
        fontSize: 14,
        bold: true,
        color: '0F172A',
      });

      // Label background card
      const scale = 0.05; // mm to inches conversion approximation
      const cardX = 1.0;
      const cardY = 1.0;
      const cardW = template.width_mm * scale;
      const cardH = template.height_mm * scale;

      slide.addShape(ppt.ShapeType.rect, {
        x: cardX,
        y: cardY,
        w: cardW,
        h: cardH,
        fill: { color: 'F8FAFC' },
        line: { color: 'CBD5E1', width: 1 },
      });

      // Add elements
      (template.items || []).forEach((elem: any) => {
        const elX = cardX + (elem.x_mm || 0) * scale;
        const elY = cardY + (elem.y_mm || 0) * scale;
        const elW = (elem.w_mm || 10) * scale;
        const elH = (elem.h_mm || 5) * scale;

        let txt = elem.text || '';
        if (elem.binding_key || elem.binding) {
          const key = elem.binding_key || elem.binding;
          txt = (prod as any)[key] || txt;
        }

        if (elem.type === 'text') {
          slide.addText(txt, {
            x: elX,
            y: elY,
            w: elW,
            h: elH,
            fontSize: Math.max(6, Math.round((elem.font_size_pt || 10) * 0.75)),
            bold: elem.font_weight === 'bold' || elem.font_weight === '800',
            color: (elem.text_color || '#000000').replace('#', ''),
          });
        }
      });
    }

    if (onProgress) {
      onProgress({ current: total, total, percentage: 100, phase: 'packing' });
    }

    await ppt.writeFile({
      fileName: `export_pptx_${template.name.toLowerCase().replace(/\s+/g, '_')}.pptx`,
    });
  }

  /**
   * Generates a direct PDF download of an imposed batch
   */
  public static savePdfDocument(doc: jsPDF, filename: string): void {
    doc.save(filename);
  }
}
