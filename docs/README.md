# TNSR API Client Documentation

Welcome to the TNSR API Client documentation. This directory contains comprehensive guides and references for using the TNSR API Client.

## Documentation Structure

### [API Reference](api-reference.md)
Complete documentation of all available API methods including:
- Method signatures and parameters
- Return types and response formats
- Usage examples for each function
- Error handling patterns

### [Traffic Statistics](traffic-statistics.md)
Detailed guide for network traffic monitoring:
- Real-time traffic data collection
- JSON output format specifications
- Statistical data interpretation
- Performance monitoring best practices

### [Installation Guide](installation.md)
Step-by-step setup and configuration:
- Prerequisites and requirements
- Installation procedures
- TNSR device configuration
- Security considerations
- Troubleshooting common issues

## Quick Links

- **Getting Started**: See [Installation Guide](installation.md)
- **API Methods**: See [API Reference](api-reference.md)
- **Traffic Monitoring**: See [Traffic Statistics](traffic-statistics.md)

## Examples

### Basic Connection Test
```typescript
const client = new TnsrApiClient('http://192.168.1.1:8080', 'admin', 'password');
const result = await client.testConnection();
console.log(result.success ? 'Connected!' : 'Failed to connect');
```

### Traffic Statistics
```typescript
const stats = await client.getTrafficStatistics();
if (stats.success) {
  console.log(`Found ${stats.data.length} interfaces`);
  console.log(`Active interfaces: ${stats.metadata.activeInterfaces}`);
}
```

### Route Management
```typescript
// Add PBR route
await client.addPbrRoute('192.168.100.1', '192.168.1.1', 'POLICY_NAME', 4001);

// Add blackhole route
await client.addBlackholeRoute('10.0.0.1', 4002, 'BLACKHOLE_LIST', 'default');
```

## Support

For issues and questions:
1. Check the troubleshooting section in [Installation Guide](installation.md)
2. Review the API documentation in [API Reference](api-reference.md)
3. Refer to TNSR device documentation for RESTCONF configuration

## Contributing

When contributing to documentation:
- Keep examples practical and working
- Include error handling in code samples
- Update all relevant sections when adding new features
- Test all code examples before submitting
