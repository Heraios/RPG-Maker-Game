// Veins on walls: a gathering spot with a !Veins graphic shows its state by its row (SI_Gather).
module.exports = {
    'veins: full, chipped today, worked out': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const G = SmokingIsle.Gather, map = $gameMap.mapId();
            const ev = $gameMap.events().find(e => e.event().name === 'Gather: Obsidian');
            ev._characterName = '!Veins_Stone_Lava'; ev._characterIndex = 0;
            const dir = () => { ev.update(); return ev.direction(); };
            const out = { full: dir() };
            G.spent()[G.key(map, ev.eventId())] = SmokingIsle.Time.day(); out.chipped = dir();
            G.workedOut()[G.key(map, ev.eventId())] = true; out.worked = dir();
            return out;
        });
        t.eq(r.full + '/' + r.chipped + '/' + r.worked, '2/4/6', 'full faces down, chipped left, worked out right');
        const sizes = await h.page.evaluate(async () => {
            const load = n => new Promise(res => { const b = ImageManager.loadCharacter(n); b.addLoadListener(() => res(b.width + 'x' + b.height)); });
            const sets = ['Exterior', 'Interior', 'Lava', 'Tubes'], out = [];
            for (const v of sets) for (const k of ['Stone', 'Ore']) out.push(await load('!Veins_' + k + '_' + v));
            return [...new Set(out)].join(' ') + ' x' + out.length;
        });
        t.eq(sizes, '576x384 x8', 'eight sheets (Stone and Ore for each of the four tilesets): 8 spots of 3 x 4 frames (48 px)');
    }
};
