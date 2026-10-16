import { describe, expect, it } from 'vitest';
import yaml from 'js-yaml';
import { generateRules, getOutbounds } from '../src/config/ruleGenerators.js';
import { PREDEFINED_RULE_SETS } from '../src/config/rules.js';
import { generateSubconverterConfig } from '../src/config/subconverterConfig.js';
import { createTranslator } from '../src/i18n/index.js';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { SurgeConfigBuilder } from '../src/builders/SurgeConfigBuilder.js';
import { createApp, parseSelectedRules } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';

const input = 'ss://YWVzLTEyOC1nY206dGVzdA@example.com:443#HK';
const t = createTranslator('zh-CN');
const independent = ['ChatGPT', 'ClaudeCode', 'Gemini', 'PayPal', 'Docker', 'Github', 'Notion', 'Duolingo', 'Adobe'];

// Normalize emitted domain rules, keeping their actual output order.
function entries(format, output) {
    if (format === 'clash') return yaml.load(output).rules;
    if (format === 'singbox') return output.route.rules.flatMap(rule => [
        ...(rule.domain_suffix || []).map(domain => `domain:${domain}`),
        ...(rule.rule_set || [])
    ]);
    return output.split('\n');
}

async function build(format, preset = 'comprehensive', custom = []) {
    if (format === 'subconverter') return generateSubconverterConfig({ selectedRules: preset, customRules: custom });
    const Builder = { clash: ClashConfigBuilder, singbox: SingboxConfigBuilder, surge: SurgeConfigBuilder }[format];
    return new Builder(input, preset, custom, null, 'zh-CN', 'mihomo').build();
}

const hasSite = (format, site) => line => format === 'singbox' ? line === site
    : format === 'clash' ? line.startsWith(`RULE-SET,${site},`)
    : format === 'surge' ? line.includes(`/${site}.conf,`)
    : line.endsWith(`,[]GEOSITE,${site}`);

