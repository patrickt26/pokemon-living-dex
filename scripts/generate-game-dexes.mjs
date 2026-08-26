import { writeFileSync } from 'node:fs';

const dexes = [
  ['bdspSinnoh', 'original-sinnoh'],
  ['galar', 'galar'],
  ['isleOfArmor', 'isle-of-armor'],
  ['crownTundra', 'crown-tundra'],
  ['hisui', 'hisui'],
  ['paldea', 'paldea'],
  ['kitakami', 'kitakami'],
  ['blueberry', 'blueberry'],
  ['frlgKanto', 'kanto'],
  ['lumiose', 'lumiose-city'],
  ['hyperspace', 'hyperspace'],
];
const speciesNumber = (url) => Number(new URL(url).pathname.split('/').filter(Boolean).at(-1));
const entries = await Promise.all(dexes.map(async ([key, resource]) => {
  const response = await fetch(`https://pokeapi.co/api/v2/pokedex/${resource}`);
  if (!response.ok) throw new Error(`Failed to fetch ${resource}: ${response.status}`);
  const payload = await response.json();
  return [key, payload.pokemon_entries.sort((a, b) => a.entry_number - b.entry_number).map(entry => speciesNumber(entry.pokemon_species.url))];
}));
const rows = entries.map(([key, numbers]) => `  ${key}: [${numbers.join(',')}],`).join('\n');
writeFileSync('src/data/generatedGameDexes.ts', `// Generated from PokéAPI Pokédex resources. Do not edit manually.\nexport const generatedGameDexes = {\n${rows}\n} as const;\n`);
