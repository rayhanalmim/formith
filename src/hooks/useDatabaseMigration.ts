import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TableInfo {
  table: string;
  rowCount: number;
  category: 'migrate' | 'auth';
}

interface MigrationResult {
  table: string;
  success: boolean;
  rowsMigrated: number;
  error?: string;
}

interface MigrationStatus {
  tables: TableInfo[];
  totalMigrateTables: number;
  totalAuthTables: number;
  targetDatabase: string;
  connectionConfigured: boolean;
}

interface MigrationResultData {
  success: boolean;
  results: MigrationResult[];
  totalMigrated: number;
  successCount: number;
  failedCount: number;
  error?: string;
}

interface CleanupResult {
  table: string;
  success: boolean;
  rowsDeleted: number;
  error?: string;
}

interface CleanupResultData {
  success: boolean;
  results: CleanupResult[];
  totalDeleted: number;
  successCount: number;
  failedCount: number;
  error?: string;
}

interface ConnectionTestResult {
  success: boolean;
  version?: { version: string };
  error?: string;
}

export interface PostgresConnectionConfig {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  sslmode: string;
}

export function useDatabaseMigration() {
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResultData | null>(null);
  const [cleanupResult, setCleanupResult] = useState<CleanupResultData | null>(null);
  const [connectionTest, setConnectionTest] = useState<ConnectionTestResult | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('migrate-to-postgres', {
        body: { action: 'get-status' },
      });

      if (error) throw error;
      setStatus(data);
      return data;
    } catch (error) {
      console.error('Error fetching migration status:', error);
      toast.error('Failed to fetch migration status');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const testConnection = useCallback(async (config?: PostgresConnectionConfig) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('migrate-to-postgres', {
        body: { action: 'test-connection', connectionConfig: config },
      });

      if (error) throw error;
      setConnectionTest(data);
      
      if (data.success) {
        toast.success('Connection to DigitalOcean PostgreSQL successful!');
      } else {
        toast.error(`Connection failed: ${data.error}`);
      }
      return data;
    } catch (error) {
      console.error('Connection test error:', error);
      toast.error('Failed to test connection');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startMigration = useCallback(async (config?: PostgresConnectionConfig) => {
    setIsMigrating(true);
    setMigrationResult(null);

    try {
      toast.info('Starting database migration to DigitalOcean...', { duration: 5000 });

      const { data, error } = await supabase.functions.invoke('migrate-to-postgres', {
        body: { action: 'migrate', connectionConfig: config },
      });

      if (error) throw error;

      setMigrationResult(data);

      if (data.success) {
        toast.success(`Migration complete! ${data.totalMigrated} rows migrated across ${data.successCount} tables`);
      } else {
        toast.error(`Migration had issues: ${data.error || 'Some tables failed'}`);
      }
      return data;
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Database migration failed');
      return null;
    } finally {
      setIsMigrating(false);
    }
  }, []);

  const cleanupSupabase = useCallback(async () => {
    setIsCleaning(true);
    setCleanupResult(null);

    try {
      toast.info('Cleaning up migrated data from Supabase...', { duration: 5000 });

      const { data, error } = await supabase.functions.invoke('migrate-to-postgres', {
        body: { action: 'cleanup-supabase' },
      });

      if (error) throw error;

      setCleanupResult(data);

      if (data.success) {
        toast.success(`Cleanup complete! ${data.totalDeleted} rows removed from Supabase`);
        // Refresh status after cleanup
        fetchStatus();
      } else {
        toast.error(`Cleanup had issues: ${data.error || 'Some tables failed'}`);
      }
      return data;
    } catch (error) {
      console.error('Cleanup error:', error);
      toast.error('Cleanup failed');
      return null;
    } finally {
      setIsCleaning(false);
    }
  }, [fetchStatus]);

  return {
    isLoading,
    isMigrating,
    isCleaning,
    status,
    migrationResult,
    cleanupResult,
    connectionTest,
    fetchStatus,
    testConnection,
    startMigration,
    cleanupSupabase,
  };
}
