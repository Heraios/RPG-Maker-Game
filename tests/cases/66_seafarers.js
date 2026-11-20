// The Seafarer enemies (Sailor, Axeman, Priest, Bull-Champion, Lady of the Sword, Meneswa's two phases)
// and the Marine's new moves: real stats, every move works for an enemy, child-sparing soldiers only
// demand surrender once the adults are down, and a priest left alone calls for help.

module.exports = {
    'Seafarer enemies: stats and moves': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const EN = n => $dataEnemies.find(e => e && e.name === n), out = {};
            const names = ['Seafarer Sailor', 'Seafarer Axeman', 'Seafarer Priest', 'Seafarer Bull-Champion',
                'Lady of The Sword', 'All-Seafarer Marine'];
            const meneswa = $dataEnemies.filter(e => e && e.name === 'Meneswa');
            const all = names.map(EN).concat(meneswa);
            out.missing = names.filter(n => !EN(n)).join(', ') + (meneswa.length === 2 ? '' : ' Meneswa x2');
            out.placeholder = all.filter(e => e.params.join(',') === '100,0,10,10,10,10,10,10' || e.actions.some(a => a.skillId === 1)).map(e => e.name).join(', ');
            out.badActions = all.filter(e => e.actions.some(a => !$dataSkills[a.skillId] || !$dataSkills[a.skillId].name)).map(e => e.name).join(', ');
            // MP covers the dearest spell each one knows
            out.mp = all.filter(e => e.actions.some(a => $dataSkills[a.skillId].mpCost > e.params[1])).map(e => e.name).join(', ');
            // Every move runs for an enemy, at every party member, without errors
            const party = $gameParty.battleMembers(), errors = [];
            all.forEach(data => {
                data.actions.forEach(a => {
                    const e = new Game_Enemy(data.id, 0, 0); $gameTroop._enemies.push(e);
                    try {
                        const act = new Game_Action(e); act.setSkill(a.skillId);
                        act.applyGlobal();
                        const targets = act.isForFriend() ? [e] : party;
                        targets.forEach(x => { x.clearResult(); act.apply(x); });
                    } catch (err) { errors.push(data.name + '/' + $dataSkills[a.skillId].name + ': ' + err.message); }
                    $gameTroop._enemies.pop();
                    party.forEach(x => { x.recoverAll(); });
                });
            });
            out.errors = errors.join('; ');
            // An enemy's Off-Hand Flurry seals itself until its next turn
            const lady = new Game_Enemy(EN('Lady of The Sword').id, 0, 0); $gameTroop._enemies.push(lady);
            const fl = new Game_Action(lady); fl.setSkill(98); lady.useItem($dataSkills[98]); party[0].clearResult(); fl.apply(party[0]);
            const sh = $dataStates.find(s => s && s.name === 'Following Up').id; lady.addState(sh);
            out.flurrySealed = !lady.canUse($dataSkills[98]);
            $gameTroop._enemies.pop();
            out.bullLeap = $dataSkills[361].message1;
            out.sig = $dataSkills.find(s => s && s.name === 'Every Blade in the Sea') ? 1 : 0;
            return out;
        });
        t.eq(r.missing, '', 'every Seafarer enemy exists');
        t.eq(r.placeholder, '', 'no placeholder stats or Punch-only move lists left');
        t.eq(r.badActions, '', 'every move is a real skill');
        t.eq(r.mp, '', 'each has the MP for its dearest spell');
        t.eq(r.errors, '', 'every move works when an enemy uses it');
        t.ok(r.flurrySealed, "an enemy can't chain Off-Hand Flurry");
        t.eq(r.bullLeap, ' springs into a bull-leap!', 'Bull-Leap has its own battle message');
        t.eq(r.sig, 1, "the Lady of the Sword's signature move exists");
    },

    'child-sparing soldiers demand surrender only once the adults are down': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const EN = n => $dataEnemies.find(e => e && e.name === n).id, out = {};
            const ids = ['Seafarer Sailor', 'Seafarer Axeman', 'Seafarer Priest', 'All-Seafarer Marine'].map(EN);
            const valid = e => e.enemy().actions.filter(a => e.isActionValid(a)).map(a => $dataSkills[a.skillId].name);
            const picks = e => { const seen = {}; for (let i = 0; i < 200; i++) { e.makeActions(); const a = e.action(0); if (a && a.item()) seen[a.item().name] = 1; } return Object.keys(seen); };
            const kids = $gameParty.battleMembers().filter(a => a.isChild()), adults = $gameParty.battleMembers().filter(a => !a.isChild());
            out.party = kids.length + '/' + adults.length;
            out.withAdults = ids.map(id => {
                $gameTroop._enemies = [new Game_Enemy(id, 0, 0), new Game_Enemy(id, 0, 0)];
                return picks($gameTroop._enemies[0]);
            });
            adults.forEach(a => a.addState(1));
            out.onlyKids = ids.map(id => { $gameTroop._enemies = [new Game_Enemy(id, 0, 0)]; return valid($gameTroop._enemies[0]).join(','); });
            out.champion = valid(new Game_Enemy(EN('Seafarer Bull-Champion'), 0, 0)).length;
            adults.forEach(a => a.removeState(1));
            return out;
        });
        t.ok(/^\d+\/[1-9]/.test(r.party), 'the test party has children and adults: ' + r.party);
        t.ok(r.withAdults.every(p => !p.includes('Demand Surrender') && !p.includes('Call for Help')), 'with adults standing, nobody demands surrender or calls for help: ' + JSON.stringify(r.withAdults));
        t.ok(r.onlyKids.every(v => v === 'Demand Surrender'), 'with only children left, Sailor, Axeman, Priest and Marine only demand surrender: ' + r.onlyKids.join(' | '));
        t.ok(r.champion > 0, 'the Bull-Champion spares nobody');
    },

    'Seafarer drops: no bronze, and a 10% purse per troop': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const EN = n => $dataEnemies.find(e => e && e.name === n), out = {};
            const LIST = [null, $dataItems, $dataWeapons, $dataArmors];
            const names = ['All-Seafarer Marine', 'Seafarer Sailor', 'Seafarer Axeman', 'Seafarer Priest', 'Seafarer Bull-Champion'];
            out.drops = names.map(n => EN(n).dropItems.filter(d => d.kind).map(d => LIST[d.kind][d.dataId].name).join(', '));
            out.bronze = names.filter(n => EN(n).dropItems.some(d => d.kind && /bronze/i.test(LIST[d.kind][d.dataId].name))).join(', ');
            // One roll per troop, however many soldiers carry the tag
            const purse = $dataItems.find(i => i && i.name === 'Golden Axe Money');
            const troop = n => { $gameTroop._enemies = names.slice(0, n).map(x => { const e = new Game_Enemy(EN(x).id, 0, 0); e.addState(1); return e; }); };
            const count = runs => { let c = 0; const rnd = Math.random; for (let i = 0; i < runs; i++) c += $gameTroop.makeDropItems().filter(x => x === purse).length; return c; };
            troop(5); const rnd = Math.random;
            Math.random = () => 0.05; out.lucky = count(1);
            Math.random = () => 0.5; out.unlucky = count(1);
            Math.random = rnd;
            out.rate = count(2000) / 2000;
            // Not for troops without a Seafarer
            $gameTroop._enemies = [new Game_Enemy(EN('Wild Boar').id, 0, 0)]; $gameTroop._enemies[0].addState(1);
            Math.random = () => 0.0; out.boar = $gameTroop.makeDropItems().filter(x => x === purse).length; Math.random = rnd;
            return out;
        });
        t.eq(r.drops.join(' | '), 'All-Seafarer Grog, Quilted Cap, Salt Beef | All-Seafarer Grog, Sailor\'s Cap, Lead-Weighted Net | ' +
            'Salt Beef, Cowhide, Horsehair Plume | Linen Cloth, Bull Priest\'s Robe, Bull-Horn Staff | Salt Beef, Bull-Hide Bracers, Bull-Horn Headdress',
            'the chosen drops');
        t.eq(r.bronze, '', 'no Seafarer drops bronze');
        t.eq(r.lucky, 1, 'a lucky roll gives exactly one Golden Axe Money for a five-soldier troop');
        t.eq(r.unlucky, 0, 'an unlucky roll gives none');
        t.between(r.rate, 0.06, 0.14, 'about 10% of troops (' + r.rate + ')');
        t.eq(r.boar, 0, 'troops without a Seafarer get no purse');
    },

    'a Seafarer Priest left alone calls for help': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const EN = n => $dataEnemies.find(e => e && e.name === n).id, out = {};
            const help = $dataSkills.find(s => s && s.name === 'Call for Help');
            const priest = new Game_Enemy(EN('Seafarer Priest'), 0, 0), marine = new Game_Enemy(EN('All-Seafarer Marine'), 0, 0);
            const axeman = new Game_Enemy(EN('Seafarer Axeman'), 0, 0); axeman.hide();
            const can = () => priest.isActionValid(priest.enemy().actions.find(a => a.skillId === help.id));
            $gameTroop._enemies = [priest, marine, axeman];
            out.withFriend = can();
            marine.addState(1);
            out.alone = can();
            priest.makeActions(); out.picked = priest.action(0).item().name;
            const act = new Game_Action(priest); act.setSkill(help.id); act.applyGlobal();
            out.appeared = !axeman.isHidden() && axeman.isAlive();
            out.again = can();
            axeman.addState(1);
            out.noneLeft = can();
            $gameTroop._enemies = [priest];
            out.noHidden = can();
            return out;
        });
        t.eq(r.withFriend, false, 'not while another enemy still stands');
        t.eq(r.alone, true, 'alone, with a hidden soldier in the troop, it can call');
        t.eq(r.picked, 'Call for Help', 'and it always does');
        t.ok(r.appeared, 'the hidden Axeman comes in');
        t.eq(r.again, false, "not again while the Axeman's up");
        t.eq(r.noneLeft, false, 'once per battle: nobody left to call');
        t.eq(r.noHidden, false, 'a troop with no hidden member gets no help');
    }
};
