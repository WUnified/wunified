import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { randomUUID } from 'expo-crypto';

import { buildAvatarPath } from './db';
import { newUuid } from './uuid';

// jest-expo auto-mocks expo-crypto, so the real generator can't run here; these
// tests pin the contract that matters: no dependence on globalThis.crypto.
jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }));

const FIXED_UUID = '22222222-2222-4222-8222-222222222222';
const USER_ID = '11111111-1111-4111-8111-111111111111';
const originalCrypto = Object.getOwnPropertyDescriptor(globalThis, 'crypto');

function removeGlobalCrypto() {
  Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
}

afterEach(() => {
  if (originalCrypto) Object.defineProperty(globalThis, 'crypto', originalCrypto);
});

describe('newUuid', () => {
  it('delegates to expo-crypto instead of globalThis.crypto (Hermes has none)', () => {
    jest.mocked(randomUUID).mockReturnValue(FIXED_UUID);
    removeGlobalCrypto();

    expect(newUuid()).toBe(FIXED_UUID);
  });

  it('lets upload path builders run without globalThis.crypto', () => {
    jest.mocked(randomUUID).mockReturnValue(FIXED_UUID);
    removeGlobalCrypto();

    expect(buildAvatarPath(USER_ID, 'image/jpeg')).toBe(`${USER_ID}/${FIXED_UUID}.jpg`);
  });
});
