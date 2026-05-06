import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d0ceac0b3c74405598f172d36eaf2f91',
  appName: 'launch-wingman-ai',
  webDir: 'dist',
  server: {
    url: 'https://d0ceac0b-3c74-4055-98f1-72d36eaf2f91.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
