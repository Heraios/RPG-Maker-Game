//=============================================================================
// SI_Equipment.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: body-part equipment slots, paired hands, multiple
 * accessories and off-hand weapons.
 * @author Smoking Isle
 *
 * @param Slot Order
 * @desc Equipment type ids, top to bottom. Repeat an id for more than one
 * slot of that type. Tattoo and codex slots are added by SI_Glyphs.
 * @default 3,9,10,4,11,12,13,13,14,15,16,1,6,2,5,5,5
 *
 * @param Slot Names
 * @desc Names for repeated slots, as type: name, name; type: ...
 * Other repeated slots are numbered (Accessory 1, Accessory 2...).
 * @default 13: Left Hand, Right Hand
 *
 * @param Offhand Equip Type
 * @type number
 * @desc Equipment type id of the off-hand slot (shields, and weapons
 * tagged <Offhand>).
 * @default 2
 *
 * @help
 * Place this plugin before SI_Glyphs.
 *
 * Every character gets the slots in Slot Order (default: Head, Neck,
 * Shoulders, Body, Cuirass, Arms, Left Hand, Right Hand, Legs, Greaves,
 * Feet, Melee, Ranged, Offhand, Accessory 1-3), then SI_Glyphs adds the codex
 * and tattoo slots. A slot only offers what the class may equip (Traits >
 * Equip Weapon / Equip Armor).
 *
 * Actor or class note:
 *   <Equip Slots: 9, 5>      this character has only these slots instead
 *                            (e.g. a hound with just a Neck and an Accessory)
 *   <Start Equips: armor 12, armor 36, weapon 3>
 *                            extra starting equipment beyond what the
 *                            database's Initial Equipment can hold (a second
 *                            ring, more tattoos). Each goes into the first
 *                            empty slot of its type.
 *
 * Weapon note:
 *   <Offhand>   this weapon can also go in the Offhand slot. It adds its
 *               stats and its moves (for weapon skills) like the main weapon.
 *
 * Initial Equipment in the database is matched by equipment type, so it
 * doesn't matter which row it was entered in.
 */

