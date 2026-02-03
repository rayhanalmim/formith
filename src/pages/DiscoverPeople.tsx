import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useInfiniteSuggestedUsers, SortOption } from '@/hooks/useInfiniteSuggestedUsers';
import { useFollowUser } from '@/hooks/useSuggestedUsers';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/seo/SEOHead';
import { UserSearchBar } from '@/components/discover/UserSearchBar';
import { UserCard } from '@/components/discover/UserCard';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  BadgeCheck,
  Loader2,
} from 'lucide-react';

export default function DiscoverPeople() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const followUser = useFollowUser();
  
  const [sortBy, setSortBy] = useState<SortOption>('most_followed');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteSuggestedUsers(sortBy, verifiedOnly, searchQuery);
  
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  
  const handleFollow = useCallback((userId: string) => {
    if (!user) {
      toast({
        title: language === 'ar' ? 'يجب تسجيل الدخول' : 'Login required',
        variant: 'destructive',
      });
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
  }, [user, toast, language, followingStates, followUser]);
  
  const allUsers = data?.pages.flatMap(page => page.users) || [];
  
  const filters: { key: SortOption; icon: React.ElementType; label: string; labelAr: string }[] = [
    { key: 'most_followed', icon: TrendingUp, label: 'Most Followed', labelAr: 'الأكثر متابعة' },
    { key: 'recently_joined', icon: Clock, label: 'Recently Joined', labelAr: 'انضموا مؤخراً' },
    { key: 'verified', icon: BadgeCheck, label: 'Verified Only', labelAr: 'الموثقين فقط' },
  ];

  return (
    <MainLayout>
      <SEOHead 
        title={language === 'ar' ? 'اكتشف الأشخاص' : 'Discover People'}
        description={language === 'ar' ? 'اكتشف وتابع أشخاص جدد' : 'Discover and follow new people'}
      />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-full bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {language === 'ar' ? 'اكتشف الأشخاص' : 'Discover People'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {language === 'ar' ? 'ابحث عن أشخاص جدد لمتابعتهم' : 'Find new people to follow'}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <UserSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={language === 'ar' ? 'ابحث بالاسم أو اسم المستخدم...' : 'Search by name or username...'}
          />
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((filter) => (
            <Button
              key={filter.key}
              variant={sortBy === filter.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSortBy(filter.key);
                if (filter.key === 'verified') {
                  setVerifiedOnly(true);
                } else {
                  setVerifiedOnly(false);
                }
              }}
              className="gap-2"
            >
              <filter.icon className="h-4 w-4" />
              {language === 'ar' ? filter.labelAr : filter.label}
            </Button>
          ))}
        </div>
        
        {/* Users Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="glass-card p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {language === 'ar' ? 'حدث خطأ أثناء تحميل البيانات' : 'Error loading data'}
            </p>
          </div>
        ) : allUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery 
                ? (language === 'ar' ? 'لا توجد نتائج للبحث' : 'No search results found')
                : (language === 'ar' ? 'لا توجد اقتراحات حالياً' : 'No suggestions available')
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allUsers.map((suggestedUser) => (
              <UserCard
                key={suggestedUser.user_id}
                user={suggestedUser}
                isFollowing={followingStates[suggestedUser.user_id] || false}
                onFollow={handleFollow}
                isFollowPending={followUser.isPending}
              />
            ))}
          </div>
        )}
        
        {/* Load More Trigger */}
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {isFetchingNextPage && (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          )}
          {!hasNextPage && allUsers.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'لا يوجد المزيد' : 'No more users'}
            </p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
