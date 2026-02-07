/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentUserProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useUserSettings, useUpdateSettings, useChangePassword } from '@/hooks/useSettings';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AvatarUpload } from '@/components/upload/AvatarUpload';
import { PushNotificationToggle } from '@/components/notifications/PushNotificationToggle';
import { StatusSelector, UserStatus } from '@/components/ui/status-selector';
import { TwoFactorSettings } from '@/components/settings/TwoFactorSettings';
import { Settings, User, Bell, Lock, Eye, Loader2, Save } from 'lucide-react';
import { z } from 'zod';
import { DEFAULT_AVATAR } from '@/lib/default-images';

const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export default function SettingsPage() {
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useCurrentUserProfile();
  const { data: settings, isLoading: settingsLoading } = useUserSettings();
  const updateProfile = useUpdateProfile();
  const updateSettings = useUpdateSettings();
  const changePassword = useChangePassword();

  // Account form state
  const [displayName, setDisplayName] = useState('');
  const [displayNameAr, setDisplayNameAr] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Password form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Notification settings state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [notifyLikes, setNotifyLikes] = useState(true);
  const [notifyComments, setNotifyComments] = useState(true);
  const [notifyFollows, setNotifyFollows] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);

  // Privacy settings state
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [allowMessagesFrom, setAllowMessagesFrom] = useState<'everyone' | 'followers' | 'nobody'>('everyone');
  const [userStatus, setUserStatus] = useState<UserStatus>('online');

  // Load profile data
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setDisplayNameAr(profile.display_name_ar || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || DEFAULT_AVATAR);
      setUserStatus((profile as any).status || 'online');
    }
  }, [profile]);

  // Load settings data
  useEffect(() => {
    if (settings) {
      setEmailNotifications(settings.email_notifications);
      setPushNotifications(settings.push_notifications);
      setNotifyLikes(settings.notify_likes);
      setNotifyComments(settings.notify_comments);
      setNotifyFollows(settings.notify_follows);
      setNotifyMessages(settings.notify_messages);
      setProfileVisibility(settings.profile_visibility);
      setShowOnlineStatus(settings.show_online_status);
      setAllowMessagesFrom(settings.allow_messages_from);
    }
  }, [settings]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleSaveAccount = async () => {
    await updateProfile.mutateAsync({
      display_name: displayName,
      display_name_ar: displayNameAr,
      username,
      bio,
      avatar_url: avatarUrl,
    });
  };

  const handleSaveNotifications = async () => {
    await updateSettings.mutateAsync({
      email_notifications: emailNotifications,
      push_notifications: pushNotifications,
      notify_likes: notifyLikes,
      notify_comments: notifyComments,
      notify_follows: notifyFollows,
      notify_messages: notifyMessages,
    });
  };

  const handleSavePrivacy = async () => {
    await updateSettings.mutateAsync({
      profile_visibility: profileVisibility,
      show_online_status: showOnlineStatus,
      allow_messages_from: allowMessagesFrom,
    });
  };

  const handleChangePassword = async () => {
    setPasswordError('');

    try {
      passwordSchema.parse(newPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setPasswordError(err.errors[0].message);
        return;
      }
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }

    await changePassword.mutateAsync(newPassword);
    setNewPassword('');
    setConfirmPassword('');
  };

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const isLoading = profileLoading || settingsLoading;

  return (
    <MainLayout>
      {/* Header */}
      <div className="glass-card p-6 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              {language === 'ar' ? 'الإعدادات' : 'Settings'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'إدارة حسابك وتفضيلاتك' : 'Manage your account and preferences'}
            </p>
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <div className="glass-card p-6">
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">
                {language === 'ar' ? 'الحساب' : 'Account'}
              </span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">
                {language === 'ar' ? 'الإشعارات' : 'Notifications'}
              </span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">
                {language === 'ar' ? 'الخصوصية' : 'Privacy'}
              </span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">
                {language === 'ar' ? 'الأمان' : 'Security'}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center gap-4">
                  <AvatarUpload
                    currentUrl={avatarUrl}
                    onUploadComplete={setAvatarUrl}
                    size="lg"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">
                      {language === 'ar' ? 'الاسم المعروض (English)' : 'Display Name (English)'}
                    </Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={language === 'ar' ? 'أدخل اسمك' : 'Enter your name'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayNameAr">
                      {language === 'ar' ? 'الاسم المعروض (عربي)' : 'Display Name (Arabic)'}
                    </Label>
                    <Input
                      id="displayNameAr"
                      value={displayNameAr}
                      onChange={(e) => setDisplayNameAr(e.target.value)}
                      placeholder={language === 'ar' ? 'أدخل اسمك بالعربي' : 'Enter your name in Arabic'}
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">
                    {language === 'ar' ? 'اسم المستخدم' : 'Username'}
                  </Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder={language === 'ar' ? 'اسم_المستخدم' : 'username'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">
                    {language === 'ar' ? 'نبذة عنك' : 'Bio'}
                  </Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={language === 'ar' ? 'اكتب نبذة عنك...' : 'Tell us about yourself...'}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleSaveAccount}
                  disabled={updateProfile.isPending}
                  className="w-full sm:w-auto"
                >
                  {updateProfile.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                  ) : (
                    <Save className="h-4 w-4 me-2" />
                  )}
                  {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                </Button>
              </>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <h3 className="font-semibold">
                    {language === 'ar' ? 'قنوات الإشعارات' : 'Notification Channels'}
                  </h3>
                  
                  {/* Push Notification Toggle Component */}
                  <PushNotificationToggle />

                  {/* <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="font-medium">
                        {language === 'ar' ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'استلام الإشعارات عبر البريد' : 'Receive notifications via email'}
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div> */}

                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="font-medium">
                        {language === 'ar' ? 'إشعارات الدفع (حفظ في الإعدادات)' : 'Push Notifications (save in settings)'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'تفعيل/تعطيل استلام الإشعارات' : 'Enable/disable receiving notifications'}
                      </p>
                    </div>
                    <Switch
                      checked={pushNotifications}
                      onCheckedChange={setPushNotifications}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">
                    {language === 'ar' ? 'أنواع الإشعارات' : 'Notification Types'}
                  </h3>

                  <div className="flex items-center justify-between py-3 border-b">
                    <p>{language === 'ar' ? 'الإعجابات' : 'Likes'}</p>
                    <Switch checked={notifyLikes} onCheckedChange={setNotifyLikes} />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <p>{language === 'ar' ? 'التعليقات' : 'Comments'}</p>
                    <Switch checked={notifyComments} onCheckedChange={setNotifyComments} />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <p>{language === 'ar' ? 'المتابعون الجدد' : 'New Followers'}</p>
                    <Switch checked={notifyFollows} onCheckedChange={setNotifyFollows} />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <p>{language === 'ar' ? 'الرسائل' : 'Messages'}</p>
                    <Switch checked={notifyMessages} onCheckedChange={setNotifyMessages} />
                  </div>
                </div>

                <Button
                  onClick={handleSaveNotifications}
                  disabled={updateSettings.isPending}
                  className="w-full sm:w-auto"
                >
                  {updateSettings.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                  ) : (
                    <Save className="h-4 w-4 me-2" />
                  )}
                  {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                </Button>
              </>
            )}
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'ظهور الملف الشخصي' : 'Profile Visibility'}</Label>
                    <Select value={profileVisibility} onValueChange={(v: any) => setProfileVisibility(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          {language === 'ar' ? 'عام - يمكن للجميع رؤيته' : 'Public - Everyone can see'}
                        </SelectItem>
                        <SelectItem value="followers">
                          {language === 'ar' ? 'المتابعون فقط' : 'Followers Only'}
                        </SelectItem>
                        <SelectItem value="private">
                          {language === 'ar' ? 'خاص - أنت فقط' : 'Private - Only you'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{language === 'ar' ? 'من يمكنه مراسلتك' : 'Who can message you'}</Label>
                    <Select value={allowMessagesFrom} onValueChange={(v: any) => setAllowMessagesFrom(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="everyone">
                          {language === 'ar' ? 'الجميع' : 'Everyone'}
                        </SelectItem>
                        <SelectItem value="followers">
                          {language === 'ar' ? 'المتابعون فقط' : 'Followers Only'}
                        </SelectItem>
                        <SelectItem value="nobody">
                          {language === 'ar' ? 'لا أحد' : 'Nobody'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="font-medium">
                        {language === 'ar' ? 'حالتك' : 'Your Status'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'حدد حالتك لتظهر للآخرين' : 'Set your status visible to others'}
                      </p>
                    </div>
                    <StatusSelector 
                      currentStatus={userStatus} 
                      onStatusChange={setUserStatus}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="font-medium">
                        {language === 'ar' ? 'إظهار حالة الاتصال' : 'Show Online Status'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'السماح للآخرين برؤية متى تكون متصلاً' : 'Let others see when you\'re online'}
                      </p>
                    </div>
                    <Switch
                      checked={showOnlineStatus}
                      onCheckedChange={setShowOnlineStatus}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSavePrivacy}
                  disabled={updateSettings.isPending}
                  className="w-full sm:w-auto"
                >
                  {updateSettings.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                  ) : (
                    <Save className="h-4 w-4 me-2" />
                  )}
                  {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                </Button>
              </>
            )}
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            {/* Two-Factor Authentication Section */}
            <TwoFactorSettings />

            {/* Change Password Section */}
            <div className="pt-6 border-t space-y-4">
              <h3 className="font-semibold">
                {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
              </h3>

              <div className="space-y-2">
                <Label htmlFor="newPassword">
                  {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}

              <Button
                onClick={handleChangePassword}
                disabled={changePassword.isPending || !newPassword || !confirmPassword}
                className="w-full sm:w-auto"
              >
                {changePassword.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                ) : (
                  <Lock className="h-4 w-4 me-2" />
                )}
                {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
              </Button>
            </div>

            <div className="pt-6 border-t">
              <h3 className="font-semibold text-destructive mb-2">
                {language === 'ar' ? 'منطقة الخطر' : 'Danger Zone'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {language === 'ar' 
                  ? 'الإجراءات هنا لا يمكن التراجع عنها'
                  : 'Actions here cannot be undone'}
              </p>
              <Button variant="destructive" disabled>
                {language === 'ar' ? 'حذف الحساب' : 'Delete Account'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
