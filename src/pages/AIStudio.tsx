import React, { useState, useEffect, useRef } from 'react';
import { AppConfig, VlogStep, VlogStoryboard, GeneratedMedia, QueueItem } from '@/components/ai-studio/types';
import { INITIAL_CONFIG, DEFAULT_MEDIA, getUserFriendlyErrorMessage } from '@/components/ai-studio/constants';
// uploadToStorage helpers no longer needed here — images are uploaded on selection
import StudioStoryboard from '@/components/ai-studio/StudioStoryboard';
import StoryboardToolbar from '@/components/ai-studio/StoryboardToolbar';
import StudioHelp from '@/components/ai-studio/StudioHelp';
import ImageLightbox from '@/components/ai-studio/ImageLightbox';
import SavedProjectsGrid from '@/components/ai-studio/SavedProjectsGrid';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, HelpCircle, Save, FileText, Download, FolderOpen, ImageIcon, Video, Sparkles, X, ShieldCheck, Film, Eye, ChevronDown, ArrowLeft } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { VLOG_CATEGORIES } from '@/components/ai-studio/constants';
import { toast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import { ProjectLayout } from '@/components/layout/ProjectLayout';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import ReelSettingsDialog from '@/components/ai-studio/ReelSettingsDialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

const AIStudio = () => {
  const [config, setConfig] = useState<AppConfig>({ ...INITIAL_CONFIG });
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [environmentImage, setEnvironmentImage] = useState<string | null>(null);
  const [environmentImages, setEnvironmentImages] = useState<string[]>([]);
  const [environmentLabel, setEnvironmentLabel] = useState<string | null>(null);
  const [previewCharacterImage, setPreviewCharacterImage] = useState<string | null>(null);
  const [previewFinalLookImage, setPreviewFinalLookImage] = useState<string | null>(null);
  // isPreviewGenerating and previewStep removed — Scene 1 serves as character anchor
  const [storyboard, setStoryboard] = useState<VlogStoryboard | null>(null);
  const [generatedMedia, setGeneratedMedia] = useState<Record<number, GeneratedMedia>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
  const [showSafetyTerms, setShowSafetyTerms] = useState(() => {
    return localStorage.getItem('ai-studio-terms-accepted') === 'true';
  });

  const handleAcceptTerms = () => {
    localStorage.setItem('ai-studio-terms-accepted', 'true');
    setShowSafetyTerms(true);
  };
  const [showHelp, setShowHelp] = useState(false);
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

  // Create Reel state
  const [isMergingVideos, setIsMergingVideos] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);
  const [mergedReelUrl, setMergedReelUrl] = useState<string | null>(null);
  const [reelStoragePath, setReelStoragePath] = useState<string | null>(null);
  const [showReelDialog, setShowReelDialog] = useState(false);
  const [showReelSettings, setShowReelSettings] = useState(false);

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
          // Check if generation was cancelled between tasks
          if (!processingRef.current) {
            // Clear loading states for remaining tasks
            setGeneratedMedia(prev => {
              const next = { ...prev };
              currentBatch.forEach(t => {
                if (!next[t.index]?.imageUrl || next[t.index]?.isGeneratingImage || next[t.index]?.isUpscaling || next[t.index]?.isGeneratingVideo) {
                  next[t.index] = { ...next[t.index], isGeneratingImage: false, isUpscaling: false, isGeneratingVideo: false };
                }
              });
              return next;
            });
            break;
          }
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

              // Scene 1 acts as the universal identity anchor for all subsequent scenes
              let anchorImageUrl: string | undefined;
              if (task.index > 0) {
                const scene1Image = currentGeneratedMedia[0]?.imageUrl;
                if (!scene1Image) {
                  // Scene 1 not ready yet — re-queue this task at the end
                  console.log(`[Anchor] Scene ${task.index + 1} waiting for Scene 1 — re-queuing`);
                  setQueue(prev => [...prev.slice(1), prev[0]]);
                  await new Promise(r => setTimeout(r, 2000));
                  continue;
                }
                anchorImageUrl = scene1Image;
              } else {
                // Scene 1 itself anchors to the character preview
                const activePreviewForAnchor = task.step.is_final_look && currentPreviewFinalLook
                  ? currentPreviewFinalLook : currentPreviewCharacter;
                anchorImageUrl = activePreviewForAnchor || undefined;
              }

              const activePreview = task.step.is_final_look && currentPreviewFinalLook
                ? currentPreviewFinalLook : currentPreviewCharacter;

              let previousScenePrompt: string | undefined;
              let nextScenePrompt: string | undefined;
              if (currentStoryboard) {
                if (task.index > 0) previousScenePrompt = currentStoryboard.steps[task.index - 1]?.image_prompt;
                if (task.index < currentStoryboard.steps.length - 1) nextScenePrompt = currentStoryboard.steps[task.index + 1]?.image_prompt;
              }

              console.log(`[Identity Gate] Scene ${task.index + 1}: activePreview=${activePreview ? 'SET (' + activePreview.substring(0, 50) + '...)' : 'NULL'}`);

              // Pass previous scene's generated image for visual continuity chaining
              const previousSceneImageUrl = task.index > 0
                ? currentGeneratedMedia[task.index - 1]?.imageUrl
                : undefined;

              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 90000);

              try {
                const { data, error } = await supabase.functions.invoke('generate-scene-image', {
                  body: {
                    prompt: task.step.image_prompt,
                    referenceImage: activePreview ? undefined : currentReferenceImage,
                    referenceImages: activePreview ? undefined : (currentReferenceImages.length > 0 ? currentReferenceImages : undefined),
                    productImage,
                    environmentImage: currentEnvironmentImage,
                    environmentImages: currentEnvironmentImages.length > 0 ? currentEnvironmentImages.slice(0, 3) : undefined,
                    previewCharacter: activePreview,
                    config: task.config,
                    isFinalLook: task.step.is_final_look,
                    isUpscale: task.type === 'upscale',
                    baseImageUrl: task.baseImageUrl,
                    anchorImageUrl,
                    previousScenePrompt,
                    nextScenePrompt,
                    previousSceneImageUrl,
                    environmentLabel: environmentLabel || undefined,
                    sceneNumber: task.index + 1,
                    totalScenes: currentStoryboard?.steps.length,
                    aspectRatio: task.config.aspectRatio
                  },
                });


                if (error) throw error;
                if (data?.error) throw new Error(data.error);
              // No longer chain lastGeneratedUrl — anchoring to preview instead

              setGeneratedMedia(prev => ({
                ...prev,
                [task.index]: { ...prev[task.index], imageUrl: data.imageUrl, isGeneratingImage: false, isUpscaling: false, error: undefined }
              }));

              // Auto-set character preview from Scene 1 so subsequent scenes have an identity anchor
              if (task.index === 0 && data.imageUrl) {
                setPreviewCharacterImage(data.imageUrl);
              }
              // For GRWM: set final look preview when the last (final look) scene generates
              if (task.step.is_final_look && data.imageUrl) {
                setPreviewFinalLookImage(data.imageUrl);
              }
              } finally {
                clearTimeout(timeoutId);
              }
            } else if (task.type === 'generate_video') {
              if (!task.baseImageUrl) throw new Error("Image required before generating video");

              // Step 1: Submit job and get requestId
              const { data, error } = await supabase.functions.invoke('generate-video', {
                body: {
                  imageUrl: task.baseImageUrl,
                  videoPrompt: task.step.video_prompt,
                  aspectRatio: task.config.aspectRatio,
                }
              });

              if (error) throw error;
              if (data?.error) throw new Error(data.error);
              if (!data?.requestId) throw new Error("No request ID returned");

              console.log(`[AIStudio] Video submitted for scene ${task.index + 1}, requestId: ${data.requestId}`);

              // Step 2: Client-side polling for completion
              const requestId = data.requestId;
              const statusUrl = data.statusUrl;
              const responseUrl = data.responseUrl;
              const maxPolls = 60; // 10 minutes max (60 * 10s)
              let polls = 0;

              while (polls < maxPolls) {
                await new Promise(r => setTimeout(r, 10000)); // 10 second intervals
                polls++;

                const { data: statusData, error: statusError } = await supabase.functions.invoke('check-video-status', {
                  body: { requestId, statusUrl, responseUrl }
                });

                if (statusError) {
                  console.error(`[AIStudio] Status poll ${polls} error:`, statusError);
                  continue; // Retry on transient errors
                }

                if (statusData?.error) {
                  throw new Error(statusData.error);
                }

                if (polls % 3 === 0) {
                  console.log(`[AIStudio] Scene ${task.index + 1} video poll ${polls}/${maxPolls}: ${statusData?.status}`);
                }

                if (statusData?.status === 'completed' && statusData?.videoUrl) {
                  setGeneratedMedia(prev => ({
                    ...prev,
                    [task.index]: { ...prev[task.index], videoUrl: statusData.videoUrl, isGeneratingVideo: false, videoError: undefined }
                  }));
                  break;
                }

                if (statusData?.status === 'failed') {
                  throw new Error(statusData.error || "Video generation failed");
                }
              }

              if (polls >= maxPolls) {
                throw new Error("Video generation timed out after 10 minutes. The video may still be processing — please try again shortly.");
              }
            }
          } catch (error: any) {
            const errorContext = task.type === 'generate_video' ? 'video' as const : 'image' as const;
            const rawMsg = error?.message || error?.toString() || "Unknown error";
            const friendlyMsg = getUserFriendlyErrorMessage(error, errorContext);
            console.error(`[AIStudio] ${task.type} failed for scene ${task.index + 1}:`, rawMsg, error);
            setGeneratedMedia(prev => ({
              ...prev,
              [task.index]: {
                ...prev[task.index],
                isGeneratingImage: false,
                isUpscaling: false,
                isGeneratingVideo: false,
                ...(task.type === 'generate_video' ? { videoError: friendlyMsg } : { error: friendlyMsg })
              }
            }));
            if (task.type === 'generate_video') {
              toast({ title: "Video Generation Failed", description: friendlyMsg, variant: "destructive" });
            } else {
              toast({ title: "Generation Failed", description: friendlyMsg, variant: "destructive" });
            }
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
    if (config.creationMode !== 'carousel' && !config.vlogCategory) return;
    setIsGeneratingTopic(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-storyboard', {
        body: { action: 'brainstorm', config }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (config.creationMode === 'carousel' && data.ideas) {
        const firstIdea = data.ideas[0] || '';
        const parts = firstIdea.split(' — ');
        if (parts.length >= 2) {
          setConfig(prev => ({ ...prev, carouselVibe: parts[0].trim(), carouselMessage: parts.slice(1).join(' — ').trim() }));
        } else {
          setConfig(prev => ({ ...prev, carouselVibe: firstIdea }));
        }
      } else {
        setConfig(prev => ({ ...prev, vlogTopic: data.topic }));
      }
    } catch (e: any) {
      toast({ title: "Error", description: getUserFriendlyErrorMessage(e), variant: "destructive" });
    } finally {
      setIsGeneratingTopic(false);
    }
  };

  // handleGeneratePreview removed — Scene 1's generated image now serves as the character anchor

  const handleGenerateStoryboard = async () => {
    if (!referenceImage) return;
    if (config.creationMode === 'carousel' && !config.carouselVibe.trim()) {
      toast({ title: "Setting Required", description: "Please describe the setting and environment for your carousel.", variant: "destructive" });
      return;
    }
    // Auto-reset if a storyboard already exists (implicit "new project")
    if (storyboard) {
      setStoryboard(null);
      setGeneratedMedia({});
      setQueue([]);
      setEnlargedImageIndex(null);
      setIsProcessing(false);
      setCurrentProjectId(null);
      setCurrentProjectName(undefined);
      setMergedReelUrl(null);
      setReelStoragePath(null);
      setPreviewCharacterImage(null);
      setPreviewFinalLookImage(null);
    }
    setIsGeneratingStoryboard(true);
    try {
      // Images are already URLs (uploaded on selection) — pass directly
      const refUrl = referenceImage;
      const prodUrl = productImage;
      const envUrl = environmentImage;
      const envUrls = environmentImages;

      // Safety check using URL
      if (refUrl) {
        const { data: safetyData } = await supabase.functions.invoke('generate-storyboard', {
          body: { action: 'validate_safety', referenceImageUrl: refUrl }
        });
        if (safetyData && !safetyData.safe) {
          toast({ title: "Safety Check Failed", description: safetyData.error || "Content violation detected.", variant: "destructive" });
          setIsGeneratingStoryboard(false);
          return;
        }
      }

      const { data, error } = await supabase.functions.invoke('generate-storyboard', {
        body: { action: 'generate', referenceImageUrl: refUrl, productImageUrl: prodUrl, environmentImageUrl: envUrl, environmentImageUrls: envUrls.length > 0 ? envUrls : undefined, config }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const board = data.storyboard as VlogStoryboard;
      setStoryboard(board);

      const initialMedia: Record<number, GeneratedMedia> = {};
      board.steps.forEach((_, idx) => { initialMedia[idx] = { ...DEFAULT_MEDIA }; });
      setGeneratedMedia(initialMedia);

      // Auto-queue Scene 1 image generation so it becomes the character anchor
      if (board.steps.length > 0) {
        const scene1Task: QueueItem = {
          id: Math.random().toString(),
          type: 'generate',
          index: 0,
          step: board.steps[0],
          config: { ...config }
        };
        addToQueue([scene1Task]);
      }
    } catch (e: any) {
      toast({ title: "Error", description: getUserFriendlyErrorMessage(e), variant: "destructive" });
    } finally {
      setIsGeneratingStoryboard(false);
    }
  };

  const handleToggleSelect = (index: number) => {
    setGeneratedMedia(prev => ({ ...prev, [index]: { ...prev[index], isSelected: !prev[index]?.isSelected } }));
  };


  const handleUpdatePrompt = (index: number, newPrompt: string) => {
    if (!storyboard) return;
    const updatedSteps = [...storyboard.steps];
    updatedSteps[index] = { ...updatedSteps[index], image_prompt: newPrompt };
    setStoryboard({ ...storyboard, steps: updatedSteps });
  };

  const handleUpdateVideoPrompt = (index: number, newPrompt: string) => {
    if (!storyboard) return;
    const updatedSteps = [...storyboard.steps];
    updatedSteps[index] = { ...updatedSteps[index], video_prompt: newPrompt };
    setStoryboard({ ...storyboard, steps: updatedSteps });
  };

  const handleUpdateScript = (index: number, newScript: string) => {
    if (!storyboard) return;
    const updatedSteps = [...storyboard.steps];
    updatedSteps[index] = { ...updatedSteps[index], script: newScript };
    setStoryboard({ ...storyboard, steps: updatedSteps });
  };

  const handleUpdateAction = (index: number, newAction: string) => {
    if (!storyboard) return;
    const updatedSteps = [...storyboard.steps];
    updatedSteps[index] = { ...updatedSteps[index], a_roll: newAction };
    setStoryboard({ ...storyboard, steps: updatedSteps });
  };

  const handleUpdateDetail = (index: number, newDetail: string) => {
    if (!storyboard) return;
    const updatedSteps = [...storyboard.steps];
    updatedSteps[index] = { ...updatedSteps[index], close_up_details: newDetail };
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
        selectedIndices.forEach(i => { next[i] = { ...next[i], imageUrl: undefined, isSelected: false, error: undefined }; });
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

  // Create Reel — client-side Canvas + MediaRecorder merge
  const handleCreateReel = async (clipDurations?: (number | null)[]) => {
    if (!storyboard) return;
    const videoEntries: { url: string; maxDuration: number | null }[] = [];
    let clipIdx = 0;
    for (let i = 0; i < storyboard.steps.length; i++) {
      const url = generatedMedia[i]?.videoUrl;
      if (url) {
        videoEntries.push({ url, maxDuration: clipDurations?.[clipIdx] ?? null });
        clipIdx++;
      }
    }
    if (videoEntries.length < 2) {
      toast({ title: "Need more videos", description: "At least 2 scene videos are required to create a reel.", variant: "destructive" });
      return;
    }
    setShowReelSettings(false);

    const DIMS: Record<string, { w: number; h: number }> = {
      "9:16": { w: 1080, h: 1920 },
      "16:9": { w: 1920, h: 1080 },
      "1:1": { w: 1080, h: 1080 },
    };
    const dims = DIMS[config.aspectRatio] || DIMS["9:16"];

    setIsMergingVideos(true);
    setMergeProgress(5);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = dims.w;
      canvas.height = dims.h;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, dims.w, dims.h);

      const stream = canvas.captureStream(30);
      // Always record in WebM (best browser support); convert to MP4 after
      const recMime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      console.log(`[Reel] Recording mimeType: ${recMime}, will convert to MP4`);
      const recorder = new MediaRecorder(stream, {
        mimeType: recMime,
        videoBitsPerSecond: 8_000_000,
      });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      const reelDone = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
      });

      setMergeProgress(10);

      // Preload all videos in parallel BEFORE starting recorder
      console.log(`[Reel] Preloading ${videoEntries.length} videos...`);
      const preloadedVideos = await Promise.all(
        videoEntries.map((entry, idx) =>
          new Promise<HTMLVideoElement>((resolve, reject) => {
            const vid = document.createElement('video');
            vid.crossOrigin = 'anonymous';
            vid.muted = true;
            vid.playsInline = true;
            vid.preload = 'auto';
            vid.src = entry.url;
            vid.oncanplaythrough = () => resolve(vid);
            vid.onerror = () => reject(new Error(`Failed to preload video ${idx + 1}`));
            vid.load();
          })
        )
      );
      console.log(`[Reel] All ${preloadedVideos.length} videos preloaded`);

      // Start recording AFTER all videos are preloaded (no blank frames)
      recorder.start();

      // Play each preloaded video sequentially on the canvas
      for (let i = 0; i < preloadedVideos.length; i++) {
        setMergeProgress(10 + Math.round((i / preloadedVideos.length) * 70));
        const vid = preloadedVideos[i];
        const maxDur = videoEntries[i].maxDuration;
        console.log(`[Reel] Playing video ${i + 1}/${preloadedVideos.length}, maxDuration=${maxDur}`);

        await new Promise<void>((resolve, reject) => {
          let timer: ReturnType<typeof setTimeout> | null = null;

          const finish = () => {
            if (timer) clearTimeout(timer);
            vid.pause();
            vid.remove();
            resolve();
          };

          // Draw the first frame of this clip immediately to avoid any flash
          const scale = Math.max(dims.w / vid.videoWidth, dims.h / vid.videoHeight);
          const dw = vid.videoWidth * scale;
          const dh = vid.videoHeight * scale;
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, dims.w, dims.h);
          ctx.drawImage(vid, (dims.w - dw) / 2, (dims.h - dh) / 2, dw, dh);

          vid.onplay = () => {
            if (maxDur !== null && maxDur > 0 && maxDur < vid.duration) {
              timer = setTimeout(finish, maxDur * 1000);
            }
            const drawFrame = () => {
              if (vid.paused || vid.ended) return;
              const s = Math.max(dims.w / vid.videoWidth, dims.h / vid.videoHeight);
              const w = vid.videoWidth * s;
              const h = vid.videoHeight * s;
              ctx.fillStyle = '#000';
              ctx.fillRect(0, 0, dims.w, dims.h);
              ctx.drawImage(vid, (dims.w - w) / 2, (dims.h - h) / 2, w, h);
              requestAnimationFrame(drawFrame);
            };
            drawFrame();
          };

          vid.onended = finish;
          vid.onerror = () => reject(new Error(`Failed to play video ${i + 1}`));

          // Already preloaded — play immediately
          vid.play().catch(reject);
        });
      }

      recorder.stop();
      setMergeProgress(85);
      const blob = await reelDone;
      console.log(`[Reel] Merged WebM blob size: ${(blob.size / 1024 / 1024).toFixed(1)}MB`);

      // Upload WebM to temp storage for server-side conversion
      setMergeProgress(86);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const tempPath = `reels/${user.id}/temp_${Date.now()}.webm`;
      const { error: tempUploadErr } = await supabase.storage
        .from('ai-studio')
        .upload(tempPath, blob, { contentType: 'video/webm', upsert: true });
      if (tempUploadErr) throw tempUploadErr;

      const { data: tempUrlData } = supabase.storage.from('ai-studio').getPublicUrl(tempPath);
      const tempWebmUrl = tempUrlData.publicUrl;
      setMergeProgress(88);

      // Convert via edge function
      console.log('[Reel] Converting WebM to MP4 via server...');
      const outputPath = `reels/${user.id}/${Date.now()}.mp4`;
      const { data: convertData, error: convertError } = await supabase.functions.invoke('convert-video', {
        body: { inputUrl: tempWebmUrl, outputPath, userId: user.id }
      });
      if (convertError) throw convertError;
      if (convertData?.error) throw new Error(convertData.error);

      const reelUrl = convertData.publicUrl;
      setMergeProgress(92);

      // Clean up temp WebM
      await supabase.storage.from('ai-studio').remove([tempPath]);

      // Persist to project
      if (currentProjectId) {
        await supabase.from('ai_studio_projects').update({
          reel_url: reelUrl,
          reel_path: outputPath,
          reel_created_at: new Date().toISOString(),
        }).eq('id', currentProjectId);
      }

      setMergedReelUrl(reelUrl);
      setReelStoragePath(outputPath);
      setShowReelDialog(true);
      setMergeProgress(100);

      toast({ title: "Reel created!", description: "Your scenes have been merged into an MP4 video." });
    } catch (e: any) {
      console.error('[Reel] Merge error:', e);
      toast({ title: "Merge failed", description: e?.message || "Could not merge videos. Try again.", variant: "destructive" });
    } finally {
      setIsMergingVideos(false);
    }
  };

  const handleDownloadReel = async () => {
    if (!mergedReelUrl) return;
    try {
      const response = await fetch(mergedReelUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(new Blob([blob], { type: 'video/mp4' }));
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `reel-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
    } catch (e: any) {
      toast({ title: "Download failed", description: "Could not download the reel. Try right-clicking and saving.", variant: "destructive" });
    }
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
    setEnvironmentLabel(null);
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
    setMergedReelUrl(null);
    setReelStoragePath(null);
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
        };
      });

      const row: Record<string, any> = {
        user_id: user.id, name, mode: config.creationMode,
        config: config as any, storyboard: storyboard as any,
        generated_media: persistMedia as any,
        character_preview_url: previewCharacterImage,
        final_look_preview_url: previewFinalLookImage,
        status: 'saved', updated_at: new Date().toISOString(),
      };
      // Persist reel data if available
      if (mergedReelUrl) row.reel_url = mergedReelUrl;
      if (reelStoragePath) row.reel_path = reelStoragePath;
      if (mergedReelUrl) row.reel_created_at = new Date().toISOString();

      if (currentProjectId) {
        const { error } = await supabase.from('ai_studio_projects').update(row as any).eq('id', currentProjectId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('ai_studio_projects').insert(row as any).select('id').single();
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
      // Restore reel data
      setMergedReelUrl((data as any).reel_url || null);
      setReelStoragePath((data as any).reel_path || null);

      const restoredMedia: Record<number, GeneratedMedia> = {};
      if (loadedStoryboard?.steps) {
        loadedStoryboard.steps.forEach((_, idx) => {
          const saved = loadedMedia[String(idx)] || {};
          restoredMedia[idx] = {
            imageUrl: saved.imageUrl, videoUrl: saved.videoUrl,
            error: undefined, videoError: undefined,
            isGeneratingImage: false, isGeneratingVideo: false, isUpscaling: false,
            isSelected: false,
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
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-4">
          <div className="flex items-start gap-4">
            <button onClick={() => window.history.back()} className="mt-1 p-1.5 rounded-md hover:bg-muted transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="p-3 bg-rose-100/50 dark:bg-rose-900/20 rounded-xl shrink-0">
              <Sparkles className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Storyboard Creator</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">Create AI-powered video content for your brand.</p>
            </div>
          </div>
        </div>

        <StudioHelp open={showHelp} onClose={() => setShowHelp(false)} />




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

        {/* Reel Settings Dialog */}
        <ReelSettingsDialog
          open={showReelSettings}
          onOpenChange={setShowReelSettings}
          clips={storyboard ? storyboard.steps
            .map((s, idx) => ({ index: idx, imageUrl: generatedMedia[idx]?.imageUrl, stepName: s.step_name }))
            .filter((_, idx) => !!generatedMedia[idx]?.videoUrl) : []}
          onGenerate={(durations) => handleCreateReel(durations)}
          isGenerating={isMergingVideos}
        />

        <Dialog open={showReelDialog} onOpenChange={setShowReelDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Your Reel is Ready</DialogTitle>
              <DialogDescription>All scene videos have been merged into one continuous reel.</DialogDescription>
            </DialogHeader>
            {mergedReelUrl && (
              <video src={mergedReelUrl} controls className="w-full rounded-lg border border-border" />
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowReelDialog(false)}>Close</Button>
              <Button onClick={handleDownloadReel}>
                <Download className="h-4 w-4 mr-2" /> Download Reel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Merge Progress Overlay */}
        {isMergingVideos && (
          <div className="fixed bottom-6 right-6 z-50 bg-card border border-border rounded-xl p-4 shadow-2xl w-72">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium text-foreground">
                {mergeProgress < 85 ? 'Merging scenes...' : mergeProgress < 92 ? 'Converting to MP4...' : mergeProgress < 100 ? 'Uploading...' : 'Done!'}
              </span>
            </div>
            <Progress value={mergeProgress} className="h-2" indicatorClassName="bg-primary" />
            <p className="text-xs text-muted-foreground mt-1">{mergeProgress}% complete</p>
          </div>
        )}

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
            setEnvironmentLabel={setEnvironmentLabel}
            productImage={productImage}
            setProductImage={setProductImage}
            isProcessing={isProcessing}
            onProjects={() => setShowProjectsDialog(true)}
            onSave={handleSaveClick}
            isSaving={isSaving}
            onDownloadScript={handleDownloadScript}
            onDownloadAll={handleDownloadAll}
            hasStoryboard={!!storyboard}
            onHelp={() => setShowHelp(true)}
            showSafetyTerms={showSafetyTerms}
            onGenerateStoryboard={handleGenerateStoryboard}
            isGeneratingStoryboard={isGeneratingStoryboard}
            onGenerateAllImages={() => {
              if (!storyboard) return;
              let tasks: QueueItem[] = storyboard.steps
                .map((s, idx) => ({ id: Math.random().toString(), type: 'generate' as const, index: idx, step: s, config: { ...config } }))
                .filter(t => !generatedMedia[t.index]?.imageUrl);
              if (config.creationMode === 'carousel' && tasks.length > 0) {
                tasks.sort((a, b) => a.index - b.index);
              }
              if (tasks.length > 0) addToQueue(tasks);
            }}
            onGenerateAllVideos={() => {
              if (!storyboard) return;
              const tasks: QueueItem[] = storyboard.steps
                .map((s, idx) => ({ id: Math.random().toString(), type: 'generate_video' as const, index: idx, step: s, config: { ...config }, baseImageUrl: generatedMedia[idx]?.imageUrl }))
                .filter(t => t.baseImageUrl && !generatedMedia[t.index]?.videoUrl);
              if (tasks.length > 0) addToQueue(tasks);
            }}
            onCreateReel={() => setShowReelSettings(true)}
            onViewReel={() => setShowReelDialog(true)}
            onDownloadReel={handleDownloadReel}
            isMergingVideos={isMergingVideos}
            mergedReelUrl={mergedReelUrl}
            videoCount={Object.values(generatedMedia).filter(m => m.videoUrl).length}
            anyGeneratingVideo={Object.values(generatedMedia).some(m => m.isGeneratingVideo)}
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
                onClick={handleAcceptTerms}
                className="px-3 py-1.5 text-xs font-bold bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors flex-shrink-0"
              >
                I Agree
              </button>
            </div>
          )}

          {/* Topic/Message inputs moved to Create sheet panel */}

          {/* Generate Storyboard CTA moved to Create sheet panel */}
          {!storyboard && (
            <div className="my-4">
              <div className="bg-card border border-border rounded-xl p-6 text-center">
                {isGeneratingStoryboard ? (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-medium text-foreground">Generating your storyboard...</p>
                    <p className="text-xs text-muted-foreground">This may take a moment</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {!referenceImage
                      ? "Upload a character photo in the Create panel to get started."
                      : !showSafetyTerms
                      ? "Accept the safety terms above to continue."
                      : "Open the Create panel, configure your settings, and generate your storyboard."}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Scene Workspace */}
          {storyboard ? (
            <>
              {/* Contextual batch actions header */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-foreground">Storyboard · {storyboard.steps.length} scenes</h2>
              </div>
              <StudioStoryboard
                config={config}
                storyboard={storyboard}
                generatedMedia={generatedMedia}
                onToggleSelect={handleToggleSelect}
                onEnlarge={(i) => setEnlargedImageIndex(i)}
                onAddToQueue={addToQueue}
                onUpdatePrompt={handleUpdatePrompt}
                onUpdateVideoPrompt={handleUpdateVideoPrompt}
                onUpdateScript={handleUpdateScript}
                onUpdateAction={handleUpdateAction}
                onUpdateDetail={handleUpdateDetail}
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
