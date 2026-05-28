import Svg, { Path, Line, Circle } from 'react-native-svg';
import { Brand } from '@/constants/brand';

// Hanger-as-wardrobe-doorway icon per brand spec v1.0
// 75×120px master dimensions, wireframe stroked, gold hook + purple body
// Replace this file with the production SVG asset when design finalises.

type Variant = 'primary' | 'light' | 'dark';

const PALETTE: Record<Variant, { body: string; hook: string }> = {
  primary: { body: Brand.primaryColour, hook: Brand.secondaryColour },
  light:   { body: '#FEF9E7',           hook: '#DDB86C' },
  dark:    { body: '#2C3032',           hook: '#DDB86C' },
};

type Props = {
  size?: number;
  variant?: Variant;
};

export default function AlmariLogo({ size = 120, variant = 'primary' }: Props) {
  const scale = size / 120;
  const w = 75 * scale;
  const h = 120 * scale;
  const { body, hook } = PALETTE[variant];
  const sw = 4 * scale;   // thin stroke (4pt in spec)
  const shw = 5 * scale;  // hanger hook stroke (15pt → slightly heavier hook)

  // All coordinates at 75×120 native units, scaled via viewBox
  return (
    <Svg width={w} height={h} viewBox="0 0 75 120">
      {/* ── Hanger hook ─────────────────────────────────────── */}
      {/* Hook arc: starts at shoulders, rises to centre top */}
      <Path
        d="M37.5 28 C37.5 18 42 12 48 12 C54 12 57 16 57 20 C57 23 55 25 52 25"
        fill="none"
        stroke={hook}
        strokeWidth={shw}
        strokeLinecap="round"
      />

      {/* ── Left shoulder line (hook → top of door frame) ── */}
      <Line
        x1="37.5" y1="28"
        x2="10"   y2="46"
        stroke={body}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      {/* ── Right shoulder line ─────────────────────────── */}
      <Line
        x1="37.5" y1="28"
        x2="65"   y2="46"
        stroke={body}
        strokeWidth={sw}
        strokeLinecap="round"
      />

      {/* ── Wardrobe outer frame ─────────────────────────── */}
      {/* Top rail — continuous with shoulder ends */}
      <Line x1="10" y1="46" x2="65" y2="46" stroke={body} strokeWidth={sw} strokeLinecap="round" />
      {/* Left side */}
      <Line x1="10" y1="46" x2="10" y2="112" stroke={body} strokeWidth={sw} strokeLinecap="round" />
      {/* Right side */}
      <Line x1="65" y1="46" x2="65" y2="112" stroke={body} strokeWidth={sw} strokeLinecap="round" />
      {/* Base */}
      <Line x1="10" y1="112" x2="65" y2="112" stroke={body} strokeWidth={sw} strokeLinecap="round" />

      {/* ── Centre door divider ──────────────────────────── */}
      <Line x1="37.5" y1="46" x2="37.5" y2="112" stroke={body} strokeWidth={sw} strokeLinecap="round" />

      {/* ── Left door handle ────────────────────────────── */}
      <Circle cx="30" cy="82" r={2.5 * scale} fill={hook} />

      {/* ── Right door handle ───────────────────────────── */}
      <Circle cx="45" cy="82" r={2.5 * scale} fill={hook} />
    </Svg>
  );
}
