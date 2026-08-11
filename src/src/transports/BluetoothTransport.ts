import {
  ConnectionState,
  InstalledApp,
  PairedDevice,
  RemoteKey,
  Transport,
  TransportType,
} from './types';

/**
 * Bluetooth transport — phone acts as a HID device (keyboard/remote, and
 * separately as a gamepad for Controller mode).
 *
 * Real implementation, not yet wired up:
 *  - Requires Android's BluetoothHidDevice API (minSdk 28). This is a
 *    system-level "register as a HID peripheral" API with no Expo/RN
 *    wrapper — needs a native module (Kotlin) implementing
 *    BluetoothHidDeviceAppSdpSettings + BluetoothHidDevice.Callback,
 *    exposed via the Expo Modules API.
 *  - Keyboard mode: standard USB HID keyboard report descriptor,
 *    reused for both remote-as-keyboard and text entry.
 *  - Gamepad mode (Controller mode): a generic gamepad HID report
 *    descriptor (buttons + 2 analog axes minimum). This is what lets any
 *    Android TV game recognize the phone as a controller without
 *    per-game integration.
 *  - Pairing is a standard Android Bluetooth pairing dialog — the native
 *    module registers the app, the OS handles the actual pairing UI.
 */
export class BluetoothTransport implements Transport {
  readonly type = TransportType.BLUETOOTH;

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
    // TODO: register as BluetoothHidDevice, wait for registration callback,
    // then request connection to the paired TV's Bluetooth address.
    this.setState(ConnectionState.CONNECTING);
    throw new Error('BluetoothTransport.connect: native HID module not yet implemented');
  }

  async disconnect(): Promise<void> {
    // TODO: unregister the HID app / disconnect from the host device.
    this.setState(ConnectionState.DISCONNECTED);
  }

  async sendKey(_key: RemoteKey): Promise<void> {
    // TODO: map RemoteKey to a standard HID keyboard usage code and send
    // a HID report via BluetoothHidDevice.sendReport().
    throw new Error('BluetoothTransport.sendKey: not yet implemented');
  }

  async sendText(_text: string): Promise<void> {
    // TODO: send one HID keyboard report per character.
    throw new Error('BluetoothTransport.sendText: not yet implemented');
  }

  /**
   * Gamepad-specific send, used by Controller mode. Not part of the base
   * Transport interface since only Bluetooth supports analog input — kept
   * here rather than forcing every transport to implement a no-op.
   */
  async sendGamepadState(_state: {
    buttons: Record<string, boolean>;
    leftStick: { x: number; y: number };
    rightStick: { x: number; y: number };
    triggers: { left: number; right: number };
  }): Promise<void> {
    // TODO: encode as a gamepad HID report, send via sendReport().
    throw new Error('BluetoothTransport.sendGamepadState: not yet implemented');
  }

  async getInstalledApps(): Promise<InstalledApp[]> {
    // Bluetooth HID has no channel for querying app lists — always empty.
    return [];
  }

  async isSupported(): Promise<boolean> {
    // TODO: check BluetoothAdapter.isEnabled() and that the device
    // supports BluetoothHidDevice profile (most modern phones do).
    return true;
  }
}
