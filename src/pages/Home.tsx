import React from "react";
import {
  Thermometer,
  Droplets,
  Gauge as GaugeIcon,
  Activity,
  Wifi,
  Clock,
  RotateCw,
  ArrowDownToLine,
  Calendar,
  Link,
  Hash,
  Signal,
  Tag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import GaugeChart from "@/components/GaugeChart";
import GaugeChartModern from "@/components/GaugeChartModern";
import GaugeChartMinimal from "@/components/GaugeChartMinimal";
import GaugeChartRetro from "@/components/GaugeChartRetro";
import GaugeChartFuturistic from "@/components/GaugeChartFuturistic";
import StatCard from "@/components/StatCard";
import { useIoTData } from "@/hooks/useIoTData";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricLineChart } from "@/components/MetricLineChart";
import WritableParameterList from "@/components/WritableParameterList";
import AlertList from "@/components/AlertList";
import SystemState from "@/components/SystemState";
import { CombinedMetricLineChart } from "@/components/CombinedMetricLineChart";
import { DatePickerWithRange } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { addDays, subDays } from "date-fns";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DynamicDashboard } from "@/components/dashboard-builder/DynamicDashboard";
import { supabase } from "@/integrations/supabase/client";

type GaugeType = "classic" | "modern" | "minimal" | "retro" | "futuristic";

const GAUGE_COMPONENTS = {
  classic: GaugeChart,
  modern: GaugeChartModern,
  minimal: GaugeChartMinimal,
  retro: GaugeChartRetro,
  futuristic: GaugeChartFuturistic,
};

interface HomeProps {
  title: string;
  subtitle?: string;
  pollIntervalMs?: number;
  nodeId: string;
}

