// Phase 2 UI verification driver
// Run from project root: xvfb-run -a node driver.mjs
import * as readline from 'node:readline';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';

// playwright-core is in the project's node_modules
const require = createRequire(import.meta.url);
const { _electron: electron } = require('playwright-core');

const APP_DIR = path.dirname(new URL(import.meta.url).pathname);
const SHOT_DIR = process.env.SCREENSHOT_DIR || '/tmp/p2shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });

const electronBin = path.join(APP_DIR, 'node_modules/electron/dist/electron');

let app = null;
let page = null;

const COMMANDS = {
  async launch() {
    if (app) return console.log('already launched');
    app = await electron.launch({
      executablePath: electronBin,
      args: ['--no-sandbox', APP_DIR],
      env: { ...process.env, DISPLAY: process.env.DISPLAY || ':99' },
      timeout: 40_000,
    });
    await new Promise(r => setTimeout(r, 9_000));
    page = app.windows().find(w => !w.url().startsWith('devtools://'))
        ?? await app.firstWindow();
    console.log('launched.', app.windows().length, 'windows:');
    for (const w of app.windows()) console.log(' ', w.url());
  },

  async ss(name) {
    if (!page) return console.log('ERROR: launch first');
    const f = path.join(SHOT_DIR, (name || `ss-${Date.now()}`) + '.png');
    await page.screenshot({ path: f });
    console.log('screenshot:', f);
  },

  async click(sel) {
    if (!page) return console.log('ERROR: launch first');
    const r = await page.evaluate(s => {
      const el = document.querySelector(s);
      if (!el) return 'NOT_FOUND';
      el.click(); return 'OK';
    }, sel);
    console.log('click', sel, '->', r);
  },

  async 'click-text'(text) {
    if (!page) return console.log('ERROR: launch first');
    const r = await page.evaluate(t => {
      const els = [...document.querySelectorAll('button, a, [role="button"], [role="menuitem"]')];
      const el = els.find(e => e.textContent?.trim() === t)
              ?? els.find(e => e.textContent?.includes(t));
      if (!el) return 'NOT_FOUND';
      el.click(); return 'OK: ' + el.tagName;
    }, text);
    console.log('click-text', JSON.stringify(text), '->', r);
  },

  async mc(coords) {
    if (!page) return console.log('ERROR: launch first');
    const [x, y] = coords.split(/[,\s]+/).map(Number);
    await page.mouse.move(x, y);
    await new Promise(r => setTimeout(r, 200));
    await page.mouse.click(x, y);
    console.log('mouse click', x, y);
  },
  async hover(coords) {
    if (!page) return console.log('ERROR: launch first');
    const [x, y] = coords.split(/[,\s]+/).map(Number);
    await page.mouse.move(x, y);
    await new Promise(r => setTimeout(r, 500));
    console.log('hovered', x, y);
  },
  async type(text) { if (page) await page.keyboard.type(text, { delay: 30 }); },
  async press(key) { if (page) await page.keyboard.press(key); },

  async wait(sel) {
    if (!page) return console.log('ERROR: launch first');
    try { await page.waitForSelector(sel, { timeout: 12_000 }); console.log('found:', sel); }
    catch { console.log('TIMEOUT:', sel); }
  },

  async sleep(ms) { await new Promise(r => setTimeout(r, Number(ms) || 2000)); console.log('slept', ms || 2000); },

  async eval(expr) {
    if (!page) return console.log('ERROR: launch first');
    try { console.log(JSON.stringify(await page.evaluate(expr))); }
    catch (e) { console.log('ERROR:', e.message); }
  },

  async text(sel) {
    if (!page) return console.log('ERROR: launch first');
    console.log(await page.evaluate(
      s => (s ? document.querySelector(s) : document.body)?.innerText?.slice(0, 600) ?? '(null)',
      sel || null));
  },

  async windows() {
    if (!app) return console.log('ERROR: launch first');
    for (const w of app.windows()) console.log(' ', w.url());
  },

  async focus(sel) {
    if (!page) return console.log('ERROR: launch first');
    const r = await page.evaluate(s => {
      const el = document.querySelector(s);
      if (!el) return 'NOT_FOUND';
      el.focus(); return 'OK';
    }, sel);
    console.log('focus', sel, '->', r);
  },

  async quit() { if (app) await app.close().catch(() => {}); app = null; page = null; },
  help() { console.log('commands:', Object.keys(COMMANDS).join(', ')); },
};

const stdin = fs.createReadStream(null, { fd: fs.openSync('/dev/stdin', 'r') });
const rl = readline.createInterface({ input: stdin, output: process.stdout, prompt: 'driver> ' });

rl.on('line', async line => {
  const [cmd, ...rest] = line.trim().split(/\s+/);
  if (!cmd) return rl.prompt();
  const fn = COMMANDS[cmd];
  if (!fn) { console.log('unknown:', cmd, '- try: help'); return rl.prompt(); }
  try { await fn(rest.join(' ')); } catch (e) { console.log('ERROR:', e.message); }
  if (cmd === 'quit') { rl.close(); process.exit(0); }
  rl.prompt();
});
rl.on('close', async () => { await COMMANDS.quit(); process.exit(0); });

console.log('Mandate Creator driver - "launch" to start, "help" for commands');
rl.prompt();
