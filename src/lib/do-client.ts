import { supabase } from '@/integrations/supabase/client';

// Tables that exist on DigitalOcean - ALL content tables including profiles
// NOTE: user_roles is on Supabase, NOT DigitalOcean (handled by Supabase triggers)
const DO_TABLES = [
  'profiles', 'user_settings',
  'banners', 'categories', 'posts', 'post_media', 'post_polls', 'poll_options', 
  'poll_votes', 'post_views', 'comments', 'likes', 'bookmarks', 'follows',
  'rooms', 'room_members', 'room_invites', 'room_activity_log', 'messages', 
  'message_reactions', 'message_reads', 'conversations', 'conversation_participants', 
  'direct_messages', 'dm_reactions', 'dm_hidden_messages', 'reports', 'notifications',
  'smtp_settings', 'email_templates',
  'stories', 'story_views', 'story_reactions', 'story_replies', 
  'story_highlights', 'story_highlight_items'
];

export type DOFilter = {
  eq?: any;
  neq?: any;
  gt?: any;
  gte?: any;
  lt?: any;
  lte?: any;
  like?: string;
  ilike?: string;
  in?: any[];
  is?: null | boolean;
  not?: null;
};

export type DOFilters = Record<string, DOFilter | any>;

export type DOOrder = {
  column: string;
  ascending?: boolean;
};

export type DOOptions = {
  columns?: string;
  order?: DOOrder[];
  limit?: number;
  offset?: number;
};

// Check if table is on DigitalOcean
export function isOnDigitalOcean(table: string): boolean {
  return DO_TABLES.includes(table);
}

// Generic query function to DigitalOcean
async function doQuery(payload: {
  action: string;
  table?: string;
  query?: string;
  data?: any;
  filters?: DOFilters;
  options?: DOOptions;
}) {
  const { data, error } = await supabase.functions.invoke('do-query', {
    body: payload,
  });

  if (error) {
    console.error('DO Query error:', error);
    throw error;
  }

  if (data?.error) {
    console.error('DO Query data error:', data.error);
    throw new Error(data.error);
  }

  return data?.data || [];
}

