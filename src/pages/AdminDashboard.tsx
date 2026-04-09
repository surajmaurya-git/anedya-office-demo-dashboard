import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Smartphone, Shield, Activity, Wifi } from "lucide-react";
import { useDevices } from "@/hooks/useDevices";
import { useUsers } from "@/hooks/useUsers";

const AdminDashboard = () => {
  const { data: devices = [], isLoading: devicesLoading } = useDevices();
  const { data: users = [], isLoading: usersLoading } = useUsers();

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of the IoT platform system health and resources.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {devicesLoading ? "-" : devices.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Registered in the system
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usersLoading ? "-" : users.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Active user accounts
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
