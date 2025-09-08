import { TNSRClient } from '../src';


const BASE_URL = 'http://192.168.1.1:8080';
const USERNAME = 'tnsr';
const PASSWORD = 'password';



function printJson(title: string, response: any) {
  console.log(`\n=== ${title} ===`);
  console.log(JSON.stringify(response, null, 2));
  console.log('='.repeat(50));
}


(async () => {
  const client = new TNSRClient(BASE_URL, USERNAME, PASSWORD);


  const testPbrIp = '203.0.113.10';
  const pbrNextHop = '192.168.1.1';
  const pbrPolicyName = 'TEST-PBR-001';
  const pbrSequence = 4001;

  const blackholeIp = '192.168.100.52';
  const blackholeSequence = 4004;
  const blackholePrefixList = 'CUSTOM-BLACKHOLE-LIST';
  const blackholeRouteTable = 'default';

  try {
    console.log('=== TNSR JSON API Demo ===');


    const connectionTest = await client.testConnection();
    if (!connectionTest.success) {
      printJson('CONNECTION TEST FAILED', connectionTest);
      return;
    }
    printJson('CONNECTION TEST', connectionTest);


    // 1. NETWORK/SUBNET LIST
    const networks = await client.listNetworks();
    printJson('NETWORKS', networks);


    // 2. ADD PBR ROUTE
    const addPbrResult = await client.addPbrRoute(testPbrIp, pbrNextHop, pbrPolicyName, pbrSequence);
    printJson('ADD PBR ROUTE', addPbrResult);

    // 3. PBR ROUTE LIST
    const pbrRoutes = await client.listPbrRoutes();
    printJson('PBR ROUTES', pbrRoutes);

    // 3.1. ROUTE MAP
    const routeMaps = await client.listRouteMaps();
    printJson('ROUTE MAPS', routeMaps);

    // 4. REMOVE PBR ROUTE
    const removePbrResult = await client.removePbrRoute(pbrPolicyName);
    printJson('REMOVE PBR ROUTE', removePbrResult);

    // 5. BLACKHOLE ROUTE LIST
    const blackholeRoutes = await client.listBlackholeRoutes(blackholePrefixList);
    printJson('BLACKHOLE ROUTES (CURRENT)', blackholeRoutes);

    // 6. ADD BLACKHOLE ROUTE
    const addBlackholeResult = await client.addBlackholeRoute(blackholeIp, blackholeSequence, blackholePrefixList, blackholeRouteTable);
    printJson('ADD BLACKHOLE ROUTE', addBlackholeResult);

    // 7. BLACKHOLE ROUTE LIST (UPDATED)
    const updatedBlackholeRoutes = await client.listBlackholeRoutes(blackholePrefixList);
    printJson('BLACKHOLE ROUTES (UPDATED)', updatedBlackholeRoutes);

    // 8. REMOVE BLACKHOLE ROUTE
    const removeBlackholeResult = await client.removeBlackholeRoute(blackholeIp, blackholeSequence, blackholePrefixList, blackholeRouteTable);
    printJson('REMOVE BLACKHOLE ROUTE', removeBlackholeResult);

    // 9. BLACKHOLE ROUTE LIST (FINAL)
    const finalBlackholeRoutes = await client.listBlackholeRoutes(blackholePrefixList);
    printJson('BLACKHOLE ROUTES (FINAL)', finalBlackholeRoutes);

    // 10. ALL INTERFACE TRAFFIC STATISTICS
    const trafficStats = await client.getTrafficStatistics();
    printJson('TRAFFIC STATISTICS (ALL INTERFACES)', trafficStats);

    // 11. INTERFACE LIST (WITH STATISTICS)
    const interfaces = await client.listInterfaces();
    printJson('INTERFACES', interfaces);

    // 12. SINGLE INTERFACE TRAFFIC STATISTICS (if available)
    if (interfaces.success && interfaces.data && interfaces.data.length > 0) {
      const firstInterface = interfaces.data[0]?.name;
      if (firstInterface) {
        const specificInterfaceStats = await client.getInterfaceTrafficStats(firstInterface);
        printJson(`TRAFFIC STATISTICS (${firstInterface})`, specificInterfaceStats);
      }
    }

    console.log('\n=== JSON API Demo Complete ===');

  } catch (error) {
    console.error('ERROR:', error instanceof Error ? error.message : error);
  }
})();
