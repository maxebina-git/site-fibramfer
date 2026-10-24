// Node >=22 + Chrome/Chromium local. Não instala pacotes nem baixa navegadores.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { mkdtemp, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');

const base = process.env.BASE_URL || 'http://localhost:4334';
const chrome = process.env.CHROME_PATH;
const selector = '[data-hero-curve-slider]';
let browser, socket, profile, session;
let sequence = 0;
const pending = new Map();
const eventWaiters = new Map();
const errors = [];
const failedResponses = [];

function send(method, params = {}, sessionId = session) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timeout: ${method}`));
    }, 15000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
  return result.result.value;
}

async function load(method, params = {}) {
  const loaded = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      eventWaiters.delete('Page.loadEventFired');
      reject(new Error('Timeout: carregamento da página'));
    }, 20000);
    eventWaiters.set('Page.loadEventFired', () => { clearTimeout(timeout); resolve(); });
  });
  await send(method, params);
  await loaded;
}

async function until(expression, label) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await evaluate(expression)) return;
    await delay(100);
  }
  throw new Error(`Timeout: ${label}`);
}

async function ready(count = 1) {
  await until(`document.querySelectorAll('${selector}').length === ${count} &&
    [...document.querySelectorAll('${selector}')].every(r =>
      r.dataset.curveReady === 'true' && !r.closest('astro-island[ssr]'))`, 'sliders hidratados');
}

async function navigate(href) {
  const clicked = await evaluate(`(() => {
    const link = [...document.querySelectorAll('a[href]')].find(a => a.getAttribute('href') === ${JSON.stringify(href)});
    if (!link) return false;
    link.click(); return true;
  })()`);
  assert.ok(clicked, `Link não encontrado: ${href}`);
  await until(`location.pathname.split('/').filter(Boolean).join('/') === ${JSON.stringify(href.split('/').filter(Boolean).join('/'))}`, href);
}

async function assertRotates(label, count = 1) {
  await ready(count);
  const samples = await evaluate(`new Promise(resolve => {
    const result = Array.from({length:${count}}, () => ({visible:[], morphs:0, lastPath:''}));
    const started = performance.now();
    const poll = setInterval(() => {
      document.querySelectorAll('${selector}').forEach((root, index) => {
        const state = result[index]; if (!state) return;
        const slides = [...root.querySelectorAll('[data-curve-slide]')];
        const current = slides.findIndex(s => s.classList.contains('is-visible'));
        if (state.visible.at(-1) !== current) state.visible.push(current);
        const incoming = root.querySelector('.is-animating [data-curve-path]');
        if (incoming && incoming.getAttribute('d') !== state.lastPath) {
          state.lastPath = incoming.getAttribute('d'); state.morphs++;
        }
      });
      if (performance.now() - started > 7600) { clearInterval(poll); resolve(result); }
    }, 50);
  })`);
  samples.forEach((sample, index) => {
    assert.ok(sample.visible.length >= 3, `${label} slider ${index}: não completou duas trocas: ${JSON.stringify(sample)}`);
    assert.ok(!sample.visible.includes(-1), `${label}: nenhum slide visível`);
    assert.ok(sample.morphs >= 4, `${label}: máscara SVG não animou`);
  });
  console.log(`PASS ${label}: ${samples.map(s => s.visible.join(' -> ')).join(' | ')}`);
}

async function launch() {
  assert.ok(chrome, 'Defina CHROME_PATH com o executável local do Chrome/Chromium.');
  profile = await mkdtemp(join(tmpdir(), 'fibramfer-slider-'));
  browser = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
  ], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  const endpoint = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Chrome não iniciou')), 15000);
    browser.once('error', error => { clearTimeout(timeout); reject(error); });
    browser.stderr.on('data', chunk => {
      const match = chunk.toString().match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) { clearTimeout(timeout); resolve(match[1]); }
    });
  });
  socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (pending.has(message.id)) {
      const item = pending.get(message.id);
      pending.delete(message.id); clearTimeout(item.timeout);
      if (message.error) item.reject(new Error(JSON.stringify(message.error)));
      else item.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') {
      errors.push(message.params.exceptionDetails);
    } else if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) {
      failedResponses.push({ url: message.params.response.url, status: message.params.response.status });
    }
    if (eventWaiters.has(message.method)) {
      eventWaiters.get(message.method)();
      eventWaiters.delete(message.method);
    }
  });
  const target = await send('Target.createTarget', { url: 'about:blank' });
  session = (await send('Target.attachToTarget', { targetId: target.targetId, flatten: true })).sessionId;
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Network.setBlockedURLs', { urls: ['*://fonts.googleapis.com/*', '*://fonts.gstatic.com/*'] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
}

async function main() {
  await launch();
  await load('Page.navigate', { url: `${base}/a-fibramfer/` });
  await assertRotates('acesso direto');
  for (const ignoreCache of [false, true]) {
    await load('Page.reload', { ignoreCache });
    await assertRotates(ignoreCache ? 'reload sem cache' : 'reload com cache (F5/Ctrl+R)');
  }

  // Reproduz a cópia de innerHTML/cloneNode com a marca ready e sem o timer.
  await until(`document.querySelector('${selector} .is-animating') !== null`, 'transição em andamento');
  await evaluate(`(() => {
    window.__oldSlider = document.querySelector('${selector}');
    window.__oldSlider.replaceWith(window.__oldSlider.cloneNode(true));
  })()`);
  await assertRotates('DOM clonado durante o morph, com ready copiado');
  assert.ok(await evaluate(`!window.__oldSlider.isConnected && !window.__oldSlider.hasAttribute('data-curve-ready')`), 'Instância removida não foi limpa');

  // Nenhum hover, gesto ou tecla deve comandar esse slideshow automático.
  await load('Page.reload');
  await ready();
  await evaluate(`(() => {
    const root = document.querySelector('${selector}');
    root.dispatchEvent(new MouseEvent('mouseenter'));
    document.dispatchEvent(new KeyboardEvent('keyup', {key:'ArrowRight'}));
    root.dispatchEvent(new PointerEvent('pointerdown', {pointerId:1,clientX:200}));
    root.dispatchEvent(new PointerEvent('pointerup', {pointerId:1,clientX:50}));
  })()`);
  await delay(800);
  assert.equal(await evaluate(`document.querySelector('${selector} [data-curve-slide]').classList.contains('is-visible')`), true, 'Interação manual mudou o slide');
  await assertRotates('autoplay sem pausa no hover e sem navegação manual');

  await navigate('/');
  await until(`!document.querySelector('${selector}')`, 'drawer fechado');
  await navigate('/a-fibramfer');
  await assertRotates('home -> A Fibramfer via SPA');
  await evaluate(`window.__oldSlider = document.querySelector('${selector}')`);
  await navigate('/cadeira-suspensa');
  await assertRotates('três sliders da Cadeira Suspensa', 3);
  assert.ok(await evaluate(`!window.__oldSlider.isConnected && !window.__oldSlider.hasAttribute('data-curve-ready')`), 'Timer da rota anterior não foi limpo');
  await navigate('/a-fibramfer');
  await assertRotates('retorno de outra rota');

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await load('Page.reload');
  await assertRotates('reload em viewport mobile');

  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await load('Page.reload');
  await ready();
  const firstSlide = `[...document.querySelectorAll('${selector} [data-curve-slide]')].findIndex(s => s.classList.contains('is-visible'))`;
  const before = await evaluate(firstSlide);
  await delay(3800);
  assert.equal(await evaluate(firstSlide), before, 'Movimento reduzido não respeitado');
  console.log('PASS movimento reduzido: sem autoplay');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await assertRotates('retomada ao desativar movimento reduzido');
  assert.deepEqual(errors, [], 'Exceções JavaScript no navegador');
  assert.deepEqual(failedResponses, [], 'Falhas HTTP');
  console.log('PASS sem exceções JavaScript');
}

main().catch(async error => {
  console.error(error);
  console.error('Browser errors:', JSON.stringify({ errors, failedResponses }));
  if (session && socket?.readyState === WebSocket.OPEN) {
    console.error('DOM:', await evaluate(`({url:location.href,hidden:document.hidden,
      roots:[...document.querySelectorAll('${selector}')].map(r => ({ready:r.dataset.curveReady,ssr:!!r.closest('astro-island[ssr]')}))})`).catch(() => null));
  }
  process.exitCode = 1;
}).finally(async () => {
  if (socket?.readyState === WebSocket.OPEN) {
    await send('Browser.close', {}, null).catch(() => {});
    socket.close();
  }
  if (browser && browser.exitCode === null) {
    const stopped = new Promise(resolve => browser.once('exit', resolve));
    browser.kill();
    await Promise.race([stopped, delay(3000)]);
  }
  if (profile) await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
});
