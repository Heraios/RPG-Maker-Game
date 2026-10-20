// Meals (permanent stats), supplies, battle items, harpoons and Fishing Gear, glyph staves.

module.exports = {
    'meals raise stats for good: one per rest, a few times per food': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const IT = n => $dataItems.find(i => i && i.name === n), yoon = $gameActors.actor(2), out = {};
            const eat = (who, n) => { const x = new Game_Action(who); x.setItem(IT(n).id); if (!x.testApply(who)) return false; who.clearResult(); x.apply(who); return true; };
            const hp0 = yoon.mhp;
            out.first = eat(yoon, 'Toasted Barley'); out.gain = yoon.mhp - hp0;
            out.full = !eat(yoon, 'Grilled Meat');
            for (let i = 0; i < 4; i++) { yoon.recoverAll(); eat(yoon, 'Toasted Barley'); }
            out.capped = yoon.mhp - hp0;                         // 3 meals count, the rest only heal
            const atk0 = yoon.atk; yoon.recoverAll(); eat(yoon, 'Sooty Bird Egg'); yoon.recoverAll(); eat(yoon, 'Sooty Bird Egg');
            out.egg = yoon.atk - atk0;
            const sib = $gameActors.actor(3); const def0 = sib.def; out.stew = (eat(sib, 'Lentil Stew'), sib.def - def0);
            out.menuOnly = IT('Toasted Barley').occasion === 2;
            out.refuse = [5, 6, 4, 1].map(id => { const x = new Game_Action(yoon); x.setItem(IT('Toasted Barley').id); const who = $gameActors.actor(id); return x.testApply(who) ? 'eats' : (who.mealRefusalText && who.mealRefusal() !== null ? who.mealRefusalText() : who.tabooRefusalText(IT('Toasted Barley'))); }).join(' | ');
            const pada = $gameActors.actor(5), pdef = pada.def; { const x = new Game_Action(yoon); x.setItem(IT('Lentil Stew').id); pada.clearResult(); if (x.testApply(pada)) x.apply(pada); } out.padaStew = pada.def - pdef;
            return out;
        });
        t.ok(r.first, 'a hungry character can eat');
        t.eq(r.gain, 5, 'Toasted Barley: max HP +5 for good');
        t.ok(r.full, 'one meal per rest: a full character can\'t eat again');
        t.eq(r.capped, 15, 'each food counts up to 3 times per character (Toasted Barley: +15 HP max)');
        t.eq(r.egg, 1, 'a Sooty Bird Egg counts only once');
        t.eq(r.stew, 1, 'Lentil Stew: DEF +1');
        t.ok(r.menuOnly, 'meals are eaten outside battle');
        t.ok(/children/.test(r.refuse) && /more than I do/.test(r.refuse) && /human food/.test(r.refuse) && /\| You try to eat it, but it slips/.test(r.refuse) && !/eats/.test(r.refuse), 'Pada, Juda and the Ghost refuse meals; Lasa refuses cooked food: ' + r.refuse);
        t.eq(r.padaStew, 0, 'Pada gets nothing from the party stew');
    },

    'supplies and battle items': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const IT = n => $dataItems.find(i => i && i.name === n), ST = n => $dataStates.find(s => s && s.name === n).id, A = id => $gameActors.actor(id), out = {};
            const fixed = f => { const rnd = Math.random; Math.random = () => 0.5; try { return f(); } finally { Math.random = rnd; } };
            const use = (n, target, user) => fixed(() => { const x = new Game_Action(user || A(3)); x.setItem(IT(n).id); target.clearResult(); x.apply(target); return x; });
            const yoon = A(2);
            yoon.addState(ST('Sleep')); use('Pennyroyal Sprig', yoon); out.awake = !yoon.isStateAffected(ST('Sleep'));
            yoon.setTp(50); use('Ephedra Twigs', yoon); out.ephedra = yoon.tp;
            yoon.setMp(0); yoon.setTp(0); use('Kava', yoon); out.kava = (yoon.mp === Math.min(40, yoon.mmp) ? 'mp ok' : yoon.mp) + '/' + yoon.tp;
            yoon.setTp(100); yoon.addState(5); yoon.addState(118); use('Burnt Feather', yoon); out.roused = !yoon.isStateAffected(5) && !yoon.isStateAffected(118) && yoon.tp === 85;
            yoon.addState(1); out.noRevive = !use('Burnt Feather', yoon) || yoon.isDead(); yoon.removeState(1);
            const fresh = id => { const e = new Game_Enemy(id, 0, 0); $gameTroop._enemies.push(e); return e; };
            const hitOn = (n, id) => { const x = new Game_Action(A(3)); x.setItem(IT(n).id); return x.itemHit(fresh(id)); };
            out.stunCrab = hitOn('Spurge Fish-Stunner', 3); out.stunBoar = hitOn('Spurge Fish-Stunner', 1);
            out.saltImp = hitOn('Purifying Salt', 9); out.saltBoar = hitOn('Purifying Salt', 1);
            const boar = fresh(1), m0 = boar.talkMood(); use('Bait Pouch', boar); out.bait = boar.talkMood() - m0;
            const bm = fresh(11), b0 = bm.talkMood(); use('Bait Pouch', bm); out.baitBoarMan = bm.talkMood() - b0;
            const lasa = A(4); use('Torch', lasa, lasa); out.torch = lasa.isStateAffected(ST('Torchlight')) && lasa.talkEquipBonus('threaten', boar) === 25;
            // lead shot
            yoon.forceChangeEquip(yoon.slotOfType(6), $dataArmors.find(a => a && a.name === 'Sling')); yoon.onBattleStart();
            const sling = $dataSkills.find(s => s && s.name === 'Sling Stone'), s0 = yoon.rangedAmmoForSkill(sling);
            const shot = () => { const x = new Game_Action(yoon); x.setSkill(sling.id); yoon._siRangedSlot = -1; return x.evalDamageFormula(fresh(1)); };
            const p0 = shot(); use('Lead Shot', yoon, yoon); out.leadAmmo = yoon.rangedAmmoForSkill(sling) - s0; out.leadPower = shot() - p0;
            out.smokeOk = (() => { const x = new Game_Action(yoon); x.setItem(IT('Smoke Pot').id); const can = BattleManager._canEscape; BattleManager._canEscape = false; const no = x.testApply(yoon); BattleManager._canEscape = true; const yes = x.testApply(yoon); BattleManager._canEscape = can; return !no && yes; })();
            out.sealSkin = $dataEnemies[5].dropItems.some(d => d.kind === 1 && $dataItems[d.dataId].name === 'Seal Skin');
            return out;
        });
        t.ok(r.awake, 'Pennyroyal Sprig cures Sleep');
        t.eq(r.ephedra, 30, 'Ephedra Twigs: Fatigue -20');
        t.eq(r.kava, 'mp ok/10', 'Kava: +40 MP, Fatigue +10');
        t.ok(r.roused, 'Burnt Feather shakes off Weary and Stunned (Fatigue -15)');
        t.ok(r.noRevive, 'Burnt Feather no longer revives');
        t.ok(r.stunCrab > 0 && r.stunBoar === 0, 'the fish-stunner only works on sea creatures');
        t.ok(r.saltImp > 0 && r.saltBoar === 0, 'Purifying Salt only harms spirits');
        t.eq(r.bait, 15, 'Bait Pouch: an animal\'s mood +15');
        t.eq(r.baitBoarMan, 0, '...not a person\'s');
        t.ok(r.torch, 'Torch: Torchlight, and animals fear it (Threaten +25%)');
        t.eq(r.leadAmmo, 3, 'Lead Shot: +3 sling stones');
        t.ok(r.leadPower > 0, 'Lead Shot: harder sling shots (+' + r.leadPower + ')');
        t.ok(r.smokeOk, 'Smoke Pot only where escaping is allowed');
        t.ok(r.sealSkin, 'Monk Seals drop Seal Skin');
    },

    'harpoons, Fishing Gear, obsidian caltrops and glyph staves': async (h, t) => {
        await h.battle();
        const r = await h.eval(() => {
            const W = n => $dataWeapons.find(w => w && w.name === n), A = id => $gameActors.actor(id), S = n => $dataSkills.find(s => s && s.name === n), out = {};
            const pada = A(5); pada.forceChangeEquip(pada.slotOfType(1), W('Shark-Tooth Harpoon')); pada.onBattleStart();
            out.padaThrows = pada.rangedAmmoForSkill(S('Hurl Javelin'));
            const dama = A(7); dama.onBattleStart();
            out.dama = dama.rangedAmmoForSkill(S('Hurl Javelin')) + '/' + dama.rangedAmmoForSkill(S('Cast Net'));
            dama.useItem(S('Cast Net')); out.afterNet = dama.rangedAmmoForSkill(S('Hurl Javelin')) + '/' + dama.rangedAmmoForSkill(S('Cast Net'));
            // a chipped obsidian knife breaks into caltrops
            const yoon = A(2), knife = W('Chipped Obsidian Knife'); yoon.forceChangeEquip(yoon.slotOfType(1), knife);
            const cal = $dataItems.find(i => i && i.name === 'Stone Caltrops'); $gameParty.loseItem(cal, 99); const n0 = 0;
            out.msg = yoon.rollWear(yoon.slotOfType(1), true); out.caltrops = $gameParty.numItems(cal) - n0;
            // glyph staves
            const sib = A(3); out.sibAhi = sib.skills().some(s => s.name === 'Keri');
            sib.forceChangeEquip(sib.slotOfType(1), W('Staff of Keri')); out.staffAhi = sib.skills().some(s => s.name === 'Keri');
            out.staffWho = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter(id => A(id).canEquip(W('Staff of Mahu'))).map(id => A(id).name()).join(',');
            return out;
        });
        t.eq(r.padaThrows, 1, 'a harpoon gives anyone one javelin throw');
        t.eq(r.dama, '3/2', "Dama: harpoon throw + 2 from Fishing Gear; 1 net + 1 from her Fisher's Gear set");
        t.eq(r.afterNet, '3/1', 'casting a net leaves the javelins and the other net');
        t.eq(r.caltrops, 1, 'a broken stone weapon leaves Stone Caltrops: ' + r.msg);
        t.ok(!r.sibAhi && r.staffAhi, 'the Staff of Keri grants Keri, like the tattoo');
        t.eq(r.staffWho, 'Yoon,Sib,Juda,Tou', 'glyph staves: staff users only');
    }
};
