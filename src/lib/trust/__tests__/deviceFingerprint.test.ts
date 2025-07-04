/**
 * Tests for device fingerprinting functionality
 */

import {
  collectFingerprintComponents,
  generateDeviceId,
  getDeviceId,
  clearDeviceId,
  isFingerprintingAvailable,
  getDeviceInfo,
} from '../deviceFingerprint';

// Mock localStorage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string) => localStorageMock.store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete localStorageMock.store[key];
  }),
  clear: jest.fn(() => {
    localStorageMock.store = {};
  }),
};

// Mock browser APIs
const mockNavigator = {
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  language: 'en-US',
  languages: ['en-US', 'en'],
  platform: 'MacIntel',
  cookieEnabled: true,
  doNotTrack: null,
  hardwareConcurrency: 8,
  plugins: [],
};

const mockScreen = {
  width: 1920,
  height: 1080,
  colorDepth: 24,
};

const mockCrypto = {
  subtle: {
    digest: jest.fn((algorithm: string, data: ArrayBuffer) => {
      // Return a hash based on input data to ensure different inputs produce different hashes
      const dataString = new TextDecoder().decode(data);
      const hash = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        hash[i] = (dataString.charCodeAt(i % dataString.length) + i) % 256;
      }
      return Promise.resolve(hash.buffer);
    }),
  },
};

// Mock HTMLCanvasElement
const mockCanvas = {
  getContext: jest.fn(() => ({
    textBaseline: '',
    font: '',
    fillStyle: '',
    fillRect: jest.fn(),
    fillText: jest.fn(),
  })),
  toDataURL: jest.fn(() => 'data:image/png;base64,mockCanvasData'),
};

const mockWebGLContext = {
  getExtension: jest.fn(() => ({
    UNMASKED_VENDOR_WEBGL: 'vendor',
    UNMASKED_RENDERER_WEBGL: 'renderer',
  })),
  getParameter: jest.fn((param: string) => {
    if (param === 'vendor') return 'MockVendor';
    if (param === 'renderer') return 'MockRenderer';
    return 'MockValue';
  }),
};

const mockAudioContext = jest.fn(() => ({
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  })),
  createAnalyser: jest.fn(() => ({
    connect: jest.fn(),
  })),
  createGain: jest.fn(() => ({
    gain: { value: 0 },
    connect: jest.fn(),
  })),
  createScriptProcessor: jest.fn(() => {
    const processor = {
      connect: jest.fn(),
      onaudioprocess: null as any,
    };
    // Simulate immediate audio processing to prevent timeout
    setTimeout(() => {
      if (processor.onaudioprocess) {
        processor.onaudioprocess({
          inputBuffer: {
            getChannelData: jest.fn(() => new Float32Array(100).fill(0.5)),
          },
        });
      }
    }, 10);
    return processor;
  }),
  destination: {},
  close: jest.fn(() => Promise.resolve()),
}));

