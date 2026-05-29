import Svg, { Rect, Line, Circle, Path } from 'react-native-svg';

interface Props {
  size?: number;
}

export default function AlmariIcon({ size = 40 }: Props) {
  const scale = size / 60;
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60">
      <Rect width="60" height="60" rx="13" fill="#0D1B3E" />
      <Rect x="11" y="10" width="38" height="40" rx="2" fill="#0D1B3E" stroke="#C9953C" strokeWidth="0.8" />
      <Line x1="30" y1="10" x2="30" y2="50" stroke="#C9953C" strokeWidth="0.5" />
      <Rect x="9" y="8" width="42" height="4" rx="1" fill="#0D1B3E" stroke="#C9953C" strokeWidth="0.6" />
      <Rect x="13" y="49" width="3" height="5" rx="1" fill="#C9953C" />
      <Rect x="44" y="49" width="3" height="5" rx="1" fill="#C9953C" />
      <Rect x="12" y="15" width="14" height="18" rx="1.5" fill="#1E3060" stroke="#C8D4DC" strokeWidth="0.4" />
      <Circle cx="16" cy="22" r="1" fill="#C9953C" />
      <Circle cx="20" cy="19" r="0.8" fill="#E8C4C0" />
      <Circle cx="23" cy="24" r="1" fill="#C9953C" />
      <Circle cx="28" cy="37" r="1.2" fill="#C9953C" />
      <Circle cx="22" cy="37" r="1.2" fill="#C9953C" />
      <Rect x="34" y="15" width="13" height="18" rx="1.5" fill="#152347" stroke="#C8D4DC" strokeWidth="0.4" opacity="0.8" />
      <Circle cx="34" cy="39" r="1.2" fill="#C9953C" />
      <Path d="M34 40 Q36 44 34 47 Q32 49 34 50" stroke="#E8C4C0" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </Svg>
  );
}
