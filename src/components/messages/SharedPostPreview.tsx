/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BadgeCheck, ExternalLink, Heart, MessageCircle, Eye, Loader2 } from 'lucide-react';
import { getAvatarUrl } from '@/lib/default-images';
import { cn } from '@/lib/utils';

// Helper function to convert URLs in text to clickable links
function renderContentWithLinks(content: string, isOwn: boolean): JSX.Element {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);
  
  const result: JSX.Element[] = [];
  
  parts.forEach((part, index) => {
    if (urlRegex.test(part)) {
      // It's a URL - make it clickable
      result.push(
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "underline transition-colors",
            isOwn 
              ? "text-primary-foreground hover:text-blue-300" 
              : "text-blue-600 hover:text-blue-700"
          )}
        >
          {part}
        </a>
      );
    } else if (part) {
      // It's regular text
      result.push(<span key={index}>{part}</span>);
    }
  });
  
  return <>{result}</>;
}

interface SharedPostPreviewProps {
  postUrl: string;
  isOwn: boolean;
  onCloseChatSidebar?: () => void;
  onLoad?: () => void;
}

interface PostData {
  id: string;
  content: string;
  slug: string | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  category_id: string | null;
  repost_of_id: string | null;
  profiles: {
    user_id: string;
    username: string | null;
    display_name: string | null;
    display_name_ar: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
  post_media: {
    id: string;
    media_url: string;
    media_type: string;
  }[];
  categories: {
    slug: string;
    name_en: string;
    name_ar: string;
  } | null;
}

// Extract post slug from URL - Enhanced with more patterns
function extractPostSlug(url: string): string | null {
  console.log('extractPostSlug called with URL:', url);
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Match /post/:slug or /category/:categorySlug/post/:slug
    const postMatch = pathname.match(/\/post\/([^/]+)$/);
    if (postMatch) {
      console.log('extractPostSlug: Matched post slug', postMatch[1]);
      return postMatch[1];
    }
    
    // Match /category/:categorySlug/post/:slug
    const categoryPostMatch = pathname.match(/\/category\/[^/]+\/post\/([^/]+)$/);
    if (categoryPostMatch) {
      console.log('extractPostSlug: Matched category post slug', categoryPostMatch[1]);
      return categoryPostMatch[1];
    }
    
    // Also try to match by ID if slug is not found
    const idMatch = pathname.match(/\/post\/([a-f0-9-]{36})$/);
    if (idMatch) {
      console.log('extractPostSlug: Matched post ID', idMatch[1]);
      return idMatch[1];
    }
    
    const categoryIdMatch = pathname.match(/\/category\/[^/]+\/post\/([a-f0-9-]{36})$/);
    if (categoryIdMatch) {
      console.log('extractPostSlug: Matched category post ID', categoryIdMatch[1]);
      return categoryIdMatch[1];
    }
    
    console.log('extractPostSlug: No match found for pathname', pathname);
    return null;
  } catch (e) {
    console.error('extractPostSlug: Error parsing URL', e);
    // Try regex directly for relative URLs
    const match = url.match(/\/post\/([^/\s]+)/);
    if (match) {
      console.log('extractPostSlug: Relative URL post match', match[1]);
      return match[1];
    }
    
    const categoryMatch = url.match(/\/category\/[^/]+\/post\/([^/\s]+)/);
    if (categoryMatch) {
      console.log('extractPostSlug: Relative URL category match', categoryMatch[1]);
      return categoryMatch[1];
    }
    
    // Try ID matching for relative URLs
    const idMatch = url.match(/\/post\/([a-f0-9-]{36})/);
    if (idMatch) {
      console.log('extractPostSlug: Relative URL ID match', idMatch[1]);
      return idMatch[1];
    }
    
    const categoryIdMatch = url.match(/\/category\/[^/]+\/post\/([a-f0-9-]{36})/);
    if (categoryIdMatch) {
      console.log('extractPostSlug: Relative URL category ID match', categoryIdMatch[1]);
      return categoryIdMatch[1];
    }
    
    console.log('extractPostSlug: No relative match found');
    return null;
  }
}

