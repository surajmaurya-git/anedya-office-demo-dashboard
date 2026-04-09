import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { WidgetConfig } from '../../../store/useBuilderStore';
import GaugeWidget from './GaugeWidget';
import { HistoricalTrendWidget } from './HistoricalTrendWidget';
import { ValueDisplayWidget } from './ValueDisplayWidget';
import { ValueStoreWidget } from './ValueStoreWidget';
import { useWidgetData } from '@/hooks/useWidgetData';
// ─────────────────────────────────────────────
// Shared props for runtime widgets
// ─────────────────────────────────────────────
interface WidgetProps {
  config: WidgetConfig;
  nodeId?: string;
  pollIntervalMs?: number;
  onAction?: (key: string, value: any) => void;
  isEditMode?: boolean;
}

// ─────────────────────────────────────────────
// Key-Value Display Card
// ─────────────────────────────────────────────
export function KeyValueCard({ config, nodeId, pollIntervalMs, isEditMode }: WidgetProps) {
  const { value, isLoading } = useWidgetData(
    isEditMode ? undefined : nodeId,
    isEditMode ? undefined : config.config.deviceKey,
    pollIntervalMs
  );

  const displayValue = value !== undefined && value !== null ? value : '--';
  const unit = config.config.unit || '';

  return (
    <Card className="w-full h-full flex flex-col hover:border-primary transition-colors cursor-default">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
          {config.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1 flex items-center justify-center">
        {isLoading && !isEditMode ? (
          <Skeleton className="h-10 w-24" />
        ) : (
          <div className="text-3xl font-bold flex items-baseline gap-1">
            {displayValue}
            <span className="text-sm font-normal text-muted-foreground">{unit}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


// ─────────────────────────────────────────────
// Editable Control Card (submit value to device)
// ─────────────────────────────────────────────
export function EditableControlCard({ config, nodeId, pollIntervalMs, onAction, isEditMode }: WidgetProps) {
  const { value } = useWidgetData(
    isEditMode ? undefined : nodeId,
    isEditMode ? undefined : config.config.deviceKey,
    pollIntervalMs
  );
  const [inputValue, setInputValue] = useState(value || '');

  React.useEffect(() => {
    if (value !== null && value !== undefined) setInputValue(String(value));
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAction && config.config.deviceKey) {
      onAction(config.config.deviceKey, inputValue);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col hover:border-primary transition-colors cursor-default">
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
          {config.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-1 flex-1 flex flex-col justify-end">
        <form onSubmit={handleSubmit} className="flex gap-2 w-full mt-auto">
          <Input 
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            placeholder="Set value..." 
            className="h-8 text-sm"
            disabled={isEditMode}
          />
          <Button type="submit" size="sm" className="h-8 px-3" disabled={isEditMode}>
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}


// ─────────────────────────────────────────────
// Status Indicator
// ─────────────────────────────────────────────
export function StatusIndicator({ config, nodeId, pollIntervalMs, isEditMode }: WidgetProps) {
  const { value, isLoading } = useWidgetData(
    isEditMode ? undefined : nodeId,
    isEditMode ? undefined : config.config.deviceKey,
    pollIntervalMs
  );

  const threshold = config.config.threshold;
  const operator = config.config.operator || '>';
  
  let isGood = false;

  if (value === undefined || value === null) {
    isGood = false;
  } else if (threshold !== undefined) {
    const numVal = Number(value);
    const numThresh = Number(threshold);
    if (operator === '>') isGood = numVal > numThresh;
    else if (operator === '<') isGood = numVal < numThresh;
    else if (operator === '==') isGood = numVal == numThresh;
  } else {
    isGood = !!value;
    if (value === 'false') isGood = false;
    if (value === '0') isGood = false;
  }

  return (
    <Card className="w-full h-full flex flex-col hover:border-primary transition-colors cursor-default items-center justify-center">
      <CardHeader className="p-2 w-full text-center">
        <CardTitle className="text-xs font-medium text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
           {config.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 flex-1 flex items-center justify-center pb-4">
        {isLoading && !isEditMode ? (
          <Skeleton className="w-8 h-8 rounded-full" />
        ) : (
          <div className={`w-8 h-8 rounded-full ${isGood ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`} />
        )}
      </CardContent>
    </Card>
  );
}


// ─────────────────────────────────────────────
// Gauge Widget (self-fetching)
// ─────────────────────────────────────────────
function GaugeWidgetSelfFetching({ config, nodeId, pollIntervalMs, isEditMode }: WidgetProps) {
  const { value, timestamp } = useWidgetData(
    isEditMode ? undefined : nodeId,
    isEditMode ? undefined : config.config.deviceKey,
    pollIntervalMs
  );
  return (
    <GaugeWidget
      config={config.config}
      title={config.title}
      value={isEditMode ? undefined : value}
      timestamp={timestamp ?? undefined}
    />
  );
}


// ─────────────────────────────────────────────
// Main Switch — renders the right widget by type
// ─────────────────────────────────────────────
export default function WidgetRenderer({
  widgetId,
  config,
  nodeId,
  pollIntervalMs,
  onAction,
  isEditMode,
  value,
  timestamp,
}: {
  widgetId: string;
  config: WidgetConfig;
  nodeId?: string;
  pollIntervalMs?: number;
  value?: any;
  timestamp?: number;
  onAction?: (key: string, value: any) => void;
  isEditMode?: boolean;
}) {
  if (!config) return <div className="p-4 opacity-50 bg-gray-100 rounded">Invalid Widget</div>;

  switch (config.type) {
    case 'GaugeWidget':
      return <GaugeWidgetSelfFetching config={config} nodeId={nodeId} pollIntervalMs={pollIntervalMs} isEditMode={isEditMode} />;
    case 'HistoricalTrendWidget':
      return <HistoricalTrendWidget config={config} nodeId={nodeId} pollIntervalMs={pollIntervalMs} isEditMode={isEditMode} />;
    case 'ValueDisplayWidget':
      return <ValueDisplayWidget config={config} nodeId={nodeId} pollIntervalMs={pollIntervalMs} isEditMode={isEditMode} />;
    case 'ValueStoreWidget':
      return <ValueStoreWidget config={config} nodeId={nodeId} pollIntervalMs={pollIntervalMs} isEditMode={isEditMode} />;
    default:
      return (
        <Card className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
          Unknown Widget: {config.type}
        </Card>
      );
  }
}
