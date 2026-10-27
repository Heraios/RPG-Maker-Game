// Smoking Isle battle system tests.
//
// Copies the game to a temporary folder, serves it locally and runs every
// test in tests/cases/ in headless Chromium. The real project is never
// modified. Usage (from the repository root):
//
//   node tests/run.js              run everything
//   node tests/run.js talk magic   run only cases whose file name matches
//
// Needs Node.js and Playwright (`npm install` in tests/, or a global
// install). Set CHROMIUM_PATH to use a specific Chromium build.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

function loadPlaywright() {
    const candidates = ['playwright', '/opt/node22/lib/node_modules/playwright'];
    for (const c of candidates) {
        try { return require(c); } catch (e) { /* try the next one */ }
    }
    console.error('Playwright not found. Run `npm install` in the tests/ folder.');
    process.exit(2);
}

const ROOT = path.resolve(__dirname, '..');
const GAME = path.join(ROOT, 'Smoking Isle');

// ---------------------------------------------------------------------------
// Game copy
// ---------------------------------------------------------------------------

function prepareCopy() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'smoking-isle-test-'));
    fs.cpSync(GAME, dir, { recursive: true });
    // The tests expect a fixed setup, whatever the editor's Battle Test and starting party are set to
    // while playtesting: Battle Test fights troop 13 (the Boar-Man), and New Game starts with actors 1-4.
    const data = path.join(dir, 'data');
    const sysFile = path.join(data, 'System.json');
    const system = JSON.parse(fs.readFileSync(sysFile, 'utf8'));
    system.testTroopId = 13;
    system.partyMembers = [1, 2, 3, 4];
    fs.writeFileSync(sysFile, JSON.stringify(system));
    // Battle Test mode loads Test_*.json, which only the editor creates.
    for (const f of fs.readdirSync(data)) {
        if (f.endsWith('.json') && !f.startsWith('Test_') && !/^Map\d+\.json$/.test(f)) {
            fs.copyFileSync(path.join(data, f), path.join(data, 'Test_' + f));
        }
    }
    // The window skin is saved as window.png; the engine asks for Window.png.
    const sys = path.join(dir, 'img', 'system');
    if (!fs.existsSync(path.join(sys, 'Window.png')) && fs.existsSync(path.join(sys, 'window.png'))) {
        fs.copyFileSync(path.join(sys, 'window.png'), path.join(sys, 'Window.png'));
    }
    return dir;
}

const MIME = {
    '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png',
    '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.ttf': 'font/ttf', '.woff': 'font/woff', '.css': 'text/css'
};

function serve(dir) {
    return new Promise(resolve => {
        const server = http.createServer((req, res) => {
            const file = path.join(dir, decodeURIComponent(req.url.split('?')[0]));
            if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
                res.writeHead(404); res.end(); return;
            }
            res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
            fs.createReadStream(file).pipe(res);
        });
        server.listen(0, '127.0.0.1', () => resolve(server));
    });
}

// ---------------------------------------------------------------------------
// Test helpers handed to each case
// ---------------------------------------------------------------------------

function makeHelpers(page, base) {
    const h = {
        page,
        // Boot straight into a battle against troop `troopId` (Battle Test mode).
        async battle() {
            await page.goto(base + '/index.html?btest');
            await page.waitForFunction(() => window.SceneManager && SceneManager._scene instanceof Scene_Battle &&
                SceneManager._sceneStarted, null, { timeout: 30000 });
            await h.teachWeapons();
        },
        // Tests run with every weapon skill known (as after the Test Room's Weapon Master), and with
        // Rolling Health off so damage lands at once (tests/cases/49_battle_hud.js turns it on).
        async teachWeapons() {
            await page.evaluate(() => {
                ConfigManager.rollingHealth = false;
                if (SmokingIsle.WeaponArts) SmokingIsle.WeaponArts.teachAll();
            });
        },
        // Start a New Game (the test room) and finish its setup event.
        async newGame() {
            await page.goto(base + '/index.html');
            await page.waitForFunction(() => window.SceneManager && SceneManager._scene instanceof Scene_Title &&
                SceneManager._sceneStarted, null, { timeout: 60000 });
            await page.evaluate(() => SceneManager._scene.commandNewGame());
            await page.waitForFunction(() => SceneManager._scene instanceof Scene_Map && SceneManager._sceneStarted);
            await page.waitForTimeout(300);
            await h.pumpMessages();
            await h.teachWeapons();
        },
        // Press OK until messages and running events finish.
        async pumpMessages(max = 60) {
            for (let i = 0; i < max; i++) {
                const busy = await page.evaluate(() => $gameMessage.isBusy() || ($gameMap && $gameMap.isEventRunning()));
                if (!busy) return;
                await page.keyboard.press('Enter');
                await page.waitForTimeout(100);
            }
        },
        // Advance a battle until a party member's command menu is open.
        async toCommand(max = 120) {
            for (let i = 0; i < max; i++) {
                const state = await page.evaluate(() => !(SceneManager._scene instanceof Scene_Battle) ? 'gone' :
                    BattleManager._phase === 'battleEnd' ? 'end' :
                    SceneManager._scene._actorCommandWindow.isOpenAndActive() ? 'input' : '');
                if (state) return state;
                if (await page.evaluate(() => $gameMessage.isBusy())) await page.keyboard.press('Enter');
                await page.waitForTimeout(60);
            }
            return 'timeout';
        },
        eval: (fn, arg) => page.evaluate(fn, arg)
    };
    return h;
}

class Check {
    constructor() { this.failures = []; this.count = 0; }
    ok(cond, msg) { this.count++; if (!cond) this.failures.push(msg); }
    eq(actual, expected, msg) { this.ok(actual === expected, `${msg}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
    between(actual, lo, hi, msg) { this.ok(actual >= lo && actual <= hi, `${msg}: expected ${lo}..${hi}, got ${actual}`); }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

(async () => {
    // `node run.js --sim` runs the balance simulations in sim/ instead of the tests.
    const sim = process.argv.includes('--sim');
    const filters = process.argv.slice(2).filter(a => a !== '--sim');
    const caseDir = path.join(__dirname, sim ? 'sim' : 'cases');
    const files = fs.readdirSync(caseDir).filter(f => f.endsWith('.js'))
        .filter(f => filters.length === 0 || filters.some(x => f.includes(x))).sort();

    const dir = prepareCopy();
    const server = await serve(dir);
    const base = 'http://127.0.0.1:' + server.address().port;
    const { chromium } = loadPlaywright();
    const launch = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH }
        : (fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
    const browser = await chromium.launch(launch);

    let passed = 0, failed = 0;
    for (const file of files) {
        const cases = require(path.join(caseDir, file));
        for (const [name, fn] of Object.entries(cases)) {
            const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
            const errors = [];
            page.on('pageerror', e => errors.push(String(e)));
            const check = new Check();
            const label = `${file.replace('.js', '')} › ${name}`;
            try {
                await fn(makeHelpers(page, base), check);
            } catch (e) {
                check.failures.push('threw: ' + (e && e.message ? e.message.split('\n')[0] : e));
            }
            errors.forEach(e => check.failures.push('page error: ' + e));
            await page.close();
            if (check.failures.length === 0) {
                passed++;
                console.log(`  ok   ${label} (${check.count} checks)`);
            } else {
                failed++;
                console.log(`  FAIL ${label}`);
                check.failures.forEach(f => console.log('         ' + f));
            }
        }
    }
    await browser.close();
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
})();
