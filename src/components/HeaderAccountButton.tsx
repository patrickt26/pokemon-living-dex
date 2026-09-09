import type { Session } from '@supabase/supabase-js';
import { LogIn, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTrustedAuthAvatarUrl, normalizeAuthProvider } from '../domain/authProvider';
import { useI18n } from '../i18n';
import { AuthProviderIcon } from './AuthProviderIcon';

interface Props { session:Session|null; loading:boolean }

export function HeaderAccountButton({session,loading}:Props){
  const {t}=useI18n();

  if(loading)return <span className="header-account loading" aria-label={t('loading')}><span className="header-avatar"><UserRound size={17}/></span><span className="header-account-copy"><strong>{t('loading')}</strong></span></span>;

  if(!session)return <Link className="header-account" to="/backup"><span className="header-avatar"><LogIn size={17}/></span><span className="header-account-copy"><strong>{t('signIn')}</strong><small>{t('cloudCollection')}</small></span></Link>;

  const metadata=session.user.user_metadata;
  const metadataName=[metadata.full_name,metadata.name,metadata.user_name].find(value=>typeof value==='string'&&value.trim()) as string|undefined;
  const displayName=metadataName||t('myAccount');
  const initial=displayName.trim().charAt(0).toUpperCase();
  const provider=normalizeAuthProvider(typeof session.user.app_metadata.provider==='string'?session.user.app_metadata.provider:session.user.identities?.[0]?.provider);
  const avatarUrl=getTrustedAuthAvatarUrl(metadata.avatar_url,provider);

  return <Link className="header-account signed-in" to="/backup" title={displayName} aria-label={`${t('myAccount')}: ${displayName}`}>
    <AuthProviderIcon provider={provider}/>
    {avatarUrl?<img className="header-avatar" src={avatarUrl} alt="" referrerPolicy="no-referrer"/>:<span className="header-avatar">{initial||<UserRound size={17}/>}</span>}
    <span className="header-account-copy"><strong>{displayName}</strong></span>
  </Link>;
}
