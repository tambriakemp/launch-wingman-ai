import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { FeatureUsage } from '@/hooks/useAdminPlatformStats';

interface FeatureUsageHeatmapProps {
  featureUsage: FeatureUsage;
}

interface FeatureItem {
  key: keyof FeatureUsage;
  label: string;
  category: string;
}

const featureConfig: FeatureItem[] = [
  { key: 'funnelBuilder', label: 'Funnel Builder', category: 'Planning' },
  { key: 'offers', label: 'Offers Created', category: 'Planning' },
  { key: 'launchEvents', label: 'Launch Events', category: 'Planning' },
  { key: 'brandingColors', label: 'Brand Colors', category: 'Branding' },
  { key: 'brandingFonts', label: 'Brand Fonts', category: 'Branding' },
  { key: 'brandingPhotos', label: 'Brand Photos', category: 'Branding' },
  { key: 'brandingLogos', label: 'Brand Logos', category: 'Branding' },
  { key: 'contentCalendar', label: 'Content Calendar', category: 'Content' },
  { key: 'contentIdeas', label: 'Content Ideas', category: 'Content' },
  { key: 'contentDrafts', label: 'Content Drafts', category: 'Content' },
  { key: 'scheduledPosts', label: 'Scheduled Posts', category: 'Content' },
  { key: 'socialBios', label: 'Social Bios', category: 'Content' },
  { key: 'salesPageCopy', label: 'Sales Page Copy', category: 'Tools' },
  { key: 'emailSequences', label: 'Email Sequences', category: 'Tools' },
  { key: 'deliverableCopy', label: 'Deliverable Copy', category: 'Tools' },
  { key: 'carousels', label: 'Carousels', category: 'Tools' },
  { key: 'aiStudioProjects', label: 'AI Projects', category: 'AI Avatar Studio' },
  { key: 'aiStudioEnvironments', label: 'AI Environments', category: 'AI Avatar Studio' },
  { key: 'campaigns', label: 'Campaigns', category: 'Marketing' },
  { key: 'utmLinks', label: 'UTM Links', category: 'Marketing' },
  { key: 'utmClicks', label: 'UTM Clicks', category: 'Marketing' },
  { key: 'campaignConversions', label: 'Conversions', category: 'Marketing' },
  { key: 'launchSnapshots', label: 'Launch Snapshots', category: 'Insights' },
  { key: 'metricUpdates', label: 'Metric Updates', category: 'Insights' },
  { key: 'checkIns', label: 'Check-ins', category: 'Engagement' },
  { key: 'contentVaultResources', label: 'Vault Resources', category: 'Engagement' },
];

const getHeatColor = (value: number, max: number): string => {
  if (max === 0) return 'bg-muted';
  const intensity = value / max;
  
  if (intensity === 0) return 'bg-muted';
  if (intensity < 0.2) return 'bg-emerald-100 dark:bg-emerald-950';
  if (intensity < 0.4) return 'bg-emerald-200 dark:bg-emerald-900';
  if (intensity < 0.6) return 'bg-emerald-300 dark:bg-emerald-800';
  if (intensity < 0.8) return 'bg-emerald-400 dark:bg-emerald-700';
  return 'bg-emerald-500 dark:bg-emerald-600';
};

const getTextColor = (value: number, max: number): string => {
  if (max === 0) return 'text-muted-foreground';
  const intensity = value / max;
  if (intensity >= 0.6) return 'text-white dark:text-white';
  return 'text-foreground';
};

export function FeatureUsageHeatmap({ featureUsage }: FeatureUsageHeatmapProps) {
  const values = Object.values(featureUsage);
  const maxValue = Math.max(...values, 1);
  
  // Group features by category
  const categories = featureConfig.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, FeatureItem[]>);

  // Sort features by usage within each category
  const sortedFeatures = [...featureConfig].sort((a, b) => 
    featureUsage[b.key] - featureUsage[a.key]
  );

  const topFeatures = sortedFeatures.slice(0, 3);
  const leastUsed = sortedFeatures.filter(f => featureUsage[f.key] === 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Feature Usage Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Most used: </span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {topFeatures[0]?.label} ({featureUsage[topFeatures[0]?.key]})
            </span>
          </div>
          {leastUsed.length > 0 && (
            <div>
              <span className="text-muted-foreground">Unused: </span>
              <span className="font-medium text-amber-600 dark:text-amber-400">
                {leastUsed.length} features
              </span>
            </div>
          )}
        </div>

        {/* Heatmap grid by category */}
        <div className="space-y-3">
          {Object.entries(categories).map(([category, features]) => (
            <div key={category}>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">{category}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {features.map((feature) => {
                  const value = featureUsage[feature.key];
                  return (
                    <div
                      key={feature.key}
                      className={`${getHeatColor(value, maxValue)} rounded-md p-2 transition-colors`}
                      title={`${feature.label}: ${value}`}
                    >
                      <p className={`text-xs font-medium truncate ${getTextColor(value, maxValue)}`}>
                        {feature.label}
                      </p>
                      <p className={`text-lg font-bold ${getTextColor(value, maxValue)}`}>
                        {value.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <span className="text-xs text-muted-foreground">Less</span>
          <div className="flex gap-0.5">
            <div className="w-4 h-4 rounded bg-muted" />
            <div className="w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-950" />
            <div className="w-4 h-4 rounded bg-emerald-200 dark:bg-emerald-900" />
            <div className="w-4 h-4 rounded bg-emerald-300 dark:bg-emerald-800" />
            <div className="w-4 h-4 rounded bg-emerald-400 dark:bg-emerald-700" />
            <div className="w-4 h-4 rounded bg-emerald-500 dark:bg-emerald-600" />
          </div>
          <span className="text-xs text-muted-foreground">More</span>
        </div>
      </CardContent>
    </Card>
  );
}
