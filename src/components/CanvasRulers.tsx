import React from 'react';

interface CanvasRulersProps {
  width_mm: number;
  height_mm: number;
  zoom: number;
  mousePosMm: { x_mm: number; y_mm: number } | null;
}

export const CanvasRulers: React.FC<CanvasRulersProps> = ({
  width_mm,
  height_mm,
  zoom,
  mousePosMm,
}) => {
  const scalePxPerMm = 3.78 * zoom;
  const totalW = width_mm * scalePxPerMm;
  const totalH = height_mm * scalePxPerMm;

  // Generate ticks for 10mm increments
  const hTicks: number[] = [];
  for (let mm = 0; mm <= width_mm; mm += 5) {
    hTicks.push(mm);
  }

  const vTicks: number[] = [];
  for (let mm = 0; mm <= height_mm; mm += 5) {
    vTicks.push(mm);
  }

  return (
    <>
      {/* Top Ruler */}
      <div
        className="absolute -top-6 left-0 h-6 bg-slate-800 border-b border-slate-700 text-[9px] font-mono font-semibold text-slate-300 pointer-events-none select-none z-10 overflow-hidden rounded-t-xs"
        style={{ width: `${totalW}px` }}
      >
        <div className="relative w-full h-full">
          {hTicks.map((mm) => {
            const leftPx = mm * scalePxPerMm;
            const isMajor = mm % 10 === 0;
            return (
              <div
                key={`h_${mm}`}
                className="absolute bottom-0 border-l border-slate-500"
                style={{
                  left: `${leftPx}px`,
                  height: isMajor ? '12px' : '6px',
                }}
              >
                {isMajor && mm > 0 && (
                  <span className="absolute bottom-3 -left-2 text-[8px] text-slate-300">
                    {mm}
                  </span>
                )}
              </div>
            );
          })}

          {/* Live mouse indicator */}
          {mousePosMm && mousePosMm.x_mm >= 0 && mousePosMm.x_mm <= width_mm && (
            <div
              className="absolute top-0 bottom-0 border-l border-amber-400 z-20"
              style={{ left: `${mousePosMm.x_mm * scalePxPerMm}px` }}
            />
          )}
        </div>
      </div>

      {/* Left Ruler */}
      <div
        className="absolute top-0 -left-6 w-6 bg-slate-800 border-r border-slate-700 text-[9px] font-mono font-semibold text-slate-300 pointer-events-none select-none z-10 overflow-hidden rounded-l-xs"
        style={{ height: `${totalH}px` }}
      >
        <div className="relative w-full h-full">
          {vTicks.map((mm) => {
            const topPx = mm * scalePxPerMm;
            const isMajor = mm % 10 === 0;
            return (
              <div
                key={`v_${mm}`}
                className="absolute right-0 border-t border-slate-500"
                style={{
                  top: `${topPx}px`,
                  width: isMajor ? '12px' : '6px',
                }}
              >
                {isMajor && mm > 0 && (
                  <span className="absolute right-3 -top-2 text-[8px] text-slate-300">
                    {mm}
                  </span>
                )}
              </div>
            );
          })}

          {/* Live mouse indicator */}
          {mousePosMm && mousePosMm.y_mm >= 0 && mousePosMm.y_mm <= height_mm && (
            <div
              className="absolute left-0 right-0 border-t border-amber-400 z-20"
              style={{ top: `${mousePosMm.y_mm * scalePxPerMm}px` }}
            />
          )}
        </div>
      </div>
    </>
  );
};
