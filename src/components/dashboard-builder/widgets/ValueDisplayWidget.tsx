import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Hash, Clock } from 'lucide-react';
import { WidgetConfig } from '@/store/useBuilderStore';
import { useWidgetData } from '@/hooks/useWidgetData';
import { useValueStoreData } from '@/hooks/useValueStoreData';

export interface ValueMapping {
  id: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith';
  compareValue: string;
  displayText: string;
  color?: string;
}

/**
 * Evaluates a raw value against a list of value mappings.
 * Returns the first matching mapping's displayText and color, or null.
 * Handles: number (float), bool, string, binary data types.
 */
export function applyValueMapping(
  rawValue: string | number | boolean | null | undefined,
  mappings: ValueMapping[] | undefined
): { text: string; color?: string } | null {
  if (!mappings || mappings.length === 0 || rawValue === null || rawValue === undefined) {
    return null;
  }

  const strVal = String(rawValue).trim();
  const numVal = Number(rawValue);
  const isNumeric = !isNaN(numVal) && strVal !== '';
  // Treat "true"/"false"/0/1 as booleans too
  const boolVal = strVal === 'true' || strVal === '1' ? true : strVal === 'false' || strVal === '0' ? false : null;

  for (const mapping of mappings) {
    const cmpStr = mapping.compareValue.trim();
    const cmpNum = Number(cmpStr);
    const cmpIsNumeric = !isNaN(cmpNum) && cmpStr !== '';

    let matched = false;

    switch (mapping.operator) {
      case '==':
        // Try numeric comparison first, then string, then bool
        if (isNumeric && cmpIsNumeric) {
          matched = numVal === cmpNum;
        } else if (boolVal !== null && (cmpStr === 'true' || cmpStr === 'false')) {
          matched = boolVal === (cmpStr === 'true');
        } else {
          matched = strVal.toLowerCase() === cmpStr.toLowerCase();
        }
        break;
      case '!=':
        if (isNumeric && cmpIsNumeric) {
          matched = numVal !== cmpNum;
        } else {
          matched = strVal.toLowerCase() !== cmpStr.toLowerCase();
        }
        break;
      case '>':
        if (isNumeric && cmpIsNumeric) matched = numVal > cmpNum;
        break;
      case '<':
        if (isNumeric && cmpIsNumeric) matched = numVal < cmpNum;
        break;
      case '>=':
        if (isNumeric && cmpIsNumeric) matched = numVal >= cmpNum;
        break;
      case '<=':
        if (isNumeric && cmpIsNumeric) matched = numVal <= cmpNum;
        break;
      case 'contains':
        matched = strVal.toLowerCase().includes(cmpStr.toLowerCase());
        break;
      case 'startsWith':
        matched = strVal.toLowerCase().startsWith(cmpStr.toLowerCase());
        break;
    }

    if (matched) {
      return { text: mapping.displayText, color: mapping.color };
    }
  }

  return null;
}

interface ValueDisplayWidgetProps {
  config: WidgetConfig;
  nodeId?: string;
  pollIntervalMs?: number;
  isEditMode?: boolean;
}

/**
 * Value Display Widget — shows a large numeric/text value with unit and timestamp.
 * Supports value mappings for custom display text based on conditions.
 */
export function ValueDisplayWidget({ config, nodeId, pollIntervalMs, isEditMode }: ValueDisplayWidgetProps) {
  const dataSource = config.config.dataSource || 'valuestore';

  // ── ValueStore source ──
  const vs = useValueStoreData(
    isEditMode || dataSource !== 'valuestore' ? undefined : nodeId,
    isEditMode || dataSource !== 'valuestore' ? undefined : config.config.deviceKey,
    dataSource === 'valuestore' ? pollIntervalMs : 0
  );

  // ── Variable (latest data) source ──
  const vr = useWidgetData(
    isEditMode || dataSource !== 'variable' ? undefined : nodeId,
    isEditMode || dataSource !== 'variable' ? undefined : config.config.deviceKey,
    dataSource === 'variable' ? pollIntervalMs : 0
  );

  // Pick the active data based on source
  const isLoading = dataSource === 'valuestore' ? vs.isLoading : vr.isLoading;
  const rawValue = dataSource === 'valuestore' ? vs.value : vr.value;
  const unit = config.config.unit || '';

  // Apply value mappings
  const mappings: ValueMapping[] | undefined = config.config.valueMappings;
  
  // Use a default preview value if in edit mode and no value is present yet
  const evalValue = isEditMode && (rawValue === undefined || rawValue === null) ? 42.5 : rawValue;
  const mappingResult = applyValueMapping(evalValue, mappings);

  const displayValue = mappingResult
    ? mappingResult.text
    : (evalValue !== undefined && evalValue !== null ? evalValue : '--');

  const displayColor = mappingResult?.color || undefined;

  // Timestamp handling
  const getTimestampDisplay = (): string | null => {
    if (dataSource === 'valuestore') {
      if (vs.modified && vs.modified > 0) return new Date(vs.modified * 1000).toLocaleString();
      if (vs.created && vs.created > 0) return new Date(vs.created * 1000).toLocaleString();
      return null;
    } else {
      if (vr.timestamp) return new Date(vr.timestamp * 1000).toLocaleString();
      return null;
    }
  };

  const timestampDisplay = getTimestampDisplay();

  return (
    <Card className="w-full h-full flex flex-col hover:border-primary transition-colors cursor-default overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-4 border-b flex-none">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Hash className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate" title={config.title}>{config.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col items-center justify-center gap-2">
        {isLoading && rawValue === null && !isEditMode ? (
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-12 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-4xl font-bold tabular-nums"
                style={{ color: displayColor || 'hsl(var(--primary))' }}
              >
                {displayValue}
              </span>
              {unit && !mappingResult && (
                <span className="text-lg font-medium text-muted-foreground">{unit}</span>
              )}
            </div>
            
            {(timestampDisplay || isEditMode) && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                <Clock className="h-3 w-3" />
                <span>{isEditMode ? 'Preview Mode' : timestampDisplay}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
