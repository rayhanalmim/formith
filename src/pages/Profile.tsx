/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useProfile, 
  useUserPosts, 
  useUserLikes,
  useFollowers, 
  useFollowing, 
  useIsFollowing, 
  useToggleFollow 
} from '@/hooks/useProfile';
import { useProfileVisibility, useCanMessageUser, useRealtimePrivacySettings } from '@/hooks/useSettings';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostCard } from '@/components/feed/PostCard';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import { ProfileInfoSection } from '@/components/profile/ProfileInfoSection';
import { FollowersDialog } from '@/components/profile/FollowersDialog';
import { SendMessageDialog } from '@/components/messages/SendMessageDialog';
import { StoryHighlights } from '@/components/stories/StoryHighlights';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BadgeCheck, 
  Calendar, 
  Settings,
  UserPlus,
  UserMinus,
  Grid3X3,
  Heart,
  MessageCircle,
  MapPin,
  Cake,
  User,
  Users,
  Home,
  Lock
} from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getAvatarUrl, getCoverUrl } from '@/lib/default-images';
import { useToast } from '@/hooks/use-toast';
import { LazyAvatar } from '@/components/ui/lazy-image';

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [followersDialogTab, setFollowersDialogTab] = useState<'followers' | 'following'>('followers');
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  
  const { data: profile, isLoading: profileLoading } = useProfile(username || '');
  const { data: posts, isLoading: postsLoading } = useUserPosts(profile?.user_id || '');
  const { data: followers } = useFollowers(profile?.user_id || '');
  const { data: following } = useFollowing(profile?.user_id || '');
  const { data: isFollowing } = useIsFollowing(profile?.user_id || '');
  const { data: profileSettings } = useProfileVisibility(profile?.user_id || '');
  const toggleFollow = useToggleFollow();
  
  const isOwnProfile = user?.id === profile?.user_id;
  const { data: canMessageData } = useCanMessageUser(profile?.user_id || '');
  const canMessage = canMessageData?.canMessage ?? true;
  
  // Listen for realtime privacy setting changes
  useRealtimePrivacySettings();
  
  // Check profile visibility
  const profileVisibility = profileSettings?.profile_visibility || 'public';
  const canViewProfile = isOwnProfile || 
    profileVisibility === 'public' || 
    (profileVisibility === 'followers' && isFollowing);
  
  // Only fetch likes if viewing own profile
  const { data: likedPosts, isLoading: likesLoading } = useUserLikes(
    profile?.user_id || '', 
    isOwnProfile
  );
  
  const displayName = language === 'ar' 
    ? (profile?.display_name_ar || profile?.display_name || profile?.username || 'مستخدم')
    : (profile?.display_name || profile?.username || 'User');
  
  const joinDate = profile?.created_at 
    ? format(new Date(profile.created_at), 'MMMM yyyy', { locale: language === 'ar' ? ar : enUS })
    : '';

  const handleFollow = () => {
    if (!user) {
      toast({
        title: language === 'ar' ? 'يجب تسجيل الدخول' : 'Login required',
        description: language === 'ar' ? 'سجل دخولك للمتابعة' : 'Login to follow users',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }
    
    if (!profile) return;
    
    toggleFollow.mutate({ 
      targetUserId: profile.user_id, 
      isFollowing: isFollowing || false 
    });
  };

  const openFollowersDialog = (tab: 'followers' | 'following') => {
    setFollowersDialogTab(tab);
    setShowFollowersDialog(true);
  };

  const handleMessage = () => {
    if (!user) {
      toast({
        title: language === 'ar' ? 'يجب تسجيل الدخول' : 'Login required',
        description: language === 'ar' ? 'سجل دخولك لإرسال رسالة' : 'Login to send messages',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }
    
    if (!profile) return;
    setShowMessageDialog(true);
  };

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto">
          <div className="glass-card overflow-hidden">
            <Skeleton className="h-32 w-full" />
            <div className="p-4">
              <div className="flex items-end gap-4 -mt-12">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1 space-y-2 pb-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // Require login to view profiles
  if (!user) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto">
          <div className="glass-card p-8 text-center">
            <h1 className="text-xl font-bold mb-2">
              {language === 'ar' ? 'يجب تسجيل الدخول' : 'Login Required'}
            </h1>
            <p className="text-muted-foreground mb-4">
              {language === 'ar' 
                ? 'سجل دخولك لعرض الملفات الشخصية'
                : 'Please login to view user profiles'}
            </p>
            <Button onClick={() => navigate('/auth')}>
              {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (profileLoading) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto">
          <div className="glass-card overflow-hidden">
            <Skeleton className="h-32 w-full" />
            <div className="p-4">
              <div className="flex items-end gap-4 -mt-12">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1 space-y-2 pb-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto">
          <div className="glass-card p-8 text-center">
            <h1 className="text-xl font-bold mb-2">
              {language === 'ar' ? 'المستخدم غير موجود' : 'User not found'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar' 
                ? 'لم نتمكن من العثور على هذا المستخدم'
                : 'We couldn\'t find this user'}
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Profile is private or followers-only and user doesn't have access
  if (!canViewProfile) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto">
          <div className="glass-card overflow-hidden">
            {/* Cover Image */}
            <div 
              className="h-32 md:h-40 relative"
              style={{ 
                backgroundImage: `url(${getCoverUrl(profile.cover_url)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            
            {/* Basic Profile Info */}
            <div className="p-4">
              <div className="flex items-end justify-between -mt-16 md:-mt-20 mb-4 relative z-10">
                <LazyAvatar
                  src={getAvatarUrl(profile.avatar_url)}
                  alt={displayName}
                  className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-background ring-4 ring-background relative z-20"
                />
                
                <Button 
                  variant={isFollowing ? 'outline' : 'default'}
                  size="sm"
                  onClick={handleFollow}
                  disabled={toggleFollow.isPending}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4 me-2" />
                      {language === 'ar' ? 'إلغاء المتابعة' : 'Unfollow'}
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 me-2" />
                      {language === 'ar' ? 'متابعة' : 'Follow'}
                    </>
                  )}
                </Button>
              </div>
              
              {/* Name & Username */}
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{displayName}</h1>
                  {profile.is_verified && (
                    <BadgeCheck className="h-5 w-5 verified-badge" />
                  )}
                </div>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>
            </div>
          </div>
          
          {/* Private Profile Message */}
          <div className="glass-card p-8 text-center mt-4">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <h2 className="text-lg font-bold mb-2">
              {profileVisibility === 'private' 
                ? (language === 'ar' ? 'هذا الحساب خاص' : 'This Account is Private')
                : (language === 'ar' ? 'للمتابعين فقط' : 'Followers Only')}
            </h2>
            <p className="text-muted-foreground mb-4">
              {profileVisibility === 'private'
                ? (language === 'ar' 
                    ? 'هذا المستخدم جعل ملفه الشخصي خاصاً'
                    : 'This user has made their profile private')
                : (language === 'ar' 
                    ? 'تابع هذا الحساب لعرض منشوراته ومعلوماته'
                    : 'Follow this account to see their posts and info')}
            </p>
            {profileVisibility === 'followers' && !isFollowing && (
              <Button onClick={handleFollow} disabled={toggleFollow.isPending}>
                <UserPlus className="h-4 w-4 me-2" />
                {language === 'ar' ? 'متابعة' : 'Follow'}
              </Button>
            )}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Profile Header */}
        <div className="glass-card overflow-hidden">
          {/* Cover Image */}
          <div 
            className="h-32 md:h-40 relative"
            style={{ 
              backgroundImage: `url(${getCoverUrl(profile.cover_url)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          
          {/* Profile Info */}
          <div className="p-4">
            <div className="flex items-end justify-between -mt-16 md:-mt-20 mb-4 relative z-10">
              <LazyAvatar
                src={getAvatarUrl(profile.avatar_url)}
                alt={displayName}
                className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-background ring-4 ring-background relative z-20"
              />
              
              <div className="flex gap-2">
                {isOwnProfile ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowEditDialog(true)}
                  >
                    <Settings className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'تعديل الملف' : 'Edit Profile'}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    {canMessage && (
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={handleMessage}
                      >
                        <MessageCircle className="h-4 w-4 me-2" />
                        {language === 'ar' ? 'رسالة' : 'Message'}
                      </Button>
                    )}
                    <Button 
                      variant={isFollowing ? 'outline' : 'default'}
                      size="sm"
                      onClick={handleFollow}
                      disabled={toggleFollow.isPending}
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="h-4 w-4 me-2" />
                          {language === 'ar' ? 'إلغاء المتابعة' : 'Unfollow'}
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 me-2" />
                          {language === 'ar' ? 'متابعة' : 'Follow'}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Name & Username */}
            <div className="mb-3">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{displayName}</h1>
                {profile.is_verified && (
                  <BadgeCheck className="h-5 w-5 verified-badge" />
                )}
              </div>
              <p className="text-muted-foreground">@{profile.username}</p>
            </div>
            
            {/* Bio */}
            {profile.bio && (
              <p className="text-sm mb-3 whitespace-pre-wrap">{profile.bio}</p>
            )}
            
            {/* Meta Info - Joined Date with privacy control */}
            {((isOwnProfile || (profile.show_joined_date ?? true)) && joinDate) && (
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {language === 'ar' ? 'انضم في ' : 'Joined '}{joinDate}
                  </span>
                </div>
              </div>
            )}

            {/* Additional Profile Info */}
            <div className="mb-4">
              <ProfileInfoSection
                birthday={profile.birthday}
                gender={profile.gender}
                birthplace={profile.birthplace}
                currentLocation={profile.current_location}
                relationshipStatus={profile.relationship_status}
                showBirthday={profile.show_birthday}
                showGender={profile.show_gender}
                showBirthplace={profile.show_birthplace}
                showLocation={profile.show_location}
                showRelationship={profile.show_relationship}
                isOwnProfile={isOwnProfile}
              />
            </div>
            
            {/* Stats */}
            <div className="flex gap-4 text-sm">
              {(isOwnProfile || (profile.show_following_count ?? true)) && (
                <button 
                  onClick={() => openFollowersDialog('following')}
                  className="hover:underline"
                >
                  <span className="font-bold">{profile.following_count || 0}</span>{' '}
                  <span className="text-muted-foreground">
                    {language === 'ar' ? 'متابَع' : 'Following'}
                  </span>
                </button>
              )}
              {(isOwnProfile || (profile.show_followers_count ?? true)) && (
                <button 
                  onClick={() => openFollowersDialog('followers')}
                  className="hover:underline"
                >
                  <span className="font-bold">{profile.followers_count || 0}</span>{' '}
                  <span className="text-muted-foreground">
                    {language === 'ar' ? 'متابِع' : 'Followers'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Story Highlights */}
        <StoryHighlights userId={profile.user_id} isOwnProfile={isOwnProfile} />
        
        {/* Posts Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full glass-card">
            <TabsTrigger value="posts" className="flex-1 gap-2">
              <Grid3X3 className="h-4 w-4" />
              {language === 'ar' ? 'المنشورات' : 'Posts'}
            </TabsTrigger>
            <TabsTrigger value="likes" className="flex-1 gap-2">
              <Heart className="h-4 w-4" />
              {language === 'ar' ? 'الإعجابات' : 'Likes'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="space-y-4 mt-4">
            {postsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="glass-card p-4">
                    <div className="flex gap-3">
                      <Skeleton className="h-11 w-11 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : posts && posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map(post => (
                  <PostCard key={post.id} post={post as any} />
                ))}
              </div>
            ) : (
              <div className="glass-card p-8 text-center">
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'لا توجد منشورات بعد' : 'No posts yet'}
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="likes" className="space-y-4 mt-4">
            {isOwnProfile ? (
              likesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="glass-card p-4">
                      <div className="flex gap-3">
                        <Skeleton className="h-11 w-11 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : likedPosts && likedPosts.length > 0 ? (
                <div className="space-y-4">
                  {likedPosts.map(post => (
                    <PostCard key={post.id} post={post as any} />
                  ))}
                </div>
              ) : (
                <div className="glass-card p-8 text-center">
                  <p className="text-muted-foreground">
                    {language === 'ar' ? 'لم تعجبك أي منشورات بعد' : 'No liked posts yet'}
                  </p>
                </div>
              )
            ) : (
              <div className="glass-card p-8 text-center">
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'الإعجابات خاصة' : 'Likes are private'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Dialogs */}
      <EditProfileDialog 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog}
        profile={profile}
      />
      
      <FollowersDialog
        open={showFollowersDialog}
        onOpenChange={setShowFollowersDialog}
        initialTab={followersDialogTab}
        followers={followers || []}
        following={following || []}
      />
      
      {profile && (
        <SendMessageDialog
          open={showMessageDialog}
          onOpenChange={setShowMessageDialog}
          recipientUserId={profile.user_id}
          recipientUsername={profile.username}
          recipientDisplayName={profile.display_name}
          recipientAvatarUrl={profile.avatar_url}
        />
      )}
    </MainLayout>
  );
}
