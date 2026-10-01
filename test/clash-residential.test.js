import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';

const b64 = (str) => Buffer.from(str).toString('base64');

const SAMPLE_AIRPORT_NODE = `
ss://YWVzLTEyOC1nY206cGFzc3dvcmQ@1.1.1.1:1001#⚡ 香港专线-01
ss://YWVzLTEyOC1nY206cGFzc3dvcmQ@1.1.1.2:1002#⚡ 日本专线-01
`;

const MOCK_VPNGATE_DATA = {
    nodes: [
        {
            id: '221.112.45.67:443',
            ip: '221.112.45.67',
            host: '221.112.45.67',
            port: 443,
            country: 'JP',
            countryName: '日本',
            countryNameEn: 'Japan',
            flag: '🇯🇵',
            speed: 125000000,
            speedFormatted: '125.0 Mbps',
            ping: 15,
            uptime: 3600,
            sessions: 12,
            cipher: 'AES-128-CBC',
            auth: 'SHA1'
        },
        {
            id: '121.160.88.99:443',
            ip: '121.160.88.99',
            host: '121.160.88.99',
            port: 443,
            country: 'KR',
            countryName: '韩国',
            countryNameEn: 'Korea',
            flag: '🇰🇷',
            speed: 80000000,
            speedFormatted: '80.0 Mbps',
            ping: 25,
            uptime: 7200,
            sessions: 5,
            cipher: 'AES-128-CBC',
            auth: 'SHA1'
        }
    ],
    certificates: {
        ca: 'MOCK_CA_DATA',
        cert: 'MOCK_CERT_DATA',
        key: 'MOCK_KEY_DATA'
    },
    countries: [
        { code: 'JP', name: '日本', flag: '🇯🇵', count: 1 },
        { code: 'KR', name: '韩国', flag: '🇰🇷', count: 1 }
    ]
};

