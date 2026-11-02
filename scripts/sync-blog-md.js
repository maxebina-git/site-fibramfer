#!/usr/bin/env node
// Sync blog .md com tabela admin (posts)
// Regra: tabela é verdade. Se tem post -> .md existe; se tem .md sem post -> apaga.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.resolve(__dirname, '../src/content/blog');
const API_URL = 'http://localhost:4321/api/admin.php?action=list'; // porta 4321

async function main() {
  // 1. Buscar posts (API 4321 ou fallback temp/posts.json)
  let posts = [];
  try {
    const res = await fetch(API_URL);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.posts)) posts = data.posts;
    }
  } catch (e) {}
  if (posts.length === 0) {
    try {
      const file = fs.readFileSync(path.resolve(__dirname, '../tmp/posts.json'), 'utf8');
      const data = JSON.parse(file);
      posts = data.posts || [];
      console.log('Usando tmp/posts.json (fallback):', posts.length);
    } catch (e) {
      console.error('Nenhuma fonte de dados disponível (API 4321 nem tmp/posts.json).');
      process.exit(1);
    }
  } else {
    console.log('Posts da tabela (API 4321):', posts.length);
  }

  // 2. Mapear id -> post para comparação
  const tableIds = new Set(posts.map(p => String(p.id)));

  // 3. Listar .md existentes
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  console.log('.md existentes:', files.length);

  // 4. Apagar .md que não estão na tabela
  let removed = 0;
  for (const file of files) {
    const basename = file.replace(/\.md$/, '');
    if (!tableIds.has(basename)) {
      fs.unlinkSync(path.join(BLOG_DIR, file));
      console.log('REMOVIDO (não na tabela):', file);
      removed++;
    }
  }

  // 5. Criar/atualizar .md para posts na tabela (nome = post.id + .md)
  let created = 0;
  let updated = 0;
  for (const post of posts) {
    const fileName = String(post.id) + '.md';
    const filePath = path.join(BLOG_DIR, fileName);

    const frontmatter = `---
title: ${post.title || ''}
date: ${post.date || ''}
category: ${post.category || ''}
---

${post.content || ''}`;

    if (fs.existsSync(filePath)) {
      const current = fs.readFileSync(filePath, 'utf8');
      if (current.trim() !== frontmatter.trim()) {
        fs.writeFileSync(filePath, frontmatter, 'utf8');
        console.log('ATUALIZADO:', fileName);
        updated++;
      } else {
        console.log('OK (já sincronizado):', fileName);
      }
    } else {
      fs.writeFileSync(filePath, frontmatter, 'utf8');
      console.log('CRIADO:', fileName);
      created++;
    }
  }

  console.log(`\nResultado: ${created} criados | ${updated} atualizados | ${removed} removidos | ${posts.length} na tabela`);
}

main();