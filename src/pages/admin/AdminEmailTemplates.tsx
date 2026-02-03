import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  useEmailTemplates, 
  useUpdateEmailTemplate, 
  useSendTestEmail,
  EmailTemplate 
} from '@/hooks/useEmailTemplates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Mail, 
  Edit2, 
  Send, 
  Eye,
  CheckCircle,
  XCircle,
  Code,
} from 'lucide-react';

export default function AdminEmailTemplates() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { data: templates, isLoading } = useEmailTemplates();
  const updateTemplate = useUpdateEmailTemplate();
  const sendTestEmail = useSendTestEmail();
  
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isSendTestDialogOpen, setIsSendTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [editForm, setEditForm] = useState<Partial<EmailTemplate>>({});

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditForm({
      subject: template.subject,
      subject_ar: template.subject_ar || '',
      body_html: template.body_html,
      body_html_ar: template.body_html_ar || '',
      is_active: template.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedTemplate) return;
    
    updateTemplate.mutate(
      { id: selectedTemplate.id, ...editForm },
      {
        onSuccess: () => {
          toast({
            title: language === 'ar' ? 'تم حفظ القالب' : 'Template saved',
          });
          setIsEditDialogOpen(false);
        },
        onError: (error) => {
          toast({
            title: language === 'ar' ? 'فشل الحفظ' : 'Save failed',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewDialogOpen(true);
  };

  const handleSendTest = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setTestEmail('');
    setIsSendTestDialogOpen(true);
  };

  const handleSendTestEmail = () => {
    if (!selectedTemplate || !testEmail) return;
    
    // Create sample variables for testing
    const sampleVariables: Record<string, string> = {};
    selectedTemplate.variables?.forEach((v) => {
      sampleVariables[v] = `[${v}]`;
    });
    
    sendTestEmail.mutate(
      { 
        to: testEmail, 
        template_name: selectedTemplate.name, 
        variables: sampleVariables,
        language,
      },
      {
        onSuccess: () => {
          toast({
            title: language === 'ar' ? 'تم إرسال البريد التجريبي' : 'Test email sent',
          });
          setIsSendTestDialogOpen(false);
        },
        onError: (error) => {
          toast({
            title: language === 'ar' ? 'فشل الإرسال' : 'Send failed',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const toggleActive = (template: EmailTemplate) => {
    updateTemplate.mutate(
      { id: template.id, is_active: !template.is_active },
      {
        onSuccess: () => {
          toast({
            title: template.is_active 
              ? (language === 'ar' ? 'تم تعطيل القالب' : 'Template disabled')
              : (language === 'ar' ? 'تم تفعيل القالب' : 'Template enabled'),
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">
            {language === 'ar' ? 'قوالب البريد الإلكتروني' : 'Email Templates'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {language === 'ar' 
              ? 'إدارة وتخصيص قوالب البريد الإلكتروني'
              : 'Manage and customize email templates'}
          </p>
        </div>
        <Mail className="h-8 w-8 text-primary" />
      </div>

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
              <TableHead>{language === 'ar' ? 'الموضوع' : 'Subject'}</TableHead>
              <TableHead>{language === 'ar' ? 'المتغيرات' : 'Variables'}</TableHead>
              <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
              <TableHead className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates?.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    {template.name}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {language === 'ar' && template.subject_ar 
                    ? template.subject_ar 
                    : template.subject}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {template.variables?.slice(0, 3).map((v) => (
                      <Badge key={v} variant="outline" className="text-xs">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                    {(template.variables?.length || 0) > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{(template.variables?.length || 0) - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => toggleActive(template)}
                    className="flex items-center gap-1.5"
                  >
                    {template.is_active ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-sm text-success">
                          {language === 'ar' ? 'مفعل' : 'Active'}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {language === 'ar' ? 'معطل' : 'Inactive'}
                        </span>
                      </>
                    )}
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePreview(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSendTest(template)}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'تعديل القالب' : 'Edit Template'}: {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="english" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="english">English</TabsTrigger>
              <TabsTrigger value="arabic">العربية</TabsTrigger>
            </TabsList>
            
            <TabsContent value="english" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الموضوع (إنجليزي)' : 'Subject (English)'}</Label>
                <Input
                  value={editForm.subject || ''}
                  onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'المحتوى HTML (إنجليزي)' : 'Body HTML (English)'}</Label>
                <Textarea
                  value={editForm.body_html || ''}
                  onChange={(e) => setEditForm({ ...editForm, body_html: e.target.value })}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="arabic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'الموضوع (عربي)' : 'Subject (Arabic)'}</Label>
                <Input
                  dir="rtl"
                  value={editForm.subject_ar || ''}
                  onChange={(e) => setEditForm({ ...editForm, subject_ar: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'المحتوى HTML (عربي)' : 'Body HTML (Arabic)'}</Label>
                <Textarea
                  dir="rtl"
                  value={editForm.body_html_ar || ''}
                  onChange={(e) => setEditForm({ ...editForm, body_html_ar: e.target.value })}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center gap-2 pt-4 border-t">
            <Switch
              id="is_active"
              checked={editForm.is_active}
              onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
            />
            <Label htmlFor="is_active">
              {language === 'ar' ? 'تفعيل القالب' : 'Template active'}
            </Label>
          </div>

          {selectedTemplate?.variables && selectedTemplate.variables.length > 0 && (
            <div className="pt-4 border-t">
              <Label className="text-sm text-muted-foreground">
                {language === 'ar' ? 'المتغيرات المتاحة:' : 'Available variables:'}
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedTemplate.variables.map((v) => (
                  <Badge key={v} variant="secondary">
                    {`{{${v}}}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={updateTemplate.isPending}>
              {updateTemplate.isPending && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              {language === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'معاينة القالب' : 'Template Preview'}: {selectedTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <Label className="text-xs text-muted-foreground">
                {language === 'ar' ? 'الموضوع' : 'Subject'}
              </Label>
              <p className="font-medium">
                {language === 'ar' && selectedTemplate?.subject_ar 
                  ? selectedTemplate.subject_ar 
                  : selectedTemplate?.subject}
              </p>
            </div>
            
            <div className="border rounded-lg p-4 bg-white text-foreground">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: language === 'ar' && selectedTemplate?.body_html_ar 
                    ? selectedTemplate.body_html_ar 
                    : selectedTemplate?.body_html || '' 
                }} 
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Test Dialog */}
      <Dialog open={isSendTestDialogOpen} onOpenChange={setIsSendTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ar' ? 'إرسال بريد تجريبي' : 'Send Test Email'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              </Label>
              <Input
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' 
                ? 'سيتم استبدال المتغيرات بقيم نموذجية'
                : 'Variables will be replaced with sample values'}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendTestDialogOpen(false)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleSendTestEmail} 
              disabled={sendTestEmail.isPending || !testEmail}
            >
              {sendTestEmail.isPending && <Loader2 className="h-4 w-4 animate-spin me-2" />}
              <Send className="h-4 w-4 me-2" />
              {language === 'ar' ? 'إرسال' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
