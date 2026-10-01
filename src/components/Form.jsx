/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import { PREDEFINED_RULE_SETS, UNIFIED_RULES } from '../config/index.js';
import { TextareaWithActions } from './TextareaWithActions.jsx';
import { formLogicFn } from './formLogic.js';

const LINK_FIELDS = [
  { key: 'xray', labelKey: 'xrayLink' },
  { key: 'singbox', labelKey: 'singboxLink' },
  { key: 'clash', labelKey: 'clashLink' },
  { key: 'surge', labelKey: 'surgeLink' }
];

export const Form = (props) => {
  const { t, lang } = props;

  const translations = {
    processing: t('processing'),
    convert: t('convert'),
    saveConfigSuccess: t('saveConfigSuccess'),
    saveConfig: t('saveConfig'),
    savingConfig: t('savingConfig'),
    configContentRequired: t('configContentRequired'),
    configSaveFailed: t('configSaveFailed'),
    confirmClearConfig: t('confirmClearConfig'),
    confirmClearAll: t('confirmClearAll'),
    errorGeneratingLinks: t('errorGeneratingLinks'),
    shortenLinks: t('shortenLinks'),
    shortening: t('shortening'),
    alreadyShortened: t('alreadyShortened'),
    shortenFailed: t('shortenFailed'),
    customShortCode: t('customShortCode'),
    optional: t('optional'),
    customShortCodePlaceholder: t('customShortCodePlaceholder'),
    showFullLinks: t('showFullLinks')
  };

  const scriptContent = `
    window.APP_TRANSLATIONS = ${JSON.stringify(translations)};
    window.PREDEFINED_RULE_SETS = ${JSON.stringify(PREDEFINED_RULE_SETS)};
    window.APP_LANG = ${JSON.stringify(lang || 'zh-CN')};
    if (typeof __name === 'undefined') { var __name = function(fn) { return fn; }; }
    (${formLogicFn.toString()})();
  `;

  return (
    <div x-data="formData()" x-init="init()" class="max-w-4xl mx-auto">
      <form {...{'x-on:submit.prevent': 'submitForm'}} class="space-y-8">

      {/* Input Section */}
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-md group">
        <TextareaWithActions
          id="input"
          name="input"
          label={t('shareUrls')}
          labelPrefix={
            <span class="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <i class="fas fa-link text-sm"></i>
            </span>
          }
          model="input"
          rows={5}
          placeholder={t('urlPlaceholder')}
          required
          textareaAttrs={{ 'x-ref': 'inputTextarea', style: 'resize: none' }}
          labelActionsWrapperClass="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          labelActions={[
            {
              key: 'paste',
              icon: 'fas fa-paste',
              label: t('paste'),
              hideLabelOnMobile: true,
              className:
                'px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1',
              title: t('paste'),
              attrs: {
                'x-on:click': "navigator.clipboard.readText().then(text => input = text).catch(() => {})"
              }
            },
            {
              key: 'clear',
              icon: 'fas fa-times',
              label: t('clear'),
              hideLabelOnMobile: true,
              className:
                'px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1',
              title: t('clear'),
              attrs: {
                'x-on:click': "input = ''",
                'x-show': 'input'
              }
            }
          ]}
        />
      </div>

      {/* Auto Node Selection */}
      <div
        x-show="nodes.length > 0"
        {...{
          'x-transition:enter': 'transition ease-out duration-300',
          'x-transition:enter-start': 'opacity-0 transform -translate-y-2',
          'x-transition:enter-end': 'opacity-100 transform translate-y-0'
        }}
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <div 
          class="flex items-center justify-between cursor-pointer select-none"
          x-on:click="autoNodesOpen = !autoNodesOpen"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <i class="fas fa-bolt text-sm"></i>
            </span>
            {t('autoNodeSelection')}
            <span class="text-xs font-normal text-gray-500 dark:text-gray-400" x-text="'(' + checkedNodes.length + '/' + nodes.length + ')'"></span>
          </h3>
          <div class="flex items-center gap-2">
            <button
              type="button"
              x-on:click="$event.stopPropagation(); checkAllNodes()"
              class="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {t('selectAll')}
            </button>
            <button
              type="button"
              x-on:click="$event.stopPropagation(); checkNoNodes()"
              class="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              {t('selectNone')}
            </button>
            <div 
              class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 transition-transform duration-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              x-bind:class="{'rotate-180': autoNodesOpen}"
            >
              <i class="fas fa-chevron-down text-xs"></i>
            </div>
          </div>
        </div>
        <div
          x-show="autoNodesOpen"
          {...{
            'x-transition:enter': 'transition ease-out duration-200',
            'x-transition:enter-start': 'opacity-0 transform -translate-y-2',
            'x-transition:enter-end': 'opacity-100 transform translate-y-0',
            'x-transition:leave': 'transition ease-in duration-150',
            'x-transition:leave-start': 'opacity-100 transform translate-y-0',
            'x-transition:leave-end': 'opacity-0 transform -translate-y-2'
          }}
          class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/60"
        >
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('autoNodeSelectionTip')}</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
            <template x-for="node in nodes" x-bind:key="'auto-' + node">
              <label class="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors select-none">
                <input
                  type="checkbox"
                  x-bind:value="node"
                  x-model="checkedNodes"
                  class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300 truncate" x-text="node"></span>
              </label>
            </template>
          </div>
        </div>
      </div>

      {/* Manual Node Selection */}
      <div
        x-show="nodes.length > 0"
        {...{
          'x-transition:enter': 'transition ease-out duration-300',
          'x-transition:enter-start': 'opacity-0 transform -translate-y-2',
          'x-transition:enter-end': 'opacity-100 transform translate-y-0'
        }}
        class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <div 
          class="flex items-center justify-between cursor-pointer select-none"
          x-on:click="manualNodesOpen = !manualNodesOpen"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <i class="fas fa-hand-pointer text-sm"></i>
            </span>
            {t('manualNodeSelection')}
            <span class="text-xs font-normal text-gray-500 dark:text-gray-400" x-text="'(' + checkedManualNodes.length + '/' + nodes.length + ')'"></span>
          </h3>
          <div class="flex items-center gap-2">
            <button
              type="button"
              x-on:click="$event.stopPropagation(); checkAllManualNodes()"
              class="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {t('selectAll')}
            </button>
            <button
              type="button"
              x-on:click="$event.stopPropagation(); checkNoManualNodes()"
              class="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              {t('selectNone')}
            </button>
            <div 
              class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 transition-transform duration-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              x-bind:class="{'rotate-180': manualNodesOpen}"
            >
              <i class="fas fa-chevron-down text-xs"></i>
            </div>
          </div>
        </div>
        <div
          x-show="manualNodesOpen"
          {...{
            'x-transition:enter': 'transition ease-out duration-200',
            'x-transition:enter-start': 'opacity-0 transform -translate-y-2',
            'x-transition:enter-end': 'opacity-100 transform translate-y-0',
            'x-transition:leave': 'transition ease-in duration-150',
            'x-transition:leave-start': 'opacity-100 transform translate-y-0',
            'x-transition:leave-end': 'opacity-0 transform -translate-y-2'
          }}
          class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/60"
        >
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('manualNodeSelectionTip')}</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
            <template x-for="node in nodes" x-bind:key="'manual-' + node">
              <label class="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors select-none">
                <input
                  type="checkbox"
                  x-bind:value="node"
                  x-model="checkedManualNodes"
                  class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300 truncate" x-text="node"></span>
              </label>
            </template>
          </div>
        </div>
      </div>

      {/* Residential Chained Proxy Section */}
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-md">
        <div class="flex items-center justify-between">
          <div
            class="flex items-center gap-3 cursor-pointer select-none flex-1"
            x-on:click="enableResidential = !enableResidential; if (enableResidential && residentialMode === 'manual' && residentialNodes.length === 0) fetchResidentialNodes();"
          >
            <span class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg">
              <i class="fas fa-house-signal"></i>
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{t('residentialProxyTitle')}</h3>
                <span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  {t('residentialProxyBadge')}
                </span>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('enableResidentialTip')}</p>
            </div>
          </div>
          <label class="relative inline-flex items-center cursor-pointer ml-4 select-none">
            <input
              type="checkbox"
              x-model="enableResidential"
              class="sr-only peer"
              x-on:change="if (enableResidential && residentialMode === 'manual' && residentialNodes.length === 0) fetchResidentialNodes();"
            />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600"></div>
          </label>
        </div>

        {/* Content when enabled */}
        <div
          x-show="enableResidential"
          {...{
            'x-transition:enter': 'transition ease-out duration-300',
            'x-transition:enter-start': 'opacity-0 transform -translate-y-2',
            'x-transition:enter-end': 'opacity-100 transform translate-y-0',
            'x-transition:leave': 'transition ease-in duration-150',
            'x-transition:leave-start': 'opacity-100 transform translate-y-0',
            'x-transition:leave-end': 'opacity-0 transform -translate-y-2'
          }}
          class="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700/60 space-y-6"
        >
          {/* 1. 前置跳板节点选择 */}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <i class="fas fa-plane-departure text-gray-400"></i>
                {t('residentialFront')}
              </label>
              <select
                x-model="residentialFront"
                class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="node-select">{t('followNodeSelect')}</option>
                <option value="auto-select">{t('followAutoSelect')}</option>
                <template x-if="nodes.length > 0">
                  <optgroup label="机场专线节点">
                    <template x-for="n in nodes" x-bind:key="'front-' + n">
                      <option x-bind:value="n" x-text="n"></option>
                    </template>
                  </optgroup>
                </template>
              </select>
              <p class="text-xs text-gray-400 mt-1">{t('residentialFrontTip')}</p>
            </div>

            {/* 2. 节点选取模式切换 */}
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <i class="fas fa-layer-group text-gray-400"></i>
                {t('residentialMode')}
              </label>
              <div class="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <button
                  type="button"
                  x-on:click="residentialMode = 'dynamic'"
                  class="py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5"
                  x-bind:class="residentialMode === 'dynamic' ? 'bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'"
                >
                  <i class="fas fa-bolt text-xs"></i>
                  {t('residentialModeDynamic')}
                </button>
                <button
                  type="button"
                  x-on:click="residentialMode = 'manual'; if (residentialNodes.length === 0) fetchResidentialNodes();"
                  class="py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5"
                  x-bind:class="residentialMode === 'manual' ? 'bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'"
                >
                  <i class="fas fa-list-check text-xs"></i>
                  {t('residentialModeManual')}
                </button>
              </div>
              <p class="text-xs text-gray-400 mt-1" x-text="residentialMode === 'dynamic' ? '每次更新订阅时按地区均衡优选各地区高速住宅 IP' : '在可用列表中自主挑选并锁定指定 IP'"></p>
            </div>
          </div>

          {/* 3. 落地国家/地区与数量 */}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                  <i class="fas fa-globe text-gray-400"></i>
                  {t('residentialCountry')}
                </span>
                <span class="text-xs text-amber-600 dark:text-amber-400 font-normal" x-text="selectedResidentialCountries.includes('ALL') ? '已选: 全部地区' : '已选 ' + selectedResidentialCountries.length + ' 个地区'"></span>
              </label>
              <div class="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                {[
                  { code: 'ALL', label: '🌐 全部地区 (均衡)' },
                  { code: 'JP', label: '🇯🇵 日本' },
                  { code: 'KR', label: '🇰🇷 韩国' },
                  { code: 'US', label: '🇺🇸 美国' },
                  { code: 'HK', label: '🇭🇰 香港' },
                  { code: 'TW', label: '🇹🇼 台湾' },
                  { code: 'SG', label: '🇸🇬 新加坡' },
                  { code: 'GB', label: '🇬🇧 英国' },
                  { code: 'DE', label: '🇩🇪 德国' },
                  { code: 'FR', label: '🇫🇷 法国' },
                  { code: 'NL', label: '🇳🇱 荷兰' },
                  { code: 'CA', label: '🇨🇦 加拿大' },
                  { code: 'AU', label: '🇦🇺 澳大利亚' },
                  { code: 'TH', label: '🇹🇭 泰国' },
                  { code: 'VN', label: '🇻🇳 越南' },
                  { code: 'MY', label: '🇲🇾 马来西亚' },
                  { code: 'PH', label: '🇵🇭 菲律宾' },
                  { code: 'ID', label: '🇮🇩 印尼' },
                  { code: 'IN', label: '🇮🇳 印度' },
                  { code: 'RU', label: '🇷🇺 俄罗斯' },
                  { code: 'UA', label: '🇺🇦 乌克兰' },
                  { code: 'TR', label: '🇹🇷 土耳其' },
                  { code: 'RO', label: '🇷🇴 罗马尼亚' },
                  { code: 'BR', label: '🇧🇷 巴西' },
                  { code: 'AR', label: '🇦🇷 阿根廷' },
                  { code: 'IT', label: '🇮🇹 意大利' },
                  { code: 'ES', label: '🇪🇸 西班牙' },
                  { code: 'SE', label: '🇸🇪 瑞典' },
                  { code: 'CH', label: '🇨🇭 瑞士' }
                ].map(c => (
                  <button
                    type="button"
                    x-on:click={`toggleResidentialCountry('${c.code}')`}
                    class="px-2 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1"
                    x-bind:class={`isResidentialCountrySelected('${c.code}') ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold shadow-sm' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'`}
                  >
                    <template x-if={`isResidentialCountrySelected('${c.code}') && '${c.code}' !== 'ALL'`}>
                      <i class="fas fa-check text-[10px] text-amber-600 dark:text-amber-400"></i>
                    </template>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                <i class="fas fa-hashtag text-gray-400"></i>
                {t('residentialCount')}
              </label>
              <div class="flex gap-2">
                {[1, 2, 3, 5].map(cnt => (
                  <button
                    type="button"
                    x-on:click={`residentialCount = ${cnt}`}
                    class="flex-1 py-1.5 text-xs font-medium rounded-lg border text-center transition-all"
                    x-bind:class={`residentialCount === ${cnt} ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'`}
                  >
                    每国 {cnt} 个{cnt === 2 ? ' (推荐)' : ''}
                  </button>
                ))}
              </div>
              <p class="text-xs text-gray-400 mt-2">{t('residentialCountTip')}</p>
            </div>
          </div>

          {/* 4. 手动精选 IP 列表 */}
          <div
            x-show="residentialMode === 'manual'"
            class="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200/80 dark:border-gray-700/60 space-y-3"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{t('residentialNodesTitle')}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400" x-text="'(' + selectedResidentialIps.length + '/' + residentialNodes.length + ')'"></span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  x-on:click="checkAllResidentialNodes()"
                  class="px-2.5 py-1 text-xs font-medium bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-600 hover:text-amber-600 transition-colors"
                >
                  {t('selectAll')}
                </button>
                <button
                  type="button"
                  x-on:click="checkTopResidentialNodes(5)"
                  class="px-2.5 py-1 text-xs font-medium bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-600 hover:text-amber-600 transition-colors"
                >
                  前5优选
                </button>
                <button
                  type="button"
                  x-on:click="checkNoResidentialNodes()"
                  class="px-2.5 py-1 text-xs font-medium bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-600 hover:text-red-500 transition-colors"
                >
                  {t('selectNone')}
                </button>
                <button
                  type="button"
                  x-on:click="fetchResidentialNodes(true)"
                  class="px-2.5 py-1 text-xs font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors flex items-center gap-1"
                >
                  <i class="fas fa-arrows-rotate text-xs" x-bind:class="{'fa-spin': loadingResidentialNodes}"></i>
                  刷新
                </button>
              </div>
            </div>

            <div x-show="loadingResidentialNodes" class="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              <i class="fas fa-spinner fa-spin mr-2"></i>
              {t('fetchingResidentialNodes')}
            </div>

            <div
              x-show="!loadingResidentialNodes && residentialNodes.length > 0"
              class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1"
            >
              <template x-for="rNode in residentialNodes" x-bind:key="rNode.id">
                <label class="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-amber-400 dark:hover:border-amber-500 cursor-pointer transition-colors select-none text-xs">
                  <div class="flex items-center gap-2 overflow-hidden">
                    <input
                      type="checkbox"
                      x-bind:value="rNode.id"
                      x-model="selectedResidentialIps"
                      class="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span class="text-base" x-text="rNode.flag"></span>
                    <div class="truncate">
                      <div class="font-medium text-gray-800 dark:text-gray-200 truncate" x-text="rNode.ip"></div>
                      <div class="text-[10px] text-gray-400" x-text="rNode.countryName + ' • ' + (rNode.ping ? rNode.ping + 'ms' : 'TCP')"></div>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] whitespace-nowrap" x-text="rNode.speedFormatted"></span>
                </label>
              </template>
            </div>

            <div x-show="!loadingResidentialNodes && residentialNodes.length === 0" class="py-4 text-center text-xs text-gray-400">
              {t('noResidentialNodesFound')}
            </div>
          </div>

        </div>
      </div>

      {/* Advanced Options Toggle */}
      <div 
        class="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" 
        x-on:click="showAdvanced = !showAdvanced"
        role="button"
        tabindex="0"
        {...{
          'x-on:keydown.enter.prevent': 'showAdvanced = !showAdvanced',
          'x-on:keydown.space.prevent': 'showAdvanced = !showAdvanced'
        }}
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <i class="fas fa-sliders-h"></i>
          </div>
          <span class="font-semibold text-gray-900 dark:text-white">{t('advancedOptions')}</span>
        </div>
        <div 
          class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 transition-transform duration-300" 
          x-bind:class="{'rotate-180': showAdvanced}"
        >
          <i class="fas fa-chevron-down"></i>
        </div>
      </div>

  {/* Advanced Options Content */ }
  <div x-show="showAdvanced" {...{'x-transition:enter': 'transition ease-out duration-300', 'x-transition:enter-start': 'opacity-0 transform -translate-y-4', 'x-transition:enter-end': 'opacity-100 transform translate-y-0', 'x-transition:leave': 'transition ease-in duration-200', 'x-transition:leave-start': 'opacity-100 transform translate-y-0', 'x-transition:leave-end': 'opacity-0 transform -translate-y-4'}} class="space-y-6">

    {/* Rule Selection */ }
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <i class="fas fa-filter text-gray-400"></i>
          {t('ruleSelection')}
        </h3>
        <select x-model="selectedPredefinedRule" x-on:change="applyPredefinedRule()" class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
        <option value="custom">{t('custom')}</option>
        <option value="minimal">{t('minimal')}</option>
        <option value="balanced">{t('balanced')}</option>
        <option value="comprehensive">{t('comprehensive')}</option>
      </select>
          </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
    {UNIFIED_RULES.map((rule) => (
      <label class="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group">
        <input
          type="checkbox"
          value={rule.name}
          x-model="selectedRules" 
                    x-on:change="selectedPredefinedRule = 'custom'"
        class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
                  />
        <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
          {t(`outboundNames.${rule.name}`)}
        </span>
      </label>
    ))}
  </div>

          </div>

    {/* General Options */ }
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <i class="fas fa-cog text-gray-400"></i>
              {t('generalSettings')}
            </h3>
            
            <div class="space-y-4">
              <label class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                <span class="font-medium text-gray-700 dark:text-gray-300">{t('includeAutoSelect')}</span>
                <div class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" x-model="includeAutoSelect" class="sr-only peer" />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </div>
              </label>

              <label class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                <span class="font-medium text-gray-700 dark:text-gray-300">{t('includePrioritySelect')}</span>
                <div class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" x-model="includePrioritySelect" class="sr-only peer" />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </div>
              </label>

              <label class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                <div class="flex flex-col">
                  <span class="font-medium text-gray-700 dark:text-gray-300">{t('skipCertVerify')}</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('skipCertVerifyTip')}</span>
                </div>
                <div class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" x-model="skipCertVerify" class="sr-only peer" />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </div>
              </label>

              <label class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                <span class="font-medium text-gray-700 dark:text-gray-300">{t('enableClashUI')}</span>
                <div class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" x-model="enableClashUI" class="sr-only peer" />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </div>
              </label>

              <div
                x-show="enableClashUI"
                {...{
                  'x-transition:enter': 'transition ease-out duration-200',
                  'x-transition:enter-start': 'opacity-0 transform -translate-y-2',
                  'x-transition:enter-end': 'opacity-100 transform translate-y-0',
                  'x-transition:leave': 'transition ease-in duration-150',
                  'x-transition:leave-start': 'opacity-100 transform translate-y-0',
                  'x-transition:leave-end': 'opacity-0 transform -translate-y-2'
                }}
                class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2"
              >
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('externalController')}</label>
                  <input type="text" x-model="externalController" class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder={t('externalControllerPlaceholder')} />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('externalUiDownloadUrl')}</label>
                  <input type="text" x-model="externalUiDownloadUrl" class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder={t('externalUiDownloadUrlPlaceholder')} />
                </div>
              </div>
          </div>
          </div>

  {/* Subconverter External Config */}
  <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
      <i class="fas fa-file-export text-gray-400"></i>
      {t('subconverterConfigTitle')}
    </h3>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('subconverterConfigDesc')}</p>
    <div class="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <p class="font-mono text-sm text-gray-600 dark:text-gray-400 break-all" x-text="getSubconverterUrl()"></p>
    </div>
    <div class="mt-3 flex justify-end">
      <button
        type="button"
        x-on:click="copySubconverterUrl()"
        class="px-4 py-2 rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
        x-bind:class="subconverterCopied ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
      >
        <i class="fas" x-bind:class="subconverterCopied ? 'fa-check' : 'fa-copy'"></i>
        <span x-text={`subconverterCopied ? '${t('copiedSubconverterUrl')}' : '${t('copySubconverterUrl')}'`}></span>
      </button>
    </div>
  </div>


  {/* User Agent */ }
  <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <i class="fas fa-user-secret text-gray-400"></i>
              {t('UASettings')}
            </h3>
            <input 
              type="text" 
              x-model="customUA" 
              class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" 
              placeholder="curl/7.74.0" 
            />
          </div>
        </div>

  {/* Action Buttons */ }
  <div class="flex flex-col sm:flex-row gap-4">
          <button 
            type="submit" 
            class="flex-1 py-3.5 px-6 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
            x-bind:disabled="loading"
          >
            <i class="fas fa-sync-alt" x-bind:class="loading ? 'fa-spinner fa-spin' : 'fa-sync-alt'"></i>
            <span x-text="loading ? processingText : convertText">{t('convert')}</span>
          </button>

  <button
    type="button" 
            x-on:click="clearAll()"
