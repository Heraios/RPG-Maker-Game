//=============================================================================
// SI_Gather.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: gathering spots for plants, wood, stone, ore,
 * fish and water. You pick who gathers; the job needs the right person and
 * the right tool equipped. Each spot gives once a day.
 * @author Smoking Isle
 *
 * @param Fatigue
 * @desc Fatigue the gatherer gains, by kind of job. Children pay half on
 * light work (low plants, fruit, shore).
 * @default wood 3, herb 2, food 2, stone 2, ore 4, dig 2, shore 2, fish 2, water 0
 *
 * @help
 * Place after SI_Time and SI_Gear.
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
 *
 * ============================================================================
 * Who gathers, and with what
 * ============================================================================
 * The player picks a party member. Only those who can do the job are
 * offered; if nobody can, a message says what's needed.
 *   Who:  anyone; adults only (big or hard trees, mining); people with
 *         actor note <Gathers: sacred> (sacred plants: Yoon, Sib, Juda,
 *         Falmi); <Gathers: fish> (Dama, Parl); <Gathers: cave> (Lasa).
 *   Tool, equipped by the gatherer:
 *         knife   any knife or ritual knife (plants)
 *         axe     any axe (trees); "metal axe" for hard woods
 *         pick    a weapon with <Pick> (ore: Copper or Bronze Pick)
 *         harpoon a weapon with <Harpoon> (fishing)
 *   Carried, not equipped: the Knapping Kit (knapping stone) and a
 *   Digging Stick (roots, clay, ochre, peat; it sometimes snaps into
 *   Scrap Wood). Soft herbs, fruit and crops are picked by hand.
 * A child counts as anyone who can wear Child-Sized gear.
 *
 * Actor note:  <Gathers Only: wood, ore, stone, water>
 *   the only kinds of job this actor knows how to do (Thenmy, a city boy:
 *   strength jobs, not knowledge ones). Kinds: wood, herb, food, stone, ore,
 *   dig, shore, fish, water.
 * Teaching (story events, script call):
 *   SmokingIsle.Gather.teach(11, 'fish')   Thenmy can now fish (the kind of
 *                                          job, and the fishing skill)
 *   SmokingIsle.Gather.teach(11, 'herb, food')   several at once
 *
 * Gathering tires the gatherer (Fatigue parameter; children pay half on
 * light work) and can wear the tool used, like a swing in battle. Logs and
 * other heavy extras only come when an adult does the cutting. A gatherer
 * who knows plants (Falmi) doubles a plant's rare extra.
 * Gear with <Forager> anywhere in the party (Patience's Forager's Pack)
 * doubles every rare extra.
 *
 * - Each spot gives once a day, then waits for the next dawn.
 * - At night, gathering needs a light, except for night-only plants.
 * - "dawn" spots (Fog Laurel) only give at dawn. A Bee Rock needs a Torch,
 *   which burns down smoking out the bees.
 *
 * Script calls (the Gather common event):
 *   SmokingIsle.Gather.ask(this)      who gathers?
 *   SmokingIsle.Gather.finish(this)   gather, and say what was found
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

    // who: any (default), adult, sacred, fish, cave.  tool: knife, axe, metal axe, pick, harpoon (equipped);
    // kit, stick (carried).  extraTool: the extra needs this carried tool too.
    // light: children pay half Fatigue.  heavy: the extra only comes when an adult gathers.
    $.TABLE = {
        // Woods: a branch, and from an adult rarely a log
        'Laurel':        { kind: 'wood', tool: 'axe', gives: 'Laurel Branch', extra: ['Laurel Log', 15], heavy: true },
        'Heather':       { kind: 'wood', tool: 'axe', gives: 'Heather Branch' },
        'Ash':           { kind: 'wood', tool: 'axe', gives: 'Ash Branch' },
        'Pine':          { kind: 'wood', tool: 'axe', gives: 'Pine Branch', extra: ['Pine Log', 15], heavy: true },
        'Juniper':       { kind: 'wood', tool: 'axe', gives: 'Juniper Branch', extra: ['Juniper Berries', 40] },
        'Yew':           { kind: 'wood', tool: 'axe', gives: 'Yew Branch' },
        'Wax Myrtle':    { kind: 'wood', tool: 'axe', gives: 'Wax Myrtle Branch', extra: ['Faya Berries', 40] },
        'Ebony':         { kind: 'wood', tool: 'metal axe', who: 'adult', gives: 'Ebony Branch', extra: ['Ebony Log', 10] },
        'Mahogany':      { kind: 'wood', tool: 'metal axe', who: 'adult', gives: 'Scrap Wood', extra: ['Mahogany Log', 30] },
        'Driftwood':     { kind: 'wood', gives: 'Scrap Wood', extra: ['Scrap Wood', 50], light: true },
        'Pine Resin':    { kind: 'herb', tool: 'knife', gives: 'Pine Pitch' },
        'Dragon Tree':   { kind: 'herb', tool: 'knife', gives: 'Dragon\'s Blood', extra: ['Dragonheart Branch', 15], heavy: true },
        'Honey Palm':    { kind: 'herb', tool: 'knife', gives: 'Palm Fronds', extra: ['Palm Sap', 25] },
        'Mulberry':      { kind: 'herb', tool: 'knife', gives: 'Mulberry Bark' },
        'Sandalwood':    { kind: 'wood', tool: 'knife', who: 'sacred', gives: 'Sandalwood Branch', chance: 50 },
        'Rain Tree':     { kind: 'herb', who: 'sacred', gives: 'Rain-Tree Branch', chance: 10, fallen: true },   // never cut: only what has fallen
        // Herbs: low plants, a knife; children do it best
        'Bitterwood':    { kind: 'herb', gives: 'Bitterwood', light: true },
        'Cliff Mint':    { kind: 'herb', gives: 'Cliff Mint', light: true },
        'Hill Thyme':    { kind: 'herb', gives: 'Hill Thyme', light: true },
        'Ironwort':      { kind: 'herb', gives: 'Ironwort', light: true },
        'Burnwort':      { kind: 'herb', gives: 'Burnwort', light: true },
        'Ti Plant':      { kind: 'herb', gives: 'Ti Leaves', extra: ['Ti Root', 25], extraTool: 'stick', light: true },
        'Yellowroot':    { kind: 'herb', tool: 'stick', gives: 'Yellowroot', light: true },
        'Wart Fern':     { kind: 'herb', who: 'cave', gives: 'Wart Fern', light: true },
        'Moon Sorrel':   { kind: 'herb', gives: 'Moon Sorrel', night: true, light: true },
        'Kava':          { kind: 'herb', tool: 'stick', who: 'sacred', gives: 'Kava' },
        'Pennyroyal':    { kind: 'herb', gives: 'Pennyroyal Sprig', light: true },
        'Ephedra':       { kind: 'herb', gives: 'Ephedra Twigs', light: true },
        'Milo':          { kind: 'herb', tool: 'knife', gives: 'Milo Bark' },
        'Spurge':        { kind: 'herb', tool: 'knife', gives: 'Spurge Milk', light: true },
        'Orchil':        { kind: 'herb', gives: 'Orchil Lichen', light: true },
        'Reed Bed':      { kind: 'herb', tool: 'knife', gives: 'Marsh Reed', extra: ['Marsh Reed', 50], light: true },
        'Gourd Vine':    { kind: 'herb', tool: 'knife', gives: 'Gourd', light: true },
        // Food plants
        'Barley':        { kind: 'food', gives: 'Barley', light: true },
        'Lentils':       { kind: 'food', gives: 'Lentils', light: true },
        'Grapevine':     { kind: 'food', gives: 'Grapes', light: true },
        'Syrup Berries': { kind: 'food', gives: 'Syrup Berries', light: true },
        'Strawberry Tree': { kind: 'food', gives: 'Strawberry-Tree Fruit', light: true },
        'Bracken':       { kind: 'food', tool: 'stick', gives: 'Fern-Root Flour', light: true },
        'Bee Rock':      { kind: 'food', tool: 'torch', gives: 'Wild Honey' },
        'Pine Cones':    { kind: 'food', gives: 'Pine Nuts', light: true },
        'Cosco Patch':   { kind: 'food', gives: 'Cosco Seeds', light: true },
        'Bean Field':    { kind: 'food', gives: 'Broad Beans', light: true },
        'Sweet Potato Patch': { kind: 'food', tool: 'stick', gives: 'Sweet Potato', light: true },
        'Taro Patch':    { kind: 'food', tool: 'stick', gives: 'Taro', light: true },
        'Cave Mushrooms': { kind: 'food', who: 'cave', gives: 'Cave Mushrooms', light: true },
        // Fae food (only Lasa and Falmi can eat it)
        'Bellflower Bush': { kind: 'food', gives: 'Bellflower Nectar', light: true },
        'Fog Laurel':    { kind: 'water', gives: 'Fog Drip', dawn: true },
        'Dead Laurel':   { kind: 'food', gives: 'Fairy Butter', light: true },
        'Goblin\'s Gold': { kind: 'food', who: 'cave', gives: 'Goblin\'s Gold', light: true },
        'Cave Pool':     { kind: 'food', who: 'cave', gives: 'Cave Pearls' },
        'Leaf Mould':    { kind: 'dig', gives: 'Leaf Mould', light: true },
        'Beard Lichen':  { kind: 'food', gives: 'Beard Lichen', light: true },
        // Stone: knapped loose with the Knapping Kit, or picked up
        'Obsidian':      { kind: 'stone', tool: 'kit', gives: 'Obsidian Shard' },
        'Chalcedony':    { kind: 'stone', tool: 'kit', gives: 'Chalcedony' },
        'Jasper':        { kind: 'stone', tool: 'kit', gives: 'Jasper' },
        'Basalt':        { kind: 'stone', tool: 'kit', gives: 'Basalt' },
        'Andesite':      { kind: 'stone', tool: 'kit', gives: 'Andesite' },
        'Olivine':       { kind: 'stone', tool: 'kit', gives: 'Volcano Tear', chance: 30 },
        'Trachyte Cliff': { kind: 'stone', tool: 'kit', gives: 'Fire Opal', chance: 5 },
        'Scoria':        { kind: 'stone', gives: 'Red Scoria' },
        'Pumice':        { kind: 'stone', gives: 'Pumice Stone', chance: 50, light: true },
        'Snowline Quartz': { kind: 'stone', gives: 'Snow Quartz', chance: 50, light: true },
        'Hot Spring':    { kind: 'stone', gives: 'Hot-Spring Sinter', chance: 40, extra: ['Chalcedony', 20] },
        'Sulfur Vent':   { kind: 'stone', gives: 'Sulfur Lump' },
        // Ore: mining, adults with a pick
        'Copper Vein':   { kind: 'ore', tool: 'pick', who: 'adult', gives: 'Copper Ore' },
        'Lead Vein':     { kind: 'ore', tool: 'pick', who: 'adult', gives: 'Lead Ore' },
        'Lodestone':     { kind: 'ore', tool: 'pick', who: 'adult', gives: 'Lodestone', chance: 30 },
        'Coal Seam':     { kind: 'ore', tool: 'pick', who: 'adult', gives: 'Brown Coal' },
        // Digging
        'Clay Pit':      { kind: 'dig', tool: 'stick', gives: 'Clay', extra: ['White Clay', 10] },
        'White Clay':    { kind: 'dig', tool: 'stick', gives: 'White Clay' },
        'Ochre':         { kind: 'dig', tool: 'stick', gives: 'Red Ochre' },
        'Salt Pan':      { kind: 'dig', gives: 'Sea Salt', light: true },
        'Peat Bog':      { kind: 'dig', tool: 'stick', gives: 'Peat' },
        // Shore and water
        'Shore Rocks':   { kind: 'shore', tool: 'knife', gives: 'Shellfish', extra: ['Shell', 25], light: true },
        'Tide Pool':     { kind: 'shore', gives: 'Shell', extra: ['Coral', 15], light: true },
        'Seabird Cliff': { kind: 'shore', gives: 'Seabird Feather', extra: ['Seabird Eggs', 25], light: true },
        'Fishing Spot':  { kind: 'fish', tool: 'harpoon', who: 'fish', gives: 'Raw Fish' },
        'Eel Pool':      { kind: 'fish', tool: 'harpoon', who: 'fish', gives: 'Raw Eel' },
        'Spring':        { kind: 'water', gives: 'Fresh Water' },
        'Sacred Well':   { kind: 'water', who: 'sacred', gives: 'Well Water' }
    };

    $.stickSnap = 5;   // % chance a Digging Stick snaps each use

    $.VERBS = { wood: 'cuts', herb: 'picks', food: 'gathers', stone: 'chips off', ore: 'breaks off', dig: 'digs up',
                shore: 'gathers', fish: 'catches', water: 'fills a gourd with' };
    $.WHO = { cave: 'cave', fish: 'fish', sacred: 'sacred' };

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

    $.isChild = function(actor) {
        return actor.isEquipAtypeOk(17) || (actor.isChild && actor.isChild());
    };

    $.gathers = function(actor, what) {
        var m = /<Gathers:\s*([^>]+)>/i.exec(actor.actor().note || '');
        var own = m ? m[1].split(',').map(function(s) { return s.trim().toLowerCase(); }) : [];
        return own.indexOf(what) >= 0 || $.taught(actor).indexOf(what) >= 0;
    };

    // What an actor has been taught in the story: SmokingIsle.Gather.teach(11, 'fish').
    $.taught = function(actor) {
        var all = ($gameSystem && $gameSystem._siGatherTaught) || {};
        return all[actor.actorId()] || [];
    };

    $.teach = function(actorId, what) {
        $gameSystem._siGatherTaught = $gameSystem._siGatherTaught || {};
        var list = $gameSystem._siGatherTaught[actorId] = $gameSystem._siGatherTaught[actorId] || [];
        String(what).split(',').map(function(w) { return w.trim().toLowerCase(); }).forEach(function(w) {
            if (w && list.indexOf(w) < 0) list.push(w);
        });
    };

    // <Gathers Only: wood, ore, stone, water>: the only kinds of job this actor knows how to do
    // (Thenmy, a city boy), plus anything taught since.
    $.kindAllowed = function(actor, entry) {
        var m = /<Gathers Only:\s*([^>]+)>/i.exec(actor.actor().note || '');
        if (!m) return true;
        var kinds = m[1].split(',').map(function(s) { return s.trim().toLowerCase(); }).concat($.taught(actor));
        return kinds.indexOf(entry.kind) >= 0;
    };

    $.whoCan = function(actor, entry) {
        if (!$.kindAllowed(actor, entry)) return false;
        var who = entry.who || 'any';
        if (who === 'adult') return !$.isChild(actor);
        if ($.WHO[who]) return $.gathers(actor, $.WHO[who]);
        return true;
    };

    // The equip slot of the tool the job needs (-1: none; null: no tool needed).
    $.toolSlot = function(actor, entry) {
        var tool = entry.tool;
        if (!tool || tool === 'kit' || tool === 'stick' || tool === 'torch') return null;
        var equips = actor.equips();
        for (var i = 0; i < equips.length; i++) {
            var w = equips[i];
            if (!DataManager.isWeapon(w)) continue;
            var pick = /<Pick>/i.test(w.note), metal = (w.siMoves || []).indexOf('metal') >= 0;
            if (tool === 'knife' && (w.wtypeId === 1 || w.wtypeId === 14)) return i;
            if (tool === 'axe' && w.wtypeId === 6 && !pick) return i;
            if (tool === 'metal axe' && w.wtypeId === 6 && !pick && metal) return i;
            if (tool === 'pick' && pick) return i;
            if (tool === 'harpoon' && /<Harpoon>/i.test(w.note)) return i;
        }
        return -1;
    };

    $.canGather = function(actor, entry) {
        return $.whoCan(actor, entry) && $.toolSlot(actor, entry) !== -1;
    };

    // Everyone in the party who could gather (not Patience, not the ghost).
    $.gatherers = function() {
        return $gameParty.allMembers().filter(function(a) {
            return !(a.isPseudoMember && a.isPseudoMember()) && !/<Equip Slots:\s*none>/i.test(a.actor().note);
        });
    };

    // What the job needs, for the "nobody can" message.
    $.needs = function(entry) {
        var tool = { knife: 'a knife', axe: 'an axe', 'metal axe': 'a metal axe', pick: 'a pick', harpoon: 'a harpoon' }[entry.tool];
        if (!tool && !entry.who) return 'Nobody can gather this.';
        var who = entry.who || 'any', people;
        if ($.WHO[who]) {
            people = $dataActors.filter(function(a) { return a && new RegExp('<Gathers:[^>]*\\b' + $.WHO[who] + '\\b', 'i').test(a.note); })
                .map(function(a) { return $gameActors.actor(a.id).name(); });
            people = people.length > 1 ? people.slice(0, -1).join(', ') + ' or ' + people[people.length - 1] : people[0];
        }
        if (who === 'adult') return 'This needs an adult' + (tool ? ' with ' + tool + ' equipped.' : '.');
        if (people) return (tool ? 'This needs ' + people + ', with ' + tool + ' equipped.' : 'Only ' + people + ' can gather this.');
        return 'This needs someone with ' + tool + ' equipped.';
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

    // Why nobody can gather here right now ('' if the spot is open).
    $.spotProblem = function(mapId, eventId, entry) {
        var T = SmokingIsle.Time;
        if (!entry) return 'Nothing to gather here.';
        if ($.isSpent(mapId, eventId)) return 'Nothing more here today.';
        if (entry.night && !T.isNight()) return 'You can\'t find it now. It only shows itself at night.';
        if (entry.dawn && T.period() !== T.DAWN) return 'There\'s nothing here now. It only comes at dawn.';
        if (!entry.night && !T.canSee()) return 'It\'s too dark to see. You need a light.';
        if (entry.tool === 'kit' && !$gameParty.hasItem($.find('Knapping Kit'))) return 'You need a Knapping Kit.';
        if (entry.tool === 'stick' && !$gameParty.hasItem($.find('Digging Stick'))) return 'You need a Digging Stick.';
        if (entry.tool === 'torch' && !$gameParty.hasItem($.find('Torch'))) return 'You need a Torch to smoke out the bees.';
        return '';
    };

    // Gather with this actor. Returns { ok, text, got: [names] }; shows nothing.
    $.gather = function(mapId, eventId, species, actor) {
        var entry = $.TABLE[species], problem = $.spotProblem(mapId, eventId, entry);
        if (problem) return { ok: false, text: problem };
        if (!actor || !$.canGather(actor, entry)) return { ok: false, text: $.needs(entry) };
        var adult = !$.isChild(actor), got = [];
        if (Math.random() * 100 < (entry.chance === undefined ? 100 : entry.chance)) got.push(entry.gives);
        var extraOk = !entry.extraTool || $gameParty.hasItem($.find('Digging Stick'));
        if (entry.extra && (!entry.heavy || adult) && extraOk) {
            var expert = /<Talk Specialty:[^>]*\bplant\b/i.test(actor.actor().note) && (entry.kind === 'herb' || entry.kind === 'food');
            var forager = $gameParty.allMembers().some(function(m) { return m.equips().some(function(e) { return e && /<Forager>/i.test(e.note); }); });
            if (Math.random() * 100 < entry.extra[1] * (expert ? 2 : 1) * (forager ? 2 : 1)) got.push(entry.extra[0]);
        }
        $.spent()[$.key(mapId, eventId)] = SmokingIsle.Time.day();
        $gameSelfSwitches.setValue([mapId, eventId, 'A'], true);
        var tire = ($.fatigue[entry.kind] || 0) * (entry.light && !adult ? 0.5 : 1);
        if (tire > 0 && actor.gainFatigue && !actor.hasNoFatigue()) actor.gainFatigue(tire);
        got.forEach(function(name) { $gameParty.gainItem($.find(name), 1); });
        var text;
        if (got.length === 0) text = entry.fallen ? 'Nothing has fallen today.' : actor.name() + ' searches, but finds nothing this time.';
        else if (entry.fallen) text = 'Beneath the tree, ' + actor.name() + ' finds ' + $.article(got[0]) + got[0] + '.';
        else text = actor.name() + ' ' + $.VERBS[entry.kind] + ' ' + got.map(function(n, i) { return (i ? 'and ' : '') + $.article(n) + n; }).join(' ') + '.';
        var slot = $.toolSlot(actor, entry);
        var worn = slot !== null && slot >= 0 && actor.rollWear ? actor.rollWear(slot) : null;
        if (entry.tool === 'torch') {
            $gameParty.loseItem($.find('Torch'), 1);
            worn = 'The Torch burns down, smoking out the bees.';
        }
        if ((entry.tool === 'stick' || (entry.extraTool === 'stick' && got.indexOf(entry.extra[0]) >= 0)) && Math.random() * 100 < $.stickSnap) {
            $gameParty.loseItem($.find('Digging Stick'), 1);
            $gameParty.gainItem($.find('Scrap Wood'), 1);
            worn = 'The Digging Stick snaps (Scrap Wood left over).';
        }
        return { ok: true, got: got, text: text, worn: worn };
    };

    $.article = function(name) {
        if (/^(Scrap|Peat|Clay|White Clay|Red Ochre|Sea Salt|Pine Pitch|Fresh|Well|Dragon's|Shellfish|Grapes|Lentils|Barley|Marsh Reed|Palm Fronds|Palm Sap|Mulberry|Spurge|Ti Leaves|Moon|Orchil|Brown|Fern|Syrup|Ephedra|Milo|Bitterwood|Cliff Mint|Hill Thyme|Ironwort|Burnwort|Yellowroot|Wart Fern|Raw|Seabird Eggs|Copper Ore|Lead Ore|Wild Honey|Pine Nuts|Cosco|Broad|Faya|Juniper Berries|Cave Mushrooms|Bellflower Nectar|Fog|Fairy|Goblin|Cave Pearls|Leaf Mould|Beard Lichen|Taro)/.test(name)) return 'some ';
        return /^[AEIOU]/i.test(name) ? 'an ' : 'a ';
    };

    //-------------------------------------------------------------------------
    // The common event: ask who gathers, then gather
    //-------------------------------------------------------------------------

    $.ASK = { wood: 'Who will cut it?', herb: 'Who will gather it?', food: 'Who will gather it?', stone: 'Who will work the stone?',
              ore: 'Who will mine it?', dig: 'Who will dig?', shore: 'Who will gather it?', fish: 'Who will fish?', water: 'Who will fetch it?' };

    $.ask = function(interpreter) {
        var eventId = interpreter.eventId ? interpreter.eventId() : interpreter._eventId;
        var mapId = $gameMap.mapId(), species = $.speciesOf($gameMap.event(eventId)), entry = $.TABLE[species];
        $.pending = null;
        var problem = $.spotProblem(mapId, eventId, entry);
        if (!problem) {
            var able = $.gatherers().filter(function(a) { return $.canGather(a, entry); });
            if (able.length === 0) problem = $.needs(entry);
            else {
                $.pending = { mapId: mapId, eventId: eventId, species: species, actors: able, choice: -1 };
                var names = able.map(function(a) {
                    var slot = $.toolSlot(a, entry);
                    return a.name() + (slot !== null && slot >= 0 ? ' (' + a.equips()[slot].name + ')' : '');
                });
                $gameMessage.add($.ASK[entry.kind]);
                $gameMessage.setChoices(names.concat(['Never mind']), 0, names.length);
                $gameMessage.setChoiceCallback(function(n) { $.pending.choice = n; });
            }
        }
        if (problem) $gameMessage.add(problem);
        interpreter.setWaitMode('message');
    };

    $.finish = function(interpreter) {
        var p = $.pending;
        $.pending = null;
        if (!p || p.choice < 0 || p.choice >= p.actors.length) return null;
        var result = $.gather(p.mapId, p.eventId, p.species, p.actors[p.choice]);
        $gameMessage.add(result.text);
        if (result.worn) $gameMessage.add(result.worn);
        interpreter.setWaitMode('message');
        return result;
    };
})(SmokingIsle.Gather);
