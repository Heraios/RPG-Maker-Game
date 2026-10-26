// A playthrough of the test room: title, menus, save/load, every event and its battle.
// Fails on any error MV shows on screen, or runaway memory.
module.exports = {
  'title, menus, save/load and every test room event without errors': async (h, t) => {
    const logs = [];
    h.page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
    const status = async label => {
      const s = await h.eval(() => ({ scene: SceneManager._scene && SceneManager._scene.constructor.name,
        err: (Graphics._errorPrinter && Graphics._errorPrinter.innerText) || '',
        mem: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : -1 }));
      t.eq(s.err, '', label + ': no error on screen');
      if (s.mem >= 0) t.ok(s.mem < 300, label + ': memory ' + s.mem + 'MB');
      return s;
    };
    await h.newGame(); await h.page.goto(h.page.url().replace(/\?.*$/, '').replace(/[^/]*$/, '') + 'index.html?test');
    await h.page.waitForFunction(() => window.SceneManager && SceneManager._scene instanceof Scene_Title && SceneManager._sceneStarted, null, { timeout: 30000 });
    await status('title');
    await h.eval(() => SceneManager._scene.commandNewGame());
    await h.page.waitForFunction(() => SceneManager._scene instanceof Scene_Map && SceneManager._sceneStarted);
    await h.pumpMessages(); await status('map');
    for (const cls of ['Scene_Menu', 'Scene_Item', 'Scene_Skill', 'Scene_Equip', 'Scene_Status', 'Scene_Options', 'Scene_Save']) {
      for (const id of [1, 2, 3, 4, 5, 12]) {
        await h.eval(([c, id]) => { if ($gameActors.actor(id)) $gameParty.setMenuActor($gameActors.actor(id)); SceneManager.push(window[c]); }, [cls, id]);
        await h.page.waitForTimeout(250);
        await h.eval(() => SceneManager.pop()); await h.page.waitForTimeout(150);
        if (cls !== 'Scene_Skill' && cls !== 'Scene_Equip' && cls !== 'Scene_Status') break;
      }
      await status(cls);
    }
    await h.eval(() => { $gameSystem.onBeforeSave(); DataManager.saveGame(1); });
    await h.eval(() => { DataManager.loadGame(1); SceneManager.goto(Scene_Map); $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y); });
    await h.page.waitForTimeout(800); await status('save + load');
    const events = await h.eval(() => $gameMap.events().map(e => e.eventId() + ':' + e.event().name));
    for (const ev of events) {
      const id = Number(ev.split(':')[0]);
      if (await h.eval(() => window.Scene_SICraft && SceneManager._scene instanceof Scene_SICraft)) {   // a late craft screen
        await h.eval(() => SceneManager.pop());
        await h.page.waitForFunction(() => SceneManager._scene instanceof Scene_Map && SceneManager._sceneStarted);
      }
      await h.eval(id => $gameMap.event(id).start(), id);
      for (let i = 0; i < 80; i++) {
        const s = await h.eval(() => ({ battle: SceneManager._scene instanceof Scene_Battle, busy: $gameMessage.isBusy() || $gameMap.isEventRunning(), choice: $gameMessage.isChoice() }));
        if (s.battle) break;
        if (!s.busy) break;
        await h.page.keyboard.press('Enter'); await h.page.waitForTimeout(100);
      }
      // A crafting station opens its own screen: leave it again.
      // (it may open late, if an earlier test battle is still running)
      for (let i = 0; /^\d+:Craft:/.test(ev) && i < 150; i++) {
        if (await h.eval(() => SceneManager._scene instanceof Scene_SICraft && SceneManager._sceneStarted)) break;
        await h.page.waitForTimeout(200);
      }
      if (await h.eval(() => window.Scene_SICraft && SceneManager._scene instanceof Scene_SICraft)) {
        await h.page.waitForTimeout(300);
        await h.eval(() => SceneManager.pop());
        await h.page.waitForFunction(() => SceneManager._scene instanceof Scene_Map && SceneManager._sceneStarted);
      }
      const inBattle = await h.eval(() => SceneManager._scene instanceof Scene_Battle);
      if (inBattle) {
        await h.page.waitForFunction(() => SceneManager._sceneStarted);
        for (let k = 0; k < 400; k++) {
          const s = await h.eval(() => ({ battle: SceneManager._scene instanceof Scene_Battle, cmd: BattleManager.isInputting() && !!BattleManager.actor(), err: (Graphics._errorPrinter && Graphics._errorPrinter.innerText) || '' }));
          if (!s.battle || s.err) break;
          if (s.cmd) {   // pick a random usable skill of any type, else guard
            await h.eval(() => { const sc = SceneManager._scene, a = BattleManager.actor(), act = a.inputtingAction();
              const skills = a.skills().filter(x => a.canUse(x) && !x.siApproach || (x.siApproach && x.siApproach !== 'offer' && a.canUse(x)));
              const pick = skills[Math.floor(Math.random() * skills.length)];
              if (pick && Math.random() < 0.8) { act.setSkill(pick.id); if (act.needsSelection()) act.setTarget(0); } else act.setGuard();
              [sc._skillTypeWindow, sc._skillWindow, sc._itemWindow, sc._tacticsWindow, sc._enemyWindow, sc._actorWindow].forEach(w => w && (w.deactivate(), w.hide()));
              sc._actorCommandWindow.deactivate(); sc.selectNextCommand(); });
            continue;
          }
          if (await h.eval(() => $gameMessage.isBusy())) await h.page.keyboard.press('Enter');
          await h.page.waitForTimeout(60);
        }
        // Random picks (stances, Splash...) can make a fight run long: end it rather than overlap the next event.
        if (await h.eval(() => SceneManager._scene instanceof Scene_Battle && BattleManager._phase !== 'battleEnd')) await h.eval(() => BattleManager.abort());
        await h.page.waitForTimeout(1500);
        for (let i = 0; i < 30 && await h.eval(() => $gameMessage.isBusy() || $gameMap.isEventRunning()); i++) { await h.page.keyboard.press('Enter'); await h.page.waitForTimeout(100); }
      }
      const s = await status('event ' + ev);
      if (s.err) break;
    }
    // Missing art/sound (404s) is expected while placeholders are in use (SI_Placeholders); real errors are not.
    t.eq(logs.filter(l => l.startsWith('error') && !/Failed to load resource.*404/.test(l)).join(' | '), '', 'no console errors');
  }
};
