import pptxgen from 'pptxgenjs';
import { LabelTemplate, ProductRecord, ImpositionConfig, ImpositionCalculation } from '../types';

/**
 * Converts mm to inches for pptxgenjs layout
 */
const mmToIn = (mm: number) => mm / 25.4;

export class PptxExporter {
  /**
   * Generates a PowerPoint (.pptx) file with one slide per print sheet page,
   * rendering full vector shapes, labels, text blocks, and barcodes.
   */
  static async exportToPptx(
    template: LabelTemplate,
    products: ProductRecord[],
    imposition: ImpositionCalculation,
    impositionConfig: ImpositionConfig
  ) {
    const pptx = new pptxgen();

    // Configure Slide Dimensions matching the paper page
    const pageWidthIn = mmToIn(imposition.page_w_mm);
    const pageHeightIn = mmToIn(imposition.page_h_mm);

    pptx.defineLayout({
      name: 'CUSTOM_SHEET',
      width: pageWidthIn,
      height: pageHeightIn,
    });
    pptx.layout = 'CUSTOM_SHEET';

    const labelsPerPage = imposition.total_per_page;
    const totalPages = Math.ceil(products.length / labelsPerPage);

    for (let page = 0; page < totalPages; page++) {
      const slide = pptx.addSlide();
      slide.background = { color: 'FFFFFF' };

      for (let slot = 0; slot < labelsPerPage; slot++) {
        const prodIndex = page * labelsPerPage + slot;
        if (prodIndex >= products.length) break;
        const prod = products[prodIndex];

        const col = slot % imposition.cols;
        const row = Math.floor(slot / imposition.cols);

        // Calculate label origin in mm on sheet
        const labelX_mm =
          imposition.horizontal_offset_mm + col * (imposition.label_total_w_mm + impositionConfig.gap_mm);
        const labelY_mm =
          imposition.vertical_offset_mm + row * (imposition.label_total_h_mm + impositionConfig.gap_mm);

        const labelX_in = mmToIn(labelX_mm);
        const labelY_in = mmToIn(labelY_mm);
        const labelW_in = mmToIn(template.width_mm);
        const labelH_in = mmToIn(template.height_mm);

        // Draw Label Background / Outline
        slide.addShape(pptx.ShapeType.rect, {
          x: labelX_in,
          y: labelY_in,
          w: labelW_in,
          h: labelH_in,
          fill: { color: (template.bg_color || '#FFFFFF').replace('#', '') },
          line: { color: 'CCCCCC', width: 0.5, dashType: 'dash' },
        });

        // Add each template item to the slide
        for (const item of template.items) {
          const itemX_in = labelX_in + mmToIn(item.x_mm);
          const itemY_in = labelY_in + mmToIn(item.y_mm);
          const itemW_in = mmToIn(item.w_mm);
          const itemH_in = mmToIn(item.h_mm);

          switch (item.type) {
            case 'text': {
              let textVal = item.text || '';
              if (item.binding_key && prod[item.binding_key] !== undefined) {
                const raw = prod[item.binding_key];
                textVal = typeof raw === 'number' ? raw.toLocaleString('fr-FR') : String(raw);
              }
              if (item.prefix_text) textVal = `${item.prefix_text} ${textVal}`;
              if (item.suffix_text) textVal = `${textVal} ${item.suffix_text}`;

              if (item.text_transform === 'uppercase') textVal = textVal.toUpperCase();
              else if (item.text_transform === 'lowercase') textVal = textVal.toLowerCase();

              slide.addText(textVal, {
                x: itemX_in,
                y: itemY_in,
                w: itemW_in,
                h: itemH_in,
                fontSize: Math.max(6, item.font_size_pt),
                fontFace: item.font_family || 'Calibri',
                bold: item.font_weight === 'bold' || item.font_weight === '800',
                italic: item.font_style === 'italic',
                underline: item.text_decoration === 'underline' ? { style: 'sng' } : undefined,
                strike: item.text_decoration === 'line-through',
                color: (item.text_color || '#000000').replace('#', ''),
                align: (item.alignment === 'justify' ? 'left' : item.alignment) || 'left',
                valign: item.valign || 'top',
                fill: item.fill_color ? { color: item.fill_color.replace('#', '') } : undefined,
                line:
                  item.border_width && item.border_width > 0
                    ? { color: (item.border_color || '#000000').replace('#', ''), width: item.border_width }
                    : undefined,
                wrap: item.wrap,
                charSpacing: item.letter_spacing_pt ? item.letter_spacing_pt * 20 : undefined,
              });
              break;
            }

            case 'shape': {
              slide.addShape(
                item.corner_radius && item.corner_radius > 0
                  ? pptx.ShapeType.roundRect
                  : pptx.ShapeType.rect,
                {
                  x: itemX_in,
                  y: itemY_in,
                  w: itemW_in,
                  h: itemH_in,
                  fill: item.fill_color ? { color: item.fill_color.replace('#', '') } : undefined,
                  line: {
                    color: (item.border_color || '#000000').replace('#', ''),
                    width: item.border_width || 1,
                  },
                }
              );
              break;
            }

            case 'ellipse': {
              slide.addShape(pptx.ShapeType.ellipse, {
                x: itemX_in,
                y: itemY_in,
                w: itemW_in,
                h: itemH_in,
                fill: item.fill_color ? { color: item.fill_color.replace('#', '') } : undefined,
                line: {
                  color: (item.border_color || '#000000').replace('#', ''),
                  width: item.border_width || 1,
                },
              });
              break;
            }

            case 'line': {
              slide.addShape(pptx.ShapeType.line, {
                x: itemX_in,
                y: itemY_in + itemH_in / 2,
                w: itemW_in,
                h: 0,
                line: {
                  color: (item.color || '#000000').replace('#', ''),
                  width: item.thickness || 1,
                  dashType: item.style === 'dashed' ? 'dash' : item.style === 'dotted' ? 'sysDot' : 'solid',
                },
              });
              break;
            }

            case 'barcode': {
              let code = item.code || '123456789012';
              if (item.binding_key && prod[item.binding_key]) {
                code = String(prod[item.binding_key]);
              }
              // Add barcode container text and representation
              slide.addShape(pptx.ShapeType.rect, {
                x: itemX_in,
                y: itemY_in,
                w: itemW_in,
                h: itemH_in,
                fill: { color: 'F8FAFC' },
                line: { color: 'CBD5E1', width: 0.5 },
              });
              slide.addText(`||| |||| || ||||\n${code}`, {
                x: itemX_in,
                y: itemY_in,
                w: itemW_in,
                h: itemH_in,
                fontSize: 8,
                fontFace: 'Consolas',
                align: 'center',
                valign: 'middle',
                color: (item.bar_color || '#000000').replace('#', ''),
              });
              break;
            }

            case 'qrcode': {
              let qrContent = item.content || 'https://example.com';
              if (item.binding_key && prod[item.binding_key]) {
                qrContent = String(prod[item.binding_key]);
              }
              slide.addShape(pptx.ShapeType.rect, {
                x: itemX_in,
                y: itemY_in,
                w: itemW_in,
                h: itemH_in,
                fill: { color: (item.background_color || '#FFFFFF').replace('#', '') },
                line: { color: '000000', width: 0.5 },
              });
              slide.addText('[QR]', {
                x: itemX_in,
                y: itemY_in,
                w: itemW_in,
                h: itemH_in,
                fontSize: 9,
                bold: true,
                align: 'center',
                valign: 'middle',
              });
              break;
            }

            case 'tier_price': {
              const prefix = item.prefix_text || 'À partir de';
              const unit = item.unit_label || 'FCFA';
              const price = prod.SELLING_PRICE || 0;
              slide.addText(`${prefix} ${price.toLocaleString('fr-FR')} ${unit}`, {
                x: itemX_in,
                y: itemY_in,
                w: itemW_in,
                h: itemH_in,
                fontSize: 9,
                fontFace: 'Calibri',
                bold: true,
                color: '0369A1',
                align: 'left',
                valign: 'middle',
              });
              break;
            }
          }
        }
      }
    }

    const safeName = template.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    await pptx.writeFile({ fileName: `etiquettes_${safeName}.pptx` });
  }
}
