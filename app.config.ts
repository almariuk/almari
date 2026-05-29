import { ExpoConfig, ConfigContext } from 'expo/config';

// splash is a valid Expo config key but missing from ExpoConfig typedefs in SDK 56
type ExpoConfigWithSplash = ExpoConfig & {
  splash?: { image?: string; resizeMode?: string; backgroundColor?: string }
}

export default ({ config }: ConfigContext): ExpoConfigWithSplash => ({
  ...config,
  name: process.env.EXPO_PUBLIC_BRAND_NAME ?? 'Almari',
  slug: 'almari',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/almari-icon-1024.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/almari-icon-1024.png',
    resizeMode: 'contain',
    backgroundColor: '#0D1B3E',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'uk.almari.app',
    icon: './assets/almari-icon-1024.png',
  },
  android: {
    package: 'uk.almari.app',
    adaptiveIcon: {
      foregroundImage: './assets/almari-icon-1024.png',
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
  extra: {
    eas: {
      projectId: 'f2e9ed0c-515e-4770-b6c4-013b76900029',
    },
  },
});
