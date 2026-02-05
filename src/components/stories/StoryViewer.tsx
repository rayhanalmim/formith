/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useViewStory, useReplyToStory, useReactToStory, useDeleteStory, useStoryViewers, useReactToEmojiButton, useUnseenEmojiReactions, useEmojiReactors, useMarkEmojiReactionsAsSeen, type UserStories, type Story } from '@/hooks/useStories';
import { StoryAnalyticsSheet } from './StoryAnalyticsSheet';
import { useUserHighlights, useAddToHighlight, useCreateHighlight } from '@/hooks/useStoryHighlights';
import { getAvatarUrl } from '@/lib/default-images';
import { api } from '@/lib/api';
import { BadgeCheck, Users, MapPin, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  Eye, 
  Heart, 
  Trash2,
  Pause,
  Play,
  MoreVertical,
  Bookmark,
  Plus,
  Music,
  Volume2,
  VolumeX,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Emoji float animation component - enhanced with more spread and visual appeal
function EmojiFloatAnimation({ 
  emoji, 
  onComplete, 
  count = 10 
}: { 
  emoji: string; 
  onComplete: () => void;
  count?: number;
}) {
  // Pre-generate random values with more spread to the left for visual appeal
  const emojisRef = useRef(
    Array.from({ length: count }).map((_, i) => ({
      id: i,
      // Spread more to the left (5-70% range, weighted towards left)
      x: 5 + Math.random() * 65,
      // Staggered delays for wave effect
      delay: (i * 0.08) + Math.random() * 0.3,
      // Varied durations
      duration: 1.8 + Math.random() * 1.2,
      // Random rotation direction
      rotation: Math.random() > 0.5 ? 1 : -1,
      // Random scale variation
      scale: 0.8 + Math.random() * 0.6,
      // Horizontal drift
      drift: (Math.random() - 0.5) * 30,
    }))
  );
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const emojis = emojisRef.current;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {emojis.map((item) => (
        <div
          key={item.id}
          className="absolute"
          style={{
            left: `${item.x}%`,
            bottom: '-60px',
            fontSize: `${24 + item.scale * 16}px`,
            animation: `emojiFloatUp-${item.id} ${item.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            animationDelay: `${item.delay}s`,
          }}
        >
          {emoji}
        </div>
      ))}
      <style>{`
        ${emojis.map(item => `
          @keyframes emojiFloatUp-${item.id} {
            0% {
              transform: translateY(0) translateX(0) scale(0.5) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 1;
              transform: translateY(-10vh) translateX(${item.drift * 0.3}px) scale(${item.scale}) rotate(${item.rotation * 5}deg);
            }
            50% {
              opacity: 1;
              transform: translateY(-50vh) translateX(${item.drift}px) scale(${item.scale * 1.1}) rotate(${item.rotation * 15}deg);
            }
            100% {
              transform: translateY(-110vh) translateX(${item.drift * 1.5}px) scale(${item.scale * 0.8}) rotate(${item.rotation * 25}deg);
              opacity: 0;
            }
          }
        `).join('\n')}
      `}</style>
    </div>
  );
}

// Accumulated emoji animation for owner's first view (shows all unseen reactions)
function AccumulatedEmojiAnimation({ 
  emoji, 
  totalCount, 
  onComplete 
}: { 
  emoji: string; 
  totalCount: number;
  onComplete: () => void;
}) {
  // Generate emojis based on total count (max 50 for performance)
  const emojiCount = Math.min(totalCount, 50);
  const emojisRef = useRef(
    Array.from({ length: emojiCount }).map((_, i) => ({
      id: i,
      x: 5 + Math.random() * 70,
      delay: (i * 0.05) + Math.random() * 0.2,
      duration: 2 + Math.random() * 1.5,
      rotation: Math.random() > 0.5 ? 1 : -1,
      scale: 0.7 + Math.random() * 0.8,
      drift: (Math.random() - 0.5) * 40,
    }))
  );
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4000 + emojiCount * 30);
    return () => clearTimeout(timer);
  }, [onComplete, emojiCount]);

  const emojis = emojisRef.current;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {emojis.map((item) => (
        <div
          key={item.id}
          className="absolute"
          style={{
            left: `${item.x}%`,
            bottom: '-60px',
            fontSize: `${22 + item.scale * 14}px`,
            animation: `accumulatedFloat-${item.id} ${item.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            animationDelay: `${item.delay}s`,
          }}
        >
          {emoji}
        </div>
      ))}
      <style>{`
        ${emojis.map(item => `
          @keyframes accumulatedFloat-${item.id} {
            0% {
              transform: translateY(0) translateX(0) scale(0.3) rotate(0deg);
              opacity: 0;
            }
            15% {
              opacity: 1;
              transform: translateY(-15vh) translateX(${item.drift * 0.3}px) scale(${item.scale}) rotate(${item.rotation * 8}deg);
            }
            50% {
              opacity: 1;
              transform: translateY(-50vh) translateX(${item.drift}px) scale(${item.scale * 1.15}) rotate(${item.rotation * 18}deg);
            }
            100% {
              transform: translateY(-115vh) translateX(${item.drift * 1.8}px) scale(${item.scale * 0.7}) rotate(${item.rotation * 30}deg);
              opacity: 0;
            }
          }
        `).join('\n')}
      `}</style>
    </div>
  );
}

interface StoryViewerProps {
  userStories: UserStories[];
  initialUserIndex: number;
  onClose: () => void;
  onNavigateUser: (direction: 'prev' | 'next') => void;
}

const MAX_STORY_DURATION = 59000; // Max 59 seconds per story
const IMAGE_STORY_DURATION = 5000; // 5 seconds for images

export function StoryViewer({ 
  userStories, 
  initialUserIndex, 
  onClose, 
  onNavigateUser 
}: StoryViewerProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const viewStory = useViewStory();
  const replyToStory = useReplyToStory();
  const reactToStory = useReactToStory();
  const deleteStory = useDeleteStory();
  const { data: highlights } = useUserHighlights(user?.id);
  const addToHighlight = useAddToHighlight();
  const createHighlight = useCreateHighlight();
  
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showViewers, setShowViewers] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [newHighlightName, setNewHighlightName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedViewer, setSelectedViewer] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay policy
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [isVideoBuffering, setIsVideoBuffering] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false); // Track when video is actually playing
  const [isEmojiAnimating, setIsEmojiAnimating] = useState(false); // Floating emoji animation state
  const [isEmojiButtonPressed, setIsEmojiButtonPressed] = useState(false); // Press animation state
  const [showEmojiReactors, setShowEmojiReactors] = useState(false); // Show reactors sheet for owner
  const [showAccumulatedAnimation, setShowAccumulatedAnimation] = useState(false); // Accumulated reactions animation
  const [hasShownAccumulated, setHasShownAccumulated] = useState<Set<string>>(new Set()); // Track shown accumulated per story
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  
  // Swipe gesture state
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchMoveRef = useRef<{ x: number; y: number } | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeAnimating, setIsSwipeAnimating] = useState(false);
  
  const currentUser = userStories[currentUserIndex];
  const currentStory = currentUser?.stories[currentStoryIndex];
  const isOwnStory = currentUser?.user_id === user?.id;
  
  // Emoji button reaction hooks
  const reactToEmojiButton = useReactToEmojiButton();
  const markEmojiReactionsAsSeen = useMarkEmojiReactionsAsSeen();
  const { data: unseenReactions } = useUnseenEmojiReactions(
    currentStory?.id || '', 
    isOwnStory && !!currentStory?.reaction_emoji
  );
  const { data: emojiReactors } = useEmojiReactors(
    currentStory?.id || '',
    showEmojiReactors && isOwnStory
  );
  
  // Show accumulated animation for owner when they first view the story
  useEffect(() => {
    if (
      isOwnStory && 
      currentStory?.id && 
      currentStory?.reaction_emoji &&
      unseenReactions && 
      unseenReactions.totalCount > 0 && 
      !hasShownAccumulated.has(currentStory.id)
    ) {
      setShowAccumulatedAnimation(true);
      setHasShownAccumulated(prev => new Set(prev).add(currentStory.id));
      // Mark reactions as seen after showing
      markEmojiReactionsAsSeen.mutate(currentStory.id);
    }
  }, [isOwnStory, currentStory?.id, currentStory?.reaction_emoji, unseenReactions, hasShownAccumulated, markEmojiReactionsAsSeen]);
  
  // Calculate next story for preloading
  const getNextStory = useCallback(() => {
    if (!currentUser) return null;
    
    // Next story in same user's stories
    if (currentStoryIndex < currentUser.stories.length - 1) {
      return currentUser.stories[currentStoryIndex + 1];
    }
    // First story of next user
    if (currentUserIndex < userStories.length - 1) {
      const nextUser = userStories[currentUserIndex + 1];
      return nextUser?.stories[0] || null;
    }
    return null;
  }, [currentUser, currentStoryIndex, currentUserIndex, userStories]);
  
  const nextStory = getNextStory();
  
  // Preload next video story
  useEffect(() => {
    if (nextStory?.media_type === 'video' && nextStory.media_url) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = nextStory.media_url;
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [nextStory?.id, nextStory?.media_type, nextStory?.media_url]);
  
  // Fetch viewers for current story when viewing own story
  const { data: viewers, isLoading: viewersLoading } = useStoryViewers(
    showViewers && isOwnStory && currentStory ? currentStory.id : ''
  );
  
  // Audio playback for story music (only for image stories - videos use original audio)
  useEffect(() => {
    // Stop previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Play background music only for image stories (not videos - they have original audio)
    if (currentStory?.audio_url && currentStory?.media_type === 'image') {
      const audio = new Audio(currentStory.audio_url);
      audio.loop = true;
      audio.volume = 0.5;
      audio.play().catch(console.error);
      audioRef.current = audio;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [currentStory?.id, currentStory?.audio_url, currentStory?.media_type]);
  
  // Pause/resume audio and video when story is paused
  useEffect(() => {
    if (audioRef.current) {
      if (isPaused) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
      audioRef.current.muted = isMuted;
    }
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
      videoRef.current.muted = isMuted;
    }
  }, [isPaused, isMuted]);
  
  // Reset video states when story changes
  useEffect(() => {
    setVideoDuration(null);
    setIsVideoReady(false);
    
    // Fallback: if video duration isn't detected within 1.5s, use default
    if (currentStory?.media_type === 'video') {
      const fallbackTimer = setTimeout(() => {
        setVideoDuration(prev => prev ?? 10); // Default 10 seconds if not detected
      }, 1500);
      return () => clearTimeout(fallbackTimer);
    } else {
      // For images, we're always "ready"
      setIsVideoReady(true);
    }
  }, [currentStory?.id, currentStory?.media_type]);
  
  // Calculate story duration based on media type
  const getStoryDuration = useCallback(() => {
    if (currentStory?.media_type === 'video' && videoDuration) {
      // Use actual video duration, capped at max
      return Math.min(videoDuration * 1000, MAX_STORY_DURATION);
    }
    // Default duration for images
    return IMAGE_STORY_DURATION;
  }, [currentStory?.media_type, videoDuration]);
  
  // Progress timer
  useEffect(() => {
    if (isPaused || !currentStory) return;
    
    // For videos, wait until we have the duration AND video is actually playing
    if (currentStory.media_type === 'video' && (!videoDuration || !isVideoReady)) return;
    
    const storyDuration = getStoryDuration();
    const interval = 50; // Update every 50ms
    const increment = (interval / storyDuration) * 100;
    
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goToNextStory();
          return 0;
        }
        return prev + increment;
      });
    }, interval);
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentUserIndex, currentStoryIndex, isPaused, currentStory, videoDuration, isVideoReady, getStoryDuration]);
  
  // Mark story as viewed
  useEffect(() => {
    if (currentStory && !currentStory.user_viewed && !isOwnStory && currentUser) {
      viewStory.mutate({ storyId: currentStory.id, storyOwnerId: currentUser.user_id });
    }
  }, [currentStory?.id, isOwnStory, currentUser?.user_id]);
  
  const goToNextStory = useCallback(() => {
    if (!currentUser) return;
    
    if (currentStoryIndex < currentUser.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (currentUserIndex < userStories.length - 1) {
      setCurrentUserIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentUser, currentStoryIndex, currentUserIndex, userStories.length, onClose]);
  
  const goToPrevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (currentUserIndex > 0) {
      const prevUser = userStories[currentUserIndex - 1];
      setCurrentUserIndex(prev => prev - 1);
      setCurrentStoryIndex(prevUser.stories.length - 1);
      setProgress(0);
    }
  }, [currentStoryIndex, currentUserIndex, userStories]);
  
  const handleReply = async () => {
    if (!replyText.trim() || !currentStory) return;
    
    try {
      await replyToStory.mutateAsync({
        storyId: currentStory.id,
        content: replyText.trim(),
      });
      setReplyText('');
      toast({
        title: language === 'ar' ? 'تم الإرسال' : 'Sent',
        description: language === 'ar' ? 'تم إرسال ردك' : 'Your reply was sent',
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: String(error),
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (!currentStory) return;
    
    const storyIdToDelete = currentStory.id;
    const remainingStories = currentUser?.stories.length || 0;
    
    // Close dialog first
    setShowDeleteConfirm(false);
    setIsPaused(false);
    
    try {
      await deleteStory.mutateAsync(storyIdToDelete);
      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
      });
      
      // If this was the last story for the user, close the viewer
      if (remainingStories <= 1) {
        onClose();
      } else {
        // Navigate to next story or previous if at end
        if (currentStoryIndex < remainingStories - 1) {
          // Stay on same index (next story will slide in)
          setProgress(0);
        } else {
          // Go to previous story
          setCurrentStoryIndex(Math.max(0, currentStoryIndex - 1));
          setProgress(0);
        }
      }
    } catch (error) {
      console.error('Delete story error:', error);
      toast({
        title: language === 'ar' ? 'خطأ في الحذف' : 'Delete Error',
        description: String(error),
        variant: 'destructive',
      });
    }
  };
  
  const handleAddToHighlight = async (highlightId: string) => {
    if (!currentStory) return;
    
    try {
      await addToHighlight.mutateAsync({
        highlightId,
        storyId: currentStory.id,
      });
      toast({
        title: language === 'ar' ? 'تمت الإضافة' : 'Added',
        description: language === 'ar' ? 'تمت إضافة القصة للمختصر' : 'Story added to highlight',
      });
      setShowHighlightPicker(false);
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: String(error),
        variant: 'destructive',
      });
    }
  };
  
  const handleCreateNewHighlight = async () => {
    if (!currentStory || !newHighlightName.trim()) return;
    
    try {
      const highlight = await createHighlight.mutateAsync({
        title: newHighlightName.trim(),
        coverUrl: currentStory.media_url,
      });
      
      await addToHighlight.mutateAsync({
        highlightId: highlight.id,
        storyId: currentStory.id,
      });
      
      toast({
        title: language === 'ar' ? 'تم الإنشاء' : 'Created',
        description: language === 'ar' ? 'تم إنشاء المختصر وإضافة القصة' : 'Highlight created with story',
      });
      setNewHighlightName('');
      setShowHighlightPicker(false);
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: String(error),
        variant: 'destructive',
      });
    }
  };
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight') goToNextStory();
    if (e.key === 'ArrowLeft') goToPrevStory();
    if (e.key === ' ') {
      e.preventDefault();
      setIsPaused(prev => !prev);
    }
  }, [onClose, goToNextStory, goToPrevStory]);
  
  // Swipe gesture handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    touchMoveRef.current = null;
    setSwipeOffset(0);
  }, []);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    // Only track horizontal swipes (ignore if mostly vertical)
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5) return;
    
    touchMoveRef.current = { x: touch.clientX, y: touch.clientY };
    
    // Apply resistance at edges
    const canGoNext = currentStoryIndex < (currentUser?.stories.length ?? 1) - 1 || currentUserIndex < userStories.length - 1;
    const canGoPrev = currentStoryIndex > 0 || currentUserIndex > 0;
    
    let offset = deltaX;
    // Add resistance when swiping past edges
    if ((deltaX > 0 && !canGoPrev) || (deltaX < 0 && !canGoNext)) {
      offset = deltaX * 0.3; // 30% resistance
    }
    
    setSwipeOffset(offset);
  }, [currentStoryIndex, currentUserIndex, currentUser?.stories.length, userStories.length]);
  
  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current || !touchMoveRef.current) {
      touchStartRef.current = null;
      setSwipeOffset(0);
      return;
    }
    
    const deltaX = touchMoveRef.current.x - touchStartRef.current.x;
    const deltaTime = Date.now() - touchStartRef.current.time;
    const velocity = Math.abs(deltaX) / deltaTime;
    
    // Swipe threshold: either distance > 80px or fast velocity
    const swipeThreshold = 80;
    const velocityThreshold = 0.5;
    
    const shouldNavigate = Math.abs(deltaX) > swipeThreshold || velocity > velocityThreshold;
    
    if (shouldNavigate) {
      setIsSwipeAnimating(true);
      
      if (deltaX > 0) {
        // Swipe right = go to previous
        goToPrevStory();
      } else {
        // Swipe left = go to next
        goToNextStory();
      }
      
      // Animate the swipe completion
      setTimeout(() => {
        setSwipeOffset(0);
        setIsSwipeAnimating(false);
      }, 150);
    } else {
      // Snap back
      setIsSwipeAnimating(true);
      setSwipeOffset(0);
      setTimeout(() => setIsSwipeAnimating(false), 150);
    }
    
    touchStartRef.current = null;
    touchMoveRef.current = null;
  }, [goToNextStory, goToPrevStory]);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);
  
  if (!currentStory || !currentUser) return null;
  
  const displayName = language === 'ar'
    ? (currentUser.profile.display_name_ar || currentUser.profile.display_name || currentUser.profile.username)
    : (currentUser.profile.display_name || currentUser.profile.username);
  
  const timeAgo = formatDistanceToNow(new Date(currentStory.created_at), {
    addSuffix: true,
    locale: language === 'ar' ? ar : enUS,
  });
  
  return createPortal(
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      onClick={(e) => {
        if (e.target === containerRef.current) onClose();
      }}
    >
      {/* Story Container - 9:16 aspect ratio with swipe gestures */}
      <div 
        className={cn(
          "relative w-full max-w-[420px] h-full max-h-[calc(100vh-40px)] md:max-h-[85vh] md:rounded-2xl overflow-hidden bg-black touch-pan-y",
          isSwipeAnimating && "transition-transform duration-150 ease-out"
        )}
        style={{ 
          transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : undefined,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-20 p-2 flex gap-1">
          {currentUser.stories.map((_, index) => (
            <div key={index} className="flex-1 h-1.5 bg-white/30 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full bg-white rounded-full",
                  isPaused ? "" : "transition-all duration-75 ease-linear"
                )}
                style={{ 
                  width: index < currentStoryIndex 
                    ? '100%' 
                    : index === currentStoryIndex 
                      ? `${progress}%` 
                      : '0%' 
                }}
              />
            </div>
          ))}
        </div>
        
        {/* Paused indicator */}
        {isPaused && !isVideoBuffering && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm rounded-full p-4 animate-scale-in">
              <Pause className="h-8 w-8 text-white" />
            </div>
          </div>
        )}
        
        {/* Video buffering spinner */}
        {isVideoBuffering && currentStory.media_type === 'video' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-sm rounded-full p-4 animate-scale-in">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-50 px-4 pt-4 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <img
              src={getAvatarUrl(currentUser.profile.avatar_url)}
              alt={displayName || ''}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-white font-semibold text-sm">{displayName}</p>
                {currentStory.audio_url && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/20">
                    <Music className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-white/70 text-xs">
                <span>{timeAgo}</span>
                {isOwnStory && (
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{currentStory.views_count || 0}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {/* Mute/Unmute button */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-9 w-9"
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-9 w-9"
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(!isPaused);
              }}
            >
              {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </Button>
            
            {/* 3-dot menu for story options */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-9 w-9"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover border border-border z-[99999]" sideOffset={5}>
                
                {/* Analytics - for own stories */}
                {isOwnStory && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAnalytics(true);
                      setIsPaused(true);
                    }}
                    className="gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>{language === 'ar' ? 'التحليلات' : 'Analytics'}</span>
                  </DropdownMenuItem>
                )}
                
                {/* Add to highlights - for own stories */}
                {isOwnStory && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHighlightPicker(true);
                      setIsPaused(true);
                    }}
                    className="gap-2"
                  >
                    <Bookmark className="h-4 w-4" />
                    <span>{language === 'ar' ? 'إضافة للمختصرات' : 'Add to Highlights'}</span>
                  </DropdownMenuItem>
                )}
                
                {/* Delete story - for own stories */}
                {isOwnStory && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(true);
                        setIsPaused(true);
                      }}
                      className="gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>{language === 'ar' ? 'حذف القصة' : 'Delete Story'}</span>
                    </DropdownMenuItem>
                  </>
                )}
                
                {/* Report option for other users' stories */}
                {!isOwnStory && (
                  <DropdownMenuItem
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await api.createReport({
                          reporter_id: user?.id || '',
                          reported_type: 'story',
                          reported_id: currentStory.id,
                          reported_user_id: currentStory.user_id,
                          reason: 'Inappropriate content',
                          description: 'Reported from story viewer',
                        });
                        toast({
                          title: language === 'ar' ? 'تم الإبلاغ' : 'Reported',
                          description: language === 'ar' ? 'شكراً لإبلاغك' : 'Thank you for reporting',
                        });
                      } catch (error) {
                        toast({
                          title: language === 'ar' ? 'خطأ' : 'Error',
                          description: language === 'ar' ? 'فشل الإبلاغ' : 'Failed to report',
                          variant: 'destructive',
                        });
                      }
                    }}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>{language === 'ar' ? 'إبلاغ' : 'Report'}</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-9 w-9"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Story Content */}
        <div className="w-full h-full flex items-center justify-center relative bg-black">
          {/* Media */}
          {currentStory.media_type === 'video' ? (
            <video
              ref={videoRef}
              src={currentStory.media_url}
              className="w-full h-full object-contain"
              autoPlay
              muted={isMuted}
              playsInline
              preload="auto"
              style={{ filter: currentStory.filter || undefined }}
              onWaiting={() => {
                setIsVideoBuffering(true);
                setIsVideoReady(false);
              }}
              onPlaying={() => {
                setIsVideoBuffering(false);
                setIsVideoReady(true); // Video is actually playing now
              }}
              onCanPlayThrough={() => setIsVideoBuffering(false)}
              onCanPlay={(e) => {
                setIsVideoBuffering(false);
                // Set duration when video can start playing (faster than onLoadedMetadata)
                const video = e.currentTarget;
                if (!videoDuration && video.duration && isFinite(video.duration) && video.duration > 0) {
                  setVideoDuration(video.duration);
                }
              }}
              onLoadedMetadata={(e) => {
                const video = e.currentTarget;
                if (!videoDuration && video.duration && isFinite(video.duration) && video.duration > 0) {
                  setVideoDuration(video.duration);
                }
              }}
              onLoadStart={() => {
                setIsVideoBuffering(true);
                setIsVideoReady(false);
              }}
              onError={() => {
                setIsVideoBuffering(false);
                setIsVideoReady(false);
                // If video fails to load, skip to next story
                console.error('Video failed to load');
                goToNextStory();
              }}
            />
          ) : (
            <img
              src={currentStory.media_url}
              alt=""
              className="w-full h-full object-contain"
              style={{ filter: currentStory.filter || undefined }}
            />
          )}
          
          {/* Overlays positioned absolutely over the entire viewport */}
          {/* Text Overlay */}
          {currentStory.text_overlay && (
            <div
              className="absolute pointer-events-none inset-0"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: `${currentStory.text_overlay.position.x}%`,
                  top: `${currentStory.text_overlay.position.y}%`,
                  transform: 'translate(-50%, -50%)',
                  fontFamily: currentStory.text_overlay.font,
                  color: currentStory.text_overlay.color,
                  fontSize: `${currentStory.text_overlay.size}px`,
                  backgroundColor: currentStory.text_overlay.backgroundColor,
                  padding: currentStory.text_overlay.backgroundColor ? '8px 16px' : undefined,
                  borderRadius: currentStory.text_overlay.backgroundColor ? '8px' : undefined,
                }}
              >
                {currentStory.text_overlay.text}
              </div>
            </div>
          )}
          
          {/* Stickers */}
          {currentStory.stickers?.map((sticker, index) => (
            <div
              key={index}
              className="absolute pointer-events-none"
              style={{
                left: `${sticker.position.x}%`,
                top: `${sticker.position.y}%`,
                transform: `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg)`,
                fontSize: `${sticker.size}px`,
              }}
            >
              {sticker.type === 'emoji' ? sticker.data : (
                <img src={sticker.data} alt="" className="w-auto h-auto max-w-full" />
              )}
            </div>
          ))}
          
          {/* Tappable Reaction Emoji - Curved style with press animation */}
          {currentStory.reaction_emoji && (
            <div
              className="absolute z-30 cursor-pointer"
              style={{
                left: currentStory.reaction_emoji.position ? `${currentStory.reaction_emoji.position.x}%` : '80%',
                top: currentStory.reaction_emoji.position ? `${currentStory.reaction_emoji.position.y}%` : '70%',
              }}
              onMouseDown={() => setIsEmojiButtonPressed(true)}
              onMouseUp={() => setIsEmojiButtonPressed(false)}
              onMouseLeave={() => setIsEmojiButtonPressed(false)}
              onTouchStart={() => setIsEmojiButtonPressed(true)}
              onTouchEnd={(e) => {
                e.stopPropagation();
                setIsEmojiButtonPressed(false);
              }}
              onClick={(e) => {
                e.stopPropagation();
                
                if (isOwnStory) {
                  // Owner taps: show reactors list
                  setShowEmojiReactors(true);
                  setIsPaused(true);
                } else {
                  // Other users tap: show floating animation and record reaction
                  setIsEmojiAnimating(true);
                  reactToEmojiButton.mutate({ 
                    storyId: currentStory.id, 
                    emoji: currentStory.reaction_emoji!.emoji 
                  });
                }
              }}
            >
              {/* Curved bubble container like reference image */}
              <div 
                className="relative"
                style={{
                  transform: `translate(-50%, -50%) scale(${isEmojiButtonPressed ? 0.85 : 1})`,
                  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                {/* Circular ripple effect on press - slower animation */}
                {isEmojiButtonPressed && (
                  <div 
                    className="absolute -inset-2 rounded-full bg-primary/30"
                    style={{
                      animation: 'ripple 0.8s ease-out'
                    }}
                  />
                )}
                
                {/* Main circular button with shadow and glow */}
                <div 
                  className={cn(
                    "w-16 h-16 rounded-full bg-white shadow-2xl flex items-center justify-center relative",
                    "ring-4 ring-white/30 backdrop-blur-sm",
                    "transition-all duration-300 ease-out",
                    isEmojiButtonPressed && "shadow-lg ring-2 bg-primary/5"
                  )}
                  style={{
                    boxShadow: isEmojiButtonPressed 
                      ? '0 4px 15px rgba(0,0,0,0.2)' 
                      : '0 8px 30px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.1)'
                  }}
                >
                  <span className="text-4xl">
                    {currentStory.reaction_emoji.emoji}
                  </span>
                </div>
                
                <style>{`
                  @keyframes ripple {
                    0% {
                      transform: scale(0.8);
                      opacity: 1;
                    }
                    100% {
                      transform: scale(2);
                      opacity: 0;
                    }
                  }
                `}</style>
                
                {/* Curved tail/pointer for bubble effect */}
                <div 
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2"
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '10px solid transparent',
                    borderRight: '10px solid transparent',
                    borderTop: '12px solid white',
                    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
                  }}
                />
                
                {/* Reaction count badge for owner - shows unique user count */}
                {isOwnStory && unseenReactions && unseenReactions.users.length > 0 && (
                  <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-lg animate-pulse">
                    {unseenReactions.users.length > 99 ? '99+' : unseenReactions.users.length}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Floating Emoji Animation - For other users */}
          {isEmojiAnimating && currentStory.reaction_emoji && !isOwnStory && (
            <EmojiFloatAnimation 
              emoji={currentStory.reaction_emoji.emoji} 
              onComplete={() => setIsEmojiAnimating(false)}
              count={10}
            />
          )}
          
          {/* Accumulated Emoji Animation - For owner's first view - 10x per user */}
          {showAccumulatedAnimation && currentStory.reaction_emoji && isOwnStory && unseenReactions && (
            <AccumulatedEmojiAnimation 
              emoji={currentStory.reaction_emoji.emoji}
              totalCount={unseenReactions.users.length * 10}
              onComplete={() => setShowAccumulatedAnimation(false)}
            />
          )}
        </div>
        
        {/* Navigation areas */}
        <div className="absolute inset-0 z-10 flex pointer-events-none">
          <div 
            className="w-1/3 h-full cursor-pointer pointer-events-auto"
            onClick={goToPrevStory}
          />
          <div className="w-1/3 h-full" />
          <div 
            className="w-1/3 h-full cursor-pointer pointer-events-auto"
            onClick={goToNextStory}
          />
        </div>
        
        {/* Reply input (for other people's stories) */}
        {!isOwnStory && (
          <div className="absolute bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
            {/* Quick Reactions */}
            <div className="flex justify-center gap-3 mb-3 pointer-events-auto">
              {['❤️', '😂', '😮', '😢', '🔥'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    reactToStory.mutate({ storyId: currentStory.id, emoji });
                    toast({
                      description: language === 'ar' ? 'تم إرسال التفاعل' : 'Reaction sent!',
                    });
                  }}
                  onTouchEnd={(e) => e.stopPropagation()}
                  className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-xl"
                >
                  {emoji}
                </button>
              ))}
            </div>
            
            {/* Reply Input */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <Input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={language === 'ar' ? 'رد على القصة...' : 'Reply to story...'}
                className="flex-1 bg-white/20 border-0 text-white placeholder:text-white/60 focus-visible:ring-white/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                    handleReply();
                  }
                }}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
              />
              <Button
                size="icon"
                className="bg-primary hover:bg-primary/90"
                onClick={handleReply}
                disabled={!replyText.trim() || replyToStory.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Bottom bar removed - delete/views moved to menu */}
      </div>
      
      {/* Desktop navigation arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:flex absolute left-4 text-white hover:bg-white/20"
        onClick={goToPrevStory}
        disabled={currentUserIndex === 0 && currentStoryIndex === 0}
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:flex absolute right-4 text-white hover:bg-white/20"
        onClick={goToNextStory}
      >
        <ChevronRight className="h-8 w-8" />
      </Button>
      
      {/* Highlight Picker Dialog */}
      <Dialog open={showHighlightPicker} onOpenChange={(open) => {
        setShowHighlightPicker(open);
        if (!open) setIsPaused(false);
      }}>
        <DialogContent className="sm:max-w-sm z-[99999]">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'إضافة للمختصرات' : 'Add to Highlights'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {/* Existing highlights */}
            {highlights && highlights.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'المختصرات الموجودة' : 'Existing Highlights'}
                </p>
                {highlights.map((highlight) => (
                  <button
                    key={highlight.id}
                    onClick={() => handleAddToHighlight(highlight.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    {highlight.cover_url || highlight.items?.[0]?.story?.media_url ? (
                      <img
                        src={highlight.cover_url || highlight.items?.[0]?.story?.media_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Bookmark className="h-4 w-4" />
                      </div>
                    )}
                    <span className="font-medium">{highlight.title}</span>
                  </button>
                ))}
              </div>
            )}
            
            {/* Create new highlight */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'إنشاء مختصر جديد' : 'Create New Highlight'}
              </p>
              <div className="flex gap-2">
                <Input
                  value={newHighlightName}
                  onChange={(e) => setNewHighlightName(e.target.value)}
                  placeholder={language === 'ar' ? 'اسم المختصر...' : 'Highlight name...'}
                  maxLength={30}
                />
                <Button
                  onClick={handleCreateNewHighlight}
                  disabled={!newHighlightName.trim() || createHighlight.isPending}
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Viewers Sheet */}
      <Sheet open={showViewers} onOpenChange={(open) => {
        setShowViewers(open);
        if (!open) setIsPaused(false);
      }}>
        <SheetContent side="bottom" className="h-[65vh] rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {language === 'ar' ? 'المشاهدات' : 'Story Viewers'}
              <span className="text-muted-foreground font-normal">
                ({currentStory?.views_count || 0})
              </span>
            </SheetTitle>
          </SheetHeader>
          
          {/* Story Preview Thumbnail */}
          <div className="flex items-center gap-3 p-3 mb-3 bg-muted/50 rounded-xl">
            <div className="relative w-16 h-28 rounded-lg overflow-hidden flex-shrink-0 ring-2 ring-primary/20">
              {currentStory?.media_type === 'video' ? (
                <video
                  src={currentStory.media_url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={currentStory?.thumbnail_url || currentStory?.media_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
              {currentStory?.media_type === 'video' && (
                <div className="absolute bottom-1 right-1 bg-black/60 rounded px-1 py-0.5">
                  <Play className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {language === 'ar' ? 'القصة الحالية' : 'Current Story'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {timeAgo}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {currentStory?.views_count || 0}
                </span>
                {currentStory?.media_type === 'video' && videoDuration && (
                  <span className="flex items-center gap-1">
                    <Play className="h-3.5 w-3.5" />
                    {Math.round(videoDuration)}s
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <ScrollArea className="h-[calc(65vh-200px)]">
            {viewersLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'جاري التحميل...' : 'Loading viewers...'}
                </p>
              </div>
            ) : viewers && viewers.length > 0 ? (
              <div className="space-y-1">
                {viewers.map((viewer: any) => {
                  const viewerName = language === 'ar'
                    ? (viewer.profile?.display_name_ar || viewer.profile?.display_name || viewer.profile?.username)
                    : (viewer.profile?.display_name || viewer.profile?.username);
                    
                  const viewedTime = formatDistanceToNow(new Date(viewer.viewed_at), {
                    addSuffix: true,
                    locale: language === 'ar' ? ar : enUS,
                  });
                  
                  return (
                    <button
                      key={viewer.viewer_id}
                      onClick={() => setSelectedViewer(viewer)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-start"
                    >
                      <img
                        src={getAvatarUrl(viewer.profile?.avatar_url)}
                        alt={viewerName || ''}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{viewerName}</p>
                        <p className="text-xs text-muted-foreground">{viewedTime}</p>
                      </div>
                      {viewer.profile?.is_verified && (
                        <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Eye className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'لا توجد مشاهدات بعد' : 'No viewers yet'}
                </p>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
      
      {/* Viewer Profile Sheet */}
      <Sheet open={!!selectedViewer} onOpenChange={(open) => {
        if (!open) setSelectedViewer(null);
      }}>
        <SheetContent side="bottom" className="h-[50vh] rounded-t-2xl">
          {selectedViewer && (() => {
            const profile = selectedViewer.profile;
            const viewerDisplayName = language === 'ar'
              ? (profile?.display_name_ar || profile?.display_name || profile?.username)
              : (profile?.display_name || profile?.username);
            const viewedTime = formatDistanceToNow(new Date(selectedViewer.viewed_at), {
              addSuffix: true,
              locale: language === 'ar' ? ar : enUS,
            });
            
            return (
              <>
                <SheetHeader className="pb-4">
                  <SheetTitle>{language === 'ar' ? 'الملف الشخصي' : 'Profile'}</SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col items-center text-center space-y-4">
                  <img
                    src={getAvatarUrl(profile?.avatar_url)}
                    alt={viewerDisplayName || ''}
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-primary/20"
                  />
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1.5">
                      <h3 className="font-bold text-lg">{viewerDisplayName}</h3>
                      {profile?.is_verified && (
                        <BadgeCheck className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">@{profile?.username}</p>
                  </div>
                  
                  {profile?.bio && (
                    <p className="text-sm text-muted-foreground max-w-xs">{profile.bio}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {profile?.current_location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.current_location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{profile?.followers_count || 0} {language === 'ar' ? 'متابع' : 'followers'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{language === 'ar' ? 'شاهد' : 'Viewed'} {viewedTime}</span>
                  </div>
                  
                  <Link
                    to={`/profile/${profile?.username}`}
                    onClick={() => {
                      setSelectedViewer(null);
                      setShowViewers(false);
                    }}
                  >
                    <Button className="mt-2">
                      {language === 'ar' ? 'عرض الملف الكامل' : 'View Full Profile'}
                    </Button>
                  </Link>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => {
        setShowDeleteConfirm(open);
        if (!open) setIsPaused(false);
      }}>
        <AlertDialogContent className="z-[99999]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'حذف القصة؟' : 'Delete Story?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' 
                ? 'هل أنت متأكد من حذف هذه القصة؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this story? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(false);
              }}
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleDeleteConfirm();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteStory.isPending}
            >
              {deleteStory.isPending 
                ? (language === 'ar' ? 'جاري الحذف...' : 'Deleting...') 
                : (language === 'ar' ? 'حذف' : 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Story Analytics Sheet */}
      <StoryAnalyticsSheet
        storyId={currentStory?.id || ''}
        open={showAnalytics}
        onOpenChange={(open) => {
          setShowAnalytics(open);
          if (!open) setIsPaused(false);
        }}
      />

      {/* Emoji Reactors Sheet - For story owner */}
      <Sheet open={showEmojiReactors} onOpenChange={(open) => {
        setShowEmojiReactors(open);
        if (!open) setIsPaused(false);
      }}>
        <SheetContent side="bottom" className="h-[60vh] z-[99999] max-w-[422px] mx-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {currentStory?.reaction_emoji && (
                <span className="text-2xl">{currentStory.reaction_emoji.emoji}</span>
              )}
              {language === 'ar' ? 'التفاعلات' : 'Reactions'}
            </SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="h-full mt-4 pr-4">
            {!emojiReactors || emojiReactors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <span className="text-4xl mb-3">{currentStory?.reaction_emoji?.emoji || '😊'}</span>
                <p className="text-sm">
                  {language === 'ar' ? 'لا توجد تفاعلات بعد' : 'No reactions yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {emojiReactors.map((reactor) => (
                  <Link
                    key={reactor.id}
                    to={`/profile/${reactor.profile?.username || reactor.user_id}`}
                    onClick={() => {
                      setShowEmojiReactors(false);
                      onClose();
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <img
                      src={getAvatarUrl(reactor.profile?.avatar_url)}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium truncate">
                          {reactor.profile?.display_name || reactor.profile?.username || 'User'}
                        </span>
                        {reactor.profile?.is_verified && (
                          <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      {reactor.profile?.username && (
                        <p className="text-sm text-muted-foreground truncate">
                          @{reactor.profile.username}
                        </p>
                      )}
                    </div>
                    <span className="text-xl">
                      {reactor.emoji}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>,
    document.body
  );
}
