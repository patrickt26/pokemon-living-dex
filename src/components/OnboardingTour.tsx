import { Boxes,Download,MousePointer2,Search,Sparkles,X } from 'lucide-react';
import { useCallback,useEffect,useRef,useState } from 'react';
import { useI18n, type TranslationKey } from '../i18n';

const STORAGE_KEY='living-dex:onboarding-completed';
const steps=[
  {icon:Boxes,title:'onboardingOrganizeTitle',description:'onboardingOrganizeDescription'},
  {icon:MousePointer2,title:'onboardingUpdateTitle',description:'onboardingUpdateDescription'},
  {icon:Sparkles,title:'onboardingVariantsTitle',description:'onboardingVariantsDescription'},
  {icon:Search,title:'onboardingFindTitle',description:'onboardingFindDescription'},
  {icon:Download,title:'onboardingBackupTitle',description:'onboardingBackupDescription'},
] satisfies {icon:typeof Boxes;title:TranslationKey;description:TranslationKey}[];

export function OnboardingTour(){const {t}=useI18n();const [open,setOpen]=useState(()=>typeof window!=='undefined'&&window.localStorage.getItem(STORAGE_KEY)!=='true');const [step,setStep]=useState(0);const dialogRef=useRef<HTMLElement>(null);const finish=useCallback(()=>{window.localStorage.setItem(STORAGE_KEY,'true');setOpen(false)},[]);useEffect(()=>{if(!open)return;dialogRef.current?.focus();const close=(event:KeyboardEvent)=>{if(event.key==='Escape')finish()};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[open,finish]);if(!open)return null;const current=steps[step]!;const Icon=current.icon;return <div className="onboarding-backdrop"><section ref={dialogRef} tabIndex={-1} className="onboarding-dialog" role="dialog" aria-modal="true" aria-labelledby="onboarding-title"><button className="onboarding-close" onClick={finish} aria-label={t('close')}><X size={18}/></button><div className="onboarding-progress"><span>{t('quickStart')}</span><span>{step+1} / {steps.length}</span></div><div className="onboarding-icon"><Icon size={28}/></div><h2 id="onboarding-title">{t(current.title)}</h2><p>{t(current.description)}</p><div className="onboarding-dots" aria-label={`${step+1} / ${steps.length}`}>{steps.map((item,index)=><button key={item.title} className={index===step?'active':''} onClick={()=>setStep(index)} aria-label={`${t('goToStep')} ${index+1}`}/>)}</div><div className="onboarding-actions"><button className="onboarding-skip" onClick={finish}>{t('skip')}</button>{step<steps.length-1?<button className="primary onboarding-next" onClick={()=>setStep(value=>value+1)}>{t('next')}</button>:<button className="primary onboarding-next" onClick={finish}>{t('start')}</button>}</div></section></div>}
