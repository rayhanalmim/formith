import { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import logo from '@/assets/tahweel-logo.png';

const emailSchema = z.string().email();

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { language } = useLanguage();
  const { toast } = useToast();

  const translations = {
    ar: {
      title: 'استعادة كلمة المرور',
      description: 'أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور',
      email: 'البريد الإلكتروني',
      submit: 'إرسال رابط الاستعادة',
      backToLogin: 'العودة لتسجيل الدخول',
      emailRequired: 'البريد الإلكتروني مطلوب',
      emailInvalid: 'البريد الإلكتروني غير صالح',
      successTitle: 'تم الإرسال!',
      successDesc: 'تحقق من بريدك الإلكتروني للحصول على رابط إعادة تعيين كلمة المرور',
      errorOccurred: 'حدث خطأ',
    },
    en: {
      title: 'Forgot Password',
      description: 'Enter your email and we will send you a link to reset your password',
      email: 'Email',
      submit: 'Send Reset Link',
      backToLogin: 'Back to Login',
      emailRequired: 'Email is required',
      emailInvalid: 'Invalid email address',
      successTitle: 'Email Sent!',
      successDesc: 'Check your email for a password reset link',
      errorOccurred: 'An error occurred',
    }
  };

  const txt = translations[language];

  const validateEmail = () => {
    if (!email.trim()) {
      setError(txt.emailRequired);
      return false;
    }
    
    const result = emailSchema.safeParse(email.trim());
    if (!result.success) {
      setError(txt.emailInvalid);
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail()) return;
    
    setIsLoading(true);
    
    try {
      // Call Node.js API for password reset
      const response = await api.sendPasswordResetEmail(
        email.trim(),
        `${window.location.origin}/reset-password`,
        language
      );
      
      if (!response.success) {
        toast({
          variant: 'destructive',
          title: txt.errorOccurred,
          description: response.error || 'Failed to send reset email',
        });
      } else {
        setIsSubmitted(true);
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

  if (isSubmitted) {
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
                  className={`bg-muted/50 ${error ? 'border-destructive' : ''}`}
                  dir="ltr"
                  autoComplete="email"
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
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
