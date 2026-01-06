import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Download, RefreshCw, FileJson, CheckCircle, Package } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

export function ExportMyDataDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    if (!user) return;
    
    setLoading(true);
    setSuccess(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in again');
        return;
      }

      const { data, error } = await supabase.functions.invoke('export-my-data', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Download the JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess(true);
      toast.success('Your data has been exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to export your data');
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
        <Button variant="outline">
          <Package className="w-4 h-4 mr-2" />
          Download My Data
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Export Your Data
          </DialogTitle>
          <DialogDescription>
            Download a copy of all your personal data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Your export will include:
          </p>
          <ul className="text-sm space-y-1.5 ml-4">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              Profile and account settings
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              All your projects and content
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              Brand assets (colors, fonts)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              Offers and sales copy
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              Content drafts and schedules
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              Metrics and launch data
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              Check-in history
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">
            The export will be downloaded as a JSON file that you can keep for your records.
          </p>
        </div>

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-400">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Your data has been downloaded!</span>
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
                Preparing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
