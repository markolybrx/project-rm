import forge from 'node-forge';
import * as SecureStore from 'expo-secure-store';

const CERT_KEY = 'tvremote_client_cert_pem';
const PRIVATE_KEY_KEY = 'tvremote_client_key_pem';

export interface ClientCertificate {
  certPem: string;
  keyPem: string;
}

/**
 * Generates a 2048-bit RSA self-signed cert on first use and persists it,
 * matching the reference implementation's approach — the TV pairs with
 * this specific cert, so it must be stable across app restarts or every
 * reconnect would require re-pairing.
 */
export async function getOrCreateClientCertificate(): Promise<ClientCertificate> {
  const existingCert = await SecureStore.getItemAsync(CERT_KEY);
  const existingKey = await SecureStore.getItemAsync(PRIVATE_KEY_KEY);
  if (existingCert && existingKey) {
    return { certPem: existingCert, keyPem: existingKey };
  }

  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);
  const attrs = [{ name: 'commonName', value: 'tv-remote-client' }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  const certPem = forge.pki.certificateToPem(cert);
  const keyPem = forge.pki.privateKeyToPem(keys.privateKey);

  await SecureStore.setItemAsync(CERT_KEY, certPem);
  await SecureStore.setItemAsync(PRIVATE_KEY_KEY, keyPem);

  return { certPem, keyPem };
}

/**
 * Extracts modulus/exponent as hex strings, matching how the reference
 * implementation reads them from the client cert for the secret hash.
 */
export function getModulusAndExponentHex(certPem: string): {
  modulusHex: string;
  exponentHex: string;
} {
  const cert = forge.pki.certificateFromPem(certPem);
  const publicKey = cert.publicKey as forge.pki.rsa.PublicKey;
  return {
    modulusHex: publicKey.n.toString(16),
    exponentHex: publicKey.e.toString(16),
  };
}
