import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { SEOHead } from '@/components/seo/SEOHead';
import { PostCard } from '@/components/feed/PostCard';
import { useInfiniteHashtagPosts } from '@/hooks/useInfiniteHashtagPosts';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { ArrowLeft, Hash, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HashtagSearch() {
  const { tag } = useParams<{ tag: string }>();
  const { language } = useLanguage();
  
  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteHashtagPosts(tag);

  // Flatten all pages into a single posts array
  const posts = data?.pages.flatMap(page => page.posts) || [];
  const totalCount = posts.length;

  // Infinite scroll trigger
  const { ref: loadMoreRef, isIntersecting } = useIntersectionObserver({
    enabled: hasNextPage && !isFetchingNextPage,
  });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      <SEOHead
        title={`${tag} - Tahweel`}
        description={`Posts tagged with ${tag}`}
      />
      <MainLayout>
        <div className="space-y-4">
          {/* Header */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Hash className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">{tag.replace(/^#+/, '')}</h1>
                  <p className="text-sm text-muted-foreground">
                    {totalCount}+ {language === 'ar' ? 'منشور' : 'posts'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Posts */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              
              {/* Infinite scroll trigger */}
              <div ref={loadMoreRef} className="py-4">
                {isFetchingNextPage && (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 text-center">
              <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-1">
                {language === 'ar' ? 'لا توجد منشورات' : 'No posts found'}
              </h2>
              <p className="text-muted-foreground">
                {language === 'ar'
                  ? `لا توجد منشورات تحتوي على ${tag}`
                  : `No posts containing ${tag} yet`}
              </p>
            </div>
          )}
        </div>
      </MainLayout>
    </>
  );
}
