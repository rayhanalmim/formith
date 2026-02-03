import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBookmarkedPosts } from '@/hooks/useBookmarks';
import { MainLayout } from '@/components/layout/MainLayout';
import { PostCard } from '@/components/feed/PostCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bookmark, LogIn, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export default function Bookmarks() {
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: posts, isLoading } = useBookmarkedPosts();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="glass-card p-8 text-center">
          <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold mb-2">
            {language === 'ar' ? 'يجب تسجيل الدخول' : 'Login Required'}
          </h1>
          <p className="text-muted-foreground mb-4">
            {language === 'ar' 
              ? 'سجل دخولك لعرض المنشورات المحفوظة'
              : 'Login to view your bookmarked posts'}
          </p>
          <Button onClick={() => navigate('/auth')}>
            <LogIn className="h-4 w-4 me-2" />
            {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="glass-card p-6 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center">
            <Bookmark className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              {language === 'ar' ? 'المحفوظات' : 'Bookmarks'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' 
                ? `${posts?.length || 0} منشور محفوظ`
                : `${posts?.length || 0} saved posts`}
            </p>
          </div>
        </div>
      </div>

      {/* Posts */}
      {isLoading ? (
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
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">
            {language === 'ar' ? 'لا توجد منشورات محفوظة' : 'No bookmarked posts'}
          </h2>
          <p className="text-muted-foreground">
            {language === 'ar' 
              ? 'احفظ المنشورات التي تريد العودة إليها لاحقاً'
              : 'Save posts you want to come back to later'}
          </p>
        </div>
      )}
    </MainLayout>
  );
}
