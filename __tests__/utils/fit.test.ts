import { getFitLabel, applyFitsMe } from '../../utils/fit'
import type { FeedItem } from '../../types/feed'

// ── helpers ──────────────────────────────────────────────────────────────────

type Measurements = Parameters<typeof getFitLabel>[1]
type User = Parameters<typeof getFitLabel>[0]

const user: User = { bustCm: 90, waistCm: 70, hipsCm: 95 }

function listing(bust: number | null, waist: number | null, hips: number | null): Measurements {
  return { bustCm: bust, waistCm: waist, hipsCm: hips, heightCm: null, ukShoeSize: null, labelSize: null, ageFromYears: null, ageToYears: null }
}

function feedItem(fitLabel: FeedItem['fitLabel'], id = fitLabel ?? 'none'): FeedItem {
  return { id, fitLabel } as FeedItem
}

// ── getFitLabel ───────────────────────────────────────────────────────────────

describe('getFitLabel — null / missing data', () => {
  it('null listing → null', () =>
    expect(getFitLabel(user, null)).toBeNull())

  it('no overlapping measurements → null', () =>
    expect(getFitLabel({ bustCm: null, waistCm: null, hipsCm: null }, listing(90, 70, 95))).toBeNull())

  it('listing has no measurements to compare → null', () =>
    expect(getFitLabel(user, listing(null, null, null))).toBeNull())
})

describe('getFitLabel — exact fit (≤ 2.54 cm)', () => {
  it('perfect match → exact', () =>
    expect(getFitLabel(user, listing(90, 70, 95))).toBe('exact'))

  it('diff = 2.5 cm → exact', () =>
    expect(getFitLabel(user, listing(90 + 2.5, 70, 95))).toBe('exact'))
})

describe('getFitLabel — quick pin (≤ 5.08 cm)', () => {
  it('diff = 2.55 cm → quick_pin', () =>
    expect(getFitLabel(user, listing(90 + 2.55, 70, 95))).toBe('quick_pin'))

  it('diff = 5.08 cm → quick_pin', () =>
    expect(getFitLabel(user, listing(90 + 5.08, 70, 95))).toBe('quick_pin'))
})

describe('getFitLabel — quick stitch (≤ 10.16 cm)', () => {
  it('diff = 5.09 cm → quick_stitch', () =>
    expect(getFitLabel(user, listing(90 + 5.09, 70, 95))).toBe('quick_stitch'))

  it('diff = 10.16 cm → quick_stitch', () =>
    expect(getFitLabel(user, listing(90 + 10.16, 70, 95))).toBe('quick_stitch'))
})

describe('getFitLabel — too far', () => {
  it('diff = 10.17 cm → null', () =>
    expect(getFitLabel(user, listing(90 + 10.17, 70, 95))).toBeNull())
})

describe('getFitLabel — worst measurement drives the label', () => {
  it('bust=exact, waist=quick_stitch → quick_stitch', () =>
    expect(getFitLabel(user, listing(90, 70 + 8, 95))).toBe('quick_stitch'))

  it('only bust overlaps (waist/hips null on listing) → uses bust diff', () =>
    expect(getFitLabel(user, listing(90, null, null))).toBe('exact'))
})

// ── applyFitsMe ───────────────────────────────────────────────────────────────

describe('applyFitsMe', () => {
  it('empty array → empty array', () =>
    expect(applyFitsMe([])).toEqual([]))

  it('orders: exact → quick_pin → quick_stitch → null', () => {
    const items = [
      feedItem(null, 'a'),
      feedItem('quick_stitch', 'b'),
      feedItem('exact', 'c'),
      feedItem('quick_pin', 'd'),
    ]
    const result = applyFitsMe(items).map(i => i.id)
    expect(result).toEqual(['c', 'd', 'b', 'a'])
  })

  it('items within same tier keep original order', () => {
    const items = [
      feedItem('exact', 'first'),
      feedItem('exact', 'second'),
    ]
    expect(applyFitsMe(items).map(i => i.id)).toEqual(['first', 'second'])
  })

  it('all null-labelled items appear last', () => {
    const items = [
      feedItem(null, 'x'),
      feedItem('exact', 'y'),
      feedItem(null, 'z'),
    ]
    const result = applyFitsMe(items).map(i => i.id)
    expect(result).toEqual(['y', 'x', 'z'])
  })
})
