import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Link, Signal, Wifi, RotateCw, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export function DeviceBannerPreview() {
  return (
    <div className="space-y-6 mb-6">
      {/* Page Header Mock */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {/* Device Status Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border bg-green-500/10 text-green-500 border-green-500/20">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="font-medium capitalize">Online</span>
          </div>

          <span className="text-border">|</span>

          {/* Live Indicator */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-400"></span>
            </span>
            <span>Auto Refresh</span>
          </div>

          {/* Refresh Interval Selector */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <Select value="0">
              <SelectTrigger className="w-[110px] h-8">
                <SelectValue placeholder="Refresh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Off</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Manual Refresh Button */}
          <Button variant="outline" size="icon" className="h-8 w-8 ml-1" title="Refresh Data">
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden border-none shadow-md">
        <div className="h-48 w-full relative group">
          <img 
            src="/cold-room-banner.jpeg" 
            alt="Cold Room Facility" 
            className="w-full h-full object-cover transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
          <div className="absolute bottom-4 left-6 text-white">
            <h3 className="text-xl font-bold">Device 2</h3>
            <p className="text-white/80 text-sm"></p>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 text-sm">
            <div>
              <span className="font-medium text-muted-foreground flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4" />
                Created
              </span>
              <span className="block pl-6 font-medium">1/27/2026</span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground flex items-center gap-2 mb-1">
                <Link className="h-4 w-4" />
                Binding Status
              </span>
              <span className="block pl-6 font-medium text-green-600">Bound</span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground flex items-center gap-2 mb-1">
                <Wifi className="h-4 w-4" />
                Device Network
              </span>
              <span className="block pl-6 font-medium">Sim</span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground flex items-center gap-2 mb-1">
                <Signal className="h-4 w-4" />
                Signal Strength
              </span>
              <span className="block pl-6 font-medium text-green-600">
                Excellent <span className="text-xs text-muted-foreground">(23)</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
