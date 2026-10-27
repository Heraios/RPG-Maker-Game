//=============================================================================
// SI_Specialists.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: Aday the mechanist (items, Toss, Recharge, Mend
 * Gear) and Kathrout the scholar (not seeing spirits).
 * @author Smoking Isle
 *
 * @help
 * Place after SI_Gear, SI_Voltaic, SI_Glyphs and SI_Talk.
 * (Kathrout's two codex slots are SI_Glyphs' <Codex Slots: 2>.)
 *
 * ============================================================================
 * Aday: items and gadgets
 * ============================================================================
 * Actor or class note:
 *   <Item Power: 50>     items this character uses work 50% better: healing
 *                        and restoring (Pharmacology), and damage
 *   <Item Saver: 25>     in battle, 25% chance an item isn't used up
 *
 * State note:
 *   <Toss Next>          the next item this character uses on one person
 *                        reaches everyone on that side instead (the dead,
 *                        for a reviving item); then the state ends. Toss is a
 *                        skill that gives this state (set its <Turn Cost>).
 *
 * Skill notes:
 *   <Recharge: 1>        restores 1 Voltaic charge to the target (Recharge; and
 *                        his resting move Tinker, on himself)
 *   <Mends: sinew, glue, smith>
 *                        repairs the target's equipped worn weapons and armor of those
 *                        kinds, like Sinew Binding and Glue (and a smith for
 *                        bent copper), with no item used (Mend Gear)
 *
 * ============================================================================
 * Kathrout: a scholar's magic
 * ============================================================================
 * Actor or class note:
 *   <Unseen Kinds: spirit 50>
 *                        her actions are 50% less likely to land on enemies
 *                        of that kind (she can't see them), unless the
 *                        target is Pointed Out
 *
 * Script call (a First Sailor inscription teaches her a spell):
 *   SmokingIsle.Specialists.study(14, skillId)
 */

var Imported = Imported || {};
Imported.SI_Specialists = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Specialists = SmokingIsle.Specialists || {};

(function($) {
    'use strict';

    $.note = function(battler, regex) {
        if (!battler || !battler.isActor()) return null;
        var m = null;
        [battler.actor(), battler.currentClass()].some(function(obj) { m = regex.exec(obj.note || ''); return !!m; });
        return m;
    };

    $.itemPower = function(battler) {
        var m = $.note(battler, /<Item Power:\s*(\d+)>/i);
        return m ? Number(m[1]) / 100 : 0;
    };

    //-------------------------------------------------------------------------
    // Item Power and Item Saver
    //-------------------------------------------------------------------------

    // Pharmacology covers MV's healing and restoring effects from items.
    var _Game_BattlerBase_sparam = Game_BattlerBase.prototype.sparam;
    Game_BattlerBase.prototype.sparam = function(paramId) {
        var value = _Game_BattlerBase_sparam.call(this, paramId);
        return paramId === 3 && this.isActor() ? value * (1 + $.itemPower(this)) : value;
    };

    // Damage (or a healing formula) from an item.
    var _Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;
    Game_Action.prototype.makeDamageValue = function(target, critical) {
        var value = _Game_Action_makeDamageValue.call(this, target, critical);
        var power = this.isItem() ? $.itemPower(this.subject()) : 0;
        return power ? Math.round(value * (1 + power)) : value;
    };

    var _Game_Battler_consumeItem = Game_Battler.prototype.consumeItem;
    Game_Battler.prototype.consumeItem = function(item) {
        var m = $gameParty.inBattle() && DataManager.isItem(item) && item.consumable && $.note(this, /<Item Saver:\s*(\d+)>/i);
        if (m && Math.random() < Number(m[1]) / 100) {
            if (BattleManager._logWindow) BattleManager._logWindow.push('addText', '%1 saves the %2 for later!'.format(this.name(), item.name));
            return;
        }
        _Game_Battler_consumeItem.call(this, item);
    };

    //-------------------------------------------------------------------------
    // Toss
    //-------------------------------------------------------------------------

    $.tossState = function(battler) {
        var states = battler.states().filter(function(s) { return /<Toss Next>/i.test(s.note || ''); });
        return states.length ? states[0].id : 0;
    };

    var _Game_Action_makeTargets = Game_Action.prototype.makeTargets;
    Game_Action.prototype.makeTargets = function() {
        var subject = this.subject(), toss = this.isItem() && this.isForOne() ? $.tossState(subject) : 0;
        if (!toss) return _Game_Action_makeTargets.call(this);
        subject.removeState(toss);
        var targets = this.isForOpponent() ? this.opponentsUnit().aliveMembers() :
            this.isForDeadFriend() ? this.friendsUnit().deadMembers() : this.friendsUnit().aliveMembers();
        if (BattleManager._logWindow) BattleManager._logWindow.push('addText', '%1 tosses it over everyone!'.format(subject.name()));
        return this.repeatTargets(targets);
    };

    //-------------------------------------------------------------------------
    // Recharge (<Recharge> on a skill) and Mend Gear (<Mends>)
    //-------------------------------------------------------------------------

    $.skillTag = function(item, tag) {
        if (!DataManager.isSkill(item)) return null;
        var m = new RegExp('<' + tag + ':\\s*([^>]+)>', 'i').exec(item.note || '');
        return m ? m[1].trim() : null;
    };

    $.mendKinds = function(item) {
        var kinds = $.skillTag(item, 'Mends');
        return kinds ? kinds.split(',').map(function(k) { return k.trim().toLowerCase(); }) : [];
    };

    $.mendSlots = function(target, item) {
        if (!target.isActor() || !target.repairableSlots) return [];
        return $.mendKinds(item).reduce(function(slots, kind) { return slots.concat(target.repairableSlots(kind)); }, []);
    };

    var _Game_Action_testApply = Game_Action.prototype.testApply;
    Game_Action.prototype.testApply = function(target) {
        var item = this.item();
        if ($.mendKinds(item).length) return $.mendSlots(target, item).length > 0;
        // Aday's resting Tinker still rests him when the pile is full (or missing).
        if ($.skillTag(item, 'Recharge') && item.stypeId !== 3) return target.isActor() && !!target.pile && !!target.pile() && target.charge() < target.maxCharge();
        return _Game_Action_testApply.call(this, target);
    };

    var _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _Game_Action_apply.call(this, target);
        var item = this.item(), recharge = Number($.skillTag(item, 'Recharge') || 0);
        if (recharge && target.isActor() && target.pile && target.pile()) {
            target.gainCharge(recharge);
            target.result().success = true;
        }
        var slots = $.mendSlots(target, item);
        if (!slots.length) return;
        var messages = slots.map(function(slotId) {
            var worn = target.equips()[slotId], fixed = target.repairTarget(slotId);
            target._equips[slotId].setObject(fixed);
            return '%1\'s %2 is mended into a %3!'.format(target.name(), worn.name, fixed.name);
        });
        target.refresh();
        target.result().success = true;
        if ($gameParty.inBattle()) target._siWearMessages = (target._siWearMessages || []).concat(messages);
    };

    //-------------------------------------------------------------------------
    // Kathrout: a spell from an inscription
    //-------------------------------------------------------------------------

    $.study = function(actorId, skillId) {
        $gameActors.actor(actorId).learnSkill(skillId);
    };

    //-------------------------------------------------------------------------
    // Kathrout: what she can't see
    //-------------------------------------------------------------------------

    $.unseenRate = function(subject, target) {
        if (!target || !target.isEnemy() || !target.talkData) return 1;
        var m = $.note(subject, /<Unseen Kinds:\s*([\w-]+)\s+(\d+)>/i);
        if (!m || (target.talkData().kinds || []).indexOf(m[1].toLowerCase()) < 0) return 1;
        var pointed = SmokingIsle.Ailments ? SmokingIsle.Ailments.stateByName('Pointed Out') : 0;
        if (pointed && target.isStateAffected(pointed)) return 1;
        return 1 - Number(m[2]) / 100;
    };

    var _Game_Action_itemHit = Game_Action.prototype.itemHit;
    Game_Action.prototype.itemHit = function(target) {
        return _Game_Action_itemHit.call(this, target) * $.unseenRate(this.subject(), target);
    };

})(SmokingIsle.Specialists);
