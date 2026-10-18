import { writeFileSync } from 'node:fs';

writeFileSync(new URL('../src/buildInfo.js', import.meta.url),
    `// Updated automatically before deployment builds.\nexport const BUILD_TIME = ${JSON.stringify(new Date().toISOString())};\n`);
