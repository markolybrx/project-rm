import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { StreamingAppShortcut } from '@/data/streamingApps';

interface AppShortcutGridProps {
  apps: StreamingAppShortcut[];
  onPressApp: (app: StreamingAppShortcut) => void;
  onPressEdit: () => void;
}

export function AppShortcutGrid({ apps, onPressApp, onPressEdit }: AppShortcutGridProps) {
  return (
    <View style={styles.grid}>
      {apps.map((app) => (
        <AppTile key={app.id} app={app} onPress={() => onPressApp(app)} />
      ))}
      <Pressable style={styles.editTile} onPress={onPressEdit}>
        <Text style={styles.editText}>Edit</Text>
      </Pressable>
    </View>
  );
}

function AppTile({ app, onPress }: { app: StreamingAppShortcut; onPress: () => void }) {
  const [iconFailed, setIconFailed] = React.useState(false);

  return (
    <Pressable
      style={[styles.tile, { backgroundColor: iconFailed ? app.brandColor : colors.surface }]}
      onPress={onPress}
    >
      {!iconFailed ? (
        <Image
          // NOTE: this will throw a bundler error until a real file exists
          // at each iconAsset path — see streamingApps.ts for sourcing
          // notes. onError below falls back to the letter placeholder so
          // the grid still renders during development.
          source={{ uri: app.iconAsset }}
          style={styles.icon}
          onError={() => setIconFailed(true)}
        />
      ) : (
        <Text style={styles.fallbackLetter}>{app.label.charAt(0)}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: '60%', height: '60%', resizeMode: 'contain' },
  fallbackLetter: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  editTile: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.outlineSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editText: { color: colors.inkVariant, fontSize: 11 },
});
