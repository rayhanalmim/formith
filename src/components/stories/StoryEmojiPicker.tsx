import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StoryEmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

// Popular emoji categories
const EMOJI_CATEGORIES = {
  smileys: {
    label: '😀',
    labelAr: 'وجوه',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊',
      '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋',
      '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🫢', '🫣', '🤫',
      '🤔', '🫡', '🤐', '🤨', '😐', '😑', '😶', '🫥', '😏', '😒',
      '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒',
      '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠',
      '🥳', '🥸', '😎', '🤓', '🧐', '😕', '🫤', '😟', '🙁', '☹️',
      '😮', '😯', '😲', '😳', '🥺', '🥹', '😦', '😧', '😨', '😰',
      '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫',
      '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩',
    ],
  },
  hearts: {
    label: '❤️',
    labelAr: 'قلوب',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
      '💟', '♥️', '🫶', '🩷', '🩵', '🩶',
    ],
  },
  gestures: {
    label: '👋',
    labelAr: 'إيماءات',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲', '🫳', '🫴', '👌',
      '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉',
      '👆', '🖕', '👇', '☝️', '🫵', '👍', '👎', '✊', '👊', '🤛',
      '🤜', '👏', '🙌', '🫶', '👐', '🤲', '🤝', '🙏', '✍️', '💅',
      '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠',
    ],
  },
  animals: {
    label: '🐶',
    labelAr: 'حيوانات',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨',
      '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
      '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇',
      '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞',
      '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢',
    ],
  },
  food: {
    label: '🍕',
    labelAr: 'طعام',
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐',
      '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑',
      '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅',
      '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳',
      '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔',
      '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗',
    ],
  },
  activities: {
    label: '⚽',
    labelAr: 'أنشطة',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
      '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
      '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷',
      '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️',
      '🤺', '🤾', '🏌️', '🏇', '⛳', '🧘', '🏄', '🏊', '🤽', '🚣',
    ],
  },
  travel: {
    label: '✈️',
    labelAr: 'سفر',
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
      '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵',
      '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🛞', '🚡', '🚠',
      '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆',
      '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️', '🚀',
    ],
  },
  objects: {
    label: '💡',
    labelAr: 'أشياء',
    emojis: [
      '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️',
      '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥',
      '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️',
      '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋',
      '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴',
    ],
  },
  symbols: {
    label: '⭐',
    labelAr: 'رموز',
    emojis: [
      '⭐', '🌟', '✨', '💫', '🔥', '💥', '💢', '💦', '💨', '🕳️',
      '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '🎉', '🎊', '🎈',
      '🎀', '🎁', '🏆', '🏅', '🥇', '🥈', '🥉', '⚽', '🎯', '🎮',
      '🔮', '🧿', '🪬', '🎰', '🎲', '♟️', '🧩', '🧸', '🪆', '🪅',
      '🎭', '🖼️', '🎨', '🧵', '🪡', '🧶', '🪢', '👓', '🕶️', '🥽',
    ],
  },
};

export function StoryEmojiPicker({ onSelect, onClose }: StoryEmojiPickerProps) {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('smileys');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter emojis based on search (simple contains match)
  const getFilteredEmojis = () => {
    if (!searchQuery.trim()) {
      return EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES]?.emojis || [];
    }
    
    // Search across all categories
    const allEmojis: string[] = [];
    Object.values(EMOJI_CATEGORIES).forEach(cat => {
      allEmojis.push(...cat.emojis);
    });
    return [...new Set(allEmojis)];
  };

  const filteredEmojis = getFilteredEmojis();

  // Prevent body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-end justify-center"
      style={{ 
        zIndex: 99999,
        pointerEvents: 'auto'
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      />
      
      {/* Modal Content */}
      <div 
        className="relative w-full max-w-[420px] bg-[#1a1a1a] rounded-t-3xl flex flex-col"
        style={{ 
          maxHeight: '70vh',
          pointerEvents: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <h3 className="text-white font-semibold">
            {language === 'ar' ? 'اختر إيموجي' : 'Choose Emoji'}
          </h3>
          <div className="w-16" />
        </div>

        {/* Search */}
        <div className="px-4 py-3 shrink-0" style={{ pointerEvents: 'auto' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' ? 'بحث إيموجي' : 'Search emoji'}
              className="bg-white/10 border-white/10 text-white placeholder:text-white/40 pl-10"
              style={{ pointerEvents: 'auto' }}
            />
          </div>
        </div>

        {/* Category tabs */}
        {!searchQuery && (
          <div className="flex gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide shrink-0" style={{ pointerEvents: 'auto' }}>
            {Object.entries(EMOJI_CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedCategory(key);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all cursor-pointer",
                  selectedCategory === key
                    ? "bg-primary/20 ring-2 ring-primary"
                    : "bg-white/10 hover:bg-white/20"
                )}
                style={{ pointerEvents: 'auto' }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Emoji grid */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto overscroll-contain px-4 py-2"
          style={{ minHeight: 0, pointerEvents: 'auto' }}
        >
          <div className="grid grid-cols-8 gap-1">
            {filteredEmojis.map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect(emoji);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-white/10 rounded-lg transition-colors active:scale-90 cursor-pointer"
                style={{ pointerEvents: 'auto' }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render outside of Dialog context
  return createPortal(modalContent, document.body);
}
