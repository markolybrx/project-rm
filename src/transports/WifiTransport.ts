import TcpSocket from 'react-native-tcp-socket';
import { ControlSession, RemoteKeyCode } from './control';
import { PairingSession, PairingDebugInfo } from './pairing';
import {
  ConnectionState,
  InstalledApp,
  PairedDevice,
  RemoteKey,
  Transport,
  TransportType,
} from './types';

const PAIRING_PORT = 6467;

const KEY_MAP: Record<RemoteKey, number> = {
  [RemoteKey.DPAD_UP]: RemoteKeyCode.DPAD_UP,
  [RemoteKey.DPAD_DOWN]: RemoteKeyCode.DPAD_DOWN,
  [RemoteKey.DPAD_LEFT]: RemoteKeyCode.DPAD_LEFT,
  [RemoteKey.DPAD_RIGHT]: RemoteKeyCode.DPAD_RIGHT,
  [RemoteKey.DPAD_CENTER]: RemoteKeyCode.DPAD_CENTER,
  [RemoteKey.BACK]: RemoteKeyCode.BACK,
  [RemoteKey.HOME]: RemoteKeyCode.HOME,
  [RemoteKey.MENU]: RemoteKeyCode.MENU,
  [RemoteKey.APPS]: RemoteKeyCode.APP_SWITCH,
  [RemoteKey.POWER]: RemoteKeyCode.POWER,
  [RemoteKey.INPUT_SOURCE]: RemoteKeyCode.TV_INPUT,
  [RemoteKey.VOLUME_UP]: RemoteKeyCode.VOLUME_UP,
  [RemoteKey.VOLUME_DOWN]: RemoteKeyCode.VOLUME_DOWN,
  [RemoteKey.CHANNEL_UP]: RemoteKeyCode.CHANNEL_UP,
  [RemoteKey.CHANNEL_DOWN]: RemoteKeyCode.CHANNEL_DOWN,
  [RemoteKey.MUTE]: RemoteKeyCode.VOLUME_MUTE,
  [RemoteKey.VOICE]: RemoteKeyCode.SEARCH,
};

/**
 * Wi-Fi transport — Android TV Remote protocol v2.
 *
 * Status: pairing confirmed working against the real TV. Control channel
 * (real key presses) implemented below, following the same verified
 * reference protocol — not yet confirmed against real hardware.
 */
export class WifiTransport implements Transport {
  readonly type = TransportType.WIFI;

  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private listeners = new Set<(state: ConnectionState) => void>();
  private pairingSession: PairingSession | null = null;
  private controlSession: ControlSession | null = null;

  getState(): ConnectionState {
    return this.state;
  }

  onStateChange(listener: (state: ConnectionState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(next: ConnectionState) {
    this.state = next;
    this.listeners.forEach((l) => l(next));
  }

  async testConnection(ipAddress: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        client.destroy();
        reject(new Error(`Timed out after 8s connecting to ${ipAddress}:${PAIRING_PORT}`));
      }, 8000);
      const client = TcpSocket.connectTLS(
        { host: ipAddress, port: PAIRING_PORT, rejectUnauthorized: false },
        () => {
          clearTimeout(timeout);
          resolve(`TLS handshake succeeded with ${ipAddress}:${PAIRING_PORT}.`);
          client.destroy();
        }
      );
      client.on('error', (err: Error) => {
        clearTimeout(timeout);
        reject(new Error(`Connection failed: ${err.message}`));
      });
    });
  }

  async startPairing(ipAddress: string, clientName: string): Promise<void> {
    this.setState(ConnectionState.CONNECTING);
    this.pairingSession = new PairingSession();
    try {
      await this.pairingSession.start(ipAddress, clientName);
    } catch (err) {
      this.setState(ConnectionState.ERROR);
      throw err;
    }
  }

  async submitPairingCode(code: string): Promise<void> {
    if (!this.pairingSession) throw new Error('No pairing in progress — call startPairing first');
    await this.pairingSession.submitCode(code);
    // Pairing done — now open the actual control channel so buttons work.
  }

  getPairingDebugInfo(): PairingDebugInfo | null {
    return this.pairingSession?.getDebugInfo() ?? null;
  }

  async connect(device: PairedDevice): Promise<void> {
    if (!device.ipAddress) throw new Error('No IP address on this device');
    this.setState(ConnectionState.CONNECTING);
    this.controlSession = new ControlSession();
    try {
      await this.controlSession.connect(device.ipAddress);
      this.setState(ConnectionState.CONNECTED);
    } catch (err) {
      this.setState(ConnectionState.ERROR);
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    this.pairingSession?.close();
    this.controlSession?.close();
    this.setState(ConnectionState.DISCONNECTED);
  }

  async sendKey(key: RemoteKey): Promise<void> {
    if (!this.controlSession || !this.controlSession.isConnected()) {
      throw new Error('Control channel not connected yet');
    }
    const code = KEY_MAP[key];
    if (code === undefined) throw new Error(`No mapping for key ${key}`);
    this.controlSession.sendKey(code);
  }

  async sendText(_text: string): Promise<void> {
    throw new Error('WifiTransport.sendText: IME text injection not yet implemented');
  }

  async getInstalledApps(): Promise<InstalledApp[]> {
    return [];
  }

  async isSupported(): Promise<boolean> {
    return true;
  }
}
