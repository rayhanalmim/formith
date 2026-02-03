import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketClient, ReportEvent } from '@/lib/socket';

export function useRealtimeReports() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to admin reports room
    socketClient.subscribeToAdminReports();

    // Handle report changes
    const handleReportChange = (event: ReportEvent) => {
      console.log('Reports realtime update:', event.type);
      
      // Invalidate reports queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['pending-reports-count'] });
    };

    const unsubscribe = socketClient.onReportChange(handleReportChange);

    return () => {
      unsubscribe();
    };
  }, [queryClient]);
}
