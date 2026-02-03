import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEditRoomMessage, useDeleteRoomMessage } from '@/hooks/useRooms';
import { usePinMessage, useUnpinMessage } from '@/hooks/usePinnedMessages';
import { useIsAdmin, useCanModerate } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MoreVertical, Pencil, Trash2, Loader2, Pin, PinOff } from 'lucide-react';

interface MessageActionsProps {
  messageId: string;
  roomId: string;
  currentContent: string;
  isOwn: boolean;
  hasMedia: boolean;
  isPinned?: boolean;
  isRoomModerator?: boolean; // Room-level moderator status
  messageAuthorId?: string; // Author of the message for activity logging
}

export function MessageActions({ 
  messageId, 
  roomId,
  currentContent, 
  isOwn, 
  hasMedia,
  isPinned = false,
  isRoomModerator = false,
  messageAuthorId
}: MessageActionsProps) {
  const { language } = useLanguage();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState(currentContent);
  
  const editMessage = useEditRoomMessage();
  const deleteMessage = useDeleteRoomMessage();
  const pinMessage = usePinMessage();
  const unpinMessage = useUnpinMessage();
  const { data: isAdmin } = useIsAdmin();
  const { data: canModerate } = useCanModerate();

  // Show actions for own messages OR for moderators (admin/manager/moderator/room moderator)
  const canEdit = isOwn && !hasMedia;
  const canDelete = isOwn || canModerate || isRoomModerator; // Site + room moderators can delete
  const canPin = isAdmin || canModerate || isRoomModerator; // Allow mods to pin too

  if (!canDelete && !canPin) return null;

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    await editMessage.mutateAsync({ messageId, content: editContent });
    setIsEditDialogOpen(false);
  };

  const handleDelete = async () => {
    await deleteMessage.mutateAsync({ 
      messageId, 
      isAdmin: canModerate || isRoomModerator,
      roomId,
      messageAuthorId
    });
    setIsDeleteDialogOpen(false);
  };

  const handlePinToggle = async () => {
    if (isPinned) {
      await unpinMessage.mutateAsync({ messageId, roomId, messageAuthorId });
    } else {
      await pinMessage.mutateAsync({ messageId, roomId, messageAuthorId });
    }
  };

  const openEditDialog = () => {
    setEditContent(currentContent);
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-44 bg-popover border border-border shadow-lg z-50"
        >
          {/* Pin/Unpin - Admin only */}
          {canPin && (
            <>
              <DropdownMenuItem 
                onClick={handlePinToggle}
                className="cursor-pointer"
                disabled={pinMessage.isPending || unpinMessage.isPending}
              >
                {isPinned ? (
                  <>
                    <PinOff className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'إلغاء التثبيت' : 'Unpin'}
                  </>
                ) : (
                  <>
                    <Pin className="h-4 w-4 me-2" />
                    {language === 'ar' ? 'تثبيت' : 'Pin'}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          {/* Edit - Only for own text messages */}
          {canEdit && (
            <DropdownMenuItem 
              onClick={openEditDialog}
              className="cursor-pointer"
            >
              <Pencil className="h-4 w-4 me-2" />
              {language === 'ar' ? 'تعديل' : 'Edit'}
            </DropdownMenuItem>
          )}
          
          {/* Delete - Own messages or admins */}
          {canDelete && (
            <DropdownMenuItem 
              onClick={() => setIsDeleteDialogOpen(true)}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 me-2" />
              {language === 'ar' ? 'حذف للجميع' : 'Delete for everyone'}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تعديل الرسالة' : 'Edit Message'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder={language === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
              className="w-full"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleEdit();
                }
              }}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={editMessage.isPending}
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!editContent.trim() || editMessage.isPending}
            >
              {editMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                language === 'ar' ? 'حفظ' : 'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'ar' ? 'حذف الرسالة للجميع؟' : 'Delete Message for Everyone?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'ar' 
                ? 'سيتم حذف هذه الرسالة نهائياً لجميع المستخدمين ولا يمكن استرجاعها.' 
                : 'This message will be permanently deleted for all users and cannot be recovered.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={deleteMessage.isPending}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMessage.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                language === 'ar' ? 'حذف للجميع' : 'Delete for everyone'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
