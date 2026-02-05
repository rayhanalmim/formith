/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatePost } from '@/hooks/usePosts';
import { useCreatePoll } from '@/hooks/usePolls';
import { useCategories } from '@/hooks/useCategories';
import { useCurrentUserProfile } from '@/hooks/useProfile';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useSavedLocations } from '@/hooks/useSavedLocations';
import { MentionInput } from '@/components/ui/mention-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ImagePlus, X, Loader2, MapPin, Smile, Navigation, TrendingUp, Film, History, BarChart2, Wand2 } from 'lucide-react';
import { PollCreator, type PollData } from '@/components/polls/PollCreator';
import { StickerPicker } from '@/components/stickers/StickerPicker';
import { useToast } from '@/hooks/use-toast';
import { doClient } from '@/lib/do-client';
import { usePostMediaUpload } from '@/hooks/useFileUpload';
import { useBackgroundRemoval } from '@/hooks/useBackgroundRemoval';
import { compressImage, blobToFile, isImageFile, isGifFile, formatFileSize } from '@/lib/image-compression';
import { getAvatarUrl } from '@/lib/default-images';
import { getCategoryIcon } from '@/lib/category-icons';

interface SelectedFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

interface CreatePostCardProps {
  onPostSuccess?: (postId?: string) => void;
}

