import { LaunchelyLogo } from '@/components/ui/LaunchelyLogo';

export type SizePreset = {
  id: string;
  name: string;
  width: number;
  height: number;
  description: string;
};

export const SIZE_PRESETS: SizePreset[] = [
  { id: 'square', name: 'Square', width: 1080, height: 1080, description: 'Instagram, LinkedIn' },
  { id: 'story', name: 'Story/Reel', width: 1080, height: 1920, description: 'Stories, TikTok, Reels' },
  { id: 'landscape', name: 'Landscape', width: 1920, height: 1080, description: 'YouTube, Facebook Cover' },
];

interface SizedMockupFrameProps {
  width: number;
  height: number;
  children: React.ReactNode;
  showLogo?: boolean;
  showTagline?: boolean;
  gradientOverlay?: boolean;
  mockupWidth?: number; // Original mockup width for scale calculation
  mockupHeight?: number; // Original mockup height for scale calculation
}

export function SizedMockupFrame({
  width,
  height,
  children,
  showLogo = true,
  showTagline = true,
  gradientOverlay = true,
  mockupWidth = 600, // Default mockup width
  mockupHeight = 400, // Default mockup height
}: SizedMockupFrameProps) {
  // Calculate scale to FILL the frame (cover, not contain)
  const scaleX = width / mockupWidth;
  const scaleY = height / mockupHeight;
  
  // Use the larger scale to ensure the mockup fills the frame completely
  const fillScale = Math.max(scaleX, scaleY);
  
  // Calculate the scaled dimensions
  const scaledWidth = mockupWidth * fillScale;
  const scaledHeight = mockupHeight * fillScale;
  
  // Center the scaled content (negative offset for overflow)
  const offsetX = (width - scaledWidth) / 2;
  const offsetY = (height - scaledHeight) / 2;

  return (
    <div
      className="relative overflow-hidden bg-background"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Mockup Content - Scaled to fill */}
      <div 
        className="absolute"
        style={{ 
          left: `${offsetX}px`,
          top: `${offsetY}px`,
          transform: `scale(${fillScale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>

      {/* Optional gradient overlay ON TOP of content */}
      {gradientOverlay && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 60%, hsl(var(--background)/0.3) 100%)',
          }}
        />
      )}

      {/* Branding overlays - positioned on top of content */}
      {showLogo && (
        <div className="absolute top-4 left-4 z-10">
          <LaunchelyLogo size="md" className="drop-shadow-lg" />
        </div>
      )}
      
      {showTagline && (
        <div className="absolute bottom-4 right-4 z-10">
          <span className="text-foreground text-lg font-semibold drop-shadow-lg bg-background/80 px-3 py-1 rounded-md">
            launchely.com
          </span>
        </div>
      )}
    </div>
  );
}
