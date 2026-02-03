import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Poll, PollOption } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export type { Poll, PollOption };

// Check if a string is a valid UUID (not a temp ID)
const isValidPostId = (id: string | undefined): boolean => {
  if (!id) return false;
  if (id.startsWith('temp-')) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export function usePoll(postId: string | undefined) {
  const { user } = useAuth();
  const isValidId = isValidPostId(postId);
  
  return useQuery({
    queryKey: ['poll', postId, user?.id],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
    queryFn: async (): Promise<Poll | null> => {
      if (!postId || !isValidId) return null;
      
      const response = await api.getPollByPostId(postId, user?.id);
      return response.data || null;
    },
    enabled: !!postId && isValidId,
  });
}

export function useCreatePoll() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({
      postId,
      question,
      pollType,
      goal,
      endsAt,
      options,
    }: {
      postId: string;
      question: string;
      pollType: 'single' | 'multiple';
      goal?: string;
      endsAt?: string;
      options: { text: string; emoji?: string }[];
    }) => {
      if (!user) throw new Error('Must be logged in');
      
      const response = await api.createPoll({
        postId,
        question,
        pollType,
        goal,
        endsAt,
        options,
      });
      
      if (!response.success || !response.data) {
        throw new Error('Failed to create poll');
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poll'] });
    },
  });
}

export function useVotePoll() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({
      pollId,
      optionId,
      isVoted,
    }: {
      pollId: string;
      optionId: string;
      isVoted: boolean;
    }) => {
      if (!user) throw new Error('Must be logged in to vote');
      
      await api.votePoll(pollId, optionId, user.id, isVoted);
      
      return { optionId, isVoted: !isVoted };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poll'] });
    },
  });
}

export function useVotePollSingle() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({
      pollId,
      optionId,
      previousVotes,
    }: {
      pollId: string;
      optionId: string;
      previousVotes: string[];
    }) => {
      if (!user) throw new Error('Must be logged in to vote');
      
      await api.votePollSingle(pollId, optionId, user.id, previousVotes);
      
      return { optionId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poll'] });
    },
  });
}
