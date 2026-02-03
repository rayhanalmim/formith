import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSavedLocations } from '@/hooks/useSavedLocations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Flame, Clock, Users, TrendingUp, MapPin, X, History } from 'lucide-react';
import { cn } from '@/lib/utils';

type FeedTab = 'latest' | 'trending' | 'following' | 'popular';

interface FeedTabsProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  locationFilter?: string;
  onLocationFilterChange?: (location: string) => void;
}

export function FeedTabs({ activeTab, onTabChange, locationFilter, onLocationFilterChange }: FeedTabsProps) {
  const { t, language } = useLanguage();
  const [locationInput, setLocationInput] = useState('');
  const [showLocationFilter, setShowLocationFilter] = useState(false);

  // Fetch saved locations from database
  const { data: savedLocations = [] } = useSavedLocations(locationInput);

  const tabs = [
    { id: 'latest' as const, label: t('forum.latest'), icon: Clock },
    { id: 'trending' as const, label: t('forum.trending'), icon: Flame },
    { id: 'following' as const, label: t('forum.following'), icon: Users },
    { id: 'popular' as const, label: t('forum.popular'), icon: TrendingUp },
  ];

  // Popular locations as fallback
  const popularLocations = language === 'ar' ? [
    'الرياض', 'جدة', 'دبي', 'القاهرة', 'عمّان', 'الكويت',
  ] : [
    'New York', 'London', 'Dubai', 'Riyadh', 'Cairo', 'Paris',
  ];

  // Filter saved locations based on input
  const filteredSavedLocations = locationInput.trim()
    ? savedLocations.filter(loc => 
        loc.toLowerCase().includes(locationInput.toLowerCase())
      )
    : savedLocations;

  // Filter popular locations, excluding those already in saved
  const filteredPopularLocations = popularLocations.filter(
    loc => !savedLocations.some(saved => saved.toLowerCase().includes(loc.toLowerCase()))
  );

  const handleApplyFilter = () => {
    onLocationFilterChange?.(locationInput);
    setShowLocationFilter(false);
  };

  const handleClearFilter = () => {
    setLocationInput('');
    onLocationFilterChange?.('');
  };

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant={isActive ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'gap-2 rounded-full whitespace-nowrap transition-all',
                isActive && 'neon-glow',
                !isActive && 'hover:bg-muted'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive && 'text-primary-foreground')} />
              {tab.label}
            </Button>
          );
        })}

        {/* Location Filter */}
        {onLocationFilterChange && (
          <Popover open={showLocationFilter} onOpenChange={setShowLocationFilter}>
            <PopoverTrigger asChild>
              <Button
                variant={locationFilter ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  'gap-2 rounded-full whitespace-nowrap ml-auto',
                  locationFilter && 'bg-primary/20 text-primary'
                )}
              >
                <MapPin className="h-4 w-4" />
                {locationFilter || (language === 'ar' ? 'الموقع' : 'Location')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 glass-card" align="end">
              <div className="space-y-3">
                <label className="text-xs font-medium">
                  {language === 'ar' ? 'تصفية حسب الموقع' : 'Filter by location'}
                </label>
                <Input
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder={language === 'ar' ? 'اكتب اسم الموقع...' : 'Type location name...'}
                  className="h-8 text-sm"
                />

                {/* Saved locations from DB */}
                {filteredSavedLocations.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <History className="h-3 w-3" />
                      <span>{language === 'ar' ? 'مواقع محفوظة' : 'Saved locations'}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {filteredSavedLocations.slice(0, 6).map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          className={cn(
                            'px-2 py-1 text-xs rounded-full transition-colors',
                            locationInput === loc 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                          )}
                          onClick={() => setLocationInput(loc)}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular location filters (fallback) */}
                {filteredPopularLocations.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span>{language === 'ar' ? 'مواقع شائعة' : 'Popular'}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {filteredPopularLocations.slice(0, 6).map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          className={cn(
                            'px-2 py-1 text-xs rounded-full transition-colors',
                            locationInput === loc 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted hover:bg-muted/80'
                          )}
                          onClick={() => setLocationInput(loc)}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1"
                    onClick={handleClearFilter}
                  >
                    {language === 'ar' ? 'مسح' : 'Clear'}
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={handleApplyFilter}
                  >
                    {language === 'ar' ? 'تطبيق' : 'Apply'}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Active location filter indicator */}
      {locationFilter && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {language === 'ar' ? 'التصفية:' : 'Filtering:'}
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20 text-primary text-xs">
            <MapPin className="h-3 w-3" />
            {locationFilter}
            <button
              onClick={handleClearFilter}
              className="ml-1 hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
