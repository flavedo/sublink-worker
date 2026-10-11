export function emitClashRules(rules = [], translator) {
    if (!translator) {
        throw new Error('emitClashRules requires a translator function');
    }
    const results = [];
    const emitRemote = (rule, phase) => {
        (rule.remote_rules || []).filter(remote => (remote.match_phase || 'domain') === phase).forEach(remote => {
            const providerName = remote.name || remote.url.split('/').pop().replace(/\.ya?ml$/, '');
            results.push(`RULE-SET,${providerName},${translator('outboundNames.' + rule.outbound)}`);
        });
    };

    // Source-based overrides retain precedence over destination rules.
    rules.forEach(rule => {
        (rule.src_ip_cidr || []).filter(Boolean).forEach(cidr => {
            results.push(`SRC-IP-CIDR,${cidr},${translator('outboundNames.' + rule.outbound)}`);
        });
    });

    // Emit each domain policy together so broad rules cannot jump ahead of exceptions.
    rules.forEach(rule => {
        const outbound = translator('outboundNames.' + rule.outbound);
        (rule.domain_suffix || []).forEach(suffix => results.push(`DOMAIN-SUFFIX,${suffix},${outbound}`));
        (rule.domain_keyword || []).forEach(keyword => results.push(`DOMAIN-KEYWORD,${keyword},${outbound}`));
        emitRemote(rule, 'domain');
        (rule.site_rules || []).filter(Boolean).forEach(site => results.push(`RULE-SET,${site},${outbound}`));
    });

    rules.forEach(rule => {
        const outbound = translator('outboundNames.' + rule.outbound);
        emitRemote(rule, 'ip');
        (rule.ip_rules || []).filter(Boolean).forEach(ip => results.push(`RULE-SET,${ip}-ip,${outbound},no-resolve`));
        (rule.ip_cidr || []).filter(Boolean).forEach(cidr => results.push(`IP-CIDR,${cidr},${outbound},no-resolve`));
    });

    rules.forEach(rule => emitRemote(rule, 'fallback'));
    return [...new Set(results)];
}

const normalize = (s) => typeof s === 'string' ? s.trim() : s;

export function sanitizeClashProxyGroups(config) {
    const groups = config['proxy-groups'] || [];
    if (!Array.isArray(groups) || groups.length === 0) {
        return;
    }
    const proxyNames = new Set((config.proxies || []).map(p => normalize(p?.name)).filter(Boolean));
    const groupNames = new Set(groups.map(g => normalize(g?.name)).filter(Boolean));
    const validNames = new Set(['DIRECT', 'REJECT'].map(normalize));
    proxyNames.forEach(n => validNames.add(n));
    groupNames.forEach(n => validNames.add(n));

    config['proxy-groups'] = groups.map(group => {
        if (!group || !Array.isArray(group.proxies)) return group;
        const normalizedProxies = group.proxies
            .map(x => typeof x === 'string' ? x.trim() : x)
            .filter(x => typeof x === 'string');
        const seen = new Set();
        const deduped = normalizedProxies.filter(value => {
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
        });

        // If group uses providers, we cannot validate provider node names at build time.
        // Skip filtering to avoid incorrectly removing valid provider nodes.
        if (Array.isArray(group.use) && group.use.length > 0) {
            return { ...group, proxies: deduped };
        }

        const filtered = deduped.filter(x => validNames.has(normalize(x)));
        return { ...group, proxies: filtered };
    });
}
