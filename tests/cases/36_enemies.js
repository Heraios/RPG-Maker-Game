// The Act 2 and Act 3 enemy batch: every enemy and troop is sound; the vulture picks on the weakest;
// the Bone Chanter raises the fallen; bosses shrug off disabling states; the false crane becomes a Hag.

module.exports = {
    'Act 2 and 3 enemies and troops': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const EN = n => $dataEnemies.find(e => e && e.name === n), out = {};
            const names = ['Raven', 'Ibex', 'Mouflon Ram', 'Red Deer Stag', 'Golden Eagle', 'Bat', 'Giant Cave Cricket', 'Restless Bones', 'Bone Chanter',
                'Moray Eel', 'Octopus', 'Giant Clam', 'Daughter of the Wells', 'Great Boar', 'Shepherd of the Deer', 'Lady of the Woods', 'Parl',
                'Giant Lizard', 'Giant Tortoise', 'Egyptian Vulture', 'Guardian Lizard', 'Leech', 'Marsh Eel', 'Crane', 'Marsh Hag', 'Stoneman',
                'Stoneman Priest', 'Stoneman Shaman', 'Guardian of the Crater Lake', 'Black Hound', 'Black Hound Alpha', 'Hunched', 'Hunched Defiler',
                'The Bull of the Caves', 'Juda'];
            out.missing = names.filter(n => !EN(n)).join(', ');
            // every action is a real skill; every drop is a real thing; every troop member is a real enemy
            const news = $dataEnemies.filter(e => e && e.id >= 14 && e.name);
            out.count = news.length;
            out.badActions = news.filter(e => e.actions.some(a => !$dataSkills[a.skillId] || !$dataSkills[a.skillId].name)).map(e => e.name).join(', ');
            out.badDrops = news.filter(e => e.dropItems.some(d => d.kind && !([null, $dataItems, $dataWeapons, $dataArmors][d.kind][d.dataId] || {}).name)).map(e => e.name).join(', ');
            out.badTroops = $dataTroops.filter(tr => tr && tr.name && tr.members.some(m => !$dataEnemies[m.enemyId] || !$dataEnemies[m.enemyId].name)).map(tr => tr.name).join(', ');
            out.troops = $dataTroops.filter(tr => tr && tr.id >= 15 && tr.name).length;
            out.battlers = news.map(e => [e.name, e.battlerName]);
            // the vulture goes for the weakest
            const yoon = $gameActors.actor(2), sib = $gameActors.actor(3), pada = $gameActors.actor(5);
            $gameParty.battleMembers().forEach(a => a.recoverAll()); sib.setHp(3);
            const vulture = $gameTroop.members()[0], was = vulture.enemyId(); vulture.transform(EN('Egyptian Vulture').id);
            const rend = new Game_Action(vulture); rend.setSkill($dataSkills.find(s => s && s.name === 'Rending Beak').id);
            out.weakest = [0, 1, 2, 3, 4].map(() => rend.makeTargets()[0].name()).every(n => n === 'Sib');
            vulture.transform(was); sib.recoverAll();
            // the Bone Chanter stands a fallen skeleton back up
            const chanter = $gameTroop.members()[0], raise = new Game_Action(chanter);
            raise.setSkill($dataSkills.find(s => s && s.name === 'Raise Bones').id);
            const boneEnemy = new Game_Enemy(EN('Restless Bones').id, 0, 0);
            boneEnemy.addState(boneEnemy.deathStateId()); boneEnemy.clearResult(); raise.apply(boneEnemy);
            out.raise = boneEnemy.isAlive() && boneEnemy.hp >= Math.floor(boneEnemy.mhp / 2) && boneEnemy.hp <= Math.floor(boneEnemy.mhp / 2) + 1;
            // bosses shrug off sleep, entangling and being dragged below
            const boar = new Game_Enemy(EN('Great Boar').id, 0, 0), ST = n => SmokingIsle.Ailments.stateByName(n);
            out.boss = ['Sleep', 'Entangled', 'Dragged Below', 'Hypnotized', 'Salting'].every(n => boar.isStateResist(ST(n)));
            // the false crane is a Hag (troop event), and looks like a crane
            const tr = $dataTroops.find(x => x && x.name === 'Cranes (one false)');
            const tf = tr.pages.some(p => p.list.some(c => c.code === 336 && $dataEnemies[c.parameters[1]].name === 'Marsh Hag'));
            out.crane = tf && $dataEnemies[tr.members[2].enemyId].name === 'Crane' && $dataEnemies[tr.members[2].enemyId].battlerName === EN('Crane').battlerName;
            // the vultures and the Shepherd's stags arrive by troop event
            const appear = n => { const x = $dataTroops.find(y => y && y.name === n); return x.members.filter(m => m.hidden).length && x.pages.some(p => p.list.some(c => c.code === 335)); };
            out.appear = !!(appear('Desert: Lizards*2, Vultures*2 (late)') && appear('Boss: Shepherd of the Deer') && appear('Boss: The Bull of the Caves'));
            // Black Hounds can't be talked to; Hunched can
            out.talk = !new Game_Enemy(EN('Black Hound').id, 0, 0).talkData().type + '/' + new Game_Enemy(EN('Hunched').id, 0, 0).talkData().type;
            return out;
        });
        t.eq(r.missing, '', 'every enemy on the list exists');
        t.eq(r.count, 49 - 13, '36 new enemies');
        t.eq(r.badActions, '', 'every enemy action is a real skill');
        t.eq(r.badDrops, '', 'every drop is a real item');
        t.eq(r.badTroops, '', 'every troop member is a real enemy');
        t.eq(r.troops, 35, '35 new troops');
        const fs = require('fs'), path = require('path'), dir = path.join(__dirname, '..', '..', 'Smoking Isle', 'img', 'enemies');
        t.eq(r.battlers.filter(([, b]) => !fs.existsSync(path.join(dir, b + '.png'))).map(([n]) => n).join(', '), '', 'every enemy has a picture');
        t.ok(r.weakest, 'the vulture goes for the weakest');
        t.ok(r.raise, 'the Bone Chanter raises a fallen skeleton at half Health');
        t.ok(r.boss, 'bosses shrug off sleep, entangling, dragging below, hypnosis and salting');
        t.ok(r.crane, 'one crane is really a Marsh Hag');
        t.ok(r.appear, 'vultures, the Shepherd\'s stags and the Bull\'s hounds arrive by troop event');
        t.eq(r.talk, 'true/spirit', 'Black Hounds can\'t be talked to; the Hunched can');
    }
};
