//=============================================================================
// SI_Crafting.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: crafting at campfires, earth ovens and NPC
 * crafters, with fuel, recipes and portable equipment.
 * @author Smoking Isle
 *
 * @help
 * Place after SI_Gear.
 *
 * ============================================================================
 * Stations
 * ============================================================================
 * An event opens a station with a script call:
 *   SmokingIsle.Crafting.open('campfire')
 *   SmokingIsle.Crafting.open('oven')        earth oven: every campfire
 *                                            recipe, plus its own
 *   SmokingIsle.Crafting.open('smith')       NPC crafters: smith, tanner,
 *                                            weaver, tattooist, herbalist,
 *                                            electroplater, priest
 *
 * Campfires need lighting (a Fire-Starting Kit, used up) before anything can
 * be made there: making camp is the pause. Ovens are always lit. Both need
 * fuel for recipes that use the fire, and ovens get more from it. NPC crafters need no
 * fuel; they charge cowries on top of the materials.
 *
 * Fuel adds charges to the fire for this session. A recipe that needs the
 * fire (<Recipe Heat>) uses 1 charge. Melting metal (<Recipe Smelt>) also
 * needs peat or coal to have gone in this session. Leaving the area ends the
 * session: unused charges are lost. A map's area is its <Area: name> map
 * note (so a building can share its village's fire), else the map itself.
 *
 * Item note (fuel):
 *   <Fuel: 2>             charges it adds to a campfire
 *   <Fuel Kind: wood>     scrap, wood, peat or coal. In an oven, everything
 *                         but scrap gives 1 more charge, and coal 2 more.
 *
 * ============================================================================
 * Recipes
 * ============================================================================
 * A recipe is an item (the Recipes category). The party knows a campfire or
 * oven recipe while it carries the recipe item; NPC crafters know all of
 * theirs. Item note:
 *   <Recipe At: campfire>          campfire, oven, smith, tanner, weaver,
 *                                  tattooist, herbalist, electroplater or
 *                                  priest
 *   <Recipe In: item 136, weapon 110, item 129>   one of each, used up
 *   <Recipe In: item 402 x2, item 129>   two of the first
 *   <Recipe In: weapon 172, item 11, item 144 / item 169>   "/" = either
 *   <Recipe Out: weapon 93>        what it makes (several: comma list)
 *   <Recipe Bonus: item 172 10>    10% chance of this as well
 *   <Recipe Tool: 237>             needs this item carried (Knapping Kit...)
 *   <Recipe Heat>                  needs the fire: uses 1 charge
 *   <Recipe Smelt>                 needs the fire and peat or coal
 *   <Recipe Fee: 60>               cowries (NPC crafters)
 *   <Recipe Known>                 known without carrying the recipe
 *                                  (carving, and every NPC recipe)
 * Only items in the bag are used, never equipped gear.
 *
 * Actor note:
 *   <Brings: item 237>    the party gets this the first time the character
 *                         joins (Sib's Knapping Kit, Pada's Fletching Kit)
 */

var Imported = Imported || {};
Imported.SI_Crafting = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Crafting = SmokingIsle.Crafting || {};

(function($) {
    'use strict';

    $.STATIONS = {
        campfire: 'Campfire', oven: 'Earth Oven', smith: 'Smith', tanner: 'Tanner', weaver: 'Weaver',
        tattooist: 'Tattooist', herbalist: 'Herbalist', electroplater: 'Electroplater', priest: 'Priest'
    };
    $.FIRE_STATIONS = ['campfire', 'oven'];
    $.OVEN_BONUS = { scrap: 0, wood: 1, peat: 1, coal: 2 };

    //-------------------------------------------------------------------------
    // Note tags
    //-------------------------------------------------------------------------

    // "item 136, weapon 110 / item 9" -> [[{kind, id}], [{...}, {...}]]
    // "item 402 x2" counts as that ingredient twice.
    $.parseRefs = function(text) {
        var list = [];
        String(text || '').split(',').forEach(function(part) {
            var times = /x\s*(\d+)\s*$/i.exec(part);
            var alts = part.replace(/x\s*\d+\s*$/i, '').split('/').map(function(alt) {
                var m = /(item|weapon|armor)\s*(\d+)/i.exec(alt);
                return m ? { kind: m[1].toLowerCase(), id: Number(m[2]) } : null;
            }).filter(Boolean);
            for (var i = 0; i < (times ? Number(times[1]) : 1) && alts.length > 0; i++) list.push(alts);
        });
        return list;
    };

    $.object = function(ref) {
        return ref.kind === 'weapon' ? $dataWeapons[ref.id] : ref.kind === 'armor' ? $dataArmors[ref.id] : $dataItems[ref.id];
    };

    $.parseRecipe = function(item) {
        var note = item.note || '';
        var at = /<Recipe At:\s*(\w+)>/i.exec(note);
        if (!at) return null;
        var tag = function(name) { var m = new RegExp('<' + name + ':\\s*([^>]+)>', 'i').exec(note); return m ? m[1] : null; };
        var bonus = /<Recipe Bonus:\s*(item|weapon|armor)\s*(\d+)\s+(\d+)>/i.exec(note);
        return {
            item: item,
            name: item.name.replace(/^Recipe:\s*/, ''),
            at: at[1].toLowerCase(),
            ins: $.parseRefs(tag('Recipe In')),
            outs: $.parseRefs(tag('Recipe Out')).map(function(alts) { return alts[0]; }),
            bonus: bonus ? { ref: { kind: bonus[1].toLowerCase(), id: Number(bonus[2]) }, chance: Number(bonus[3]) } : null,
            tool: Number(tag('Recipe Tool') || 0),
            heat: /<Recipe (Heat|Smelt)>/i.test(note),
            smelt: /<Recipe Smelt>/i.test(note),
            fee: Number(tag('Recipe Fee') || 0),
            known: /<Recipe Known>/i.test(note)
        };
    };

    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        if (!_DataManager_isDatabaseLoaded.call(this)) return false;
        if (!$._loaded) {
            $.recipes = [];
            $dataItems.forEach(function(item) {
                if (!item) return;
                var r = $.parseRecipe(item);
                if (r) $.recipes.push(r);
                var fuel = /<Fuel:\s*(\d+)>/i.exec(item.note || '');
                var kind = /<Fuel Kind:\s*(\w+)>/i.exec(item.note || '');
                item.siFuel = fuel ? Number(fuel[1]) : 0;
                item.siFuelKind = kind ? kind[1].toLowerCase() : (fuel ? 'wood' : '');
            });
            $.fireKit = $dataItems.filter(function(i) { return i && i.name === 'Fire-Starting Kit'; })[0] || null;
            $._loaded = true;
        }
        return true;
    };

    //-------------------------------------------------------------------------
    // The fire: one session per area
    //-------------------------------------------------------------------------

    $.areaKey = function() {
        var m = $dataMap && /<Area:\s*([^>]+)>/i.exec($dataMap.note || '');
        return m ? m[1].trim() : 'map' + ($gameMap ? $gameMap.mapId() : 0);
    };

    $.session = function() {
        var s = $gameSystem._siCraft;
        if (!s || s.area !== $.areaKey()) s = $gameSystem._siCraft = { area: $.areaKey(), charges: 0, smelt: false, lit: false };
        return s;
    };

    // A new area means a new session (the old fire's leftover charges are gone).
    var _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        if ($gameSystem._siCraft && $gameSystem._siCraft.area !== $.areaKey()) $gameSystem._siCraft = null;
    };

    $.isFireStation = function(station) { return $.FIRE_STATIONS.indexOf(station) >= 0; };

    $.isLit = function(station) {
        return station === 'oven' || $.session().lit;
    };

    $.light = function() {
        var s = $.session();
        if (s.lit) return true;
        if (!$.fireKit || $gameParty.numItems($.fireKit) < 1) return false;
        $gameParty.loseItem($.fireKit, 1);
        s.lit = true;
        return true;
    };

    $.fuelValue = function(item, station) {
        if (!item || !item.siFuel) return 0;
        return item.siFuel + (station === 'oven' ? $.OVEN_BONUS[item.siFuelKind] || 0 : 0);
    };

    $.fuelItems = function() {
        return $gameParty.items().filter(function(i) { return i.siFuel > 0; });
    };

    $.addFuel = function(item, station) {
        var value = $.fuelValue(item, station);
        if (!value || !$gameParty.hasItem(item) || !$.isLit(station)) return 0;
        var s = $.session();
        $gameParty.loseItem(item, 1);
        s.charges += value;
        if (item.siFuelKind === 'peat' || item.siFuelKind === 'coal') s.smelt = true;
        return value;
    };

    //-------------------------------------------------------------------------
    // Recipes
    //-------------------------------------------------------------------------

    $.knows = function(recipe) {
        return recipe.known || $gameParty.hasItem(recipe.item);
    };

    // Recipes on offer here: an oven also does every campfire recipe; NPCs know theirs.
    $.recipesAt = function(station) {
        return $.recipes.filter(function(r) {
            var here = r.at === station || (station === 'oven' && r.at === 'campfire');
            return here && ($.isFireStation(station) ? $.knows(r) : true);
        });
    };

    $.count = function(ref) {
        return $gameParty.numItems($.object(ref));
    };

    // For each ingredient, the first alternative the party still has once the
    // earlier ingredients are set aside (null if none).
    $.pick = function(recipe) {
        var used = {};
        return recipe.ins.map(function(alts) {
            var ref = alts.filter(function(r) { return $.count(r) > (used[r.kind + r.id] || 0); })[0] || null;
            if (ref) used[ref.kind + ref.id] = (used[ref.kind + ref.id] || 0) + 1;
            return ref;
        });
    };

    // Why it can't be made right now, or '' if it can.
    $.problem = function(recipe, station) {
        if (station === 'campfire' && !$.isLit(station)) return 'Light the fire first.';
        var missing = recipe.ins.filter(function(alts, i) { return !$.pick(recipe)[i]; }).map(function(alts) {
            return alts.map(function(ref) { return $.object(ref).name; }).join(' or ');
        });
        if (missing.length) {
            var counts = {};
            missing.forEach(function(name) { counts[name] = (counts[name] || 0) + 1; });
            return 'Needs ' + Object.keys(counts).map(function(name) {
                return counts[name] > 1 ? name + ' x' + counts[name] : name;
            }).join(', ') + '.';
        }
        if (recipe.tool && !$gameParty.hasItem($dataItems[recipe.tool])) return 'Needs a ' + $dataItems[recipe.tool].name + '.';
        if ($.isFireStation(station) && recipe.heat) {
            if (!$.isLit(station)) return 'The fire isn\'t lit.';
            if ($.session().charges < 1) return 'The fire needs fuel.';
            if (recipe.smelt && !$.session().smelt) return 'Melting metal needs peat or coal on the fire.';
        }
        if (recipe.fee && !$.isFireStation(station) && $gameParty.gold() < recipe.fee) return 'Costs ' + recipe.fee + ' ' + TextManager.currencyUnit + '.';
        return '';
    };

    $.canCraft = function(recipe, station) {
        return $.problem(recipe, station) === '';
    };

    // Makes it: returns the names of what was made, or null.
    $.craft = function(recipe, station) {
        if (!$.canCraft(recipe, station)) return null;
        $.pick(recipe).forEach(function(ref) { $gameParty.loseItem($.object(ref), 1); });
        if ($.isFireStation(station) && recipe.heat) $.session().charges -= 1;
        if (recipe.fee && !$.isFireStation(station)) $gameParty.loseGold(recipe.fee);
        var made = recipe.outs.map($.object);
        if (recipe.bonus && Math.random() * 100 < recipe.bonus.chance) made.push($.object(recipe.bonus.ref));
        made.forEach(function(obj) { $gameParty.gainItem(obj, 1); });
        return made.map(function(obj) { return obj.name; });
    };

    $.open = function(station) {
        $._station = $.STATIONS[station] ? station : 'campfire';
        SceneManager.push(Scene_SICraft);
    };

    //-------------------------------------------------------------------------
    // Party: characters who bring something the first time they join
    //-------------------------------------------------------------------------

    Game_Party.prototype.siGrantBrings = function(actorId) {
        var actor = $dataActors[actorId];
        $gameSystem._siBrought = $gameSystem._siBrought || {};
        if (!actor || $gameSystem._siBrought[actorId]) return;
        $gameSystem._siBrought[actorId] = true;
        var m = /<Brings:\s*([^>]+)>/i.exec(actor.note || '');
        if (m) $.parseRefs(m[1]).forEach(function(alts) { this.gainItem($.object(alts[0]), 1); }, this);
    };

    var _Game_Party_addActor = Game_Party.prototype.addActor;
    Game_Party.prototype.addActor = function(actorId) {
        _Game_Party_addActor.call(this, actorId);
        if (this._actors.indexOf(actorId) >= 0) this.siGrantBrings(actorId);
    };

    ['setupStartingMembers', 'setupBattleTestMembers'].forEach(function(name) {
        var original = Game_Party.prototype[name];
        Game_Party.prototype[name] = function() {
            original.apply(this, arguments);
            this._actors.forEach(this.siGrantBrings, this);
        };
    });

    //-------------------------------------------------------------------------
    // Windows
    //-------------------------------------------------------------------------

    function Window_SICraftStatus() { this.initialize.apply(this, arguments); }
    Window_SICraftStatus.prototype = Object.create(Window_Base.prototype);
    Window_SICraftStatus.prototype.constructor = Window_SICraftStatus;

    Window_SICraftStatus.prototype.initialize = function(x, y, width, station) {
        this._station = station;
        Window_Base.prototype.initialize.call(this, x, y, width, this.fittingHeight(4));
        this.refresh();
    };

    Window_SICraftStatus.prototype.refresh = function() {
        this.contents.clear();
        var w = this.contentsWidth(), lh = this.lineHeight(), s = $.session();
        this.changeTextColor(this.systemColor());
        this.drawText($.STATIONS[this._station], 0, 0, w);
        this.resetTextColor();
        if ($.isFireStation(this._station)) {
            this.drawText($.isLit(this._station) ? 'Fire: ' + s.charges + ' charge' + (s.charges === 1 ? '' : 's') + (s.smelt ? ' (hot enough for metal)' : '') : 'Not lit', 0, lh, w);
            this.changeTextColor(this.textColor(8));
            this.drawText('Unused fuel is lost when you', 0, lh * 2, w);
            this.drawText('leave the area.', 0, lh * 3, w);
            this.resetTextColor();
        } else {
            this.drawText('Materials + a fee.', 0, lh, w);
            this.drawCurrencyValue($gameParty.gold(), TextManager.currencyUnit, 0, lh * 2, w);
        }
    };

    function Window_SICraftCommand() { this.initialize.apply(this, arguments); }
    Window_SICraftCommand.prototype = Object.create(Window_Command.prototype);
    Window_SICraftCommand.prototype.constructor = Window_SICraftCommand;

    Window_SICraftCommand.prototype.initialize = function(x, y, width, station) {
        this._station = station;
        this._width = width;
        Window_Command.prototype.initialize.call(this, x, y);
    };

    Window_SICraftCommand.prototype.windowWidth = function() { return this._width; };

    Window_SICraftCommand.prototype.makeCommandList = function() {
        this.addCommand('Craft', 'craft', $.recipesAt(this._station).length > 0);
        if (this._station === 'campfire' && !$.isLit(this._station)) {
            this.addCommand('Light the fire', 'light', !!$.fireKit && $gameParty.hasItem($.fireKit));
        }
        if ($.isFireStation(this._station)) this.addCommand('Add fuel', 'fuel', $.isLit(this._station) && $.fuelItems().length > 0);
        this.addCommand('Leave', 'cancel');
    };

    function Window_SIRecipeList() { this.initialize.apply(this, arguments); }
    Window_SIRecipeList.prototype = Object.create(Window_Selectable.prototype);
    Window_SIRecipeList.prototype.constructor = Window_SIRecipeList;

    Window_SIRecipeList.prototype.initialize = function(x, y, width, height, station) {
        this._station = station;
        Window_Selectable.prototype.initialize.call(this, x, y, width, height);
        this.refresh();
    };

    Window_SIRecipeList.prototype.maxItems = function() { return this._list ? this._list.length : 0; };
    Window_SIRecipeList.prototype.item = function() { return this._list ? this._list[this.index()] : null; };
    Window_SIRecipeList.prototype.isCurrentItemEnabled = function() {
        return !!this.item() && $.canCraft(this.item(), this._station);
    };

    Window_SIRecipeList.prototype.refresh = function() {
        this._list = $.recipesAt(this._station);
        this.createContents();
        this.drawAllItems();
    };

    Window_SIRecipeList.prototype.drawItem = function(index) {
        var r = this._list[index], rect = this.itemRectForText(index);
        this.changePaintOpacity($.canCraft(r, this._station));
        this.drawText(r.name, rect.x, rect.y, rect.width - 120);
        var tags = (r.fee && !$.isFireStation(this._station) ? r.fee + ' ' + TextManager.currencyUnit : '') + (r.heat && $.isFireStation(this._station) ? ' fire' : '');
        this.drawText(tags.trim(), rect.x, rect.y, rect.width, 'right');
        this.changePaintOpacity(true);
    };

    Window_SIRecipeList.prototype.updateHelp = function() {
        var r = this.item();
        if (!r) { this._helpWindow.clear(); return; }
        var problem = $.problem(r, this._station);
        this._helpWindow.setText(r.item.description + (problem ? '\n' + problem : ''));
    };

    function Window_SIFuelList() { this.initialize.apply(this, arguments); }
    Window_SIFuelList.prototype = Object.create(Window_ItemList.prototype);
    Window_SIFuelList.prototype.constructor = Window_SIFuelList;

    Window_SIFuelList.prototype.initialize = function(x, y, width, height, station) {
        this._station = station;
        Window_ItemList.prototype.initialize.call(this, x, y, width, height);
    };
    Window_SIFuelList.prototype.maxCols = function() { return 1; };
    Window_SIFuelList.prototype.includes = function(item) { return !!item && item.siFuel > 0; };
    Window_SIFuelList.prototype.isEnabled = function(item) { return !!item; };
    Window_SIFuelList.prototype.drawItemNumber = function(item, x, y, width) {
        this.drawText('+' + $.fuelValue(item, this._station) + '  x' + $gameParty.numItems(item), x, y, width, 'right');
    };

    //-------------------------------------------------------------------------
    // Scene
    //-------------------------------------------------------------------------

    function Scene_SICraft() { this.initialize.apply(this, arguments); }
    Scene_SICraft.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_SICraft.prototype.constructor = Scene_SICraft;

    Scene_SICraft.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this._station = $._station || 'campfire';
        this.createHelpWindow();
        this._helpWindow.height = this._helpWindow.fittingHeight(3);
        this._helpWindow.createContents();
        var side = 380, y = this._helpWindow.height;
        this._statusWindow = new Window_SICraftStatus(0, y, side, this._station);
        this.addWindow(this._statusWindow);
        this._commandWindow = new Window_SICraftCommand(0, y + this._statusWindow.height, side, this._station);
        this._commandWindow.setHandler('craft', this.onCraft.bind(this));
        this._commandWindow.setHandler('light', this.onLight.bind(this));
        this._commandWindow.setHandler('fuel', this.onFuel.bind(this));
        this._commandWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._commandWindow);
        var lw = Graphics.boxWidth - side, lh = Graphics.boxHeight - y;
        this._listWindow = new Window_SIRecipeList(side, y, lw, lh, this._station);
        this._listWindow.setHelpWindow(this._helpWindow);
        this._listWindow.setHandler('ok', this.onRecipeOk.bind(this));
        this._listWindow.setHandler('cancel', this.onSubCancel.bind(this));
        this.addWindow(this._listWindow);
        this._fuelWindow = new Window_SIFuelList(side, y, lw, lh, this._station);
        this._fuelWindow.setHelpWindow(this._helpWindow);
        this._fuelWindow.setHandler('ok', this.onFuelOk.bind(this));
        this._fuelWindow.setHandler('cancel', this.onSubCancel.bind(this));
        this._fuelWindow.hide();
        this.addWindow(this._fuelWindow);
        this._helpWindow.setText($.isFireStation(this._station) ? 'Recipes that need the fire use 1 charge.' : 'They work for materials and a fee.');
    };

    Scene_SICraft.prototype.refreshAll = function() {
        this._statusWindow.refresh();
        this._commandWindow.refresh();
        this._listWindow.refresh();
        this._fuelWindow.refresh();
    };

    Scene_SICraft.prototype.onCraft = function() {
        this._fuelWindow.hide(); this._listWindow.show();
        this._listWindow.activate(); this._listWindow.select(Math.max(this._listWindow.index(), 0));
    };

    Scene_SICraft.prototype.onLight = function() {
        if ($.light()) SoundManager.playUseItem(); else SoundManager.playBuzzer();
        this.refreshAll();
        this._commandWindow.activate();
    };

    Scene_SICraft.prototype.onFuel = function() {
        this._listWindow.hide(); this._fuelWindow.show();
        this._fuelWindow.refresh(); this._fuelWindow.activate(); this._fuelWindow.select(0);
    };

    Scene_SICraft.prototype.onRecipeOk = function() {
        var made = $.craft(this._listWindow.item(), this._station);
        if (made) {
            SoundManager.playUseItem();
            this.refreshAll();
            this._helpWindow.setText('Made: ' + made.join(', ') + '.');
        } else {
            SoundManager.playBuzzer();
        }
        this._listWindow.activate();
    };

    Scene_SICraft.prototype.onFuelOk = function() {
        var item = this._fuelWindow.item();
        var added = $.addFuel(item, this._station);
        if (added) SoundManager.playUseItem(); else SoundManager.playBuzzer();
        this.refreshAll();
        if (added) this._helpWindow.setText(item.name + ' adds ' + added + ' charge' + (added === 1 ? '' : 's') + '.');
        if (this._fuelWindow.maxItems() > 0) {
            this._fuelWindow.select(Math.min(this._fuelWindow.index(), this._fuelWindow.maxItems() - 1));
            this._fuelWindow.activate();
        } else {
            this.onSubCancel();
        }
    };

    Scene_SICraft.prototype.onSubCancel = function() {
        this._fuelWindow.hide(); this._listWindow.show();
        this._listWindow.deselect();
        this._commandWindow.refresh();
        this._commandWindow.activate();
    };

    $.Scene = Scene_SICraft;
    window.Scene_SICraft = Scene_SICraft;

})(SmokingIsle.Crafting);
