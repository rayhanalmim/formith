import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { doClient } from '@/lib/do-client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BadgeCheck, UserPlus, UserMinus, Loader2, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';

interface UserHoverCardProps {
  username: string;
  children: React.ReactNode;
}

interface ProfileData {
  user_id: string;
  username: string;
  display_name: string | null;
  display_name_ar: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean | null;
  current_location: string | null;
  followers_count: number | null;
  following_count: number | null;
  posts_count: number | null;
}

export function UserHoverCard({ username, children }: UserHoverCardProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch user profile when hovering
  const { data: profile, isLoading } = useQuery({
    queryKey: ['hover-profile', username],
    queryFn: async (): Promise<ProfileData | null> => {
      // Fetch profile from DigitalOcean for consistency
      const profileData = await doClient
        .from('profiles')
        .eq('username', username)
        .maybeSingle();

      if (!profileData) return null;

      // Fetch actual counts from source tables
      const [postsData, followersData, followingData] = await Promise.all([
        doClient.from('posts')
          .eq('user_id', profileData.user_id)
          .eq('is_approved', true)
          .eq('is_hidden', false)
          .select('id'),
        doClient.from('follows')
          .eq('following_id', profileData.user_id)
          .select('id'),
        doClient.from('follows')
          .eq('follower_id', profileData.user_id)
          .select('id'),
      ]);

      return {
        ...profileData,
        posts_count: postsData?.length || 0,
        followers_count: followersData?.length || 0,
        following_count: followingData?.length || 0,
      } as ProfileData;
    },
    enabled: isOpen && !!username,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Check if current user follows this profile
  const { data: isFollowing } = useQuery({
    queryKey: ['is-following', profile?.user_id],
    queryFn: async () => {
      if (!user || !profile?.user_id) return false;
      
      // Follows are stored on DigitalOcean; use doClient to avoid desync.
      const follow = await doClient
        .from('follows')
        .eq('follower_id', user.id)
        .eq('following_id', profile.user_id)
        .maybeSingle();

      return !!follow;
    },
    enabled: isOpen && !!user && !!profile?.user_id && profile.user_id !== user?.id,
  });

  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user || !profile?.user_id) throw new Error('Not authenticated');

      if (isFollowing) {
        await doClient.from('follows')
          .eq('follower_id', user.id)
          .eq('following_id', profile.user_id)
          .delete();
      } else {
        await doClient.from('follows')
          .insert({
            id: crypto.randomUUID(),
            follower_id: user.id,
            following_id: profile.user_id,
            created_at: new Date().toISOString(),
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-following', profile?.user_id] });
      queryClient.invalidateQueries({ queryKey: ['hover-profile', username] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(
        isFollowing
          ? (language === 'ar' ? 'تم إلغاء المتابعة' : 'Unfollowed')
          : (language === 'ar' ? 'تمت المتابعة' : 'Following')
      );
    },
    onError: () => {
      toast.error(language === 'ar' ? 'حدث خطأ' : 'Something went wrong');
    },
  });

  const displayName = language === 'ar'
    ? (profile?.display_name_ar || profile?.display_name || profile?.username)
    : (profile?.display_name || profile?.username);

  const isOwnProfile = user?.id === profile?.user_id;

  return (
    <HoverCard openDelay={300} closeDelay={100} open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-80 p-0 overflow-hidden" 
        side="top" 
        align="start"
        sideOffset={5}
      >
        {isLoading ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : profile ? (
          <div className="relative">
            {/* Header gradient */}
            <div className="h-16 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
            
            {/* Avatar */}
            <div className="absolute top-8 left-4">
              <Avatar className="h-14 w-14 border-4 border-background shadow-lg">
                <AvatarImage src={profile.avatar_url || '/images/default-avatar.png'} />
                <AvatarFallback className="bg-muted text-lg">
                  {displayName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Follow button */}
            {!isOwnProfile && user && (
              <div className="absolute top-2 right-2">
                <Button
                  size="sm"
                  variant={isFollowing ? "outline" : "default"}
                  className="h-7 text-xs rounded-full"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    followMutation.mutate();
                  }}
                  disabled={followMutation.isPending}
                >
                  {followMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserMinus className="h-3 w-3 me-1" />
                      {language === 'ar' ? 'إلغاء' : 'Unfollow'}
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3 w-3 me-1" />
                      {language === 'ar' ? 'متابعة' : 'Follow'}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Content */}
            <div className="px-4 pt-10 pb-4">
              {/* Name and verification */}
              <Link 
                to={`/profile/${profile.username}`}
                className="block hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span className="font-semibold text-sm break-all">{displayName}</span>
                  {profile.is_verified && (
                    <BadgeCheck className="h-4 w-4 verified-badge flex-shrink-0" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground break-all">@{profile.username}</span>
              </Link>

              {/* Bio */}
              {profile.bio && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {profile.bio}
                </p>
              )}

              {/* Location */}
              {profile.current_location && (
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{profile.current_location}</span>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-xs">{profile.posts_count || 0}</span>
                  <span className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'منشور' : 'Posts'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-xs">{profile.followers_count || 0}</span>
                  <span className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'متابع' : 'Followers'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-xs">{profile.following_count || 0}</span>
                  <span className="text-xs text-muted-foreground">
                    {language === 'ar' ? 'يتابع' : 'Following'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {language === 'ar' ? 'المستخدم غير موجود' : 'User not found'}
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
