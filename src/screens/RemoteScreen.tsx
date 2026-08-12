import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { DPad } from '../components/DPad';
import { TransportSwitch } from '../components/TransportSwitch';
import { AppShortcutGrid } from '../components/AppShortcutGrid';
import { defaultStreamingApps, StreamingAppShortcut } from '../data/streamingApps';
import { colors, radius, spacing } from '../theme/tokens';
import { transportManager } from '../transports/TransportManager';
import { WifiTransport } from '../transports/WifiTransport';
import { ConnectionState, RemoteKey, TransportType } from '../transports/types';

export function RemoteScreen() {
  const [transport, setTransport] = useState<TransportType>(TransportType.WIFI);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED
  );
  const [apps] = useState<StreamingAppShortcut[]>(defaultStreamingApps);
  const [ipAddress, setIpAddress] = useState('');
  const [testing, setTesting] = useState(false);
  const [tvName, setTvName] = useState('');

  useEffect(() => {
    transportManager.setActiveType(transport);
    const unsubscribe = transportManager.onStateChange(setConnectionState);
    setConnectionState(transportManager.getState());
    return unsubscribe;
  }, [transport]);

  async function handleTestConnection() {
    if (!ipAddress.trim()) {
      Alert.alert('Enter an IP first', "Find it under your TV's network settings.");
      return;
    }
    setTesting(true);
    try {
      const wifi = transportManager.get(TransportType.WIFI) as WifiTransport;
      const result = await wifi.testConnection(ipAddress.trim());
      setTvName(ipAddress.trim());
      Alert.alert('Connection test result', result);
    } catch (err) {
      Alert.alert('Connection test failed', String((err as Error).message));
    } finally {
      setTesting(false);
    }
  }

  async function send(key: RemoteKey) {
    try {
      await transportManager.sendKey(key);
    } catch (err) {
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
    if (next === TransportType.BLUETOOTH) {
      Alert.alert(
        'Not built yet',
        'Bluetooth HID needs a custom native module that has not been written yet.'
      );
      return;
    }
    setTransport(next);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {!tvName ? (
        <View style={styles.connectForm}>
          <Text style={styles.sectionLabel}>Connect to your TV (test connection)</Text>
          <Text style={styles.helperText}>
            Enter the Xiaomi TV's IP address (Settings → Network on the TV). This only tests
            whether the phone can open a TLS connection to it — full pairing isn't built yet.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="192.168.1.42"
            placeholderTextColor={colors.inkFaint}
            value={ipAddress}
            onChangeText={setIpAddress}
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
          />
          <Pressable style={styles.testBtn} onPress={handleTestConnection} disabled={testing}>
            <Text style={styles.testBtnText}>{testing ? 'Testing…' : 'Test connection'}</Text>
          </Pressable>
        </View>
      ) : (
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
          <Text style={styles.deviceName}>{tvName}</Text>
          <Pressable onPress={() => setTvName('')}>
            <Text style={styles.deviceMeta}>change</Text>
          </Pressable>
        </View>
      )}

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
  connectForm: { marginBottom: 18 },
  helperText: { fontSize: 11.5, color: colors.inkFaint, lineHeight: 16, marginBottom: 10 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 10,
  },
  testBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 13,
    alignItems: 'center',
  },
  testBtnText: { color: colors.onPrimary, fontWeight: '600', fontSize: 13.5 },
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
