import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, ArrowLeft, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import logo from '@/assets/tahweel-logo.png';

const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  const { language } = useLanguage();
  const { toast } = useToast();

  const translations = {
    ar: {
      title: 'إعادة تعيين كلمة المرور',
      description: 'أدخل كلمة المرور الجديدة',
      newPassword: 'كلمة المرور الجديدة',
      confirmPassword: 'تأكيد كلمة المرور',
      submit: 'تحديث كلمة المرور',
      backToLogin: 'العودة لتسجيل الدخول',
      passwordRequired: 'كلمة المرور مطلوبة',
      passwordTooShort: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
      passwordsDoNotMatch: 'كلمات المرور غير متطابقة',
      successTitle: 'تم التحديث!',
      successDesc: 'تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.',
      errorOccurred: 'حدث خطأ',
      invalidToken: 'رابط إعادة التعيين غير صالح أو منتهي الصلاحية',
      goToLogin: 'تسجيل الدخول',
      requestNewLink: 'طلب رابط جديد',
    },
    en: {
      title: 'Reset Password',
      description: 'Enter your new password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      submit: 'Update Password',
      backToLogin: 'Back to Login',
      passwordRequired: 'Password is required',
      passwordTooShort: 'Password must be at least 6 characters',
      passwordsDoNotMatch: 'Passwords do not match',
      successTitle: 'Password Updated!',
      successDesc: 'Your password has been updated successfully. You can now log in.',
      errorOccurred: 'An error occurred',
      invalidToken: 'Invalid or expired reset link',
      goToLogin: 'Go to Login',
      requestNewLink: 'Request New Link',
    }
  };

  const txt = translations[language];

  // Check if token exists
  useEffect(() => {
    if (!token) {
      setError(txt.invalidToken);
    }
  }, [token, txt.invalidToken]);

  const validateForm = () => {
    if (!password.trim()) {
      setPasswordError(txt.passwordRequired);
      return false;
    }
    
    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      setPasswordError(txt.passwordTooShort);
      return false;
    }
    
    if (password !== confirmPassword) {
      setPasswordError(txt.passwordsDoNotMatch);
      return false;
    }
    
    setPasswordError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !token) return;
    
    setIsLoading(true);
    
    try {
      const response = await api.verifyResetToken(token, password);
      
      if (!response.success) {
        const errorMsg = response.error || 'Failed to reset password';
        if (errorMsg.includes('expired') || errorMsg.includes('Invalid')) {
          setError(txt.invalidToken);
        } else {
          toast({
            variant: 'destructive',
            title: txt.errorOccurred,
            description: errorMsg,
          });
        }
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: txt.errorOccurred,
        description: String(err),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Invalid token state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <img src={logo} alt="Tahweel" className="h-16 mx-auto mb-4" />
          </div>

          <Card className="glass-card border-border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold text-destructive">
                {txt.invalidToken}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/forgot-password">
                <Button className="w-full neon-glow">
                  {txt.requestNewLink}
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" className="w-full">
                  {txt.backToLogin}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <img src={logo} alt="Tahweel" className="h-16 mx-auto mb-4" />
          </div>

          <Card className="glass-card border-border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-emerald-500">
                {txt.successTitle}
              </CardTitle>
              <CardDescription>
                {txt.successDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/auth">
                <Button className="w-full neon-glow">
                  {txt.goToLogin}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <Link 
          to="/auth" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {txt.backToLogin}
        </Link>

        <div className="text-center">
          <img src={logo} alt="Tahweel" className="h-16 mx-auto mb-4" />
        </div>

        <Card className="glass-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gradient-neon">
              {txt.title}
            </CardTitle>
            <CardDescription>
              {txt.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {txt.newPassword}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`bg-muted/50 pr-10 ${passwordError ? 'border-destructive' : ''}`}
                    dir="ltr"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {txt.confirmPassword}
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`bg-muted/50 pr-10 ${passwordError ? 'border-destructive' : ''}`}
                    dir="ltr"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full neon-glow" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : txt.submit}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
