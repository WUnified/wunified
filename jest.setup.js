// `src/lib/supabase.ts` imports AsyncStorage (it's the Supabase auth token store),
// so any test that reaches the `src/lib/db` boundary loads the native module. Swap
// in the in-memory mock shipped with the package. This stubs device storage only —
// the Supabase client itself is never mocked here.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
