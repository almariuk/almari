import { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Brand } from '@/constants/brand';
import AlmariLogo from '@/components/brand/AlmariLogo';
import type { MicroCopy } from '@/types/database';

const { width: SCREEN_W } = Dimensions.get('window');
const PADDING_H = 28; // matches s.inner paddingHorizontal
const SLIDE_W = SCREEN_W - PADDING_H * 2;

// Slide background images — swap src to update, no other code changes needed.
// Unused candidates kept here for easy rotation.
const SLIDE_IMAGES = [
  'https://images.unsplash.com/photo-1717586756136-d9a3eeb1fa6f?w=900&q=80&auto=format&fit=crop', // scarf + flower
  'https://images.unsplash.com/photo-1616756351484-798f37bdffa0?w=900&q=80&auto=format&fit=crop', // necklace on red textile
  'https://images.unsplash.com/photo-1517472292914-9570a594783b?w=900&q=80&auto=format&fit=crop', // assorted colour textiles
  // Unused — available to swap in:
  // 'https://images.unsplash.com/photo-1710440189404-e95fabead2a3?w=900&q=80&auto=format&fit=crop',
  // 'https://images.unsplash.com/photo-1717585679395-bbe39b5fb6bc?w=900&q=80&auto=format&fit=crop',
  // 'https://images.unsplash.com/photo-1616986491129-3e37cb654c82?w=900&q=80&auto=format&fit=crop',
  // 'https://images.unsplash.com/photo-1588140686379-1b76a52103dc?w=900&q=80&auto=format&fit=crop',
];

type Slide = { title: string; body: string; image: string };

function buildSlides(rows: MicroCopy[]): Slide[] {
  return [1, 2, 3].map((n, i) => ({
    title: rows.find(r => r.key === `slide_${n}_title`)?.display_text ?? '',
    body:  rows.find(r => r.key === `slide_${n}_body`)?.display_text ?? '',
    image: SLIDE_IMAGES[i] ?? SLIDE_IMAGES[0],
  }));
}

export default function Splash() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { data: copyRows = [] } = useQuery({
    queryKey: ['micro_copy', 'onboarding'],
    queryFn: async () => {
      const { data } = await supabase
        .from('micro_copy')
        .select('*')
        .eq('context', 'onboarding')
        .eq('is_active', true)
        .order('display_order');
      return (data ?? []) as MicroCopy[];
    },
  });

  const slides = copyRows.length >= 6 ? buildSlides(copyRows) : null;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const goToSlide = useCallback((index: number) => {
    scrollRef.current?.scrollTo({ x: SLIDE_W * index, animated: true });
    setActiveSlide(index);
  }, []);

  useEffect(() => {
    if (!slides) return;
    autoTimer.current = setInterval(() => {
      setActiveSlide(prev => {
        const next = (prev + 1) % slides.length;
        scrollRef.current?.scrollTo({ x: SLIDE_W * next, animated: true });
        return next;
      });
    }, 4000);
    return () => { if (autoTimer.current) clearInterval(autoTimer.current); };
  }, [slides]);

  const handleScrollEnd = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SLIDE_W);
    if (index !== activeSlide) {
      if (autoTimer.current) clearInterval(autoTimer.current);
      setActiveSlide(index);
    }
  };

  return (
    <View style={s.root}>
      {/* ── Slide backgrounds ─────────────────────────────────── */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {(slides ?? FALLBACK_SLIDES).map((slide, i) => (
          <Image
            key={i}
            source={{ uri: slide.image }}
            style={[StyleSheet.absoluteFill, { opacity: activeSlide === i ? 1 : 0 }]}
            contentFit="cover"
            transition={600}
          />
        ))}
        {/* Dark overlay so text is always legible */}
        <View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, s.overlay]} />
      </View>

      <SafeAreaView style={s.safe}>
        <Animated.View style={[s.inner, { opacity: fadeAnim }]}>

          {/* ── Hero ─────────────────────────────────────────── */}
          <View style={s.hero}>
            <AlmariLogo size={100} variant="light" />
            <Text style={s.wordmark}>{Brand.name.toUpperCase()}</Text>
            <Text style={s.logoTagline}>{Brand.logoTagline}</Text>
            <Text style={s.scriptTagline}>{Brand.scriptTagline}</Text>
          </View>

          {/* ── Slides ───────────────────────────────────────── */}
          <View style={s.slideArea}>
            <ScrollView
              ref={scrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleScrollEnd}
              scrollEventThrottle={16}
            >
              {(slides ?? FALLBACK_SLIDES).map((slide, i) => (
                <View key={i} style={s.slide}>
                  <Text style={s.slideTitle}>{slide.title}</Text>
                  <Text style={s.slideBody}>{slide.body}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Dot indicators */}
            <View style={s.dots}>
              {(slides ?? FALLBACK_SLIDES).map((_, i) => (
                <TouchableOpacity key={i} onPress={() => goToSlide(i)} hitSlop={8}>
                  <View style={[s.dot, activeSlide === i && s.dotActive]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── CTAs ─────────────────────────────────────────── */}
          <View style={s.ctas}>
            <TouchableOpacity
              style={s.btnPrimary}
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.85}
            >
              <Text style={s.btnPrimaryText}>Get started</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.btnGhost}
              onPress={() => router.push({ pathname: '/(auth)/register', params: { mode: 'signin' } })}
              activeOpacity={0.7}
            >
              <Text style={s.btnGhostText}>Already have an account? Sign in</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

// Shown while micro_copy loads so there's no blank flash
const FALLBACK_SLIDES: Slide[] = [
  { title: Brand.tagline, body: '', image: SLIDE_IMAGES[0] },
];

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#2C3032',
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(20,14,28,0.62)',
  },
  safe: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingBottom: 12,
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: 32,
    gap: 8,
  },
  wordmark: {
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-DemiBold' : 'Inter_600SemiBold',
    fontSize: 36,
    letterSpacing: 8,
    color: '#FEF9E7',
    marginTop: 8,
  },
  logoTagline: {
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Regular' : 'Inter_400Regular',
    fontSize: 11,
    letterSpacing: 2,
    color: 'rgba(254,249,231,0.7)',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  scriptTagline: {
    fontFamily: 'GreatVibes_400Regular',
    fontSize: 22,
    color: '#DDB86C',
    marginTop: 4,
  },

  // Slides
  slideArea: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  slide: {
    width: SLIDE_W,
    paddingHorizontal: 4,
    gap: 8,
  },
  slideTitle: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 28,
    color: '#FEF9E7',
    lineHeight: 34,
  },
  slideBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: 'rgba(254,249,231,0.72)',
    lineHeight: 20,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(254,249,231,0.35)',
  },
  dotActive: {
    backgroundColor: '#DDB86C',
    width: 18,
    borderRadius: 3,
  },

  // CTAs
  ctas: {
    gap: 12,
    paddingBottom: 8,
  },
  btnPrimary: {
    backgroundColor: '#513D66',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDB86C',
  },
  btnPrimaryText: {
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-DemiBold' : 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FEF9E7',
    letterSpacing: 0.5,
  },
  btnGhost: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  btnGhostText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: 'rgba(254,249,231,0.65)',
  },
});
