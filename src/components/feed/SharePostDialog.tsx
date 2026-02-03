import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Copy, 
  Check, 
  Twitter, 
  Facebook, 
  MessageCircle,
  Mail,
  Link2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SharePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postUrl: string;
  postContent?: string;
  postSlug?: string;
}

export function SharePostDialog({ 
  open, 
  onOpenChange, 
  postUrl,
  postContent,
  postSlug
}: SharePostDialogProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const fullUrl = `${window.location.origin}${postUrl}`;
  
  // Use og-html edge function URL for social media sharing (proper OG meta tags)
  const ogUrl = postSlug 
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/og-html?slug=${encodeURIComponent(postSlug)}`
    : fullUrl;
  
  const encodedUrl = encodeURIComponent(ogUrl);
  const encodedText = encodeURIComponent(postContent?.slice(0, 100) || '');

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast({
        title: language === 'ar' ? 'تم النسخ!' : 'Link copied!',
        description: language === 'ar' ? 'تم نسخ الرابط إلى الحافظة' : 'Link copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل نسخ الرابط' : 'Failed to copy link',
        variant: 'destructive',
      });
    }
  };

  const shareOptions = [
    {
      name: 'Twitter / X',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      color: 'hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2]',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'hover:bg-[#4267B2]/10 hover:text-[#4267B2]',
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      color: 'hover:bg-[#25D366]/10 hover:text-[#25D366]',
    },
    {
      name: language === 'ar' ? 'البريد الإلكتروني' : 'Email',
      icon: Mail,
      url: `mailto:?subject=${encodedText}&body=${encodedUrl}`,
      color: 'hover:bg-primary/10 hover:text-primary',
    },
  ];

  const handleShare = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            {language === 'ar' ? 'مشاركة المنشور' : 'Share Post'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Copy Link Section */}
          <div className="flex items-center gap-2">
            <Input
              value={fullUrl}
              readOnly
              className="flex-1 text-sm bg-muted/50"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyLink}
              className={cn(
                'shrink-0 transition-all',
                copied && 'bg-success/10 text-success border-success'
              )}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {language === 'ar' ? 'أو شارك عبر' : 'Or share via'}
              </span>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {shareOptions.map((option) => (
              <Button
                key={option.name}
                variant="outline"
                className={cn('gap-2 justify-start', option.color)}
                onClick={() => handleShare(option.url)}
              >
                <option.icon className="h-4 w-4" />
                {option.name}
              </Button>
            ))}
          </div>

          {/* Clear OG Cache Button */}
          {postSlug && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground gap-2"
              onClick={() => {
                const debuggerUrl = `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(ogUrl)}`;
                window.open(debuggerUrl, '_blank', 'noopener,noreferrer');
              }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {language === 'ar' ? 'تحديث معاينة المشاركة' : 'Refresh Share Preview'}
            </Button>
          )}
          {navigator.share && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {language === 'ar' ? 'أو' : 'Or'}
                  </span>
                </div>
              </div>
              <Button
                variant="default"
                className="w-full gap-2"
                onClick={async () => {
                  try {
                    await navigator.share({
                      title: postContent?.slice(0, 50) || 'Check this post',
                      text: postContent?.slice(0, 100),
                      url: fullUrl,
                    });
                    onOpenChange(false);
                  } catch (error) {
                    // User cancelled or error
                  }
                }}
              >
                <Link2 className="h-4 w-4" />
                {language === 'ar' ? 'مشاركة عبر الجهاز' : 'Share via Device'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
