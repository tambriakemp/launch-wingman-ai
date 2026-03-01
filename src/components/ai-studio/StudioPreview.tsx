import React from 'react';
import { AppConfig } from './types';
import { Button } from '@/components/ui/button';
import { Loader2, Check } from 'lucide-react';

interface StudioPreviewProps {
  config: AppConfig;
  previewCharacterImage: string | null;
  previewFinalLookImage: string | null;
  isGeneratingStoryboard: boolean;
  onBack: () => void;
  onGenerateStoryboard: () => void;
}

const StudioPreview: React.FC<StudioPreviewProps> = ({
  config,
  previewCharacterImage,
  previewFinalLookImage,
  isGeneratingStoryboard,
  onBack,
  onGenerateStoryboard,
}) => {
  return (
    <div className="max-w-4xl mx-auto text-center space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Character Preview</h2>
        <p className="text-muted-foreground">Verify your character's look before generating the full storyboard.</p>
      </div>

      <div className="flex flex-wrap justify-center gap-8">
        <div className="bg-card p-3 rounded-2xl shadow-2xl border border-border max-w-sm w-full">
          {previewCharacterImage ? (
            <img src={previewCharacterImage} className="w-full rounded-xl aspect-[9/16] object-cover" alt="Character Preview" />
          ) : (
            <div className="aspect-[9/16] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <div className="mt-4 pb-2">
            <p className="font-bold text-foreground">Default Look</p>
            <p className="text-xs text-muted-foreground">{config.outfitType}</p>
          </div>
        </div>

        {previewFinalLookImage && (
          <div className="bg-accent/10 p-3 rounded-2xl shadow-2xl border border-accent/30 max-w-sm w-full">
            <img src={previewFinalLookImage} className="w-full rounded-xl aspect-[9/16] object-cover" alt="Final Look Preview" />
            <div className="mt-4 pb-2">
              <p className="font-bold text-accent-foreground">Final Look Reveal</p>
              <p className="text-xs text-muted-foreground">{config.finalLookType}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-4 pt-4">
        <Button variant="outline" onClick={onBack} className="px-6">
          Adjust Settings
        </Button>
        <Button onClick={onGenerateStoryboard} disabled={isGeneratingStoryboard} className="px-8">
          {isGeneratingStoryboard ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</>
          ) : (
            <><span>Generate Full Storyboard</span> <Check className="h-4 w-4 ml-2" /></>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StudioPreview;
