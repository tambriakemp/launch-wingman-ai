import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Key, Copy, RefreshCw, Check, Send } from 'lucide-react';

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  accessToken: string;
  onUserUpdated: () => void;
}

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  accessToken,
  onUserUpdated,
}: EditUserDialogProps) {
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [sendPasswordNotification, setSendPasswordNotification] = useState(false);

  const handleClose = () => {
    setNewEmail('');
    setTempPassword(null);
    setCopied(false);
    setSendEmailNotification(true);
    setSendPasswordNotification(false);
    onOpenChange(false);
  };

  const handleUpdateEmail = async () => {
    if (!user || !newEmail.trim()) return;

    setEmailLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          action: 'update_email',
          user_id: user.id,
          new_email: newEmail.trim(),
          old_email: user.email,
          send_notification: sendEmailNotification,
        },
      });

      if (error) throw error;

      const message = data.email_sent 
        ? `Email updated to ${newEmail.trim()} and notification sent`
        : data.message || 'Email updated successfully';
      toast.success(message);
      onUserUpdated();
      handleClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update email');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGenerateTempPassword = async () => {
    if (!user) return;

    setPasswordLoading(true);
    setTempPassword(null);
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          action: 'set_temp_password',
          user_id: user.id,
          send_notification: sendPasswordNotification,
        },
      });

      if (error) throw error;

      setTempPassword(data.temp_password);
      
      const message = data.email_sent 
        ? 'Temporary password generated and sent to user'
        : 'Temporary password generated';
      toast.success(message);
      onUserUpdated();
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCopyPassword = async () => {
    if (!tempPassword) return;
    
    await navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    toast.success('Password copied to clipboard');
    
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  const userName = user.first_name || user.last_name 
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
    : user.email;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Managing account for <strong>{userName}</strong>
            <br />
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="text-xs sm:text-sm">
              <Mail className="h-4 w-4 mr-2" />
              Update Email
            </TabsTrigger>
            <TabsTrigger value="password" className="text-xs sm:text-sm">
              <Key className="h-4 w-4 mr-2" />
              Temp Password
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="currentEmail">Current Email</Label>
              <Input
                id="currentEmail"
                value={user.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newEmail">New Email</Label>
              <Input
                id="newEmail"
                type="email"
                placeholder="Enter correct email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendEmailNotification"
                checked={sendEmailNotification}
                onCheckedChange={(checked) => setSendEmailNotification(checked === true)}
              />
              <Label 
                htmlFor="sendEmailNotification" 
                className="text-sm font-normal cursor-pointer flex items-center gap-2"
              >
                <Send className="h-3 w-3" />
                Send email notification to new address
              </Label>
            </div>
            <DialogFooter>
              <Button
                onClick={handleUpdateEmail}
                disabled={emailLoading || !newEmail.trim()}
              >
                {emailLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Email'
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="password" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Generate a temporary password for this user. You can optionally send it via email, or share it through a secure channel (phone, etc.).
            </p>

            {tempPassword ? (
              <div className="space-y-3">
                <div className="p-4 bg-muted rounded-lg">
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Temporary Password (only shown once)
                  </Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-sm bg-background p-2 rounded border">
                      {tempPassword}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyPassword}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-amber-600">
                  ⚠️ This password will not be shown again. Make sure to copy it now.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendPasswordNotification"
                    checked={sendPasswordNotification}
                    onCheckedChange={(checked) => setSendPasswordNotification(checked === true)}
                  />
                  <Label 
                    htmlFor="sendPasswordNotification" 
                    className="text-sm font-normal cursor-pointer flex items-center gap-2"
                  >
                    <Send className="h-3 w-3" />
                    Send password to user via email
                  </Label>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleGenerateTempPassword}
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        Generate Temporary Password
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
