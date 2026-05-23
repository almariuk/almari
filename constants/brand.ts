export const Brand = {
  name: process.env.EXPO_PUBLIC_BRAND_NAME ?? 'Almari',
  tagline: process.env.EXPO_PUBLIC_BRAND_TAGLINE ?? 'From our cupboards to yours',
  logoTagline: process.env.EXPO_PUBLIC_BRAND_LOGO_TAGLINE ?? 'Celebrating well-loved and cultural attire',
  scriptTagline: process.env.EXPO_PUBLIC_BRAND_SCRIPT_TAGLINE ?? 'Curating Memories, Preserving Heritage',
  primaryColour: process.env.EXPO_PUBLIC_BRAND_PRIMARY_COLOUR ?? '#513D66',
  secondaryColour: process.env.EXPO_PUBLIC_BRAND_SECONDARY_COLOUR ?? '#DDB86C',
  email: process.env.EXPO_PUBLIC_BRAND_EMAIL ?? 'reachalmari@gmail.com',
  domain: process.env.EXPO_PUBLIC_BRAND_DOMAIN ?? 'almari.uk',
} as const;
