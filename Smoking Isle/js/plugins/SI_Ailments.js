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
 * @default 116
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
 *   <Expires Into Knockout: %1 turns to salt!>
 *                       if this state runs out on its own (not cured), the
 *                       battler is knocked out, with this line (Salting,
 *                       Dragged Below)
 *   <Released When Inflicter Hit>
 *                       hitting whoever inflicted it (any HP damage) ends it
 *                       (Dragged Below: hit the hound to pull them free)
 *   <Cured By Water>    any water-sourced hit or item removes it (Salting)
 *   <Ward>              blocks the next damaging hit completely, then breaks
 *                       (Resin, from Dragon's Blood)
 *   <Mental Ward>       a mental ailment that would land removes this
 *                       state instead (Calm)
 *   <Cures Mental>      removes mental ailments when applied and at the end
 *                       of each turn (Happy)
 *   <Guaranteed Crit>   the next damaging attack is a critical; removed
 *                       after it (Focused)
 *   <Stacks Into: Disoriented>
 *                       getting this state again while already affected
 *                       turns it into the named state instead (Tipsy)
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
 *   <Battle Start State: Resin>
 *                        the wearer starts every battle with this state
 *                        (the Dragonheart Greatsword)
 *   <Mental Shorten: 1>  mental ailments on the wearer last 1 turn less
 *                        (never under 1)
 *
 * Item or skill note:
 *   <Party Cure: Chilled>   using it also removes that state from the
 *                           user's whole party (Heated Scoria)
 *   <User Cure: Wet, Sodden>  using it removes these from the user
 *                           (Patience's Shake Off)
 *
 * State note:
 *   <Exposed>            the next damaging hit on it from the party is a
 *                        critical, then the state is gone (Patience's Point)
 *   <No Flee>            can't flee or run off while it has this (Hold)
 *   <Lasts Battles: 2>   isn't removed when a battle ends until that many
 *                        battles have ended (Lamplight, from Shearwater Oil).
 *                        Turn the state's "Remove at Battle End" off.
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
    $.bleedStateId = Number(params['Bleed State'] || 116);

    var E = SmokingIsle.ElementalStates;

    //-------------------------------------------------------------------------
    // Note tags
    //-------------------------------------------------------------------------

    $.stateByName = function(name) {
        name = String(name || '').trim().toLowerCase();
        var state = $dataStates.filter(function(st) { return st && st.name.toLowerCase() === name; })[0];
        return state ? state.id : 0;
    };

    $.stateTag = function(note, tag) {
        var m = new RegExp('<' + tag + ':\\s*([^>]+)>', 'i').exec(note || '');
        if (!m) return 0;
        return /^\d+$/.test(m[1].trim()) ? Number(m[1]) : $.stateByName(m[1]);
    };

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
                s.siStacksInto = $.stateTag(s.note, 'Stacks Into');
                s.siLastsBattles = $.num(s.note, 'Lasts Battles');
                s.siExposed = /<Exposed>/i.test(s.note);
                s.siNoFlee = /<No Flee>/i.test(s.note);
            });
            [$dataItems, $dataSkills].forEach(function(list) {
                list.forEach(function(i) {
                    if (!i) return;
                    i.siPartyCure = $.stateTag(i.note, 'Party Cure');
                    var u = /<User Cure:\s*([^>]+)>/i.exec(i.note || '');
                    i.siUserCure = u ? u[1].split(',').map($.stateByName).filter(Boolean) : [];
                });
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
                list.forEach(function(obj) {
                    if (!obj) return;
                    obj.siBleedChance = $.num(obj.note, 'Bleed Chance');
                    obj.siBattleStartState = $.stateTag(obj.note, 'Battle Start State');
                    obj.siMentalShorten = $.num(obj.note, 'Mental Shorten');
                });
            });
            $dataStates.forEach(function(s) {
                if (s) s.siBattleStartState = $.stateTag(s.note, 'Battle Start State');   // set bonuses
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
        if (battler.isEnemy() && flee > 0 && !battler.isHeld() && Math.random() * 100 < flee) {
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
        var stacks = $dataStates[stateId] && $dataStates[stateId].siStacksInto;
        if (stacks && this.isStateAffected(stateId) && this.isStateAddable(stacks)) {
            this.eraseState(stateId);
            this.addState(stacks);
            return;
        }
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

    // Equipment, or a set bonus, that starts every battle with a state (Resin;
    // the Firebrand Gear's soaked felt).
    var _Game_Battler_onBattleStart = Game_Battler.prototype.onBattleStart;
    Game_Battler.prototype.onBattleStart = function() {
        _Game_Battler_onBattleStart.call(this);
        if (!this.isActor()) return;
        this.traitObjects().forEach(function(obj) {
            if (obj && obj.siBattleStartState && !this.isStateAffected(obj.siBattleStartState)) this.addState(obj.siBattleStartState);
        }, this);
        this.clearResult();
    };

    // <Mental Shorten>: mental ailments on the wearer wear off sooner.
    var _Game_BattlerBase_resetStateCounts = Game_BattlerBase.prototype.resetStateCounts;
    Game_BattlerBase.prototype.resetStateCounts = function(stateId) {
        _Game_BattlerBase_resetStateCounts.call(this, stateId);
        if (!this.isActor() || !$.isMental(stateId)) return;
        var cut = this.equips().reduce(function(sum, eq) { return sum + (eq ? eq.siMentalShorten || 0 : 0); }, 0);
        if (cut > 0) this._stateTurns[stateId] = Math.max(this._stateTurns[stateId] - cut, 1);
    };

    // <Party Cure: Chilled>: one use also warms the whole party. <User Cure>: the user only.
    var _Game_Battler_useItem = Game_Battler.prototype.useItem;
    Game_Battler.prototype.useItem = function(item) {
        _Game_Battler_useItem.call(this, item);
        if (!item) return;
        if (item.siPartyCure) {
            this.friendsUnit().aliveMembers().forEach(function(m) { m.removeState(item.siPartyCure); });
        }
        (item.siUserCure || []).forEach(function(id) { this.removeState(id); }, this);
    };

    // <No Flee> (Held): can't flee or run off.
    Game_Battler.prototype.isHeld = function() {
        return this.states().some(function(s) { return s.siNoFlee; });
    };

    // <Exposed> (Pointed Out): the party's next damaging hit is a critical.
    $.exposedState = function(target) {
        return target.states().filter(function(s) { return s.siExposed; })[0] || null;
    };

    var _Game_Action_itemCriExposed = Game_Action.prototype.itemCri;
    Game_Action.prototype.itemCri = function(target) {
        if (this.subject().isActor() && this.item().damage.type === 1 && $.exposedState(target)) return 1;
        return _Game_Action_itemCriExposed.call(this, target);
    };

    var _Game_Action_applyExposed = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        var exposed = this.subject().isActor() && $.exposedState(target);
        _Game_Action_applyExposed.call(this, target);
        if (exposed && target.result().hpDamage > 0) target.removeState(exposed.id);
    };

    // <Lasts Battles: N>: count battles down; removed after the last one.
    var _Game_Battler_addNewState = Game_Battler.prototype.addNewState;
    Game_Battler.prototype.addNewState = function(stateId) {
        _Game_Battler_addNewState.call(this, stateId);
        var st = $dataStates[stateId];
        if (st && st.siLastsBattles) (this._siBattlesLeft = this._siBattlesLeft || {})[stateId] = st.siLastsBattles;
    };

    var _Game_Battler_onBattleEnd = Game_Battler.prototype.onBattleEnd;
    Game_Battler.prototype.onBattleEnd = function() {
        _Game_Battler_onBattleEnd.call(this);
        var left = this._siBattlesLeft || {};
        Object.keys(left).forEach(function(id) {
            id = Number(id);
            if (!this.isStateAffected(id)) { delete left[id]; return; }
            if (--left[id] <= 0) { delete left[id]; this.removeState(id); }
        }, this);
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

    //-------------------------------------------------------------------------
    // States that end badly, states lifted by hitting their source, water cures
    //-------------------------------------------------------------------------

    $.stateTags = function(state) {
        if (!state._siTags) {
            var note = state.note || '';
            var ko = /<Expires Into Knockout:\s*([^>]*)>/i.exec(note);
            state._siTags = {
                expireKO: ko ? ko[1].trim() : null,
                releaseByInflicter: /<Released When Inflicter Hit>/i.test(note),
                curedByWater: /<Cured By Water>/i.test(note),
                ward: /<Ward>/i.test(note)
            };
        }
        return state._siTags;
    };

    var _Game_Battler_removeStatesAuto = Game_Battler.prototype.removeStatesAuto;
    Game_Battler.prototype.removeStatesAuto = function(timing) {
        var doomed = this.states().filter(function(state) {
            return $.stateTags(state).expireKO && state.autoRemovalTiming === timing && this.isStateExpired(state.id);
        }, this);
        _Game_Battler_removeStatesAuto.call(this, timing);
        if (doomed.length > 0 && this.isAlive()) {
            // It didn't wear off; it ran its course. No "wears off" line.
            var removed = this.result().removedStates;
            doomed.forEach(function(state) {
                var i = removed.indexOf(state.id);
                if (i >= 0) removed.splice(i, 1);
            });
            var line = $.stateTags(doomed[0]).expireKO.format(this.name());
            if ($gameParty.inBattle() && BattleManager._logWindow) {
                BattleManager._logWindow.push('addText', line);
                BattleManager._logWindow.push('wait');
            }
            this.addState(this.deathStateId());
            this.performCollapse && this.performCollapse();
        }
    };

    // A ward takes the whole of the next damaging hit, then breaks.
    $.wardState = function(battler) {
        return battler.states().filter(function(st) { return $.stateTags(st).ward; })[0] || null;
    };

    var _Game_Action_makeDamageValue_ward = Game_Action.prototype.makeDamageValue;
    Game_Action.prototype.makeDamageValue = function(target, critical) {
        var value = _Game_Action_makeDamageValue_ward.call(this, target, critical);
        var ward = value > 0 && this.isHpEffect() ? $.wardState(target) : null;
        if (ward) {
            target._siWardBroken = ward.id;
            return 0;
        }
        return value;
    };

    var _Game_Action_apply_states = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        target._siWardBroken = 0;
        _Game_Action_apply_states.call(this, target);
        if (target._siWardBroken) {
            target.removeState(target._siWardBroken);
            target._siWardBroken = 0;
        }
        var subject = this.subject();
        var result = target.result();
        // Remember who inflicted states that can be lifted by hitting them.
        result.addedStates.forEach(function(id) {
            if ($.stateTags($dataStates[id]).releaseByInflicter) {
                target._siInflicter = target._siInflicter || {};
                target._siInflicter[id] = subject;
            }
        });
        // Hitting an inflicter frees its victims.
        if (result.hpDamage > 0) {
            var victims = target.isEnemy() ? $gameParty.members() : $gameTroop.members();
            victims.forEach(function(victim) {
                var map = victim._siInflicter || {};
                Object.keys(map).forEach(function(id) {
                    if (map[id] === target && victim.isStateAffected(Number(id))) {
                        victim.removeState(Number(id));
                        delete map[id];
                        target._siPrankMessages = (target._siPrankMessages || []).concat(['%1 is pulled free!'.format(victim.name())]);
                    }
                });
            });
        }
        // Water washes off what water cures.
        var item = this.item();
        var water = SmokingIsle.DamageTypes ? SmokingIsle.DamageTypes.SOURCE.water : 0;
        if (item && water && item.siSource === water) {
            target.states().forEach(function(state) {
                if ($.stateTags(state).curedByWater) target.removeState(state.id);
            });
        }
    };

})(SmokingIsle.Ailments);
