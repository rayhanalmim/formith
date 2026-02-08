/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminUsers, useUpdateUserRole, useToggleUserBan, useUpdateUserUsername, useDeleteUser, useToggleUserVerified } from '@/hooks/useAdmin';
import { getAvatarUrl } from '@/lib/default-images';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Search, BadgeCheck, Ban, UserCheck, Shield, User, Crown, Pencil, Download, MoreHorizontal, Users, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { exportToCSV, formatDateForCSV } from '@/lib/csv-export';

const roleColors: Record<string, string> = {
  admin: 'bg-primary text-primary-foreground',
  manager: 'bg-secondary text-secondary-foreground',
  moderator: 'bg-info text-info-foreground',
  user: 'bg-muted text-muted-foreground',
};

const roleIcons: Record<string, any> = {
  admin: Crown,
  manager: Shield,
  moderator: UserCheck,
  user: User,
};

export default function AdminUsers() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { data: users, isLoading } = useAdminUsers();
  const updateRole = useUpdateUserRole();
  const toggleBan = useToggleUserBan();
  const updateUsername = useUpdateUserUsername();
  const deleteUser = useDeleteUser();
  const toggleVerified = useToggleUserVerified();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'ban' | 'unban' | 'role' | null>(null);
  const [bulkRole, setBulkRole] = useState<'admin' | 'manager' | 'moderator' | 'user'>('user');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [banReason, setBanReason] = useState('');
  const [newUsername, setNewUsername] = useState('');
  
  const filteredUsers = users?.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(filteredUsers.map(u => u.user_id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleRoleChange = async (userId: string, role: 'admin' | 'manager' | 'moderator' | 'user') => {
    try {
      await updateRole.mutateAsync({ userId, role });
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: language === 'ar' ? 'تم تغيير صلاحية المستخدم' : 'User role updated successfully',
      });
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleBanClick = (user: any) => {
    setSelectedUser(user);
    setBanReason('');
    setBanDialogOpen(true);
  };

  const handleDeleteClick = (user: any) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteUser.mutateAsync(selectedUser.user_id);
      
      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted',
        description: language === 'ar' ? 'تم حذف المستخدم بنجاح' : 'User deleted successfully',
      });
      
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUsernameClick = (user: any) => {
    setSelectedUser(user);
    setNewUsername(user.username || '');
    setUsernameDialogOpen(true);
  };

  const handleUsernameConfirm = async () => {
    if (!selectedUser || !newUsername.trim()) return;
    
    try {
      await updateUsername.mutateAsync({
        userId: selectedUser.user_id,
        username: newUsername.trim(),
      });
      
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: language === 'ar' ? 'تم تغيير اسم المستخدم' : 'Username updated successfully',
      });
      
      setUsernameDialogOpen(false);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleBanConfirm = async () => {
    if (!selectedUser) return;
    
    try {
      await toggleBan.mutateAsync({
        userId: selectedUser.user_id,
        isBanned: !selectedUser.is_banned,
        banReason: banReason || undefined,
        displayName: selectedUser.display_name || selectedUser.username || 'User',
      });
      
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: selectedUser.is_banned 
          ? (language === 'ar' ? 'تم إلغاء الحظر وتم إرسال بريد للمستخدم' : 'User unbanned and notified by email')
          : (language === 'ar' ? 'تم حظر المستخدم وتم إرسال بريد له' : 'User banned and notified by email'),
      });
      
      setBanDialogOpen(false);
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleToggleVerified = async (user: any) => {
    try {
      await toggleVerified.mutateAsync({
        userId: user.user_id,
        isVerified: !user.is_verified,
      });
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated',
        description: user.is_verified
          ? (language === 'ar' ? 'تم إزالة التوثيق' : 'Verification removed')
          : (language === 'ar' ? 'تم توثيق المستخدم' : 'User verified'),
      });
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleExportUsers = () => {
    if (!users) return;
    
    exportToCSV(
      users.map(user => ({
        username: user.username || '',
        display_name: user.display_name || '',
        role: (user.user_roles as any[])?.[0]?.role || 'user',
        is_verified: user.is_verified ? 'Yes' : 'No',
        is_banned: user.is_banned ? 'Yes' : 'No',
        followers_count: user.followers_count || 0,
        posts_count: user.posts_count || 0,
        created_at: formatDateForCSV(user.created_at),
      })),
      'users-export',
      [
        { key: 'username', header: 'Username' },
        { key: 'display_name', header: 'Display Name' },
        { key: 'role', header: 'Role' },
        { key: 'is_verified', header: 'Verified' },
        { key: 'is_banned', header: 'Banned' },
        { key: 'followers_count', header: 'Followers' },
        { key: 'posts_count', header: 'Posts' },
        { key: 'created_at', header: 'Joined' },
      ]
    );
    
    toast({
      title: language === 'ar' ? 'تم التصدير' : 'Exported',
      description: language === 'ar' ? 'تم تصدير بيانات المستخدمين' : 'Users data exported successfully',
    });
  };

  const handleBulkAction = (action: 'ban' | 'unban' | 'role') => {
    setBulkAction(action);
    setBulkActionDialogOpen(true);
  };

  const handleBulkConfirm = async () => {
    if (selectedUsers.size === 0) return;
    
    try {
      const userIds = Array.from(selectedUsers);
      
      if (bulkAction === 'ban') {
        await Promise.all(userIds.map(userId => {
          const user = users?.find(u => u.user_id === userId);
          return toggleBan.mutateAsync({ 
            userId, 
            isBanned: true, 
            banReason: banReason || undefined,
            displayName: user?.display_name || user?.username || 'User',
          });
        }));
        toast({
          title: language === 'ar' ? 'تم الحظر' : 'Banned',
          description: language === 'ar' 
            ? `تم حظر ${userIds.length} مستخدم وتم إرسال بريد لهم` 
            : `${userIds.length} users banned and notified by email`,
        });
      } else if (bulkAction === 'unban') {
        await Promise.all(userIds.map(userId => {
          const user = users?.find(u => u.user_id === userId);
          return toggleBan.mutateAsync({ 
            userId, 
            isBanned: false,
            displayName: user?.display_name || user?.username || 'User',
          });
        }));
        toast({
          title: language === 'ar' ? 'تم إلغاء الحظر' : 'Unbanned',
          description: language === 'ar' 
            ? `تم إلغاء حظر ${userIds.length} مستخدم وتم إرسال بريد لهم` 
            : `${userIds.length} users unbanned and notified by email`,
        });
      } else if (bulkAction === 'role') {
        await Promise.all(userIds.map(userId => 
          updateRole.mutateAsync({ userId, role: bulkRole })
        ));
        toast({
          title: language === 'ar' ? 'تم التحديث' : 'Updated',
          description: language === 'ar' 
            ? `تم تغيير صلاحية ${userIds.length} مستخدم` 
            : `${userIds.length} users role updated`,
        });
      }
      
      setSelectedUsers(new Set());
      setBulkActionDialogOpen(false);
      setBanReason('');
    } catch (error: any) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'إدارة المستخدمين' : 'User Management'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' 
              ? 'إدارة صلاحيات وحالة المستخدمين' 
              : 'Manage user roles and status'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedUsers.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Users className="h-4 w-4" />
                  {language === 'ar' 
                    ? `${selectedUsers.size} مختار` 
                    : `${selectedUsers.size} selected`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkAction('ban')}>
                  <Ban className="h-4 w-4 me-2" />
                  {language === 'ar' ? 'حظر الكل' : 'Ban All'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('unban')}>
                  <UserCheck className="h-4 w-4 me-2" />
                  {language === 'ar' ? 'إلغاء حظر الكل' : 'Unban All'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleBulkAction('role')}>
                  <Shield className="h-4 w-4 me-2" />
                  {language === 'ar' ? 'تغيير الصلاحية' : 'Change Role'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button onClick={handleExportUsers} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            {language === 'ar' ? 'تصدير CSV' : 'Export CSV'}
          </Button>
        </div>
      </div>
      
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={language === 'ar' ? 'البحث عن مستخدم...' : 'Search users...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ps-10"
        />
      </div>
      
      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>{language === 'ar' ? 'المستخدم' : 'User'}</TableHead>
              <TableHead>{language === 'ar' ? 'اسم المستخدم' : 'Username'}</TableHead>
              <TableHead>{language === 'ar' ? 'الصلاحية' : 'Role'}</TableHead>
              <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
              <TableHead>{language === 'ar' ? 'تاريخ التسجيل' : 'Joined'}</TableHead>
              <TableHead>{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {language === 'ar' ? 'لا يوجد مستخدمين' : 'No users found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const userRoles = user.user_roles as Array<{ id: string; role: string }> | null;
                const userRole = userRoles?.[0]?.role || 'user';
                const RoleIcon = roleIcons[userRole] || User;
                
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.has(user.user_id)}
                        onCheckedChange={(checked) => handleSelectUser(user.user_id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={getAvatarUrl(user.avatar_url)}
                          alt=""
                          className="h-10 w-10 rounded-full bg-muted object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">
                              {language === 'ar' 
                                ? (user.display_name_ar || user.display_name || '-')
                                : (user.display_name || '-')}
                            </span>
                            {user.is_verified && (
                              <BadgeCheck className="h-4 w-4 verified-badge" />
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-sm">@{user.username || '-'}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleUsernameClick(user)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={userRole}
                        onValueChange={(value) => handleRoleChange(user.user_id, value as any)}
                        disabled={updateRole.isPending}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <RoleIcon className="h-4 w-4" />
                              <span className="capitalize">{userRole}</span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              User
                            </div>
                          </SelectItem>
                          <SelectItem value="moderator">
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4" />
                              Moderator
                            </div>
                          </SelectItem>
                          <SelectItem value="manager">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Manager
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Crown className="h-4 w-4" />
                              Admin
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {user.is_banned ? (
                        <Badge variant="destructive" className="gap-1">
                          <Ban className="h-3 w-3" />
                          {language === 'ar' ? 'محظور' : 'Banned'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-success border-success">
                          {language === 'ar' ? 'نشط' : 'Active'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(user.created_at), 'MMM d, yyyy', {
                        locale: language === 'ar' ? ar : enUS
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={user.is_verified ? 'default' : 'outline'}
                          size="sm"
                          className={user.is_verified ? 'gap-1 bg-blue-600 hover:bg-blue-700' : 'gap-1'}
                          onClick={() => handleToggleVerified(user)}
                          disabled={toggleVerified.isPending}
                        >
                          <BadgeCheck className="h-3.5 w-3.5" />
                          {user.is_verified 
                            ? (language === 'ar' ? 'موثق' : 'Verified')
                            : (language === 'ar' ? 'توثيق' : 'Verify')}
                        </Button>
                        <Button
                          variant={user.is_banned ? 'outline' : 'destructive'}
                          size="sm"
                          onClick={() => handleBanClick(user)}
                        >
                          {user.is_banned 
                            ? (language === 'ar' ? 'إلغاء الحظر' : 'Unban')
                            : (language === 'ar' ? 'حظر' : 'Ban')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.is_banned 
                ? (language === 'ar' ? 'إلغاء حظر المستخدم' : 'Unban User')
                : (language === 'ar' ? 'حظر المستخدم' : 'Ban User')}
            </DialogTitle>
          </DialogHeader>
          
          {!selectedUser?.is_banned && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'ar' ? 'سبب الحظر (اختياري)' : 'Ban Reason (optional)'}
              </label>
              <Textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder={language === 'ar' ? 'اكتب سبب الحظر...' : 'Enter ban reason...'}
              />
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              variant={selectedUser?.is_banned ? 'default' : 'destructive'}
              onClick={handleBanConfirm}
              disabled={toggleBan.isPending}
            >
              {selectedUser?.is_banned 
                ? (language === 'ar' ? 'إلغاء الحظر' : 'Unban')
                : (language === 'ar' ? 'حظر' : 'Ban')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Username Edit Dialog */}
      <Dialog open={usernameDialogOpen} onOpenChange={setUsernameDialogOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تعديل اسم المستخدم' : 'Edit Username'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === 'ar' ? 'اسم المستخدم الجديد' : 'New Username'}
            </label>
            <Input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder={language === 'ar' ? 'اسم المستخدم...' : 'Username...'}
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              {language === 'ar' 
                ? 'يجب أن يكون بين 3-30 حرف ويحتوي فقط على أحرف وأرقام و _'
                : 'Must be 3-30 characters with only letters, numbers, and underscores'}
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsernameDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleUsernameConfirm}
              disabled={updateUsername.isPending || !newUsername.trim()}
            >
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {language === 'ar' ? 'حذف المستخدم' : 'Delete User'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === 'ar' 
                ? 'هل أنت متأكد من حذف هذا المستخدم؟ سيتم حذف جميع بياناته نهائياً ولا يمكن التراجع عن هذا الإجراء.'
                : 'Are you sure you want to delete this user? All their data will be permanently deleted. This action cannot be undone.'}
            </p>
            
            {selectedUser && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <img
                  src={selectedUser.avatar_url || '/images/default-avatar.png'}
                  alt=""
                  className="h-10 w-10 rounded-full bg-muted"
                />
                <div>
                  <div className="font-medium">{selectedUser.display_name || selectedUser.username}</div>
                  <div className="text-sm text-muted-foreground">@{selectedUser.username}</div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending 
                ? (language === 'ar' ? 'جاري الحذف...' : 'Deleting...')
                : (language === 'ar' ? 'حذف' : 'Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>
              {bulkAction === 'ban' && (language === 'ar' ? 'حظر المستخدمين المختارين' : 'Ban Selected Users')}
              {bulkAction === 'unban' && (language === 'ar' ? 'إلغاء حظر المستخدمين المختارين' : 'Unban Selected Users')}
              {bulkAction === 'role' && (language === 'ar' ? 'تغيير صلاحية المستخدمين المختارين' : 'Change Role for Selected Users')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === 'ar' 
                ? `سيتم تطبيق هذا الإجراء على ${selectedUsers.size} مستخدم`
                : `This action will apply to ${selectedUsers.size} users`}
            </p>
            
            {bulkAction === 'ban' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === 'ar' ? 'سبب الحظر (اختياري)' : 'Ban Reason (optional)'}
                </label>
                <Textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder={language === 'ar' ? 'اكتب سبب الحظر...' : 'Enter ban reason...'}
                />
              </div>
            )}
            
            {bulkAction === 'role' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === 'ar' ? 'الصلاحية الجديدة' : 'New Role'}
                </label>
                <Select value={bulkRole} onValueChange={(v) => setBulkRole(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              variant={bulkAction === 'ban' ? 'destructive' : 'default'}
              onClick={handleBulkConfirm}
              disabled={toggleBan.isPending || updateRole.isPending}
            >
              {language === 'ar' ? 'تأكيد' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
