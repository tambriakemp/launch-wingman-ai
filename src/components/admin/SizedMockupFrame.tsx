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

// Base dimensions that mockups are designed at
const MOCKUP_BASE_WIDTH = 600;
const MOCKUP_BASE_HEIGHT = 500;

interface SizedMockupFrameProps {
  width: number;
  height: number;
  children: React.ReactNode;
  showLogo?: boolean;
  showTagline?: boolean;
  gradientOverlay?: boolean;
}

export function SizedMockupFrame({
  width,
  height,
  children,
  showLogo = true,
  showTagline = true,
  gradientOverlay = true,
}: SizedMockupFrameProps) {
  // Calculate scale to FILL the frame (cover, not contain)
  const scaleX = width / MOCKUP_BASE_WIDTH;
  const scaleY = height / MOCKUP_BASE_HEIGHT;
  
  // Use the larger scale to ensure the mockup fills the frame completely
  const fillScale = Math.max(scaleX, scaleY);
  
  // Calculate the scaled dimensions
  const scaledWidth = MOCKUP_BASE_WIDTH * fillScale;
  const scaledHeight = MOCKUP_BASE_HEIGHT * fillScale;
  
  // Center the scaled content (negative offset for overflow)
  const offsetX = (width - scaledWidth) / 2;
  const offsetY = (height - scaledHeight) / 2;

  return (
    <div
      className="relative overflow-hidden"
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        backgroundColor: 'hsl(var(--background))',
      }}
    >
      {/* Mockup Content - Fixed base size, then scaled to fill */}
      <div 
        className="absolute"
        style={{ 
          left: `${offsetX}px`,
          top: `${offsetY}px`,
          width: `${MOCKUP_BASE_WIDTH}px`,
          height: `${MOCKUP_BASE_HEIGHT}px`,
          transform: `scale(${fillScale})`,
          transformOrigin: 'top left',
        }}
      >
        {/* Force the mockup to render at fixed dimensions */}
        <div style={{ width: `${MOCKUP_BASE_WIDTH}px`, minHeight: `${MOCKUP_BASE_HEIGHT}px` }}>
          {children}
        </div>
      </div>

      {/* Optional gradient overlay ON TOP of content */}
      {gradientOverlay && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, transparent 60%, hsl(var(--background) / 0.4) 100%)',
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
          <span 
            className="text-lg font-semibold drop-shadow-lg px-3 py-1 rounded-md"
            style={{ 
              color: 'hsl(var(--foreground))',
              backgroundColor: 'hsl(var(--background) / 0.8)',
            }}
          >
            launchely.com
          </span>
        </div>
      )}
    </div>
  );
}
