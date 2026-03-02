import React, { useState } from 'react';
import { AppConfig, AspectRatio } from './types';
import {
  MAKEUP_STYLES, COMPLEXION_OPTIONS, UNDERTONE_OPTIONS,
  NAIL_STYLES, OUTFIT_TYPES, HAIRSTYLE_GROUPS, CAMERA_MOVEMENTS,
  VLOG_CATEGORIES, TOPIC_PLACEHOLDERS, QUICK_LOOK_PRESETS
} from './constants';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, ChevronRight, Palette, User, Settings2, Sparkles, MapPin, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import SavedCharacter from './SavedCharacter';
import SavedEnvironments from './SavedEnvironments';
import SavedLooks from './SavedLooks';
import UploadZone from './UploadZone';

interface StoryboardToolbarProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
  isGeneratingTopic?: boolean;
  onGenerateTopicIdeas?: () => void;
  referenceImage?: string | null;
  setReferenceImage?: (img: string | null) => void;
  setReferenceImages?: (imgs: string[]) => void;
  environmentImage?: string | null;
  setEnvironmentImage?: (img: string | null) => void;
  setEnvironmentImages?: (imgs: string[]) => void;
  productImage?: string | null;
  setProductImage?: (img: string | null) => void;
  showSafetyTerms?: boolean;
  setShowSafetyTerms?: (v: boolean) => void;
  isProcessing?: boolean;
}

const StatusDot: React.FC<{ active: boolean }> = ({ active }) => (
  active ? (
    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary/20">
      <Check className="h-2.5 w-2.5 text-primary" />
    </span>
  ) : (
    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
  )
);

const ToolbarButton: React.FC<{ label: string; icon: React.ReactNode; children: React.ReactNode; wide?: boolean; configured?: boolean }> = ({ label, icon, children, wide, configured }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 border border-border rounded-lg transition-colors">
        {icon}
        <span>{label}</span>
        <StatusDot active={!!configured} />
        <ChevronDown className="h-3 w-3" />
      </button>
    </PopoverTrigger>
    <PopoverContent className={`${wide ? 'w-96' : 'w-80'} max-h-[70vh] overflow-y-auto p-4`} align="start">
      {children}
    </PopoverContent>
  </Popover>
);

const Label: React.FC<{ label: string }> = ({ label }) => (
  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1.5">{label}</label>
);

