import { useState, useEffect, useCallback } from "react";

export interface SensorData {
  temperature: number;
  humidity: number;
  timestamp: string;
  temperatureTimestamp?: number;
  humidityTimestamp?: number;
  deviceLastHeartbeat?: number;
  [key: string]: any;
}

export interface NodeDetails {
  nodeId: string;
  node_name: string;
  node_desc: string;
  bindingstatus: boolean;
  created: string;
  suspended: boolean;
  tags: { key: string; value: string }[];
}

export interface temperatureChartDataPoint {
  time: string;
  temperature: number;
  timestamp: number;
}
export interface HumidityChartDataPoint {
  time: string;
  humidity: number;
  timestamp: number;
}

interface UseIoTDataConfig {
  updateInterval?: number;
  nodeId: string;
  apiKey: string;
  customRange?: { from: number; to: number } | null;
  schema?: any;
}

export const useIoTData = ({
  updateInterval = 60000,
  nodeId,
  apiKey,
  customRange,
  schema,
}: UseIoTDataConfig) => {
  const [currentData, setCurrentData] = useState<SensorData | null>(null);
  const [historicalTemperatureData, sethistoricalTemperatureData] = useState<
    temperatureChartDataPoint[]
  >([]);
  const [historicalHumidityData, sethistoricalHumidityData] = useState<
    HumidityChartDataPoint[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<string>("unknown");
  const [nodeDetails, setNodeDetails] = useState<NodeDetails | null>(null);
  const [signalStrength, setSignalStrength] = useState<number | null>(null);
  const [gatewayError, setGatewayError] = useState<{ message: string; timestamp: number } | null>(null);

  // Fetch data from the Anedya cloud API
  const fetchData = useCallback(async () => {
    setIsRefetching(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      const from = customRange ? customRange.from : now - 86400; // Default last 24h
      const to = customRange ? customRange.to : now;

      /* ---------------- TEMPERATURE (latest) ---------------- */
      let res = await fetch("https://api.anedya.io/v1/data/latest", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nodes: [nodeId],
          variable: "roomtemperature",
        }),
      });

      if (!res.ok) throw new Error("Temperature API failed");
      const tjson = await res.json();
      const apiTemperature = Number(tjson?.data?.[nodeId]?.value) || 0;
      const apiTemperatureTimestamp = tjson?.data?.[nodeId]?.timestamp ?? 0;

      /* ---------------- HUMIDITY (latest) ---------------- */
      res = await fetch("https://api.anedya.io/v1/data/latest", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nodes: [nodeId],
          variable: "coiltemperature",
        }),
      });

      if (!res.ok) throw new Error("Humidity API failed");
      const hjson = await res.json();
      const apiHumidity = Number(hjson?.data?.[nodeId]?.value) || 0;
      const apiHumidityTimestamp = hjson?.data?.[nodeId]?.timestamp ?? 0;

      /* ---------------- Temperature HISTORY ---------------- */
      res = await fetch("https://api.anedya.io/v1/data/getData", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nodes: [nodeId],
          variable: "roomtemperature",
          from: from,
          to: to,
          order: "asc",
          limit: 0,
        }),
      });

      const pjson = await res.json();

      if (pjson?.data?.[nodeId]) {
        const temperatureSeries =
          pjson?.data?.[nodeId]?.map((p: any) => ({
            time: new Date(p.timestamp * 1000).toLocaleString(undefined, {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            }),
            temperature: +p.value.toFixed(1),
            timestamp: p.timestamp,
          })) ?? [];

        sethistoricalTemperatureData(temperatureSeries);
      } else {
        sethistoricalTemperatureData([]);
      }

      /* ---------------- Humidity HISTORY ---------------- */
      res = await fetch("https://api.anedya.io/v1/data/getData", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nodes: [nodeId],
          variable: "coiltemperature",
          from: from,
          to: to,
          order: "asc",
          limit: 0,
        }),
      });

      const hhjson = await res.json();

      if (hhjson?.data?.[nodeId]) {
        const humiditySeries =
          hhjson?.data?.[nodeId]?.map((p: any) => ({
            time: new Date(p.timestamp * 1000).toLocaleString(undefined, {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            }),
            humidity: +p.value.toFixed(1),
            timestamp: p.timestamp,
          })) ?? [];

        sethistoricalHumidityData(humiditySeries);
      } else {
        sethistoricalHumidityData([]);
      }

      /* ---------------- DEVICE STATUS ---------------- */
      // Placeholder for device status heartbeat, will update after status call
      let deviceLastHeartbeat = 0;

      res = await fetch("https://api.anedya.io/v1/health/status", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nodes: [nodeId],
          lastContactThreshold: 180,
        }),
      });

      if (res.ok) {
        const sjson = await res.json();
        const isOnline = sjson?.data?.[nodeId]?.online ?? false;
        deviceLastHeartbeat = sjson?.data?.[nodeId]?.lastHeartbeat ?? 0;
        setDeviceStatus(isOnline ? "online" : "offline");
      } else {
        setDeviceStatus("unknown");
      }

      /* ---------------- SIGNAL STRENGTH ---------------- */
      res = await fetch("https://api.anedya.io/v1/valuestore/getValue", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          namespace: {
            scope: "node",
            id: nodeId,
          },
          key: "NetworkStrength",
        }),
      });
      
      if (res.ok) {
        const signalJson = await res.json();
        if (signalJson.success) {
           setSignalStrength(signalJson.value);
        }
      }

      /* ---------------- GATEWAY ERROR ---------------- */
      res = await fetch("https://api.anedya.io/v1/valuestore/getValue", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          namespace: {
            scope: "node",
            id: nodeId,
          },
          key: "gateway_error",
        }),
      });

      if (res.ok) {
        const errorJson = await res.json();
        if (errorJson.success) {
           setGatewayError({ message: errorJson.value, timestamp: errorJson.modified });
        } else {
           setGatewayError(null);
        }
      }

      /* ---------------- DYNAMIC VARIABLES (from Schema) ---------------- */
      const dynamicData: Record<string, any> = {};
      
      if (schema && schema.widgets) {
        const dynamicVariables = new Set<string>();
        Object.values(schema.widgets).forEach((w: any) => {
          if (w.config && w.config.deviceKey) {
            // Ignore standard variables handled explicitly, though fetching twice wouldn't hurt much
            if (w.config.deviceKey !== 'roomtemperature' && w.config.deviceKey !== 'coiltemperature') {
              dynamicVariables.add(w.config.deviceKey);
            }
          }
        });

        if (dynamicVariables.size > 0) {
          await Promise.all(
            Array.from(dynamicVariables).map(async (variable) => {
              try {
                const r = await fetch("https://api.anedya.io/v1/data/latest", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ nodes: [nodeId], variable }),
                });
                if (r.ok) {
                  const j = await r.json();
                  dynamicData[variable] = Number(j?.data?.[nodeId]?.value) || j?.data?.[nodeId]?.value || 0;
                }
              } catch (e) {
                console.error(`Failed to fetch dynamic variable ${variable}`, e);
              }
            })
          );
        }
      }

      setCurrentData({
        temperature: apiTemperature,
        humidity: apiHumidity,
        timestamp: new Date().toISOString(),
        temperatureTimestamp: apiTemperatureTimestamp,
        humidityTimestamp: apiHumidityTimestamp,
        deviceLastHeartbeat: deviceLastHeartbeat,
        roomtemperature: apiTemperature, // map direct keys
        coiltemperature: apiHumidity,
        ...dynamicData,
      });

      setError(null);
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      // setError("Failed to fetch IoT data");
      setIsLoading(false);
    } finally {
      setIsRefetching(false);
    }
  }, [nodeId, apiKey, customRange, schema]);

  useEffect(() => {
    fetchData();

    // Disable polling if customRange is set (History Mode) or if updateInterval is 0
    if (!customRange && updateInterval > 0) {
      const interval = setInterval(fetchData, updateInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, updateInterval, customRange]);

  // Fetch node details only once on mount or when nodeId changes
  useEffect(() => {
    const fetchNodeDetails = async () => {
      try {
        const res = await fetch("https://api.anedya.io/v1/node/details", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nodes: [nodeId],
          }),
        });

        // response formate:
        //         {
        //     "success": true,
        //     "error": "",
        //     "errcode": 0,
        //     "reasonCode": "generic::ok",
        //     "data": {
        //         "": {
        //             "nodeId": "",
        //             "node_name": "Device 1",
        //             "node_desc": "First Test Device",
        //             "deviceId": "",
        //             "nodeIdentifier": "",
        //             "bindingstatus": true,
        //             "nodebindingkey": "",
        //             "connectionKey": "",
        //             "created": "2026-02-11T13:23:06.029217Z",
        //             "suspended": false,
        //             "modified": "2026-02-11T13:23:06.029217Z",
        //             "tags": [
        //                 {
        //                     "key": "networkType",
        //                     "value": "SIm Network"
        //                 }
        //             ]
        //         }
        //     }
        // }

        if (res.ok) {
          const ndjson = await res.json();
          const details = ndjson?.data?.[nodeId];
          if (details) {
            setNodeDetails({
              nodeId: details.nodeId,
              node_name: details.node_name,
              node_desc: details.node_desc || "",
              bindingstatus: details.bindingstatus,
              created: details.created,
              suspended: details.suspended,
              tags: details.tags || [],
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch node details:", err);
      }
    };

    fetchNodeDetails();
  }, [nodeId, apiKey]);

  return {
    currentData,
    historicalTemperatureData,
    historicalHumidityData,
    isLoading,
    isRefetching,
    error,
    deviceStatus,
    nodeDetails,
    refetch: fetchData,
    signalStrength,
    gatewayError,
  };
};
