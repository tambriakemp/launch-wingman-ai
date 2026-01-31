import { Package } from "lucide-react";

interface VaultHeaderProps {
  totalResourceCount?: number;
}

export const VaultHeader = ({ totalResourceCount }: VaultHeaderProps) => {
  return (
    <div className="flex items-start gap-4 mb-8">
      <div className="p-3 bg-amber-100/50 dark:bg-amber-900/20 rounded-xl shrink-0">
        <Package className="w-6 h-6 text-amber-600 dark:text-amber-400" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Content Vault
        </h1>
        <p className="text-muted-foreground">
          {totalResourceCount 
            ? `${totalResourceCount}+ resources available` 
            : 'Ready-to-use templates, social media posts, ebooks, planners, and more to accelerate your launch.'}
        </p>
      </div>
    </div>
  );
};
