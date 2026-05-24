import Svg, { Path } from 'react-native-svg'
import { Brand } from '@/constants/brand'

// Listing trust visual — 4-pointed star that grows and gains outer spokes as score rises.
// Five states: spark → starting → building → strong → brilliant.
// Redesigned with proper star polygon geometry for clean rendering at all sizes.

type Props = { score: number; maxScore?: number; size?: number }
type State = 0 | 1 | 2 | 3 | 4

const GOLD = Brand.secondaryColour
const GOLD_LIGHT = '#E8C87A' // lighter tint used for spokes — no brand token exists
const CX = 12
const CY = 12

function getState(score: number, max: number): State {
  const pct = Math.min(score / max, 1)
  if (pct < 0.2) return 0
  if (pct < 0.4) return 1
  if (pct < 0.6) return 2
  if (pct < 0.8) return 3
  return 4
}

// 4-pointed star: outer points at cardinal directions, inner valleys at 45° diagonals.
// S = 1/√2 for the diagonal components of the inner radius.
function starPath(cx: number, cy: number, R: number, r: number): string {
  const S = 0.7071067811865476
  const pts: [number, number][] = [
    [cx,         cy - R],        // top
    [cx + r * S, cy - r * S],   // NE inner
    [cx + R,     cy],            // right
    [cx + r * S, cy + r * S],   // SE inner
    [cx,         cy + R],        // bottom
    [cx - r * S, cy + r * S],   // SW inner
    [cx - R,     cy],            // left
    [cx - r * S, cy - r * S],   // NW inner
  ]
  return (
    pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join('') + 'Z'
  )
}

// Short line spoke at angleDeg from centre, starting at inner and ending at outer radius.
function spokePath(cx: number, cy: number, angleDeg: number, inner: number, outer: number): string {
  const rad = (angleDeg * Math.PI) / 180
  return (
    `M${(cx + inner * Math.cos(rad)).toFixed(2)},${(cy + inner * Math.sin(rad)).toFixed(2)}` +
    `L${(cx + outer * Math.cos(rad)).toFixed(2)},${(cy + outer * Math.sin(rad)).toFixed(2)}`
  )
}

// Star geometry and spoke configuration per state
const CONFIGS = [
  { R: 2.5, r: 1.0, opacity: 0.90, spokeAngles: [] as number[], spokeInner: 0, spokeOuter: 0 },
  { R: 4.0, r: 1.6, opacity: 0.92, spokeAngles: [] as number[], spokeInner: 0, spokeOuter: 0 },
  { R: 5.0, r: 2.0, opacity: 0.94, spokeAngles: [] as number[], spokeInner: 0, spokeOuter: 0 },
  { R: 6.0, r: 2.3, opacity: 0.97, spokeAngles: [45, 135, 225, 315],         spokeInner: 7.2, spokeOuter: 8.8  },
  { R: 6.5, r: 2.5, opacity: 1.00, spokeAngles: [0, 45, 90, 135, 180, 225, 270, 315], spokeInner: 7.5, spokeOuter: 10.0 },
] as const

export default function FireworkTrust({ score, maxScore = 62, size = 40 }: Props) {
  const state = getState(score, maxScore)
  const scale = size / 24
  const { R, r, opacity, spokeAngles, spokeInner, spokeOuter } = CONFIGS[state]

  return (
    <Svg width={24 * scale} height={24 * scale} viewBox="0 0 24 24">
      {(spokeAngles as readonly number[]).map(a => (
        <Path
          key={a}
          d={spokePath(CX, CY, a, spokeInner, spokeOuter)}
          stroke={GOLD_LIGHT}
          strokeWidth={state === 4 ? 1.1 : 0.9}
          strokeLinecap="round"
          opacity={opacity}
        />
      ))}
      <Path d={starPath(CX, CY, R, r)} fill={GOLD} opacity={opacity} />
    </Svg>
  )
}
