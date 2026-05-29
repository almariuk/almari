import Svg, { Rect, Line, Circle, Path, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  size?: number;
}

export default function AlmariLogoFull({ size = 220 }: Props) {
  const theme = useTheme();
  const bg = theme.background;
  const navy = theme.brandPrimary;
  const gold = theme.gold;
  const door = theme.surface;
  const doorStroke = theme.border;
  const saree = theme.brandCream;
  const wordmark = theme.text;

  const width = size;
  const height = size * (420 / 380);
  return (
    <Svg width={width} height={height} viewBox="0 0 380 420">
      {/* Outer hexagon */}
      <Path
        d="M 202,53 L 304,112 Q 318,120 318,136 L 318,258 Q 318,274 304,282 L 202,341 Q 190,348 178,341 L 76,282 Q 62,274 62,258 L 62,136 Q 62,120 76,112 L 178,53 Q 190,46 202,53 Z"
        fill="none" stroke={gold} strokeWidth="1.4"
      />
      {/* Inner hexagon */}
      <Path
        d="M 200,62 L 298,118 Q 310,126 310,140 L 310,254 Q 310,268 298,276 L 200,332 Q 190,338 180,332 L 82,276 Q 70,268 70,254 L 70,140 Q 70,126 82,118 L 180,62 Q 190,56 200,62 Z"
        fill="none" stroke={gold} strokeWidth="0.4" opacity="0.35"
      />

      {/* Vertex dots */}
      <Circle cx="190" cy="47" r="2.5" fill={gold} />
      <Circle cx="318" cy="136" r="2.5" fill={gold} />
      <Circle cx="318" cy="258" r="2.5" fill={gold} />
      <Circle cx="190" cy="347" r="2.5" fill={gold} />
      <Circle cx="62" cy="258" r="2.5" fill={gold} />
      <Circle cx="62" cy="136" r="2.5" fill={gold} />

      {/* Almirah body */}
      <Rect x="152" y="95" width="76" height="88" rx="3" fill={navy} stroke={gold} strokeWidth="1.2" />
      <Line x1="190" y1="95" x2="190" y2="183" stroke={gold} strokeWidth="0.8" />
      <Rect x="149" y="92" width="82" height="6" rx="1.5" fill={navy} stroke={gold} strokeWidth="0.8" />
      <Rect x="158" y="181" width="6" height="8" rx="1" fill={gold} />
      <Rect x="216" y="181" width="6" height="8" rx="1" fill={gold} />

      {/* Left door */}
      <Rect x="156" y="103" width="28" height="34" rx="2" fill={door} stroke={doorStroke} strokeWidth="0.6" />
      <Line x1="159" y1="106" x2="162" y2="109" stroke={doorStroke} strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
      <Circle cx="165" cy="115" r="1.5" fill={gold} />
      <Circle cx="172" cy="111" r="1.2" fill={saree} />
      <Circle cx="178" cy="118" r="1.5" fill={gold} />
      <Circle cx="169" cy="123" r="1" fill={saree} />
      <Circle cx="175" cy="128" r="1.2" fill={gold} />

      {/* Right door */}
      <Rect x="196" y="103" width="28" height="34" rx="2" fill={door} stroke={doorStroke} strokeWidth="0.6" opacity="0.7" />

      {/* Saree */}
      <Circle cx="197" cy="141" r="2.5" fill={gold} />
      <Circle cx="183" cy="141" r="2.5" fill={gold} />
      <Path d="M197 143 Q200 151 196 157 Q193 163 197 169 Q200 173 196 177" stroke={saree} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <Path d="M197 143 Q204 150 201 157 Q198 164 202 170 Q205 174 201 177" stroke={gold} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.8" />

      {/* Divider */}
      <Rect x="152" y="196" width="76" height="2" rx="1" fill={gold} opacity="0.7" />

      {/* ALMARI wordmark */}
      <SvgText
        x="190" y="222" textAnchor="middle"
        fontSize="26" letterSpacing="7"
        fontFamily="CormorantGaramond_600SemiBold"
        fontWeight="600" fill={wordmark}
      >
        ALMARI
      </SvgText>

      {/* English tagline */}
      <SvgText
        x="190" y="240" textAnchor="middle"
        fontSize="9" letterSpacing="0.2"
        fontFamily="CormorantGaramond_400Regular_Italic"
        fontStyle="italic" fill={gold}
      >
        Curating Memories, Preserving Heritage
      </SvgText>

      {/* Divider lines */}
      <Line x1="120" y1="260" x2="260" y2="260" stroke={gold} strokeWidth="0.5" opacity="0.5" />

      {/* Hindi tagline */}
      <SvgText
        x="190" y="278" textAnchor="middle"
        fontSize="9" letterSpacing="0"
        fontFamily="CormorantGaramond_400Regular"
        fill={gold}
      >
        YAADEIN · VIRASAT · APNAPAN
      </SvgText>

      <Line x1="120" y1="287" x2="260" y2="287" stroke={gold} strokeWidth="0.4" opacity="0.35" />
    </Svg>
  );
}