const SelectField: React.FC<{ value: string; onChange: (v: string) => void; options: string[]; groups?: Record<string, string[]> }> = ({ value, onChange, options, groups }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)}
    className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary">
    {groups ? Object.entries(groups).map(([group, styles]) => (
      <optgroup key={group} label={group}>
        {styles.map(s => <option key={s} value={s}>{s}</option>)}
      </optgroup>
    )) : options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

const CollapsibleSection: React.FC<{ title: string; defaultOpen?: boolean; children: React.ReactNode }> = ({ title, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-1.5 text-xs font-bold text-foreground hover:text-primary transition-colors">
        <span>{title}</span>
        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-90' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 space-y-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

const StoryboardToolbar: React.FC<StoryboardToolbarProps> = ({
  config, setConfig, isGeneratingTopic, onGenerateTopicIdeas,
  referenceImage, setReferenceImage, setReferenceImages,
  environmentImage, setEnvironmentImage, setEnvironmentImages,
  productImage, setProductImage,
  showSafetyTerms, setShowSafetyTerms,
  isProcessing
}) => {
  const hasCharacter = !!referenceImage;
  const hasEnvironment = !!environmentImage;
  const hasLookCustomized = config.outfitType !== 'Default Outfit' || config.makeup !== 'Soft Glam Baddie' || config.hairstyle !== 'Sleek Straight Wig';

  return (
    <div className="flex items-center gap-2 flex-wrap py-3 px-1">
      {/* Aspect Ratio Buttons */}
      <div className="flex items-center border border-border rounded-lg overflow-hidden">
        {(['9:16', '16:9', '1:1'] as AspectRatio[]).map(ratio => (
          <button key={ratio} onClick={() => setConfig(c => ({ ...c, aspectRatio: ratio }))}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${config.aspectRatio === ratio ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
            {ratio}
          </button>
        ))}
      </div>

      {/* Character */}
      <ToolbarButton label="Character" icon={<User className="h-3.5 w-3.5" />} wide configured={hasCharacter}>
        <div className="space-y-4">
          {setReferenceImage && (
            <>
              <SavedCharacter onSelect={setReferenceImage} onSelectMultiple={setReferenceImages} />
              <div>
                <Label label="Upload Reference" />
                <UploadZone onImageSelected={setReferenceImage} isProcessing={isProcessing || false} title="Upload Selfie / Avatar" subtext="Used to maintain facial consistency." />
              </div>
            </>
          )}
        </div>
      </ToolbarButton>

      {/* Environment */}
      <ToolbarButton label="Environment" icon={<MapPin className="h-3.5 w-3.5" />} wide configured={hasEnvironment}>
        <div className="space-y-3">
          {setEnvironmentImage && (
            <SavedEnvironments onSelect={setEnvironmentImage} onSelectMultiple={setEnvironmentImages} />
          )}
        </div>
      </ToolbarButton>

      {/* Look */}
      <ToolbarButton label="Look" icon={<Palette className="h-3.5 w-3.5" />} configured={hasLookCustomized}>
        <div className="space-y-3">
          {/* Exact Match */}
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <span className="text-xs font-medium text-foreground">Exact Face & Skin Tone</span>
            <Switch checked={config.exactMatch} onCheckedChange={(v) => setConfig(c => ({ ...c, exactMatch: v }))} />
          </div>

          {/* Quick Look Presets */}
          <div>
            <Label label="Quick Presets" />
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(QUICK_LOOK_PRESETS).map(([name, preset]) => (
                <button
                  key={name}
                  onClick={() => setConfig(c => ({ ...c, ...preset }))}
                  className="px-2.5 py-1 text-[10px] font-medium rounded-full border border-border bg-muted hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Upload (UGC only) */}
          {config.creationMode === 'ugc' && setProductImage && (
            <div>
              <Label label="Product Reference" />
              <UploadZone onImageSelected={setProductImage} isProcessing={isProcessing || false} title="Product Image" subtext="Required for UGC mode." />
            </div>
          )}

          {/* UGC Marketing Goal */}
          {config.creationMode === 'ugc' && (
            <div>
              <Label label="Marketing Goal" />
              <textarea placeholder="e.g. Promoting a new matte lipstick..."
                value={config.ugcPrompt} onChange={(e) => setConfig(c => ({ ...c, ugcPrompt: e.target.value }))}
                className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none min-h-[60px]" />
            </div>
          )}

          {/* Collapsible: Outfit */}
          <CollapsibleSection title="👗 Outfit" defaultOpen>
            <SelectField value={config.outfitType} onChange={(v) => setConfig(c => ({ ...c, outfitType: v }))} options={OUTFIT_TYPES} />
            {config.outfitType === 'Custom Outfit' && (
              <input type="text" placeholder="Describe outfit..." value={config.outfitDetails}
                onChange={(e) => setConfig(c => ({ ...c, outfitDetails: e.target.value }))}
                className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none" />
            )}
            <input type="text" placeholder="Additional details (optional)" value={config.outfitAdditionalInfo}
              onChange={(e) => setConfig(c => ({ ...c, outfitAdditionalInfo: e.target.value }))}
              className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none" />
          </CollapsibleSection>

          {/* GRWM Final Look */}
          {config.vlogCategory === 'Get Ready With Me' && config.creationMode === 'vlog' && (
            <CollapsibleSection title="✨ Final Look (Reveal Outfit)">
              <SelectField value={config.finalLookType} onChange={(v) => setConfig(c => ({ ...c, finalLookType: v }))} options={OUTFIT_TYPES} />
              {config.finalLookType === 'Custom Outfit' && (
                <input type="text" placeholder="Describe final look outfit..." value={config.finalLook}
                  onChange={(e) => setConfig(c => ({ ...c, finalLook: e.target.value }))}
                  className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none" />
              )}
              <input type="text" placeholder="Additional final look details (optional)" value={config.finalLookAdditionalInfo}
                onChange={(e) => setConfig(c => ({ ...c, finalLookAdditionalInfo: e.target.value }))}
                className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none" />
            </CollapsibleSection>
          )}

          {/* Collapsible: Hair */}
          <CollapsibleSection title="💇 Hairstyle">
            <SelectField value={config.hairstyle} onChange={(v) => setConfig(c => ({ ...c, hairstyle: v }))} options={[]} groups={HAIRSTYLE_GROUPS} />
            {config.hairstyle.includes('Custom') && (
              <input type="text" placeholder="Custom hairstyle..." value={config.customHairstyle}
                onChange={(e) => setConfig(c => ({ ...c, customHairstyle: e.target.value }))}
                className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none" />
            )}
          </CollapsibleSection>

          {/* Collapsible: Makeup */}
          <CollapsibleSection title="💄 Makeup">
            <SelectField value={config.makeup} onChange={(v) => setConfig(c => ({ ...c, makeup: v }))} options={MAKEUP_STYLES} />
            {config.makeup === 'Custom' && (
              <input type="text" placeholder="Custom makeup..." value={config.customMakeup}
                onChange={(e) => setConfig(c => ({ ...c, customMakeup: e.target.value }))}
                className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none" />
            )}
          </CollapsibleSection>

          {/* Collapsible: Skin & Nails */}
          <CollapsibleSection title="🖐 Skin & Nails">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label label="Skin" />
                <SelectField value={config.skinComplexion} onChange={(v) => setConfig(c => ({ ...c, skinComplexion: v }))} options={COMPLEXION_OPTIONS} />
                <div className="mt-1">
                  <SelectField value={config.skinUndertone} onChange={(v) => setConfig(c => ({ ...c, skinUndertone: v }))} options={UNDERTONE_OPTIONS} />
                </div>
              </div>
              <div>
                <Label label="Nails" />
                <SelectField value={config.nailStyle} onChange={(v) => setConfig(c => ({ ...c, nailStyle: v }))} options={NAIL_STYLES} />
                {config.nailStyle === 'Custom' && (
                  <input type="text" placeholder="Custom nails..." value={config.customNailStyle}
                    onChange={(e) => setConfig(c => ({ ...c, customNailStyle: e.target.value }))}
                    className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground mt-1 outline-none" />
                )}
              </div>
            </div>
          </CollapsibleSection>

          {/* Saved Looks */}
          <div className="pt-2 border-t border-border">
            <SavedLooks config={config} setConfig={setConfig} />
          </div>
        </div>
      </ToolbarButton>

      {/* Settings (slimmed down) */}
      <ToolbarButton label="Settings" icon={<Settings2 className="h-3.5 w-3.5" />}>
        <div className="space-y-3">
          {/* Creation Mode */}
          <div>
            <Label label="Creation Mode" />
            <div className="grid grid-cols-2 gap-1 bg-muted p-0.5 rounded-md">
              <button onClick={() => setConfig(c => ({ ...c, creationMode: 'vlog' }))}
                className={`py-1.5 text-xs font-medium rounded transition-all ${config.creationMode === 'vlog' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'}`}>
                VLOG
              </button>
              <button onClick={() => setConfig(c => ({ ...c, creationMode: 'ugc' }))}
                className={`py-1.5 text-xs font-medium rounded transition-all ${config.creationMode === 'ugc' ? 'bg-accent text-accent-foreground shadow' : 'text-muted-foreground'}`}>
                UGC
              </button>
            </div>
          </div>

          {/* Camera Movement */}
          <div>
            <Label label="Camera Movement" />
            <SelectField value={config.cameraMovement} onChange={(v) => setConfig(c => ({ ...c, cameraMovement: v }))} options={CAMERA_MOVEMENTS} />
          </div>

          {/* Number of Scenes */}
          <div>
            <Label label="Number of Scenes" />
            <select
              value={config.sceneCount ?? 'auto'}
              onChange={(e) => setConfig(c => ({ ...c, sceneCount: e.target.value === 'auto' ? null : Number(e.target.value) }))}
              className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="auto">Auto (let AI decide)</option>
              {Array.from({ length: 13 }, (_, i) => i + 3).map(n => (
                <option key={n} value={n}>{n} scenes</option>
              ))}
            </select>
          </div>

          {/* Script */}
          <div className="pt-2 border-t border-border">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={config.useOwnScript} onChange={(e) => setConfig(c => ({ ...c, useOwnScript: e.target.checked }))}
                className="rounded border-border text-primary focus:ring-primary bg-muted" />
              <span className="text-xs font-medium text-foreground">Use own script ✍️</span>
            </label>
            {config.useOwnScript && (
              <textarea placeholder="Paste your script here..."
                value={config.userScript} onChange={(e) => setConfig(c => ({ ...c, userScript: e.target.value.slice(0, 5000) }))}
                className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none min-h-[60px] mt-2" />
            )}
          </div>
        </div>
      </ToolbarButton>
    </div>
  );
};

export default StoryboardToolbar;
