import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type AccentKey = 'aubergine' | 'indigo' | 'crimson' | 'forest' | 'teal'

type PaletteTokens = {
  accent: string
  accentSubtle: string
  borderFocused: string
  searchSurface: string
  background: string
  surface: string
  surfaceRaised: string
  inputBackground: string
}

export type AccentPalette = {
  key: AccentKey
  label: string
  swatch: string
  light: PaletteTokens
  dark: PaletteTokens
}

export const ACCENT_PALETTES: AccentPalette[] = [
  {
    key: 'aubergine', label: 'Aubergine', swatch: '#513D66',
    light: { accent: '#513D66', accentSubtle: '#F0EBF6', borderFocused: '#513D66', searchSurface: '#EDE7F6', background: '#FFFFFF', surface: '#F7F4F9', surfaceRaised: '#FFFFFF', inputBackground: '#FAF8FC' },
    dark:  { accent: '#9B7EC8', accentSubtle: '#2D2438', borderFocused: '#9B7EC8', searchSurface: '#261B38', background: '#1A1520', surface: '#241D2E', surfaceRaised: '#2D2438', inputBackground: '#241D2E' },
  },
  {
    key: 'indigo', label: 'Indigo', swatch: '#3D3B8E',
    light: { accent: '#3D3B8E', accentSubtle: '#EAEBF8', borderFocused: '#3D3B8E', searchSurface: '#E5E6F5', background: '#FAFAFE', surface: '#EDEDF8', surfaceRaised: '#FAFAFE', inputBackground: '#F3F3FB' },
    dark:  { accent: '#7B79D4', accentSubtle: '#1E1D3A', borderFocused: '#7B79D4', searchSurface: '#1A193A', background: '#0D0D1C', surface: '#181830', surfaceRaised: '#20203C', inputBackground: '#181830' },
  },
  {
    key: 'crimson', label: 'Crimson', swatch: '#8B2635',
    light: { accent: '#8B2635', accentSubtle: '#F8EAEC', borderFocused: '#8B2635', searchSurface: '#F5E8EA', background: '#FFF8F8', surface: '#F5EDED', surfaceRaised: '#FFF8F8', inputBackground: '#FBF3F3' },
    dark:  { accent: '#C4616E', accentSubtle: '#3A1A1E', borderFocused: '#C4616E', searchSurface: '#331519', background: '#1A0E0F', surface: '#251518', surfaceRaised: '#2E1A1D', inputBackground: '#251518' },
  },
  {
    key: 'forest', label: 'Forest', swatch: '#2E6B4F',
    light: { accent: '#2E6B4F', accentSubtle: '#E8F4EE', borderFocused: '#2E6B4F', searchSurface: '#E2F0E8', background: '#F7FBF8', surface: '#EAF3ED', surfaceRaised: '#F7FBF8', inputBackground: '#F1F8F3' },
    dark:  { accent: '#5FAD88', accentSubtle: '#1A2E24', borderFocused: '#5FAD88', searchSurface: '#162A20', background: '#0A1610', surface: '#121F17', surfaceRaised: '#182A1E', inputBackground: '#121F17' },
  },
  {
    key: 'teal', label: 'Teal', swatch: '#1B5E6E',
    light: { accent: '#1B5E6E', accentSubtle: '#E5F2F5', borderFocused: '#1B5E6E', searchSurface: '#DFF0F3', background: '#F5FAFB', surface: '#E5F2F4', surfaceRaised: '#F5FAFB', inputBackground: '#EDF6F8' },
    dark:  { accent: '#4FA8BC', accentSubtle: '#192A30', borderFocused: '#4FA8BC', searchSurface: '#162428', background: '#091416', surface: '#101F22', surfaceRaised: '#15282C', inputBackground: '#101F22' },
  },
]

const STORAGE_KEY = '@almari:accent_key'

interface ThemeStoreState {
  accentKey: AccentKey
  setAccentKey: (key: AccentKey) => void
}

export const useThemeStore = create<ThemeStoreState>((set) => {
  AsyncStorage.getItem(STORAGE_KEY).then(val => {
    if (val) set({ accentKey: val as AccentKey })
  })

  return {
    accentKey: 'aubergine',
    setAccentKey: (key) => {
      set({ accentKey: key })
      AsyncStorage.setItem(STORAGE_KEY, key)
    },
  }
})
