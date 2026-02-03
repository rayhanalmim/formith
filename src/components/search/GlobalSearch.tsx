import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSearch } from '@/hooks/useSearch';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Folder, BadgeCheck, Loader2, Hash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { getAvatarUrl } from '@/lib/default-images';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { data: results, isLoading } = useSearch(query);

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  const handleSelect = useCallback((type: string, value: string) => {
    onOpenChange(false);
    setQuery('');
    
    switch (type) {
      case 'post':
        navigate(value);
        break;
      case 'user':
        navigate(`/profile/${value}`);
        break;
      case 'category':
        navigate(`/category/${value}`);
        break;
      case 'hashtag':
        navigate(`/hashtag/${value}`);
        break;
    }
  }, [navigate, onOpenChange]);

  const truncateContent = (content: string, maxLength = 80) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: language === 'ar' ? ar : enUS,
    });
  };

  const hasResults = results && (
    results.posts.length > 0 ||
    results.users.length > 0 ||
    results.categories.length > 0 ||
    results.hashtags.length > 0
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder={language === 'ar' ? 'ابحث عن منشورات، مستخدمين، أقسام، هاشتاقات...' : 'Search posts, users, categories, hashtags...'}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && query.length >= 1 && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && query.length >= 1 && !hasResults && (
          <CommandEmpty>
            {language === 'ar' ? 'لا توجد نتائج' : 'No results found.'}
          </CommandEmpty>
        )}

        {query.length < 1 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {language === 'ar' ? 'ابدأ بالكتابة للبحث' : 'Start typing to search'}
          </div>
        )}

        {/* Hashtags Results */}
        {results && results.hashtags.length > 0 && (
          <>
            <CommandGroup heading={language === 'ar' ? 'الهاشتاقات' : 'Hashtags'}>
              {results.hashtags.map((hashtag) => (
                <CommandItem
                  key={hashtag.hashtag}
                  value={`hashtag-${hashtag.hashtag}`}
                  onSelect={() => handleSelect('hashtag', hashtag.hashtag)}
                  className="flex items-center gap-3 p-3 cursor-pointer"
                >
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Hash className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">#{hashtag.hashtag}</p>
                    <span className="text-xs text-muted-foreground">
                      {hashtag.post_count} {language === 'ar' ? 'منشور' : 'posts'}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Users Results */}
        {results && results.users.length > 0 && (
          <>
            <CommandGroup heading={language === 'ar' ? 'المستخدمون' : 'Users'}>
              {results.users.map((user) => (
                <CommandItem
                  key={user.user_id}
                  value={`user-${user.user_id}`}
                  onSelect={() => handleSelect('user', user.username || user.user_id)}
                  className="flex items-center gap-3 p-3 cursor-pointer"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={getAvatarUrl(user.avatar_url)}
                      alt={user.display_name || user.username || ''}
                    />
                    <AvatarFallback>
                      <Users className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">
                        {language === 'ar' 
                          ? (user.display_name_ar || user.display_name || user.username)
                          : (user.display_name || user.username)}
                      </span>
                      {user.is_verified && (
                        <BadgeCheck className="h-3.5 w-3.5 verified-badge" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">@{user.username}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Categories Results */}
        {results && results.categories.length > 0 && (
          <>
            <CommandGroup heading={language === 'ar' ? 'الأقسام' : 'Categories'}>
              {results.categories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={`category-${category.id}`}
                  onSelect={() => handleSelect('category', category.slug)}
                  className="flex items-center gap-3 p-3 cursor-pointer"
                >
                  <div className="flex-shrink-0">
                    <Folder className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {language === 'ar' ? category.name_ar : category.name_en}
                    </p>
                    {(category.description_en || category.description_ar) && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {language === 'ar' ? category.description_ar : category.description_en}
                      </p>
                    )}
                  </div>
                  {category.posts_count !== null && category.posts_count > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {category.posts_count} {language === 'ar' ? 'منشور' : 'posts'}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Posts Results */}
        {results && results.posts.length > 0 && (
          <CommandGroup heading={language === 'ar' ? 'المنشورات' : 'Posts'}>
            {results.posts.map((post) => {
              const postUrl = post.categories?.slug
                ? `/category/${post.categories.slug}/post/${post.slug}`
                : `/post/${post.slug}`;
              
              return (
                <CommandItem
                  key={post.id}
                  value={`post-${post.id}`}
                  onSelect={() => handleSelect('post', postUrl)}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">{truncateContent(post.content)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {post.profiles.display_name || post.profiles.username}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(post.created_at)}
                      </span>
                      {post.categories && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <Badge variant="secondary" className="text-xs py-0">
                            {language === 'ar' ? post.categories.name_ar : post.categories.name_en}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
