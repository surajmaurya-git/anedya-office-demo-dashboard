import React from 'react';
import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';

const PlaceholderPage: React.FC = () => {
  const location = useLocation();
  const pageName = location.pathname.replace('/', '').replace('-', ' ');
  const formattedName = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight capitalize">{formattedName}</h1>
          <p className="text-muted-foreground mt-1">This page is under construction</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Construction className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Coming Soon</h2>
            <p className="text-muted-foreground text-center max-w-md">
              The {formattedName} page is currently being developed. 
              Check back soon for more IoT monitoring features!
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PlaceholderPage;
