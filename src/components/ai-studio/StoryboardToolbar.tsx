import React, { useState } from 'react';
import { AppConfig, AspectRatio } from './types';
import {
  MAKEUP_STYLES, COMPLEXION_OPTIONS, UNDERTONE_OPTIONS,
  NAIL_STYLES, OUTFIT_TYPES, HAIRSTYLE_GROUPS, CAMERA_MOVEMENTS,
  VLOG_CATEGORIES, TOPIC_PLACEHOLDERS, QUICK_LOOK_PRESETS, CAROUSEL_AESTHETICS
} from './constants';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ChevronDown, ChevronRight, Palette, User, Settings2, Sparkles, MapPin, Check, RectangleVertical, RectangleHorizontal, Square } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { FolderOpen, Save, FileText, Download, HelpCircle, RotateCcw, Loader2, MoreHorizontal, ImageIcon, Video, Film, Eye } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
  setEnvironmentLabel?: (label: string) => void;
  productImage?: string | null;
  setProductImage?: (img: string | null) => void;
  showSafetyTerms?: boolean;
  onCharacterSelect?: (character: any) => void;
  setShowSafetyTerms?: (v: boolean) => void;
  isProcessing?: boolean;
  onProjects?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  onDownloadScript?: () => void;
  onDownloadAll?: () => void;
  hasStoryboard?: boolean;
  onHelp?: () => void;
  onGenerateStoryboard?: () => void;
  isGeneratingStoryboard?: boolean;
  onGenerateAllImages?: () => void;
  onGenerateAllVideos?: () => void;
  onCreateReel?: () => void;
  onViewReel?: () => void;
  onDownloadReel?: () => void;
  isMergingVideos?: boolean;
  mergedReelUrl?: string | null;
  videoCount?: number;
  anyGeneratingVideo?: boolean;
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

