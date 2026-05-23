import Svg, { Line, Circle } from 'react-native-svg';

// Listing trust visual — firework burst expanding outward as score increases.
// Five states from single spark to full gold burst with outer silver sparks.

type Props = {
  score: number;
  maxScore?: number;
  size?: number;
};

type State = 0 | 1 | 2 | 3 | 4;

function getState(score: number, maxScore: number): State {
  const pct = Math.min(score / maxScore, 1);
  if (pct < 0.2) return 0;
  if (pct < 0.4) return 1;
  if (pct < 0.6) return 2;
  if (pct < 0.8) return 3;
  return 4;
}

const GOLD   = '#DDB86C';
const SILVER = '#C0C0C0';
const CX = 20; // centre x in 40×40 viewBox
const CY = 20; // centre y

function spoke(angle: number, inner: number, outer: number, colour: string, sw: number, key: string) {
  const rad = (angle * Math.PI) / 180;
  return (
    <Line
      key={key}
      x1={CX + Math.cos(rad) * inner}
      y1={CY + Math.sin(rad) * inner}
      x2={CX + Math.cos(rad) * outer}
      y2={CY + Math.sin(rad) * outer}
      stroke={colour}
      strokeWidth={sw}
      strokeLinecap="round"
    />
  );
}

export default function FireworkTrust({ score, maxScore = 100, size = 40 }: Props) {
  const state = getState(score, maxScore);
  const scale = size / 40;
  const spokes: React.ReactElement[] = [];

  if (state === 0) {
    // Single spark — one short line upward
    spokes.push(spoke(-90, 2, 9, GOLD, 2, 's0'));
  }

  if (state === 1) {
    // 4 spokes, short
    [0, 90, 180, 270].forEach((a, i) => spokes.push(spoke(a, 3, 10, GOLD, 1.5, `s1-${i}`)));
  }

  if (state === 2) {
    // 8 spokes, medium — alternating gold and slightly lighter
    for (let i = 0; i < 8; i++) {
      const angle = i * 45;
      const colour = i % 2 === 0 ? GOLD : '#E8C875';
      spokes.push(spoke(angle, 3, 13, colour, 1.5, `s2-${i}`));
    }
  }

  if (state === 3) {
    // 12 spokes, longer, full gold
    for (let i = 0; i < 12; i++) {
      spokes.push(spoke(i * 30, 3, 16, GOLD, 1.5, `s3-${i}`));
    }
  }

  if (state === 4) {
    // Brilliant: 16 inner gold spokes + 8 outer silver sparks
    for (let i = 0; i < 16; i++) {
      spokes.push(spoke(i * 22.5, 3, 15, GOLD, 1.5, `s4i-${i}`));
    }
    for (let i = 0; i < 8; i++) {
      spokes.push(spoke(i * 45 + 22.5, 16, 19, SILVER, 1, `s4o-${i}`));
    }
  }

  return (
    <Svg width={40 * scale} height={40 * scale} viewBox="0 0 40 40">
      {spokes}
      {/* Centre dot */}
      <Circle cx={CX} cy={CY} r={state === 0 ? 1 : 2} fill={GOLD} />
    </Svg>
  );
}
