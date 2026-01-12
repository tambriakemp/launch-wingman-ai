import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { VaultCsvUploader } from "@/components/admin/VaultCsvUploader";
import { R2ManagementCard } from "@/components/admin/R2ManagementCard";
import { CanvaManagementCard } from "@/components/admin/CanvaManagementCard";

const AdminContentVault = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin Dashboard
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <Package className="w-6 h-6 text-amber-700 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Content Vault Management</h1>
            <p className="text-muted-foreground">
              Bulk upload resources via CSV or sync from R2
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <R2ManagementCard />
          <CanvaManagementCard />
          <VaultCsvUploader />
        </div>
      </div>
    </div>
  );
};

export default AdminContentVault;
