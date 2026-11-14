// Graba el video de demo de SWAG HUNTERS: abre video/stage.html (marco de celular + HUD) y maneja la app
// dentro del iframe como lo haría una persona. Usa el modo demo (datos de ejemplo, sin AWS ni login).
//
//   VITE_DEMO=1 npx vite --port 5199 --strictPort        (en la carpeta del proyecto)
//   node video/record.mjs                                 (graba video/out/raw.mp4)
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { init } from './seed.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE ?? 'http://localhost:5199';
const OUT = process.env.OUT ?? path.join(HERE, 'out', 'raw.mp4');
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
// Reloj fijo: martes de re:Invent, 5:30 pm hora de Las Vegas, para que los días y las horas se vean como en el evento.
const FAKE_NOW = '2026-12-01T17:30:00-08:00';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  defaultViewport: { width: 1080, height: 1920, deviceScaleFactor: 1 },
  args: ['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
});
const page = await browser.newPage();
await page.evaluateOnNewDocument(init, FAKE_NOW);
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]); // la app sigue el tema del sistema

await page.goto(`${BASE}/video/stage.html`, { waitUntil: 'networkidle0' });
await page.evaluate(() => D.ready());
const frame = page.frames().find((f) => f !== page.mainFrame());
await frame.waitForSelector('.dcard', { timeout: 15000 });
// El celular tiene barra de estado: la app reserva ese espacio (en un teléfono real lo hace env(safe-area-inset-top)).
await frame.addStyleTag({ content: '.topbar{padding-top:46px !important} .day > .label{top:98px !important}' });
await sleep(800);
if (process.env.DEBUG) await frame.evaluate(() => { window.__ev = []; ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click'].forEach((t) => addEventListener(t, (e) => window.__ev.push(`${t}:${(e.target.className || e.target.tagName).toString().slice(0, 22)}`), true)); });

// ---------- utilidades para manejar la app como una persona ----------
let pos = { x: 540, y: 1500 };
// La posición del celular cambia mientras entra en escena, así que se mide de nuevo en cada toque.
let rect = await page.evaluate(() => D.rect());
const toStage = (p) => ({ x: rect.left + p.x * rect.scale, y: rect.top + p.y * rect.scale });

async function placeFinger(x, y, down = false) {
  await page.mouse.move(x, y);
  await page.evaluate((x, y, d) => D.finger(x, y, d), x, y, down);
  pos = { x, y };
}
async function glide(to, steps = 14, dt = 14, down = false) {
  const from = pos;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // ease in-out
    await placeFinger(from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e, down);
    await sleep(dt);
  }
}
// Centro de un elemento de la app, en coordenadas del escenario. `match` filtra por texto.
async function where(selector, { nth = 0, match = null, scrollIntoView = true } = {}) {
  rect = await page.evaluate(() => D.rect());
  const c = await frame.evaluate(({ selector, nth, match, scrollIntoView }) => {
    let els = [...document.querySelectorAll(selector)];
    if (match) els = els.filter((e) => new RegExp(match, 'i').test(e.textContent || e.getAttribute('aria-label') || ''));
    const el = els[nth];
    if (!el) return null;
    if (scrollIntoView) el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, { selector, nth, match, scrollIntoView });
  if (!c) throw new Error(`No encontré ${selector} ${match ?? ''}`);
  return toStage(c);
}
async function tap(selector, opts = {}) {
  if (opts.scrollIntoView !== false) { await where(selector, opts); await sleep(300); } // deja terminar el scroll
  const c = await where(selector, { ...opts, scrollIntoView: false });
  await glide(c, 11, 12);
  if (process.env.DEBUG) {
    const under = await frame.evaluate(({ x, y }) => { const e = document.elementFromPoint(x, y); return e ? `${e.tagName}.${(e.className || '').toString().slice(0, 30)} "${(e.textContent || '').trim().slice(0, 24)}"` : null; }, { x: (pos.x - rect.left) / rect.scale, y: (pos.y - rect.top) / rect.scale });
    console.log(`  tap ${selector} ${opts.match ?? ''} -> debajo del dedo: ${under}`);
  }
  await page.evaluate((x, y) => D.finger(x, y, 'tap'), c.x, c.y);
  ev('tap'); await page.mouse.down(); await sleep(120); await page.mouse.up();
  await page.evaluate((x, y) => D.finger(x, y, false), c.x, c.y);
  await sleep(90);
  if (process.env.DEBUG) {
    await sleep(500);
    console.log('    eventos:', (await frame.evaluate(() => window.__ev.splice(0))).join(' '));
    console.log('    estado:', JSON.stringify(await frame.evaluate(() => ({ hash: location.hash, tl: document.querySelectorAll('.tl').length, sheet: !!document.querySelector('.sheet'), toast: document.querySelector('.toast')?.textContent ?? null, y: Math.round(scrollY) }))));
  }
}
async function swipe(dir, selector = '.deck > article:last-child') {
  const c = await where(selector, { scrollIntoView: false });
  await glide({ x: c.x, y: c.y + 40 }, 12, 14);
  await page.evaluate((x, y) => D.finger(x, y, true), pos.x, pos.y);
  await page.mouse.down(); await sleep(120);
  const target = { x: pos.x + dir * 330, y: pos.y - 36 };
  await glide(target, 18, 16, true);
  ev('swipe'); await page.mouse.up();
  await page.evaluate(() => D.fingerOff());
  await sleep(380);
}
const scrollApp = (top) => frame.evaluate((top) => window.scrollTo({ top, behavior: 'smooth' }), top);
const term = (t, cls = '') => page.evaluate((t, c) => D.term(t, c), t, cls);
const cap = (i, t, s) => page.evaluate((i, t, s) => D.cap(i, t, s), i, t, s);
const bump = (k, n = 1) => { if (k === 'writes') ev('write'); return page.evaluate((k, n) => D.bump(k, n), k, n); };

// ---------- grabación ----------
mkdirSync(path.dirname(OUT), { recursive: true });
const rec = process.env.NOREC ? { stop: async () => {} } : await page.screencast({ path: OUT, format: 'mp4', fps: 30, quality: 18 });
const t0 = Date.now();
const events = [];
const ev = (n, extra = {}) => events.push({ t: +((Date.now() - t0) / 1000).toFixed(3), n, ...extra });
const typeText = async (text, delay) => { ev('type', { chars: text.length, delay }); await page.keyboard.type(text, { delay }); };
const mark = (s) => { ev('scene', { name: s }); console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s  ${s}`); };

try {
mark('intro');
await page.evaluate(() => D.intro());
await sleep(800);
ev('introOut'); await page.evaluate(() => D.introOut());
await sleep(1100);

// 01 · Descubre
mark('01 descubre');
await cap('01 / 04', 'Descubre', 'desliza como Tinder');
await term('GET /Swag  → 6 swags · 41ms', 'ok'); await bump('reads', 6);
await sleep(900);
if (!process.env.SKIPSWIPE) await swipe(1);
await term('swipe → derecha · Saved.create()', 'am'); await bump('writes');
await sleep(250);
if (!process.env.SKIPSWIPE) await swipe(-1);
await term('swipe ← izquierda · pasar');
await sleep(300);
await tap('.deck > article:last-child');   // abre el detalle de la mochila
await sleep(600);

// 02 · Confirma
mark('02 confirma');
await cap('02 / 04', 'Confirma', 'como Waze: sabes si sigue ahí');
await term('GET /Swag/s4 · estado = DISPONIBLE AHORA', 'ok'); await bump('reads', 2);
await sleep(1100);
await scrollApp(380); await sleep(950);
await tap('.btn.live');
await term('POST /SwagReport · STILL_THERE', 'am'); await bump('writes');
await sleep(800);
await scrollApp(2000); await sleep(1200);
await scrollApp(0); await sleep(550);
await tap('button', { match: '^\\s*Volver' });
await sleep(500);

// 03 · Sin duplicados
mark('03 duplicados');
await cap('03 / 04', 'Sin duplicados', 'detecta la empresa y te pregunta');
await term('alguien más encontró la misma tote bag…');
await tap('.tab.plus');
await sleep(450);
await tap('.sheet button', { match: 'Un swag que encontré' });
await sleep(500);
const fileInput = await frame.$('input[type=file]');
await fileInput.uploadFile(path.join(HERE, 'assets', 'tote.jpg'));
await frame.waitForSelector('.drop img', { timeout: 8000 }); ev('upload');
await term('foto comprimida → S3 photos/…/tote.jpg', 'am');
await sleep(850);
await tap('input[list]');
await typeText('nimbus labs inc.', 55);
await frame.waitForSelector('.suggest', { timeout: 5000 });
await term('companyKey = nimbuslabs · 2 swags ya existen', 'am'); await bump('reads', 2);
await sleep(350);
await scrollApp(260); await sleep(1700);
await tap('.suggest a.btn');            // "Es este": suma el aporte al swag existente
await sleep(700);
await term('no se duplicó: sumas tu aviso al swag existente', 'ok');
await scrollApp(900); await sleep(650);
await tap('textarea.textarea');
await typeText('La crema sigue ahí. La negra ya se acabó.', 26);
await sleep(350);
await tap('button.btn.primary', { match: 'Publicar aporte' });
await term('POST /SwagReport · TIP', 'am'); await bump('writes');
await sleep(600);
await scrollApp(3000); await sleep(1400);

// 04 · Alertas
mark('04 alertas');
await cap('04 / 04', 'Alertas', 'un correo minutos antes del concurso');
await scrollApp(0);
await tap('a.tab', { match: 'Concursos' });
await sleep(600);
await term('GET /Contest → 4 concursos · hora de Las Vegas', 'ok'); await bump('reads', 4);
await sleep(900);
await tap('.crow .icon-btn');
await sleep(650);
await tap('.sheet .pill', { match: '10 min' });
await sleep(300);
await tap('.sheet button.btn.primary');
await term('Alert.create · fireAt = startsAt − 10 min', 'am'); await bump('writes');
await sleep(1000);
ev('notif'); await page.evaluate(() => D.notif('SWAG HUNTERS', 'En 10 min: Sorteo de mochila (Helix Data)'));
await term('λ send-alerts · SES → 200 OK', 'ok');
await sleep(2800);
await page.evaluate(() => D.notifOff());
await sleep(300);

// Cierre
mark('outro');
await page.evaluate(() => D.fingerOff());
ev('outro'); await page.evaluate(() => D.outro());
await sleep(2600);

mark('fin');
  writeFileSync(path.join(HERE, 'out', 'events.json'), JSON.stringify(events, null, 1));
} catch (err) {
  await page.screenshot({ path: path.join(HERE, 'out', 'error.png') }).catch(() => {});
  const html = await frame.evaluate(() => document.body.innerText.slice(0, 400)).catch(() => '');
  console.log('ERROR:', err.message, '\nPantalla de la app:', html.replace(/\s+/g, ' '));
  await rec.stop().catch(() => {}); await browser.close(); process.exit(1);
}
await rec.stop();
await browser.close();
console.log('Listo:', OUT);
