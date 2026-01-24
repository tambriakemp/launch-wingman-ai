import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, Package, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';

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

// Log to debug if components are loaded correctly
console.log('Mockup components loaded:', {
  DashboardMockup: typeof DashboardMockup,
  FunnelBuilderMockup: typeof FunnelBuilderMockup,
  AudienceBuilderMockup: typeof AudienceBuilderMockup,
  TransformationMockup: typeof TransformationMockup,
  BrandingMockup: typeof BrandingMockup,
  SalesCopyMockup: typeof SalesCopyMockup,
  TasksMockup: typeof TasksMockup,
  SocialHubMockup: typeof SocialHubMockup,
  InsightsMockup: typeof InsightsMockup,
  RelaunchMockup: typeof RelaunchMockup,
  ContentVaultMockup: typeof ContentVaultMockup,
  AssessmentMockup: typeof AssessmentMockup,
  MessagingMockup: typeof MessagingMockup,
});

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

export function MarketingAssetsTab() {
  const [resolution, setResolution] = useState<Resolution>('2x');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
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
    // Wait for any animations to settle
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return await toPng(element, {
      pixelRatio: scale,
      backgroundColor: '#ffffff',
      cacheBust: true,
    });
  }, []);

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

  return (
    <div className="space-y-6">
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
                
                {/* Hidden Full-Size Capture Container (off-screen) */}
                <div
                  ref={(el) => setRef(mockup.id, el)}
                  className="fixed -left-[9999px] top-0 pointer-events-none"
                  aria-hidden="true"
                >
                  <MockupComponent />
                </div>
                
                {/* Download Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => downloadSingle(mockup)}
                  disabled={downloading === mockup.id || downloadingAll}
                >
                  {downloading === mockup.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Capturing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download PNG
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
