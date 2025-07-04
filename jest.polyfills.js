// jest.polyfills.js
const { TextDecoder, TextEncoder } = require('util');

Object.assign(global, { TextDecoder, TextEncoder });