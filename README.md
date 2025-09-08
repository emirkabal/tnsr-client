# TNSR Client

A TypeScript/JavaScript client library for Netgate TNSR (Trusted Network Security Router) API with comprehensive traffic monitoring and network management capabilities.

## Features

- **Traffic Statistics**: Real-time traffic monitoring for interfaces and system-wide statistics
- **Network Management**: Interface configuration, PBR routes, blackhole routes
- **RESTCONF Protocol**: Full support for [IETF RFC 8040](https://www.ietf.org/archive/id/draft-wwlh-netconf-list-pagination-rc-02.html) standard
- **TypeScript Support**: Complete type definitions for better development experience
- **Multiple Endpoints**: Automatic fallback for different TNSR API endpoints
- **Error Handling**: Comprehensive error handling and debugging support

## Installation

```bash
bun add tnsr-client
```

## Quick Start

```typescript
import { createTnsrClient } from "tnsr-client";

// Create client
const client = createTnsrClient("192.168.1.1", "admin", "password");

// Get traffic statistics
const stats = await client.getTrafficStatistics();
console.log("Total RX bytes:", stats.totalRxBytes);
console.log("Total TX bytes:", stats.totalTxBytes);

// Get specific interface traffic
const interfaceStats = await client.getInterfaceTrafficStats("eth0");
console.log("Interface RX packets:", interfaceStats.rxPackets);
```

## Documentation

For detailed documentation, please see:

- [API Reference](./docs/api-reference.md) - Complete API documentation
- [Traffic Statistics](./docs/traffic-statistics.md) - Traffic monitoring guide  
- [Installation Guide](./docs/installation.md) - Setup and configuration

## Testing

```bash
npm test
```

## Requirements

- Node.js 16+ or Bun runtime
- TNSR device with RESTCONF API enabled
- Network access to TNSR management interface

## License

MIT

## Contributing

Issues and pull requests are welcome. For major changes, please open an issue first.

## Support

This library supports:
- TNSR firmware versions with RESTCONF API
- Both CommonJS and ES modules
- TypeScript and JavaScript projects
- Multiple authentication methods
