import { useState, useMemo, useCallback } from 'react'
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import {
  IconBell,
  IconRulerMeasure,
  IconSearch,
} from '@tabler/icons-react-native'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore } from '@/store/auth'
import { useFeedListings } from '@/hooks/useFeedListings'
import { getFitLabel, applyFitsMe } from '@/utils/fit'
import { FeedList } from '@/components/listings/FeedList'
import AlmariIcon from '@/components/brand/AlmariIcon'
import type { FeedItem } from '@/types/feed'

export default function Home() {
  const theme = useTheme()
  const router = useRouter()
  const { profile } = useAuthStore()
  const [fitsMeActive, setFitsMeActive] = useState(false)

  const hasMeasurements = !!(profile?.bust_cm || profile?.waist_cm || profile?.hips_cm)
  const userMeasurements = hasMeasurements
    ? {
        bustCm: profile?.bust_cm ?? null,
        waistCm: profile?.waist_cm ?? null,
        hipsCm: profile?.hips_cm ?? null,
      }
    : null

  const {
    data,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isFetching,
  } = useFeedListings()

  const isRefreshing = isFetching && !isLoading && !isFetchingNextPage

  useFocusEffect(useCallback(() => { refetch() }, []))

  const items = useMemo((): FeedItem[] => {
    const all = data?.pages.flat() ?? []
    const withLabels: FeedItem[] = all.map(l => ({
      ...l,
      fitLabel:
        fitsMeActive && userMeasurements
          ? getFitLabel(userMeasurements, l.measurements)
          : null,
    }))
    return fitsMeActive && userMeasurements ? applyFitsMe(withLabels) : withLabels
  }, [data, fitsMeActive, userMeasurements])

  const listHeader = useMemo(
    () => (
      <View>
        {hasMeasurements && (
          <View style={[styles.fitsRow, { borderBottomColor: theme.border }]}>
            <IconRulerMeasure
              size={16}
              color={fitsMeActive ? theme.accent : theme.textSecondary}
            />
            <Text
              style={[
                styles.fitsLabel,
                {
                  color: fitsMeActive ? theme.accent : theme.text,
                  fontFamily: 'Inter_500Medium',
                },
              ]}
            >
              Show pieces that fit me
            </Text>
            <Switch
              value={fitsMeActive}
              onValueChange={setFitsMeActive}
              trackColor={{ false: theme.border, true: theme.accentSubtle }}
              thumbColor={fitsMeActive ? theme.accent : theme.surfaceRaised}
              ios_backgroundColor={theme.border}
            />
          </View>
        )}

        <View style={styles.feedLead} />
      </View>
    ),
    [hasMeasurements, fitsMeActive, theme],
  )

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <AlmariIcon size={36} />
        <TouchableOpacity
          onPress={() => router.push('/(app)/notifications')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <IconBell size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.searchBar, { backgroundColor: theme.searchSurface, borderColor: theme.borderFocused }]}
        onPress={() => router.push('/(app)/search')}
        activeOpacity={0.75}
      >
        <IconSearch size={16} color={theme.accent} />
        <Text style={[styles.searchHint, { color: theme.textSecondary, fontFamily: 'Inter_400Regular' }]}>
          Search on almari
        </Text>
      </TouchableOpacity>

      <FeedList
        items={items}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        isRefreshing={isRefreshing}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage()
        }}
        onRefresh={refetch}
        emptyText="Nothing here yet. Be the first to list something."
        ListHeaderComponent={listHeader}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  wordmark: {
    fontSize: 32,
    letterSpacing: 1.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 2,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchHint: {
    fontSize: 14,
  },
  fitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
  },
  fitsLabel: {
    flex: 1,
    fontSize: 14,
  },
  feedLead: {
    height: 14,
  },
})
