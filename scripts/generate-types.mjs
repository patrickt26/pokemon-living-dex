import { readFileSync, writeFileSync } from 'node:fs';

const typeNames = {
  1: 'normal', 2: 'fighting', 3: 'flying', 4: 'poison', 5: 'ground', 6: 'rock',
  7: 'bug', 8: 'ghost', 9: 'steel', 10: 'fire', 11: 'water', 12: 'grass',
  13: 'electric', 14: 'psychic', 15: 'ice', 16: 'dragon', 17: 'dark', 18: 'fairy',
};
const rows = readFileSync(process.argv[2], 'utf8').trim().split('\n').slice(1);
const grouped = new Map();
const supportedFormRanges = [[10008,10012],[10061,10061],[10091,10115],[10161,10180],[10229,10244],[10250,10253]];
for (const row of rows) {
  const [pokemonId, typeId, slot] = row.trim().split(',').map(Number);
  if (pokemonId > 1025 && !supportedFormRanges.some(([start,end])=>pokemonId>=start&&pokemonId<=end)) continue;
  const type = typeNames[typeId];
  if (!type) continue;
  const types = grouped.get(pokemonId) ?? [];
  types.push({ type, slot });
  grouped.set(pokemonId, types);
}
const entries = [...grouped.entries()].map(([pokemonId, types]) => {
  const ordered = types.sort((a, b) => a.slot - b.slot).map(item => `'${item.type}'`).join(',');
  return `  ${pokemonId}: [${ordered}],`;
});
writeFileSync('src/data/generatedPokemonTypes.ts', `// Generated from PokéAPI pokemon_types.csv. Do not edit manually.\nimport type { PokemonType } from '../domain/models';\n\nexport const generatedPokemonTypes: Readonly<Record<number, readonly PokemonType[]>> = {\n${entries.join('\n')}\n};\n`);
