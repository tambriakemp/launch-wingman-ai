export interface VlogStep {
  step_number: number;
  step_name: string;
  a_roll: string;
  b_roll: string;
  close_up_details: string;
  camera_direction: string;
  image_prompt: string;
  video_prompt: string;
  script: string;
  is_final_look?: boolean;
}

export interface AvatarAnalysis {
  face_structure: string;
  hair: string;
  skin_tone: string;
  makeup_accessories: string;
  clothing_vibe: string;
}

export interface VlogStoryboard {
  analysis: AvatarAnalysis;
  steps: VlogStep[];
}

export type CreationMode = 'vlog' | 'ugc' | 'carousel';
export type AspectRatio = '1:1' | '9:16' | '16:9';
export type AppPhase = 'setup' | 'preview' | 'storyboard';

export interface AppConfig {
  vlogCategory: string;
  vlogTopic: string;
  useOwnScript: boolean;
  userScript: string;
  creationMode: CreationMode;
  avatarDescription: string;
  characterVibe: string;
  ugcPrompt: string;
  carouselVibe: string;
  carouselMessage: string;
  carouselAesthetic: string;
  carouselSlideCount: number;
  productDescription: string;
  useProductAsHair: boolean;
  exactMatch: boolean;
  matchFace: boolean;
  matchSkin: boolean;
  aspectRatio: AspectRatio;
  outfitType: string;
  outfitDetails: string;
  outfitAdditionalInfo: string;
  finalLookType: string;
  finalLook: string;
  finalLookAdditionalInfo: string;
  hairstyle: string;
  customHairstyle: string;
  makeup: string;
  customMakeup: string;
  skinComplexion: string;
  customSkinComplexion: string;
  skinUndertone: string;
  nailStyle: string;
  customNailStyle: string;
  cameraMovement: string;
  ultraRealistic: boolean;
  sceneCount?: number | null;
}

export interface GeneratedMedia {
  imageUrl?: string;
  videoUrl?: string;
  error?: string;
  videoError?: string;
  isGeneratingImage: boolean;
  isGeneratingVideo?: boolean;
  isUpscaling: boolean;
  isSelected: boolean;
}

export type QueueTaskType = 'generate' | 'upscale' | 'generate_video';

export interface QueueItem {
  id: string;
  type: QueueTaskType;
  index: number;
  step: VlogStep;
  config: AppConfig;
  baseImageUrl?: string;
}
