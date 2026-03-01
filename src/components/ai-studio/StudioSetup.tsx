import React from 'react';
import { AppConfig } from './types';
import {
  VLOG_CATEGORIES, MAKEUP_STYLES, COMPLEXION_OPTIONS, UNDERTONE_OPTIONS,
  NAIL_STYLES, OUTFIT_TYPES, HAIRSTYLE_GROUPS, CAMERA_MOVEMENTS, TOPIC_PLACEHOLDERS
} from './constants';
import UploadZone from './UploadZone';
import SavedCharacter from './SavedCharacter';
import SavedEnvironments from './SavedEnvironments';
import SavedLooks from './SavedLooks';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowRight, Sparkles } from 'lucide-react';

interface StudioSetupProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
  referenceImage: string | null;
  setReferenceImage: (img: string | null) => void;
  environmentImage: string | null;
  setEnvironmentImage: (img: string | null) => void;
  productImage: string | null;
  setProductImage: (img: string | null) => void;
  isProcessing: boolean;
  isPreviewGenerating: boolean;
  showSafetyTerms: boolean;
  setShowSafetyTerms: (v: boolean) => void;
  isGeneratingTopic: boolean;
  onGeneratePreview: () => void;
  onGenerateTopicIdeas: () => void;
}

const Label: React.FC<{ label: string; tooltip?: string }> = ({ label }) => (
  <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">{label}</label>
);

