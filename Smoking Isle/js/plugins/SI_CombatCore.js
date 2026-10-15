//=============================================================================
// SI_CombatCore.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle core combat: weapon moves, Punch, and Fatigue.
 * @author Smoking Isle
 *
 * @param Defense Scale
 * @type number
 * @min 1
 * @desc Armor curve for physDamage/magDamage: defense equal to this
 * value halves damage. Lower = armor matters more.
 * @default 20
 *
 * @param Weary State
 * @type state
 * @desc State applied when Fatigue reaches its maximum.
 * @default 11
 *
 * @param Weary Recovery
 * @type number
 * @min 0
 * @max 100
 * @desc Weary is removed once Fatigue drops below this value.
 * @default 50
 *
 * @param Fatigue From Damage
 * @type boolean
 * @desc Whether taking damage adds Fatigue (MV's default TP behaviour).
 * @default false
 *
 * @param Recover All Clears Fatigue
 * @type boolean
 * @desc Whether "Recover All" (inns, events) also resets Fatigue to 0.
 * @default true
 *
 * @param Hide Unusable Moves In Battle
 * @type boolean
 * @desc Hide skills the equipped weapon can't perform from the battle
 * skill list. They always show (greyed out) in the menu.
 * @default true
 *
 * @help
 * ============================================================================
 * Weapon Moves
 * ============================================================================
 * Skills can require a "move" that the character's equipment must allow.
 * A character must both know the skill and have a matching move.
 *
 * Weapon / armor / actor / class / state note:
 *   <Moves: jab, slash>
 *
 * Skill note (any one of the listed moves is enough):
 *   <Requires Move: jab>
 *   <Requires Move: jab, thrust>
 *
 * Moves are case-insensitive. A skill without <Requires Move> is unaffected.
 *
 * ============================================================================
 * Punch
 * ============================================================================
 * Skill #1 (the Attack command) is the Punch. Use a.unarmedAtk() in its
 * damage formula: the battler's ATK without any weapon bonuses, so weapons
 * never make punches stronger.
 *
 * ============================================================================
 * Damage formulas
 * ============================================================================
 * Use these in skill damage formulas instead of subtracting defense, so
 * armor reduces damage by a percentage and never to zero:
 *   a.physDamage(b, 1.0)   a.atk x 1.0, reduced by b.def
 *   a.magDamage(b, 1.5)    a.mat x 1.5, reduced by b.mdf
 * Reduction = Defense Scale / (Defense Scale + defense): with the default
 * 20, DEF 10 lets 67% through, DEF 20 lets 50% through.
 * The Punch uses a.unarmedPhysDamage(b, 0.5) (ignores weapon ATK).
 *
 * ============================================================================
 * Fatigue (replaces TP)
 * ============================================================================
 * - Fatigue carries over between battles and starts at 0 for enemies.
 * - A skill or item adds Fatigue once per use, not per target. The amount is
 *   the "TP Gain" field, or the note tag below if present:
 *     <Fatigue: 15>     adds 15 Fatigue
 *     <Fatigue: -30>    removes 30 Fatigue (Rest skills, items)
 *   Positive Fatigue is multiplied by the "TP Charge Rate" trait, so a
 *   character with TCR 150% tires 50% faster.
 * - Reaching maximum Fatigue applies the Weary state. Set up Weary in the
 *   database to seal the skill types (and the Punch) a tired character can't
 *   use. It is removed when Fatigue falls below the Weary Recovery value.
 * - "TP Cost" is not used by this system; leave it at 0.
 * - A negative "TP Regeneration" trait recovers Fatigue every turn.
 * - <No Fatigue> (actor, class, equipment or state note): Fatigue always
 *   stays at 0 (the Ghost has no body to tire).
 *
 * More Fatigue note tags:
 *   <Fatigue: -15 to -20>       (skill/item) a random amount in that range
 *   <Fatigue Above: 85>         (skill) only usable while Fatigue is above 85
 *   <Not While Weary>           (skill) can't be used while Weary
 *   <Physical Fatigue Rate: 130>  (actor/class) physical skills and Punch
 *                                 cost this % of their Fatigue
 *   <Outdoor Rest: 1>           (actor/class) sheds 1 Fatigue per turn in
 *   <Indoor Rest: 1>            battle outdoors / indoors. A map is indoors
 *                               when its note contains <Indoors>.
 *   <Fatigue Per Turn: 2>       (armor/weapon/state) adds 2 Fatigue per turn
 *                               in battle (heavy bronze), unless the wearer
 *                               knows a skill with <Armor Training>.
 */

var Imported = Imported || {};
Imported.SI_CombatCore = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Combat = SmokingIsle.Combat || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_CombatCore');
    $.defenseScale = Number(params['Defense Scale'] || 20);
    $.wearyStateId = Number(params['Weary State'] || 0);
    $.wearyRecovery = Number(params['Weary Recovery'] || 50);
    $.fatigueFromDamage = params['Fatigue From Damage'] === 'true';
    $.recoverAllClearsFatigue = params['Recover All Clears Fatigue'] !== 'false';
    $.hideMovesInBattle = params['Hide Unusable Moves In Battle'] !== 'false';

    //-------------------------------------------------------------------------
    // Note tags
    //-------------------------------------------------------------------------

    $.parseList = function(text) {
        return text.split(',').map(function(s) {
            return s.trim().toLowerCase();
        }).filter(function(s) {
            return s.length > 0;
        });
    };

    $.parseNotes = function(obj) {
        var moves = /<Moves:\s*([^>]*)>/i.exec(obj.note);
        var required = /<Requires Move:\s*([^>]*)>/i.exec(obj.note);
        var fatigue = /<Fatigue:\s*(-?\d+)>/i.exec(obj.note);
        var range = /<Fatigue:\s*(-?\d+)\s*(?:to|~)\s*(-?\d+)>/i.exec(obj.note);
        var above = /<Fatigue Above:\s*(\d+)>/i.exec(obj.note);
        obj.siMoves = moves ? $.parseList(moves[1]) : [];
        obj.siRequiredMoves = required ? $.parseList(required[1]) : [];
        obj.siFatigue = fatigue ? Number(fatigue[1]) : (obj.tpGain || 0);
        obj.siFatigueRange = range ? [Math.min(Number(range[1]), Number(range[2])), Math.max(Number(range[1]), Number(range[2]))] : null;
        obj.siFatigueAbove = above ? Number(above[1]) : null;
        obj.siNotWhileWeary = /<Not While Weary>/i.test(obj.note);
        obj.siArmorTraining = /<Armor Training>/i.test(obj.note);
        var pfr = /<Physical Fatigue Rate:\s*(\d+)>/i.exec(obj.note);
        var outdoor = /<Outdoor Rest:\s*(\d+)>/i.exec(obj.note);
        var indoor = /<Indoor Rest:\s*(\d+)>/i.exec(obj.note);
        var perTurn = /<Fatigue Per Turn:\s*(\d+)>/i.exec(obj.note);
        obj.siPhysicalFatigueRate = pfr ? Number(pfr[1]) / 100 : null;
        obj.siOutdoorRest = outdoor ? Number(outdoor[1]) : 0;
        obj.siIndoorRest = indoor ? Number(indoor[1]) : 0;
        obj.siFatiguePerTurn = perTurn ? Number(perTurn[1]) : 0;
    };

    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        if (!_DataManager_isDatabaseLoaded.call(this)) return false;
        if (!$._notesParsed) {
            [$dataActors, $dataClasses, $dataSkills, $dataItems, $dataWeapons,
                $dataArmors, $dataStates].forEach(function(list) {
                list.forEach(function(obj) {
                    if (obj) $.parseNotes(obj);
                });
            });
            $._notesParsed = true;
        }
        return true;
    };

    //-------------------------------------------------------------------------
    // Weapon moves
    //-------------------------------------------------------------------------

    Game_BattlerBase.prototype.availableMoves = function() {
        var moves = [];
        this.traitObjects().forEach(function(obj) {
            if (obj && obj.siMoves) {
                obj.siMoves.forEach(function(move) {
                    if (moves.indexOf(move) < 0) moves.push(move);
                });
            }
        });
        return moves;
    };

    Game_BattlerBase.prototype.hasRequiredMove = function(skill) {
        var required = skill.siRequiredMoves || [];
        if (required.length === 0 || this.isEnemy()) return true;
        var moves = this.availableMoves();
        return required.some(function(move) {
            return moves.indexOf(move) >= 0;
        });
    };

    var _Game_BattlerBase_meetsSkillConditions = Game_BattlerBase.prototype.meetsSkillConditions;
    Game_BattlerBase.prototype.meetsSkillConditions = function(skill) {
        return _Game_BattlerBase_meetsSkillConditions.call(this, skill) &&
            this.hasRequiredMove(skill) && this.meetsFatigueConditions(skill);
    };

    Game_BattlerBase.prototype.meetsFatigueConditions = function(skill) {
        if (skill.siFatigueAbove !== null && skill.siFatigueAbove !== undefined &&
                !(this.tp > skill.siFatigueAbove)) {
            return false;
        }
        if (skill.siNotWhileWeary && $.wearyStateId > 0 && this.isStateAffected($.wearyStateId)) {
            return false;
        }
        return true;
    };

    var _Window_SkillList_includes = Window_SkillList.prototype.includes;
    Window_SkillList.prototype.includes = function(item) {
        if (!_Window_SkillList_includes.call(this, item)) return false;
        if ($.hideMovesInBattle && $gameParty.inBattle() && this._actor) {
            return this._actor.hasRequiredMove(item);
        }
        return true;
    };

    //-------------------------------------------------------------------------
    // Punch
    //-------------------------------------------------------------------------

    Game_BattlerBase.prototype.unarmedAtk = function() {
        return this.atk;
    };

    Game_Actor.prototype.unarmedAtk = function() {
        var weaponAtk = this.weapons().reduce(function(sum, weapon) {
            return sum + weapon.params[2];
        }, 0);
        return Math.max(this.atk - weaponAtk, 1);
    };

    //-------------------------------------------------------------------------
    // Damage helpers
    //-------------------------------------------------------------------------

    $.reduce = function(power, defense) {
        return power * $.defenseScale / ($.defenseScale + Math.max(defense, 0));
    };

    Game_BattlerBase.prototype.physDamage = function(target, rate) {
        return $.reduce(this.atk * rate, target.def);
    };

    Game_BattlerBase.prototype.magDamage = function(target, rate) {
        return $.reduce(this.mat * rate, target.mdf);
    };

    Game_BattlerBase.prototype.unarmedPhysDamage = function(target, rate) {
        return $.reduce(this.unarmedAtk() * rate, target.def);
    };

    //-------------------------------------------------------------------------
    // Fatigue
    //-------------------------------------------------------------------------

    Game_BattlerBase.prototype.fatigue = function() {
        return this.tp;
    };

    Game_Battler.prototype.gainFatigue = function(value, item) {
        if (value > 0) {
            if (item && this.isActor() && $.isPhysicalAction(this, item)) {
                value *= this.physicalFatigueRate();
            }
            value = value * this.tcr;   // fractions kept; shown rounded down
        }
        if (value !== 0) this.gainSilentTp(value);
    };

    $.isPhysicalAction = function(battler, item) {
        return DataManager.isSkill(item) && (item.stypeId === 2 || item.id === battler.attackSkillId());
    };

    // Highest <Physical Fatigue Rate> among the actor's trait objects (actor, class, gear, states).
    Game_Actor.prototype.physicalFatigueRate = function() {
        return this.traitObjects().reduce(function(rate, obj) {
            return obj && obj.siPhysicalFatigueRate ? Math.max(rate, obj.siPhysicalFatigueRate) : rate;
        }, 1);
    };

    $.isIndoors = function() {
        return !!($dataMap && /<Indoors>/i.test($dataMap.note || ''));
    };

    Game_Actor.prototype.hasArmorTraining = function() {
        return this.skills().some(function(skill) { return skill.siArmorTraining; });
    };

    // Per-turn Fatigue changes in battle (on the battler's own turn).
    Game_Actor.prototype.turnFatigueChange = function() {
        var change = 0;
        var indoors = $.isIndoors();
        var training = this.hasArmorTraining();
        this.traitObjects().forEach(function(obj) {
            if (!obj) return;
            change -= indoors ? (obj.siIndoorRest || 0) : (obj.siOutdoorRest || 0);
            if (!training && (DataManager.isArmor(obj) || DataManager.isWeapon(obj))) {
                change += obj.siFatiguePerTurn || 0;
            } else if (!DataManager.isArmor(obj) && !DataManager.isWeapon(obj)) {
                change += obj.siFatiguePerTurn || 0;
            }
        });
        return change;
    };

    var _Game_Battler_onTurnEnd = Game_Battler.prototype.onTurnEnd;
    Game_Battler.prototype.onTurnEnd = function() {
        _Game_Battler_onTurnEnd.call(this);
        if (this.isActor() && this.isAlive() && $gameParty.inBattle()) {
            var change = this.turnFatigueChange();
            if (change !== 0) this.gainFatigue(change);
        }
    };

    Game_Battler.prototype.isWeary = function() {
        return $.wearyStateId > 0 && this.isStateAffected($.wearyStateId);
    };

    Game_Battler.prototype.updateWeary = function() {
        if ($.wearyStateId <= 0 || !this.isAlive()) return;
        if (!this.isWeary() && this.tp >= this.maxTp()) {
            this.addState($.wearyStateId);
        } else if (this.isWeary() && this.tp < $.wearyRecovery) {
            this.removeState($.wearyStateId);
        }
    };

    Game_BattlerBase.prototype.hasNoFatigue = function() {
        return this.traitObjects().some(function(obj) {
            return obj && /<No Fatigue>/i.test(obj.note);
        });
    };

    Game_Battler.prototype.setTp = function(tp) {
        if (this.hasNoFatigue()) tp = 0;
        Game_BattlerBase.prototype.setTp.call(this, tp);
        this.updateWeary();
    };

    var _Game_Battler_revive = Game_Battler.prototype.revive;
    Game_Battler.prototype.revive = function() {
        _Game_Battler_revive.call(this);
        this.updateWeary();
    };

    // Fatigue is charged once per use instead of once per target hit.
    Game_Action.prototype.applyItemUserEffect = function(target) {
    };

    var _Game_Battler_useItem = Game_Battler.prototype.useItem;
    Game_Battler.prototype.useItem = function(item) {
        _Game_Battler_useItem.call(this, item);
        if (item && item.siFatigueRange) {
            var r = item.siFatigueRange;
            this.gainFatigue(r[0] + Math.randomInt(r[1] - r[0] + 1), item);
        } else if (item && item.siFatigue) {
            this.gainFatigue(item.siFatigue, item);
        }
    };

    var _Game_Battler_chargeTpByDamage = Game_Battler.prototype.chargeTpByDamage;
    Game_Battler.prototype.chargeTpByDamage = function(damageRate) {
        if ($.fatigueFromDamage) {
            _Game_Battler_chargeTpByDamage.call(this, damageRate);
        }
    };

    // Actors keep Fatigue between battles; enemies start fresh.
    var _Game_BattlerBase_isPreserveTp = Game_BattlerBase.prototype.isPreserveTp;
    Game_BattlerBase.prototype.isPreserveTp = function() {
        return this.isActor() || _Game_BattlerBase_isPreserveTp.call(this);
    };

    Game_Battler.prototype.initTp = function() {
        this.setTp(0);
    };

    // Fatigue can be fractional (e.g. party switching); show it as a whole number.
    Window_Base.prototype.drawActorTp = function(actor, x, y, width) {
        width = width || 96;
        this.drawGauge(x, y, width, actor.tpRate(), this.tpGaugeColor1(), this.tpGaugeColor2());
        this.changeTextColor(this.systemColor());
        this.drawText(TextManager.tpA, x, y, 44);
        this.changeTextColor(this.tpColor(actor));
        this.drawText(Math.floor(actor.tp), x + width - 64, y, 64, 'right');
    };

    var _Game_BattlerBase_recoverAll = Game_BattlerBase.prototype.recoverAll;
    Game_BattlerBase.prototype.recoverAll = function() {
        _Game_BattlerBase_recoverAll.call(this);
        if ($.recoverAllClearsFatigue) this._tp = 0;
        if (this.updateWeary) this.updateWeary();
    };

})(SmokingIsle.Combat);
