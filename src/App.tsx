import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { pokemonDataSource } from './data/PokemonDataSource';
import { useI18n } from './i18n';

const BackupPage=lazy(()=>import('./pages/BackupPage').then(module=>({default:module.BackupPage})));
const Dashboard=lazy(()=>import('./pages/Dashboard').then(module=>({default:module.Dashboard})));
const DexPage=lazy(()=>import('./pages/DexPage').then(module=>({default:module.DexPage})));
const GamesPage=lazy(()=>import('./pages/GamesPage').then(module=>({default:module.GamesPage})));
const NotFoundPage=lazy(()=>import('./pages/NotFoundPage').then(module=>({default:module.NotFoundPage})));
const RegionalPage=lazy(()=>import('./pages/RegionalPage').then(module=>({default:module.RegionalPage})));
const SpecialFormsPage=lazy(()=>import('./pages/SpecialFormsPage').then(module=>({default:module.SpecialFormsPage})));

function PageLoading(){
  const {t}=useI18n();
  return <div className="empty" role="status" aria-live="polite">{t('loading')}</div>;
}

function LazyPage({children}:{children:ReactNode}){
  return <Suspense fallback={<PageLoading/>}>{children}</Suspense>;
}

function GameDex(){
  const {gameId}=useParams();
  const game=pokemonDataSource.getGames().find(candidate=>candidate.id===gameId);
  return !game||game.hasDex===false?<NotFoundPage/>:<DexPage key={gameId} gameId={gameId}/>;
}

export default function App(){
  return <Routes><Route element={<AppShell/>}>
    <Route index element={<LazyPage><Dashboard/></LazyPage>}/>
    <Route path="national" element={<LazyPage><DexPage/></LazyPage>}/>
    <Route path="shiny" element={<Navigate to="/national" replace/>}/>
    <Route path="regional" element={<LazyPage><RegionalPage/></LazyPage>}/>
    <Route path="forms" element={<LazyPage><SpecialFormsPage/></LazyPage>}/>
    <Route path="games" element={<LazyPage><GamesPage/></LazyPage>}/>
    <Route path="games/:gameId" element={<LazyPage><GameDex/></LazyPage>}/>
    <Route path="backup" element={<LazyPage><BackupPage/></LazyPage>}/>
    <Route path="*" element={<LazyPage><NotFoundPage/></LazyPage>}/>
  </Route></Routes>;
}
