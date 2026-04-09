import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Bell } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface Alert {
  timestamp: number;
  value: string;
}

interface AlertListProps {
  nodeId: string;
  refreshTrigger?: number;
}

const ALERT_CONFIG = [
  {
    "alert": "roomprobefail_low",
    "value": {
      "0": "Room probe temperature normal",
      "1": "Room probe temperature fail low"
    }
  },
  {
    "alert": "roomprobefail_high",
    "value": {
      "0": "Room probe temperature normal",
      "1": "Room probe temperature fail high"
    }
  },
  {
    "alert": "roomtemp_high",
    "value": {
      "0": "Room temperature normal",
      "1": "Room temperature high"
    }
  },
  {
    "alert": "roomtemp_low",
    "value": {
      "0": "Room temperature normal",
      "1": "Room temperature low"
    }
  },
  {
    "alert": "coilprobefail_low",
    "value": {
      "0": "Coil probe temperature normal",
      "1": "Coil probe temperature fail low"
    }
  },
  {
    "alert": "coilprobefail_high",
    "value": {
      "0": "Coil probe temperature normal",
      "1": "Coil probe temperature fail high"
    }
  },
  {
    "alert": "dooropen_fault",
    "value": {
      "0": "Door closed (normal)",
      "1": "Door open fault"
    }
  },
  {
    "alert": "powerDownDetected",
    "value": {
      "0": "Power is normal",
      "1": "Power down detected"
    }
  } 
];

const getAlertMessage = (alertValue: string): { message: string; isAlarm: boolean } => {
  // Extract the last character as status (0 or 1)
  const statusChar = alertValue.slice(-1);
  const status = parseInt(statusChar, 10);
  
  // Extract the key (everything before the last digit)
  const key = alertValue.slice(0, -1);

  // Validate if status is a number (0 or 1)
  if (isNaN(status) || (status !== 0 && status !== 1)) {
    // Fallback for improved readable format if not following standard schema
    return {
        message: alertValue
            .replace(/([A-Z])/g, " $1")
            .replace(/[_-]/g, " ")
            .trim()
            .replace(/^./, (str) => str.toUpperCase()),
        isAlarm: false
    };
  }

  const config = ALERT_CONFIG.find((c) => c.alert === key);

  if (config) {
    // @ts-ignore - we know 0 and 1 are valid keys here
    return { message: config.value[status] || alertValue, isAlarm: status === 1 };
  }

  // Fallback
  return { 
      message: `${key} (${status})`, 
      isAlarm: status === 1 
  };
};

const AlertList: React.FC<AlertListProps> = ({ nodeId, refreshTrigger = 0 }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      // Calculate timestamps: 'to' is now, 'from' is 30 days ago
      const to = Math.floor(Date.now() / 1000);
      const from = to - 30 * 24 * 60 * 60; // 30 days

      const response = await fetch("https://api.anedya.io/v1/data/getData", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_ANEDYA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nodes: [nodeId],
          variable: "alertStatus",
          from: from,
          to: to,
          order: "desc",
        }),
      });

      const data = await response.json();

      if (data.success && data.data && data.data[nodeId]) {
        setAlerts(data.data[nodeId]);
        setCurrentPage(1); // Reset to first page on new data
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Refresh every minute
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [nodeId, refreshTrigger]);

  // Calculate pagination
  const totalPages = Math.ceil(alerts.length / itemsPerPage);
  const currentAlerts = alerts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Alert History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[40%]">Timestamp</TableHead>
                <TableHead>Alert Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-[250px] text-center">
                    Loading alerts...
                  </TableCell>
                </TableRow>
              ) : alerts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="h-[250px] text-center text-muted-foreground"
                  >
                    No alerts found within the last 30 days.
                  </TableCell>
                </TableRow>
              ) : (
                currentAlerts.map((alert, index) => {
                  const { message, isAlarm } = getAlertMessage(alert.value);
                  return (
                  <TableRow key={`${alert.timestamp}-${index}`}>
                    <TableCell className="font-medium">
                      {format(new Date(alert.timestamp * 1000), "PP pp")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`h-4 w-4 ${isAlarm ? "text-destructive" : "text-green-500"}`} />
                        <span className="font-medium">
                          {message}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )})
              )}
              {currentAlerts.length > 0 && Array.from({ length: itemsPerPage - currentAlerts.length }).map((_, index) => (
                <TableRow key={`empty-${index}`} className="h-[53px]">
                   <TableCell colSpan={2}>&nbsp;</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
            {/* Pagination Controls */}
      {alerts.length > itemsPerPage && (
        <div className="flex items-center justify-end space-x-2 p-4 pt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </Card>
  );
};

export default AlertList;
