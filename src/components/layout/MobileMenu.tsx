import { useLanguage } from '@/contexts/LanguageContext';
import { Link, useParams } from 'react-router-dom';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useCurrentUserProfile } from '@/hooks/useProfile';
import { useSuggestedUsers } from '@/hooks/useSuggestedUsers';
import { useTrendingHashtags } from '@/hooks/useTrendingHashtags';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Hash,
  ChevronDown,
  Loader2,
  Home,
  Bookmark,
  Settings,
  Plus,
  MessageSquare,
  Volume2,
  Users,
  Flame,
  TrendingUp,
  BadgeCheck,
  User,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAvatarUrl } from '@/lib/default-images';
import { useState } from 'react';

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Chat rooms data (same as desktop)
const rooms = [
  { id: '1', name: 'الدردشة العامة', nameEn: 'General Chat', type: 'text' as const, members: 45 },
  { id: '2', name: 'التقنية والبرمجة', nameEn: 'Tech & Dev', type: 'text' as const, members: 23 },
  { id: '3', name: 'الألعاب', nameEn: 'Gaming', type: 'text' as const, members: 67 },
  { id: '4', name: 'صوتي عام', nameEn: 'Voice Chat', type: 'voice' as const, members: 12, isLive: true },
];

export function MobileMenu({ open, onOpenChange }: MobileMenuProps) {
  const { t, language } = useLanguage();
  const { slug } = useParams<{ slug: string }>();
  const { data: categories, isLoading } = useCategories();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { data: profile } = useCurrentUserProfile();
  const { data: suggestedUsers, isLoading: suggestedLoading } = useSuggestedUsers(5);
  const { data: trendingHashtags, isLoading: trendingLoading } = useTrendingHashtags(5);
  
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [roomsOpen, setRoomsOpen] = useState(true);
  const [trendingOpen, setTrendingOpen] = useState(false);

  const handleLinkClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={language === 'ar' ? 'right' : 'left'} className="w-[300px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="text-start flex items-center gap-2">
            {user && profile ? (
              <>
                <img
                  src={getAvatarUrl(profile.avatar_url)}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold truncate">
                      {language === 'ar' 
                        ? (profile.display_name_ar || profile.display_name || profile.username)
                        : (profile.display_name || profile.username)}
                    </span>
                    {profile.is_verified && <BadgeCheck className="h-3.5 w-3.5 verified-badge" />}
                  </div>
                  <span className="text-xs text-muted-foreground">@{profile.username}</span>
                </div>
              </>
            ) : (
              <span>{language === 'ar' ? 'القائمة' : 'Menu'}</span>
            )}
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-4">
            {/* Quick Links */}
            <div className="space-y-1">
              <Link
                to="/"
                onClick={handleLinkClick}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors"
              >
                <Home className="h-4 w-4" />
                {language === 'ar' ? 'الرئيسية' : 'Home'}
              </Link>
              
              {user && (
                <>
                  <Link
                    to={`/profile/${profile?.username}`}
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors"
                  >
                    <User className="h-4 w-4" />
                    {language === 'ar' ? 'الملف الشخصي' : 'Profile'}
                  </Link>
                  <Link
                    to="/bookmarks"
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors"
                  >
                    <Bookmark className="h-4 w-4" />
                    {language === 'ar' ? 'المحفوظات' : 'Bookmarks'}
                  </Link>
                  <Link
                    to="/settings"
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    {language === 'ar' ? 'الإعدادات' : 'Settings'}
                  </Link>
                </>
              )}
            </div>

            <Separator />

            {/* Categories Section */}
            <div>
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
              >
                <span>{t('categories.title')}</span>
                <ChevronDown
                  className={cn(
                    'h-3 w-3 transition-transform duration-200',
                    !categoriesOpen && 'rotate-[-90deg] rtl:rotate-[90deg]'
                  )}
                />
              </button>

              {categoriesOpen && (
                <nav className="mt-1 space-y-0.5">
                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : categories && categories.length > 0 ? (
                    categories.map((category) => {
                      const isActive = slug === category.slug;
                      return (
                        <Link
                          key={category.id}
                          to={`/category/${category.slug}`}
                          onClick={handleLinkClick}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                            'hover:bg-muted',
                            isActive && 'bg-primary/10 text-primary'
                          )}
                        >
                          <div className={cn(
                            'flex items-center justify-center w-6 h-6 rounded transition-colors',
                            isActive ? 'bg-primary/20' : 'bg-muted/50'
                          )}>
                            <Hash className={cn(
                              'h-3.5 w-3.5 transition-colors',
                              isActive ? 'text-primary' : 'text-muted-foreground'
                            )} />
                          </div>
                          <span className="flex-1 truncate">
                            {language === 'ar' ? category.name_ar : category.name_en}
                          </span>
                          <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                            {category.posts_count || 0}
                          </span>
                        </Link>
                      );
                    })
                  ) : null}
                </nav>
              )}
            </div>

            <Separator />

            {/* Chat Rooms Section */}
            <div>
              <button
                onClick={() => setRoomsOpen(!roomsOpen)}
                className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
              >
                <span>{t('rooms.title')}</span>
                <ChevronDown
                  className={cn(
                    'h-3 w-3 transition-transform duration-200',
                    !roomsOpen && 'rotate-[-90deg] rtl:rotate-[90deg]'
                  )}
                />
              </button>

              {roomsOpen && (
                <nav className="mt-1 space-y-0.5">
                  {rooms.map((room) => (
                    <Link
                      key={room.id}
                      to={room.type === 'voice' ? '#' : `/room/${room.id}`}
                      onClick={(e) => {
                        if (room.type === 'voice') {
                          e.preventDefault();
                        } else {
                          handleLinkClick();
                        }
                      }}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                        'hover:bg-muted',
                        room.type === 'voice' && 'opacity-60 cursor-not-allowed'
                      )}
                    >
                      <div className={cn(
                        'flex items-center justify-center w-6 h-6 rounded transition-colors',
                        room.type === 'voice' ? 'bg-muted/30' : 'bg-muted/50'
                      )}>
                        {room.type === 'voice' ? (
                          <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <span className="flex-1 truncate">
                        {language === 'ar' ? room.name : room.nameEn}
                      </span>
                      {room.isLive ? (
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-success/20 text-success">
                          {language === 'ar' ? 'قريباً' : 'Soon'}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {room.members}
                        </div>
                      )}
                    </Link>
                  ))}
                </nav>
              )}
            </div>

            <Separator />

            {/* Trending Section */}
            <div>
              <button
                onClick={() => setTrendingOpen(!trendingOpen)}
                className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Flame className="h-3 w-3 text-primary" />
                  {language === 'ar' ? 'الأكثر رواجاً' : 'Trending'}
                </span>
                <ChevronDown
                  className={cn(
                    'h-3 w-3 transition-transform duration-200',
                    !trendingOpen && 'rotate-[-90deg] rtl:rotate-[90deg]'
                  )}
                />
              </button>

              {trendingOpen && (
                <div className="mt-2 space-y-2">
                  {trendingLoading ? (
                    <>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2">
                          <Skeleton className="h-5 w-5" />
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : trendingHashtags && trendingHashtags.length > 0 ? (
                    trendingHashtags.map((hashtag, index) => (
                      <Link
                        key={hashtag.hashtag}
                        to={`/hashtag/${encodeURIComponent(hashtag.hashtag)}`}
                        onClick={handleLinkClick}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <span className="text-lg font-bold text-muted-foreground w-5">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {hashtag.hashtag}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {hashtag.post_count} {language === 'ar' ? 'منشور' : 'posts'}
                          </p>
                        </div>
                        <TrendingUp className="h-4 w-4 text-success flex-shrink-0" />
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      {language === 'ar' ? 'لا توجد مواضيع رائجة حالياً' : 'No trending topics yet'}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Suggested Users - Only show if there are real users */}
            {suggestedUsers && suggestedUsers.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Users className="h-3 w-3 text-secondary" />
                    {language === 'ar' ? 'اقتراحات للمتابعة' : 'Who to Follow'}
                  </div>
                  <div className="mt-2 space-y-2">
                    {suggestedLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      suggestedUsers.map((suggestedUser) => (
                        <Link
                          key={suggestedUser.user_id}
                          to={`/profile/${suggestedUser.username}`}
                          onClick={handleLinkClick}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <img
                            src={suggestedUser.avatar_url || '/images/default-avatar.png'}
                            alt={suggestedUser.display_name || ''}
                            className="w-8 h-8 rounded-full bg-muted"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium truncate">
                                {language === 'ar' 
                                  ? (suggestedUser.display_name_ar || suggestedUser.display_name || suggestedUser.username)
                                  : (suggestedUser.display_name || suggestedUser.username)}
                              </span>
                              {suggestedUser.is_verified && (
                                <BadgeCheck className="h-3.5 w-3.5 verified-badge flex-shrink-0" />
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">@{suggestedUser.username}</span>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Admin Link - Only show to admins */}
            {user && isAdmin && (
              <div className="pt-2">
                <Link
                  to="/admin"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors text-primary font-medium"
                >
                  <Shield className="h-4 w-4" />
                  {language === 'ar' ? 'لوحة التحكم' : 'Admin Panel'}
                </Link>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* New Post Button - Mobile */}
        {user && (
          <div className="p-4 border-t border-border">
            <Button className="w-full gap-2 neon-glow" onClick={handleLinkClick}>
              <Plus className="h-4 w-4" />
              {t('forum.newPost')}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
