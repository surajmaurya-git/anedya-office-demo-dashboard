import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart } from 'lucide-react';
import { WidgetConfig } from '@/store/useBuilderStore';
import { useWidgetData } from '@/hooks/useWidgetData';
import { useValueStoreData } from '@/hooks/useValueStoreData';

// ─── Public type (imported by PropertiesPanel) ─────────────────────────────
export interface DonutSeries {
  id: string;
  label: string;
  deviceKey: string;
  dataSource: 'variable' | 'valuestore';
  min: number;
  max: number;
  unit: string;
  color: string;
}

// Preview values shown in edit mode (one per slot)
const PREVIEW_VALUES = [68, 42, 85, 27];
const PREVIEW_RAWS = [68, 42, 85, 27];

// ─── Helper: hex → rgba ────────────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Props ─────────────────────────────────────────────────────────────────
interface DonutChartWidgetProps {
  config: WidgetConfig;
  nodeId?: string;
  pollIntervalMs?: number;
  isEditMode?: boolean;
}

/**
 * DonutChartWidget — Multi-series concentric ring chart for IoT data.
 *
 * Supports up to 4 independent data series. Each series maps to one concentric
 * ring. Fill percentage = (value − min) / (max − min). Values are fetched from
 * either the Anedya Variable API or ValueStore API per-series.
 *
 * Sizing is fully dynamic (ResizeObserver), identical to GaugeChart.
 */
