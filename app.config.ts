import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: process.env.EXPO_PUBLIC_BRAND_NAME ?? 'Almari',
  slug: 'almari',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'uk.almari.app',
  },
  android: {
    package: 'uk.almari.app',
    adaptiveIcon: {
      backgroundColor: process.env.EXPO_PUBLIC_BRAND_PRIMARY_COLOUR ?? '#0D1B3E',
    },
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-image-picker',
      {
        photosPermission: 'Almari needs access to your photos to add listing images.',
        cameraPermission: 'Almari needs access to your camera to take listing photos.',
      },
    ],
  ],
  scheme: 'almari',
  experiments: {
    typedRoutes: true,
  },
});
