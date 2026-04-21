import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface ValueStoreResult {
  value: string | number | boolean | null;
  created: number | null;   // epoch seconds
  modified: number | null;  // epoch seconds
  isLoading: boolean;
  isSetting: boolean;
  error: string | null;
  setValue: (newValue: string | number | boolean, explicitType?: 'string' | 'float' | 'boolean') => Promise<boolean>;
  refetch: () => void;
}

/**
 * Hook to interact with Anedya ValueStore – getValue + setValue.
 * Works with node-scoped keys.
 */
export function useValueStoreData(
  nodeId: string | undefined,
  key: string | undefined,
  pollIntervalMs = 0
): ValueStoreResult {
  const [value, setValueState] = useState<string | number | boolean | null>(null);
  const [created, setCreated] = useState<number | null>(null);
  const [modified, setModified] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSetting, setIsSetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchValue = useCallback(async () => {
    if (!nodeId || !key) return;

    setIsLoading(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_ANEDYA_API_KEY;
      const res = await fetch('https://api.anedya.io/v1/valuestore/getValue', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          namespace: { scope: 'node', id: nodeId },
          key,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setValueState(data.value ?? null);
        setCreated(data.created ?? null);
        setModified(data.modified ?? null);
      } else {
        setValueState(null);
        setCreated(null);
        setModified(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch value');
    } finally {
      setIsLoading(false);
    }
  }, [nodeId, key]);

  const setValueOnServer = useCallback(async (newValue: string | number | boolean, explicitType?: 'string' | 'float' | 'boolean'): Promise<boolean> => {
    if (!nodeId || !key) return false;

    setIsSetting(true);
    try {
      const apiKey = import.meta.env.VITE_ANEDYA_API_KEY;

      // Determine type
      let finalValue: any = newValue;
      let finalType: string = 'string';

      if (explicitType === 'boolean') {
        const lower = String(newValue).toLowerCase();
        finalValue = lower === 'true' || lower === '1';
        finalType = 'boolean';
      } else if (explicitType === 'float') {
        finalValue = Number(newValue);
        finalType = 'float';
      } else if (explicitType === 'string') {
        finalValue = String(newValue);
        finalType = 'string';
      } else {
        // Fallback auto-detection if no explicit type provided
        const numericVal = Number(newValue);
        const isNumeric = !isNaN(numericVal) && String(newValue).trim() !== '';
        finalValue = isNumeric ? numericVal : String(newValue);
        finalType = isNumeric ? 'float' : 'string';
      }

      const res = await fetch('https://api.anedya.io/v1/valuestore/setValue', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          namespace: { scope: 'node', id: nodeId },
          key,
          value: finalValue,
          type: finalType,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Value updated successfully`);
        // Re-fetch to get updated timestamps
        await fetchValue();
        return true;
      } else {
        toast.error(`Failed to set value: ${data.message || 'Unknown error'}`);
        return false;
      }
    } catch (err: any) {
      toast.error(`Error setting value: ${err.message}`);
      return false;
    } finally {
      setIsSetting(false);
    }
  }, [nodeId, key, fetchValue]);

  useEffect(() => {
    fetchValue();

    if (pollIntervalMs > 0) {
      intervalRef.current = setInterval(fetchValue, pollIntervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [nodeId, key, pollIntervalMs, fetchValue]);

  return {
    value,
    created,
    modified,
    isLoading,
    isSetting,
    error,
    setValue: setValueOnServer,
    refetch: fetchValue,
  };
}
