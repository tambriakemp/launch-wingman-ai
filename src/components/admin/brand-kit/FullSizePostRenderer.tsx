import { forwardRef } from 'react';
import { PostPreview, BackgroundVariant } from './PostPreview';

interface GeneratedContent {
  headline: string;
  subheadline?: string;
  bullets?: string[];
  cta?: string;
}

interface FullSizePostRendererProps {
  content: GeneratedContent;
  templateType: string;
  bgVariant: BackgroundVariant;
  slideNumber?: number;
}

/**
 * Renders the PostPreview at full 1080x1350 resolution for capture.
 * This component is positioned off-screen and used only for generating the final image.
 */
export const FullSizePostRenderer = forwardRef<HTMLDivElement, FullSizePostRendererProps>(
  ({ content, templateType, bgVariant, slideNumber = 1 }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '1080px',
          height: '1350px',
          overflow: 'hidden',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      >
        <div style={{ width: '1080px', height: '1350px' }}>
          <PostPreview
            content={{
              headline: content.headline || '',
              subheadline: content.subheadline || '',
              bullets: content.bullets || [],
              cta: content.cta || '',
            }}
            templateType={templateType}
            slideNumber={slideNumber}
            bgVariant={bgVariant}
            className="w-full h-full !rounded-none"
          />
        </div>
      </div>
    );
  }
);

FullSizePostRenderer.displayName = 'FullSizePostRenderer';
