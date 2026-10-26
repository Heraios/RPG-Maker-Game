//=============================================================================
// SI_WeaponArts.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: weapon arts: stances (Brace, Riposte, Ward Off,
 * Cover), Throw Knife, the off-hand follow-up, bringing flyers down, and
 * skill bonuses by enemy kind.
 * @author Smoking Isle
 *
 * @help
 * Place after SI_Ranged, SI_Equipment, SI_TurnOrder, SI_BattleTraits and
 * SI_Outfits.
 *
 * ============================================================================
 * Stances (state notes); they end when the holder's next turn begins
 * ============================================================================
 *   <Until Next Turn>        removed as the holder's next turn starts
 *   <Counter Skill: 530>     the next melee attack that lands on the holder
 *                            is answered at once with that skill, aimed at
 *                            the attacker; then the stance ends (Brace,
 *                            Riposte)
 *   <Parry: Disoriented 50>  the next melee attack on the holder is turned
 *                            aside (no effect) and the attacker may get that
 *                            state; then the stance ends (Ward Off)
 *   <Covered>                single-target attacks from the other side on
 *                            the holder go to whoever covered them (Cover;
 *                            set by a skill with <Cover>)
 * "Melee" means physical, and neither <Ranged> nor <Ranged Strike>.
 *
 * ============================================================================
 * Skill notes
 * ============================================================================
 *   <Cover>                  the user covers the target ally (not themself)
 *                            with the skill's <Covered> state
 *   <Throw Knife>            throws a knife (the off-hand one first, then the
 *                            main hand): damage from the user's unarmed
 *                            Might plus the knife's; the knife is gone until
 *                            the battle ends. Two knives, two throws.
 *   <Self State: Following Up>   the user gets that state after using it.
 *                            A state with <Follow-Up> lasts through the
 *                            user's next turn (the off-hand follow-up; use
 *                            it to seal the skill so it can't chain).
 *   <Vs Flying: Brought Down 60>  a hit on a flyer may add that state
 *   <Skips Flying>           no effect on flyers (Ground Pound)
 *   <Needs State: Entangled> no effect unless the target has that state
 *   <Bonus Vs: shelled 50, stone 50>   +50% damage against enemies of those
 *                            kinds (Talk type and tags; "metal" also means
 *                            <Metal> enemies)
 *   <Damage To Mana: 50>     the user gains half the HP damage dealt as Mana
 *   <Item Cost: 142>         needs one of item 142 and uses it up
 *   <Requires Shield>        a shield (small or large) in the off hand
 *   <Requires Large Shield>  a large shield
 *
 * State note:  <Grounds Flyer>   the holder can't fly while it lasts
 *
 * Script call:  SmokingIsle.WeaponArts.teachAll()   every actor learns every
 *               weapon skill (the Test Room's weapon master)
 */

var Imported = Imported || {};
Imported.SI_WeaponArts = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.WeaponArts = SmokingIsle.WeaponArts || {};

(function($) {
    'use strict';

    var Ranged = SmokingIsle.Ranged, Ailments = SmokingIsle.Ailments;

    $.tag = function(obj, tag) {
        var m = obj && new RegExp('<' + tag + '(?::\\s*([^>]*))?>', 'i').exec(obj.note || '');
        return m ? (m[1] === undefined ? true : m[1].trim()) : null;
    };

    $.stateId = function(name) {
        return /^\d+$/.test(name) ? Number(name) : (Ailments ? Ailments.stateByName(name) : 0);
    };

    // "Disoriented 50" -> { id, chance }
    $.stateChance = function(text) {
        var m = /^(.+?)\s+(\d+)$/.exec(String(text || '').trim());
        return m ? { id: $.stateId(m[1]), chance: Number(m[2]) / 100 } : { id: $.stateId(text), chance: 1 };
    };

    $.isMelee = function(action) {
        var item = action.item();
        return action.isPhysical() && !(Ranged && Ranged.isRanged(item)) && !/<Ranged Strike>/i.test((item && item.note) || '');
    };

    $.stanceState = function(battler, tag) {
        return battler.states().filter(function(s) { return $.tag(s, tag) !== null; })[0] || null;
    };

    //-------------------------------------------------------------------------
    // Weapon skills (for kits and the Test Room)
    //-------------------------------------------------------------------------

    $.isWeaponSkill = function(skill) {
        return !!skill && !!skill.name && skill.stypeId === 2 && (/<Requires Move:/i.test(skill.note || '') || /<Weapon Skill>/i.test(skill.note || ''));
    };

    $.teachAll = function() {
        var ids = $dataSkills.filter($.isWeaponSkill).map(function(s) { return s.id; });
        $dataActors.forEach(function(a) {
            if (!a || !a.name) return;
            var actor = $gameActors.actor(a.id);
            ids.forEach(function(id) { actor.learnSkill(id); });
        });
        return ids.length;
    };

    //-------------------------------------------------------------------------
    // Flying: brought down
    //-------------------------------------------------------------------------

    if (Ranged && Ranged.isFlying) {
        var _isFlying = Ranged.isFlying;
        Ranged.isFlying = function(battler) {
            if (battler.states().some(function(s) { return /<Grounds Flyer>/i.test(s.note || ''); })) return false;
            return _isFlying.call(this, battler);
        };
    }

    //-------------------------------------------------------------------------
    // Usability: shields, item costs
    //-------------------------------------------------------------------------

    $.hasShield = function(actor, largeOnly) {
        return actor.isActor() && actor.armors().some(function(a) { return largeOnly ? a.atypeId === 6 : a.atypeId === 5 || a.atypeId === 6; });
    };

    var _Game_BattlerBase_meetsSkillConditions = Game_BattlerBase.prototype.meetsSkillConditions;
    Game_BattlerBase.prototype.meetsSkillConditions = function(skill) {
        if (!_Game_BattlerBase_meetsSkillConditions.call(this, skill)) return false;
        if (!this.isActor()) return true;
        if ($.tag(skill, 'Requires Large Shield') && !$.hasShield(this, true)) return false;
        if ($.tag(skill, 'Requires Shield') && !$.hasShield(this, false)) return false;
        var cost = $.tag(skill, 'Item Cost');
        if (cost && !$gameParty.hasItem($dataItems[Number(cost)])) return false;
        if ($.tag(skill, 'Throw Knife') && !this.throwableKnifeSlot()) return false;
        return true;
    };

    var _Game_BattlerBase_paySkillCost = Game_BattlerBase.prototype.paySkillCost;
    Game_BattlerBase.prototype.paySkillCost = function(skill) {
        _Game_BattlerBase_paySkillCost.call(this, skill);
        var cost = this.isActor() && $.tag(skill, 'Item Cost');
        if (cost) $gameParty.loseItem($dataItems[Number(cost)], 1);
    };

    //-------------------------------------------------------------------------
    // Throw Knife
    //-------------------------------------------------------------------------

    $.isKnife = function(item) {
        return DataManager.isWeapon(item) && item.wtypeId === 1;
    };

    // The off-hand knife first, then the main hand. Returns the slot id or null.
    Game_Actor.prototype.throwableKnifeSlot = function() {
        var off = this.offhandSlotId ? this.offhandSlotId() : -1, main = this.equipSlots().indexOf(1), equips = this.equips();
        if (off >= 0 && $.isKnife(equips[off])) return off;
        if (main >= 0 && $.isKnife(equips[main])) return main;
        return null;
    };

    // Damage formula for Throw Knife: a.thrownDamage(b, 1.0)
    Game_BattlerBase.prototype.thrownDamage = function(target, rate) {
        var slot = !this.isActor() ? null : this._siThrowSlot !== undefined && this._siThrowSlot !== null ? this._siThrowSlot : this.throwableKnifeSlot();
        var knife = slot !== null ? this.equips()[slot] : null;
        var atk = (this.unarmedAtk ? this.unarmedAtk() : this.atk) + (knife ? knife.params[2] : 0);
        return SmokingIsle.Combat.reduce(atk * rate, target.def);
    };

    $.throwKnife = function(actor, slot) {
        if (slot === null || slot === undefined || !$.isKnife(actor.equips()[slot])) return;
        var knife = actor.equips()[slot];
        actor._siThrown = (actor._siThrown || []).concat([{ slot: slot, id: knife.id }]);
        actor._equips[slot].setObject(null);
        actor.refresh();
    };

    // (Game_Actor's own, since SI_Pranks gives actors their own onBattleEnd.)
    var _Game_Actor_onBattleEnd = Game_Actor.prototype.onBattleEnd;
    Game_Actor.prototype.onBattleEnd = function() {
        _Game_Actor_onBattleEnd.call(this);
        if (this._siThrown) {
            this._siThrown.forEach(function(t) {
                var knife = $dataWeapons[t.id];
                if (this._equips[t.slot] && !this._equips[t.slot].object()) this._equips[t.slot].setObject(knife);
                else $gameParty.gainItem(knife, 1);
            }, this);
            this._siThrown = null;
            this.refresh();
        }
    };

    //-------------------------------------------------------------------------
    // Damage bonuses, Mana from damage, needed states, flyers
    //-------------------------------------------------------------------------

    $.kinds = function(battler) {
        if (!battler.isEnemy()) return [];
        var kinds = battler.talkData ? (battler.talkData().kinds || []).slice() : [];
        if (/<Metal>/i.test(battler.enemy().note || '')) kinds.push('metal');
        return kinds;
    };

    $.bonusVs = function(item, target) {
        var text = $.tag(item, 'Bonus Vs');
        if (!text || text === true) return 0;
        var kinds = $.kinds(target);
        return text.split(',').reduce(function(best, part) {
            var m = /([\w-]+)\s+(\d+)/.exec(part.trim());
            return m && kinds.indexOf(m[1].toLowerCase()) >= 0 ? Math.max(best, Number(m[2]) / 100) : best;
        }, 0);
    };

    var _Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;
    Game_Action.prototype.makeDamageValue = function(target, critical) {
        var value = _Game_Action_makeDamageValue.call(this, target, critical);
        var bonus = $.bonusVs(this.item(), target);
        return bonus ? Math.round(value * (1 + bonus)) : value;
    };

    var _Game_Action_testApply = Game_Action.prototype.testApply;
    Game_Action.prototype.testApply = function(target) {
        var item = this.item();
        var needs = $.tag(item, 'Needs State');
        if (needs && !target.isStateAffected($.stateId(needs))) return false;
        if ($.tag(item, 'Skips Flying') && Ranged && Ranged.isFlying(target)) return false;
        if ($.tag(item, 'Cover') && target === this.subject()) return false;
        return _Game_Action_testApply.call(this, target);
    };

    var _Game_Action_executeHpDamage = Game_Action.prototype.executeHpDamage;
    Game_Action.prototype.executeHpDamage = function(target, value) {
        _Game_Action_executeHpDamage.call(this, target, value);
        var rate = Number($.tag(this.item(), 'Damage To Mana') || 0);
        if (rate && value > 0) this.subject().gainMp(Math.floor(value * rate / 100));
    };

    var _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        var item = this.item(), wasFlying = Ranged && Ranged.isFlying(target);
        _Game_Action_apply.call(this, target);
        if (!target.result().isHit()) return;
        var vs = $.tag(item, 'Vs Flying');
        if (vs && wasFlying) {
            var s = $.stateChance(vs);
            if (s.id && Math.random() < s.chance * target.stateRate(s.id) && !target.isStateResist(s.id)) {
                target.addState(s.id);
                target.result().success = true;
            }
        }
        if ($.tag(item, 'Cover')) {
            target._siCoveredBy = this.subject();
            target.result().success = true;
        }
    };

    var _Game_Action_applyGlobal = Game_Action.prototype.applyGlobal;
    Game_Action.prototype.applyGlobal = function() {
        _Game_Action_applyGlobal.call(this);
        var subject = this.subject(), item = this.item(), self = $.tag(item, 'Self State');
        if (self) {
            var id = $.stateId(self);
            if (id) { subject.addState(id); subject._siFollowUpTurn = subject.ctbTurnCount ? subject.ctbTurnCount() : 0; }
        }
        // The knife leaves the hand once the throw is done (damage still counts it).
        if ($.tag(item, 'Throw Knife') && subject.isActor()) subject._siThrowSlot = subject.throwableKnifeSlot();
    };

    var _BattleManager_endAction = BattleManager.endAction;
    BattleManager.endAction = function() {
        var subject = this._subject;
        if (subject && subject.isActor() && subject._siThrowSlot !== undefined && subject._siThrowSlot !== null) {
            $.throwKnife(subject, subject._siThrowSlot);
            subject._siThrowSlot = null;
        }
        _BattleManager_endAction.call(this);
    };

    //-------------------------------------------------------------------------
    // Stances: counters, parries and cover
    //-------------------------------------------------------------------------

    var _BattleManager_invokeAction = BattleManager.invokeAction;
    BattleManager.invokeAction = function(subject, target) {
        var action = this._action;
        var opposed = subject.isActor() !== target.isActor();
        var parry = opposed && $.isMelee(action) ? $.stanceState(target, 'Parry') : null;
        if (parry) {
            this._logWindow.push('pushBaseLine');
            target.removeState(parry.id);
            this._logWindow.push('addText', '%1 wards off the blow!'.format(target.name()));
            var s = $.stateChance($.tag(parry, 'Parry'));
            if (s.id && Math.random() < s.chance * subject.stateRate(s.id) && !subject.isStateResist(s.id)) {
                subject.addState(s.id);
                this._logWindow.push('addText', subject.name() + ($dataStates[s.id].message1 || ' is affected!'));
            }
            this._logWindow.push('popBaseLine');
            this.refreshStatus();
            return;
        }
        _BattleManager_invokeAction.call(this, subject, target);
        var counter = opposed && $.isMelee(action) ? $.stanceState(target, 'Counter Skill') : null;
        if (counter && target.result().isHit() && target.isAlive() && target.canMove() && subject.isAlive()) {
            target.removeState(counter.id);
            var answer = new Game_Action(target);
            answer.setSkill(Number($.tag(counter, 'Counter Skill')));
            this._logWindow.push('pushBaseLine');
            this._logWindow.displayCounter(target);
            answer.apply(subject);
            this._logWindow.displayActionResults(target, subject);
            this._logWindow.push('popBaseLine');
            this.refreshStatus();
        }
    };

    var _BattleManager_applySubstitute = BattleManager.applySubstitute;
    BattleManager.applySubstitute = function(target) {
        var action = this._action, cover = target._siCoveredBy;
        if (cover && $.stanceState(target, 'Covered') && action && action.isForOne() && action.subject().isActor() !== target.isActor() &&
                cover !== target && cover.isAlive() && cover.canMove()) {
            this._logWindow.displaySubstitute(cover, target);
            return cover;
        }
        return _BattleManager_applySubstitute.call(this, target);
    };

    // A battler's turn begins: their stances end, and anyone they covered is on their own again.
    var _Game_Battler_onCtbTurnStart = Game_Battler.prototype.onCtbTurnStart;
    Game_Battler.prototype.onCtbTurnStart = function() {
        _Game_Battler_onCtbTurnStart.call(this);
        var self = this;
        this.states().forEach(function(s) { if (/<Until Next Turn>/i.test(s.note || '')) self.removeState(s.id); });
        this.friendsUnit().members().forEach(function(m) {
            if (m._siCoveredBy !== self) return;
            m._siCoveredBy = null;
            m.states().forEach(function(s) { if (/<Covered>/i.test(s.note || '')) m.removeState(s.id); });
        });
    };

    // A <Follow-Up> state lasts through the user's next turn, then goes.
    var _Game_Battler_onTurnEnd = Game_Battler.prototype.onTurnEnd;
    Game_Battler.prototype.onTurnEnd = function() {
        _Game_Battler_onTurnEnd.call(this);
        var now = this.ctbTurnCount ? this.ctbTurnCount() : 0, self = this;
        if (this._siFollowUpTurn !== undefined && this._siFollowUpTurn < now) {
            this.states().forEach(function(s) { if (/<Follow-Up>/i.test(s.note || '')) self.removeState(s.id); });
            this._siFollowUpTurn = undefined;
        }
    };

    var _Game_Battler_onBattleStart = Game_Battler.prototype.onBattleStart;
    Game_Battler.prototype.onBattleStart = function() {
        _Game_Battler_onBattleStart.call(this);
        this._siCoveredBy = null;
        this._siFollowUpTurn = undefined;
    };

})(SmokingIsle.WeaponArts);
