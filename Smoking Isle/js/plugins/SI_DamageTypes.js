//=============================================================================
// SI_DamageTypes.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: mixed damage types (Cut, Pierce, Crush, Burn...) and magic sources.
 * @author Smoking Isle
 *
 * @param Element Ids
 * @desc Element ids for: physical, magical, cut, pierce, crush, burn.
 * @default 1,2,3,4,5,6
 *
 * @param Source Ids
 * @desc Element ids for magic sources: air, water, earth, fire, mind.
 * @default 7,8,9,10,11
 *
 * @help
 * ============================================================================
 * Damage profiles
 * ============================================================================
 * Skill / item / weapon note:
 *   <Damage: cut 70, crush 30>
 *   <Damage: physical pierce 60, magical burn 40>
 *   <Source: fire>
 *
 * Each part is a share of the damage and one of the six damage types:
 * physical, magical, cut, pierce, crush, burn. A part can start with
 * "physical" or "magical" to say how it lands; otherwise it lands the way
 * the skill's Hit Type says (Physical Attack / Magical Attack).
 * Burn covers fire, electricity, poison and acid.
 *
 * Each part is multiplied by the target's Element Rate for its damage type
 * (from traits, e.g. Tou: Cut 175%) and by its Physical or Magical damage
 * rate (PDR/MDR and the Physical/Magical element rates). A part the target
 * resists is reduced while the rest still lands, so a hybrid attack can
 * still hurt a ghost.
 *
 * <Source: fire> (air, water, earth, fire, mind) also multiplies the whole
 * attack by the target's rate for that source element: a fire spirit can
 * shrug off fire magic yet still be hurt by other Burn damage.
 *
 * Weapon note:
 *   <Magic Edge: 15>   weapon skills used with it deal 15% extra damage as
 *                      magic (against the target's magic damage rate):
 *                      copper-silver and First Sailor black bronze.
 *
 * Weapon / armor note:
 *   <Spell Boost: fire 10>   magic skills of that source (<Source: fire>) used
 *                            while it is equipped deal 10% more (obsidian:
 *                            fire, coral: water, ceramic: earth). Several
 *                            pieces add up.
 *
 * A skill without <Damage> but used with a weapon that has one (e.g. the
 * Attack command) uses the weapon's profile. Anything without a profile
 * works the way MV normally does.
 */

var Imported = Imported || {};
Imported.SI_DamageTypes = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.DamageTypes = SmokingIsle.DamageTypes || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_DamageTypes');
    var ids = String(params['Element Ids'] || '1,2,3,4,5,6').split(',').map(Number);
    var srcIds = String(params['Source Ids'] || '7,8,9,10,11').split(',').map(Number);
    $.TYPE = { physical: ids[0], magical: ids[1], cut: ids[2], pierce: ids[3], crush: ids[4], burn: ids[5] };
    $.SOURCE = { air: srcIds[0], water: srcIds[1], earth: srcIds[2], fire: srcIds[3], mind: srcIds[4] };

    $.parse = function(obj) {
        var m = /<Damage:\s*([^>]*)>/i.exec(obj.note || '');
        obj.siDamage = null;
        if (m) {
            obj.siDamage = m[1].split(',').map(function(part) {
                var words = part.trim().toLowerCase().split(/\s+/);
                var delivery = null;
                if ((words[0] === 'physical' || words[0] === 'magical') && words.length > 2) {
                    delivery = words.shift();
                }
                return { delivery: delivery, type: words[0], share: Number(words[1] || 100) };
            }).filter(function(p) {
                return $.TYPE[p.type] !== undefined && p.share > 0;
            });
            if (obj.siDamage.length === 0) obj.siDamage = null;
        }
        var edge = /<Magic Edge:\s*(\d+)>/i.exec(obj.note || '');
        obj.siMagicEdge = edge ? Number(edge[1]) : 0;
        var s = /<Source:\s*(\w+)>/i.exec(obj.note || '');
        obj.siSource = s ? $.SOURCE[s[1].toLowerCase()] || 0 : 0;
    };

    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        if (!_DataManager_isDatabaseLoaded.call(this)) return false;
        if (!$._notesParsed) {
            [$dataSkills, $dataItems, $dataWeapons].forEach(function(list) {
                list.forEach(function(obj) { if (obj) $.parse(obj); });
            });
            [$dataWeapons, $dataArmors].forEach(function(list) {
                list.forEach(function(obj) {
                    if (!obj) return;
                    var b = /<Spell Boost:\s*(\w+)\s+(\d+)>/i.exec(obj.note || '');
                    obj.siSpellBoost = b && $.SOURCE[b[1].toLowerCase()] ? { source: $.SOURCE[b[1].toLowerCase()], rate: Number(b[2]) / 100 } : null;
                });
            });
            $._notesParsed = true;
        }
        return true;
    };

    Game_Action.prototype.damageProfile = function() {
        var item = this.item();
        if (item && item.siDamage) return item.siDamage;
        var subject = this.subject();
        if (this.isAttack() && subject.isActor()) {
            var weapon = subject.weapons()[0];
            if (weapon && weapon.siDamage) return weapon.siDamage;
        }
        return null;
    };

    // Combined multiplier for all parts (damage type rate x delivery rate).
    Game_Action.prototype.profileRate = function(target, profile) {
        var defaultDelivery = this.isMagical() ? 'magical' : 'physical';
        var total = 0, weight = 0;
        profile.forEach(function(part) {
            var delivery = part.delivery || defaultDelivery;
            var rate = delivery === 'magical' ? target.mdr : target.pdr;
            rate *= target.elementRate($.TYPE[delivery]);
            if (part.type !== delivery) rate *= target.elementRate($.TYPE[part.type]);
            total += part.share * rate;
            weight += part.share;
        });
        return weight > 0 ? total / weight : 1;
    };

    // The weapon behind a weapon skill (the one whose move it uses), or null.
    Game_Action.prototype.skillWeapon = function() {
        var subject = this.subject(), item = this.item();
        if (!subject.isActor() || !DataManager.isSkill(item) || !(item.siRequiredMoves || []).length) return null;
        var slotId = subject.weaponSlotForSkill ? subject.weaponSlotForSkill(item) : -1;
        var weapon = slotId >= 0 ? subject.equips()[slotId] : subject.weapons()[0];
        return DataManager.isWeapon(weapon) ? weapon : null;
    };

    var _Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;
    Game_Action.prototype.makeDamageValue = function(target, critical) {
        var value = this.makeProfiledDamageValue(target, critical);
        var weapon = this.skillWeapon();
        if (weapon && weapon.siMagicEdge > 0 && value > 0 && this.isPhysical()) {
            value += Math.round(value * weapon.siMagicEdge / 100 * target.mdr * target.elementRate($.TYPE.magical));
        }
        var boost = this.spellBoost();
        if (boost > 0 && value > 0) value = Math.round(value * (1 + boost));
        return value;
    };

    // Extra share for a magic skill from the user's <Spell Boost> equipment.
    Game_Action.prototype.spellBoost = function() {
        var item = this.item(), subject = this.subject();
        if (!item || !item.siSource || !this.isMagical() || !subject.isActor()) return 0;
        return subject.equips().reduce(function(sum, eq) {
            return eq && eq.siSpellBoost && eq.siSpellBoost.source === item.siSource ? sum + eq.siSpellBoost.rate : sum;
        }, 0);
    };

    Game_Action.prototype.makeProfiledDamageValue = function(target, critical) {
        var profile = this.damageProfile();
        if (!profile) return _Game_Action_makeDamageValue.call(this, target, critical);
        var item = this.item();
        var baseValue = this.evalDamageFormula(target);
        var value = baseValue * this.profileRate(target, profile);
        var source = item.siSource || 0;
        if (source > 0) value *= target.elementRate(source);
        if (baseValue < 0) value *= target.rec;
        if (critical) value = this.applyCritical(value);
        value = this.applyVariance(value, item.damage.variance);
        value = this.applyGuard(value, target);
        return Math.round(value);
    };

})(SmokingIsle.DamageTypes);
