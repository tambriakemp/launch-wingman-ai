import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Loader2, Webhook, Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SureContactConfigItem {
  config_type: string;
  name: string;
  surecontact_uuid: string;
}

interface WebhookConfig {
  id: string;
  name: string;
  webhook_url: string;
  list_id: string | null;
  tag_ids: string[];
  trigger_event: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface WebhookFormData {
  name: string;
  webhook_url: string;
  list_id: string;
  tag_ids: string[];
  trigger_event: string;
  is_active: boolean;
}

const TRIGGER_EVENTS = [
  { value: 'manual', label: 'Manual' },
  { value: 'free_signup', label: 'Free Signup' },
  { value: 'pro_upgrade', label: 'Pro Upgrade' },
  { value: 'plan_cancelled', label: 'Plan Cancelled' },
  { value: 'reactivated', label: 'Reactivated' },
];

const emptyForm: WebhookFormData = {
  name: '',
  webhook_url: '',
  list_id: '',
  tag_ids: [],
  trigger_event: 'manual',
  is_active: true,
};

interface Props {
  sureContactConfig: SureContactConfigItem[];
}

export function SureContactWebhooksCard({ sureContactConfig }: Props) {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WebhookFormData>(emptyForm);

  const lists = sureContactConfig.filter(c => c.config_type === 'list');
  const tags = sureContactConfig.filter(c => c.config_type === 'tag');

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from('surecontact_incoming_webhooks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setWebhooks((data as unknown as WebhookConfig[]) || []);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (wh: WebhookConfig) => {
    setEditingId(wh.id);
    setForm({
      name: wh.name,
      webhook_url: wh.webhook_url,
      list_id: wh.list_id || '',
      tag_ids: wh.tag_ids || [],
      trigger_event: wh.trigger_event,
      is_active: wh.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.webhook_url) {
      toast.error('Name and webhook URL are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        webhook_url: form.webhook_url,
        list_id: form.list_id || null,
        tag_ids: form.tag_ids,
        trigger_event: form.trigger_event,
        is_active: form.is_active,
      };

      if (editingId) {
        const { error } = await supabase
          .from('surecontact_incoming_webhooks')
          .update(payload as any)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Webhook updated');
      } else {
        const { error } = await supabase
          .from('surecontact_incoming_webhooks')
          .insert(payload as any);
        if (error) throw error;
        toast.success('Webhook created');
      }
      setDialogOpen(false);
      fetchWebhooks();
    } catch (error) {
      console.error('Error saving webhook:', error);
      toast.error('Failed to save webhook');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this webhook configuration?')) return;
    try {
      const { error } = await supabase
        .from('surecontact_incoming_webhooks')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Webhook deleted');
      fetchWebhooks();
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast.error('Failed to delete webhook');
    }
  };

  const handleToggleActive = async (wh: WebhookConfig) => {
    try {
      const { error } = await supabase
        .from('surecontact_incoming_webhooks')
        .update({ is_active: !wh.is_active } as any)
        .eq('id', wh.id);
      if (error) throw error;
      fetchWebhooks();
    } catch (error) {
      console.error('Error toggling webhook:', error);
      toast.error('Failed to update webhook');
    }
  };

  const toggleTag = (tagUuid: string) => {
    setForm(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagUuid)
        ? prev.tag_ids.filter(t => t !== tagUuid)
        : [...prev.tag_ids, tagUuid],
    }));
  };

  const getListName = (listId: string | null) => {
    if (!listId) return '—';
    return lists.find(l => l.surecontact_uuid === listId)?.name || listId.substring(0, 8) + '...';
  };

  const getTagName = (tagUuid: string) => {
    return tags.find(t => t.surecontact_uuid === tagUuid)?.name || tagUuid.substring(0, 8) + '...';
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Webhook className="h-5 w-5" />
                SureContact Incoming Webhooks
              </CardTitle>
              <CardDescription>
                Configure incoming webhooks to trigger email sequences on SureContact
              </CardDescription>
            </div>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No incoming webhooks configured yet.</p>
              <p className="text-sm mt-1">Click "Add Webhook" to set up your first email sequence trigger.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>List</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map(wh => (
                  <TableRow key={wh.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{wh.name}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                          {wh.webhook_url}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {TRIGGER_EVENTS.find(e => e.value === wh.trigger_event)?.label || wh.trigger_event}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{getListName(wh.list_id)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(wh.tag_ids || []).map(tagId => (
                          <Badge key={tagId} variant="secondary" className="text-xs">
                            {getTagName(tagId)}
                          </Badge>
                        ))}
                        {(!wh.tag_ids || wh.tag_ids.length === 0) && <span className="text-sm text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch checked={wh.is_active} onCheckedChange={() => handleToggleActive(wh)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(wh)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(wh.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Webhook' : 'Add Incoming Webhook'}</DialogTitle>
            <DialogDescription>
              Configure a SureContact incoming webhook to trigger an email sequence.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wh-name">Name</Label>
              <Input
                id="wh-name"
                placeholder="e.g., Free User Sequence"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wh-url">Webhook URL</Label>
              <Input
                id="wh-url"
                placeholder="https://api.surecontact.com/incoming-webhooks/..."
                value={form.webhook_url}
                onChange={e => setForm(prev => ({ ...prev, webhook_url: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Trigger Event</Label>
              <Select
                value={form.trigger_event}
                onValueChange={v => setForm(prev => ({ ...prev, trigger_event: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_EVENTS.map(e => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>List</Label>
              <Select
                value={form.list_id || 'none'}
                onValueChange={v => setForm(prev => ({ ...prev, list_id: v === 'none' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a list..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No list</SelectItem>
                  {lists.map(l => (
                    <SelectItem key={l.surecontact_uuid} value={l.surecontact_uuid}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg min-h-[42px] bg-card">
                {tags.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No tags synced yet</span>
                ) : (
                  tags.map(tag => (
                    <Badge
                      key={tag.surecontact_uuid}
                      variant={form.tag_ids.includes(tag.surecontact_uuid) ? 'default' : 'outline'}
                      className="cursor-pointer transition-colors"
                      onClick={() => toggleTag(tag.surecontact_uuid)}
                    >
                      {tag.name}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={v => setForm(prev => ({ ...prev, is_active: v }))}
              />
              <Label>Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? 'Save Changes' : 'Create Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
