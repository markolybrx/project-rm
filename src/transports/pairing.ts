import { Buffer } from 'buffer';
import forge from 'node-forge';
import TcpSocket from 'react-native-tcp-socket';
import {
  decodeVarint,
  encodeVarint,
  parseFields,
  writeBytesField,
  writeLenDelimited,
  writeStringField,
  writeVarintField,
} from './wire';
import { getModulusAndExponentHex, getOrCreateClientCertificate } from './certificate';

const PAIRING_PORT = 6467;
const STATUS_OK = 200;
const ROLE_TYPE_INPUT = 1;
const ENCODING_TYPE_HEXADECIMAL = 3;

function encodeOuter(innerFieldNum: number, innerBytes: number[]): number[] {
  return [
    ...writeVarintField(1, 2), // protocol_version = 2 (reference sets this explicitly)
    ...writeVarintField(2, STATUS_OK),
    ...writeLenDelimited(innerFieldNum, innerBytes),
  ];
}

function encodeEncoding(): number[] {
  return [...writeVarintField(1, ENCODING_TYPE_HEXADECIMAL), ...writeVarintField(2, 6)];
}

export interface PairingDebugInfo {
  clientModulusHex: string;
  clientExponentHex: string;
  serverModulusHex: string;
  serverExponentHex: string;
  computedHashHex: string;
}

export class PairingSession {
  private socket: any = null;
  private buffer: number[] = [];
  private messageQueue: Array<(fields: Map<number, any>) => void> = [];
  private clientModulusHex = '';
  private clientExponentHex = '';
  private serverModulusHex = '';
  private serverExponentHex = '';
  private computedHashHex = '';

  getDebugInfo(): PairingDebugInfo {
    return {
      clientModulusHex: this.clientModulusHex,
      clientExponentHex: this.clientExponentHex,
      serverModulusHex: this.serverModulusHex,
      serverExponentHex: this.serverExponentHex,
      computedHashHex: this.computedHashHex,
    };
  }

  private send(bytes: number[]) {
    const framed = [...encodeVarint(bytes.length), ...bytes];
    this.socket.write(Buffer.from(framed));
  }

  private waitForMessage(timeoutMs = 10000): Promise<Map<number, any>> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Timed out waiting for TV response')),
        timeoutMs
      );
      this.messageQueue.push((fields) => {
        clearTimeout(timer);
        resolve(fields);
      });
    });
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
      const fields = parseFields(msgBytes);
      const resolver = this.messageQueue.shift();
      if (resolver) resolver(fields);
    }
  }

  private assertOk(fields: Map<number, any>) {
    const status = fields.get(2)?.value;
    if (status !== undefined && status !== STATUS_OK) {
      throw new Error(`TV returned error status ${status}`);
    }
  }

  /**
   * Connects and exchanges PairingRequest/Options/Configuration. Resolves
   * once the TV acks configuration — at that point the TV should be
   * showing the 6-digit pairing code on screen. Call submitCode() next.
   */
  async start(ipAddress: string, clientName: string): Promise<void> {
    const { certPem, keyPem } = await getOrCreateClientCertificate();
    const { modulusHex, exponentHex } = getModulusAndExponentHex(certPem);
    this.clientModulusHex = modulusHex;
    this.clientExponentHex = exponentHex;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timed out')), 10000);
      this.socket = TcpSocket.connectTLS(
        { host: ipAddress, port: PAIRING_PORT, key: keyPem, cert: certPem, rejectUnauthorized: false },
        () => {
          clearTimeout(timeout);
          resolve();
        }
      );
      this.socket.on('data', (chunk: Buffer) => this.handleData(chunk));
      this.socket.on('error', (err: Error) => reject(err));
    });

    const peerCert = await this.socket.getPeerCertificate();
    this.serverModulusHex = String(peerCert.modulus || '').replace(/^0x/i, '');
    this.serverExponentHex = String(peerCert.exponent || '').replace(/^0x/i, '');

    this.send(
      encodeOuter(10, [...writeStringField(1, 'atvremote'), ...writeStringField(2, clientName)])
    );
    let reply = await this.waitForMessage();
    this.assertOk(reply);
    if (!reply.has(11)) throw new Error('Expected pairing_request_ack, got something else');

    const encodingBytes = encodeEncoding();
    this.send(
      encodeOuter(20, [...writeLenDelimited(1, encodingBytes), ...writeVarintField(3, ROLE_TYPE_INPUT)])
    );
    reply = await this.waitForMessage();
    this.assertOk(reply);
    if (!reply.has(20)) throw new Error('Expected server options, got something else');

    this.send(
      encodeOuter(30, [...writeLenDelimited(1, encodingBytes), ...writeVarintField(2, ROLE_TYPE_INPUT)])
    );
    reply = await this.waitForMessage();
    this.assertOk(reply);
    if (!reply.has(31)) throw new Error('Expected configuration_ack, got something else');
  }

  /** Call after the user reads the 6-digit code off the TV screen. */
  async submitCode(pairingCode: string): Promise<void> {
    if (!/^[0-9a-fA-F]{6}$/.test(pairingCode)) {
      throw new Error('Pairing code should be 6 hex characters, exactly as shown on the TV');
    }

    const md = forge.md.sha256.create();
    md.update(forge.util.hexToBytes(this.clientModulusHex));
    md.update(forge.util.hexToBytes('0' + this.clientExponentHex));
    md.update(forge.util.hexToBytes(this.serverModulusHex));
    md.update(forge.util.hexToBytes('0' + this.serverExponentHex));
    md.update(forge.util.hexToBytes(pairingCode.slice(2)));
    const digestHex = md.digest().toHex();
    this.computedHashHex = digestHex;
    const digestBytes = digestHex.match(/.{2}/g)!.map((b) => parseInt(b, 16));

    const expectedFirstByte = parseInt(pairingCode.slice(0, 2), 16);
    if (digestBytes[0] !== expectedFirstByte) {
      throw new Error(
        `Hash mismatch — expected first byte 0x${expectedFirstByte.toString(16)}, computed 0x${digestBytes[0].toString(16)}. This means the modulus/exponent format needs adjusting, not that the code was mistyped — check getDebugInfo().`
      );
    }

    this.send(encodeOuter(40, writeBytesField(1, digestBytes)));
    const reply = await this.waitForMessage();
    this.assertOk(reply);
    if (!reply.has(41)) throw new Error('Expected secret_ack, got something else');
  }

  close() {
    this.socket?.destroy();
  }
}
