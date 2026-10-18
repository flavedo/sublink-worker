/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import { APP_NAME, GITHUB_REPO, DOCS_URL, APP_VERSION } from '../constants.js';
import { BUILD_TIME } from '../buildInfo.js';

export const Footer = () => {
    const currentYear = new Date().getFullYear();
    const buildTime = BUILD_TIME && new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    }).format(new Date(BUILD_TIME));

    return (
        <footer class="mt-12 py-8 border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
            <div class="container mx-auto px-4">
                <div class="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div class="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-gray-600 dark:text-gray-400 text-center md:text-left">
                        <span class="text-sm">© {currentYear} {APP_NAME}. All rights reserved.</span>
                        <span class="hidden md:inline text-gray-300 dark:text-gray-700">|</span>
                        <div class="flex flex-wrap items-center justify-center gap-2">
                        <a
                            href={`${GITHUB_REPO}/releases/tag/v${APP_VERSION}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-mono"
                            title={`View release notes for v${APP_VERSION}`}
                        >
                            v{APP_VERSION}
                        </a>
                        {buildTime && (
                            <time datetime={BUILD_TIME} class="text-xs text-gray-500 dark:text-gray-400" title="部署构建时间（北京时间 UTC+8）">
                                构建于 {buildTime} (UTC+8)
                            </time>
                        )}
                        </div>
                    </div>

                    <div class="flex items-center gap-6">
                        <a
                            href={DOCS_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                            aria-label="Documentation"
                        >
                            <i class="fas fa-book text-lg"></i>
                        </a>
                        <a
                            href={GITHUB_REPO}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                            aria-label="GitHub"
                        >
                            <i class="fab fa-github text-lg"></i>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
