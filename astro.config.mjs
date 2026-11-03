import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const blogDir = path.resolve('src/content/blog');
const uploadsDir = path.resolve('public/uploads');

const EXT_BY_MIME = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
};

// O admin envia a imagem como data URL (base64). Em vez de gravar esse blob
// gigante no frontmatter, salva o arquivo em public/uploads e usa o caminho.
function persistImage(post) {
  const img = post && post.image;
  if (typeof img !== 'string' || !img.startsWith('data:image/')) return post;
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/s.exec(img);
  if (!match) return post;
  const ext = EXT_BY_MIME[match[1]] || 'png';
  const buf = Buffer.from(match[2], 'base64');
  const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 16);
  const name = `${hash}.${ext}`;
  const file = path.join(uploadsDir, name);
  fs.mkdirSync(uploadsDir, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, buf);
  return { ...post, image: `/uploads/${name}` };
}

// Evita que a gravação de .md feita pelo próprio admin dispare um full-reload
// do Astro (que recarregaria a página inteira e faria a tabela "piscar").
// A janela cobre o tempo entre a escrita e o watcher de conteúdo do Astro.
const RELOAD_SUPPRESS_MS = 5000;
let lastSyncAt = 0;
const markSync = () => { lastSyncAt = Date.now(); };
const isSyncWindow = () => Date.now() - lastSyncAt < RELOAD_SUPPRESS_MS;

function renderMarkdown(post) {
  const lines = ['---'];
  lines.push(`title: ${JSON.stringify(post.title || '')}`);
  lines.push(`date: ${post.date || new Date().toISOString().slice(0, 10)}`);
  lines.push(`category: ${JSON.stringify(post.category || '')}`);
  if (post.image) lines.push(`image: ${JSON.stringify(post.image)}`);
  if (post.description) lines.push(`description: ${JSON.stringify(post.description)}`);
  if (post.author) lines.push(`author: ${JSON.stringify(post.author)}`);
  lines.push('---', '', post.content || '', '');
  return lines.join('\n');
}

function blogSyncDevPlugin() {
  return {
    name: 'blog-sync-dev',
    apply: 'serve',
    configureServer(server) {
      const suppress = (hot) => {
        if (!hot || hot.__blogSyncPatched) return;
        const originalSend = hot.send.bind(hot);
        hot.send = (payload, ...rest) => {
          if (payload && payload.type === 'full-reload' && isSyncWindow()) {
            return;
          }
          return originalSend(payload, ...rest);
        };
        hot.__blogSyncPatched = true;
      };
      suppress(server.ws);
      suppress(server.environments && server.environments.client && server.environments.client.hot);

      server.middlewares.use('/api/blog-sync', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        let raw = '';
        req.on('data', (chunk) => { raw += chunk; });
        req.on('end', () => {
          try {
            const body = raw ? JSON.parse(raw) : {};
            fs.mkdirSync(blogDir, { recursive: true });

            const writePost = (rawPost) => {
              if (!rawPost || !rawPost.id) return null;
              const post = persistImage(rawPost);
              const file = path.join(blogDir, post.id + '.md');
              const md = renderMarkdown(post);
              const unchanged = fs.existsSync(file) && fs.readFileSync(file, 'utf8') === md;
              if (!unchanged) {
                markSync();
                fs.writeFileSync(file, md, 'utf8');
              }
              return { post, changed: !unchanged };
            };

            if (Array.isArray(body.posts)) {
              let written = 0;
              for (const p of body.posts) {
                try { const r = writePost(p); if (r && r.changed) written += 1; } catch { /* ignora post inválido */ }
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, count: body.posts.length, written }));
              return;
            }

            const post = body.post || body;

            if (post.id && (post.delete || (!post.title && !post.date && !post.content))) {
              const file = path.join(blogDir, post.id + '.md');
              if (fs.existsSync(file)) { markSync(); fs.unlinkSync(file); }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, deleted: post.id }));
              return;
            }

            if (!post.id) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'id obrigatório' }));
              return;
            }

            const result = writePost(post);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, id: post.id, unchanged: !result.changed, image: result.post.image }));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e.message || String(e) }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  base: import.meta.env.PROD ? '/site-novo/' : '/',
  integrations: [
    vue()
  ],
  vite: {
    resolve: {
      dedupe: ['vue']
    },
    plugins: [
      tailwindcss(),
      blogSyncDevPlugin()
    ]
  }
});
