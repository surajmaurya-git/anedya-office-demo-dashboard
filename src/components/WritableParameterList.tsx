import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X, FilePenLine, Settings } from "lucide-react";
import { toast } from "sonner";

interface Parameter {
  id: string;
  name: string;
  value: string;
  unit: string;
  modified?: number;
}

interface WritableParameterListProps {
  nodeId: string;
  pollIntervalMs?: number;
  refreshTrigger?: number;
}

const WritableParameterList: React.FC<WritableParameterListProps> = ({
  nodeId,
  pollIntervalMs = 60000,
  refreshTrigger = 0,
}) => {
  const PARAM_CONFIG = [
    { id: "compressoronsetpoint", name: "Compressor Onset Point", unit: "°C" },
    { id: "hightempsetpoint", name: "High Temp Set Point", unit: "°C" },
    { id: "lowtempsetpoint", name: "Low Temp Set Point", unit: "°C" },
    { id: "dooropenfaultdelay", name: "Door Open Fault Delay", unit: "Seconds" },
    { id: "lightatdooropen", name: "Door Open Fault Delay", unit: "Seconds" },
  ];
  
  const [parameters, setParameters] = useState<Parameter[]>(
    PARAM_CONFIG.map((p) => ({ ...p, value: "-" })),
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  const fetchParameterValue = async (key: string) => {
    try {
      const response = await fetch(
        "https://api.anedya.io/v1/valuestore/getValue",
        {
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
        },
      );

      const data = await response.json();
      if (data.success) {
        return { value: String(data.value), modified: data.modified };
      }
      console.error(`Failed to fetch value for ${key}:`, data);
      return null;
    } catch (error) {
      console.error(`Error fetching value for ${key}:`, error);
      return null;
    }
  };

  const setParameterValue = async (key: string, value: number) => {
    try {
      const response = await fetch(
        "https://api.anedya.io/v1/valuestore/setValue",
        {
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
            value: value,
            type: "float",
          }),
        },
      );

      const data = await response.json();
      if (data.success) {
        return true;
      }
      console.error(`Failed to set value for ${key}:`, data);
      return false;
    } catch (error) {
      console.error(`Error setting value for ${key}:`, error);
      return null;
    }
  };

  React.useEffect(() => {
    const loadParameters = async () => {
      // Immediately show loading state or keep old values?
      // User wants reset.
      // But we can just fetch and replace.

      const updatedParameters = await Promise.all(
        PARAM_CONFIG.map(async (config) => {
          const result = await fetchParameterValue(config.id);
          if (result) {
              return { ...config, value: result.value, modified: result.modified };
          }
          return { ...config, value: "-" };
        }),
      );
      setParameters(updatedParameters);
    };

    // Reset to loading state immediately when nodeId changes is also a good UX
    setParameters(PARAM_CONFIG.map((p) => ({ ...p, value: "-" })));

    loadParameters();

    if (pollIntervalMs > 0) {
      const interval = setInterval(() => {
        loadParameters();
      }, pollIntervalMs);

      return () => clearInterval(interval);
    }
  }, [nodeId, pollIntervalMs, refreshTrigger]);

  const handleEdit = (param: Parameter) => {
    setEditingId(param.id);
    setEditValue(param.value);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleSave = async (id: string) => {
    // API Call Logic Here
    console.log(`Saving ${id} with value ${editValue}`);

    // Simulate API call
    try {
      // await api.updateParameter(id, editValue); // Placeholder
      const valueSet = await setParameterValue(id, parseFloat(editValue));
      console.log("parameters", id);
      console.log("editValue", editValue);

      setParameters((prev) =>
        prev.map((p) => (p.id === id ? { ...p, value: editValue } : p)),
      );

      toast.success("Parameter updated successfully");
      setEditingId(null);
    } catch (error) {
      toast.error("Failed to update parameter");
      console.error(error);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(parameters.length / itemsPerPage);
  const currentParameters = parameters.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Writable Parameter List
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[40%] font-medium">
                  Parameter Name
                </TableHead>
                <TableHead className="w-[20%] font-medium">Value</TableHead>
                <TableHead className="font-medium">Last Modified</TableHead>
                <TableHead className="w-[120px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentParameters.map((param) => (
                <TableRow key={param.id}>
                  <TableCell className="font-medium py-4">
                    {param.name}
                  </TableCell>
                  <TableCell className="py-2">
                    {editingId === param.id ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-9 max-w-[200px]"
                      />
                    ) : (
                      <span>
                        {param.value}{" "}
                        <span className="text-muted-foreground ml-1">
                          {param.unit}
                        </span>
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-2 text-muted-foreground text-sm">
                      {param.modified && param.modified > 0 ? new Date(param.modified * 1000).toLocaleString() : "-"}
                  </TableCell>
                  <TableCell className="text-right py-2">
                    {editingId === param.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          className="h-8 px-3"
                          onClick={() => handleSave(param.id)}
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={handleCancel}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => handleEdit(param)}
                      >
                        <FilePenLine className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {currentParameters.length > 0 &&
                Array.from({
                  length: itemsPerPage - currentParameters.length,
                }).map((_, index) => (
                  <TableRow key={`empty-${index}`} className="h-[53px]">
                    <TableCell colSpan={4}>&nbsp;</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {parameters.length > itemsPerPage && (
          <div className="flex items-center justify-end space-x-2 pt-4">
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
      </CardContent>
    </Card>
  );
};

export default WritableParameterList;
