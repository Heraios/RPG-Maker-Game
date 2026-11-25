// The lava country's fights play its battle theme: maps 1, 2, 3 and 7 play Lava_Tube_Country (Lava_Tube_Country_Night
// at night), so SI_BattleMusic's area rule gives their fights Battle_Lava_Tube_Country, with its opening jingle.
const fs = require('fs'), path = require('path');
const D = path.join(__dirname, '../../Smoking Isle/data/');

module.exports = {
    'lava country fights play Battle_Lava_Tube_Country': async (h, t) => {
        await h.newGame();
        const maps = {};
        for (const id of [1, 2, 3, 7]) {
            const m = JSON.parse(fs.readFileSync(D + 'Map00' + id + '.json', 'utf8'));
            t.ok(m.autoplayBgm && m.bgm.name === 'Lava_Tube_Country', 'map ' + id + ' plays Lava_Tube_Country');
            maps[id] = { autoplayBgm: m.autoplayBgm, bgm: m.bgm, note: m.note };
        }
        const troops = JSON.parse(fs.readFileSync(D + 'Troops.json', 'utf8')).filter(x => x && /^Gully/.test(x.name)).map(x => x.id);
        t.ok(troops.length >= 5, 'the gully troops: ' + troops.join(' '));
        const r = await h.eval(({ maps, troops }) => {
            const keep = { a: $dataMap.autoplayBgm, b: $dataMap.bgm, n: $dataMap.note }, out = {};
            for (const id in maps) {
                Object.assign($dataMap, maps[id]);
                out[id] = troops.map(tr => { $gameTroop.setup(tr); return SmokingIsle.BattleMusic.choose(); });
                $dataMap.bgm = Object.assign({}, maps[id].bgm, { name: 'Lava_Tube_Country_Night' });
                $gameTroop.setup(troops[0]); out[id + 'n'] = SmokingIsle.BattleMusic.choose();
            }
            $dataMap.autoplayBgm = keep.a; $dataMap.bgm = keep.b; $dataMap.note = keep.n;
            return out;
        }, { maps, troops });
        for (const id of [1, 2, 3, 7]) {
            t.ok(r[id].every(x => x === 'Battle_Lava_Tube_Country'), 'map ' + id + ' fights: ' + r[id].join(', '));
            t.eq(r[id + 'n'], 'Battle_Lava_Tube_Country', 'map ' + id + ' at night too');
        }
    },
};
