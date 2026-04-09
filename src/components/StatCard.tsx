import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  unit: string;
  change?: number;
  icon: React.ReactNode;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  unit, 
  change, 
  icon,
  className 
}) => {
  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-chart-1" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return '';
    if (change > 0) return 'text-chart-1';
    if (change < 0) return 'text-destructive';
    return 'text-muted-foreground';
  };

  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-lg", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight">{value}</span>
              <span className="text-sm text-muted-foreground">{unit}</span>
            </div>
            {/* {change !== undefined && (
              <div className={cn("flex items-center gap-1 text-sm", getTrendColor())}>
                {getTrendIcon()}
                <span>{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>
                <span className="text-muted-foreground">from last hour</span>
              </div>
            )} */}
          </div>
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
