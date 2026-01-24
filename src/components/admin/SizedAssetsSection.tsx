import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, Loader2, ImagePlus, Square, RectangleVertical, RectangleHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { SizedMockupFrame, SIZE_PRESETS, type SizePreset } from './SizedMockupFrame';

// Import all mockup components
import { DashboardMockup } from '@/components/landing/screenshots/DashboardMockup';
import { FunnelBuilderMockup } from '@/components/landing/screenshots/FunnelBuilderMockup';
import { AudienceBuilderMockup } from '@/components/landing/screenshots/AudienceBuilderMockup';
import { TransformationMockup } from '@/components/landing/screenshots/TransformationMockup';
import { BrandingMockup } from '@/components/landing/screenshots/BrandingMockup';
import { SalesCopyMockup } from '@/components/landing/screenshots/SalesCopyMockup';
import { TasksMockup } from '@/components/landing/screenshots/TasksMockup';
import { SocialHubMockup } from '@/components/landing/screenshots/SocialHubMockup';
import { InsightsMockup } from '@/components/landing/screenshots/InsightsMockup';
import { RelaunchMockup } from '@/components/landing/screenshots/RelaunchMockup';
import { ContentVaultMockup } from '@/components/landing/screenshots/ContentVaultMockup';
import { AssessmentMockup } from '@/components/landing/screenshots/AssessmentMockup';
import { MessagingMockup } from '@/components/landing/screenshots/MessagingMockup';

interface MockupOption {
  id: string;
  name: string;
  component: React.ComponentType;
}

const mockupOptions: MockupOption[] = [
  { id: 'dashboard', name: 'Dashboard', component: DashboardMockup },
  { id: 'funnel-builder', name: 'Funnel Builder', component: FunnelBuilderMockup },
  { id: 'audience-builder', name: 'Audience Builder', component: AudienceBuilderMockup },
  { id: 'transformation', name: 'Transformation', component: TransformationMockup },
  { id: 'branding', name: 'Branding', component: BrandingMockup },
  { id: 'sales-copy', name: 'Sales Copy', component: SalesCopyMockup },
  { id: 'tasks', name: 'Tasks', component: TasksMockup },
  { id: 'social-hub', name: 'Social Hub', component: SocialHubMockup },
  { id: 'insights', name: 'Insights', component: InsightsMockup },
  { id: 'relaunch', name: 'Relaunch', component: RelaunchMockup },
  { id: 'content-vault', name: 'Content Vault', component: ContentVaultMockup },
  { id: 'assessment', name: 'Assessment', component: AssessmentMockup },
  { id: 'messaging', name: 'Messaging', component: MessagingMockup },
];

const getSizeIcon = (sizeId: string) => {
  switch (sizeId) {
    case 'square':
      return Square;
    case 'story':
      return RectangleVertical;
    case 'landscape':
      return RectangleHorizontal;
    default:
      return Square;
  }
};

