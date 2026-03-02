import React, { useState, useEffect, useRef } from 'react';
import { AppConfig, VlogStep, VlogStoryboard, GeneratedMedia, QueueItem } from '@/components/ai-studio/types';
import { INITIAL_CONFIG, DEFAULT_MEDIA, getUserFriendlyErrorMessage } from '@/components/ai-studio/constants';
import StudioStoryboard from '@/components/ai-studio/StudioStoryboard';
import StoryboardToolbar from '@/components/ai-studio/StoryboardToolbar';
import StudioHelp from '@/components/ai-studio/StudioHelp';
import ImageLightbox from '@/components/ai-studio/ImageLightbox';
import SavedProjectsGrid from '@/components/ai-studio/SavedProjectsGrid';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, HelpCircle, RotateCcw, Save, FileText, Download, FolderOpen, ImageIcon, Video, Sparkles, Check, ArrowRight, X, ShieldCheck } from 'lucide-react';
import { VLOG_CATEGORIES, TOPIC_PLACEHOLDERS } from '@/components/ai-studio/constants';
import { toast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import { ProjectLayout } from '@/components/layout/ProjectLayout';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const AIStudio = () => {
  const [config, setConfig] = useState<AppConfig>({ ...INITIAL_CONFIG });
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [environmentImage, setEnvironmentImage] = useState<string | null>(null);
  const [environmentImages, setEnvironmentImages] = useState<string[]>([]);
  const [previewCharacterImage, setPreviewCharacterImage] = useState<string | null>(null);
  const [previewFinalLookImage, setPreviewFinalLookImage] = useState<string | null>(null);
  const [isPreviewGenerating, setIsPreviewGenerating] = useState(false);
  const [previewStep, setPreviewStep] = useState<string | null>(null);
  const [storyboard, setStoryboard] = useState<VlogStoryboard | null>(null);
  const [generatedMedia, setGeneratedMedia] = useState<Record<number, GeneratedMedia>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
  const [showSafetyTerms, setShowSafetyTerms] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);
  const [enlargedImageIndex, setEnlargedImageIndex] = useState<number | null>(null);
  const [previewLightbox, setPreviewLightbox] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const processingRef = useRef(false);

  // Save/load project state
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [showProjectsDialog, setShowProjectsDialog] = useState(false);

  // Refs to avoid stale closures in the queue processor
  const previewCharacterRef = useRef(previewCharacterImage);
  const previewFinalLookRef = useRef(previewFinalLookImage);
  const referenceImageRef = useRef(referenceImage);
  const referenceImagesRef = useRef(referenceImages);
  const environmentImageRef = useRef(environmentImage);
  const environmentImagesRef = useRef(environmentImages);
  const generatedMediaRef = useRef(generatedMedia);
  const storyboardRef = useRef(storyboard);

  // Keep refs synced with state
  useEffect(() => { previewCharacterRef.current = previewCharacterImage; }, [previewCharacterImage]);
  useEffect(() => { previewFinalLookRef.current = previewFinalLookImage; }, [previewFinalLookImage]);
  useEffect(() => { referenceImageRef.current = referenceImage; }, [referenceImage]);
  useEffect(() => { referenceImagesRef.current = referenceImages; }, [referenceImages]);
  useEffect(() => { environmentImageRef.current = environmentImage; }, [environmentImage]);
  useEffect(() => { environmentImagesRef.current = environmentImages; }, [environmentImages]);
  useEffect(() => { generatedMediaRef.current = generatedMedia; }, [generatedMedia]);
  useEffect(() => { storyboardRef.current = storyboard; }, [storyboard]);

  // Queue processor
  useEffect(() => {
    const processQueue = async () => {
      if (processingRef.current || queue.length === 0) return;
      processingRef.current = true;
      const currentBatch = queue;
      setQueue([]);
      setIsProcessing(true);

      setGeneratedMedia(prev => {
        const next = { ...prev };
        currentBatch.forEach(task => {
          next[task.index] = {
            ...prev[task.index],
            isGeneratingImage: task.type === 'generate',
            isUpscaling: task.type === 'upscale',
            isGeneratingVideo: task.type === 'generate_video',
            ...(task.type === 'generate_video' ? { videoError: undefined } : { error: undefined })
          };
        });
        return next;
      });

      try {
        // lastGeneratedUrl removed — each scene now anchors to canonical preview
        for (const task of currentBatch) {
          try {
            if (task.type === 'generate' || task.type === 'upscale') {
              const currentGeneratedMedia = generatedMediaRef.current;
              const currentPreviewCharacter = previewCharacterRef.current;
              const currentPreviewFinalLook = previewFinalLookRef.current;
              const currentReferenceImage = referenceImageRef.current;
              const currentReferenceImages = referenceImagesRef.current;
              const currentEnvironmentImage = environmentImageRef.current;
              const currentEnvironmentImages = environmentImagesRef.current;
              const currentStoryboard = storyboardRef.current;

              const lockedRefs: { type: string; base64: string }[] = [];
              Object.values(currentGeneratedMedia).forEach((m) => {
                if (m.imageUrl) {
                  const base64 = m.imageUrl.includes(',') ? m.imageUrl.split(',')[1] : m.imageUrl;
                  if (m.lockedCharacter) lockedRefs.push({ type: 'character', base64 });
                  if (m.lockedOutfit) lockedRefs.push({ type: 'outfit', base64 });
                  if (m.lockedEnvironment) lockedRefs.push({ type: 'environment', base64 });
                }
              });

              // Always anchor to canonical character preview, NOT previous scene output
              // This prevents identity drift across scenes
              const activePreviewForAnchor = task.step.is_final_look && currentPreviewFinalLook
                ? currentPreviewFinalLook : currentPreviewCharacter;
              const anchorImageUrl: string | undefined = activePreviewForAnchor || undefined;

              const activePreview = task.step.is_final_look && currentPreviewFinalLook
                ? currentPreviewFinalLook : currentPreviewCharacter;

              let previousScenePrompt: string | undefined;
              let nextScenePrompt: string | undefined;
              if (currentStoryboard) {
                if (task.index > 0) previousScenePrompt = currentStoryboard.steps[task.index - 1]?.image_prompt;
                if (task.index < currentStoryboard.steps.length - 1) nextScenePrompt = currentStoryboard.steps[task.index + 1]?.image_prompt;
              }

              console.log(`[Identity Gate] Scene ${task.index + 1}: activePreview=${activePreview ? 'SET (' + activePreview.substring(0, 50) + '...)' : 'NULL'}`);

              const { data, error } = await supabase.functions.invoke('generate-scene-image', {
                body: {
                  prompt: task.step.image_prompt,
                  referenceImage: activePreview ? undefined : currentReferenceImage,
                  referenceImages: activePreview ? undefined : (currentReferenceImages.length > 0 ? currentReferenceImages : undefined),
                  productImage,
                  environmentImage: currentEnvironmentImage,
                  environmentImages: currentEnvironmentImages.length > 0 ? currentEnvironmentImages : undefined,
                  previewCharacter: activePreview,
                  config: task.config,
                  lockedRefs,
                  isFinalLook: task.step.is_final_look,
                  isUpscale: task.type === 'upscale',
                  baseImageUrl: task.baseImageUrl,
                  anchorImageUrl,
                  previousScenePrompt,
                  nextScenePrompt,
                  sceneNumber: task.index + 1,
                  totalScenes: currentStoryboard?.steps.length
                }
              });

              if (error) throw error;
              if (data?.error) throw new Error(data.error);
              // No longer chain lastGeneratedUrl — anchoring to preview instead

              setGeneratedMedia(prev => ({
                ...prev,
                [task.index]: { ...prev[task.index], imageUrl: data.imageUrl, isGeneratingImage: false, isUpscaling: false, error: undefined }
              }));
            } else if (task.type === 'generate_video') {
              throw new Error("Video generation coming soon");
            }
          } catch (error: any) {
            setGeneratedMedia(prev => ({
              ...prev,
              [task.index]: {
                ...prev[task.index],
                isGeneratingImage: false,
                isUpscaling: false,
                isGeneratingVideo: false,
                ...(task.type === 'generate_video' ? { videoError: getUserFriendlyErrorMessage(error) } : { error: getUserFriendlyErrorMessage(error) })
              }
            }));
          }
        }
      } finally {
        processingRef.current = false;
        setIsProcessing(false);
      }
    };
    processQueue();
  }, [queue]);

  const addToQueue = (items: QueueItem[]) => setQueue(prev => [...prev, ...items]);

  const clearQueue = () => {
    setQueue([]);
    processingRef.current = false;
    setIsProcessing(false);
    setGeneratedMedia(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        const k = parseInt(key);
        if (next[k].isGeneratingImage || next[k].isUpscaling) {
          next[k] = { ...next[k], isGeneratingImage: false, isUpscaling: false };
        }
      });
      return next;
    });
  };

  const handleGenerateTopicIdeas = async () => {
    if (!config.vlogCategory) return;
    setIsGeneratingTopic(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-storyboard', {
        body: { action: 'brainstorm', config }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setConfig(prev => ({ ...prev, vlogTopic: data.topic }));
    } catch (e: any) {
      toast({ title: "Error", description: getUserFriendlyErrorMessage(e), variant: "destructive" });
    } finally {
      setIsGeneratingTopic(false);
    }
  };

  const handleGeneratePreview = async () => {
    if (!referenceImage) { toast({ title: "Upload Required", description: "Please upload a reference avatar first.", variant: "destructive" }); return; }
    if (!showSafetyTerms) { toast({ title: "Terms Required", description: "Please accept the safety terms in Settings.", variant: "destructive" }); return; }
    setIsPreviewGenerating(true);
    try {
      const previewBody = {
        referenceImage,
        referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
        environmentImage,
        environmentImages: environmentImages.length > 0 ? environmentImages : undefined,
        config,
        isFinalLook: false
      };
      const isGRWM = config.vlogCategory === 'Get Ready With Me' && config.creationMode === 'vlog';

      if (isGRWM) {
        setPreviewStep('Generating Default Look (1/2)...');
        const defaultResult = await supabase.functions.invoke('generate-character-preview', { body: previewBody });
        if (defaultResult.error) throw defaultResult.error;
        if (defaultResult.data?.error) throw new Error(defaultResult.data.error);
        const defaultLookUrl = defaultResult.data.imageUrl;
        setPreviewCharacterImage(defaultLookUrl);

        setPreviewStep('Generating Final Look (2/2)...');
        const finalResult = await supabase.functions.invoke('generate-character-preview', { body: { ...previewBody, isFinalLook: true, identityAnchorUrl: defaultLookUrl } });
        if (finalResult.error) throw finalResult.error;
        if (finalResult.data?.error) throw new Error(finalResult.data.error);
        setPreviewFinalLookImage(finalResult.data.imageUrl);
      } else {
        setPreviewStep('Generating Preview...');
        const result = await supabase.functions.invoke('generate-character-preview', { body: previewBody });
        if (result.error) throw result.error;
        if (result.data?.error) throw new Error(result.data.error);
        setPreviewCharacterImage(result.data.imageUrl);
      }
    } catch (e: any) {
      toast({ title: "Error", description: getUserFriendlyErrorMessage(e), variant: "destructive" });
    } finally {
      setIsPreviewGenerating(false);
      setPreviewStep(null);
    }
  };

  const handleGenerateStoryboard = async () => {
    if (!referenceImage) return;
    if (!previewCharacterImage) {
      toast({ title: "Character Preview Required", description: "Please generate and review the character preview first.", variant: "destructive" });
      return;
    }
    setIsGeneratingStoryboard(true);
    try {
      const { data: safetyData } = await supabase.functions.invoke('generate-storyboard', {
        body: { action: 'validate_safety', referenceImage }
      });
      if (safetyData && !safetyData.safe) {
        toast({ title: "Safety Check Failed", description: safetyData.error || "Content violation detected.", variant: "destructive" });
        setIsGeneratingStoryboard(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-storyboard', {
        body: { action: 'generate', referenceImage, productImage, environmentImage, environmentImages: environmentImages.length > 0 ? environmentImages : undefined, config }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const board = data.storyboard as VlogStoryboard;
      setStoryboard(board);

      const initialMedia: Record<number, GeneratedMedia> = {};
      board.steps.forEach((_, idx) => { initialMedia[idx] = { ...DEFAULT_MEDIA }; });
      setGeneratedMedia(initialMedia);

      const tasks: QueueItem[] = board.steps.map((step, index) => ({
        id: Math.random().toString(36).slice(2, 9),
        type: 'generate',
        index,
        step,
        config: { ...config }
      }));
      addToQueue(tasks);
    } catch (e: any) {
      toast({ title: "Error", description: getUserFriendlyErrorMessage(e), variant: "destructive" });
    } finally {
      setIsGeneratingStoryboard(false);
    }
  };

  const handleToggleSelect = (index: number) => {
    setGeneratedMedia(prev => ({ ...prev, [index]: { ...prev[index], isSelected: !prev[index]?.isSelected } }));
  };

  const handleToggleLock = (index: number, type: 'character' | 'outfit' | 'environment') => {
    setGeneratedMedia(prev => {
      const next = { ...prev };
      const key = type === 'character' ? 'lockedCharacter' : type === 'outfit' ? 'lockedOutfit' : 'lockedEnvironment';
      const currentIsLocked = next[index]?.[key];
      if (!currentIsLocked) {
        Object.keys(next).forEach(k => {
          const i = parseInt(k);
          next[i] = { ...next[i], [key]: false };
        });
      }
      next[index] = { ...next[index], [key]: !currentIsLocked };
      return next;
    });
  };

  const handleUpdatePrompt = (index: number, newPrompt: string) => {
    if (!storyboard) return;
    const updatedSteps = [...storyboard.steps];
    updatedSteps[index] = { ...updatedSteps[index], image_prompt: newPrompt };
    setStoryboard({ ...storyboard, steps: updatedSteps });
    addToQueue([{ id: Math.random().toString(), type: 'generate', index, step: updatedSteps[index], config: { ...config } }]);
  };

  const handleUpdateVideoPrompt = (index: number, newPrompt: string) => {
    if (!storyboard) return;
    const updatedSteps = [...storyboard.steps];
    updatedSteps[index] = { ...updatedSteps[index], video_prompt: newPrompt };
    setStoryboard({ ...storyboard, steps: updatedSteps });
  };

  const getSelectionCount = () => Object.values(generatedMedia).filter(m => m.isSelected).length;

  const handleBatchAction = (type: 'regenerate' | 'upscale' | 'video' | 'delete') => {
    if (!storyboard) return;
    const selectedIndices = Object.keys(generatedMedia).map(k => parseInt(k)).filter(i => generatedMedia[i]?.isSelected);
    const clearedMedia = { ...generatedMedia };
    selectedIndices.forEach(i => { if (clearedMedia[i]) clearedMedia[i] = { ...clearedMedia[i], isSelected: false }; });
    setGeneratedMedia(clearedMedia);

    if (type === 'delete') {
      setGeneratedMedia(prev => {
        const next = { ...prev };
        selectedIndices.forEach(i => { next[i] = { ...next[i], imageUrl: undefined, isSelected: false, lockedCharacter: false, lockedOutfit: false, lockedEnvironment: false, error: undefined }; });
        return next;
      });
      return;
    }

    const tasks: QueueItem[] = selectedIndices
      .filter(i => type !== 'upscale' && type !== 'video' || generatedMedia[i]?.imageUrl)
      .map(index => ({
        id: Math.random().toString(36).slice(2, 9),
        type: type === 'regenerate' ? 'generate' : type === 'upscale' ? 'upscale' : 'generate_video',
        index,
        step: storyboard.steps[index],
        config: { ...config },
        baseImageUrl: generatedMedia[index]?.imageUrl
      }));
    addToQueue(tasks);
  };

  const generateScriptContent = () => {
    if (!storyboard) return "";
    let content = `PROJECT: ${config.creationMode === 'vlog' ? config.vlogCategory : 'UGC'}\nTOPIC: ${config.creationMode === 'vlog' ? config.vlogTopic : config.ugcPrompt}\nDATE: ${new Date().toLocaleDateString()}\n\n`;
    storyboard.steps.forEach(step => {
      content += `SCENE ${step.step_number}: ${step.step_name}\n[VISUAL] ${step.a_roll}\n[SCRIPT] ${step.script}\n[CAMERA] ${step.camera_direction}\n[IMAGE PROMPT] ${step.image_prompt}\n[VIDEO PROMPT] ${step.video_prompt}\n\n`;
    });
    return content;
  };

  const handleDownloadScript = () => {
    const content = generateScriptContent();
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `script-${config.vlogCategory.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    let count = 0;
    for (const [index, media] of Object.entries(generatedMedia)) {
      const m = media as GeneratedMedia;
      if (m.imageUrl && !m.imageUrl.startsWith('data:')) {
        try {
          const resp = await fetch(m.imageUrl);
          const blob = await resp.blob();
          zip.file(`scene-${parseInt(index) + 1}.png`, blob);
          count++;
        } catch { /* skip */ }
      } else if (m.imageUrl?.startsWith('data:')) {
        const imgData = m.imageUrl.split(',')[1];
        zip.file(`scene-${parseInt(index) + 1}.jpg`, imgData, { base64: true });
        count++;
      }
    }
    const scriptText = generateScriptContent();
    if (scriptText) zip.file("full_script.txt", scriptText);
    if (count === 0 && !storyboard) { toast({ title: "Nothing to download" }); return; }
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `ai-studio-assets.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmNewProject = () => {
    setConfig({ ...INITIAL_CONFIG });
    setReferenceImage(null);
    setReferenceImages([]);
    setProductImage(null);
    setEnvironmentImage(null);
    setEnvironmentImages([]);
    setPreviewCharacterImage(null);
    setPreviewFinalLookImage(null);
    setStoryboard(null);
    setGeneratedMedia({});
    setQueue([]);
    setEnlargedImageIndex(null);
    setIsProcessing(false);
    setShowSafetyTerms(false);
    setCurrentProjectId(null);
    setCurrentProjectName(undefined);
    setShowResetConfirmation(false);
  };

  const handleSaveProject = async (name: string) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const persistMedia: Record<string, any> = {};
      Object.entries(generatedMedia).forEach(([idx, m]) => {
        persistMedia[idx] = {
          imageUrl: m.imageUrl, videoUrl: m.videoUrl,
          lockedCharacter: m.lockedCharacter, lockedOutfit: m.lockedOutfit, lockedEnvironment: m.lockedEnvironment,
        };
      });

      const row = {
        user_id: user.id, name, mode: config.creationMode,
        config: config as any, storyboard: storyboard as any,
        generated_media: persistMedia as any,
        character_preview_url: previewCharacterImage,
        final_look_preview_url: previewFinalLookImage,
        status: 'saved', updated_at: new Date().toISOString(),
      };

      if (currentProjectId) {
        const { error } = await supabase.from('ai_studio_projects').update(row).eq('id', currentProjectId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('ai_studio_projects').insert(row).select('id').single();
        if (error) throw error;
        setCurrentProjectId(data.id);
      }
      setCurrentProjectName(name);
      toast({ title: "Project saved", description: `"${name}" has been saved.` });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadProject = async (projectId: string) => {
    try {
      const { data, error } = await supabase.from('ai_studio_projects').select('*').eq('id', projectId).single();
      if (error) throw error;

      const loadedConfig = data.config as unknown as AppConfig;
      const loadedStoryboard = data.storyboard as unknown as VlogStoryboard;
      const loadedMedia = (data.generated_media || {}) as Record<string, any>;

      setConfig(loadedConfig);
      setStoryboard(loadedStoryboard);
      setPreviewCharacterImage(data.character_preview_url || null);
      setPreviewFinalLookImage(data.final_look_preview_url || null);
      setCurrentProjectId(data.id);
      setCurrentProjectName(data.name);
      setShowSafetyTerms(true);

      const restoredMedia: Record<number, GeneratedMedia> = {};
      if (loadedStoryboard?.steps) {
        loadedStoryboard.steps.forEach((_, idx) => {
          const saved = loadedMedia[String(idx)] || {};
          restoredMedia[idx] = {
            imageUrl: saved.imageUrl, videoUrl: saved.videoUrl,
            error: undefined, videoError: undefined,
            isGeneratingImage: false, isGeneratingVideo: false, isUpscaling: false,
            lockedCharacter: saved.lockedCharacter || false, lockedOutfit: saved.lockedOutfit || false,
            lockedEnvironment: saved.lockedEnvironment || false, isSelected: false,
          };
        });
      }
      setGeneratedMedia(restoredMedia);
      setShowProjectsDialog(false);
      toast({ title: "Project loaded", description: `"${data.name}" restored.` });
    } catch (e: any) {
      toast({ title: "Load failed", description: e.message, variant: "destructive" });
    }
  };

  const handleSaveClick = () => {
    if (currentProjectName) {
      handleSaveProject(currentProjectName);
    } else {
      setProjectName('');
      setShowSaveDialog(true);
    }
  };

  const handleSaveDialogConfirm = async () => {
    const name = projectName.trim() || 'Untitled Project';
    await handleSaveProject(name);
    setShowSaveDialog(false);
  };

  const queueStatusText = () => {
    if (!storyboard) return "";
    const total = storyboard.steps.length;
    const completed = Object.values(generatedMedia).filter(m => !!m.imageUrl).length;
    return completed === total && queue.length === 0 && !isProcessing
      ? `All scenes generated: ${completed}/${total}`
      : `Generating scenes: ${completed}/${total}`;
  };

  const imagesGenerated = storyboard ? Object.values(generatedMedia).filter(m => !!m.imageUrl).length : 0;
  const totalScenes = storyboard?.steps.length || 0;

  return (
    <ProjectLayout>
      <div className="min-h-screen pb-8 relative">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border py-3 px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent tracking-tight">
              AI Studio
            </h1>
            {(queue.length > 0 || isProcessing) && (
              <div className="flex items-center gap-3 px-3 py-1 bg-muted rounded-full border border-border">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground font-mono">{queueStatusText()}</span>
                <button onClick={clearQueue} className="text-xs text-destructive hover:text-destructive/80 underline uppercase font-bold ml-2">Cancel</button>
              </div>
            )}
            {storyboard && (
              <span className="text-xs text-muted-foreground">{imagesGenerated}/{totalScenes} images</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowProjectsDialog(true)}>
              <FolderOpen className="h-4 w-4 mr-1" /> Projects
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveClick} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
              {currentProjectName ? 'Save' : 'Save'}
            </Button>
            {storyboard && (
              <>
                <Button variant="outline" size="sm" onClick={handleDownloadScript}>
                  <FileText className="h-3.5 w-3.5 mr-1" /> Script
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadAll}>
                  <Download className="h-3.5 w-3.5 mr-1" /> All
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={() => setShowHelp(true)}><HelpCircle className="h-5 w-5" /></Button>
            <Button variant="outline" size="sm" onClick={() => setShowResetConfirmation(true)}>
              <RotateCcw className="h-4 w-4 mr-1" /> New
            </Button>
          </div>
        </header>

        <StudioHelp open={showHelp} onClose={() => setShowHelp(false)} />

        {/* Reset Confirmation */}
        {showResetConfirmation && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-foreground mb-2">Start New Project?</h3>
              <p className="text-muted-foreground mb-6">All current progress and generated images will be lost.</p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setShowResetConfirmation(false)}>Cancel</Button>
                <Button variant="destructive" onClick={confirmNewProject}>Start New</Button>
              </div>
            </div>
          </div>
        )}

        {/* Save Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Project</DialogTitle>
              <DialogDescription>Give your storyboard a name so you can find it later.</DialogDescription>
            </DialogHeader>
            <Input
              placeholder="e.g. Morning Routine GRWM"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveDialogConfirm(); }}
              autoFocus
            />
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveDialogConfirm} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Saved Projects Dialog */}
        <Dialog open={showProjectsDialog} onOpenChange={setShowProjectsDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Saved Projects</DialogTitle>
              <DialogDescription>Load a previously saved project.</DialogDescription>
            </DialogHeader>
            <SavedProjectsGrid onLoad={handleLoadProject} />
          </DialogContent>
        </Dialog>

        <main className="max-w-7xl mx-auto px-4 py-4">
          {/* Toolbar */}
          <StoryboardToolbar
            config={config}
            setConfig={setConfig}
            isGeneratingTopic={isGeneratingTopic}
            onGenerateTopicIdeas={handleGenerateTopicIdeas}
            referenceImage={referenceImage}
            setReferenceImage={setReferenceImage}
            setReferenceImages={setReferenceImages}
            environmentImage={environmentImage}
            setEnvironmentImage={setEnvironmentImage}
            setEnvironmentImages={setEnvironmentImages}
            productImage={productImage}
            setProductImage={setProductImage}
            isProcessing={isProcessing}
          />

          {/* Safety Terms Banner (shown once, before first generation) */}
          {!showSafetyTerms && (
            <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-start gap-3 my-3">
              <ShieldCheck className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-foreground leading-relaxed">
                  I confirm that I own the rights to these images, no children are shown, and images are not explicit.
                </p>
              </div>
              <button
                onClick={() => setShowSafetyTerms(true)}
                className="px-3 py-1.5 text-xs font-bold bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors flex-shrink-0"
              >
                I Agree
              </button>
            </div>
          )}

          {/* Inline Vlog Topic / Category (primary creative decisions) */}
          {config.creationMode === 'vlog' && !storyboard && (
            <div className="bg-card border border-border rounded-xl p-4 my-3 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1.5">Vlog Category</label>
                  <select
                    value={config.vlogCategory}
                    onChange={(e) => setConfig(c => ({ ...c, vlogCategory: e.target.value }))}
                    className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  >
                    {VLOG_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground">Vlog Topic</label>
                  {handleGenerateTopicIdeas && (
                    <button onClick={handleGenerateTopicIdeas} disabled={isGeneratingTopic}
                      className="text-[10px] text-primary hover:text-foreground uppercase font-bold flex items-center gap-1 disabled:opacity-50">
                      {isGeneratingTopic ? <span className="animate-pulse">Thinking...</span> : <><Sparkles className="h-3 w-3" /> Brainstorm</>}
                    </button>
                  )}
                </div>
                <textarea
                  placeholder={TOPIC_PLACEHOLDERS[config.vlogCategory] || "Describe your video concept..."}
                  value={config.vlogTopic}
                  onChange={(e) => setConfig(c => ({ ...c, vlogTopic: e.target.value }))}
                  className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none min-h-[60px] focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Inline Character Preview Bar */}
          <div className="my-4">
            {!previewCharacterImage ? (
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  {!referenceImage
                    ? "Upload a character photo in the Character tab to get started."
                    : !showSafetyTerms
                    ? "Accept the safety terms above to continue."
                    : "Generate a character preview to start building your storyboard."}
                </p>
                <Button
                  onClick={handleGeneratePreview}
                  disabled={!showSafetyTerms || !referenceImage || isPreviewGenerating}
                >
                  {isPreviewGenerating ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {previewStep || 'Generating Preview...'}</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" /> Generate Character Preview</>
                  )}
                </Button>
              </div>
           ) : (
              <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="flex gap-3">
                  <div className="relative cursor-pointer" onClick={() => setPreviewLightbox(previewCharacterImage)}>
                    <img src={previewCharacterImage} alt="Character Preview" className="w-16 h-24 rounded-lg object-cover border border-border hover:opacity-80 transition-opacity" />
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  </div>
                  {previewFinalLookImage && (
                    <div className="relative cursor-pointer" onClick={() => setPreviewLightbox(previewFinalLookImage)}>
                      <img src={previewFinalLookImage} alt="Final Look" className="w-16 h-24 rounded-lg object-cover border border-accent/30 hover:opacity-80 transition-opacity" />
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[7px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap">
                        Final Look
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Character Ready</p>
                  <p className="text-xs text-muted-foreground">{config.outfitType} · {config.hairstyle} · {config.makeup}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleGeneratePreview} disabled={isPreviewGenerating}>
                  {isPreviewGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RotateCcw className="h-3.5 w-3.5 mr-1" />}
                  Regenerate
                </Button>
              </div>
            )}
          </div>

          {/* Generate Storyboard - Inline CTA (replaces fixed bottom bar) */}
          {!storyboard && previewCharacterImage && (
            <div className="flex justify-center my-4">
              <Button
                onClick={handleGenerateStoryboard}
                disabled={!previewCharacterImage || isGeneratingStoryboard}
                className="px-8"
                size="lg"
              >
                {isGeneratingStoryboard ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating Storyboard...</>
                ) : (
                  <><ArrowRight className="h-4 w-4 mr-2" /> Generate Storyboard</>
                )}
              </Button>
            </div>
          )}

          {/* Scene Workspace */}
          {storyboard ? (
            <>
              {/* Contextual batch actions header */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-foreground">Storyboard · {storyboard.steps.length} scenes</h2>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    const tasks: QueueItem[] = storyboard.steps
                      .map((s, idx) => ({ id: Math.random().toString(), type: 'generate' as const, index: idx, step: s, config: { ...config } }))
                      .filter(t => !generatedMedia[t.index]?.imageUrl);
                    if (tasks.length > 0) addToQueue(tasks);
                  }}>
                    <ImageIcon className="h-3.5 w-3.5 mr-1.5" /> Generate All Images
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    const tasks: QueueItem[] = storyboard.steps
                      .map((s, idx) => ({ id: Math.random().toString(), type: 'generate_video' as const, index: idx, step: s, config: { ...config }, baseImageUrl: generatedMedia[idx]?.imageUrl }))
                      .filter(t => t.baseImageUrl && !generatedMedia[t.index]?.videoUrl);
                    if (tasks.length > 0) addToQueue(tasks);
                  }}>
                    <Video className="h-3.5 w-3.5 mr-1.5" /> Generate All Videos
                  </Button>
                </div>
              </div>
              <StudioStoryboard
                config={config}
                storyboard={storyboard}
                generatedMedia={generatedMedia}
                onToggleSelect={handleToggleSelect}
                onToggleLock={handleToggleLock}
                onEnlarge={(i) => setEnlargedImageIndex(i)}
                onAddToQueue={addToQueue}
                onUpdatePrompt={handleUpdatePrompt}
                onUpdateVideoPrompt={handleUpdateVideoPrompt}
                onBatchRegenerate={() => handleBatchAction('regenerate')}
                onBatchUpscale={() => handleBatchAction('upscale')}
                onBatchGenerateVideo={() => handleBatchAction('video')}
                onBatchDelete={() => handleBatchAction('delete')}
                onAddBlankScene={() => {
                  if (!storyboard) return;
                  const newStep: VlogStep = {
                    step_number: storyboard.steps.length + 1,
                    step_name: 'New Scene',
                    a_roll: '', b_roll: '', close_up_details: '', camera_direction: '',
                    image_prompt: '', video_prompt: '', script: ''
                  };
                  setStoryboard({ ...storyboard, steps: [...storyboard.steps, newStep] });
                  setGeneratedMedia(prev => ({ ...prev, [storyboard.steps.length]: { ...DEFAULT_MEDIA } }));
                }}
                selectionCount={getSelectionCount()}
              />
            </>
          ) : !previewCharacterImage ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <p className="text-muted-foreground text-sm mb-2">No storyboard yet</p>
              <p className="text-xs text-muted-foreground">Generate a character preview, then create your storyboard.</p>
            </div>
          ) : null}
        </main>

        {enlargedImageIndex !== null && (
          <ImageLightbox
            index={enlargedImageIndex}
            media={generatedMedia}
            onClose={() => setEnlargedImageIndex(null)}
            onNavigate={(i) => setEnlargedImageIndex(i)}
          />
        )}

        {/* Preview Image Lightbox */}
        {previewLightbox && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md cursor-pointer"
            onClick={() => setPreviewLightbox(null)}
          >
            <button className="absolute top-4 right-4 text-white hover:text-muted-foreground z-[110]">
              <X className="h-8 w-8" />
            </button>
            <img
              src={previewLightbox}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </ProjectLayout>
  );
};

export default AIStudio;
