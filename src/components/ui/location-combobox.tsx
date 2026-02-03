import * as React from 'react';
import { Check, ChevronsUpDown, MapPin, Search, Locate, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { locations, filterLocations, type Location } from '@/lib/locations-data';
import { toast } from '@/hooks/use-toast';

interface LocationComboboxProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  language: 'en' | 'ar';
}

export function LocationCombobox({
  value,
  onValueChange,
  placeholder,
  language,
}: LocationComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isDetecting, setIsDetecting] = React.useState(false);

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: language === 'ar' ? 'غير مدعوم' : 'Not Supported',
        description: language === 'ar' 
          ? 'تحديد الموقع غير مدعوم في متصفحك' 
          : 'Geolocation is not supported by your browser',
        variant: 'destructive',
      });
      return;
    }

    setIsDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use OpenStreetMap Nominatim for reverse geocoding (free, no API key needed)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=${language}`
          );
          
          if (!response.ok) throw new Error('Geocoding failed');
          
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state;
          const country = data.address?.country;
          
          if (city) {
            // Try to find a matching location in our database
            const matchedLocation = locations.find(loc => 
              loc.labelEn.toLowerCase().includes(city.toLowerCase()) ||
              loc.labelAr.includes(city) ||
              city.toLowerCase().includes(loc.labelEn.split(',')[0].toLowerCase())
            );
            
            if (matchedLocation) {
              onValueChange(language === 'ar' ? matchedLocation.labelAr : matchedLocation.labelEn);
            } else {
              // Use the detected city name directly
              onValueChange(country ? `${city}, ${country}` : city);
            }
            
            toast({
              title: language === 'ar' ? 'تم تحديد الموقع' : 'Location Detected',
              description: language === 'ar' 
                ? `تم تحديد موقعك: ${city}` 
                : `Your location: ${city}`,
            });
            setOpen(false);
          } else {
            throw new Error('City not found');
          }
        } catch (error) {
          toast({
            title: language === 'ar' ? 'خطأ' : 'Error',
            description: language === 'ar' 
              ? 'لم نتمكن من تحديد مدينتك' 
              : 'Could not determine your city',
            variant: 'destructive',
          });
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        setIsDetecting(false);
        let message = language === 'ar' ? 'حدث خطأ أثناء تحديد الموقع' : 'Error detecting location';
        
        if (error.code === error.PERMISSION_DENIED) {
          message = language === 'ar' 
            ? 'يرجى السماح بالوصول إلى موقعك' 
            : 'Please allow location access';
        }
        
        toast({
          title: language === 'ar' ? 'خطأ' : 'Error',
          description: message,
          variant: 'destructive',
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };
  
  const filteredLocations = React.useMemo(() => {
    return filterLocations(searchQuery, language);
  }, [searchQuery, language]);
  
  // Find the current location label
  const currentLocation = React.useMemo(() => {
    if (!value) return null;
    
    // First try to find by value
    const byValue = locations.find(loc => loc.value === value);
    if (byValue) return byValue;
    
    // Then try to find by label (for custom values)
    const byLabel = locations.find(
      loc => loc.labelEn === value || loc.labelAr === value
    );
    return byLabel;
  }, [value]);
  
  const displayValue = currentLocation
    ? (language === 'ar' ? currentLocation.labelAr : currentLocation.labelEn)
    : value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal bg-background"
        >
          <span className="flex items-center gap-2 truncate">
            {displayValue ? (
              <>
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{displayValue}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-popover" align="start">
        <Command shouldFilter={false}>
          {/* Detect Location Button */}
          <Button
            type="button"
            variant="ghost"
            onClick={detectLocation}
            disabled={isDetecting}
            className="w-full justify-start gap-2 rounded-none border-b px-3 py-3 text-sm font-normal hover:bg-accent group"
          >
            <div className="relative">
              {isDetecting ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <>
                  <Locate className="h-4 w-4 text-primary drop-shadow-[0_0_6px_hsl(var(--primary))] group-hover:drop-shadow-[0_0_10px_hsl(var(--primary))]" />
                  <Locate className="h-4 w-4 text-primary absolute inset-0 blur-[2px] opacity-50" />
                </>
              )}
            </div>
            <span className="text-primary font-medium">
              {isDetecting 
                ? (language === 'ar' ? 'جاري التحديد...' : 'Detecting...') 
                : (language === 'ar' ? 'تحديد موقعي تلقائياً' : 'Detect my location')}
            </span>
          </Button>
          
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={language === 'ar' ? 'ابحث عن مدينة أو دولة...' : 'Search city or country...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <CommandList>
            <CommandEmpty>
              {language === 'ar' ? 'لم يتم العثور على موقع.' : 'No location found.'}
            </CommandEmpty>
            <CommandGroup>
              {filteredLocations.map((location) => {
                const label = language === 'ar' ? location.labelAr : location.labelEn;
                const isSelected = value === location.value || 
                                   value === location.labelEn || 
                                   value === location.labelAr;
                
                return (
                  <CommandItem
                    key={location.value}
                    value={location.value}
                    onSelect={() => {
                      onValueChange(label);
                      setOpen(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{label}</span>
                    <Check
                      className={cn(
                        'h-4 w-4 text-primary',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
