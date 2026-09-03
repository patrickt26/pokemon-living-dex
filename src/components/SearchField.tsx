import { Search, X } from 'lucide-react';
import { useI18n } from '../i18n';

interface Props {
  value:string;
  onChange:(value:string)=>void;
}

export function SearchField({value,onChange}:Props){
  const {t}=useI18n();
  const label=t('search','Search Pokémon or # number');
  return <div className="search">
    <Search size={18}/>
    <input value={value} onChange={event=>onChange(event.target.value)} placeholder={label} aria-label={label}/>
    <button className="search-clear" type="button" onClick={()=>onChange('')} disabled={!value} aria-label={t('clearSearch')} title={t('clearSearch')}><X size={16}/></button>
  </div>;
}
