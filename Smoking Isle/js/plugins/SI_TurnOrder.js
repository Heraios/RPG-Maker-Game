//=============================================================================
// SI_TurnOrder.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: FFX-style turn order. Faster battlers act more often.
 * @author Smoking Isle
 *
 * @param Speed Formula
 * @desc How fast a battler's turn comes around. "a" is the battler.
 * Adding a constant evens out large AGI differences.
 * @default a.agi + 30
 *
 * @param Window Width
 * @type number
 * @min 100
 * @desc Width of the turn order window on the right side of the screen.
 * @default 170
 *
 * @help
 * ============================================================================
 * How it works
 * ============================================================================
 * There are no rounds. Every battler waits a "distance" until their next
 * turn and moves toward it at their speed (see Speed Formula). Whoever gets
 * there first acts immediately: actors are given a command on their own turn
 * and enemies act right away. After acting, the battler's distance is reset
 * to the cost of the action they used (100 = a normal action), so a battler
 * twice as fast gets twice as many turns.
 *
 * Speed changes (AGI buffs, debuffs, states) take effect immediately.
 *
 * The turn order window shows who acts next. While choosing an action, it
 * previews where the current actor will land afterwards, so a cheap action
 * visibly moves their next turn earlier.
 *
 * States, buffs and regeneration (HP/MP/Fatigue) tick on each battler's own
 * turn, not once per round. Battlers who can't move still get turns, which
 * is when their states wear off.
 *
 * ============================================================================
 * Note tags (skills and items)
 * ============================================================================
 *   <Turn Cost: 60>      This action costs 60 instead of 100: the user's next
 *                        turn comes sooner. Use above 100 for slow actions.
 *   <Delay Target: 40>   On hit, pushes each target's next turn back by 40.
 *                        A negative value pulls an ally's turn closer.
 *
 * ============================================================================
 * Turn counts
 * ============================================================================
 * - Enemy action "Turn" conditions count that enemy's own turns, starting
 *   from 0 on its first turn.
 * - Troop event "Turn" conditions advance every time any battler takes a
 *   turn.
 */

