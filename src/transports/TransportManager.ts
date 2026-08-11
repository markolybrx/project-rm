import { BluetoothTransport } from './BluetoothTransport';
import { IrTransport } from './IrTransport';
import {
  ConnectionState,
  InstalledApp,
  PairedDevice,
  RemoteKey,
  Transport,
  TransportType,
} from './types';
import { WifiTransport } from './WifiTransport';

/**
 * Single point of contact for the UI layer. Screens call
 * transportManager.sendKey(...) etc. without knowing or caring which
 * concrete Transport is currently active.
 */
class TransportManager {
  private transports: Record<TransportType, Transport> = {
    [TransportType.WIFI]: new WifiTransport(),
    [TransportType.BLUETOOTH]: new BluetoothTransport(),
    [TransportType.IR]: new IrTransport(),
  };

  private activeType: TransportType = TransportType.WIFI;

  getActiveType(): TransportType {
    return this.activeType;
  }

  getActive(): Transport {
    return this.transports[this.activeType];
  }

  get(type: TransportType): Transport {
    return this.transports[type];
  }

  setActiveType(type: TransportType): void {
    this.activeType = type;
  }

  getState(): ConnectionState {
    return this.getActive().getState();
  }

  onStateChange(listener: (state: ConnectionState) => void): () => void {
    return this.getActive().onStateChange(listener);
  }

  async connect(device: PairedDevice): Promise<void> {
    return this.getActive().connect(device);
  }

  async disconnect(): Promise<void> {
    return this.getActive().disconnect();
  }

  async sendKey(key: RemoteKey): Promise<void> {
    return this.getActive().sendKey(key);
  }

  async sendText(text: string): Promise<void> {
    return this.getActive().sendText(text);
  }

  async getInstalledApps(): Promise<InstalledApp[]> {
    return this.getActive().getInstalledApps();
  }

  async isSupported(type: TransportType): Promise<boolean> {
    return this.transports[type].isSupported();
  }
}

export const transportManager = new TransportManager();
