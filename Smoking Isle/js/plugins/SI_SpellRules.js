//=============================================================================
// SI_SpellRules.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: rules behind the god spells (Kiva's silence,
 * Tama's dispel, Atua's reflection, Hiero's blaze, Hakahepo's nightmares,
 * Bull-Leap).
 * @author Smoking Isle
 *
 * @help
 * Place last (below every plugin that changes damage).
 *
 * Seafarer magic comes from codices and favours the bull-men and the Ladies
 * the Islanders keep their distance from: Tiho-uha (Dark Lady, protect),
 * Mea-uha (Red Lady, slow), Kiva (Lady of the Wind, silence), Tama (Lady of
 * the Sun, dispel), Atua (the God of the World, the Seafarers' Red Bowl:
 * reflect), Vero (the Moon, haste) and Hiero (the Sun, blaze).
 *
 * Slow and haste use SI_TurnOrder's <Delay Target>; protect and silence are
 * plain states (Physical Damage Rate; Seal Skill Type: Magical).
 *
 * Skill note:
 *   <Dispel>          strips the target's boons: every state in the Boons
 *                     and Remedies sections of the database, and every
 *                     raised stat (Tama)
 *   <Pure Damage>     the damage formula as it stands: no element, Damage
 *                     profile, resistance, guard, variance or critical
 *                     changes it (Hiero)
 *
 *   <Random State: Confused, Panicked>
 *                     adds one of the named states, picked at random
 *                     (80%, times the target's resistance) (Hakahepo)
 *
 * State note:
 *   <Reflect Once>    turns the first damaging spell an enemy casts at the
 *                     holder back on its caster, then the state ends (Atua).
 *                     Healing and friendly spells pass through, and so does
 *                     <Pure Damage>.
 *   <Vault>           the next melee attack on the holder misses, whatever
 *                     the odds; then the state ends (Bull-Leap). Ranged
 *                     attacks are not affected.
 */

var Imported = Imported || {};
Imported.SI_SpellRules = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.SpellRules = SmokingIsle.SpellRules || {};

(function($) {
    'use strict';

    // The states between two section headers ("------- Boons -------" ...).
    $.section = function(title) {
        var ids = [], inside = false;
        $dataStates.forEach(function(s) {
            if (!s) return;
            if (/^-+ .* -+$/.test(s.name)) { inside = s.name.indexOf(title) >= 0; return; }
            if (inside && s.name) ids.push(s.id);
        });
        return ids;
    };

    $.boonStates = function() {
        if (!$._boons) $._boons = $.section('Boons').concat($.section('Remedies'));
        return $._boons;
    };

    $.has = function(obj, tag) {
        return !!obj && new RegExp('<' + tag + '>', 'i').test(obj.note || '');
    };

    //-------------------------------------------------------------------------
    // Dispel
    //-------------------------------------------------------------------------

    $.dispel = function(target) {
        var removed = false;
        $.boonStates().forEach(function(id) {
            if (target.isStateAffected(id)) { target.removeState(id); removed = true; }
        });
        for (var p = 0; p < 8; p++) {
            if (target.isBuffAffected(p)) { target.removeBuff(p); removed = true; }
        }
        return removed;
    };

    var _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _Game_Action_apply.call(this, target);
        if ($.has(this.item(), 'Dispel') && target.result().isHit() && $.dispel(target)) {
            target.result().success = true;
        }
    };

    //-------------------------------------------------------------------------
    // A random state (Hakahepo)
    //-------------------------------------------------------------------------

    $.randomState = function(item) {
        var m = /<Random State:\s*([^>]+)>/i.exec((item && item.note) || '');
        if (!m) return 0;
        var names = m[1].split(',').map(function(n) { return n.trim(); }).filter(Boolean);
        var name = names[Math.floor(Math.random() * names.length)];
        var state = $dataStates.filter(function(s) { return s && s.name === name; })[0];
        return state ? state.id : 0;
    };

    var _Game_Action_applyRandom = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _Game_Action_applyRandom.call(this, target);
        var id = $.randomState(this.item());
        if (id && target.result().isHit() && target.isAlive() && Math.random() < 0.8 * target.stateRate(id)) {
            target.addState(id);
            target.result().success = true;
        }
    };

    //-------------------------------------------------------------------------
    // Pure damage
    //-------------------------------------------------------------------------

    var _Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;
    Game_Action.prototype.makeDamageValue = function(target, critical) {
        if (!$.has(this.item(), 'Pure Damage')) return _Game_Action_makeDamageValue.call(this, target, critical);
        return Math.max(1, Math.round(this.evalDamageFormula(target)));
    };

    //-------------------------------------------------------------------------
    // Reflect once
    //-------------------------------------------------------------------------

    $.reflectState = function(battler) {
        return battler.states().filter(function(s) { return $.has(s, 'Reflect Once'); })[0] || null;
    };

    $.isReflectable = function(action, target) {
        var item = action.item();
        if (!item || !action.isMagical() || $.has(item, 'Pure Damage')) return false;
        if (!(item.damage.type === 1 || item.damage.type === 5)) return false;
        return action.subject().isActor() !== target.isActor();
    };

    var _Game_Action_itemMrf = Game_Action.prototype.itemMrf;
    Game_Action.prototype.itemMrf = function(target) {
        if ($.reflectState(target)) return $.isReflectable(this, target) ? 1 : 0;
        return _Game_Action_itemMrf.call(this, target);
    };

    var _BattleManager_invokeMagicReflection = BattleManager.invokeMagicReflection;
    BattleManager.invokeMagicReflection = function(subject, target) {
        _BattleManager_invokeMagicReflection.call(this, subject, target);
        var state = $.reflectState(target);
        if (state) target.removeState(state.id);
    };

    //-------------------------------------------------------------------------
    // Vault (Bull-Leap)
    //-------------------------------------------------------------------------

    $.vaultState = function(battler) {
        return battler.states().filter(function(s) { return $.has(s, 'Vault'); })[0] || null;
    };

    $.isMelee = function(action) {
        var item = action.item();
        return action.isPhysical() && !(SmokingIsle.Ranged && SmokingIsle.Ranged.isRanged(item));
    };

    var _Game_Action_itemEva = Game_Action.prototype.itemEva;
    Game_Action.prototype.itemEva = function(target) {
        if ($.vaultState(target) && $.isMelee(this) && this.subject().isActor() !== target.isActor()) return 1;
        return _Game_Action_itemEva.call(this, target);
    };

    var _Game_Action_applyVault = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        var vault = $.vaultState(target), leaps = vault && $.isMelee(this) && this.subject().isActor() !== target.isActor();
        _Game_Action_applyVault.call(this, target);
        if (leaps && target.isStateAffected(vault.id)) target.removeState(vault.id);
    };

})(SmokingIsle.SpellRules);
