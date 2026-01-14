import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, Users, FlaskConical, RefreshCw, UserCheck, Settings, Tag, List, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { TikTokEnvironmentToggle } from './TikTokEnvironmentToggle';

interface SureContactConfigItem {
  config_type: string;
  name: string;
  surecontact_uuid: string;
  updated_at: string;
}

export function ConfigTab() {
  const { user } = useAuth();
  const [syncLoading, setSyncLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [sureContactSyncLoading, setSureContactSyncLoading] = useState(false);
  const [sureContactTestLoading, setSureContactTestLoading] = useState(false);
  const [sureContactConfigLoading, setSureContactConfigLoading] = useState(false);
  const [sureContactConfig, setSureContactConfig] = useState<SureContactConfigItem[]>([]);
  const [lastSyncResult, setLastSyncResult] = useState<{
    contacts_synced: number;
    success_count: number;
  } | null>(null);
  const [lastTestResult, setLastTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [sureContactSyncResult, setSureContactSyncResult] = useState<{
    total: number;
    success_count: number;
  } | null>(null);
  const [sureContactTestResult, setSureContactTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchSureContactConfig();
  }, []);

  const fetchSureContactConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('surecontact_config')
        .select('config_type, name, surecontact_uuid, updated_at')
        .order('config_type', { ascending: true });

      if (error) throw error;
      setSureContactConfig(data || []);
    } catch (error) {
      console.error('Error fetching SureContact config:', error);
    }
  };

  const handleFetchSureContactConfig = async () => {
    setSureContactConfigLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('surecontact-init');

      if (error) throw error;

      toast.success(`Fetched ${data.total_items} config items from SureContact`);
      fetchSureContactConfig();
    } catch (error) {
      console.error('SureContact config fetch error:', error);
      toast.error('Failed to fetch SureContact configuration');
    } finally {
      setSureContactConfigLoading(false);
    }
  };

  const handleSyncToMarketing = async () => {
    setSyncLoading(true);
    setLastSyncResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('marketing-webhook', {
        body: { action: 'sync_all', event_type: 'manual_sync' },
      });

      if (error) throw error;

      const successCount = data.results?.filter((r: { success: boolean }) => r.success).length || 0;
      setLastSyncResult({
        contacts_synced: data.contacts_synced,
        success_count: successCount,
      });

      if (successCount === data.contacts_synced) {
        toast.success(`Successfully synced ${data.contacts_synced} contacts to marketing platform`);
      } else {
        toast.warning(`Synced ${successCount} of ${data.contacts_synced} contacts. Some failed.`);
      }
    } catch (error) {
      console.error('Marketing sync error:', error);
      toast.error('Failed to sync contacts to marketing platform');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!user?.id) {
      toast.error('No user session found');
      return;
    }

    setTestLoading(true);
    setLastTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('marketing-webhook', {
        body: { action: 'sync_user', user_id: user.id, event_type: 'test_webhook' },
      });

      if (error) throw error;

      const result = data.results?.[0];
      if (result?.success) {
        setLastTestResult({ success: true, message: 'Test webhook sent successfully!' });
        toast.success('Test webhook sent successfully!');
      } else {
        setLastTestResult({ 
          success: false, 
          message: result?.error || `HTTP ${result?.status}: ${result?.response || 'Unknown error'}` 
        });
        toast.error('Test webhook failed - check configuration');
      }
    } catch (error) {
      console.error('Test webhook error:', error);
      setLastTestResult({ success: false, message: 'Failed to send test webhook' });
      toast.error('Failed to send test webhook');
    } finally {
      setTestLoading(false);
    }
  };

  const handleSureContactSync = async () => {
    setSureContactSyncLoading(true);
    setSureContactSyncResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('surecontact-webhook', {
        body: { action: 'sync_all' },
      });

      if (error) throw error;

      const successCount = data.results?.filter((r: { success: boolean }) => r.success).length || 0;
      const total = data.results?.length || 0;
      
      setSureContactSyncResult({
        total,
        success_count: successCount,
      });

      if (successCount === total) {
        toast.success(`Successfully synced ${total} contacts to SureContact`);
      } else {
        toast.warning(`Synced ${successCount} of ${total} contacts to SureContact. Some failed.`);
      }
    } catch (error) {
      console.error('SureContact sync error:', error);
      toast.error('Failed to sync contacts to SureContact');
    } finally {
      setSureContactSyncLoading(false);
    }
  };

  const handleSureContactTest = async () => {
    if (!user?.id) {
      toast.error('No user session found');
      return;
    }

    setSureContactTestLoading(true);
    setSureContactTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('surecontact-webhook', {
        body: { action: 'sync_user', user_id: user.id, event_type: 'test_webhook' },
      });

      if (error) throw error;

      const result = data.results?.[0];
      if (result?.success) {
        setSureContactTestResult({ success: true, message: 'Test sent successfully!' });
        toast.success('Test webhook sent to SureContact!');
      } else {
        setSureContactTestResult({ 
          success: false, 
          message: result?.error || 'Unknown error' 
        });
        toast.error('SureContact test failed - check configuration');
      }
    } catch (error) {
      console.error('SureContact test error:', error);
      setSureContactTestResult({ success: false, message: 'Failed to send test' });
      toast.error('Failed to send test to SureContact');
    } finally {
      setSureContactTestLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* TikTok Environment Toggle */}
      <TikTokEnvironmentToggle />

      {/* Marketing Sync Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Send className="h-5 w-5" />
            Marketing Platform Sync
          </CardTitle>
          <CardDescription>
            Send contact data (name, email, membership, dates) to your email marketing platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <Button
              variant="outline"
              onClick={handleTestWebhook}
              disabled={testLoading}
              className="gap-2"
            >
              {testLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <FlaskConical className="h-4 w-4" />
                  Test Webhook
                </>
              )}
            </Button>
            {lastTestResult && (
              <p className={`text-sm ${lastTestResult.success ? 'text-green-600' : 'text-destructive'}`}>
                {lastTestResult.message}
              </p>
            )}
            {!lastTestResult && (
              <p className="text-sm text-muted-foreground">
                Sends your admin account as a test contact
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button
              onClick={handleSyncToMarketing}
              disabled={syncLoading}
              className="gap-2"
            >
              {syncLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Sync All Contacts
                </>
              )}
            </Button>
            {lastSyncResult && (
              <p className="text-sm text-muted-foreground">
                Last sync: {lastSyncResult.success_count}/{lastSyncResult.contacts_synced} contacts synced successfully
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SureContact Configuration Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5" />
                SureContact Configuration
              </CardTitle>
              <CardDescription>
                Tags, lists, and custom fields synced from SureContact
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleFetchSureContactConfig}
              disabled={sureContactConfigLoading}
              className="gap-2"
            >
              {sureContactConfigLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Fetch Config
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sureContactConfig.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No SureContact configuration found.</p>
              <p className="text-sm mt-1">Click "Fetch Config" to sync tags, lists, and custom fields from your SureContact account.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Tag className="h-4 w-4" />
                  Tags ({sureContactConfig.filter(c => c.config_type === 'tag').length})
                </div>
                <div className="space-y-1">
                  {sureContactConfig
                    .filter(c => c.config_type === 'tag')
                    .map(tag => (
                      <div key={tag.surecontact_uuid} className="text-sm p-2 bg-muted/50 rounded flex justify-between items-center">
                        <span>{tag.name}</span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {tag.surecontact_uuid.substring(0, 8)}...
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <List className="h-4 w-4" />
                  Lists ({sureContactConfig.filter(c => c.config_type === 'list').length})
                </div>
                <div className="space-y-1">
                  {sureContactConfig
                    .filter(c => c.config_type === 'list')
                    .map(list => (
                      <div key={list.surecontact_uuid} className="text-sm p-2 bg-muted/50 rounded flex justify-between items-center">
                        <span>{list.name}</span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {list.surecontact_uuid.substring(0, 8)}...
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <FileText className="h-4 w-4" />
                  Custom Fields ({sureContactConfig.filter(c => c.config_type === 'custom_field').length})
                </div>
                <div className="space-y-1">
                  {sureContactConfig
                    .filter(c => c.config_type === 'custom_field')
                    .map(field => (
                      <div key={field.surecontact_uuid} className="text-sm p-2 bg-muted/50 rounded flex justify-between items-center">
                        <span>{field.name}</span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {field.surecontact_uuid.substring(0, 8)}...
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
          {sureContactConfig.length > 0 && (
            <p className="text-xs text-muted-foreground mt-4">
              Last updated: {sureContactConfig[0]?.updated_at ? format(new Date(sureContactConfig[0].updated_at), 'MMM d, yyyy h:mm a') : 'Unknown'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* SureContact Sync Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCheck className="h-5 w-5" />
            SureContact Sync
          </CardTitle>
          <CardDescription>
            Send contact data (name, email, subscription status) to SureContact via REST API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sureContactConfig.length === 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
              ⚠️ Please fetch SureContact configuration first before syncing contacts.
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <Button
              variant="outline"
              onClick={handleSureContactTest}
              disabled={sureContactTestLoading || sureContactConfig.length === 0}
              className="gap-2"
            >
              {sureContactTestLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <FlaskConical className="h-4 w-4" />
                  Test SureContact
                </>
              )}
            </Button>
            {sureContactTestResult && (
              <p className={`text-sm ${sureContactTestResult.success ? 'text-green-600' : 'text-destructive'}`}>
                {sureContactTestResult.message}
              </p>
            )}
            {!sureContactTestResult && (
              <p className="text-sm text-muted-foreground">
                Sends your admin account as a test contact
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button
              onClick={handleSureContactSync}
              disabled={sureContactSyncLoading || sureContactConfig.length === 0}
              className="gap-2"
            >
              {sureContactSyncLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Sync All to SureContact
                </>
              )}
            </Button>
            {sureContactSyncResult && (
              <p className="text-sm text-muted-foreground">
                Last sync: {sureContactSyncResult.success_count}/{sureContactSyncResult.total} contacts synced successfully
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
