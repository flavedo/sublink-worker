import { describe, it, expect } from 'vitest';
import {
    parseVpngateCsv,
    filterResidentialNodes,
    buildResidentialProxyObject,
    formatSpeed,
    getResidentialData
} from '../src/services/vpngateService.js';

// Base64 helper for tests
const b64 = (str) => Buffer.from(str).toString('base64');

const SAMPLE_CONFIG_TCP = (ip, port = 443) => b64(`
client
proto tcp
remote ${ip} ${port}
cipher AES-128-CBC
auth SHA1
<ca>
TEST_CA_CERTIFICATE_CONTENT
</ca>
<cert>
TEST_CLIENT_CERT_CONTENT
</cert>
<key>
TEST_CLIENT_KEY_CONTENT
</key>
`);

const SAMPLE_CONFIG_UDP = (ip, port = 1194) => b64(`
client
proto udp
remote ${ip} ${port}
cipher AES-128-CBC
auth SHA1
`);

const SAMPLE_CSV = [
    '#HostName,IP,Score,Ping,Speed,CountryLong,CountryShort,NumVpnSessions,Uptime,TotalUsers,TotalTraffic,LogType,Operator,Message,OpenVPN_ConfigData_Base64',
    `vg-jp.opengw.net,221.112.45.67,200000,15,125000000,Japan,JP,12,3600,100,5000000,2weeks,op1,msg1,${SAMPLE_CONFIG_TCP('221.112.45.67', 443)}`,
    `vg-kr.opengw.net,121.160.88.99,150000,25,80000000,Korea Republic of,KR,5,7200,50,2000000,2weeks,op2,msg2,${SAMPLE_CONFIG_TCP('121.160.88.99', 443)}`,
    `vg-us.opengw.net,73.189.201.55,100000,120,45000000,United States,US,2,1800,20,1000000,2weeks,op3,msg3,${SAMPLE_CONFIG_TCP('73.189.201.55', 443)}`,
    `public-vpn-99.opengw.net,130.158.6.80,50000,10,200000000,Japan,JP,100,8000,500,10000000,2weeks,official,msg,${SAMPLE_CONFIG_TCP('130.158.6.80', 443)}`,
    `vg-tsukuba.opengw.net,219.100.37.100,50000,10,200000000,Japan,JP,100,8000,500,10000000,2weeks,tsukuba,msg,${SAMPLE_CONFIG_TCP('219.100.37.100', 443)}`,
    `vg-udp.opengw.net,111.222.33.44,50000,30,60000000,Japan,JP,10,3600,30,1000000,2weeks,op5,msg,${SAMPLE_CONFIG_UDP('111.222.33.44', 1194)}`,
    '*'
].join('\n');

