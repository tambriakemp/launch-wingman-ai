import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Plus, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export interface UTMFormData {
  label: string;
  baseUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  folderId: string | null;
}

interface SavedBaseUrl {
  id: string;
  url: string;
  label: string | null;
}

interface UTMFormProps {
  folders: { id: string; name: string }[];
  savedBaseUrls: SavedBaseUrl[];
  onSave: (data: UTMFormData, fullUrl: string) => void;
  onSaveBaseUrl: (url: string, label?: string) => void;
  onDeleteBaseUrl: (id: string) => void;
  saving: boolean;
}

const UTM_SOURCES = [
  "google", "facebook", "instagram", "twitter", "linkedin", "tiktok",
  "youtube", "pinterest", "snapchat", "reddit", "email", "newsletter",
  "bing", "yahoo", "baidu", "duckduckgo", "threads", "whatsapp",
  "telegram", "slack", "discord", "medium", "quora", "yelp",
  "podcast", "webinar", "affiliate", "influencer", "partner",
  "press_release", "direct_mail", "sms", "push_notification",
  "qr_code", "print", "tv", "radio", "billboard", "flyer",
];

const UTM_MEDIUMS = [
  "cost per click (cpc)", "cost per mille (cpm)", "cost per acquisition (cpa)",
  "cost per lead (cpl)", "cost per view (cpv)", "social", "organic",
  "email", "referral", "display", "affiliate", "banner", "video",
  "retargeting", "native", "content", "paid social", "organic social",
  "paid search", "organic search", "influencer", "partner",
  "public relations (pr)", "direct mail", "short message service (sms)",
  "push notification", "podcast", "webinar", "event", "print",
  "outdoor", "television (tv)", "radio", "quick response code (qr_code)",
  "story", "reel", "carousel", "feed post",
];

const generateFullUrl = (data: UTMFormData): string => {
  if (!data.baseUrl) return "";
  try {
    const url = new URL(data.baseUrl.startsWith("http") ? data.baseUrl : `https://${data.baseUrl}`);
    if (data.utmSource) url.searchParams.set("utm_source", data.utmSource);
    if (data.utmMedium) url.searchParams.set("utm_medium", data.utmMedium);
    if (data.utmCampaign) url.searchParams.set("utm_campaign", data.utmCampaign);
    if (data.utmTerm) url.searchParams.set("utm_term", data.utmTerm);
    if (data.utmContent) url.searchParams.set("utm_content", data.utmContent);
    return url.toString();
  } catch {
    return "";
  }
};

