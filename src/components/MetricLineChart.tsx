import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode } from "react";

interface MetricLineChartProps<T> {
  title: string;
  icon: ReactNode;
  data: T[];
  dataKey: keyof T;
  isLoading: boolean;
  strokeColor: string;
  yPadding?: number;
  unit?: string;
}

export function MetricLineChart<T extends { time: string }>({
  title,
  icon,
  data,
  dataKey,
  isLoading,
  strokeColor,
  yPadding = 5,
  unit,
}: MetricLineChartProps<T>) {
    if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
    }

  const lastValue = data.length > 0 ? data[data.length - 1][dataKey] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            {title}
          </div>
          {lastValue !== null && (
             <span className="text-2xl font-bold">
                {Number(lastValue).toFixed(1)} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
             </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {isLoading || data.length === 0 ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id={`gradient-${String(dataKey)}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                  vertical={false}
                />

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
                  domain={[
                    `auto`,
                    `auto`,
                  ]}
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
                  formatter={(value: number) =>
                    unit ? [`${value} ${unit}`] : [value]
                  }
                />

                <Area
                  type="monotone"
                  dataKey={dataKey as string}
                  stroke={strokeColor}
                  strokeWidth={3}
                  fill={`url(#gradient-${String(dataKey)})`}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
