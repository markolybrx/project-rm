import {
  ConnectionState,
  InstalledApp,
  PairedDevice,
  RemoteKey,
  Transport,
  TransportType,
} from './types';

/**
 * IR transport — UNCONFIRMED for the Xiaomi TV A 32 2026.
 *
 * The phone has a physical IR blaster, so ConsumerIrManager is usable on
 * the phone side. But the bundled remote for this TV model is
 * Bluetooth-only, with no documented IR receiver on the TV. isSupported()
 * returns false until this has been verified against the physical unit —
 * do not implement sendKey()/connect() for real until that's confirmed,
 * since there would be nothing on the TV side to receive the signal.
 *
 * If confirmed usable: ConsumerIrManager.transmit(frequency, pattern)
 * with a Xiaomi/MIUI IR code set (carrier frequency + on/off pulse
 * pattern per button, sourced from a code database or captured directly
 * from the bundled remote via a receiver).
 */
export class IrTransport implements Transport {
  readonly type = TransportType.IR;

  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private listeners = new Set<(state: ConnectionState) => void>();

  getState(): ConnectionState {
    return this.state;
  }

  onStateChange(listener: (state: ConnectionState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async connect(_device: PairedDevice): Promise<void> {
    throw new Error(
      'IrTransport.connect: IR receiver on the Xiaomi TV A 32 2026 is unconfirmed — verify hardware before implementing'
    );
  }

  async disconnect(): Promise<void> {
    this.state = ConnectionState.DISCONNECTED;
  }

  async sendKey(_key: RemoteKey): Promise<void> {
    throw new Error('IrTransport.sendKey: blocked on hardware verification, see file header');
  }

  async sendText(_text: string): Promise<void> {
    throw new Error('IrTransport.sendText: IR has no text-entry channel, keyboard mode N/A');
  }

  async getInstalledApps(): Promise<InstalledApp[]> {
    return [];
  }

  async isSupported(): Promise<boolean> {
    // Deliberately false until the TV's IR receiver is confirmed. Flip
    // this only after verifying against the physical unit.
    return false;
  }
}
