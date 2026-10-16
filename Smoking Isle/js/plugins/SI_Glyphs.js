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
 * Tattoos go on the body: Lower L Arm, Lower R Arm, Upper L Arm, Upper R Arm
 * (filled in that order) and the Face, which only priests may have.
 *
 * Actor or class note:
 *   <Tattoo Slots: 4>   arm tattoo slots (up to 4)
 *   <Tattoo Slots If Switch 3: 2>
 *                       arm slots only while switch 3 is ON (Parl, if he
 *                       joins the Islander village)
 *   <Face Tattoo>       also a Face slot (priests)
 *   <Codex Slot>        this character has 1 codex slot
 * Characters without these have neither (innate casters like Tou, Falmi and
 * Lasa learn spells normally instead).
 *
 * Tattoos and codices also need an armor type the class may equip, like any
 * other equipment.
 *
 * Tattoos are permanent until the Tattoo Removal Switch is turned on: an
 * occupied tattoo slot can't be changed, and the equip screen's Optimize and
 * Clear never touch tattoos at all. A tattoo that is removed or replaced is
 * destroyed; it does not go back into the inventory.
 *
 * Tattoo note:
 *   <Permanent>         can never be removed, even late game (Yoon's ???
 *                       glyph). Starting <Permanent> tattoos go on the Face.
 *
 * Growth (story events), script calls:
 *   SmokingIsle.Glyphs.addArmSlot(actorId)   one more arm slot (up to 4)
 *   SmokingIsle.Glyphs.grantFace(actorId)    a Face slot (e.g. ordination)
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

    $.ARM_POSITIONS = ['Lower L Arm', 'Lower R Arm', 'Upper L Arm', 'Upper R Arm'];

    Game_Actor.prototype.armTattooCount = function() {
        var m = $.noteValue(this, /<Tattoo Slots:\s*(\d+)>/i);
        var n = m ? Number(m[1]) : 0;
        var c = $.noteValue(this, /<Tattoo Slots If Switch (\d+):\s*(\d+)>/i);
        if (c && $gameSwitches && $gameSwitches.value(Number(c[1]))) n = Math.max(n, Number(c[2]));
        if (n > 0 || this._siExtraArms) n += this._siExtraArms || 0;
        return Math.min(n, 4);
    };

    Game_Actor.prototype.hasFaceTattoo = function() {
        return !!this._siFace || !!$.noteValue(this, /<Face Tattoo>/i);
    };

    // The body positions of this character's tattoo slots, in slot order.
    Game_Actor.prototype.tattooPositions = function() {
        var list = $.ARM_POSITIONS.slice(0, this.armTattooCount());
        if (this.hasFaceTattoo()) list.push('Face');
        return list;
    };

    Game_Actor.prototype.tattooSlotCount = function() {
        return this.tattooPositions().length;
    };

    $.addArmSlot = function(actorId) {
        var a = $gameActors.actor(actorId);
        a._siExtraArms = (a._siExtraArms || 0) + 1;
        a.refresh();
    };

    $.grantFace = function(actorId) {
        var a = $gameActors.actor(actorId);
        a._siFace = true;
        a.refresh();
    };

    $.isPermanent = function(item) {
        return !!item && /<Permanent>/i.test(item.note || '');
    };

    // Slot labels: the body position.
    var _Game_Actor_equipSlotName = Game_Actor.prototype.equipSlotName;
    Game_Actor.prototype.equipSlotName = function(slotId) {
        var slots = this.equipSlots();
        if (slots[slotId] === $.tattooType) {
            var first = slots.indexOf($.tattooType);
            var pos = this.tattooPositions()[slotId - first];
            if (pos) return pos;
        }
        return _Game_Actor_equipSlotName ? _Game_Actor_equipSlotName.call(this, slotId) : '';
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

    // Keep the equipment list as long as the slot list (e.g. after a class change),
    // and keep each tattoo on its body position when slots are added.
    Game_Actor.prototype.syncEquipSlots = function() {
        if (!this._equips) return;
        var positions = this.tattooPositions();
        var old = this._siTattooLayout;
        if (old && old.join('|') !== positions.join('|')) {
            var base = this._equips.length - old.length;
            var byPos = {};
            old.forEach(function(pos, i) { byPos[pos] = this._equips[base + i]; }, this);
            var kept = this._equips.slice(0, base);
            positions.forEach(function(pos) { kept.push(byPos[pos] || new Game_Item()); });
            Object.keys(byPos).forEach(function(pos) {
                if (positions.indexOf(pos) < 0 && byPos[pos].object()) { /* a lost slot's tattoo is gone */ }
            });
            this._equips = kept;
        }
        this._siTattooLayout = positions;
        var count = this.equipSlots().length;
        while (this._equips.length < count) this._equips.push(new Game_Item());
        if (this._equips.length > count) {
            this._equips.splice(count).forEach(function(item) {
                if (item.object() && !$.isTattoo(item.object())) $gameParty.gainItem(item.object(), 1);
            });
        }
    };

    var _Game_Actor_refresh = Game_Actor.prototype.refresh;
    Game_Actor.prototype.refresh = function() {
        this.syncEquipSlots();
        _Game_Actor_refresh.call(this);
    };

    $.isTattoo = function(item) {
        return !!item && DataManager.isArmor(item) && item.etypeId === $.tattooType;
    };

    // A removed or replaced tattoo is gone; it never returns to the bag.
    var _Game_Actor_tradeItemWithParty = Game_Actor.prototype.tradeItemWithParty;
    Game_Actor.prototype.tradeItemWithParty = function(newItem, oldItem) {
        return _Game_Actor_tradeItemWithParty.call(this, newItem, $.isTattoo(oldItem) ? null : oldItem);
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
        var worn = this.equips()[slotId];
        if (this.isTattooSlot(slotId) && worn && ($.isPermanent(worn) || !$.tattoosRemovable())) return false;
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

    // Starting <Permanent> tattoos (Yoon's ??? glyph) belong on the Face.
    var _Game_Actor_initEquips = Game_Actor.prototype.initEquips;
    Game_Actor.prototype.initEquips = function(equips) {
        _Game_Actor_initEquips.call(this, equips);
        this._siTattooLayout = this.tattooPositions();
        var slots = this.equipSlots(), first = slots.indexOf($.tattooType);
        var face = this.tattooPositions().indexOf('Face');
        if (first < 0 || face < 0) return;
        var faceSlot = first + face;
        for (var i = first; i < slots.length; i++) {
            var item = this._equips[i].object();
            if (i !== faceSlot && $.isPermanent(item)) {
                var there = this._equips[faceSlot].object();
                this._equips[faceSlot].setObject(item);
                this._equips[i].setObject(there);
                break;
            }
        }
        this.refresh();
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
