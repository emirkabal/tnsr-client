# TNSR API Reference

This document provides detailed information about all available API methods in the TNSR API Client.

## Interface Management

### `listInterfaces()`
Returns a list of all network interfaces with their configuration and status.

**Returns:** `ApiResponse<InterfaceInfo[]>`

**Example:**
```typescript
const interfaces = await tnsrClient.listInterfaces();
console.log(JSON.stringify(interfaces, null, 2));
```

### `testConnection()`
Tests the connection to the TNSR API server.

**Returns:** `ApiResponse<{ status: number; message: string }>`

**Example:**
```typescript
const connectionTest = await tnsrClient.testConnection();
if (connectionTest.success) {
  console.log('TNSR API connection successful');
}
```

## Network Management

### `listNetworks()`
Returns a list of all configured networks/subnets.

**Returns:** `ApiResponse<NetworkInfo[]>`

**Example:**
```typescript
const networks = await tnsrClient.listNetworks();
if (networks.success) {
  networks.data.forEach(network => {
    console.log(`Network: ${network.network}`);
    console.log(`Interface: ${network.interface}`);
    console.log(`Prefix Length: ${network.prefixLength}`);
  });
}
```

## PBR Route Management

### `addPbrRoute(ip, nextHop, policyName, sequence)`
Adds a new Policy-Based Route.

**Parameters:**
- `ip: string` - IP address to route
- `nextHop: string` - Next hop IP address
- `policyName: string` - Policy name for the route
- `sequence: number` - Sequence number for the rule

**Returns:** `ApiResponse<{ policyName: string; sequence: number; routeMapCreated: boolean }>`

**Example:**
```typescript
const addResult = await tnsrClient.addPbrRoute(
  '203.0.113.10',    // IP address
  '192.168.1.1',     // Next hop
  'MY-PBR-POLICY',   // Policy name
  4001               // Sequence
);
```

### `removePbrRoute(policyName)`
Removes a Policy-Based Route by policy name.

**Parameters:**
- `policyName: string` - Name of the policy to remove

**Returns:** `ApiResponse<{ policyName: string; routeMapRemoved: boolean }>`

**Example:**
```typescript
const removeResult = await tnsrClient.removePbrRoute('MY-PBR-POLICY');
```

### `listPbrRoutes()`
Returns a list of all configured PBR routes.

**Returns:** `ApiResponse<PbrRouteInfo[]>`

**Example:**
```typescript
const pbrRoutes = await tnsrClient.listPbrRoutes();
```

## Blackhole Route Management

### `addBlackholeRoute(ip, sequence, prefixListName, routeTableName)`
Adds a new blackhole route to drop traffic to specified IP.

**Parameters:**
- `ip: string` - IP address to blackhole
- `routeTableName: string` - Route table name (default: 'default')

**Returns:** `ApiResponse<{ ip: string; routeTableName: string }>`

**Example:**
```typescript
const addBlackhole = await tnsrClient.addBlackholeRoute(
  '192.168.100.50',     // IP address
  'default'             // Route table
);
```

### `removeBlackholeRoute(ip, sequence, prefixListName, routeTableName)`
Removes a blackhole route.

**Parameters:**
- `ip: string` - IP address to remove from blackhole
- `routeTableName: string` - Route table name (default: 'default')

**Returns:** `ApiResponse<{ ip: string; routeTableName: string }>`

### `listBlackholeRoutes(prefixListName)`
Returns a list of blackhole routes in the specified prefix list.

**Parameters:**
- `prefixListName: string` - Prefix list name (default: 'DGN-OUT-666')

**Returns:** `ApiResponse<BlackholeRouteInfo[]>`

## Route Map Management

### `createRouteMap(name, prefixListName, nextHop, sequence, description)`
Creates a new route map.

**Parameters:**
- `routeMapName: string` - Name of the route map
- `prefixListName: string` - Associated prefix list name
- `nextHop: string` - Next hop IP address
- `sequence: number` - Sequence number (default: 10)
- `description?: string` - Optional description

**Returns:** `ApiResponse<{ routeMapName: string; sequence: number }>`

### `removeRouteMap(routeMapName)`
Removes a route map by name.

**Parameters:**
- `routeMapName: string` - Name of the route map to remove

**Returns:** `ApiResponse<{ routeMapName: string }>`

### `listRouteMaps()`
Returns a list of all configured route maps.

**Returns:** `ApiResponse<RouteMapInfo[]>`

## Response Format

All API methods return responses in the following format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: any; // Additional information (for traffic statistics)
}
```

## Error Handling

When an API call fails, the response will have:
- `success: false`
- `error: string` - Error details
- `message?: string` - Optional error message with suggestions

Example error handling:
```typescript
const result = await tnsrClient.addPbrRoute('192.168.1.1', '192.168.1.254', 'TEST', 1001);
if (!result.success) {
  console.error('Failed to add PBR route:', result.error);
  if (result.message) {
    console.log('Suggestion:', result.message);
  }
}
```
