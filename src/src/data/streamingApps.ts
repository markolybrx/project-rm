export interface StreamingAppShortcut {
  id: string;
  label: string;
  packageName: string;
  brandColor: string;
  /**
   * Path to the app's real icon, expected at assets/icons/<id>.png.
   * These are NOT bundled here — official app icons are trademarked
   * assets and need to be sourced per each brand's guidelines (usually
   * from their press/brand kit) and dropped into assets/icons/ before
   * this app can require() them. Until then, AppShortcutGrid falls back
   * to the initial-letter placeholder seen in the mockups.
   */
  iconAsset: string;
}

export const defaultStreamingApps: StreamingAppShortcut[] = [
  {
    id: 'netflix',
    label: 'Netflix',
    packageName: 'com.netflix.ninja',
    brandColor: '#E50914',
    iconAsset: 'assets/icons/netflix.png',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    packageName: 'com.google.android.youtube.tv',
    brandColor: '#FF0000',
    iconAsset: 'assets/icons/youtube.png',
  },
  {
    id: 'prime-video',
    label: 'Prime Video',
    packageName: 'com.amazon.amazonvideo.livingroom',
    brandColor: '#00A8E1',
    iconAsset: 'assets/icons/prime-video.png',
  },
  {
    id: 'disney-plus',
    label: 'Disney+',
    packageName: 'com.disney.disneyplus',
    brandColor: '#113CCF',
    iconAsset: 'assets/icons/disney-plus.png',
  },
  {
    id: 'hotstar',
    label: 'JioHotstar',
    packageName: 'in.startv.hotstar',
    brandColor: '#0F1F3D',
    iconAsset: 'assets/icons/hotstar.png',
  },
  {
    id: 'spotify',
    label: 'Spotify',
    packageName: 'com.spotify.tv.android',
    brandColor: '#1DB954',
    iconAsset: 'assets/icons/spotify.png',
  },
  {
    id: 'plex',
    label: 'Plex',
    packageName: 'com.plexapp.android',
    brandColor: '#E5A00D',
    iconAsset: 'assets/icons/plex.png',
  },
];
