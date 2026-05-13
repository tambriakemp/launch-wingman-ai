import type { CapacitorConfig } from '@capacitor/cli';

// Set CAP_DEV=true to point the native app at the Lovable preview URL
// (useful for live-iterating during development without a rebuild).
// Default (production / release builds) loads bundled `dist/` for offline support
// and to satisfy App Store guidelines.
const isDev = process.env.CAP_DEV === 'true';

const config: CapacitorConfig = {
  appId: 'com.launchely.app',
  appName: 'Launchely',
  webDir: 'dist',
  ...(isDev && {
    server: {
      url: 'https://d0ceac0b-3c74-4055-98f1-72d36eaf2f91.lovableproject.com?forceHideBadge=true',
    },
  }),
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
