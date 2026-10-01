/**
 * Clash Configuration
 * Base configuration template for Clash client
 */
import { SNIFFER_FORCE_DOMAIN, SNIFFER_SKIP_DOMAIN } from './rules.js';

export const CLASH_CONFIG = {
	'port': 7890,
	'socks-port': 7891,
	'allow-lan': false,
	'mode': 'rule',
	'log-level': 'info',
	// 不再使用 geodata：mihomo 侧的 DNS 策略走 rule-set:（见 ClashConfigBuilder），
	// 分流规则全部是 .mrs 规则集，因此不需要 GeoIP.dat(19MB)+GeoSite.dat(10.5MB)。
	// 对 38MB flash 的路由器来说这 30MB 是关键——留着它一旦缺失，mihomo 还会自动下载写满分区。
	'keep-alive-interval': 15,
	'keep-alive-idle': 30,
	'sniffer': {
		'enable': true,
		'override-destination': true,
		'sniff': {
			'QUIC': {
				'ports': [443]
			},
			'TLS': {
				'ports': [443, 8443]
			},
			'HTTP': {
				'ports': [80, '8080-8880'],
				'override-destination': true
			}
		},
		'force-domain': SNIFFER_FORCE_DOMAIN,
		'skip-domain': SNIFFER_SKIP_DOMAIN,
		'force-dns-mapping': true,
		'parse-pure-ip': true
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
			'223.5.5.5',
			'2400:3200::1'
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
			// GitHub 走 Cloudflare/Google DoH：国内 DNS 会拿到被污染的 IP
			'github.com': [
				'https://dns.cloudflare.com/dns-query',
				'https://dns.google/dns-query'
			],
			'raw.githubusercontent.com': [
				'https://dns.cloudflare.com/dns-query',
				'https://dns.google/dns-query'
			],
			'+.githubusercontent.com': [
				'https://dns.cloudflare.com/dns-query',
				'https://dns.google/dns-query'
			],
			"+.jsdelivr.net": [
				'https://120.53.53.53/dns-query',
				'https://223.5.5.5/dns-query'
			],
			// 用 rule-set: 代替 geosite: —— geosite 需要 GeoSite.dat(10.5MB)+GeoIP.dat(19MB)，
			// 38MB flash 的路由器放不下，且文件缺失时 mihomo 会自动下载写满分区
			'rule-set:cn': [
				'https://120.53.53.53/dns-query',
				'https://223.5.5.5/dns-query'
			],
			'rule-set:private': [
				'https://120.53.53.53/dns-query',
				'https://223.5.5.5/dns-query'
			],
			'rule-set:geolocation-!cn': [
				'https://dns.cloudflare.com/dns-query',
				'https://dns.google/dns-query'
			]
		}
	},
	'proxies': [],
	'proxy-groups': []
};
