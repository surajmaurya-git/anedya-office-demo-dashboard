import React from "react";

interface GaugeChartProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  color?: string;
  timestamp?: number;
}

const GaugeChartRetro: React.FC<GaugeChartProps> = ({
  value,
  min,
  max,
  label,
  unit,
  timestamp,
}) => {
  const clampedValue = Math.min(max, Math.max(min, value));
  const normalizedValue = (clampedValue - min) / (max - min);
  
  // Angle for needle: -90 (left) to 90 (right)
  const angle = normalizedValue * 180 - 90;
  
  const radius = 70;
  const strokeWidth = 20;

  // Ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((p) => {
    const val = min + (max - min) * p;
    const tickAngle = p * 180 - 90;
    const rad = (tickAngle - 90) * (Math.PI / 180);
    const startR = radius + strokeWidth/2 + 2;
    const endR = radius + strokeWidth/2 + 8;
    return {
      x1: 100 + startR * Math.cos(rad),
      y1: 100 + startR * Math.sin(rad),
      x2: 100 + endR * Math.cos(rad),
      y2: 100 + endR * Math.sin(rad),
      tx: 100 + (endR + 10) * Math.cos(rad),
      ty: 100 + (endR + 10) * Math.sin(rad),
      value: Math.round(val),
    };
  });

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="bg-[#f0eadd] dark:bg-[#2a2a2a] border-2 border-[#b8a07e] rounded-xl p-4 shadow-inner relative w-full max-w-[260px] aspect-[2/1.3] select-none">
        <svg viewBox="0 0 200 135" className="w-full h-full overflow-visible">
          {/* Background Arc - Thick and colored regions */}
          <path d="M 30 100 A 70 70 0 0 1 170 100" fill="none" stroke="#eaffe0" strokeWidth={strokeWidth} className="dark:stroke-neutral-700"/>
          
          {/* Colored Zones */}
          {/* Simple segmented zones logic requires path calculation based on angles, hardcoded for now to mimic retro dash */}
           <path d="M 30 100 A 70 70 0 0 1 65 39" fill="none" stroke="#2563eb" strokeWidth={strokeWidth} opacity="0.6" /> {/* Cold */}
           <path d="M 135 39 A 70 70 0 0 1 170 100" fill="none" stroke="#dc2626" strokeWidth={strokeWidth} opacity="0.6" /> {/* Hot */}

          {/* Ticks */}
          {ticks.map((t, i) => (
             <g key={i}>
                <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="currentColor" strokeWidth="2" className="text-foreground/80"/>
                <text x={t.tx} y={t.ty} textAnchor="middle" alignmentBaseline="middle" className="text-[10px] font-mono fill-foreground font-bold">{t.value}</text>
             </g>
          ))}


          {/* Needle - Thick and vintage */}
          <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: "100px 100px", transition: "transform 1s cubic-bezier(0.2, 0.8, 0.2, 1)" }}>
             <path d="M 100 100 L 100 35" stroke="#dc2626" strokeWidth="4" strokeLinecap="round"/>
             <circle cx="100" cy="100" r="6" fill="#dc2626"/>
             <circle cx="100" cy="100" r="2" fill="#fff"/>
          </g>

          <text x="100" y="80" textAnchor="middle" className="text-[10px] font-serif fill-foreground uppercase tracking-widest opacity-60">Temperature</text>
        </svg>

        <div className="absolute top-2 right-2 border bg-background px-2 py-1 rounded text-xs font-mono font-bold shadow-sm">
           {value.toFixed(1)} {unit}
        </div>
      </div>
    </div>
  );
};

export default GaugeChartRetro;
