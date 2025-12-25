import { useState } from 'react';
import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, RotateCcw, Pen } from 'lucide-react';
import { useToneLearning } from '@/hooks/useToneLearning';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const WRITING_STYLES = [
  { value: 'calm', label: 'Calm', description: 'Measured, reassuring tone' },
  { value: 'direct', label: 'Direct', description: 'Concise and action-oriented' },
  { value: 'encouraging', label: 'Encouraging', description: 'Supportive and affirming' },
  { value: 'minimal', label: 'Minimal', description: 'Fewest words possible' },
  { value: 'detailed', label: 'More detailed', description: 'Thorough explanations' },
] as const;

export function ToneSettings() {
  const {
    profile,
    isLoading,
    updateWritingStyle,
    toggleToneLearning,
    resetProfile,
    isUpdatingStyle,
    isResetting,
  } = useToneLearning();

  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleStyleChange = (value: string) => {
    updateWritingStyle(value as typeof WRITING_STYLES[number]['value']);
    toast.success('Writing style updated');
  };

  const handleToggleLearning = (enabled: boolean) => {
    toggleToneLearning(enabled);
    toast.success(enabled ? 'Tone learning enabled' : 'Tone learning disabled');
  };

  const handleReset = () => {
    resetProfile();
    setShowResetDialog(false);
    toast.success('AI writing style reset to defaults');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Writing Style Selector */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Writing Style</Label>
        <p className="text-sm text-muted-foreground">
          Choose how AI-generated content should sound.
        </p>
        <RadioGroup
          value={profile?.writing_style || 'calm'}
          onValueChange={handleStyleChange}
          disabled={isUpdatingStyle}
          className="grid gap-2"
        >
          {WRITING_STYLES.map((style) => (
            <motion.div
              key={style.value}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Label
                htmlFor={`style-${style.value}`}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                  ${profile?.writing_style === style.value 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                  }
                `}
              >
                <RadioGroupItem value={style.value} id={`style-${style.value}`} />
                <div className="flex-1">
                  <span className="font-medium text-foreground">{style.label}</span>
                  <p className="text-xs text-muted-foreground">{style.description}</p>
                </div>
              </Label>
            </motion.div>
          ))}
        </RadioGroup>
      </div>

      {/* Tone Learning Toggle */}
      <div className="flex items-center justify-between py-3 border-t border-border">
        <div className="space-y-0.5">
          <Label htmlFor="tone-learning" className="text-sm font-medium flex items-center gap-2">
            <Pen className="w-4 h-4 text-muted-foreground" />
            Learn from my writing
          </Label>
          <p className="text-xs text-muted-foreground">
            AI suggestions will adapt to match your natural writing style.
          </p>
        </div>
        <Switch
          id="tone-learning"
          checked={profile?.tone_learning_enabled ?? true}
          onCheckedChange={handleToggleLearning}
        />
      </div>

      {/* Reset Button */}
      <div className="pt-3 border-t border-border">
        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              disabled={isResetting}
              className="gap-2"
            >
              {isResetting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              Reset AI writing style
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset AI writing style?</AlertDialogTitle>
              <AlertDialogDescription>
                This will reset all learned writing preferences to their defaults. 
                Your project content will not be affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset}>
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <p className="text-xs text-muted-foreground mt-2">
          Clears all learned style patterns. Your content stays the same.
        </p>
      </div>
    </div>
  );
}
