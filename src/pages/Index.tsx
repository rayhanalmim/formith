import { useState, useEffect, useCallback, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { CreatePostCard } from '@/components/feed/CreatePostCard';
import { FeedTabs } from '@/components/feed/FeedTabs';
import { FeedBanner } from '@/components/feed/FeedBanner';
import { PostCard } from '@/components/feed/PostCard';
import { PostSkeletonList } from '@/components/feed/PostSkeleton';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { PeopleYouMayKnow } from '@/components/feed/PeopleYouMayKnow';
import { StoriesRow } from '@/components/stories/StoriesRow';
import { NewPostsButton } from '@/components/feed/NewPostsButton';
import { useInfinitePosts } from '@/hooks/useInfinitePosts';
import { useRealtimePosts } from '@/hooks/useRealtimePosts';
import { useRealtimePostCounters } from '@/hooks/useRealtimePostCounters';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import tahweelBanner from '@/assets/tahweel-banner.jpg';

type FeedTab = 'latest' | 'trending' | 'following' | 'popular';

const Index = () => {
  const [activeTab, setActiveTab] = useState<FeedTab>('latest');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [newPostIds, setNewPostIds] = useState<Set<string>>(new Set());
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const feedTopRef = useRef<HTMLDivElement>(null);

  // Smooth scroll to top when new content is created
  const scrollToTop = useCallback(() => {
    feedTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Handle new post creation - mark it as new for highlight effect
  const handlePostSuccess = useCallback((postId?: string) => {
    scrollToTop();
    if (postId) {
      setNewPostIds(prev => new Set(prev).add(postId));
      // Remove highlight after animation completes (2.5s)
      setTimeout(() => {
        setNewPostIds(prev => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
      }, 2500);
    }
  }, [scrollToTop]);
  
  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    refetch,
  } = useInfinitePosts({ tab: activeTab, location: locationFilter });

  // Subscribe to realtime post updates
  useRealtimePosts();
  
  // Subscribe to realtime counter updates (likes, comments, shares, views)
  useRealtimePostCounters();

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
    enabled: hasNextPage && !isFetchingNextPage,
  });

  // Fetch next page when load more trigger is visible
  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Flatten all pages into single array
  const posts = data?.pages.flatMap(page => page.posts) ?? [];

  // Create a component for the Tahweel banner to reuse
  const TahweelBanner = () => (
    <a
      href="https://tahweel.io"
      target="_blank"
      rel="noopener noreferrer"
      className="block mb-4 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
    >
      <img
        src={tahweelBanner}
        alt="Download Tahweel App"
        className="w-full h-auto object-cover"
        loading="lazy"
      />
    </a>
  );

  const feedContent = (
    <>
      <div ref={feedTopRef} />
      <FeedBanner />
      <StoriesRow />
      <CreatePostCard onPostSuccess={handlePostSuccess} />
      {user && <PeopleYouMayKnow />}
      <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} locationFilter={locationFilter} onLocationFilterChange={setLocationFilter} />
      
      {isLoading && !data ? (
        <PostSkeletonList count={5} />
      ) : error ? (
        <div className="glass-card p-8 text-center">
          <p className="text-destructive">
            {language === 'ar' ? 'حدث خطأ في تحميل المنشورات' : 'Error loading posts'}
          </p>
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <div key={post.id}>
              <PostCard 
                post={post} 
                onRepostSuccess={scrollToTop} 
                isNew={newPostIds.has(post.id)}
              />
              {/* Show banner after every 10 posts */}
              {(index + 1) % 10 === 0 && index !== posts.length - 1 && (
                <div className="mt-4">
                  <TahweelBanner />
                </div>
              )}
            </div>
          ))}
          
          {/* Load More Trigger */}
          <div ref={loadMoreRef} className="py-4">
            {isFetchingNextPage && (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            {!hasNextPage && posts.length > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {language === 'ar' ? 'لقد وصلت إلى النهاية' : "You've reached the end"}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground">
            {language === 'ar' ? 'لا توجد منشورات بعد. كن أول من ينشر!' : 'No posts yet. Be the first to post!'}
          </p>
        </div>
      )}
    </>
  );

  return (
    <MainLayout>
      <NewPostsButton onRefresh={handleRefresh} scrollToTop={scrollToTop} />
      {isMobile ? (
        <PullToRefresh onRefresh={handleRefresh}>
          {feedContent}
        </PullToRefresh>
      ) : (
        feedContent
      )}
    </MainLayout>
  );
};

export default Index;