describe('Clash Residential Chained Proxy Integration Tests', () => {
    it('injects openvpn proxies with dialer-proxy and creates fallback group', async () => {
        const residentialOptions = {
            enabled: true,
            frontProxy: '⚡ 香港专线-01',
            countries: ['JP', 'KR'],
            count: 5,
            vpngateData: MOCK_VPNGATE_DATA
        };

        const builder = new ClashConfigBuilder(
            SAMPLE_AIRPORT_NODE,
            ['ChatGPT', 'Google'],
            [],
            null,
            'zh-CN',
            'mihomo/1.19.25',
            false,
            null,
            null,
            true, // includeAutoSelect
            false,
            false,
            [],
            [],
            residentialOptions
        );

        const yamlText = await builder.build();
        const config = yaml.load(yamlText);

        // 1. Proxies check
        const openvpnProxies = config.proxies.filter(p => p.type === 'openvpn');
        expect(openvpnProxies).toHaveLength(2);

        const jpProxy = openvpnProxies.find(p => p.server === '221.112.45.67');
        expect(jpProxy).toBeDefined();
        expect(jpProxy['dialer-proxy']).toBe('⚡ 香港专线-01');
        expect(jpProxy.ca).toBe('MOCK_CA_DATA');
        expect(jpProxy.username).toBe('vpn');
        expect(jpProxy.password).toBe('vpn');

        // 2. Residential group check (manual select)
        const resGroup = config['proxy-groups'].find(g => g.name === '🏠 家宽选择');
        expect(resGroup).toBeDefined();
        expect(resGroup.type).toBe('select');
        expect(resGroup.proxies).toContain(jpProxy.name);

        // 3. Node select group check: should include '🏠 家宽选择'
        const nodeSelectGroup = config['proxy-groups'].find(g => g.name === '🚀 手动选择');
        expect(nodeSelectGroup).toBeDefined();
        expect(nodeSelectGroup.proxies).toContain('🏠 家宽选择');

        // 4. Url-test group check: should NOT contain openvpn nodes directly
        const autoGroup = config['proxy-groups'].find(g => g.type === 'url-test');
        expect(autoGroup).toBeDefined();
        expect(autoGroup.proxies).not.toContain(jpProxy.name);

        // 5. 「家宽优先分流服务」已移除：不再把家宽组插到服务组的第一位
        const chatGptGroup = config['proxy-groups'].find(g => g.name.includes('ChatGPT'));
        expect(chatGptGroup).toBeDefined();
        expect(chatGptGroup.proxies[0]).not.toBe('🏠 家宽选择');
    });

    it('filters residential nodes by specified IPs', async () => {
        const residentialOptions = {
            enabled: true,
            frontProxy: '🚀 手动选择',
            ips: ['121.160.88.99:443'],
            vpngateData: MOCK_VPNGATE_DATA
        };

        const builder = new ClashConfigBuilder(
            SAMPLE_AIRPORT_NODE,
            ['Google'],
            [],
            null,
            'zh-CN',
            'clash.meta',
            false,
            null,
            null,
            true,
            false,
            false,
            [],
            [],
            residentialOptions
        );

        const yamlText = await builder.build();
        const config = yaml.load(yamlText);

        const openvpnProxies = config.proxies.filter(p => p.type === 'openvpn');
        expect(openvpnProxies).toHaveLength(1);
        expect(openvpnProxies[0].server).toBe('121.160.88.99');
        expect(openvpnProxies[0]['dialer-proxy']).toBe('🚀 手动选择');
    });

    it('spreads residential nodes evenly across regions in Clash config', async () => {
        const mockDataWithMultipleRegions = {
            nodes: [
                { id: 'jp-1:443', ip: '221.112.45.67', port: 443, country: 'JP', countryName: '日本', speed: 100000000, speedFormatted: '100.0 Mbps', ping: 15, cipher: 'AES-128-CBC', auth: 'SHA1' },
                { id: 'jp-2:443', ip: '221.112.45.68', port: 443, country: 'JP', countryName: '日本', speed: 90000000, speedFormatted: '90.0 Mbps', ping: 15, cipher: 'AES-128-CBC', auth: 'SHA1' },
                { id: 'us-1:443', ip: '198.51.100.1', port: 443, country: 'US', countryName: '美国', speed: 60000000, speedFormatted: '60.0 Mbps', ping: 150, cipher: 'AES-128-CBC', auth: 'SHA1' },
                { id: 'kr-1:443', ip: '121.160.88.99', port: 443, country: 'KR', countryName: '韩国', speed: 70000000, speedFormatted: '70.0 Mbps', ping: 40, cipher: 'AES-128-CBC', auth: 'SHA1' }
            ],
            certificates: {
                ca: 'MOCK_CA',
                cert: 'MOCK_CERT',
                key: 'MOCK_KEY'
            }
        };

        const residentialOptions = {
            enabled: true,
            frontProxy: '🚀 手动选择',
            countries: ['ALL'],
            countPerCountry: 1,
            count: 1,
            vpngateData: mockDataWithMultipleRegions
        };

        const builder = new ClashConfigBuilder(
            SAMPLE_AIRPORT_NODE,
            ['Google'],
            [],
            null,
            'zh-CN',
            'clash.meta',
            false,
            null,
            null,
            true,
            false,
            false,
            [],
            [],
            residentialOptions
        );

        const yamlText = await builder.build();
        const config = yaml.load(yamlText);

        const openvpnProxies = config.proxies.filter(p => p.type === 'openvpn');
        expect(openvpnProxies).toHaveLength(3);

        // Should include nodes from 3 different regions (JP, KR, US), not all JP!
        const proxyNames = openvpnProxies.map(p => p.name);
        expect(proxyNames.some(n => n.includes('日本家宽-01'))).toBe(true);
        expect(proxyNames.some(n => n.includes('韩国家宽-01'))).toBe(true);
        expect(proxyNames.some(n => n.includes('美国家宽-01'))).toBe(true);

        const resGroup = config['proxy-groups'].find(g => g.name === '🏠 家宽选择');
        expect(resGroup).toBeDefined();
        expect(resGroup.type).toBe('select');
        expect(resGroup.proxies).toHaveLength(3);
    });

    describe('HTTP Endpoints', () => {
        it('GET /residential-nodes returns 200 with node list', async () => {
            const { createApp } = await import('../src/app/createApp.jsx');
            const { MemoryKVAdapter } = await import('../src/adapters/kv/memoryKv.js');

            const kv = new MemoryKVAdapter();
            await kv.put('vpngate_residential_data', JSON.stringify(MOCK_VPNGATE_DATA));

            const app = createApp({
                kv,
                assetFetcher: null,
                logger: console,
                config: { configTtlSeconds: 60 }
            });

            const res = await app.request('/residential-nodes?country=JP');
            expect(res.status).toBe(200);

            const json = await res.json();
            expect(json.nodes).toHaveLength(1);
            expect(json.nodes[0].country).toBe('JP');
            expect(json.nodes[0].ip).toBe('221.112.45.67');
            expect(json.countries).toHaveLength(2);
        });

        it('GET /clash with residential query params generates residential config', async () => {
            const { createApp } = await import('../src/app/createApp.jsx');
            const { MemoryKVAdapter } = await import('../src/adapters/kv/memoryKv.js');

            const kv = new MemoryKVAdapter();
            await kv.put('vpngate_residential_data', JSON.stringify(MOCK_VPNGATE_DATA));

            const app = createApp({
                kv,
                assetFetcher: null,
                logger: console,
                config: { configTtlSeconds: 60 }
            });

            const res = await app.request('/clash?config=' + encodeURIComponent(SAMPLE_AIRPORT_NODE) + '&enable_residential=true&res_country=KR');
            expect(res.status).toBe(200);

            const text = await res.text();
            const config = yaml.load(text);

            const openvpnProxies = config.proxies.filter(p => p.type === 'openvpn');
            expect(openvpnProxies).toHaveLength(1);
            expect(openvpnProxies[0].country || openvpnProxies[0].name).toContain('韩国');

            const resGroup = config['proxy-groups'].find(g => g.name === '🏠 家宽选择');
            expect(resGroup).toBeDefined();
            expect(resGroup.type).toBe('select');
        });
    });
});

