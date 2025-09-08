// Test modül kullanımı - CommonJS
const { TNSRClient, createTnsrClient, formatBytes, VERSION } = require('../dist/index.js');

console.log('TNSR Client Version:', VERSION);

// Test client creation
const client = createTnsrClient({
  url: 'http://localhost:8080',
  username: 'test',
  password: 'test123'
});

console.log('Client created successfully:', client instanceof TNSRClient);

client.testConnection().then(result => {
  console.log('Connection test result:', result);
}).catch(error => {
  console.error('Error testing connection:', error);
});