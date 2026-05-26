import { useState } from 'react'
import { View, FlatList, TouchableOpacity, Text, Dimensions, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { IconChevronLeft } from '@tabler/icons-react-native'
import { useRouter } from 'expo-router'
import { useTheme } from '@/hooks/useTheme'

const SCREEN_WIDTH = Dimensions.get('window').width
export const CAROUSEL_HEIGHT = Math.round(SCREEN_WIDTH * 1.1)

interface Props {
  urls: string[]
}

export function PhotoCarousel({ urls }: Props) {
  const theme = useTheme()
  const router = useRouter()
  const [activeIndex, setActiveIndex] = useState(0)

  const photos = urls.length > 0 ? urls : [null]

  return (
    <View>
      <FlatList
        data={photos}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => {
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))
        }}
        renderItem={({ item }) => (
          <Image
            source={item ? { uri: item } : null}
            style={[s.photo, { backgroundColor: theme.surface }]}
            contentFit="cover"
          />
        )}
      />

      {/* Back button */}
      <TouchableOpacity
        style={[s.backBtn, { backgroundColor: theme.background + 'CC' }]}
        onPress={() => router.back()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <IconChevronLeft size={20} color={theme.text} />
      </TouchableOpacity>

      {/* Photo count pill */}
      {photos.length > 1 && (
        <View style={[s.countPill, { backgroundColor: theme.background + 'CC' }]}>
          <Text style={[s.countText, { color: theme.text, fontFamily: 'Inter_500Medium' }]}>
            {activeIndex + 1} / {photos.length}
          </Text>
        </View>
      )}

      {/* Dot indicators */}
      {photos.length > 1 && (
        <View style={s.dots}>
          {photos.map((_, i) => (
            <View
              key={i}
              style={[
                s.dot,
                { opacity: i === activeIndex ? 1 : 0.45 },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  photo: {
    width: SCREEN_WIDTH,
    height: CAROUSEL_HEIGHT,
  },
  backBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPill: {
    position: 'absolute',
    top: 14,
    right: 14,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    fontSize: 12,
  },
  dots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
})
