//=============================================================================
// SI_Crawl.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: crawlways only the children fit through. The
 * adults wait behind and rejoin when you come back to them.
 * @author Smoking Isle
 *
 * @help
 * Place after SI_Idols.
 *
 * A crawlway is a map event with the destination in its Note box:
 *   <Crawlway: 5, 12, 8>        map 5, x 12, y 8
 *   <Crawlway: 5, 12, 8, 4>     ...facing left (2 down, 4 left, 6 right, 8 up)
 * and one command: Call Common Event "Crawlway".
 *
 * Only children fit (actor note <Child>, or anyone who can wear Child-Sized
 * gear: Yoon, Sib, Lasa, Tou, Falmi), and Patience. With adults in the
 * party, you choose: squeeze through with just the children, or stay
 * together. The adults wait on this map and rejoin as soon as the party is
 * back on it (through a crawlway or any other way). With no children in the
 * party, nobody fits.
 *
 * Script calls:
 *   SmokingIsle.Crawl.ask(this) / SmokingIsle.Crawl.finish()   the common event
 *   SmokingIsle.Crawl.regroup()   story events: the adults rejoin now
 */

var Imported = Imported || {};
Imported.SI_Crawl = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Crawl = SmokingIsle.Crawl || {};

(function($) {
    'use strict';

    $.fits = function(actor) {
        return (actor.isPseudoMember && actor.isPseudoMember()) || (actor.isChild && actor.isChild()) || actor.isEquipAtypeOk(17);
    };

    $.destination = function(event) {
        var m = event && /<Crawlway:\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(\d+))?\s*>/i.exec(event.event().note || '');
        return m ? { mapId: Number(m[1]), x: Number(m[2]), y: Number(m[3]), dir: Number(m[4] || 0) } : null;
    };

    // The adults waiting behind: { mapId, actorIds }.
    $.waiting = function() { return $gameSystem._siCrawlWaiting || null; };

    $.goThrough = function(dest) {
        var adults = $gameParty.allMembers().filter(function(a) { return !$.fits(a); });
        if (adults.length && !$.waiting()) {
            $gameSystem._siCrawlWaiting = { mapId: $gameMap.mapId(), actorIds: adults.map(function(a) { return a.actorId(); }) };
            adults.forEach(function(a) { $gameParty.removeActor(a.actorId()); });
        }
        $gamePlayer.reserveTransfer(dest.mapId, dest.x, dest.y, dest.dir, 0);
    };

    $.regroup = function() {
        var w = $.waiting();
        if (!w) return false;
        $gameSystem._siCrawlWaiting = null;
        w.actorIds.forEach(function(id) { $gameParty.addActor(id); });
        return true;
    };

    // Back on the map where the adults wait: they rejoin.
    var _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() {
        _Scene_Map_onMapLoaded.call(this);
        var w = $.waiting();
        if (w && w.mapId === $gameMap.mapId() && $.regroup()) {
            $gameMessage.add('The grown-ups were waiting for you. Everyone is together again.');
        }
    };

    $.ask = function(interpreter) {
        var eventId = interpreter.eventId ? interpreter.eventId() : interpreter._eventId;
        var dest = $.destination($gameMap.event(eventId)), members = $gameParty.allMembers();
        $.pending = null;
        if (!dest) return;
        var kids = members.filter(function(a) { return $.fits(a) && !(a.isPseudoMember && a.isPseudoMember()); });
        if (kids.length === 0) {
            $gameMessage.add('The crawlway is far too small for any of you.');
        } else if (kids.length === members.filter(function(a) { return !(a.isPseudoMember && a.isPseudoMember()); }).length) {
            $.pending = { dest: dest, choice: 0 };
            $gameMessage.add('You squeeze into the crawlway.');
        } else {
            $.pending = { dest: dest, choice: -1 };
            $gameMessage.add('Only the children can fit through. The grown-ups would have to wait here.');
            $gameMessage.setChoices(['Squeeze through', 'Stay together'], 0, 1);
            $gameMessage.setChoiceCallback(function(n) { $.pending.choice = n; });
        }
        interpreter.setWaitMode('message');
    };

    $.finish = function() {
        var p = $.pending;
        $.pending = null;
        if (!p || p.choice !== 0) return false;
        $.goThrough(p.dest);
        return true;
    };
})(SmokingIsle.Crawl);
