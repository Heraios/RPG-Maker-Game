// Act 2 enemies and prankster mechanics (SI_Pranks, <Talk Flees>).

module.exports = {
    'every Act 2 troop sets up': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const out = [];
            for (let id = 1; id <= 14; id++) { $gameTroop.setup(id); out.push($dataTroops[id].name + ':' + $gameTroop.members().map(e => e.name()).join('+')); }
            return out;
        });
        t.eq(r.length, 14, 'fourteen troops');
        t.ok(r.every(x => !/undefined|:$/.test(x)), 'all have named members: ' + r.join(' | '));
    },

    'pranksters steal to the hoard, pull clothes off, and never knock anyone out': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), AR = n => $dataArmors.find(a => a && a.name === n);
            const fixed = f => { const rnd = Math.random; Math.random = () => 0.5; try { return f(); } finally { Math.random = rnd; } };
            const out = {}, sib = A(3), yoon = A(2);   // (Lasa flies, so she'd often dodge a grab)
            sib.initEquips($dataActors[3].equips); yoon.initEquips($dataActors[2].equips);
            $gameTroop.setup(8); const [girl, boy] = $gameTroop.members();
            const use = (who, id, target) => fixed(() => { const a = new Game_Action(who); a.setSkill(id); target.clearResult(); a.apply(target); });
            out.lasaRing = sib.equips().some(e => e && e.name === 'Silver Ring');
            use(boy, 385, sib); out.noFailLine = sib.result().success;
            out.ringGone = !sib.equips().some(e => e && e.name === 'Silver Ring') && $gameParty.numItems(AR('Silver Ring')) === 0;
            out.boyFled = boy.isHidden(); out.hoard = SmokingIsle.Pranks.hoardSize();
            $gameParty.gainGold(100); const s2 = A(5); s2.initEquips([0]); use(girl, 385, s2);
            out.goldTaken = 100 - $gameParty.gold();
            out.recovered = SmokingIsle.Pranks.recoverHoard(); out.ringBack = $gameParty.numItems(AR('Silver Ring')) === 1 && $gameParty.gold() === 100;
            boy.appear(); use(boy, 384, yoon); out.stripped = !yoon.equips()[yoon.slotOfType(4)];
            yoon.onBattleEnd(); out.dressed = (yoon.equips()[yoon.slotOfType(4)] || {}).name;
            sib.setHp(1); boy.addParam(2, 200); use(boy, 372, sib); out.nonlethal = sib.hp;
            girl.appear(); girl.setHp(girl.mhp); girl.clearResult(); girl.gainHp(-999); out.ranOff = girl.isHidden() && !girl.isDead() && (girl._siPrankMessages || []).join('').includes('runs off');
            girl.appear(); girl.setHp(girl.mhp); girl._siMood = 80; out.calmActions = girl.enemy().actions.filter(a => girl.isActionValid(a)).map(a => $dataSkills[a.skillId].name).join(',');
            return out;
        });
        t.ok(r.lasaRing, 'Sib starts with a Ring (shiny)');
        t.ok(r.noFailLine, 'a successful theft shows no "no effect" line');
        t.ok(r.ringGone, 'Pilfer takes the equipped Ring');
        t.ok(r.ranOff, 'a beaten prankster runs off instead of dying');
        t.ok(r.boyFled, 'the thief runs off');
        t.eq(r.hoard, 1, 'the Ring is in the hidden hoard');
        t.between(r.goldTaken, 10, 30, 'with nothing shiny, cowries are taken');
        t.eq(r.recovered, 2, 'the hoard gives back both');
        t.ok(r.ringBack, 'Ring and cowries are back');
        t.ok(r.stripped, "Pantsing pulls Yoon's body armor off");
        t.eq(r.dressed, 'Tapa Wrap', 'it goes back on after the battle');
        t.eq(r.nonlethal, 1, 'pranksters never knock anyone out');
        t.eq(r.calmActions, '', 'a Calm prankster stops pranking (and attacking): it just waits');
    },

    'forest folk and wildlife quirks': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const A = id => $gameActors.actor(id), out = {};
            const talk = (a, skillId, e) => { const x = new Game_Action(a); x.setSkill(skillId); e.clearResult(); x.apply(e); return (e._siTalkMessages || []).join(' / '); };
            $gameTroop.setup(9); const [imp, horse] = $gameTroop.members();
            const exp = A(2).currentExp(); out.threat = talk(A(5), 166, imp); out.impFled = imp.isHidden() && A(2).currentExp() === exp;
            out.horseEva = +horse.eva.toFixed(2); horse.addState(74); out.wetEva = horse.eva; horse.clearStates();
            $gameTroop.setup(10); const bm = $gameTroop.members()[0]; const m0 = bm.talkMood();
            talk(A(2), 163, bm); out.offerBackfires = bm.talkMood() < m0;
            $gameTroop.setup(11); out.owlTou = (talk(A(9), 162, $gameTroop.members()[0]), !$gameTroop.members()[0].isAppeared());
            $gameTroop.setup(8); out.lasaKids = (talk(A(4), 162, $gameTroop.members()[0]), !$gameTroop.members()[0].isAppeared());
            $gameTroop.setup(7); const goat = $gameTroop.members()[0]; goat.setHp(5);
            out.goatFlees = goat.enemy().actions.filter(a => goat.isActionValid(a)).map(a => $dataSkills[a.skillId].name).includes('Escape');
            return out;
        });
        t.ok(r.impFled, 'Threaten makes the imp dissolve and flee, with no EXP: ' + r.threat);
        t.between(r.horseEva, 0.6, 0.7, 'the Green Horse is very evasive');
        t.eq(r.wetEva, 0, 'soaked, it loses its evasion');
        t.ok(r.offerBackfires, 'a bribe offends a Boar-Man');
        t.ok(r.owlTou, 'Owls yield to Tou');
        t.ok(r.lasaKids, 'Lasa talks the Children of the Caves down at once');
        t.ok(r.goatFlees, 'a badly hurt goat bolts');
    }
};
