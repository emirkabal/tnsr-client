# TNSR API Client Examples

This directory contains example usage of the TNSR API Client.

## Files

- **demo.ts** - Complete demonstration of all TNSR API features

## Running Examples

```bash
# Run the demo
bun examples/demo.ts

# Or with Node.js
npx ts-node examples/demo.ts
```

## Example: Basic Usage

```typescript
import { TnsrApiClient, createTnsrClient } from 'tnsr-client';

// Create client instance
const client = createTnsrClient({
  url: 'http://192.168.1.1:8080',
  username: 'admin',
  password: 'your-password'
});

// Test connection
const connection = await client.testConnection();
console.log('Connection:', connection.success ? 'OK' : 'Failed');

// Get traffic statistics
const traffic = await client.getTrafficStatistics();
if (traffic.success) {
  console.log(`Found ${traffic.data.length} interfaces`);
}
```

## Example: Traffic Monitoring

```typescript
import { createTrafficMonitor } from 'tnsr-client';

const monitor = createTrafficMonitor(client, 5000); // 5 second intervals

monitor.onUpdate((stats) => {
  stats.forEach(iface => {
    console.log(`${iface.interfaceName}: RX ${iface.statistics.rxPackets.total} packets`);
  });
});

monitor.start();
// monitor.stop(); // Stop monitoring
```

## Example: Route Management

```typescript
// Add PBR route
await client.addPbrRoute('192.168.100.1', '192.168.1.1', 'POLICY_NAME', 4001);

// Add blackhole route
await client.addBlackholeRoute('10.0.0.1', 4002, 'BLACKHOLE_LIST');

// List routes
const routes = await client.listPbrRoutes();
console.log('PBR Routes:', routes.data);
```