// Extract category from URL
function extractCategory(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Match /category/:categorySlug/post/:slug
    const categoryMatch = pathname.match(/\/category\/([^/]+)\/post\//);
    if (categoryMatch) {
      return categoryMatch[1];
    }
    
    return null;
  } catch {
    // Try regex directly for relative URLs
    const categoryMatch = url.match(/\/category\/([^/]+)\/post\//);
    if (categoryMatch) {
      return categoryMatch[1];
    }
    
    return null;
  }
}

export function SharedPostPreview({ postUrl, isOwn, onCloseChatSidebar, onLoad }: SharedPostPreviewProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const postSlug = extractPostSlug(postUrl);
  
  console.log('SharedPostPreview:', { postUrl, postSlug });

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['shared-post-preview', postSlug],
    queryFn: async (): Promise<PostData | null> => {
      if (!postSlug) {
        console.log('Query: No postSlug provided');
        return null;
      }

      console.log('Query: Fetching post with slug/ID:', postSlug);

      // Try to fetch by slug first using Node.js API
      let response = await api.getPostBySlug(postSlug);
      let postData = response.success ? response.data : null;
      console.log('Query: Slug query result:', postData);

      // If not found by slug, try by ID
      if (!postData) {
        console.log('Query: Trying ID lookup instead');
        response = await api.getPostById(postSlug);
        postData = response.success ? response.data : null;
        console.log('Query: ID query result:', postData);
      }
      
      if (!postData) {
        console.log('Query: No data found for postSlug:', postSlug);
        return null;
      }
      
      console.log('Query: Successfully found post:', postData.id, postData.slug, postData.content?.substring(0, 50));
      
      return {
        id: postData.id,
        content: postData.content,
        slug: postData.slug || null,
        likes_count: postData.likes_count || 0,
        comments_count: postData.comments_count || 0,
        views_count: postData.views_count || 0,
        created_at: postData.created_at,
        category_id: postData.category_id || null,
        repost_of_id: postData.repost_of_id || null,
        profiles: postData.profile ? {
          user_id: postData.profile.user_id,
          username: postData.profile.username,
          display_name: postData.profile.display_name,
          display_name_ar: postData.profile.display_name_ar,
          avatar_url: postData.profile.avatar_url,
          is_verified: postData.profile.is_verified || false,
        } : null as any,
        post_media: postData.media?.map((m: any) => ({
          id: m.id,
          media_url: m.media_url,
          media_type: m.media_type,
        })) || [],
        categories: postData.category ? {
          slug: postData.category.slug,
          name_en: postData.category.name_en,
          name_ar: postData.category.name_ar,
        } : null,
      };
    },
    enabled: !!postSlug,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Trigger onLoad when post data finishes loading
  useEffect(() => {
    if (!isLoading && post && onLoad) {
      // Multiple scroll attempts to ensure it works
      onLoad();
      setTimeout(() => onLoad(), 100);
      setTimeout(() => onLoad(), 300);
      setTimeout(() => onLoad(), 600);
    }
  }, [isLoading, post, onLoad]);

  // Use useLayoutEffect to trigger scroll after DOM updates
  useLayoutEffect(() => {
    if (!isLoading && post && onLoad) {
      // Trigger scroll after layout is calculated
      requestAnimationFrame(() => {
        onLoad();
        setTimeout(() => onLoad(), 200);
      });
    }
  }, [isLoading, post, onLoad]);

  // Trigger onLoad even for error state to ensure auto-scroll
  useEffect(() => {
    if ((error || !post) && onLoad) {
      setTimeout(() => onLoad(), 100);
    }
  }, [error, post, onLoad]);

  if (!postSlug) {
    console.log('SharedPostPreview: No postSlug, returning null');
    return null;
  }

  if (isLoading) {
    console.log('SharedPostPreview: Loading state');
    return (
      <div className={cn(
        "rounded-xl p-4 mt-2 border border-border/40 max-w-full",
        isOwn ? "bg-primary-foreground/10" : "bg-background/50"
      )}>
        <div className="space-y-3">
          {/* Loading skeleton */}
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-full bg-muted/50 animate-pulse flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-muted/50 rounded animate-pulse" />
            <div className="h-3 w-3/4 bg-muted/50 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-muted/50 rounded animate-pulse" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-4 w-8 bg-muted/50 rounded animate-pulse flex-shrink-0" />
              <div className="h-4 w-8 bg-muted/50 rounded animate-pulse flex-shrink-0" />
              <div className="h-4 w-8 bg-muted/50 rounded animate-pulse flex-shrink-0" />
            </div>
            <div className="h-4 w-12 bg-muted/50 rounded animate-pulse flex-shrink-0" />
          </div>
        </div>
      </div>
    );
  }

  const handlePostClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    console.log('SharedPostPreview: Click detected, navigating to:', postUrl);
    
    // Close the chat sidebar first
    if (onCloseChatSidebar) {
      console.log('SharedPostPreview: Closing sidebar');
      onCloseChatSidebar();
    }
    
    // Navigate to the post using window.location for reliability
    console.log('SharedPostPreview: Navigating to:', postUrl);
    window.location.href = postUrl;
  };

  if (error || !post) {
    console.log('SharedPostPreview: Error or no post data', { error, post });
    
    // Extract category from URL for better fallback display
    const categoryName = extractCategory(postUrl);
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('SharedPostPreview Debug:', {
        postUrl,
        postSlug,
        error,
        post,
        isLoading,
        categoryName,
        errorMessage: error ? error.message : 'No post data found'
      });
    }

    return (
      <div
        className={cn(
          "rounded-xl overflow-hidden mt-2 hover:opacity-95 transition-all duration-200 border shadow-sm hover:shadow-md max-w-full cursor-pointer",
          isOwn ? "bg-primary-foreground/15 border-primary-foreground/25 hover:bg-primary-foreground/20" : "bg-background/90 border-border/60 hover:bg-background hover:border-border"
        )}
        onClick={handlePostClick}
      >
        {/* Header with category info */}
        <div className={cn(
          "h-24 bg-gradient-to-br flex items-center justify-center",
          isOwn 
            ? "from-primary-foreground/10 to-primary-foreground/5" 
            : "from-muted/20 to-muted/5"
        )}>
          <div className="text-center px-4">
            <div className={cn(
              "text-lg font-bold mb-1",
              isOwn ? "text-primary-foreground/80" : "text-foreground/80"
            )}>
              {language === 'ar' ? 'منشور' : 'Post'}
            </div>
            {categoryName && (
              <div className={cn(
                "text-xs px-2 py-1 rounded-full font-medium",
                isOwn 
                  ? "bg-primary-foreground/25 text-primary-foreground/90" 
                  : "bg-primary/15 text-primary/90 border border-primary/20"
              )}>
                {categoryName}
              </div>
            )}
          </div>
        </div>

        <div className="p-4">
          {/* Content area */}
          <div className="space-y-3">
            <div className={cn(
              "text-sm leading-relaxed",
              isOwn ? "text-primary-foreground/95" : "text-foreground/95"
            )}>
              {error 
                ? (language === 'ar' ? 'لا يمكن تحميل تفاصيل المنشور.' : 'Unable to load post details.')
                : (language === 'ar' ? 'المنشور غير متوفر حالياً.' : 'This post is currently unavailable.')
              }
            </div>

            {/* URL display */}
            <div className={cn(
              "p-2 rounded-lg bg-muted/30 border border-border/30",
              isOwn ? "bg-primary-foreground/5 border-primary-foreground/15" : ""
            )}>
              <p className={cn(
                "text-xs font-mono break-all leading-relaxed",
                isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
              )}>
                {postUrl.replace(window.location.origin, '')}
              </p>
            </div>
          </div>

          {/* Action button */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <div className="flex items-center gap-4">
              <span className={cn(
                "text-xs",
                isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
              )}>
                {language === 'ar' ? 'انقر لعرض' : 'Click to view'}
              </span>
            </div>
            <span className="flex items-center gap-1.5 font-medium hover:text-primary transition-colors flex-shrink-0">
              <ExternalLink className="h-4 w-4" />
              {language === 'ar' ? 'عرض' : 'View'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const profile = post.profiles;
  const displayName = language === 'ar'
    ? (profile?.display_name_ar || profile?.display_name || profile?.username || 'User')
    : (profile?.display_name || profile?.username || 'User');
  
  const categoryName = post.categories
    ? (language === 'ar' ? post.categories.name_ar : post.categories.name_en)
    : null;

  const postPath = post.categories?.slug
    ? `/category/${post.categories.slug}/post/${post.slug || post.id}`
    : `/post/${post.slug || post.id}`;

  const hasImages = post.post_media && post.post_media.length > 0;
  const firstImage = hasImages ? post.post_media.find(m => m.media_type === 'image') : null;

  return (
    <div
      className={cn(
        "block rounded-xl overflow-hidden mt-2 hover:opacity-95 transition-all duration-200 border shadow-sm hover:shadow-md max-w-full cursor-pointer",
        isOwn 
          ? "bg-primary-foreground/15 border-primary-foreground/25 hover:bg-primary-foreground/20" 
          : "bg-background/90 border-border/60 hover:bg-background hover:border-border"
      )}
      onClick={handlePostClick}
    >
      {/* Image Thumbnail - Enhanced size and aspect ratio */}
      {firstImage ? (
        <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10">
          <img
            src={firstImage.media_url}
            alt=""
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
            style={{ objectFit: 'cover' }}
            onLoad={() => {
              // Trigger scroll when image loads
              if (onLoad) onLoad();
            }}
          />
          {/* Overlay gradient for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </div>
      ) : (
        // Fallback header for posts without images - call onLoad since no image to wait for
        <div 
          className={cn(
            "h-24 bg-gradient-to-br flex items-center justify-center",
            isOwn 
              ? "from-primary-foreground/10 to-primary-foreground/5" 
              : "from-muted/20 to-muted/5"
          )}
          ref={(el) => { if (el && onLoad) setTimeout(onLoad, 50); }}
        >
          <div className="text-center px-4">
            <div className={cn(
              "text-lg font-bold mb-1",
              isOwn ? "text-primary-foreground/80" : "text-foreground/80"
            )}>
              {language === 'ar' ? 'منشور' : 'Post'}
            </div>
            <div className={cn(
              "text-xs",
              isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
            )}>
              {profile?.username || displayName}
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Author info */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-7 w-7 ring-2 ring-background/50 flex-shrink-0">
            <AvatarImage src={getAvatarUrl(profile?.avatar_url)} />
            <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-primary/20 to-primary/10">
              {displayName[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className={cn(
              "text-sm font-semibold truncate",
              isOwn ? "text-primary-foreground" : "text-foreground"
            )}>
              {displayName}
            </span>
            {profile?.is_verified && (
              <BadgeCheck className="h-4 w-4 text-[#1D9BF0] flex-shrink-0" />
            )}
          </div>
          {categoryName && (
            <span className={cn(
              "text-xs px-2 py-1 rounded-full font-medium flex-shrink-0",
              isOwn 
                ? "bg-primary-foreground/25 text-primary-foreground/90" 
                : "bg-primary/15 text-primary/90 border border-primary/20"
            )}>
              {categoryName}
            </span>
          )}
        </div>

        {/* Content preview - Enhanced typography with clickable links */}
        <div className="space-y-2">
          <p className={cn(
            "text-sm leading-relaxed line-clamp-4 font-normal break-words",
            isOwn ? "text-primary-foreground/95" : "text-foreground/95"
          )}>
            {renderContentWithLinks(post.content, isOwn)}
          </p>
        </div>

        {/* Stats bar - Enhanced design */}
        <div className={cn(
          "flex items-center justify-between mt-4 pt-3 border-t text-xs",
          isOwn 
            ? "border-primary-foreground/20 text-primary-foreground/75" 
            : "border-border/40 text-muted-foreground"
        )}>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Heart className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">{post.likes_count || 0}</span>
            </span>
            <span className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <MessageCircle className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">{post.comments_count || 0}</span>
            </span>
            <span className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Eye className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">{post.views_count || 0}</span>
            </span>
          </div>
          <span className="flex items-center gap-1.5 font-medium hover:text-primary transition-colors flex-shrink-0">
            <ExternalLink className="h-4 w-4" />
            {language === 'ar' ? 'عرض' : 'View'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Helper to check if a message contains a shared post
export function isSharedPostMessage(content: string): { isShared: boolean; postUrl: string | null; textContent: string } {
  // Check if message starts with the share emoji pattern
  const sharePattern = /^📤\s*(.*?)\n\n"(.*)"\n\n🔗\s*(https?:\/\/[^\s]+\/post\/[^\s]+)$/s;
  const match = content.match(sharePattern);
  
  if (match) {
    return {
      isShared: true,
      postUrl: match[3],
      textContent: match[1] || '', // The "Shared a post:" text
    };
  }
  
  // Fallback: try to find any post URL in the message
  const urlPattern = /(https?:\/\/[^\s]+\/post\/[^\s]+)/g;
  const urlMatch = content.match(urlPattern);
  if (urlMatch) {
    // Extract text before the URL as the content
    const urlIndex = content.indexOf(urlMatch[0]);
    const textBeforeUrl = content.substring(0, urlIndex).trim();
    return {
      isShared: true,
      postUrl: urlMatch[0],
      textContent: textBeforeUrl || (content.includes('تمت مشاركة منشور') || content.includes('Shared a post') ? 
        (content.includes('تمت مشاركة منشور') ? 'تمت مشاركة منشور:' : 'Shared a post:') : 
        'Shared post'),
    };
  }
  
  return { isShared: false, postUrl: null, textContent: content };
}
