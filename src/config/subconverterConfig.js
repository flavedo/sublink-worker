/**
 * Subconverter Configuration Generator
 * Generates subconverter external config file (INI format) from unified rules
 */

import { createTranslator } from '../i18n/index.js';
import { generateRules } from './ruleGenerators.js';
import { COUNTRY_DATA } from '../utils.js';
import { DIRECT_DEFAULT_RULES } from './rules.js';

const REJECT_RULES = new Set(['Adobe']);

const SPEED_TEST_URL = 'http://www.gstatic.com/generate_204';

function escapeRegex(str) {
	return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function buildCountryGroupRefs(countryGroupNames) {
	return countryGroupNames.map(name => `[]${name}`).join('`');
}

function resolveGroupName(rule, t) {
	const outbound = rule.outbound || rule.name;
	if (outbound === 'DIRECT') return 'DIRECT';
	if (outbound === 'REJECT') return 'REJECT';
	return t(`outboundNames.${outbound}`);
}

/**
 * Generate subconverter external config (INI format)
 */
export function generateSubconverterConfig({ selectedRules = [], customRules = [], lang = 'zh-CN', includeAutoSelect = true, groupByCountry = false } = {}) {
	const t = createTranslator(lang);
	const rules = generateRules(selectedRules, customRules);

	const lines = ['[custom]'];

	rules.forEach(rule => {
		const groupName = resolveGroupName(rule, t);

		if (rule.src_ip_cidr) {
			rule.src_ip_cidr.forEach(cidr => {
				if (cidr) lines.push(`ruleset=${groupName},[]SRC-IP-CIDR,${cidr}`);
			});
		}
	});

	rules.forEach(rule => {
		const groupName = resolveGroupName(rule, t);

		if (rule.domain_suffix) {
			rule.domain_suffix.forEach(suffix => {
				if (suffix) lines.push(`ruleset=${groupName},[]DOMAIN-SUFFIX,${suffix}`);
			});
		}
		if (rule.domain_keyword) {
			rule.domain_keyword.forEach(keyword => {
				if (keyword) lines.push(`ruleset=${groupName},[]DOMAIN-KEYWORD,${keyword}`);
			});
		}
		if (rule.site_rules) {
			rule.site_rules.forEach(site => {
				if (site) lines.push(`ruleset=${groupName},[]GEOSITE,${site}`);
			});
		}
		if (rule.remote_rules) {
			rule.remote_rules.forEach(remote => {
				if (remote.type === 'clash-domain') {
					lines.push(`ruleset=${groupName},clash-domain:${remote.url}`);
				} else if (remote.type === 'clash-classic') {
					lines.push(`ruleset=${groupName},clash-classic:${remote.url}`);
				}
			});
		}
	});

	rules.forEach(rule => {
		const groupName = resolveGroupName(rule, t);
		const noResolve = rule.ip_no_resolve ? ',no-resolve' : '';

		if (rule.ip_rules) {
			rule.ip_rules.forEach(ip => {
				if (ip) lines.push(`ruleset=${groupName},[]GEOIP,${ip}${noResolve}`);
			});
		}
		if (rule.ip_cidr) {
			rule.ip_cidr.forEach(cidr => {
				if (cidr) lines.push(`ruleset=${groupName},[]IP-CIDR,${cidr}`);
			});
		}
	});

	const fallBackName = t('outboundNames.Fall Back');
	lines.push(`ruleset=${fallBackName},[]FINAL`);

	lines.push('');

	const nodeSelectName = t('outboundNames.Node Select');
	const autoSelectName = t('outboundNames.Auto Select');
	const manualSwitchName = t('outboundNames.Manual Switch');

	const countryGroupNames = [];
	const countryGroupLines = [];

	if (groupByCountry) {
		Object.values(COUNTRY_DATA).forEach(country => {
			const groupName = `${country.emoji} ${country.name}`;
			countryGroupNames.push(groupName);
			const regex = country.aliases.map(a => {
				const escaped = escapeRegex(a);
				return /^[A-Za-z\s]+$/.test(a) ? `\\b${escaped}\\b` : escaped;
			}).join('|');
			countryGroupLines.push(`custom_proxy_group=${groupName}\`url-test\`(?i)(${regex})\`${SPEED_TEST_URL}\`300,,50`);
		});
	}

	if (groupByCountry) {
		const refs = buildCountryGroupRefs(countryGroupNames);
		if (includeAutoSelect) {
			lines.push(`custom_proxy_group=${nodeSelectName}\`select\`[]${autoSelectName}\`[]${manualSwitchName}\`${refs}\`[]DIRECT`);
		} else {
			lines.push(`custom_proxy_group=${nodeSelectName}\`select\`[]${manualSwitchName}\`${refs}\`[]DIRECT`);
		}
	} else {
		if (includeAutoSelect) {
			lines.push(`custom_proxy_group=${nodeSelectName}\`select\`[]${autoSelectName}\`[]DIRECT\`.*`);
		} else {
			lines.push(`custom_proxy_group=${nodeSelectName}\`select\`[]DIRECT\`.*`);
		}
	}

	if (includeAutoSelect) {
		lines.push(`custom_proxy_group=${autoSelectName}\`url-test\`.*\`${SPEED_TEST_URL}\`300,,50`);
	}

	if (groupByCountry) {
		lines.push(`custom_proxy_group=${manualSwitchName}\`select\`.*`);
	}

	countryGroupLines.forEach(line => lines.push(line));

	const processedGroups = new Set([nodeSelectName]);
	if (includeAutoSelect) processedGroups.add(autoSelectName);
	if (groupByCountry) {
		processedGroups.add(manualSwitchName);
		countryGroupNames.forEach(name => processedGroups.add(name));
	}

	const BUILTIN_OUTBOUNDS = new Set(['DIRECT', 'REJECT']);

	rules.forEach(rule => {
		const outbound = rule.outbound || rule.name;
		if (BUILTIN_OUTBOUNDS.has(outbound)) return;

		const groupName = resolveGroupName(rule, t);
		if (processedGroups.has(groupName)) return;
		processedGroups.add(groupName);

		if (REJECT_RULES.has(outbound)) {
			lines.push(`custom_proxy_group=${groupName}\`select\`[]REJECT\`[]DIRECT`);
		} else if (DIRECT_DEFAULT_RULES.has(rule.name)) {
			lines.push(`custom_proxy_group=${groupName}\`select\`[]DIRECT\`[]${nodeSelectName}`);
		} else {
			if (groupByCountry) {
				const refs = buildCountryGroupRefs(countryGroupNames);
				if (includeAutoSelect) {
					lines.push(`custom_proxy_group=${groupName}\`select\`[]${nodeSelectName}\`[]${autoSelectName}\`[]${manualSwitchName}\`${refs}\`[]DIRECT`);
				} else {
					lines.push(`custom_proxy_group=${groupName}\`select\`[]${nodeSelectName}\`[]${manualSwitchName}\`${refs}\`[]DIRECT`);
				}
			} else {
				if (includeAutoSelect) {
					lines.push(`custom_proxy_group=${groupName}\`select\`[]${nodeSelectName}\`[]${autoSelectName}\`[]DIRECT\`.*`);
				} else {
					lines.push(`custom_proxy_group=${groupName}\`select\`[]${nodeSelectName}\`[]DIRECT\`.*`);
				}
			}
		}
	});

	if (!processedGroups.has(fallBackName)) {
		if (groupByCountry) {
			const refs = buildCountryGroupRefs(countryGroupNames);
			if (includeAutoSelect) {
				lines.push(`custom_proxy_group=${fallBackName}\`select\`[]${nodeSelectName}\`[]${autoSelectName}\`[]${manualSwitchName}\`${refs}\`[]DIRECT`);
			} else {
				lines.push(`custom_proxy_group=${fallBackName}\`select\`[]${nodeSelectName}\`[]${manualSwitchName}\`${refs}\`[]DIRECT`);
			}
		} else {
			if (includeAutoSelect) {
				lines.push(`custom_proxy_group=${fallBackName}\`select\`[]${nodeSelectName}\`[]${autoSelectName}\`[]DIRECT\`.*`);
			} else {
				lines.push(`custom_proxy_group=${fallBackName}\`select\`[]${nodeSelectName}\`[]DIRECT\`.*`);
			}
		}
	}

	lines.push('');
	lines.push('enable_rule_generator=true');
	lines.push('overwrite_original_rules=true');

	return lines.join('\n');
}
