import '@testing-library/jest-dom';

// Mock Next.js environment variables
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';

// Mock DOM APIs that might not be available in Jest
Object.defineProperty(global, 'URL', {
  value: URL,
  writable: true
});

Object.defineProperty(global, 'Blob', {
  value: Blob,
  writable: true
});

// Mock window.URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mock canvas API for jsPDF
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Array(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({ data: new Array(4) })),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
}));

// Mock navigator.clipboard
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: jest.fn(() => Promise.resolve()),
    },
    writable: true,
    configurable: true,
  });
}

// Mock navigator.share
Object.defineProperty(navigator, 'share', {
  value: jest.fn(() => Promise.resolve()),
  writable: true,
});

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  value: jest.fn(),
  writable: true,
});

// Mock fetch
global.fetch = jest.fn();

// Suppress console warnings for tests
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
    return;
  }
  originalConsoleWarn(...args);
};

// Ensure DOM document has a body element
if (!document.body) {
  document.body = document.createElement('body');
  document.documentElement.appendChild(document.body);
}

// Mock window.location conditionally
try {
  delete window.location;
  Object.defineProperty(window, 'location', {
    value: {
      origin: 'http://localhost:3000',
      href: 'http://localhost:3000',
      pathname: '/',
    },
    writable: true,
    configurable: true,
  });
} catch (e) {
  // Location already mocked, skip
}