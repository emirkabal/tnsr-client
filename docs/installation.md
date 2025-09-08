# Installation and Configuration Guide

This document provides step-by-step instructions for installing and configuring the TNSR API Client.

## Prerequisites

- Node.js 18+ or Bun runtime
- Network access to TNSR router
- RESTCONF API enabled on TNSR device
- Valid authentication credentials

## Installation

### Using Bun (Recommended)

```bash
# Install project dependencies
bun install

# Run the project
bun src/index.ts
```

### Using Node.js

```bash
# Install project dependencies
npm install

# Compile TypeScript (if needed)
npx tsc

# Run the compiled JavaScript
node dist/index.js
```

## Configuration

### Basic Configuration

Update the TNSR server information in `src/index.ts`:

```typescript
const tnsrClient = new TnsrApiClient('http://YOUR_TNSR_IP:8080', 'username', 'password');
```

### Environment Variables (Recommended for Production)

Create a `.env` file in the project root:

```env
TNSR_API_URL=http://192.168.1.1:8080
TNSR_USERNAME=admin
TNSR_PASSWORD=your_secure_password
TNSR_TIMEOUT=30000
```

Then update your code to use environment variables:

```typescript
import dotenv from 'dotenv';
dotenv.config();

const tnsrClient = new TnsrApiClient(
  process.env.TNSR_API_URL || 'http://localhost:8080',
  process.env.TNSR_USERNAME || 'tnsr',
  process.env.TNSR_PASSWORD || 'password'
);
```

### Advanced Configuration Options

```typescript
const tnsrClient = new TnsrApiClient(
  'https://192.168.1.1:8080',  // Use HTTPS for production
  'admin',
  'secure_password',
  {
    timeout: 30000,             // Request timeout in milliseconds
    retries: 3,                 // Number of retry attempts
    retryDelay: 1000,          // Delay between retries in milliseconds
    validateCertificate: false  // Set to true for production HTTPS
  }
);
```

## TNSR Device Configuration

### Enable RESTCONF Service

Visit [Netgate Docs RESTCONF Server](https://docs.netgate.com/tnsr/en/latest/restconf/index.html).


## Network Configuration

### Connectivity Test

Test connectivity to your TNSR device:

```bash
# Test port connectivity
telnet TNSR_IP 8080

# Test HTTP connectivity
curl -u username:password http://TNSR_IP:8080/restconf/data
```