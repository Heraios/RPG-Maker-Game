// The Status and Equip screens show all of an actor's equipment (22 slots: SI_Equipment), laid out by SI_Layout.
module.exports = {
    'status and equip: every slot, every equipped thing': async (h, t) => {
        await h.newGame();
        await h.eval(() => { $gameParty.setMenuActor($gameActors.actor(2)); SceneManager.push(Scene_Equip); });
        await h.page.waitForFunction(() => SceneManager._scene instanceof Scene_Equip && SceneManager._scene._slotWindow);
        const eq = await h.eval(() => {
            const w = SceneManager._scene._slotWindow, n = w.maxItems(), rows = w.siRows();
            const fits = [...Array(n).keys()].every(i => { const r = w.itemRect(i); return r.y >= 0 && r.y + r.height <= w.contentsHeight() && r.x + r.width <= w.contentsWidth() + 1; });
            w.select(0); w.cursorRight(); const right = w.index(); w.cursorDown(); const down = w.index(); w.cursorLeft(); const left = w.index();
            return { n, rows, fits, right, down, left, leftCol: [...Array(rows).keys()].map(i => w.slotName(i)).join(',') };
        });
        t.eq(eq.n + '/' + eq.rows, '22/11', '22 slots in two columns of 11');
        t.ok(eq.fits, 'every slot is on screen without scrolling');
        t.eq(eq.leftCol, 'Head,Neck,Shoulders,Body,Cuirass,Arms,Left Hand,Right Hand,Legs,Greaves,Feet', 'the worn things down the left');
        t.eq([eq.right, eq.down, eq.left].join(','), '11,12,1', 'the cursor moves across, down and back');
        await h.eval(() => SceneManager.goto(Scene_Map));
        await h.page.waitForTimeout(500);
        const st = await h.eval(() => {
            const a = $gameActors.actor(2), w = new Window_Status(); w.setActor(a);
            const drawn = []; const orig = w.drawText; w.drawText = function(t) { drawn.push(String(t)); return orig.apply(this, arguments); };
            w.drawEquipments(432, 0);
            return { names: a.equips().filter(Boolean).map(e => e.name), drawn };
        });
        t.ok(st.names.length > 6 && st.names.every(n => st.drawn.indexOf(n) >= 0), 'Status lists everything equipped (' + st.names.length + ')');
    }
};
