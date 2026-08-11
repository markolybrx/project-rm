import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { RemoteScreen } from '@/screens/RemoteScreen';
import { colors } from '@/theme/tokens';

/**
 * Renders RemoteScreen directly for now, skipping Onboarding/Discover/
 * Pairing. Next phase: a lightweight screen stack (plain useState-based,
 * not React Navigation, to keep native-module surface area small) so the
 * full flow from the mockups is reachable:
 * onboard -> discover -> pair-code -> remote -> keyboard/edit/settings.
 */
export default function App() {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <RemoteScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
