import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { WidgetConfig } from '@/store/useBuilderStore';
import { useWidgetData } from '@/hooks/useWidgetData';
import { useValueStoreData } from '@/hooks/useValueStoreData';
import { Skeleton } from '@/components/ui/skeleton';
import { Cylinder } from 'lucide-react';

interface TankWidgetProps {
  config: WidgetConfig;
  nodeId?: string;
  pollIntervalMs?: number;
  isEditMode?: boolean;
}

export function TankWidget({ config, nodeId, pollIntervalMs, isEditMode }: TankWidgetProps) {
  const dataSource = config.config.dataSource || 'variable';
  const deviceKey = config.config.deviceKey || '';

  const min = config.config.min ?? 0;
  const max = config.config.max ?? 100;
  const unit = config.config.unit || '%';
  const baseColor = config.config.color || '#3b82f6';
  const shape = config.config.shape || 'cylinder'; // cylinder | rectangle

  const isVar = dataSource === 'variable';
  const isVs = dataSource === 'valuestore';

  const varData = useWidgetData(
    isVar && !isEditMode && deviceKey ? nodeId : undefined,
    isVar && !isEditMode && deviceKey ? deviceKey : undefined,
    pollIntervalMs
  );

  const vsData = useValueStoreData(
    isVs && !isEditMode && deviceKey ? nodeId : undefined,
    isVs && !isEditMode && deviceKey ? deviceKey : undefined,
    pollIntervalMs
  );

  let value: number | null | undefined = undefined;
  let rawTs: number | null = null;

  if (isEditMode || !deviceKey) {
    value = undefined;
  } else if (isVar) {
    value = varData.value as number;
    rawTs = varData.timestamp;
  } else if (isVs) {
    value = vsData.value as number;
    rawTs = vsData.timestamp;
  }

  // Pre-calculate fill
  const hasData = value !== undefined && value !== null;
  const safeValue = hasData ? Number(value) : 0;

  // Calculate percentage (clamped between 0 and 100)
  const rawPercentage = max > min ? ((safeValue - min) / (max - min)) * 100 : 0;
  const clampRaw = Math.max(0, Math.min(100, rawPercentage));
  const fillPercentage = hasData ? clampRaw : 0;

  const fmtTs = (ts: number | null) => {
    if (!ts || ts === 0) return '--';
    // If ts is very large, it might be in ms. Standard Anedya is seconds but fallback to js Date logic if needed.
    const isMs = ts > 1e11;
    return new Date(isMs ? ts : ts * 1000).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render variables
  const isCylinder = shape === 'cylinder';

  return (
    <Card className="w-full h-full flex flex-col hover:border-primary transition-colors overflow-hidden">
      <CardContent className="p-3 flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-2 pb-1 shrink-0">
          <Cylinder size={14} className="text-muted-foreground" />
          <span
            className="text-sm font-semibold text-foreground truncate"
            title={config.title}
          >
            {config.title || 'Tank Level'}
          </span>
        </div>

        <div className="flex-1 min-h-0 flex items-center justify-center relative overflow-hidden px-2 gap-4">

          {/* Visual Tank/Silo element (Vertical) */}
          <div className="relative h-full aspect-[2/5] max-h-[250px] min-h-[60px] flex items-end justify-center shrink-0">
            {/* Outline / Shell */}
            <div
              className={`absolute inset-0 bg-muted/30 border-2 border-muted-foreground/30 overflow-hidden flex flex-col justify-end shadow-inner
                ${isCylinder ? 'rounded-t-[30%] rounded-b-[20%]' : 'rounded-md'}
              `}
            >
              {/* Back highlight/shadow to make it cylinder-like */}
              {isCylinder && (
                <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-white/10 z-10 pointer-events-none" />
              )}

              {/* Liquid Fill */}
              {hasData ? (
                <div
                  className="w-full relative transition-all duration-700 ease-out z-0"
                  style={{
                    height: `${fillPercentage}%`,
                    backgroundColor: baseColor,
                    // Top liquid surface highlight logic for cylinder
                    borderRadius: isCylinder && fillPercentage < 100 ? 't-[20%]' : undefined
                  }}
                >
                  {isCylinder && (
                    <div className="absolute top-0 w-full h-[10px] -mt-[5px] bg-white/20 rounded-[50%]" />
                  )}
                  {/* Subtle shine on liquid */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-black/10" />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full opacity-50">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground rotate-[-90deg] tracking-widest min-w-max">Off</span>
                </div>
              )}
            </div>
          </div>

          {/* Value Display */}
          <div className="flex flex-col justify-center gap-1 shrink-0">
            {hasData ? (
              <>
                <div className="flex items-baseline gap-1" style={{ color: baseColor }}>
                  <span className="text-3xl font-bold tracking-tight tabular-nums">
                    {Number(safeValue.toFixed(1))}
                  </span>
                  {unit && <span className="text-sm font-medium">{unit} Full</span>}
                </div>
                {rawTs ? (
                  <div className="text-[10px] text-muted-foreground/80 mt-1 whitespace-nowrap">
                    Updated: {fmtTs(rawTs)}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex flex-col gap-2 w-16">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-3 w-10" />
              </div>
            )}

            {/* Display bounds info briefly */}
            <div className="mt-3 hidden sm:flex flex-col gap-0.5 text-[10px] text-muted-foreground/70 font-medium">
              <div className="flex justify-between gap-4">
                <span>Max:</span>
                <span>{max} {unit}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Min:</span>
                <span>{min} {unit}</span>
              </div>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
