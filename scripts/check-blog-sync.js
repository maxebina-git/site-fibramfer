#!/usr/bin/env node
// Mostra comparação: tabela admin vs .md em /blog/
const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.resolve(__dirname, '../src/content/blog');
const API_URL = 'http://localhost:4321/api/admin.php?action=list';
const FALLBACK = path.resolve(__dirname, '../tmp/posts.json');

async function main() {
  let posts = [];
  try {
    const res = await fetch(API_URL);
    if (res.ok) {
      const d = await res.json();
      if (Array.isArray(d.posts)) posts = d.posts;
    }
  } catch (e) {}
  if (posts.length === 0 && fs.existsSync(FALLBACK)) {
    posts = JSON.parse(fs.readFileSync(FALLBACK, 'utf8')).posts || [];
  }

  const tableIds = new Set(posts.map(p => String(p.id)));
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  const mdIds = new Set(files.map(f => f.replace(/\.md$/, '')));

  console.log('=== ADMIN (tabela) ===');
  if (posts.length === 0) console.log('NENHUM (API/arquivo vazio)');
  else posts.forEach(p => console.log('  • ' + p.id + (p.title ? ' — ' + p.title : '')));

  console.log('\n=== /BLOG/ (.md) ===');
  if (files.length === 0) console.log('NENHUM');
  else files.forEach(f => console.log('  • ' + f));

  console.log('\n=== COMPARATIVO ===');
  const ok = [];
  const onlyTable = [];
  const onlyMd = [];

  for (const p of posts) {
    const id = String(p.id);
    if (mdIds.has(id)) ok.push(id);
    else onlyTable.push(id);
  }
  for (const f of files) {
    const id = f.replace(/\.md$/, '');
    if (!tableIds.has(id)) onlyMd.push(id);
  }

  ok.forEach(id => console.log('  OK    : ' + id));
  onlyTable.forEach(id => console.log('  FALTA .md : ' + id + ' (na tabela, sem arquivo)'));
  onlyMd.forEach(id => console.log('  FALTA tabela: ' + id + '.md (arquivo órfão)'));

  console.log('\nContagem: tabela=' + posts.length + ' | .md=' + files.length + ' | ok=' + ok.length + ' | falta-md=' + onlyTable.length + ' | falta-tabela=' + onlyMd.length);
}

main();
