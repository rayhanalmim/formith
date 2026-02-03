import { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMentionSearch, type MentionUser } from '@/hooks/useMentions';
import { useHashtagSearch, type HashtagSuggestion } from '@/hooks/useHashtagSearch';
import { useTrendingHashtags } from '@/hooks/useTrendingHashtags';
import { useRecentlyUsedHashtags } from '@/hooks/useRecentlyUsedHashtags';
import { Textarea } from '@/components/ui/textarea';
import { BadgeCheck, Loader2, Hash, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minHeight?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  'data-create-post-input'?: boolean;
}

export function MentionInput({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  minHeight = '60px',
  onFocus,
  onBlur,
  'data-create-post-input': dataCreatePostInput,
}: MentionInputProps) {
  const { language } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const [suggestionType, setSuggestionType] = useState<'mention' | 'hashtag'>('mention');
  const [hashtagQuery, setHashtagQuery] = useState('');
  const [hashtagStartIndex, setHashtagStartIndex] = useState<number | null>(null);

  // Enable mention search even when query is empty (to show followers/following)
  const { data: mentionSuggestions, isLoading: isLoadingMentions } = useMentionSearch(mentionQuery, showSuggestions && suggestionType === 'mention');
  const { data: hashtagSuggestions, isLoading: isLoadingHashtags } = useHashtagSearch(hashtagQuery, showSuggestions && suggestionType === 'hashtag');
  const { data: trendingHashtags, isLoading: isLoadingTrending } = useTrendingHashtags(8);
  const { data: recentHashtags } = useRecentlyUsedHashtags(5);

  // Show trending and recent when query is empty, otherwise show search results
  const showTrending = suggestionType === 'hashtag' && hashtagQuery.length === 0;
  const displayHashtags: HashtagSuggestion[] = showTrending 
    ? (trendingHashtags?.map(t => ({ hashtag: t.hashtag.replace(/^#/, ''), post_count: t.post_count })) || [])
    : (hashtagSuggestions || []);
  const recentHashtagsList: HashtagSuggestion[] = showTrending && recentHashtags
    ? recentHashtags.map(t => ({ hashtag: t.hashtag, post_count: t.use_count }))
    : [];
  const isLoadingHashtagData = showTrending ? isLoadingTrending : isLoadingHashtags;

  // Calculate popover position based on cursor
  const updatePopoverPosition = useCallback(() => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const rect = textarea.getBoundingClientRect();
    
    // Simple positioning - show below the textarea
    setPopoverPosition({
      top: rect.height + 4,
      left: 0,
    });
  }, []);

  // Detect @ mentions and # hashtags while typing
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    onChange(newValue);
    
    // Find if we're in a mention context
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    
    // Check for @ mentions
    if (lastAtIndex !== -1 && lastAtIndex > lastHashIndex) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Check if there's no space after @ (still typing the mention)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionQuery(textAfterAt);
        setMentionStartIndex(lastAtIndex);
        setSuggestionType('mention');
        setShowSuggestions(true);
        setSelectedIndex(0);
        updatePopoverPosition();
        return;
      }
    }
    
    // Check for # hashtags
    if (lastHashIndex !== -1 && lastHashIndex > lastAtIndex) {
      const textAfterHash = textBeforeCursor.slice(lastHashIndex + 1);
      // Check if there's no space after # (still typing the hashtag)
      if (!textAfterHash.includes(' ') && !textAfterHash.includes('\n')) {
        setHashtagQuery(textAfterHash);
        setHashtagStartIndex(lastHashIndex);
        setSuggestionType('hashtag');
        setShowSuggestions(true);
        setSelectedIndex(0);
        updatePopoverPosition();
        return;
      }
    }
    
    setShowSuggestions(false);
    setMentionQuery('');
    setHashtagQuery('');
    setMentionStartIndex(null);
    setHashtagStartIndex(null);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const currentSuggestions = suggestionType === 'mention' ? mentionSuggestions : hashtagSuggestions;
    const isLoading = suggestionType === 'mention' ? isLoadingMentions : isLoadingHashtags;
    
    if (!showSuggestions || !currentSuggestions || currentSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < currentSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev > 0 ? prev - 1 : currentSuggestions.length - 1
        );
        break;
      case 'Enter':
        if (showSuggestions && currentSuggestions[selectedIndex]) {
          e.preventDefault();
          if (suggestionType === 'mention') {
            selectMention(currentSuggestions[selectedIndex] as MentionUser);
          } else {
            selectHashtag(currentSuggestions[selectedIndex] as HashtagSuggestion);
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        break;
      case 'Tab':
        if (showSuggestions && currentSuggestions[selectedIndex]) {
          e.preventDefault();
          if (suggestionType === 'mention') {
            selectMention(currentSuggestions[selectedIndex] as MentionUser);
          } else {
            selectHashtag(currentSuggestions[selectedIndex] as HashtagSuggestion);
          }
        }
        break;
    }
  };

  // Insert the selected mention
  const selectMention = (user: MentionUser) => {
    if (mentionStartIndex === null || !user.username) return;

    const beforeMention = value.slice(0, mentionStartIndex);
    const afterMention = value.slice(
      mentionStartIndex + 1 + mentionQuery.length
    );
    
    const newValue = `${beforeMention}@${user.username} ${afterMention}`;
    onChange(newValue);
    
    setShowSuggestions(false);
    setMentionQuery('');
    setMentionStartIndex(null);
    
    // Focus back on textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mentionStartIndex + user.username.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Insert the selected hashtag
  const selectHashtag = (hashtag: HashtagSuggestion) => {
    if (hashtagStartIndex === null || !hashtag.hashtag) return;

    const beforeHashtag = value.slice(0, hashtagStartIndex);
    const afterHashtag = value.slice(
      hashtagStartIndex + 1 + hashtagQuery.length
    );
    
    const newValue = `${beforeHashtag}#${hashtag.hashtag} ${afterHashtag}`;
    onChange(newValue);
    
    setShowSuggestions(false);
    setHashtagQuery('');
    setHashtagStartIndex(null);
    
    // Focus back on textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = hashtagStartIndex + hashtag.hashtag.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(className)}
        style={{ minHeight }}
        data-create-post-input={dataCreatePostInput ? 'true' : undefined}
      />
      
      {/* Mention/Hashtag Suggestions Popover */}
      {showSuggestions && (suggestionType === 'mention' || suggestionType === 'hashtag') && (
        <div
          ref={popoverRef}
          className="absolute z-50 w-full max-w-xs bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
          style={{
            top: popoverPosition.top,
            left: popoverPosition.left,
          }}
        >
          {suggestionType === 'mention' ? (
            <>
              {isLoadingMentions ? (
                <div className="flex items-center justify-center p-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : mentionSuggestions && mentionSuggestions.length > 0 ? (
                <div className="py-1 max-h-48 overflow-y-auto">
                  {mentionSuggestions.map((user, index) => (
                    <button
                      key={user.user_id}
                      type="button"
                      className={cn(
                        'flex items-center gap-3 w-full px-3 py-2 text-sm text-start transition-colors',
                        index === selectedIndex
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-muted'
                      )}
                      onClick={() => selectMention(user)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <img
                        src={user.avatar_url || '/images/default-avatar.png'}
                        alt=""
                        className="w-7 h-7 rounded-full bg-muted"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-medium truncate">
                            {language === 'ar'
                              ? (user.display_name_ar || user.display_name || user.username)
                              : (user.display_name || user.username)}
                          </span>
                          {user.is_verified && (
                            <BadgeCheck className="h-3.5 w-3.5 verified-badge flex-shrink-0" />
                          )}
                          {user.is_recent && (
                            <Clock className="h-3.5 w-3.5 text-warning flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">@{user.username}</span>
                          {user.is_following && user.follows_you && (
                            <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                              {language === 'ar' ? 'متبادل' : 'Mutual'}
                            </span>
                          )}
                          {user.is_following && !user.follows_you && (
                            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                              {language === 'ar' ? 'تتابعه' : 'Following'}
                            </span>
                          )}
                          {!user.is_following && user.follows_you && (
                            <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full">
                              {language === 'ar' ? 'يتابعك' : 'Follows you'}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  {language === 'ar' ? 'لم يتم العثور على مستخدمين' : 'No users found'}
                </div>
              )}
            </>
          ) : suggestionType === 'hashtag' ? (
            <>
              {isLoadingHashtagData ? (
                <div className="flex items-center justify-center p-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {/* Recently used hashtags section */}
                  {showTrending && recentHashtagsList.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
                        <Clock className="h-3.5 w-3.5 text-warning" />
                        <span className="text-xs font-medium text-muted-foreground">
                          {language === 'ar' ? 'استخدمتها مؤخراً' : 'Recently Used'}
                        </span>
                      </div>
                      <div className="py-1">
                        {recentHashtagsList.map((hashtag, index) => (
                          <button
                            key={`recent-${hashtag.hashtag}`}
                            type="button"
                            className={cn(
                              'flex items-center gap-3 w-full px-3 py-2 text-sm text-start transition-colors',
                              index === selectedIndex
                                ? 'bg-accent text-accent-foreground'
                                : 'hover:bg-muted'
                            )}
                            onClick={() => selectHashtag(hashtag)}
                            onMouseEnter={() => setSelectedIndex(index)}
                          >
                            <Clock className="h-4 w-4 text-warning" />
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                              <span className="font-medium truncate">#{hashtag.hashtag}</span>
                              <span className="text-xs text-muted-foreground">
                                {hashtag.post_count}x
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {/* Trending header when showing trending */}
                  {showTrending && displayHashtags.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium text-muted-foreground">
                        {language === 'ar' ? 'الهاشتاقات الرائجة' : 'Trending Hashtags'}
                      </span>
                    </div>
                  )}
                  {displayHashtags.length > 0 && (
                    <div className="py-1">
                      {displayHashtags.map((hashtag, index) => {
                        const adjustedIndex = showTrending ? index + recentHashtagsList.length : index;
                        return (
                          <button
                            key={hashtag.hashtag}
                            type="button"
                            className={cn(
                              'flex items-center gap-3 w-full px-3 py-2 text-sm text-start transition-colors',
                              adjustedIndex === selectedIndex
                                ? 'bg-accent text-accent-foreground'
                                : 'hover:bg-muted'
                            )}
                            onClick={() => selectHashtag(hashtag)}
                            onMouseEnter={() => setSelectedIndex(adjustedIndex)}
                          >
                            {showTrending ? (
                              <div className="flex items-center justify-center w-5 h-5 rounded bg-primary/10">
                                <span className="text-xs font-bold text-primary">{index + 1}</span>
                              </div>
                            ) : (
                              <Hash className="h-4 w-4 text-primary" />
                            )}
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                              <span className="font-medium truncate">#{hashtag.hashtag}</span>
                              <span className="text-xs text-muted-foreground">
                                {hashtag.post_count} {language === 'ar' ? 'منشور' : 'posts'}
                              </span>
                            </div>
                            {showTrending && (
                              <TrendingUp className="h-3.5 w-3.5 text-success flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {!showTrending && hashtagQuery.length > 0 && displayHashtags.length === 0 && (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      {language === 'ar' ? 'لا توجد هاشتاقات' : 'No hashtags found'}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
