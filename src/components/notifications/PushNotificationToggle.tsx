import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function PushNotificationToggle() {
  const { language } = useLanguage();
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <BellOff className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium">
            {language === 'ar'
              ? 'الإشعارات غير مدعومة'
              : 'Push notifications not supported'}
          </p>
          <p className="text-xs text-muted-foreground">
            {language === 'ar'
              ? 'متصفحك لا يدعم إشعارات الويب'
              : 'Your browser does not support web push notifications'}
          </p>
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
        <BellOff className="h-5 w-5 text-destructive" />
        <div className="flex-1">
          <p className="text-sm font-medium text-destructive">
            {language === 'ar'
              ? 'تم رفض الإشعارات'
              : 'Notifications blocked'}
          </p>
          <p className="text-xs text-muted-foreground">
            {language === 'ar'
              ? 'يرجى تفعيل الإشعارات من إعدادات المتصفح'
              : 'Please enable notifications in your browser settings'}
          </p>
        </div>
      </div>
    );
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      unsubscribe.mutate();
    } else {
      subscribe.mutate();
    }
  };

  const isToggling = subscribe.isPending || unsubscribe.isPending;

  return (
    <div className="flex items-center justify-between gap-4 p-3 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-3">
        <Bell className="h-5 w-5 text-primary" />
        <div>
          <Label htmlFor="push-toggle" className="text-sm font-medium cursor-pointer">
            {language === 'ar'
              ? 'إشعارات الدفع'
              : 'Push Notifications'}
          </Label>
          <p className="text-xs text-muted-foreground">
            {language === 'ar'
              ? 'تلقي إشعارات للإشارات والإعجابات والتعليقات'
              : 'Get notified for mentions, likes, and comments'}
          </p>
        </div>
      </div>

      {isLoading || isToggling ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <Switch
          id="push-toggle"
          checked={isSubscribed}
          onCheckedChange={handleToggle}
        />
      )}
    </div>
  );
}
