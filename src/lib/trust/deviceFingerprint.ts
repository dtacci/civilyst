/**
 * Device fingerprinting utility for anonymous user tracking
 * Uses privacy-preserving techniques to create stable device identifiers
 */

// Browser-compatible device fingerprinting - no crypto import needed

interface FingerprintComponents {
  userAgent: string;
  language: string;
  languages: string[];
  timezone: string;
  timezoneOffset: number;
  screenResolution: string;
  colorDepth: number;
  pixelRatio: number;
  hardwareConcurrency: number;
  platform: string;
  cookiesEnabled: boolean;
  doNotTrack: string | null;
  plugins: string[];
  canvas: string;
  webgl: string;
  audioContext: string;
}

/**
 * Collect device fingerprint components from the browser
 */
export async function collectFingerprintComponents(): Promise<
  Partial<FingerprintComponents>
> {
  const components: Partial<FingerprintComponents> = {};

  // Basic browser properties
  components.userAgent = navigator.userAgent;
  components.language = navigator.language;
  components.languages = [...navigator.languages];
  components.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  components.timezoneOffset = new Date().getTimezoneOffset();
  components.platform = navigator.platform;
  components.cookiesEnabled = navigator.cookieEnabled;
  components.doNotTrack = navigator.doNotTrack;
  components.hardwareConcurrency = navigator.hardwareConcurrency || 0;

  // Screen properties
  if (window.screen) {
    components.screenResolution = `${screen.width}x${screen.height}`;
    components.colorDepth = screen.colorDepth;
    components.pixelRatio = window.devicePixelRatio || 1;
  }

  // Plugin enumeration (limited in modern browsers)
  components.plugins = [];
  if (navigator.plugins) {
    for (let i = 0; i < navigator.plugins.length; i++) {
      components.plugins.push(navigator.plugins[i].name);
    }
  }

  // Canvas fingerprinting
  try {
    components.canvas = await getCanvasFingerprint();
  } catch (_e) {
    components.canvas = 'not-available';
  }

  // WebGL fingerprinting
  try {
    components.webgl = await getWebGLFingerprint();
  } catch (_e) {
    components.webgl = 'not-available';
  }

  // Audio fingerprinting
  try {
    components.audioContext = await getAudioFingerprint();
  } catch (_e) {
    components.audioContext = 'not-available';
  }

  return components;
}

/**
 * Generate canvas fingerprint
 */
async function getCanvasFingerprint(): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'not-available';

  // Draw test content
  ctx.textBaseline = 'top';
  ctx.font = '14px "Arial"';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f60';
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = '#069';
  ctx.fillText('Civilyst 🏛️', 2, 15);
  ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
  ctx.fillText('Civilyst 🏛️', 4, 17);

  return canvas.toDataURL();
}

/**
 * Generate WebGL fingerprint
 */
async function getWebGLFingerprint(): Promise<string> {
  const canvas = document.createElement('canvas');
  const gl =
    canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return 'not-available';

  // Type assertion to WebGLRenderingContext
  const webGLContext = gl as WebGLRenderingContext;
  const debugInfo = webGLContext.getExtension('WEBGL_debug_renderer_info');
  if (!debugInfo) return 'debug-not-available';

  const vendor = webGLContext.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
  const renderer = webGLContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

  return `${vendor}~${renderer}`;
}

/**
 * Generate audio fingerprint
 */
async function getAudioFingerprint(): Promise<string> {
  const AudioContextConstructor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof window.AudioContext })
      .webkitAudioContext;
  if (!AudioContextConstructor) return 'not-available';

  const context = new AudioContextConstructor();
  const oscillator = context.createOscillator();
  const analyser = context.createAnalyser();
  const gainNode = context.createGain();
  const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

  gainNode.gain.value = 0; // Mute
  oscillator.connect(analyser);
  analyser.connect(scriptProcessor);
  scriptProcessor.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(0);

  return new Promise((resolve) => {
    let fingerprint = '';
    scriptProcessor.onaudioprocess = (event) => {
      const output = event.inputBuffer.getChannelData(0);
      fingerprint = output.slice(0, 100).join(',');
      oscillator.stop();
      context.close();
      resolve(fingerprint);
    };
  });
}

/**
 * Generate a stable device ID from fingerprint components
 */
export async function generateDeviceId(
  components: Partial<FingerprintComponents>
): Promise<string> {
  // Sort components for stability
  const sortedComponents = Object.entries(components)
    .filter(([_, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}:${value.join(',')}`;
      }
      return `${key}:${value}`;
    })
    .join('|');

  // Create SHA-256 hash using Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(sortedComponents);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hashHex;
}

/**
 * Get or create device ID for the current browser
 */
export async function getDeviceId(): Promise<string> {
  // Check if we have a stored device ID
  const storedId = localStorage.getItem('civilyst_device_id');
  if (storedId) return storedId;

  // Generate new device ID
  const components = await collectFingerprintComponents();
  const deviceId = await generateDeviceId(components);

  // Store for future use
  localStorage.setItem('civilyst_device_id', deviceId);
  localStorage.setItem('civilyst_device_generated', new Date().toISOString());

  return deviceId;
}

/**
 * Clear device ID (for testing or privacy reset)
 */
export function clearDeviceId(): void {
  localStorage.removeItem('civilyst_device_id');
  localStorage.removeItem('civilyst_device_generated');
}

/**
 * Check if device fingerprinting is available
 */
export function isFingerprintingAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof localStorage !== 'undefined'
  );
}

/**
 * Privacy-preserving device info for trust signals
 */
export interface DeviceInfo {
  deviceId: string;
  browserFamily: string;
  osFamily: string;
  isMobile: boolean;
  hasTouch: boolean;
}

/**
 * Get device info for trust signal tracking
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  const deviceId = await getDeviceId();
  const ua = navigator.userAgent;

  return {
    deviceId,
    browserFamily: getBrowserFamily(ua),
    osFamily: getOSFamily(ua),
    isMobile: /Mobile|Android|iPhone|iPad/i.test(ua),
    hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  };
}

function getBrowserFamily(ua: string): string {
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Other';
}

function getOSFamily(ua: string): string {
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad'))
    return 'iOS';
  return 'Other';
}

/**
 * Alias for getDeviceId - gets or creates persistent device ID
 */
export async function getOrCreateDeviceId(): Promise<string> {
  return getDeviceId();
}
