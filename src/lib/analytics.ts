import ReactGA from 'react-ga4';

// Initialize Google Analytics
export const initGA = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (measurementId) {
    ReactGA.initialize(measurementId);
    console.log('Google Analytics initialized');
  }
};

// Track page views
export const trackPageView = (path: string) => {
  ReactGA.send({ hitType: 'pageview', page: path });
};

// Generic event tracking
export const trackEvent = (category: string, action: string, label?: string, value?: number) => {
  ReactGA.event({
    category,
    action,
    label,
    value,
  });
};

// Set user ID for authenticated users
export const setUserId = (userId: string) => {
  ReactGA.set({ userId });
};

// Clear user ID on logout
export const clearUserId = () => {
  ReactGA.set({ userId: undefined });
};

// Auth events
export const trackLogin = (method: string = 'email') => {
  trackEvent('Authentication', 'login', method);
};

export const trackSignup = (method: string = 'email') => {
  trackEvent('Authentication', 'signup', method);
};

export const trackLogout = () => {
  trackEvent('Authentication', 'logout');
};

// Content generation events
export const trackContentGeneration = (contentType: string) => {
  trackEvent('Content', 'generate', contentType);
};

// Task events
export const trackTaskCompletion = (taskName: string) => {
  trackEvent('Task', 'complete', taskName);
};

export const trackTaskStart = (taskName: string) => {
  trackEvent('Task', 'start', taskName);
};

// Project events
export const trackProjectCreation = (projectName: string) => {
  trackEvent('Project', 'create', projectName);
};

// AI feature events
export const trackAIAssist = (feature: string) => {
  trackEvent('AI', 'assist', feature);
};

export const trackTimelineSuggestion = (action: 'generate' | 'accept' | 'regenerate') => {
  trackEvent('Timeline', 'suggestion', action);
};

// Social post events
export const trackSocialPostPublish = (platform: string, postType?: string) => {
  trackEvent('Social', 'publish', postType ? `${platform}_${postType}` : platform);
};

export const trackSocialPostSchedule = (platform: string) => {
  trackEvent('Social', 'schedule', platform);
};

export const trackSocialPostScheduleCancel = (platform: string) => {
  trackEvent('Social', 'schedule_cancel', platform);
};
