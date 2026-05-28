import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { SeasonalEventRow } from '@/types/database'

export function useSeasonalBanner() {
  return useQuery<string | null>({
    queryKey: ['seasonal_banner'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('seasonal_events')
        .select('buyer_message')
        .eq('is_active', true)
        .lte('notify_buyers_at', today)
        .or(`event_date.is.null,event_date.gte.${today}`)
        .order('notify_buyers_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return (data as Pick<SeasonalEventRow, 'buyer_message'> | null)?.buyer_message ?? null
    },
    staleTime: 1000 * 60 * 60, // 1 hour — banner doesn't change mid-session
  })
}
