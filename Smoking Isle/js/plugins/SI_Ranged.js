//=============================================================================
// SI_Ranged.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: ranged weapons (ammo per battle, ranged power), flying, Steady Aim.
 * @author Smoking Isle
 *
 * @param Flying Evasion
 * @desc Evasion a <Flying> battler has against melee physical attacks.
 * @default 0.75
 *
 * @help
 * Requires SI_CombatCore (place below it).
 *
 * ============================================================================
 * Ranged weapons
 * ============================================================================
 * Ranged weapons are items in the Ranged equipment slot (armor entries with
 * a ranged armor type: Sling, Bow, Javelin, Net). Any equipment can also
 * carry ranged uses, e.g. Dama's harpoon in her melee slot.
 *
 * Equipment note:
 *   <Moves: sling>          the ranged move it allows (SI_CombatCore)
 *   <Ammo: 5>               uses per battle
 *   <Ranged Power: 8>       power added by ranged skills (not to melee ATK)
 *   <Ammo: net 1, throw 2>  separate ammo per move (Dama's Fishing Gear)
 *   <Ranged Power: net 3, throw 16>   power per move
 *
 * State or other worn gear (e.g. the Lead Shot item, arrow add-ons):
 *   <Extra Ammo: sling 3>          +3 uses for items with that move
 *   <Ranged Power Bonus: sling 6>  +6 power for that move (can be negative)
 *   <Ranged Inflict: net Wet>      hits with that move also add the state
 *   <Waterproof Bow>               bows keep full power while Wet
 *
 * Wet or Sodden archers: a wet bowstring stretches, so bows (move "shoot")
 * lose 30% of their power unless something worn is <Waterproof Bow>.
 *
 * Skill note:
 *   <Ammo Volley>           (ranged) spends ALL remaining ammo from the
 *                           item, hitting a random enemy once per shot
 *                           (Stone Rain). Use a "1 random enemy" scope.
 *   <Ranged>                a ranged skill: needs an equipped item with a
 *                           matching move and ammo left; each use spends 1
 *                           ammo from that item. Ignores evasion (accurate).
 *
 * Damage formula for ranged skills:
 *   a.rangedDamage(b, 1.0)  (unarmed ATK + the item's Ranged Power) x rate,
 *                           reduced by b.def like physDamage.
 *
 * Ammo resets at the start of every battle. The skill list shows how many
 * uses are left instead of a cost.
 *
 * ============================================================================
 * Flying
 * ============================================================================
 * Actor / enemy note:   <Flying>
 * Melee physical attacks against a flyer face at least the Flying Evasion.
 * Ranged and magical attacks are unaffected.
 *
 * ============================================================================
 * Until Ranged
 * ============================================================================
 * State note:   <Until Ranged>   removed after the battler's next ranged
 *                                attack (e.g. Steady Aim).
 */

var Imported = Imported || {};
Imported.SI_Ranged = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Ranged = SmokingIsle.Ranged || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_Ranged');
    $.flyingEvasion = Number(params['Flying Evasion'] || 0.75);

    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        if (!_DataManager_isDatabaseLoaded.call(this)) return false;
        if (!$._notesParsed) {
            [$dataWeapons, $dataArmors].forEach(function(list) {
                list.forEach(function(obj) {
                    if (!obj) return;
                    var ammo = /<Ammo:\s*([^>]+)>/i.exec(obj.note);
                    var power = /<Ranged Power:\s*([^>]+)>/i.exec(obj.note);
                    obj.siAmmoByMove = ammo ? $.perMove(ammo[1]) : null;
                    obj.siAmmo = ammo ? (obj.siAmmoByMove ? $.total(obj.siAmmoByMove) : Number(ammo[1])) : 0;
                    obj.siPowerByMove = power ? $.perMove(power[1]) : null;
                    obj.siRangedPower = power && !obj.siPowerByMove ? Number(power[1]) : 0;
                });
            });
            $dataSkills.forEach(function(skill) {
                if (!skill) return;
                skill.siRanged = /<Ranged>/i.test(skill.note);
                skill.siVolley = /<Ammo Volley>/i.test(skill.note);
            });
            $dataStates.forEach(function(state) {
                if (state) state.siUntilRanged = /<Until Ranged>/i.test(state.note);
            });
            $._notesParsed = true;
        }
        return true;
    };

    // "net 1, throw 2" -> { net: 1, throw: 2 }; a plain number -> null.
    $.perMove = function(text) {
        if (/^\s*\d+\s*$/.test(text)) return null;
        var out = {};
        text.split(',').forEach(function(part) {
            var w = part.trim().split(/\s+/);
            if (w.length === 2) out[w[0].toLowerCase()] = Number(w[1]);
        });
        return out;
    };

    $.total = function(map) {
        return Object.keys(map).reduce(function(sum, k) { return sum + map[k]; }, 0);
    };

    // Which of the item's per-move ammo a skill would use ('' = shared ammo).
    $.ammoMove = function(item, skill) {
        if (!item || !item.siAmmoByMove) return '';
        var required = (skill && skill.siRequiredMoves) || [];
        var moves = Object.keys(item.siAmmoByMove).filter(function(m) {
            return required.length === 0 || required.indexOf(m) >= 0;
        });
        return moves[0] || null;
    };

    $.isRanged = function(item) {
        return DataManager.isSkill(item) && !!item.siRanged;
    };

    //-------------------------------------------------------------------------
    // Ammo
    //-------------------------------------------------------------------------

    // States and worn gear other than the ranged item itself.
    Game_Actor.prototype.rangedBonusSources = function(item) {
        return this.states().concat(this.equips().filter(function(eq) { return eq && eq !== item; }));
    };

    // <Extra Ammo: sling 3> / <Ranged Power Bonus: sling 6> from states and gear, for an item's moves.
    Game_Actor.prototype.stateRangedBonus = function(item, tag, move) {
        if (!item) return 0;
        var moves = move ? [move] : (item.siMoves || []);
        return this.rangedBonusSources(item).reduce(function(sum, st) {
            var re = new RegExp('<' + tag + ':\\s*(\\w+)\\s+(-?\\d+)>', 'gi'), m;
            while ((m = re.exec(st.note || ''))) {
                if (moves.indexOf(m[1].toLowerCase()) >= 0) sum += Number(m[2]);
            }
            return sum;
        }, 0);
    };

    Game_Actor.prototype.ammoUsed = function(slotId, move) {
        return (this._siAmmoUsed && this._siAmmoUsed[move ? slotId + ':' + move : slotId]) || 0;
    };

    // Ammo left in a slot: for one skill's move when given, else in total.
    Game_Actor.prototype.ammoLeft = function(slotId, skill) {
        var item = this.equips()[slotId];
        if (!item) return 0;
        if (!item.siAmmoByMove) {
            if (!item.siAmmo) return 0;
            return Math.max(item.siAmmo + this.stateRangedBonus(item, 'Extra Ammo') - this.ammoUsed(slotId), 0);
        }
        var moves = skill ? [$.ammoMove(item, skill)] : Object.keys(item.siAmmoByMove);
        return moves.reduce(function(sum, m) {
            return m ? sum + Math.max(item.siAmmoByMove[m] + this.stateRangedBonus(item, 'Extra Ammo', m) - this.ammoUsed(slotId, m), 0) : sum;
        }.bind(this), 0);
    };

    // The equip slot that would supply a ranged skill: matching move, ammo left.
    Game_Actor.prototype.rangedSourceSlot = function(skill) {
        var required = skill.siRequiredMoves || [];
        var equips = this.equips();
        for (var i = 0; i < equips.length; i++) {
            var item = equips[i];
            if (!item || !item.siAmmo) continue;
            var matches = required.length === 0 || (item.siMoves || []).some(function(m) {
                return required.indexOf(m) >= 0;
            });
            if (matches && this.ammoLeft(i, skill) > 0) return i;
        }
        return -1;
    };

    Game_Actor.prototype.rangedAmmoForSkill = function(skill) {
        var required = skill.siRequiredMoves || [];
        var total = 0;
        this.equips().forEach(function(item, i) {
            if (item && item.siAmmo && (required.length === 0 || (item.siMoves || []).some(function(m) {
                return required.indexOf(m) >= 0;
            }))) {
                total += this.ammoLeft(i, skill);
            }
        }, this);
        return total;
    };

    var _Game_BattlerBase_meetsSkillConditions = Game_BattlerBase.prototype.meetsSkillConditions;
    Game_BattlerBase.prototype.meetsSkillConditions = function(skill) {
        if (!_Game_BattlerBase_meetsSkillConditions.call(this, skill)) return false;
        if ($.isRanged(skill) && this.isActor()) return this.rangedSourceSlot(skill) >= 0;
        return true;
    };

    var _Game_Battler_useItem = Game_Battler.prototype.useItem;
    Game_Battler.prototype.useItem = function(item) {
        if ($.isRanged(item) && this.isActor() && $gameParty.inBattle()) {
            var slot = this.rangedSourceSlot(item);
            this._siRangedSlot = slot;
            if (slot >= 0) {
                this._siAmmoUsed = this._siAmmoUsed || {};
                var move = $.ammoMove(this.equips()[slot], item);
                this._siRangedMove = move;
                var spend = item.siVolley ? this.ammoLeft(slot, item) : 1;
                this._siAmmoUsed[move ? slot + ':' + move : slot] = this.ammoUsed(slot, move) + spend;
            }
        }
        _Game_Battler_useItem.call(this, item);
    };

    var _Game_Battler_onBattleStart = Game_Battler.prototype.onBattleStart;
    Game_Battler.prototype.onBattleStart = function() {
        _Game_Battler_onBattleStart.call(this);
        this._siAmmoUsed = {};
        this._siRangedSlot = -1;
    };

    var _Game_Battler_onBattleEnd = Game_Battler.prototype.onBattleEnd;
    Game_Battler.prototype.onBattleEnd = function() {
        _Game_Battler_onBattleEnd.call(this);
        this._siAmmoUsed = {};
    };

    //-------------------------------------------------------------------------
    // Damage, accuracy, flying
    //-------------------------------------------------------------------------

    Game_BattlerBase.prototype.rangedPower = function() {
        if (!this.isActor()) return 0;
        var item = this.equips()[this._siRangedSlot];
        if (!item) return 0;
        var bonus = this.stateRangedBonus(item, 'Ranged Power Bonus', this._siRangedMove || null);
        var power = (item.siPowerByMove ? item.siPowerByMove[this._siRangedMove] || 0 : item.siRangedPower || 0) + bonus;
        return Math.max(Math.round(power * this.wetBowRate(item)), 0);
    };

    $.WET_BOW_RATE = 0.7;
    Game_Actor.prototype.wetBowRate = function(item) {
        var moves = this._siRangedMove ? [this._siRangedMove] : (item.siMoves || []);
        if (moves.indexOf('shoot') < 0) return 1;
        var A = SmokingIsle.Ailments;
        var wet = A && [A.stateByName('Wet'), A.stateByName('Sodden')].some(function(id) { return id && this.isStateAffected(id); }, this);
        if (!wet) return 1;
        var proof = this.rangedBonusSources(item).some(function(o) { return /<Waterproof Bow>/i.test(o.note || ''); });
        return proof ? 1 : $.WET_BOW_RATE;
    };

    Game_BattlerBase.prototype.rangedDamage = function(target, rate) {
        var power = (this.unarmedAtk() + this.rangedPower()) * rate;
        return SmokingIsle.Combat.reduce(power, target.def);
    };

    // Damage previews (e.g. auto battle) before useItem: pick the slot now.
    var _Game_Action_evalDamageFormula = Game_Action.prototype.evalDamageFormula;
    Game_Action.prototype.evalDamageFormula = function(target) {
        var subject = this.subject();
        if ($.isRanged(this.item()) && subject.isActor() && !(subject._siRangedSlot >= 0)) {
            subject._siRangedSlot = subject.rangedSourceSlot(this.item());
            subject._siRangedMove = $.ammoMove(subject.equips()[subject._siRangedSlot], this.item());
        }
        return _Game_Action_evalDamageFormula.call(this, target);
    };

    // Volley: one random hit per shot left (counted before the ammo is spent).
    var _Game_Action_numTargets = Game_Action.prototype.numTargets;
    Game_Action.prototype.numTargets = function() {
        var item = this.item();
        var subject = this.subject();
        if (item && item.siVolley && subject.isActor()) {
            var slot = subject.rangedSourceSlot(item);
            return slot >= 0 ? subject.ammoLeft(slot, item) : 1;
        }
        return _Game_Action_numTargets.call(this);
    };

    $.isFlying = function(battler) {
        var note = battler.isActor() ? battler.actor().note : battler.enemy().note;
        return /<Flying>/i.test(note);
    };

    var _Game_Action_itemEva = Game_Action.prototype.itemEva;
    Game_Action.prototype.itemEva = function(target) {
        if ($.isRanged(this.item())) return 0;
        var eva = _Game_Action_itemEva.call(this, target);
        if (this.isPhysical() && $.isFlying(target)) eva = Math.max(eva, $.flyingEvasion);
        return eva;
    };

    // <Ranged Inflict: net Wet>: hits with that move also add the state.
    var _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _Game_Action_apply.call(this, target);
        var item = this.item(), subject = this.subject();
        if (!$.isRanged(item) || !subject.isActor() || !target.result().isHit() || !SmokingIsle.Ailments) return;
        var moves = item.siRequiredMoves || [];
        subject.rangedBonusSources(null).forEach(function(o) {
            var re = /<Ranged Inflict:\s*(\w+)\s+([^>]+)>/gi, m;
            while ((m = re.exec(o.note || ''))) {
                var id = SmokingIsle.Ailments.stateByName(m[2].trim());
                if (id && moves.indexOf(m[1].toLowerCase()) >= 0) target.addState(id);
            }
        });
    };

    // After a ranged attack: drop <Until Ranged> states and forget the slot.
    var _BattleManager_endAction = BattleManager.endAction;
    BattleManager.endAction = function() {
        var subject = this._subject;
        var item = this._action ? this._action.item() : null;
        if (subject && $.isRanged(item)) {
            subject.states().filter(function(s) { return s.siUntilRanged; }).forEach(function(s) {
                subject.removeState(s.id);
            });
            subject._siRangedSlot = -1;
        }
        _BattleManager_endAction.call(this);
    };

    //-------------------------------------------------------------------------
    // Skill list: show uses left for ranged skills.
    //-------------------------------------------------------------------------

    var _Window_SkillList_drawSkillCost = Window_SkillList.prototype.drawSkillCost;
    Window_SkillList.prototype.drawSkillCost = function(skill, x, y, width) {
        if ($.isRanged(skill) && this._actor && $gameParty.inBattle()) {
            this.changeTextColor(this.systemColor());
            this.drawText('x' + this._actor.rangedAmmoForSkill(skill), x, y, width, 'right');
            return;
        }
        _Window_SkillList_drawSkillCost.call(this, skill, x, y, width);
    };

})(SmokingIsle.Ranged);
