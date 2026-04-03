import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectLayout } from '@/components/layout/ProjectLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Sparkles, Download, RotateCcw, Loader2 } from 'lucide-react';
import UploadZone from '@/components/ai-studio/UploadZone';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const OutfitSwap: React.FC = () => {
  const navigate = useNavigate();
  const [characterUrl, setCharacterUrl] = useState<string | null>(null);
  const [outfitUrl, setOutfitUrl] = useState<string | null>(null);
  const [instruction, setInstruction] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canGenerate = !!characterUrl && !!outfitUrl && !isProcessing;

  const handleGenerate = async () => {
    if (!characterUrl || !outfitUrl) return;
    setIsProcessing(true);
    setResultUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke('swap-outfit', {
        body: {
          characterImageUrl: characterUrl,
          outfitImageUrl: outfitUrl,
          instruction: instruction || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.resultImageUrl) {
        setResultUrl(data.resultImageUrl);
        toast.success('Outfit swap complete!');
      } else {
        throw new Error('No result image returned');
      }
    } catch (err: any) {
      console.error('Outfit swap error:', err);
      toast.error(err?.message || 'Outfit swap failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!resultUrl) return;
    try {
      const response = await fetch(resultUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `outfit-swap-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  const handleRetry = () => {
    setResultUrl(null);
  };

  return (
    <ProjectLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/app/ai-studio')}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Outfit Swap</h1>
              <p className="text-sm text-muted-foreground">
                Upload your character and a reference outfit — AI swaps the clothing while keeping everything else locked.
              </p>
            </div>
          </div>

          {/* Upload zones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Character Photo
              </label>
              <UploadZone
                onImageSelected={(url) => setCharacterUrl(url)}
                isProcessing={isProcessing}
                title="Character Photo"
                subtext="Your avatar/character in their environment"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Outfit Reference
              </label>
              <UploadZone
                onImageSelected={(url) => setOutfitUrl(url)}
                isProcessing={isProcessing}
                title="Outfit Reference"
                subtext="Photo of outfit on model or flat-lay"
              />
            </div>
          </div>

          {/* Instruction */}
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Instruction <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Input
              placeholder='e.g. "Only change the shirt" or "Swap entire outfit"'
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              disabled={isProcessing}
              className="bg-card"
            />
          </div>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full mb-8"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Swapping Outfit…
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Swap Outfit
              </>
            )}
          </Button>

          {/* Result */}
          {resultUrl && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-foreground">Result</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleRetry}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Retry
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              <img
                src={resultUrl}
                alt="Outfit swap result"
                className="w-full rounded-lg"
              />
            </div>
          )}
        </div>
      </div>
    </ProjectLayout>
  );
};

export default OutfitSwap;
