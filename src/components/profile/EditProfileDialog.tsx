import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUpdateProfile, type Profile } from '@/hooks/useProfile';
import { AvatarUpload } from '@/components/upload/AvatarUpload';
import { CoverUpload } from '@/components/upload/CoverUpload';
import { getAvatarUrl } from '@/lib/default-images';
import { LocationCombobox } from '@/components/ui/location-combobox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin, Eye, EyeOff, Calendar, Users, UserPlus } from 'lucide-react';
const profileSchema = z.object({
  display_name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  display_name_ar: z.string().max(50).optional(),
  bio: z.string().max(160).optional(),
  birthday: z.string().optional(),
  gender: z.string().optional(),
  birthplace: z.string().max(100).optional(),
  current_location: z.string().max(100).optional(),
  relationship_status: z.string().optional(),
  // Privacy settings
  show_birthday: z.boolean(),
  show_gender: z.boolean(),
  show_birthplace: z.boolean(),
  show_location: z.boolean(),
  show_relationship: z.boolean(),
  show_joined_date: z.boolean(),
  show_followers_count: z.boolean(),
  show_following_count: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
}

const genderOptions = [
  { value: 'male', labelEn: 'Male', labelAr: 'ذكر' },
  { value: 'female', labelEn: 'Female', labelAr: 'أنثى' },
  { value: 'other', labelEn: 'Other', labelAr: 'آخر' },
  { value: 'prefer_not_to_say', labelEn: 'Prefer not to say', labelAr: 'أفضل عدم الذكر' },
];

const relationshipOptions = [
  { value: 'single', labelEn: 'Single', labelAr: 'أعزب/عزباء' },
  { value: 'in_relationship', labelEn: 'In a relationship', labelAr: 'في علاقة' },
  { value: 'engaged', labelEn: 'Engaged', labelAr: 'مخطوب/ة' },
  { value: 'married', labelEn: 'Married', labelAr: 'متزوج/ة' },
  { value: 'divorced', labelEn: 'Divorced', labelAr: 'مطلق/ة' },
  { value: 'widowed', labelEn: 'Widowed', labelAr: 'أرمل/ة' },
  { value: 'complicated', labelEn: "It's complicated", labelAr: 'معقدة' },
  { value: 'prefer_not_to_say', labelEn: 'Prefer not to say', labelAr: 'أفضل عدم الذكر' },
];


export function EditProfileDialog({ open, onOpenChange, profile }: EditProfileDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const updateProfile = useUpdateProfile();
  
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: profile.display_name || '',
      display_name_ar: profile.display_name_ar || '',
      bio: profile.bio || '',
      birthday: profile.birthday || '',
      gender: profile.gender || '',
      birthplace: profile.birthplace || '',
      current_location: profile.current_location || '',
      relationship_status: profile.relationship_status || '',
      // Privacy settings - default to true (visible)
      show_birthday: profile.show_birthday ?? true,
      show_gender: profile.show_gender ?? true,
      show_birthplace: profile.show_birthplace ?? true,
      show_location: profile.show_location ?? true,
      show_relationship: profile.show_relationship ?? true,
      show_joined_date: profile.show_joined_date ?? true,
      show_followers_count: profile.show_followers_count ?? true,
      show_following_count: profile.show_following_count ?? true,
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync({
        display_name: data.display_name,
        display_name_ar: data.display_name_ar || null,
        bio: data.bio || null,
        birthday: data.birthday || null,
        gender: data.gender || null,
        birthplace: data.birthplace || null,
        current_location: data.current_location || null,
        relationship_status: data.relationship_status || null,
        // Privacy settings
        show_birthday: data.show_birthday,
        show_gender: data.show_gender,
        show_birthplace: data.show_birthplace,
        show_location: data.show_location,
        show_relationship: data.show_relationship,
        show_joined_date: data.show_joined_date,
        show_followers_count: data.show_followers_count,
        show_following_count: data.show_following_count,
      });
      
      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: language === 'ar' ? 'تم تحديث الملف الشخصي' : 'Profile updated successfully',
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Cover Upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {language === 'ar' ? 'صورة الغلاف' : 'Cover Photo'}
              </label>
              <CoverUpload currentUrl={profile.cover_url} />
            </div>
            
            {/* Avatar Upload */}
            <div className="flex justify-center">
              <AvatarUpload
                currentUrl={getAvatarUrl(profile.avatar_url)}
                size="lg"
              />
            </div>
            
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === 'ar' ? 'الاسم (English)' : 'Display Name'}</FormLabel>
                  <FormControl>
                    <Input {...field} dir="ltr" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="display_name_ar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === 'ar' ? 'الاسم بالعربي' : 'Arabic Name'}</FormLabel>
                  <FormControl>
                    <Input {...field} dir="rtl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Username is auto-generated from email and cannot be changed */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {language === 'ar' ? 'اسم المستخدم' : 'Username'}
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md text-sm">
                <span dir="ltr">@{profile.username}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? 'اسم المستخدم مأخوذ من بريدك الإلكتروني ولا يمكن تغييره' : 'Username is derived from your email and cannot be changed'}
              </p>
            </div>
            
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === 'ar' ? 'النبذة' : 'Bio'}</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      rows={3}
                      placeholder={language === 'ar' ? 'اكتب نبذة عنك...' : 'Tell us about yourself...'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Additional Information Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                {language === 'ar' ? 'معلومات إضافية (اختياري)' : 'Additional Information (Optional)'}
              </h3>
              
              <div className="space-y-4">
                {/* Birthday with privacy toggle */}
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="birthday"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>{language === 'ar' ? 'تاريخ الميلاد' : 'Birthday'}</FormLabel>
                          <FormField
                            control={form.control}
                            name="show_birthday"
                            render={({ field: privacyField }) => (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {privacyField.value ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                <Switch
                                  checked={privacyField.value}
                                  onCheckedChange={privacyField.onChange}
                                />
                              </div>
                            )}
                          />
                        </div>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="date"
                            dir="ltr"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Gender with privacy toggle */}
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>{language === 'ar' ? 'الجنس' : 'Gender'}</FormLabel>
                          <FormField
                            control={form.control}
                            name="show_gender"
                            render={({ field: privacyField }) => (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {privacyField.value ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                <Switch
                                  checked={privacyField.value}
                                  onCheckedChange={privacyField.onChange}
                                />
                              </div>
                            )}
                          />
                        </div>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={language === 'ar' ? 'اختر...' : 'Select...'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {genderOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {language === 'ar' ? option.labelAr : option.labelEn}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Birthplace with privacy toggle */}
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="birthplace"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>{language === 'ar' ? 'مكان الولادة' : 'Birthplace'}</FormLabel>
                          <FormField
                            control={form.control}
                            name="show_birthplace"
                            render={({ field: privacyField }) => (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {privacyField.value ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                <Switch
                                  checked={privacyField.value}
                                  onCheckedChange={privacyField.onChange}
                                />
                              </div>
                            )}
                          />
                        </div>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder={language === 'ar' ? 'المدينة، البلد' : 'City, Country'}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Current Location with privacy toggle */}
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="current_location"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            {language === 'ar' ? 'الموقع الحالي' : 'Current Location'}
                          </FormLabel>
                          <FormField
                            control={form.control}
                            name="show_location"
                            render={({ field: privacyField }) => (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {privacyField.value ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                <Switch
                                  checked={privacyField.value}
                                  onCheckedChange={privacyField.onChange}
                                />
                              </div>
                            )}
                          />
                        </div>
                        <FormControl>
                          <LocationCombobox
                            value={field.value || ''}
                            onValueChange={field.onChange}
                            placeholder={language === 'ar' ? 'ابحث عن موقعك...' : 'Search your location...'}
                            language={language}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Relationship Status with privacy toggle */}
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="relationship_status"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>{language === 'ar' ? 'الحالة الاجتماعية' : 'Relationship Status'}</FormLabel>
                          <FormField
                            control={form.control}
                            name="show_relationship"
                            render={({ field: privacyField }) => (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {privacyField.value ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                <Switch
                                  checked={privacyField.value}
                                  onCheckedChange={privacyField.onChange}
                                />
                              </div>
                            )}
                          />
                        </div>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={language === 'ar' ? 'اختر...' : 'Select...'} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {relationshipOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {language === 'ar' ? option.labelAr : option.labelEn}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Joined Date Privacy Toggle */}
                <div className="space-y-2 border-t pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {language === 'ar' ? 'تاريخ الانضمام' : 'Joined Date'}
                    </span>
                    <FormField
                      control={form.control}
                      name="show_joined_date"
                      render={({ field: privacyField }) => (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {privacyField.value ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          <Switch
                            checked={privacyField.value}
                            onCheckedChange={privacyField.onChange}
                          />
                        </div>
                      )}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' 
                      ? 'إظهار متى انضممت للمنصة'
                      : 'Show when you joined the platform'}
                  </p>
                </div>

                {/* Followers Count Privacy Toggle */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {language === 'ar' ? 'عدد المتابِعين' : 'Followers Count'}
                    </span>
                    <FormField
                      control={form.control}
                      name="show_followers_count"
                      render={({ field: privacyField }) => (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {privacyField.value ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          <Switch
                            checked={privacyField.value}
                            onCheckedChange={privacyField.onChange}
                          />
                        </div>
                      )}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' 
                      ? 'إظهار عدد من يتابعونك'
                      : 'Show how many people follow you'}
                  </p>
                </div>

                {/* Following Count Privacy Toggle */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <UserPlus className="h-4 w-4" />
                      {language === 'ar' ? 'عدد المتابَعين' : 'Following Count'}
                    </span>
                    <FormField
                      control={form.control}
                      name="show_following_count"
                      render={({ field: privacyField }) => (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {privacyField.value ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          <Switch
                            checked={privacyField.value}
                            onCheckedChange={privacyField.onChange}
                          />
                        </div>
                      )}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' 
                      ? 'إظهار عدد من تتابعهم'
                      : 'Show how many people you follow'}
                  </p>
                </div>

                {/* Privacy note */}
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-4">
                  <Eye className="h-3.5 w-3.5" />
                  {language === 'ar' 
                    ? 'استخدم المفاتيح للتحكم في من يمكنه رؤية معلوماتك'
                    : 'Use toggles to control who can see your information'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending && (
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                )}
                {language === 'ar' ? 'حفظ' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}