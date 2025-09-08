# Traffic Statistics Documentation

This document provides comprehensive information about traffic monitoring capabilities in the TNSR API Client.

## Overview

The TNSR API Client provides real-time network traffic monitoring capabilities, allowing you to retrieve detailed statistics about packet and byte counts for all network interfaces.

## Features

- Real-time traffic data in JSON format
- TX/RX packet and byte statistics for all interfaces
- Interface-specific detailed traffic analysis
- Error and discard counters
- Real-time network performance monitoring

## API Methods

### `getTrafficStatistics()`

Retrieves traffic statistics for all network interfaces.

**Returns:** `ApiResponse<InterfaceTrafficStats[]>`

**Example:**
```typescript
const trafficStats = await tnsrClient.getTrafficStatistics();

if (trafficStats.success) {
  console.log('Total Interfaces:', trafficStats.metadata.totalInterfaces);
  console.log('Active Interfaces:', trafficStats.metadata.activeInterfaces);
  
  trafficStats.data.forEach(iface => {
    console.log(`\n=== ${iface.interfaceName} ===`);
    console.log('Status:', iface.operStatus);
    console.log('RX Packets:', iface.statistics.rxPackets.total);
    console.log('TX Packets:', iface.statistics.txPackets.total);
    console.log('RX Bytes:', iface.statistics.bytes.rxBytes);
    console.log('TX Bytes:', iface.statistics.bytes.txBytes);
    console.log('Errors:', iface.statistics.rxPackets.errors + iface.statistics.txPackets.errors);
  });
}
```

### `getInterfaceTrafficStats(interfaceName)`

Retrieves traffic statistics for a specific interface.

**Parameters:**
- `interfaceName: string` - Name of the interface (e.g., 'GigabitEthernet0/0/0')

**Returns:** `ApiResponse<InterfaceTrafficStats>`

**Example:**
```typescript
const interfaceStats = await tnsrClient.getInterfaceTrafficStats('GigabitEthernet0/0/0');

if (interfaceStats.success) {
  const stats = interfaceStats.data;
  console.log(`Interface: ${stats.interfaceName}`);
  console.log(`Status: ${stats.operStatus}`);
  console.log(`Total RX: ${stats.statistics.rxPackets.total} packets`);
  console.log(`Total TX: ${stats.statistics.txPackets.total} packets`);
  console.log(`Last Change: ${stats.lastChange}`);
}
```

## Data Structure

### InterfaceTrafficStats

```typescript
interface InterfaceTrafficStats {
  interfaceName: string;
  adminStatus: string;
  operStatus: string;
  type: string;
  lastChange?: string;
  statistics: {
    rxPackets: {
      unicast: number;
      multicast: number;
      broadcast: number;
      total: number;
      errors: number;
      discards: number;
    };
    txPackets: {
      unicast: number;
      multicast: number;
      broadcast: number;
      total: number;
      errors: number;
      discards: number;
    };
    bytes: {
      rxBytes: number;
      txBytes: number;
      totalBytes: number;
    };
    rates: {
      rxBytesPerSec: number;
      txBytesPerSec: number;
      rxPacketsPerSec: number;
      txPacketsPerSec: number;
    };
  };
  timestamp: string;
}
```

## Example JSON Output

```json
{
  "success": true,
  "data": [
    {
      "interfaceName": "GigabitEthernet0/0/0",
      "adminStatus": "up",
      "operStatus": "up",
      "type": "iana-if-type:ethernetCsmacd",
      "statistics": {
        "rxPackets": {
          "unicast": 1024567,
          "multicast": 8934,
          "broadcast": 234,
          "total": 1033735,
          "errors": 0,
          "discards": 12
        },
        "txPackets": {
          "unicast": 987654,
          "multicast": 5678,
          "broadcast": 123,
          "total": 993455,
          "errors": 0,
          "discards": 5
        },
        "bytes": {
          "rxBytes": 134217728,
          "txBytes": 67108864,
          "totalBytes": 201326592
        },
        "rates": {
          "rxBytesPerSec": 0,
          "txBytesPerSec": 0,
          "rxPacketsPerSec": 0,
          "txPacketsPerSec": 0
        }
      },
      "timestamp": "2025-09-08T10:30:45.123Z"
    }
  ],
  "message": "Traffic statistics retrieved for 3 interfaces",
  "metadata": {
    "totalInterfaces": 3,
    "activeInterfaces": 2,
    "totalTraffic": {
      "totalRxPackets": 2150000,
      "totalTxPackets": 1890000,
      "totalRxBytes": 268435456,
      "totalTxBytes": 134217728,
      "totalErrors": 0,
      "totalDiscards": 25
    },
    "timestamp": "2025-09-08T10:30:45.123Z",
    "endpoint": "/restconf/data/netgate-interface:interfaces-state"
  }
}
```

## Statistics Details

### Packet Statistics
- **Unicast Packets**: Packets sent to a single destination
- **Multicast Packets**: Packets sent to multiple destinations
- **Broadcast Packets**: Packets sent to all destinations
- **Total Packets**: Sum of all packet types
- **Errors**: Number of packet errors
- **Discards**: Number of discarded packets

### Byte Statistics
- **RX Bytes**: Number of bytes received
- **TX Bytes**: Number of bytes transmitted
- **Total Bytes**: Sum of RX and TX bytes

### Metadata Information
- **Total Interfaces**: Total number of interfaces
- **Active Interfaces**: Number of interfaces with "up" operational status
- **Total Traffic**: Aggregated traffic statistics across all interfaces
- **Timestamp**: When the statistics were collected
- **Endpoint**: Which RESTCONF endpoint was used to gather the data

## Rate Information

The `rates` section provides per-second statistics:
- **rxBytesPerSec**: Bytes received per second
- **txBytesPerSec**: Bytes transmitted per second
- **rxPacketsPerSec**: Packets received per second
- **txPacketsPerSec**: Packets transmitted per second

*Note: Rate calculations require additional implementation for real-time monitoring.*

## Troubleshooting

### Common Issues

1. **No interface data found**
   - Check if RESTCONF service is running
   - Verify network connectivity to TNSR device
   - Ensure proper authentication credentials

2. **Empty statistics**
   - Interface may be down or inactive
   - Statistics might be reset or not available
   - Check interface configuration

3. **Endpoint not found errors**
   - TNSR version may use different YANG models
   - Try alternative CLI commands: `show interface statistics`

### Alternative Data Sources

If RESTCONF endpoints are not available, consider using:
- CLI commands via SSH
- SNMP for statistics gathering
- Direct hardware interface monitoring

## Performance Considerations

- Statistics collection may impact performance on high-traffic interfaces
- Consider implementing caching for frequent requests
- Use specific interface queries instead of retrieving all interfaces when possible
- Monitor the frequency of statistics requests to avoid overwhelming the TNSR device
