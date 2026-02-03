import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { CreatePostCard } from '@/components/feed/CreatePostCard';
import { FeedTabs } from '@/components/feed/FeedTabs';
import { PostCard } from '@/components/feed/PostCard';
import { usePosts } from '@/hooks/usePosts';
import { useCategoryBySlug } from '@/hooks/useCategories';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, Hash } from 'lucide-react';

type FeedTab = 'latest' | 'trending' | 'following' | 'popular';

const CategoryPage = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [activeTab, setActiveTab] = useState<FeedTab>('latest');
  const { language } = useLanguage();
  
  const { data: category, isLoading: categoryLoading } = useCategoryBySlug(categorySlug || '');
  const { data: posts, isLoading: postsLoading, error } = usePosts({ 
    categoryId: category?.id,
    tab: activeTab 
  });

  const categoryName = category 
    ? (language === 'ar' ? category.name_ar : category.name_en)
    : '';

  const isLoading = categoryLoading || postsLoading;

  return (
    <MainLayout>
      {/* Category Header */}
      {category && (
        <div className="glass-card p-6 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Hash className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{categoryName}</h1>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? category.description_ar : category.description_en}
              </p>
            </div>
          </div>
        </div>
      )}

      <CreatePostCard />
      <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center">
          <p className="text-destructive">
            {language === 'ar' ? 'حدث خطأ في تحميل المنشورات' : 'Error loading posts'}
          </p>
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground">
            {language === 'ar' 
              ? 'لا توجد منشورات في هذا القسم بعد. كن أول من ينشر!' 
              : 'No posts in this category yet. Be the first to post!'}
          </p>
        </div>
      )}
    </MainLayout>
  );
};

export default CategoryPage;
