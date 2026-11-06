// `expo-crypto` loads the Expo runtime, which needs React Native globals. The
// integration project runs in plain Node (see jest.config.js `moduleNameMapper`),
// where the built-in provides the same function.
const { randomUUID } = require('node:crypto');

module.exports = { randomUUID };
