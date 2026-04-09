import { AppConfig, GeneratedMedia } from "./types";

export const VLOG_CATEGORIES = [
  "Get Ready With Me", "Morning Routine", "Night Routine", "Cooking / In the Kitchen",
  "Cleaning / Reset Routine", "Lifestyle / Day In My Life", "Work-From-Home",
  "Shopping / Haul", "Self-Care / Spa Day", "Mom Life", "Beauty / Glam", "Travel / Outside",
  "Luxury / Soft Life", "Clean Girl / Minimal", "Dark Academia", "Y2K / Baddie",
  "Cozy / Warm Tones", "Professional / Corporate", "Street Style / Urban",
  "Cottagecore / Feminine", "Moody / Editorial", "Bright / Colorful", "Neutral / Earthy",
  "Custom"
];

export const MAKEUP_STYLES = [
  "Bare Face / No Makeup", "Clean Girl Makeup", "Soft Glam Baddie", "Full Glam Baddie",
  "Luxury Baddie Beat", "Natural Glam", "Dewy Glow", "Matte Full Coverage",
  "Bold Lip Moment", "Smokey Eye Glam", "Custom"
];

export const COMPLEXION_OPTIONS = [
  "Very Fair", "Light", "Light-Medium", "Medium", "Tan", "Brown", "Deep Brown", "Rich Deep", "Ebony", "Custom"
];

export const UNDERTONE_OPTIONS = ["Neutral", "Warm", "Cool", "Golden", "Olive"];

export const NAIL_STYLES = [
  "Natural Short Nails", "Short Neutral Polish", "Medium Square Acrylics",
  "Long Square Acrylics", "Long Coffin Nails", "Long Almond Nails", "Long Stiletto Nails",
  "French Tip", "Red Baddie Nails", "Nude Baddie Nails", "Chrome Nails",
  "Glitter Accent Nails", "Custom"
];

export const OUTFIT_TYPES = [
  "Default Outfit", "Pajamas", "Silk Pajamas", "Loungewear Set", "Matching Sweatsuit",
  "Casual Jeans & Tee", "Athleisure / Yoga Set", "Work-From-Home Set",
  "Luxury Lounge Set", "Date Night Dress", "Business Chic", "Streetwear Baddie",
  "Airport Outfit", "Custom Outfit"
];

export const HAIRSTYLE_GROUPS: Record<string, string[]> = {
  "Wigs / Install Styles": [
    "Sleek Straight Wig", "Body Wave Wig", "Deep Wave Wig", "Curly Lace Front Wig",
    "Side Part Wig", "Middle Part Wig", "Bust Down Straight Wig", "Kinky Straight Wig",
    "Bob Wig", "Blunt Cut Bob", "30-Inch Long Baddie Wig", "Highlighted Honey Blonde Wig",
    "Jet Black Luxe Wig", "Chocolate Brown Wig", "Silk Press Wig Look"
  ],
  "Natural + Protective Styles": [
    "Natural Curls", "Defined Twist-Out", "Afro Puff", "Wash-N-Go", "High Puff with Edges",
    "Flat Twist Updo", "Low Bun with Baby Hairs", "Top Knot Bun", "Low Sleek Bun", "Space Buns"
  ],
  "Braids & Twists": [
    "Box Braids", "Knotless Braids", "Boho Knotless Braids", "Passion Twists",
    "Senegalese Twists", "Jumbo Braids", "Lemonade Braids", "Cornrows", "Fulani Braids", "Goddess Braids"
  ],
  "Ponytail Styles": [
    "Sleek High Ponytail", "Sleek Low Ponytail", "Curly Ponytail", "Braided Ponytail",
    "Wrapped Ponytail with Edges", "Barbie Ponytail"
  ],
  "Soft Life / Feminine Styles": [
    "Loose Romantic Curls", "Big Voluminous Curls", "Soft Glam Waves", "Pin Curls",
    "Half-Up Half-Down", "French Curl Braids", "Loose Messy Bun", "Soft Side-Swept Curls"
  ],
  "Tech-Lux / Futuristic": [
    "Platinum Silver Wig", "Rose Gold Waves", "Chrome Ombré Ends", "Glass Hair (Ultra Sleek)"
  ],
  "Custom": ["Custom Option"]
};

