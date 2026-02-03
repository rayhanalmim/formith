import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeCheck, TrendingUp, Users, Hash, Loader2, Eye, Flame, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTrendingHashtags } from '@/hooks/useTrendingHashtags';
import { useTrendingPosts } from '@/hooks/useTrendingPosts';
import { useSuggestedUsers, useFollowUser } from '@/hooks/useSuggestedUsers';
import { useOnlinePresence } from '@/hooks/useOnlinePresence';
import { useUserStatus } from '@/hooks/useUserStatus';
import { StatusIndicator } from '@/components/ui/status-selector';
import { useToast } from '@/hooks/use-toast';

export function TrendingSidebar() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { data: trendingHashtags, isLoading: loadingTrending } = useTrendingHashtags(5);
  const { data: trendingPosts, isLoading: loadingTrendingPosts } = useTrendingPosts(5);
  const { data: suggestedUsers, isLoading: loadingSuggested } = useSuggestedUsers(5);
  const { onlineUsers } = useOnlinePresence();
  const followUser = useFollowUser();
  
  // Get user IDs for status lookup
  const onlineUserIds = useMemo(() => onlineUsers.map(u => u.user_id), [onlineUsers]);
  const { getStatus } = useUserStatus(onlineUserIds);
  
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});

  const handleFollow = (userId: string) => {
    if (!user) {
      toast({
        title: language === 'ar' ? 'يجب تسجيل الدخول' : 'Login required',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }
    
    const isCurrentlyFollowing = followingStates[userId] || false;
    
    // Optimistic update
    setFollowingStates(prev => ({ ...prev, [userId]: !isCurrentlyFollowing }));
    
    followUser.mutate(
      { userId, isFollowing: isCurrentlyFollowing },
      {
        onError: () => {
          setFollowingStates(prev => ({ ...prev, [userId]: isCurrentlyFollowing }));
        },
      }
    );
  };

  return (
    <aside className="hidden xl:flex flex-col w-72 h-[calc(100vh-4rem)] fixed top-16 end-0 bg-background border-s border-border overflow-hidden">
      <div className="flex-1 overflow-y-auto discord-scrollbar p-4 space-y-6">
        {/* Trending Hashtags */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">{t('forum.trending')}</h3>
          </div>
          
          {loadingTrending ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {(trendingHashtags || []).map((topic, index) => (
                <Link
                  key={topic.hashtag}
                  to={`/hashtag/${encodeURIComponent(topic.hashtag.slice(1))}`}
                  className="block group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg font-bold text-muted-foreground group-hover:text-primary transition-colors">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {topic.hashtag.replace(/^#+/, '')}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{topic.post_count} {t('profile.posts')}</span>
                        {topic.total_engagement > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-success">+{topic.total_engagement}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <TrendingUp className="h-4 w-4 text-success flex-shrink-0" />
                  </div>
                </Link>
              ))}
              
              {(!trendingHashtags || trendingHashtags.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  {language === 'ar' ? 'لا توجد هاشتاقات رائجة' : 'No trending hashtags'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Trending Posts - Most Viewed in 24h */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="h-5 w-5 text-destructive" />
            <h3 className="font-semibold">
              {language === 'ar' ? 'الأكثر مشاهدة' : 'Hot Posts'}
            </h3>
            <span className="text-xs text-muted-foreground">24h</span>
          </div>
          
          {loadingTrendingPosts ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {(trendingPosts || []).map((post, index) => {
                const displayName = language === 'ar'
                  ? post.profile.display_name_ar || post.profile.display_name || post.profile.username
                  : post.profile.display_name || post.profile.username;
                const contentPreview = post.content.length > 50 
                  ? post.content.substring(0, 50) + '...' 
                  : post.content;
                const hasImage = post.media && post.media.media_type === 'image';
                
                return (
                  <Link
                    key={post.id}
                    to={post.slug ? `/post/${post.slug}` : `/post/${post.id}`}
                    className="block group"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg font-bold text-destructive/70 group-hover:text-destructive transition-colors w-5 flex-shrink-0">
                        {index + 1}
                      </span>
                      
                      {/* Thumbnail */}
                      {hasImage && (
                        <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                          <img
                            src={post.media!.media_url}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {contentPreview}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="truncate max-w-[80px]">@{post.profile.username}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{post.views_count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
              
              {(!trendingPosts || trendingPosts.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  {language === 'ar' ? 'لا توجد منشورات رائجة' : 'No trending posts'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Who to Follow */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-secondary" />
            <h3 className="font-semibold">
              {language === 'ar' ? 'اقتراحات للمتابعة' : 'Who to Follow'}
            </h3>
          </div>
          
          {loadingSuggested ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {(suggestedUsers || []).map((suggestedUser) => {
                const displayName = language === 'ar'
                  ? suggestedUser.display_name_ar || suggestedUser.display_name || suggestedUser.username
                  : suggestedUser.display_name || suggestedUser.username;
                const isFollowing = followingStates[suggestedUser.user_id] || false;
                
                return (
                  <div key={suggestedUser.user_id} className="flex items-center gap-3">
                    <Link to={`/profile/${suggestedUser.username}`}>
                      <img
                        src={suggestedUser.avatar_url || '/images/default-avatar.png'}
                        alt={displayName || ''}
                        className="w-10 h-10 rounded-full bg-muted hover:ring-2 hover:ring-primary transition-all"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <Link 
                          to={`/profile/${suggestedUser.username}`}
                          className="font-medium text-sm truncate hover:text-primary transition-colors"
                        >
                          {displayName}
                        </Link>
                        {suggestedUser.is_verified && (
                          <BadgeCheck className="h-4 w-4 verified-badge flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        @{suggestedUser.username} • {suggestedUser.followers_count || 0} {language === 'ar' ? 'متابع' : 'followers'}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant={isFollowing ? 'outline' : 'default'}
                      className="text-xs h-7"
                      onClick={() => handleFollow(suggestedUser.user_id)}
                      disabled={followUser.isPending}
                    >
                      {isFollowing 
                        ? (language === 'ar' ? 'متابَع' : 'Following') 
                        : t('action.follow')
                      }
                    </Button>
                  </div>
                );
              })}
              
              {(!suggestedUsers || suggestedUsers.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  {language === 'ar' ? 'لا توجد اقتراحات حالياً' : 'No suggestions available'}
                </p>
              )}
            </div>
          )}

          {suggestedUsers && suggestedUsers.length >= 5 && (
            <Button
              asChild
              variant="link"
              className="w-full mt-3 text-primary text-sm gap-1"
            >
              <Link to="/discover">
                {t('common.seeMore')}
                <ChevronDown className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

      </div>

      {/* Footer Links */}
      <div className="p-4 border-t border-border">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <Link to="/about" className="hover:text-primary transition-colors">
            {t('footer.about')}
          </Link>
          <Link to="/terms" className="hover:text-primary transition-colors">
            {t('footer.terms')}
          </Link>
          <Link to="/privacy" className="hover:text-primary transition-colors">
            {t('footer.privacy')}
          </Link>
          <Link to="/contact" className="hover:text-primary transition-colors">
            {t('footer.contact')}
          </Link>
        </div>
        <p className="text-xs text-muted-foreground/60 mt-2">
          © 2026 Tahweel. {t('footer.rights')}
        </p>
      </div>
    </aside>
  );
}
