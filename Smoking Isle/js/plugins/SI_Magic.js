//=============================================================================
// SI_Magic.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: spell targeting extras (random hit counts, heal-and-revive).
 * @author Smoking Isle
 *
 * @help
 * Skill / item notes:
 *
 *   <Random Hits: 2-5>
 *     For "random enemy" scopes: hits a random target between 2 and 5 times
 *     (rolled each use). Used by the -hari spells.
 *
 *   <Include Dead Allies>
 *     For "all allies" scopes: also targets knocked-out allies, so one spell
 *     can heal the living and revive the fallen (Mahu-Ara). Use b.isDead()
 *     in the damage formula to treat them differently; healing a knocked-out
 *     ally revives them.
 */

var Imported = Imported || {};
Imported.SI_Magic = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Magic = SmokingIsle.Magic || {};

(function($) {
    'use strict';

    $.randomHits = function(item) {
        var m = item && /<Random Hits:\s*(\d+)\s*-\s*(\d+)>/i.exec(item.note);
        return m ? { min: Number(m[1]), max: Number(m[2]) } : null;
    };

    $.includesDead = function(item) {
        return !!item && /<Include Dead Allies>/i.test(item.note);
    };

    var _Game_Action_numTargets = Game_Action.prototype.numTargets;
    Game_Action.prototype.numTargets = function() {
        var hits = $.randomHits(this.item());
        if (hits && this.isForRandom()) {
            return hits.min + Math.randomInt(hits.max - hits.min + 1);
        }
        return _Game_Action_numTargets.call(this);
    };

    var _Game_Action_targetsForFriends = Game_Action.prototype.targetsForFriends;
    Game_Action.prototype.targetsForFriends = function() {
        if ($.includesDead(this.item()) && this.isForAll()) {
            return this.friendsUnit().members().filter(function(member) {
                return member.isAppeared();
            });
        }
        return _Game_Action_targetsForFriends.call(this);
    };

    var _Game_Action_testApply = Game_Action.prototype.testApply;
    Game_Action.prototype.testApply = function(target) {
        if ($.includesDead(this.item()) && this.isForFriend()) {
            return $gameParty.inBattle() || target.isDead() ||
                (this.isHpRecover() && target.hp < target.mhp) || this.hasItemAnyValidEffects(target);
        }
        return _Game_Action_testApply.call(this, target);
    };

})(SmokingIsle.Magic);
