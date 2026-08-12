import TcpSocket from 'react-native-tcp-socket';
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

/**
 * Wi-Fi transport — Android TV Remote protocol v2.
 *
 * Status:
 *  1. Discovery: not built — user enters TV IP manually.
 *  2. TLS connectivity test: testConnection() — confirmed working against
 *     the real TV.
 *  3. Pairing handshake: startPairing()/submitPairingCode() below, using
 *     PairingSession — implements the actual protocol (PairingRequest,
 *     Options/Configuration negotiation, RSA-cert-based secret exchange)
 *     ported from the verified open-source reference implementation.
 *     Not yet confirmed against the real TV.
 *  4. Control channel (port 6466, sending actual key events after
 *     pairing) — still not built. That's the next phase once pairing is
 *     confirmed working.
 */
export class WifiTransport implements Transport {
  readonly type = TransportType.WIFI;

  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private listeners = new Set<(state: ConnectionState) => void>();
  private pairingSession: PairingSession | null = null;

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

  /**
   * Starts real pairing. Resolves once the TV should be showing its
   * 6-digit code on screen. Call submitPairingCode() next.
   */
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
    try {
      await this.pairingSession.submitCode(code);
      this.setState(ConnectionState.CONNECTED);
    } catch (err) {
      this.setState(ConnectionState.ERROR);
      throw err;
    }
  }

  getPairingDebugInfo(): PairingDebugInfo | null {
    return this.pairingSession?.getDebugInfo() ?? null;
  }

  async connect(_device: PairedDevice): Promise<void> {
    throw new Error('WifiTransport.connect: use startPairing/submitPairingCode, then the control channel (not yet built)');
  }

  async disconnect(): Promise<void> {
    this.pairingSession?.close();
    this.setState(ConnectionState.DISCONNECTED);
  }

  async sendKey(_key: RemoteKey): Promise<void> {
    throw new Error('WifiTransport.sendKey: control channel (port 6466) not yet implemented');
  }

  async sendText(_text: string): Promise<void> {
    throw new Error('WifiTransport.sendText: not yet implemented');
  }

  async getInstalledApps(): Promise<InstalledApp[]> {
    return [];
  }

  async isSupported(): Promise<boolean> {
    return true;
  }
}
