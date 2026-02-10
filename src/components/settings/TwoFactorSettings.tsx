import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMFAFactors, useEnrollMFA, useUnenrollMFA, useDisabledMFAFactor, useReenableMFA } from '@/hooks/useTwoFactorAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Smartphone,
  Shield,
  ShieldCheck,
  ShieldOff,
  Loader2,
  Copy,
  Check,
  X,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

export function TwoFactorSettings() {
  const { language } = useLanguage();
  const { data: factors, isLoading } = useMFAFactors();
  const { data: disabledFactor } = useDisabledMFAFactor();
  const {
    enrollmentData,
    enroll,
    isEnrolling,
    verify,
    isVerifying,
    cancelEnrollment
  } = useEnrollMFA();
  const unenroll = useUnenrollMFA();
  const reenable = useReenableMFA();

  const [verificationCode, setVerificationCode] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  const verifiedFactors = factors?.filter(f => f.status === 'verified') || [];
  const hasActive2FA = verifiedFactors.length > 0;
  const hasDisabled2FA = !!disabledFactor;

  const handleCopySecret = () => {
    if (enrollmentData?.totp.secret) {
      navigator.clipboard.writeText(enrollmentData.totp.secret);
      setCopiedSecret(true);
      toast.success(language === 'ar' ? 'تم نسخ المفتاح السري' : 'Secret key copied');
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleVerify = () => {
    if (verificationCode.length === 6) {
      verify(verificationCode);
      setVerificationCode('');
    }
  };

  const handleDisable2FA = (factorId: string) => {
    unenroll.mutate(factorId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">
              {language === 'ar' ? 'التحقق بخطوتين (2FA)' : 'Two-Factor Authentication (2FA)'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' 
                ? 'أضف طبقة حماية إضافية لحسابك' 
                : 'Add an extra layer of security to your account'}
            </p>
          </div>
        </div>
        {hasActive2FA && (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
            <ShieldCheck className="h-3 w-3 me-1" />
            {language === 'ar' ? 'مفعّل' : 'Enabled'}
          </Badge>
        )}
      </div>

      {/* Enrollment Flow */}
      {enrollmentData ? (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              {language === 'ar' ? 'إعداد تطبيق المصادقة' : 'Set Up Authenticator App'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' 
                ? 'امسح رمز QR باستخدام تطبيق المصادقة مثل Google Authenticator أو Authy'
                : 'Scan the QR code with your authenticator app like Google Authenticator or Authy'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG 
                  value={enrollmentData.totp.uri} 
                  size={200}
                  level="H"
                />
              </div>
            </div>

            {/* Manual Entry */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? 'أو أدخل المفتاح يدوياً:' 
                  : 'Or enter the key manually:'}
              </Label>
              <div className="flex gap-2">
                <code className="flex-1 bg-muted p-3 rounded-md text-sm font-mono break-all">
                  {enrollmentData.totp.secret}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopySecret}
                >
                  {copiedSecret ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Verification Code Input */}
            <div className="space-y-2">
              <Label htmlFor="verificationCode">
                {language === 'ar' 
                  ? 'أدخل رمز التحقق من التطبيق' 
                  : 'Enter the verification code from the app'}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="verificationCode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-xl tracking-widest font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleVerify}
                disabled={verificationCode.length !== 6 || isVerifying}
                className="flex-1"
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                ) : (
                  <ShieldCheck className="h-4 w-4 me-2" />
                )}
                {language === 'ar' ? 'تفعيل 2FA' : 'Enable 2FA'}
              </Button>
              <Button
                variant="outline"
                onClick={cancelEnrollment}
              >
                <X className="h-4 w-4 me-2" />
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : hasActive2FA ? (
        /* Active 2FA Display */
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">
                    {language === 'ar' ? 'تطبيق المصادقة' : 'Authenticator App'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' 
                      ? 'حسابك محمي بالتحقق بخطوتين' 
                      : 'Your account is protected with 2FA'}
                  </p>
                </div>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive hover:bg-destructive/10">
                    <ShieldOff className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'تعطيل' : 'Disable'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {language === 'ar' 
                        ? 'تعطيل التحقق بخطوتين؟' 
                        : 'Disable Two-Factor Authentication?'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {language === 'ar' 
                        ? 'سيؤدي هذا إلى إزالة طبقة الحماية الإضافية من حسابك. هل أنت متأكد؟' 
                        : 'This will remove the extra layer of security from your account. Are you sure?'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDisable2FA(verifiedFactors[0].id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {unenroll.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin me-2" />
                      ) : null}
                      {language === 'ar' ? 'تعطيل' : 'Disable'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ) : hasDisabled2FA ? (
        /* Re-enable 2FA - Show existing setup */
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="h-16 w-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                <RotateCcw className="h-8 w-8 text-amber-500" />
              </div>
              <div>
                <p className="font-medium">
                  {language === 'ar'
                    ? 'التحقق بخطوتين معطّل'
                    : 'Two-Factor Authentication is disabled'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === 'ar'
                    ? 'لديك إعداد 2FA محفوظ. يمكنك إعادة تفعيله دون الحاجة لمسح رمز QR جديد'
                    : 'You have a saved 2FA setup. You can re-enable it without scanning a new QR code'}
                </p>
              </div>
              <Button
                onClick={() => reenable.mutate(disabledFactor!.id)}
                disabled={reenable.isPending}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {reenable.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                ) : (
                  <ShieldCheck className="h-4 w-4 me-2" />
                )}
                {language === 'ar' ? 'إعادة تفعيل 2FA' : 'Re-enable 2FA'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => enroll('Authenticator App')}
                disabled={isEnrolling}
                className="text-sm text-muted-foreground"
              >
                {language === 'ar'
                  ? 'إعداد جديد (مسح رمز QR)'
                  : 'Setup new (scan QR code)'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Enable 2FA Button - New Setup */
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Shield className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">
                  {language === 'ar'
                    ? 'التحقق بخطوتين غير مفعّل'
                    : 'Two-Factor Authentication is not enabled'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === 'ar'
                    ? 'قم بتفعيل 2FA لحماية حسابك من الوصول غير المصرح به'
                    : 'Enable 2FA to protect your account from unauthorized access'}
                </p>
              </div>
              <Button onClick={() => enroll('Authenticator App')} disabled={isEnrolling}>
                {isEnrolling ? (
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                ) : (
                  <Smartphone className="h-4 w-4 me-2" />
                )}
                {language === 'ar' ? 'تفعيل تطبيق المصادقة' : 'Enable Authenticator App'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
