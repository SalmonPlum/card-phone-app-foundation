import type { ExpoConfig } from 'expo/config';

// Temporary identity; replace this together with production deck branding.
const config: ExpoConfig = {
  name: 'Temporary Card Foundation',
  slug: 'temporary-card-foundation',
  version: '0.1.0',
  scheme: 'temporarycards',
  orientation: 'portrait',
  platforms: ['android', 'ios'],
  userInterfaceStyle: 'light',
  experiments: { typedRoutes: true },
  android: {
    package: 'com.example.temporarycards',
  },
  ios: {
    bundleIdentifier: 'com.example.temporarycards',
    supportsTablet: false,
  },
  plugins: [
    'expo-router',
    [
      'expo-localization',
      { supportedLocales: ['cs', 'en'], supportsRTL: false },
    ],
  ],
};

export default config;
