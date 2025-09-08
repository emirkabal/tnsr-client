import { TNSRClient, InterfaceTrafficStats } from '.';


export function createTnsrClient(config?: {
  url?: string;
  username?: string;
  password?: string;
}): TNSRClient {
  const url = config?.url || process.env.TNSR_API_URL || 'http://localhost:8080';
  const username = config?.username || process.env.TNSR_USERNAME || 'tnsr';
  const password = config?.password || process.env.TNSR_PASSWORD || '';

  if (!password) {
    throw new Error('TNSR password is required. Set TNSR_PASSWORD environment variable or provide password in config.');
  }

  return new TNSRClient(url, username, password);
}

export function formatTrafficStats(stats: InterfaceTrafficStats[]): string {
  if (!stats.length) {
    return 'No traffic statistics available';
  }

  let output = '\n=== TRAFFIC STATISTICS ===\n';

  stats.forEach(iface => {
    output += `\nInterface: ${iface.interfaceName}\n`;
    output += `Status: ${iface.operStatus}\n`;
    output += `RX Packets: ${iface.statistics.rxPackets.total.toLocaleString()}\n`;
    output += `TX Packets: ${iface.statistics.txPackets.total.toLocaleString()}\n`;
    output += `RX Bytes: ${formatBytes(iface.statistics.bytes.rxBytes)}\n`;
    output += `TX Bytes: ${formatBytes(iface.statistics.bytes.txBytes)}\n`;
    output += `Errors: ${(iface.statistics.rxPackets.errors + iface.statistics.txPackets.errors).toLocaleString()}\n`;
    output += `Discards: ${(iface.statistics.rxPackets.discards + iface.statistics.txPackets.discards).toLocaleString()}\n`;
    output += '---\n';
  });

  return output;
}


export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}


export function validateConfig(config: {
  url: string;
  username: string;
  password: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.url) {
    errors.push('URL is required');
  } else if (!isValidUrl(config.url)) {
    errors.push('Invalid URL format');
  }

  if (!config.username) {
    errors.push('Username is required');
  }

  if (!config.password) {
    errors.push('Password is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}


function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}


export function createTrafficMonitor(
  client: TNSRClient,
  intervalMs: number = 5000
): {
  start: () => void;
  stop: () => void;
  onUpdate: (callback: (stats: InterfaceTrafficStats[]) => void) => void;
} {
  let intervalId: NodeJS.Timeout | null = null;
  let updateCallback: ((stats: InterfaceTrafficStats[]) => void) | null = null;

  return {
    start() {
      if (intervalId) return;

      intervalId = setInterval(async () => {
        try {
          const result = await client.getTrafficStatistics();
          if (result.success && result.data && updateCallback) {
            updateCallback(result.data);
          }
        } catch (error) {
          console.error('Traffic monitoring error:', error);
        }
      }, intervalMs);
    },

    stop() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },

    onUpdate(callback: (stats: InterfaceTrafficStats[]) => void) {
      updateCallback = callback;
    }
  };
}
