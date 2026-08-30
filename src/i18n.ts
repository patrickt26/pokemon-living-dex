import { useCallback } from 'react';
import { en, type TranslationKey } from './locales/en';
import { ptBR } from './locales/ptBR';
import { useUiStore } from './store/uiStore';

export type Language='en'|'pt-BR';
export { en, ptBR, type TranslationKey };

const dictionaries={en,'pt-BR':ptBR} satisfies Record<Language,Record<TranslationKey,string>>;

export function translate(language:Language,key:TranslationKey){return dictionaries[language][key]}

export function useI18n(){
  const language=useUiStore(state=>state.language);
  const t=useCallback((key:TranslationKey,fallback?:string)=>dictionaries[language][key]??fallback??en[key],[language]);
  return {language,t};
}
