import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMFAChallenge } from '@/hooks/useTwoFactorAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Loader2 } from 'lucide-react';

interface MFAChallengeDialogProps {
  open: boolean;
  factorId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MFAChallengeDialog({ 
  open, 
  factorId, 
  onSuccess, 
  onCancel 
}: MFAChallengeDialogProps) {
  const { language } = useLanguage();
  const [code, setCode] = useState('');
  const challenge = useMFAChallenge();

  const handleVerify = async () => {
    if (code.length !== 6) return;
    
    try {
      await challenge.mutateAsync({ factorId, code });
      setCode('');
      onSuccess();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6) {
      handleVerify();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {language === 'ar' ? 'التحقق بخطوتين' : 'Two-Factor Authentication'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ar' 
              ? 'أدخل رمز التحقق من تطبيق المصادقة الخاص بك' 
              : 'Enter the verification code from your authenticator app'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="mfaCode">
              {language === 'ar' ? 'رمز التحقق' : 'Verification Code'}
            </Label>
            <Input
              id="mfaCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={handleKeyDown}
              className="text-center text-2xl tracking-widest font-mono"
              dir="ltr"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleVerify}
              disabled={code.length !== 6 || challenge.isPending}
              className="flex-1"
            >
              {challenge.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin me-2" />
              ) : null}
              {language === 'ar' ? 'تحقق' : 'Verify'}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
