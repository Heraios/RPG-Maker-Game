// The battle screen (SI_BattleHud: layout, damage numbers on the cards) and rolling Health (SI_RollingHealth): the layout's windows, the
// ally strip, the counter rolling down and up, a quick heal saving someone, falling at 0, the rest
// forgotten when the battle ends, and Rolling Health off.

module.exports = {
    'battle screen layout': async (h, t) => {
        await h.battle();
        t.eq(await h.toCommand(), 'input', 'reached a command menu');
        const r = await h.eval(() => {
            const s = SceneManager._scene, H = SmokingIsle.BattleHud, rects = H.rects();
            const out = {};
            out.cards = s._hudCards.filter(c => c.visible).length;
            out.statusHidden = !s._statusWindow.visible;
            out.logInBar = s._logWindow.y === rects.bar.y && s._logWindow.width === rects.bar.width;
            out.commandInColumn = s._actorCommandWindow.x >= rects.column.x;
            out.listInColumn = s._skillWindow.x >= rects.column.x && s._enemyWindow.x >= rects.column.x;
            out.prompt = s._logWindow._siPrompt;
            out.lifted = s._hudCards.filter(c => c.visible && c.y < c._baseY).map(c => c.actor().name());
            out.active = BattleManager.actor().name();
            out.alliesHidden = !s._pseudoStatusWindow.visible;
            // A hit puts its number on the card.
            const card = s._hudCards.find(c => c.visible), who = card.actor();
            who.clearResult(); who.gainHp(-3); who.startDamagePopup();
            card.update();
            // Lists show four lines at a time; the help below gets four or more
            out.listRows = s._skillWindow.maxPageRows() === 4 && s._helpWindow._siMaxLines >= 4;
            // Commands to AI allies cost half a turn
            out.commandCost = $dataSkills.filter(k => k && /<Pseudo (State|Order):/.test(k.note)).every(k => k.siTurnCost === 50);
            out.popup = card._siDamageSprites.length === 1 && card._siDamageSprites[0].children.length === 1;
            const before = s._hudCards[0].width;
            $gameParty.addActor(12);
            s.update();
            out.alliesShown = s._pseudoStatusWindow.visible;
            out.narrower = s._hudCards[0].width < before;
            // Patience plus a squad of three: four compact rows that still fit.
            [7, 8, 11].forEach(id => { $dataActors[id].note += '<Pseudo Member>'; $gameParty.addActor(id); });
            const strip = s._pseudoStatusWindow, row = strip.rowLayout();
            out.fourFit = strip.members().length === 4 && row.top + 4 * row.height <= strip.contentsHeight();
            [7, 8, 11].forEach(id => { $gameParty.removeActor(id); $dataActors[id].note = $dataActors[id].note.replace('<Pseudo Member>', ''); });
            return out;
        });
        t.eq(r.cards, 4, 'four party cards');
        t.eq(r.statusHidden, true, 'old party list hidden');
        t.eq(r.logInBar, true, 'battle text in the bar');
        t.eq(r.commandInColumn && r.listInColumn, true, 'commands and lists in the right-hand column');
        t.eq(r.prompt, r.active + '\'s move?', 'bar asks for the move');
        t.eq(r.lifted.join(), r.active, 'acting card lifts');
        t.eq(r.alliesHidden, true, 'no ally strip without allies');
        t.eq(r.popup, true, 'damage number on the card');
        t.eq(r.listRows, true, 'lists show four lines, the help has room');
        t.eq(r.commandCost, true, 'ally commands cost half a turn');
        t.eq(r.alliesShown && r.narrower, true, 'ally strip appears and the cards make room');
        t.eq(r.fourFit, true, 'four allies fit in the strip');
    },

    'rolling health': async (h, t) => {
        await h.battle();
        t.eq(await h.toCommand(), 'input', 'reached a command menu');
        const r = await h.eval(() => {
            ConfigManager.rollingHealth = true;
            const out = {}, sib = $gameActors.actor(3), pada = $gameActors.actor(5), lasa = $gameActors.actor(4);
            const roll = a => { for (let i = 0; i < 2000 && a.hpRoll(); i++) a.updateHpRoll(); };
            sib.setHp(sib.mhp);
            sib.gainHp(-10);
            out.notYet = sib.hp === sib.mhp && sib.hpTarget() === sib.mhp - 10;
            sib.updateHpRoll();
            for (let i = 0; i < 90; i++) sib.updateHpRoll();
            out.partway = sib.hp < sib.mhp && sib.hp > sib.mhp - 10;
            roll(sib);
            out.landed = sib.hp === sib.mhp - 10;
            // A mortal blow, healed in time.
            pada.setHp(5);
            pada.gainHp(-20);
            out.stillUp = pada.isAlive() && pada.hp === 5;
            pada.gainHp(30);
            roll(pada);
            out.saved = pada.isAlive() && pada.hp === 30;   // the counter can't head below 0
            // A mortal blow, not healed.
            lasa.setHp(5);
            lasa.gainHp(-20);
            let fell = false;
            for (let i = 0; i < 2000 && !fell; i++) fell = lasa.updateHpRoll();
            out.fell = fell && lasa.isDead() && lasa.hpRoll() === 0;
            // Battle over before it lands: the rest is forgotten.
            sib.setHp(sib.mhp);
            sib.gainHp(-10);
            sib.onBattleEnd();
            out.forgotten = sib.hp === sib.mhp && sib.hpRoll() === 0;
            // Enemies take damage at once.
            const boar = $gameTroop.members()[0], hp = boar.hp;
            boar.gainHp(-3);
            out.enemyAtOnce = boar.hp === hp - 3;
            // An enemy's turn: the counter waits.
            sib.setHp(sib.mhp); sib.gainHp(-10);
            const prevSubject = BattleManager._subject, prevPhase = BattleManager._phase;
            BattleManager._subject = boar; BattleManager._phase = 'action';
            out.waitsForEnemy = SmokingIsle.RollingHealth.isPaused();
            BattleManager._subject = prevSubject; BattleManager._phase = prevPhase;
            sib.clearHpRoll(); sib.setHp(sib.mhp);
            // Off: damage lands at once.
            ConfigManager.rollingHealth = false;
            sib.gainHp(-4);
            out.off = sib.hp === sib.mhp - 4;
            ConfigManager.rollingHealth = true;
            sib.setHp(sib.mhp);
            sib.gainHp(-12);
            return out;
        });
        t.eq(r.notYet, true, 'damage waits on the counter');
        t.eq(r.partway, true, 'counter rolls down bit by bit');
        t.eq(r.landed, true, 'counter lands on the damage');
        t.eq(r.stillUp, true, 'a mortal blow doesn\'t drop someone at once');
        t.eq(r.saved, true, 'healing in time saves them');
        t.eq(r.fell, true, 'falls when the counter reaches 0');
        t.eq(r.forgotten, true, 'damage still rolling is forgotten when the battle ends');
        t.eq(r.enemyAtOnce, true, 'enemies take damage at once');
        t.eq(r.off, true, 'Rolling Health off: damage at once');
        t.eq(r.waitsForEnemy, true, 'the counter waits while an enemy takes its turn');
        // It rolls on its own while a command is being chosen.
        await h.page.waitForTimeout(1000);
        const live = await h.eval(() => { const sib = $gameActors.actor(3); return { hp: sib.hp, mhp: sib.mhp }; });
        t.between(live.hp, live.mhp - 11, live.mhp - 1, 'counter rolls in real time');
    }
};
