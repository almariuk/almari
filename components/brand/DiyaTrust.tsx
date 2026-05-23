import Svg, { Path, Defs, ClipPath, Rect, G } from 'react-native-svg';

// Seller trust visual — diya lamp that fills from base to flame as score increases.
// Five tiers driven by trust_tiers seed data. Replace with production illustration when ready.

type Props = {
  score: number;
  size?: number;
};

type Tier = { colour: string; min: number; max: number };

const TIERS: Tier[] = [
  { colour: '#CC0000', min: 0,   max: 20  }, // Nayi Shuruwat — red
  { colour: '#CD7F32', min: 21,  max: 50  }, // Apna — bronze
  { colour: '#C0C0C0', min: 51,  max: 100 }, // Bharosa — silver
  { colour: '#4169E1', min: 101, max: 200 }, // Izzat — blue
  { colour: '#FFD700', min: 201, max: 9999}, // Aanch — gold
];

function getTier(score: number): Tier {
  return TIERS.find(t => score >= t.min && score <= t.max) ?? TIERS[0];
}

function getFillPercent(score: number, tier: Tier): number {
  const range = tier.max === 9999 ? 200 : tier.max - tier.min;
  const position = Math.min(score - tier.min, range);
  return range === 0 ? 1 : position / range;
}

export default function DiyaTrust({ score, size = 80 }: Props) {
  const tier = getTier(score);
  const fill = getFillPercent(score, tier);
  const scale = size / 80;

  // Diya drawn in a 40×80 viewBox
  // Bowl: wide ellipse base. Body tapers up. Wick. Flame teardrop.
  // Fill clip rises from y=80 (base) upward by fill%.
  const totalH = 80;
  const clipY = totalH * (1 - fill);

  return (
    <Svg width={40 * scale} height={80 * scale} viewBox="0 0 40 80">
      <Defs>
        <ClipPath id="diyaFill">
          <Rect x="0" y={clipY} width="40" height={totalH - clipY} />
        </ClipPath>
      </Defs>

      {/* Filled shape (clipped) */}
      <G clipPath="url(#diyaFill)">
        {/* Bowl */}
        <Path
          d="M6 52 Q4 66 20 70 Q36 66 34 52 Z"
          fill={tier.colour}
        />
        {/* Body taper */}
        <Path
          d="M14 36 Q12 52 6 52 Q34 52 34 52 Q28 52 26 36 Z"
          fill={tier.colour}
        />
        {/* Wick */}
        <Path
          d="M18 24 L20 36 L22 24"
          fill={tier.colour}
        />
        {/* Flame */}
        <Path
          d="M20 4 C24 10 26 16 20 22 C14 16 16 10 20 4 Z"
          fill={tier.colour}
        />
      </G>

      {/* Outline (always visible) */}
      <Path
        d="M6 52 Q4 66 20 70 Q36 66 34 52 Q28 52 26 36 L22 24 C24 10 26 16 20 4 C14 16 16 10 18 24 L14 36 Q12 52 6 52 Z"
        fill="none"
        stroke={tier.colour}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Wick stem outline */}
      <Path
        d="M18 36 Q20 30 22 36"
        fill="none"
        stroke={tier.colour}
        strokeWidth="1"
      />
      {/* Base plate */}
      <Path
        d="M8 70 Q20 76 32 70"
        fill="none"
        stroke={tier.colour}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}
