import { useRef, useCallback, useState } from 'react';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  Sparkles, 
  Edit3,
  Loader2,
  Image as ImageIcon,
  Monitor
} from 'lucide-react';
import { PostPreview, BackgroundVariant } from './PostPreview';
import { MockupPostPreview } from './MockupPostPreview';
import { cn } from '@/lib/utils';

interface GeneratedContent {
  headline: string;
  subheadline?: string;
  bullets?: string[];
  cta?: string;
}

interface PostContentEditorProps {
  content: GeneratedContent;
  onChange: (content: GeneratedContent) => void;
  onGenerate: (imageBase64: string) => void;
  onBack: () => void;
  isGenerating: boolean;
  templateType: string;
  platform: string;
  carouselSlides: number;
  bgVariant: BackgroundVariant;
  onBgVariantChange: (variant: BackgroundVariant) => void;
}

const BG_OPTIONS: { id: BackgroundVariant; label: string; color: string; textColor: string }[] = [
  { id: 'dark', label: 'Dark', color: '#1a1918', textColor: 'white' },
  { id: 'light', label: 'White', color: '#ffffff', textColor: '#1a1918' },
  { id: 'gold', label: 'Gold', color: '#f5c243', textColor: '#1a1918' },
];

export const PostContentEditor = ({
  content,
  onChange,
  onGenerate,
  onBack,
  isGenerating,
  templateType,
  platform,
  carouselSlides,
  bgVariant,
  onBgVariantChange
}: PostContentEditorProps) => {
  const fullSizeRef = useRef<HTMLDivElement>(null);
  const [useMockup, setUseMockup] = useState(false);
  
  // Dimensions change based on mockup mode
  const captureWidth = useMockup ? 1320 : 1080;
  const captureHeight = useMockup ? 1550 : 1350;

  const updateField = (field: keyof GeneratedContent, value: any) => {
    onChange({ ...content, [field]: value });
  };

  const updateBullet = (index: number, value: string) => {
    const newBullets = [...(content.bullets || [])];
    newBullets[index] = value;
    onChange({ ...content, bullets: newBullets });
  };

  const addBullet = () => {
    onChange({ ...content, bullets: [...(content.bullets || []), ''] });
  };

  const removeBullet = (index: number) => {
    const newBullets = (content.bullets || []).filter((_, i) => i !== index);
    onChange({ ...content, bullets: newBullets });
  };

  const handleGenerate = useCallback(async () => {
    if (!fullSizeRef.current) {
      console.error('Full size ref not attached');
      return;
    }

    try {
      console.log(`Capturing post image at ${captureWidth}x${captureHeight}...`);
      
      const dataUrl = await toPng(fullSizeRef.current, {
        width: captureWidth,
        height: captureHeight,
        pixelRatio: 1,
        cacheBust: true,
        skipAutoScale: true,
      });

      console.log('Image captured successfully, size:', dataUrl.length);
      onGenerate(dataUrl);
    } catch (error) {
      console.error('Failed to capture post image:', error);
    }
  }, [onGenerate, captureWidth, captureHeight]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} disabled={isGenerating}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Topic
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{platform}</Badge>
          <Badge variant="outline">{templateType}</Badge>
          {carouselSlides > 1 && (
            <Badge variant="outline">{carouselSlides} slides</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Content Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Edit Content
            </CardTitle>
            <CardDescription>
              Review and edit the AI-generated content before creating the image
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                value={content.headline}
                onChange={(e) => updateField('headline', e.target.value)}
                placeholder="Bold headline text"
              />
              <p className="text-xs text-muted-foreground">
                Keep it punchy: 4-7 words work best
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subheadline">Subheadline</Label>
              <Textarea
                id="subheadline"
                value={content.subheadline || ''}
                onChange={(e) => updateField('subheadline', e.target.value)}
                placeholder="Supporting text"
                rows={2}
              />
            </div>

            {/* Bullet Points */}
            {(content.bullets && content.bullets.length > 0) && (
              <div className="space-y-2">
                <Label>Key Points</Label>
                <div className="space-y-2">
                  {content.bullets.map((bullet, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={bullet}
                        onChange={(e) => updateBullet(index, e.target.value)}
                        placeholder={`Point ${index + 1}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBullet(index)}
                        className="flex-shrink-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={addBullet}>
                  + Add Point
                </Button>
              </div>
            )}

            {content.cta && (
              <div className="space-y-2">
                <Label htmlFor="cta">Call to Action</Label>
                <Input
                  id="cta"
                  value={content.cta}
                  onChange={(e) => updateField('cta', e.target.value)}
                  placeholder="e.g., Learn more, Get started"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Live Preview
            </CardTitle>
            <CardDescription>
              Real-time preview of your post design
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Background Color Selector */}
            <div className="space-y-2">
              <Label>Background Color</Label>
              <div className="flex gap-2">
                {BG_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => onBgVariantChange(opt.id)}
                    className={cn(
                      "flex-1 h-10 rounded-lg border-2 transition-all flex items-center justify-center text-xs font-medium",
                      bgVariant === opt.id 
                        ? "border-primary ring-2 ring-primary/20" 
                        : "border-border hover:border-primary/50"
                    )}
                    style={{ 
                      backgroundColor: opt.color,
                      color: opt.textColor
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mockup Toggle */}
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="mockup-toggle" className="text-sm font-normal cursor-pointer">
                  Add browser mockup frame
                </Label>
              </div>
              <Switch
                id="mockup-toggle"
                checked={useMockup}
                onCheckedChange={setUseMockup}
              />
            </div>

            {/* Preview - conditionally render mockup or regular */}
            {useMockup ? (
              <MockupPostPreview
                content={{
                  headline: content.headline || 'Your headline here',
                  subheadline: content.subheadline || '',
                  bullets: content.bullets || [],
                  cta: content.cta || ''
                }}
                templateType={templateType}
                slideNumber={1}
                bgVariant={bgVariant}
                className="w-full max-w-md mx-auto rounded-lg overflow-hidden"
              />
            ) : (
              <PostPreview
                content={{
                  headline: content.headline || 'Your headline here',
                  subheadline: content.subheadline || '',
                  bullets: content.bullets || [],
                  cta: content.cta || ''
                }}
                templateType={templateType}
                slideNumber={1}
                bgVariant={bgVariant}
                className="w-full max-w-md mx-auto"
              />
            )}
            <p className="text-xs text-muted-foreground text-center mt-3">
              Preview updates as you type • {useMockup ? '1320×1550px' : '1080×1350px'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Generate Button */}
      <div className="flex justify-end gap-3">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={isGenerating || !content.headline}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Generate {carouselSlides > 1 ? `${carouselSlides} Slides` : 'Post Image'}
        </Button>
      </div>

      {/* Hidden full-size renderer for capture */}
      <div
        ref={fullSizeRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: `${captureWidth}px`,
          height: `${captureHeight}px`,
          overflow: 'hidden',
          zIndex: -1,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        {useMockup ? (
          <MockupPostPreview
            content={{
              headline: content.headline || 'Your headline here',
              subheadline: content.subheadline || '',
              bullets: content.bullets || [],
              cta: content.cta || ''
            }}
            templateType={templateType}
            slideNumber={1}
            bgVariant={bgVariant}
            fullSize
          />
        ) : (
          <PostPreview
            content={{
              headline: content.headline || 'Your headline here',
              subheadline: content.subheadline || '',
              bullets: content.bullets || [],
              cta: content.cta || ''
            }}
            templateType={templateType}
            slideNumber={1}
            bgVariant={bgVariant}
            className="!w-[1080px] !h-[1350px] !rounded-none !aspect-auto"
          />
        )}
      </div>
    </div>
  );
};
