import { useState, useEffect, useRef } from 'react';

interface WidgetDataResult {
  value: number | string | null;
  timestamp: number | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Per-widget data hook — fetches the latest value for a given Anedya variable.
 * Each widget fetches independently so loading/errors are isolated.
 */
export function useWidgetData(
  nodeId: string | undefined,
  deviceKey: string | undefined,
  pollIntervalMs = 0
): WidgetDataResult {
  const [value, setValue] = useState<number | string | null>(null);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = async () => {
    if (!nodeId || !deviceKey) return;

    setIsLoading(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_ANEDYA_API_KEY;
      const res = await fetch('https://api.anedya.io/v1/data/latest', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes: [nodeId],
          variable: deviceKey,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const json = await res.json();

      // Anedya response: { success: true, data: { [nodeId]: { value, timestamp } } }
      if (json?.success && json?.data && json.data[nodeId]) {
        const nodeData = json.data[nodeId];
        setValue(nodeData.value ?? null);
        setTimestamp(nodeData.timestamp ?? null);
      } else {
        setValue(null);
        setTimestamp(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (pollIntervalMs > 0) {
      intervalRef.current = setInterval(fetchData, pollIntervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, deviceKey, pollIntervalMs]);

  return { value, timestamp, isLoading, error };
}
