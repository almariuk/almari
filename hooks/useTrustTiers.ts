import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TrustTier } from '@/types/database'

export function useTrustTiers() {
  return useQuery<TrustTier[]>({
    queryKey: ['trust_tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trust_tiers')
        .select('*')
        .eq('is_active', true)
        .order('min_score', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    staleTime: Infinity, // trust tiers do not change during a session
    gcTime: Infinity,
  })
}

export function getDiyaColour(trustScore: number, tiers: TrustTier[]): string {
  const tier = tiers.find(t => trustScore >= t.min_score && trustScore <= t.max_score)
  return tier?.diya_colour_hex ?? '#CD7F32' // fallback to Apna bronze
}

export function getMaxTrustScore(tiers: TrustTier[]): number {
  if (tiers.length === 0) return 62 // fallback to design-time max
  return Math.max(...tiers.map(t => t.max_score))
}