export function CreatePostCard({ onPostSuccess }: CreatePostCardProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createPost = useCreatePost();
  const createPoll = useCreatePoll();
  const { data: categories } = useCategories();
  const { data: profile } = useCurrentUserProfile();
  const isAdmin = useIsAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [feeling, setFeeling] = useState<string>('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [showFeelingPicker, setShowFeelingPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pollData, setPollData] = useState<PollData | null>(null);
  const [processingBgRemoval, setProcessingBgRemoval] = useState<number | null>(null);
  
  const { mutateAsync: uploadMedia } = usePostMediaUpload();
  const { removeBackground, isProcessing: isRemovingBg } = useBackgroundRemoval();
  
  // Fetch saved locations from database based on user input
  const { data: savedLocations = [] } = useSavedLocations(location);

  // Combine saved locations with popular suggestions, prioritizing saved ones
  const popularLocations = language === 'ar' ? [
    'الرياض، السعودية',
    'جدة، السعودية',
    'دبي، الإمارات',
    'القاهرة، مصر',
    'عمّان، الأردن',
    'الكويت',
    'الدوحة، قطر',
    'مسقط، عمان',
  ] : [
    'New York, USA',
    'London, UK',
    'Dubai, UAE',
    'Riyadh, Saudi Arabia',
    'Cairo, Egypt',
    'Paris, France',
    'Tokyo, Japan',
    'Singapore',
  ];

  // Filter and combine suggestions - saved locations first, then popular ones
  const filteredSavedLocations = location.trim()
    ? savedLocations.filter(loc => 
        loc.toLowerCase().includes(location.toLowerCase())
      )
    : savedLocations;

  const filteredPopularLocations = location.trim() 
    ? popularLocations.filter(loc => 
        loc.toLowerCase().includes(location.toLowerCase()) &&
        !filteredSavedLocations.includes(loc)
      )
    : popularLocations.filter(loc => !savedLocations.includes(loc));

  // Detect user's location using browser geolocation
  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast({
        title: language === 'ar' ? 'غير مدعوم' : 'Not Supported',
        description: language === 'ar' 
          ? 'متصفحك لا يدعم تحديد الموقع' 
          : 'Your browser does not support geolocation',
        variant: 'destructive',
      });
      return;
    }

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use reverse geocoding API (free, no API key needed)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json&accept-language=${language}`
          );
          const data = await response.json();
          
          if (data && data.address) {
            const { city, town, village, state, country } = data.address;
            const locationName = [city || town || village, state || country]
              .filter(Boolean)
              .join(', ');
            setLocation(locationName || (language === 'ar' ? 'موقع غير معروف' : 'Unknown location'));
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          setLocation(
            `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
          );
        }
        setIsDetectingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: language === 'ar' ? 'خطأ' : 'Error',
          description: language === 'ar' 
            ? 'تعذر تحديد موقعك. تأكد من السماح بالوصول للموقع.' 
            : 'Could not detect your location. Please allow location access.',
          variant: 'destructive',
        });
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [language, toast]);

  // Feelings list
  const feelings = [
    { emoji: '😊', label: language === 'ar' ? 'سعيد' : 'Happy' },
    { emoji: '😢', label: language === 'ar' ? 'حزين' : 'Sad' },
    { emoji: '😡', label: language === 'ar' ? 'غاضب' : 'Angry' },
    { emoji: '😍', label: language === 'ar' ? 'متيم' : 'In Love' },
    { emoji: '😎', label: language === 'ar' ? 'رائع' : 'Cool' },
    { emoji: '🤔', label: language === 'ar' ? 'متفكر' : 'Thinking' },
    { emoji: '😴', label: language === 'ar' ? 'نعسان' : 'Sleepy' },
    { emoji: '🎉', label: language === 'ar' ? 'محتفل' : 'Celebrating' },
    { emoji: '😤', label: language === 'ar' ? 'محبط' : 'Frustrated' },
    { emoji: '🥰', label: language === 'ar' ? 'ممتن' : 'Grateful' },
    { emoji: '💪', label: language === 'ar' ? 'متحمس' : 'Motivated' },
    { emoji: '😌', label: language === 'ar' ? 'مرتاح' : 'Relaxed' },
  ];

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = 4 - selectedFiles.length;
    if (files.length > remaining) {
      toast({
        title: language === 'ar' ? 'الحد الأقصى للملفات' : 'Max files limit',
        description: language === 'ar' 
          ? `يمكنك إضافة ${remaining} ملفات فقط` 
          : `You can only add ${remaining} more files`,
        variant: 'destructive',
      });
      return;
    }

    // Create previews
    const newFiles: SelectedFile[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: language === 'ar' ? 'يجب تسجيل الدخول' : 'Login required',
        description: language === 'ar' ? 'سجل دخولك لنشر منشور جديد' : 'Login to create a post',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }

    if (!content.trim() && selectedFiles.length === 0 && !pollData) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Create optimistic post data
    const optimisticPost = {
      id: `temp-${Date.now()}`,
      user_id: user.id,
      content: content.trim() || (language === 'ar' ? 'صورة' : 'Photo'),
      slug: null,
      category_id: categoryId || null,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      views_count: 0,
      is_approved: true,
      is_pinned: false,
      is_locked: false,
      is_hidden: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile: {
        id: profile?.id || '',
        user_id: user.id,
        username: profile?.username || '',
        display_name: profile?.display_name || '',
        display_name_ar: profile?.display_name_ar || '',
        avatar_url: profile?.avatar_url || null,
        is_verified: profile?.is_verified || false,
      },
      category: categoryId && categories ? categories.find(c => c.id === categoryId) || null : null,
      media: selectedFiles.map((f, i) => ({
        id: `temp-media-${i}`,
        media_url: f.preview,
        media_type: f.type,
        sort_order: i,
      })),
      user_liked: false,
      user_bookmarked: false,
      repost_of_id: null,
      quote_content: null,
      location: location.trim() || null,
      feeling: feeling || null,
    };

    // Add optimistic update to all infinite-posts queries
    queryClient.setQueriesData<any>(
      { queryKey: ['infinite-posts'] },
      (oldData: any) => {
        if (!oldData?.pages) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any, index: number) => {
            if (index === 0) {
              const exists = page.posts?.some((p: any) => p.id === optimisticPost.id);
              if (exists) return page;
              return {
                ...page,
                posts: [optimisticPost, ...(page.posts || [])],
              };
            }
            return page;
          }),
        };
      }
    );

    // Clear form immediately for responsive UX
    const savedContent = content;
    const savedCategoryId = categoryId;
    const savedLocation = location;
    const savedFeeling = feeling;
    const savedFiles = [...selectedFiles];
    const savedPollData = pollData;
    
    setContent('');
    setCategoryId('');
    setLocation('');
    setFeeling('');
    setShowLocationInput(false);
    setShowFeelingPicker(false);
    setIsFocused(false);
    setSelectedFiles([]);
    setPollData(null);

    try {
      let uploadedUrls: string[] = [];

      // Upload media if any files are selected
      if (savedFiles.length > 0) {
        const filesToUpload: File[] = [];
        
        for (const mediaFile of savedFiles) {
          if (isImageFile(mediaFile.file)) {
            try {
              const compressedBlob = await compressImage(mediaFile.file, {
                maxWidth: 1920,
                maxHeight: 1920,
                quality: 0.85,
                outputType: 'webp',
              });
              const compressedFile = blobToFile(compressedBlob, mediaFile.file.name);
              console.log(`Compressed ${mediaFile.file.name}: ${formatFileSize(mediaFile.file.size)} → ${formatFileSize(compressedFile.size)}`);
              filesToUpload.push(compressedFile);
            } catch (error) {
              console.error('Compression failed, using original:', error);
              filesToUpload.push(mediaFile.file);
            }
          } else {
            filesToUpload.push(mediaFile.file);
          }
        }

        setUploadProgress(20);
        const results = await uploadMedia(filesToUpload);
        uploadedUrls = results.map(r => r.url);
        setUploadProgress(60);
      }

      // Create the post with profile data for optimistic update
      const selectedCategory = savedCategoryId && categories 
        ? categories.find(c => c.id === savedCategoryId) 
        : null;
        
      const post = await createPost.mutateAsync({
        content: savedContent.trim() || (savedPollData ? savedPollData.question : (language === 'ar' ? 'صورة' : 'Photo')),
        categoryId: savedCategoryId || undefined,
        location: savedLocation.trim() || undefined,
        feeling: savedFeeling || undefined,
        userProfile: profile ? {
          id: profile.id,
          user_id: user.id,
          username: profile.username || null,
          display_name: profile.display_name || null,
          display_name_ar: profile.display_name_ar || null,
          avatar_url: profile.avatar_url || null,
          is_verified: profile.is_verified || null,
        } : null,
        category: selectedCategory ? {
          id: selectedCategory.id,
          name_ar: selectedCategory.name_ar,
          name_en: selectedCategory.name_en,
          slug: selectedCategory.slug,
        } : null,
      });
      
      setUploadProgress(80);

      // If we have uploaded media, insert them into post_media table
      if (uploadedUrls.length > 0 && post) {
        const mediaInserts = uploadedUrls.map((url, index) => ({
          id: crypto.randomUUID(),
          post_id: post.id,
          media_url: url,
          media_type: url.match(/\.(mp4|webm)$/i) ? 'video' : 'image',
          sort_order: index,
        }));

        // Insert media into DO - doClient throws on error
        try {
          await doClient.from('post_media').insert(mediaInserts);
        } catch (mediaError) {
          console.error('Failed to insert media:', mediaError);
        }
      }

      // Create poll if poll data exists
      if (savedPollData && post) {
        try {
          await createPoll.mutateAsync({
            postId: post.id,
            question: savedPollData.question,
            pollType: savedPollData.pollType,
            goal: savedPollData.goal || undefined,
            endsAt: savedPollData.endsAt,
            options: savedPollData.options,
          });
        } catch (pollError) {
          console.error('Failed to create poll:', pollError);
        }
      }

      setUploadProgress(100);
      
      // Cleanup previews
      savedFiles.forEach(f => URL.revokeObjectURL(f.preview));
      
      // Show toast
      toast({
        title: language === 'ar' ? 'تم النشر بنجاح' : 'Posted successfully',
      });
      
      // Scroll to top to see the new post with highlight
      onPostSuccess?.(post.id);
      
      // Invalidate queries to replace optimistic post with real data (with real media URLs)
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['infinite-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      
    } catch (error) {
      console.error('Post creation error:', error);
      
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['infinite-posts'] });
      
      toast({
        title: language === 'ar' ? 'حدث خطأ' : 'Error occurred',
        description: String(error),
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const avatarUrl = getAvatarUrl(profile?.avatar_url);

  return (
    <div className="glass-card p-4 mb-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
          {user ? (
            <img 
              src={avatarUrl} 
              alt="" 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-primary-foreground font-semibold text-sm">?</span>
          )}
        </div>
        
        <div className="flex-1">
          <MentionInput
            placeholder={user 
              ? (language === 'ar' ? 'ماذا يدور في ذهنك؟ استخدم @ للإشارة للمستخدمين' : "What's on your mind? Use @ to mention users")
              : (language === 'ar' ? 'سجل دخولك للنشر...' : 'Login to post...')
            }
            value={content}
            onChange={setContent}
            onFocus={() => {
              if (!user) {
                navigate('/auth');
                return;
              }
              setIsFocused(true);
            }}
            onBlur={() => !content && selectedFiles.length === 0 && setIsFocused(false)}
            className="min-h-[60px] resize-none border-none bg-transparent p-0 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/60"
            disabled={!user}
            data-create-post-input
          />

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading || createPost.isPending}
          />

          {/* Selected media preview */}
          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-muted group">
                  {file.type === 'image' ? (
                    <img src={file.preview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center relative">
                      <Film className="h-8 w-8 text-muted-foreground absolute z-10" />
                      <video src={file.preview} className="w-full h-full object-cover" muted />
                    </div>
                  )}
                  {!isUploading && (
                    <div className="absolute top-1 right-1 flex gap-1">
                      {/* Background removal button for images */}
                      {file.type === 'image' && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={async () => {
                            setProcessingBgRemoval(index);
                            const resultUrl = await removeBackground(file.file);
                            if (resultUrl) {
                              // Convert base64 to blob and create new file
                              const response = await fetch(resultUrl);
                              const blob = await response.blob();
                              const newFile = new File([blob], file.file.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' });
                              const newPreview = URL.createObjectURL(blob);
                              
                              setSelectedFiles(prev => {
                                const updated = [...prev];
                                URL.revokeObjectURL(updated[index].preview);
                                updated[index] = { file: newFile, preview: newPreview, type: 'image' };
                                return updated;
                              });
                            }
                            setProcessingBgRemoval(null);
                          }}
                          disabled={processingBgRemoval === index}
                          title={language === 'ar' ? 'إزالة الخلفية' : 'Remove background'}
                        >
                          {processingBgRemoval === index ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Wand2 className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeSelectedFile(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Upload progress */}
          {isUploading && (
            <div className="mt-3 space-y-1">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {language === 'ar' ? 'جاري النشر...' : 'Posting...'} {uploadProgress}%
              </p>
            </div>
          )}
          
          {/* Location & Feeling display */}
          {(location || feeling) && (
            <div className="flex items-center flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              {location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{location}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-destructive/10"
                    onClick={() => {
                      setLocation('');
                      setShowLocationInput(false);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              {feeling && (
                <div className="flex items-center gap-1">
                  <span>{feelings.find(f => f.label === feeling)?.emoji || '😊'}</span>
                  <span>{feeling}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-destructive/10"
                    onClick={() => {
                      setFeeling('');
                      setShowFeelingPicker(false);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Poll Preview */}
          {pollData && (
            <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{pollData.question}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => setPollData(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {pollData.goal && (
                <p className="text-xs text-muted-foreground mb-2">
                  {language === 'ar' ? 'الهدف:' : 'Goal:'} {pollData.goal}
                </p>
              )}
              <div className="space-y-1">
                {pollData.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {opt.emoji && <span>{opt.emoji}</span>}
                    <span className="text-muted-foreground">{opt.text}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {pollData.pollType === 'single' 
                  ? (language === 'ar' ? 'اختيار واحد' : 'Single choice')
                  : (language === 'ar' ? 'اختيارات متعددة' : 'Multiple choice')}
              </p>
            </div>
          )}
          
          {/* Media Options */}
          <div className={`flex flex-wrap items-center gap-2 pt-3 border-t border-border/50 mt-3 transition-all ${isFocused || content ? 'opacity-100' : 'opacity-60'}`}>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button 
                type="button"
                variant="ghost" 
                size="icon" 
                className={`h-9 w-9 hover:bg-primary/10 ${selectedFiles.length > 0 ? 'text-primary' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                disabled={!user || selectedFiles.length >= 4 || isUploading}
              >
                <ImagePlus className="h-5 w-5" />
              </Button>
              
              {/* Location Picker */}
              <Popover open={showLocationInput} onOpenChange={setShowLocationInput}>
                <PopoverTrigger asChild>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    className={`h-9 w-9 hover:bg-primary/10 ${location ? 'text-primary' : 'text-muted-foreground'}`}
                    disabled={!user}
                  >
                    <MapPin className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
              <PopoverContent className="w-72 p-3 glass-card" align="start">
                  <div className="space-y-3">
                    <label className="text-xs font-medium">
                      {language === 'ar' ? 'أضف موقعك' : 'Add your location'}
                    </label>
                    
                    {/* Detect Location Button */}
                    <Button 
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={detectLocation}
                      disabled={isDetectingLocation}
                    >
                      {isDetectingLocation ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Navigation className="h-4 w-4" />
                      )}
                      {language === 'ar' ? 'تحديد موقعي تلقائياً' : 'Detect my location'}
                    </Button>

                    <div className="relative">
                      <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder={language === 'ar' ? 'ابحث أو اكتب الموقع...' : 'Search or type location...'}
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* Saved Locations from DB */}
                    {filteredSavedLocations.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <History className="h-3 w-3" />
                          <span>{language === 'ar' ? 'مواقع محفوظة' : 'Saved locations'}</span>
                        </div>
                        <div className="max-h-24 overflow-y-auto space-y-1">
                          {filteredSavedLocations.slice(0, 5).map((loc) => (
                            <button
                              key={loc}
                              type="button"
                              className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-primary/10 transition-colors flex items-center gap-2"
                              onClick={() => {
                                setLocation(loc);
                              }}
                            >
                              <MapPin className="h-3 w-3 text-primary flex-shrink-0" />
                              <span className="truncate">{loc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Popular Location Suggestions */}
                    {filteredPopularLocations.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingUp className="h-3 w-3" />
                          <span>{language === 'ar' ? 'مواقع شائعة' : 'Popular locations'}</span>
                        </div>
                        <div className="max-h-24 overflow-y-auto space-y-1">
                          {filteredPopularLocations.slice(0, 5).map((loc) => (
                            <button
                              key={loc}
                              type="button"
                              className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-primary/10 transition-colors flex items-center gap-2"
                              onClick={() => {
                                setLocation(loc);
                              }}
                            >
                              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">{loc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => setShowLocationInput(false)}
                    >
                      {language === 'ar' ? 'تم' : 'Done'}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Feeling Picker */}
              <Popover open={showFeelingPicker} onOpenChange={setShowFeelingPicker}>
                <PopoverTrigger asChild>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    className={`h-9 w-9 hover:bg-primary/10 ${feeling ? 'text-primary' : 'text-muted-foreground'}`}
                    disabled={!user}
                  >
                    <Smile className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3 glass-card" align="start">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">
                      {language === 'ar' ? 'كيف تشعر؟' : 'How are you feeling?'}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {feelings.map((f) => (
                        <button
                          key={f.label}
                          type="button"
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all hover:bg-primary/20 ${feeling === f.label ? 'bg-primary/20 ring-1 ring-primary' : ''}`}
                          onClick={() => {
                            setFeeling(f.label);
                            setShowFeelingPicker(false);
                          }}
                        >
                          <span className="text-xl">{f.emoji}</span>
                          <span className="text-[10px] text-muted-foreground truncate w-full text-center">{f.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Poll Creator */}
              <PollCreator
                onPollCreate={(poll) => setPollData(poll)}
                trigger={
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    className={`h-9 w-9 hover:bg-primary/10 ${pollData ? 'text-primary' : ''}`}
                    disabled={!user || isUploading}
                  >
                    <BarChart2 className="h-5 w-5" />
                  </Button>
                }
              />
              
              {/* Sticker Picker */}
              <StickerPicker
                onSelect={(sticker) => setContent(prev => prev + sticker)}
                disabled={!user || isUploading}
              />
              
              {/* Category Selector */}
              {categories && categories.length > 0 && (
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-auto min-w-[120px] max-w-[180px] h-9 text-xs bg-muted/50">
                    <SelectValue placeholder={language === 'ar' ? 'اختر القسم' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent className="glass-card max-h-[300px]">
                    {/* Sort categories: Announcements & News first (admin only), then by posts_count (trending) */}
                    {categories
                      .filter(cat => {
                        // Show categories with allow_posting = true for everyone
                        // Show Announcements and News only to admins/managers
                        if (cat.slug === 'announcements' || cat.slug === 'news') {
                          return isAdmin.data;
                        }
                        return cat.allow_posting;
                      })
                      .sort((a, b) => {
                        // Announcements always first, then News
                        if (a.slug === 'announcements') return -1;
                        if (b.slug === 'announcements') return 1;
                        if (a.slug === 'news') return -1;
                        if (b.slug === 'news') return 1;
                        // Then sort by posts_count (trending)
                        return (b.posts_count || 0) - (a.posts_count || 0);
                      })
                      .map(cat => (
                        <SelectItem 
                          key={cat.id} 
                          value={cat.id} 
                          className={(cat.slug === 'announcements' || cat.slug === 'news') ? 'text-primary font-medium' : ''}
                        >
                          <span className="flex items-center gap-2">
                            <span>{getCategoryIcon(cat.slug)}</span>
                            <span>{language === 'ar' ? cat.name_ar : cat.name_en}</span>
                            {(cat.posts_count || 0) > 0 && (
                              <span className="text-[10px] text-muted-foreground">({cat.posts_count})</span>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <Button 
              disabled={(!content.trim() && selectedFiles.length === 0 && !pollData) || createPost.isPending || isUploading} 
              className="neon-glow px-4 sm:px-6 ml-auto"
              onClick={handleSubmit}
            >
              {(createPost.isPending || isUploading) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('forum.newPost')
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
