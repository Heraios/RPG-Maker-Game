//=============================================================================
// SI_Gather.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: gathering spots for plants, wood, stone, ore,
 * fish and water. Each spot gives once a day; some plants only at night.
 * @author Smoking Isle
 *
 * @param Fatigue
 * @desc Fatigue each battle-party member gains per gather, by kind.
 * @default wood 2, herb 1, food 1, stone 2, ore 3, dig 1, shore 1, fish 1, water 0
 *
 * @help
 * Place after SI_Time.
 *
 * ============================================================================
 * Making a gathering spot
 * ============================================================================
 * 1. Make a map event with a tree, plant or rock graphic.
 * 2. In its Note box, write the species:   <Gather: Laurel>
 * 3. Its only command: Call Common Event "Gather".
 * 4. Optional: a second page with Self Switch A as its condition and a
 *    stump / picked / empty graphic. Gathering turns A on; a new day (dawn,
 *    or sleeping) turns it off again.
 * Copy and paste the event for more of the same species.
 *
 * Rules:
 * - Each spot gives once a day, then waits for the next dawn.
 * - At night, gathering needs a light (a Torch, Myrtle Candle or Lamplight),
 *   except for night-only plants, which can only be picked at night.
 * - Some spots need a tool (stone and ore: the Knapping Kit's hammerstone;
 *   fishing: Fishing Gear or a net).
 * - Each gather tires the battle party a little (Fatigue parameter).
 * - Falmi, who knows plants, doubles the chance of a plant's rare extra.
 *
 * ============================================================================
 * The table
 * ============================================================================
 * $.TABLE below lists every species: what it gives (by database name), a
 * rare extra and its % chance, its kind (for the Fatigue cost and wording),
 * any tool, and "night" for night-only plants. "chance" below 100 means the
 * main find can fail ("Nothing has fallen today.").
 *
 * Script call (the common event): SmokingIsle.Gather.take(this)
 */