const CollapsibleSection: React.FC<{ title: string; defaultOpen?: boolean; children: React.ReactNode; statusActive?: boolean }> = ({ title, defaultOpen = false, children, statusActive }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="bg-muted/30 rounded-lg px-4 py-1">
      <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-sm font-bold text-foreground hover:text-primary transition-colors">
        <span className="flex items-center gap-2 text-base">
          {title}
          {statusActive !== undefined && <StatusDot active={statusActive} />}
        </span>
        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-90' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 pb-3 space-y-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

const StoryboardToolbar: React.FC<StoryboardToolbarProps> = ({
  config, setConfig, isGeneratingTopic, onGenerateTopicIdeas,
  referenceImage, setReferenceImage, setReferenceImages,
  environmentImage, setEnvironmentImage, setEnvironmentImages, setEnvironmentLabel,
  productImage, setProductImage,
  showSafetyTerms, onCharacterSelect, setShowSafetyTerms,
  isProcessing,
  onProjects, onSave, isSaving, onDownloadScript, onDownloadAll, hasStoryboard, onHelp,
  onGenerateStoryboard, isGeneratingStoryboard,
  onGenerateAllImages, onGenerateAllVideos, onCreateReel, onViewReel, onDownloadReel,
  isMergingVideos, mergedReelUrl, videoCount = 0, anyGeneratingVideo
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  const hasCharacter = !!referenceImage;
  const hasEnvironment = !!environmentImage;
  const hasLookCustomized = config.outfitType !== 'Default Outfit' || config.makeup !== 'Soft Glam Baddie' || config.hairstyle !== 'Sleek Straight Wig';
  const hasAnyConfig = hasCharacter || hasEnvironment || hasLookCustomized || !!config.vlogTopic || !!config.carouselVibe;

  return (
    <div className="flex items-center gap-2 flex-wrap py-3 px-1 mb-3">
      {/* Single "Create" button that opens the Sheet */}
      <button
        onClick={() => setSheetOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 border border-border rounded-lg transition-colors"
      >
        <Settings2 className="h-3.5 w-3.5" />
        <span>Create</span>
        <StatusDot active={hasAnyConfig} />
      </button>

      {/* Settings Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="text-base">Creation Settings</SheetTitle>
          </SheetHeader>

          <div className="px-6 py-4 space-y-3">
            {/* Section 1: Creation Mode */}
            <CollapsibleSection title="🎬 Creation Mode" defaultOpen statusActive={true}>
              <div className="space-y-3">
                {/* Orientation */}
                <div>
                  <Label label="Orientation" />
                  <div className="grid grid-cols-3 gap-1 bg-muted p-0.5 rounded-md">
                    {([
                      { value: '9:16' as AspectRatio, label: 'Portrait', Icon: RectangleVertical },
                      { value: '16:9' as AspectRatio, label: 'Landscape', Icon: RectangleHorizontal },
                      { value: '1:1' as AspectRatio, label: 'Square', Icon: Square },
                    ]).map(({ value, label, Icon }) => (
                      <button key={value} onClick={() => setConfig(c => ({ ...c, aspectRatio: value }))}
                        className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded transition-all ${config.aspectRatio === value ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>
                        <Icon className="h-3.5 w-3.5" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label label="Mode" />
                  <div className="grid grid-cols-3 gap-1 bg-muted p-0.5 rounded-md">
                    <button onClick={() => setConfig(c => ({ ...c, creationMode: 'vlog' }))}
                      className={`py-1.5 text-xs font-medium rounded transition-all ${config.creationMode === 'vlog' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'}`}>
                      VLOG
                    </button>
                    <button onClick={() => setConfig(c => ({ ...c, creationMode: 'ugc' }))}
                      className={`py-1.5 text-xs font-medium rounded transition-all ${config.creationMode === 'ugc' ? 'bg-accent text-accent-foreground shadow' : 'text-muted-foreground'}`}>
                      UGC
                    </button>
                    <button onClick={() => setConfig(c => ({ ...c, creationMode: 'carousel' }))}
                      className={`py-1.5 text-xs font-medium rounded transition-all ${config.creationMode === 'carousel' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'}`}>
                      CAROUSEL
                    </button>
                  </div>
                </div>

                {config.creationMode === 'vlog' && (
                  <div>
                    <Label label="Vlog Category" />
                    <SelectField value={config.vlogCategory} onChange={(v) => setConfig(c => ({ ...c, vlogCategory: v }))} options={VLOG_CATEGORIES} />
                  </div>
                )}

                {config.creationMode === 'carousel' && (
                  <div>
                    <Label label="Aesthetic / Mood" />
                    <SelectField value={config.carouselAesthetic} onChange={(v) => setConfig(c => ({ ...c, carouselAesthetic: v }))} options={CAROUSEL_AESTHETICS} />
                  </div>
                )}

                <div>
                  <Label label="Camera Movement" />
                  <SelectField value={config.cameraMovement} onChange={(v) => setConfig(c => ({ ...c, cameraMovement: v }))} options={CAMERA_MOVEMENTS} />
                </div>

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
              </div>
            </CollapsibleSection>

            {/* Section 2: Character */}
            <CollapsibleSection title="👤 Character" statusActive={hasCharacter}>
              <div className="space-y-4">
                {setReferenceImage && (
                  <>
                    <SavedCharacter onSelect={setReferenceImage} onSelectMultiple={setReferenceImages} onCharacterSelect={onCharacterSelect} />
                    <div>
                      <Label label="Upload Reference" />
                      <UploadZone onImageSelected={setReferenceImage} isProcessing={isProcessing || false} title="Upload Selfie / Avatar" subtext="Used to maintain facial consistency." />
                    </div>
                  </>
                )}
              </div>
            </CollapsibleSection>

            {/* Section 4: Environment */}
            <CollapsibleSection title="📍 Environment" statusActive={hasEnvironment}>
              <div className="space-y-3">
                {setEnvironmentImage && (
                  <SavedEnvironments onSelect={setEnvironmentImage} onSelectMultiple={setEnvironmentImages} onSelectLabel={setEnvironmentLabel} />
                )}
              </div>
            </CollapsibleSection>

            {/* Section 5: Look */}
            <CollapsibleSection title="🎨 Look & Style" statusActive={hasLookCustomized}>
              <div className="space-y-3">
                {/* Exact Match */}
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <span className="text-xs font-medium text-foreground">Exact Face & Skin Tone</span>
                  <Switch checked={config.exactMatch} onCheckedChange={(v) => setConfig(c => ({ ...c, exactMatch: v }))} />
                </div>

                {/* Ultra-Realistic */}
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <span className="text-xs font-medium text-foreground">Ultra-Realistic Skin & Photo</span>
                  <Switch checked={config.ultraRealistic} onCheckedChange={(v) => setConfig(c => ({ ...c, ultraRealistic: v }))} />
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
            </CollapsibleSection>

            {/* Section 5: Topic / Message (last) */}
            <CollapsibleSection
              title={config.creationMode === 'carousel' ? '🎬 Set the Scene' : config.creationMode === 'ugc' ? '💬 Marketing Goal' : '💬 Topic & Script'}
              defaultOpen
              statusActive={!!(config.vlogTopic || config.carouselVibe || config.ugcPrompt)}
            >
              <div className="space-y-3">
                {config.creationMode === 'vlog' && (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <Label label="Vlog Topic" />
                        {onGenerateTopicIdeas && (
                          <button onClick={onGenerateTopicIdeas} disabled={isGeneratingTopic}
                            className="text-[10px] text-primary hover:text-foreground uppercase font-bold flex items-center gap-1 disabled:opacity-50">
                            {isGeneratingTopic ? <span className="animate-pulse">Thinking...</span> : <><Sparkles className="h-3 w-3" /> Brainstorm</>}
                          </button>
                        )}
                      </div>
                      <textarea
                        placeholder={TOPIC_PLACEHOLDERS[config.vlogCategory] || "Describe your video concept..."}
                        value={config.vlogTopic}
                        onChange={(e) => setConfig(c => ({ ...c, vlogTopic: e.target.value }))}
                        className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none min-h-[140px] focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="pt-2 border-t border-border">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={config.useOwnScript} onChange={(e) => setConfig(c => ({ ...c, useOwnScript: e.target.checked }))}
                          className="rounded border-border text-primary focus:ring-primary bg-muted" />
                        <span className="text-xs font-medium text-foreground">Use own script ✍️</span>
                      </label>
                      {config.useOwnScript && (
                        <textarea placeholder="Paste your script here..."
                          value={config.userScript} onChange={(e) => setConfig(c => ({ ...c, userScript: e.target.value.slice(0, 5000) }))}
                          className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none min-h-[140px] mt-2 focus:ring-1 focus:ring-primary" />
                      )}
                    </div>
                  </>
                )}

                {config.creationMode === 'carousel' && (
                  <>
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <Label label="Scene Description" />
                        {onGenerateTopicIdeas && (
                          <button onClick={onGenerateTopicIdeas} disabled={isGeneratingTopic}
                            className="text-[10px] text-primary hover:text-foreground uppercase font-bold flex items-center gap-1 disabled:opacity-50">
                            {isGeneratingTopic ? <span className="animate-pulse">Thinking...</span> : <><Sparkles className="h-3 w-3" /> Brainstorm</>}
                          </button>
                        )}
                      </div>
                      <textarea
                        placeholder="Describe the world of your carousel — location, vibe, lighting, props, e.g. 'Cozy coffee shop with warm golden light, plants on shelves, latte art on the table...'"
                        value={config.carouselVibe}
                        onChange={(e) => setConfig(c => ({ ...c, carouselVibe: e.target.value }))}
                        className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none min-h-[140px] focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <Label label="Story / Caption Theme" />
                      <textarea
                        placeholder="What narrative ties the slides together? e.g. 'Morning routine that changed my productivity — each slide shows a different step...'"
                        value={config.carouselMessage}
                        onChange={(e) => setConfig(c => ({ ...c, carouselMessage: e.target.value }))}
                        className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none min-h-[140px] focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground/60">All slides share the same character, setting, lighting, and outfit — only the shot angle and framing will vary.</p>
                  </>
                )}

                {config.creationMode === 'ugc' && (
                  <div>
                    <Label label="Marketing Goal" />
                    <textarea placeholder="e.g. Promoting a new matte lipstick..."
                      value={config.ugcPrompt} onChange={(e) => setConfig(c => ({ ...c, ugcPrompt: e.target.value }))}
                      className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none min-h-[140px] focus:ring-1 focus:ring-primary" />
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </div>

          {/* Generate Storyboard Button — always visible */}
          {onGenerateStoryboard && (
            <div className="px-6 py-4 border-t border-border">
              <button
                onClick={() => { onGenerateStoryboard(); setSheetOpen(false); }}
                disabled={!showSafetyTerms || !referenceImage || isGeneratingStoryboard}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold rounded-xl bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {isGeneratingStoryboard ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating Storyboard...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> {hasStoryboard ? 'Generate New Storyboard' : 'Generate Storyboard'}</>
                )}
              </button>
              {hasStoryboard && (
                <p className="text-[10px] text-destructive text-center mt-1.5">This will replace your current storyboard.</p>
              )}
              {!hasStoryboard && (
                <p className="text-[10px] text-muted-foreground text-center mt-1.5">Generation can take 1–2 minutes.</p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Separator + Action Buttons */}
      {onProjects && (
        <>
          {hasStoryboard && (
            <>
              {/* Generate Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 border border-border rounded-lg transition-colors">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={onGenerateAllImages}>
                    <ImageIcon className="h-3.5 w-3.5 mr-2" /> Generate All Images
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onGenerateAllVideos}>
                    <Video className="h-3.5 w-3.5 mr-2" /> Generate All Videos
                  </DropdownMenuItem>
                  {videoCount >= 2 && !anyGeneratingVideo && (
                    <>
                      <DropdownMenuItem onClick={onCreateReel} disabled={isMergingVideos}>
                        <Film className="h-3.5 w-3.5 mr-2" /> {isMergingVideos ? 'Creating Reel...' : mergedReelUrl ? 'Re-generate Reel' : 'Generate Reel'}
                      </DropdownMenuItem>
                      {mergedReelUrl && (
                        <>
                          <DropdownMenuItem onClick={onViewReel}>
                            <Eye className="h-3.5 w-3.5 mr-2" /> View Reel
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={onDownloadReel}>
                            <Download className="h-3.5 w-3.5 mr-2" /> Download Reel
                          </DropdownMenuItem>
                        </>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Ellipsis overflow menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted border border-border rounded-lg transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={onDownloadScript}>
                    <FileText className="h-3.5 w-3.5 mr-2" /> Download Script
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDownloadAll}>
                    <Download className="h-3.5 w-3.5 mr-2" /> Download All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onHelp}>
                    <HelpCircle className="h-3.5 w-3.5 mr-2" /> Help
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            </>
          )}
          <div className="ml-auto">
            <div className="flex items-center">
              <button onClick={onProjects} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors ${hasStoryboard && onSave ? 'rounded-l-lg border-r border-background/20' : 'rounded-lg'}`}>
                <FolderOpen className="h-3.5 w-3.5" /> Projects
              </button>
              {hasStoryboard && onSave && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center justify-center h-full text-xs font-medium bg-foreground/80 text-background hover:bg-foreground/70 rounded-r-lg transition-colors px-[14px] py-[8px]">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onSave} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-2" />} Save Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StoryboardToolbar;
