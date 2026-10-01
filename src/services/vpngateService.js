/**
 * VPNGate Residential Proxy Service
 * Fetches, cleans, caches and formats residential OpenVPN nodes from VPNGate
 */

export const VPNGATE_API_HTTPS = 'https://www.vpngate.net/api/iphone/';
export const VPNGATE_API_HTTP = 'http://www.vpngate.net/api/iphone/';
export const DEFAULT_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache

export const COUNTRY_META = {
    JP: { code: 'JP', name: '日本', nameEn: 'Japan', flag: '🇯🇵' },
    KR: { code: 'KR', name: '韩国', nameEn: 'Korea', flag: '🇰🇷' },
    US: { code: 'US', name: '美国', nameEn: 'United States', flag: '🇺🇸' },
    TW: { code: 'TW', name: '台湾', nameEn: 'Taiwan', flag: '🇹🇼' },
    HK: { code: 'HK', name: '香港', nameEn: 'Hong Kong', flag: '🇭🇰' },
    SG: { code: 'SG', name: '新加坡', nameEn: 'Singapore', flag: '🇸🇬' },
    TH: { code: 'TH', name: '泰国', nameEn: 'Thailand', flag: '🇹🇭' },
    VN: { code: 'VN', name: '越南', nameEn: 'Vietnam', flag: '🇻🇳' },
    GB: { code: 'GB', name: '英国', nameEn: 'United Kingdom', flag: '🇬🇧' },
    DE: { code: 'DE', name: '德国', nameEn: 'Germany', flag: '🇩🇪' },
    FR: { code: 'FR', name: '法国', nameEn: 'France', flag: '🇫🇷' },
    CA: { code: 'CA', name: '加拿大', nameEn: 'Canada', flag: '🇨🇦' },
    AU: { code: 'AU', name: '澳大利亚', nameEn: 'Australia', flag: '🇦🇺' },
    RU: { code: 'RU', name: '俄罗斯', nameEn: 'Russia', flag: '🇷🇺' }
};

let memoryCache = null;
let memoryCacheTime = 0;

export function safeBase64Decode(str = '') {
    const clean = str.replace(/\s+/g, '');
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(clean, 'base64').toString('utf-8');
    }
    return atob(clean);
}

