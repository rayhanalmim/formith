import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface HashtagResult {
  hashtag: string;
  post_count: number;
}

export interface SearchResults {
  posts: Array<{
    id: string;
    slug: string | null;
    content: string;
    created_at: string;
    profiles: {
      username: string | null;
      display_name: string | null;
      avatar_url: string | null;
    };
    categories: {
      slug: string;
      name_en: string;
      name_ar: string;
    } | null;
  }>;
  users: Array<{
    user_id: string;
    username: string | null;
    display_name: string | null;
    display_name_ar: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
    bio: string | null;
  }>;
  categories: Array<{
    id: string;
    slug: string;
    name_en: string;
    name_ar: string;
    description_en: string | null;
    description_ar: string | null;
    posts_count: number | null;
  }>;
  hashtags: HashtagResult[];
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async (): Promise<SearchResults> => {
      if (!query || query.length < 1) {
        return { posts: [], users: [], categories: [], hashtags: [] };
      }

      const response = await api.searchAll(query);
      return response.data || { posts: [], users: [], categories: [], hashtags: [] };
    },
    enabled: query.length >= 1,
    staleTime: 30000,
  });
}
