//=============================================================================
// SI_PseudoMember.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: AI-controlled pseudo party members (Patience).
 * @author Smoking Isle
 *
 * @help
 * A pseudo party member fights alongside the four battle members without
 * taking one of their slots, like Boney (Mother 3) or King (EarthBound).
 *
 * Actor note:
 *   <Pseudo Member>
 *   <AI Skills: 25:70, 26:30>   Optional. On each of their turns they pick
 *                               one of these usable skills at random, by
 *                               weight (skill id : weight), against a
 *                               random target. Without it, MV's auto battle
 *                               decides.
 *
 * Give their class the Auto Battle trait (Traits > Other > Special Flag)
 * so the player never commands them.
 *
 * Commands (e.g. "Heel, Girl!"):
 *   Skill note:  <Pseudo State: 36>   toggles state 36 on the pseudo members
 *                                     in battle. Only usable while one is
 *                                     up. (Scope: The User.)
 *   State note:  <Pseudo Guard>       while they have this state, they only
 *                                     guard.
 *
 * In battle they:
 * - act on their own turns (they appear in the Turn Order),
 * - can be targeted by enemies, and by healing and revival,
 * - are shown in a small window of their own above the party status,
 * - don't count toward defeat: the battle is lost when every regular
 *   member is down.
 */

var Imported = Imported || {};
Imported.SI_PseudoMember = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.PseudoMember = SmokingIsle.PseudoMember || {};

