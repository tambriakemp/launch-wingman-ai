import { useState } from "react";
import { MoreHorizontal, Pause, Play, Archive, CheckCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ProjectState, canTransitionTo } from "@/types/projectLifecycle";

interface ProjectMenuProps {
  projectState: ProjectState;
  onPause: () => Promise<boolean>;
  onResume: () => Promise<boolean>;
  onArchive: () => Promise<boolean>;
  onMarkComplete?: () => Promise<boolean>;
}

export function ProjectMenu({
  projectState,
  onPause,
  onResume,
  onArchive,
  onMarkComplete,
}: ProjectMenuProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'pause' | 'archive' | 'complete' | null;
  }>({ open: false, action: null });
  const [isLoading, setIsLoading] = useState(false);

  const isPaused = projectState === 'paused';
  const isArchived = projectState === 'archived';
  const isLaunched = projectState === 'launched';
  const isCompleted = projectState === 'completed';
  
  const canPause = canTransitionTo(projectState, 'paused');
  const canArchive = canTransitionTo(projectState, 'archived');
  const canComplete = isLaunched && onMarkComplete;

  const handleAction = async (action: 'pause' | 'resume' | 'archive' | 'complete') => {
    setIsLoading(true);
    try {
      switch (action) {
        case 'pause':
          await onPause();
          break;
        case 'resume':
          await onResume();
          break;
        case 'archive':
          await onArchive();
          break;
        case 'complete':
          if (onMarkComplete) await onMarkComplete();
          break;
      }
    } finally {
      setIsLoading(false);
      setConfirmDialog({ open: false, action: null });
    }
  };

  const getDialogContent = () => {
    switch (confirmDialog.action) {
      case 'pause':
        return {
          title: 'Pause project',
          description: 'Pausing keeps everything safe while you take a break. You can resume anytime.',
        };
      case 'archive':
        return {
          title: 'Archive project',
          description: 'This will archive the project. You can restore it later if needed.',
        };
      case 'complete':
        return {
          title: 'Mark project complete',
          description: 'This closes the loop on this launch. You can always relaunch later.',
        };
      default:
        return { title: '', description: '' };
    }
  };

  const dialogContent = getDialogContent();

  // Don't show menu if archived or completed (no actions available)
  if (isArchived || isCompleted) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
            <span className="sr-only">Project menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {isPaused ? (
            <DropdownMenuItem onClick={() => handleAction('resume')}>
              <Play className="w-4 h-4 mr-2" />
              Resume project
            </DropdownMenuItem>
          ) : canPause ? (
            <DropdownMenuItem
              onClick={() => setConfirmDialog({ open: true, action: 'pause' })}
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause project
            </DropdownMenuItem>
          ) : null}

          {canComplete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setConfirmDialog({ open: true, action: 'complete' })}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark this project complete
              </DropdownMenuItem>
            </>
          )}

          {canArchive && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setConfirmDialog({ open: true, action: 'archive' })}
                className="text-muted-foreground"
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive project
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ open, action: open ? confirmDialog.action : null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogContent.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDialog.action && handleAction(confirmDialog.action)}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
