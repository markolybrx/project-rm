export enum TransportType {
  WIFI = 'WIFI',
  BLUETOOTH = 'BLUETOOTH',
  IR = 'IR',
}

export enum RemoteKey {
  DPAD_UP = 'DPAD_UP',
  DPAD_DOWN = 'DPAD_DOWN',
  DPAD_LEFT = 'DPAD_LEFT',
  DPAD_RIGHT = 'DPAD_RIGHT',
  DPAD_CENTER = 'DPAD_CENTER',
  BACK = 'BACK',
  HOME = 'HOME',
  MENU = 'MENU',
  APPS = 'APPS',
  POWER = 'POWER',
  INPUT_SOURCE = 'INPUT_SOURCE',
  VOLUME_UP = 'VOLUME_UP',
  VOLUME_DOWN = 'VOLUME_DOWN',
  CHANNEL_UP = 'CHANNEL_UP',
  CHANNEL_DOWN = 'CHANNEL_DOWN',
  MUTE = 'MUTE',
  VOICE = 'VOICE',
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface PairedDevice {
  id: string;
  name: string;
  ipAddress?: string;
  transport: TransportType;
}

export interface InstalledApp {
  packageName: string;
  label: string;
  iconUri?: string;
}

/**
 * Common interface every transport implementation must satisfy. The UI
 * layer only ever talks to this interface via TransportManager — it never
 * imports WifiTransport / BluetoothTransport / IrTransport directly.
 */
export interface Transport {
  readonly type: TransportType;

  getState(): ConnectionState;
  onStateChange(listener: (state: ConnectionState) => void): () => void;

  connect(device: PairedDevice): Promise<void>;
  disconnect(): Promise<void>;

  sendKey(key: RemoteKey): Promise<void>;
  sendText(text: string): Promise<void>;

  /** Only meaningful for transports that can query the TV's app list (Wi-Fi). */
  getInstalledApps(): Promise<InstalledApp[]>;

  /** Whether this transport is usable at all on the current hardware. */
  isSupported(): Promise<boolean>;
}
