import { Boxes, ChevronRight, DatabaseBackup, Gamepad2, Github, LayoutDashboard, Map, Moon, Shapes, Sun } from 'lucide-react';
import type { CSSProperties } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { pokemonDataSource } from '../data/PokemonDataSource';
import { useSupabaseSession } from '../hooks/useSupabaseSession';
import { useCloudCollectionSync } from '../hooks/useCloudCollectionSync';
import { useI18n } from '../i18n';
import { useUiStore } from '../store/uiStore';
import { OnboardingTour } from './OnboardingTour';
import { ScrollToTop } from './ScrollToTop';
import { HeaderAccountButton } from './HeaderAccountButton';
import { HeaderStorageStatus } from './HeaderStorageStatus';
import { ToastHost } from './ToastHost';

const links = [['/', 'Dashboard', LayoutDashboard, 'dashboard'], ['/national', 'National Dex', Boxes, 'nationalDex'], ['/regional', 'Regional Forms', Map, 'regionalForms'], ['/forms', 'Variants', Shapes, 'specialForms']] as const;
const mobileLinks = [...links, ['/games', 'Game Dexes', Gamepad2, 'gameDexes'] as const];

export function AppShell() {
  const { dark, toggleDark, setLanguage, language } = useUiStore();
  const { t } = useI18n();
  const auth=useSupabaseSession();
  useCloudCollectionSync(auth.session);
  const games = pokemonDataSource.getGames().filter(game => game.id !== 'home' && game.hasDex !== false);
  return <div className={dark ? 'app dark' : 'app'}><aside className="sidebar"><div className="brand"><span>LD</span><div><strong>Living Dex</strong><small>{t('collectionCompanion', 'Collection companion')}</small></div></div><nav>{links.map(([to, fallback, Icon, key]) => <NavLink to={to} key={to} end={to === '/'}><Icon size={20} /><span>{t(key, fallback)}</span></NavLink>)}<div className="game-nav-group"><NavLink to="/games" className="game-nav-trigger"><Gamepad2 size={20} /><span>{t('gameDexes', 'Game Dexes')}</span><ChevronRight className="game-nav-chevron" size={15} /></NavLink><div className="game-nav-submenu"><div>{games.map(game => <NavLink to={`/games/${game.id}`} key={game.id} title={game.name} style={{ '--game-color': game.color } as CSSProperties}><span className="game-nav-card"><strong>{game.name}</strong><small>{game.shortName}</small></span></NavLink>)}</div></div></div></nav><div className="sidebar-footer"><NavLink className="sidebar-backup-link" to="/backup"><DatabaseBackup size={18} /><span>{t('backup', 'Backup & restore')}</span></NavLink><div className="language-switcher" aria-label={t('language', 'Language')}><button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button><button className={language === 'pt-BR' ? 'active' : ''} onClick={() => setLanguage('pt-BR')}>PT</button></div><button className="theme" onClick={toggleDark}>{dark ? <Sun /> : <Moon />}<span>{dark ? t('lightMode', 'Light mode') : t('darkMode', 'Dark mode')}</span></button><a className="creator-credit" href="https://github.com/patrickt26" target="_blank" rel="noreferrer"><Github size={14} aria-hidden="true" /><span>{t('createdBy', 'Created by Patrick Thomaz')}</span></a></div></aside><div className="main"><header className="topbar"><HeaderStorageStatus {...auth}/><HeaderAccountButton {...auth}/></header><main><Outlet /></main><ScrollToTop /><ToastHost /><OnboardingTour /><nav className="mobile-nav">{mobileLinks.map(([to, fallback, Icon, key]) => <NavLink to={to} key={to} end={to === '/'}><Icon /><span>{t(key, fallback).split(' ')[0]}</span></NavLink>)}</nav></div></div>;
}
