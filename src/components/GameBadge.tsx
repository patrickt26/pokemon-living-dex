import type { Game } from '../domain/models';
export function GameBadge({game,count}:{game:Game;count?:number}){return <span className="game-badge" style={{'--badge-color':game.color} as React.CSSProperties}>{game.shortName}{count!==undefined&&` · ${count}`}</span>}
