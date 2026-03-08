import { Search, X, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  isPromptCategory?: boolean;
  selectedPromptType?: string;
  onPromptTypeChange?: (value: string) => void;
  resources?: { resource_type: string }[];
}

// Format tag: remove hyphens and capitalize first letter of each word
const formatTagName = (tag: string): string => {
  return tag
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

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
  const handleTagChange = (value: string) => {
    if (value === "all") {
      onTagsChange([]);
    } else if (!selectedTags.includes(value)) {
      onTagsChange([...selectedTags, value]);
    }
  };

  const removeTag = (tag: string) => {
    onTagsChange(selectedTags.filter(t => t !== tag));
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
              {[...subcategories]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name} ({sub.resource_count || 0})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}

        {/* Tags Filter Dropdown */}
        {allTags.length > 0 && (
          <Select value="" onValueChange={handleTagChange}>
            <SelectTrigger className="w-full sm:w-48">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <span>{selectedTags.length > 0 ? `${selectedTags.length} tag(s)` : "Filter by Tag"}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Clear Tags</SelectItem>
              {[...allTags]
                .sort((a, b) => formatTagName(a).localeCompare(formatTagName(b)))
                .map((tag) => (
                  <SelectItem 
                    key={tag} 
                    value={tag}
                    disabled={selectedTags.includes(tag)}
                  >
                    {formatTagName(tag)}
                    {selectedTags.includes(tag) && " ✓"}
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

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Button
              key={tag}
              variant="secondary"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => removeTag(tag)}
            >
              {formatTagName(tag)}
              <X className="w-3 h-3 ml-1" />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
