import { TikTokAnalyticsDashboard } from './TikTokAnalyticsDashboard';
import { TikTokEnvironmentToggle } from './TikTokEnvironmentToggle';

export function SocialMonitoringTab() {
  return (
    <div className="space-y-6">
      {/* TikTok Environment Toggle */}
      <TikTokEnvironmentToggle />

      {/* TikTok Analytics */}
      <TikTokAnalyticsDashboard />
    </div>
  );
}
