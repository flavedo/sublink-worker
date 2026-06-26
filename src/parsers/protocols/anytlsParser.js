import { parseServerInfo, parseUrlParams, parseBool, parseArray } from '../../utils.js';

export function parseAnytls(url) {
    const { addressPart, params, name } = parseUrlParams(url);
    const [password, serverInfo] = addressPart.split('@');
    const { host, port } = parseServerInfo(serverInfo);

    const tls = {
        enabled: true,
        server_name: params.sni || params.host || host,
        insecure: !!params?.allowInsecure || !!params?.insecure || !!params?.allow_insecure,
        alpn: parseArray(params.alpn),
    };

    const fingerprint = params['client-fingerprint'] || params.fp;
    if (fingerprint) {
        tls.utls = {
            enabled: true,
            fingerprint: fingerprint,
        };
    }

    return {
        tag: name,
        type: 'anytls',
        server: host,
        server_port: port,
        password: decodeURIComponent(password),
        udp: parseBool(params.udp, true),
        tls,
        'idle-session-check-interval': params['idle-session-check-interval'] ?? undefined,
        'idle-session-timeout': params['idle-session-timeout'] ?? undefined,
        'min-idle-session': params['min-idle-session'] ?? undefined,
    };
}
