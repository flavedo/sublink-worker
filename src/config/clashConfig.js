/**
 * Clash Configuration
 * Base configuration template for Clash client
 */

export const CLASH_CONFIG = {
	'port': 7890,
	'socks-port': 7891,
	'allow-lan': false,
	'mode': 'rule',
	'log-level': 'info',
	'geodata-mode': true,
	'geo-auto-update': false,
	'geodata-loader': 'standard',
	'geo-update-interval': 24,
	'geox-url': {
		"geoip": "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip.dat",
  		"geosite": "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat",
  		"mmdb": "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/country.mmdb",
  		"asn": "https://fastly.jsdelivr.net/gh/xishang0128/geoip@release/GeoLite2-ASN.mmdb"
	},
	'rule-providers': {
		// 将由代码自动生成
	},
	'dns': {
		'enable': true,
		'ipv6': false,
		'respect-rules': true,
		'enhanced-mode': 'fake-ip', 
		'cache-api': true,
    	'cache-limit': 4096,
		// # 1. 基础解析器：仅用于解析 DoH 的域名，必须用最快的 UDP DNS
		'default-nameserver': [
			'120.53.53.53',
			'223.5.5.5'
		],
		// 2. 国内解析器：负责 Fake-IP 的快速生成和国内域名解析,建议混合一个 UDP 和一个 DoH
		'nameserver': [
			'https://120.53.53.53/dns-query',
			'https://223.5.5.5/dns-query'
		],
		// 3. 专门给你的代理服务器（节点）域名使用的 DNS。
		'proxy-server-nameserver': [
			'120.53.53.53',
			'223.5.5.5'
		],
		// 4. 策略分流：特定域名直接指定解析器，减少逻辑判断
		'nameserver-policy': {
			'+.m-team.cc': [
				'https://dns.cloudflare.com/dns-query',
				'https://dns.google/dns-query',
			],
			'+.m-team.io': [
				'https://dns.cloudflare.com/dns-query',
				'https://dns.google/dns-query',
			],
			'raw.githubusercontent.com': [
				'https://120.53.53.53/dns-query',
				'https://223.5.5.5/dns-query'
			],
			'github.com': [
				'https://120.53.53.53/dns-query',
				'https://223.5.5.5/dns-query'
			],
			"+.jsdelivr.net": [
				'https://120.53.53.53/dns-query',
				'https://223.5.5.5/dns-query'
			],
			'geosite:cn,private': [
				'https://120.53.53.53/dns-query',
				'https://223.5.5.5/dns-query'
			],
			'geosite:geolocation-!cn': [
				'https://dns.cloudflare.com/dns-query',
				'https://dns.google/dns-query',
				// 'https://mydn.chengjason.eu.org/dd'
			]
		}
	},
	'proxies': [],
	'proxy-groups': []
};