class="px-6 py-3.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
  >
  <i class="fas fa-trash-alt"></i>
{ t('clear') }
          </button>
        </div>
      </form>

  {/* Results Section */ }
  <div x-cloak x-show="generatedLinks" x-data="{ copied: null }" {...{'x-transition:enter': 'transition ease-out duration-500', 'x-transition:enter-start': 'opacity-0 transform translate-y-8', 'x-transition:enter-end': 'opacity-100 transform translate-y-0'}} class="mt-12">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8 transition-all duration-300 hover:shadow-md">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
            <i class="fas fa-link text-sm"></i>
          </span>
          {t('subscriptionLinks')}
        </h2>
      </div>

      <div class="mt-6 space-y-4">
        {LINK_FIELDS.map((field) => (
          <div class="relative group" key={field.key}>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t(field.labelKey)}
            </label>
            <div class="flex gap-2">
              <input
                type="text"
                readonly
                x-bind:value={`shortenedLinks ? shortenedLinks?.${field.key} : generatedLinks?.${field.key}`}
                class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:border-transparent transition-all duration-200 font-mono text-sm"
                x-bind:class="shortenedLinks ? 'text-primary-600 dark:text-primary-400 font-semibold focus:ring-primary-500' : 'text-gray-600 dark:text-gray-400 focus:ring-green-500'"
              />
              <button
                type="button"
                x-on:click={`navigator.clipboard.writeText((shortenedLinks || generatedLinks)?.${field.key}); copied = '${field.key}'; setTimeout(() => copied = null, 2000)`}
                class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                x-bind:class={`{
                  'hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400': !shortenedLinks,
                  'hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400': shortenedLinks,
                  'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400': !shortenedLinks && copied === '${field.key}',
                  'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400': shortenedLinks && copied === '${field.key}'
                }`}
              >
                <i class="fas" x-bind:class={`copied === '${field.key}' ? 'fa-check' : 'fa-copy'`}></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Shortening Controls */}
      <div class="mt-6">
        <div class="flex flex-col items-center gap-3">
          <div class="w-full max-w-md">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
              {t('customShortCode')} <span class="text-gray-400">({t('optional')})</span>
            </label>
            <input
              type="text"
              x-model="customShortCode"
              placeholder={t('customShortCodePlaceholder')}
              class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-center"
            />
          </div>
        </div>
        <div class="flex justify-center mt-4">
          <button
            type="button"
            x-on:click="shortenedLinks ? shortenedLinks = null : shortenLinks()"
            x-bind:disabled="!shortenedLinks && shortening"
            class="px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg"
            x-bind:class="shortenedLinks
              ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
              : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white shadow-primary-500/30 hover:shadow-primary-500/40 disabled:opacity-50 disabled:cursor-not-allowed'"
          >
            <i
              class="fas"
              x-bind:class="shortenedLinks ? 'fa-expand-alt' : (shortening ? 'fa-spinner fa-spin' : 'fa-compress-alt')"
            ></i>
            <span
              x-text="shortenedLinks ? showFullLinksText : (shortening ? shorteningText : shortenLinksText)"
            ></span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <script dangerouslySetInnerHTML={{ __html: scriptContent }} />
    </div>
  );
};
