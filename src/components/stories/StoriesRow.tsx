import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStoryUpload } from '@/contexts/StoryUploadContext';
import { useStories, type UserStories } from '@/hooks/useStories';
import { useRealtimeStories } from '@/hooks/useRealtimeStories';
import { StoryViewer } from './StoryViewer';
import { CreateStoryDialog } from './CreateStoryDialog';
import { getAvatarUrl } from '@/lib/default-images';
import { Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function StoriesRow() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { uploadState } = useStoryUpload();
  const { data: userStories, isLoading } = useStories();
  
  // Subscribe to realtime story updates
  useRealtimeStories();
  
  const [selectedUserIndex, setSelectedUserIndex] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const currentUserStory = userStories?.find(us => us.user_id === user?.id);
  const otherUsersStories = userStories?.filter(us => us.user_id !== user?.id) || [];
  
  const handleStoryClick = (userId: string) => {
    const index = userStories?.findIndex(us => us.user_id === userId);
    if (index !== undefined && index >= 0) {
      setSelectedUserIndex(index);
    }
  };
  
  const handleCloseViewer = () => {
    setSelectedUserIndex(null);
  };
  
  const handleNavigateUser = (direction: 'prev' | 'next') => {
    if (selectedUserIndex === null || !userStories) return;
    
    if (direction === 'next' && selectedUserIndex < userStories.length - 1) {
      setSelectedUserIndex(selectedUserIndex + 1);
    } else if (direction === 'prev' && selectedUserIndex > 0) {
      setSelectedUserIndex(selectedUserIndex - 1);
    } else {
      setSelectedUserIndex(null);
    }
  };
  
  if (!user) return null;
  
  if (isLoading) {
    return (
      <div className="glass-card p-4 mb-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <Skeleton className="w-16 h-16 rounded-full" />
              <Skeleton className="w-12 h-3" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="glass-card p-4 mb-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {/* Add Story Button - Shows upload progress when uploading */}
          <button
            onClick={() => !uploadState.isUploading && setCreateDialogOpen(true)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
            disabled={uploadState.isUploading}
          >
            <div className="relative">
              {uploadState.isUploading ? (
                /* Uploading state - circular progress */
                <div className="w-16 h-16 rounded-full relative">
                  {/* Background circle */}
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-muted/30"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-primary"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - uploadState.progress / 100)}`}
                      style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                    />
                  </svg>
                  {/* Center content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center animate-pulse">
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    </div>
                  </div>
                </div>
              ) : (
                /* Normal add button */
                <>
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center",
                    "bg-gradient-to-br from-primary/20 to-secondary/20",
                    "border-2 border-dashed border-primary/50 hover:border-primary transition-colors"
                  )}>
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <Plus className="h-4 w-4 text-primary-foreground" />
                  </div>
                </>
              )}
            </div>
            <span className="text-xs text-muted-foreground truncate w-16 text-center">
              {uploadState.isUploading 
                ? `${Math.round(uploadState.progress)}%`
                : (language === 'ar' ? 'إضافة' : 'Add')
              }
            </span>
          </button>
          
          {/* Current User's Story (if exists) */}
          {currentUserStory && (
            <button
              onClick={() => handleStoryClick(user.id)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
            >
              <div className={cn(
                "p-0.5 rounded-full",
                currentUserStory.hasUnviewed
                  ? "bg-gradient-to-br from-primary via-secondary to-accent"
                  : "bg-muted"
              )}>
                <div className="p-0.5 bg-background rounded-full relative">
                  {/* Story thumbnail as background */}
                  {currentUserStory.stories[0] && (
                    currentUserStory.stories[0].media_type === 'video' ? (
                      <video
                        src={currentUserStory.stories[0].media_url || ''}
                        className="w-14 h-14 rounded-full object-cover"
                        muted
                        playsInline
                      />
                    ) : currentUserStory.stories[0].media_type === 'text' ? (
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden"
                        style={{ background: currentUserStory.stories[0].bg_gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                      >
                        <span
                          className="text-[8px] leading-tight text-center px-1 line-clamp-3 break-words"
                          style={{
                            color: currentUserStory.stories[0].text_color || '#ffffff',
                            fontFamily: currentUserStory.stories[0].font_family || 'system-ui',
                          }}
                        >
                          {currentUserStory.stories[0].text_content}
                        </span>
                      </div>
                    ) : (
                      <img
                        src={currentUserStory.stories[0].thumbnail_url || currentUserStory.stories[0].media_url || ''}
                        alt=""
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    )
                  )}
                  {/* Small avatar overlay */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ring-2 ring-background overflow-hidden">
                    <img
                      src={getAvatarUrl(currentUserStory.profile.avatar_url)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
              <span className="text-xs text-muted-foreground truncate w-16 text-center">
                {language === 'ar' ? 'قصتك' : 'Your story'}
              </span>
            </button>
          )}
          
          {/* Stories from followed users */}
          {otherUsersStories.map((userStory) => (
            <StoryAvatar
              key={userStory.user_id}
              userStory={userStory}
              onClick={() => handleStoryClick(userStory.user_id)}
              language={language}
            />
          ))}
        </div>
      </div>
      
      {/* Story Viewer */}
      {selectedUserIndex !== null && userStories && (
        <StoryViewer
          userStories={userStories}
          initialUserIndex={selectedUserIndex}
          onClose={handleCloseViewer}
          onNavigateUser={handleNavigateUser}
        />
      )}
      
      {/* Create Story Dialog */}
      <CreateStoryDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}

interface StoryAvatarProps {
  userStory: UserStories;
  onClick: () => void;
  language: string;
}

function StoryAvatar({ userStory, onClick, language }: StoryAvatarProps) {
  const displayName = language === 'ar'
    ? (userStory.profile.display_name_ar || userStory.profile.display_name || userStory.profile.username)
    : (userStory.profile.display_name || userStory.profile.username);
  
  // Get the latest story for thumbnail
  const latestStory = userStory.stories[0];
  
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 flex-shrink-0"
    >
      <div className={cn(
        "p-0.5 rounded-full",
        userStory.hasUnviewed
          ? "bg-gradient-to-br from-primary via-secondary to-accent"
          : "bg-muted"
      )}>
        <div className="p-0.5 bg-background rounded-full relative">
          {/* Story thumbnail as main image */}
          {latestStory ? (
            latestStory.media_type === 'video' ? (
              <video
                src={latestStory.media_url || ''}
                className="w-14 h-14 rounded-full object-cover"
                muted
                playsInline
              />
            ) : latestStory.media_type === 'text' ? (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden"
                style={{ background: latestStory.bg_gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                <span
                  className="text-[8px] leading-tight text-center px-1 line-clamp-3 break-words"
                  style={{
                    color: latestStory.text_color || '#ffffff',
                    fontFamily: latestStory.font_family || 'system-ui',
                  }}
                >
                  {latestStory.text_content}
                </span>
              </div>
            ) : (
              <img
                src={latestStory.thumbnail_url || latestStory.media_url || ''}
                alt={displayName || ''}
                className="w-14 h-14 rounded-full object-cover"
              />
            )
          ) : (
            <img
              src={getAvatarUrl(userStory.profile.avatar_url)}
              alt={displayName || ''}
              className="w-14 h-14 rounded-full object-cover"
            />
          )}
          {/* Small avatar overlay */}
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ring-2 ring-background overflow-hidden">
            <img
              src={getAvatarUrl(userStory.profile.avatar_url)}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
      <span className="text-xs text-muted-foreground truncate w-16 text-center">
        {displayName}
      </span>
    </button>
  );
}
