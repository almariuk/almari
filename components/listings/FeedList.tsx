import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useTheme } from '@/hooks/useTheme'
import ListingCard from './ListingCard'
import type { FeedItem } from '@/types/feed'

interface Props {
  items: FeedItem[]
  isLoading: boolean
  isFetchingNextPage: boolean
  isRefreshing: boolean
  onEndReached: () => void
  onRefresh: () => void
  emptyText: string
  ListHeaderComponent?: React.ReactElement | null
}

const SCREEN_WIDTH = Dimensions.get('window').width
const H_PADDING = 12
const COL_GAP = 10
export const CARD_WIDTH = Math.floor((SCREEN_WIDTH - H_PADDING * 2 - COL_GAP) / 2)

export function FeedList({
  items,
  isLoading,
  isFetchingNextPage,
  isRefreshing,
  onEndReached,
  onRefresh,
  emptyText,
  ListHeaderComponent,
}: Props) {
  const theme = useTheme()
  const router = useRouter()

  if (isLoading && items.length === 0) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    )
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={s.row}
      contentContainerStyle={s.list}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        <View style={s.emptyContainer}>
          <Text
            style={[
              s.emptyText,
              {
                color: theme.textSecondary,
                fontFamily: 'CormorantGaramond_400Regular_Italic',
              },
            ]}
          >
            {emptyText}
          </Text>
        </View>
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={s.footer}>
            <ActivityIndicator color={theme.accent} />
          </View>
        ) : null
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <ListingCard
          data={item}
          cardWidth={CARD_WIDTH}
          onPress={() => router.push(`/listing/${item.id}` as any)}
        />
      )}
    />
  )
}

const s = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: H_PADDING,
    paddingBottom: 32,
  },
  row: {
    gap: COL_GAP,
    marginBottom: COL_GAP,
    alignItems: 'stretch',
  },
  emptyContainer: {
    paddingTop: 64,
    paddingHorizontal: 36,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 28,
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
})
