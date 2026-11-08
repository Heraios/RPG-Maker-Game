//=============================================================================
// SI_Journal.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: Memory, Yoon's journal. Quests, Evidence and
 * Remembered (the compendium), with corner notices when something is added.
 * @author Smoking Isle
 *
 * @param Menu Name
 * @desc The main menu command that opens it.
 * @default Memory
 *
 * @param Evidence Variable
 * @type variable
 * @desc Counts clues found (decides the mountain fight). Never shown.
 * @default 7
 *
 * @param Words Variable
 * @type variable
 * @desc Counts the words the Ghost knows (First Words).
 * @default 6
 *
 * @param Story Variable
 * @type variable
 * @desc The Story variable. The Body page shows from Story 60 (the bone).
 * @default 5
 *
 * @param Notice Sound
 * @desc Sound effect for a corner notice ("New quest: ...").
 * @default Book2
 *
 * @help
 * Memory is what Yoon remembers: the Ghost can't hold a pen, so there's no
 * book. Open it from the main menu or with J on the map. Left/right (or
 * Q/W) change the tab.
 *
 * All the text is in data/Journal.json (quests, clues, questions, words,
 * the Body). Events switch entries on with one Script line:
 *
 *   SmokingIsle.Journal.quest('pearl')        a quest starts (step 1 shows)
 *   SmokingIsle.Journal.step('pearl', 2)      it reaches step 2 (1 ticks off)
 *   SmokingIsle.Journal.complete('pearl')     done
 *   SmokingIsle.Journal.miss('pearl')         missed (Pada's, when he dies)
 *   SmokingIsle.Journal.missGiver('Pada')     every open quest he gave
 *   SmokingIsle.Journal.openEvidence()        the Evidence tab appears
 *   SmokingIsle.Journal.clue('skull')         a clue (Evidence +1, once)
 *   SmokingIsle.Journal.learnWord('bones', 0) a word (0 said carefully,
 *                                             1 said wrong, 2 wailed)
 *   SmokingIsle.Journal.knowhow('gathering')  a how-to (Remembered, Know-how):
 *                                             a tutorial, kept to re-read
 *
 * A corner notice says what was added (never in battle: it waits). Words
 * add no notice: the lesson already says "New word".
 *
 * Margin notes: an entry's "notes" in Journal.json, by actor id, show once
 * that party member has been in the party.
 *
 * The Body: the Quests tab's first entry from Story 60 on. Its picture is
 * img/pictures/Memory_Body.png: nine frames side by side, the silhouette
 * first, then one per ingredient in the order of "body" in Journal.json,
 * each drawn over the silhouette once that ingredient is found.
 *
 * Place after SI_Screen.
 */

var Imported = Imported || {};
Imported.SI_Journal = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Journal = SmokingIsle.Journal || {};

var $dataJournal = null;
DataManager._databaseFiles.push({ name: '$dataJournal', src: 'Journal.json' });

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_Journal');
    $.menuName = String(params['Menu Name'] || 'Memory');
    $.evidenceVar = Number(params['Evidence Variable'] || 7);
    $.wordsVar = Number(params['Words Variable'] || 6);
    $.storyVar = Number(params['Story Variable'] || 5);
    $.noticeSound = String(params['Notice Sound'] || 'Book2');
    $.BODY_STORY = 60;
    $.TABS = [['quests', 'Quests'], ['evidence', 'Evidence'], ['remembered', 'Remembered']];

    //-------------------------------------------------------------------------
    // State (saved with the game)
    //-------------------------------------------------------------------------

    $.state = function() {
        var s = $gameSystem._siJournal = $gameSystem._siJournal || {};
        s.quests = s.quests || {};      // id -> { step, status: 'now' | 'done' | 'missed', order }
        s.clues = s.clues || [];        // ids, in the order found
        s.said = s.said || {};          // word -> 0 carefully, 1 wrong, 2 wailed
        s.met = s.met || {};            // actor id -> true once in the party
        s.knowhow = s.knowhow || [];    // how-tos learned, in order
        s.order = s.order || 0;
        return s;
    };
    $.data = function() { return $dataJournal || {}; };
    $.words = function() { return $gameSystem._siWords = $gameSystem._siWords || []; };   // First Words keeps these
    $.story = function() { return $gameVariables.value($.storyVar); };

    $.notice = function(text) {
        if (!$gameTemp) return;
        ($gameTemp._siJournalNotices = $gameTemp._siJournalNotices || []).push(text);
    };

    $.quest = function(id) {
        var q = $.data().quests && $.data().quests[id], s = $.state();
        if (!q || s.quests[id]) return;
        s.quests[id] = { step: 1, status: 'now', order: ++s.order };
        $.notice('New quest: ' + q.title);
    };
    $.step = function(id, n) {
        var s = $.state(); if (!s.quests[id]) $.quest(id);
        var e = s.quests[id]; if (e && e.status === 'now' && n > e.step) e.step = n;
    };
    $.complete = function(id) {
        var q = $.data().quests && $.data().quests[id], s = $.state(); if (!q) return;
        if (!s.quests[id]) s.quests[id] = { step: 1, order: ++s.order };
        if (s.quests[id].status === 'done') return;
        s.quests[id].status = 'done'; s.quests[id].step = (q.steps || []).length + 1;
        $.notice('Done: ' + q.title);
    };
    $.miss = function(id) {
        var s = $.state(); if (s.quests[id] && s.quests[id].status === 'now') s.quests[id].status = 'missed';
    };
    $.missGiver = function(giver) {
        var qs = $.data().quests || {};
        Object.keys($.state().quests).forEach(function(id) { if (qs[id] && qs[id].giver === giver) $.miss(id); });
    };
    $.questStatus = function(id) { var e = $.state().quests[id]; return e ? e.status : ''; };

    $.openEvidence = function() {
        if ($gameSystem._siEvidenceOpen) return;
        $gameSystem._siEvidenceOpen = true;
        $.notice('Memory: Evidence');
    };
    $.evidenceOpen = function() { return !!$gameSystem._siEvidenceOpen; };
    $.clue = function(id) {
        var c = $.data().clues && $.data().clues[id], s = $.state();
        if (!c || s.clues.indexOf(id) >= 0) return;
        $.openEvidence();
        s.clues.push(id);
        $gameVariables.setValue($.evidenceVar, $gameVariables.value($.evidenceVar) + 1);
        $.notice('A clue: ' + c.title);
    };
    $.hasClue = function(id) { return $.state().clues.indexOf(id) >= 0; };

    $.learnWord = function(word, said) {
        var w = $.words();
        if (w.indexOf(word) < 0) w.push(word);
        if ($.state().said[word] === undefined && said !== undefined) $.state().said[word] = Number(said) || 0;
        $gameVariables.setValue($.wordsVar, w.length);
    };
    $.knowsWord = function(word) { return $.words().indexOf(word) >= 0; };

    $.knowhow = function(id) {
        var k = $.data().knowhow && $.data().knowhow[id], s = $.state();
        if (!k || s.knowhow.indexOf(id) >= 0) return;
        s.knowhow.push(id);
        $.notice('Remembered: ' + k.title);
    };
    $.knowsHow = function(id) { return $.state().knowhow.indexOf(id) >= 0; };

    $.hasMet = function(actorId) { return !!$.state().met[actorId]; };
    var _Game_Party_addActor = Game_Party.prototype.addActor;
    Game_Party.prototype.addActor = function(actorId) {
        _Game_Party_addActor.call(this, actorId);
        if ($gameSystem) $.state().met[actorId] = true;
    };
    var _Game_Party_setupStartingMembers = Game_Party.prototype.setupStartingMembers;
    Game_Party.prototype.setupStartingMembers = function() {
        _Game_Party_setupStartingMembers.call(this);
        this._actors.forEach(function(id) { $.state().met[id] = true; });
    };

    // The Body's ingredients (Journal.json "body"): found when the party holds its key item, or from a Story value.
    $.bodyHas = function(part) {
        if (part.story) return $.story() >= part.story;
        if (part.item) return $gameParty.hasItem($dataItems[part.item], true);
        return false;
    };
    $.bodyOpen = function() { return $.story() >= $.BODY_STORY; };

    //-------------------------------------------------------------------------
    // The entries shown in each tab
    //-------------------------------------------------------------------------

    // Each row: { kind: 'header' | 'entry' | 'unknown', text, entry, ... }
    $.rows = function(tab) {
        var d = $.data(), s = $.state(), rows = [];
        if (tab === 'quests') {
            if ($.bodyOpen()) rows.push({ kind: 'body', text: 'The Body' });
            [['now', 'Now'], ['done', 'Done'], ['missed', 'Missed']].forEach(function(sec) {
                var ids = Object.keys(s.quests).filter(function(id) { return s.quests[id].status === sec[0] && d.quests && d.quests[id]; })
                    .sort(function(a, b) { return s.quests[b].order - s.quests[a].order; });
                if (!ids.length) return;
                rows.push({ kind: 'header', text: sec[1] });
                ids.forEach(function(id) { rows.push({ kind: 'quest', id: id, text: d.quests[id].title, status: sec[0] }); });
            });
            if (!rows.length) rows.push({ kind: 'empty', text: 'Nothing yet.' });
        } else if (tab === 'evidence') {
            if (d.questions && d.questions.length) rows.push({ kind: 'questions', text: 'Questions' });
            rows.push({ kind: 'header', text: 'Clues' });
            Object.keys(d.clues || {}).forEach(function(id) {
                rows.push($.hasClue(id) ? { kind: 'clue', id: id, text: d.clues[id].title } : { kind: 'unknown', text: '???' });
            });
        } else if (tab === 'remembered') {
            var words = d.words || {};
            rows.push({ kind: 'header', text: 'Known Words' });
            Object.keys(words).forEach(function(w) {
                rows.push($.knowsWord(w) ? { kind: 'word', id: w, text: w } : { kind: 'unknown', text: '???' });
            });
            var how = d.knowhow || {};
            if (Object.keys(how).length) {
                rows.push({ kind: 'header', text: 'Know-how' });
                Object.keys(how).forEach(function(id) {
                    rows.push($.knowsHow(id) ? { kind: 'knowhow', id: id, text: how[id].title } : { kind: 'unknown', text: '???' });
                });
            }
        }
        return rows;
    };
    $.tabs = function() {
        return $.TABS.filter(function(t) { return t[0] !== 'evidence' || $.evidenceOpen(); });
    };

    //-------------------------------------------------------------------------
    // Opening it: the menu command and J
    //-------------------------------------------------------------------------

    Input.keyMapper[74] = 'siMemory';   // J

    var _Window_MenuCommand_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
    Window_MenuCommand.prototype.addOriginalCommands = function() {
        _Window_MenuCommand_addOriginalCommands.call(this);
        this.addCommand($.menuName, 'siMemory', true);
    };
    var _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
    Scene_Menu.prototype.createCommandWindow = function() {
        _Scene_Menu_createCommandWindow.call(this);
        this._commandWindow.setHandler('siMemory', function() { SceneManager.push(Scene_Memory); });
    };

    $.canOpenFromMap = function() {
        return $gameSystem.isMenuEnabled() && !$gameMap.isEventRunning() && !$gameMessage.isBusy() &&
            !$gamePlayer.isMoving() && !SceneManager.isSceneChanging();
    };
    var _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (Input.isTriggered('siMemory') && this.isActive() && $.canOpenFromMap()) {
            SoundManager.playOk();
            SceneManager.push(Scene_Memory);
        }
    };

    //-------------------------------------------------------------------------
    // Corner notices on the map
    //-------------------------------------------------------------------------

    function Window_MemoryNotice() { this.initialize.apply(this, arguments); }
    Window_MemoryNotice.prototype = Object.create(Window_Base.prototype);
    Window_MemoryNotice.prototype.constructor = Window_MemoryNotice;
    Window_MemoryNotice.prototype.initialize = function() {
        var w = 440, h = this.fittingHeight(1);
        Window_Base.prototype.initialize.call(this, Graphics.boxWidth - w - 12, 12, w, h);
        this.opacity = 0; this.contentsOpacity = 0; this._timer = 0; this._text = '';
    };
    Window_MemoryNotice.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        var q = $gameTemp._siJournalNotices || [];
        if (this._timer <= 0 && q.length) {
            this._text = q.shift(); this._timer = 150;
            this.contents.clear();
            this.drawText(this._text, 0, 0, this.contentsWidth(), 'right');
            AudioManager.playSe({ name: $.noticeSound, volume: 80, pitch: 100, pan: 0 });
        }
        if (this._timer > 0) {
            this._timer--;
            var a = this._timer > 130 ? (150 - this._timer) * 12 : this._timer < 20 ? this._timer * 12 : 255;
            this.contentsOpacity = Math.min(255, a); this.opacity = Math.min(160, a);
        } else { this.contentsOpacity = 0; this.opacity = 0; }
    };
    var _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        _Scene_Map_createAllWindows.call(this);
        this._siNoticeWindow = new Window_MemoryNotice();
        this.addWindow(this._siNoticeWindow);
    };

    //-------------------------------------------------------------------------
    // Text helpers
    //-------------------------------------------------------------------------

    // Wrap text (with \n breaks and text codes) to a width; returns lines.
    $.wrap = function(win, text, width) {
        var out = [];
        win.convertEscapeCharacters(String(text || '')).split('\n').forEach(function(para) {
            var line = '';
            para.split(' ').forEach(function(word) {
                var next = line ? line + ' ' + word : word;
                var plain = next.replace(/\x1b[A-Z]+(\[[^\]]*\])?|\x1b./gi, '');
                if (line && win.textWidth(plain) > width) { out.push(line); line = word; } else line = next;
            });
            out.push(line);
        });
        return out;
    };

    //-------------------------------------------------------------------------
    // The Memory screen
    //-------------------------------------------------------------------------

    function Window_MemoryTabs() { this.initialize.apply(this, arguments); }
    Window_MemoryTabs.prototype = Object.create(Window_HorzCommand.prototype);
    Window_MemoryTabs.prototype.constructor = Window_MemoryTabs;
    Window_MemoryTabs.prototype.windowWidth = function() { return Graphics.boxWidth; };
    Window_MemoryTabs.prototype.maxCols = function() { return $.tabs().length; };
    Window_MemoryTabs.prototype.makeCommandList = function() {
        $.tabs().forEach(function(t) { this.addCommand(t[1], t[0]); }, this);
    };
    Window_MemoryTabs.prototype.itemTextAlign = function() { return 'center'; };
    Window_MemoryTabs.prototype.processHandling = function() {};
    Window_MemoryTabs.prototype.processTouch = function() {};

    function Window_MemoryList() { this.initialize.apply(this, arguments); }
    Window_MemoryList.prototype = Object.create(Window_Selectable.prototype);
    Window_MemoryList.prototype.constructor = Window_MemoryList;
    Window_MemoryList.prototype.initialize = function(x, y, w, h) {
        this._rows = [];
        Window_Selectable.prototype.initialize.call(this, x, y, w, h);
    };
    Window_MemoryList.prototype.setTab = function(tab) {
        this._tab = tab; this._rows = $.rows(tab);
        this.refresh();
        var first = this._rows.findIndex ? this._rows.findIndex(function(r) { return r.kind !== 'header'; }) : 0;
        this.select(Math.max(0, first)); this.setTopRow(0);
    };
    Window_MemoryList.prototype.maxItems = function() { return this._rows.length; };
    Window_MemoryList.prototype.item = function() { return this._rows[this.index()]; };
    Window_MemoryList.prototype.drawItem = function(index) {
        var r = this._rows[index], rect = this.itemRectForText(index);
        this.resetTextColor(); this.changePaintOpacity(true);
        if (r.kind === 'header') { this.changeTextColor(this.systemColor()); this.drawText(r.text, rect.x, rect.y, rect.width); return; }
        if (r.kind === 'unknown' || r.kind === 'empty') this.changePaintOpacity(false);
        if (r.status === 'missed' || r.status === 'done') this.changePaintOpacity(false);
        var indent = (r.kind === 'body' || r.kind === 'questions') ? 0 : 16;
        this.drawText(r.text, rect.x + indent, rect.y, rect.width - indent);
        this.changePaintOpacity(true);
    };
    Window_MemoryList.prototype.updateHelp = function() { if (this._helpWindow) this._helpWindow.setRow(this.item()); };
    Window_MemoryList.prototype.cursorRight = function(wrap) { if (wrap && this._scene) this._scene.changeTab(1); };
    Window_MemoryList.prototype.cursorLeft = function(wrap) { if (wrap && this._scene) this._scene.changeTab(-1); };
    Window_MemoryList.prototype.isOkEnabled = function() { return false; };
    Window_MemoryList.prototype.processHandling = function() {
        Window_Selectable.prototype.processHandling.call(this);
        if (this.isOpenAndActive() && Input.isTriggered('siMemory')) { SoundManager.playCancel(); this.processCancel(); }
    };

    function Window_MemoryEntry() { this.initialize.apply(this, arguments); }
    Window_MemoryEntry.prototype = Object.create(Window_Base.prototype);
    Window_MemoryEntry.prototype.constructor = Window_MemoryEntry;
    Window_MemoryEntry.prototype.initialize = function(x, y, w, h) {
        Window_Base.prototype.initialize.call(this, x, y, w, h);
        this._body = ImageManager.loadPicture('Memory_Body');
        this._body.addLoadListener(function() { if (this._row && this._row.kind === 'body') this.refresh(); }.bind(this));
    };
    Window_MemoryEntry.prototype.setRow = function(row) { this._row = row; this.refresh(); };
    Window_MemoryEntry.prototype.refresh = function() {
        this.contents.clear();
        var r = this._row; if (!r) return;
        var d = $.data(), y = 0, w = this.contentsWidth(), lh = this.lineHeight();
        var title = function(text) { this.changeTextColor(this.systemColor()); this.drawText(text, 0, y, w); this.resetTextColor(); y += lh + 8; }.bind(this);
        var para = function(text, dim) {
            if (!text) return;
            this.changePaintOpacity(!dim);
            $.wrap(this, text, w).forEach(function(l) { this.drawTextEx(l, 0, y); y += lh; }, this);
            this.changePaintOpacity(true); y += 8;
        }.bind(this);
        var notes = function(entry) {
            var n = entry && entry.notes; if (!n) return;
            Object.keys(n).forEach(function(id) {
                if (!$.hasMet(Number(id))) return;
                this.changeTextColor(this.textColor(6));
                $.wrap(this, '\\N[' + id + ']: ' + n[id], w - 24).forEach(function(l) { this.drawTextEx('\x1bC[6]' + l, 24, y); y += lh; }, this);
                this.resetTextColor(); y += 8;
            }, this);
        }.bind(this);
        var todo = function(text) { return /^TODO/i.test(text || '') && !$gameTemp.isPlaytest() ? '' : text; };

        if (r.kind === 'header' || r.kind === 'empty') { para(r.kind === 'empty' ? r.text : ''); return; }
        if (r.kind === 'unknown') { title('???'); para("I don't remember this yet.", true); return; }
        if (r.kind === 'quest') {
            var q = d.quests[r.id], st = $.state().quests[r.id];
            title(q.title);
            if (q.giver) para('From ' + q.giver + '.', true);
            (q.steps || []).forEach(function(s, i) {
                if (i + 1 > st.step) return;
                var done = i + 1 < st.step;
                para((done ? '- ' : '> ') + todo(s), done);
            });
            if (st.status === 'done') para(todo(q.done), true);
            if (st.status === 'missed') para(todo(q.missed), true);
            notes(q);
        } else if (r.kind === 'body') {
            this.drawBody(0, 0);
            var x0 = 260, yy = 0;
            this.changeTextColor(this.systemColor()); this.drawText('The Body', x0, yy, w - x0); this.resetTextColor(); yy += lh + 8;
            (d.body || []).forEach(function(p) {
                var has = $.bodyHas(p);
                this.changePaintOpacity(has);
                this.drawText((has ? '+ ' : '  ') + (has ? p.name : '???'), x0, yy, w - x0);
                if (has && p.becomes) { this.changePaintOpacity(false); this.drawText(p.becomes, x0 + 300, yy, w - x0 - 300); }
                yy += lh;
            }, this);
            this.changePaintOpacity(true);
        } else if (r.kind === 'questions') {
            title('Questions');
            (d.questions || []).forEach(function(qn) {
                var answered = qn.answeredBy && $.hasClue(qn.answeredBy);
                if (qn.after && answered) { para(qn.after); return; }
                var lines = $.wrap(this, qn.text, w);
                this.changePaintOpacity(!answered);
                lines.forEach(function(l) {
                    this.drawTextEx(l, 0, y);
                    if (answered) this.contents.fillRect(0, y + lh / 2, this.textWidth(l), 2, this.normalColor());
                    y += lh;
                }, this);
                this.changePaintOpacity(true); y += 8;
            }, this);
        } else if (r.kind === 'clue') {
            var c = d.clues[r.id];
            title(c.title);
            para(c.where, true);
            para(todo(c.text));
            if (c.fits && $.hasClue(c.fits)) para('It fits.');
            notes(c);
        } else if (r.kind === 'knowhow') {
            var k = d.knowhow[r.id];
            title(k.title);
            (k.text || []).forEach(function(line) { para(todo(line)); });
            notes(k);
        } else if (r.kind === 'word') {
            var wd = d.words[r.id], said = $.state().said[r.id];
            title(r.id);
            para(wd.where, true);
            if (wd.taught) para('\\N[4]: "' + wd.taught + '"');
            if (said === 0) para('I said it right the first time.', true);
            if (said === 1 && wd.wrong) para('I first said "' + wd.wrong + '"', true);
            if (said === 2) para('I wailed it: "' + $.wailed(r.id) + '"', true);
            notes(wd);
        }
    };
    Window_MemoryEntry.prototype.drawBody = function(x, y) {
        var b = this._body; if (!b || !b.isReady() || !b.width) return;
        var fw = b.width / 9, fh = b.height;
        this.contents.blt(b, 0, 0, fw, fh, x, y);
        ($.data().body || []).forEach(function(p, i) { if ($.bodyHas(p)) this.contents.blt(b, (i + 1) * fw, 0, fw, fh, x, y); }, this);
    };
    $.wailed = function(word) {
        var v = word.search(/[aeiou]/); if (v < 0) return word.toUpperCase() + '.';
        return (word.slice(0, v) + new Array(6).join(word[v]) + word.slice(v + 1)).toUpperCase() + '.';
    };

    function Scene_Memory() { this.initialize.apply(this, arguments); }
    Scene_Memory.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_Memory.prototype.constructor = Scene_Memory;
    Scene_Memory.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this._tabs = new Window_MemoryTabs(0, 0);
        this._tabs.deactivate();
        this.addWindow(this._tabs);
        var top = this._tabs.height, lw = 380;
        this._list = new Window_MemoryList(0, top, lw, Graphics.boxHeight - top);
        this._list._scene = this;
        this._entry = new Window_MemoryEntry(lw, top, Graphics.boxWidth - lw, Graphics.boxHeight - top);
        this._list.setHelpWindow(this._entry);
        this._list.setHandler('cancel', this.popScene.bind(this));
        this._list.setHandler('pageup', this.changeTab.bind(this, -1));
        this._list.setHandler('pagedown', this.changeTab.bind(this, 1));
        this.addWindow(this._list); this.addWindow(this._entry);
        this._tabIndex = 0; this.showTab();
        this._list.activate();
    };
    Scene_Memory.prototype.showTab = function() {
        this._tabs.select(this._tabIndex);
        this._list.setTab($.tabs()[this._tabIndex][0]);
        this._list.updateHelp();
    };
    Scene_Memory.prototype.changeTab = function(delta) {
        var n = $.tabs().length;
        this._tabIndex = (this._tabIndex + delta + n) % n;
        SoundManager.playCursor();
        this.showTab();
        this._list.activate();
    };
    $.Scene_Memory = Scene_Memory;
    window.Scene_Memory = Scene_Memory;

})(SmokingIsle.Journal);