var Imported = Imported || {};
Imported.SI_Gather = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Gather = SmokingIsle.Gather || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_Gather');
    $.fatigue = {};
    String(params['Fatigue'] || '').split(',').forEach(function(part) {
        var m = /(\w+)\s+(\d+)/.exec(part);
        if (m) $.fatigue[m[1].toLowerCase()] = Number(m[2]);
    });

    var KIT = ['Knapping Kit'], NET = ['Fishing Gear', 'Palm-Fibre Net'];

    $.TABLE = {
        // Woods: a branch, rarely a log
        'Laurel':        { kind: 'wood', gives: 'Laurel Branch', extra: ['Laurel Log', 15] },
        'Heather':       { kind: 'wood', gives: 'Heather Branch' },
        'Ash':           { kind: 'wood', gives: 'Ash Branch' },
        'Pine':          { kind: 'wood', gives: 'Pine Branch', extra: ['Pine Log', 15] },
        'Pine Resin':    { kind: 'herb', gives: 'Pine Pitch' },
        'Juniper':       { kind: 'wood', gives: 'Juniper Branch' },
        'Ebony':         { kind: 'wood', gives: 'Ebony Branch', extra: ['Ebony Log', 10] },
        'Mahogany':      { kind: 'wood', gives: 'Scrap Wood', extra: ['Mahogany Log', 30] },
        'Yew':           { kind: 'wood', gives: 'Yew Branch' },
        'Dragon Tree':   { kind: 'herb', gives: 'Dragon\'s Blood', extra: ['Dragonheart Branch', 15] },
        'Sandalwood':    { kind: 'wood', gives: 'Sandalwood Branch', chance: 50 },
        'Wax Myrtle':    { kind: 'wood', gives: 'Wax Myrtle Branch' },
        'Honey Palm':    { kind: 'wood', gives: 'Palm Fronds', extra: ['Palm Sap', 25] },
        'Mulberry':      { kind: 'wood', gives: 'Mulberry Bark' },
        'Driftwood':     { kind: 'wood', gives: 'Scrap Wood', extra: ['Scrap Wood', 50] },
        'Rain Tree':     { kind: 'wood', gives: 'Rain-Tree Branch', chance: 10, fallen: true },   // never cut: only what has fallen
        // Herbs
        'Bitterwood':    { kind: 'herb', gives: 'Bitterwood' },
        'Cliff Mint':    { kind: 'herb', gives: 'Cliff Mint' },
        'Hill Thyme':    { kind: 'herb', gives: 'Hill Thyme' },
        'Ironwort':      { kind: 'herb', gives: 'Ironwort' },
        'Burnwort':      { kind: 'herb', gives: 'Burnwort' },
        'Ti Plant':      { kind: 'herb', gives: 'Ti Leaves', extra: ['Ti Root', 25] },
        'Yellowroot':    { kind: 'herb', gives: 'Yellowroot' },
        'Wart Fern':     { kind: 'herb', gives: 'Wart Fern' },
        'Moon Sorrel':   { kind: 'herb', gives: 'Moon Sorrel', night: true },
        'Pennyroyal':    { kind: 'herb', gives: 'Pennyroyal Sprig' },
        'Ephedra':       { kind: 'herb', gives: 'Ephedra Twigs' },
        'Milo':          { kind: 'herb', gives: 'Milo Bark' },
        'Spurge':        { kind: 'herb', gives: 'Spurge Milk' },
        'Orchil':        { kind: 'herb', gives: 'Orchil Lichen' },
        'Reed Bed':      { kind: 'herb', gives: 'Marsh Reed', extra: ['Marsh Reed', 50] },
        'Gourd Vine':    { kind: 'herb', gives: 'Gourd' },
        // Food plants
        'Barley':        { kind: 'food', gives: 'Barley' },
        'Lentils':       { kind: 'food', gives: 'Lentils' },
        'Grapevine':     { kind: 'food', gives: 'Grapes' },
        'Syrup Berries': { kind: 'food', gives: 'Syrup Berries' },
        'Strawberry Tree': { kind: 'food', gives: 'Strawberry-Tree Fruit' },
        'Bracken':       { kind: 'food', gives: 'Fern-Root Flour' },
        // Stone (the Knapping Kit's hammerstone)
        'Obsidian':      { kind: 'stone', gives: 'Obsidian Shard', tool: KIT },
        'Chalcedony':    { kind: 'stone', gives: 'Chalcedony', tool: KIT },
        'Jasper':        { kind: 'stone', gives: 'Jasper', tool: KIT },
        'Basalt':        { kind: 'stone', gives: 'Basalt', tool: KIT },
        'Andesite':      { kind: 'stone', gives: 'Andesite', tool: KIT },
        'Scoria':        { kind: 'stone', gives: 'Red Scoria' },
        'Pumice':        { kind: 'stone', gives: 'Pumice Stone', chance: 50 },
        'Olivine':       { kind: 'stone', gives: 'Volcano Tear', chance: 30, tool: KIT },
        'Trachyte Cliff': { kind: 'stone', gives: 'Fire Opal', chance: 5, tool: KIT },
        'Snowline Quartz': { kind: 'stone', gives: 'Snow Quartz', chance: 50 },
        'Hot Spring':    { kind: 'stone', gives: 'Hot-Spring Sinter', chance: 40, extra: ['Chalcedony', 20] },
        'Sulfur Vent':   { kind: 'stone', gives: 'Sulfur Lump' },
        // Ore (hammerstone too)
        'Copper Vein':   { kind: 'ore', gives: 'Copper Ore', tool: KIT },
        'Lead Vein':     { kind: 'ore', gives: 'Lead Ore', tool: KIT },
        'Lodestone':     { kind: 'ore', gives: 'Lodestone', chance: 30, tool: KIT },
        // Digging
        'Clay Pit':      { kind: 'dig', gives: 'Clay', extra: ['White Clay', 10] },
        'White Clay':    { kind: 'dig', gives: 'White Clay' },
        'Ochre':         { kind: 'dig', gives: 'Red Ochre' },
        'Salt Pan':      { kind: 'dig', gives: 'Sea Salt' },
        'Peat Bog':      { kind: 'dig', gives: 'Peat' },
        'Coal Seam':     { kind: 'ore', gives: 'Brown Coal', tool: KIT },
        // Shore and water
        'Shore Rocks':   { kind: 'shore', gives: 'Shellfish', extra: ['Shell', 25] },
        'Tide Pool':     { kind: 'shore', gives: 'Shell', extra: ['Coral', 15] },
        'Seabird Cliff': { kind: 'shore', gives: 'Seabird Feather', extra: ['Seabird Eggs', 25] },
        'Fishing Spot':  { kind: 'fish', gives: 'Raw Fish', tool: NET },
        'Eel Pool':      { kind: 'fish', gives: 'Raw Eel', tool: NET },
        'Spring':        { kind: 'water', gives: 'Fresh Water' },
        'Sacred Well':   { kind: 'water', gives: 'Well Water' }
    };

    $.VERBS = { wood: 'cut', herb: 'pick', food: 'gather', stone: 'chip off', ore: 'break off', dig: 'dig up',
                shore: 'gather', fish: 'catch', water: 'fill a gourd with' };

    //-------------------------------------------------------------------------
    // Lookups
    //-------------------------------------------------------------------------

    $.find = function(name) {
        var lists = [$dataItems, $dataArmors, $dataWeapons];
        for (var i = 0; i < lists.length; i++) {
            var hit = lists[i].filter(function(o) { return o && o.name === name; })[0];
            if (hit) return hit;
        }
        return null;
    };

    $.speciesOf = function(event) {
        var m = event && /<Gather:\s*([^>]+)>/i.exec((event.event && event.event().note) || '');
        return m ? m[1].trim() : '';
    };

    $.hasTool = function(entry) {
        if (!entry.tool) return true;
        return entry.tool.some(function(name) {
            var obj = $.find(name);
            return obj && $gameParty.hasItem(obj, true);
        });
    };

    $.hasPlantExpert = function() {
        return $gameParty.battleMembers().some(function(a) { return /<Talk Specialty:[^>]*\bplant\b/i.test(a.actor().note); });
    };

    //-------------------------------------------------------------------------
    // Spent spots: { "map:event": day }
    //-------------------------------------------------------------------------

    $.spent = function() {
        if (!$gameSystem._siGather) $gameSystem._siGather = {};
        return $gameSystem._siGather;
    };

    $.key = function(mapId, eventId) { return mapId + ':' + eventId; };

    $.isSpent = function(mapId, eventId) {
        var day = $.spent()[$.key(mapId, eventId)];
        return day !== undefined && day >= SmokingIsle.Time.day();
    };

    // A new day: every spot regrows and its Self Switch A goes off.
    $.regrow = function(today) {
        var spent = $.spent();
        Object.keys(spent).forEach(function(key) {
            if (spent[key] < today) {
                var p = key.split(':');
                $gameSelfSwitches.setValue([Number(p[0]), Number(p[1]), 'A'], false);
                delete spent[key];
            }
        });
    };
    SmokingIsle.Time.newDayListeners.push(function(day) { $.regrow(day); });

    //-------------------------------------------------------------------------
    // Gathering
    //-------------------------------------------------------------------------

    // Returns { ok, text, got: [names] }. Doesn't show anything.
    $.gather = function(mapId, eventId, species) {
        var T = SmokingIsle.Time, entry = $.TABLE[species];
        if (!entry) return { ok: false, text: 'Nothing to gather here.' };
        if ($.isSpent(mapId, eventId)) return { ok: false, text: 'Nothing more here today.' };
        if (entry.night && !T.isNight()) return { ok: false, text: 'You can\'t find it now. It only shows itself at night.' };
        if (!entry.night && T.isNight() && !T.hasLight()) return { ok: false, text: 'It\'s too dark to see. You need a light.' };
        if (!$.hasTool(entry)) {
            var tool = entry.tool.join(' or ');
            return { ok: false, text: 'You need ' + (/^[AEIOU]/i.test(tool) ? 'an ' : 'a ') + tool + '.' };
        }
        var got = [];
        if (Math.random() * 100 < (entry.chance === undefined ? 100 : entry.chance)) got.push(entry.gives);
        if (entry.extra) {
            var chance = entry.extra[1] * ((entry.kind === 'herb' || entry.kind === 'food') && $.hasPlantExpert() ? 2 : 1);
            if (Math.random() * 100 < chance) got.push(entry.extra[0]);
        }
        $.spent()[$.key(mapId, eventId)] = T.day();
        $gameSelfSwitches.setValue([mapId, eventId, 'A'], true);
        var tire = $.fatigue[entry.kind] || 0;
        if (tire > 0) $gameParty.battleMembers().forEach(function(a) { if (a.gainFatigue && !a.hasNoFatigue()) a.gainFatigue(tire); });
        got.forEach(function(name) { $gameParty.gainItem($.find(name), 1); });
        if (got.length === 0) {
            return { ok: true, got: got, text: entry.fallen ? 'Nothing has fallen today.' : 'You search, but find nothing this time.' };
        }
        var text = 'You ' + $.VERBS[entry.kind] + ' ' + got.map(function(n, i) { return (i ? 'and ' : '') + $.article(n) + n; }).join(' ') + '.';
        if (entry.fallen) text = 'Beneath the tree lies ' + $.article(got[0]) + got[0] + '.';
        return { ok: true, got: got, text: text };
    };

    $.article = function(name) {
        if (/^(Scrap|Peat|Clay|White Clay|Red Ochre|Sea Salt|Pine Pitch|Fresh|Well|Dragon's|Shellfish|Grapes|Lentils|Barley|Marsh Reed|Palm Fronds|Palm Sap|Mulberry|Spurge|Ti Leaves|Moon|Orchil|Brown|Fern|Syrup|Ephedra|Milo|Bitterwood|Cliff Mint|Hill Thyme|Ironwort|Burnwort|Yellowroot|Wart Fern|Raw|Seabird Eggs)/.test(name)) return 'some ';
        return /^[AEIOU]/i.test(name) ? 'an ' : 'a ';
    };

    // The common event: SmokingIsle.Gather.take(this)
    $.take = function(interpreter) {
        var eventId = interpreter.eventId ? interpreter.eventId() : interpreter._eventId;
        var event = $gameMap.event(eventId);
        var result = $.gather($gameMap.mapId(), eventId, $.speciesOf(event));
        $gameMessage.add(result.text);
        return result;
    };
})(SmokingIsle.Gather);
