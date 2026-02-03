import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, Loader2, ArrowLeft, Mail } from 'lucide-react';
import logo from '@/assets/tahweel-logo.png';

export default function EmailVerification() {
  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get email from query params (set after signup)
  const pendingEmail = searchParams.get('email');

  const translations = {
    ar: {
      verifying: 'جاري التحقق من البريد الإلكتروني...',
      success: 'تم تأكيد البريد الإلكتروني بنجاح!',
      successDesc: 'تم تفعيل حسابك بنجاح. يمكنك الآن تسجيل الدخول.',
      error: 'فشل التحقق من البريد الإلكتروني',
      errorDesc: 'انتهت صلاحية رابط التأكيد أو غير صالح. يرجى المحاولة مرة أخرى.',
      goToLogin: 'تسجيل الدخول',
      tryAgain: 'إعادة المحاولة',
      backToLogin: 'العودة لتسجيل الدخول',
      checkEmail: 'تحقق من بريدك الإلكتروني',
      checkEmailDesc: 'أرسلنا رابط تأكيد إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد.',
      checkSpam: 'تحقق من مجلد البريد المزعج إذا لم تجد الرسالة',
      resendEmail: 'إعادة إرسال البريد',
      resendSuccess: 'تم إرسال رابط التحقق!',
    },
    en: {
      verifying: 'Verifying your email...',
      success: 'Email verified successfully!',
      successDesc: 'Your account has been activated. You can now login.',
      error: 'Email verification failed',
      errorDesc: 'The verification link has expired or is invalid. Please try again.',
      goToLogin: 'Login',
      tryAgain: 'Try Again',
      backToLogin: 'Back to Login',
      checkEmail: 'Check your email',
      checkEmailDesc: 'We sent a confirmation link to your email. Please check your inbox.',
      checkSpam: 'Check your spam folder if you don\'t see the email',
      resendEmail: 'Resend Email',
      resendSuccess: 'Verification link sent!',
    }
  };

  const txt = translations[language];

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');
      
      if (token) {
        // Custom token verification via Node.js API
        setStatus('verifying');
        
        try {
          console.log('[EmailVerification] Verifying token via Node.js API:', token);
          console.log('[EmailVerification] API URL:', import.meta.env.VITE_API_URL);
          const response = await api.verifyEmail(token);
          
          console.log('Verification response:', response);
          
          if (!response.success) {
            console.error('Verification error:', response.message);
            setStatus('error');
            setErrorMessage(response.message || txt.errorDesc);
            return;
          }
          
          // Success - show success state
          setStatus('success');
        } catch (err) {
          console.error('Verification error:', err);
          setStatus('error');
          setErrorMessage(txt.errorDesc);
        }
      } else if (pendingEmail) {
        // User just signed up - show pending verification state
        setStatus('pending');
      } else if (user) {
        // User is logged in, redirect to home
        navigate('/');
      } else {
        // No email or token - redirect to auth
        navigate('/auth');
      }
    };

    verifyToken();
  }, [searchParams, user, navigate, txt.errorDesc, pendingEmail]);

  const handleResendVerification = async () => {
    if (!pendingEmail) return;
    
    setIsResending(true);
    try {
      const response = await api.resendVerification(
        pendingEmail,
        `${window.location.origin}/verify-email`,
        language
      );
      
      if (!response.success) {
        toast({
          variant: 'destructive',
          title: language === 'ar' ? 'حدث خطأ' : 'Error',
          description: response.message || (language === 'ar' 
            ? 'تعذر إعادة إرسال البريد. يرجى المحاولة مرة أخرى.'
            : 'Unable to resend verification email. Please try again.'),
        });
      } else {
        toast({
          title: txt.resendSuccess,
          description: txt.checkEmailDesc,
        });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: language === 'ar' ? 'حدث خطأ' : 'Error',
        description: String(err),
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back Link */}
        <Link 
          to="/auth" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {txt.backToLogin}
        </Link>

        {/* Logo */}
        <div className="text-center">
          <img src={logo} alt="Tahweel" className="h-16 mx-auto mb-4" />
        </div>

        {/* Verification Card */}
        <Card className="glass-card border-border">
          <CardHeader className="text-center">
            {status === 'pending' && (
              <>
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold text-gradient-neon">
                  {txt.checkEmail}
                </CardTitle>
                <CardDescription>
                  {txt.checkEmailDesc}
                </CardDescription>
              </>
            )}
            
            {status === 'verifying' && (
              <>
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <CardTitle className="text-2xl font-bold">
                  {txt.verifying}
                </CardTitle>
              </>
            )}
            
            {status === 'success' && (
              <>
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <CardTitle className="text-2xl font-bold text-green-500">
                  {txt.success}
                </CardTitle>
                <CardDescription>
                  {txt.successDesc}
                </CardDescription>
              </>
            )}
            
            {status === 'error' && (
              <>
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle className="text-2xl font-bold text-destructive">
                  {txt.error}
                </CardTitle>
                <CardDescription>
                  {errorMessage || txt.errorDesc}
                </CardDescription>
              </>
            )}
          </CardHeader>
          
          <CardContent className="flex flex-col gap-3">
            {status === 'pending' && pendingEmail && (
              <>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <Mail className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">{pendingEmail}</p>
                </div>
                
                <p className="text-sm text-muted-foreground text-center">
                  {txt.checkSpam}
                </p>
                
                <Button
                  variant="outline"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full"
                >
                  {isResending ? <Loader2 className="h-4 w-4 animate-spin" /> : txt.resendEmail}
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => navigate('/auth')}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 me-2" />
                  {txt.backToLogin}
                </Button>
              </>
            )}
            
            {status === 'success' && (
              <Button onClick={() => navigate('/auth')} className="w-full neon-glow">
                {txt.goToLogin}
              </Button>
            )}
            
            {status === 'error' && (
              <Button onClick={() => navigate('/auth')} variant="outline" className="w-full">
                {txt.tryAgain}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}