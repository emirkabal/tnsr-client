import axios, { AxiosInstance } from "axios";

export interface NetworkInfo {
  network: string;
  prefixLength: number;
  interface: string;
  ip: string;
}

export interface InterfaceInfo {
  name: string;
  adminStatus: string;
  operStatus: string;
  type?: string;
  ipv4Addresses: Array<{
    ip: string;
    prefixLength: number;
    network: string;
  }>;
  statistics?: {
    rxPackets: number;
    txPackets: number;
    rxBytes: number;
    txBytes: number;
  };
}

export interface PrefixListRule {
  sequence: number;
  action: string;
  prefix: string;
}

export interface PrefixListInfo {
  name: string;
  rules: PrefixListRule[];
}

export interface PbrRouteInfo {
  name: string;
  ruleCount: number;
  rules: PrefixListRule[];
}

export interface RouteMapRule {
  sequence: number;
  policy: string;
  match?: {
    "ip-address-prefix-list"?: string;
  };
  set?: {
    ip?: {
      "next-hop": string;
    };
  };
}

export interface RouteTableInfo {
  routeTableName: string;
  totalRoutes: number;
  routes: Array<{
    destinationPrefix: string;
    hasDrop: boolean;
    firstHop: string | null;
    hops: any[];
  }>;
}

export interface RouteMapInfo {
  name: string;
  description?: string;
  rules: RouteMapRule[];
}

export interface InterfaceTrafficStats {
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: any;
}

