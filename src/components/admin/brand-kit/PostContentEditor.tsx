import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Sparkles, 
  Edit3,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { PostPreview } from './PostPreview';

interface GeneratedContent {
  headline: string;
  subheadline?: string;
  bullets?: string[];
  cta?: string;
}

interface PostContentEditorProps {
  content: GeneratedContent;
  onChange: (content: GeneratedContent) => void;
  onGenerate: () => void;
  onBack: () => void;
  isGenerating: boolean;
  templateType: string;
  platform: string;
  carouselSlides: number;
}

export const PostContentEditor = ({
  content,
  onChange,
  onGenerate,
  onBack,
  isGenerating,
  templateType,
  platform,
  carouselSlides
}: PostContentEditorProps) => {
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
          <CardContent>
            <PostPreview
              content={{
                headline: content.headline || 'Your headline here',
                subheadline: content.subheadline || '',
                bullets: content.bullets || [],
                cta: content.cta || ''
              }}
              templateType={templateType}
              slideNumber={1}
              className="max-w-[280px] mx-auto"
            />
            <p className="text-xs text-muted-foreground text-center mt-3">
              Preview updates as you type
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Generate Button */}
      <div className="flex justify-end gap-3">
        <Button
          size="lg"
          onClick={onGenerate}
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
    </div>
  );
};