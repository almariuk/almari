import { Brand } from './brand';

// Semantic colour tokens. Brand accent derives from env-var-driven Brand constants
// so the entire theme shifts when EXPO_PUBLIC_BRAND_PRIMARY_COLOUR changes.
// Fixed structural tokens (backgrounds, text, borders) are stable across brand variants.

export type Theme = {
  // Backgrounds
  background: string;
  surface: string;
  surfaceRaised: string;
  // Text
  text: string;
  textSecondary: string;
  textDisabled: string;
  // Brand accent — driven by Brand.primaryColour / Brand.secondaryColour
  accent: string;
  accentText: string;
  accentSubtle: string;
  gold: string;
  // Borders & inputs
  border: string;
  borderFocused: string;
  inputBackground: string;
  // Status
  error: string;
  success: string;
  // Fixed brand surfaces (used for intentional brand moments, e.g. splash hero)
  brandPrimary: string;
  brandSecondary: string;
  brandCream: string;
  brandCharcoal: string;
  // Search bar surface — a tinted lavender distinct from the page background
  searchSurface: string;
};

export const lightTheme: Theme = {
  background: '#FFFFFF',
  surface: '#F7F4F9',
  surfaceRaised: '#FFFFFF',
  text: '#2C3032',
  textSecondary: '#6B7280',
  textDisabled: '#B0A8B9',
  accent: Brand.primaryColour,
  accentText: '#FFFFFF',
  accentSubtle: '#F0EBF6',
  gold: Brand.secondaryColour,
  border: '#E8E0EF',
  borderFocused: Brand.primaryColour,
  inputBackground: '#FAF8FC',
  error: '#C0392B',
  success: '#2D7A4F',
  brandPrimary: Brand.primaryColour,
  brandSecondary: Brand.secondaryColour,
  brandCream: '#FEF9E7',
  brandCharcoal: '#2C3032',
  searchSurface: '#EDE7F6',
};

export const darkTheme: Theme = {
  background: '#1A1520',
  surface: '#241D2E',
  surfaceRaised: '#2D2438',
  text: '#F5F0FF',
  textSecondary: '#A89BBE',
  textDisabled: '#6B5F7A',
  accent: '#9B7EC8',
  accentText: '#FFFFFF',
  accentSubtle: '#2D2438',
  gold: '#E8C87A',
  border: '#3D3050',
  borderFocused: '#9B7EC8',
  inputBackground: '#241D2E',
  error: '#E57373',
  success: '#66BB6A',
  brandPrimary: Brand.primaryColour,
  brandSecondary: Brand.secondaryColour,
  brandCream: '#FEF9E7',
  brandCharcoal: '#2C3032',
  searchSurface: '#261B38',
};