describe('Device Fingerprinting', () => {
  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();

    // Mock global objects
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });

    Object.defineProperty(window, 'navigator', {
      value: mockNavigator,
      writable: true,
    });

    Object.defineProperty(window, 'screen', {
      value: mockScreen,
      writable: true,
    });

    Object.defineProperty(window, 'crypto', {
      value: mockCrypto,
      writable: true,
    });

    Object.defineProperty(global, 'crypto', {
      value: mockCrypto,
      writable: true,
    });

    Object.defineProperty(window, 'devicePixelRatio', {
      value: 2,
      writable: true,
    });

    // Mock document.createElement for canvas
    jest
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        if (tagName === 'canvas') {
          return {
            ...mockCanvas,
            getContext: jest.fn((type: string) => {
              if (type === '2d') return mockCanvas.getContext();
              if (type === 'webgl' || type === 'experimental-webgl')
                return mockWebGLContext;
              return null;
            }),
          } as any;
        }
        return document.createElement(tagName);
      });

    // Mock AudioContext
    Object.defineProperty(window, 'AudioContext', {
      value: mockAudioContext,
      writable: true,
    });

    Object.defineProperty(window, 'webkitAudioContext', {
      value: mockAudioContext,
      writable: true,
    });

    // Mock TextEncoder
    global.TextEncoder = class {
      encode(input: string) {
        return new Uint8Array(Buffer.from(input, 'utf8'));
      }
    };

    // Mock Intl.DateTimeFormat
    Object.defineProperty(global.Intl, 'DateTimeFormat', {
      value: jest.fn(() => ({
        resolvedOptions: () => ({ timeZone: 'America/New_York' }),
      })),
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('collectFingerprintComponents', () => {
    it('should collect basic browser properties', async () => {
      const components = await collectFingerprintComponents();

      expect(components.userAgent).toBe(mockNavigator.userAgent);
      expect(components.language).toBe(mockNavigator.language);
      expect(components.languages).toEqual(mockNavigator.languages);
      expect(components.platform).toBe(mockNavigator.platform);
      expect(components.cookiesEnabled).toBe(mockNavigator.cookieEnabled);
      expect(components.hardwareConcurrency).toBe(
        mockNavigator.hardwareConcurrency
      );
    });

    it('should collect screen properties', async () => {
      const components = await collectFingerprintComponents();

      expect(components.screenResolution).toBe('1920x1080');
      expect(components.colorDepth).toBe(24);
      expect(components.pixelRatio).toBe(2);
    });

    it('should collect timezone information', async () => {
      const components = await collectFingerprintComponents();

      expect(components.timezone).toBe('America/New_York');
      expect(components.timezoneOffset).toBeDefined();
    });

    it('should collect canvas fingerprint', async () => {
      const components = await collectFingerprintComponents();

      expect(components.canvas).toBe('data:image/png;base64,mockCanvasData');
    });

    it('should handle missing canvas context gracefully', async () => {
      mockCanvas.getContext.mockReturnValueOnce(null);

      const components = await collectFingerprintComponents();

      expect(components.canvas).toBe('not-available');
    });

    it('should collect WebGL fingerprint', async () => {
      const components = await collectFingerprintComponents();

      expect(components.webgl).toBe('MockVendor~MockRenderer');
    });

    it('should collect audio fingerprint', async () => {
      // Mock the script processor event
      const mockEvent = {
        inputBuffer: {
          getChannelData: jest.fn(() => new Float32Array(100).fill(0.5)),
        },
      };

      // Immediately trigger the audio processing
      setTimeout(() => {
        if (mockAudioContext().createScriptProcessor().onaudioprocess) {
          mockAudioContext().createScriptProcessor().onaudioprocess(mockEvent);
        }
      }, 0);

      const components = await collectFingerprintComponents();

      expect(components.audioContext).toBeDefined();
    });
  });

  describe('generateDeviceId', () => {
    it('should generate consistent device ID from same components', async () => {
      const components = {
        userAgent: 'test-agent',
        language: 'en-US',
        screenResolution: '1920x1080',
      };

      const deviceId1 = await generateDeviceId(components);
      const deviceId2 = await generateDeviceId(components);

      expect(deviceId1).toBe(deviceId2);
      expect(deviceId1).toHaveLength(64); // SHA-256 hex string
      expect(deviceId1).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate different device IDs for different components', async () => {
      const components1 = { userAgent: 'test-agent-1' };
      const components2 = { userAgent: 'test-agent-2' };

      const deviceId1 = await generateDeviceId(components1);
      const deviceId2 = await generateDeviceId(components2);

      expect(deviceId1).not.toBe(deviceId2);
    });

    it('should handle array values in components', async () => {
      const components = {
        languages: ['en-US', 'en'],
        plugins: ['plugin1', 'plugin2'],
      };

      const deviceId = await generateDeviceId(components);

      expect(deviceId).toHaveLength(64);
      expect(deviceId).toMatch(/^[0-9a-f]+$/);
    });

    it('should filter out undefined and null values', async () => {
      const components = {
        userAgent: 'test-agent',
        language: null,
        timezone: undefined,
        screenResolution: '1920x1080',
      };

      const deviceId = await generateDeviceId(components);

      expect(deviceId).toHaveLength(64);
    });
  });

  describe('getDeviceId', () => {
    it('should return stored device ID if available', async () => {
      const storedId = 'stored-device-id';
      localStorageMock.store['civilyst_device_id'] = storedId;

      const deviceId = await getDeviceId();

      expect(deviceId).toBe(storedId);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'civilyst_device_id'
      );
    });

    it('should generate and store new device ID if not available', async () => {
      const deviceId = await getDeviceId();

      expect(deviceId).toHaveLength(64);
      expect(deviceId).toMatch(/^[0-9a-f]+$/);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'civilyst_device_id',
        deviceId
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'civilyst_device_generated',
        expect.any(String)
      );
    });
  });

  describe('clearDeviceId', () => {
    it('should remove stored device ID and generation date', () => {
      localStorageMock.store['civilyst_device_id'] = 'test-id';
      localStorageMock.store['civilyst_device_generated'] = '2023-01-01';

      clearDeviceId();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'civilyst_device_id'
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'civilyst_device_generated'
      );
    });
  });

  describe('isFingerprintingAvailable', () => {
    it('should return true when all required APIs are available', () => {
      const available = isFingerprintingAvailable();
      expect(available).toBe(true);
    });

    it('should return false when window is not available', () => {
      const originalWindow = global.window;
      // @ts-ignore
      global.window = undefined;

      const available = isFingerprintingAvailable();
      expect(available).toBe(false);

      global.window = originalWindow;
    });
  });

  describe('getDeviceInfo', () => {
    it('should return device information with browser and OS detection', async () => {
      const deviceInfo = await getDeviceInfo();

      expect(deviceInfo).toMatchObject({
        deviceId: expect.any(String),
        browserFamily: expect.any(String),
        osFamily: expect.any(String),
        isMobile: expect.any(Boolean),
        hasTouch: expect.any(Boolean),
      });

      expect(deviceInfo.deviceId).toHaveLength(64);
    });

    it('should detect Chrome browser correctly', async () => {
      Object.defineProperty(window, 'navigator', {
        value: { ...mockNavigator, userAgent: 'Chrome/91.0.4472.124' },
        writable: true,
      });

      const deviceInfo = await getDeviceInfo();
      expect(deviceInfo.browserFamily).toBe('Chrome');
    });

    it('should detect mobile devices correctly', async () => {
      Object.defineProperty(window, 'navigator', {
        value: { ...mockNavigator, userAgent: 'Mobile Safari iPhone' },
        writable: true,
      });

      const deviceInfo = await getDeviceInfo();
      expect(deviceInfo.isMobile).toBe(true);
    });

    it('should detect touch capability', async () => {
      Object.defineProperty(window, 'navigator', {
        value: { ...mockNavigator, maxTouchPoints: 5 },
        writable: true,
      });

      const deviceInfo = await getDeviceInfo();
      expect(deviceInfo.hasTouch).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle canvas fingerprinting errors gracefully', async () => {
      mockCanvas.toDataURL.mockImplementationOnce(() => {
        throw new Error('Canvas error');
      });

      const components = await collectFingerprintComponents();
      expect(components.canvas).toBe('not-available');
    });

    it('should handle WebGL errors gracefully', async () => {
      jest
        .spyOn(document, 'createElement')
        .mockImplementation((tagName: string) => {
          if (tagName === 'canvas') {
            return {
              getContext: jest.fn(() => null), // No WebGL context
            } as any;
          }
          return document.createElement(tagName);
        });

      const components = await collectFingerprintComponents();
      expect(components.webgl).toBe('not-available');
    });

    it('should handle audio context errors gracefully', async () => {
      Object.defineProperty(window, 'AudioContext', {
        value: undefined,
        writable: true,
      });

      Object.defineProperty(window, 'webkitAudioContext', {
        value: undefined,
        writable: true,
      });

      const components = await collectFingerprintComponents();
      expect(components.audioContext).toBe('not-available');
    });
  });
});
