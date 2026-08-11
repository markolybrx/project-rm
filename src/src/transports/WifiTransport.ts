import {
  ConnectionState,
  InstalledApp,
  PairedDevice,
  RemoteKey,
  Transport,
  TransportType,
} from './types';

/**
 * Wi-Fi transport — Android TV Remote protocol v2.
 *
 * Real implementation, not yet wired up:
 *  1. Discovery: mDNS browse for `_androidtvremote2._tcp` on the LAN to
 *     find candidate TVs (name, IP, port).
 *  2. Pairing: open a TLS socket to the pairing port, exchange a
 *     self-signed client cert, TV displays a 6-digit code, app sends it
 *     back to confirm. Store the cert for reconnects — this is what lets
 *     future connections skip the code.
 *  3. Control: open a second TLS socket to the remote-control port, send
 *     protobuf-encoded key events. Keep it open for the life of the
 *     session; the TV will occasionally send back current-app/volume
 *     state on the same socket.
 *
 * None of steps 1-3 have native equivalents in plain Expo — this needs a
 * native module for TCP+TLS sockets (Expo's fetch/WebSocket APIs don't
 * expose raw TLS) and for mDNS discovery. Candidate approach: a small
 * Kotlin native module wrapping java.net.Socket + SSLContext, exposed to
 * JS via Expo Modules API.
 */
export class WifiTransport implements Transport {
  readonly type = TransportType.WIFI;

  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private listeners = new Set<(state: ConnectionState) => void>();

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

  async connect(_device: PairedDevice): Promise<void> {
    // TODO: open TLS control socket using stored pairing cert.
    this.setState(ConnectionState.CONNECTING);
    throw new Error('WifiTransport.connect: native TLS socket module not yet implemented');
  }

  async disconnect(): Promise<void> {
    // TODO: close the control socket.
    this.setState(ConnectionState.DISCONNECTED);
  }

  async sendKey(_key: RemoteKey): Promise<void> {
    // TODO: encode key as protobuf KeyEvent message, write to control socket.
    throw new Error('WifiTransport.sendKey: not yet implemented');
  }

  async sendText(_text: string): Promise<void> {
    // TODO: Android TV Remote v2 sends text as a sequence of key events,
    // not a single string message — will likely reuse sendKey per character.
    throw new Error('WifiTransport.sendText: not yet implemented');
  }

  async getInstalledApps(): Promise<InstalledApp[]> {
    // TODO: the v2 protocol exposes a "current app" field on the control
    // socket but not a full installed-app list directly — may need a
    // companion lightweight ADB-over-network call for this specific
    // feature, gated behind Developer Options being enabled on the TV.
    return [];
  }

  async isSupported(): Promise<boolean> {
    // Wi-Fi remote control works on any Google TV device — always true
    // for this project's target hardware.
    return true;
  }
}
