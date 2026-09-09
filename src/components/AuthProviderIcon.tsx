import { AtSign } from 'lucide-react';
import { normalizeAuthProvider } from '../domain/authProvider';

export function GoogleIcon(){
  return <svg data-brand-icon="google" aria-hidden="true" width="19" height="19" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.797 2.716v2.258h2.909c1.702-1.567 2.684-3.874 2.684-6.614Z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.468-.806 5.956-2.181l-2.909-2.258c-.806.54-1.835.859-3.047.859-2.344 0-4.328-1.585-5.037-3.714H.956v2.332A9 9 0 0 0 9 18Z"/>
    <path fill="#FBBC05" d="M3.963 10.706A5.41 5.41 0 0 1 3.682 9c0-.592.102-1.167.281-1.706V4.962H.956A9 9 0 0 0 0 9c0 1.452.347 2.827.956 4.038l3.007-2.332Z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.507.454 3.441 1.346l2.581-2.581C13.464.892 11.426 0 9 0A9 9 0 0 0 .956 4.962l3.007 2.332C4.672 5.165 6.656 3.58 9 3.58Z"/>
  </svg>;
}

export function DiscordIcon(){
  return <svg data-brand-icon="discord" aria-hidden="true" width="21" height="16" viewBox="0 0 64 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#5865F2" d="M40.575 0c-.619 1.099-1.174 2.235-1.68 3.397a48.744 48.744 0 0 0-14.497 0A32.55 32.55 0 0 0 22.719 0 46.42 46.42 0 0 0 9.648 4.028C1.39 16.265-.846 28.186.266 39.943A48.776 48.776 0 0 0 16.29 47.987a32.184 32.184 0 0 0 3.435-5.531 30.42 30.42 0 0 1-5.405-2.576c.455-.328.897-.669 1.326-.998 10.14 4.774 21.885 4.774 32.038 0 .43.354.871.695 1.326.998a31.047 31.047 0 0 1-5.418 2.589 32.45 32.45 0 0 0 3.435 5.531 48.842 48.842 0 0 0 16.025-8.032c1.314-13.638-2.247-25.458-9.408-35.927A46.75 46.75 0 0 0 40.588.025L40.575 0ZM21.14 32.707c-3.119 0-5.708-2.829-5.708-6.327 0-3.498 2.488-6.339 5.695-6.339 3.208 0 5.759 2.854 5.708 6.339-.05 3.486-2.513 6.327-5.695 6.327Zm21.039 0c-3.132 0-5.696-2.829-5.696-6.327 0-3.498 2.488-6.339 5.696-6.339 3.207 0 5.745 2.854 5.695 6.339-.05 3.486-2.513 6.327-5.695 6.327Z"/>
  </svg>;
}

export function AuthProviderIcon({provider}:{provider:string|undefined}){
  const normalized=normalizeAuthProvider(provider);
  return <span className={`header-provider ${normalized}`} data-auth-provider={normalized} title={normalized==='email'?'Email':normalized==='google'?'Google':'Discord'}>
    {normalized==='google'?<GoogleIcon/>:normalized==='discord'?<DiscordIcon/>:<AtSign aria-hidden="true" size={17}/>}
  </span>;
}
