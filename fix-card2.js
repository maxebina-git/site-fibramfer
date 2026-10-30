const fs = require('fs');
let lines = fs.readFileSync('src/pages/blog/index.astro','utf8').split('\n');
// Inserir linha 39 (índice 38) com imgHtml
lines.splice(38, 0, "            var imgHtml = (last.image||last.data?.image) ? '<img src=\"'+(last.image||last.data?.image)+'\" alt=\"\" class=\"h-48 w-full object-cover bg-surface-alt\">' : '<div class=\"h-48 bg-surface-alt\"></div>';");
// Modificar linha 41 (após inserção) para adicionar <div>+imgHtml+</div>
// A linha original era:               '<div class="p-6 flex flex-col flex-1">'+
// Agora está no índice 40
lines[40] = lines[40].replace("'<div class=\"p-6 flex flex-col flex-1\">'+", "'<div>'+imgHtml+'</div>'+\n              '<div class=\"p-6 flex flex-col flex-1\">'+");
fs.writeFileSync('src/pages/blog/index.astro', lines.join('\n'));
console.log('done');