export function formatSpeed(bps) {
    const num = Number(bps) || 0;
    if (num >= 1000000000) {
        return `${(num / 1000000000).toFixed(1)} Gbps`;
    }
    if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)} Mbps`;
    }
    if (num >= 1000) {
        return `${(num / 1000).toFixed(0)} Kbps`;
    }
    return `${num} bps`;
}

/**
 * Fetch raw CSV from VPNGate with fallback
 */
export async function fetchRawVpngateCsv(fetcher = fetch) {
    const urls = [VPNGATE_API_HTTPS, VPNGATE_API_HTTP];
    let lastError = null;

    for (const url of urls) {
        try {
            const res = await fetcher(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            if (res.ok) {
                const text = await res.text();
                if (text && text.includes('OpenVPN_ConfigData_Base64')) {
                    return text;
                }
            }
        } catch (err) {
            lastError = err;
        }
    }

    throw new Error(`Failed to fetch VPNGate data: ${lastError?.message || 'Network error'}`);
}

/**
 * Parse VPNGate CSV text and extract TCP residential nodes and shared certificates
 */
export function parseVpngateCsv(csvText) {
    if (!csvText || typeof csvText !== 'string') {
        return { nodes: [], certificates: null, countries: [] };
    }

    const lines = csvText.split('\n');
    const candidates = [];

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith('*') || line.startsWith('#')) continue;

        const parts = line.split(',');
        if (parts.length < 15) continue;

        const hostName = (parts[0] || '').trim();
        const ip = (parts[1] || '').trim();
        const score = parseInt(parts[2], 10) || 0;
        const ping = parseInt(parts[3], 10) || 0;
        const speed = parseInt(parts[4], 10) || 0;
        const countryLong = (parts[5] || '').trim();
        const countryShort = (parts[6] || '').trim().toUpperCase();
        const numSessions = parseInt(parts[7], 10) || 0;
        const uptime = parseInt(parts[8], 10) || 0;
        const configB64 = parts[parts.length - 1]?.trim();

        // 1. Filter out official datacenters and Tsukuba University core subnet
        if (hostName.toLowerCase().startsWith('public-vpn')) continue;
        if (ip.startsWith('219.100.37.')) continue;
        if (!configB64 || configB64.length < 100) continue;

        candidates.push({
            hostName,
            ip,
            score,
            ping,
            speed,
            countryLong,
            countryShort,
            numSessions,
            uptime,
            configB64
        });
    }

    // 2. Sort candidates by speed descending
    candidates.sort((a, b) => b.speed - a.speed);

    const nodes = [];
    let certificates = null;
    const countryCountMap = new Map();

    for (const item of candidates) {
        try {
            // Optimization: Decode first 6000 chars to extract parameters quickly
            const configSample = safeBase64Decode(item.configB64.slice(0, 6000));

            // 3. Keep ONLY TCP protocol (OpenVPN over TCP)
            const protoMatch = configSample.match(/^[ \t]*proto[ \t]+([^\r\n]+)/m);
            const proto = protoMatch ? protoMatch[1].trim().toLowerCase() : 'tcp';
            if (proto !== 'tcp') continue;

            // Extract remote host and port
            const remoteMatch = configSample.match(/^[ \t]*remote[ \t]+([^\r\n]+)/m);
            if (!remoteMatch) continue;
            const remoteParts = remoteMatch[1].trim().split(/\s+/);
            const remotePort = parseInt(remoteParts[1], 10) || 443;
            const remoteHost = remoteParts[0] || item.ip;

            // 4. Extract shared certificates (only need to extract once from the first valid node)
            if (!certificates) {
                const fullConfigText = safeBase64Decode(item.configB64);
                const ca = (fullConfigText.match(/<ca>([\s\S]*?)<\/ca>/) || [])[1]?.trim();
                const cert = (fullConfigText.match(/<cert>([\s\S]*?)<\/cert>/) || [])[1]?.trim();
                const key = (fullConfigText.match(/<key>([\s\S]*?)<\/key>/) || [])[1]?.trim();
                if (ca && cert && key) {
                    certificates = { ca, cert, key };
                } else {
                    continue;
                }
            }

            const cipherMatch = configSample.match(/^[ \t]*cipher[ \t]+([^\r\n]+)/m);
            const authMatch = configSample.match(/^[ \t]*auth[ \t]+([^\r\n]+)/m);

            const countryCode = item.countryShort || 'XX';
            const meta = COUNTRY_META[countryCode] || {
                code: countryCode,
                name: item.countryLong || countryCode,
                nameEn: item.countryLong || countryCode,
                flag: '🌐'
            };

            const nodeObj = {
                id: `${item.ip}:${remotePort}`,
                ip: item.ip,
                host: remoteHost,
                port: remotePort,
                country: countryCode,
                countryName: meta.name,
                countryNameEn: meta.nameEn,
                flag: meta.flag,
                speed: item.speed,
                speedFormatted: formatSpeed(item.speed),
                ping: item.ping,
                uptime: item.uptime,
                sessions: item.numSessions,
                cipher: cipherMatch ? cipherMatch[1].trim() : 'AES-128-CBC',
                auth: authMatch ? authMatch[1].trim() : 'SHA1'
            };

            nodes.push(nodeObj);

            // Tally country counts
            countryCountMap.set(countryCode, (countryCountMap.get(countryCode) || 0) + 1);
        } catch (_) {
            // Ignore malformed individual entries
        }
    }

    // Format available countries list
    const countries = Array.from(countryCountMap.entries())
        .map(([code, count]) => {
            const meta = COUNTRY_META[code] || { code, name: code, nameEn: code, flag: '🌐' };
            return {
                code,
                name: meta.name,
                nameEn: meta.nameEn,
                flag: meta.flag,
                count
            };
        })
        .sort((a, b) => b.count - a.count);

    return { nodes, certificates, countries };
}

/**
 * Get residential data with in-memory and optional KV caching
 */
export async function getResidentialData(options = {}) {
    const { kv, forceRefresh = false, fetcher = fetch, ttlMs = DEFAULT_CACHE_TTL_MS } = options;
    const now = Date.now();

    // Check memory cache
    if (!forceRefresh && memoryCache && (now - memoryCacheTime < ttlMs)) {
        return memoryCache;
    }

    // Check KV cache if available
    const KV_KEY = 'vpngate_residential_data';
    if (!forceRefresh && kv) {
        try {
            const cachedKv = await kv.get(KV_KEY);
            if (cachedKv) {
                const parsed = JSON.parse(cachedKv);
                if (parsed && Array.isArray(parsed.nodes) && parsed.certificates) {
                    memoryCache = parsed;
                    memoryCacheTime = now;
                    return memoryCache;
                }
            }
        } catch (_) {}
    }

    // Fetch and parse
    const csvText = await fetchRawVpngateCsv(fetcher);
    const result = parseVpngateCsv(csvText);

    if (result.nodes.length > 0) {
        memoryCache = result;
        memoryCacheTime = now;

        if (kv) {
            try {
                const ttlSeconds = Math.max(60, Math.floor(ttlMs / 1000));
                await kv.put(KV_KEY, JSON.stringify(result), { expirationTtl: ttlSeconds });
            } catch (_) {}
        }
    }

    return result;
}

/**
 * Filter residential nodes by specified countries, specific IPs, or limit count
 */
export function filterResidentialNodes(allNodes = [], options = {}) {
    const { countries = [], ips = [], count = 10 } = options;

    let filtered = [...allNodes];

    // 1. If specific IPs/ID are requested (e.g. ['221.112.45.67:443', '121.160.88.99'])
    const targetIps = Array.isArray(ips) ? ips : (typeof ips === 'string' ? ips.split(',') : []);
    const cleanIps = targetIps.map(s => String(s).trim()).filter(Boolean);

    if (cleanIps.length > 0) {
        const ipSet = new Set(cleanIps);
        filtered = filtered.filter(n => ipSet.has(n.id) || ipSet.has(n.ip));
        return filtered.slice(0, count || filtered.length);
    }

    // 2. Filter by countries
    const targetCountries = Array.isArray(countries) ? countries : (typeof countries === 'string' ? countries.split(',') : []);
    const cleanCountries = targetCountries.map(c => String(c).trim().toUpperCase()).filter(Boolean);

    if (cleanCountries.length > 0 && !cleanCountries.includes('ALL')) {
        const countrySet = new Set(cleanCountries);
        filtered = filtered.filter(n => countrySet.has(n.country));
    }

    // 3. Limit to count
    const limit = Number(count) > 0 ? Number(count) : 10;
    return filtered.slice(0, limit);
}

/**
 * Format a residential node into a Clash proxy object
 */
export function buildResidentialProxyObject(node, options = {}) {
    const { frontProxy = '🚀 手动选择', certificates, index = 0, lang = 'zh-CN' } = options;

    const isZh = (lang || '').startsWith('zh');
    const countryLabel = isZh ? (node.countryName || node.country) : (node.countryNameEn || node.country);
    const padIndex = String(index + 1).padStart(2, '0');
    const proxyName = `🏠 ${node.flag || ''} ${countryLabel}家宽-${padIndex} (${node.speedFormatted})`;

    return {
        name: proxyName,
        type: 'openvpn',
        server: node.ip,
        port: node.port,
        proto: 'tcp',
        username: 'vpn',
        password: 'vpn',
        cipher: node.cipher || 'AES-128-CBC',
        auth: node.auth || 'SHA1',
        udp: false,
        'handshake-timeout': 30,
        'remote-dns-resolve': true,
        dns: ['8.8.8.8', '1.1.1.1'],
        'dialer-proxy': frontProxy,
        ca: certificates?.ca || '',
        cert: certificates?.cert || '',
        key: certificates?.key || ''
    };
}
