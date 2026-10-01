import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';

const SS_INPUT = `
ss://YWVzLTEyOC1nY206dGVzdA@example.com:443#HK-Node-1
ss://YWVzLTEyOC1nY206dGVzdA@example.com:444#US-Node-1
`;

describe('Issue #334: rule-provider key collision fix', () => {
  it('google site provider should not be overwritten by ip provider', async () => {
    const builder = new ClashConfigBuilder(SS_INPUT, 'balanced', [], null, 'zh-CN', 'mihomo/1.0');
    const yamlText = await builder.build();
    const config = yaml.load(yamlText);
    const providers = config['rule-providers'];

    // google (site) should be domain behavior
    expect(providers.google).toBeDefined();
    expect(providers.google.behavior).toBe('domain');
    expect(providers.google.url).toContain('geosite');

    // google-ip should exist separately
    expect(providers['google-ip']).toBeDefined();
    expect(providers['google-ip'].behavior).toBe('ipcidr');
    expect(providers['google-ip'].url).toContain('geoip');
  });

  it('cn site provider should not be overwritten by ip provider', async () => {
    const builder = new ClashConfigBuilder(SS_INPUT, 'balanced', [], null, 'zh-CN', 'mihomo/1.0');
    const yamlText = await builder.build();
    const config = yaml.load(yamlText);
    const providers = config['rule-providers'];

    // cn (site) should be domain behavior
    expect(providers.cn).toBeDefined();
    expect(providers.cn.behavior).toBe('domain');

    // cn-ip should exist separately
    expect(providers['cn-ip']).toBeDefined();
    expect(providers['cn-ip'].behavior).toBe('ipcidr');
  });

  it('rules should reference correct provider keys', async () => {
    const builder = new ClashConfigBuilder(SS_INPUT, 'balanced', [], null, 'zh-CN', 'mihomo/1.0');
    const yamlText = await builder.build();
    const config = yaml.load(yamlText);

    // Site rules use plain key
    expect(config.rules).toContainEqual(expect.stringMatching(/^RULE-SET,google,.*Google/));
    // IP rules use -ip suffixed key
    expect(config.rules).toContainEqual(expect.stringMatching(/^RULE-SET,google-ip,.*Google.*no-resolve/));
    // 兜底规则 GFW 走手动选择组
    expect(config.rules).toContainEqual(expect.stringMatching(/^RULE-SET,gfw,.*手动选择/));
  });

  it('google domain rule should come before the gfw catch-all rule', async () => {
    const builder = new ClashConfigBuilder(SS_INPUT, 'balanced', [], null, 'zh-CN', 'mihomo/1.0');
    const yamlText = await builder.build();
    const config = yaml.load(yamlText);

    const googleIdx = config.rules.findIndex(r => r.match(/^RULE-SET,google,/));
    const gfwIdx = config.rules.findIndex(r => r.startsWith('RULE-SET,gfw,'));
    expect(googleIdx).toBeGreaterThan(-1);
    expect(gfwIdx).toBeGreaterThan(-1);
    expect(googleIdx).toBeLessThan(gfwIdx);
  });
});
