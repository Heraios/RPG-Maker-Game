//=============================================================================
// SI_Time.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: day and night. Four periods that pass by walking
 * and sleeping, with screen tints, night encounters, light sources and a sundial.
 * @author Smoking Isle
 *
 * @param Steps Per Period
 * @desc Steps walked outdoors before Dawn turns to Day, Day to Dusk, and so on.
 * @default 400
 *
 * @param Battle Steps
 * @desc A battle outdoors counts as this many steps.
 * @default 40
 *
 * @param Period Variable
 * @desc Variable that holds the period: 0 Dawn, 1 Day, 2 Dusk, 3 Night.
 * @default 2
 *
 * @param Day Variable
 * @desc Variable that holds the day number (the game starts on day 1).
 * @default 3
 *
 * @param Night Switch
 * @desc Switch that is ON at night, for event page conditions.
 * @default 7
 *
 * @param Tints
 * @desc Screen tone (red, green, blue, grey) outdoors for Dawn; Day; Dusk;
 * Night; and Night with a light.
 * @default 30,-5,-30,0; 0,0,0,0; 40,-15,-45,0; -90,-70,-10,60; -45,-35,-15,30
 *
 * @param Dark Tints
 * @desc Screen tone in darkness (map note <Dark>, or <Dark At Night> at
 * night): without a light; and with one.
 * @default -150,-150,-130,110; -60,-60,-75,40
 *
 * @param Dark Hit Penalty
 * @desc Hit lost by the party fighting in darkness without a light (15 = 15%).
 * Enemies there are used to the dark.
 * @default 15
 *
 * @param Sight Switch
 * @desc Switch that is ON while the party can see (not in darkness without a
 * light), for events only found by lamplight.
 * @default 8
 *
 * @param Night Mood
 * @desc How Talk moods start at night, by kind of enemy.
 * @default spirit 10, animal -10
 *
 * @help
 * Place after SI_Talk and SI_Crafting.
 *
 * ============================================================================
 * Time
 * ============================================================================
 * The day has four periods: Dawn, Day, Dusk and Night. The game starts at
 * Day on day 1. Walking outdoors passes time (Steps Per Period), and so does
 * a battle outdoors (Battle Steps). Indoors and in caves (map note <Indoors>
 * or <Cave>) time stands still. Night turns to Dawn of the next day.
 *
 * Script calls:
 *   SmokingIsle.Time.sleep()        sleep until the next dawn (a new day)
 *   SmokingIsle.Time.setPeriod(3)   story events: jump to a period (0-3);
 *                                   going back past Dawn starts a new day
 *   SmokingIsle.Time.isNight()
 *   SmokingIsle.Time.sundial()      the sundial's reading, as a message
 *
 * The Period and Day variables and the Night switch are kept up to date for
 * event page conditions (the river ghost only appears when Night is ON).
 *
 * ============================================================================
 * Tints and light
 * ============================================================================
 * Outdoor maps take the period's tint. Map note <No Time Tint> opts out.
 * At night the tint is lighter while the party has a light:
 *   Item note:  <Field Light: 300>   used from the menu, lights the way for
 *                                    300 steps (Torch, Myrtle Candle)
 *   State or gear note: <Light>      a party member with it carries a light
 *                                    (Lamplight; Patience's Lamp Pack)
 * At night outdoors, and anywhere dark, gathering needs a light, except for
 * night-only plants. A light burns down as you walk outdoors or in the dark.
 *
 * ============================================================================
 * Darkness
 * ============================================================================
 * Map note:  <Dark>            always dark (caves, abandoned buildings)
 *            <Dark At Night>   dark at night (forests)
 * Darkness is much darker than night unless the party carries a light.
 * Without one, the party loses hit in battle (Dark Hit Penalty), gathering
 * finds nothing, and the Sight Switch is OFF (events with it as a page
 * condition only appear by lamplight).
 *
 * Skill note: <Dark Bonus>   in the dark or outdoors at night, the skill's
 *                            states land 25% more often and last a turn
 *                            longer (Keva, the blinding spells).
 *
 * ============================================================================
 * Night encounters and moods
 * ============================================================================
 * Map note:  <Night Troops: 14, 15>   at night these troops replace the
 *                                     map's encounter list
 * Talk moods start differently at night (Night Mood): spirits friendlier,
 * animals warier.
 *
 * ============================================================================
 * Sundial
 * ============================================================================
 * Item note: <Sundial>. Give it a Common Event effect that runs
 * SmokingIsle.Time.sundial(). It reads the time outdoors by day; at night it
 * has no shadow, and indoors no sun.
 */

var Imported = Imported || {};
Imported.SI_Time = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Time = SmokingIsle.Time || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_Time');
    $.stepsPerPeriod = Number(params['Steps Per Period'] || 400);
    $.battleSteps = Number(params['Battle Steps'] || 40);
    $.periodVariable = Number(params['Period Variable'] || 0);
    $.dayVariable = Number(params['Day Variable'] || 0);
    $.nightSwitch = Number(params['Night Switch'] || 0);
    $.tints = String(params['Tints'] || '0,0,0,0;0,0,0,0;0,0,0,0;0,0,0,0;0,0,0,0').split(';').map(function(t) {
        return t.split(',').map(Number);
    });
    var dark = String(params['Dark Tints'] || '-150,-150,-130,110;-60,-60,-75,40').split(';').map(function(t) { return t.split(',').map(Number); });
    $.darkTone = dark[0]; $.darkLitTone = dark[1] || dark[0];
    $.darkHitPenalty = Number(params['Dark Hit Penalty'] || 0) / 100;
    $.sightSwitch = Number(params['Sight Switch'] || 0);
    $.nightMood = {};
    String(params['Night Mood'] || '').split(',').forEach(function(part) {
        var m = /([\w-]+)\s+([+-]?\d+)/.exec(part);
        if (m) $.nightMood[m[1].toLowerCase()] = Number(m[2]);
    });

    $.DAWN = 0; $.DAY = 1; $.DUSK = 2; $.NIGHT = 3;
    $.NAMES = ['dawn', 'day', 'dusk', 'night'];

    //-------------------------------------------------------------------------
    // State
    //-------------------------------------------------------------------------

    $.state = function() {
        if (!$gameSystem._siTime) $gameSystem._siTime = { day: 1, period: $.DAY, steps: 0, light: 0 };
        return $gameSystem._siTime;
    };

    $.period = function() { return $.state().period; };
    $.day = function() { return $.state().day; };
    $.isNight = function() { return $.period() === $.NIGHT; };
    $.periodName = function() { return $.NAMES[$.period()]; };

    $.mapNote = function() { return ($dataMap && $dataMap.note) || ''; };
    $.isOutdoors = function() { return !!$dataMap && !/<(Indoors|Cave)>/i.test($.mapNote()); };

    $.syncVariables = function() {
        if ($.periodVariable) $gameVariables.setValue($.periodVariable, $.period());
        if ($.dayVariable) $gameVariables.setValue($.dayVariable, $.day());
        if ($.nightSwitch) $gameSwitches.setValue($.nightSwitch, $.isNight());
        if ($.sightSwitch && $dataMap) $gameSwitches.setValue($.sightSwitch, $.canSee());
    };

    // Darkness: <Dark> always, <Dark At Night> at night.
    $.isDark = function() {
        var note = $.mapNote();
        return /<Dark>/i.test(note) || (/<Dark At Night>/i.test(note) && $.isNight());
    };

    // Somewhere a light is needed: darkness, or outdoors at night.
    $.needsLight = function() {
        return $.isDark() || ($.isNight() && $.isOutdoors());
    };

    $.canSee = function() {
        return !$.needsLight() || $.hasLight();
    };

    // Listeners for a new day (gathering spots regrow).
    $.newDayListeners = [];

    $.startDay = function() {
        $.newDayListeners.forEach(function(fn) { fn($.day()); });
    };

    $.setPeriod = function(period) {
        var s = $.state();
        period = Number(period).clamp(0, 3);
        if (period < s.period) { s.day += 1; s.period = period; s.steps = 0; $.syncVariables(); $.startDay(); }
        else { s.period = period; s.steps = 0; $.syncVariables(); }
        $.refreshTint(60);
    };

    $.advance = function() {
        var s = $.state();
        s.steps = 0;
        if (s.period === $.NIGHT) { s.period = $.DAWN; s.day += 1; $.syncVariables(); $.startDay(); }
        else { s.period += 1; $.syncVariables(); }
        $.refreshTint(120);
    };

    $.addSteps = function(n) {
        var s = $.state();
        s.steps += n;
        while (s.steps >= $.stepsPerPeriod) {
            var over = s.steps - $.stepsPerPeriod;
            $.advance();
            s.steps = over;
        }
    };

    // Sleep until the next dawn: always a new day.
    $.sleep = function() {
        var s = $.state();
        s.day += 1; s.period = $.DAWN; s.steps = 0;
        $.syncVariables();
        $.startDay();
        $.refreshTint(0);
    };

    //-------------------------------------------------------------------------
    // Light and tint
    //-------------------------------------------------------------------------

    $.hasLight = function() {
        if ($.state().light > 0) return true;
        return $gameParty.allMembers().some(function(actor) {
            return actor.states().concat(actor.equips()).some(function(obj) { return obj && /<Light>/i.test(obj.note || ''); });
        });
    };

    $.tone = function() {
        if ($.isDark()) return $.hasLight() ? $.darkLitTone : $.darkTone;
        if (!$.isOutdoors() || /<No Time Tint>/i.test($.mapNote())) return [0, 0, 0, 0];
        if ($.isNight() && $.hasLight()) return $.tints[4] || $.tints[3];
        return $.tints[$.period()];
    };

    $.refreshTint = function(duration) {
        if (!$gameScreen || !$dataMap || $gameParty.inBattle()) return;
        if ($.sightSwitch) $gameSwitches.setValue($.sightSwitch, $.canSee());
        $gameScreen.startTint($.tone(), duration || 0);
    };

    $.lightFor = function(steps) {
        $.state().light = Math.max($.state().light, steps);
        $.refreshTint(30);
    };

    var _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() {
        _Scene_Map_onMapLoaded.call(this);
        $.syncVariables();
        $.refreshTint(0);
    };

    var _Game_Party_increaseSteps = Game_Party.prototype.increaseSteps;
    Game_Party.prototype.increaseSteps = function() {
        _Game_Party_increaseSteps.call(this);
        var s = $.state();
        if (s.light > 0 && ($.isOutdoors() || $.isDark())) {
            s.light -= 1;
            if (s.light === 0) $.refreshTint(60);
        }
        if ($.isOutdoors()) $.addSteps(1);
    };

    var _BattleManager_endBattle = BattleManager.endBattle;
    BattleManager.endBattle = function(result) {
        _BattleManager_endBattle.call(this, result);
        if ($.isOutdoors()) $.addSteps($.battleSteps);
    };

    // Fighting in darkness without a light: the party's hit drops.
    var _Game_Actor_xparam = Game_Actor.prototype.xparam;
    Game_Actor.prototype.xparam = function(xparamId) {
        var value = _Game_Actor_xparam.call(this, xparamId);
        if (xparamId === 0 && $dataMap && $gameParty.inBattle() && !$.canSee()) value -= $.darkHitPenalty;
        return value;
    };

    // <Dark Bonus> skills: states land more often and last longer where it's dark.
    $.darkBonus = function(item) {
        return !!item && /<Dark Bonus>/i.test(item.note || '') && !!$dataMap && $.needsLight();
    };

    var _Game_Action_itemEffectAddState = Game_Action.prototype.itemEffectAddState;
    Game_Action.prototype.itemEffectAddState = function(target, effect) {
        if (!$.darkBonus(this.item()) || effect.dataId === 0) return _Game_Action_itemEffectAddState.call(this, target, effect);
        var e = { code: effect.code, dataId: effect.dataId, value1: Math.min(1, effect.value1 * 1.25), value2: effect.value2 };
        var had = target.isStateAffected(e.dataId);
        _Game_Action_itemEffectAddState.call(this, target, e);
        if (!had && target.isStateAffected(e.dataId)) target._stateTurns[e.dataId] += 1;
    };

    // <Field Light: N> items work from the menu.
    $.fieldLight = function(item) {
        var m = item && /<Field Light:\s*(\d+)>/i.exec(item.note || '');
        return m ? Number(m[1]) : 0;
    };

    var _Game_Action_applyGlobal = Game_Action.prototype.applyGlobal;
    Game_Action.prototype.applyGlobal = function() {
        _Game_Action_applyGlobal.call(this);
        var steps = $.fieldLight(this.item());
        if (steps > 0 && !$gameParty.inBattle()) $.lightFor(steps);
    };

    var _Scene_ItemBase_isItemEffectsValid = Scene_ItemBase.prototype.isItemEffectsValid;
    Scene_ItemBase.prototype.isItemEffectsValid = function() {
        if ($.fieldLight(this.item()) > 0) return true;
        return _Scene_ItemBase_isItemEffectsValid.call(this);
    };

    //-------------------------------------------------------------------------
    // Night encounters and Talk moods
    //-------------------------------------------------------------------------

    var _Game_Map_encounterList = Game_Map.prototype.encounterList;
    Game_Map.prototype.encounterList = function() {
        var m = /<Night Troops:\s*([^>]+)>/i.exec($.mapNote());
        if (m && $.isNight()) {
            return m[1].split(',').map(Number).filter(Boolean).map(function(id) {
                return { troopId: id, weight: 10, regionSet: [] };
            });
        }
        return _Game_Map_encounterList.call(this);
    };

    if (SmokingIsle.Talk && SmokingIsle.Talk.startMoodBonus) {
        var _startMoodBonus = SmokingIsle.Talk.startMoodBonus;
        SmokingIsle.Talk.startMoodBonus = function(enemy) {
            var bonus = _startMoodBonus.call(this, enemy);
            if (!$.isNight()) return bonus;
            var kinds = enemy.talkData().kinds || [];
            return bonus + kinds.reduce(function(sum, k) { return sum + ($.nightMood[k] || 0); }, 0);
        };
    }

    //-------------------------------------------------------------------------
    // Sundial
    //-------------------------------------------------------------------------

    $.sundialText = function() {
        if (!$.isOutdoors()) return 'There\'s no sun in here to read.';
        if ($.isNight()) return 'No shadow at night. It\'s night, on day ' + $.day() + '.';
        var shadow = ['The shadow is long and pale: dawn', 'The shadow is short: the middle of the day',
                      'The shadow stretches out: dusk'][$.period()];
        return shadow + ', on day ' + $.day() + '.';
    };

    $.sundial = function() {
        $gameMessage.add($.sundialText());
    };
})(SmokingIsle.Time);
