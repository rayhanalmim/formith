import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserHighlights, type StoryHighlight } from '@/hooks/useStoryHighlights';
import { HighlightViewer } from './HighlightViewer';
import { CreateHighlightDialog } from './CreateHighlightDialog';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface StoryHighlightsProps {
  userId: string;
  isOwnProfile: boolean;
}

export function StoryHighlights({ userId, isOwnProfile }: StoryHighlightsProps) {
  const { language } = useLanguage();
  const { data: highlights, isLoading } = useUserHighlights(userId);
  
  const [selectedHighlight, setSelectedHighlight] = useState<StoryHighlight | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="w-12 h-3" />
          </div>
        ))}
      </div>
    );
  }
  
  const hasHighlights = highlights && highlights.length > 0;
  
  if (!hasHighlights) return null;
  
  return (
    <>
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">
          {language === 'ar' ? 'المختصرات' : 'Highlights'}
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {/* Highlights */}
          {highlights?.map((highlight) => (
            <HighlightItem
              key={highlight.id}
              highlight={highlight}
              onClick={() => setSelectedHighlight(highlight)}
              language={language}
            />
          ))}
        </div>
      </div>
      
      {/* Highlight Viewer */}
      {selectedHighlight && (
        <HighlightViewer
          highlight={selectedHighlight}
          isOwnProfile={isOwnProfile}
          onClose={() => setSelectedHighlight(null)}
        />
      )}
      
      {/* Create Highlight Dialog */}
      <CreateHighlightDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}

interface HighlightItemProps {
  highlight: StoryHighlight;
  onClick: () => void;
  language: string;
}

function HighlightItem({ highlight, onClick, language }: HighlightItemProps) {
  // Determine which story to use for cover
  const firstStory = highlight.items?.[0]?.story;
  const isTextCoverRef = highlight.cover_url?.startsWith('text:');
  
  // Find the text story referenced by cover_url (text:storyId format)
  const textCoverStory = isTextCoverRef
    ? highlight.items?.find(item => item.story_id === highlight.cover_url!.replace('text:', ''))?.story
    : null;
  
  // Determine if cover should be a text story gradient
  const coverTextStory = textCoverStory || (!highlight.cover_url && firstStory?.media_type === 'text' ? firstStory : null);
  
  const coverImage = isTextCoverRef 
    ? null // Text cover handled separately
    : highlight.cover_url || 
      (firstStory?.media_type === 'video' 
        ? (firstStory.thumbnail_url || firstStory.media_url)
        : firstStory?.media_type === 'text'
          ? null
          : firstStory?.media_url);
  
  const isVideoCover = firstStory?.media_type === 'video' && !highlight.cover_url && !firstStory?.thumbnail_url;
  
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 flex-shrink-0"
    >
      <div className="p-0.5 rounded-full bg-gradient-to-br from-muted-foreground/30 to-muted-foreground/10">
        <div className="p-0.5 bg-background rounded-full">
          {coverTextStory ? (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden"
              style={{ background: coverTextStory.bg_gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <span
                className="text-[8px] leading-tight text-center px-1 line-clamp-3 break-words"
                style={{
                  color: coverTextStory.text_color || '#ffffff',
                  fontFamily: coverTextStory.font_family || 'system-ui',
                }}
              >
                {coverTextStory.text_content}
              </span>
            </div>
          ) : coverImage ? (
            isVideoCover ? (
              <VideoThumbnail src={coverImage} title={highlight.title} />
            ) : (
              <img
                src={coverImage}
                alt={highlight.title}
                className="w-14 h-14 rounded-full object-cover"
              />
            )
          ) : (
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <span className="text-lg">📖</span>
            </div>
          )}
        </div>
      </div>
      <span className="text-xs text-foreground truncate w-16 text-center font-medium">
        {highlight.title}
      </span>
    </button>
  );
}

// Component to show video thumbnail - uses video element with time fragment
function VideoThumbnail({ src, title }: { src: string; title: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Use video element directly with #t=0.5 fragment for poster frame
  // This is more reliable than canvas extraction which fails due to CORS
  
  if (hasError) {
    return (
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
        <span className="text-lg">🎬</span>
      </div>
    );
  }
  
  return (
    <div className="relative w-14 h-14 rounded-full overflow-hidden bg-muted">
      <video
        src={src + '#t=0.5'}
        className={cn(
          "w-full h-full object-cover",
          !isLoaded && "opacity-0"
        )}
        muted
        playsInline
        preload="metadata"
        onLoadedData={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
