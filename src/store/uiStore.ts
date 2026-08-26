import { create } from 'zustand';
import type { FormId, OtFilter } from '../domain/models';
import type { Language } from '../i18n';
interface UiState { search:string; otFilter:OtFilter; selectedFormId:FormId|null; dark:boolean; language:Language; setSearch:(value:string)=>void; setOtFilter:(value:OtFilter)=>void; selectForm:(id:FormId|null)=>void; toggleDark:()=>void; setLanguage:(value:Language)=>void; }
const getInitialLanguage=():Language=>{if(typeof window==='undefined')return'en';const saved=window.localStorage.getItem('living-dex:language');if(saved==='pt-BR'||saved==='en')return saved;return typeof navigator!=='undefined'&&navigator.language.toLowerCase().startsWith('pt')?'pt-BR':'en'};
const initialLanguage:Language=getInitialLanguage();
export const useUiStore=create<UiState>((set)=>({search:'',otFilter:'all',selectedFormId:null,dark:true,language:initialLanguage,setSearch:(search)=>set({search}),setOtFilter:(otFilter)=>set({otFilter}),selectForm:(selectedFormId)=>set({selectedFormId}),toggleDark:()=>set(s=>({dark:!s.dark})),setLanguage:(language)=>{if(typeof window!=='undefined')window.localStorage.setItem('living-dex:language',language);set({language})}}));
