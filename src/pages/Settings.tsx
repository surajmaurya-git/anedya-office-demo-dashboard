import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import GaugeChart from "@/components/GaugeChart";
import GaugeChartModern from "@/components/GaugeChartModern";
import GaugeChartMinimal from "@/components/GaugeChartMinimal";
import GaugeChartRetro from "@/components/GaugeChartRetro";
import GaugeChartFuturistic from "@/components/GaugeChartFuturistic";
import { Palette, Wifi, Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useDevices, useAddDevice, useUpdateDevice, useDeleteDevice, Device } from "@/hooks/useDevices";
import { toast } from "sonner";

type GaugeType = "classic" | "modern" | "minimal" | "retro" | "futuristic";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const [gaugeType, setGaugeType] = useState<GaugeType>("modern");
  
  // Device Management State
  const [newTitle, setNewTitle] = useState("");
  const [newNodeId, setNewNodeId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Hooks
  const { data: devices = [], isLoading: devicesLoading } = useDevices();
  const addDevice = useAddDevice();
  const updateDevice = useUpdateDevice();
  const deleteDevice = useDeleteDevice();

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("gaugeType") as GaugeType;
    if (saved) {
      setGaugeType(saved);
    }
  }, []);

  // Save to LocalStorage on change
  const handleGaugeChange = (value: GaugeType) => {
    setGaugeType(value);
    localStorage.setItem("gaugeType", value);
  };

  const handleAddDevice = async () => {
    const trimmedTitle = newTitle.trim();
    const trimmedNodeId = newNodeId.trim();

    if (!trimmedTitle || !trimmedNodeId) {
      toast.error("Please enter both a Title and Node ID.");
      return;
    }

    try {
      await addDevice.mutateAsync({ title: trimmedTitle, nodeId: trimmedNodeId });
      setNewTitle("");
      setNewNodeId("");
      toast.success(`Device "${trimmedTitle}" added successfully!`);
    } catch (err: any) {
      if (err?.message?.includes("duplicate key")) {
        toast.error("A device with a similar title already exists. Choose a different name.");
      } else {
        toast.error(`Failed to add device: ${err?.message || "Unknown error"}`);
      }
    }
  };

  const handleStartEdit = (device: Device) => {
    setEditingId(device.id);
    setEditTitle(device.title);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleSaveEdit = async (id: string) => {
    const trimmed = editTitle.trim();
    if (!trimmed) {
      toast.error("Title cannot be empty.");
      return;
    }

    try {
      await updateDevice.mutateAsync({ id, title: trimmed });
      setEditingId(null);
      setEditTitle("");
      toast.success("Device updated successfully!");
    } catch (err: any) {
      if (err?.message?.includes("duplicate key")) {
        toast.error("A device with a similar title already exists.");
      } else {
        toast.error(`Failed to update: ${err?.message || "Unknown error"}`);
      }
    }
  };

  const handleDelete = async (device: Device) => {
    if (!window.confirm(`Are you sure you want to delete "${device.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDevice.mutateAsync(device.id);
      toast.success(`Device "${device.title}" deleted.`);
    } catch (err: any) {
      toast.error(`Failed to delete: ${err?.message || "Unknown error"}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your dashboard preferences and configurations.
          </p>
        </div>
        
        <Separator className="my-6" />



        {/* ── Theme Configuration ── */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Theme Configuration
            </CardTitle>
            <CardDescription>
              Select the overall look and feel of the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={theme}
              onValueChange={(val) => {
                setTheme(val as any);
                // Sync Gauge with Theme
                if (val === "classic" || val === "modern" || val === "minimal" || val === "retro" || val === "futuristic") {
                   handleGaugeChange(val);
                }
              }}
              className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4"
            >
              {[
                { id: "classic", label: "Classic", color: "bg-slate-100", border: "border-slate-300" },
                { id: "modern", label: "Modern", color: "bg-slate-900", border: "border-slate-700" },
                { id: "minimal", label: "Minimalist", color: "bg-white", border: "border-black" },
                { id: "retro", label: "Retro", color: "bg-[#f0eadd]", border: "border-[#b8a07e]" },
                { id: "futuristic", label: "Futuristic", color: "bg-black", border: "border-cyan-500" },
              ].map((t) => (
                <div key={t.id} className="flex flex-col space-y-2">
                   <div className="flex items-center space-x-2">
                    <RadioGroupItem value={t.id} id={`theme-${t.id}`} />
                    <Label htmlFor={`theme-${t.id}`} className="font-medium cursor-pointer">{t.label}</Label>
                  </div>
                  <Label htmlFor={`theme-${t.id}`} className={`cursor-pointer border-2 rounded-lg p-4 h-24 flex items-center justify-center transition-all ${t.color} ${t.border} ${theme === t.id ? 'ring-2 ring-primary ring-offset-2' : 'hover:opacity-80'}`}>
                      <div className="flex flex-col gap-2 w-full">
                        <div className={`h-2 w-3/4 rounded-full ${t.id === 'modern' || t.id === 'futuristic' ? 'bg-slate-700' : 'bg-slate-300'}`} />
                        <div className={`h-2 w-1/2 rounded-full ${t.id === 'modern' || t.id === 'futuristic' ? 'bg-slate-700' : 'bg-slate-300'}`} />
                      </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default Settings;
