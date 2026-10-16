//=============================================================================
// SI_ElementalStates.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: the elemental state cycle (inflict, upgrade, remove, extra turns).
 * @author Smoking Isle
 *
 * @param State Ids
 * @desc In order: Smoldering, Enflamed, Wet, Sodden, Burdened, Mired,
 * Disoriented, Feverish, Cracked, Steam, Chilled, Grounded.
 * @default 72,73,74,75,76,77,78,79,80,81,82,83
 *
 * @param Inflict Chance
 * @desc % chance an elemental hit applies its state effects.
 * @default 100
 *
 * @param Feverish Lash Out Chance
 * @desc % chance per turn that a Feverish battler attacks at random.
 * @default 30
 *
 * @param Extra Turn Message
 * @desc %1 = the battler who earned an extra turn.
 * @default %1 seizes the moment!
 *
 * @help
 * Requires SI_TurnOrder and SI_DamageTypes (place below them).
 *
 * A hit from an action with <Source: fire/water/air/earth> (SI_DamageTypes)
 * does, in order:
 *
 *   1. Removes the state it counters (either tier) and applies a one-turn
 *      removal debuff.
 *   2. Upgrades the state it feeds to its second tier.
 *   3. Inflicts its own base state.
 *
 *   Fire:  inflicts Smoldering, upgrades Disoriented -> Feverish,
 *          removes Burdened/Mired -> Cracked
 *   Water: inflicts Wet, upgrades Burdened -> Mired,
 *          removes Smoldering/Enflamed -> Steam
 *   Air:   inflicts Disoriented, upgrades Smoldering -> Enflamed,
 *          removes Wet/Sodden -> Chilled
 *   Earth: inflicts Burdened, upgrades Wet -> Sodden,
 *          removes Disoriented/Feverish -> Grounded
 *
 * Removing a second-tier state gives the attacker an extra turn right away.
 *
 * Exceptions (skill / item note):
 *   <Elemental: water>       use water's rules regardless of <Source>
 *   <No Elemental States>    the source element never applies states
 *   <Inflict: sodden>        directly inflicts states by name (e.g. a
 *                            volcanic acid pot). Several: <Inflict: wet, smoldering>
 *
 * State behaviour beyond its traits:
 *   Enflamed: loses every other turn.
 *   Feverish: sometimes lashes out at a random target instead of acting,
 *             using its own basic attack (an enemy's first physical damaging
 *             action).
 */

