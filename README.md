# tv-remote

## Setup (Termux)

```bash
cd ~/tv-remote
npm install
```

## Run in dev (Expo Go, on-device)

```bash
npx expo start
```

## Build APK via EAS

```bash
npx eas-cli build -p android --profile preview
```

If `eas.json` doesn't exist yet:

```bash
cat > eas.json << 'EOF'
{
  "cli": { "version": ">= 5.9.0" },
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    },
    "production": {}
  },
  "submit": { "production": {} }
}
EOF
```

## What's built so far

- Project scaffold (Expo + TypeScript, minimal deps — no React Navigation
  yet, plain state-based screen switching to keep native-module surface
  small for EAS builds)
- Theme tokens (Material 3 style, Xiaomi orange accent)
- Transport abstraction: `TransportManager` + `WifiTransport` /
  `BluetoothTransport` / `IrTransport` stubs — interfaces are real, native
  socket/HID/IR calls are TODO
- Remote screen: dpad, transport switch, power/input/voice, volume/channel
  rockers, back/home/menu/apps, streaming shortcut grid
- Streaming app data with real package names — icons need actual asset
  files dropped into `assets/icons/` (not included; see
  `src/data/streamingApps.ts` for sourcing notes)

## Not built yet

- Onboarding / Discover / Pairing-code / Keyboard / Edit-shortcuts /
  Settings / Controller-mode screens (mocked in the earlier HTML
  prototypes, not yet ported to RN)
- Native modules for Wi-Fi TLS pairing, Bluetooth HID, IR
- IR is blocked on confirming the TV actually has an IR receiver
