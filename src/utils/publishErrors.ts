// Error categorization for social media publishing

export type PublishErrorCode = 
  | 'AUTH_EXPIRED'
  | 'RATE_LIMITED'
  | 'MEDIA_ERROR'
  | 'PERMISSION_DENIED'
  | 'CONTENT_VIOLATION'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export interface PublishResult {
  success: boolean;
  platform: string;
  postId?: string;
  url?: string;
  postedAt?: string;
  error?: string;
  errorCode?: PublishErrorCode;
}

export interface PublishResults {
  [platform: string]: PublishResult;
}

// Error patterns to detect and categorize
const ERROR_PATTERNS: Array<{ pattern: RegExp; code: PublishErrorCode }> = [
  { pattern: /token.*expir|expir.*token|unauthorized|auth.*fail|invalid.*token|access.*denied/i, code: 'AUTH_EXPIRED' },
  { pattern: /rate.*limit|too.*many.*request|throttl|quota/i, code: 'RATE_LIMITED' },
  { pattern: /media.*invalid|unsupported.*format|file.*too.*large|invalid.*image|invalid.*video|media.*error/i, code: 'MEDIA_ERROR' },
  { pattern: /permission.*denied|scope.*required|missing.*permission|not.*authorized/i, code: 'PERMISSION_DENIED' },
  { pattern: /content.*policy|violat|community.*guidelines|not.*allowed|blocked|spam|restricted/i, code: 'CONTENT_VIOLATION' },
  { pattern: /network|connection|timeout|fetch.*fail|dns|unreachable/i, code: 'NETWORK_ERROR' },
];

// Categorize an error message into an error code
export function categorizePublishError(error: unknown): PublishErrorCode {
  const message = error instanceof Error ? error.message : String(error);
  
  for (const { pattern, code } of ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return code;
    }
  }
  
  return 'UNKNOWN';
}

// Get user-friendly error message for an error code
export function getErrorMessage(errorCode: PublishErrorCode, platform: string): string {
  const platformName = formatPlatformName(platform);
  
  switch (errorCode) {
    case 'AUTH_EXPIRED':
      return `Your ${platformName} connection has expired. Please reconnect in Settings.`;
    case 'RATE_LIMITED':
      return `Too many posts to ${platformName}. Please wait a few minutes and try again.`;
    case 'MEDIA_ERROR':
      return `This media format isn't supported by ${platformName}. Try a different file.`;
    case 'PERMISSION_DENIED':
      return `We don't have permission to post to ${platformName}. Please reconnect your account.`;
    case 'CONTENT_VIOLATION':
      return `${platformName} rejected this post. Please review their content guidelines.`;
    case 'NETWORK_ERROR':
      return `Couldn't reach ${platformName}. Check your connection and try again.`;
    case 'UNKNOWN':
    default:
      return `Something went wrong posting to ${platformName}. Please try again.`;
  }
}

// Get action button label for an error code
export function getErrorAction(errorCode: PublishErrorCode): string | null {
  switch (errorCode) {
    case 'AUTH_EXPIRED':
    case 'PERMISSION_DENIED':
      return 'Reconnect Account';
    case 'MEDIA_ERROR':
      return 'Change Media';
    case 'CONTENT_VIOLATION':
      return 'Edit Content';
    case 'RATE_LIMITED':
    case 'NETWORK_ERROR':
    case 'UNKNOWN':
    default:
      return 'Retry';
  }
}

// Format platform name for display
export function formatPlatformName(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return 'Instagram';
    case 'facebook':
      return 'Facebook';
    case 'pinterest':
      return 'Pinterest';
    case 'tiktok':
    case 'tiktok_sandbox':
      return 'TikTok';
    case 'threads':
      return 'Threads';
    default:
      return platform.charAt(0).toUpperCase() + platform.slice(1);
  }
}

// Calculate overall publish status from results
export type OverallStatus = 'posted' | 'partial' | 'failed';

export function getOverallStatus(results: PublishResults): OverallStatus {
  const platforms = Object.keys(results);
  if (platforms.length === 0) return 'failed';
  
  const successCount = platforms.filter(p => results[p].success).length;
  
  if (successCount === platforms.length) return 'posted';
  if (successCount > 0) return 'partial';
  return 'failed';
}

// Get summary text for publish results
export function getResultsSummary(results: PublishResults): string {
  const platforms = Object.keys(results);
  const successCount = platforms.filter(p => results[p].success).length;
  const failCount = platforms.length - successCount;
  
  if (successCount === platforms.length) {
    return `Successfully posted to ${successCount} platform${successCount > 1 ? 's' : ''}`;
  }
  
  if (successCount === 0) {
    return `Failed to post to ${failCount} platform${failCount > 1 ? 's' : ''}`;
  }
  
  return `Posted to ${successCount} platform${successCount > 1 ? 's' : ''}, ${failCount} failed`;
}
