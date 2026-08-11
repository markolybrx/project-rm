import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/tokens';

interface DPadProps {
  onUp: () => void;
  onDown: () => void;
  onLeft: () => void;
  onRight: () => void;
  onCenter: () => void;
}

export function DPad({ onUp, onDown, onLeft, onRight, onCenter }: DPadProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.ring}>
        <Pressable style={[styles.arrow, styles.up]} onPress={onUp} hitSlop={8}>
          <Text style={styles.arrowText}>{'\u25B2'}</Text>
        </Pressable>
        <Pressable style={[styles.arrow, styles.down]} onPress={onDown} hitSlop={8}>
          <Text style={styles.arrowText}>{'\u25BC'}</Text>
        </Pressable>
        <Pressable style={[styles.arrow, styles.left]} onPress={onLeft} hitSlop={8}>
          <Text style={styles.arrowText}>{'\u25C0'}</Text>
        </Pressable>
        <Pressable style={[styles.arrow, styles.right]} onPress={onRight} hitSlop={8}>
          <Text style={styles.arrowText}>{'\u25B6'}</Text>
        </Pressable>
        <Pressable style={styles.ok} onPress={onCenter}>
          <Text style={styles.okText}>OK</Text>
        </Pressable>
      </View>
    </View>
  );
}

const SIZE = 200;
const ARROW = 58;
const OK = 70;

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignSelf: 'center', marginBottom: 20 },
  ring: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.surface,
    position: 'relative',
  },
  arrow: {
    position: 'absolute',
    width: ARROW,
    height: ARROW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { color: colors.inkVariant, fontSize: 16 },
  up: { top: 6, left: (SIZE - ARROW) / 2 },
  down: { bottom: 6, left: (SIZE - ARROW) / 2 },
  left: { left: 6, top: (SIZE - ARROW) / 2 },
  right: { right: 6, top: (SIZE - ARROW) / 2 },
  ok: {
    position: 'absolute',
    top: SIZE / 2 - OK / 2,
    left: SIZE / 2 - OK / 2,
    width: OK,
    height: OK,
    borderRadius: OK / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okText: { color: colors.onPrimary, fontWeight: '500', fontSize: 13 },
});
