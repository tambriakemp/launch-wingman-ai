import { ReactNode } from 'react';
import { PostPreview, BackgroundVariant, GeneratedContent } from './PostPreview';

interface MockupPostPreviewProps {
  content: GeneratedContent;
  templateType: string;
  slideNumber?: number;
  bgVariant?: BackgroundVariant;
  className?: string;
  /** For full-size render (1080x1350 post inside larger canvas) */
  fullSize?: boolean;
}

export const MockupPostPreview = ({
  content,
  templateType,
  slideNumber = 1,
  bgVariant = 'dark',
  className = '',
  fullSize = false,
}: MockupPostPreviewProps) => {
  // Full size dimensions for capture: larger canvas to fit mockup frame
  // Post is 1080x1350, mockup adds ~120px padding and ~60px header
  const canvasWidth = fullSize ? 1320 : undefined;
  const canvasHeight = fullSize ? 1550 : undefined;
  
  // Scaling for the dots and text in full-size mode
  const dotSize = fullSize ? 'w-4 h-4' : 'w-3 h-3';
  const headerPadding = fullSize ? 'px-8 py-5' : 'px-4 py-3';
  const urlTextSize = fullSize ? 'text-base px-6 py-2' : 'text-xs px-4 py-1';
  const contentPadding = fullSize ? 'p-[60px]' : 'p-6';

  return (
    <div 
      className={`bg-[#f5f5f5] overflow-hidden ${className}`}
      style={{
        width: fullSize ? `${canvasWidth}px` : '100%',
        height: fullSize ? `${canvasHeight}px` : 'auto',
        aspectRatio: fullSize ? undefined : '1320 / 1550',
      }}
    >
      {/* Browser Frame */}
      <div 
        className={`h-full flex flex-col ${contentPadding}`}
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-black/10 flex-1 flex flex-col bg-white">
          {/* Browser Header */}
          <div className={`bg-[#e8e8e8] ${headerPadding} flex items-center gap-3 border-b border-black/10`}>
            <div className="flex gap-2">
              <div className={`${dotSize} rounded-full bg-[#ff5f57]`} />
              <div className={`${dotSize} rounded-full bg-[#febc2e]`} />
              <div className={`${dotSize} rounded-full bg-[#28c840]`} />
            </div>
            <div className="flex-1 flex justify-center">
              <div className={`bg-white rounded-lg ${urlTextSize} text-[#666666] font-medium`}>
                app.launchely.com
              </div>
            </div>
            <div className="w-20" />
          </div>
          
          {/* Browser Content - Post Preview */}
          <div className="flex-1 flex items-center justify-center bg-white p-4">
            <PostPreview
              content={content}
              templateType={templateType}
              slideNumber={slideNumber}
              bgVariant={bgVariant}
              className={fullSize ? '!w-[1080px] !h-[1350px] !rounded-xl !aspect-auto shadow-lg' : 'w-full max-w-[280px] rounded-lg shadow-lg'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};