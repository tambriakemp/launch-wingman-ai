import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Download, RefreshCw, FileJson, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ExportUserDataDialogProps {
  userId: string;
  userEmail: string;
  userName: string;
  accessToken: string;
}

export function ExportUserDataDialog({
  userId,
  userEmail,
  userName,
  accessToken,
}: ExportUserDataDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      const { data, error } = await supabase.functions.invoke('admin-export-user-data', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: { user_id: userId },
      });

      if (error) throw error;

      // Download the JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-data-${userEmail.replace('@', '_at_')}-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess(true);
      toast.success('User data exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export user data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSuccess(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title="Export user data (GDPR)"
        >
          <Download className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Export User Data
          </DialogTitle>
          <DialogDescription>
            Generate a GDPR-compliant data export for {userName || userEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            This will export all data associated with this user including:
          </p>
          <ul className="text-sm space-y-1.5 ml-4">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              Profile and preferences
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              All projects and related content
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              Brand assets (colors, fonts, metadata)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              Offers, funnels, and sales copy
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              Content drafts and scheduled posts
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              Metrics and launch snapshots
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              Check-in history
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Note: Social connection tokens are excluded for security.
          </p>
        </div>

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2 text-emerald-700">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Export downloaded successfully!</span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
