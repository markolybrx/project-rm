import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { TransportType } from '@/transports/types';

interface TransportSwitchProps {
  value: TransportType;
  onChange: (next: TransportType) => void;
  disabled?: Partial<Record<TransportType, boolean>>;
}

const OPTIONS: { type: TransportType; label: string }[] = [
  { type: TransportType.WIFI, label: 'Wi-Fi' },
  { type: TransportType.BLUETOOTH, label: 'Bluetooth' },
  { type: TransportType.IR, label: 'IR' },
];

export function TransportSwitch({ value, onChange, disabled }: TransportSwitchProps) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((opt, i) => {
        const isActive = opt.type === value;
        const isDisabled = disabled?.[opt.type] ?? false;
        return (
          <Pressable
            key={opt.type}
            disabled={isDisabled}
            onPress={() => onChange(opt.type)}
            style={[
              styles.segment,
              i < OPTIONS.length - 1 && styles.divider,
              isActive && styles.segmentActive,
              isDisabled && styles.segmentDisabled,
            ]}
          >
            <Text
              style={[
                styles.label,
                isActive && styles.labelActive,
                isDisabled && styles.labelDisabled,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: 18,
  },
  segment: { flex: 1, paddingVertical: 9, alignItems: 'center' },
  divider: { borderRightWidth: 1, borderRightColor: colors.outlineSoft },
  segmentActive: { backgroundColor: colors.primaryContainer },
  segmentDisabled: { opacity: 0.4 },
  label: { fontSize: 12, fontWeight: '500', color: colors.inkVariant },
  labelActive: { color: colors.onPrimaryContainer },
  labelDisabled: { color: colors.inkFaint },
});
