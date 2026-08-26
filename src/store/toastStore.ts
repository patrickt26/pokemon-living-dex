import { create } from 'zustand';
export interface Toast { id:number; message:string; tone:'success'|'error'; action?:{label:string;onClick:()=>void} }
interface ToastState { toast:Toast|null; show:(message:string,tone?:Toast['tone'],action?:Toast['action'])=>void; dismiss:()=>void }
export const useToastStore=create<ToastState>(set=>({toast:null,show:(message,tone='success',action)=>set({toast:{id:Date.now(),message,tone,action}}),dismiss:()=>set({toast:null})}));
