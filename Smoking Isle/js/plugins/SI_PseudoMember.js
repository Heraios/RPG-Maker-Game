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
 * Their own skills:
 *   <AI Priority: user Wet, Sodden>    used first, whenever the condition
 *   <AI Priority: ally Despair, Panicked>   holds (aimed at the ally who
 *                                      needs it, children first)
 * Conditions: "user <states>", "ally <states>", "enemy <kind>" (Talk Type or
 * Tags) and "ally thrown" (an ally has spent a javelin or harpoon throw).
 * Skills left out of <AI Skills> and without <AI Priority> are only ever
 * used when ordered.
 *
 * Commands (e.g. "Heel, Girl!"):
 *   Skill note:  <Pseudo State: 36>   toggles state 36 on the pseudo members
 *                                     in battle. Only usable while one is
 *                                     up. (Scope: The User.)
 *   State note:  <Pseudo Guard>       while they have this state, they only
 *                                     guard (orders still get through).
 *   Skill note:  <Pseudo Order: Ankle Bite>
 *                on their next turn they use that skill, on the enemy the
 *                commander picked (Sic 'Em!). Choices, first that fits:
 *                <Pseudo Order: Alarm Bark if ally Sleep | Howl if enemy spirit | Growl>
 *                If nothing fits, they act on their own.
 *   Commands cost half a turn (Turn Cost 50) unless the skill names its own
 *   <Turn Cost>.
 *
 * In battle they:
 * - act on their own turns (they appear in the Turn Order),
 * - can be targeted by enemies, and by healing and revival,
 * - are shown in the Allies strip beside the party cards (SI_BattleHud),
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

    // Commands to an ally cost half a turn unless the skill says otherwise.
    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        if (!_DataManager_isDatabaseLoaded.call(this)) return false;
        if (!$._commandCostsSet) {
            $dataSkills.forEach(function(skill) {
                if (skill && ($.commandState(skill) || /<Pseudo Order:/i.test(skill.note || '')) && !/<Turn Cost:/i.test(skill.note || '')) {
                    skill.siTurnCost = 50;
                }
            });
            $._commandCostsSet = true;
        }
        return true;
    };

    var _Game_BattlerBase_meetsSkillConditions = Game_BattlerBase.prototype.meetsSkillConditions;
    Game_BattlerBase.prototype.meetsSkillConditions = function(skill) {
        if (!_Game_BattlerBase_meetsSkillConditions.call(this, skill)) return false;
        var command = $.commandState(skill) || /<Pseudo Order:/i.test(skill.note || '');
        return !command || $.commandTargets().length > 0;
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

    //-------------------------------------------------------------------------
    // Orders and priorities
    //-------------------------------------------------------------------------

    $.skillByName = function(name) {
        name = String(name).trim().toLowerCase();
        return $dataSkills.filter(function(s) { return s && s.name.toLowerCase() === name; })[0] || null;
    };

    // "Alarm Bark if ally Sleep | Howl if enemy spirit | Growl" -> [{skill, cond}]
    $.parseChoices = function(text) {
        return text.split('|').map(function(part) {
            var m = /^\s*(.+?)(?:\s+if\s+(.+))?\s*$/i.exec(part);
            return m ? { skill: $.skillByName(m[1]), cond: m[2] ? m[2].trim() : '' } : null;
        }).filter(function(c) { return c && c.skill; });
    };

    $.orderOf = function(item) {
        var m = item && /<Pseudo Order:\s*([^>]+)>/i.exec(item.note || '');
        return m ? $.parseChoices(m[1]) : null;
    };

    $.hasState = function(battler, names) {
        return names.some(function(n) {
            var id = SmokingIsle.Ailments ? SmokingIsle.Ailments.stateByName(n) : 0;
            return id && battler.isStateAffected(id);
        });
    };

    $.isChild = function(actor) {
        return /<Child>/i.test(actor.actor().note || '');
    };

    // Who a condition points at (empty: it doesn't hold). No condition: everyone fits.
    $.conditionTargets = function(actor, cond) {
        if (!cond) return [actor];
        var m = /^(user|ally|enemy)\s+(.+)$/i.exec(cond);
        if (!m) return [];
        var who = m[1].toLowerCase(), what = m[2].split(',').map(function(w) { return w.trim(); });
        if (who === 'user') return $.hasState(actor, what) ? [actor] : [];
        if (who === 'enemy') {
            var O = SmokingIsle.Outfits;
            return $gameTroop.aliveMembers().filter(function(e) {
                return O && what.some(function(k) { return O.kinds(e).indexOf(k.toLowerCase()) >= 0; });
            });
        }
        var allies = $gameParty.battleMembers().filter(function(a) { return a.isAlive(); });
        var hits = what[0].toLowerCase() === 'thrown'
            ? allies.filter(function(a) { return a.spentAmmoKey && a.spentAmmoKey('throw'); })
            : allies.filter(function(a) { return $.hasState(a, what); });
        return hits.filter($.isChild).concat(hits.filter(function(a) { return !$.isChild(a); }));
    };

    // An action for a skill, aimed at the condition's target or the commander's pick.
    $.actionFor = function(actor, skill, targets, enemyIndex) {
        if (!actor.canUse(skill)) return null;
        var action = new Game_Action(actor);
        action.setSkill(skill.id);
        if (action.isForOpponent() && enemyIndex >= 0 && $gameTroop.members()[enemyIndex] &&
            $gameTroop.members()[enemyIndex].isAlive()) {
            action.setTarget(enemyIndex);
        } else if (action.isForFriend() && targets.length && targets[0].isActor()) {
            action.setTarget($gameParty.battleMembers().indexOf(targets[0]));
        } else if (action.isForOpponent() && targets.length && targets[0].isEnemy()) {
            action.setTarget(targets[0].index());
        } else {
            action.decideRandomTarget();
        }
        return action;
    };

    // A pending order, else an <AI Priority> skill whose condition holds.
    Game_Actor.prototype.pseudoPlannedAction = function() {
        var order = this._siOrder;
        this._siOrder = null;
        if (order) {
            var choices = $.parseChoices(order.text);
            for (var i = 0; i < choices.length; i++) {
                var targets = $.conditionTargets(this, choices[i].cond);
                var action = targets.length ? $.actionFor(this, choices[i].skill, targets, order.enemyIndex) : null;
                if (action) return action;
            }
        }
        if (this.isPseudoGuarding()) return null;
        var skills = this.skills().filter(function(s) { return /<AI Priority:/i.test(s.note || ''); });
        for (var j = 0; j < skills.length; j++) {
            var cond = /<AI Priority:\s*([^>]+)>/i.exec(skills[j].note)[1];
            var hits = $.conditionTargets(this, cond.trim());
            var act = hits.length ? $.actionFor(this, skills[j], hits, -1) : null;
            if (act) return act;
        }
        return null;
    };

    // Giving an order: remembered for each pseudo member's next turn.
    var _Game_Action_applyOrder = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _Game_Action_applyOrder.call(this, target);
        var m = this.item() && /<Pseudo Order:\s*([^>]+)>/i.exec(this.item().note || '');
        if (!m) return;
        var enemyIndex = target.isEnemy() ? target.index() : -1;
        $.commandTargets().forEach(function(member) {
            member._siOrder = { text: m[1], enemyIndex: enemyIndex };
        });
        target.result().success = true;
    };

    var _Game_Battler_onBattleStartOrder = Game_Battler.prototype.onBattleStart;
    Game_Battler.prototype.onBattleStart = function() {
        _Game_Battler_onBattleStartOrder.call(this);
        this._siOrder = null;
    };

    Game_Actor.prototype.isPseudoGuarding = function() {
        return this.states().some(function(state) {
            return /<Pseudo Guard>/i.test(state.note || '');
        });
    };

    var _Game_Actor_makeAutoBattleActions = Game_Actor.prototype.makeAutoBattleActions;
    Game_Actor.prototype.makeAutoBattleActions = function() {
        var planned = this.isPseudoMember() ? this.pseudoPlannedAction() : null;
        if (planned) {
            this.clearActions();
            this.setAction(0, planned);
            this.setActionState('waiting');
            return;
        }
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

})(SmokingIsle.PseudoMember);
