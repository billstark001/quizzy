declare module 'virtual:i18n-compiled' {
  import type { CompiledLanguageResource } from '@/data/lang-model';
  
  export const langOrder: readonly string[];
  export const compiledLangRes: { [lang: string]: CompiledLanguageResource };
  export default compiledLangRes;
}