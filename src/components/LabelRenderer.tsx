import React, { useMemo } from 'react';
import { LabelTemplate, ProductRecord, TemplateItem } from '../types';
import { TierEngine } from '../utils/tierEngine';
import { generateCode128Bars, generateEAN13Bars } from '../utils/barcodeGenerator';
import { generateQrMatrix } from '../utils/qrGenerator';
import { SmartGuideLine } from '../utils/smartGuides';

interface LabelRendererProps {
  template: LabelTemplate;
  record?: ProductRecord;
  zoom?: number; // scale: 1 = 3.78 px per mm (approx 96 DPI)
  scalePxPerMm?: number;
  showBleed?: boolean;
  showInnerMargins?: boolean;
  showHazardWarnings?: boolean;
  selectedItemId?: string | null;
  selectedItemIds?: string[];
  onSelectItem?: (id: string, e: React.MouseEvent) => void;
  onResizeStart?: (id: string, handle: string, e: React.MouseEvent) => void;
  smartGuides?: SmartGuideLine[];
  interactive?: boolean;
  className?: string;
  id?: string;
}

export const LabelRenderer: React.FC<LabelRendererProps> = ({
  template,
  record,
  zoom = 1.0,
  scalePxPerMm = 3.78, // 3.78 px per mm is standard screen DPI
  showBleed = true,
  showInnerMargins = true,
  showHazardWarnings = false,
  selectedItemId = null,
  selectedItemIds,
  onSelectItem,
  onResizeStart,
  smartGuides = [],
  interactive = false,
  className = '',
  id,
}) => {
  const pxPerMm = scalePxPerMm * zoom;

  const widthPx = template.width_mm * pxPerMm;
  const heightPx = template.height_mm * pxPerMm;

  // Printable bounds in mm
  const printableArea = useMemo(() => {
    return {
      left: template.inner_margins_mm.left,
      top: template.inner_margins_mm.top,
      right: template.width_mm - template.inner_margins_mm.right,
      bottom: template.height_mm - template.inner_margins_mm.bottom,
    };
  }, [template]);

  // Check if item exceeds printable area
  const checkHazard = (item: TemplateItem): boolean => {
    return (
      item.x_mm < printableArea.left - 0.1 ||
      item.y_mm < printableArea.top - 0.1 ||
      item.x_mm + item.w_mm > printableArea.right + 0.1 ||
      item.y_mm + item.h_mm > printableArea.bottom + 0.1
    );
  };

  // Render individual item
  const renderItemContent = (item: TemplateItem) => {
    const itemW = item.w_mm * pxPerMm;
    const itemH = item.h_mm * pxPerMm;

    switch (item.type) {
      case 'text': {
        let displayVal = item.text;
        if (record && item.binding_key && record[item.binding_key] !== undefined) {
          const raw = record[item.binding_key];
          if (typeof raw === 'number') {
            displayVal = raw.toLocaleString('fr-FR');
          } else {
            displayVal = String(raw);
          }
        }

        // Alignments
        const textAlignClass =
          item.alignment === 'center'
            ? 'text-center'
            : item.alignment === 'right'
            ? 'text-right'
            : item.alignment === 'justify'
            ? 'text-justify'
            : 'text-left';

        const vAlignClass =
          item.valign === 'middle'
            ? 'justify-center'
            : item.valign === 'bottom'
            ? 'justify-end'
            : 'justify-start';

        // Scale font size proportionally
        const fontSizePx = Math.max(7, item.font_size_pt * 1.333 * zoom);

        let finalDisplay = displayVal || item.placeholder || '';
        if (item.prefix_text) finalDisplay = `${item.prefix_text} ${finalDisplay}`;
        if (item.suffix_text) finalDisplay = `${finalDisplay} ${item.suffix_text}`;

        const letterSpacingPx = item.letter_spacing_pt ? `${item.letter_spacing_pt * 1.333 * zoom}px` : undefined;
        const lineHeightStyle = item.line_height_multiplier ? item.line_height_multiplier : 1.25;
        const textTransform = item.text_transform && item.text_transform !== 'none' ? item.text_transform : undefined;

        return (
          <div
            className={`w-full h-full flex flex-col ${vAlignClass} overflow-hidden p-0.5`}
            style={{
              backgroundColor: item.fill_color || 'transparent',
              border: item.border_width && item.border_width > 0 ? `${item.border_width * zoom}px solid ${item.border_color || '#000'}` : 'none',
              borderRadius: item.corner_radius ? `${item.corner_radius * pxPerMm}px` : undefined,
            }}
          >
            <div
              className={`${textAlignClass} w-full whitespace-pre-wrap break-words`}
              style={{
                fontFamily: item.font_family,
                fontSize: `${fontSizePx}px`,
                fontWeight: item.font_weight || 'normal',
                fontStyle: item.font_style || 'normal',
                textDecoration: item.text_decoration || 'none',
                color: item.text_color || '#000000',
                letterSpacing: letterSpacingPx,
                lineHeight: lineHeightStyle,
                textTransform: textTransform as any,
              }}
            >
              {finalDisplay}
            </div>
          </div>
        );
      }

      case 'shape': {
        return (
          <div
            className="w-full h-full"
            style={{
              backgroundColor: item.fill_color || '#FFFFFF',
              border: `${Math.max(1, (item.border_width || 1) * zoom)}px solid ${item.border_color || '#000000'}`,
              borderRadius: item.corner_radius ? `${item.corner_radius * pxPerMm}px` : '0px',
            }}
          />
        );
      }

      case 'ellipse': {
        return (
          <div
            className="w-full h-full rounded-full"
            style={{
              backgroundColor: item.fill_color || 'transparent',
              border: `${Math.max(1, (item.border_width || 1) * zoom)}px solid ${item.border_color || '#000000'}`,
            }}
          />
        );
      }

      case 'line': {
        const strokeW = Math.max(1, (item.thickness || 1) * zoom);
        return (
          <div className="w-full h-full flex items-center">
            <div
              className="w-full"
              style={{
                height: `${strokeW}px`,
                backgroundColor: item.style === 'solid' ? item.color : 'transparent',
                borderTop: item.style !== 'solid' ? `${strokeW}px ${item.style} ${item.color}` : 'none',
              }}
            />
          </div>
        );
      }

      case 'barcode': {
        let code = item.code || '123456789012';
        if (record && item.binding_key && record[item.binding_key]) {
          code = String(record[item.binding_key]);
        }

        const isEan13 = item.barcode_type === 'ean13';
        let barElements: React.ReactNode = null;

        try {
          if (isEan13) {
            const { bars, formattedCode } = generateEAN13Bars(code);
            const totalBars = bars.length;
            const barW = itemW / totalBars;
            const barH = item.show_text ? Math.max(10, itemH - 12 * zoom) : itemH;

            barElements = (
              <div className="w-full h-full flex flex-col items-center justify-center bg-white px-1 py-0.5 select-none">
                <svg
                  width={itemW}
                  height={barH}
                  viewBox={`0 0 ${totalBars} 100`}
                  preserveAspectRatio="none"
                  className="w-full"
                >
                  {bars.map((isBar, idx) =>
                    isBar ? (
                      <rect
                        key={idx}
                        x={idx}
                        y={0}
                        width={1.05}
                        height={100}
                        fill={item.bar_color || '#000000'}
                      />
                    ) : null
                  )}
                </svg>
                {item.show_text && (
                  <span
                    className="font-mono tracking-widest text-slate-800 leading-none pt-0.5"
                    style={{ fontSize: `${Math.max(8, 8.5 * zoom)}px` }}
                  >
                    {formattedCode}
                  </span>
                )}
              </div>
            );
          } else {
            const bars = generateCode128Bars(code);
            const totalBars = bars.length;
            const barH = item.show_text ? Math.max(10, itemH - 12 * zoom) : itemH;

            barElements = (
              <div className="w-full h-full flex flex-col items-center justify-center bg-white px-1 py-0.5 select-none">
                <svg
                  width={itemW}
                  height={barH}
                  viewBox={`0 0 ${totalBars} 100`}
                  preserveAspectRatio="none"
                  className="w-full"
                >
                  {bars.map((isBar, idx) =>
                    isBar ? (
                      <rect
                        key={idx}
                        x={idx}
                        y={0}
                        width={1.05}
                        height={100}
                        fill={item.bar_color || '#000000'}
                      />
                    ) : null
                  )}
                </svg>
                {item.show_text && (
                  <span
                    className="font-mono tracking-wider text-slate-800 leading-none pt-0.5"
                    style={{ fontSize: `${Math.max(8, 8.5 * zoom)}px` }}
                  >
                    {code}
                  </span>
                )}
              </div>
            );
          }
        } catch {
          barElements = (
            <div className="w-full h-full flex items-center justify-center bg-amber-50 text-amber-800 border border-amber-300 text-xs text-center p-1">
              [Code-barres: {code}]
            </div>
          );
        }

        return barElements;
      }

      case 'qrcode': {
        let content = item.content || 'https://example.com';
        if (record && item.binding_key && record[item.binding_key]) {
          content = String(record[item.binding_key]);
        }
        const matrix = generateQrMatrix(content);
        const matrixSize = matrix.length;
        const cellSize = 100 / matrixSize;

        return (
          <div
            className="w-full h-full flex items-center justify-center p-1"
            style={{ backgroundColor: item.background_color || '#FFFFFF' }}
          >
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full"
              shapeRendering="crispEdges"
            >
              {matrix.map((row, rIdx) =>
                row.map((val, cIdx) =>
                  val ? (
                    <rect
                      key={`${rIdx}-${cIdx}`}
                      x={cIdx * cellSize}
                      y={rIdx * cellSize}
                      width={cellSize + 0.05}
                      height={cellSize + 0.05}
                      fill={item.module_color || '#000000'}
                    />
                  ) : null
                )
              )}
            </svg>
          </div>
        );
      }

      case 'image': {
        let src = item.source;
        if (record && item.binding_key && record[item.binding_key]) {
          src = String(record[item.binding_key]);
        }

        if (src) {
          return (
            <img
              src={src}
              alt=""
              className="w-full h-full"
              style={{
                objectFit: item.keep_aspect_ratio ? 'contain' : 'fill',
                opacity: item.opacity ?? 1,
              }}
              referrerPolicy="no-referrer"
            />
          );
        }

        return (
          <div className="w-full h-full border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 text-xs p-1 select-none">
            [ Image ]
          </div>
        );
      }

      case 'tier_price': {
        // Resolve tier price block using TierEngine
        let tierText = `[${item.prefix_text}] Palier #${item.primary_tier} (${item.unit_label})`;
        let isFallback = false;
        let isError = false;

        if (record) {
          const resolved = TierEngine.resolve(
            {
              primary_index: Math.max(0, item.primary_tier - 1),
              keyword_prefix: item.prefix_text,
              unit_label: item.unit_label,
              strict_required: item.strict_required,
              fallback_to_base_price: item.fallback_to_base_price ?? true,
            },
            record
          );

          if (resolved) {
            if (resolved.error) {
              tierText = resolved.text_qty;
              isError = true;
            } else {
              isFallback = resolved.is_fallback;
              tierText = `${resolved.text_qty} : ${resolved.formatted_price}${isFallback ? ' (base)' : ''}`;
            }
          }
        }

        return (
          <div
            className={`w-full h-full flex items-center justify-between px-2 py-1 rounded border transition-colors ${
              isError
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : isFallback
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-sky-50 border-sky-300 text-sky-950'
            }`}
          >
            <span
              className="font-bold truncate tracking-tight"
              style={{ fontSize: `${Math.max(7.5, 8.5 * zoom)}px` }}
            >
              {tierText}
            </span>
            {item.strict_required && !record && (
              <span className="text-rose-500 font-bold ml-1 text-xs">*</span>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      id={id}
      className={`relative select-none shadow-sm transition-shadow ${className}`}
      style={{
        width: `${widthPx}px`,
        height: `${heightPx}px`,
        backgroundColor: template.bg_color || '#FFFFFF',
        opacity: template.bg_opacity ?? 1.0,
      }}
    >
      {/* Background Reference Image (Non-printing guide) */}
      {template.background_image_path && template.background_image_visible && (
        <img
          src={template.background_image_path}
          alt="Reference Background"
          className="absolute inset-0 w-full h-full pointer-events-none z-0 select-none"
          style={{
            objectFit: template.background_image_fit === 'stretch' ? 'fill' : template.background_image_fit || 'contain',
            opacity: template.background_image_opacity ?? 0.35,
          }}
          referrerPolicy="no-referrer"
        />
      )}

      {/* Inner Printable Margins boundary guide */}
      {showInnerMargins && (
        <div
          className="absolute pointer-events-none border border-dashed border-sky-400/50 z-10"
          style={{
            top: `${template.inner_margins_mm.top * pxPerMm}px`,
            left: `${template.inner_margins_mm.left * pxPerMm}px`,
            right: `${template.inner_margins_mm.right * pxPerMm}px`,
            bottom: `${template.inner_margins_mm.bottom * pxPerMm}px`,
          }}
        />
      )}

      {/* Outer Bleed Margins (if enabled) */}
      {showBleed && (
        <div
          className="absolute pointer-events-none border border-dotted border-rose-300/40 -inset-[1px] z-10"
        />
      )}

      {/* Template Items */}
      {template.items
        .slice()
        .sort((a, b) => (a.z_index || 0) - (b.z_index || 0))
        .map((item) => {
          const isSelected =
            (selectedItemIds && selectedItemIds.includes(item.id)) ||
            selectedItemId === item.id;
          const isHazard = showHazardWarnings && checkHazard(item);

          return (
            <div
              key={item.id}
              id={`canvas-item-${item.id}`}
              onClick={(e) => {
                if (interactive && onSelectItem) {
                  e.stopPropagation();
                  onSelectItem(item.id, e);
                }
              }}
              className={`absolute cursor-pointer transition-transform ${
                interactive ? 'hover:outline hover:outline-1 hover:outline-sky-400' : ''
              } ${
                isSelected
                  ? 'outline-2 outline-blue-600 outline-dashed ring-2 ring-blue-500/20 z-40'
                  : ''
              }`}
              style={{
                left: `${item.x_mm * pxPerMm}px`,
                top: `${item.y_mm * pxPerMm}px`,
                width: `${item.w_mm * pxPerMm}px`,
                height: `${item.h_mm * pxPerMm}px`,
                transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
                transformOrigin: 'center center',
                zIndex: isSelected ? 50 : item.z_index || 1,
              }}
            >
              {renderItemContent(item)}

              {/* Hazard Warning Overlay when outside printable area */}
              {isHazard && (
                <div
                  className="absolute inset-0 pointer-events-none border-2 border-rose-500 bg-rose-500/20 flex items-center justify-center animate-pulse z-30"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(45deg, rgba(239, 68, 68, 0.3) 0, rgba(239, 68, 68, 0.3) 8px, transparent 8px, transparent 16px)',
                  }}
                  title="Attention: cet élément déborde de la zone imprimable !"
                />
              )}

              {/* Selection resize handles */}
              {isSelected && interactive && !item.locked && (
                <>
                  {/* Top-Left NW */}
                  <div
                    onMouseDown={(e) => {
                      if (onResizeStart) {
                        e.stopPropagation();
                        onResizeStart(item.id, 'nw', e);
                      }
                    }}
                    className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-xs cursor-nwse-resize z-50 shadow-xs hover:bg-blue-50 hover:scale-125 transition-transform"
                    title="Redimensionner"
                  />
                  {/* Top-Right NE */}
                  <div
                    onMouseDown={(e) => {
                      if (onResizeStart) {
                        e.stopPropagation();
                        onResizeStart(item.id, 'ne', e);
                      }
                    }}
                    className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-xs cursor-nesw-resize z-50 shadow-xs hover:bg-blue-50 hover:scale-125 transition-transform"
                    title="Redimensionner"
                  />
                  {/* Bottom-Left SW */}
                  <div
                    onMouseDown={(e) => {
                      if (onResizeStart) {
                        e.stopPropagation();
                        onResizeStart(item.id, 'sw', e);
                      }
                    }}
                    className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-xs cursor-nesw-resize z-50 shadow-xs hover:bg-blue-50 hover:scale-125 transition-transform"
                    title="Redimensionner"
                  />
                  {/* Bottom-Right SE */}
                  <div
                    onMouseDown={(e) => {
                      if (onResizeStart) {
                        e.stopPropagation();
                        onResizeStart(item.id, 'se', e);
                      }
                    }}
                    className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-xs cursor-nwse-resize z-50 shadow-xs hover:bg-blue-50 hover:scale-125 transition-transform"
                    title="Redimensionner"
                  />
                  {/* Middle-Right E */}
                  <div
                    onMouseDown={(e) => {
                      if (onResizeStart) {
                        e.stopPropagation();
                        onResizeStart(item.id, 'e', e);
                      }
                    }}
                    className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-2.5 bg-white border-2 border-blue-600 rounded-xs cursor-ew-resize z-50 shadow-xs hover:bg-blue-50 hover:scale-125 transition-transform"
                  />
                  {/* Middle-Bottom S */}
                  <div
                    onMouseDown={(e) => {
                      if (onResizeStart) {
                        e.stopPropagation();
                        onResizeStart(item.id, 's', e);
                      }
                    }}
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-2 border-blue-600 rounded-xs cursor-ns-resize z-50 shadow-xs hover:bg-blue-50 hover:scale-125 transition-transform"
                  />
                </>
              )}
            </div>
          );
        })}

      {/* Dynamic Smart Guides Overlay (Magenta Alignment Guidelines) */}
      {smartGuides && smartGuides.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
          {smartGuides.map((guide) => {
            if (guide.orientation === 'vertical') {
              const leftPx = guide.position_mm * pxPerMm;
              const topPx = guide.start_mm * pxPerMm;
              const heightPx = (guide.end_mm - guide.start_mm) * pxPerMm;

              return (
                <React.Fragment key={guide.id}>
                  {/* Vertical Guideline */}
                  <div
                    className="absolute w-[1.5px] bg-rose-500 shadow-xs pointer-events-none"
                    style={{
                      left: `${leftPx}px`,
                      top: `${topPx}px`,
                      height: `${Math.max(4, heightPx)}px`,
                      borderLeft: '1.5px dashed #f43f5e',
                    }}
                  />
                  {/* Guide Alignment Badge / Marker */}
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 px-1 py-0.5 bg-rose-600 text-[9px] font-mono text-white font-bold rounded shadow-xs pointer-events-none z-50 whitespace-nowrap"
                    style={{
                      left: `${leftPx}px`,
                      top: `${topPx + Math.min(20, heightPx / 2)}px`,
                    }}
                  >
                    {guide.label || `${guide.position_mm.toFixed(1)} mm`}
                  </div>
                </React.Fragment>
              );
            } else {
              const topPx = guide.position_mm * pxPerMm;
              const leftPx = guide.start_mm * pxPerMm;
              const widthPx = (guide.end_mm - guide.start_mm) * pxPerMm;

              return (
                <React.Fragment key={guide.id}>
                  {/* Horizontal Guideline */}
                  <div
                    className="absolute h-[1.5px] bg-rose-500 shadow-xs pointer-events-none"
                    style={{
                      top: `${topPx}px`,
                      left: `${leftPx}px`,
                      width: `${Math.max(4, widthPx)}px`,
                      borderTop: '1.5px dashed #f43f5e',
                    }}
                  />
                  {/* Guide Alignment Badge / Marker */}
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 px-1 py-0.5 bg-rose-600 text-[9px] font-mono text-white font-bold rounded shadow-xs pointer-events-none z-50 whitespace-nowrap"
                    style={{
                      left: `${leftPx + Math.min(24, widthPx / 2)}px`,
                      top: `${topPx}px`,
                    }}
                  >
                    {guide.label || `${guide.position_mm.toFixed(1)} mm`}
                  </div>
                </React.Fragment>
              );
            }
          })}
        </div>
      )}
    </div>
  );
};
