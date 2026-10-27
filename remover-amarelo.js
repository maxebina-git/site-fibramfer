const fs = require('fs');
let s = fs.readFileSync('src/components/sections/CadeiraSuspensa.astro', 'utf8');
let lines = s.split('\n');
let idx = lines.findIndex(l => l.includes('cs1-yellow'));
if (idx >= 0) lines.splice(idx, 1);
fs.writeFileSync('src/components/sections/CadeiraSuspensa.astro', lines.join('\n'));
console.log('removido');
