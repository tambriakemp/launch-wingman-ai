import React, { useState } from 'react';
import { AppConfig, AspectRatio } from './types';
import {
  MAKEUP_STYLES, COMPLEXION_OPTIONS, UNDERTONE_OPTIONS,
  NAIL_STYLES, OUTFIT_TYPES, HAIRSTYLE_GROUPS, CAMERA_MOVEMENTS,
  VLOG_CATEGORIES, TOPIC_PLACEHOLDERS
} from './constants';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ChevronDown, Settings2, Sparkles, Check, RectangleVertical, RectangleHorizontal, Square, CheckCircle2, ShieldCheck, Loader2, FolderOpen, Save, FileText, Download, HelpCircle, MoreHorizontal, ImageIcon, Video, Film, Eye } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  brainstormIdeas?: string[];
  onSelectIdea?: (idea: string) => void;
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

const MicroLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-muted-foreground mb-2">{children}</p>
);

const SelectField: React.FC<{ value: string; onChange: (v: string) => void; options: string[]; groups?: Record<string, string[]> }> = ({ value, onChange, options, groups }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full bg-background border border-border/50 rounded-lg px-3 py-2.5 text-xs text-foreground outline-none focus:border-foreground/30 transition-colors appearance-none cursor-pointer"
  >
    {groups
      ? Object.entries(groups).map(([group, styles]) => (
          <optgroup key={group} label={group}>
            {styles.map(s => <option key={s} value={s}>{s}</option>)}
          </optgroup>
        ))
      : options.map(o => <option key={o} value={o}>{o}</option>)
    }
  </select>
);

const StepBadge: React.FC<{ number: string; done?: boolean; active?: boolean }> = ({ number, done, active }) => (
  <span className={`inline-flex items-center justify-center w-[22px] h-[22px] rounded-full text-[10px] font-medium flex-shrink-0 transition-all ${
    done ? 'bg-foreground text-background' :
    active ? 'bg-muted text-foreground/70 border border-border' :
    'bg-transparent text-muted-foreground border border-border/60'
  }`}>
    {done ? <Check className="h-2.5 w-2.5" /> : number}
  </span>
);

