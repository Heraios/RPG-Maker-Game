//=============================================================================
// SI_Resting.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: rules for the characters' own resting moves
 * (Meditate, Land, Diver's Breath, Slouch, Oil Joints, Photosynthesize...).
 * @author Smoking Isle
 *
 * @help
 * Place after SI_CombatCore, SI_Meals and SI_Idols.
 *
 * Skill note:
 *   <Only While Weary>       usable only while Weary (Diver's Breath)
 *   <Health Below: 50>       usable only below 50% Health (Photosynthesize)
 *   <Usable With State: Landed>   usable only while the user has that state
 *   <Not With State: Landed>      not usable while the user has that state
 *   <Uses Per Battle: 3>     at most 3 uses a battle (Oil Joints)
 *   <Fatigue By Use: -15, -10, -5>
 *                            Fatigue for the 1st, 2nd, 3rd... use this battle
 *                            (the last number repeats)
 *   <State By Use: Oiled Joints I, Oiled Joints II, Oiled Joints III>
 *                            the user gets that state for the nth use; the
 *                            earlier ones in the list are taken away
 *   <Skips Meal>             the user won't eat at the next shared meal: they
 *                            have had their fill until the next rest
 *                            (Photosynthesize)
 *
 * State note:
 *   <Only Skills: 2, 50>     while it lasts the battler can only use those
 *                            skills (Guard and Stop Slouching), and no items
 *   <Until Spell>            removed after the battler's next Magical skill
 *                            (Take Notes' half-price spell)
 *   <Fatigue Per Turn: -10>  (SI_CombatCore) sheds 10 Fatigue a turn
 */

var Imported = Imported || {};
Imported.SI_Resting = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Resting = SmokingIsle.Resting || {};

(function($) {
    'use strict';

    $.MAGICAL_STYPE = 1;

    $.tag = function(obj, name) {
        var m = new RegExp('<' + name + ':\\s*([^>]+)>', 'i').exec((obj && obj.note) || '');
        return m ? m[1].trim() : null;
    };

    $.list = function(text) {
        return text ? text.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [];
    };

    $.stateId = function(name) {
        return SmokingIsle.Ailments ? SmokingIsle.Ailments.stateByName(name) : 0;
    };

    $.hasStateNamed = function(battler, name) {
        var id = $.stateId(name);
        return id > 0 && battler.isStateAffected(id);
    };

    //-------------------------------------------------------------------------
    // When a resting move can be used
    //-------------------------------------------------------------------------

    Game_BattlerBase.prototype.skillUses = function(skillId) {
        return (this._siSkillUses && this._siSkillUses[skillId]) || 0;
    };

    Game_BattlerBase.prototype.onlySkills = function() {
        var ids = null;
        this.states().forEach(function(state) {
            var only = $.tag(state, 'Only Skills');
            if (only) ids = (ids || []).concat($.list(only).map(Number));
        });
        return ids;
    };

    var _Game_BattlerBase_meetsSkillConditions = Game_BattlerBase.prototype.meetsSkillConditions;
    Game_BattlerBase.prototype.meetsSkillConditions = function(skill) {
        if (!_Game_BattlerBase_meetsSkillConditions.call(this, skill)) return false;
        var only = this.onlySkills();
        if (only && only.indexOf(skill.id) < 0) return false;
        if (/<Only While Weary>/i.test(skill.note || '') && !(this.isWeary && this.isWeary())) return false;
        var below = $.tag(skill, 'Health Below');
        if (below && !(this.hp < this.mhp * Number(below) / 100)) return false;
        var withState = $.tag(skill, 'Usable With State');
        if (withState && !$.hasStateNamed(this, withState)) return false;
        var notState = $.tag(skill, 'Not With State');
        if (notState && $.hasStateNamed(this, notState)) return false;
        var max = $.tag(skill, 'Uses Per Battle');
        if (max && this.skillUses(skill.id) >= Number(max)) return false;
        return true;
    };

    // While a state allows only certain skills, no items either.
    var _Game_BattlerBase_meetsItemConditions = Game_BattlerBase.prototype.meetsItemConditions;
    Game_BattlerBase.prototype.meetsItemConditions = function(item) {
        if ($gameParty.inBattle() && this.onlySkills()) return false;
        return _Game_BattlerBase_meetsItemConditions.call(this, item);
    };

    //-------------------------------------------------------------------------
    // Using one
    //-------------------------------------------------------------------------

    var _Game_Battler_useItem = Game_Battler.prototype.useItem;
    Game_Battler.prototype.useItem = function(item) {
        _Game_Battler_useItem.call(this, item);
        if (!DataManager.isSkill(item)) return;
        var n = this.skillUses(item.id);
        this._siSkillUses = this._siSkillUses || {};
        this._siSkillUses[item.id] = n + 1;
        var byUse = $.list($.tag(item, 'Fatigue By Use')).map(Number);
        if (byUse.length) this.gainFatigue(byUse[Math.min(n, byUse.length - 1)], item);
        var states = $.list($.tag(item, 'State By Use'));
        if (states.length) {
            var pick = Math.min(n, states.length - 1);
            states.forEach(function(name, i) { if (i !== pick) this.removeState($.stateId(name)); }, this);
            this.addState($.stateId(states[pick]));
        }
        if (/<Skips Meal>/i.test(item.note || '') && this.isActor()) this._siSkipsMeal = true;
        if (item.stypeId === $.MAGICAL_STYPE) {
            this.states().filter(function(s) { return /<Until Spell>/i.test(s.note || ''); }).forEach(function(s) {
                this.removeState(s.id);
            }, this);
        }
    };

    // Uses per battle start again with every battle.
    var _BattleManager_setup = BattleManager.setup;
    BattleManager.setup = function(troopId, canEscape, canLose) {
        _BattleManager_setup.call(this, troopId, canEscape, canLose);
        $gameParty.allMembers().concat($gameTroop.members()).forEach(function(b) { b._siSkillUses = {}; });
    };

    //-------------------------------------------------------------------------
    // Photosynthesize: no meal until the next rest
    //-------------------------------------------------------------------------

    var _Game_Actor_mealRefusal = Game_Actor.prototype.mealRefusal;
    Game_Actor.prototype.mealRefusal = function() {
        if (this._siSkipsMeal) return 'I drank the sun already. I\'m full!';
        return _Game_Actor_mealRefusal.call(this);
    };

    var _Game_Actor_mealRefusalText = Game_Actor.prototype.mealRefusalText;
    Game_Actor.prototype.mealRefusalText = function() {
        if (this._siSkipsMeal) return this.name() + ': "' + this.mealRefusal() + '"';
        return _Game_Actor_mealRefusalText.call(this);
    };

    if (SmokingIsle.Idols && SmokingIsle.Idols.rest) {
        var _Idols_rest = SmokingIsle.Idols.rest;
        SmokingIsle.Idols.rest = function() {
            _Idols_rest.apply(this, arguments);
            $gameParty.allMembers().forEach(function(a) { a._siSkipsMeal = false; });
        };
    }

})(SmokingIsle.Resting);
