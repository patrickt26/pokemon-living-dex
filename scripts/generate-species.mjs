import { readFileSync, writeFileSync } from 'node:fs';
const payload=JSON.parse(readFileSync(process.argv[2],'utf8'));
const rows=payload.results.slice(0,1025).map((item,index)=>`  [${index+1}, ${JSON.stringify(item.name.split('-').map(part=>part.charAt(0).toUpperCase()+part.slice(1)).join(' '))}],`);
writeFileSync('src/data/generatedSpecies.ts',`// Generated from PokéAPI species index. Do not edit manually.\nexport const generatedSpecies = [\n${rows.join('\n')}\n] as const;\n`);
