import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Map as MapIcon, Play, ArrowDownToLine, Navigation,
  Copy, Check, Clock, Maximize2, Minimize2,
} from 'lucide-react';
import { DatePickerWithRange } from '@/components/DateRangePicker';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import { WidgetConfig } from '../../../store/useBuilderStore';
import { MapContainer, TileLayer, Marker, Polyline, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Fix for Leaflet default icon issue in Vite/Webpack
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// CartoDB Voyager — English place names everywhere
const TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function ChangeView({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
    }
  }, [bounds, map]);
  return null;
}

export function MapWidget({
  config,
  nodeId,
  pollIntervalMs = 60000,
  isEditMode,
}: {
  config: WidgetConfig;
  nodeId?: string;
  pollIntervalMs?: number;
  isEditMode?: boolean;
}) {
  const { toast } = useToast();

  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 1),
    to: new Date(),
  });
  const [isLive, setIsLive] = useState<boolean>(true);
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const deviceKey = config.config.deviceKey || "location";
  const pathColor = config.config.pathColor || "#0ea5e9";
  const limit = config.config.limit || 1000;
  const showTable = config.config.showTable || false;

  const fetchData = useCallback(async () => {
    if (isEditMode || !nodeId || !deviceKey) return;

    if (data.length === 0) setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_ANEDYA_API_KEY;
      const now = Math.floor(Date.now() / 1000);

      const from = !isLive && date?.from ? Math.floor(date.from.getTime() / 1000) : now - 86400;
      const to = !isLive && date?.to ? Math.floor(date.to.getTime() / 1000) : now;

      const res = await fetch("https://api.anedya.io/v1/data/getData", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nodes: [nodeId],
          variable: deviceKey,
          from,
          to,
          order: "desc",
          limit,
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch map data");

      const response = await res.json();

      if (response.success && response.data && response.data[nodeId]) {
        const processedPoints = response.data[nodeId].map((p: any) => {
          let lat = 0;
          let lng = 0;

          if (typeof p.value === 'object' && p.value !== null) {
            lat = p.value.lat || 0;
            lng = p.value.lng !== undefined ? p.value.lng : (p.value.long || 0);
          } else if (typeof p.value === 'string') {
            try {
              const parsed = JSON.parse(p.value);
              lat = parsed.lat || 0;
              lng = parsed.lng !== undefined ? parsed.lng : (parsed.long || 0);
            } catch (e) {
              console.error("Failed to parse location JSON:", p.value);
            }
          }

          return {
            lat,
            lng,
            timestamp: p.timestamp,
            time: new Date(p.timestamp * 1000).toLocaleString(undefined, {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            }),
            rawTime: new Date(p.timestamp * 1000).toISOString(),
          };
        }).reverse();

        setData(processedPoints);
        setLastRefreshed(new Date().toLocaleString(undefined, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }));
      } else {
        setData([]);
      }
    } catch (err: any) {
      console.error("Map fetch error:", err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [nodeId, deviceKey, isLive, date, isEditMode, limit, data.length]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!isLive || isEditMode) return;
    const interval = setInterval(fetchData, pollIntervalMs || 60000);
    return () => clearInterval(interval);
  }, [isLive, fetchData, pollIntervalMs, isEditMode]);

  // Escape key exits fullscreen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false); };
    if (isFullscreen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  const handleLiveClick = () => {
    setIsLive(true);
    setDate({ from: subDays(new Date(), 1), to: new Date() });
  };

  const handleExport = () => {
    if (!data.length) return;
    const headers = ["Timestamp", "Date-Time", "Latitude", "Longitude"];
    const csvRows = [headers.join(",")];
    [...data].sort((a, b) => a.timestamp - b.timestamp).forEach(entry => {
      csvRows.push(`${entry.timestamp},"${entry.time.replace(/"/g, '""')}",${entry.lat},${entry.lng}`);
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", `${deviceKey}_map_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "Export Successful", description: `GPS data exported as ${deviceKey}_map_...csv` });
  };

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    if (newDate?.from && newDate?.to) setIsLive(false);
  };

  const handleCopyCoords = (coords: string, index: number) => {
    navigator.clipboard.writeText(coords);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({ title: "Copied to clipboard", description: "Coordinates copied successfully." });
  };

  const polylinePositions = useMemo(() => data.map(p => [p.lat, p.lng] as [number, number]), [data]);
  const lastPoint = data.length > 0 ? data[data.length - 1] : null;
  const bounds = useMemo(() => {
    if (data.length === 0) return null;
    return L.latLngBounds(data.map(p => [p.lat, p.lng]));
  }, [data]);

  // Shared header JSX
  const header = (
    <CardHeader className="pb-3 pt-3 px-4 border-b flex-none bg-card z-[1001] relative">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-[50px] shrink-0">
          <MapIcon className="h-4 w-4 text-primary shrink-0" />
          <div className="flex flex-col">
            <CardTitle className="text-sm font-medium truncate" title={config.title}>
              {config.title}
            </CardTitle>
            {lastRefreshed && !isEditMode && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                <span>Last updated: {lastRefreshed}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant={isLive ? "default" : "outline"} size="sm" onClick={handleLiveClick} className="gap-2 h-9">
            <Play className="h-3 w-3" />
            Live
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 h-9" disabled={data.length === 0} title="Export Data as CSV">
            <ArrowDownToLine className="h-3 w-3" />
            Export
          </Button>
          <DatePickerWithRange date={date} setDate={handleDateChange} />
        </div>
      </div>
    </CardHeader>
  );

  // Shared map body JSX
  const mapBody = (
    <CardContent className="p-0 flex-1 relative min-h-[200px]">
      {isEditMode ? (
        <div className="absolute inset-4 flex flex-col items-center justify-center bg-muted/30 text-muted-foreground text-sm rounded outline-dashed outline-2 outline-border">
          <Navigation className="h-10 w-10 mb-2 opacity-20" />
          Map Widget Preview
        </div>
      ) : isLoading && data.length === 0 ? (
        <div className="absolute inset-0 p-4"><Skeleton className="w-full h-full" /></div>
      ) : data.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">No GPS data available</div>
      ) : (
        <div className={`absolute inset-0 flex ${showTable ? "flex-row" : ""}`}>
          <div className={`relative h-full ${showTable ? "basis-[60%] border-r" : "w-full"}`}>
            {/* Floating fullscreen button over map */}
            {!isEditMode && (
              <button
                className="absolute top-2 right-2 z-[1000] bg-background/80 hover:bg-background border border-border text-foreground rounded p-1.5 backdrop-blur-sm shadow transition-colors"
                title="View map fullscreen"
                onClick={() => setIsFullscreen(true)}
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            )}
            <MapContainer
              center={lastPoint ? [lastPoint.lat, lastPoint.lng] : [0, 0]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <ChangeView bounds={bounds} />
              <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />

              {/* Path line */}
              <Polyline positions={polylinePositions} color={pathColor} weight={3} opacity={0.85} />

              {/* Data point dots at every recorded position */}
              {data.map((p, i) => (
                <CircleMarker
                  key={`dot-${i}`}
                  center={[p.lat, p.lng]}
                  radius={4}
                  pathOptions={{
                    fillColor: pathColor,
                    fillOpacity: 0.9,
                    color: '#ffffff',
                    weight: 1.5,
                  }}
                >
                  <Popup>
                    <div className="text-xs">
                      <p className="font-bold border-b pb-1 mb-1">Data Point #{i + 1}</p>
                      <p className="text-muted-foreground mb-1">{p.time}</p>
                      <p>Lat: {p.lat}</p>
                      <p>Lng: {p.lng}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {/* Latest position marker */}
              {lastPoint && (
                <Marker position={[lastPoint.lat, lastPoint.lng]}>
                  <Popup>
                    <div className="text-xs">
                      <p className="font-bold border-b pb-1 mb-1">Latest Location</p>
                      <p className="text-muted-foreground mb-1">{lastPoint.time}</p>
                      <p>Lat: {lastPoint.lat}</p>
                      <p>Lng: {lastPoint.lng}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          {showTable && (
            <div className="basis-[40%] flex flex-col h-full bg-card overflow-hidden border">
              <div className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full">
                  <TooltipProvider>
                    <table className="w-full text-[11px] text-left">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-muted/50 border-b">
                          <th className="px-3 py-1.5 font-semibold text-xs whitespace-nowrap w-[230px]">Time</th>
                          <th className="px-3 py-1.5 font-semibold text-xs">Coordinates</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {[...data].reverse().map((p, i) => {
                          const coordStr = `${p.lat}, ${p.lng}`;
                          return (
                            <Tooltip key={`${p.timestamp}-${i}`}>
                              <TooltipTrigger asChild>
                                <tr className="hover:bg-muted/50 transition-colors group cursor-default">
                                  <td className="px-3 py-1.5 text-muted-foreground align-top whitespace-nowrap truncate max-w-[100px]">
                                    {p.time}
                                  </td>
                                  <td className="px-3 py-1.5 font-mono text-[10px] relative pr-10 group-hover:bg-muted/30 break-all">
                                    {coordStr}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 absolute right-2 top-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => { e.stopPropagation(); handleCopyCoords(coordStr, i); }}
                                    >
                                      {copiedIndex === i
                                        ? <Check className="h-3 w-3 text-green-500" />
                                        : <Copy className="h-3 w-3" />}
                                    </Button>
                                  </td>
                                </tr>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="flex flex-col gap-1 p-2">
                                <p className="font-bold text-[10px]">Location Detail</p>
                                <p className="text-[9px] opacity-80">{p.time}</p>
                                <p className="text-[9px] font-mono mt-1">{coordStr}</p>
                                <p className="text-[8px] opacity-60">{p.rawTime}</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </tbody>
                    </table>
                  </TooltipProvider>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>
      )}
    </CardContent>
  );

  // Fullscreen overlay — only the map, floating close button
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background">
        {/* Floating exit button over the fullscreen map */}
        <button
          className="absolute top-3 right-3 z-[10000] bg-background/90 hover:bg-background border border-border text-foreground rounded p-2 backdrop-blur-sm shadow-lg transition-colors flex items-center gap-1.5 text-sm font-medium"
          title="Exit Fullscreen (Esc)"
          onClick={() => setIsFullscreen(false)}
        >
          <Minimize2 className="h-4 w-4" />
          Exit Fullscreen
        </button>

        {data.length > 0 && lastPoint && (
          <MapContainer
            center={[lastPoint.lat, lastPoint.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <ChangeView bounds={bounds} />
            <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
            <Polyline positions={polylinePositions} color={pathColor} weight={3} opacity={0.85} />
            {data.map((p, i) => (
              <CircleMarker
                key={`fs-dot-${i}`}
                center={[p.lat, p.lng]}
                radius={4}
                pathOptions={{ fillColor: pathColor, fillOpacity: 0.9, color: '#ffffff', weight: 1.5 }}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold border-b pb-1 mb-1">Data Point #{i + 1}</p>
                    <p className="text-muted-foreground mb-1">{p.time}</p>
                    <p>Lat: {p.lat}</p>
                    <p>Lng: {p.lng}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
            {lastPoint && (
              <Marker position={[lastPoint.lat, lastPoint.lng]}>
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold border-b pb-1 mb-1">Latest Location</p>
                    <p className="text-muted-foreground mb-1">{lastPoint.time}</p>
                    <p>Lat: {lastPoint.lat}</p>
                    <p>Lng: {lastPoint.lng}</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full h-full flex flex-col hover:border-primary transition-colors cursor-default overflow-hidden">
      {header}
      {mapBody}
    </Card>
  );
}
