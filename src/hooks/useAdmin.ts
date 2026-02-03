import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// Check if current user is admin (uses Node.js API)
export function useIsAdmin() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const response = await api.isAdminOrManager(user.id);
      
      if (!response.success) {
        console.error('Admin check error:', response.error);
        return false;
      }
      return response.data as boolean;
    },
    enabled: !!user,
  });
}

// Check if current user is admin, manager, or moderator (can moderate content)
export function useCanModerate() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['can-moderate', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const response = await api.canModerate(user.id);
      
      if (!response.success) {
        console.error('Moderate check error:', response.error);
        return false;
      }
      return response.data as boolean;
    },
    enabled: !!user,
  });
}

// Get all users with profiles
export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await api.getAdminUsers();
      return response.data || [];
    },
  });
}

// Get all posts for moderation with pagination
export function useAdminPosts(page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ['admin-posts', page, pageSize],
    queryFn: async () => {
      const response = await api.getAdminPostsPaginated(page, pageSize);
      return response.data || {
        posts: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: page,
        pageSize,
      };
    },
  });
}

// Get pending posts that need approval
export function usePendingPosts() {
  return useQuery({
    queryKey: ['pending-posts'],
    queryFn: async () => {
      const response = await api.getPendingPosts();
      return response.data || [];
    },
  });
}

// Get count of pending posts for badge
export function usePendingPostsCount() {
  return useQuery({
    queryKey: ['pending-posts-count'],
    queryFn: async () => {
      const response = await api.getPendingPostsCount();
      return response.data?.count || 0;
    },
  });
}

export function usePendingReportsCount() {
  return useQuery({
    queryKey: ['pending-reports-count'],
    queryFn: async () => {
      const response = await api.getPendingReportsCount();
      return response.data?.count || 0;
    },
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const response = await api.getAdminCategories();
      return response.data || [];
    },
  });
}

// Get all reports
export function useAdminReports() {
  return useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const response = await api.getAdminReports();
      return response.data || [];
    },
  });
}

// Update user role
export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'manager' | 'moderator' | 'user' }) => {
      const response = await api.updateUserRole(userId, role);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update user role');
      }
      
      return { userId, role };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
    },
  });
}

// Ban/Unban user
export function useToggleUserBan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, isBanned, banReason }: { 
      userId: string; 
      isBanned: boolean; 
      banReason?: string;
    }) => {
      const response = await api.toggleUserBan(userId, isBanned, banReason);
      if (!response.success) {
        throw new Error('Failed to toggle user ban');
      }
      return { userId, isBanned };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

// Delete user (admin only)
export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.adminDeleteUser(userId);
      if (!response.success) {
        throw new Error('Failed to delete user');
      }
      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
    },
  });
}

// Update user username (admin only)
export function useUpdateUserUsername() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, username }: { userId: string; username: string }) => {
      const response = await api.adminUpdateUsername(userId, username);
      if (!response.success) {
        throw new Error('Failed to update username');
      }
      return { userId, username };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// Approve/Hide post
export function useModeratePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, action }: { postId: string; action: 'approve' | 'hide' | 'pin' | 'unpin' | 'lock' | 'unlock' }) => {
      const response = await api.moderatePost(postId, action);
      if (!response.success) {
        throw new Error('Failed to moderate post');
      }
      return { postId, action };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['pending-posts'] });
      queryClient.invalidateQueries({ queryKey: ['pending-posts-count'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// Delete post
export function useDeletePost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await api.adminDeletePostById(postId);
      if (!response.success) {
        throw new Error('Failed to delete post');
      }
      return postId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['pending-posts'] });
      queryClient.invalidateQueries({ queryKey: ['pending-posts-count'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// Bulk delete posts
export function useBulkDeletePosts() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (postIds: string[]) => {
      const response = await api.bulkDeletePosts(postIds);
      if (!response.success) {
        throw new Error('Failed to bulk delete posts');
      }
      return postIds;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['pending-posts'] });
      queryClient.invalidateQueries({ queryKey: ['pending-posts-count'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['infinite-posts'] });
    },
  });
}

// Bulk moderate posts (approve, hide, pin)
export function useBulkModeratePosts() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postIds, action }: { postIds: string[]; action: 'approve' | 'hide' | 'pin' | 'unpin' }) => {
      const response = await api.bulkModeratePosts(postIds, action);
      if (!response.success) {
        throw new Error('Failed to bulk moderate posts');
      }
      return { postIds, action };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['pending-posts'] });
      queryClient.invalidateQueries({ queryKey: ['pending-posts-count'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['infinite-posts'] });
    },
  });
}

// Create category
export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (category: {
      name_en: string;
      name_ar: string;
      description_en?: string;
      description_ar?: string;
      slug: string;
      is_active?: boolean;
      allow_posting?: boolean;
      allow_comments?: boolean;
      require_approval?: boolean;
      sort_order?: number;
    }) => {
      const response = await api.createCategory(category);
      if (!response.success || !response.data) {
        throw new Error('Failed to create category');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// Update category
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<{
      name_en: string;
      name_ar: string;
      description_en: string;
      description_ar: string;
      slug: string;
      is_active: boolean;
      allow_posting: boolean;
      allow_comments: boolean;
      require_approval: boolean;
      sort_order: number;
    }>) => {
      const response = await api.updateCategory(id, updates);
      if (!response.success || !response.data) {
        throw new Error('Failed to update category');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// Delete category
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (categoryId: string) => {
      await api.deleteCategory(categoryId);
      return categoryId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// Reorder categories
export function useReorderCategories() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderedCategories: { id: string; sort_order: number }[]) => {
      await api.updateCategorySortOrder(orderedCategories);
      return orderedCategories;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// Resolve report
export function useResolveReport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ reportId, status, notes }: { reportId: string; status: 'resolved' | 'dismissed'; notes?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');
      const response = await api.resolveReport(reportId, status, user.id, notes);
      if (!response.success) {
        throw new Error('Failed to resolve report');
      }
      return { reportId, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['pending-reports-count'] });
    },
  });
}
