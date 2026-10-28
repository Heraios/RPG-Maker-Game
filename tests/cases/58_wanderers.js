// Wandering enemies (SI_Wanderers): sight cone, chase and leash, running from a far stronger party,
// contact battles (from behind = first strike), gone for the day after a win or an escape.

module.exports = {
    'wandering enemies': async (h, t) => {
        await h.newGame();
        const r = await h.eval(() => {
            const out = {}, W = SmokingIsle.Wanderers;
            if (!$gameMap.events().some(e => e.event().name === 'Wanderer: Wild Boars')) { out.parsed = false; return out; }
            const boar = $gameMap.events().find(e => e.event().name === 'Wanderer: Wild Boars');
            const crab = $gameMap.events().find(e => e.event().name.indexOf('Shore Crabs') >= 0);
            out.parsed = !!boar.wanderer() && boar.wanderer().troopId === 1 && crab.wanderer().nerve === 2;
            // sight: a cone in front, not behind
            boar.locate(8, 11); boar.setDirection(8);
            $gamePlayer.locate(8, 8); out.seesAhead = boar.canSeeParty();
            $gamePlayer.locate(9, 9); out.seesDiagonal = boar.canSeeParty();
            $gamePlayer.locate(8, 12); out.seesBehind = boar.canSeeParty();
            $gamePlayer.locate(8, 4); out.seesFar = boar.canSeeParty();
            // weak: a mighty party makes them run; a weak party doesn't
            const party = $gameParty.battleMembers();
            const atk = party.map(a => a._paramPlus[2]);
            party.forEach(a => { a._paramPlus[2] += 500; a._paramPlus[0] += 500; a.recoverAll(); });
            out.weakWhenStrong = W.isWeak(1, 1);
            out.boldNeedsMore = W.isWeak(1, 0.5) === W.isWeak(1, 1) || !W.isWeak(1, 0.5);
            party.forEach((a, i) => { a._paramPlus[2] = atk[i]; a._paramPlus[0] -= 500; a.recoverAll(); });
            out.notWeakNormally = !W.isWeak(44, 1);   // Black Hounds
            // mode: sees the party -> chase (or flee if weak)
            boar._siMode = 'wander'; boar._siGrace = 0; $gamePlayer.locate(8, 9); boar.updateWanderMode();
            out.chase = boar._siMode;
            boar.locate(14 - 9, 11); boar.updateWanderMode(); out.leash = boar._siMode;   // 9 tiles from home: gives up
            // contact from behind: the party strikes first
            boar.locate(8, 11); boar.setDirection(8); boar._siMode = 'wander'; boar._siGrace = 0;
            $gamePlayer.locate(8, 12); $gamePlayer.setDirection(8);
            $gamePlayer.moveStraight(8);
            out.battle = SceneManager._nextScene instanceof Scene_Battle && W._lastBattle && W._lastBattle.troopId === 1;
            out.preemptive = W._lastBattle && W._lastBattle.preemptive;
            SceneManager._nextScene = null;
            // it walks into the party from behind: it strikes first
            W._lastBattle = null; boar.locate(8, 10); boar.setDirection(2);
            $gamePlayer.locate(8, 11); $gamePlayer.setDirection(2);
            boar.moveStraight(2);
            out.surprise = W._lastBattle && W._lastBattle.surprise;
            SceneManager._nextScene = null;
            // won: gone for today, back tomorrow
            BattleManager._eventCallback(0);
            boar.update(); out.goneToday = boar.isWanderAway() && boar.isTransparent();
            SmokingIsle.Time.state().day += 1; boar.update(); out.backTomorrow = !boar.isWanderAway() && !boar.isTransparent();
            // escaped: stays, leaves the party alone a moment
            W.onBattleEnd(boar, 1); out.grace = boar._siGrace > 0 && !boar.isWanderAway();
            // a fleeing crab that gets away is gone for the day
            crab._siMode = 'flee'; crab.locate(2, 11); $gamePlayer.locate(14, 0); crab.updateWanderMode();
            out.fled = crab.isWanderAway();
            return out;
        });
        t.eq(r.parsed, true, 'note tags read');
        t.eq([r.seesAhead, r.seesDiagonal, r.seesBehind, r.seesFar].join(), 'true,true,false,false', 'sight: a cone in front, within range');
        t.eq(r.weakWhenStrong, true, 'a far stronger party makes a troop weak');
        t.eq(r.boldNeedsMore, true, 'bold enemies need a stronger party still');
        t.eq(r.notWeakNormally, true, 'Black Hounds are no pushover for the starting party');
        t.eq(r.chase, 'chase', 'spotting the party: chase');
        t.eq(r.leash, 'return', 'too far from home: gives up');
        t.eq(r.battle, true, 'touching it starts its battle');
        t.eq(r.preemptive, true, 'touched from behind: the party strikes first');
        t.eq(r.surprise, true, 'it touches the party from behind: it strikes first');
        t.eq(r.goneToday, true, 'beaten: gone for the day');
        t.eq(r.backTomorrow, true, 'back the next day');
        t.eq(r.grace, true, 'escaped from: it stays, and leaves the party alone a moment');
        t.eq(r.fled, true, 'a fleeing enemy that gets away is gone for the day');
    }
};