export const CAMERA_MOVEMENTS = [
  "Handheld / Vlog Style (Natural Shake)",
  "Cinematic Slow Pan (Smooth)",
  "Static Tripod (No Movement)",
  "Slow Zoom In (Dramatic)",
  "Slow Zoom Out (Reveal)",
  "Orbit / 360 View",
  "Dynamic / Fast Paced",
  "Following Subject (Tracking Shot)",
  "Custom Movement"
];

export const TOPIC_PLACEHOLDERS: Record<string, string> = {
  "Get Ready With Me": "e.g. Getting ready for a date night with full glam...",
  "Morning Routine": "e.g. 5AM productive morning, matcha, journaling, gym...",
  "Night Routine": "e.g. Unwinding after work, skincare, reading, tea...",
  "Cooking / In the Kitchen": "e.g. Making a healthy salmon bowl dinner...",
  "Cleaning / Reset Routine": "e.g. Sunday reset, deep cleaning the living room...",
  "Lifestyle / Day In My Life": "e.g. Busy work day in the city, coffee runs, meetings...",
  "Work-From-Home": "e.g. Desk setup, emails, lunch break...",
  "Shopping / Haul": "e.g. Showing off new Zara haul, trying on clothes...",
  "Self-Care / Spa Day": "e.g. Face masks, bubble bath, relaxation...",
  "Mom Life": "e.g. School drop off, grocery run, park time...",
  "Beauty / Glam": "e.g. Testing new viral makeup products...",
  "Travel / Outside": "e.g. Exploring Paris, cafe hopping, sightseeing...",
  "Custom": "Describe your specific video concept..."
};


export const CAROUSEL_SHOT_PALETTE = [
  "Wide establishing shot — full body, subject + environment both visible",
  "3/4 shot — subject from mid-thigh up, slight angle, confident pose",
  "Close-up face — direct eye contact, tight crop from shoulders up",
  "Extreme close-up — just eyes, lips, or a single detail",
  "Over-the-shoulder — camera behind subject looking forward",
  "Low angle — camera below subject looking up, powerful framing",
  "High angle — camera above looking down, intimate or vulnerable feel",
  "Profile shot — subject facing sideways, strong silhouette",
  "Detail shot — hands, jewelry, accessories, nails, shoes, bag",
  "Flat lay — objects arranged on a surface with no person",
  "Environmental detail — textures, background elements, mood-setting objects",
  "Reflection shot — mirror, window, or reflective surface",
  "Motion blur — subject slightly in motion, dynamic energy",
  "Candid moment — subject not looking at camera, caught in a moment",
  "Text-space composition — subject positioned left or right to leave room for overlay text",
  "Framed shot — subject viewed through a doorway, window, or architectural element",
];

export const INITIAL_CONFIG: AppConfig = {
  vlogCategory: VLOG_CATEGORIES[0],
  vlogTopic: "",
  useOwnScript: false,
  userScript: "",
  creationMode: 'vlog',
  avatarDescription: "",
  characterVibe: "",
  productDescription: "",
  ugcPrompt: "",
  carouselVibe: "",
  carouselMessage: "",
  carouselSlideCount: 6,
  useProductAsHair: false,
  exactMatch: true,
  matchFace: true,

  matchSkin: true,
  aspectRatio: '9:16',
  outfitType: "Default Outfit",
  outfitDetails: "",
  outfitAdditionalInfo: "",
  finalLookType: "Default Outfit",
  finalLook: "",
  finalLookAdditionalInfo: "",
  hairstyle: "Sleek Straight Wig",
  customHairstyle: "",
  makeup: "Soft Glam Baddie",
  customMakeup: "",
  skinComplexion: "Medium",
  customSkinComplexion: "",
  skinUndertone: "Neutral",
  nailStyle: "Long Coffin Nails",
  customNailStyle: "",
  cameraMovement: "Handheld / Vlog Style (Natural Shake)",
  ultraRealistic: true,
  sceneCount: null,
  useReferenceAsStart: false,
  environmentMode: 'evolve',
  pathASceneCount: 6,
};

