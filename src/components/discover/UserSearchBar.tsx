import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function UserSearchBar({ value, onChange, placeholder }: UserSearchBarProps) {
  const { language } = useLanguage();
  const [localValue, setLocalValue] = useState(value);

  // Debounce the search
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const defaultPlaceholder = language === 'ar' 
    ? 'ابحث عن مستخدمين...' 
    : 'Search users...';

  return (
    <div className="relative">
      <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder || defaultPlaceholder}
        className="ps-9 pe-9"
      />
      {localValue && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={() => {
            setLocalValue('');
            onChange('');
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
