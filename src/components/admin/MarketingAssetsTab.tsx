import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Loader2, Package, Image as ImageIcon, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { MotionConfig } from 'framer-motion';
import { ExternalAssetsSection } from './ExternalAssetsSection';

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

interface MockupConfig {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType;
}

const mockups: MockupConfig[] = [
  { id: 'dashboard', name: 'Dashboard', description: 'Main dashboard overview', component: DashboardMockup },
  { id: 'funnel-builder', name: 'Funnel Builder', description: 'Funnel type selection', component: FunnelBuilderMockup },
  { id: 'audience-builder', name: 'Audience Builder', description: 'Value equation builder', component: AudienceBuilderMockup },
  { id: 'transformation', name: 'Transformation', description: 'Transformation statements', component: TransformationMockup },
  { id: 'branding', name: 'Branding', description: 'Brand assets dashboard', component: BrandingMockup },
  { id: 'sales-copy', name: 'Sales Copy', description: 'AI-powered copy builder', component: SalesCopyMockup },
  { id: 'tasks', name: 'Tasks', description: 'Task management view', component: TasksMockup },
  { id: 'social-hub', name: 'Social Hub', description: 'Social media scheduling', component: SocialHubMockup },
  { id: 'insights', name: 'Insights', description: 'Marketing insights dashboard', component: InsightsMockup },
  { id: 'relaunch', name: 'Relaunch', description: 'Project relaunch wizard', component: RelaunchMockup },
  { id: 'content-vault', name: 'Content Vault', description: 'Resource library', component: ContentVaultMockup },
  { id: 'assessment', name: 'Assessment', description: 'Launch readiness quiz', component: AssessmentMockup },
  { id: 'messaging', name: 'Messaging', description: 'Social bio builder', component: MessagingMockup },
];

type Resolution = '1x' | '2x' | '3x';

// Theme CSS variables to inject for reliable capture
const THEME_VARIABLES: Record<string, string> = {
  '--background': '0 0% 100%',
  '--foreground': '240 10% 3.9%',
  '--card': '0 0% 100%',
  '--card-foreground': '240 10% 3.9%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '240 10% 3.9%',
  '--primary': '240 5.9% 10%',
  '--primary-foreground': '0 0% 98%',
  '--secondary': '240 4.8% 95.9%',
  '--secondary-foreground': '240 5.9% 10%',
  '--muted': '240 4.8% 95.9%',
  '--muted-foreground': '240 3.8% 46.1%',
  '--accent': '47 100% 50%',
  '--accent-foreground': '240 5.9% 10%',
  '--destructive': '0 84.2% 60.2%',
  '--destructive-foreground': '0 0% 98%',
  '--border': '240 5.9% 90%',
  '--input': '240 5.9% 90%',
  '--ring': '240 5.9% 10%',
  '--radius': '0.5rem',
};

