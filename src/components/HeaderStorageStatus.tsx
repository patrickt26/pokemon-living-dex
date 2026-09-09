import type { Session } from '@supabase/supabase-js';
import { useCloudCollectionSummary } from '../hooks/useCloudCollectionSummary';
import { useCollection } from '../hooks/useCollection';
import { useI18n } from '../i18n';

interface Props { session:Session|null; loading:boolean }

export function HeaderStorageStatus({session,loading}:Props){
  const {t}=useI18n();
  const {data:localEntries=[]}=useCollection();
  const cloud=useCloudCollectionSummary(session);
  const localSummary={
    entries:localEntries.length,
    species:new Set(localEntries.map(entry=>entry.speciesId)).size,
    totalQuantity:localEntries.reduce((sum,entry)=>sum+entry.quantity,0),
  };

  let cloudClass='state-disconnected';
  let cloudLabel=t('cloudDisconnected');
  if(loading||(session&&cloud.isPending)){cloudClass='state-checking';cloudLabel=t('cloudChecking')}
  else if(session&&cloud.isError){cloudClass='state-error';cloudLabel=t('cloudUnavailable')}
  else if(session&&cloud.data){
    const matches=cloud.data.entries===localSummary.entries&&cloud.data.species===localSummary.species&&cloud.data.totalQuantity===localSummary.totalQuantity;
    if(cloud.data.entries===0){cloudClass='state-empty';cloudLabel=t('cloudEmpty')}
    else if(matches){cloudClass='state-saved';cloudLabel=t('savedCloud')}
    else {cloudClass='state-different';cloudLabel=t('cloudDifferent')}
  }

  return <div className="storage-status" aria-label={t('storageStatus')}>
    <span className="storage-indicator local"><span>{t('saved')}</span></span>
    <span className={`storage-indicator cloud ${cloudClass}`} title={cloudLabel}><span>{cloudLabel}</span></span>
  </div>;
}
