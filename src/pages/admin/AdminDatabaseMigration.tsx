import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDatabaseMigration, PostgresConnectionConfig } from '@/hooks/useDatabaseMigration';
import { Database, Server, CheckCircle2, XCircle, AlertTriangle, Loader2, Zap, Cloud, Shield, Table, RefreshCw, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function AdminDatabaseMigration() {
  const { language } = useLanguage();
  const {
    isLoading,
    isMigrating,
    isCleaning,
    status,
    migrationResult,
    cleanupResult,
    connectionTest,
    fetchStatus,
    testConnection,
    startMigration,
    cleanupSupabase,
  } = useDatabaseMigration();

  const [showPassword, setShowPassword] = useState(false);
  const [connectionConfig, setConnectionConfig] = useState<PostgresConnectionConfig>({
    host: '',
    port: '25060',
    database: 'defaultdb',
    username: 'doadmin',
    password: '',
    sslmode: 'require',
  });

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleTestConnection = () => {
    testConnection(connectionConfig);
  };

  const handleStartMigration = () => {
    startMigration(connectionConfig);
  };

  const handleCleanupSupabase = () => {
    cleanupSupabase();
  };

  const updateConfig = (field: keyof PostgresConnectionConfig, value: string) => {
    setConnectionConfig(prev => ({ ...prev, [field]: value }));
  };

  const isConfigValid = connectionConfig.host && connectionConfig.port && 
    connectionConfig.database && connectionConfig.username && connectionConfig.password;

  // Show ALL tables to migrate (including those with 0 rows - they still need to be created in DO)
  const allMigrateTables = status?.tables.filter(t => t.category === 'migrate') || [];
  const pendingTables = allMigrateTables.filter(t => t.rowCount > 0);
  const emptyTables = allMigrateTables.filter(t => t.rowCount === 0);
  const authTables = status?.tables.filter(t => t.category === 'auth') || [];
  const totalPendingRows = pendingTables.reduce((sum, t) => sum + t.rowCount, 0);
  const totalAuthRows = authTables.reduce((sum, t) => sum + t.rowCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'ar' ? 'ترحيل قاعدة البيانات' : 'Database Migration'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' 
              ? 'ترحيل البيانات إلى DigitalOcean PostgreSQL 18' 
              : 'Migrate data to DigitalOcean PostgreSQL 18'}
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchStatus()} disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4 me-2", isLoading && "animate-spin")} />
          {language === 'ar' ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      {/* Connection Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            {language === 'ar' ? 'إعدادات الاتصال' : 'Connection Settings'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' 
              ? 'أدخل بيانات الاتصال بـ DigitalOcean PostgreSQL'
              : 'Enter your DigitalOcean PostgreSQL connection details'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">{language === 'ar' ? 'المضيف (Host)' : 'Host'}</Label>
              <Input
                id="host"
                placeholder="db-postgresql-xxx.ondigitalocean.com"
                value={connectionConfig.host}
                onChange={(e) => updateConfig('host', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">{language === 'ar' ? 'المنفذ (Port)' : 'Port'}</Label>
              <Input
                id="port"
                placeholder="25060"
                value={connectionConfig.port}
                onChange={(e) => updateConfig('port', e.target.value)}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="database">{language === 'ar' ? 'قاعدة البيانات' : 'Database'}</Label>
              <Input
                id="database"
                placeholder="defaultdb"
                value={connectionConfig.database}
                onChange={(e) => updateConfig('database', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sslmode">{language === 'ar' ? 'وضع SSL' : 'SSL Mode'}</Label>
              <Select value={connectionConfig.sslmode} onValueChange={(v) => updateConfig('sslmode', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="require">require</SelectItem>
                  <SelectItem value="verify-ca">verify-ca</SelectItem>
                  <SelectItem value="verify-full">verify-full</SelectItem>
                  <SelectItem value="disable">disable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">{language === 'ar' ? 'اسم المستخدم' : 'Username'}</Label>
              <Input
                id="username"
                placeholder="doadmin"
                value={connectionConfig.username}
                onChange={(e) => updateConfig('username', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{language === 'ar' ? 'كلمة المرور' : 'Password'}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={connectionConfig.password}
                  onChange={(e) => updateConfig('password', e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute end-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            {connectionTest && (
              <Badge variant={connectionTest.success ? 'default' : 'destructive'}>
                {connectionTest.success 
                  ? (language === 'ar' ? 'متصل' : 'Connected') 
                  : (language === 'ar' ? 'فشل' : 'Failed')}
              </Badge>
            )}
            <Button onClick={handleTestConnection} disabled={isLoading || !isConfigValid} variant="outline">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === 'ar' ? 'اختبار الاتصال' : 'Test Connection')}
            </Button>
          </div>

          {connectionTest?.error && (
            <p className="text-sm text-destructive">{connectionTest.error}</p>
          )}
        </CardContent>
      </Card>

      {/* Migration Action */}
      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {language === 'ar' ? 'ترحيل فوري' : 'One-Click Migration'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' 
              ? `ترحيل ${totalPendingRows.toLocaleString()} صف من ${allMigrateTables.length} جدول إلى DigitalOcean`
              : `Migrate ${totalPendingRows.toLocaleString()} rows from ${allMigrateTables.length} tables to DigitalOcean`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {emptyTables.length > 0 && (
            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-primary">
                    {language === 'ar' ? `${emptyTables.length} جدول فارغ` : `${emptyTables.length} Empty Tables`}
                  </p>
                  <p className="text-muted-foreground">
                    {language === 'ar' 
                      ? 'سيتم إنشاء هذه الجداول في DigitalOcean حتى لو كانت فارغة'
                      : 'These tables will be created in DigitalOcean even though they are empty'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning">
                  {language === 'ar' ? 'تحذير' : 'Warning'}
                </p>
                <p className="text-muted-foreground">
                  {language === 'ar' 
                    ? 'سيتم حذف البيانات الموجودة في DigitalOcean واستبدالها بالبيانات من Lovable Cloud. جداول المستخدمين ستبقى على Lovable Cloud.'
                    : 'Existing data in DigitalOcean will be replaced with data from Lovable Cloud. User/auth tables will remain on Lovable Cloud.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  size="lg" 
                  className="flex-1" 
                  disabled={isMigrating || !isConfigValid || !connectionTest?.success || allMigrateTables.length === 0}
                >
                  {isMigrating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {language === 'ar' ? 'جاري الترحيل...' : 'Migrating...'}
                    </>
                  ) : (
                    <>
                      <Database className="h-5 w-5 mr-2" />
                      {language === 'ar' ? 'بدء الترحيل الآن' : 'Start Migration Now'}
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {language === 'ar' ? 'تأكيد الترحيل' : 'Confirm Migration'}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {language === 'ar' 
                      ? `هل أنت متأكد من ترحيل ${totalPendingRows.toLocaleString()} صف إلى DigitalOcean PostgreSQL؟ هذا الإجراء سيستبدل أي بيانات موجودة.`
                      : `Are you sure you want to migrate ${totalPendingRows.toLocaleString()} rows to DigitalOcean PostgreSQL? This will replace any existing data.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={handleStartMigration}>
                    {language === 'ar' ? 'نعم، ابدأ الترحيل' : 'Yes, Start Migration'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Cleanup Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  size="lg" 
                  variant="destructive"
                  className="flex-1" 
                  disabled={isCleaning || totalPendingRows === 0}
                >
                  {isCleaning ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {language === 'ar' ? 'جاري الحذف...' : 'Cleaning...'}
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-5 w-5 mr-2" />
                      {language === 'ar' ? 'حذف من Supabase' : 'Cleanup Supabase'}
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Cleanup'}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {language === 'ar' 
                      ? `هل أنت متأكد من حذف ${totalPendingRows.toLocaleString()} صف من Supabase؟ تأكد من ترحيل البيانات إلى DigitalOcean أولاً!`
                      : `Are you sure you want to delete ${totalPendingRows.toLocaleString()} rows from Supabase? Make sure you've migrated to DigitalOcean first!`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={handleCleanupSupabase} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {language === 'ar' ? 'نعم، احذف البيانات' : 'Yes, Delete Data'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Migration Results */}
      {migrationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {migrationResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              {language === 'ar' ? 'نتائج الترحيل' : 'Migration Results'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-500/10 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{migrationResult.successCount}</p>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'جداول ناجحة' : 'Tables Succeeded'}</p>
              </div>
              <div className="text-center p-4 bg-red-500/10 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{migrationResult.failedCount}</p>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'جداول فاشلة' : 'Tables Failed'}</p>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-2xl font-bold text-primary">{migrationResult.totalMigrated.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي الصفوف' : 'Total Rows'}</p>
              </div>
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-2">
                {migrationResult.results.map((result) => (
                  <div key={result.table} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-mono text-sm">{result.table}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {result.rowsMigrated.toLocaleString()} {language === 'ar' ? 'صف' : 'rows'}
                      </span>
                      {result.error && (
                        <span className="text-xs text-red-500">{result.error}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Tables Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* All Tables to Migrate */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Table className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {language === 'ar' ? 'جداول للترحيل' : 'Tables to Migrate'}
                  <Badge>{allMigrateTables.length}</Badge>
                </CardTitle>
                <CardDescription>
                  {totalPendingRows > 0 
                    ? (language === 'ar' 
                        ? `${totalPendingRows.toLocaleString()} صف في ${pendingTables.length} جدول`
                        : `${totalPendingRows.toLocaleString()} rows in ${pendingTables.length} tables`)
                    : (language === 'ar'
                        ? `${emptyTables.length} جدول فارغ سيتم إنشاؤه`
                        : `${emptyTables.length} empty tables will be created`)}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-2">
                {/* Tables with data */}
                {pendingTables.map((table) => (
                  <div key={table.table} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="font-mono text-sm">{table.table}</span>
                    <Badge variant="secondary">{table.rowCount.toLocaleString()}</Badge>
                  </div>
                ))}
                {/* Empty tables */}
                {emptyTables.map((table) => (
                  <div key={table.table} className="flex items-center justify-between p-2 bg-muted/30 rounded border border-dashed border-muted-foreground/30">
                    <span className="font-mono text-sm text-muted-foreground">{table.table}</span>
                    <Badge variant="outline" className="text-muted-foreground">
                      {language === 'ar' ? 'فارغ' : 'empty'}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Auth Tables (Staying) */}
        <Card className="border-secondary/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Shield className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {language === 'ar' ? 'جداول تبقى على Cloud' : 'Staying on Cloud'}
                  <Badge variant="secondary">{authTables.length}</Badge>
                </CardTitle>
                <CardDescription>
                  {language === 'ar' 
                    ? `${totalAuthRows.toLocaleString()} صف للمستخدمين`
                    : `${totalAuthRows.toLocaleString()} user rows`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-2">
                {authTables.map((table) => (
                  <div key={table.table} className="flex items-center justify-between p-2 bg-secondary/10 rounded">
                    <div className="flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-secondary-foreground" />
                      <span className="font-mono text-sm">{table.table}</span>
                    </div>
                    <Badge variant="outline">{table.rowCount.toLocaleString()}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
