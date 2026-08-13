import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme/tokens';

/**
 * Bluetooth HID gamepad UI. Buttons are fully laid out and reviewable now,
 * but sendGamepadState() on BluetoothTransport still throws — this screen
 * is ready to go live the moment the native HID module exists, no UI
 * changes needed then.
 */
export function ControllerScreen() {
  function notImplemented(label: string) {
    Alert.alert(
      'Not built yet',
      `${label} needs the Bluetooth HID gamepad native module, which hasn't been written yet.`
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>Controller mode — Bluetooth gamepad (not yet wired to hardware)</Text>

      <View style={styles.topRow}>
        <FaceButton label="L" onPress={() => notImplemented('L trigger')} />
        <FaceButton label="R" onPress={() => notImplemented('R trigger')} />
      </View>

      <View style={styles.midRow}>
        <Stick label="LEFT STICK" onPress={() => notImplemented('Left stick')} />
        <View style={styles.dpadMini}>
          <Pressable style={styles.dpadBtn} onPress={() => notImplemented('D-pad up')}>
            <Text style={styles.dpadText}>{'\u25B2'}</Text>
          </Pressable>
          <View style={styles.dpadMidRow}>
            <Pressable style={styles.dpadBtn} onPress={() => notImplemented('D-pad left')}>
              <Text style={styles.dpadText}>{'\u25C0'}</Text>
            </Pressable>
            <Pressable style={styles.dpadBtn} onPress={() => notImplemented('D-pad right')}>
              <Text style={styles.dpadText}>{'\u25B6'}</Text>
            </Pressable>
          </View>
          <Pressable style={styles.dpadBtn} onPress={() => notImplemented('D-pad down')}>
            <Text style={styles.dpadText}>{'\u25BC'}</Text>
          </Pressable>
        </View>
        <View style={styles.abxy}>
          <FaceButton label="Y" onPress={() => notImplemented('Y button')} style={styles.abxyTop} />
          <View style={styles.abxyMidRow}>
            <FaceButton label="X" onPress={() => notImplemented('X button')} />
            <FaceButton label="B" onPress={() => notImplemented('B button')} />
          </View>
          <FaceButton label="A" onPress={() => notImplemented('A button')} style={styles.abxyBottom} />
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Pressable style={styles.pillBtn} onPress={() => notImplemented('Select')}>
          <Text style={styles.pillText}>SELECT</Text>
        </Pressable>
        <Stick label="RIGHT STICK" onPress={() => notImplemented('Right stick')} />
        <Pressable style={styles.pillBtn} onPress={() => notImplemented('Start')}>
          <Text style={styles.pillText}>START</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FaceButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: any;
}) {
  return (
    <Pressable style={[styles.faceBtn, style]} onPress={onPress}>
      <Text style={styles.faceBtnText}>{label}</Text>
    </Pressable>
  );
}

function Stick({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.stick} onPress={onPress}>
      <View style={styles.stickInner} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  hint: { fontSize: 11, color: colors.inkFaint, textAlign: 'center', marginBottom: 24 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 30 },
  midRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 30 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  faceBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceBtnText: { color: colors.inkVariant, fontWeight: '700', fontSize: 14 },
  dpadMini: { width: 90, alignItems: 'center' },
  dpadBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dpadText: { color: colors.inkVariant, fontSize: 14 },
  dpadMidRow: { flexDirection: 'row', gap: 22, marginVertical: 4 },
  abxy: { width: 100, alignItems: 'center' },
  abxyTop: { marginBottom: 6 },
  abxyBottom: { marginTop: 6 },
  abxyMidRow: { flexDirection: 'row', gap: 36 },
  stick: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryContainer,
  },
  pillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  pillText: { fontSize: 10, fontWeight: '600', color: colors.inkVariant, letterSpacing: 0.5 },
});
