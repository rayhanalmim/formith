/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Server, Lock, Send } from 'lucide-react';

const smtpSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.number().min(1).max(65535),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  from_email: z.string().email('Invalid email address'),
  from_name: z.string().min(1, 'From name is required'),
  use_tls: z.boolean().default(true),
});

type SmtpFormData = z.infer<typeof smtpSchema>;

export default function AdminSmtpSettings() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');

  const form = useForm<SmtpFormData>({
    resolver: zodResolver(smtpSchema),
    defaultValues: {
      host: '',
      port: 587,
      username: '',
      password: '',
      from_email: '',
      from_name: 'Tahweel',
      use_tls: true,
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.getSmtpSettings();
      const data = response.data;

      if (data) {
        setExistingId(data.id);
        form.reset({
          host: data.host,
          port: data.port,
          username: data.username,
          password: data.password,
          from_email: data.from_email,
          from_name: data.from_name,
          use_tls: data.use_tls ?? true,
        });
      }
    } catch (error: any) {
      console.error('Error loading SMTP settings:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SmtpFormData) => {
    setIsSaving(true);
    try {
      const response = await api.saveSmtpSettings({
        host: data.host,
        port: data.port,
        username: data.username,
        password: data.password,
        from_email: data.from_email,
        from_name: data.from_name,
        use_tls: data.use_tls,
        is_active: true,
      }, existingId || undefined);

      if (!response.success) throw new Error('Failed to save settings');
      if (response.data?.id) setExistingId(response.data.id);

      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: language === 'ar' ? 'تم حفظ إعدادات SMTP' : 'SMTP settings saved successfully',
      });
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'أدخل بريد إلكتروني للاختبار' : 'Enter a test email address',
        variant: 'destructive',
      });
      return;
    }

    setIsTesting(true);
    try {
      const response = await api.sendTemplatedEmail(testEmail, 'test', { name: 'Test User' }, language);

      if (!response.success) throw new Error(response.error || 'Failed to send email');

      toast({
        title: language === 'ar' ? 'تم الإرسال' : 'Sent',
        description: language === 'ar' ? 'تم إرسال البريد التجريبي' : 'Test email sent successfully',
      });
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'فشل الإرسال' : 'Send Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {language === 'ar' ? 'إعدادات البريد الإلكتروني' : 'Email Settings'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' 
            ? 'إعداد خادم SMTP لإرسال البريد الإلكتروني' 
            : 'Configure SMTP server for sending emails'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              {language === 'ar' ? 'إعدادات SMTP' : 'SMTP Configuration'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' 
                ? 'أدخل بيانات خادم SMTP الخاص بك' 
                : 'Enter your SMTP server credentials'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="host"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'الخادم' : 'Host'}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="smtp.example.com" dir="ltr" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'المنفذ' : 'Port'}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 587)}
                            dir="ltr" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</FormLabel>
                      <FormControl>
                        <Input {...field} dir="ltr" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{language === 'ar' ? 'كلمة المرور' : 'Password'}</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} dir="ltr" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="from_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'البريد المرسل' : 'From Email'}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="noreply@example.com" dir="ltr" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="from_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === 'ar' ? 'اسم المرسل' : 'From Name'}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="use_tls"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          {language === 'ar' ? 'استخدام TLS' : 'Use TLS'}
                        </FormLabel>
                        <FormDescription>
                          {language === 'ar' 
                            ? 'تشفير الاتصال باستخدام TLS/SSL' 
                            : 'Encrypt connection using TLS/SSL'}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
                  {language === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              {language === 'ar' ? 'اختبار الإرسال' : 'Test Email'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' 
                ? 'أرسل بريد تجريبي للتحقق من الإعدادات' 
                : 'Send a test email to verify settings'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                dir="ltr"
              />
            </div>

            <Button 
              onClick={handleTestEmail} 
              variant="outline" 
              className="w-full"
              disabled={isTesting || !existingId}
            >
              {isTesting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              <Mail className="h-4 w-4 me-2" />
              {language === 'ar' ? 'إرسال بريد تجريبي' : 'Send Test Email'}
            </Button>

            {!existingId && (
              <p className="text-sm text-muted-foreground text-center">
                {language === 'ar' 
                  ? 'احفظ الإعدادات أولاً للاختبار' 
                  : 'Save settings first to test'}
              </p>
            )}

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">
                {language === 'ar' ? 'إعدادات شائعة' : 'Common Settings'}
              </h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Gmail:</strong> smtp.gmail.com:587</p>
                <p><strong>Outlook:</strong> smtp.office365.com:587</p>
                <p><strong>SendGrid:</strong> smtp.sendgrid.net:587</p>
                <p><strong>Mailgun:</strong> smtp.mailgun.org:587</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}