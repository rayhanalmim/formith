import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/lib/api';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  subject_ar: string | null;
  body_html: string;
  body_html_ar: string | null;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export function useEmailTemplates() {
  return useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const response = await api.getEmailTemplates();
      return (response.data || []) as EmailTemplate[];
    },
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Partial<EmailTemplate> & { id: string }) => {
      const { id, ...updates } = template;
      const response = await api.updateEmailTemplate(id, updates);
      if (!response.success) {
        throw new Error('Failed to update email template');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
  });
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at' | 'updated_by'>) => {
      const response = await api.createEmailTemplate(template);
      if (!response.success) {
        throw new Error('Failed to create email template');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
  });
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.deleteEmailTemplate(id);
      if (!response.success) {
        throw new Error('Failed to delete email template');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
  });
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: async ({ 
      to, 
      template_name, 
      variables,
      language = 'en',
    }: { 
      to: string; 
      template_name: string; 
      variables: Record<string, string>;
      language?: 'en' | 'ar';
    }) => {
      // Edge functions still use Supabase
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { to, template_name, variables, language },
      });

      if (error) throw error;
      return data;
    },
  });
}
