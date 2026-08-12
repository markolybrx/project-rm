import TcpSocket from 'react-native-tcp-socket';
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
 * Real implementation status:
 *  1. Discovery: not yet built — user enters TV IP manually for now.
 *  2. TLS connectivity: testConnection() below actually opens a real TLS
 *     socket to the TV's pairing port (6467) and reports what happens.
 *     This is the first testable slice — confirms the phone can even
 *     reach the TV over TLS before we build the actual pairing message
 *     protocol on top of it.
 *  3. Pairing handshake (PairingRequest/PairingOption/PairingSecret
 *     protobuf messages, 6-digit code exchange) and the control-channel
 *     key events (port 6466) are NOT built yet — connect()/sendKey()
 *     below still throw. That's the next phase, once testConnection()
 *     is confirmed working against the real TV.
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

  /**
   * Diagnostic-only: opens a real TLS socket to the TV's pairing port and
   * resolves with a description of what happened. Not part of the
   * Transport interface — this is a standalone debug step, called
   * directly from the UI's connect form.
   */
  async testConnection(ipAddress: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        client.destroy();
        reject(new Error(`Timed out after 8s connecting to ${ipAddress}:${PAIRING_PORT}`));
      }, 8000);

      const client = TcpSocket.connectTLS(
        {
          host: ipAddress,
          port: PAIRING_PORT,
          rejectUnauthorized: false,
        },
        () => {
          clearTimeout(timeout);
          resolve(
            `TLS handshake succeeded with ${ipAddress}:${PAIRING_PORT}. Socket is open — next step is sending the actual pairing request message.`
          );
          client.destroy();
        }
      );

      client.on('error', (err: Error) => {
        clearTimeout(timeout);
        reject(new Error(`Connection failed: ${err.message}`));
      });
    });
  }

  async connect(_device: PairedDevice): Promise<void> {
    this.setState(ConnectionState.CONNECTING);
    throw new Error(
      'WifiTransport.connect: pairing protocol not yet implemented — use testConnection() for now'
    );
  }

  async disconnect(): Promise<void> {
    this.setState(ConnectionState.DISCONNECTED);
  }

  async sendKey(_key: RemoteKey): Promise<void> {
    throw new Error('WifiTransport.sendKey: control channel not yet implemented');
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
