declare module 'virtual:i18n-compiled' {
  export type CompiledLanguageResource = {
    [key: string]: string | CompiledLanguageResource;
  };
  export const langOrder: readonly string[];
  export const compiledLangRes: { [lang: string]: CompiledLanguageResource };
  export default compiledLangRes;
}