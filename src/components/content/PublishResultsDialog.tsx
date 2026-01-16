import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Instagram,
  Facebook,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PublishResults,
  getOverallStatus,
  getResultsSummary,
  getErrorMessage,
  getErrorAction,
  formatPlatformName,
} from "@/utils/publishErrors";

// Platform icons
const PinterestIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.33-3.022.858-.712 2.05-1.14 3.451-1.238 1.075-.075 2.099.016 3.06.27-.07-.81-.283-1.452-.637-1.916-.457-.599-1.166-.91-2.106-.928-.793.012-1.478.227-2.04.64-.477.35-.807.832-.98 1.433l-2.004-.578c.263-.91.753-1.726 1.46-2.422.975-.96 2.293-1.47 3.808-1.476h.052c1.697.02 3.065.63 3.967 1.766.755.952 1.18 2.238 1.263 3.825.47.226.908.492 1.31.8 1.225.94 2.09 2.197 2.496 3.635.486 1.72.403 4.063-1.576 6.002-1.837 1.8-4.12 2.673-7.394 2.696zM12.59 14.39c-1.152.081-2.029.378-2.537.86-.388.368-.575.798-.543 1.247.03.424.25.81.638 1.115.488.384 1.18.588 2.003.541 1.07-.057 1.9-.455 2.467-1.183.493-.633.794-1.513.894-2.615-.935-.217-1.916-.307-2.922-.237z" />
  </svg>
);

const getPlatformIcon = (platform: string) => {
  const iconClass = "h-5 w-5";
  switch (platform.toLowerCase()) {
    case "instagram":
      return <Instagram className={iconClass} />;
    case "facebook":
      return <Facebook className={iconClass} />;
    case "pinterest":
      return <PinterestIcon className={iconClass} />;
    case "tiktok":
    case "tiktok_sandbox":
      return <TikTokIcon className={iconClass} />;
    case "threads":
      return <ThreadsIcon className={iconClass} />;
    default:
      return null;
  }
};

interface PublishResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: PublishResults;
  onRetryFailed?: (platforms: string[]) => void;
  onClose?: () => void;
}

export function PublishResultsDialog({
  open,
  onOpenChange,
  results,
  onRetryFailed,
  onClose,
}: PublishResultsDialogProps) {
  const [retrying, setRetrying] = useState(false);
  
  const platforms = Object.keys(results);
  const overallStatus = getOverallStatus(results);
  const summary = getResultsSummary(results);
  const failedPlatforms = platforms.filter(p => !results[p].success);
  const successfulPlatforms = platforms.filter(p => results[p].success);

  const handleRetryFailed = async () => {
    if (!onRetryFailed || failedPlatforms.length === 0) return;
    setRetrying(true);
    try {
      await onRetryFailed(failedPlatforms);
    } finally {
      setRetrying(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    onClose?.();
  };

  const getStatusIcon = () => {
    switch (overallStatus) {
      case 'posted':
        return <CheckCircle2 className="h-12 w-12 text-emerald-500" />;
      case 'partial':
        return <AlertCircle className="h-12 w-12 text-amber-500" />;
      case 'failed':
        return <XCircle className="h-12 w-12 text-destructive" />;
    }
  };

  const getStatusTitle = () => {
    switch (overallStatus) {
      case 'posted':
        return 'All Posts Published!';
      case 'partial':
        return 'Partially Published';
      case 'failed':
        return 'Publishing Failed';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <DialogTitle className="text-xl">{getStatusTitle()}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">{summary}</p>
        </DialogHeader>

        <ScrollArea className="max-h-64 mt-4">
          <div className="space-y-3">
            {/* Successful platforms */}
            {successfulPlatforms.map((platform) => {
              const result = results[platform];
              return (
                <div
                  key={platform}
                  className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                >
                  <div className="text-emerald-600">
                    {getPlatformIcon(platform)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {formatPlatformName(platform)}
                      </span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <span className="text-xs text-muted-foreground">Posted successfully</span>
                  </div>
                  {result.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => window.open(result.url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}

            {/* Failed platforms */}
            {failedPlatforms.map((platform) => {
              const result = results[platform];
              const errorMessage = result.errorCode 
                ? getErrorMessage(result.errorCode, platform)
                : result.error || 'Failed to post';
              
              return (
                <div
                  key={platform}
                  className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                >
                  <div className="text-destructive mt-0.5">
                    {getPlatformIcon(platform)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {formatPlatformName(platform)}
                      </span>
                      <XCircle className="h-4 w-4 text-destructive" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          {failedPlatforms.length > 0 && onRetryFailed && (
            <Button
              variant="outline"
              onClick={handleRetryFailed}
              disabled={retrying}
              className="w-full sm:w-auto"
            >
              {retrying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Failed ({failedPlatforms.length})
                </>
              )}
            </Button>
          )}
          <Button onClick={handleClose} className="w-full sm:w-auto">
            {overallStatus === 'posted' ? 'Done' : 'Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
