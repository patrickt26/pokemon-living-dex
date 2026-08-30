import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';

export function ScrollToTop(){
 const {t}=useI18n();
 const [visible,setVisible]=useState(false);
 useEffect(()=>{const update=()=>setVisible(window.scrollY>500);update();window.addEventListener('scroll',update,{passive:true});return()=>window.removeEventListener('scroll',update)},[]);
 const scroll=()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
 return <button className={`scroll-top ${visible?'visible':''}`} onClick={scroll} aria-label={t('backToTop')} title={t('backToTop')}><ArrowUp size={20}/></button>
}
