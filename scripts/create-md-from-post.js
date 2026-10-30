#!/usr/bin/env node
// Cria .md a partir de dados do admin (recebe via arquivo ou argumentos)
const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.resolve(__dirname, '../src/content/blog');

function create(post) {
  if (!post || !post.id) { console.error('Falta id'); process.exit(1); }
  const file = path.join(BLOG_DIR, post.id + '.md');
  const content = (post.content || '').trim();
  const data = `---\ntitle: ${post.title || ''}\ndate: ${post.date || ''}\ncategory: ${post.category || ''}\n---\n\n${content}\n`;
  fs.mkdirSync(BLOG_DIR, { recursive: true });
  fs.writeFileSync(file, data, 'utf8');
  console.log('CRIADO:', file);
}

// Se chamador passar arquivo como arg
if (process.argv[2]) {
  const input = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  create(input.post || input);
} else {
  console.log('Uso: node scripts/create-md-from-post.js <json-file>');
  console.log('Exemplo: echo \'{"id":"welcome","title":"..."}\' > tmp/post.json && node ...');
}
