import { useState } from "react";
import { demoNotes } from "../campaignDemoData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MessageSquare, Clock, User } from "lucide-react";
import { format } from "date-fns";

interface Props {
  campaignId: string;
}

export default function NotesTab({ campaignId }: Props) {
  const [note, setNote] = useState("");
  const notes = demoNotes.filter((n) => n.campaign_id === campaignId);

  return (
    <div className="mt-4 space-y-6">
      {/* Add note */}
      <Card className="p-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Add Note</p>
        <Textarea
          placeholder="Write a note about this campaign — launch plan, results, lessons learned..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-28 resize-none"
        />
        <div className="flex items-center justify-between mt-3">
          <Button variant="outline" size="sm" className="gap-1.5" disabled>
            <Sparkles className="w-3.5 h-3.5" /> Generate Launch Retrospective
          </Button>
          <Button size="sm" disabled={!note.trim()}>Save Note</Button>
        </div>
      </Card>

      {/* Notes timeline */}
      {notes.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Timeline</p>
          <div className="relative pl-6 space-y-4">
            {/* Timeline line */}
            <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />

            {notes.map((n) => (
              <div key={n.id} className="relative">
                {/* Dot */}
                <div className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-border bg-background flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                </div>

                <Card className="p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span className="font-medium text-foreground">{n.author}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {format(new Date(n.created_at), "MMM d, yyyy · h:mm a")}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed">{n.content}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {notes.length === 0 && (
        <div className="border border-dashed rounded-lg py-12 text-center">
          <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No notes yet for this campaign.</p>
          <p className="text-xs text-muted-foreground mt-1">Add a note above to start documenting.</p>
        </div>
      )}
    </div>
  );
}
