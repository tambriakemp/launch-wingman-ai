import { AppConfig, GeneratedMedia } from "./types";

export const VLOG_CATEGORIES = [
  "Get Ready With Me", "Morning Routine", "Night Routine", "Cooking / In the Kitchen",
  "Cleaning / Reset Routine", "Lifestyle / Day In My Life", "Work-From-Home",
  "Shopping / Haul", "Self-Care / Spa Day", "Mom Life", "Beauty / Glam", "Travel / Outside", "Custom"
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

export const INITIAL_CONFIG: AppConfig = {
  vlogCategory: VLOG_CATEGORIES[0],
  vlogTopic: "",
  useOwnScript: false,
  userScript: "",
  creationMode: 'vlog',
  avatarDescription: "",
  productDescription: "",
  ugcPrompt: "",
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
  cameraMovement: "Handheld / Vlog Style (Natural Shake)"
};

export const DEFAULT_MEDIA: GeneratedMedia = {
  isGeneratingImage: false,
  isUpscaling: false,
  lockedCharacter: false,
  lockedOutfit: false,
  lockedEnvironment: false,
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

export const getUserFriendlyErrorMessage = (error: any): string => {
  const msg = (error?.message || error || "").toString().toLowerCase();
  if (msg.includes('429') || msg.includes('quota') || msg.includes('exhausted') || msg.includes('resource')) {
    return "🛑 Quota exceeded. Please check your billing or try again later.";
  }
  if (msg.includes('503') || msg.includes('overloaded') || msg.includes('unavailable')) {
    return "🥵 The AI is overloaded. Give it a moment and try again.";
  }
  if (msg.includes('safety') || msg.includes('blocked') || msg.includes('violation')) {
    return "😳 That prompt triggered safety filters. Try a different approach.";
  }
  if (msg.includes('402')) {
    return "💳 Credits exhausted. Please add more credits to continue.";
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
    return "📶 Network error. Check your connection and try again.";
  }
  return "👾 Something went wrong. Please try again.";
};
