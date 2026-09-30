import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { SurgeConfigBuilder } from '../src/builders/SurgeConfigBuilder.js';
import { generateSubconverterConfig } from '../src/config/subconverterConfig.js';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';

const SAMPLE_NODES = `
ss://YWVzLTEyOC1nY206cGFzc3dvcmQ@1.1.1.1:1001#Node-A
ss://YWVzLTEyOC1nY206cGFzc3dvcmQ@1.1.1.2:1002#Node-B
ss://YWVzLTEyOC1nY206cGFzc3dvcmQ@1.1.1.3:1003#Node-C
`;

const createTestApp = () => {
    return createApp({
        kv: new MemoryKVAdapter(),
        assetFetcher: null,
        logger: console,
        config: { configTtlSeconds: 60 }
    });
};

describe('Node Selection (Auto Select vs Manual Select)', () => {
    describe('ClashConfigBuilder', () => {
        it('uses selectNodes for Auto Select and manualNodes for type: select groups', async () => {
            const builder = new ClashConfigBuilder(
                SAMPLE_NODES,
                ['Google'],
                [],
                null,
                'zh-CN',
                'test-ua',
                false,
                null,
                null,
                true, // includeAutoSelect
                false,
                true, // includePrioritySelect
                ['Node-A', 'Node-B'], // selectNodes (auto select)
                ['Node-B', 'Node-C']  // manualNodes (manual select)
            );
            const yamlText = await builder.build();
            const config = yaml.load(yamlText);

            // Auto Select (url-test) should only have Node-A and Node-B
            const autoGroup = config['proxy-groups'].find(g => g.type === 'url-test');
            expect(autoGroup).toBeDefined();
            expect(autoGroup.proxies).toContain('Node-A');
            expect(autoGroup.proxies).toContain('Node-B');
            expect(autoGroup.proxies).not.toContain('Node-C');

            // Node Select (type: select) should only contain manual nodes (Node-B, Node-C)
            const nodeSelectGroup = config['proxy-groups'].find(g => g.name.includes('手动选择'));
            expect(nodeSelectGroup).toBeDefined();
            expect(nodeSelectGroup.type).toBe('select');
            expect(nodeSelectGroup.proxies).toContain('Node-B');
            expect(nodeSelectGroup.proxies).toContain('Node-C');
            expect(nodeSelectGroup.proxies).not.toContain('Node-A');

            // Google group (type: select) should only contain manual nodes (Node-B, Node-C)
            const googleGroup = config['proxy-groups'].find(g => g.name.includes('Google'));
            expect(googleGroup).toBeDefined();
            expect(googleGroup.type).toBe('select');
            expect(googleGroup.proxies).toContain('Node-B');
            expect(googleGroup.proxies).toContain('Node-C');
            expect(googleGroup.proxies).not.toContain('Node-A');

            // Priority Select (type: select) should only contain manual nodes (Node-B, Node-C)
            const priorityGroup = config['proxy-groups'].find(g => g.name.includes('负载均衡') || g.name.includes('优先选择'));
            expect(priorityGroup).toBeDefined();
            expect(priorityGroup.type).toBe('select');
            expect(priorityGroup.proxies).toContain('Node-B');
            expect(priorityGroup.proxies).toContain('Node-C');
            expect(priorityGroup.proxies).not.toContain('Node-A');
        });

        it('defaults to all nodes when manualNodes is empty', async () => {
            const builder = new ClashConfigBuilder(
                SAMPLE_NODES,
                ['Google'],
                [],
                null,
                'zh-CN',
                'test-ua',
                false,
                null,
                null,
                true,
                false,
                false,
                ['Node-A'], // selectNodes
                [] // manualNodes empty -> all nodes
            );
            const yamlText = await builder.build();
            const config = yaml.load(yamlText);

            const nodeSelectGroup = config['proxy-groups'].find(g => g.name.includes('手动选择'));
            expect(nodeSelectGroup.proxies).toContain('Node-A');
            expect(nodeSelectGroup.proxies).toContain('Node-B');
            expect(nodeSelectGroup.proxies).toContain('Node-C');
        });
    });

    describe('SingboxConfigBuilder', () => {
        it('uses selectNodes for urltest and manualNodes for selector outbounds', async () => {
            const builder = new SingboxConfigBuilder(
                SAMPLE_NODES,
                ['Google'],
                [],
                null,
                'zh-CN',
                'test-ua',
                false,
                null,
                null,
                '1.12',
                true,
                true,
                ['Node-A'], // auto select
                ['Node-C']  // manual select
            );
            await builder.build();
            const config = builder.config;

            // Auto Select (urltest)
            const autoGroup = config.outbounds.find(o => o.type === 'urltest');
            expect(autoGroup).toBeDefined();
            expect(autoGroup.outbounds).toEqual(['Node-A']);

            // Node Select (selector)
            const nodeSelectGroup = config.outbounds.find(o => o.type === 'selector' && o.tag.includes('手动选择'));
            expect(nodeSelectGroup).toBeDefined();
            expect(nodeSelectGroup.outbounds).toContain('Node-C');
            expect(nodeSelectGroup.outbounds).not.toContain('Node-A');
            expect(nodeSelectGroup.outbounds).not.toContain('Node-B');

            // Google outbound (selector)
            const googleGroup = config.outbounds.find(o => o.type === 'selector' && o.tag.includes('Google'));
            expect(googleGroup).toBeDefined();
            expect(googleGroup.outbounds).toContain('Node-C');
            expect(googleGroup.outbounds).not.toContain('Node-A');
            expect(googleGroup.outbounds).not.toContain('Node-B');
        });
    });

    describe('SurgeConfigBuilder', () => {
        it('uses selectNodes for url-test and manualNodes for select groups', async () => {
            const builder = new SurgeConfigBuilder(
                SAMPLE_NODES,
                ['Google'],
                [],
                null,
                'zh-CN',
                'test-ua',
                true,
                true,
                ['Node-A', 'Node-C'], // auto select
                ['Node-A']            // manual select
            );
            const surgeText = await builder.build();

            // Auto Select line
            const autoLine = surgeText.split('\n').find(l => l.includes('自动选择') && l.includes('url-test'));
            expect(autoLine).toBeDefined();
            expect(autoLine).toContain('Node-A');
            expect(autoLine).toContain('Node-C');
            expect(autoLine).not.toContain('Node-B');

            // Node Select line
            const nodeSelectLine = surgeText.split('\n').find(l => l.includes('手动选择') && l.includes('select'));
            expect(nodeSelectLine).toBeDefined();
            expect(nodeSelectLine).toContain('Node-A');
            expect(nodeSelectLine).not.toContain('Node-B');
            expect(nodeSelectLine).not.toContain('Node-C');
        });
    });

    describe('generateSubconverterConfig', () => {
        it('applies manualRegex to select groups and selectRegex to url-test group', () => {
            const ini = generateSubconverterConfig({
                selectedRules: ['Google'],
                selectNodes: ['Node-A', 'Node-B'],
                manualNodes: ['Node-C']
            });

            // url-test should use (Node\-A|Node\-B)
            expect(ini).toContain('(Node\\-A|Node\\-B)');

            // select groups should use (Node\-C)
            expect(ini).toContain('(Node\\-C)');
        });

        it('defaults to .* when manualNodes is empty', () => {
            const ini = generateSubconverterConfig({
                selectedRules: ['Google'],
                selectNodes: ['Node-A'],
                manualNodes: []
            });

            expect(ini).toMatch(/custom_proxy_group=.*手动选择.*select.*DIRECT`\.\*/);
        });
    });

    describe('HTTP Endpoints manualNodes query param', () => {
        it('GET /clash supports manualNodes param', async () => {
            const app = createTestApp();
            const configParam = encodeURIComponent(SAMPLE_NODES);
            const res = await app.request(`http://localhost/clash?config=${configParam}&selectNodes=Node-A&manualNodes=Node-B`);
            expect(res.status).toBe(200);
            const text = await res.text();
            const parsed = yaml.load(text);

            const autoGroup = parsed['proxy-groups'].find(g => g.type === 'url-test');
            expect(autoGroup.proxies).toEqual(['Node-A']);

            const manualGroup = parsed['proxy-groups'].find(g => g.name.includes('手动选择'));
            expect(manualGroup.proxies).toContain('Node-B');
            expect(manualGroup.proxies).not.toContain('Node-A');
            expect(manualGroup.proxies).not.toContain('Node-C');
        });

        it('GET /subconverter supports manualNodes param', async () => {
            const app = createTestApp();
            const res = await app.request('http://localhost/subconverter?selectedRules=minimal&selectNodes=Node-A&manualNodes=Node-B');
            expect(res.status).toBe(200);
            const text = await res.text();
            expect(text).toContain('(Node\\-A)');
            expect(text).toContain('(Node\\-B)');
        });
    });
});
