import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Power, CalendarPlus, Pencil } from 'lucide-react';
import { WidgetConfig } from '@/store/useBuilderStore';
import { useValueStoreData } from '@/hooks/useValueStoreData';
import { useAuth } from '@/contexts/AuthContext';

interface ToggleSwitchWidgetProps {
  config: WidgetConfig;
  nodeId?: string;
  pollIntervalMs?: number;
  isEditMode?: boolean;
}

/**
 * ToggleSwitchWidget
 *
 * Displays a labelled ON/OFF toggle pill that reads its state from a
 * ValueStore key and writes back the configured on/off value when clicked.
 *
 * State detection: current value === onValue → ON; otherwise → OFF.
 * Write: clicking toggles to the opposite configured value.
 * Viewers (role === 'viewer') can see but not interact with the toggle.
 *
 * Config keys:
 *   deviceKey  – ValueStore key to read/write
 *   onValue    – value that means ON  (default "1")
 *   offValue   – value that means OFF (default "0")
 *   onLabel    – status caption when ON  (default "Active")
 *   offLabel   – status caption when OFF (default "Inactive")
 *   onColor    – hex color for ON state  (default "#22c55e")
 */
export function ToggleSwitchWidget({
  config,
  nodeId,
  pollIntervalMs,
  isEditMode,
}: ToggleSwitchWidgetProps) {
  const { role } = useAuth();

  const key      = config.config.deviceKey || '';
  const onValue  = String(config.config.onValue  ?? '1');
  const offValue = String(config.config.offValue ?? '0');
  const onLabel  = config.config.onLabel  || 'Active';
  const offLabel = config.config.offLabel || 'Inactive';
  const onColor  = config.config.onColor  || '#22c55e';

  const canWrite = role !== 'viewer';

  // ── Data hook (disabled in edit mode / when key is empty) ──────────────
  const vs = useValueStoreData(
    isEditMode || !key ? undefined : nodeId,
    isEditMode || !key ? undefined : key,
    pollIntervalMs
  );

  // Derive ON/OFF from raw value
  const rawStr  = vs.value !== null && vs.value !== undefined ? String(vs.value) : null;
  const liveIsOn = rawStr !== null ? rawStr === onValue : false;

  // Preview state in edit / builder mode
  const [previewOn, setPreviewOn] = useState(true);
  const displayOn = isEditMode ? previewOn : liveIsOn;

  const hasData   = isEditMode || rawStr !== null;
  const isSetting = vs.isSetting;

  // ── Toggle handler ──────────────────────────────────────────────────────
  const handleToggle = useCallback(async () => {
    if (isSetting) return;
    if (isEditMode) {
      setPreviewOn(p => !p);
      return;
    }
    if (!canWrite || !key || !nodeId) return;
    const dataType = config.config.dataType as 'string' | 'float' | 'boolean' | undefined;
    await vs.setValue(displayOn ? offValue : onValue, dataType);
  }, [isSetting, isEditMode, canWrite, key, nodeId, vs, displayOn, offValue, onValue, config.config.dataType]);

  // ── Derived colours ──────────────────────────────────────────────────────
  const offBg = 'hsl(var(--muted))';

  // ── Timestamp formatter ───────────────────────────────────────────────────
  const fmtTs = (ts: number | null) => {
    if (!ts || ts === 0) return '--';
    return new Date(ts * 1000).toLocaleString(undefined, {
      month: 'short',
      day:   'numeric',
      hour:  '2-digit',
      minute:'2-digit',
    });
  };

  return (
    <Card className="w-full h-full flex flex-col hover:border-primary transition-colors overflow-hidden">
      <CardContent className="p-3 flex-1 flex items-center justify-between gap-3 min-w-0">

        {/* ── Left: title + status caption ── */}
        <div className="flex flex-col min-w-0">
          <span
            className="text-sm font-semibold text-foreground truncate leading-tight"
            title={config.title}
          >
            {config.title || 'Toggle Switch'}
          </span>

          <span
            className="text-xs font-medium mt-1 transition-colors duration-300 leading-tight"
            style={{ color: displayOn ? onColor : 'var(--muted-foreground)' }}
          >
            {hasData ? (displayOn ? onLabel : offLabel) : '—'}
          </span>

          {/* Small dot indicator */}
          <span className="flex items-center gap-1.5 mt-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
              style={{
                backgroundColor: displayOn ? onColor : 'hsl(var(--muted-foreground))',
                boxShadow: displayOn ? `0 0 6px ${onColor}` : 'none',
              }}
            />
            {!hasData && !isEditMode && (
              <span className="text-[10px] text-muted-foreground">No data</span>
            )}
            {!canWrite && !isEditMode && (
              <span className="text-[10px] text-muted-foreground">View only</span>
            )}
          </span>
        </div>

        {/* ── Right: toggle pill ── */}
        <button
          type="button"
          aria-label={`Toggle ${config.title}`}
          aria-pressed={displayOn}
          disabled={(!canWrite && !isEditMode) || isSetting}
          onClick={handleToggle}
          className="shrink-0 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
          style={{
            cursor: (canWrite || isEditMode) && !isSetting ? 'pointer' : 'not-allowed',
            opacity: (!canWrite && !isEditMode) ? 0.6 : 1,
          }}
        >
          <TogglePill
            isOn={displayOn}
            isSetting={isSetting}
            onColor={onColor}
            offBg={offBg}
          />
        </button>

      </CardContent>

      {/* ── Timestamp footer ── */}
      {!isEditMode && (vs.created || vs.modified) && (
        <div className="px-3 pb-2 flex flex-col gap-0.5 border-t pt-1.5 bg-muted/10">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <CalendarPlus className="h-3 w-3 shrink-0 text-green-500" />
            <span className="truncate">
              Created:&nbsp;
              <span className="font-medium text-foreground/70">{fmtTs(vs.created)}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Pencil className="h-3 w-3 shrink-0 text-amber-500" />
            <span className="truncate">
              Modified:&nbsp;
              <span className="font-medium text-foreground/70">{fmtTs(vs.modified)}</span>
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Toggle Pill ─────────────────────────────────────────────────────────────

interface TogglePillProps {
  isOn: boolean;
  isSetting: boolean;
  onColor: string;
  offBg: string;
}

function TogglePill({ isOn, isSetting, onColor, offBg }: TogglePillProps) {
  const PILL_W = 74;
  const PILL_H = 34;
  const THUMB  = PILL_H - 6;  // 28 px

  return (
    <div
      style={{
        position: 'relative',
        width:  `${PILL_W}px`,
        height: `${PILL_H}px`,
        borderRadius: `${PILL_H / 2}px`,
        backgroundColor: isOn ? onColor : '#4b5563',
        transition: 'background-color 0.28s ease',
        boxShadow: isOn
          ? `0 0 0 1px ${onColor}55, 0 2px 8px ${onColor}44`
          : '0 2px 6px rgba(0,0,0,0.25)',
        overflow: 'hidden',
      }}
    >
      {/* Label text — shifts side depending on state */}
      <span
        style={{
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          left:  isOn ? '10px' : undefined,
          right: isOn ? undefined : '10px',
          color: 'white',
          fontSize: '10px',
          fontWeight: '800',
          letterSpacing: '0.7px',
          lineHeight: 1,
          userSelect: 'none',
          pointerEvents: 'none',
          transition: 'left 0.28s ease, right 0.28s ease',
        }}
      >
        {isOn ? 'ON' : 'OFF'}
      </span>

      {/* Thumb circle */}
      <div
        style={{
          position: 'absolute',
          top: '3px',
          left: isOn ? `${PILL_W - THUMB - 3}px` : '3px',
          width:  `${THUMB}px`,
          height: `${THUMB}px`,
          borderRadius: '50%',
          backgroundColor: 'white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.30)',
          transition: 'left 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {isSetting ? (
          <Loader2
            size={13}
            className="animate-spin"
            style={{ color: onColor }}
          />
        ) : (
          <Power
            size={11}
            style={{
              color: isOn ? onColor : '#9ca3af',
              transition: 'color 0.28s ease',
            }}
          />
        )}
      </div>
    </div>
  );
}
