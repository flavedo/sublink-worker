/**
 * Rule Definitions
 * Contains unified rule structure and predefined rule sets
 */

export const CUSTOM_RULES = [];

export const UNIFIED_RULES = [
	{
		name: 'Adobe',
		outbound: 'Adobe',
		site_rules: ['adobe'],
		ip_rules: ['adobe'],
		ip_no_resolve: true
	},
	{
		name: 'Private',
		outbound: 'DIRECT',
		site_rules: ['private'],
		ip_rules: ['private'],
		ip_no_resolve: true
	},
	{
		name: 'Aethersailor Direct',
		outbound: 'DIRECT',
		site_rules: [],
		ip_rules: [],
		remote_rules: [
			{ type: 'clash-domain', url: 'https://testingcf.jsdelivr.net/gh/Aethersailor/Custom_OpenClash_Rules@main/rule/Custom_Direct_Domain.yaml' },
			{ type: 'clash-classic', url: 'https://testingcf.jsdelivr.net/gh/Aethersailor/Custom_OpenClash_Rules@main/rule/Custom_Direct_Classical_IP.yaml' }
		]
	},
	{
		name: 'Aethersailor Proxy',
		outbound: 'Node Select',
		site_rules: [],
		ip_rules: [],
		remote_rules: [
			{ type: 'clash-domain', url: 'https://testingcf.jsdelivr.net/gh/Aethersailor/Custom_OpenClash_Rules@main/rule/Custom_Proxy_Domain.yaml' },
			{ type: 'clash-classic', url: 'https://testingcf.jsdelivr.net/gh/Aethersailor/Custom_OpenClash_Rules@main/rule/Custom_Proxy_Classical_IP.yaml' }
		]
	},
	{
		name: 'PT',
		outbound: 'DIRECT',
		site_rules: ['category-public-tracker', 'category-pt'],
		ip_rules: [],
		ip_no_resolve: true,
		domain_suffix: ['ptfans.cc', 'ptlover.cc', 'halomt.com']
	},
	{
		name: 'Personal',
		outbound: 'DIRECT',
		site_rules: [],
		ip_rules: [],
		ip_no_resolve: true,
		domain_suffix: [
			'dpdns.org', 'eu.org', 'qzz.io', 'de5.net', 
			'cc.cd', 'gv.uy', 'tailwindcss.com', 'parsec.app'
		]
	},
	{
		name: 'Notion',
		outbound: 'Notion',
		site_rules: ['Notion'],
		ip_rules: ['Notion'],
		ip_no_resolve: true
	},
	{
		name: 'Telegram',
		outbound: 'Telegram',
		site_rules: ['telegram'],
		ip_rules: ['telegram'],
		ip_no_resolve: true
	},
	{
		name: 'Discord',
		outbound: 'Discord',
		site_rules: ['discord'],
		ip_rules: [],
		ip_no_resolve: true
	},
	{
		name: 'Docker',
		outbound: 'Docker',
		site_rules: ['docker'],
		ip_rules: []
	},
	{
		name: 'ChatGPT',
		outbound: 'ChatGPT',
		site_rules: ['openai'],
		ip_rules: []
	},
	{
		name: 'Grok',
		outbound: 'Grok',
		site_rules: [],
		ip_rules: [],
		domain_suffix: ['grok.com', 'x.ai'],
		ip_no_resolve: true
	},
	{
		name: 'Gemini',
		outbound: 'Gemini',
		site_rules: ['google-gemini'],
		ip_rules: [],
		ip_no_resolve: true
	},
	{
		name: 'AI Services',
		outbound: 'AI Services',
		site_rules: ['category-ai-!cn'],
		ip_rules: []
	},
	{
		name: 'Apple',
		outbound: 'Apple',
		site_rules: ['apple'],
		ip_rules: []
	},
	{
		name: 'Youtube',
		outbound: 'Youtube',
		site_rules: ['youtube'],
		ip_rules: []
	},
	{
		name: 'Netflix',
		outbound: 'Netflix',
		site_rules: ['netflix'],
		ip_rules: ['netflix'],
		ip_no_resolve: true
	},
	{
		name: 'TikTok',
		outbound: 'TikTok',
		site_rules: ['tiktok'],
		ip_rules: ['tiktok'],
		ip_no_resolve: true
	},
	{
		name: 'Instagram',
		outbound: 'Instagram',
		site_rules: ['instagram'],
		ip_rules: []
	},
	{
		name: 'X',
		outbound: 'X',
		site_rules: ['twitter'],
		ip_rules: []
	},
	{
		name: 'Github',
		outbound: 'Github',
		site_rules: ['github'],
		ip_rules: ['github'],
		ip_no_resolve: true
	},
	{
		name: 'Speedtest',
		outbound: 'Speedtest',
		site_rules: ['category-speedtest'],
		ip_rules: []
	},
	{
		name: 'Steam',
		outbound: 'Steam',
		site_rules: ['steam'],
		ip_rules: []
	},
	{
		name: 'OKX',
		outbound: 'OKX',
		site_rules: ['okx'],
		ip_rules: []
	},
	{
		name: 'Binance',
		outbound: 'Binance',
		site_rules: ['binance'],
		ip_rules: []
	},
	{
		name: 'Bybit',
		outbound: 'Bybit',
		site_rules: ['bybit'],
		ip_rules: []
	},
	{
		name: 'IBKR',
		outbound: 'IBKR',
		site_rules: ['ibkr'],
		ip_rules: []
	},
	{
		name: 'Communication',
		outbound: 'Communication',
		site_rules: ['category-communication'],
		ip_rules: []
	},
	{
		name: 'Social Media',
		outbound: 'Social Media',
		site_rules: ['category-social-media-!cn'],
		ip_rules: []
	},

	{
		name: 'Cloudflare',
		outbound: 'Cloudflare',
		site_rules: ['cloudflare'],
		ip_rules: ['cloudflare'],
		ip_no_resolve: true
	},
	{
		name: 'Google',
		outbound: 'Google',
		site_rules: ['google'],
		ip_rules: ['google'],
		ip_no_resolve: true,
		domain_suffix: ['gstatic.com']
	},
	{
		name: 'Microsoft',
		outbound: 'Microsoft',
		site_rules: ['microsoft'],
		ip_rules: ['microsoft'],
		ip_no_resolve: true
	},
	{
		name: 'GFW',
		outbound: 'Node Select',
		site_rules: ['gfw'],
		ip_rules: []
	},
	{
		name: 'Location:CN',
		outbound: 'DIRECT',
		site_rules: ['cn'],
		ip_rules: ['cn'],
		ip_no_resolve: true
	},
	{
		name: 'CN Available',
		outbound: 'DIRECT',
		site_rules: ['google-cn', 'category-games@cn', 'category-game-platforms-download', 'category-public-tracker'],
		ip_rules: []
	},
	{
		name: 'Non-Standard Port',
		outbound: 'Non-Standard Port',
		site_rules: [],
		ip_rules: [],
		remote_rules: [
			{ type: 'clash-classic', url: 'https://testingcf.jsdelivr.net/gh/Aethersailor/Custom_OpenClash_Rules@main/rule/Custom_Port_Direct.yaml' }
		]
	}
];

