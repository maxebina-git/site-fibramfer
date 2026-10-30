const fs = require('fs');
let c = fs.readFileSync('src/pages/blog/index.astro','utf8');
const oldStr = '            cardDiv.innerHTML = \'<article class="bg-surface rounded-lg shadow-card border border-border overflow-hidden flex flex-col">\'+\n              \'<div class="p-6 flex flex-col flex-1">\'+\n              \'<h2 class="font-display text-xl font-bold text-ink mb-2"><a href="/blog/\'+pid+\'/" class="hover:underline decoration-accent-500 decoration-2 underline-offset-4">\'+(last.title||last.data?.title||\'\')+\'</a></h2>\'+';
const newStr = '            var imgHtml = (last.image||last.data?.image) ? \'<img src="\'+(last.image||last.data?.image)+\'" alt="" class="h-48 w-full object-cover bg-surface-alt">\' : \'<div class="h-48 bg-surface-alt"></div>\';\n            cardDiv.innerHTML = \'<article class="bg-surface rounded-lg shadow-card border border-border overflow-hidden flex flex-col">\'+\n              \'<div>\'+imgHtml+\'</div>\'+\n              \'<div class="p-6 flex flex-col flex-1">\'+\n              \'<h2 class="font-display text-xl font-bold text-ink mb-2"><a href="/blog/\'+pid+\'/" class="hover:underline decoration-accent-500 decoration-2 underline-offset-4">\'+(last.title||last.data?.title||\'\')+\'</a></h2>\'+';
if (c.indexOf(oldStr) === -1) { console.log('old not found'); process.exit(1); }
c = c.replace(oldStr, newStr);
fs.writeFileSync('src/pages/blog/index.astro', c);
console.log('done');
