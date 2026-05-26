import { View, Text, TextInput, StyleSheet } from 'react-native'
import { useTheme } from '@/hooks/useTheme'

export interface MeasurementValues {
  bust: string
  waist: string
  hips: string
  height: string
  shoeSize: string
}

interface Props {
  values: MeasurementValues
  onChange: (values: MeasurementValues) => void
  focusedField: string | null
  onFocusField: (field: string | null) => void
}

export function MeasurementsForm({ values, onChange, focusedField, onFocusField }: Props) {
  const theme = useTheme()
  const s = makeStyles(theme)
  const border = (field: string) => focusedField === field ? theme.borderFocused : theme.border
  const set = (key: keyof MeasurementValues) => (v: string) => onChange({ ...values, [key]: v })

  return (
    <View>
      <View style={s.grid}>
        {([
          { key: 'bust',   label: 'Bust cm' },
          { key: 'waist',  label: 'Waist cm' },
          { key: 'hips',   label: 'Hips cm' },
          { key: 'height', label: 'Height cm' },
        ] as const).map(({ key, label }) => (
          <View key={key} style={s.cell}>
            <Text style={[s.label, { color: theme.textSecondary }]}>{label}</Text>
            <TextInput
              style={[s.input, { borderColor: border(key), backgroundColor: theme.inputBackground, color: theme.text }]}
              value={values[key]}
              onChangeText={set(key)}
              keyboardType="number-pad"
              placeholder="—"
              placeholderTextColor={theme.textDisabled}
              onFocus={() => onFocusField(key)}
              onBlur={() => onFocusField(null)}
            />
          </View>
        ))}
      </View>

      <View style={s.shoeRow}>
        <Text style={[s.label, { color: theme.textSecondary }]}>UK shoe size</Text>
        <TextInput
          style={[s.shoeInput, { borderColor: border('shoe'), backgroundColor: theme.inputBackground, color: theme.text }]}
          value={values.shoeSize}
          onChangeText={set('shoeSize')}
          keyboardType="decimal-pad"
          placeholder="e.g. 6.5"
          placeholderTextColor={theme.textDisabled}
          onFocus={() => onFocusField('shoe')}
          onBlur={() => onFocusField(null)}
        />
      </View>
    </View>
  )
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
    cell:      { width: '47%' },
    label:     { fontFamily: 'Inter_400Regular', fontSize: 12, marginBottom: 4 },
    input:     { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontFamily: 'Inter_400Regular', fontSize: 15 },
    shoeRow:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
    shoeInput: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontFamily: 'Inter_400Regular', fontSize: 15 },
  })
}