export function MarketingAssetsTab() {
  const [resolution, setResolution] = useState<Resolution>('2x');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{
    dataUrl: string;
    mockupName: string;
    mockupId: string;
  } | null>(null);
  const mockupRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const getScale = (res: Resolution): number => {
    switch (res) {
      case '1x': return 1;
      case '2x': return 2;
      case '3x': return 3;
      default: return 2;
    }
  };

  const captureElement = useCallback(async (element: HTMLElement, scale: number): Promise<string> => {
    // Step 1: Wait for fonts to load
    await document.fonts.ready;
    
    // Step 2: Inject theme variables directly into element for reliable color resolution
    Object.entries(THEME_VARIABLES).forEach(([key, value]) => {
      element.style.setProperty(key, value);
    });
    
    // Step 3: Force layout calculation with multiple RAF cycles
    await new Promise<void>(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(resolve, 100);
          });
        });
      });
    });
    
    // Step 4: Capture with html-to-image
    return await toPng(element, {
      pixelRatio: scale,
      backgroundColor: '#ffffff',
      cacheBust: true,
      skipAutoScale: true,
      style: {
        visibility: 'visible',
        opacity: '1',
      },
    });
  }, []);

  const previewSingle = useCallback(async (mockup: MockupConfig) => {
    const element = mockupRefs.current.get(mockup.id);
    if (!element) {
      toast.error(`Could not find mockup element for ${mockup.name}`);
      return;
    }

    setPreviewing(mockup.id);
    try {
      const dataUrl = await captureElement(element, getScale(resolution));
      setPreviewData({
        dataUrl,
        mockupName: mockup.name,
        mockupId: mockup.id,
      });
    } catch (error) {
      console.error('Failed to preview mockup:', error);
      toast.error(`Failed to preview ${mockup.name}`);
    } finally {
      setPreviewing(null);
    }
  }, [resolution, captureElement]);

  const downloadSingle = useCallback(async (mockup: MockupConfig) => {
    const element = mockupRefs.current.get(mockup.id);
    if (!element) {
      toast.error(`Could not find mockup element for ${mockup.name}`);
      return;
    }

    setDownloading(mockup.id);
    try {
      const dataUrl = await captureElement(element, getScale(resolution));
      
      const link = document.createElement('a');
      link.download = `launchely-${mockup.id}-mockup-${resolution}.png`;
      link.href = dataUrl;
      link.click();

      toast.success(`Downloaded ${mockup.name} mockup`);
    } catch (error) {
      console.error('Failed to capture mockup:', error);
      toast.error(`Failed to download ${mockup.name}`);
    } finally {
      setDownloading(null);
    }
  }, [resolution, captureElement]);

  const downloadAll = useCallback(async () => {
    setDownloadingAll(true);
    const zip = new JSZip();
    const folder = zip.folder('launchely-mockups');
    
    if (!folder) {
      toast.error('Failed to create ZIP folder');
      setDownloadingAll(false);
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const mockup of mockups) {
      const element = mockupRefs.current.get(mockup.id);
      if (!element) {
        failCount++;
        continue;
      }

      try {
        const dataUrl = await captureElement(element, getScale(resolution));
        // Convert data URL to blob
        const base64Data = dataUrl.split(',')[1];
        folder.file(`launchely-${mockup.id}-mockup-${resolution}.png`, base64Data, { base64: true });
        successCount++;
      } catch (error) {
        console.error(`Failed to capture ${mockup.name}:`, error);
        failCount++;
      }
    }

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.download = `launchely-mockups-${resolution}.zip`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      if (failCount > 0) {
        toast.warning(`Downloaded ${successCount} mockups, ${failCount} failed`);
      } else {
        toast.success(`Downloaded all ${successCount} mockups as ZIP`);
      }
    } catch (error) {
      console.error('Failed to create ZIP:', error);
      toast.error('Failed to create ZIP file');
    } finally {
      setDownloadingAll(false);
    }
  }, [resolution, captureElement]);

  const setRef = useCallback((id: string, element: HTMLDivElement | null) => {
    if (element) {
      mockupRefs.current.set(id, element);
    } else {
      mockupRefs.current.delete(id);
    }
  }, []);

  const handleDownloadFromPreview = useCallback(() => {
    if (!previewData) return;
    
    const link = document.createElement('a');
    link.download = `launchely-${previewData.mockupId}-mockup-${resolution}.png`;
    link.href = previewData.dataUrl;
    link.click();
    toast.success(`Downloaded ${previewData.mockupName} mockup`);
  }, [previewData, resolution]);

  return (
    <div className="space-y-6">
      {/* External Assets */}
      <ExternalAssetsSection />

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Marketing Assets
              </CardTitle>
              <CardDescription>
                Generate and download mockups for marketing materials
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Resolution:</span>
                <div className="flex gap-1">
                  {(['1x', '2x', '3x'] as Resolution[]).map((res) => (
                    <Button
                      key={res}
                      variant={resolution === res ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setResolution(res)}
                      className="w-10"
                    >
                      {res}
                    </Button>
                  ))}
                </div>
              </div>
              <Button
                onClick={downloadAll}
                disabled={downloadingAll}
                className="gap-2"
              >
                {downloadingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating ZIP...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4" />
                    Download All
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Mockups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockups.map((mockup) => {
          const MockupComponent = mockup.component;
          return (
            <Card key={mockup.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{mockup.name}</CardTitle>
                    <CardDescription className="text-xs">{mockup.description}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {resolution}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Visual Preview (scaled, clipped for UI) */}
                <div className="relative h-[200px] overflow-hidden border rounded-lg bg-background">
                  <div className="transform scale-[0.35] origin-top-left" style={{ width: '286%' }}>
                    <MockupComponent />
                  </div>
                </div>
                
                {/* Buttons Row */}
                <div className="flex gap-2">
                  {/* Preview Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => previewSingle(mockup)}
                    disabled={previewing === mockup.id || downloading === mockup.id || downloadingAll}
                  >
                    {previewing === mockup.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        Preview
                      </>
                    )}
                  </Button>
                  
                  {/* Download Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => downloadSingle(mockup)}
                    disabled={downloading === mockup.id || previewing === mockup.id || downloadingAll}
                  >
                    {downloading === mockup.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Capturing...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Hidden Capture Containers - wrapped in MotionConfig to disable animations */}
      <MotionConfig reducedMotion="always">
        <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
          {mockups.map((mockup) => {
            const MockupComponent = mockup.component;
            return (
              <div
                key={mockup.id}
                ref={(el) => setRef(mockup.id, el)}
                style={{ visibility: 'visible' }}
              >
                <MockupComponent />
              </div>
            );
          })}
        </div>
      </MotionConfig>

      {/* Preview Modal */}
      <Dialog open={!!previewData} onOpenChange={() => setPreviewData(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{previewData?.mockupName} Preview</DialogTitle>
          </DialogHeader>
          
          {previewData && (
            <div className="flex flex-col items-center gap-4">
              <div className="border rounded-lg overflow-hidden bg-white">
                <img 
                  src={previewData.dataUrl} 
                  alt={`${previewData.mockupName} preview`}
                  className="max-w-full h-auto"
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPreviewData(null)}>
                  Close
                </Button>
                <Button 
                  onClick={handleDownloadFromPreview}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PNG
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Info Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <ImageIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground mb-1">About Resolutions</p>
              <ul className="space-y-1">
                <li><strong>1x</strong> – Standard resolution, good for web and social media</li>
                <li><strong>2x</strong> – Retina resolution, recommended for most uses</li>
                <li><strong>3x</strong> – High resolution, best for print materials</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
