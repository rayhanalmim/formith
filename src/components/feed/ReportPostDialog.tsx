import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Flag, Loader2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ReportPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
}

const REPORT_REASONS = [
  { value: 'spam', labelEn: 'Spam', labelAr: 'محتوى مزعج' },
  { value: 'harassment', labelEn: 'Harassment or Bullying', labelAr: 'تحرش أو تنمر' },
  { value: 'hate_speech', labelEn: 'Hate Speech', labelAr: 'خطاب كراهية' },
  { value: 'violence', labelEn: 'Violence or Threats', labelAr: 'عنف أو تهديدات' },
  { value: 'misinformation', labelEn: 'Misinformation', labelAr: 'معلومات مضللة' },
  { value: 'inappropriate', labelEn: 'Inappropriate Content', labelAr: 'محتوى غير لائق' },
  { value: 'copyright', labelEn: 'Copyright Violation', labelAr: 'انتهاك حقوق النشر' },
  { value: 'other', labelEn: 'Other', labelAr: 'سبب آخر' },
];

export function ReportPostDialog({ open, onOpenChange, postId }: ReportPostDialogProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: language === 'ar' ? 'يجب تسجيل الدخول' : 'Login required',
        description: language === 'ar' ? 'سجل دخولك للإبلاغ عن المنشورات' : 'Login to report posts',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }

    if (!selectedReason) {
      toast({
        title: language === 'ar' ? 'اختر سبب البلاغ' : 'Select a reason',
        description: language === 'ar' ? 'يرجى اختيار سبب البلاغ' : 'Please select a reason for reporting',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the reason label
      const reason = REPORT_REASONS.find(r => r.value === selectedReason);
      const reasonText = language === 'ar' ? reason?.labelAr : reason?.labelEn;
      const fullReason = additionalDetails 
        ? `${reasonText}: ${additionalDetails}` 
        : reasonText;

      await api.createReport({
        reporter_id: user.id,
        reported_type: 'post',
        reported_id: postId,
        post_id: postId,
        reason: fullReason || selectedReason,
        description: additionalDetails || undefined,
      });

      toast({
        title: language === 'ar' ? 'تم إرسال البلاغ' : 'Report Submitted',
        description: language === 'ar' 
          ? 'شكراً لإبلاغنا. سنراجع المنشور قريباً.' 
          : 'Thank you for reporting. We will review this post soon.',
      });

      // Reset and close
      setSelectedReason('');
      setAdditionalDetails('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit report',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setAdditionalDetails('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            {language === 'ar' ? 'الإبلاغ عن المنشور' : 'Report Post'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar' 
              ? 'ساعدنا في الحفاظ على مجتمع آمن ومحترم' 
              : 'Help us keep the community safe and respectful'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* Warning Notice */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              {language === 'ar' 
                ? 'البلاغات الكاذبة قد تؤدي إلى إجراءات ضد حسابك.' 
                : 'False reports may result in action against your account.'}
            </p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {language === 'ar' ? 'سبب البلاغ' : 'Reason for Report'}
            </Label>
            <RadioGroup 
              value={selectedReason} 
              onValueChange={setSelectedReason}
              className="grid gap-2"
            >
              {REPORT_REASONS.map((reason) => (
                <div
                  key={reason.value}
                  className="flex items-center space-x-2 rtl:space-x-reverse p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label 
                    htmlFor={reason.value} 
                    className="flex-1 cursor-pointer text-sm"
                  >
                    {language === 'ar' ? reason.labelAr : reason.labelEn}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Additional Details */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {language === 'ar' ? 'تفاصيل إضافية (اختياري)' : 'Additional Details (optional)'}
            </Label>
            <Textarea
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder={language === 'ar' 
                ? 'أضف أي معلومات إضافية تساعدنا في مراجعة البلاغ...' 
                : 'Add any additional information to help us review...'}
              rows={3}
              className="resize-none"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-end">
              {additionalDetails.length}/500
            </p>
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            {language === 'ar' ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !selectedReason}
            variant="destructive"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            {language === 'ar' ? 'إرسال البلاغ' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
