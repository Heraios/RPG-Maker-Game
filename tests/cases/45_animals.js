// The animal batch (coast, sea, forest, marsh, highlands, tubes, alpine): every enemy, skill, drop and troop is
// sound; jellyfish sting whoever hits them; a lit Torch drives the bees off; hurting the aurochs calf brings
// the bull; the water snake and the hare flee a threat.

module.exports = {
    'animal enemies and troops': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const EN = n => $dataEnemies.find(e => e && e.name === n), out = {};
            const names = ['Shearwater', 'Gannet', 'Shore Crab', 'Spider Crab', 'Jellyfish', 'Killer Fish', 'Swordfish', 'Shark',
                'Laurel Pigeon', 'Wild Bees', 'Barn Owl', 'Marsh Frog', 'Water Snake', 'Heron', 'Aurochs Calf', 'Aurochs',
                'Ridden Aurochs', 'Rock Lizard', 'Desert Scorpion', 'Hawk', 'Cave Spider', 'Snow-line Hare'];
            out.missing = names.filter(n => !EN(n)).join(', ');
            const news = names.map(EN).filter(Boolean);
            out.badActions = news.filter(e => e.actions.some(a => !$dataSkills[a.skillId] || !$dataSkills[a.skillId].name)).map(e => e.name).join(', ');
            out.badDrops = news.filter(e => e.dropItems.some(d => d.kind && !([null, $dataItems, $dataWeapons, $dataArmors][d.kind][d.dataId] || {}).name)).map(e => e.name).join(', ');
            const troops = $dataTroops.filter(tr => tr && tr.id >= 51 && tr.name);
            out.troops = troops.length;
            out.badTroops = troops.filter(tr => tr.members.some(m => !$dataEnemies[m.enemyId] || !$dataEnemies[m.enemyId].name)).map(tr => tr.name).join(', ');
            out.battlers = news.map(e => [e.name, e.battlerName]);
            const ST = n => SmokingIsle.Ailments.stateByName(n);
            const yoon = $gameActors.actor(2), sib = $gameActors.actor(3);
            $gameParty.battleMembers().forEach(a => a.recoverAll());
            // jellyfish sting whoever hits them with a weapon
            const rnd = Math.random, eva = Game_Action.prototype.itemEva; Math.random = () => 0; Game_Action.prototype.itemEva = () => 0;
            const jelly = new Game_Enemy(EN('Jellyfish').id, 0, 0);
            const hit = new Game_Action(sib); hit.setAttack(); jelly.clearResult(); hit.apply(jelly);
            out.stung = sib.isStateAffected(ST('Venom'));
            sib.removeState(ST('Venom'));
            const crab = new Game_Enemy(EN('Shore Crab').id, 0, 0); crab.clearResult(); hit.apply(crab);
            out.crabStings = sib.isStateAffected(ST('Venom'));
            Math.random = rnd; Game_Action.prototype.itemEva = eva;
            // a lit Torch drives the bees off
            const runPage = (troopName, setupFn, pageIdx) => {
                const tr = $dataTroops.find(x => x && x.name === troopName);
                $gameTroop.setup(tr.id); if (setupFn) setupFn();
                const i = new Game_Interpreter(); i.setup(tr.pages[pageIdx].list);
                for (let n = 0; n < 200 && i.isRunning(); n++) { $gameMessage.clear(); i.update(); }
                return $gameTroop.aliveMembers().length;
            };
            out.beesStay = runPage('Wild Bees*2 (a Torch drives them off)', null, 1);
            out.beesFlee = runPage('Wild Bees*2 (a Torch drives them off)', () => sib.addState(ST('Torchlight')), 1);
            sib.removeState(ST('Torchlight'));
            // hurting the calf brings the herd bull
            const calfTr = $dataTroops.find(x => x && x.name === 'Aurochs Calf (the bull comes)');
            out.calf = calfTr.members[1].hidden && $dataEnemies[calfTr.members[1].enemyId].name === 'Aurochs' &&
                calfTr.pages[1].conditions.enemyValid && calfTr.pages[1].list.some(c => c.code === 335 && c.parameters[0] === 1);
            // the spider crab calls more crabs
            const sc = $dataTroops.find(x => x && x.name.startsWith('Spider Crab'));
            out.crabs = sc.members.filter(m => m.hidden).length === 2 && sc.pages[1].list.filter(c => c.code === 335).length === 2;
            // the water snake and the hare flee a threat; bees can't be talked to
            out.flee = ['Water Snake', 'Snow-line Hare'].every(n => new Game_Enemy(EN(n).id, 0, 0).talkData().flees.indexOf('threaten') >= 0);
            out.beeTalk = !new Game_Enemy(EN('Wild Bees').id, 0, 0).talkData().type;
            // the Ridden Aurochs is undead-ish: shrugs off Venom and Bleed
            const ridden = new Game_Enemy(EN('Ridden Aurochs').id, 0, 0);
            out.ridden = ridden.isStateResist(ST('Venom')) && ridden.isStateResist(ST('Bleed'));
            return out;
        });
        t.eq(r.missing, '', 'every animal on the list exists');
        t.eq(r.badActions, '', 'every action is a real skill');
        t.eq(r.badDrops, '', 'every drop is a real item');
        t.eq(r.troops, 24, '24 new troops');
        t.eq(r.badTroops, '', 'every troop member is a real enemy');
        const fs = require('fs'), path = require('path'), dir = path.join(__dirname, '..', '..', 'Smoking Isle', 'img', 'enemies');
        t.eq(r.battlers.filter(([, b]) => !fs.existsSync(path.join(dir, b + '.png'))).map(([n]) => n).join(', '), '', 'every animal has a picture');
        t.ok(r.stung, 'hitting a jellyfish stings you (Venom)');
        t.ok(!r.crabStings, 'hitting a crab doesn\'t');
        t.eq(r.beesStay, 2, 'without a Torch the bees stay');
        t.eq(r.beesFlee, 0, 'with a Torch lit the bees scatter');
        t.ok(r.calf, 'hurting the calf brings the herd bull');
        t.ok(r.crabs, 'the Spider Crab calls two more crabs');
        t.ok(r.flee, 'the water snake and the hare flee a threat');
        t.ok(r.beeTalk, 'bees can\'t be talked to');
        t.ok(r.ridden, 'the Ridden Aurochs shrugs off Venom and Bleed');
    },
};