var Imported = Imported || {};
Imported.SI_ElementalStates = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.ElementalStates = SmokingIsle.ElementalStates || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_ElementalStates');
    var ids = String(params['State Ids'] || '14,15,16,17,18,19,20,21,22,23,24,25').split(',').map(Number);
    $.S = {
        smoldering: ids[0], enflamed: ids[1], wet: ids[2], sodden: ids[3],
        burdened: ids[4], mired: ids[5], disoriented: ids[6], feverish: ids[7],
        cracked: ids[8], steam: ids[9], chilled: ids[10], grounded: ids[11]
    };
    $.inflictChance = Number(params['Inflict Chance'] || 100);
    $.feverChance = Number(params['Feverish Lash Out Chance'] || 30);
    $.extraTurnMessage = String(params['Extra Turn Message'] || '%1 seizes the moment!');

    // Each base state, its upgraded form.
    $.UPGRADE = { smoldering: 'enflamed', wet: 'sodden', burdened: 'mired', disoriented: 'feverish' };

    $.RULES = {
        fire:  { inflict: 'smoldering',  upgrade: 'disoriented', remove: 'burdened',    leaves: 'cracked' },
        water: { inflict: 'wet',         upgrade: 'burdened',    remove: 'smoldering',  leaves: 'steam' },
        air:   { inflict: 'disoriented', upgrade: 'smoldering',  remove: 'wet',         leaves: 'chilled' },
        earth: { inflict: 'burdened',    upgrade: 'wet',         remove: 'disoriented', leaves: 'grounded' }
    };

    $.SOURCE_NAMES = { air: 'air', water: 'water', earth: 'earth', fire: 'fire' };

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
                    var note = obj.note || '';
                    var el = /<Elemental:\s*(\w+)>/i.exec(note);
                    var src = /<Source:\s*(\w+)>/i.exec(note);
                    var name = el ? el[1].toLowerCase() : (src ? src[1].toLowerCase() : null);
                    obj.siElemental = /<No Elemental States>/i.test(note) ? null : ($.RULES[name] ? name : null);
                    var inf = /<Inflict:\s*([^>]*)>/i.exec(note);
                    obj.siInflict = inf ? inf[1].split(',').map(function(s) {
                        return s.trim().toLowerCase();
                    }).filter(function(s) { return $.S[s]; }) : [];
                });
            });
            $._notesParsed = true;
        }
        return true;
    };

    //-------------------------------------------------------------------------
    // Applying the cycle
    //-------------------------------------------------------------------------

    $.has = function(battler, name) {
        return battler.isStateAffected($.S[name]);
    };

    $.give = function(battler, name) {
        var id = $.S[name];
        if (battler.isStateAffected(id)) {
            battler.resetStateCounts(id);
        } else {
            battler.addState(id);
        }
    };

    // Returns true if a second-tier state was removed (extra turn).
    $.applyElement = function(target, element) {
        var rule = $.RULES[element];
        var removedUpgraded = false;
        var upgradedRemove = $.UPGRADE[rule.remove];
        if ($.has(target, rule.remove) || $.has(target, upgradedRemove)) {
            removedUpgraded = $.has(target, upgradedRemove);
            target.removeState($.S[rule.remove]);
            target.removeState($.S[upgradedRemove]);
            target.addState($.S[rule.leaves]);
        }
        if ($.has(target, rule.upgrade)) {
            target.removeState($.S[rule.upgrade]);
            // An upgrade isn't a recovery: don't show the base state's "wears off" line.
            var removed = target.result().removedStates;
            var i = removed.indexOf($.S[rule.upgrade]);
            if (i >= 0) removed.splice(i, 1);
            $.give(target, $.UPGRADE[rule.upgrade]);
        }
        if (!$.has(target, $.UPGRADE[rule.inflict])) {
            $.give(target, rule.inflict);
        }
        return removedUpgraded;
    };

    var _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _Game_Action_apply.call(this, target);
        var item = this.item();
        if (!item || !$gameParty.inBattle()) return;
        var result = target.result();
        if (!result.isHit() || !target.isAlive()) return;
        if (item.siElemental && Math.random() * 100 < $.inflictChance) {
            if ($.applyElement(target, item.siElemental)) {
                this.subject()._siExtraTurn = true;
            }
        }
        (item.siInflict || []).forEach(function(name) {
            $.give(target, name);
        });
    };

    //-------------------------------------------------------------------------
    // Extra turns
    //-------------------------------------------------------------------------

    var _BattleManager_endTurn = BattleManager.endTurn;
    BattleManager.endTurn = function() {
        var battler = this._ctbActive;
        if (battler && battler._siExtraTurn && battler.isAlive()) {
            this._ctbCost = 0;
            this._logWindow.push('addText', $.extraTurnMessage.format(battler.name()));
            this._logWindow.push('wait');
        }
        if (battler) battler._siExtraTurn = false;
        _BattleManager_endTurn.call(this);
    };

    //-------------------------------------------------------------------------
    // Enflamed: loses every other turn. Feverish: sometimes lashes out.
    //-------------------------------------------------------------------------

    Game_Battler.prototype.onCtbTurnStart = function() {
        this._siFeverTurn = $.has(this, 'feverish') && Math.random() * 100 < $.feverChance;
        if ($.has(this, 'enflamed')) {
            this._siEnflamedSkip = !this._siEnflamedSkip;
        } else {
            this._siEnflamedSkip = false;
        }
    };

    var _BattleManager_ctbShouldSkipTurn = BattleManager.ctbShouldSkipTurn;
    BattleManager.ctbShouldSkipTurn = function(battler) {
        if (battler._siEnflamedSkip) {
            this._logWindow.push('addText', '%1 is wracked by flames!'.format(battler.name()));
            this._logWindow.push('wait');
            return true;
        }
        if (battler._siFeverTurn) {
            this._logWindow.push('addText', '%1 lashes out in a fever!'.format(battler.name()));
            this._logWindow.push('wait');
        }
        return _BattleManager_ctbShouldSkipTurn.call(this, battler);
    };

    // A lashing-out Feverish battler acts as if confused ("attack anyone").
    var _Game_BattlerBase_restriction = Game_BattlerBase.prototype.restriction;
    Game_BattlerBase.prototype.restriction = function() {
        var r = _Game_BattlerBase_restriction.call(this);
        return this._siFeverTurn ? Math.max(r, 2) : r;
    };

    // An enemy lashing out (or confused) swings with its own basic attack:
    // its first physical damaging action, rather than Punch.
    var _Game_Enemy_attackSkillId = Game_Enemy.prototype.attackSkillId;
    Game_Enemy.prototype.attackSkillId = function() {
        var own = this.enemy().actions.map(function(a) {
            return $dataSkills[a.skillId];
        }).filter(function(skill) {
            return skill && skill.hitType === Game_Action.HITTYPE_PHYSICAL &&
                (skill.damage.type === 1 || skill.damage.type === 5);
        })[0];
        return own ? own.id : _Game_Enemy_attackSkillId.call(this);
    };

    var _Game_Battler_onTurnEnd = Game_Battler.prototype.onTurnEnd;
    Game_Battler.prototype.onTurnEnd = function() {
        _Game_Battler_onTurnEnd.call(this);
        this._siFeverTurn = false;
    };

    var _Game_Battler_onBattleEnd = Game_Battler.prototype.onBattleEnd;
    Game_Battler.prototype.onBattleEnd = function() {
        _Game_Battler_onBattleEnd.call(this);
        this._siFeverTurn = false;
        this._siEnflamedSkip = false;
        this._siExtraTurn = false;
    };

})(SmokingIsle.ElementalStates);
