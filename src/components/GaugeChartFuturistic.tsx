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

const GaugeChartFuturistic: React.FC<GaugeChartProps> = ({
  value,
  min,
  max,
  label,
  unit,
  timestamp,
}) => {
  const clampedValue = Math.min(max, Math.max(min, value));
  const normalizedValue = (clampedValue - min) / (max - min);
  const percent = Math.round(normalizedValue * 100);

  // Digital Ring Logic
  // Segmented arc
  const segments = Array.from({ length: 40 }).map((_, i) => ({
      angle: (i / 40) * 270 - 135,
      active: i / 40 < normalizedValue
  }));

  const radius = 80;
  const polarToCartesian = (angleInDegrees: number, r: number) => {
    const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180);
    return {
      x: 100 + r * Math.cos(angleInRadians),
      y: 100 + r * Math.sin(angleInRadians)
    };
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-[260px] aspect-square flex items-center justify-center bg-black rounded-full border border-green-800 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
        <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
            {/* Center Grid */}
            <path d="M 50 100 H 150 M 100 50 V 150" stroke="#22c55e" strokeWidth="0.5" opacity="0.2"/>
            <circle cx="100" cy="100" r="40" stroke="#22c55e" strokeWidth="1" fill="none" opacity="0.3" strokeDasharray="4 2"/>

            {/* Segments */}
            {segments.map((s, i) => {
                const start = polarToCartesian(s.angle, radius);
                const end = polarToCartesian(s.angle + 4, radius); // each segment ~4 deg wide
                return (
                    <line 
                        key={i}
                        x1={start.x} y1={start.y} 
                        x2={end.x} y2={end.y} 
                        stroke={s.active ? "#22c55e" : "#1e293b"} 
                        strokeWidth="8" 
                        strokeLinecap="round"
                        className={s.active ? "drop-shadow-[0_0_4px_#22c55e]" : ""}
                    />
                )
            })}
        </svg>

        {/* Digital Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-mono font-bold text-green-400 drop-shadow-[0_0_8px_#22c55e]">
                {value.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-green-700 mt-1 uppercase tracking-widest">{unit}</span>
            <span className="text-[10px] text-green-900 mt-2 font-mono uppercase">{label}</span>
        </div>
      </div>
    </div>
  );
};

export default GaugeChartFuturistic;
