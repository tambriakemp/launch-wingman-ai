import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const ImpersonationBanner = () => {
  const { isImpersonating, impersonatedUserEmail, stopImpersonation } = useAuth();

  if (!isImpersonating) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 px-4 py-2">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">
            Viewing as: <strong>{impersonatedUserEmail}</strong>
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={stopImpersonation}
          className="bg-white hover:bg-amber-50 text-amber-950 border-amber-700"
        >
          Return to Admin
        </Button>
      </div>
    </div>
  );
};

export default ImpersonationBanner;
