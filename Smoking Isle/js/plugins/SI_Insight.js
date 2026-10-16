//=============================================================================
// SI_Insight.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: what Insight (level) does, and shared Yoon Insight.
 * @author Smoking Isle
 *
 * @param Evasion Per Insight
 * @desc Evasion added per Insight point above 1 (0.005 = +0.5%).
 * @default 0.005
 *
 * @param Mental Resist Per Insight
 * @desc Mental states and Mind element land this much less often per
 * Insight point above 1 (0.02 = 2% less). Never below 0.
 * @default 0.02
 *
 * @param Mental States
 * @desc State ids counted as mental.
 * @default 152,153,154,42,79,155,156
 *
 * @param Mind Element
 * @type number
 * @desc Element id of Mind (0 = none).
 * @default 11
 *
 * @param Fatigue Resist Per Insight
 * @desc Fatigue builds this much slower per Insight point above 1
 * (0.01 = 1% slower). Applies to TP Charge Rate.
 * @default 0.01
 *
 * @param Shared Insight Actors
 * @desc Actors who share one Insight (Ghost and Human Yoon).
 * @default 1,2
 *
 * @help
 * Insight is the level. It raises MDF and LUK through the class parameter
 * curves (set in the database), and this plugin adds, per Insight point
 * above 1:
 *   - evasion
 *   - resistance to mental states and the Mind element
 *   - slower Fatigue build-up
 *
 * Per-class overrides (class note):
 *   <Insight Evasion: 0.01>
 *   <Insight Mental Resist: 0.03>
 *   <Insight Fatigue Resist: 0.02>
 *
 * Insight caps are each actor's "Max Level" in the database.
 *
 * Shared Insight Actors always have the same EXP: when one gains or loses
 * EXP, the others are set to match (silently).
 */

var Imported = Imported || {};
Imported.SI_Insight = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Insight = SmokingIsle.Insight || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_Insight');
    var list = function(text) {
        return String(text || '').split(',').map(Number).filter(function(n) { return n > 0; });
    };
    $.evasion = Number(params['Evasion Per Insight'] || 0);
    $.mentalResist = Number(params['Mental Resist Per Insight'] || 0);
    $.mentalStates = list(params['Mental States']);
    $.mindElement = Number(params['Mind Element'] || 0);
    $.fatigueResist = Number(params['Fatigue Resist Per Insight'] || 0);
    $.sharedActors = list(params['Shared Insight Actors']);

    $.classValue = function(actor, tag, fallback) {
        var m = new RegExp('<Insight ' + tag + ':\\s*([\\d.]+)>', 'i').exec(actor.currentClass().note || '');
        return m ? Number(m[1]) : fallback;
    };

    Game_Actor.prototype.insightSteps = function() {
        return Math.max(this.level - 1, 0);
    };

    Game_Actor.prototype.mentalResistRate = function() {
        var per = $.classValue(this, 'Mental Resist', $.mentalResist);
        return Math.max(1 - per * this.insightSteps(), 0);
    };

    var _Game_Actor_xparam = Game_Actor.prototype.xparam;
    Game_Actor.prototype.xparam = function(xparamId) {
        var value = _Game_Actor_xparam.call(this, xparamId);
        if (xparamId === 1) {
            value += $.classValue(this, 'Evasion', $.evasion) * this.insightSteps();
        }
        return value;
    };

    var _Game_Actor_sparam = Game_Actor.prototype.sparam;
    Game_Actor.prototype.sparam = function(sparamId) {
        var value = _Game_Actor_sparam.call(this, sparamId);
        if (sparamId === 5) {
            var per = $.classValue(this, 'Fatigue Resist', $.fatigueResist);
            value *= Math.max(1 - per * this.insightSteps(), 0.1);
        }
        return value;
    };

    var _Game_Actor_stateRate = Game_Actor.prototype.stateRate;
    Game_Actor.prototype.stateRate = function(stateId) {
        var rate = _Game_Actor_stateRate.call(this, stateId);
        if ($.mentalStates.indexOf(stateId) >= 0) rate *= this.mentalResistRate();
        return rate;
    };

    var _Game_Actor_elementRate = Game_Actor.prototype.elementRate;
    Game_Actor.prototype.elementRate = function(elementId) {
        var rate = _Game_Actor_elementRate.call(this, elementId);
        if ($.mindElement > 0 && elementId === $.mindElement) rate *= this.mentalResistRate();
        return rate;
    };

    //-------------------------------------------------------------------------
    // Shared Insight (Ghost and Human Yoon)
    //-------------------------------------------------------------------------

    var _Game_Actor_changeExp = Game_Actor.prototype.changeExp;
    Game_Actor.prototype.changeExp = function(exp, show) {
        _Game_Actor_changeExp.call(this, exp, show);
        if ($._syncing || $.sharedActors.indexOf(this.actorId()) < 0) return;
        $._syncing = true;
        var total = this.currentExp();
        $.sharedActors.forEach(function(id) {
            var other = $gameActors.actor(id);
            if (other && other !== this && other.currentExp() !== total) {
                other.changeExp(total, false);
            }
        }, this);
        $._syncing = false;
    };

})(SmokingIsle.Insight);
