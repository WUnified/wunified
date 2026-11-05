import { randomUUID } from 'expo-crypto';

// Hermes (Expo Go / native) has no globalThis.crypto, so calling it directly
// works on web but throws on devices.
export function newUuid(): string {
  return randomUUID();
}
