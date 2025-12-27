import { Package } from "lucide-react";

export const VaultHeader = () => {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <Package className="w-6 h-6 text-amber-700 dark:text-amber-400" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Content Vault
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Ready-to-use templates, social media posts, ebooks, planners, and more to accelerate your launch.
        </p>
      </div>
    </div>
  );
};
