import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = ["Basics", "Attribution", "Offer / Funnel", "Confirm"];
const platforms = ["Instagram", "Facebook", "Email", "YouTube", "Skool", "App"];

export default function NewCampaignModal({ open, onOpenChange }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [owner, setOwner] = useState("");
  const [autoUtm, setAutoUtm] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };

  const reset = () => { setStep(0); setName(""); setGoal(""); setStartDate(""); setEndDate(""); setBudget(""); setOwner(""); setAutoUtm(true); setSelectedPlatforms([]); };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Campaign</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>{i + 1}</div>
              <span className={cn("text-xs hidden sm:inline", i <= step ? "text-foreground" : "text-muted-foreground")}>{s}</span>
              {i < steps.length - 1 && <div className="w-4 h-px bg-border" />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <div><Label>Campaign Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Spring Launch 2026" /></div>
            <div><Label>Goal</Label>
              <Select value={goal} onValueChange={setGoal}><SelectTrigger><SelectValue placeholder="Select goal" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="leads">Leads</SelectItem>
                  <SelectItem value="app_installs">App Installs</SelectItem>
                  <SelectItem value="challenge_signups">Challenge Signups</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
              <div><Label>End Date</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Budget (optional)</Label><Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="$0" /></div>
              <div><Label>Owner</Label><Input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Name" /></div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox checked={autoUtm} onCheckedChange={(v) => setAutoUtm(!!v)} id="auto-utm" />
              <Label htmlFor="auto-utm">Auto-generate UTM links</Label>
            </div>
            {autoUtm && (
              <div>
                <Label className="mb-2 block">Select platforms</Label>
                <div className="grid grid-cols-3 gap-2">
                  {platforms.map((p) => (
                    <button key={p} onClick={() => togglePlatform(p)}
                      className={cn("border rounded-md p-2 text-sm transition-colors",
                        selectedPlatforms.includes(p) ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/50"
                      )}>{p}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 text-center py-8">
            <p className="text-muted-foreground">Attach an existing offer or funnel, or create a new one.</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" disabled>Select Existing</Button>
              <Button variant="outline" size="sm" disabled>Create New</Button>
            </div>
            <p className="text-xs text-muted-foreground">Coming soon — skip for now</p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <h3 className="font-medium">Review</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Name</span><span>{name || "—"}</span>
              <span className="text-muted-foreground">Goal</span><span className="capitalize">{goal || "—"}</span>
              <span className="text-muted-foreground">Dates</span><span>{startDate || "—"} → {endDate || "—"}</span>
              <span className="text-muted-foreground">Budget</span><span>{budget ? `$${budget}` : "—"}</span>
              <span className="text-muted-foreground">Owner</span><span>{owner || "—"}</span>
              <span className="text-muted-foreground">UTM Links</span><span>{autoUtm ? selectedPlatforms.join(", ") || "None" : "Manual"}</span>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={() => step > 0 ? setStep(step - 1) : onOpenChange(false)}>
            {step > 0 ? "Back" : "Cancel"}
          </Button>
          <Button size="sm" onClick={() => step < 3 ? setStep(step + 1) : onOpenChange(false)}>
            {step < 3 ? "Next" : "Create Campaign"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
