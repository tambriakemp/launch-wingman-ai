import { useState } from "react";
import { demoNotes } from "../campaignDemoData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import { format } from "date-fns";

interface Props {
  campaignId: string;
}

export default function NotesTab({ campaignId }: Props) {
  const [note, setNote] = useState("");
  const notes = demoNotes.filter((n) => n.campaign_id === campaignId);

  return (
    <div className="mt-4 space-y-4 max-w-2xl">
      <div>
        <Textarea placeholder="Add a note about this campaign..." value={note} onChange={(e) => setNote(e.target.value)} className="min-h-24" />
        <div className="flex justify-between mt-2">
          <Button variant="outline" size="sm" className="gap-1.5" disabled>
            <Sparkles className="w-3.5 h-3.5" /> Generate Retrospective
          </Button>
          <Button size="sm" disabled={!note.trim()}>Save Note</Button>
        </div>
      </div>

      {notes.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">History</p>
          {notes.map((n) => (
            <Card key={n.id} className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{n.author}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(n.created_at), "MMM d, yyyy")}</span>
              </div>
              <p className="text-sm text-muted-foreground">{n.content}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
