const fs = require('fs');
const s = fs.readFileSync('src/components/sections/CadeiraSuspensa.astro', 'utf8');
const newS = s.replace('data-astro-id="cs1-wrap"', '');
fs.writeFileSync('src/components/sections/CadeiraSuspensa.astro', newS);
console.log('ok');
