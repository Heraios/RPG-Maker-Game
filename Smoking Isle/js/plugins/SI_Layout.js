//=============================================================================
// SI_Layout.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: readability layout for battle and equipment screens.
 * @author Smoking Isle
 *
 * @param Rest Threshold
 * @type number
 * @desc Fatigue shown in the warning color above this value (when
 * resting skills become usable).
 * @default 85
 *
 * @help
 * Place this plugin last. Layout only; no rules change.
 *
 * Battle:
 * - Punch is no longer a main command; it is the first Physical skill (give
 *   skill #1 the Physical skill type).
 * - Skill lists use one wide column and show every cost: MP, the Fatigue a
 *   skill adds (+2 FT) or recovers (-15~20 FT), and ranged ammo left (x3).
 * - Fatigue turns yellow above the Rest Threshold and red at 100.
 * - The enemy target list uses one column with each enemy's state icons.
 *
 * Equip screen:
 * - The slot list runs the full height of the right side; the item list
 *   sits under the stats on the left.
 */

var Imported = Imported || {};
Imported.SI_Layout = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Layout = SmokingIsle.Layout || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_Layout');
    $.restThreshold = Number(params['Rest Threshold'] || 85);

    //-------------------------------------------------------------------------
    // Punch lives in Physical skills
    //-------------------------------------------------------------------------

    Window_ActorCommand.prototype.addAttackCommand = function() {
    };

    // Everyone knows Punch; it shows up wherever its skill type is allowed.
    var _Game_Actor_skills = Game_Actor.prototype.skills;
    Game_Actor.prototype.skills = function() {
        var list = _Game_Actor_skills.call(this);
        var punch = $dataSkills[this.attackSkillId()];
        if (punch && list.indexOf(punch) < 0) list.unshift(punch);
        return list;
    };

    //-------------------------------------------------------------------------
    // Skill lists: one column, every cost shown
    //-------------------------------------------------------------------------

    Window_SkillList.prototype.maxCols = function() {
        return 1;
    };

    $.fatigueText = function(skill) {
        if (skill.siFatigueRange) {
            var r = skill.siFatigueRange;
            return { text: (r[1] <= 0 ? '' : '+') + r[1] + '~' + Math.abs(r[0]) + ' FT', rest: r[1] <= 0 };
        }
        var f = skill.siFatigue !== undefined ? skill.siFatigue : skill.tpGain;
        if (!f) return null;
        return { text: (f > 0 ? '+' : '') + f + ' FT', rest: f < 0 };
    };

    Window_SkillList.prototype.costWidth = function() {
        return this.textWidth('x5  000 MP  -00~00 FT');
    };

    Window_SkillList.prototype.drawSkillCost = function(skill, x, y, width) {
        var parts = [];
        if (SmokingIsle.Ranged && SmokingIsle.Ranged.isRanged(skill) && this._actor && $gameParty.inBattle()) {
            parts.push({ text: 'x' + this._actor.rangedAmmoForSkill(skill), color: this.systemColor() });
        }
        var mp = this._actor ? this._actor.skillMpCost(skill) : skill.mpCost;
        if (mp > 0) parts.push({ text: mp + ' MP', color: this.mpCostColor() });
        var f = $.fatigueText(skill);
        if (f) parts.push({ text: f.text, color: f.rest ? this.textColor(3) : this.tpCostColor() });
        var right = x + width;
        for (var i = parts.length - 1; i >= 0; i--) {
            var w = this.textWidth(parts[i].text);
            this.changeTextColor(parts[i].color);
            this.drawText(parts[i].text, right - w, y, w, 'right');
            right -= w + this.textWidth('  ');
        }
        this.resetTextColor();
    };

    //-------------------------------------------------------------------------
    // Fatigue color
    //-------------------------------------------------------------------------

    Window_Base.prototype.tpColor = function(actor) {
        if (actor.tp >= actor.maxTp()) return this.deathColor();
        if (actor.tp > $.restThreshold) return this.crisisColor();
        return this.normalColor();
    };

    //-------------------------------------------------------------------------
    // Enemy target list: one column, state icons
    //-------------------------------------------------------------------------

    Window_BattleEnemy.prototype.maxCols = function() {
        return 1;
    };

    var _Window_BattleEnemy_drawItem = Window_BattleEnemy.prototype.drawItem;
    Window_BattleEnemy.prototype.drawItem = function(index) {
        _Window_BattleEnemy_drawItem.call(this, index);
        var enemy = this._enemies[index];
        var rect = this.itemRectForText(index);
        var nameWidth = Math.min(this.textWidth(enemy.name()), 200);
        this.drawActorIcons(enemy, rect.x + nameWidth + 16, rect.y, rect.width - nameWidth - 120);
    };

    //-------------------------------------------------------------------------
    // Equip screen: tall slot list on the right, items under the stats
    //-------------------------------------------------------------------------

    var _Scene_Equip_create = Scene_Equip.prototype.create;
    Scene_Equip.prototype.create = function() {
        _Scene_Equip_create.call(this);
        var slot = this._slotWindow, item = this._itemWindow, status = this._statusWindow;
        slot.height = Graphics.boxHeight - slot.y;
        slot.createContents();
        slot.refresh();
        item.x = 0;
        item.y = status.y + status.height;
        item.width = status.width;
        item.height = Graphics.boxHeight - item.y;
        item.createContents();
        item.refresh();
    };

    Window_EquipItem.prototype.maxCols = function() {
        return 1;
    };

})(SmokingIsle.Layout);
