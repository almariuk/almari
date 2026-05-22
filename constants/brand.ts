export const Brand = {
  name: process.env.EXPO_PUBLIC_BRAND_NAME ?? 'Almari',
  tagline: process.env.EXPO_PUBLIC_BRAND_TAGLINE ?? 'From our cupboards to yours',
  primaryColour: process.env.EXPO_PUBLIC_BRAND_PRIMARY_COLOUR ?? '#0D1B3E',
  secondaryColour: process.env.EXPO_PUBLIC_BRAND_SECONDARY_COLOUR ?? '#C9953C',
  email: process.env.EXPO_PUBLIC_BRAND_EMAIL ?? 'reachalmari@gmail.com',
  domain: process.env.EXPO_PUBLIC_BRAND_DOMAIN ?? 'almari.uk',
} as const;
