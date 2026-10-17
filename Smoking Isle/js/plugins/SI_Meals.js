//=============================================================================
// SI_Meals.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: food raises stats for good, one meal per rest,
 * a few times per food.
 * @author Smoking Isle
 *
 * @param Default Cap
 * @desc How many times one food can raise the same character's stats.
 * @default 3
 *
 * @help
 * Place after SI_Outfits.
 *
 * Item note:
 *   <Meal>          a meal: its Grow effects (Effects > Other > Grow) raise
 *                   stats for good, but only
 *                     - once per rest per character (a meal fills them up:
 *                       they can't eat again until they rest), and
 *                     - up to the cap for that food per character (after
 *                       that it only heals).
 *   <Meal Cap: 1>   this food's own cap (a rare Sooty Tern Egg: once)
 *
 * Resting (Recover All, e.g. the campfire) makes everyone hungry again.
 * Script: SmokingIsle.Meals.rest()     the same without healing
 *
 * Levels (Insight) only raise MDF and LUK, so meals are how HP, MP, ATK,
 * DEF, MAT and AGI grow.
 */

var Imported = Imported || {};
Imported.SI_Meals = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Meals = SmokingIsle.Meals || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_Meals');
    $.defaultCap = Number(params["Default Cap"] || 3);

    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        if (!_DataManager_isDatabaseLoaded.call(this)) return false;
        if (!$._loaded) {
            $dataItems.forEach(function(item) {
                if (!item) return;
                item.siMeal = /<Meal>/i.test(item.note || '');
                var cap = /<Meal Cap:\s*(\d+)>/i.exec(item.note || '');
                item.siMealCap = cap ? Number(cap[1]) : $.defaultCap;
            });
            $._loaded = true;
        }
        return true;
    };

    $.isMeal = function(item) {
        return DataManager.isItem(item) && item.siMeal;
    };

    Game_Actor.prototype.mealsEaten = function(item) {
        return (this._siMeals && this._siMeals[item.id]) || 0;
    };

    Game_Actor.prototype.isFed = function() {
        return !!this._siFed;
    };

    $.rest = function() {
        $gameParty.allMembers().forEach(function(a) { a._siFed = false; });
    };

    var _Game_Actor_recoverAll = Game_Actor.prototype.recoverAll;
    Game_Actor.prototype.recoverAll = function() {
        _Game_Actor_recoverAll.call(this);
        this._siFed = false;
    };

    // A full character can't eat another meal until they rest.
    var _Game_Action_testApply = Game_Action.prototype.testApply;
    Game_Action.prototype.testApply = function(target) {
        if ($.isMeal(this.item()) && target.isActor() && target.isFed()) return false;
        return _Game_Action_testApply.call(this, target);
    };

    var _Game_Action_itemEffectGrow = Game_Action.prototype.itemEffectGrow;
    Game_Action.prototype.itemEffectGrow = function(target, effect) {
        var item = this.item();
        if ($.isMeal(item) && target.isActor() && target.mealsEaten(item) >= item.siMealCap) return;
        _Game_Action_itemEffectGrow.call(this, target, effect);
    };

    var _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        var meal = $.isMeal(this.item()) && target.isActor() && !target.isFed();
        _Game_Action_apply.call(this, target);
        if (meal) {
            var item = this.item();
            target._siMeals = target._siMeals || {};
            target._siMeals[item.id] = target.mealsEaten(item) + 1;
            target._siFed = true;
        }
    };

    // Item screen: show who has had this food (and who is full).
    $.helpLine = function(item) {
        if (!$.isMeal(item)) return '';
        return $gameParty.members().map(function(a) {
            var n = Math.min(a.mealsEaten(item), item.siMealCap);
            return a.name() + ' ' + n + '/' + item.siMealCap + (a.isFed() ? ' (full)' : '');
        }).join(' · ');
    };

    var _Window_Help_setItem = Window_Help.prototype.setItem;
    Window_Help.prototype.setItem = function(item) {
        var line = SceneManager._scene instanceof Scene_Item ? $.helpLine(item) : '';
        if (line) {
            var proxy = Object.create(item);
            proxy.description = item.description + ' ' + line;
            _Window_Help_setItem.call(this, proxy);
        } else {
            _Window_Help_setItem.call(this, item);
        }
    };

})(SmokingIsle.Meals);
