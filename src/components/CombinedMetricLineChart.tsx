import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Thermometer } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SeriesConfig {
  key: string;
  color: string;
  name: string;
}

interface CombinedMetricLineChartProps {
  title: string;
  data: any[];
  series: SeriesConfig[];
  isLoading: boolean;
  unit?: string;
}

export function CombinedMetricLineChart({
  title,
  data,
  series,
  isLoading,
  unit,
}: CombinedMetricLineChartProps) {
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(
    new Set(series.map((s) => s.key))
  );

  const toggleSeries = (key: string) => {
    setVisibleSeries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        if (newSet.size > 1) newSet.delete(key); // Prevent hiding all
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  if (data.length === 0 && !isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No data available for comparison</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-medium">
          <Thermometer className="h-5 w-5" />
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {series.map((s) => (
            <Button
              key={s.key}
              variant={visibleSeries.has(s.key) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleSeries(s.key)}
              className="h-8 text-xs gap-2"
              style={{
                backgroundColor: visibleSeries.has(s.key) ? s.color : undefined,
                borderColor: s.color,
                color: visibleSeries.has(s.key) ? "#fff" : s.color,
              }}
            >
              <div
                className="w-2 h-2 rounded-full bg-current"
                style={{ backgroundColor: visibleSeries.has(s.key) ? "#fff" : s.color }}
              />
              {s.name}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <Skeleton className="h-80 w-full" />
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  {series.map((s) => (
                    <linearGradient key={s.key} id={`combined-gradient-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={s.color} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={s.color} stopOpacity={0.05} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  dataKey="time"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number, name: string) =>
                    unit ? [`${value} ${unit}`, name] : [value, name]
                  }
                />
                <Legend />
                {series
                  .filter((s) => visibleSeries.has(s.key))
                  .map((s) => (
                    <Area
                      key={s.key}
                      type="monotone"
                      dataKey={s.key}
                      name={s.name}
                      stroke={s.color}
                      fill={`url(#combined-gradient-${s.key})`}
                      strokeWidth={2}
                      connectNulls={true}
                      dot={{ r: 0, strokeWidth: 0 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