const CollapsibleSection: React.FC<{
  title: string;
  stepNumber?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  isDone?: boolean;
  isActive?: boolean;
  subtle?: boolean;
  open?: boolean;
  onToggle?: () => void;
}> = ({ title, stepNumber, defaultOpen = false, children, isDone, isActive, subtle, open: controlledOpen, onToggle }) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleChange = (val: boolean) => {
    if (onToggle) { if (val) onToggle(); else if (controlledOpen !== undefined) onToggle(); }
    else setInternalOpen(val);
  };
  return (
    <Collapsible open={isOpen} onOpenChange={handleChange}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-[18px] hover:opacity-80 transition-opacity">
        <span className="flex items-center gap-3">
          {stepNumber && <StepBadge number={stepNumber} done={isDone} active={isActive} />}
          <span className={`text-sm tracking-tight ${subtle ? 'font-normal text-muted-foreground' : 'font-semibold text-foreground'}`}>
            {title}
          </span>
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pb-6 pt-2 space-y-5">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const SegBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-2 text-[11.5px] font-medium rounded-md transition-all duration-150 ${
      active ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground/70'
    }`}
  >
    {children}
  </button>
);

const EnvCard: React.FC<{ mode: 'lock' | 'evolve'; selected: boolean; onClick: () => void }> = ({ mode, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`text-left p-3 rounded-xl border text-xs transition-all duration-150 ${
      selected ? 'border-border bg-muted/40 shadow-sm' : 'border-border/60 hover:border-border bg-background'
    }`}
  >
    <div className="text-base mb-1.5">{mode === 'lock' ? '🔒' : '🌊'}</div>
    <div className="font-semibold text-foreground text-[11px] mb-0.5">{mode === 'lock' ? 'Lock' : 'Evolve'}</div>
    <div className="text-[10px] text-muted-foreground leading-snug">
      {mode === 'lock' ? 'Same location throughout. Only angle and framing change.' : 'Character moves through connected environments. Full vlog feel.'}
    </div>
  </button>
);

const StoryboardToolbar: React.FC<StoryboardToolbarProps> = ({
  config, setConfig, isGeneratingTopic, onGenerateTopicIdeas,
  referenceImage, setReferenceImage, setReferenceImages,
  environmentImage, setEnvironmentImage, setEnvironmentImages, setEnvironmentLabel,
  productImage, setProductImage,
  showSafetyTerms, onCharacterSelect, brainstormIdeas, onSelectIdea, setShowSafetyTerms,
  isProcessing,
  onProjects, onSave, isSaving, onDownloadScript, onDownloadAll, hasStoryboard, onHelp,
  onGenerateStoryboard, isGeneratingStoryboard,
  onGenerateAllImages, onGenerateAllVideos, onCreateReel, onViewReel, onDownloadReel,
  isMergingVideos, mergedReelUrl, videoCount = 0, anyGeneratingVideo
}) => {
  const [openSection, setOpenSection] = useState<string>('1');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [characterSource, setCharacterSource] = useState<'saved' | 'upload'>('saved');
  const [cachedUploadImage, setCachedUploadImage] = useState<string | null>(null);

  const hasCharacter = !!referenceImage;
  const hasLookCustomized = config.outfitType !== 'Default Outfit' || config.makeup !== 'Soft Glam Baddie' || config.hairstyle !== 'Sleek Straight Wig';
  const hasAnyConfig = hasCharacter || !!environmentImage || hasLookCustomized || !!config.vlogTopic || !!config.carouselVibe;
  const hasConcept = !!(config.vlogTopic || config.carouselVibe || config.ugcPrompt) || (characterSource === 'upload' && hasCharacter);

  const step1Done = hasCharacter;
  const step2Done = hasConcept;

  return (
    <div className="flex items-center gap-2 flex-wrap py-3 px-1 mb-3">

      <button
        onClick={() => setSheetOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 border border-border rounded-lg transition-colors"
      >
        <Settings2 className="h-3.5 w-3.5" />
        <span>Create</span>
        {hasAnyConfig && <span className="w-1.5 h-1.5 rounded-full bg-primary ml-0.5" />}
      </button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-[420px] overflow-y-auto p-0 bg-background">

          <SheetHeader className="px-6 pt-7 pb-5">
            <SheetTitle className="text-xl font-light tracking-tight text-foreground">Create</SheetTitle>
            <p className="text-xs text-muted-foreground mt-1 font-light">
              {!hasCharacter ? 'Start with your character photo' : hasConcept ? 'Ready to generate' : 'Now add your concept'}
            </p>
            <div className="flex items-center gap-1.5 mt-4">
              <div className={`h-[3px] rounded-full transition-all duration-300 ${step1Done ? 'bg-foreground w-9' : 'bg-border w-6'}`} />
              <div className={`h-[3px] rounded-full transition-all duration-300 ${step2Done ? 'bg-foreground w-9' : step1Done ? 'bg-muted-foreground/30 w-9' : 'bg-border w-6'}`} />
              <div className="h-[3px] rounded-full bg-border w-6" />
              <div className="h-[3px] rounded-full bg-border w-6" />
            </div>
          </SheetHeader>

          <div className="h-px bg-border mx-6" />

          <div className="px-6 divide-y divide-border/60">

            {/* ── Step 1: Character ── */}
            <CollapsibleSection title="Character" stepNumber="1" isDone={step1Done} isActive={!step1Done} open={openSection === '1'} onToggle={() => setOpenSection(openSection === '1' ? '' : '1')}>
              <div>
                <MicroLabel>Character source</MicroLabel>
                <div className="flex gap-[2px] p-[3px] bg-muted rounded-lg border border-border/50">
                  <SegBtn active={characterSource === 'saved'} onClick={() => {
                    setCachedUploadImage(referenceImage || null);
                    setCharacterSource('saved');
                    setConfig(c => ({ ...c, useReferenceAsStart: false }));
                  }}>Saved character</SegBtn>
                  <SegBtn active={characterSource === 'upload'} onClick={() => {
                    setCharacterSource('upload');
                    setConfig(c => ({ ...c, useReferenceAsStart: true }));
                    if (cachedUploadImage && setReferenceImage) setReferenceImage(cachedUploadImage);
                  }}>Upload photo</SegBtn>
                </div>
              </div>

              {setReferenceImage && characterSource === 'saved' && (
                <SavedCharacter onSelect={setReferenceImage} onSelectMultiple={setReferenceImages} onCharacterSelect={onCharacterSelect} />
              )}

              {setReferenceImage && characterSource === 'upload' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground font-light leading-relaxed">
                    Upload the image you'll use as your first frame. Shot 1 mirrors it exactly — same position, same environment.
                  </p>
                  <UploadZone
                    onImageSelected={(img) => { setCachedUploadImage(img); if (setReferenceImage) setReferenceImage(img); }}
                    isProcessing={isProcessing || false}
                    title="Upload Photo / Avatar"
                    subtext="Used as the start frame and face anchor."
                    initialPreview={cachedUploadImage}
                  />
                </div>
              )}

              {!showSafetyTerms && setShowSafetyTerms && (
                <div className="flex items-start gap-3 bg-muted/30 border border-border/30 rounded-xl p-3.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground/60 flex-1 leading-relaxed font-light">
                    I confirm I own the rights to these images, no children are shown, and images are not explicit.
                  </p>
                  <button
                    onClick={() => { localStorage.setItem('ai-studio-terms-accepted', 'true'); setShowSafetyTerms(true); }}
                    className="px-3 py-1.5 text-[10px] font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 flex-shrink-0 tracking-wide"
                  >
                    Agree
                  </button>
                </div>
              )}
              {showSafetyTerms && referenceImage && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50 font-light">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400/70" />
                  Character ready
                </div>
              )}
            </CollapsibleSection>

            {/* ── Step 2: Concept ── */}
            <CollapsibleSection title="Concept" stepNumber="2" isDone={step2Done} isActive={step1Done && !step2Done} open={openSection === '2'} onToggle={() => setOpenSection(openSection === '2' ? '' : '2')}>
              <div>
                <MicroLabel>Mode</MicroLabel>
                <div className="flex gap-[2px] p-[3px] bg-muted rounded-lg border border-border/50">
                  <SegBtn active={config.creationMode === 'vlog'} onClick={() => setConfig(c => ({ ...c, creationMode: 'vlog' }))}>
                    Vlog / Carousel
                  </SegBtn>
                  <SegBtn active={config.creationMode === 'ugc'} onClick={() => setConfig(c => ({ ...c, creationMode: 'ugc' }))}>
                    UGC
                  </SegBtn>
                </div>
              </div>

              {/* Upload photo → auto AI-directed, no toggle */}
              {config.creationMode !== 'ugc' && characterSource === 'upload' && hasCharacter && (
                <div className="rounded-xl border border-border shadow-card overflow-hidden">
                  <div className="px-4 py-3.5">
                    <p className="text-[13px] font-semibold text-foreground tracking-tight">AI-directed storyboard</p>
                     <p className="text-[11.5px] text-muted-foreground mt-1.5 leading-relaxed">
                       The AI will analyze your photo — appearance, outfit, setting, lighting, vibe — and direct the entire shoot from what it sees.
                    </p>
                  </div>
                  <div className="px-4 py-4 border-t border-border space-y-3 bg-background">
                    <MicroLabel>Environment</MicroLabel>
                    <div className="grid grid-cols-2 gap-2">
                      <EnvCard mode="lock" selected={config.environmentMode === 'lock'} onClick={() => setConfig(c => ({ ...c, environmentMode: 'lock' }))} />
                      <EnvCard mode="evolve" selected={config.environmentMode === 'evolve'} onClick={() => setConfig(c => ({ ...c, environmentMode: 'evolve' }))} />
                    </div>
                  </div>
                </div>
              )}

              {/* Saved character → optional Path A toggle */}
              {config.creationMode !== 'ugc' && characterSource === 'saved' && (
                <div className={`rounded-xl border transition-all duration-200 overflow-hidden ${config.useReferenceAsStart ? 'border-border shadow-card' : 'border-border/50'}`}>
                  <div className="flex items-start justify-between gap-3 px-4 py-3.5">
                    <div>
                      <p className="text-[12px] font-semibold text-foreground">Let AI direct from this photo</p>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        AI reads the image and builds the full storyboard — no concept needed.
                      </p>
                    </div>
                    <Switch checked={config.useReferenceAsStart} onCheckedChange={(v) => setConfig(c => ({ ...c, useReferenceAsStart: v }))} />
                  </div>
                  {config.useReferenceAsStart && (
                    <div className="px-4 pb-4 border-t border-border pt-4 space-y-3 bg-background">
                      <MicroLabel>Environment</MicroLabel>
                      <div className="grid grid-cols-2 gap-2">
                        <EnvCard mode="lock" selected={config.environmentMode === 'lock'} onClick={() => setConfig(c => ({ ...c, environmentMode: 'lock' }))} />
                        <EnvCard mode="evolve" selected={config.environmentMode === 'evolve'} onClick={() => setConfig(c => ({ ...c, environmentMode: 'evolve' }))} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Concept fields — saved + Path A off */}
              {config.creationMode !== 'ugc' && characterSource === 'saved' && !config.useReferenceAsStart && (
                <>
                  <div>
                    <MicroLabel>Vlog / Carousel category</MicroLabel>
                    <SelectField value={config.vlogCategory} onChange={(v) => setConfig(c => ({ ...c, vlogCategory: v }))} options={VLOG_CATEGORIES} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <MicroLabel>Your prompt</MicroLabel>
                      {onGenerateTopicIdeas && (
                        <button onClick={onGenerateTopicIdeas} disabled={isGeneratingTopic}
                          className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground/50 hover:text-foreground transition-colors disabled:opacity-30 tracking-wide">
                          {isGeneratingTopic ? <span className="animate-pulse">thinking...</span> : <><Sparkles className="h-2.5 w-2.5" /> Brainstorm</>}
                        </button>
                      )}
                    </div>
                    <textarea
                      placeholder={TOPIC_PLACEHOLDERS[config.vlogCategory] || 'Describe your concept — location, vibe, lighting, props, outfit, energy...'}
                      value={config.vlogTopic}
                      onChange={(e) => setConfig(c => ({ ...c, vlogTopic: e.target.value }))}
                      className="w-full bg-transparent border border-border/50 rounded-lg px-3 py-3 text-xs text-foreground outline-none focus:border-foreground/30 transition-colors placeholder:text-muted-foreground/40 min-h-[110px] resize-none leading-relaxed"
                    />
                  </div>
                  {brainstormIdeas && brainstormIdeas.length > 0 && (
                    <div>
                      <p className="text-[9px] font-medium tracking-[0.12em] uppercase text-muted-foreground/40 mb-2">Tap an idea</p>
                      <div className="space-y-1.5">
                        {brainstormIdeas.map((idea, i) => (
                          <button key={i} onClick={() => { if (onSelectIdea) onSelectIdea(idea); }}
                            className="w-full text-left px-3.5 py-3 rounded-xl bg-muted/30 hover:bg-muted/60 border border-border/20 hover:border-border/40 text-[11px] text-foreground/80 transition-all duration-150 leading-relaxed font-light">
                            {idea}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {config.creationMode === 'ugc' && (
                <div>
                  <MicroLabel>Marketing goal</MicroLabel>
                  <textarea
                    placeholder="e.g. Promoting a new matte lipstick..."
                    value={config.ugcPrompt}
                    onChange={(e) => setConfig(c => ({ ...c, ugcPrompt: e.target.value }))}
                    className="w-full bg-transparent border border-border/50 rounded-lg px-3 py-3 text-xs text-foreground outline-none focus:border-foreground/30 transition-colors placeholder:text-muted-foreground/40 min-h-[110px] resize-none leading-relaxed"
                  />
                </div>
              )}
            </CollapsibleSection>

            {/* ── Step 3: Settings ── */}
            <CollapsibleSection title="Settings" stepNumber="3" isActive={step2Done} open={openSection === '3'} onToggle={() => setOpenSection(openSection === '3' ? '' : '3')}>
              <div>
                <MicroLabel>Orientation</MicroLabel>
                <div className="flex gap-[2px] p-[3px] bg-muted rounded-lg border border-border/50">
                  {([
                    { value: '9:16' as AspectRatio, label: 'Portrait', Icon: RectangleVertical },
                    { value: '16:9' as AspectRatio, label: 'Landscape', Icon: RectangleHorizontal },
                    { value: '1:1' as AspectRatio, label: 'Square', Icon: Square },
                  ]).map(({ value, label, Icon }) => (
                    <button key={value} onClick={() => setConfig(c => ({ ...c, aspectRatio: value }))}
                      className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 text-[10.5px] font-medium rounded-md transition-all duration-150 ${
                        config.aspectRatio === value
                          ? 'bg-foreground text-background shadow-sm'
                          : 'text-muted-foreground hover:text-foreground/70'
                      }`}>
                      <Icon className="h-3 w-3" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <MicroLabel>Number of scenes</MicroLabel>
                  <span className="text-xs font-semibold text-foreground bg-muted border border-border rounded-md px-2 py-0.5 min-w-[28px] text-center">
                    {config.pathASceneCount ?? 6}
                  </span>
                </div>
                <input
                  type="range" min={4} max={12} step={1}
                  value={config.pathASceneCount ?? 6}
                  onChange={(e) => setConfig(c => ({ ...c, pathASceneCount: parseInt(e.target.value) }))}
                  className="w-full accent-foreground cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground mt-1.5">
                  <span>4</span><span>8</span><span>12</span>
                </div>
              </div>
            </CollapsibleSection>

            {/* ── Advanced Settings ── */}
            <CollapsibleSection title="Advanced settings" subtle open={openSection === 'adv'} onToggle={() => setOpenSection(openSection === 'adv' ? '' : 'adv')}>
              <div>
                <MicroLabel>Camera movement</MicroLabel>
                <SelectField value={config.cameraMovement} onChange={(v) => setConfig(c => ({ ...c, cameraMovement: v }))} options={CAMERA_MOVEMENTS} />
              </div>

              <div>
                <MicroLabel>Environment reference</MicroLabel>
                <p className="text-[10.5px] text-muted-foreground/50 mb-2 font-light">Optional — upload a location photo to anchor the visual setting.</p>
                {setEnvironmentImage && (
                  <SavedEnvironments onSelect={setEnvironmentImage} onSelectMultiple={setEnvironmentImages} onSelectLabel={setEnvironmentLabel} />
                )}
              </div>

              <div>
                <MicroLabel>Outfit</MicroLabel>
                <SelectField value={config.outfitType} onChange={(v) => setConfig(c => ({ ...c, outfitType: v }))} options={OUTFIT_TYPES} />
                {config.outfitType === 'Custom Outfit' && (
                  <input type="text" placeholder="Describe outfit..." value={config.outfitDetails}
                    onChange={(e) => setConfig(c => ({ ...c, outfitDetails: e.target.value }))}
                    className="w-full mt-2 bg-transparent border border-border/50 rounded-lg px-3 py-2.5 text-xs text-foreground outline-none focus:border-foreground/30 transition-colors placeholder:text-muted-foreground/40" />
                )}
                <input type="text" placeholder="Additional details (optional)" value={config.outfitAdditionalInfo}
                  onChange={(e) => setConfig(c => ({ ...c, outfitAdditionalInfo: e.target.value }))}
                  className="w-full mt-2 bg-transparent border border-border/50 rounded-lg px-3 py-2.5 text-xs text-foreground outline-none focus:border-foreground/30 transition-colors placeholder:text-muted-foreground/40" />
              </div>

              {config.vlogCategory === 'Get Ready With Me' && config.creationMode === 'vlog' && (
                <div>
                  <MicroLabel>Final look (reveal outfit)</MicroLabel>
                  <SelectField value={config.finalLookType} onChange={(v) => setConfig(c => ({ ...c, finalLookType: v }))} options={OUTFIT_TYPES} />
                  {config.finalLookType === 'Custom Outfit' && (
                    <input type="text" placeholder="Describe final look outfit..." value={config.finalLook}
                      onChange={(e) => setConfig(c => ({ ...c, finalLook: e.target.value }))}
                      className="w-full mt-2 bg-transparent border border-border/50 rounded-lg px-3 py-2.5 text-xs text-foreground outline-none focus:border-foreground/30 transition-colors placeholder:text-muted-foreground/40" />
                  )}
                  <input type="text" placeholder="Additional final look details (optional)" value={config.finalLookAdditionalInfo}
                    onChange={(e) => setConfig(c => ({ ...c, finalLookAdditionalInfo: e.target.value }))}
                    className="w-full mt-2 bg-transparent border border-border/50 rounded-lg px-3 py-2.5 text-xs text-foreground outline-none focus:border-foreground/30 transition-colors placeholder:text-muted-foreground/40" />
                </div>
              )}

              <div>
                <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-muted-foreground pb-3 border-b border-border">Skin / Nails / Makeup / Hairstyle</p>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                <div>
                  <MicroLabel>Makeup</MicroLabel>
                  <SelectField value={config.makeup} onChange={(v) => setConfig(c => ({ ...c, makeup: v }))} options={MAKEUP_STYLES} />
                </div>
                <div>
                  <MicroLabel>Hairstyle</MicroLabel>
                  <SelectField value={config.hairstyle} onChange={(v) => setConfig(c => ({ ...c, hairstyle: v }))} options={[]} groups={HAIRSTYLE_GROUPS} />
                </div>
                <div>
                  <MicroLabel>Skin complexion</MicroLabel>
                  <SelectField value={config.skinComplexion} onChange={(v) => setConfig(c => ({ ...c, skinComplexion: v }))} options={COMPLEXION_OPTIONS} />
                </div>
                <div>
                  <MicroLabel>Skin undertone</MicroLabel>
                  <SelectField value={config.skinUndertone} onChange={(v) => setConfig(c => ({ ...c, skinUndertone: v }))} options={UNDERTONE_OPTIONS} />
                </div>
                <div>
                  <MicroLabel>Nails</MicroLabel>
                  <SelectField value={config.nailStyle} onChange={(v) => setConfig(c => ({ ...c, nailStyle: v }))} options={NAIL_STYLES} />
                  {config.nailStyle === 'Custom' && (
                    <input type="text" placeholder="Custom nails..." value={config.customNailStyle}
                      onChange={(e) => setConfig(c => ({ ...c, customNailStyle: e.target.value }))}
                      className="w-full mt-2 bg-transparent border border-border/50 rounded-lg px-3 py-2.5 text-xs text-foreground outline-none focus:border-foreground/30 transition-colors placeholder:text-muted-foreground/40" />
                  )}
                </div>
              </div>
              {(config.makeup === 'Custom' || config.hairstyle.includes('Custom')) && (
                <div className="space-y-2">
                  {config.makeup === 'Custom' && (
                    <input type="text" placeholder="Custom makeup..." value={config.customMakeup}
                      onChange={(e) => setConfig(c => ({ ...c, customMakeup: e.target.value }))}
                      className="w-full bg-transparent border border-border/50 rounded-lg px-3 py-2.5 text-xs text-foreground outline-none focus:border-foreground/30 transition-colors placeholder:text-muted-foreground/40" />
                  )}
                  {config.hairstyle.includes('Custom') && (
                    <input type="text" placeholder="Custom hairstyle..." value={config.customHairstyle}
                      onChange={(e) => setConfig(c => ({ ...c, customHairstyle: e.target.value }))}
                      className="w-full bg-transparent border border-border/50 rounded-lg px-3 py-2.5 text-xs text-foreground outline-none focus:border-foreground/30 transition-colors placeholder:text-muted-foreground/40" />
                  )}
                </div>
              )}

              <div className="pt-1 border-t border-border/30">
                <SavedLooks config={config} setConfig={setConfig} />
              </div>
            </CollapsibleSection>

          </div>

          {onGenerateStoryboard && (
            <div className="px-6 py-5 border-t border-border/30">
              <button
                onClick={() => { onGenerateStoryboard(); setSheetOpen(false); }}
                disabled={!showSafetyTerms || !referenceImage || isGeneratingStoryboard}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-medium rounded-2xl bg-foreground text-background hover:bg-foreground/90 active:scale-[0.99] transition-all duration-150 disabled:opacity-30 disabled:pointer-events-none tracking-tight"
              >
                {isGeneratingStoryboard
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin opacity-60" /> Generating...</>
                  : <><Sparkles className="h-3.5 w-3.5 opacity-70" /> {hasStoryboard ? 'Regenerate' : 'Generate Storyboard'}</>
                }
              </button>
              <p className="text-[10px] text-center text-muted-foreground/40 mt-2.5 font-light">
                {hasStoryboard ? 'This will replace your current storyboard.' : 'Generation takes 1–2 minutes.'}
              </p>
            </div>
          )}

        </SheetContent>
      </Sheet>

      {onProjects && (
        <>
          {hasStoryboard && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 border border-border rounded-lg transition-colors">
                    <Sparkles className="h-3.5 w-3.5" /><span>Generate</span><ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={onGenerateAllImages}>
                    <ImageIcon className="h-3.5 w-3.5 mr-2" /> Generate All Images
                    <span className="ml-auto text-[9px] text-muted-foreground">1–3 min each</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onGenerateAllVideos}>
                    <Video className="h-3.5 w-3.5 mr-2" /> Generate All Videos
                    <span className="ml-auto text-[9px] text-muted-foreground">3–5 min each</span>
                  </DropdownMenuItem>
                  {videoCount >= 2 && !anyGeneratingVideo && (
                    <>
                      <DropdownMenuItem onClick={onCreateReel} disabled={isMergingVideos}>
                        <Film className="h-3.5 w-3.5 mr-2" /> {isMergingVideos ? 'Creating Reel...' : mergedReelUrl ? 'Re-generate Reel' : 'Generate Reel'}
                      </DropdownMenuItem>
                      {mergedReelUrl && (
                        <>
                          <DropdownMenuItem onClick={onViewReel}><Eye className="h-3.5 w-3.5 mr-2" /> View Reel</DropdownMenuItem>
                          <DropdownMenuItem onClick={onDownloadReel}><Download className="h-3.5 w-3.5 mr-2" /> Download Reel</DropdownMenuItem>
                        </>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted border border-border rounded-lg transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={onDownloadScript}><FileText className="h-3.5 w-3.5 mr-2" /> Download Script</DropdownMenuItem>
                  <DropdownMenuItem onClick={onDownloadAll}><Download className="h-3.5 w-3.5 mr-2" /> Download All</DropdownMenuItem>
                  <DropdownMenuItem onClick={onHelp}><HelpCircle className="h-3.5 w-3.5 mr-2" /> Help</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <div className="ml-auto">
            <div className="flex items-center">
              <button onClick={onProjects}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors ${hasStoryboard && onSave ? 'rounded-l-lg border-r border-background/20' : 'rounded-lg'}`}>
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
