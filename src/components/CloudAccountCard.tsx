import { Cloud, Download, LogOut, Mail, ShieldCheck, Upload, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { collectionRepository } from '../app/dependencies';
import { normalizeAuthProvider } from '../domain/authProvider';
import { ConfirmButton } from './ConfirmButton';
import { useQueryClient } from '@tanstack/react-query';
import { cloudCollectionSummaryKey } from '../hooks/useCloudCollectionSummary';
import { useSupabaseSession } from '../hooks/useSupabaseSession';
import { useI18n } from '../i18n';
import { isCloudConfigured, supabase } from '../lib/supabase';
import { CloudCollectionService, type CloudCollectionSummary } from '../services/CloudCollectionService';
import { CloudCollectionSyncService } from '../services/CloudCollectionSyncService';
import { useCloudSyncStore } from '../store/cloudSyncStore';
import { AuthProviderIcon, DiscordIcon, GoogleIcon } from './AuthProviderIcon';

const emptySummary:CloudCollectionSummary={entries:0,species:0,totalQuantity:0};

export function CloudAccountCard(){
  const {t}=useI18n();
  const queryClient=useQueryClient();
  const {session,loading}=useSupabaseSession();
  const [busy,setBusy]=useState(false);
  const [email,setEmail]=useState('');
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [local,setLocal]=useState<CloudCollectionSummary>(emptySummary);
  const [remote,setRemote]=useState<CloudCollectionSummary>(emptySummary);
  const service=useMemo(()=>supabase?new CloudCollectionService(collectionRepository,supabase):null,[]);
  const syncService=useMemo(()=>supabase?new CloudCollectionSyncService(collectionRepository,supabase):null,[]);
  const syncStatus=useCloudSyncStore(state=>state.status);
  const setSyncStatus=useCloudSyncStore(state=>state.setStatus);

  useEffect(()=>{
    if(!session||!service)return;
    setBusy(true);setError('');
    Promise.all([service.getLocalSummary(),service.getCloudSummary()]).then(([localSummary,remoteSummary])=>{setLocal(localSummary);setRemote(remoteSummary)}).catch(()=>setError(t('cloudLoadError'))).finally(()=>setBusy(false));
  },[session,service,syncStatus,t]);

  const oauth=async(provider:'google'|'discord')=>{
    if(!supabase)return;
    setBusy(true);setError('');
    const prompt=provider==='google'?'select_account':'consent';
    const {error:authError}=await supabase.auth.signInWithOAuth({provider,options:{redirectTo:`${window.location.origin}/backup`,queryParams:{prompt}}});
    if(authError){setError(t('cloudLoginError'));setBusy(false)}
  };

  const magicLink=async(event:FormEvent)=>{
    event.preventDefault();if(!supabase||!email.trim())return;
    setBusy(true);setError('');setMessage('');
    const {error:authError}=await supabase.auth.signInWithOtp({email:email.trim(),options:{emailRedirectTo:`${window.location.origin}/backup`}});
    if(authError)setError(t('cloudLoginError'));else setMessage(t('magicLinkSent'));
    setBusy(false);
  };

  const importLocal=async()=>{
    if(!session||!service||!syncService||remote.entries>0)return;
    setBusy(true);setError('');setMessage('');
    try{const result=await syncService.keepDeviceCollection(session.user.id);setSyncStatus(result.status);if(result.status==='conflict')return;const summary=await service.getCloudSummary();setRemote(summary);await queryClient.invalidateQueries({queryKey:cloudCollectionSummaryKey});setMessage(t('cloudImportSuccess'))}
    catch{setError(t('cloudImportError'))}
    finally{setBusy(false)}
  };

  const restoreCloud=async()=>{
    if(!service||local.entries>0)return;
    setBusy(true);setError('');setMessage('');
    try{const summary=await service.restoreCloudCollection();setLocal(summary);await queryClient.invalidateQueries({queryKey:['collection']});setMessage(t('cloudRestoreSuccess'))}
    catch{setError(t('cloudRestoreError'))}
    finally{setBusy(false)}
  };

  const resolveConflict=async(source:'device'|'cloud')=>{
    if(!session||!syncService)return;
    setBusy(true);setError('');setMessage('');setSyncStatus('syncing');
    try{
      const result=source==='device'?await syncService.keepDeviceCollection(session.user.id):await syncService.keepCloudCollection(session.user.id);
      setSyncStatus(result.status);
      if(result.status==='conflict')return;
      await Promise.all([queryClient.invalidateQueries({queryKey:['collection']}),queryClient.invalidateQueries({queryKey:cloudCollectionSummaryKey})]);
      setMessage(t(source==='device'?'cloudKeepDeviceSuccess':'cloudKeepCloudSuccess'));
    }catch{setSyncStatus('error');setError(t('cloudSyncError'))}
    finally{setBusy(false)}
  };

  if(!isCloudConfigured){
    if(!import.meta.env.DEV)return null;
    return <section className="panel cloud-card">
      <div className="cloud-card-head"><div className="backup-icon"><Cloud /></div><div><span className="eyebrow">{t('cloudCollection')}</span><h2>{t('connectAccount')}</h2><p>{t('connectAccountDescription')}</p></div></div>
      <div className="cloud-auth-options">
        <button className="cloud-provider google" disabled><GoogleIcon/>{t('continueGoogle')}</button>
        <button className="cloud-provider discord" disabled><DiscordIcon/>{t('continueDiscord')}</button>
        <div className="cloud-divider"><span>{t('orEmail')}</span></div>
        <form className="cloud-email"><label htmlFor="cloud-email-preview">{t('emailAddress')}</label><div><input id="cloud-email-preview" type="email" placeholder="voce@exemplo.com" disabled/><button className="primary" type="button" disabled><Mail size={17}/>{t('sendMagicLink')}</button></div></form>
        <Link className="cloud-local" to="/"><ShieldCheck size={17}/><span><strong>{t('continueWithoutAccount')}</strong><small>{t('continueWithoutAccountDescription')}</small></span></Link>
        <div className="cloud-preview-notice"><Cloud size={17}/><span><strong>{t('cloudPreview')}</strong><small>{t('cloudPreviewDescription')}</small></span></div>
      </div>
    </section>;
  }
  if(loading)return <section className="panel cloud-card" aria-live="polite"><div className="backup-icon"><Cloud /></div><p>{t('loading')}</p></section>;
  const sessionProvider=session?normalizeAuthProvider(typeof session.user.app_metadata.provider==='string'?session.user.app_metadata.provider:session.user.identities?.[0]?.provider):'email';
  const providerLabel=sessionProvider==='google'?'Google':sessionProvider==='discord'?'Discord':t('emailProvider');

  return <section className="panel cloud-card">
    <div className="cloud-card-head"><div className="backup-icon"><Cloud /></div><div><span className="eyebrow">{t('cloudCollection')}</span><h2>{session?t('cloudAccount'):t('connectAccount')}</h2><p>{session?t('cloudAccountDescription'):t('connectAccountDescription')}</p></div>{session&&<button className="cloud-signout" disabled={busy} onClick={()=>supabase?.auth.signOut()}><LogOut size={16}/>{t('signOut')}</button>}</div>
    {!session?<div className="cloud-auth-options">
      <button className="cloud-provider google" disabled={busy} onClick={()=>oauth('google')}><GoogleIcon/>{t('continueGoogle')}</button>
      <button className="cloud-provider discord" disabled={busy} onClick={()=>oauth('discord')}><DiscordIcon/>{t('continueDiscord')}</button>
      <div className="cloud-divider"><span>{t('orEmail')}</span></div>
      <form className="cloud-email" onSubmit={magicLink}><label htmlFor="cloud-email">{t('emailAddress')}</label><div><input id="cloud-email" type="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="voce@exemplo.com" required/><button className="primary" disabled={busy||!email.trim()}><Mail size={17}/>{t('sendMagicLink')}</button></div></form>
      <Link className="cloud-local" to="/"><ShieldCheck size={17}/><span><strong>{t('continueWithoutAccount')}</strong><small>{t('continueWithoutAccountDescription')}</small></span></Link>
    </div>:<div className="cloud-session">
      <div className="cloud-user"><UserRound size={18}/><span><small>{t('connectedAs')}</small><strong>{session.user.email}</strong></span><div className="cloud-login-method"><AuthProviderIcon provider={sessionProvider}/><span className="cloud-login-copy"><small>{t('loginMethod')}</small><strong>{providerLabel}</strong></span></div></div>
      <div className="cloud-summaries"><div><span>{t('thisDevice')}</span><strong>{local.totalQuantity}</strong><small>{local.species} {t('species')} · {local.entries} {t('aggregatedEntries')}</small></div><div><span>{t('cloud')}</span><strong>{remote.totalQuantity}</strong><small>{remote.species} {t('species')} · {remote.entries} {t('aggregatedEntries')}</small></div></div>
      {syncStatus==='conflict'?<div className="cloud-import"><div><strong>{t('cloudConflictTitle')}</strong><p>{t('cloudConflictDescription')}</p></div><div className="button-row"><ConfirmButton className="secondary-action" title={t('keepDeviceQuestion')} description={t('keepDeviceDescription')} confirmLabel={t('keepDevice')} disabled={busy} onConfirm={()=>resolveConflict('device')}><Upload size={17}/>{t('keepDevice')}</ConfirmButton><ConfirmButton className="primary" title={t('keepCloudQuestion')} description={t('keepCloudDescription')} confirmLabel={t('keepCloud')} disabled={busy} onConfirm={()=>resolveConflict('cloud')}><Download size={17}/>{t('keepCloud')}</ConfirmButton></div></div>:syncStatus==='syncing'?<div className="cloud-safe-state"><Cloud size={18}/><span><strong>{t('cloudSyncing')}</strong><small>{t('cloudSyncingDescription')}</small></span></div>:syncStatus==='synced'?<div className="cloud-safe-state"><ShieldCheck size={18}/><span><strong>{t('cloudSyncActive')}</strong><small>{t('cloudSyncActiveDescription')}</small></span></div>:remote.entries===0&&local.entries>0?<div className="cloud-import"><div><strong>{t('localCollectionFound')}</strong><p>{t('localCollectionFoundDescription')}</p></div><button className="primary" disabled={busy} onClick={importLocal}><Upload size={17}/>{t('saveToCloud')}</button></div>:remote.entries>0&&local.entries===0?<div className="cloud-import"><div><strong>{t('remoteCollectionFound')}</strong><p>{t('remoteCollectionFoundDescription')}</p></div><ConfirmButton className="primary" title={t('restoreCloudQuestion')} description={t('restoreCloudDescription')} confirmLabel={t('restoreOnDevice')} disabled={busy} onConfirm={restoreCloud}><Download size={17}/>{t('restoreOnDevice')}</ConfirmButton></div>:null}
    </div>}
    {error&&<div className="notice error" role="alert">{error}</div>}{message&&<div className="notice success" role="status"><ShieldCheck size={18}/>{message}</div>}
  </section>;
}
