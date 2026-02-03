import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface SmtpSettings {
  id: string;
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  use_tls: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useSmtpSettings() {
  return useQuery({
    queryKey: ['smtp-settings'],
    queryFn: async () => {
      const response = await api.getSmtpSettings();
      return response.data as SmtpSettings | null;
    },
  });
}

export function useUpdateSmtpSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<SmtpSettings> & { id?: string }) => {
      const { id, ...rest } = settings;
      
      const response = await api.saveSmtpSettings({
        host: rest.host!,
        username: rest.username!,
        password: rest.password!,
        from_email: rest.from_email!,
        from_name: rest.from_name || 'Tahweel',
        port: rest.port || 587,
        use_tls: rest.use_tls ?? true,
        is_active: true,
      }, id);

      if (!response.success) {
        throw new Error('Failed to save SMTP settings');
      }
      return response.data || null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smtp-settings'] });
    },
  });
}
