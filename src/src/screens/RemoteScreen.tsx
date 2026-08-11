import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DPad } from '@/components/DPad';
import { TransportSwitch } from '@/components/TransportSwitch';
import { AppShortcutGrid } from '@/components/AppShortcutGrid';
import { defaultStreamingApps, StreamingAppShortcut } from '@/data/streamingApps';
import { colors, radius, spacing } from '@/theme/tokens';
import { transportManager } from '@/transports/TransportManager';
import { ConnectionState, RemoteKey, TransportType } from '@/transports/types';

/**
 * Placeholder paired-device info until the Discover/Pair flow (next
 * phase) actually populates this from a real pairing session.
 */
const MOCK_DEVICE_NAME = 'Xiaomi TV A 32';
const MOCK_DEVICE_IP = '192.168.1.42';

export function RemoteScreen() {
  const [transport, setTransport] = useState<TransportType>(TransportType.WIFI);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED
  );
  const [apps] = useState<StreamingAppShortcut[]>(defaultStreamingApps);

  useEffect(() => {
    transportManager.setActiveType(transport);
    const unsubscribe = transportManager.onStateChange(setConnectionState);
    setConnectionState(transportManager.getState());
    return unsubscribe;
  }, [transport]);

  async function send(key: RemoteKey) {
    try {
      await transportManager.sendKey(key);
    } catch (err) {
      // Expected right now — transports are stubbed. Surfacing this
      // instead of failing silently so it's obvious during dev builds
      // which paths are still unimplemented.
      Alert.alert('Not yet implemented', String((err as Error).message));
    }
  }

  function handleTransportChange(next: TransportType) {
    if (next === TransportType.IR) {
      Alert.alert(
        'IR unconfirmed',
        'IR support on this TV model has not been verified yet — see project notes.'
      );
      return;
    }
    setTransport(next);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.deviceStrip}>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor:
                connectionState === ConnectionState.CONNECTED
                  ? colors.success
                  : colors.inkFaint,
            },
          ]}
        />
        <Text style={styles.deviceName}>{MOCK_DEVICE_NAME}</Text>
        <Text style={styles.deviceMeta}>
          {transport} {'\u00B7'} {connectionState.toLowerCase()}
        </Text>
      </View>

      <TransportSwitch value={transport} onChange={handleTransportChange} />

      <View style={styles.topRow}>
        <Pressable style={[styles.roundBtn, styles.powerBtn]} onPress={() => send(RemoteKey.POWER)}>
          <Text style={styles.roundBtnText}>{'\u23FB'}</Text>
        </Pressable>
        <Pressable style={styles.roundBtn} onPress={() => send(RemoteKey.INPUT_SOURCE)}>
          <Text style={styles.roundBtnText}>{'\u2B1A'}</Text>
        </Pressable>
        <Pressable style={[styles.roundBtn, styles.kbBtn]} onPress={() => send(RemoteKey.VOICE)}>
          <Text style={styles.roundBtnText}>{'\u2328'}</Text>
        </Pressable>
      </View>

      <DPad
        onUp={() => send(RemoteKey.DPAD_UP)}
        onDown={() => send(RemoteKey.DPAD_DOWN)}
        onLeft={() => send(RemoteKey.DPAD_LEFT)}
        onRight={() => send(RemoteKey.DPAD_RIGHT)}
        onCenter={() => send(RemoteKey.DPAD_CENTER)}
      />

      <View style={styles.navRow}>
        <NavButton label="Back" onPress={() => send(RemoteKey.BACK)} />
        <NavButton label="Home" onPress={() => send(RemoteKey.HOME)} />
        <NavButton label="Menu" onPress={() => send(RemoteKey.MENU)} />
        <NavButton label="Apps" onPress={() => send(RemoteKey.APPS)} />
      </View>

      <View style={styles.rockerRow}>
        <Rocker
          upLabel="Vol +"
          downLabel="Vol -"
          onUp={() => send(RemoteKey.VOLUME_UP)}
          onDown={() => send(RemoteKey.VOLUME_DOWN)}
        />
        <Rocker
          upLabel="Ch +"
          downLabel="Ch -"
          onUp={() => send(RemoteKey.CHANNEL_UP)}
          onDown={() => send(RemoteKey.CHANNEL_DOWN)}
        />
      </View>

      <Text style={styles.sectionLabel}>Streaming shortcuts</Text>
      <AppShortcutGrid
        apps={apps}
        onPressApp={(app) =>
          Alert.alert('Launch app', `Would launch ${app.label} (${app.packageName})`)
        }
        onPressEdit={() => Alert.alert('Edit shortcuts', 'Screen not yet built — next phase.')}
      />
    </ScrollView>
  );
}

function NavButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.navBtn} onPress={onPress}>
      <Text style={styles.navBtnText}>{label}</Text>
    </Pressable>
  );
}

function Rocker({
  upLabel,
  downLabel,
  onUp,
  onDown,
}: {
  upLabel: string;
  downLabel: string;
  onUp: () => void;
  onDown: () => void;
}) {
  return (
    <View style={styles.rocker}>
      <Pressable style={styles.rockerHalf} onPress={onUp}>
        <Text style={styles.rockerText}>{upLabel}</Text>
      </Pressable>
      <View style={styles.rockerDivider} />
      <Pressable style={styles.rockerHalf} onPress={onDown}>
        <Text style={styles.rockerText}>{downLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 60 },
  deviceStrip: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  deviceName: { fontSize: 13.5, fontWeight: '500', color: colors.ink },
  deviceMeta: { fontSize: 11, color: colors.inkFaint, marginLeft: 2 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  roundBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  powerBtn: { backgroundColor: colors.primaryContainer },
  kbBtn: { borderRadius: 14 },
  roundBtnText: { fontSize: 18, color: colors.inkVariant },
  navRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 18 },
  navBtn: { alignItems: 'center' },
  navBtnText: { fontSize: 10, fontWeight: '500', color: colors.inkVariant },
  rockerRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  rocker: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden' },
  rockerHalf: { paddingVertical: 11, alignItems: 'center' },
  rockerDivider: { height: 1, backgroundColor: colors.outlineSoft },
  rockerText: { fontSize: 12, fontWeight: '500', color: colors.inkVariant },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.inkFaint,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
});
