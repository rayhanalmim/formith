import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'admin' | 'manager' | 'moderator' | 'user';

export function useUserRole() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async (): Promise<UserRole | null> => {
      if (!user) return null;
      
      const response = await api.getUserRole(user.id);
      
      if (!response.success) {
        console.error('Error fetching user role:', response.error);
        return 'user';
      }
      
      return (response.data?.role as UserRole) || 'user';
    },
    enabled: !!user,
  });
}

// Fetch role for a specific user by ID
export function useUserRoleById(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-role', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const response = await api.getUserRole(userId);
      
      if (!response.success) {
        console.error('Error fetching user role by ID:', response.error);
        return null;
      }
      
      return response.data?.role as UserRole | null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Bulk fetch roles for multiple users (efficient for chat rooms)
export function useUsersRoles(userIds: string[]) {
  return useQuery({
    queryKey: ['users-roles', userIds.sort().join(',')],
    queryFn: async () => {
      if (!userIds.length) return {};
      
      const response = await api.getUsersRoles(userIds);
      
      if (!response.success) {
        console.error('Error fetching users roles:', response.error);
        return {};
      }
      
      // Create a map of user_id to role
      const rolesMap: Record<string, UserRole> = {};
      const data = response.data || {};
      Object.entries(data).forEach(([userId, role]) => {
        rolesMap[userId] = role as UserRole;
      });
      
      return rolesMap;
    },
    enabled: userIds.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
