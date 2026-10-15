//=============================================================================
// SI_Ailments.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: mental states, weapon skill extras, and Yoon's spirit skills.
 * @author Smoking Isle
 *
 * @param Hesitate Message
 * @desc %1 = battler. Shown when a state makes them lose their turn.
 * @default %1 hesitates and does nothing.
 *
 * @param Flee Message
 * @desc %1 = enemy. Shown when a state makes an enemy flee.
 * @default %1 flees in terror!
 *
 * @param Bleed State
 * @type state
 * @desc State inflicted by <Bleed Chance> equipment.
 * @default 28
 *
 * @help
 * Requires SI_CombatCore, SI_TurnOrder, SI_ElementalStates and SI_Insight
 * (place below them).
 *
 * ============================================================================
 * State notes
 * ============================================================================
 *   <Hesitate: 25>      25% chance each turn to do nothing
 *   <Flee: 10>          (enemies) 10% chance each turn to flee the battle
 *   <Mental Ward>       a mental ailment that would land removes this
 *                       state instead (Calm)
 *   <Cures Mental>      removes mental ailments when applied and at the end
 *                       of each turn (Happy)
 *   <Guaranteed Crit>   the next damaging attack is a critical; removed
 *                       after it (Focused)
 * Mental ailments are the "Mental States" set on SI_Insight.
 *
 * ============================================================================
 * Skill notes
 * ============================================================================
 *   <Crit Bonus: 25>             +25% critical chance (Vital Strike)
 *   <Cleave>                     also hits an enemy next to the target
 *   <Requires All Moves: a, b>   needs every listed move (Conducting Edge:
 *                                metal, voltaic)
 *   <Spirit Surge>               removes every elemental state from the target,
 *                                leaving the matching one-turn removal states;
 *                                removing a second tier grants an extra turn
 *   <Spirit Writhe>              upgrades every base elemental state on the
 *                                target to its second tier
 * Damage formulas can use b.elementalCount(): how many elemental states
 * (base or upgraded) the target has (Infernal Surge).
 *
 * ============================================================================
 * Equipment notes
 * ============================================================================
 *   <Bleed Chance: 50>   physical hits by the wearer may inflict the
 *                        Bleed State (e.g. Dama's harpoon)
 */

var Imported = Imported || {};
Imported.SI_Ailments = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Ailments = SmokingIsle.Ailments || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_Ailments');
    $.hesitateMessage = String(params['Hesitate Message'] || '%1 hesitates and does nothing.');
    $.fleeMessage = String(params['Flee Message'] || '%1 flees in terror!');
    $.bleedStateId = Number(params['Bleed State'] || 28);

    var E = SmokingIsle.ElementalStates;

    //-------------------------------------------------------------------------
    // Note tags
    //-------------------------------------------------------------------------

    $.num = function(note, tag) {
        var m = new RegExp('<' + tag + ':\\s*(\\d+)>', 'i').exec(note || '');
        return m ? Number(m[1]) : 0;
    };

    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        if (!_DataManager_isDatabaseLoaded.call(this)) return false;
        if (!$._notesParsed) {
            $dataStates.forEach(function(s) {
                if (!s) return;
                s.siHesitate = $.num(s.note, 'Hesitate');
                s.siFlee = $.num(s.note, 'Flee');
                s.siMentalWard = /<Mental Ward>/i.test(s.note);
                s.siCuresMental = /<Cures Mental>/i.test(s.note);
                s.siGuaranteedCrit = /<Guaranteed Crit>/i.test(s.note);
            });
            $dataSkills.forEach(function(s) {
                if (!s) return;
                s.siCritBonus = $.num(s.note, 'Crit Bonus') / 100;
                s.siCleave = /<Cleave>/i.test(s.note);
                s.siSpiritSurge = /<Spirit Surge>/i.test(s.note);
                s.siSpiritWrithe = /<Spirit Writhe>/i.test(s.note);
                var all = /<Requires All Moves:\s*([^>]*)>/i.exec(s.note);
                s.siRequiredAllMoves = all ? SmokingIsle.Combat.parseList(all[1]) : [];
            });
            [$dataWeapons, $dataArmors].forEach(function(list) {
                list.forEach(function(obj) { if (obj) obj.siBleedChance = $.num(obj.note, 'Bleed Chance'); });
            });
            $._notesParsed = true;
        }
        return true;
    };

    $.mentalStates = function() {
        return SmokingIsle.Insight ? SmokingIsle.Insight.mentalStates : [];
    };

    $.isMental = function(stateId) {
        return $.mentalStates().indexOf(stateId) >= 0;
    };

    //-------------------------------------------------------------------------
    // Hesitating and fleeing
    //-------------------------------------------------------------------------

    var _BattleManager_ctbShouldSkipTurn = BattleManager.ctbShouldSkipTurn;
    BattleManager.ctbShouldSkipTurn = function(battler) {
        var states = battler.states();
        var flee = states.reduce(function(m, s) { return Math.max(m, s.siFlee || 0); }, 0);
        if (battler.isEnemy() && flee > 0 && Math.random() * 100 < flee) {
            this._logWindow.push('addText', $.fleeMessage.format(battler.name()));
            this._logWindow.push('wait');
            battler.escape();
            return true;
        }
        var hesitate = states.reduce(function(m, s) { return Math.max(m, s.siHesitate || 0); }, 0);
        if (hesitate > 0 && Math.random() * 100 < hesitate) {
            this._logWindow.push('addText', $.hesitateMessage.format(battler.name()));
            this._logWindow.push('wait');
            return true;
        }
        return _BattleManager_ctbShouldSkipTurn.call(this, battler);
    };

    //-------------------------------------------------------------------------
    // Calm (ward) and Happy (cure)
    //-------------------------------------------------------------------------

    var _Game_Battler_addState = Game_Battler.prototype.addState;
    Game_Battler.prototype.addState = function(stateId) {
        if ($.isMental(stateId) && this.isStateAddable(stateId)) {
            var ward = this.states().filter(function(s) { return s.siMentalWard; })[0];
            if (ward) {
                this.removeState(ward.id);
                return;
            }
            if (this.states().some(function(s) { return s.siCuresMental; })) return;
        }
        _Game_Battler_addState.call(this, stateId);
        var added = $dataStates[stateId];
        if (added && added.siCuresMental && this.isStateAffected(stateId)) this.cureMentalAilments();
    };

    Game_Battler.prototype.cureMentalAilments = function() {
        this.states().forEach(function(s) {
            if ($.isMental(s.id)) this.removeState(s.id);
        }, this);
    };

    var _Game_Battler_onTurnEnd = Game_Battler.prototype.onTurnEnd;
    Game_Battler.prototype.onTurnEnd = function() {
        _Game_Battler_onTurnEnd.call(this);
        if (this.states().some(function(s) { return s.siCuresMental; })) this.cureMentalAilments();
    };

    //-------------------------------------------------------------------------
    // Criticals: Focused, Crit Bonus
    //-------------------------------------------------------------------------

    $.focusedState = function(battler) {
        return battler.states().filter(function(s) { return s.siGuaranteedCrit; })[0] || null;
    };

    var _Game_Action_itemCri = Game_Action.prototype.itemCri;
    Game_Action.prototype.itemCri = function(target) {
        var item = this.item();
        if (!item.damage.critical) return 0;
        if ($.focusedState(this.subject()) && this.isDamage()) return 1;
        return _Game_Action_itemCri.call(this, target) + (item.siCritBonus || 0);
    };

    var _BattleManager_endAction = BattleManager.endAction;
    BattleManager.endAction = function() {
        var subject = this._subject;
        if (subject && this._action && this._action.isDamage() && this._action.item().damage.critical) {
            var focused = $.focusedState(subject);
            if (focused) subject.removeState(focused.id);
        }
        _BattleManager_endAction.call(this);
    };

    //-------------------------------------------------------------------------
    // Move requirements (all of)
    //-------------------------------------------------------------------------

    var _Game_BattlerBase_meetsSkillConditions = Game_BattlerBase.prototype.meetsSkillConditions;
    Game_BattlerBase.prototype.meetsSkillConditions = function(skill) {
        if (!_Game_BattlerBase_meetsSkillConditions.call(this, skill)) return false;
        var all = skill.siRequiredAllMoves || [];
        if (all.length === 0 || this.isEnemy()) return true;
        var moves = this.availableMoves();
        return all.every(function(m) { return moves.indexOf(m) >= 0; });
    };

    var _Window_SkillList_includes = Window_SkillList.prototype.includes;
    Window_SkillList.prototype.includes = function(item) {
        if (!_Window_SkillList_includes.call(this, item)) return false;
        var all = item && item.siRequiredAllMoves || [];
        if (all.length > 0 && $gameParty.inBattle() && this._actor && SmokingIsle.Combat.hideMovesInBattle) {
            var moves = this._actor.availableMoves();
            return all.every(function(m) { return moves.indexOf(m) >= 0; });
        }
        return true;
    };

    //-------------------------------------------------------------------------
    // Cleave
    //-------------------------------------------------------------------------

    var _Game_Action_targetsForOpponents = Game_Action.prototype.targetsForOpponents;
    Game_Action.prototype.targetsForOpponents = function() {
        var targets = _Game_Action_targetsForOpponents.call(this);
        if (this.item() && this.item().siCleave && targets.length === 1) {
            var members = this.opponentsUnit().members();
            var i = members.indexOf(targets[0]);
            var near = [members[i + 1], members[i - 1]].filter(function(m) {
                return m && m.isAlive();
            })[0];
            if (near) targets.push(near);
        }
        return targets;
    };

    //-------------------------------------------------------------------------
    // Bleed from equipment; Spirit Surge and Writhe
    //-------------------------------------------------------------------------

    Game_Battler.prototype.elementalCount = function() {
        var S = E.S;
        return ['smoldering', 'enflamed', 'wet', 'sodden', 'burdened', 'mired', 'disoriented', 'feverish']
            .filter(function(n) { return this.isStateAffected(S[n]); }, this).length;
    };

    // Family -> the removal state left behind when it's purged.
    $.PURGE = { smoldering: 'steam', wet: 'chilled', burdened: 'cracked', disoriented: 'grounded' };

    $.spiritSurge = function(target) {
        var S = E.S, extra = false;
        Object.keys($.PURGE).forEach(function(base) {
            var up = E.UPGRADE[base];
            if (target.isStateAffected(S[base]) || target.isStateAffected(S[up])) {
                if (target.isStateAffected(S[up])) extra = true;
                target.removeState(S[base]);
                target.removeState(S[up]);
                target.addState(S[$.PURGE[base]]);
            }
        });
        return extra;
    };

    $.spiritWrithe = function(target) {
        var S = E.S;
        Object.keys(E.UPGRADE).forEach(function(base) {
            if (target.isStateAffected(S[base])) {
                target.removeState(S[base]);
                target.addState(S[E.UPGRADE[base]]);
            }
        });
    };

    var _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _Game_Action_apply.call(this, target);
        var item = this.item();
        var result = target.result();
        if (!item || !result.isHit() || !target.isAlive()) return;
        if (item.siSpiritSurge && $.spiritSurge(target)) this.subject()._siExtraTurn = true;
        if (item.siSpiritWrithe) $.spiritWrithe(target);
        var subject = this.subject();
        if (subject.isActor() && this.isPhysical() && this.isDamage() && result.hpDamage > 0) {
            var chance = subject.equips().reduce(function(m, eq) {
                return eq ? Math.max(m, eq.siBleedChance || 0) : m;
            }, 0);
            if (chance > 0 && Math.random() * 100 < chance * target.stateRate($.bleedStateId)) {
                target.addState($.bleedStateId);
            }
        }
    };

})(SmokingIsle.Ailments);