const Home: React.FC<HomeProps> = ({
  title,
  subtitle = "Real-time IoT sensor monitoring",
  pollIntervalMs = 60000,
  nodeId,
}) => {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 1),
    to: new Date(),
  });
  const [isLive, setIsLive] = React.useState<boolean>(true);
  const [refreshInterval, setRefreshInterval] = React.useState<number>(0);
  const [isSpinning, setIsSpinning] = React.useState(false);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  // Load the default dashboard template from Supabase
  const [dashboardSchema, setDashboardSchema] = React.useState<any>(null);
  React.useEffect(() => {
    const loadTemplate = async () => {
      try {
        const { data } = await supabase
          .from('dashboard_templates')
          .select('schema')
          .eq('name', 'default')
          .single();
        if (data?.schema) {
          const s = data.schema as any;
          if (s.layout && s.widgets && s.layout.length > 0) {
            setDashboardSchema(s);
          }
        }
      } catch {
        // No template yet
      }
    };
    loadTemplate();
  }, []);

  // Gauge Type State
  const [gaugeType, setGaugeType] = React.useState<GaugeType>("modern");

  React.useEffect(() => {
    const saved = localStorage.getItem("gaugeType") as GaugeType;
    if (saved && GAUGE_COMPONENTS[saved]) {
      setGaugeType(saved);
    }
  }, []);

  const GaugeComponent = GAUGE_COMPONENTS[gaugeType] || GaugeChart;

  // List of tags to display in the details section. 
  // Populated based on user request.
  const tagsToDisplay: { name: string; key: string }[] = [
    {
      name: "Serial Number",
      key: "serialNumber",
    },
    {
      name: "Device Network",
      key: "networkType",
    },
  ];

  const handleRefresh = async () => {
    setIsSpinning(true);
    setRefreshTrigger((prev) => prev + 1);
    // Ensure the animation plays for at least 600ms even if the API is fast
    await Promise.all([
      refetch(),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
    setIsSpinning(false);
  };

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    if (newDate?.from && newDate?.to) {
      setIsLive(false);
    }
  };

  const handleLiveClick = () => {
    setIsLive(true);
    setDate({
      from: subDays(new Date(), 1),
      to: new Date(),
    });
  };

  const customRange = React.useMemo(() => {
    if (isLive || !date?.from) return null;

    // Use the exact time selected by the user
    const fromTime = new Date(date.from);
    const toTime = date.to ? new Date(date.to) : new Date(fromTime);

    return {
      from: Math.floor(fromTime.getTime() / 1000),
      to: Math.floor(toTime.getTime() / 1000),
    };
  }, [date, isLive]);

  const {
    currentData,
    historicalTemperatureData,
    historicalHumidityData,
    isLoading,
    isRefetching,
    error,
    deviceStatus,
    nodeDetails,
    refetch,
    signalStrength,
    gatewayError,
  } = useIoTData({
    updateInterval: refreshInterval,
    nodeId: nodeId,
    apiKey: import.meta.env.VITE_ANEDYA_API_KEY,
    customRange: customRange,
  });

  const combinedData = React.useMemo(() => {
    const dataMap = new Map<string, any>();

    historicalTemperatureData.forEach((d) => {
      dataMap.set(d.time, { ...dataMap.get(d.time), time: d.time, temperature: d.temperature, timestamp: d.timestamp });
    });

    historicalHumidityData.forEach((d) => {
      const existing = dataMap.get(d.time);
      dataMap.set(d.time, { ...existing, time: d.time, humidity: d.humidity, timestamp: existing?.timestamp || d.timestamp });
    });

    return Array.from(dataMap.values()).sort(
      (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
    );
  }, [historicalTemperatureData, historicalHumidityData]);

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <p className="text-destructive font-medium">{error}</p>
            <p className="text-muted-foreground text-sm">
              Please check your connection and try again
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleWidgetAction = async (key: string, value: any) => {
    try {
      const res = await fetch("https://api.anedya.io/v1/data/submitData", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_ANEDYA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [
            {
              nodeId,
              variable: key,
              value: Number(value) || value,
              timestamp: Date.now()
            }
          ]
        })
      });
      if (res.ok) {
        refetch(); // refresh data after submit
      }
    } catch (e) {
      console.error("Failed to submit data action", e);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            {/* <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {nodeDetails?.node_name || title}
            </h1>
            <p className="text-muted-foreground mt-1">{subtitle}</p> */}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {/* Device Status Indicator */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                deviceStatus === "online"
                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                  : deviceStatus === "offline"
                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                    : "bg-gray-500/10 text-gray-500 border-gray-500/20"
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  deviceStatus === "online"
                    ? "bg-green-500"
                    : deviceStatus === "offline"
                      ? "bg-red-500"
                      : "bg-gray-500"
                }`}
              />
              <span className="font-medium capitalize">
                {deviceStatus === "unknown" ? "Unknown" : deviceStatus}
              </span>
              {deviceStatus === "offline" &&
              currentData?.deviceLastHeartbeat ? (
                <span className="text-xs text-muted-foreground ml-1">
                  (Last Online:{" "}
                  {new Date(
                    currentData.deviceLastHeartbeat * 1000,
                  ).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  )
                </span>
              ) : null}
            </div>

            <span className="text-border">|</span>

            {/* Live Indicator */}
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                {refreshInterval > 0 && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    refreshInterval > 0 ? "bg-green-500" : "bg-gray-400"
                  }`}
                ></span>
              </span>
              <span>Auto Refresh</span>
            </div>

            {/* Refresh Interval Selector */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <Select
                value={refreshInterval.toString()}
                onValueChange={(val) => setRefreshInterval(Number(val))}
              >
                <SelectTrigger className="w-[110px] h-8">
                  <SelectValue placeholder="Refresh" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Off</SelectItem>
                  <SelectItem value="5000">5s</SelectItem>
                  <SelectItem value="10000">10s</SelectItem>
                  <SelectItem value="30000">30s</SelectItem>
                  <SelectItem value="60000">60s</SelectItem>
                  <SelectItem value="300000">5min</SelectItem>
                  <SelectItem value="600000">10min</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Manual Refresh Button */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 ml-1"
              onClick={handleRefresh}
              title="Refresh Data"
            >
              <RotateCw
                className={`h-4 w-4 ${isSpinning || isLoading || isRefetching ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {nodeDetails && (
          <Card className="overflow-hidden border-none shadow-md">
            <div className="h-48 w-full relative group">
               <img 
                  src="/cold-room-banner.jpeg" 
                 alt="Cold Room Facility" 
                 className="w-full h-full object-cover transition-transform duration-500 "
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
               <div className="absolute bottom-4 left-6 text-white">
                  <h3 className="text-xl font-bold">{nodeDetails.node_name}</h3>
                  <p className="text-white/80 text-sm">{nodeDetails.node_desc}</p>
               </div>
            </div>
            <CardContent className="p-6">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 text-sm">
                   {/* <div>
                       <span className="font-medium text-muted-foreground block">Description</span>
                       <span>{nodeDetails.node_desc || "-"}</span>
                   </div> */}
                   <div>
                       <span className="font-medium text-muted-foreground flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4" />
                          Created
                       </span>
                       <span className="block pl-6 font-medium">{nodeDetails.created ? new Date(nodeDetails.created).toLocaleDateString() : "-"}</span>
                   </div>
                   <div>
                       <span className="font-medium text-muted-foreground flex items-center gap-2 mb-1">
                          <Link className="h-4 w-4" />
                          Binding Status
                       </span>
                       <span className={`block pl-6 font-medium ${nodeDetails.bindingstatus ? "text-green-600" : "text-red-600"}`}>
                           {nodeDetails.bindingstatus ? "Bound" : "Unbound"}
                       </span>
                   </div>
                    {/* <div>
                       <span className="font-medium text-muted-foreground block">Node Status</span>
                       <span className={nodeDetails.suspended ? "text-red-600" : "text-green-600"}>
                           {nodeDetails.suspended ? "Suspended" : "Active"}
                       </span>
                   </div> */}
                   {/* Integrated Tags */}
                   {nodeDetails.tags && tagsToDisplay.length > 0 ? (
                       tagsToDisplay.map((displayTag) => {
                           const matchedTag = nodeDetails.tags?.find(t => t.key === displayTag.key);
                           if (!matchedTag) return null;
                           
                           let Icon = Tag;
                           if (displayTag.key === "serialNumber") Icon = Hash;
                           if (displayTag.key === "networkType") Icon = Wifi;

                           return (
                               <div key={displayTag.key}>
                                  <span className="font-medium text-muted-foreground flex items-center gap-2 mb-1">
                                      <Icon className="h-4 w-4" />
                                      {displayTag.name}
                                  </span>
                                  <span className="block pl-6 font-medium">{matchedTag.value}</span>
                               </div>
                           );
                       })
                   ) : (
                        nodeDetails.tags && nodeDetails.tags.map((tag, i) => (
                           <div key={i}>
                               <span className="font-medium text-muted-foreground flex items-center gap-2 mb-1">
                                   <Tag className="h-4 w-4" />
                                   {tag.key}
                               </span>
                               <span className="block pl-6 font-medium">{tag.value}</span>
                           </div>
                       ))
                   )}

                   {/* Signal Strength */}
                   <div>
                       <span className="font-medium text-muted-foreground flex items-center gap-2 mb-1">
                          <Signal className="h-4 w-4" />
                          Signal Strength
                       </span>
                       {deviceStatus === "offline" ? (
                           <span className="block pl-6 font-medium text-muted-foreground">Device Offline</span>
                       ) : (
                           (() => {
                               if (signalStrength === null || signalStrength === undefined) return <span className="block pl-6">-</span>;
                               
                               const networkTypeTag = nodeDetails.tags?.find(t => t.key === "networkType" || t.key === "Network Type");
                               const isSim = networkTypeTag ? networkTypeTag.value.toLowerCase().includes("sim") : false;
                               
                               let statusText = "";
                               let statusColor = "";
                               
                               if (isSim) {
                                   // CSQ Logic (0-31)
                                   if (signalStrength < 10) { statusText = "Bad"; statusColor = "text-red-500"; }
                                   else if (signalStrength < 15) { statusText = "Fair"; statusColor = "text-yellow-500"; }
                                   else if (signalStrength < 20) { statusText = "Good"; statusColor = "text-green-500"; }
                                   else { statusText = "Excellent"; statusColor = "text-green-600"; }
                               } else {
                                   // WiFi Logic (Assume RSSI dBm if negative, or Percentage)
                                   // RSSI: > -50 Excellent, -50 to -60 Good, -60 to -70 Fair, < -70 Bad
                                   if (signalStrength < 0) {
                                       if (signalStrength < -70) { statusText = "Bad"; statusColor = "text-red-500"; }
                                       else if (signalStrength < -60) { statusText = "Fair"; statusColor = "text-yellow-500"; }
                                       else if (signalStrength < -50) { statusText = "Good"; statusColor = "text-green-500"; }
                                       else { statusText = "Excellent"; statusColor = "text-green-600"; }
                                   } else {
                                       // Percentage 0-100? or CSQ if positive? Assuming % if big, or CSQ if small?
                                       // Given "13" response for SIM, we covered that. 
                                       // If WiFi returns 13 (unlikely for %), treat as error or low.
                                       // Let's assume standard RSSI mapping if negative. If positive and small (like 13), it might be error or CSQ exposed.
                                       // Fallback or specific logic needed. Let's use generic good/bad.
                                       if (signalStrength < 20) { statusText = "Bad"; statusColor = "text-red-500"; }
                                       else if (signalStrength < 50) { statusText = "Fair"; statusColor = "text-yellow-500"; }
                                       else if (signalStrength < 80) { statusText = "Good"; statusColor = "text-green-500"; }
                                       else { statusText = "Excellent"; statusColor = "text-green-600"; }
                                   }
                               }

                               return (
                                   <span className={`block pl-6 font-medium ${statusColor}`}>
                                       {statusText} <span className="text-xs text-muted-foreground">({signalStrength})</span>
                                   </span>
                               );
                           })()
                       )}
                   </div>

                   {/*Error */}
                   {gatewayError && (
                       <div className="md:col-span-2 lg:col-span-2">
                           <span className="font-medium text-muted-foreground flex items-center gap-2 mb-1">
                               <Tag className="h-4 w-4 text-destructive" />
                               Device Error
                           </span>
                           <span className="block pl-6 font-medium text-destructive">{gatewayError.message}</span>
                           <span className="block pl-6 text-xs text-muted-foreground">
                               {new Date(gatewayError.timestamp * 1000).toLocaleString()}
                           </span>
                       </div>
                   )}
               </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatCard
                title="Room  Temperature"
                value={currentData?.temperature.toFixed(1) || "0"}
                unit="°C"
                change={2.5}
                icon={<Thermometer className="h-6 w-6" />}
              />
              <StatCard
                title="Coil Temperature"
                value={currentData?.humidity.toFixed(1) || "0"}
                unit="°C"
                change={-1.2}
               icon={<Thermometer className="h-6 w-6" />}
              />
            </>
          )}
        </div> */}

        {/* Main Tabs/Filters Section */}
        {isLoading ? (
          <Card>
            <CardHeader className="pb-5 ">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-7 w-5 text-primary" />
                Real-time Sensor Values
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center py-8">
                <Skeleton className="h-40 w-full max-w-2xl" />
              </div>
            </CardContent>
          </Card>
        ) : dashboardSchema && dashboardSchema.layout && dashboardSchema.layout.length > 0 ? (
          <DynamicDashboard 
            schema={dashboardSchema}
            nodeId={nodeId}
            pollIntervalMs={refreshInterval > 0 ? refreshInterval : 30000}
            onAction={handleWidgetAction} 
          />
        ) : (
          <Card>
            <CardHeader className="pb-5 ">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-7 w-5 text-primary" />
                Real-time Sensor Values
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Room Temperature
                    </CardTitle>
                    <Thermometer className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <GaugeComponent
                      value={currentData?.temperature || 0}
                      min={-50}
                      max={50}
                      label="Room Temperature"
                      unit="°C"
                      timestamp={currentData?.temperatureTimestamp}
                    />
                  </CardContent>
                </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Coil Temperature
              </CardTitle>
              <Thermometer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[200px] w-full rounded-full" />
              ) : (
                <GaugeComponent
                  value={currentData?.humidity || 0}
                  min={-50}
                  max={50}
                  label="Coil Temperature"
                  unit="°C"
                  timestamp={currentData?.humidityTimestamp}
                />
              )} 
            </CardContent>
          </Card>
        </div>
            </CardContent>
          </Card>
        )}

        {/* Charts Section */}
        <Card className="w-full">
          <CardHeader className="pb-4 border-b mb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>Historical Trend</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={isLive ? "default" : "outline"}
                  size="sm"
                  onClick={handleLiveClick}
                  className="gap-2"
                >
                  <Play className="h-3 w-3" />
                  Live
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Export Logic
                    if (!historicalTemperatureData.length && !historicalHumidityData.length) return;
                    
                    const headers = ["Date-Time (ISO)", "Room Temperature (°C)", "Coil Temperature (°C)"];
                    const csvRows = [headers.join(",")];
                    
                    // Combine data by timestamp
                    const dataMap = new Map<string, { temp?: number, humid?: number }>();
                    
                    historicalTemperatureData.forEach(d => {
                        if (!dataMap.has(d.time)) dataMap.set(d.time, {});
                        dataMap.get(d.time)!.temp = d.temperature;
                    });
                    
                    historicalHumidityData.forEach(d => {
                        if (!dataMap.has(d.time)) dataMap.set(d.time, {});
                        dataMap.get(d.time)!.humid = d.humidity;
                    });
                    
                    // Sort by time
                    const sortedTimes = Array.from(dataMap.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
                    
                    sortedTimes.forEach(time => {
                        const entry = dataMap.get(time);
                        const dateObj = new Date(time);
                        
                        // Use quotes to handle potential commas in locale strings
                        // Replace any internal quotes with double quotes per CSV spec
                        const isoTime = `"${time.replace(/"/g, '""')}"`;
                     
                        
                        csvRows.push(`${isoTime},${entry?.temp ?? ""},${entry?.humid ?? ""}`);
                    });
                    
                    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.setAttribute("hidden", "");
                    a.setAttribute("href", url);
                    a.setAttribute("download", `sensor_data_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="gap-2"
                  title="Export Data as CSV"
                >
                  <ArrowDownToLine className="h-3 w-3" />
                  Export
                </Button>
                <DatePickerWithRange date={date} setDate={handleDateChange} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Temperature Chart */}
              <MetricLineChart
                title="Room Temperature"
                icon={<Thermometer className="h-5 w-5 text-chart-1" />}
                data={historicalTemperatureData}
                dataKey="temperature"
                isLoading={isLoading}
                strokeColor="hsl(var(--chart-1))"
                unit="°C"
              />

              <MetricLineChart
                title="Coil Temperature"
                icon={<Thermometer className="h-5 w-5 text-chart-2" />}
                data={historicalHumidityData}
                dataKey="humidity"
                isLoading={isLoading}
                strokeColor="hsl(var(--chart-2))"
                unit="°C"
              />
            </div>

            {/* Combined Chart */}
            <div className="mt-6 pt-6 border-t">
              <CombinedMetricLineChart
                title="Temperature Comparison"
                data={combinedData}
                series={[
                  { key: "temperature", name: "Room Temperature", color: "hsl(var(--chart-1))" }, // Primary Chart Color
                  { key: "humidity", name: "Coil Temperature", color: "hsl(var(--chart-2))" },   // Secondary Chart Color
                ]}
                isLoading={isLoading}
                unit="°C"
              />
            </div>
          </CardContent>
        </Card>

        {/* Writable Parameters Section */}
        <WritableParameterList
          nodeId={nodeId}
          pollIntervalMs={refreshInterval}
          refreshTrigger={refreshTrigger}
        />

        {/*  System State */}
        <SystemState
          nodeId={nodeId}
          systemList={[
            {
              name: "Door",
              key: "doorAlarm",
            },
            {
              name: "Compressor",
              key: "compressorStatus",
            },
            {
              name: "Defrost",
              key: "defrostStatus",
            },
            {
              name: "Evaporator",
              key: "evaporatorStatus",
            },
          ]}
          pollIntervalMs={refreshInterval}
          refreshTrigger={refreshTrigger}
        />

        
          


        {/* Alert List Section */}
        <AlertList nodeId={nodeId} refreshTrigger={refreshTrigger} />
      </div>
    </DashboardLayout>
  );
};

export default Home;