describe('Rule optimization', () => {
    it('does not mutate custom priorities across repeated configuration generation', () => {
        const custom = Object.freeze([
            { name: 'First', domain_suffix: 'example.com' },
            { name: 'Second', site: 'google' }
        ]);
        const first = generateRules('comprehensive', custom);
        expect(generateRules('comprehensive', custom)).toEqual(first);
        expect(first.slice(0, 2).map(rule => rule.outbound)).toEqual(['First', 'Second']);
    });

    it('retains every requested dedicated group and the other-AI fallback in compact mode', () => {
        const outbounds = getOutbounds(PREDEFINED_RULE_SETS.compact);
        independent.forEach(name => expect(outbounds).toContain(name));
        expect(outbounds).toContain('AI Services');
        expect(outbounds).not.toContain('Grok');
        expect(generateRules(['Grok'])[0].outbound).toBe('AI Services');
        expect(outbounds).toContain('Telegram');
        expect(outbounds).toContain('TikTok');
        expect(outbounds).toContain('Social Media');
        ['X', 'Reddit', 'Instagram', 'Discord'].forEach(name => expect(outbounds).not.toContain(name));
        const social = generateRules('compact').find(rule => rule.name === 'Social Media');
        expect(social.site_rules).toEqual(expect.arrayContaining(['twitter', 'reddit', 'instagram', 'discord']));
        expect(parseSelectedRules('compact')).toEqual(PREDEFINED_RULE_SETS.compact);
    });

    it('keeps missing upstream PayPal supplemental coverage', () => {
        const paypal = generateRules(['PayPal'])[0];
        expect(paypal.outbound).toBe('PayPal');
        expect(paypal.site_rules).toEqual(['paypal']);
        expect(paypal.domain_suffix).toEqual(['paypal-mktg.com']);
    });

    for (const format of ['clash', 'singbox', 'surge', 'subconverter']) {
        it(`${format}: prioritizes dedicated AI and download exceptions before broad policies`, async () => {
            const lines = entries(format, await build(format));
            const index = site => lines.findIndex(hasSite(format, site));
            const before = (a, b) => {
                expect(index(a)).toBeGreaterThanOrEqual(0);
                expect(index(b)).toBeGreaterThanOrEqual(0);
                expect(index(a)).toBeLessThan(index(b));
            };
            before('google-gemini', 'category-ai-!cn');
            before('anthropic', 'category-ai-!cn');
            before('openai', 'category-ai-!cn');
            for (const domain of ['grok.com', 'grokipedia.com', 'grok.x.com']) {
                const grokIndex = lines.findIndex(line => format === 'singbox' ? line === `domain:${domain}` : line.includes(`DOMAIN-SUFFIX,${domain}`));
                expect(grokIndex).toBeGreaterThanOrEqual(0);
                expect(grokIndex).toBeLessThan(index('category-ai-!cn'));
            }
            before('google-gemini', 'google-cn');
            before('youtube', 'google-cn');
            before('google-gemini', 'google');
            before('youtube', 'google');
            before('google', 'google-cn');
            before('google-cn', 'gfw');
            before('category-game-platforms-download', 'steam');
            const suffixIndex = lines.findIndex(line => line.includes('obsidian.md'));
            const adIndex = format === 'clash' ? lines.findIndex(line => line.includes('anti-ad'))
                : format === 'subconverter' ? lines.findIndex(line => line.includes('anti-ad-clash.yaml'))
                : index('category-ads-all');
            expect(adIndex).toBeGreaterThanOrEqual(0);
            expect(adIndex).toBeLessThan(suffixIndex);
        });

        it(`${format}: builds distinct compact application and AI groups`, async () => {
            const output = await build(format, 'compact');
            const groups = format === 'clash' ? yaml.load(output)['proxy-groups'].map(group => group.name)
                : format === 'singbox' ? output.outbounds.filter(group => ['selector', 'urltest'].includes(group.type)).map(group => group.tag)
                : format === 'surge' ? output.split('[Proxy Group]')[1].split('[Rule]')[0].split('\n').filter(line => line.includes(' = ')).map(line => line.split(' = ')[0])
                : output.split('\n').filter(line => line.startsWith('custom_proxy_group=')).map(line => line.split('=')[1].split('`')[0]);
            independent.forEach(name => expect(groups).toContain(t(`outboundNames.${name}`)));
            expect(groups).toContain('🧠 其他 AI');
            expect(groups).not.toContain(t('outboundNames.Grok'));
            expect(groups).not.toContain(t('outboundNames.X'));
            if (format !== 'subconverter') {
                const front = ['Node Select', 'Auto Select', 'Youtube', 'Cloudflare', 'Google', 'IBKR',
                    'ChatGPT', 'ClaudeCode', 'Gemini', 'AI Services', 'Docker', 'Github', 'Social Media']
                    .map(name => t(`outboundNames.${name}`));
                expect(groups.slice(0, front.length)).toEqual(front);
                expect(groups.slice(-2)).toEqual([
                    t('outboundNames.Ad Block'), t('outboundNames.Fall Back')
                ]);
            }
        });
    }

    for (const format of ['clash', 'singbox', 'surge', 'subconverter']) {
        for (const preset of ['balanced', 'compact', 'comprehensive']) {
            it(`${format}/${preset}: routes Google resources before the google-cn direct policy`, async () => {
                const lines = entries(format, await build(format, preset));
                const direct = lines.findIndex(hasSite(format, 'google-cn'));
                const google = lines.findIndex(hasSite(format, 'google'));
                const gstatic = lines.findIndex(line => format === 'singbox'
                    ? line === 'domain:gstatic.com'
                    : format === 'subconverter'
                        ? line.endsWith(',[]DOMAIN-SUFFIX,gstatic.com')
                        : line.includes('DOMAIN-SUFFIX,gstatic.com,'));
                expect(direct).toBeGreaterThanOrEqual(0);
                expect(google).toBeGreaterThanOrEqual(0);
                expect(gstatic).toBeGreaterThanOrEqual(0);
                expect(google).toBeLessThan(direct);
                expect(gstatic).toBeLessThan(direct);
                if (format !== 'singbox') {
                    expect(lines[google]).toContain(t('outboundNames.Google'));
                    expect(lines[gstatic]).toContain(t('outboundNames.Google'));
                    expect(lines[direct]).toContain('DIRECT');
                }
            });
        }
    }

    for (const format of ['clash', 'subconverter']) {
        it(`${format}: defers port fallback until after service IP rules and removes exact duplicates`, async () => {
            const lines = entries(format, await build(format));
            const port = lines.findIndex(line => line.includes('Custom_Port_Direct'));
            const ip = lines.findIndex(line => format === 'clash' ? line.startsWith('RULE-SET,telegram-ip,') : line.includes(',[]GEOIP,telegram,'));
            const cnIp = lines.findIndex(line => format === 'clash' ? line.startsWith('RULE-SET,cn-ip,') : line.includes(',[]GEOIP,cn,'));
            expect(ip).toBeGreaterThanOrEqual(0);
            expect(port).toBeGreaterThan(cnIp);
            expect(port).toBeGreaterThan(ip);
            const domain = lines.findIndex(hasSite(format, 'adobe'));
            const generic = lines.findIndex(line => line.includes('Custom_Direct_Domain'));
            expect(domain).toBeLessThan(generic);
            const tracker = lines.filter(hasSite(format, 'category-public-tracker'));
            expect(tracker).toHaveLength(1);
        });
    }

    it('accepts the compact preset through the HTTP endpoint', async () => {
        const app = createApp({ kv: new MemoryKVAdapter(), logger: console, config: {} });
        const response = await app.request('http://localhost/subconverter?selectedRules=compact');
        expect(response.status).toBe(200);
        const output = await response.text();
        expect(output).toContain('custom_proxy_group=💳 PayPal');
        expect(output).toContain('custom_proxy_group=🧠 其他 AI');
        expect(output).not.toContain(`custom_proxy_group=${t('outboundNames.X')}`);
    });
});
