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

const GaugeChartMinimal: React.FC<GaugeChartProps> = ({
  value,
  min,
  max,
  label,
  unit,
  timestamp,
}) => {
  const clampedValue = Math.min(max, Math.max(min, value));
  const normalizedValue = (clampedValue - min) / (max - min);
  
  // 3/4 circle
  const startAngle = -135;
  const endAngle = 135;
  const totalAngle = endAngle - startAngle;
  const currentAngle = startAngle + normalizedValue * totalAngle;
  
  const radius = 80;
  const strokeWidth = 8;
  const cx = 100;
  const cy = 100;

  const polarToCartesian = (angleInDegrees: number, r: number) => {
    const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180);
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians)
    };
  };

  const createArc = (start: number, end: number, r: number) => {
    const startPos = polarToCartesian(end, r);
    const endPos = polarToCartesian(start, r);
    const largeArcFlag = end - start <= 180 ? "0" : "1";
    return [
      "M", endPos.x, endPos.y,
      "A", r, r, 0, largeArcFlag, 1, startPos.x, startPos.y
    ].join(" ");
  };

  const getValueColor = (val: number) => {
    if (val <= 0) return "text-blue-500";
    if (val < 15) return "text-cyan-600";
    if (val < 30) return "text-orange-500";
    return "text-red-600"; 
  };
  
  const getStrokeColor = (val: number) => {
    if (val <= 0) return "#3b82f6";
    if (val < 15) return "#0891b2";
    if (val < 30) return "#f97316";
    return "#dc2626"; 
 };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-[260px] aspect-[2/1.5] select-none flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
           {/* Background Track */}
           <path
             d={createArc(startAngle, endAngle, radius)}
             fill="none"
             stroke="hsl(var(--muted))"
             strokeWidth={strokeWidth}
             strokeLinecap="round"
             className="opacity-20"
           />
           
           {/* Progress Arc */}
           <path
             d={createArc(startAngle, endAngle, radius)}
             fill="none"
             stroke={getStrokeColor(value)}
             strokeWidth={strokeWidth}
             strokeLinecap="round"
             strokeDasharray={2 * Math.PI * radius * (totalAngle / 360)}
             strokeDashoffset={(2 * Math.PI * radius * (totalAngle / 360)) * (1 - normalizedValue)}
             style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease" }}
           />
        </svg>
        
        {/* Centered Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
           <div className="flex items-baseline gap-1">
              <span className={`text-5xl font-extralight tracking-tighter ${getValueColor(value)}`}>
                  {value.toFixed(1)}
              </span>
           </div>
           <div className="flex items-center gap-1 text-muted-foreground mt-2">
             <span className="text-sm font-medium uppercase tracking-widest text-[10px]">{label}</span>
             <span className="text-xs">({unit})</span>
           </div>
           
           {timestamp && timestamp > 0 && (
            <span className="text-[10px] text-muted-foreground/40 mt-1">
               {new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
           )}
        </div>
      </div>
    </div>
  );
};

export default GaugeChartMinimal;