var Imported = Imported || {};
Imported.SI_TurnOrder = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.TurnOrder = SmokingIsle.TurnOrder || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_TurnOrder');
    $.speedFormula = new Function('a', 'return ' + (params['Speed Formula'] || 'a.agi + 30') + ';');
    $.windowWidth = Number(params['Window Width'] || 170);
    $.NORMAL_COST = 100;

    //-------------------------------------------------------------------------
    // Note tags
    //-------------------------------------------------------------------------

    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        if (!_DataManager_isDatabaseLoaded.call(this)) return false;
        if (!$._notesParsed) {
            [$dataSkills, $dataItems].forEach(function(list) {
                list.forEach(function(obj) {
                    if (!obj) return;
                    var cost = /<Turn Cost:\s*(\d+)>/i.exec(obj.note);
                    var delay = /<Delay Target:\s*(-?\d+)>/i.exec(obj.note);
                    obj.siTurnCost = cost ? Number(cost[1]) : $.NORMAL_COST;
                    obj.siDelayTarget = delay ? Number(delay[1]) : 0;
                });
            });
            $._notesParsed = true;
        }
        return true;
    };

    $.actionCost = function(item) {
        return item && item.siTurnCost !== undefined ? item.siTurnCost : $.NORMAL_COST;
    };

    //-------------------------------------------------------------------------
    // Battler timeline
    //-------------------------------------------------------------------------

    Game_Battler.prototype.ctbSpeed = function() {
        var speed = Number($.speedFormula(this));
        return Math.max(isNaN(speed) ? 1 : speed, 1);
    };

    Game_Battler.prototype.ctbDistance = function() {
        if (this._ctbDistance === undefined) this._ctbDistance = $.NORMAL_COST;
        return this._ctbDistance;
    };

    Game_Battler.prototype.setCtbDistance = function(value) {
        this._ctbDistance = Math.max(value, 0);
    };

    Game_Battler.prototype.ctbTurnCount = function() {
        return this._ctbTurnCount || 0;
    };

    var _Game_Battler_onBattleStart = Game_Battler.prototype.onBattleStart;
    Game_Battler.prototype.onBattleStart = function() {
        _Game_Battler_onBattleStart.call(this);
        // Slight variation so equal-speed battlers don't always tie.
        this._ctbDistance = $.NORMAL_COST * (0.85 + Math.random() * 0.15);
        this._ctbTurnCount = 0;
    };

    var _Game_Battler_revive = Game_Battler.prototype.revive;
    Game_Battler.prototype.revive = function() {
        var wasDead = this.isDead();
        _Game_Battler_revive.call(this);
        if (wasDead && $gameParty.inBattle()) {
            this._ctbDistance = $.NORMAL_COST;
        }
    };

    Game_Enemy.prototype.meetsTurnCondition = function(param1, param2) {
        var n = this.ctbTurnCount();
        if (param2 === 0) {
            return n === param1;
        } else {
            return n > 0 && n >= param1 && n % param2 === param1 % param2;
        }
    };

    var _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _Game_Action_apply.call(this, target);
        var delay = this.item() ? this.item().siDelayTarget : 0;
        if (delay && target.result().isHit() && target.isAlive() &&
                target !== BattleManager._ctbActive) {
            target.setCtbDistance(target.ctbDistance() + delay);
        }
    };

    //-------------------------------------------------------------------------
    // Scheduling
    //-------------------------------------------------------------------------

    $.timelineBattlers = function() {
        return $gameParty.battleMembers().concat($gameTroop.members()).filter(function(b) {
            return b.isAlive();
        });
    };

    // Entries are {battler, distance, speed}. Returns the one who acts next.
    $.pickNext = function(entries) {
        var best = null;
        entries.forEach(function(e) {
            if (!best) {
                best = e;
                return;
            }
            var t1 = e.distance / e.speed;
            var t2 = best.distance / best.speed;
            if (t1 < t2 - 1e-9 ||
                    (Math.abs(t1 - t2) <= 1e-9 && $.tieBreak(e, best) < 0)) {
                best = e;
            }
        });
        return best;
    };

    $.tieBreak = function(a, b) {
        if (a.battler.isActor() !== b.battler.isActor()) {
            return a.battler.isActor() ? -1 : 1;
        }
        return b.speed - a.speed;
    };

    $.advance = function(entries, chosen) {
        var time = chosen.distance / chosen.speed;
        entries.forEach(function(e) {
            e.distance = Math.max(e.distance - e.speed * time, 0);
        });
        chosen.distance = 0;
    };

    $.makeEntries = function() {
        return $.timelineBattlers().map(function(b) {
            return { battler: b, distance: b.ctbDistance(), speed: b.ctbSpeed() };
        });
    };

    BattleManager.ctbNextBattler = function() {
        var entries = $.makeEntries();
        var chosen = $.pickNext(entries);
        if (!chosen) return null;
        $.advance(entries, chosen);
        entries.forEach(function(e) {
            e.battler.setCtbDistance(e.distance);
        });
        return chosen.battler;
    };

    // Upcoming turns. The active battler (if any) comes first, then a
    // simulation where they pay pendingCost and everyone else acts normally.
    BattleManager.ctbPreview = function(count, pendingCost) {
        var result = [];
        var entries = $.makeEntries();
        var active = this._ctbActive;
        var activeEntry = null;
        if (active && active.isAlive()) {
            result.push({ battler: active, current: true });
            entries.forEach(function(e) {
                if (e.battler === active) activeEntry = e;
            });
            if (activeEntry) activeEntry.distance = pendingCost;
        }
        while (result.length < count && entries.length > 0) {
            var next = $.pickNext(entries);
            $.advance(entries, next);
            result.push({ battler: next.battler, preview: next === activeEntry });
            if (next === activeEntry) activeEntry = null;
            next.distance = $.NORMAL_COST;
        }
        return result;
    };

    //-------------------------------------------------------------------------
    // Battle flow
    //-------------------------------------------------------------------------

    var _BattleManager_initMembers = BattleManager.initMembers;
    BattleManager.initMembers = function() {
        _BattleManager_initMembers.call(this);
        this._ctbActive = null;
        this._ctbCost = $.NORMAL_COST;
    };

    var _BattleManager_startBattle = BattleManager.startBattle;
    BattleManager.startBattle = function() {
        _BattleManager_startBattle.call(this);
        if (this._preemptive) {
            $gameParty.members().forEach(function(b) { b.setCtbDistance(0); });
        } else if (this._surprise) {
            $gameTroop.members().forEach(function(b) { b.setCtbDistance(0); });
        }
    };

    BattleManager.startInput = function() {
        var battler = this.ctbNextBattler();
        this._ctbActive = battler;
        this._phase = 'input';
        this.clearActor();
        if (!battler) {
            this.startTurn();
            return;
        }
        battler.onCtbTurnStart();
        if (this.ctbShouldSkipTurn(battler)) {
            battler.clearActions();
            this.startTurn();
            return;
        }
        battler.makeActions();
        if (battler.isActor() && battler.canInput()) {
            this.changeActor(battler.index(), 'undecided');
        } else {
            this.startTurn();
        }
    };

    // Hooks for other plugins: something that happens as a battler's turn
    // begins, and whether that turn is lost entirely.
    Game_Battler.prototype.onCtbTurnStart = function() {
    };

    BattleManager.ctbShouldSkipTurn = function(battler) {
        return false;
    };

    BattleManager.ctbActiveActor = function() {
        var b = this._ctbActive;
        return b && b.isActor() ? b : null;
    };

    BattleManager.selectNextCommand = function() {
        var actor = this.actor();
        if (!actor) {
            // Returning from the Fight/Escape window to the actor whose turn it is.
            var active = this.ctbActiveActor();
            if (active) {
                this.changeActor(active.index(), 'undecided');
            } else {
                this.startTurn();
            }
            return;
        }
        if (actor.selectNextCommand()) return;
        this.startTurn();
    };

    BattleManager.selectPreviousCommand = function() {
        var actor = this.actor();
        if (actor && actor.selectPreviousCommand()) return;
        this.changeActor(-1, 'undecided');
    };

    BattleManager.startTurn = function() {
        this._phase = 'turn';
        this.clearActor();
        $gameTroop.increaseTurn();
        var battler = this._ctbActive;
        var action = battler ? battler.currentAction() : null;
        this._ctbCost = $.actionCost(action ? action.item() : null);
        this._actionBattlers = battler ? [battler] : [];
        $gameParty.requestMotionRefresh();
        this._logWindow.startTurn();
    };

    BattleManager.endTurn = function() {
        this._phase = 'turnEnd';
        this._preemptive = false;
        this._surprise = false;
        var battler = this._ctbActive;
        if (battler) {
            battler.onTurnEnd();
            this.refreshStatus();
            this._logWindow.displayAutoAffectedStatus(battler);
            this._logWindow.displayRegeneration(battler);
            battler.setCtbDistance(this._ctbCost);
            battler._ctbTurnCount = battler.ctbTurnCount() + 1;
        }
        this._ctbActive = null;
        if (this.isForcedTurn()) {
            this._turnForced = false;
        }
    };

    //-------------------------------------------------------------------------
    // Window_TurnOrder
    //-------------------------------------------------------------------------

    function Window_TurnOrder() {
        this.initialize.apply(this, arguments);
    }

    Window_TurnOrder.prototype = Object.create(Window_Base.prototype);
    Window_TurnOrder.prototype.constructor = Window_TurnOrder;

    Window_TurnOrder.prototype.initialize = function(x, y, width, height) {
        Window_Base.prototype.initialize.call(this, x, y, width, height);
        this._signature = '';
        this._pendingCost = $.NORMAL_COST;
        this.opacity = 192;
    };

    Window_TurnOrder.prototype.standardFontSize = function() {
        return 20;
    };

    Window_TurnOrder.prototype.lineHeight = function() {
        return 30;
    };

    Window_TurnOrder.prototype.maxEntries = function() {
        return Math.floor(this.contentsHeight() / this.lineHeight()) - 1;
    };

    Window_TurnOrder.prototype.setPendingCost = function(cost) {
        this._pendingCost = cost;
    };

    Window_TurnOrder.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        var cost = BattleManager.isInputting() ? this._pendingCost : BattleManager._ctbCost;
        var entries = BattleManager.ctbPreview(this.maxEntries(), cost);
        var signature = entries.map(function(e) {
            return e.battler.name() + (e.current ? '>' : '') + (e.preview ? '*' : '');
        }).join('|');
        if (signature !== this._signature) {
            this._signature = signature;
            this.drawEntries(entries);
        }
    };

    Window_TurnOrder.prototype.drawEntries = function(entries) {
        this.contents.clear();
        var lh = this.lineHeight();
        var w = this.contentsWidth();
        this.changeTextColor(this.systemColor());
        this.drawText('Turn Order', 0, 0, w, 'center');
        entries.forEach(function(e, i) {
            var y = lh * (i + 1);
            if (e.current) {
                this.contents.paintOpacity = 96;
                this.contents.fillRect(0, y + 2, w, lh - 4, this.textColor(6));
                this.contents.paintOpacity = 255;
            }
            if (e.preview) {
                this.changeTextColor(this.textColor(6));
                this.drawText('▸', 0, y, 16);
            }
            this.changeTextColor(e.battler.isActor() ? this.normalColor() : this.textColor(2));
            this.drawText(e.battler.name(), 18, y, w - 18);
        }, this);
        this.resetTextColor();
    };

    $.Window_TurnOrder = Window_TurnOrder;

    //-------------------------------------------------------------------------
    // Scene_Battle
    //-------------------------------------------------------------------------

    var _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        _Scene_Battle_createAllWindows.call(this);
        this.createTurnOrderWindow();
    };

    Scene_Battle.prototype.createTurnOrderWindow = function() {
        var width = $.windowWidth;
        var y = this._helpWindow.height;
        var height = this._statusWindow.y - y;
        this._turnOrderWindow = new Window_TurnOrder(Graphics.boxWidth - width, y, width, height);
        this.addWindow(this._turnOrderWindow);
        // Keep skill and item lists clear of the turn order window.
        [this._skillWindow, this._itemWindow].forEach(function(win) {
            win.width = Graphics.boxWidth - width;
            win.createContents();
        });
    };

    Scene_Battle.prototype.ctbPendingItem = function() {
        if (this._skillWindow.active) return this._skillWindow.item();
        if (this._itemWindow.active) return this._itemWindow.item();
        if (this._actorCommandWindow.active) {
            switch (this._actorCommandWindow.currentSymbol()) {
            case 'attack':
                return $dataSkills[BattleManager.actor().attackSkillId()];
            case 'guard':
                return $dataSkills[BattleManager.actor().guardSkillId()];
            }
            return null;
        }
        var action = BattleManager.inputtingAction();
        return action ? action.item() : null;
    };

    var _Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function() {
        if (this._turnOrderWindow) {
            this._turnOrderWindow.setPendingCost($.actionCost(this.ctbPendingItem()));
        }
        _Scene_Battle_update.call(this);
    };

})(SmokingIsle.TurnOrder);
