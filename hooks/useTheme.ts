import { useColorScheme } from 'react-native'
import { lightTheme, darkTheme, type Theme } from '@/constants/theme'
import { useThemeStore, ACCENT_PALETTES } from '@/store/theme'

export function useTheme(): Theme {
  const isDark = useColorScheme() === 'dark'
  const { accentKey } = useThemeStore()
  const base = isDark ? darkTheme : lightTheme
  const palette = ACCENT_PALETTES.find(p => p.key === accentKey) ?? ACCENT_PALETTES[0]
  const tokens = isDark ? palette.dark : palette.light
  return { ...base, ...tokens }
}
