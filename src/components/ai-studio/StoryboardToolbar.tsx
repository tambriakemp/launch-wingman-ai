import React from 'react';
import { AppConfig, AspectRatio } from './types';
import {
  MAKEUP_STYLES, COMPLEXION_OPTIONS, UNDERTONE_OPTIONS,
  NAIL_STYLES, OUTFIT_TYPES, HAIRSTYLE_GROUPS, CAMERA_MOVEMENTS,
  VLOG_CATEGORIES, TOPIC_PLACEHOLDERS
} from './constants';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, Palette, User, Settings2, Sparkles } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface StoryboardToolbarProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
  isGeneratingTopic?: boolean;
  onGenerateTopicIdeas?: () => void;
}

const ToolbarButton: React.FC<{ label: string; icon: React.ReactNode; children: React.ReactNode }> = ({ label, icon, children }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 border border-border rounded-lg transition-colors">
        {icon}
        <span>{label}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-80 max-h-[70vh] overflow-y-auto p-4" align="start">
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

const StoryboardToolbar: React.FC<StoryboardToolbarProps> = ({
  config, setConfig, isGeneratingTopic, onGenerateTopicIdeas
}) => {
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

      {/* Visual Style */}
      <ToolbarButton label="Visual Style" icon={<Palette className="h-3.5 w-3.5" />}>
        <div className="space-y-3">
          <div>
            <Label label="Outfit" />
            <SelectField value={config.outfitType} onChange={(v) => setConfig(c => ({ ...c, outfitType: v }))} options={OUTFIT_TYPES} />
            {config.outfitType === 'Custom Outfit' && (
              <input type="text" placeholder="Describe outfit..." value={config.outfitDetails}
                onChange={(e) => setConfig(c => ({ ...c, outfitDetails: e.target.value }))}
                className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground mt-1.5 outline-none" />
            )}
            <input type="text" placeholder="Additional details (optional)" value={config.outfitAdditionalInfo}
              onChange={(e) => setConfig(c => ({ ...c, outfitAdditionalInfo: e.target.value }))}
              className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground mt-1.5 outline-none" />
          </div>
          <div>
            <Label label="Hairstyle" />
            <SelectField value={config.hairstyle} onChange={(v) => setConfig(c => ({ ...c, hairstyle: v }))} options={[]} groups={HAIRSTYLE_GROUPS} />
            {config.hairstyle.includes('Custom') && (
              <input type="text" placeholder="Custom hairstyle..." value={config.customHairstyle}
                onChange={(e) => setConfig(c => ({ ...c, customHairstyle: e.target.value }))}
                className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground mt-1.5 outline-none" />
            )}
          </div>
          <div>
            <Label label="Makeup" />
            <SelectField value={config.makeup} onChange={(v) => setConfig(c => ({ ...c, makeup: v }))} options={MAKEUP_STYLES} />
            {config.makeup === 'Custom' && (
              <input type="text" placeholder="Custom makeup..." value={config.customMakeup}
                onChange={(e) => setConfig(c => ({ ...c, customMakeup: e.target.value }))}
                className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground mt-1.5 outline-none" />
            )}
          </div>
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
                  className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground mt-1.5 outline-none" />
              )}
            </div>
          </div>
          <div className="pt-2 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-foreground">Exact Face & Skin Tone</span>
              <Switch checked={config.exactMatch} onCheckedChange={(v) => setConfig(c => ({ ...c, exactMatch: v }))} />
            </div>
          </div>
        </div>
      </ToolbarButton>

      {/* Character (placeholder - just shows current mode) */}
      <ToolbarButton label="Character" icon={<User className="h-3.5 w-3.5" />}>
        <div className="space-y-3">
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
          {config.creationMode === 'ugc' && (
            <div>
              <Label label="Marketing Goal" />
              <textarea placeholder="e.g. Promoting a new matte lipstick..."
                value={config.ugcPrompt} onChange={(e) => setConfig(c => ({ ...c, ugcPrompt: e.target.value }))}
                className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none min-h-[60px]" />
            </div>
          )}
        </div>
      </ToolbarButton>

      {/* Settings */}
      <ToolbarButton label="Settings" icon={<Settings2 className="h-3.5 w-3.5" />}>
        <div className="space-y-3">
          <div>
            <Label label="Camera Movement" />
            <SelectField value={config.cameraMovement} onChange={(v) => setConfig(c => ({ ...c, cameraMovement: v }))} options={CAMERA_MOVEMENTS} />
          </div>
          {config.creationMode === 'vlog' && (
            <>
              <div>
                <Label label="Vlog Category" />
                <SelectField value={config.vlogCategory} onChange={(v) => setConfig(c => ({ ...c, vlogCategory: v }))} options={VLOG_CATEGORIES} />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label label="Vlog Topic" />
                  {onGenerateTopicIdeas && (
                    <button onClick={onGenerateTopicIdeas} disabled={isGeneratingTopic}
                      className="text-[10px] text-primary hover:text-foreground uppercase font-bold flex items-center gap-1 disabled:opacity-50">
                      {isGeneratingTopic ? <span className="animate-pulse">Thinking...</span> : <><Sparkles className="h-3 w-3" /> Brainstorm</>}
                    </button>
                  )}
                </div>
                <textarea placeholder={TOPIC_PLACEHOLDERS[config.vlogCategory] || "Describe your video concept..."}
                  value={config.vlogTopic} onChange={(e) => setConfig(c => ({ ...c, vlogTopic: e.target.value }))}
                  className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none min-h-[60px]" />
              </div>
            </>
          )}
          {config.vlogCategory === 'Get Ready With Me' && config.creationMode === 'vlog' && (
            <div className="pt-2 border-t border-border">
              <Label label="Final Look (Reveal Outfit)" />
              <SelectField value={config.finalLookType} onChange={(v) => setConfig(c => ({ ...c, finalLookType: v }))} options={OUTFIT_TYPES} />
              {config.finalLookType === 'Custom Outfit' && (
                <input type="text" placeholder="Describe final look outfit..." value={config.finalLook}
                  onChange={(e) => setConfig(c => ({ ...c, finalLook: e.target.value }))}
                  className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground mt-1.5 outline-none" />
              )}
            </div>
          )}
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
