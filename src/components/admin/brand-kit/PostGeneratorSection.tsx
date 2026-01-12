import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { 
  Sparkles, 
  AlertTriangle,
  Loader2,
  FileText,
  Layers,
  Check,
  Edit3,
  RefreshCw
} from 'lucide-react';
import { PostTemplateCard } from './PostTemplateCard';
import { PostContentEditor } from './PostContentEditor';
import { BackgroundVariant } from './PostPreview';

interface BrandSettings {
  id: string;
  brand_name: string;
  tagline: string;
  primary_color: string;
  secondary_color: string;
}

interface PostGeneratorSectionProps {
  brandSettings: BrandSettings | null | undefined;
  onPostGenerated: () => void;
}

interface GeneratedContent {
  headline: string;
  subheadline?: string;
  bullets?: string[];
  cta?: string;
}

const PLATFORMS = [
  { id: 'Instagram', name: 'Instagram' },
  { id: 'LinkedIn', name: 'LinkedIn' },
  { id: 'X', name: 'X (Twitter)' },
  { id: 'Facebook', name: 'Facebook' },
  { id: 'TikTok', name: 'TikTok' },
  { id: 'Pinterest', name: 'Pinterest' },
];

const TEMPLATE_TYPES = [
  { id: 'cover', name: 'Cover/Hook', description: 'Eye-catching opener with bold headline' },
  { id: 'content', name: 'Content Slide', description: 'Main point with supporting text' },
  { id: 'cta', name: 'CTA/Closing', description: 'Call-to-action with white card' },
  { id: 'problem', name: 'Problem/Why', description: '3-icon layout explaining pain points' },
  { id: 'tutorial', name: 'How-To/Tutorial', description: 'Annotated diagram breakdown' },
  { id: 'comparison', name: 'Before/After', description: 'Side-by-side comparison' },
  { id: 'checklist', name: 'Tips/Checklist', description: '3-card grid with actionable tips' },
];

