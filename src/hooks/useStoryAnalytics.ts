import { useQuery } from '@tanstack/react-query';
import { api, StoryAnalyticsData, UserStoriesAnalytics } from '@/lib/api';

export type { StoryAnalyticsData, UserStoriesAnalytics };

export interface ViewTrend {
  date: string;
  views: number;
}

// Fetch analytics for a specific story
export function useStoryAnalytics(storyId: string | undefined) {
  return useQuery({
    queryKey: ['story-analytics', storyId],
    queryFn: async (): Promise<StoryAnalyticsData> => {
      if (!storyId) {
        return {
          totalViews: 0,
          uniqueViewers: 0,
          viewTrends: [],
          viewers: [],
          peakHour: null,
        };
      }
      const response = await api.getStoryAnalytics(storyId);
      return response.data || {
        totalViews: 0,
        uniqueViewers: 0,
        viewTrends: [],
        viewers: [],
        peakHour: null,
      };
    },
    enabled: !!storyId,
    staleTime: 60 * 1000, // 60 seconds - match Redis TTL
  });
}

// Fetch analytics for all user's stories
export function useUserStoriesAnalytics(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-stories-analytics', userId],
    queryFn: async (): Promise<UserStoriesAnalytics | null> => {
      if (!userId) return null;
      const response = await api.getUserStoriesAnalytics(userId);
      return response.data || null;
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // 60 seconds - match Redis TTL
  });
}
