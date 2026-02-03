import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateHighlight, useAddToHighlight, useUserStoriesForHighlights } from '@/hooks/useStoryHighlights';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface CreateHighlightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateHighlightDialog({ open, onOpenChange }: CreateHighlightDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const createHighlight = useCreateHighlight();
  const addToHighlight = useAddToHighlight();
  const { data: stories, isLoading: loadingStories } = useUserStoriesForHighlights();
  
  const [title, setTitle] = useState('');
  const [selectedStoryIds, setSelectedStoryIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  
  const toggleStory = (storyId: string) => {
    setSelectedStoryIds(prev => {
      const next = new Set(prev);
      if (next.has(storyId)) {
        next.delete(storyId);
      } else {
        next.add(storyId);
      }
      return next;
    });
  };
  
  const handleCreate = async () => {
    if (!title.trim()) {
      toast({
        title: language === 'ar' ? 'مطلوب' : 'Required',
        description: language === 'ar' ? 'يرجى إدخال عنوان' : 'Please enter a title',
        variant: 'destructive',
      });
      return;
    }
    
    if (selectedStoryIds.size === 0) {
      toast({
        title: language === 'ar' ? 'مطلوب' : 'Required',
        description: language === 'ar' ? 'اختر قصة واحدة على الأقل' : 'Select at least one story',
        variant: 'destructive',
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Create the highlight
      const highlight = await createHighlight.mutateAsync({
        title: title.trim(),
        coverUrl: stories?.find(s => selectedStoryIds.has(s.id))?.media_url,
      });
      
      // Add selected stories to the highlight
      for (const storyId of selectedStoryIds) {
        await addToHighlight.mutateAsync({
          highlightId: highlight.id,
          storyId,
        });
      }
      
      toast({
        title: language === 'ar' ? 'تم الإنشاء' : 'Created',
        description: language === 'ar' ? 'تم إنشاء المختصر بنجاح' : 'Highlight created successfully',
      });
      
      // Reset and close
      setTitle('');
      setSelectedStoryIds(new Set());
      onOpenChange(false);
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: String(error),
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'إنشاء مختصر' : 'Create Highlight'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Title Input */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              {language === 'ar' ? 'العنوان' : 'Title'}
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={language === 'ar' ? 'أدخل عنوان المختصر...' : 'Enter highlight title...'}
              maxLength={30}
            />
          </div>
          
          {/* Stories Selection */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              {language === 'ar' ? 'اختر القصص' : 'Select Stories'} 
              {selectedStoryIds.size > 0 && ` (${selectedStoryIds.size})`}
            </label>
            
            {loadingStories ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !stories || stories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{language === 'ar' ? 'لا توجد قصص' : 'No stories available'}</p>
                <p className="text-xs mt-1">
                  {language === 'ar' ? 'قم بإنشاء قصص لإضافتها للمختصرات' : 'Create stories to add them to highlights'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 overflow-y-auto flex-1 pb-2">
                {stories.map((story) => {
                  const isSelected = selectedStoryIds.has(story.id);
                  const timeAgo = formatDistanceToNow(new Date(story.created_at), {
                    addSuffix: false,
                    locale: language === 'ar' ? ar : enUS,
                  });
                  
                  return (
                    <button
                      key={story.id}
                      onClick={() => toggleStory(story.id)}
                      className={cn(
                        "relative aspect-[9/16] rounded-lg overflow-hidden border-2 transition-all",
                        isSelected ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-muted"
                      )}
                    >
                      {story.media_type === 'video' ? (
                        <video
                          src={story.media_url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={story.media_url}
                          alt=""
                          className="w-full h-full object-cover"
                          style={{ filter: story.filter || undefined }}
                        />
                      )}
                      
                      {/* Selection indicator */}
                      <div className={cn(
                        "absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-black/50 border border-white/50"
                      )}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      
                      {/* Time badge */}
                      <div className="absolute bottom-1 left-1 right-1 text-center">
                        <span className="text-[10px] text-white bg-black/50 px-1.5 py-0.5 rounded">
                          {timeAgo}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Create Button */}
          <Button
            onClick={handleCreate}
            disabled={isCreating || !title.trim() || selectedStoryIds.size === 0}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin me-2" />
                {language === 'ar' ? 'جاري الإنشاء...' : 'Creating...'}
              </>
            ) : (
              language === 'ar' ? 'إنشاء المختصر' : 'Create Highlight'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