export function DonutChartWidget({
  config,
  nodeId,
  pollIntervalMs,
  isEditMode,
}: DonutChartWidgetProps) {
  // ── Responsive container ──────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 200, h: 200 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      setContainerSize({ w: el.offsetWidth, h: el.offsetHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Series config ─────────────────────────────────────────────────────────
  const seriesList: DonutSeries[] = useMemo(
    () => ((config.config.series as DonutSeries[]) || []).slice(0, 4),
    [config.config.series]
  );

  // Fixed 4 hook slots — Rules of Hooks: always called, always same order.
  // Inactive slots use `undefined` nodeId/key so the underlying hook skips fetching.
  const s0 = seriesList[0] as DonutSeries | undefined;
  const s1 = seriesList[1] as DonutSeries | undefined;
  const s2 = seriesList[2] as DonutSeries | undefined;
  const s3 = seriesList[3] as DonutSeries | undefined;

  // Slot 0
  const vs0 = useValueStoreData(
    !isEditMode && s0?.dataSource === 'valuestore' ? nodeId : undefined,
    !isEditMode && s0?.dataSource === 'valuestore' ? s0?.deviceKey : undefined,
    s0?.dataSource === 'valuestore' ? pollIntervalMs : 0
  );
  const vr0 = useWidgetData(
    !isEditMode && s0?.dataSource === 'variable' ? nodeId : undefined,
    !isEditMode && s0?.dataSource === 'variable' ? s0?.deviceKey : undefined,
    s0?.dataSource === 'variable' ? pollIntervalMs : 0
  );

  // Slot 1
  const vs1 = useValueStoreData(
    !isEditMode && s1?.dataSource === 'valuestore' ? nodeId : undefined,
    !isEditMode && s1?.dataSource === 'valuestore' ? s1?.deviceKey : undefined,
    s1?.dataSource === 'valuestore' ? pollIntervalMs : 0
  );
  const vr1 = useWidgetData(
    !isEditMode && s1?.dataSource === 'variable' ? nodeId : undefined,
    !isEditMode && s1?.dataSource === 'variable' ? s1?.deviceKey : undefined,
    s1?.dataSource === 'variable' ? pollIntervalMs : 0
  );

  // Slot 2
  const vs2 = useValueStoreData(
    !isEditMode && s2?.dataSource === 'valuestore' ? nodeId : undefined,
    !isEditMode && s2?.dataSource === 'valuestore' ? s2?.deviceKey : undefined,
    s2?.dataSource === 'valuestore' ? pollIntervalMs : 0
  );
  const vr2 = useWidgetData(
    !isEditMode && s2?.dataSource === 'variable' ? nodeId : undefined,
    !isEditMode && s2?.dataSource === 'variable' ? s2?.deviceKey : undefined,
    s2?.dataSource === 'variable' ? pollIntervalMs : 0
  );

  // Slot 3
  const vs3 = useValueStoreData(
    !isEditMode && s3?.dataSource === 'valuestore' ? nodeId : undefined,
    !isEditMode && s3?.dataSource === 'valuestore' ? s3?.deviceKey : undefined,
    s3?.dataSource === 'valuestore' ? pollIntervalMs : 0
  );
  const vr3 = useWidgetData(
    !isEditMode && s3?.dataSource === 'variable' ? nodeId : undefined,
    !isEditMode && s3?.dataSource === 'variable' ? s3?.deviceKey : undefined,
    s3?.dataSource === 'variable' ? pollIntervalMs : 0
  );

  // Resolved raw values per slot
  const rawValues = [
    s0 ? (s0.dataSource === 'valuestore' ? vs0.value : vr0.value) : null,
    s1 ? (s1.dataSource === 'valuestore' ? vs1.value : vr1.value) : null,
    s2 ? (s2.dataSource === 'valuestore' ? vs2.value : vr2.value) : null,
    s3 ? (s3.dataSource === 'valuestore' ? vs3.value : vr3.value) : null,
  ];

  // ── Derived render data ───────────────────────────────────────────────────
  const seriesData = useMemo(
    () =>
      seriesList.map((s, i) => {
        const rawNum = isEditMode ? PREVIEW_VALUES[i] : Number(rawValues[i]);
        const hasData = isEditMode || (rawValues[i] !== null && rawValues[i] !== undefined);
        const clamped = isNaN(rawNum)
          ? s.min
          : Math.min(s.max, Math.max(s.min, rawNum));
        const range = s.max - s.min;
        const pct = range === 0 ? 0 : ((clamped - s.min) / range) * 100;
        return {
          ...s,
          numValue: clamped,
          pct: Math.min(100, Math.max(0, pct)),
          hasData,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seriesList, ...rawValues, isEditMode]
  );

  // ── SVG geometry ────────────────────────────────────────────────────────
  // Chart takes square space; legend is below.
  const count = seriesData.length;
  const svgSide = Math.min(containerSize.w, containerSize.h);
  const cx = svgSide / 2;
  const cy = svgSide / 2;

  // Dynamic stroke width: shrinks with more rings / smaller space
  const strokeWidth = Math.max(8, Math.min(20, svgSide * 0.095));
  const ringGap = Math.max(3, svgSide * 0.022);
  const outerPad = strokeWidth / 2 + 4;

  // Outermost ring radius; each subsequent ring steps inward
  const outerRadius = svgSide / 2 - outerPad;

  const ringRadii = seriesData.map((_, i) => outerRadius - i * (strokeWidth + ringGap));

  // ── Empty state ───────────────────────────────────────────────────────────
  if (count === 0) {
    return (
      <Card className="w-full h-full flex flex-col hover:border-primary transition-colors cursor-default overflow-hidden">
        <CardHeader className="pb-2 pt-3 px-4 border-b flex-none">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <PieChart className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{config.title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center text-xs text-muted-foreground text-center p-6">
          Add at least one series in the Properties panel to display data.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full flex flex-col hover:border-primary transition-colors cursor-default overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-4 border-b flex-none">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <PieChart className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate" title={config.title}>
            {config.title}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3 flex-1 flex flex-col min-h-0 gap-3">
        {/* ── SVG chart area ── */}
        <div
          ref={containerRef}
          className="flex-1 flex items-center justify-center min-h-0 w-full"
        >
          {svgSide > 0 && (
            <svg
              width={svgSide}
              height={svgSide}
              viewBox={`0 0 ${svgSide} ${svgSide}`}
              /* Rotate so arcs start at the top (12 o'clock) */
              style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
              aria-label={config.title}
            >
              {seriesData.map((s, i) => {
                const r = ringRadii[i];
                if (r <= strokeWidth / 2) return null; // too small to render

                const circumference = 2 * Math.PI * r;
                const filledDash = (s.pct / 100) * circumference;
                const trackColor = hexToRgba(s.color || '#94a3b8', 0.12);

                return (
                  <g key={s.id}>
                    {/* Background track ring */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="none"
                      stroke={trackColor}
                      strokeWidth={strokeWidth}
                    />
                    {/* Filled arc */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill="none"
                      stroke={s.color || '#94a3b8'}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${filledDash} ${circumference}`}
                      strokeLinecap="round"
                      style={{
                        transition: 'stroke-dasharray 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* ── Legend / value table ── */}
        <div className="flex-none flex flex-col gap-1.5 border-t pt-2">
          {seriesData.map((s) => {
            const displayValue = s.hasData ? s.numValue.toFixed(2) : '--';
            const pctStr = s.hasData ? `${s.pct.toFixed(0)}%` : '';

            return (
              <div key={s.id} className="flex items-center gap-2 text-xs min-w-0">
                {/* Color swatch */}
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0 border border-white/40"
                  style={{ backgroundColor: s.color || '#94a3b8', boxShadow: `0 0 0 1px ${s.color}44` }}
                />

                {/* Label */}
                <span className="text-muted-foreground truncate flex-1 min-w-0">
                  {s.label || s.deviceKey || 'Series'}
                </span>

                {/* Value + unit */}
                <span
                  className="font-semibold tabular-nums shrink-0"
                  style={{ color: s.color || 'inherit' }}
                >
                  {displayValue}
                  {s.unit && (
                    <span className="font-normal text-muted-foreground ml-0.5">
                      {s.unit}
                    </span>
                  )}
                </span>

                {/* Percentage badge */}
                {pctStr && (
                  <span
                    className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: hexToRgba(s.color || '#94a3b8', 0.12),
                      color: s.color || 'inherit',
                    }}
                  >
                    {pctStr}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
