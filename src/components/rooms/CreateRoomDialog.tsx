import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateRoom } from '@/hooks/useRooms';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Loader2 } from 'lucide-react';

interface CreateRoomDialogProps {
  trigger?: React.ReactNode;
}

export function CreateRoomDialog({ trigger }: CreateRoomDialogProps) {
  const { language } = useLanguage();
  const createRoom = useCreateRoom();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createRoom.mutateAsync({
      name: name.trim(),
      name_ar: nameAr.trim() || undefined,
      description: description.trim() || undefined,
      description_ar: descriptionAr.trim() || undefined,
      is_public: isPublic,
    });

    setOpen(false);
    setName('');
    setNameAr('');
    setDescription('');
    setDescriptionAr('');
    setIsPublic(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 me-2" />
            {language === 'ar' ? 'إنشاء غرفة' : 'Create Room'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'ar' ? 'إنشاء غرفة جديدة' : 'Create New Room'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              {language === 'ar' ? 'اسم الغرفة (إنجليزي)' : 'Room Name (English)'}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === 'ar' ? 'أدخل الاسم بالإنجليزية' : 'Enter room name'}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nameAr">
              {language === 'ar' ? 'اسم الغرفة (عربي)' : 'Room Name (Arabic)'}
            </Label>
            <Input
              id="nameAr"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder={language === 'ar' ? 'أدخل الاسم بالعربية' : 'Enter Arabic name'}
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'ar' ? 'وصف الغرفة...' : 'Room description...'}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descriptionAr">
              {language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}
            </Label>
            <Textarea
              id="descriptionAr"
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              placeholder={language === 'ar' ? 'وصف الغرفة بالعربية...' : 'Arabic description...'}
              rows={2}
              dir="rtl"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="public" className="cursor-pointer">
              {language === 'ar' ? 'غرفة عامة' : 'Public Room'}
            </Label>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={createRoom.isPending || !name.trim()}>
              {createRoom.isPending && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              {language === 'ar' ? 'إنشاء' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
