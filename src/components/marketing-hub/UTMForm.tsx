import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";

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

interface UTMFormProps {
  folders: { id: string; name: string }[];
  onSave: (data: UTMFormData, fullUrl: string) => void;
  saving: boolean;
}

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

export const UTMForm = ({ folders, onSave, saving }: UTMFormProps) => {
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

      <div className="space-y-1.5">
        <Label htmlFor="baseUrl">Base URL *</Label>
        <Input id="baseUrl" placeholder="https://yoursite.com/page" value={form.baseUrl} onChange={(e) => update("baseUrl", e.target.value)} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="utmSource">Source *</Label>
          <Input id="utmSource" placeholder="e.g. instagram" value={form.utmSource} onChange={(e) => update("utmSource", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="utmMedium">Medium *</Label>
          <Input id="utmMedium" placeholder="e.g. social" value={form.utmMedium} onChange={(e) => update("utmMedium", e.target.value)} />
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

      {/* Live preview */}
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
