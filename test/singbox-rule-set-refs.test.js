import { describe, it, expect } from 'vitest';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';

/**
 * 回归防护：sing-box 配置里 dns.rules / route.rules 引用的 rule_set 必须真的在 route.rule_set 里定义过。
 * （曾经出现过 dns.rules 引用 geolocation-!cn，但生成的 route.rule_set 里没有该条目 → 配置无效）
 */

const SS_INPUT = `
ss://YWVzLTEyOC1nY206dGVzdA@example.com:443#HK-Node-1
ss://YWVzLTEyOC1nY206dGVzdA@example.com:444#US-Node-1
`;

function collectRefs(rules = []) {
	return rules.flatMap(rule => {
		const ref = rule?.rule_set;
		if (!ref) return [];
		return Array.isArray(ref) ? ref : [ref];
	});
}

describe('sing-box 配置内部引用一致性', () => {
	for (const version of ['1.11', '1.12']) {
		it(`rule_set 引用（sing-box ${version}）都必须已定义`, async () => {
			const builder = new SingboxConfigBuilder(
				SS_INPUT, 'minimal', [], null, 'zh-CN', 'test-agent',
				false, null, null, version
			);
			const config = await builder.build();

			const defined = new Set((config.route?.rule_set || []).map(r => r.tag));
			const refs = [
				...collectRefs(config.dns?.rules),
				...collectRefs(config.route?.rules)
			];
			const missing = [...new Set(refs.filter(ref => !defined.has(ref)))];

			expect(missing).toEqual([]);
			// DNS 分流依赖的 geolocation-!cn 必须存在
			expect(defined.has('geolocation-!cn')).toBe(true);
		});
	}
});
