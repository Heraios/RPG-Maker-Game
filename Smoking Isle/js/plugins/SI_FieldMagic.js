//=============================================================================
// SI_FieldMagic.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: spells used from the menu on the map. Pura (a
 * light), Tikea (reveals secrets) and Garo (wandering enemies don't notice).
 * @author Smoking Isle
 *
 * @param Pura Steps
 * @type number
 * @desc Steps Pura's light lasts (a Torch is 300).
 * @default 200
 *
 * @param Tikea Range
 * @type number
 * @desc How many tiles away Tikea reveals secrets.
 * @default 8
 *
 * @param Garo Steps
 * @type number
 * @desc Steps the party stays unnoticed by wandering enemies.
 * @default 120
 *
 * @param Veil Steps
 * @type number
 * @desc Steps Moonmilk Paint hides the party from wandering spirits.
 * @default 200
 *
 * @param Ghost Region
 * @type number
 * @desc Region ID of the ghost-only crossing: only the Ghost (actor 1) can
 * cross these tiles; everyone else is blocked.
 * @default 10
 *
 * @param Reveal Animation
 * @type animation
 * @desc Played on each secret Tikea reveals.
 * @default 92
 *
 * @help
 * Place after SI_Time and SI_Wanderers.
 *
 * Each spell is a skill with the effect "Common Event" (19 Pura, 20 Tikea,
 * 21 Garo); the common event calls one of these:
 *   SmokingIsle.FieldMagic.pura()     a light for Pura Steps
 *   SmokingIsle.FieldMagic.tikea()    reveals secrets in range; returns how many
 *   SmokingIsle.FieldMagic.garo()     unnoticed for Garo Steps
 *
 * Moonmilk Paint (item 278), used from the menu: common event 22 calls
 *   SmokingIsle.FieldMagic.veil()    wandering spirits (and the dead) don't
 *                                    notice the party for Veil Steps
 *
 * The ghost-only crossing: paint Region 10 (the Ghost Region parameter) on
 * the tiles only a spirit can cross, like the warm crack through the old
 * flow front on map 1. While the Ghost (actor 1) leads the party it can
 * cross them, even over walls; nobody else can (Yoon with a body, the
 * living children in Act 2). Events aren't affected.
 *
 * Secrets: an event with <Secret> in its note is invisible, walk-through and
 * can't be examined until Tikea reveals it (for good). Hidden caches, a
 * crack in a wall, a buried thing. Script: SmokingIsle.FieldMagic.reveal(id)
 * reveals one by hand (a story moment).
 */

var Imported = Imported || {};
Imported.SI_FieldMagic = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.FieldMagic = SmokingIsle.FieldMagic || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_FieldMagic');
    $.puraSteps = Number(params['Pura Steps'] || 200);
    $.tikeaRange = Number(params['Tikea Range'] || 8);
    $.garoSteps = Number(params['Garo Steps'] || 120);
    $.veilSteps = Number(params['Veil Steps'] || 200);
    $.ghostRegion = Number(params['Ghost Region'] || 10);
    $.GHOST_ACTOR = 1;
    $.revealAnimation = Number(params['Reveal Animation'] || 92);

    // The ghost-only crossing (Region 10): the Ghost crosses, even over walls; nobody else can.
    $.isGhostLeading = function() { var l = $gameParty.leader(); return !!l && l.actorId() === $.GHOST_ACTOR; };
    var _Game_Player_isMapPassable = Game_Player.prototype.isMapPassable;
    Game_Player.prototype.isMapPassable = function(x, y, d) {
        var x2 = $gameMap.roundXWithDirection(x, d), y2 = $gameMap.roundYWithDirection(y, d);
        var here = $gameMap.regionId(x, y) === $.ghostRegion, there = $gameMap.regionId(x2, y2) === $.ghostRegion;
        if (there) return $.isGhostLeading();
        if (here && $.isGhostLeading()) return $gameMap.isValid(x2, y2) && $gameMap.isPassable(x2, y2, this.reverseDir(d));
        return _Game_Player_isMapPassable.call(this, x, y, d);
    };

    // Pura: a light, like a Torch (SI_Time).
    $.pura = function() { SmokingIsle.Time.lightFor($.puraSteps); };

    // Secrets: hidden until revealed.
    $.revealed = function() { return $gameSystem._siSecrets = $gameSystem._siSecrets || {}; };
    $.key = function(mapId, eventId) { return mapId + ':' + eventId; };
    $.isSecret = function(event) {
        if (event._siSecret === undefined) event._siSecret = /<Secret>/i.test((event.event() && event.event().note) || '');
        return event._siSecret;
    };
    $.isHidden = function(event) { return $.isSecret(event) && !$.revealed()[$.key(event._mapId, event._eventId)]; };
    $.reveal = function(eventId) {
        var e = $gameMap.event(eventId); if (!e) return;
        $.revealed()[$.key($gameMap.mapId(), eventId)] = true;
        e.requestAnimation($.revealAnimation);
    };
    $.tikea = function() {
        var found = 0;
        $gameMap.events().forEach(function(e) {
            if (!$.isHidden(e)) return;
            if (Math.abs(e.x - $gamePlayer.x) + Math.abs(e.y - $gamePlayer.y) > $.tikeaRange) return;
            $.reveal(e.eventId()); found++;
        });
        return found;
    };

    var _isTransparent = Game_Event.prototype.isTransparent;
    Game_Event.prototype.isTransparent = function() { return $.isHidden(this) || _isTransparent.call(this); };
    var _isThrough = Game_Event.prototype.isThrough;
    Game_Event.prototype.isThrough = function() { return $.isHidden(this) || _isThrough.call(this); };
    var _start = Game_Event.prototype.start;
    Game_Event.prototype.start = function() { if ($.isHidden(this)) return; _start.call(this); };

    // Garo: wandering enemies don't notice the party for a while.
    $.unseenSteps = function() { return $gameSystem._siUnseen || 0; };
    $.garo = function() {
        $gameSystem._siUnseen = $.garoSteps;
        $gameMap.events().forEach(function(e) { if (e._siMode === 'chase') e._siMode = 'wander'; });
    };
    // Moonmilk Paint: wandering spirits (Talk Type: spirit; the dead are spirits) take the party for the dead.
    $.veiledSteps = function() { return $gameSystem._siVeiled || 0; };
    $.veil = function() {
        $gameSystem._siVeiled = $.veilSteps;
        $gameMap.events().forEach(function(e) { if (e._siMode === 'chase' && $.isSpiritWanderer(e)) e._siMode = 'wander'; });
    };
    $.isSpiritWanderer = function(event) {
        var w = event.wanderer && event.wanderer(), troop = w && $dataTroops[w.troopId];
        if (!troop) return false;
        var members = troop.members.map(function(m) { return $dataEnemies[m.enemyId]; }).filter(Boolean);
        return members.length > 0 && members.every(function(en) { return /<Talk Type:\s*spirit>/i.test(en.note || ''); });
    };
    if (Game_Event.prototype.canSeeParty) {
        var _canSeeParty = Game_Event.prototype.canSeeParty;
        Game_Event.prototype.canSeeParty = function() {
            if ($.unseenSteps() > 0) return false;
            if ($.veiledSteps() > 0 && $.isSpiritWanderer(this)) return false;
            return _canSeeParty.call(this);
        };
    }
    var _increaseSteps = Game_Party.prototype.increaseSteps;
    Game_Party.prototype.increaseSteps = function() {
        _increaseSteps.call(this);
        if ($gameSystem._siVeiled > 0) {
            $gameSystem._siVeiled--;
            if ($gameSystem._siVeiled === 0 && SmokingIsle.Journal && SmokingIsle.Journal.notice) SmokingIsle.Journal.notice('The moonmilk paint flakes away.');
        }
        if ($gameSystem._siUnseen > 0) {
            $gameSystem._siUnseen--;
            if ($gameSystem._siUnseen === 0 && SmokingIsle.Journal && SmokingIsle.Journal.notice) SmokingIsle.Journal.notice('Garo wears off.');
        }
    };

})(SmokingIsle.FieldMagic);
