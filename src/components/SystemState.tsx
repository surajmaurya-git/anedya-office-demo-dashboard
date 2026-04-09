import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface SystemItem {
  name: string;
  key: string;
}

interface SystemStateProps {
  nodeId: string;
  systemList: SystemItem[];
  pollIntervalMs?: number;
  refreshTrigger?: number;
}

const SystemState: React.FC<SystemStateProps> = ({
  nodeId,
  systemList,
  pollIntervalMs = 60000,
  refreshTrigger = 0,
}) => {
  const [values, setValues] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchValue = async (key: string) => {
    try {
      const response = await fetch("https://api.anedya.io/v1/valuestore/getValue", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_ANEDYA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          namespace: {
            scope: "node",
            id: nodeId,
          },
          key: key,
        }),
      });

      const data = await response.json();
      if (data.success) {
        return data.value;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching value for ${key}:`, error);
      return null;
    }
  };

  const fetchAllValues = async () => {
    // Determine if we should show loading state (only on first load)
    if (Object.keys(values).length === 0) {
        setIsLoading(true);
    }
    
    try {
      const newValues: Record<string, any> = {};
      
      await Promise.all(
        systemList.map(async (item) => {
          const val = await fetchValue(item.key);
          newValues[item.key] = val;
        })
      );
      
      setValues(newValues);
    } catch (error) {
      console.error("Error fetching system states:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllValues();
    if (pollIntervalMs > 0) {
      const interval = setInterval(fetchAllValues, pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [nodeId, refreshTrigger, pollIntervalMs]);

  const renderValueText = (key: string, value: any) => {
    if (value === null || value === undefined) {
      return "-";
    }

    if (typeof value === "boolean" || typeof value === "number") {
        if (key.toLowerCase().includes("door")) {
             return value ? "Open" : "Closed";
        }
      return value ? "On" : "Off";
    }

    return String(value);
  };
  
  // Helper to determine styling based on state
  // This is optional if we want to color the text, but the reference image 
  // shows black text. Let's stick to simple text first, or maybe conditional colors
  // if it matches the previous "Icon + Color" approach but in text form.
  // The user asked for "Card instead of table" and provided a reference.
  // Reference has: Title (top left), Value (bottom right large).
  
  const getValueStyles = (key: string, value: any) => {
       if (typeof value === "boolean") {
           // Green/Red logic maybe? Or just plain text.
           // Reference image "87.55 L" is black.
           // But context "System State" (On/Off, Open/Closed) usually benefits from color.
           // I will use standard text color for now to match the reference "clean" look,
           // maybe bold.
           
           if (key.toLowerCase().includes("door")) {
               return value ? "text-amber-600" : "text-green-600";
           }
           return value ? "text-green-600" : "text-muted-foreground";
       }
       return "";
  };


  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          System State
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && Object.keys(values).length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 {[1, 2, 3, 4].map(i => (
                     <div key={i} className="h-24 rounded-lg border bg-card text-card-foreground shadow-sm animate-pulse bg-muted/20" />
                 ))}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {systemList.map((item) => {
                    const displayValue = renderValueText(item.key, values[item.key]);
                    const valueColorClass = getValueStyles(item.key, values[item.key]);
                    
                    return (
                        <div 
                            key={item.id} 
                            className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col justify-between h-28"
                        >
                            <div className="text-lg font-medium text-muted-foreground self-start">
                                {item.name}
                            </div>
                            <div className={`text-3xl font-bold self-end ${valueColorClass}`}>
                                {displayValue}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemState;
