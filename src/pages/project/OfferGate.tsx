import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskEngine } from '@/hooks/useTaskEngine';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

const OfferGate = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isLoading, projectTasks, nextBestTask, getTaskTemplate } = useTaskEngine({ projectId: projectId || '' });
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (isLoading || !projectId) return;

    const template = getTaskTemplate('planning_offer_stack');
    if (!template) {
      navigate(`/projects/${projectId}/dashboard`, { replace: true });
      return;
    }

    const allDepsMet = template.dependencies.every(depId => {
      const depTask = projectTasks.find(t => t.taskId === depId);
      return depTask?.status === 'completed';
    });

    if (allDepsMet) {
      navigate(`/projects/${projectId}/tasks/planning_offer_stack`, { replace: true });
    } else {
      setShowDialog(true);
    }
  }, [isLoading, projectId, projectTasks, getTaskTemplate, navigate]);

  if (isLoading) return null;

  return (
    <AlertDialog open={showDialog} onOpenChange={(open) => {
      if (!open) navigate(`/projects/${projectId}/dashboard`, { replace: true });
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Complete previous tasks first</AlertDialogTitle>
          <AlertDialogDescription>
            You need to finish the prerequisite tasks before you can access your Offer Stack.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => navigate(`/projects/${projectId}/dashboard`, { replace: true })}>
            Back
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            const dest = nextBestTask?.route || `/projects/${projectId}/dashboard`;
            navigate(dest);
          }}>
            Go to Next Task
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default OfferGate;
