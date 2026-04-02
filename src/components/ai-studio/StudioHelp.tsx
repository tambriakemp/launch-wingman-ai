import React from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface StudioHelpProps {
  open: boolean;
  onClose: () => void;
}

const StudioHelp: React.FC<StudioHelpProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent text-transparent bg-clip-text">
            How to Use AI Studio
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-muted-foreground">
          <section>
            <h3 className="text-lg font-bold text-foreground mb-2">1. Workflow Phases</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li><strong className="text-primary">Setup:</strong> Upload your reference avatar (and product for UGC). Configure aesthetic, outfit, and vlog topic.</li>
              <li><strong className="text-accent-foreground">Preview:</strong> The AI generates a character preview. Confirm the look before generating the full storyboard.</li>
              <li><strong className="text-foreground">Storyboard:</strong> The AI writes the script and generates images for all scenes.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-foreground mb-2">2. Automatic Consistency</h3>
            <p className="text-sm">Scene 1 automatically acts as your identity anchor. All subsequent scenes inherit the character's face, outfit, and style from Scene 1 — no manual locking needed.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-foreground mb-2">3. Batch Actions</h3>
            <p className="text-sm">
              Select multiple images using checkboxes. A toolbar appears allowing you to
              <strong> Regenerate</strong>, <strong>Upscale</strong>, or <strong>Delete</strong> multiple scenes at once.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-foreground mb-2">4. Aspect Ratios</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Use <strong className="text-primary">Portrait 9:16</strong> for TikTok/Reels/Shorts.</li>
              <li>Use <strong className="text-accent-foreground">Landscape 16:9</strong> for YouTube/Desktop.</li>
              <li><strong>1:1</strong> for Instagram Feed posts.</li>
            </ul>
          </section>
        </div>

        <div className="mt-6 pt-4 border-t text-center">
          <Button onClick={onClose} variant="outline" className="px-8">
            Got it, let's create!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudioHelp;
