import React from 'react';
import ComponentSidebar from './ComponentSidebar';
import CanvasGrid from './CanvasGrid';
import PropertiesPanel from './PropertiesPanel';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { useBuilderStore } from '../../store/useBuilderStore';

export default function BuilderLayout({ onSave }: { onSave: (templateData: any) => void }) {
  const { sections, layout, widgets } = useBuilderStore();

  const handleSave = () => {
    onSave({
      version: '2.0',
      sections,
      layout,
      widgets
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] w-full border rounded-xl overflow-hidden shadow-sm bg-white">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
         <h2 className="text-sm font-semibold text-gray-700">Dashboard Layout Builder</h2>
         <Button onClick={handleSave} size="sm" className="gap-2">
            <Save size={16} /> Save Template
         </Button>
      </div>
      
      {/* 3-Column main area */}
      <div className="flex flex-1 overflow-hidden">
        <ComponentSidebar />
        <CanvasGrid />
        <PropertiesPanel />
      </div>
    </div>
  );
}
