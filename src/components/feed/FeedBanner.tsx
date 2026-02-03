import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveBanners, Banner } from '@/hooks/useBanners';
import { ExternalLink, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function FeedBanner() {
  const { language } = useLanguage();
  const { data: banners } = useActiveBanners();
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());

  if (!banners || banners.length === 0) return null;

  const visibleBanners = banners.filter(b => !dismissedBanners.has(b.id));
  if (visibleBanners.length === 0) return null;

  const banner = visibleBanners[0]; // Show first active banner

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDismissedBanners(prev => new Set([...prev, id]));
  };

  const title = language === 'ar' ? (banner.title_ar || banner.title) : banner.title;

  return (
    <div className="mb-4 relative group animate-fade-in">
      <a
        href={banner.link_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
      >
        <img
          src={banner.image_url}
          alt={title}
          className="w-full h-auto object-cover"
          loading="lazy"
        />
        
        {/* Overlay with link indicator */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
            <ExternalLink className="h-4 w-4" />
            <span className="text-sm font-medium">
              {language === 'ar' ? 'فتح الرابط' : 'Open Link'}
            </span>
          </div>
        </div>
      </a>
      
      {/* Dismiss button */}
      <button
        onClick={(e) => handleDismiss(e, banner.id)}
        className={cn(
          "absolute top-2 bg-background/80 backdrop-blur-sm p-1.5 rounded-full",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "hover:bg-background shadow-md",
          language === 'ar' ? 'left-2' : 'right-2'
        )}
        aria-label={language === 'ar' ? 'إغلاق' : 'Dismiss'}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
