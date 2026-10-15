//=============================================================================
// SI_Equipment.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: body-part equipment slots, paired hands, multiple
 * accessories, off-hand knives and two-handed weapons.
 * @author Smoking Isle
 *
 * @param Slot Order
 * @desc Equipment type ids, top to bottom. Repeat an id for more than one
 * slot of that type. Tattoo and codex slots are added by SI_Glyphs.
 * @default 3,9,10,4,11,12,13,13,14,15,16,1,6,2,5,5,5
 *
 * @param Slot Names
 * @desc Names for repeated slots, as type: name, name; type: ...
 * Other repeated slots are numbered (Charm 1, Charm 2...).
 * @default 13: Left Hand, Right Hand
 *
 * @param Offhand Equip Type
 * @type number
 * @desc Equipment type id of the off-hand slot.
 * @default 2
 *
 * @param Offhand Weapon Types
 * @desc Weapon type ids that can go in the off hand (Knives).
 * @default 1
 *
 * @param Offhand Move
 * @desc Extra move a weapon in the off hand provides, for skills that need
 * an off-hand weapon (<Requires Move: offhand>).
 * @default offhand
 *
 * @param Two-Handed Weapon Types
 * @desc Weapon type ids that need both hands (Spear, Staff, Axe). Tag a
 * weapon <One-Handed> or <Two-Handed> to override.
 * @default 3,4,6
 *
 * @help
 * Place this plugin after SI_Gear and before SI_Glyphs.
 *
 * Every character gets the slots in Slot Order (default: Head, Neck,
 * Shoulders, Body, Cuirass, Arms, Left Hand, Right Hand, Legs, Greaves,
 * Feet, Melee, Ranged, Offhand, Charm 1-3), then SI_Glyphs adds the codex
 * and tattoo slots. A slot only offers what the class may equip (Traits >
 * Equip Weapon / Equip Armor).
 *
 * Actor or class note:
 *   <Equip Slots: 9>         this character has only these slots instead
 *   <Equip Slots: none>      this character can't equip anything
 *   <Slot Names: Collar>     rename this character's slots, top to bottom
 *   <Start Equips: armor 12, armor 36, weapon 3>
 *                            extra starting equipment beyond what the
 *                            database's Initial Equipment can hold (a second
 *                            ring, more tattoos). Each goes into the first
 *                            empty slot of its type.
 *
 * Off hand: shields, or a weapon of an Offhand Weapon Type. An off-hand weapon
 * gives no stats or traits, only its moves plus the Offhand Move. Skills that
 * use the off-hand move wear down the off-hand weapon.
 *
 * Two-handed weapons: while one is in the Melee slot, the Offhand slot is
 * locked, and anything in it goes back to the bag.
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
    $.offhandWeaponTypes = $.parseIds(params['Offhand Weapon Types'] || '1');
    $.offhandMove = String(params['Offhand Move'] || 'offhand').trim().toLowerCase();
    $.twoHandedTypes = $.parseIds(params['Two-Handed Weapon Types'] || '3,4,6');
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
                if (!w) return;
                var note = w.note || '';
                w.siTwoHanded = /<Two-Handed>/i.test(note) ||
                    ($.twoHandedTypes.indexOf(w.wtypeId) >= 0 && !/<One-Handed>/i.test(note));
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

    $.isOffhandWeapon = function(item) {
        return DataManager.isWeapon(item) && $.offhandWeaponTypes.indexOf(item.wtypeId) >= 0;
    };

    //-------------------------------------------------------------------------
    // Slots
    //-------------------------------------------------------------------------

    Game_Actor.prototype.equipSlots = function() {
        var custom = $.note(this, /<Equip Slots:\s*([^>]*)>/i);
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
        var custom = $.note(this, /<Slot Names:\s*([^>]*)>/i);
        if (custom) {
            var list = custom[1].split(',').map(function(s) { return s.trim(); });
            if (list[slotId]) return list[slotId];
        }
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

    // Which items a slot takes: its own type, plus knives in the off hand.
    $.slotAccepts = function(etype, item) {
        if (!item) return true;
        if (item.etypeId === etype) return true;
        return etype === $.offhandType && $.isOffhandWeapon(item);
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

    //-------------------------------------------------------------------------
    // Off hand and two-handed weapons
    //-------------------------------------------------------------------------

    Game_Actor.prototype.offhandSlotId = function() {
        return this.slotOfType($.offhandType);
    };

    Game_Actor.prototype.offhandWeapon = function() {
        var slotId = this.offhandSlotId();
        var item = slotId >= 0 ? this.equips()[slotId] : null;
        return DataManager.isWeapon(item) ? item : null;
    };

    Game_Actor.prototype.isTwoHanded = function() {
        return this.weapons().some(function(w) {
            return w.siTwoHanded;
        });
    };

    // weapons() is the main hand only; the off-hand knife lends moves, nothing else.
    Game_Actor.prototype.weapons = function() {
        var off = this.offhandSlotId();
        return this.equips().filter(function(item, i) {
            return item && DataManager.isWeapon(item) && i !== off;
        });
    };

    // Equipment that counts for stats and traits: everything but an off-hand weapon.
    // (By slot, since the same knife can be in both hands.)
    Game_Actor.prototype.statEquips = function() {
        var off = this.offhandWeapon() ? this.offhandSlotId() : -1;
        return this.equips().filter(function(item, i) {
            return item && i !== off;
        });
    };

    var _Game_Actor_traitObjects = Game_Actor.prototype.traitObjects;
    Game_Actor.prototype.traitObjects = function() {
        var off = this.offhandWeapon();
        if (!off) return _Game_Actor_traitObjects.call(this);
        var objects = _Game_Actor_traitObjects.call(this);
        objects.splice(objects.lastIndexOf(off), 1);
        return objects;
    };

    Game_Actor.prototype.paramPlus = function(paramId) {
        var value = Game_Battler.prototype.paramPlus.call(this, paramId);
        this.statEquips().forEach(function(item) {
            value += item.params[paramId];
        });
        return value;
    };

    var _Game_Actor_availableMoves = Game_Actor.prototype.availableMoves;
    Game_Actor.prototype.availableMoves = function() {
        var moves = _Game_Actor_availableMoves.call(this);
        var off = this.offhandWeapon();
        if (off) {
            (off.siMoves || []).concat([$.offhandMove]).forEach(function(move) {
                if (moves.indexOf(move) < 0) moves.push(move);
            });
        }
        return moves;
    };

    // A skill that needs the off-hand move wears the off-hand weapon.
    if (Game_Actor.prototype.weaponSlotForSkill) {
        var _Game_Actor_weaponSlotForSkill = Game_Actor.prototype.weaponSlotForSkill;
        Game_Actor.prototype.weaponSlotForSkill = function(skill) {
            var required = (skill && skill.siRequiredMoves) || [];
            if (required.indexOf($.offhandMove) >= 0 && this.offhandWeapon()) {
                return this.offhandSlotId();
            }
            return _Game_Actor_weaponSlotForSkill.call(this, skill);
        };
    }

    var _Game_Actor_isEquipChangeOk = Game_Actor.prototype.isEquipChangeOk;
    Game_Actor.prototype.isEquipChangeOk = function(slotId) {
        if (slotId === this.offhandSlotId() && this.isTwoHanded()) return false;
        return _Game_Actor_isEquipChangeOk.call(this, slotId);
    };

    Game_Actor.prototype.releaseUnequippableItems = function(forcing) {
        for (;;) {
            var slots = this.equipSlots();
            var equips = this.equips();
            var off = this.offhandSlotId();
            var twoHanded = this.isTwoHanded();
            var changed = false;
            for (var i = 0; i < equips.length; i++) {
                var item = equips[i];
                if (item && (!this.canEquip(item) || !$.slotAccepts(slots[i], item) || (i === off && twoHanded))) {
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
