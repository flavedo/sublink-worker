import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';
import { generateClashRuleSets } from '../src/config/ruleGenerators.js';
import { PREDEFINED_RULE_SETS } from '../src/config/rules.js';

const SS_INPUT = `
ss://YWVzLTEyOC1nY206dGVzdA@example.com:443#HK-Node-1
ss://YWVzLTEyOC1nY206dGVzdA@example.com:444#US-Node-1
`;

describe('Clash Ad Blocking (anti-AD) Feature Tests', () => {
  it('should include Ad Block in balanced rule set', () => {
    expect(PREDEFINED_RULE_SETS.balanced).toContain('Ad Block');
  });

  it('generateClashRuleSets should generate remote_rule_providers for anti-ad', () => {
    const { site_rule_providers, remote_rule_providers } = generateClashRuleSets(['Ad Block'], [], true);

    // 只保留 anti-ad 一份广告源
    expect(site_rule_providers['category-ads-all']).toBeUndefined();
    expect(remote_rule_providers['anti-ad']).toBeDefined();
    expect(remote_rule_providers['anti-ad'].behavior).toBe('domain');
    expect(remote_rule_providers['anti-ad'].format).toBe('yaml');
    expect(remote_rule_providers['anti-ad'].url).toContain('anti-ad-clash.yaml');
  });

  it('should create 🛑 广告拦截 proxy group with REJECT and DIRECT options', async () => {
    const builder = new ClashConfigBuilder(SS_INPUT, ['Ad Block', 'Location:CN'], [], null, 'zh-CN', 'mihomo/1.0');
    const yamlText = await builder.build();
    const config = yaml.load(yamlText);

    const adBlockGroup = (config['proxy-groups'] || []).find(g => g && g.name.includes('广告拦截'));
    expect(adBlockGroup).toBeDefined();
    expect(adBlockGroup.type).toBe('select');
    expect(adBlockGroup.proxies).toEqual(['REJECT', 'DIRECT']);
    // Should NOT have proxy-providers attached
    expect(adBlockGroup.use).toBeUndefined();
  });

  it('should register anti-ad (and no category-ads-all) in rule-providers', async () => {
    const builder = new ClashConfigBuilder(SS_INPUT, ['Ad Block'], [], null, 'zh-CN', 'mihomo/1.0');
    const yamlText = await builder.build();
    const config = yaml.load(yamlText);

    expect(config['rule-providers']['anti-ad']).toBeDefined();
    expect(config['rule-providers']['category-ads-all']).toBeUndefined();
  });

  it('should place Ad Block rules before Location:CN rules to avoid bypass', async () => {
    const builder = new ClashConfigBuilder(SS_INPUT, ['Private', 'Ad Block', 'Location:CN'], [], null, 'zh-CN', 'mihomo/1.0');
    const yamlText = await builder.build();
    const config = yaml.load(yamlText);

    const antiAdIdx = config.rules.findIndex(r => r.includes('anti-ad'));
    const cnSiteIdx = config.rules.findIndex(r => r.startsWith('RULE-SET,cn,'));

    expect(antiAdIdx).toBeGreaterThan(-1);
    expect(cnSiteIdx).toBeGreaterThan(-1);
    expect(antiAdIdx).toBeLessThan(cnSiteIdx);
  });

  it('should also generate rule-providers for other remote_rules such as Aethersailor Direct', async () => {
    const builder = new ClashConfigBuilder(SS_INPUT, ['Aethersailor Direct'], [], null, 'zh-CN', 'mihomo/1.0');
    const yamlText = await builder.build();
    const config = yaml.load(yamlText);

    expect(config['rule-providers']['Custom_Direct_Domain']).toBeDefined();
    expect(config['rule-providers']['Custom_Direct_Classical_IP']).toBeDefined();
    expect(config.rules).toContainEqual('RULE-SET,Custom_Direct_Domain,DIRECT');
    expect(config.rules).toContainEqual('RULE-SET,Custom_Direct_Classical_IP,DIRECT');
  });
});
