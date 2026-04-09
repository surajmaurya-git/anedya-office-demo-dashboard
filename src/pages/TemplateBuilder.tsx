import React, { useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import BuilderLayout from '../components/dashboard-builder/BuilderLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBuilderStore } from '@/store/useBuilderStore';

export default function TemplateBuilder() {
  const { setTemplate } = useBuilderStore();

  // Load existing default template on mount
  useEffect(() => {
    const loadDefaultTemplate = async () => {
      try {
        const { data } = await supabase
          .from('dashboard_templates')
          .select('*')
          .eq('name', 'default')
          .single();

        if (data?.schema) {
          const s = data.schema as any;
          if (s.layout && s.widgets) {
            // Support v1 (no sections) and v2 (with sections)
            const sections = s.sections || [];
            setTemplate(sections, s.layout, s.widgets);
          }
        }
      } catch {
        // No existing template yet — start fresh
      }
    };
    loadDefaultTemplate();
  }, [setTemplate]);

  // Auto-save as "default" template (upsert)
  const handleSaveTemplate = async (templateData: any) => {
    try {
      // Check if a default template already exists
      const { data: existing } = await supabase
        .from('dashboard_templates')
        .select('id')
        .eq('name', 'default')
        .single();

      let error;
      if (existing?.id) {
        // Update existing
        ({ error } = await supabase
          .from('dashboard_templates')
          .update({ schema: templateData })
          .eq('id', existing.id));
      } else {
        // Insert new
        ({ error } = await supabase
          .from('dashboard_templates')
          .insert({ name: 'default', schema: templateData }));
      }

      if (error) throw error;
      toast.success('Template saved successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to save template');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 flex flex-col h-[calc(100vh-80px)]">
        
        <BuilderLayout onSave={handleSaveTemplate} />
      </div>
    </DashboardLayout>
  );
}
