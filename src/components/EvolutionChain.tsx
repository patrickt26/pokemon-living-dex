import { ArrowRight } from 'lucide-react';
import { pokemonDataSource } from '../data/PokemonDataSource';
import { formatEvolutionMethod, getEvolutionChain } from '../domain/evolution';
import { useI18n } from '../i18n';
import { PokemonSprite } from './PokemonSprite';

export function EvolutionChain({speciesId}:{speciesId:string}){
  const {language,t}=useI18n();
  const chain=getEvolutionChain(speciesId);
  if(!chain)return null;
  const speciesById=pokemonDataSource.getSpeciesById();
  const formsById=pokemonDataSource.getFormsById();
  const linksByParent=new Map<number,typeof chain.links>();
  chain.links.forEach(link=>linksByParent.set(link.from,[...(linksByParent.get(link.from)??[]),link]));
  const targets=new Set(chain.links.map(link=>link.to));
  const roots=chain.species.filter(id=>!targets.has(id));
  const renderSpecies=(number:number,path:string):React.ReactNode=>{
    const species=speciesById.get(`species-${number}`);
    if(!species)return null;
    const form=formsById.get(species.defaultFormId);
    const children=linksByParent.get(number)??[];
    return <div className="evolution-node" key={path}>
      <div className={`evolution-pokemon ${species.id===speciesId?'current':''}`}>
        {form&&<PokemonSprite src={form.sprite} name={species.name}/>}<span><strong>{species.name}</strong><small>#{String(species.nationalDexNumber).padStart(4,'0')}</small></span>
      </div>
      {children.length>0&&<div className={`evolution-branches ${children.length>1?'multiple':''}`}>{children.map((link,index)=>{const current=[...new Set(link.methods.filter(method=>!method.legacy).map(method=>formatEvolutionMethod(method,language)))];const legacy=[...new Set(link.methods.filter(method=>method.legacy).map(method=>formatEvolutionMethod(method,language)))].filter(method=>!current.includes(method));const visible=current.length?current:legacy;return <div className="evolution-branch" key={`${path}-${link.to}-${index}`}>
        <div className="evolution-method"><ArrowRight size={15}/><div>{visible.length?visible.map(method=><span key={method}>{method}</span>):<span>{t('specialEvolution','Special evolution')}</span>}{current.length>0&&legacy.length>0&&<details><summary>{t('olderEvolutionMethods','Methods in other games')}</summary>{legacy.map(method=><span key={method}>{method}</span>)}</details>}</div></div>
        {renderSpecies(link.to,`${path}-${link.to}`)}
      </div>})}</div>}
    </div>;
  };
  return <section className="evolution-chain"><h3>{t('evolutionLine','Evolution line')}</h3>{chain.links.length===0?<p className="evolution-none">{t('doesNotEvolve','This Pokémon does not evolve.')}</p>:<div className="evolution-scroll"><div className="evolution-tree">{roots.map(root=>renderSpecies(root,String(root)))}</div></div>}</section>;
}