export const PostGeneratorSection = ({ 
  brandSettings, 
  onPostGenerated 
}: PostGeneratorSectionProps) => {
  const { session } = useAuth();
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [templateType, setTemplateType] = useState('cover');
  const [carouselSlides, setCarouselSlides] = useState(1);
  const [generationStep, setGenerationStep] = useState<'input' | 'preview' | 'generating' | 'complete'>('input');
  const [previewContent, setPreviewContent] = useState<GeneratedContent | null>(null);
  const [generatedSlides, setGeneratedSlides] = useState<any[]>([]);
  const [bgVariant, setBgVariant] = useState<BackgroundVariant>('dark');

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ['post-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_templates')
        .select('*')
        .order('created_at');
      
      if (error) throw error;
      return data;
    },
  });

  // Generate content preview (without image)
  const previewMutation = useMutation({
    mutationFn: async () => {
      // Use generate-social-post edge function in preview mode
      const response = await supabase.functions.invoke('generate-social-post', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: {
          topic,
          platform,
          templateType,
          carouselSlides: carouselSlides > 1 ? carouselSlides : undefined,
          previewOnly: true // Only generate content, not images
        }
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      setPreviewContent(data.content || data);
      setGenerationStep('preview');
    },
    onError: (error) => {
      console.error('Preview error:', error);
      toast.error('Failed to generate content preview');
    }
  });

  // Generate full post with image
  const generateMutation = useMutation({
    mutationFn: async () => {
      setGenerationStep('generating');
      
      const { data, error } = await supabase.functions.invoke('generate-social-post', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: {
          topic,
          platform,
          templateType,
          carouselSlides: carouselSlides > 1 ? carouselSlides : undefined,
          customContent: previewContent,
          bgVariant
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setGeneratedSlides(data.slides || [data.post]);
      setGenerationStep('complete');
      toast.success('Post generated successfully!');
      onPostGenerated();
    },
    onError: (error) => {
      console.error('Generation error:', error);
      toast.error('Failed to generate post');
      setGenerationStep('preview');
    }
  });

  const handleReset = () => {
    setTopic('');
    setTemplateType('cover');
    setCarouselSlides(1);
    setPreviewContent(null);
    setGeneratedSlides([]);
    setGenerationStep('input');
  };

  const isMissingSettings = !brandSettings?.brand_name;

  return (
    <div className="space-y-6">
      {/* Warning if missing settings */}
      {isMissingSettings && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <p className="text-sm">
                Please configure brand settings in the "Brand Source" tab for best results.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <Badge variant={generationStep === 'input' ? 'default' : 'secondary'}>
          1. Topic & Style
        </Badge>
        <span className="text-muted-foreground">→</span>
        <Badge variant={generationStep === 'preview' ? 'default' : 'secondary'}>
          2. Preview Content
        </Badge>
        <span className="text-muted-foreground">→</span>
        <Badge variant={generationStep === 'generating' || generationStep === 'complete' ? 'default' : 'secondary'}>
          3. Generate Image
        </Badge>
      </div>

      {/* Step 1: Input */}
      {generationStep === 'input' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Topic & Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Post Details
              </CardTitle>
              <CardDescription>
                What would you like to create a post about?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic / Theme</Label>
                <Textarea
                  id="topic"
                  placeholder="e.g., Why every creator needs a launch plan, 5 signs you're ready to launch, Content calendar tips..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Carousel Slides</Label>
                  <Select 
                    value={carouselSlides.toString()} 
                    onValueChange={(v) => setCarouselSlides(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Single Post</SelectItem>
                      <SelectItem value="3">3 Slides</SelectItem>
                      <SelectItem value="5">5 Slides</SelectItem>
                      <SelectItem value="7">7 Slides</SelectItem>
                      <SelectItem value="10">10 Slides</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => previewMutation.mutate()}
                disabled={!topic.trim() || previewMutation.isPending}
              >
                {previewMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate Content Preview
              </Button>
            </CardContent>
          </Card>

          {/* Right: Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Post Style
              </CardTitle>
              <CardDescription>
                Select a layout style for your post
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {TEMPLATE_TYPES.map(type => (
                  <PostTemplateCard
                    key={type.id}
                    id={type.id}
                    name={type.name}
                    description={type.description}
                    isSelected={templateType === type.id}
                    onClick={() => setTemplateType(type.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Preview & Edit Content */}
      {generationStep === 'preview' && previewContent && (
        <PostContentEditor
          content={previewContent}
          onChange={setPreviewContent}
          onGenerate={() => generateMutation.mutate()}
          onBack={() => setGenerationStep('input')}
          isGenerating={generateMutation.isPending}
          templateType={templateType}
          platform={platform}
          carouselSlides={carouselSlides}
          bgVariant={bgVariant}
          onBgVariantChange={setBgVariant}
        />
      )}

      {/* Step 3: Generating */}
      {generationStep === 'generating' && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="py-8 space-y-4">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">Generating your post{carouselSlides > 1 ? 's' : ''}...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Creating {carouselSlides} slide{carouselSlides !== 1 ? 's' : ''} with AI-generated imagery
                </p>
              </div>
              <Progress value={33} className="w-64" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete */}
      {generationStep === 'complete' && generatedSlides.length > 0 && (
        <div className="space-y-4">
          <Card className="border-green-500 bg-green-500/10">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <p className="font-medium">
                  Successfully generated {generatedSlides.length} slide{generatedSlides.length !== 1 ? 's' : ''}!
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {generatedSlides.map((slide, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="aspect-[4/5] relative">
                  <img
                    src={slide.imageUrl}
                    alt={`Slide ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {generatedSlides.length > 1 && (
                    <Badge className="absolute top-2 left-2">
                      Slide {index + 1}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium line-clamp-2">
                    {slide.content?.headline}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Create Another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};