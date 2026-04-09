import React from 'react';
import GaugeChart from '@/components/GaugeChart';

interface GaugeWidgetProps {
  value?: any;
  timestamp?: number;
  title?: string;
  config: {
    title?: string;
    unit?: string;
    min?: number;
    max?: number;
  };
}

export default function GaugeWidget({ value, timestamp, title, config }: GaugeWidgetProps) {
  const numValue = Number(value) || 0;
  const displayTitle = title || config.title || 'Gauge';
  
  return (
    <div className="w-full h-full flex flex-col p-4 bg-white">
      <div className="font-medium text-sm mb-2">{displayTitle}</div>
      <div className="flex-1 w-full h-full min-h-0 relative flex items-center justify-center">
        <div className="w-full h-full absolute inset-0 flex items-center justify-center">
          <GaugeChart
            value={numValue}
            min={config.min !== undefined ? config.min : -50}
            max={config.max !== undefined ? config.max : 50}
            label={displayTitle}
            unit={config.unit || ''}
            showValue={true}
            timestamp={timestamp}
          />
        </div>
      </div>
    </div>
  );
}
