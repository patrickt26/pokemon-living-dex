export type AuthProvider='google'|'discord'|'email';

export function normalizeAuthProvider(provider:string|undefined):AuthProvider{
  return provider==='google'||provider==='discord'?provider:'email';
}

const trustedAvatarHosts:Record<AuthProvider,ReadonlySet<string>>={
  google:new Set(['lh3.googleusercontent.com']),
  discord:new Set(['cdn.discordapp.com','media.discordapp.net']),
  email:new Set(),
};

export function getTrustedAuthAvatarUrl(value:unknown,provider:AuthProvider):string|undefined{
  if(typeof value!=='string')return undefined;
  try{
    const url=new URL(value);
    return url.protocol==='https:'&&trustedAvatarHosts[provider].has(url.hostname)?url.href:undefined;
  }catch{
    return undefined;
  }
}