// DigitalOcean client with Supabase-like API
export const doClient = {
  from: (table: string) => {
    let filters: DOFilters = {};
    let options: DOOptions = {};

    // Normalize inserts for tables that don't have server-side defaults on DigitalOcean.
    // This prevents 500s like: null value in column "id" violates not-null constraint.
    const normalizeInsertData = (payload: any) => {
      if (!payload) return payload;

      // Ensure required fields for follows.
      // DO doesn't generate UUIDs automatically; created_at may also be required/expected.
      const ensureFollowsFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.created_at == null) next.created_at = new Date().toISOString();
        return next;
      };

      if (table === 'follows') {
        return Array.isArray(payload) ? payload.map(ensureFollowsFields) : ensureFollowsFields(payload);
      }

      // Room activity log rows need client-side UUIDs on DO (no server-side gen_random_uuid()).
      const ensureRoomActivityLogFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.created_at == null) next.created_at = new Date().toISOString();
        if (next.details == null) next.details = {};
        return next;
      };

      if (table === 'room_activity_log') {
        return Array.isArray(payload)
          ? payload.map(ensureRoomActivityLogFields)
          : ensureRoomActivityLogFields(payload);
      }

      // Message reads rows need client-side UUIDs on DO (no server-side gen_random_uuid()).
      // Also ensure read_at is present since some schemas expect it.
      const ensureMessageReadsFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.read_at == null) next.read_at = new Date().toISOString();
        return next;
      };

      if (table === 'message_reads') {
        return Array.isArray(payload)
          ? payload.map(ensureMessageReadsFields)
          : ensureMessageReadsFields(payload);
      }

      // Message reactions rows need client-side UUIDs on DO (no server-side gen_random_uuid()).
      const ensureMessageReactionsFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.created_at == null) next.created_at = new Date().toISOString();
        return next;
      };

      if (table === 'message_reactions') {
        return Array.isArray(payload)
          ? payload.map(ensureMessageReactionsFields)
          : ensureMessageReactionsFields(payload);
      }

      // DM reactions rows need client-side UUIDs on DO (no server-side gen_random_uuid()).
      const ensureDMReactionsFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.created_at == null) next.created_at = new Date().toISOString();
        return next;
      };

      if (table === 'dm_reactions') {
        return Array.isArray(payload)
          ? payload.map(ensureDMReactionsFields)
          : ensureDMReactionsFields(payload);
      }

      // Categories need client-side UUIDs on DO (no server-side gen_random_uuid()).
      const ensureCategoriesFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.created_at == null) next.created_at = new Date().toISOString();
        if (next.updated_at == null) next.updated_at = new Date().toISOString();
        return next;
      };

      if (table === 'categories') {
        return Array.isArray(payload)
          ? payload.map(ensureCategoriesFields)
          : ensureCategoriesFields(payload);
      }

      // Banners need client-side UUIDs on DO.
      const ensureBannersFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.created_at == null) next.created_at = new Date().toISOString();
        if (next.updated_at == null) next.updated_at = new Date().toISOString();
        return next;
      };

      if (table === 'banners') {
        return Array.isArray(payload)
          ? payload.map(ensureBannersFields)
          : ensureBannersFields(payload);
      }

      // Reports need client-side UUIDs on DO.
      const ensureReportsFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.created_at == null) next.created_at = new Date().toISOString();
        return next;
      };

      if (table === 'reports') {
        return Array.isArray(payload)
          ? payload.map(ensureReportsFields)
          : ensureReportsFields(payload);
      }

      // Notifications need client-side UUIDs on DO.
      const ensureNotificationsFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.created_at == null) next.created_at = new Date().toISOString();
        return next;
      };

      if (table === 'notifications') {
        return Array.isArray(payload)
          ? payload.map(ensureNotificationsFields)
          : ensureNotificationsFields(payload);
      }

      // Room invites need client-side UUIDs on DO.
      const ensureRoomInvitesFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.created_at == null) next.created_at = new Date().toISOString();
        return next;
      };

      if (table === 'room_invites') {
        return Array.isArray(payload)
          ? payload.map(ensureRoomInvitesFields)
          : ensureRoomInvitesFields(payload);
      }

      // Room members need client-side UUIDs on DO.
      const ensureRoomMembersFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.joined_at == null) next.joined_at = new Date().toISOString();
        return next;
      };

      if (table === 'room_members') {
        return Array.isArray(payload)
          ? payload.map(ensureRoomMembersFields)
          : ensureRoomMembersFields(payload);
      }

      // Push subscriptions need client-side UUIDs on DO.
      const ensurePushSubscriptionsFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.created_at == null) next.created_at = new Date().toISOString();
        if (next.updated_at == null) next.updated_at = new Date().toISOString();
        return next;
      };

      if (table === 'push_subscriptions') {
        return Array.isArray(payload)
          ? payload.map(ensurePushSubscriptionsFields)
          : ensurePushSubscriptionsFields(payload);
      }

      // Posts need client-side UUIDs on DO.
      const ensurePostsFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.created_at == null) next.created_at = new Date().toISOString();
        if (next.updated_at == null) next.updated_at = new Date().toISOString();
        return next;
      };

      if (table === 'posts') {
        return Array.isArray(payload)
          ? payload.map(ensurePostsFields)
          : ensurePostsFields(payload);
      }

      // Post media need client-side UUIDs on DO.
      const ensurePostMediaFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.created_at == null) next.created_at = new Date().toISOString();
        return next;
      };

      if (table === 'post_media') {
        return Array.isArray(payload)
          ? payload.map(ensurePostMediaFields)
          : ensurePostMediaFields(payload);
      }

      // Comments need client-side UUIDs on DO.
      const ensureCommentsFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.created_at == null) next.created_at = new Date().toISOString();
        if (next.updated_at == null) next.updated_at = new Date().toISOString();
        return next;
      };

      if (table === 'comments') {
        return Array.isArray(payload)
          ? payload.map(ensureCommentsFields)
          : ensureCommentsFields(payload);
      }

      // Likes need client-side UUIDs on DO.
      const ensureLikesFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.created_at == null) next.created_at = new Date().toISOString();
        return next;
      };

      if (table === 'likes') {
        return Array.isArray(payload)
          ? payload.map(ensureLikesFields)
          : ensureLikesFields(payload);
      }

      // Bookmarks need client-side UUIDs on DO.
      const ensureBookmarksFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.created_at == null) next.created_at = new Date().toISOString();
        return next;
      };

      if (table === 'bookmarks') {
        return Array.isArray(payload)
          ? payload.map(ensureBookmarksFields)
          : ensureBookmarksFields(payload);
      }

      // Rooms need client-side UUIDs on DO.
      const ensureRoomsFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.created_at == null) next.created_at = new Date().toISOString();
        if (next.updated_at == null) next.updated_at = new Date().toISOString();
        return next;
      };

      if (table === 'rooms') {
        return Array.isArray(payload)
          ? payload.map(ensureRoomsFields)
          : ensureRoomsFields(payload);
      }

      // Messages need client-side UUIDs on DO.
      const ensureMessagesFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.created_at == null) next.created_at = new Date().toISOString();
        return next;
      };

      if (table === 'messages') {
        return Array.isArray(payload)
          ? payload.map(ensureMessagesFields)
          : ensureMessagesFields(payload);
      }

      // Stories need client-side UUIDs on DO.
      const ensureStoriesFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.created_at == null) next.created_at = new Date().toISOString();
        if (next.expires_at == null) {
          const expires = new Date();
          expires.setHours(expires.getHours() + 24);
          next.expires_at = expires.toISOString();
        }
        return next;
      };

      if (table === 'stories') {
        return Array.isArray(payload)
          ? payload.map(ensureStoriesFields)
          : ensureStoriesFields(payload);
      }

      // Story views need client-side UUIDs on DO.
      const ensureStoryViewsFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.viewed_at == null) next.viewed_at = new Date().toISOString();
        return next;
      };

      if (table === 'story_views') {
        return Array.isArray(payload)
          ? payload.map(ensureStoryViewsFields)
          : ensureStoryViewsFields(payload);
      }

      // Story reactions need client-side UUIDs on DO.
      const ensureStoryReactionsFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.created_at == null) next.created_at = new Date().toISOString();
        return next;
      };

      if (table === 'story_reactions') {
        return Array.isArray(payload)
          ? payload.map(ensureStoryReactionsFields)
          : ensureStoryReactionsFields(payload);
      }

      // Story replies need client-side UUIDs on DO.
      const ensureStoryRepliesFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.created_at == null) next.created_at = new Date().toISOString();
        return next;
      };

      if (table === 'story_replies') {
        return Array.isArray(payload)
          ? payload.map(ensureStoryRepliesFields)
          : ensureStoryRepliesFields(payload);
      }

      // Story highlights need client-side UUIDs on DO.
      const ensureStoryHighlightsFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.created_at == null) next.created_at = new Date().toISOString();
        if (next.updated_at == null) next.updated_at = new Date().toISOString();
        return next;
      };

      if (table === 'story_highlights') {
        return Array.isArray(payload)
          ? payload.map(ensureStoryHighlightsFields)
          : ensureStoryHighlightsFields(payload);
      }

      // Story highlight items need client-side UUIDs on DO.
      const ensureStoryHighlightItemsFields = (row: any) => {
        if (!row || typeof row !== 'object') return row;
        const next = { ...row };
        if (next.id == null) next.id = crypto.randomUUID();
        if (next.added_at == null) next.added_at = new Date().toISOString();
        return next;
      };

      if (table === 'story_highlight_items') {
        return Array.isArray(payload)
          ? payload.map(ensureStoryHighlightItemsFields)
          : ensureStoryHighlightItemsFields(payload);
      }

      return payload;
    };

    const builder = {
      select: async (columns: string = '*') => {
        options.columns = columns;
        return doQuery({ action: 'select', table, filters, options });
      },

      insert: async (data: any) => {
        return doQuery({ action: 'insert', table, data: normalizeInsertData(data) });
      },

      update: (data: any, _extraOptions?: any) => {
        const updateFilters = { ...filters };
        const updateBuilder = {
          eq: (column: string, value: any) => {
            updateFilters[column] = { eq: value };
            return updateBuilder;
          },
          in: (column: string, values: any[]) => {
            updateFilters[column] = { in: values };
            return updateBuilder;
          },
          then: async (resolve: (value: any) => void, reject?: (error: any) => void) => {
            try {
              const result = await doQuery({ action: 'update', table, data, filters: updateFilters });
              resolve(result);
            } catch (error) {
              if (reject) reject(error);
              else throw error;
            }
          },
        };
        return updateBuilder;
      },

      delete: () => {
        // Return builder that can chain .eq() or execute
        const deleteBuilder = {
          eq: (column: string, value: any) => {
            filters[column] = { eq: value };
            return deleteBuilder;
          },
          in: (column: string, values: any[]) => {
            filters[column] = { in: values };
            return deleteBuilder;
          },
          then: async (resolve: (value: any) => void, reject?: (error: any) => void) => {
            try {
              const result = await doQuery({ action: 'delete', table, filters });
              resolve(result);
            } catch (error) {
              if (reject) reject(error);
              else throw error;
            }
          },
        };
        return deleteBuilder;
      },

      eq: (column: string, value: any) => {
        filters[column] = { eq: value };
        return builder;
      },

      neq: (column: string, value: any) => {
        filters[column] = { neq: value };
        return builder;
      },

      gt: (column: string, value: any) => {
        filters[column] = { gt: value };
        return builder;
      },

      gte: (column: string, value: any) => {
        filters[column] = { gte: value };
        return builder;
      },

      lt: (column: string, value: any) => {
        filters[column] = { lt: value };
        return builder;
      },

      lte: (column: string, value: any) => {
        filters[column] = { lte: value };
        return builder;
      },

      like: (column: string, pattern: string) => {
        filters[column] = { like: pattern };
        return builder;
      },

      ilike: (column: string, pattern: string) => {
        filters[column] = { ilike: pattern };
        return builder;
      },

      in: (column: string, values: any[]) => {
        filters[column] = { in: values };
        return builder;
      },

      is: (column: string, value: null | boolean) => {
        filters[column] = { is: value };
        return builder;
      },

      not: (column: string, operator: string, value: any) => {
        if (operator === 'is' && value === null) {
          filters[column] = { not: null };
        }
        return builder;
      },

      order: (column: string, opts?: { ascending?: boolean }) => {
        if (!options.order) options.order = [];
        options.order.push({ column, ascending: opts?.ascending ?? true });
        return builder;
      },

      limit: (count: number) => {
        options.limit = count;
        return builder;
      },

      range: (from: number, to: number) => {
        options.offset = from;
        options.limit = to - from + 1;
        return builder;
      },

      single: async () => {
        options.limit = 1;
        const result = await doQuery({ action: 'select', table, filters, options });
        return result?.[0] || null;
      },

      maybeSingle: async () => {
        options.limit = 1;
        const result = await doQuery({ action: 'select', table, filters, options });
        return result?.[0] || null;
      },
      
      or: (orFilter: string) => {
        filters['_or'] = orFilter;
        return builder;
      },

      // Make the builder thenable so it can be awaited directly
      then: async (resolve: (value: any) => void, reject?: (error: any) => void) => {
        try {
          const result = await doQuery({ action: 'select', table, filters, options });
          resolve(result);
        } catch (error) {
          if (reject) reject(error);
          else throw error;
        }
      },
    };

    return builder;
  },

  rpc: async (fnName: string, args?: any) => {
    // For RPC calls, we need to use raw SQL or handle them differently
    console.warn(`RPC call ${fnName} not supported on DigitalOcean client`);
    return { data: null, error: new Error('RPC not supported on DO client') };
  },

  raw: async (query: string) => {
    return doQuery({ action: 'raw', query });
  },
};

// Helper to get the right client for a table
export function getClient(table: string) {
  return isOnDigitalOcean(table) ? doClient : supabase;
}
