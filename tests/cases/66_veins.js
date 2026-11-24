// Veins on walls: a gathering spot with a !Veins graphic shows its state by its row (SI_Gather).
module.exports = {
    'veins: full, chipped today, worked out': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const G = SmokingIsle.Gather, map = $gameMap.mapId();
            const ev = $gameMap.events().find(e => e.event().name === 'Gather: Obsidian');
            ev._characterName = '!Veins_Stone'; ev._characterIndex = 0;
            const dir = () => { ev.update(); return ev.direction(); };
            const out = { full: dir() };
            G.spent()[G.key(map, ev.eventId())] = SmokingIsle.Time.day(); out.chipped = dir();
            G.workedOut()[G.key(map, ev.eventId())] = true; out.worked = dir();
            const sheets = ['!Veins_Stone', '!Veins_Ore'].map(n => { const b = ImageManager.loadCharacter(n); return n; });
            return out;
        });
        t.eq(r.full + '/' + r.chipped + '/' + r.worked, '2/4/6', 'full faces down, chipped left, worked out right');
        const sizes = await h.page.evaluate(async () => {
            const load = n => new Promise(res => { const b = ImageManager.loadCharacter(n); b.addLoadListener(() => res(b.width + 'x' + b.height)); });
            return [await load('!Veins_Stone'), await load('!Veins_Ore')].join(' ');
        });
        t.eq(sizes, '576x384 576x384', 'both sheets: 8 spots of 3 x 4 frames (48 px)');
    }
};