describe('VPNGate Service Tests', () => {
    describe('formatSpeed', () => {
        it('formats bps to Mbps, Kbps, or Gbps properly', () => {
            expect(formatSpeed(125000000)).toBe('125.0 Mbps');
            expect(formatSpeed(800000)).toBe('800 Kbps');
            expect(formatSpeed(1500000000)).toBe('1.5 Gbps');
        });
    });

    describe('parseVpngateCsv', () => {
        it('correctly filters datacenters, keeps only TCP, and extracts certificates', () => {
            const { nodes, certificates, countries } = parseVpngateCsv(SAMPLE_CSV);

            // Should have JP, KR, US nodes (public-vpn, 219.100.37.*, and UDP are excluded)
            expect(nodes).toHaveLength(3);
            expect(nodes.map(n => n.ip)).toEqual(['221.112.45.67', '121.160.88.99', '73.189.201.55']);

            // Certificates extracted
            expect(certificates).toBeDefined();
            expect(certificates.ca).toBe('TEST_CA_CERTIFICATE_CONTENT');
            expect(certificates.cert).toBe('TEST_CLIENT_CERT_CONTENT');
            expect(certificates.key).toBe('TEST_CLIENT_KEY_CONTENT');

            // Country summary
            expect(countries).toHaveLength(3);
            expect(countries.map(c => c.code)).toEqual(['JP', 'KR', 'US']);
        });

        it('handles empty or invalid CSV smoothly', () => {
            const result = parseVpngateCsv('');
            expect(result.nodes).toEqual([]);
            expect(result.certificates).toBeNull();
        });
    });

    describe('filterResidentialNodes', () => {
        const { nodes } = parseVpngateCsv(SAMPLE_CSV);

        it('filters by single or multiple country', () => {
            const jpNodes = filterResidentialNodes(nodes, { countries: ['JP'] });
            expect(jpNodes).toHaveLength(1);
            expect(jpNodes[0].country).toBe('JP');

            const multiNodes = filterResidentialNodes(nodes, { countries: ['JP', 'US'] });
            expect(multiNodes).toHaveLength(2);
            expect(multiNodes.map(n => n.country)).toEqual(['JP', 'US']);
        });

        it('filters by specific IP or IP:Port', () => {
            const specific = filterResidentialNodes(nodes, { ips: ['121.160.88.99:443'] });
            expect(specific).toHaveLength(1);
            expect(specific[0].ip).toBe('121.160.88.99');
        });

        it('respects count limit', () => {
            const limited = filterResidentialNodes(nodes, { count: 2 });
            expect(limited).toHaveLength(2);
        });

        it('evenly spreads nodes across regions instead of letting one country dominate', () => {
            // Mock a pool with many fast JP nodes and fewer US/KR nodes
            const candidatePool = [
                { id: 'jp-1', ip: '1.1.1.1', country: 'JP', speed: 100000000 },
                { id: 'jp-2', ip: '1.1.1.2', country: 'JP', speed: 90000000 },
                { id: 'jp-3', ip: '1.1.1.3', country: 'JP', speed: 80000000 },
                { id: 'jp-4', ip: '1.1.1.4', country: 'JP', speed: 70000000 },
                { id: 'us-1', ip: '2.2.2.1', country: 'US', speed: 50000000 },
                { id: 'us-2', ip: '2.2.2.2', country: 'US', speed: 40000000 },
                { id: 'kr-1', ip: '3.3.3.1', country: 'KR', speed: 60000000 }
            ];

            // Request 4 nodes across ALL countries
            const balanced = filterResidentialNodes(candidatePool, { countries: ['ALL'], count: 4 });
            expect(balanced).toHaveLength(4);

            // Round 1 should pick 1 from JP, 1 from KR, 1 from US
            // Round 2 should pick the second from JP
            expect(balanced.map(n => n.id)).toEqual(['jp-1', 'kr-1', 'us-1', 'jp-2']);
            // Regions represented: JP, KR, US (not 4 JP nodes!)
            expect(new Set(balanced.map(n => n.country)).size).toBe(3);
        });
    });

    describe('buildResidentialProxyObject', () => {
        const { nodes, certificates } = parseVpngateCsv(SAMPLE_CSV);

        it('generates valid OpenVPN proxy with dialer-proxy and certs', () => {
            const proxy = buildResidentialProxyObject(nodes[0], {
                frontProxy: '⚡ 香港专线-01',
                certificates,
                index: 0
            });

            expect(proxy.type).toBe('openvpn');
            expect(proxy.server).toBe('221.112.45.67');
            expect(proxy.port).toBe(443);
            expect(proxy.proto).toBe('tcp');
            expect(proxy['dialer-proxy']).toBe('⚡ 香港专线-01');
            expect(proxy.ca).toBe('TEST_CA_CERTIFICATE_CONTENT');
            expect(proxy.cert).toBe('TEST_CLIENT_CERT_CONTENT');
            expect(proxy.key).toBe('TEST_CLIENT_KEY_CONTENT');
            expect(proxy.name).toContain('日本家宽-01');
        });
    });

    describe('getResidentialData caching', () => {
        it('uses mock fetcher and caches results', async () => {
            let fetchCount = 0;
            const mockFetcher = async () => {
                fetchCount++;
                return {
                    ok: true,
                    text: async () => SAMPLE_CSV
                };
            };

            const data1 = await getResidentialData({ fetcher: mockFetcher, forceRefresh: true });
            expect(data1.nodes).toHaveLength(3);
            expect(fetchCount).toBe(1);

            // Second call within TTL should use memory cache
            const data2 = await getResidentialData({ fetcher: mockFetcher, forceRefresh: false });
            expect(data2.nodes).toHaveLength(3);
            expect(fetchCount).toBe(1);
        });
    });
});
