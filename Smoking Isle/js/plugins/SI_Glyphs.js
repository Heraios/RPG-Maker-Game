//=============================================================================
// SI_Glyphs.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: tattoo and codex equipment slots (spells as glyphs).
 * @author Smoking Isle
 *
 * @param Tattoo Equip Type
 * @type number
 * @desc Equipment type id of tattoos (System > Equipment Types).
 * @default 7
 *
 * @param Codex Equip Type
 * @type number
 * @desc Equipment type id of codices.
 * @default 8
 *
 * @param Tattoo Removal Switch
 * @type switch
 * @desc While this switch is OFF, a tattoo can't be removed or replaced
 * (empty tattoo slots can still be filled). Turn it ON in the late game.
 * @default 2
 *
 * @help
 * Spells are glyphs. Islanders read them from their tattoos; All-Seafarers
 * from a codex. Give a tattoo or codex the trait "Add Skill" for each spell
 * it carries (a codex can also have stat bonuses).
 *
 * Actor or class note:
 *   <Tattoo Slots: 8>   this character has 8 tattoo slots
 *   <Codex Slot>        this character has 1 codex slot
 * Characters without these have neither (innate casters like Tou, Falmi and
 * Lasa learn spells normally instead).
 *
 * Tattoos and codices also need an armor type the class may equip, like any
 * other equipment.
 *
 * Tattoos are permanent until the Tattoo Removal Switch is turned on: an
 * occupied tattoo slot can't be changed, and the equip screen's Optimize and
 * Clear never touch tattoos at all.
 */

var Imported = Imported || {};
Imported.SI_Glyphs = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Glyphs = SmokingIsle.Glyphs || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_Glyphs');
    $.tattooType = Number(params['Tattoo Equip Type'] || 7);
    $.codexType = Number(params['Codex Equip Type'] || 8);
    $.removalSwitch = Number(params['Tattoo Removal Switch'] || 0);

    $.noteValue = function(actor, regex) {
        var m = null;
        [actor.actor(), actor.currentClass()].some(function(obj) {
            m = regex.exec(obj.note || '');
            return !!m;
        });
        return m;
    };

    Game_Actor.prototype.tattooSlotCount = function() {
        var m = $.noteValue(this, /<Tattoo Slots:\s*(\d+)>/i);
        return m ? Number(m[1]) : 0;
    };

    Game_Actor.prototype.hasCodexSlot = function() {
        return !!$.noteValue(this, /<Codex Slot>/i);
    };

    // Standard slots minus tattoo/codex, then this character's own.
    var _Game_Actor_equipSlots = Game_Actor.prototype.equipSlots;
    Game_Actor.prototype.equipSlots = function() {
        var slots = _Game_Actor_equipSlots.call(this).filter(function(etype) {
            return etype !== $.tattooType && etype !== $.codexType;
        });
        if (this.hasCodexSlot()) slots.push($.codexType);
        for (var i = 0; i < this.tattooSlotCount(); i++) slots.push($.tattooType);
        return slots;
    };

    // Keep the equipment list as long as the slot list (e.g. after a class change).
    Game_Actor.prototype.syncEquipSlots = function() {
        if (!this._equips) return;
        var count = this.equipSlots().length;
        while (this._equips.length < count) this._equips.push(new Game_Item());
        if (this._equips.length > count) {
            this._equips.splice(count).forEach(function(item) {
                if (item.object()) $gameParty.gainItem(item.object(), 1);
            });
        }
    };

    var _Game_Actor_refresh = Game_Actor.prototype.refresh;
    Game_Actor.prototype.refresh = function() {
        this.syncEquipSlots();
        _Game_Actor_refresh.call(this);
    };

    $.tattoosRemovable = function() {
        return $.removalSwitch > 0 && $gameSwitches.value($.removalSwitch);
    };

    Game_Actor.prototype.isTattooSlot = function(slotId) {
        return this.equipSlots()[slotId] === $.tattooType;
    };

    var _Game_Actor_isEquipChangeOk = Game_Actor.prototype.isEquipChangeOk;
    Game_Actor.prototype.isEquipChangeOk = function(slotId) {
        if (!_Game_Actor_isEquipChangeOk.call(this, slotId)) return false;
        if (this.isTattooSlot(slotId) && this.equips()[slotId] && !$.tattoosRemovable()) return false;
        return true;
    };

    Game_Actor.prototype.clearEquipments = function() {
        var maxSlots = this.equipSlots().length;
        for (var i = 0; i < maxSlots; i++) {
            if (!this.isTattooSlot(i) && this.isEquipChangeOk(i)) this.changeEquip(i, null);
        }
    };

    Game_Actor.prototype.optimizeEquipments = function() {
        var maxSlots = this.equipSlots().length;
        this.clearEquipments();
        for (var i = 0; i < maxSlots; i++) {
            if (!this.isTattooSlot(i) && this.isEquipChangeOk(i)) this.changeEquip(i, this.bestEquipItem(i));
        }
    };

    // A tattoo slot never offers "remove" while tattoos are permanent.
    var _Window_EquipItem_includes = Window_EquipItem.prototype.includes;
    Window_EquipItem.prototype.includes = function(item) {
        if (item === null && this._actor && this._actor.isTattooSlot(this._slotId) && !$.tattoosRemovable()) {
            return false;
        }
        return _Window_EquipItem_includes.call(this, item);
    };

})(SmokingIsle.Glyphs);
