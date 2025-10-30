import type { Plugin } from 'vite';
import { resolve } from 'path';
import { readFileSync, statSync } from 'fs';

import { transform } from 'esbuild';
import { compileLanguageResource } from './utils';

async function executeModuleWithNoImport(tsCode: string) {
  const result = await transform(tsCode, {
    loader: 'ts',
    target: 'esnext',
    format: 'esm',
  });

  const jsBase64 = Buffer.from(result.code, 'utf8').toString('base64');
  const moduleUrl = `data:text/javascript;base64,${jsBase64}`;

  const mod = await import(moduleUrl);
  return mod;
}

interface I18nCompileOptions {
  /**
   * 语言资源文件路径
   */
  langFilePath?: string;
  /**
   * 虚拟模块ID
   */
  virtualModuleId?: string;
  /**
   * 是否在开发模式下启用热更新
   */
  hmr?: boolean;
}

const defaultOptions: Required<I18nCompileOptions> = {
  langFilePath: '/lang/source.ts',
  virtualModuleId: 'virtual:i18n-compiled',
  hmr: true,
};

export default function i18nCompilePlugin(options: I18nCompileOptions = {}): Plugin {
  const opts = { ...defaultOptions, ...options };
  const resolvedVirtualModuleId = '\0' + opts.virtualModuleId;

  let root: string;
  let langFileAbsolutePath: string;
  let isProduction: boolean;
  let compiledCache: string | null = null;
  let lastModified = 0;

  // 获取文件修改时间
  function getLastModified(): number {
    try {
      const langStat = statSync(langFileAbsolutePath);
      return langStat.mtimeMs;
    } catch {
      return 0;
    }
  }

  // 编译语言资源的函数
  async function compileLangResource(): Promise<string> {
    const currentModified = getLastModified();

    // 如果文件没有变化且有缓存，直接返回缓存
    if (compiledCache && currentModified <= lastModified && currentModified > 0) {
      return compiledCache;
    }

    try {
      // 读取语言文件内容
      const langFileContent = readFileSync(langFileAbsolutePath, 'utf-8');
      const langModule = await executeModuleWithNoImport(langFileContent);

      const compiledLangRes = compileLanguageResource(langModule.langRes, langModule.langOrder);

      // 生成最终的模块代码
      const code = `
// Auto-generated i18n compiled resources
// Generated at: ${new Date().toISOString()}

export const langOrder = ${JSON.stringify(langModule.langOrder, null, 2)};

export const compiledLangRes = ${JSON.stringify(compiledLangRes, null, 2)};

export default compiledLangRes;
`;

      // 更新缓存
      compiledCache = code;
      lastModified = currentModified;

      return code;
    } catch (error) {
      console.error('Failed to compile language resources:', error);
      // 返回一个空的默认导出
      const fallbackCode = `
export const langOrder = ['en'];
export const compiledLangRes = { en: {} };
export default compiledLangRes;
`;
      compiledCache = fallbackCode;
      return fallbackCode;
    }
  }

  return {
    name: 'i18n-compile',
    configResolved(config) {
      root = config.root;
      langFileAbsolutePath = resolve(root, opts.langFilePath.replace(/^\//, ''));
      isProduction = config.command === 'build';
    },

    resolveId(id) {
      if (id === opts.virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },

    async load(id) {
      if (id === resolvedVirtualModuleId) {
        // 在开发模式下，确保文件依赖被正确追踪
        if (!isProduction) {
          this.addWatchFile(langFileAbsolutePath);
        }
        return await compileLangResource();
      }
    },

    async handleHotUpdate(ctx) {
      // 只在开发模式且启用HMR时处理热更新
      if (!opts.hmr || isProduction) return;

      // 检查是否是语言文件或相关文件的变更
      const isLangFile = ctx.file === langFileAbsolutePath;

      if (isLangFile) {
        // 清除缓存，强制重新编译
        compiledCache = null;
        lastModified = 0;

        // 找到虚拟模块并使其失效
        const virtualModule = ctx.server.moduleGraph.getModuleById(resolvedVirtualModuleId);
        if (virtualModule) {
          // 递归失效所有依赖此虚拟模块的模块
          const invalidateModule = (mod: any) => {
            ctx.server.moduleGraph.invalidateModule(mod);
            mod.importers.forEach((importer: any) => {
              invalidateModule(importer);
            });
          };

          invalidateModule(virtualModule);

          // 预编译新的语言资源
          await compileLangResource();

          console.log(`🌍 i18n resources recompiled -> ${resolvedVirtualModuleId}`);
          
          // 返回受影响的模块，让Vite处理HMR
          return [virtualModule, ...Array.from(virtualModule.importers)];
        }
      }
    },

    // 在开发模式下，监听文件变化
    configureServer(server) {
      if (!opts.hmr) return;

      // 添加对语言文件的监听
      server.watcher.add(langFileAbsolutePath);
    }
  };
}