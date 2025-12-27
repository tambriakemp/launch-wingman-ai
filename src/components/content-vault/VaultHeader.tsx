import { Package } from "lucide-react";

export const VaultHeader = () => {
  return (
    <div className="flex items-start gap-4 mb-8">
      <div className="p-3 bg-muted rounded-xl shrink-0">
        <Package className="w-6 h-6 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Content Vault
        </h1>
        <p className="text-muted-foreground">
          Ready-to-use templates, social media posts, ebooks, planners, and more to accelerate your launch.
        </p>
      </div>
    </div>
  );
};
