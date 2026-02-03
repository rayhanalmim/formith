import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Cake, User, Users2, Home, MapPin, Heart, Diamond, Sparkles, HeartCrack, Feather, HelpCircle, ShieldQuestion } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

interface ProfileInfoSectionProps {
  birthday?: string | null;
  gender?: string | null;
  birthplace?: string | null;
  currentLocation?: string | null;
  relationshipStatus?: string | null;
  // Privacy settings
  showBirthday?: boolean | null;
  showGender?: boolean | null;
  showBirthplace?: boolean | null;
  showLocation?: boolean | null;
  showRelationship?: boolean | null;
  // Whether viewing own profile (always show all fields)
  isOwnProfile?: boolean;
}

const genderLabels: Record<string, { en: string; ar: string; icon: LucideIcon }> = {
  male: { en: 'Male', ar: 'ذكر', icon: User },
  female: { en: 'Female', ar: 'أنثى', icon: Users2 },
  other: { en: 'Other', ar: 'آخر', icon: User },
  prefer_not_to_say: { en: 'Prefer not to say', ar: 'أفضل عدم الذكر', icon: ShieldQuestion },
};

const relationshipLabels: Record<string, { en: string; ar: string; icon: LucideIcon }> = {
  single: { en: 'Single', ar: 'أعزب/عزباء', icon: Heart },
  in_relationship: { en: 'In a relationship', ar: 'في علاقة', icon: Heart },
  engaged: { en: 'Engaged', ar: 'مخطوب/ة', icon: Diamond },
  married: { en: 'Married', ar: 'متزوج/ة', icon: Sparkles },
  divorced: { en: 'Divorced', ar: 'مطلق/ة', icon: HeartCrack },
  widowed: { en: 'Widowed', ar: 'أرمل/ة', icon: Feather },
  complicated: { en: "It's complicated", ar: 'معقدة', icon: HelpCircle },
  prefer_not_to_say: { en: 'Prefer not to say', ar: 'أفضل عدم الذكر', icon: ShieldQuestion },
};

// Glowing icon wrapper component
const GlowIcon = ({ icon: Icon }: { icon: LucideIcon }) => (
  <div className="relative">
    <Icon className="h-4 w-4 text-primary drop-shadow-[0_0_6px_hsl(var(--primary))]" />
    <Icon className="h-4 w-4 text-primary absolute inset-0 blur-[2px] opacity-50" />
  </div>
);

export function ProfileInfoSection({
  birthday,
  gender,
  birthplace,
  currentLocation,
  relationshipStatus,
  showBirthday = true,
  showGender = true,
  showBirthplace = true,
  showLocation = true,
  showRelationship = true,
  isOwnProfile = false,
}: ProfileInfoSectionProps) {
  const { language } = useLanguage();

  // Determine what's visible based on privacy settings (own profile sees everything)
  const canShowBirthday = isOwnProfile || (showBirthday ?? true);
  const canShowGender = isOwnProfile || (showGender ?? true);
  const canShowBirthplace = isOwnProfile || (showBirthplace ?? true);
  const canShowLocation = isOwnProfile || (showLocation ?? true);
  const canShowRelationship = isOwnProfile || (showRelationship ?? true);

  const hasVisibleInfo = 
    (birthday && canShowBirthday) || 
    (gender && canShowGender) || 
    (birthplace && canShowBirthplace) || 
    (currentLocation && canShowLocation) || 
    (relationshipStatus && canShowRelationship);

  if (!hasVisibleInfo) return null;

  const formatBirthday = (date: string) => {
    try {
      return format(new Date(date), 'MMMM d, yyyy', { locale: language === 'ar' ? ar : enUS });
    } catch {
      return date;
    }
  };

  const getGenderLabel = (value: string) => {
    const data = genderLabels[value];
    return data ? { label: language === 'ar' ? data.ar : data.en, Icon: data.icon } : { label: value, Icon: User };
  };

  const getRelationshipLabel = (value: string) => {
    const data = relationshipLabels[value];
    return data ? { label: language === 'ar' ? data.ar : data.en, Icon: data.icon } : { label: value, Icon: Heart };
  };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
      {birthday && canShowBirthday && (
        <div className="flex items-center gap-1.5">
          <GlowIcon icon={Cake} />
          <span>{formatBirthday(birthday)}</span>
        </div>
      )}
      
      {gender && gender !== 'prefer_not_to_say' && canShowGender && (() => {
        const { label, Icon } = getGenderLabel(gender);
        return (
          <div className="flex items-center gap-1.5">
            <GlowIcon icon={Icon} />
            <span>{label}</span>
          </div>
        );
      })()}
      
      {birthplace && canShowBirthplace && (
        <div className="flex items-center gap-1.5">
          <GlowIcon icon={Home} />
          <span>
            {language === 'ar' ? 'من ' : 'From '}
            {birthplace}
          </span>
        </div>
      )}
      
      {currentLocation && canShowLocation && (
        <div className="flex items-center gap-1.5">
          <GlowIcon icon={MapPin} />
          <span>
            {language === 'ar' ? 'يعيش في ' : 'Lives in '}
            {currentLocation}
          </span>
        </div>
      )}
      
      {relationshipStatus && relationshipStatus !== 'prefer_not_to_say' && canShowRelationship && (() => {
        const { label, Icon } = getRelationshipLabel(relationshipStatus);
        return (
          <div className="flex items-center gap-1.5">
            <GlowIcon icon={Icon} />
            <span>{label}</span>
          </div>
        );
      })()}
    </div>
  );
}
