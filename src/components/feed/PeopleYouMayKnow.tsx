import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePeopleYouMayKnow } from '@/hooks/usePeopleYouMayKnow';
import { useFollowUser } from '@/hooks/useSuggestedUsers';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  BadgeCheck, 
  UserPlus, 
  ChevronRight,
  X,
  MapPin,
  Heart,
  TrendingUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function PeopleYouMayKnow() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const followUser = useFollowUser();
  
  const { data: suggestions, isLoading } = usePeopleYouMayKnow(6);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  const [dismissedUsers, setDismissedUsers] = useState<Set<string>>(new Set());

  const handleFollow = useCallback((userId: string) => {
    if (!user) {
      toast({
        title: language === 'ar' ? 'يجب تسجيل الدخول' : 'Login required',
        variant: 'destructive',
      });
      return;
    }
    
    const isCurrentlyFollowing = followingStates[userId] || false;
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

  const handleDismiss = useCallback((userId: string) => {
    setDismissedUsers(prev => new Set([...prev, userId]));
  }, []);

  if (!user) return null;

  const visibleSuggestions = suggestions?.filter(s => !dismissedUsers.has(s.user_id)) || [];

  if (isLoading) {
    return (
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-32 bg-muted/30 rounded-lg p-3">
              <div className="flex flex-col items-center text-center">
                <Skeleton className="w-14 h-14 rounded-full mb-2" />
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!visibleSuggestions || visibleSuggestions.length === 0) return null;

  return (
    <div className="glass-card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">
            {language === 'ar' ? 'أشخاص قد تعرفهم' : 'People you may know'}
          </h3>
        </div>
        <Link 
          to="/discover" 
          className="text-xs text-primary hover:underline flex items-center gap-0.5"
        >
          {language === 'ar' ? 'عرض الكل' : 'See all'}
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {visibleSuggestions.slice(0, 8).map((person) => {
          const displayName = language === 'ar'
            ? person.display_name_ar || person.display_name || person.username
            : person.display_name || person.username;
          const isFollowing = followingStates[person.user_id] || false;

          return (
            <div 
              key={person.user_id} 
              className="relative flex-shrink-0 w-32 bg-muted/30 hover:bg-muted/50 rounded-lg p-3 transition-colors group"
            >
              {/* Dismiss button */}
              <button
                onClick={() => handleDismiss(person.user_id)}
                className="absolute top-1 end-1 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-muted transition-all z-10"
                aria-label="Dismiss"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>

              <div className="flex flex-col items-center text-center">
                <Link to={`/profile/${person.username}`}>
                  <img
                    src={person.avatar_url || '/images/default-avatar.png'}
                    alt={displayName || ''}
                    className="w-14 h-14 rounded-full bg-muted hover:ring-2 hover:ring-primary transition-all object-cover mb-2"
                  />
                </Link>
                
                <Link 
                  to={`/profile/${person.username}`}
                  className="flex items-center justify-center gap-1 hover:text-primary transition-colors w-full"
                >
                  <span className="font-medium text-xs whitespace-nowrap">
                    {displayName}
                  </span>
                  {person.is_verified && (
                    <BadgeCheck className="h-3.5 w-3.5 verified-badge flex-shrink-0" />
                  )}
                </Link>

                {/* Recommendation reason badge */}
                {person.recommendation_reason && (
                  <div className="mt-1">
                    {person.recommendation_reason === 'mutual' && person.mutual_count > 0 ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-help">
                              <div className="flex -space-x-1">
                                {person.mutual_samples.slice(0, 2).map((mutual) => (
                                  <img
                                    key={mutual.user_id}
                                    src={mutual.avatar_url || '/images/default-avatar.png'}
                                    alt=""
                                    className="w-4 h-4 rounded-full border border-background object-cover"
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {person.mutual_count === 1
                                  ? (language === 'ar' ? 'متابع مشترك' : '1 mutual')
                                  : (language === 'ar' 
                                      ? `${person.mutual_count} مشتركين` 
                                      : `${person.mutual_count} mutual`)
                                }
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-[180px]">
                            <p className="text-xs">
                              {language === 'ar'
                                ? `يتابعه ${person.mutual_samples.map(m => m.display_name || m.username).join('، ')}`
                                : `Followed by ${person.mutual_samples.map(m => m.display_name || m.username).join(', ')}`
                              }
                              {person.mutual_count > person.mutual_samples.length && 
                                (language === 'ar' 
                                  ? ` و ${person.mutual_count - person.mutual_samples.length} آخرين`
                                  : ` and ${person.mutual_count - person.mutual_samples.length} more`)
                              }
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : person.recommendation_reason === 'location' ? (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 gap-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
                        <MapPin className="h-2.5 w-2.5" />
                        {language === 'ar' ? 'نفس البلد' : 'Same country'}
                      </Badge>
                    ) : person.recommendation_reason === 'tahweel_support' ? (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 gap-0.5 bg-primary/10 text-primary border-0">
                        <Heart className="h-2.5 w-2.5" />
                        {language === 'ar' ? 'مجتمع تحويل' : 'Tahweel community'}
                      </Badge>
                    ) : person.recommendation_reason === 'popular' ? (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 gap-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0">
                        <TrendingUp className="h-2.5 w-2.5" />
                        {language === 'ar' ? 'شائع' : 'Popular'}
                      </Badge>
                    ) : null}
                  </div>
                )}

                <Button 
                  size="sm" 
                  variant={isFollowing ? 'outline' : 'default'}
                  className="w-full mt-2 h-7 text-xs gap-1"
                  onClick={() => handleFollow(person.user_id)}
                  disabled={followUser.isPending}
                >
                  <UserPlus className="h-3 w-3" />
                  {isFollowing 
                    ? (language === 'ar' ? 'متابَع' : 'Following') 
                    : (language === 'ar' ? 'متابعة' : 'Follow')
                  }
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