(function($) {
    'use strict';

    Game_Actor.prototype.isPseudoMember = function() {
        return /<Pseudo Member>/i.test(this.actor().note);
    };

    Game_Actor.prototype.aiSkillWeights = function() {
        var m = /<AI Skills:\s*([^>]*)>/i.exec(this.actor().note);
        if (!m) return null;
        return m[1].split(',').map(function(pair) {
            var p = pair.split(':');
            return { skillId: Number(p[0]), weight: Number(p[1] || 1) };
        }).filter(function(e) { return e.skillId > 0 && e.weight > 0; });
    };

    //-------------------------------------------------------------------------
    // Party
    //-------------------------------------------------------------------------

    Game_Party.prototype.regularBattleMembers = function() {
        return this.allMembers().filter(function(actor) {
            return !actor.isPseudoMember();
        }).slice(0, this.maxBattleMembers()).filter(function(actor) {
            return actor.isAppeared();
        });
    };

    Game_Party.prototype.pseudoBattleMembers = function() {
        return this.allMembers().filter(function(actor) {
            return actor.isPseudoMember() && actor.isAppeared();
        });
    };

    // Regular members first, so their indexes are unchanged; pseudo members last.
    Game_Party.prototype.battleMembers = function() {
        return this.regularBattleMembers().concat(this.pseudoBattleMembers());
    };

    var _Game_Party_isAllDead = Game_Party.prototype.isAllDead;
    Game_Party.prototype.isAllDead = function() {
        if (this.inBattle()) {
            return !this.regularBattleMembers().some(function(actor) {
                return actor.isAlive();
            });
        }
        return _Game_Party_isAllDead.call(this);
    };

    // Map followers only show regular members.
    Game_Follower.prototype.actor = function() {
        return $gameParty.regularBattleMembers()[this._memberIndex];
    };

    //-------------------------------------------------------------------------
    // AI
    //-------------------------------------------------------------------------

    //-------------------------------------------------------------------------
    // Commands ("Heel, Girl!")
    //-------------------------------------------------------------------------

    $.commandState = function(item) {
        var m = item && /<Pseudo State:\s*(\d+)>/i.exec(item.note || '');
        return m ? Number(m[1]) : 0;
    };

    $.commandTargets = function() {
        return $gameParty.pseudoBattleMembers().filter(function(a) {
            return a.isAlive();
        });
    };

    var _Game_BattlerBase_meetsSkillConditions = Game_BattlerBase.prototype.meetsSkillConditions;
    Game_BattlerBase.prototype.meetsSkillConditions = function(skill) {
        if (!_Game_BattlerBase_meetsSkillConditions.call(this, skill)) return false;
        return !$.commandState(skill) || $.commandTargets().length > 0;
    };

    var _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _Game_Action_apply.call(this, target);
        var stateId = $.commandState(this.item());
        if (!stateId) return;
        var subject = this.subject();
        $.commandTargets().forEach(function(member) {
            if (member.isStateAffected(stateId)) {
                member.removeState(stateId);
                subject._siCommandMessages = (subject._siCommandMessages || [])
                    .concat([$dataStates[stateId].message4 ? member.name() + $dataStates[stateId].message4 : '']);
            } else {
                member.addState(stateId);
                subject._siCommandMessages = (subject._siCommandMessages || [])
                    .concat([$dataStates[stateId].message1 ? member.name() + $dataStates[stateId].message1 : '']);
            }
        });
    };

    var _Window_BattleLog_displayActionResults = Window_BattleLog.prototype.displayActionResults;
    Window_BattleLog.prototype.displayActionResults = function(subject, target) {
        _Window_BattleLog_displayActionResults.call(this, subject, target);
        var messages = (target._siCommandMessages || []).filter(function(t) { return t; });
        target._siCommandMessages = [];
        messages.forEach(function(text) {
            this.push('addText', text);
            this.push('wait');
        }, this);
    };

    Game_Actor.prototype.isPseudoGuarding = function() {
        return this.states().some(function(state) {
            return /<Pseudo Guard>/i.test(state.note || '');
        });
    };

    var _Game_Actor_makeAutoBattleActions = Game_Actor.prototype.makeAutoBattleActions;
    Game_Actor.prototype.makeAutoBattleActions = function() {
        if (this.isPseudoGuarding()) {
            for (var g = 0; g < this.numActions(); g++) {
                var guard = new Game_Action(this);
                guard.setGuard();
                this.setAction(g, guard);
            }
            this.setActionState('waiting');
            return;
        }
        var weights = this.aiSkillWeights();
        if (!weights) {
            _Game_Actor_makeAutoBattleActions.call(this);
            return;
        }
        for (var i = 0; i < this.numActions(); i++) {
            var usable = weights.filter(function(e) {
                return this.canUse($dataSkills[e.skillId]);
            }, this);
            var action = new Game_Action(this);
            if (usable.length > 0) {
                var total = usable.reduce(function(sum, e) { return sum + e.weight; }, 0);
                var roll = Math.random() * total;
                var pick = usable[usable.length - 1];
                for (var j = 0; j < usable.length; j++) {
                    roll -= usable[j].weight;
                    if (roll < 0) {
                        pick = usable[j];
                        break;
                    }
                }
                action.setSkill(pick.skillId);
                action.decideRandomTarget();
            } else {
                action.setGuard();
            }
            this.setAction(i, action);
        }
        this.setActionState('waiting');
    };

    //-------------------------------------------------------------------------
    // Windows
    //-------------------------------------------------------------------------

    // The party status window shows regular members only; the target list
    // (healing, revival) still includes pseudo members.
    Window_BattleStatus.prototype.maxItems = function() {
        return $gameParty.regularBattleMembers().length;
    };

    Window_BattleActor.prototype.maxItems = function() {
        return $gameParty.battleMembers().length;
    };

    function Window_PseudoStatus() {
        this.initialize.apply(this, arguments);
    }

    Window_PseudoStatus.prototype = Object.create(Window_Base.prototype);
    Window_PseudoStatus.prototype.constructor = Window_PseudoStatus;

    Window_PseudoStatus.prototype.initialize = function(x, y, width) {
        Window_Base.prototype.initialize.call(this, x, y, width, this.fittingHeight(1));
        this._signature = '';
        this.opacity = 192;
    };

    Window_PseudoStatus.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        var members = $gameParty.pseudoBattleMembers();
        var scene = SceneManager._scene;
        var listOpen = ['_skillWindow', '_itemWindow', '_swapWindow', '_reserveWindow'].some(function(name) {
            return scene && scene[name] && scene[name].visible;
        });
        this.visible = members.length > 0 && !$gameMessage.isBusy() && !listOpen;
        var actor = members[0];
        var sig = actor ? [actor.hp, actor.mhp, actor.states().map(function(s) { return s.id; }).join()].join('|') : '';
        if (sig !== this._signature) {
            this._signature = sig;
            this.contents.clear();
            if (actor) {
                var w = this.contentsWidth();
                this.drawActorName(actor, 0, 0, 120);
                this.drawActorIcons(actor, 124, 0, 64);
                this.drawActorHp(actor, 192, 0, w - 192);
            }
        }
    };

    $.Window_PseudoStatus = Window_PseudoStatus;

    var _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        _Scene_Battle_createAllWindows.call(this);
        var width = 360;
        var win = new Window_PseudoStatus(Graphics.boxWidth - width - (this._turnOrderWindow ? this._turnOrderWindow.width : 0),
            this._statusWindow.y, width);
        win.y = this._statusWindow.y - win.height;
        this._pseudoStatusWindow = win;
        this.addWindow(win);
    };

})(SmokingIsle.PseudoMember);