const StudioSetup: React.FC<StudioSetupProps> = ({
  config, setConfig,
  referenceImage, setReferenceImage,
  environmentImage, setEnvironmentImage,
  productImage, setProductImage,
  isProcessing, isPreviewGenerating,
  showSafetyTerms, setShowSafetyTerms,
  isGeneratingTopic,
  onGeneratePreview, onGenerateTopicIdeas
}) => {
  const allHairstyles = Object.entries(HAIRSTYLE_GROUPS).flatMap(([group, styles]) =>
    styles.map(s => ({ group, style: s }))
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2 mb-10">
        <h2 className="text-3xl font-bold text-foreground">Project Setup</h2>
        <p className="text-muted-foreground">Configure your faceless influencer look and style.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Uploads & Mode */}
        <div className="space-y-6">
          <section className="bg-card p-6 rounded-2xl border border-border">
            <Label label="1. Creation Mode" />
            <div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-lg mb-6">
              <button onClick={() => setConfig(c => ({ ...c, creationMode: 'vlog' }))}
                className={`py-2 text-sm font-medium rounded-md transition-all ${config.creationMode === 'vlog' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}>
                VLOG MODE
              </button>
              <button onClick={() => setConfig(c => ({ ...c, creationMode: 'ugc' }))}
                className={`py-2 text-sm font-medium rounded-md transition-all ${config.creationMode === 'ugc' ? 'bg-accent text-accent-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}>
                UGC / INFLUENCER
              </button>
            </div>

            <div className="space-y-6">
              <SavedCharacter onSelect={setReferenceImage} />
              <div>
                <Label label="Character Reference" />
                <UploadZone onImageSelected={setReferenceImage} isProcessing={isProcessing} title="Upload Selfie / Avatar" subtext="One-time use. Used to maintain facial consistency." />
              </div>
              <div>
                <Label label="Environment / Setting (Optional)" />
                <SavedEnvironments onSelect={setEnvironmentImage} />
                <UploadZone onImageSelected={setEnvironmentImage} isProcessing={isProcessing} title="Background Reference" subtext="One-time use. Upload a room or location." />
              </div>
              {config.creationMode === 'ugc' && (
                <div>
                  <Label label="Product Reference" />
                  <UploadZone onImageSelected={setProductImage} isProcessing={isProcessing} title="Product Image" subtext="Required for UGC mode. The item you are promoting." />
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right: Configuration */}
        <div className="space-y-6">
          <section className="bg-card p-6 rounded-2xl border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-primary rounded-full"></span>
              Aesthetic & Style
            </h3>

            {/* Exact Match Toggle */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex justify-between items-center mb-6">
              <div>
                <h3 className="text-foreground font-bold text-sm">Exact Face & Skin Tone</h3>
                <p className="text-muted-foreground text-[10px] mt-0.5">Clone reference face exactly (Strict Mode)</p>
              </div>
              <Switch checked={config.exactMatch} onCheckedChange={(v) => setConfig(c => ({ ...c, exactMatch: v }))} />
            </div>

            {/* Aspect Ratio */}
            <div className="mb-6">
              <Label label="Aspect Ratio" />
              <div className="grid grid-cols-3 gap-2">
                {(['9:16', '16:9', '1:1'] as const).map(ratio => (
                  <button key={ratio} onClick={() => setConfig(c => ({ ...c, aspectRatio: ratio }))}
                    className={`py-2 text-xs border rounded transition-all ${config.aspectRatio === ratio ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-muted-foreground'}`}>
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Camera Movement */}
            <div className="mb-6">
              <Label label="Camera Movement / Video Style" />
              <select value={config.cameraMovement} onChange={(e) => setConfig(c => ({ ...c, cameraMovement: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
                {CAMERA_MOVEMENTS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Category & Topic (Vlog) */}
            {config.creationMode === 'vlog' && (
              <div className="mb-6 space-y-3">
                <div>
                  <Label label="Vlog Category" />
                  <select value={config.vlogCategory} onChange={(e) => setConfig(c => ({ ...c, vlogCategory: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none">
                    {VLOG_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label label="Vlog Topic" />
                    <button onClick={onGenerateTopicIdeas} disabled={isGeneratingTopic}
                      className="text-[10px] text-primary hover:text-foreground uppercase font-bold flex items-center gap-1 transition-colors disabled:opacity-50">
                      {isGeneratingTopic ? <span className="animate-pulse">Thinking...</span> : <><Sparkles className="h-3 w-3" /> Brainstorm</>}
                    </button>
                  </div>
                  <textarea placeholder={TOPIC_PLACEHOLDERS[config.vlogCategory] || "Describe your video concept..."}
                    value={config.vlogTopic} onChange={(e) => setConfig(c => ({ ...c, vlogTopic: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none min-h-[80px]" />
                </div>

                {/* Script */}
                <div className="mt-4 pt-4 border-t border-border">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" checked={config.useOwnScript} onChange={(e) => setConfig(c => ({ ...c, useOwnScript: e.target.checked }))}
                      className="rounded border-border text-primary focus:ring-primary bg-muted" />
                    <span className="text-sm font-bold text-foreground">I want to use my own script ✍️</span>
                  </label>
                  {config.useOwnScript && (
                    <div>
                      <textarea placeholder="Paste your script here... (Max 5000 characters)"
                        value={config.userScript} onChange={(e) => setConfig(c => ({ ...c, userScript: e.target.value.slice(0, 5000) }))}
                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none min-h-[100px]" />
                      <p className="text-right text-[10px] text-muted-foreground mt-1">{config.userScript.length}/5000</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* UGC Context */}
            {config.creationMode === 'ugc' && (
              <div className="mb-6 space-y-3">
                <Label label="Marketing Goal / Context" />
                <textarea placeholder="e.g. Promoting a new matte lipstick, show close up application..."
                  value={config.ugcPrompt} onChange={(e) => setConfig(c => ({ ...c, ugcPrompt: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none min-h-[80px]" />
                <div className="mt-4 pt-4 border-t border-border">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input type="checkbox" checked={config.useOwnScript} onChange={(e) => setConfig(c => ({ ...c, useOwnScript: e.target.checked }))}
                      className="rounded border-border text-primary focus:ring-primary bg-muted" />
                    <span className="text-sm font-bold text-foreground">I want to use my own script ✍️</span>
                  </label>
                  {config.useOwnScript && (
                    <textarea placeholder="Paste your script here..."
                      value={config.userScript} onChange={(e) => setConfig(c => ({ ...c, userScript: e.target.value.slice(0, 5000) }))}
                      className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none min-h-[100px]" />
                  )}
                </div>
              </div>
            )}

            {/* Outfit */}
            <div className="mb-6">
              <Label label="Outfit" />
              <select value={config.outfitType} onChange={(e) => setConfig(c => ({ ...c, outfitType: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground outline-none">
                {OUTFIT_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {config.outfitType === 'Custom Outfit' && (
                <input type="text" placeholder="Describe your outfit..." value={config.outfitDetails}
                  onChange={(e) => setConfig(c => ({ ...c, outfitDetails: e.target.value }))}
                  className="w-full bg-background border border-border rounded-md px-2 py-2 text-xs text-foreground mt-2 focus:ring-1 focus:ring-primary outline-none" />
              )}
              <input type="text" placeholder="Additional outfit details (optional)" value={config.outfitAdditionalInfo}
                onChange={(e) => setConfig(c => ({ ...c, outfitAdditionalInfo: e.target.value }))}
                className="w-full bg-background border border-border rounded-md px-2 py-2 text-xs text-foreground mt-2 focus:ring-1 focus:ring-primary outline-none" />
            </div>

            {/* GRWM Final Look */}
            {config.vlogCategory === 'Get Ready With Me' && config.creationMode === 'vlog' && (
              <div className="mb-6 bg-accent/5 border border-accent/20 rounded-xl p-4">
                <Label label="Final Look (Reveal Outfit)" />
                <select value={config.finalLookType} onChange={(e) => setConfig(c => ({ ...c, finalLookType: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground outline-none">
                  {OUTFIT_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {config.finalLookType === 'Custom Outfit' && (
                  <input type="text" placeholder="Describe final look outfit..." value={config.finalLook}
                    onChange={(e) => setConfig(c => ({ ...c, finalLook: e.target.value }))}
                    className="w-full bg-background border border-border rounded-md px-2 py-2 text-xs text-foreground mt-2 outline-none" />
                )}
                <input type="text" placeholder="Additional final look details (optional)" value={config.finalLookAdditionalInfo}
                  onChange={(e) => setConfig(c => ({ ...c, finalLookAdditionalInfo: e.target.value }))}
                  className="w-full bg-background border border-border rounded-md px-2 py-2 text-xs text-foreground mt-2 outline-none" />
              </div>
            )}

            {/* Hairstyle */}
            <div className="mb-6">
              <Label label="Hairstyle" />
              <select value={config.hairstyle} onChange={(e) => setConfig(c => ({ ...c, hairstyle: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground outline-none">
                {Object.entries(HAIRSTYLE_GROUPS).map(([group, styles]) => (
                  <optgroup key={group} label={group}>
                    {styles.map(s => <option key={s} value={s}>{s}</option>)}
                  </optgroup>
                ))}
              </select>
              {config.hairstyle.includes('Custom') && (
                <input type="text" placeholder="Describe custom hairstyle..." value={config.customHairstyle}
                  onChange={(e) => setConfig(c => ({ ...c, customHairstyle: e.target.value }))}
                  className="w-full bg-background border border-border rounded-md px-2 py-2 text-xs text-foreground mt-2 outline-none" />
              )}
            </div>

            {/* Advanced: Makeup, Skin, Nails */}
            <div className="space-y-4">
              <div>
                <Label label="Makeup" />
                <select value={config.makeup} onChange={(e) => setConfig(c => ({ ...c, makeup: e.target.value }))}
                  className="w-full bg-background border border-border rounded-md px-2 py-2 text-xs text-foreground">
                  {MAKEUP_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {config.makeup === 'Custom' && (
                  <input type="text" placeholder="Custom makeup..." value={config.customMakeup}
                    onChange={(e) => setConfig(c => ({ ...c, customMakeup: e.target.value }))}
                    className="w-full bg-background border border-border rounded-md px-2 py-2 text-xs text-foreground mt-2 outline-none" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Skin</label>
                  <select value={config.skinComplexion} onChange={(e) => setConfig(c => ({ ...c, skinComplexion: e.target.value }))}
                    className="w-full bg-background border border-border rounded-md px-2 py-2 text-xs text-foreground mt-1">
                    {COMPLEXION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={config.skinUndertone} onChange={(e) => setConfig(c => ({ ...c, skinUndertone: e.target.value }))}
                    className="w-full bg-background border border-border rounded-md px-2 py-2 text-xs text-foreground mt-1">
                    {UNDERTONE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase font-bold">Nails</label>
                  <select value={config.nailStyle} onChange={(e) => setConfig(c => ({ ...c, nailStyle: e.target.value }))}
                    className="w-full bg-background border border-border rounded-md px-2 py-2 text-xs text-foreground mt-1">
                    {NAIL_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {config.nailStyle === 'Custom' && (
                    <input type="text" placeholder="Custom nails..." value={config.customNailStyle}
                      onChange={(e) => setConfig(c => ({ ...c, customNailStyle: e.target.value }))}
                      className="w-full bg-background border border-border rounded-md px-2 py-2 text-xs text-foreground mt-2 outline-none" />
                  )}
                </div>
              </div>
            </div>

            <SavedLooks config={config} setConfig={setConfig} />
          </section>

          {/* Terms & Safety */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h4 className="text-muted-foreground font-bold text-sm mb-4">TERMS & SAFETY</h4>
            <ul className="space-y-2 mb-5">
              {[
                "You only upload images that you own or have full rights to use.",
                "You do NOT upload photos of other people without their permission.",
                "You do NOT upload images of minors (children under 18).",
                "You do NOT upload explicit or sexual images."
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-muted-foreground text-xs">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground flex-shrink-0"></span>
                  {t}
                </li>
              ))}
            </ul>
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" checked={showSafetyTerms} onChange={(e) => setShowSafetyTerms(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded-md border border-border bg-background text-primary focus:ring-primary cursor-pointer" />
              <span className="text-xs text-foreground group-hover:text-foreground transition-colors leading-tight">
                I confirm that I own the rights to these images, that no children are shown, and that the images are not explicit. <span className="text-primary font-bold">*Required</span>
              </span>
            </label>
          </div>

          {/* Generate Button */}
          <Button
            onClick={onGeneratePreview}
            disabled={!showSafetyTerms || !referenceImage || isPreviewGenerating}
            className="w-full py-6 text-lg"
            size="lg"
          >
            {isPreviewGenerating ? (
              <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Generating Preview...</>
            ) : (
              <><span>Generate Character Preview</span> <ArrowRight className="h-5 w-5 ml-2" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudioSetup;
