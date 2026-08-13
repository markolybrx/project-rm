import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { DPad } from '../components/DPad';
import { TransportSwitch } from '../components/TransportSwitch';
import { AppShortcutGrid } from '../components/AppShortcutGrid';
import { defaultStreamingApps, StreamingAppShortcut } from '../data/streamingApps';
import { ControllerScreen } from './ControllerScreen';
import { colors, radius, spacing } from '../theme/tokens';
import { transportManager } from '../transports/TransportManager';
import { WifiTransport } from '../transports/WifiTransport';
import { ConnectionState, RemoteKey, TransportType } from '../transports/types';

type PairStage = 'enter-ip' | 'enter-code' | 'paired';

export function RemoteScreen() {
  const [transport, setTransport] = useState<TransportType>(TransportType.WIFI);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.DISCONNECTED
  );
  const [apps] = useState<StreamingAppShortcut[]>(defaultStreamingApps);
  const [ipAddress, setIpAddress] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [stage, setStage] = useState<PairStage>('enter-ip');
  const [busy, setBusy] = useState(false);
  const [tvName, setTvName] = useState('');
  const [screenMode, setScreenMode] = useState<'remote' | 'controller'>('remote');

  useEffect(() => {
    transportManager.setActiveType(transport);
    const unsubscribe = transportManager.onStateChange(setConnectionState);
    setConnectionState(transportManager.getState());
    return unsubscribe;
  }, [transport]);

  function getWifi(): WifiTransport {
    return transportManager.get(TransportType.WIFI) as WifiTransport;
  }

  async function handleStartPairing() {
    if (!ipAddress.trim()) {
      Alert.alert('Enter an IP first', "Find it under your TV's network settings.");
      return;
    }
    setBusy(true);
    try {
      await getWifi().startPairing(ipAddress.trim(), 'TV Remote');
      setStage('enter-code');
    } catch (err) {
      Alert.alert('Pairing failed', String((err as Error).message));
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitCode() {
    setBusy(true);
    try {
      await getWifi().submitPairingCode(pairingCode.trim());
      await transportManager.connect({
        id: ipAddress.trim(),
        name: ipAddress.trim(),
        ipAddress: ipAddress.trim(),
        transport: TransportType.WIFI,
      });
      setTvName(ipAddress.trim());
      setStage('paired');
    } catch (err) {
      const debugInfo = getWifi().getPairingDebugInfo();
      Alert.alert(
        'Pairing failed',
        `${(err as Error).message}\n\nDebug info:\n${JSON.stringify(debugInfo, null, 2)}`
      );
    } finally {
      setBusy(false);
    }
  }

  function resetPairing() {
    setStage('enter-ip');
    setPairingCode('');
    setTvName('');
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
      Alert.alert('IR unconfirmed', 'IR support on this TV model has not been verified yet.');
      return;
    }
    if (next === TransportType.BLUETOOTH) {
      Alert.alert('Not built yet', 'Bluetooth HID needs a custom native module that has not been written yet.');
      return;
    }
    setTransport(next);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.modeToggle}>
        <Pressable
          style={[styles.modeTab, screenMode === 'remote' && styles.modeTabActive]}
          onPress={() => setScreenMode('remote')}
        >
          <Text style={[styles.modeText, screenMode === 'remote' && styles.modeTextActive]}>Remote</Text>
        </Pressable>
        <Pressable
          style={[styles.modeTab, screenMode === 'controller' && styles.modeTabActive]}
          onPress={() => setScreenMode('controller')}
        >
          <Text style={[styles.modeText, screenMode === 'controller' && styles.modeTextActive]}>Controller</Text>
        </Pressable>
      </View>

      {screenMode === 'controller' ? (
        <ControllerScreen />
      ) : (
        <>
      {stage === 'enter-ip' && (
        <View style={styles.connectForm}>
          <Text style={styles.sectionLabel}>Pair with your TV</Text>
          <Text style={styles.helperText}>
            Enter the Xiaomi TV's IP address (Settings → Network on the TV).
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
          <Pressable style={styles.testBtn} onPress={handleStartPairing} disabled={busy}>
            <Text style={styles.testBtnText}>{busy ? 'Connecting…' : 'Pair'}</Text>
          </Pressable>
        </View>
      )}

      {stage === 'enter-code' && (
        <View style={styles.connectForm}>
          <Text style={styles.sectionLabel}>Enter the code shown on your TV</Text>
          <Text style={styles.helperText}>
            The TV should now be displaying a 6-character code. Type it exactly as shown.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="A1B2C3"
            placeholderTextColor={colors.inkFaint}
            value={pairingCode}
            onChangeText={setPairingCode}
            autoCapitalize="characters"
            maxLength={6}
          />
          <Pressable style={styles.testBtn} onPress={handleSubmitCode} disabled={busy}>
            <Text style={styles.testBtnText}>{busy ? 'Verifying…' : 'Confirm'}</Text>
          </Pressable>
          <Pressable onPress={resetPairing} style={{ marginTop: 10 }}>
            <Text style={styles.helperText}>Start over</Text>
          </Pressable>
        </View>
      )}

      {stage === 'paired' && (
        <View style={styles.deviceStrip}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  connectionState === ConnectionState.CONNECTED ? colors.success : colors.inkFaint,
              },
            ]}
          />
          <Text style={styles.deviceName}>{tvName}</Text>
          <Pressable onPress={resetPairing}>
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
        onPressApp={(app) => Alert.alert('Launch app', `Would launch ${app.label} (${app.packageName})`)}
        onPressEdit={() => Alert.alert('Edit shortcuts', 'Screen not yet built — next phase.')}
      />
        </>
      )}
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
  modeToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.outlineSoft,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: 18,
  },
  modeTab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  modeTabActive: { backgroundColor: colors.primaryContainer },
  modeText: { fontSize: 12.5, fontWeight: '600', color: colors.inkVariant },
  modeTextActive: { color: colors.onPrimaryContainer },
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
