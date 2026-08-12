import { Buffer } from 'buffer';

export function encodeVarint(value: number): number[] {
  const bytes: number[] = [];
  let v = value >>> 0;
  while (v > 0x7f) {
    bytes.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  bytes.push(v);
  return bytes;
}

export function decodeVarint(
  buf: number[],
  offset: number
): { value: number; nextOffset: number } | null {
  let result = 0;
  let shift = 0;
  let pos = offset;
  while (true) {
    if (pos >= buf.length) return null;
    const b = buf[pos];
    result |= (b & 0x7f) << shift;
    pos++;
    if ((b & 0x80) === 0) break;
    shift += 7;
    if (shift > 35) throw new Error('Varint too long');
  }
  return { value: result >>> 0, nextOffset: pos };
}

function tag(fieldNum: number, wireType: number): number[] {
  return encodeVarint((fieldNum << 3) | wireType);
}

export function writeVarintField(fieldNum: number, value: number): number[] {
  return [...tag(fieldNum, 0), ...encodeVarint(value)];
}

export function writeLenDelimited(fieldNum: number, payload: number[]): number[] {
  return [...tag(fieldNum, 2), ...encodeVarint(payload.length), ...payload];
}

export function writeStringField(fieldNum: number, str: string): number[] {
  return writeLenDelimited(fieldNum, Array.from(Buffer.from(str, 'utf8')));
}

export function writeBytesField(fieldNum: number, bytes: number[]): number[] {
  return writeLenDelimited(fieldNum, bytes);
}

export interface ParsedField {
  wireType: number;
  value?: number;
  bytes?: number[];
}

export function parseFields(buf: number[]): Map<number, ParsedField> {
  const fields = new Map<number, ParsedField>();
  let pos = 0;
  while (pos < buf.length) {
    const tagResult = decodeVarint(buf, pos);
    if (!tagResult) break;
    const fieldNum = tagResult.value >>> 3;
    const wireType = tagResult.value & 0x7;
    pos = tagResult.nextOffset;
    if (wireType === 0) {
      const valResult = decodeVarint(buf, pos);
      if (!valResult) break;
      fields.set(fieldNum, { wireType, value: valResult.value });
      pos = valResult.nextOffset;
    } else if (wireType === 2) {
      const lenResult = decodeVarint(buf, pos);
      if (!lenResult) break;
      pos = lenResult.nextOffset;
      const payload = buf.slice(pos, pos + lenResult.value);
      pos += lenResult.value;
      fields.set(fieldNum, { wireType, bytes: payload });
    } else {
      throw new Error(`Unsupported wire type ${wireType}`);
    }
  }
  return fields;
}
