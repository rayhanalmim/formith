import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MFAChallengeDialog } from '@/components/auth/MFAChallengeDialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import logo from '@/assets/tahweel-logo.png';

const emailSchema = z.string().email();
const passwordSchema = z.string().min(6);

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const [pendingVerification, setPendingVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  
  // MFA state
  const [showMFAChallenge, setShowMFAChallenge] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaPending, setMfaPending] = useState(false);
  
  const { signIn, signUp, signOut, user, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user && !mfaPending && !showMFAChallenge) {
      navigate('/');
    }
  }, [user, isAuthenticated, mfaPending, showMFAChallenge, navigate]);

  const translations = {
    ar: {
      login: 'تسجيل الدخول',
      signup: 'إنشاء حساب',
      loginDesc: 'مرحباً بك مجدداً! سجل دخولك للمتابعة',
      signupDesc: 'انضم إلى مجتمع تحويل اليوم',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      confirmPassword: 'تأكيد كلمة المرور',
      forgotPassword: 'نسيت كلمة المرور؟',
      noAccount: 'ليس لديك حساب؟',
      hasAccount: 'لديك حساب بالفعل؟',
      createAccount: 'إنشاء حساب جديد',
      loginNow: 'تسجيل الدخول الآن',
      emailRequired: 'البريد الإلكتروني مطلوب',
      emailInvalid: 'البريد الإلكتروني غير صالح',
      passwordRequired: 'كلمة المرور مطلوبة',
      passwordMin: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
      passwordMismatch: 'كلمات المرور غير متطابقة',
      loginSuccess: 'تم تسجيل الدخول بنجاح',
      signupSuccess: 'تم إنشاء الحساب بنجاح',
      checkEmail: 'يرجى التحقق من بريدك الإلكتروني للتأكيد',
      errorOccurred: 'حدث خطأ',
      userExists: 'هذا البريد مسجل بالفعل',
      invalidCredentials: 'البريد أو كلمة المرور غير صحيحة',
      backToHome: 'العودة للرئيسية',
      verificationSent: 'تم إرسال رابط التحقق!',
      verificationSentDesc: 'أرسلنا رابط تأكيد إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد.',
      checkSpam: 'تحقق من مجلد البريد المزعج إذا لم تجد الرسالة',
      resendEmail: 'إعادة إرسال البريد',
      backToLogin: 'العودة لتسجيل الدخول',
      emailNotConfirmed: 'البريد الإلكتروني غير مؤكد. يرجى التحقق من بريدك.',
    },
    en: {
      login: 'Login',
      signup: 'Sign Up',
      loginDesc: 'Welcome back! Login to continue',
      signupDesc: 'Join the Tahweel community today',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot Password?',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      createAccount: 'Create Account',
      loginNow: 'Login Now',
      emailRequired: 'Email is required',
      emailInvalid: 'Invalid email address',
      passwordRequired: 'Password is required',
      passwordMin: 'Password must be at least 6 characters',
      passwordMismatch: 'Passwords do not match',
      loginSuccess: 'Logged in successfully',
      signupSuccess: 'Account created successfully',
      checkEmail: 'Please check your email for confirmation',
      errorOccurred: 'An error occurred',
      userExists: 'This email is already registered',
      invalidCredentials: 'Invalid email or password',
      backToHome: 'Back to Home',
      verificationSent: 'Verification link sent!',
      verificationSentDesc: 'We sent a confirmation link to your email. Please check your inbox.',
      checkSpam: 'Check your spam folder if you don\'t see the email',
      resendEmail: 'Resend Email',
      backToLogin: 'Back to Login',
      emailNotConfirmed: 'Email not confirmed. Please check your inbox.',
    }
  };

  const txt = translations[language];

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};
    
    if (!email.trim()) {
      newErrors.email = txt.emailRequired;
    } else {
      const emailResult = emailSchema.safeParse(email.trim());
      if (!emailResult.success) {
        newErrors.email = txt.emailInvalid;
      }
    }
    
    if (!password) {
      newErrors.password = txt.passwordRequired;
    } else {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = txt.passwordMin;
      }
    }
    
    if (!isLogin && password !== confirmPassword) {
      newErrors.confirmPassword = txt.passwordMismatch;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          if (error.message.includes('Invalid') || error.message.includes('invalid')) {
            toast({
              variant: 'destructive',
              title: txt.errorOccurred,
              description: txt.invalidCredentials,
            });
          } else if (error.message.includes('verify') || error.message.includes('verified')) {
            // Redirect to verification page
            navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
          } else {
            toast({
              variant: 'destructive',
              title: txt.errorOccurred,
              description: error.message,
            });
          }
        } else {
          toast({
            title: txt.loginSuccess,
          });
          navigate('/');
        }
      } else {
        // Sign up with redirect URL and language
        const { error } = await signUp(
          email.trim(), 
          password,
          `${window.location.origin}/verify-email`,
          language
        );
        
        if (error) {
          if (error.message.includes('already registered') || error.message.includes('already exists')) {
            toast({
              variant: 'destructive',
              title: txt.errorOccurred,
              description: txt.userExists,
            });
          } else {
            toast({
              variant: 'destructive',
              title: txt.errorOccurred,
              description: error.message,
            });
          }
        } else {
          // Navigate to verification page with email parameter
          navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
        }
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

  const handleMFASuccess = () => {
    setShowMFAChallenge(false);
    setMfaPending(false);
    setMfaFactorId(null);
    toast({
      title: txt.loginSuccess,
    });
    navigate('/');
  };

  const handleMFACancel = async () => {
    setShowMFAChallenge(false);
    setMfaPending(false);
    setMfaFactorId(null);
    // Sign out since MFA was not completed
    await signOut();
  };

  const handleResendVerification = async () => {
    if (!pendingEmail) return;
    
    setIsLoading(true);
    try {
      const response = await api.resendVerification(
        pendingEmail,
        `${window.location.origin}/verify-email`,
        language
      );
      
      if (!response.success) {
        toast({
          variant: 'destructive',
          title: txt.errorOccurred,
          description: response.message || 'Unable to resend verification email.',
        });
      } else {
        toast({
          title: txt.verificationSent,
          description: txt.checkEmail,
        });
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

  const handleBackToLogin = () => {
    setPendingVerification(false);
    setPendingEmail('');
    setIsLogin(true);
    setEmail('');
    setPassword('');
  };

  // Show pending verification state
  if (pendingVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="text-center">
            <img src={logo} alt="Tahweel" className="h-16 mx-auto mb-4" />
          </div>

          {/* Verification Card */}
          <Card className="glass-card border-border">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold text-gradient-neon">
                {txt.verificationSent}
              </CardTitle>
              <CardDescription>
                {txt.verificationSentDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <Mail className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">{pendingEmail}</p>
              </div>
              
              <p className="text-sm text-muted-foreground text-center">
                {txt.checkSpam}
              </p>
              
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={handleResendVerification}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : txt.resendEmail}
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={handleBackToLogin}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 me-2" />
                  {txt.backToLogin}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back to Home */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {txt.backToHome}
        </Link>

        {/* Logo */}
        <div className="text-center">
          <img src={logo} alt="Tahweel" className="h-16 mx-auto mb-4" />
        </div>

        {/* Auth Card */}
        <Card className="glass-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gradient-neon">
              {isLogin ? txt.login : txt.signup}
            </CardTitle>
            <CardDescription>
              {isLogin ? txt.loginDesc : txt.signupDesc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {txt.email}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className={`bg-muted/50 ${errors.email ? 'border-destructive' : ''}`}
                  dir="ltr"
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {txt.password}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`bg-muted/50 pe-10 ${errors.password ? 'border-destructive' : ''}`}
                    dir="ltr"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password (Signup only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    {txt.confirmPassword}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`bg-muted/50 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                    dir="ltr"
                    autoComplete="new-password"
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              {/* Forgot Password Link */}
              {isLogin && (
                <div className="text-end">
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-primary hover:underline"
                  >
                    {txt.forgotPassword}
                  </Link>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full neon-glow" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isLogin ? txt.login : txt.signup}
              </Button>
            </form>

            {/* Toggle Login/Signup */}
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                {isLogin ? txt.noAccount : txt.hasAccount}
              </span>{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? txt.createAccount : txt.loginNow}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MFA Challenge Dialog */}
      {mfaFactorId && (
        <MFAChallengeDialog
          open={showMFAChallenge}
          factorId={mfaFactorId}
          onSuccess={handleMFASuccess}
          onCancel={handleMFACancel}
        />
      )}
    </div>
  );
}