const SearchableSelect = ({
  value,
  onValueChange,
  options,
  placeholder,
  id,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: string[];
  placeholder: string;
  id: string;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  const showCustom = search && !options.some((o) => o.toLowerCase() === search.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-11 font-normal bg-card border-input text-left"
        >
          <span className={value ? "text-foreground" : "text-muted-foreground"}>
            {value || placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50 bg-popover border border-border" align="start">
        <Command>
          <CommandInput
            placeholder={`Search or type custom...`}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {showCustom ? (
                <button
                  className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent rounded cursor-pointer"
                  onClick={() => {
                    onValueChange(search);
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  Use "{search}"
                </button>
              ) : (
                "No results found."
              )}
            </CommandEmpty>
            <CommandGroup>
              {showCustom && (
                <CommandItem
                  value={`custom-${search}`}
                  onSelect={() => {
                    onValueChange(search);
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  Use custom: "{search}"
                </CommandItem>
              )}
              {filtered.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onValueChange(option);
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export const UTMForm = ({ folders, savedBaseUrls, onSave, onSaveBaseUrl, onDeleteBaseUrl, saving }: UTMFormProps) => {
  const [form, setForm] = useState<UTMFormData>({
    label: "",
    baseUrl: "",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmTerm: "",
    utmContent: "",
    folderId: null,
  });

  const [fullUrl, setFullUrl] = useState("");
  const [showSaveBaseUrl, setShowSaveBaseUrl] = useState(false);
  const [baseUrlLabel, setBaseUrlLabel] = useState("");

  useEffect(() => {
    setFullUrl(generateFullUrl(form));
  }, [form]);

  const update = (key: keyof UTMFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isValid = form.label && form.baseUrl && form.utmSource && form.utmMedium && form.utmCampaign;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !fullUrl) return;
    onSave(form, fullUrl);
    setForm({ label: "", baseUrl: "", utmSource: "", utmMedium: "", utmCampaign: "", utmTerm: "", utmContent: "", folderId: null });
  };

  const handleSaveBaseUrl = () => {
    if (!form.baseUrl) return;
    onSaveBaseUrl(form.baseUrl, baseUrlLabel || undefined);
    setShowSaveBaseUrl(false);
    setBaseUrlLabel("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="label">Link Label *</Label>
          <Input id="label" placeholder="e.g. Spring Campaign - Instagram" value={form.label} onChange={(e) => update("label", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="folder">Folder</Label>
          <Select value={form.folderId || "none"} onValueChange={(v) => update("folderId", v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="No folder" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No folder</SelectItem>
              {folders.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Base URL with saved URLs */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="baseUrl">Base URL *</Label>
          {form.baseUrl && !savedBaseUrls.some((u) => u.url === form.baseUrl) && (
            <Button type="button" variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => setShowSaveBaseUrl(!showSaveBaseUrl)}>
              <Plus className="w-3 h-3" /> Save URL
            </Button>
          )}
        </div>

        {savedBaseUrls.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {savedBaseUrls.map((u) => (
              <div key={u.id} className="group flex items-center gap-1 bg-muted border border-border rounded-md px-2 py-1 text-xs">
                <button
                  type="button"
                  className="hover:text-foreground text-muted-foreground transition-colors"
                  onClick={() => update("baseUrl", u.url)}
                >
                  {u.label || u.url}
                </button>
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity"
                  onClick={() => onDeleteBaseUrl(u.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Input id="baseUrl" placeholder="https://yoursite.com/page" value={form.baseUrl} onChange={(e) => update("baseUrl", e.target.value)} />

        {showSaveBaseUrl && (
          <div className="flex gap-2 mt-1">
            <Input
              placeholder="Label (optional)"
              value={baseUrlLabel}
              onChange={(e) => setBaseUrlLabel(e.target.value)}
              className="h-8 text-sm"
            />
            <Button type="button" size="sm" className="h-8" onClick={handleSaveBaseUrl}>Save</Button>
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="utmSource">Source *</Label>
          <SearchableSelect
            id="utmSource"
            value={form.utmSource}
            onValueChange={(v) => update("utmSource", v)}
            options={UTM_SOURCES}
            placeholder="e.g. instagram"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="utmMedium">Medium *</Label>
          <SearchableSelect
            id="utmMedium"
            value={form.utmMedium}
            onValueChange={(v) => update("utmMedium", v)}
            options={UTM_MEDIUMS}
            placeholder="e.g. social"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="utmCampaign">Campaign *</Label>
          <Input id="utmCampaign" placeholder="e.g. spring_launch" value={form.utmCampaign} onChange={(e) => update("utmCampaign", e.target.value)} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="utmTerm">Term <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input id="utmTerm" placeholder="e.g. coaching" value={form.utmTerm} onChange={(e) => update("utmTerm", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="utmContent">Content <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input id="utmContent" placeholder="e.g. cta_button" value={form.utmContent} onChange={(e) => update("utmContent", e.target.value)} />
        </div>
      </div>

      {fullUrl && (
        <div className="p-3 rounded-lg bg-muted border border-border">
          <p className="text-xs text-muted-foreground mb-1 font-medium">Generated URL Preview</p>
          <p className="text-sm text-foreground break-all font-mono">{fullUrl}</p>
        </div>
      )}

      <Button type="submit" disabled={!isValid || saving} className="gap-2">
        <Save className="w-4 h-4" />
        {saving ? "Saving..." : "Save Link"}
      </Button>
    </form>
  );
};
