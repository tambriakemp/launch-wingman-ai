import React, { useState } from 'react';
import { AlertTriangle, ExternalLink, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUserApiKey } from '@/hooks/useUserApiKey';
import { useVideoProvider } from '@/hooks/useVideoProvider';
import { useAuth } from '@/contexts/AuthContext';

const FalKeyWarning: React.FC = () => {
  const { user } = useAuth();
  const { data: videoProvider, isLoading: providerLoading } = useVideoProvider();
  const falKey = useUserApiKey("fal_ai");
  const klingAccessKey = useUserApiKey("kling_access_key");
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  const isKlingMode = videoProvider === "kling";

  // Don't show if loading
  if (!user || providerLoading || falKey.isLoading || klingAccessKey.isLoading) return null;

  // In kling mode, check for kling keys
  if (isKlingMode) {
    if (klingAccessKey.hasKey) return null;

    return (
      <>
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold leading-tight">
              Kling API keys required for video generation
            </p>
            <p className="text-[10px] opacity-80 mt-0.5">
              Add your Kling Access Key & Secret Key in Settings.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="flex-shrink-0 h-7 text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
            onClick={() => setInstructionsOpen(true)}
          >
            <Key className="h-3 w-3 mr-1" />
            Instructions
          </Button>
        </div>

        <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Key className="h-4 w-4" />
                Set Up Your Kling API Keys
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Create a Kling AI account</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Go to{' '}
                    <a href="https://app.klingai.com/global/dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                      app.klingai.com/global/dev <ExternalLink className="h-3 w-3" />
                    </a>{' '}
                    and sign up for an account.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Add billing credits</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Navigate to the billing section and add credits. Kling uses pay-as-you-go pricing — video generation typically costs $0.14–$0.35 per clip.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Create an API Key</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    In the developer dashboard, click <strong>"Create a new API Key"</strong>. You'll get an <strong>Access Key</strong> and a <strong>Secret Key</strong>. Copy both.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Paste your keys in Settings</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Go to <strong>Settings → AI & Video → API Keys</strong>, paste both your Kling Access Key and Secret Key, and save. You're all set!
                  </p>
                </div>
              </div>
              <div className="bg-muted/50 border border-border rounded-lg p-3 mt-2">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  <strong>Why is this needed?</strong> Video generation connects directly to Kling's API for the best pricing. Your keys let you generate videos at Kling's direct rates with no middleman markup.
                </p>
              </div>
              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setInstructionsOpen(false)}>
                  Got it
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // fal.ai mode — original behavior
  if (falKey.hasKey) return null;

  return (
    <>
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400">
        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold leading-tight">
            fal.ai API key required for video generation
          </p>
          <p className="text-[10px] opacity-80 mt-0.5">
            Add your key in Settings or follow the setup instructions.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="flex-shrink-0 h-7 text-[10px] border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
          onClick={() => setInstructionsOpen(true)}
        >
          <Key className="h-3 w-3 mr-1" />
          Instructions
        </Button>
      </div>

      <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Key className="h-4 w-4" />
              Set Up Your fal.ai API Key
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Create a fal.ai account</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Go to{' '}
                  <a href="https://fal.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                    fal.ai <ExternalLink className="h-3 w-3" />
                  </a>{' '}
                  and sign up for a free account.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Add billing credits</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Navigate to{' '}
                  <a href="https://fal.ai/dashboard/billing" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                    Billing <ExternalLink className="h-3 w-3" />
                  </a>{' '}
                  and add a payment method.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Generate an API key</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Go to{' '}
                  <a href="https://fal.ai/dashboard/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                    API Keys <ExternalLink className="h-3 w-3" />
                  </a>{' '}
                  and click <strong>"Create Key"</strong>.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
              <div>
                <p className="text-sm font-semibold text-foreground">Paste your key in Settings</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Go to <strong>Settings → AI & Video → API Key</strong>, paste your fal.ai key, and save.
                </p>
              </div>
            </div>
            <div className="bg-muted/50 border border-border rounded-lg p-3 mt-2">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <strong>Why is this needed?</strong> Video generation uses Kling AI via fal.ai's infrastructure. Your API key lets you generate unlimited videos at fal.ai's direct pricing.
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setInstructionsOpen(false)}>
                Got it
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FalKeyWarning;
