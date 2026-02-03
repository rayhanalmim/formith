import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { doClient } from '@/lib/do-client';
import { toast } from 'sonner';

interface MigrationResult {
  originalUrl: string;
  newUrl: string;
  success: boolean;
  error?: string;
}

interface MigrationStats {
  total: number;
  migrated: number;
  failed: number;
  pending: number;
}

interface MediaUrls {
  avatars: string[];
  covers: string[];
  posts: string[];
  rooms: string[];
  messages: string[];
}

export function useFileMigration() {
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [stats, setStats] = useState<MigrationStats>({ total: 0, migrated: 0, failed: 0, pending: 0 });
  const [results, setResults] = useState<MigrationResult[]>([]);
  const [mediaUrls, setMediaUrls] = useState<MediaUrls>({
    avatars: [],
    covers: [],
    posts: [],
    rooms: [],
    messages: [],
  });
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [progress, setProgress] = useState(0);

  // Fetch all media URLs that need migration (Supabase URLs only) from DigitalOcean
  const fetchMediaUrls = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all media URLs in parallel from DigitalOcean
      const [avatars, covers, posts, rooms, messages] = await Promise.all([
        // Avatars from profiles
        doClient.from('profiles')
          .not('avatar_url', 'is', null)
          .select('avatar_url'),
        // Covers from profiles
        doClient.from('profiles')
          .not('cover_url', 'is', null)
          .select('cover_url'),
        // Posts media
        doClient.from('post_media')
          .select('media_url'),
        // Room messages media
        doClient.from('messages')
          .not('media_url', 'is', null)
          .select('media_url'),
        // Direct messages media
        doClient.from('direct_messages')
          .not('media_url', 'is', null)
          .select('media_url'),
      ]);

      // Filter for Supabase URLs only (need migration)
      const supabaseUrlPattern = 'supabase';
      
      const urls: MediaUrls = {
        avatars: (avatars || [])
          .map((p: any) => p.avatar_url)
          .filter((url: string | null): url is string => !!url && url.includes(supabaseUrlPattern)),
        covers: (covers || [])
          .map((p: any) => p.cover_url)
          .filter((url: string | null): url is string => !!url && url.includes(supabaseUrlPattern)),
        posts: (posts || [])
          .map((p: any) => p.media_url)
          .filter((url: string | null): url is string => !!url && url.includes(supabaseUrlPattern)),
        rooms: (rooms || [])
          .map((m: any) => m.media_url)
          .filter((url: string | null): url is string => !!url && url.includes(supabaseUrlPattern)),
        messages: (messages || [])
          .map((m: any) => m.media_url)
          .filter((url: string | null): url is string => !!url && url.includes(supabaseUrlPattern)),
      };

      setMediaUrls(urls);
      
      const total = urls.avatars.length + urls.covers.length + urls.posts.length + urls.rooms.length + urls.messages.length;
      setStats({ total, migrated: 0, failed: 0, pending: total });

      return urls;
    } catch (error) {
      console.error('Error fetching media URLs:', error);
      toast.error('Failed to fetch media URLs');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Migrate a batch of URLs (uses Supabase edge function)
  const migrateBatch = useCallback(async (urls: string[], folder: string): Promise<MigrationResult[]> => {
    if (urls.length === 0) return [];

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.access_token) {
      throw new Error('Not authenticated');
    }

    const response = await supabase.functions.invoke('migrate-to-spaces', {
      body: { sourceUrls: urls, folder },
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data.results || [];
  }, []);

  // Update database with new URLs (uses DigitalOcean)
  const updateDatabaseUrls = useCallback(async (folder: string, results: MigrationResult[]) => {
    const successfulMigrations = results.filter(r => r.success);

    for (const migration of successfulMigrations) {
      try {
        switch (folder) {
          case 'avatars':
            await doClient.from('profiles')
              .update({ avatar_url: migration.newUrl })
              .eq('avatar_url', migration.originalUrl);
            break;
          case 'covers':
            await doClient.from('profiles')
              .update({ cover_url: migration.newUrl })
              .eq('cover_url', migration.originalUrl);
            break;
          case 'posts':
            await doClient.from('post_media')
              .update({ media_url: migration.newUrl })
              .eq('media_url', migration.originalUrl);
            break;
          case 'rooms':
            await doClient.from('messages')
              .update({ media_url: migration.newUrl })
              .eq('media_url', migration.originalUrl);
            break;
          case 'messages':
            await doClient.from('direct_messages')
              .update({ media_url: migration.newUrl })
              .eq('media_url', migration.originalUrl);
            break;
        }
      } catch (error) {
        console.error(`Error updating database for ${migration.originalUrl}:`, error);
      }
    }
  }, []);

  // Migrate all files for a specific folder
  const migrateFolder = useCallback(async (folder: keyof MediaUrls) => {
    const urls = mediaUrls[folder];
    if (urls.length === 0) {
      toast.info(`No files to migrate in ${folder}`);
      return;
    }

    setIsMigrating(true);
    setCurrentFolder(folder);
    setProgress(0);
    setResults([]);

    const batchSize = 5; // Process 5 files at a time
    const allResults: MigrationResult[] = [];
    let migrated = 0;
    let failed = 0;

    try {
      for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);
        
        try {
          const batchResults = await migrateBatch(batch, folder);
          allResults.push(...batchResults);
          
          // Update database with new URLs
          await updateDatabaseUrls(folder, batchResults);
          
          migrated += batchResults.filter(r => r.success).length;
          failed += batchResults.filter(r => !r.success).length;
          
          setResults([...allResults]);
          setStats(prev => ({
            ...prev,
            migrated: prev.migrated + batchResults.filter(r => r.success).length,
            failed: prev.failed + batchResults.filter(r => !r.success).length,
            pending: prev.pending - batch.length,
          }));
          
          setProgress(Math.round(((i + batch.length) / urls.length) * 100));
        } catch (error) {
          console.error(`Error migrating batch:`, error);
          failed += batch.length;
          setStats(prev => ({
            ...prev,
            failed: prev.failed + batch.length,
            pending: prev.pending - batch.length,
          }));
        }
      }

      toast.success(`Migration complete: ${migrated} succeeded, ${failed} failed`);
    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Migration failed');
    } finally {
      setIsMigrating(false);
      setCurrentFolder('');
      setProgress(100);
    }
  }, [mediaUrls, migrateBatch, updateDatabaseUrls]);

  // Migrate all folders
  const migrateAll = useCallback(async () => {
    const folders: (keyof MediaUrls)[] = ['avatars', 'covers', 'posts', 'rooms', 'messages'];
    
    for (const folder of folders) {
      if (mediaUrls[folder].length > 0) {
        await migrateFolder(folder);
      }
    }
  }, [mediaUrls, migrateFolder]);

  return {
    isLoading,
    isMigrating,
    stats,
    results,
    mediaUrls,
    currentFolder,
    progress,
    fetchMediaUrls,
    migrateFolder,
    migrateAll,
  };
}
