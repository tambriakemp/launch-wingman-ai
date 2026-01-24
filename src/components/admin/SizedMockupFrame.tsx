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
  mockupScale?: number;
}

export function SizedMockupFrame({
  width,
  height,
  children,
  showLogo = true,
  showTagline = true,
  gradientOverlay = true,
  mockupScale = 1,
}: SizedMockupFrameProps) {
  const aspectRatio = width / height;
  const isSquare = aspectRatio === 1;
  const isVertical = aspectRatio < 1;
  const isLandscape = aspectRatio > 1;

  // Calculate mockup positioning based on aspect ratio
  const getMockupStyles = () => {
    if (isSquare) {
      // Square: Center the mockup with padding, scale to fit
      return {
        container: 'flex items-center justify-center p-8',
        mockupWrapper: 'w-full h-[70%] overflow-hidden rounded-lg shadow-2xl',
        mockupScale: 0.55,
      };
    } else if (isVertical) {
      // Vertical/Story: Mockup in upper portion, branded section below
      return {
        container: 'flex flex-col',
        mockupWrapper: 'w-full h-[55%] overflow-hidden flex items-center justify-center p-6',
        mockupScale: 0.5,
      };
    } else {
      // Landscape: Mockup on right, branded panel on left
      return {
        container: 'flex flex-row',
        mockupWrapper: 'w-[65%] h-full overflow-hidden flex items-center justify-center p-6',
        mockupScale: 0.65,
      };
    }
  };

  const styles = getMockupStyles();
  const finalScale = mockupScale * styles.mockupScale;

  return (
    <div
      className="relative overflow-hidden bg-background"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Gradient Overlay Background */}
      {gradientOverlay && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isVertical 
              ? 'linear-gradient(180deg, hsl(var(--accent)) 0%, hsl(var(--accent)/0.8) 30%, hsl(var(--background)) 60%)'
              : isLandscape
              ? 'linear-gradient(90deg, hsl(var(--accent)) 0%, hsl(var(--accent)/0.9) 25%, hsl(var(--background)) 40%)'
              : 'linear-gradient(135deg, hsl(var(--accent)/0.2) 0%, hsl(var(--background)) 50%)',
          }}
        />
      )}

      {/* Main Content Container */}
      <div className={`relative w-full h-full ${styles.container}`}>
        {/* Left Panel for Landscape */}
        {isLandscape && (
          <div className="w-[35%] h-full flex flex-col items-center justify-center p-8 relative z-10">
            {showLogo && (
              <LaunchelyLogo size="xl" className="mb-6" />
            )}
            {showTagline && (
              <p className="text-accent-foreground text-2xl font-semibold text-center leading-tight">
                Your Launch<br />Command Center
              </p>
            )}
            <p className="text-accent-foreground/80 text-lg mt-4">
              launchely.com
            </p>
          </div>
        )}

        {/* Mockup Container */}
        <div className={styles.mockupWrapper}>
          <div 
            className="origin-center"
            style={{ 
              transform: `scale(${finalScale})`,
              transformOrigin: 'center center',
            }}
          >
            {children}
          </div>
        </div>

        {/* Bottom Panel for Square */}
        {isSquare && (
          <div className="absolute bottom-0 left-0 right-0 p-6 flex items-center justify-between bg-gradient-to-t from-accent/90 to-accent/70">
            {showLogo && (
              <LaunchelyLogo size="md" textClassName="text-accent-foreground" />
            )}
            {showTagline && (
              <p className="text-accent-foreground text-lg font-medium">
                launchely.com
              </p>
            )}
          </div>
        )}

        {/* Bottom Panel for Vertical */}
        {isVertical && (
          <div className="h-[45%] flex flex-col items-center justify-center p-8 bg-background relative z-10">
            {showLogo && (
              <LaunchelyLogo size="xl" className="mb-4" />
            )}
            {showTagline && (
              <>
                <p className="text-foreground text-3xl font-bold text-center mb-2">
                  Your Launch Command Center
                </p>
                <p className="text-muted-foreground text-xl text-center">
                  Plan, create, and execute your next launch
                </p>
              </>
            )}
            <p className="text-primary text-xl font-semibold mt-6">
              launchely.com
            </p>
          </div>
        )}

        {/* Corner Logo for Landscape (subtle) */}
        {isLandscape && showLogo && (
          <div className="absolute bottom-4 right-4 opacity-60">
            <LaunchelyLogo size="sm" showText={false} />
          </div>
        )}
      </div>
    </div>
  );
}
