import { Buffer } from 'buffer';
import TcpSocket from 'react-native-tcp-socket';
import {
  decodeVarint,
  encodeVarint,
  parseFields,
  writeLenDelimited,
  writeStringField,
  writeVarintField,
} from './wire';
import { getOrCreateClientCertificate } from './certificate';

const CONTROL_PORT = 6466;

/**
 * These match the standard Android KeyEvent integer constants — the
 * protocol's enum is explicitly sourced from android/keycodes.h per the
 * upstream .proto comments, so these are stable public Android API
 * values, not protocol-specific guesses like the pairing crypto was.
 */
export const RemoteKeyCode = {
  DPAD_UP: 19,
  DPAD_DOWN: 20,
  DPAD_LEFT: 21,
  DPAD_RIGHT: 22,
  DPAD_CENTER: 23,
  BACK: 4,
  HOME: 3,
  MENU: 82,
  APP_SWITCH: 187,
  VOLUME_UP: 24,
  VOLUME_DOWN: 25,
  VOLUME_MUTE: 164,
  POWER: 26,
  CHANNEL_UP: 166,
  CHANNEL_DOWN: 167,
  SEARCH: 84,
  TV_INPUT: 178,
} as const;

// Declaration-order value for a normal (non-held) press. This one IS a
// guess based on convention rather than a verified source — if key
// presses send without error but the TV doesn't react, this is the
// first thing to double check.
const DIRECTION_SHORT = 1;

export class ControlSession {
  private socket: any = null;
  private buffer: number[] = [];
  private connected = false;

  private send(bytes: number[]) {
    const framed = [...encodeVarint(bytes.length), ...bytes];
    this.socket.write(Buffer.from(framed));
  }

  private handleData(chunk: Buffer) {
    this.buffer.push(...Array.from(chunk));
    while (true) {
      const lenResult = decodeVarint(this.buffer, 0);
      if (!lenResult) return;
      const totalLen = lenResult.nextOffset + lenResult.value;
      if (this.buffer.length < totalLen) return;
      const msgBytes = this.buffer.slice(lenResult.nextOffset, totalLen);
      this.buffer = this.buffer.slice(totalLen);
      this.dispatch(parseFields(msgBytes));
    }
  }

  private dispatch(fields: Map<number, any>) {
    if (fields.has(1)) {
      // Server sent RemoteConfigure — identify ourselves back so it
      // accepts us as an active remote.
      const deviceInfo = [
        ...writeStringField(1, 'TV Remote'),
        ...writeStringField(2, 'markolybrx'),
        ...writeVarintField(3, 1),
        ...writeStringField(4, ''),
        ...writeStringField(5, 'com.markolybrx.tvremote'),
        ...writeStringField(6, '0.1.0'),
      ];
      const configureInner = [...writeVarintField(1, 1), ...writeLenDelimited(2, deviceInfo)];
      this.send(writeLenDelimited(1, configureInner));
      this.connected = true;
    }
    if (fields.has(8)) {
      // Server ping — must echo back or the TV drops the connection.
      const val1 = fields.get(8)?.value ?? 0;
      this.send(writeLenDelimited(9, writeVarintField(1, val1)));
    }
  }

  async connect(ipAddress: string): Promise<void> {
    const { certPem, keyPem } = await getOrCreateClientCertificate();
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Control channel connection timed out')),
        10000
      );
      this.socket = TcpSocket.connectTLS(
        { host: ipAddress, port: CONTROL_PORT, key: keyPem, cert: certPem, rejectUnauthorized: false },
        () => {
          clearTimeout(timeout);
          resolve();
        }
      );
      this.socket.on('data', (chunk: Buffer) => this.handleData(chunk));
      this.socket.on('error', (err: Error) => reject(err));
      this.socket.on('close', () => {
        this.connected = false;
      });
    });
  }

  sendKey(keyCode: number): void {
    if (!this.socket) throw new Error('Not connected to control channel');
    const inner = [...writeVarintField(1, keyCode), ...writeVarintField(2, DIRECTION_SHORT)];
    this.send(writeLenDelimited(10, inner));
  }

  isConnected(): boolean {
    return this.connected;
  }

  close() {
    this.socket?.destroy();
    this.connected = false;
  }
}