export const DIRECT_DEFAULT_RULES = new Set([
	'Private',
	'Location:CN',
	'CN Available',
	'Aethersailor Direct',
	'Non-Standard Port'
]);

export const PREDEFINED_RULE_SETS = {
	minimal: ['Private', 'Location:CN', 'GFW'],
	balanced: [
		'Private', 'Location:CN', 'CN Available',
		'Telegram', 'ChatGPT', 'AI Services',
		'Google', 'Github', 'Youtube', 'GFW'
	],
	comprehensive: UNIFIED_RULES.map(rule => rule.name)
};

export const SITE_RULE_SETS = UNIFIED_RULES.reduce((acc, rule) => {
	rule.site_rules.forEach(site_rule => {
		acc[site_rule] = `geosite-${site_rule}.srs`;
	});
	return acc;
}, {});

export const IP_RULE_SETS = UNIFIED_RULES.reduce((acc, rule) => {
	rule.ip_rules.forEach(ip_rule => {
		acc[ip_rule] = `geoip-${ip_rule}.srs`;
	});
	return acc;
}, {});

export const CLASH_SITE_RULE_SETS = UNIFIED_RULES.reduce((acc, rule) => {
	rule.site_rules.forEach(site_rule => {
		acc[site_rule] = `${site_rule}.mrs`;
	});
	return acc;
}, {});

export const CLASH_IP_RULE_SETS = UNIFIED_RULES.reduce((acc, rule) => {
	rule.ip_rules.forEach(ip_rule => {
		acc[ip_rule] = `${ip_rule}.mrs`;
	});
	return acc;
}, {});