export function SizedAssetsSection() {
  const [selectedSize, setSelectedSize] = useState<string>('square');
  const [selectedMockups, setSelectedMockups] = useState<Set<string>>(new Set(['dashboard']));
  const [showLogo, setShowLogo] = useState(true);
  const [showTagline, setShowTagline] = useState(true);
  const [gradientOverlay, setGradientOverlay] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMockup, setPreviewMockup] = useState<string>('dashboard');
  
  const captureRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const currentSize = SIZE_PRESETS.find(s => s.id === selectedSize) || SIZE_PRESETS[0];

  const toggleMockup = (mockupId: string) => {
    const newSelected = new Set(selectedMockups);
    if (newSelected.has(mockupId)) {
      newSelected.delete(mockupId);
    } else {
      newSelected.add(mockupId);
    }
    setSelectedMockups(newSelected);
    
    // Update preview to show one of the selected mockups
    if (newSelected.size > 0 && !newSelected.has(previewMockup)) {
      setPreviewMockup(Array.from(newSelected)[0]);
    }
  };

  const selectAll = () => {
    setSelectedMockups(new Set(mockupOptions.map(m => m.id)));
  };

  const selectNone = () => {
    setSelectedMockups(new Set());
  };

  const setRef = useCallback((id: string, element: HTMLDivElement | null) => {
    if (element) {
      captureRefs.current.set(id, element);
    } else {
      captureRefs.current.delete(id);
    }
  }, []);

  const generateAssets = async () => {
    if (selectedMockups.size === 0) {
      toast.error('Please select at least one mockup');
      return;
    }

    setIsGenerating(true);

    try {
      const zip = new JSZip();
      const folder = zip.folder(`launchely-${currentSize.id}-assets`);
      
      if (!folder) {
        toast.error('Failed to create ZIP folder');
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const mockupId of selectedMockups) {
        const element = captureRefs.current.get(mockupId);
        if (!element) {
          failCount++;
          continue;
        }

        try {
          // Wait for render
          await new Promise(resolve => setTimeout(resolve, 150));

          const dataUrl = await toPng(element, {
            width: currentSize.width,
            height: currentSize.height,
            backgroundColor: '#ffffff',
            cacheBust: true,
            pixelRatio: 1,
          });

          const base64Data = dataUrl.split(',')[1];
          folder.file(`launchely-${mockupId}-${currentSize.width}x${currentSize.height}.png`, base64Data, { base64: true });
          successCount++;
        } catch (error) {
          console.error(`Failed to capture ${mockupId}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.download = `launchely-${currentSize.id}-assets-${currentSize.width}x${currentSize.height}.zip`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);

        if (failCount > 0) {
          toast.warning(`Downloaded ${successCount} assets, ${failCount} failed`);
        } else {
          toast.success(`Downloaded ${successCount} sized assets`);
        }
      } else {
        toast.error('Failed to generate any assets');
      }
    } catch (error) {
      console.error('Failed to generate assets:', error);
      toast.error('Failed to generate assets');
    } finally {
      setIsGenerating(false);
    }
  };

  const PreviewMockupComponent = mockupOptions.find(m => m.id === previewMockup)?.component;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ImagePlus className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Generate Sized Assets</CardTitle>
            <CardDescription>
              Create mockups optimized for social media at specific dimensions
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Size Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Select Size</Label>
          <RadioGroup
            value={selectedSize}
            onValueChange={setSelectedSize}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            {SIZE_PRESETS.map((size) => {
              const Icon = getSizeIcon(size.id);
              return (
                <Label
                  key={size.id}
                  htmlFor={size.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedSize === size.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value={size.id} id={size.id} className="sr-only" />
                  <Icon className={`h-8 w-8 ${selectedSize === size.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="flex-1">
                    <p className="font-medium">{size.name}</p>
                    <p className="text-xs text-muted-foreground">{size.width}×{size.height}</p>
                    <p className="text-xs text-muted-foreground">{size.description}</p>
                  </div>
                </Label>
              );
            })}
          </RadioGroup>
        </div>

        {/* Mockup Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Select Mockups</Label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>Select All</Button>
              <Button variant="ghost" size="sm" onClick={selectNone}>Clear</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {mockupOptions.map((mockup) => (
              <Label
                key={mockup.id}
                className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all text-sm ${
                  selectedMockups.has(mockup.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Checkbox
                  checked={selectedMockups.has(mockup.id)}
                  onCheckedChange={() => toggleMockup(mockup.id)}
                />
                <span className="truncate">{mockup.name}</span>
              </Label>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedMockups.size} mockup{selectedMockups.size !== 1 ? 's' : ''} selected
          </p>
        </div>

        {/* Branding Options */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Branding Options</Label>
          <div className="flex flex-wrap gap-4">
            <Label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={showLogo} onCheckedChange={(checked) => setShowLogo(checked === true)} />
              <span>Include Logo</span>
            </Label>
            <Label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={showTagline} onCheckedChange={(checked) => setShowTagline(checked === true)} />
              <span>Include Tagline</span>
            </Label>
            <Label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={gradientOverlay} onCheckedChange={(checked) => setGradientOverlay(checked === true)} />
              <span>Gradient Overlay</span>
            </Label>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Preview</Label>
            <Badge variant="secondary">{currentSize.width}×{currentSize.height}</Badge>
          </div>
          
          {/* Preview Mockup Selector */}
          {selectedMockups.size > 1 && (
            <div className="flex gap-2 flex-wrap">
              {Array.from(selectedMockups).map((mockupId) => {
                const mockup = mockupOptions.find(m => m.id === mockupId);
                if (!mockup) return null;
                return (
                  <Button
                    key={mockupId}
                    variant={previewMockup === mockupId ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMockup(mockupId)}
                  >
                    {mockup.name}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Scaled Preview Container */}
          <div className="border rounded-lg p-4 bg-muted/30 overflow-auto">
            <div 
              className="mx-auto"
              style={{
                width: `${currentSize.width * 0.25}px`,
                height: `${currentSize.height * 0.25}px`,
                maxWidth: '100%',
              }}
            >
              <div
                style={{
                  transform: 'scale(0.25)',
                  transformOrigin: 'top left',
                  width: `${currentSize.width}px`,
                  height: `${currentSize.height}px`,
                }}
              >
                {PreviewMockupComponent && (
                  <SizedMockupFrame
                    width={currentSize.width}
                    height={currentSize.height}
                    showLogo={showLogo}
                    showTagline={showTagline}
                    gradientOverlay={gradientOverlay}
                  >
                    <PreviewMockupComponent />
                  </SizedMockupFrame>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateAssets}
          disabled={isGenerating || selectedMockups.size === 0}
          className="w-full gap-2"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating {selectedMockups.size} asset{selectedMockups.size !== 1 ? 's' : ''}...
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              Generate {selectedMockups.size} Asset{selectedMockups.size !== 1 ? 's' : ''} ({currentSize.width}×{currentSize.height})
            </>
          )}
        </Button>

        {/* Hidden Capture Containers */}
        <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
          {Array.from(selectedMockups).map((mockupId) => {
            const mockup = mockupOptions.find(m => m.id === mockupId);
            if (!mockup) return null;
            const MockupComponent = mockup.component;
            return (
              <div
                key={mockupId}
                ref={(el) => setRef(mockupId, el)}
                style={{ width: `${currentSize.width}px`, height: `${currentSize.height}px` }}
              >
                <SizedMockupFrame
                  width={currentSize.width}
                  height={currentSize.height}
                  showLogo={showLogo}
                  showTagline={showTagline}
                  gradientOverlay={gradientOverlay}
                >
                  <MockupComponent />
                </SizedMockupFrame>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