export const DEFAULT_MEDIA: GeneratedMedia = {
  isGeneratingImage: false,
  isUpscaling: false,
  isSelected: false,
  error: undefined
};

export const QUICK_LOOK_PRESETS: Record<string, Partial<import('./types').AppConfig>> = {
  "Natural Minimal": {
    makeup: "Clean Girl Makeup",
    hairstyle: "Loose Romantic Curls",
    outfitType: "Loungewear Set",
    nailStyle: "Natural Short Nails",
  },
  "Glam Baddie": {
    makeup: "Full Glam Baddie",
    hairstyle: "30-Inch Long Baddie Wig",
    outfitType: "Date Night Dress",
    nailStyle: "Long Coffin Nails",
  },
  "Soft Girl": {
    makeup: "Dewy Glow",
    hairstyle: "Half-Up Half-Down",
    outfitType: "Casual Jeans & Tee",
    nailStyle: "Short Neutral Polish",
  },
  "Streetwear": {
    makeup: "Bare Face / No Makeup",
    hairstyle: "Sleek High Ponytail",
    outfitType: "Streetwear Baddie",
    nailStyle: "Chrome Nails",
  },
};

export const getUserFriendlyErrorMessage = (error: any, context: 'image' | 'video' | 'general' = 'general'): string => {
  const msg = (error?.message || error || "").toString().toLowerCase();
  if (msg.includes('429') || msg.includes('quota') || msg.includes('exhausted') || msg.includes('resource')) {
    return "🛑 Quota exceeded. Please check your billing or try again later.";
  }
  if (msg.includes('503') || msg.includes('overloaded') || msg.includes('unavailable')) {
    return "🥵 The AI is overloaded. Give it a moment and try again.";
  }
  if (msg.includes('safety') || msg.includes('blocked') || msg.includes('violation')) {
    return "😳 That prompt triggered safety filters. Try a different description.";
  }
  if (msg.includes('402') || msg.includes('exhausted balance') || msg.includes('platform.*balance')) {
    return "💳 Credits exhausted. Please add more credits or use your own fal.ai API key.";
  }
  if (msg.includes('403') || msg.includes('locked')) {
    return "💳 Platform balance exhausted. Add your own fal.ai API key or purchase credits in Settings.";
  }
  if (msg.includes('aborted') || msg.includes('aborterror')) {
    if (context === 'image') return "⏱️ Image generation timed out after 90 seconds. Try simplifying the scene or reducing environment images, then regenerate.";
    if (context === 'video') return "⏱️ Video generation timed out. Videos can take 3-5 minutes — please try again.";
    return "⏱️ The request timed out. Please try again.";
  }
  if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('load failed')) {
    if (context === 'image') return "⏱️ Image generation timed out or was interrupted. Try regenerating this scene.";
    if (context === 'video') return "⏱️ Video generation timed out or was interrupted. Videos can take 3-5 minutes — please try again.";
    return "⏱️ The request timed out or was interrupted. Please try again.";
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return "📶 Network error. Check your connection and try again.";
  }
  if (msg.includes('timed out') || msg.includes('timeout')) {
    if (context === 'image') return "⏱️ Image generation timed out. Try simplifying the scene or regenerating.";
    if (context === 'video') return "⏱️ Video generation timed out. This can happen with complex scenes — please retry.";
    return "⏱️ The request timed out. Please try again.";
  }
  // Pass through the actual error message so users can report it
  const rawMsg = (error?.message || error || "").toString();
  if (rawMsg && rawMsg !== "Unknown error" && rawMsg.length > 5) {
    return `Something went wrong: ${rawMsg}`;
  }
  return "👾 Something went wrong. Please try again.";
};