var Imported = Imported || {};
Imported.SI_Equipment = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Equipment = SmokingIsle.Equipment || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_Equipment');
    $.parseIds = function(text) {
        return String(text || '').split(',').map(function(s) {
            return Number(s.trim());
        }).filter(function(n) {
            return n > 0;
        });
    };
    $.slotOrder = $.parseIds(params['Slot Order'] || '3,9,10,4,11,12,13,13,14,15,16,1,6,2,5,5,5');
    $.offhandType = Number(params['Offhand Equip Type'] || 2);
    $.slotNames = {};
    String(params['Slot Names'] || '').split(';').forEach(function(part) {
        var m = /^\s*(\d+)\s*:(.*)$/.exec(part);
        if (m) {
            $.slotNames[Number(m[1])] = m[2].split(',').map(function(s) {
                return s.trim();
            });
        }
    });

    //-------------------------------------------------------------------------
    // Note tags
    //-------------------------------------------------------------------------

    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        if (!_DataManager_isDatabaseLoaded.call(this)) return false;
        if (!$._loaded) {
            $dataWeapons.forEach(function(w) {
                if (w) w.siOffhand = /<Offhand>/i.test(w.note || '');
            });
            $._loaded = true;
        }
        return true;
    };

    $.note = function(actor, regex) {
        var m = null;
        [actor.actor(), actor.currentClass()].some(function(obj) {
            m = obj ? regex.exec(obj.note || '') : null;
            return !!m;
        });
        return m;
    };

    //-------------------------------------------------------------------------
    // Slots
    //-------------------------------------------------------------------------

    Game_Actor.prototype.equipSlots = function() {
        var custom = $.note(this, /<Equip Slots:\s*([\d,\s]+)>/i);
        return custom ? $.parseIds(custom[1]) : $.slotOrder.slice();
    };

    // The slot index of the nth (0-based) slot of an equipment type, or -1.
    // Handy in script calls: actor.changeEquip(actor.slotOfType(13, 1), item)
    Game_Actor.prototype.slotOfType = function(etypeId, nth) {
        var slots = this.equipSlots(), n = nth || 0;
        for (var i = 0; i < slots.length; i++) {
            if (slots[i] === etypeId && n-- === 0) return i;
        }
        return -1;
    };

    Game_Actor.prototype.equipSlotName = function(slotId) {
        var slots = this.equipSlots();
        var etype = slots[slotId];
        var name = $dataSystem.equipTypes[etype] || '';
        var count = 0, nth = 0;
        for (var i = 0; i < slots.length; i++) {
            if (slots[i] === etype) {
                if (i < slotId) nth++;
                count++;
            }
        }
        if (count < 2) return name;
        var names = $.slotNames[etype];
        return names && names[nth] ? names[nth] : name + ' ' + (nth + 1);
    };

    Window_EquipSlot.prototype.slotName = function(index) {
        return this._actor ? this._actor.equipSlotName(index) : '';
    };

    Window_EquipSlot.prototype.slotNameWidth = function() {
        return 170;
    };

    // Which items a slot takes: its own type, plus <Offhand> weapons in the off hand.
    $.slotAccepts = function(etype, item) {
        if (!item) return true;
        if (item.etypeId === etype) return true;
        return etype === $.offhandType && DataManager.isWeapon(item) && item.siOffhand;
    };

    Game_Actor.prototype.slotAccepts = function(slotId, item) {
        return $.slotAccepts(this.equipSlots()[slotId], item);
    };

    Game_Actor.prototype.changeEquip = function(slotId, item) {
        if (!this.slotAccepts(slotId, item)) return;
        if (this.tradeItemWithParty(item, this.equips()[slotId])) {
            this._equips[slotId].setObject(item);
            this.refresh();
        }
    };

    // Event command "Change Equipment" names a type, not a slot: use the first
    // slot of that type, preferring an empty one.
    Game_Actor.prototype.changeEquipById = function(etypeId, itemId) {
        var slots = this.equipSlots(), equips = this.equips(), slotId = -1;
        for (var i = 0; i < slots.length; i++) {
            if (slots[i] !== etypeId) continue;
            if (slotId < 0) slotId = i;
            if (!equips[i]) { slotId = i; break; }
        }
        if (slotId < 0) return;
        var list = etypeId === 1 ? $dataWeapons : $dataArmors;
        this.changeEquip(slotId, itemId > 0 ? list[itemId] : null);
    };

    Game_Actor.prototype.releaseUnequippableItems = function(forcing) {
        for (;;) {
            var slots = this.equipSlots();
            var equips = this.equips();
            var changed = false;
            for (var i = 0; i < equips.length; i++) {
                var item = equips[i];
                if (item && (!this.canEquip(item) || !$.slotAccepts(slots[i], item))) {
                    if (!forcing) this.tradeItemWithParty(null, item);
                    this._equips[i].setObject(null);
                    changed = true;
                }
            }
            if (!changed) break;
        }
    };

    var _Window_EquipItem_includes = Window_EquipItem.prototype.includes;
    Window_EquipItem.prototype.includes = function(item) {
        if (item && this._actor && this._slotId >= 0 && item.etypeId !== this._actor.equipSlots()[this._slotId]) {
            return this._actor.slotAccepts(this._slotId, item) && this._actor.canEquip(item);
        }
        return _Window_EquipItem_includes.call(this, item);
    };

    //-------------------------------------------------------------------------
    // Starting equipment: placed by type
    //-------------------------------------------------------------------------

    Game_Actor.prototype.initEquips = function(equips) {
        var slots = this.equipSlots();
        this._equips = slots.map(function() {
            return new Game_Item();
        });
        var items = [];
        (equips || []).forEach(function(id, j) {
            if (id > 0) items.push(j === 0 ? $dataWeapons[id] : $dataArmors[id]);
        });
        var extra = $.note(this, /<Start Equips:\s*([^>]+)>/i);
        if (extra) {
            extra[1].split(',').forEach(function(part) {
                var m = /(weapon|armor)\s*(\d+)/i.exec(part);
                if (m) items.push((m[1].toLowerCase() === 'weapon' ? $dataWeapons : $dataArmors)[Number(m[2])]);
            });
        }
        items.forEach(function(item) {
            if (!item) return;
            for (var i = 0; i < slots.length; i++) {
                if (!this._equips[i].object() && slots[i] === item.etypeId) {
                    this._equips[i].setObject(item);
                    return;
                }
            }
        }, this);
        this.releaseUnequippableItems(true);
        this.refresh();
    };

})(SmokingIsle.Equipment);
