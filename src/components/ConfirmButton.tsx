import { AlertTriangle, X } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n';

interface ConfirmButtonProps {
  children: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  className?: string;
  buttonTitle?: string;
  disabled?: boolean;
  dialogLabel?: string;
  onConfirm: () => void;
}

export function ConfirmButton({children,title,description,confirmLabel='Clear',className,buttonTitle,disabled,dialogLabel,onConfirm}:ConfirmButtonProps){
 const {t}=useI18n();
 const [open,setOpen]=useState(false);
 const triggerRef=useRef<HTMLButtonElement>(null);
 const dialogRef=useRef<HTMLElement>(null);
 const close=()=>{setOpen(false);requestAnimationFrame(()=>triggerRef.current?.focus())};
 useEffect(()=>{if(!open)return;dialogRef.current?.focus();const onKeyDown=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();close()}};window.addEventListener('keydown',onKeyDown);return()=>window.removeEventListener('keydown',onKeyDown)},[open]);
 const confirm=()=>{onConfirm();close()};
 const dialog=open?<div className="confirm-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)close()}}><section ref={dialogRef} tabIndex={-1} className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description"><button className="confirm-close" onClick={close} aria-label={t('closeConfirmation','Close confirmation')}><X size={18}/></button><div className="confirm-icon"><AlertTriangle size={24}/></div><div className="confirm-copy"><span>{dialogLabel??t('destructiveAction','Destructive action')}</span><h2 id="confirm-title">{title}</h2><p id="confirm-description">{description}</p></div><div className="confirm-actions"><button onClick={close}>{t('cancel','Cancel')}</button><button className="confirm-danger" onClick={confirm}>{confirmLabel}</button></div></section></div>:null;
 const portalRoot=document.querySelector('.app')??document.body;
 return <><button ref={triggerRef} className={className} title={buttonTitle} disabled={disabled} onClick={()=>setOpen(true)}>{children}</button>{dialog&&createPortal(dialog,portalRoot)}</>
}
