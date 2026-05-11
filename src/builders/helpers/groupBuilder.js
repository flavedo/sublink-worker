const normalize = (value) => typeof value === 'string' ? value.trim() : value;

export function uniqueNames(names = []) {
    const seen = new Set();
    const result = [];
    names.forEach(name => {
        if (typeof name !== 'string') return;
        const normalized = normalize(name);
        if (!normalized || seen.has(normalized)) return;
        seen.add(normalized);
        result.push(normalized);
    });
    return result;
}

export function withDirectReject(options = []) {
    return uniqueNames([
        ...options,
        'DIRECT',
        'REJECT'
    ]);
}

export function buildPrioritySelectMembers({ proxyList = [], translator, groupByCountry = false, manualGroupName, countryGroupNames = [] }) {
    if (!translator) {
        throw new Error('buildPrioritySelectMembers requires a translator function');
    }
    const base = groupByCountry
        ? [
            ...(manualGroupName ? [manualGroupName] : []),
            ...countryGroupNames
        ]
        : [
            ...proxyList
        ];
    return withDirectReject(base);
}

export function buildNodeSelectMembers({ proxyList = [], translator, groupByCountry = false, manualGroupName, countryGroupNames = [], includeAutoSelect = true, includePrioritySelect = false }) {
    if (!translator) {
        throw new Error('buildNodeSelectMembers requires a translator function');
    }
    const autoName = translator('outboundNames.Auto Select');
    const priorityName = translator('outboundNames.Priority Select');
    const base = groupByCountry
        ? [
            ...(includeAutoSelect ? [autoName] : []),
            ...(includePrioritySelect ? [priorityName] : []),
            ...(manualGroupName ? [manualGroupName] : []),
            ...countryGroupNames
        ]
        : [
            ...(includeAutoSelect ? [autoName] : []),
            ...(includePrioritySelect ? [priorityName] : []),
            ...proxyList
        ];
    return withDirectReject(base);
}

export function buildSelectorMembers({ proxyList = [], translator, groupByCountry = false, manualGroupName, countryGroupNames = [], includeAutoSelect = true, includePrioritySelect = false }) {
    if (!translator) {
        throw new Error('buildSelectorMembers requires a translator function');
    }
    const base = groupByCountry
        ? [
            translator('outboundNames.Node Select'),
            ...(includeAutoSelect ? [translator('outboundNames.Auto Select')] : []),
            ...(includePrioritySelect ? [translator('outboundNames.Priority Select')] : []),
            ...(manualGroupName ? [manualGroupName] : []),
            ...countryGroupNames
        ]
        : [
            translator('outboundNames.Node Select'),
            ...(includePrioritySelect ? [translator('outboundNames.Priority Select')] : []),
            ...proxyList
        ];
    return withDirectReject(base);
}
