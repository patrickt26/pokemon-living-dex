import { AlphaIcon } from './AlphaIcon';
import { SearchField } from './SearchField';
import { TypeIcon } from './TypeIcon';
import { useI18n } from '../i18n';
import type { AlphaFilter, OtFilter, OwnershipFilter, PokemonType, ShinyFilter } from '../domain/models';
import { pokemonTypes } from '../domain/types';

interface Option { id:string; label:string }
interface Props {
  search:string; onSearch:(value:string)=>void;
  ot:OtFilter; onOt:(value:OtFilter)=>void;
  ownership:OwnershipFilter; onOwnership:(value:OwnershipFilter)=>void;
  shiny?:ShinyFilter; onShiny?:(value:ShinyFilter)=>void;
  alpha?:AlphaFilter; onAlpha?:(value:AlphaFilter)=>void;
  sections?:Option[]; selectedSection?:string; onSection?:(value:string)=>void;
  generations?:Option[]; selectedGenerations?:string[]; onGeneration?:(value:string)=>void;
  selectedTypes?:PokemonType[]; onType?:(value:PokemonType|'all')=>void;
}

const typeLabels:Record<PokemonType,string>={normal:'Normal',fire:'Fire',water:'Water',electric:'Electric',grass:'Grass',ice:'Ice',fighting:'Fighting',poison:'Poison',ground:'Ground',flying:'Flying',psychic:'Psychic',bug:'Bug',rock:'Rock',ghost:'Ghost',dragon:'Dragon',dark:'Dark',steel:'Steel',fairy:'Fairy'};

export function DexFilters({search,onSearch,ot,onOt,ownership,onOwnership,shiny='all',onShiny,alpha,onAlpha,sections,selectedSection,onSection,generations,selectedGenerations=[],onGeneration,selectedTypes,onType}:Props){
  const {t}=useI18n();
  return <div className="filters">
    <SearchField value={search} onChange={onSearch}/>
    <div className="segmented shiny-selector" aria-label={t('collectionView','Collection view')}>{([['all',t('all','All')],['shiny',t('shinyMode','Shiny')],['regular',t('normalMode','Normal')]] as const).map(([value,label])=><button className={shiny===value?'active':''} onClick={()=>onShiny?.(value)} key={value}>{value==='shiny'&&'✨ '}{label}</button>)}</div>
    {alpha!==undefined&&<div className="segmented alpha-selector" aria-label={t('alphaFilter','Alpha filter')}>{([['all',t('all','All')],['alpha',t('alpha','Alpha')],['regular',t('notAlpha','Not Alpha')]] as const).map(([value,label])=><button className={alpha===value?'active':''} onClick={()=>onAlpha?.(value)} key={value}>{value==='alpha'&&<AlphaIcon/>}{label}</button>)}</div>}
    {sections?.length&&<div className="segmented dex-section-selector">{sections.map(option=><button className={selectedSection===option.id?'active':''} onClick={()=>onSection?.(option.id)} key={option.id}>{option.label}</button>)}</div>}
    {generations?.length&&<div className="segmented generation-selector" aria-label={t('generation','Generation filter')}>{generations.map(option=>{const active=option.id==='all'?selectedGenerations.length===0:selectedGenerations.includes(option.id);return <button className={active?'active':''} aria-pressed={active} onClick={()=>onGeneration?.(option.id)} key={option.id}>{option.id==='all'?t('all',option.label):option.label}</button>})}</div>}
    <div className="segmented">{([['all',t('all','All')],['owned',t('owned','Owned')],['missing',t('missing','Missing')]] as const).map(([value,label])=><button className={ownership===value?'active':''} onClick={()=>onOwnership(value)} key={value}>{label}</button>)}</div>
    <div className="segmented">{([['all',t('allOt','All OT')],['own',t('ownOt','Own OT')],['other',t('otherOt','Other OT')]] as const).map(([value,label])=><button className={ot===value?'active':''} onClick={()=>onOt(value)} key={value}>{label}</button>)}</div>
    {selectedTypes!==undefined&&<div className="segmented type-selector" aria-label={t('typeFilter','Type filter')}>
      <button className={selectedTypes.length===0?'active':''} aria-pressed={selectedTypes.length===0} onClick={()=>onType?.('all')}>{t('all','All')}</button>
      {pokemonTypes.map(type=>{const active=selectedTypes.includes(type);const label=t(`type_${type}`,typeLabels[type]);return <button className={active?'active':''} aria-label={label} title={label} aria-pressed={active} onClick={()=>onType?.(type)} key={type}><TypeIcon type={type}/></button>})}
    </div>}
  </div>;
}
