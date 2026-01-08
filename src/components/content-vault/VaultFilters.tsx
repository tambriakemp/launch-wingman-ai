import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  resource_count?: number;
}

interface VaultFiltersProps {
  subcategories: Subcategory[];
  selectedSubcategory: string;
  onSubcategoryChange: (value: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  allTags: string[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export const VaultFilters = ({
  subcategories,
  selectedSubcategory,
  onSubcategoryChange,
  searchQuery,
  onSearchChange,
  allTags,
  selectedTags,
  onTagsChange,
}: VaultFiltersProps) => {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const clearFilters = () => {
    onSubcategoryChange("all");
    onSearchChange("");
    onTagsChange([]);
  };

  const hasActiveFilters = selectedSubcategory !== "all" || searchQuery || selectedTags.length > 0;

  return (
    <div className="space-y-4">
      {/* Main Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Subcategory Filter */}
        {subcategories.length > 0 && (
          <Select value={selectedSubcategory} onValueChange={onSubcategoryChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                All Types ({subcategories.reduce((sum, s) => sum + (s.resource_count || 0), 0)})
              </SelectItem>
              {subcategories.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.name} ({sub.resource_count || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer transition-colors"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