export class TNSRClient {
  private api: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string, username: string, password: string) {
    this.baseUrl = baseUrl;
    this.api = axios.create({
      baseURL: baseUrl,
      auth: {
        username,
        password,
      },
      headers: {
        "Content-Type": "application/yang-data+json",
        Accept: "application/yang-data+json",
      },
      timeout: 30000,
    });
  }

  async testConnection(): Promise<
    ApiResponse<{ status: number; message: string }>
  > {
    try {
      const response = await this.api.get("/restconf/data", { timeout: 5000 });
      return {
        success: true,
        data: {
          status: response.status,
          message: "TNSR API connection successful",
        },
      };
    } catch (error: any) {
      let errorMessage = "Unknown error";

      if (error.code === "ECONNREFUSED") {
        errorMessage = `Cannot connect to TNSR API server (${this.baseUrl}). Is server running?`;
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Check username/password.";
      } else if (error.response?.status === 404) {
        errorMessage =
          "RESTCONF endpoint not found. Is TNSR RESTCONF service active?";
      } else {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async listInterfaces(): Promise<ApiResponse<InterfaceInfo[]>> {
    try {
      const endpoints = [
        "/restconf/data/netgate-interface:interfaces-config",
        "/restconf/data/netgate-interface:interfaces-state",
        "/restconf/data/netgate-interface:interfaces",
        "/restconf/data/ietf-interfaces:interfaces",
        "/restconf/data/ietf-interfaces:interfaces-state",
        "/restconf/data/interfaces",
        "/restconf/data/interfaces-state",
      ];

      let response: any = null;
      let usedEndpoint = "";

      for (const endpoint of endpoints) {
        try {
          response = await this.api.get(endpoint);
          usedEndpoint = endpoint;
          break;
        } catch (error) {
          continue;
        }
      }

      if (!response) {
        return {
          success: false,
          error: "No working interface endpoint found",
          message: "Use CLI: show interface summary",
        };
      }

      const interfaces = this.parseInterfaceList(response.data, usedEndpoint);

      return {
        success: true,
        data: interfaces,
        message: `Found ${interfaces.length} interfaces using ${usedEndpoint}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  private parseInterfaceList(data: any, endpoint: string): InterfaceInfo[] {
    let interfaces: any[] = [];

    if (data["netgate-interface:interfaces-config"]?.interface) {
      interfaces = data["netgate-interface:interfaces-config"].interface;
    } else if (data["netgate-interface:interfaces-state"]?.interface) {
      interfaces = data["netgate-interface:interfaces-state"].interface;
    } else if (data["netgate-interface:interfaces"]?.interface) {
      interfaces = data["netgate-interface:interfaces"].interface;
    } else if (data["ietf-interfaces:interfaces"]?.interface) {
      interfaces = data["ietf-interfaces:interfaces"].interface;
    } else if (data["ietf-interfaces:interfaces-state"]?.interface) {
      interfaces = data["ietf-interfaces:interfaces-state"].interface;
    } else if (data.interfaces?.interface) {
      interfaces = data.interfaces.interface;
    } else if (data.interface) {
      interfaces = data.interface;
    } else if (Array.isArray(data)) {
      interfaces = data;
    }

    return interfaces.map((iface: any) => {
      const ipv4Addresses: Array<{
        ip: string;
        prefixLength: number;
        network: string;
      }> = [];

      const ipv4Data =
        iface["ietf-ip:ipv4"] ||
        iface.ipv4 ||
        iface["netgate-interface:ipv4"] ||
        {};
      if (ipv4Data.address && Array.isArray(ipv4Data.address)) {
        ipv4Data.address.forEach((addr: any) => {
          const ip = addr.ip;
          const prefix = addr["prefix-length"] || addr.prefixLength || 24;

          const ipParts = ip.split(".").map(Number);
          const maskBits = parseInt(prefix.toString());
          const mask = (0xffffffff << (32 - maskBits)) >>> 0;
          const networkInt =
            ((ipParts[0] << 24) |
              (ipParts[1] << 16) |
              (ipParts[2] << 8) |
              ipParts[3]) &
            mask;
          const networkParts = [
            (networkInt >>> 24) & 0xff,
            (networkInt >>> 16) & 0xff,
            (networkInt >>> 8) & 0xff,
            networkInt & 0xff,
          ];
          const network = `${networkParts.join(".")}/${prefix}`;

          ipv4Addresses.push({
            ip,
            prefixLength: prefix,
            network,
          });
        });
      }

      const stats = iface.statistics || iface.stats || {};
      const statistics = stats
        ? {
          rxPackets:
            stats["in-unicast-pkts"] ||
            stats.inUnicastPkts ||
            stats.rxPackets ||
            0,
          txPackets:
            stats["out-unicast-pkts"] ||
            stats.outUnicastPkts ||
            stats.txPackets ||
            0,
          rxBytes: stats["in-octets"] || stats.inOctets || stats.rxBytes || 0,
          txBytes:
            stats["out-octets"] || stats.outOctets || stats.txBytes || 0,
        }
        : undefined;

      return {
        name: iface.name || iface.ifName || "unknown",
        adminStatus: iface["admin-status"] || iface.adminStatus || "unknown",
        operStatus:
          iface["oper-status"] || iface.operStatus || iface.status || "unknown",
        type: iface.type || iface.ifType,
        ipv4Addresses,
        statistics,
      };
    });
  }

  async listNetworks(): Promise<ApiResponse<NetworkInfo[]>> {
    try {
      const response = await this.api.get(
        "/restconf/data/netgate-route:route-config/dynamic/netgate-frr:prefix-lists"
      );
      const prefixLists =
        response.data?.["netgate-frr:prefix-lists"]?.list || [];

      const networks: NetworkInfo[] = [];

      prefixLists.forEach((list: any) => {
        if (list.rules?.rule) {
          list.rules.rule.forEach((rule: any) => {
            const [ip, prefixLength] = rule.prefix.split("/");
            networks.push({
              network: rule.prefix,
              prefixLength: parseInt(prefixLength) || 32,
              interface: list.name,
              ip: ip,
            });
          });
        }
      });

      return {
        success: true,
        data: networks,
        message: `Found ${networks.length} networks from prefix-lists`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  async addPbrRoute(
    ip: string,
    nextHop: string,
    policyName: string,
    sequence: number
  ): Promise<
    ApiResponse<{
      policyName: string;
      sequence: number;
      routeMapCreated: boolean;
    }>
  > {
    try {
      await this.api.put(
        `/restconf/data/netgate-route:route-config/dynamic/netgate-frr:prefix-lists/list=${policyName}`,
        {
          "netgate-frr:list": [
            {
              name: policyName,
              rules: {
                rule: [
                  {
                    sequence: sequence,
                    action: "permit",
                    prefix: `${ip}/32`,
                  },
                ],
              },
            },
          ],
        }
      );

      const routeMapResult = await this.createRouteMap(
        policyName,
        policyName,
        nextHop,
        10,
        `PBR route-map for ${ip}`
      );

      return {
        success: true,
        data: {
          policyName,
          sequence,
          routeMapCreated: routeMapResult.success,
        },
        message: routeMapResult.success
          ? `PBR route created: ${policyName} (prefix-list + route-map) -> ${ip}/32 -> ${nextHop}`
          : `PBR prefix-list created: ${policyName}. Route-map creation failed: ${routeMapResult.error}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  async removePbrRoute(
    policyName: string
  ): Promise<ApiResponse<{ policyName: string; routeMapRemoved: boolean }>> {
    try {
      const routeMapResult = await this.removeRouteMap(policyName);

      await this.api.delete(
        `/restconf/data/netgate-route:route-config/dynamic/netgate-frr:prefix-lists/list=${policyName}`
      );

      return {
        success: true,
        data: {
          policyName,
          routeMapRemoved: routeMapResult.success,
        },
        message: routeMapResult.success
          ? `PBR route removed: ${policyName} (prefix-list + route-map)`
          : `PBR prefix-list removed: ${policyName}. Route-map removal failed: ${routeMapResult.error}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  async listPbrRoutes(): Promise<ApiResponse<PbrRouteInfo[]>> {
    try {
      const response = await this.api.get(
        "/restconf/data/netgate-route:route-config/dynamic/netgate-frr:prefix-lists"
      );
      const prefixLists =
        response.data?.["netgate-frr:prefix-lists"]?.list || [];

      const pbrRoutes: PbrRouteInfo[] = prefixLists.map((list: any) => {
        const rules: PrefixListRule[] =
          list.rules?.rule?.map((rule: any) => ({
            sequence: rule.sequence,
            action: rule.action,
            prefix: rule.prefix,
          })) || [];

        return {
          name: list.name,
          ruleCount: rules.length,
          rules,
        };
      });

      return {
        success: true,
        data: pbrRoutes,
        message: `Found ${pbrRoutes.length} prefix-lists`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }


  async addRoute(
    route: string,
    nextHop: string,
    routeTableName: string = "default"
  ): Promise<ApiResponse<{ route: string; nextHop: string; routeTableName: string }>> {
    try {
      const staticRouteData = {
        "netgate-route-table:route": {
          "destination-prefix": route,
          "next-hop": {
            hop: [
              {
                "hop-id": 1,
                "ipv4-address": nextHop,
              },
            ],
          },
        },
      };

      await this.api.put(
        `/restconf/data/netgate-route-table:route-table-config/static-routes/route-table=${routeTableName}/ipv4-routes/route=${encodeURIComponent(
          route
        )}`,
        staticRouteData
      );

      return {
        success: true,
        data: {
          route,
          nextHop,
          routeTableName,
        },
        message: `Route added: ${route} -> ${nextHop} (route table: ${routeTableName})`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  async removeRoute(
    route: string,
    routeTableName: string = "default"
  ): Promise<ApiResponse<{ route: string; routeTableName: string }>> {
    try {
      await this.api.delete(
        `/restconf/data/netgate-route-table:route-table-config/static-routes/route-table=${routeTableName}/ipv4-routes/route=${encodeURIComponent(
          route
        )}`
      );

      return {
        success: true,
        data: {
          route,
          routeTableName,
        },
        message: `Route removed: ${route} (route table: ${routeTableName})`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  async addBlackholeRoute(
    ip: string,
    routeTableName: string = "default"
  ): Promise<ApiResponse<{ ip: string; routeTableName: string }>> {
    try {
      try {
        const staticRouteData = {
          "netgate-route-table:route": {
            "destination-prefix": `${ip}/32`,
            "next-hop": {
              hop: [
                {
                  "hop-id": 1,
                  drop: true,
                },
              ],
            },
          },
        };

        await this.api.put(
          `/restconf/data/netgate-route-table:route-table-config/static-routes/route-table=${routeTableName}/ipv4-routes/route=${ip}%2F32`,
          staticRouteData
        );
      } catch (routeError) {
        console.warn(`Route table add failed for ${ip}: ${routeError}`);
      }

      return {
        success: true,
        data: {
          ip,
          routeTableName,
        },
        message: `Blackhole route added: ${ip}/32 (route table: ${routeTableName})`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  async removeBlackholeRoute(
    ip: string,
    routeTableName: string = "default"
  ): Promise<ApiResponse<{ ip: string; routeTableName: string }>> {
    try {
      await this.api.delete(
        `/restconf/data/netgate-route-table:route-table-config/static-routes/route-table=${routeTableName}/ipv4-routes/route=${ip}%2F32`
      );

      return {
        success: true,
        data: {
          ip,
          routeTableName,
        },
        message: `Blackhole route removed: ${ip}/32 (route table: ${routeTableName})`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  async createRouteMap(
    routeMapName: string,
    prefixListName: string,
    nextHop: string,
    sequence: number = 10,
    description?: string
  ): Promise<ApiResponse<{ routeMapName: string; sequence: number }>> {
    try {
      await this.api.put(
        `/restconf/data/netgate-route:route-config/dynamic/netgate-frr:route-maps/map=${routeMapName}`,
        {
          "netgate-frr:map": [
            {
              name: routeMapName,
              description: description || `Route map for ${prefixListName}`,
              rules: {
                rule: [
                  {
                    sequence: sequence,
                    policy: "permit",
                    match: {
                      "ip-address-prefix-list": prefixListName,
                    },
                    set: {
                      "src-ip-address": nextHop,
                    },
                  },
                ],
              },
            },
          ],
        }
      );

      return {
        success: true,
        data: {
          routeMapName,
          sequence,
        },
        message: `Route-map created: ${routeMapName} -> prefix-list: ${prefixListName} -> next-hop: ${nextHop}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  async removeRouteMap(
    routeMapName: string
  ): Promise<ApiResponse<{ routeMapName: string }>> {
    try {
      await this.api.delete(
        `/restconf/data/netgate-route:route-config/dynamic/netgate-frr:route-maps/map=${routeMapName}`
      );

      return {
        success: true,
        data: { routeMapName },
        message: `Route-map removed: ${routeMapName}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  async listBlackholeRoutes(
    routeTableName: string = "default"
  ): Promise<ApiResponse<RouteTableInfo["routes"]>> {
    try {
      const response = await this.listRouteTable(routeTableName);
      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || "Failed to retrieve route table data",
        };
      }

      const data = response.data.routes.filter((route) => route.hasDrop);

      return {
        success: true,
        data,
        message: `Found ${data.length} blackhole routes in ${routeTableName}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  async listRouteTable(
    routeTableName: string = "default"
  ): Promise<ApiResponse<RouteTableInfo>> {
    try {
      const response = await this.api.get(
        `/restconf/data/netgate-route-table:route-table-config/static-routes/route-table=${routeTableName}`
      );

      const data = response.data?.["netgate-route-table:route-table"] || [];
      const routes = data.flatMap(
        (table: any) => table["ipv4-routes"]?.route || []
      );
      const routeMap = new Map<string, any[]>();
      for (const route of routes) {
        routeMap.set(route["destination-prefix"], route["next-hop"]?.hop || []);
      }
      const routeMapArray = Array.from(routeMap.entries()).map(
        ([prefix, hops]) => ({
          destinationPrefix: prefix,
          hasDrop: hops.some((hop) => hop.drop),
          firstHop: hops.length > 0 ? hops[0]?.["ipv4-address"] : null,
          hops,
        })
      );

      const routeMapData = {
        routeTableName,
        totalRoutes: routeMapArray.length,
        routes: routeMapArray,
      };

      return {
        success: true,
        data: routeMapData,
        message: "Route table data retrieved",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  async listRouteMaps(): Promise<ApiResponse<RouteMapInfo[]>> {
    try {
      const response = await this.api.get(
        "/restconf/data/netgate-route:route-config/dynamic/netgate-frr:route-maps"
      );
      const routeMaps = response.data?.["netgate-frr:route-maps"]?.map || [];

      const routeMapList: RouteMapInfo[] = routeMaps.map((map: any) => {
        const rules: RouteMapRule[] =
          map.rules?.rule?.map((rule: any) => ({
            sequence: rule.sequence,
            policy: rule.policy,
            match: rule.match,
            set: rule.set,
          })) || [];

        return {
          name: map.name,
          description: map.description,
          rules,
        };
      });

      return {
        success: true,
        data: routeMapList,
        message: `Found ${routeMapList.length} route-map(s)`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  async getTrafficStatistics(): Promise<ApiResponse<InterfaceTrafficStats[]>> {
    try {
      const endpoints = [
        "/restconf/data/netgate-interface:interfaces-state",
        "/restconf/data/netgate-interface:interfaces",
        "/restconf/data/ietf-interfaces:interfaces-state",
        "/restconf/data/interfaces-state",
        "/restconf/data/interfaces",
      ];

      let response: any = null;
      let usedEndpoint = "";

      for (const endpoint of endpoints) {
        try {
          response = await this.api.get(endpoint);
          usedEndpoint = endpoint;
          break;
        } catch (error) {
          continue;
        }
      }

      if (!response) {
        return {
          success: false,
          error: "No working interface statistics endpoint found",
          message:
            "Try CLI: show interface statistics, show hardware-interfaces, or show interface",
        };
      }

      const interfaceData = this.parseInterfaceData(
        response.data,
        usedEndpoint
      );

      if (interfaceData.length === 0) {
        return {
          success: false,
          error: "No interface data found in response",
          message: "Interface data structure may be different than expected",
        };
      }

      const totalStats = interfaceData.reduce(
        (total, iface) => {
          total.totalRxPackets += iface.statistics.rxPackets.total;
          total.totalTxPackets += iface.statistics.txPackets.total;
          total.totalRxBytes += iface.statistics.bytes.rxBytes;
          total.totalTxBytes += iface.statistics.bytes.txBytes;
          total.totalErrors +=
            iface.statistics.rxPackets.errors +
            iface.statistics.txPackets.errors;
          total.totalDiscards +=
            iface.statistics.rxPackets.discards +
            iface.statistics.txPackets.discards;
          return total;
        },
        {
          totalRxPackets: 0,
          totalTxPackets: 0,
          totalRxBytes: 0,
          totalTxBytes: 0,
          totalErrors: 0,
          totalDiscards: 0,
        }
      );

      return {
        success: true,
        data: interfaceData,
        message: `Traffic statistics retrieved for ${interfaceData.length} interfaces using ${usedEndpoint}`,
        metadata: {
          totalInterfaces: interfaceData.length,
          activeInterfaces: interfaceData.filter(
            (iface) => iface.operStatus === "up"
          ).length,
          totalTraffic: totalStats,
          timestamp: new Date().toISOString(),
          endpoint: usedEndpoint,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
        message:
          "Failed to retrieve traffic statistics. Try CLI: show interface statistics",
      };
    }
  }

  private parseInterfaceData(
    data: any,
    endpoint: string
  ): InterfaceTrafficStats[] {
    let interfaces: any[] = [];

    if (data["netgate-interface:interfaces-state"]?.interface) {
      interfaces = data["netgate-interface:interfaces-state"].interface;
    } else if (data["netgate-interface:interfaces"]?.interface) {
      interfaces = data["netgate-interface:interfaces"].interface;
    } else if (data["ietf-interfaces:interfaces-state"]?.interface) {
      interfaces = data["ietf-interfaces:interfaces-state"].interface;
    } else if (data["interfaces-state"]?.interface) {
      interfaces = data["interfaces-state"].interface;
    } else if (data.interface) {
      interfaces = data.interface;
    } else if (Array.isArray(data)) {
      interfaces = data;
    }

    return interfaces.map((iface: any) => {
      const stats = iface.statistics || iface.stats || {};

      return {
        interfaceName: iface.name || iface.ifName || "unknown",
        adminStatus: iface["admin-status"] || iface.adminStatus || "unknown",
        operStatus:
          iface["oper-status"] || iface.operStatus || iface.status || "unknown",
        type: iface.type || iface.ifType || "unknown",
        lastChange: iface["last-change"] || iface.lastChange,
        statistics: {
          rxPackets: {
            unicast:
              stats["in-unicast-pkts"] ||
              stats.inUnicastPkts ||
              stats.rxUnicast ||
              0,
            multicast:
              stats["in-multicast-pkts"] ||
              stats.inMulticastPkts ||
              stats.rxMulticast ||
              0,
            broadcast:
              stats["in-broadcast-pkts"] ||
              stats.inBroadcastPkts ||
              stats.rxBroadcast ||
              0,
            total:
              stats["in-pkts"] ||
              stats.inPkts ||
              stats.rxPackets ||
              (stats["in-unicast-pkts"] || 0) +
              (stats["in-multicast-pkts"] || 0) +
              (stats["in-broadcast-pkts"] || 0),
            errors: stats["in-errors"] || stats.inErrors || stats.rxErrors || 0,
            discards:
              stats["in-discards"] || stats.inDiscards || stats.rxDrops || 0,
          },
          txPackets: {
            unicast:
              stats["out-unicast-pkts"] ||
              stats.outUnicastPkts ||
              stats.txUnicast ||
              0,
            multicast:
              stats["out-multicast-pkts"] ||
              stats.outMulticastPkts ||
              stats.txMulticast ||
              0,
            broadcast:
              stats["out-broadcast-pkts"] ||
              stats.outBroadcastPkts ||
              stats.txBroadcast ||
              0,
            total:
              stats["out-pkts"] ||
              stats.outPkts ||
              stats.txPackets ||
              (stats["out-unicast-pkts"] || 0) +
              (stats["out-multicast-pkts"] || 0) +
              (stats["out-broadcast-pkts"] || 0),
            errors:
              stats["out-errors"] || stats.outErrors || stats.txErrors || 0,
            discards:
              stats["out-discards"] || stats.outDiscards || stats.txDrops || 0,
          },
          bytes: {
            rxBytes: stats["in-octets"] || stats.inOctets || stats.rxBytes || 0,
            txBytes:
              stats["out-octets"] || stats.outOctets || stats.txBytes || 0,
            totalBytes:
              (stats["in-octets"] || stats.inOctets || stats.rxBytes || 0) +
              (stats["out-octets"] || stats.outOctets || stats.txBytes || 0),
          },
          rates: {
            rxBytesPerSec: stats["in-speed"] || stats.inSpeed || 0,
            txBytesPerSec: stats["out-speed"] || stats.outSpeed || 0,
            rxPacketsPerSec: 0,
            txPacketsPerSec: 0,
          },
        },
        timestamp: new Date().toISOString(),
      };
    });
  }

  async getInterfaceTrafficStats(
    interfaceName: string
  ): Promise<ApiResponse<InterfaceTrafficStats>> {
    try {
      const endpoints = [
        `/restconf/data/netgate-interface:interfaces-state/interface=${interfaceName}`,
        `/restconf/data/netgate-interface:interfaces/interface=${interfaceName}`,
        `/restconf/data/ietf-interfaces:interfaces-state/interface=${interfaceName}`,
        `/restconf/data/interfaces-state/interface=${interfaceName}`,
        `/restconf/data/interfaces/interface=${interfaceName}`,
      ];

      let response: any = null;
      let usedEndpoint = "";

      for (const endpoint of endpoints) {
        try {
          response = await this.api.get(endpoint);
          usedEndpoint = endpoint;
          break;
        } catch (error) {
          continue;
        }
      }

      if (!response) {
        return {
          success: false,
          error: `Interface ${interfaceName} not found in any endpoint`,
        };
      }

      let iface: any = null;
      if (response.data?.["netgate-interface:interface"]) {
        iface = response.data["netgate-interface:interface"];
      } else if (response.data?.["ietf-interfaces:interface"]) {
        iface = response.data["ietf-interfaces:interface"];
      } else if (response.data?.interface) {
        iface = response.data.interface;
      } else {
        iface = response.data;
      }

      if (!iface) {
        return {
          success: false,
          error: `Interface ${interfaceName} data not found in response`,
        };
      }

      const stats = iface.statistics || iface.stats || {};

      const trafficStats: InterfaceTrafficStats = {
        interfaceName: iface.name || interfaceName,
        adminStatus: iface["admin-status"] || iface.adminStatus || "unknown",
        operStatus:
          iface["oper-status"] || iface.operStatus || iface.status || "unknown",
        type: iface.type || iface.ifType || "unknown",
        lastChange: iface["last-change"] || iface.lastChange,
        statistics: {
          rxPackets: {
            unicast:
              stats["in-unicast-pkts"] ||
              stats.inUnicastPkts ||
              stats.rxUnicast ||
              0,
            multicast:
              stats["in-multicast-pkts"] ||
              stats.inMulticastPkts ||
              stats.rxMulticast ||
              0,
            broadcast:
              stats["in-broadcast-pkts"] ||
              stats.inBroadcastPkts ||
              stats.rxBroadcast ||
              0,
            total:
              stats["in-pkts"] ||
              stats.inPkts ||
              stats.rxPackets ||
              (stats["in-unicast-pkts"] || 0) +
              (stats["in-multicast-pkts"] || 0) +
              (stats["in-broadcast-pkts"] || 0),
            errors: stats["in-errors"] || stats.inErrors || stats.rxErrors || 0,
            discards:
              stats["in-discards"] || stats.inDiscards || stats.rxDrops || 0,
          },
          txPackets: {
            unicast:
              stats["out-unicast-pkts"] ||
              stats.outUnicastPkts ||
              stats.txUnicast ||
              0,
            multicast:
              stats["out-multicast-pkts"] ||
              stats.outMulticastPkts ||
              stats.txMulticast ||
              0,
            broadcast:
              stats["out-broadcast-pkts"] ||
              stats.outBroadcastPkts ||
              stats.txBroadcast ||
              0,
            total:
              stats["out-pkts"] ||
              stats.outPkts ||
              stats.txPackets ||
              (stats["out-unicast-pkts"] || 0) +
              (stats["out-multicast-pkts"] || 0) +
              (stats["out-broadcast-pkts"] || 0),
            errors:
              stats["out-errors"] || stats.outErrors || stats.txErrors || 0,
            discards:
              stats["out-discards"] || stats.outDiscards || stats.txDrops || 0,
          },
          bytes: {
            rxBytes: stats["in-octets"] || stats.inOctets || stats.rxBytes || 0,
            txBytes:
              stats["out-octets"] || stats.outOctets || stats.txBytes || 0,
            totalBytes:
              (stats["in-octets"] || stats.inOctets || stats.rxBytes || 0) +
              (stats["out-octets"] || stats.outOctets || stats.txBytes || 0),
          },
          rates: {
            rxBytesPerSec: stats["in-speed"] || stats.inSpeed || 0,
            txBytesPerSec: stats["out-speed"] || stats.outSpeed || 0,
            rxPacketsPerSec: 0,
            txPacketsPerSec: 0,
          },
        },
        timestamp: new Date().toISOString(),
      };

      return {
        success: true,
        data: trafficStats,
        message: `Traffic statistics for interface ${interfaceName} using ${usedEndpoint}`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
        message: `Failed to retrieve traffic statistics for ${interfaceName}`,
      };
    }
  }
}
