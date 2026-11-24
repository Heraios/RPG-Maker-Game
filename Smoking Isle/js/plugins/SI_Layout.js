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
 *   skill adds (+2 FT) or recovers (-15~20 FT), ranged ammo left (x3), and
 *   Voltaic Pile charge spent and left (1 Ch (3)).
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
        return { text: (f > 0 ? '+' : '') + f + ' ' + TextManager.tpA, rest: f < 0 };
    };

    Window_SkillList.prototype.costWidth = function() {
        return this.textWidth('x5  000 ' + TextManager.mpA + '  -00~00 ' + TextManager.tpA);
    };

    Window_SkillList.prototype.drawSkillCost = function(skill, x, y, width) {
        var parts = [];
        if (SmokingIsle.Ranged && SmokingIsle.Ranged.isRanged(skill) && this._actor && $gameParty.inBattle()) {
            parts.push({ text: 'x' + this._actor.rangedAmmoForSkill(skill), color: this.systemColor() });
        }
        var ch = SmokingIsle.Voltaic ? SmokingIsle.Voltaic.costText(this._actor, skill) : null;
        if (ch) parts.push({ text: ch, color: this.textColor(6) });
        var mp = this._actor ? this._actor.skillMpCost(skill) : skill.mpCost;
        if (mp > 0) parts.push({ text: mp + ' ' + TextManager.mpA, color: this.mpCostColor() });
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
    // Help text wraps onto its second line instead of running off the edge
    //-------------------------------------------------------------------------

    Window_Help.prototype.wrapLines = function(text) {
        var width = this.contentsWidth() - this.textPadding() * 2;
        var lines = [];
        String(text || '').split('\n').forEach(function(paragraph) {
            var line = '';
            paragraph.split(' ').forEach(function(word) {
                var next = line ? line + ' ' + word : word;
                if (line && this.textWidth(next) > width) {
                    lines.push(line);
                    line = word;
                } else {
                    line = next;
                }
            }, this);
            lines.push(line);
        }, this);
        var max = this._siMaxLines || 2;   // the battle screen's help box holds more
        if (lines.length > max) lines = lines.slice(0, max - 1).concat([lines.slice(max - 1).join(' ')]);
        return lines;
    };

    var _Window_Help_setItem = Window_Help.prototype.setItem;
    Window_Help.prototype.setItem = function(item) {
        if (item && this.setFittedLines && !/\\/.test(item.description)) {
            this.setFittedLines(this.wrapLines(item.description));
        } else {
            _Window_Help_setItem.call(this, item);
        }
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

    // The slot list in two columns, filled top to bottom: worn things on the left (Head ... Feet),
    // weapons, charms and the rest on the right. All 22 slots fit without scrolling.
    Window_EquipSlot.prototype.maxCols = function() { return 2; };
    Window_EquipSlot.prototype.siRows = function() { return Math.max(1, Math.ceil(this.maxItems() / 2)); };
    Window_EquipSlot.prototype.itemRect = function(index) {
        var rows = this.siRows(), w = this.itemWidth(), h = this.itemHeight();
        var col = Math.floor(index / rows), row = index % rows;
        return new Rectangle(col * (w + this.spacing()) - this._scrollX, row * h - this._scrollY, w, h);
    };
    Window_EquipSlot.prototype.row = function() { return this.index() % this.siRows(); };
    Window_EquipSlot.prototype.maxRows = function() { return this.siRows(); };
    Window_EquipSlot.prototype.cursorDown = function() {
        var i = this.index(), rows = this.siRows();
        if (i % rows < rows - 1 && i + 1 < this.maxItems()) this.select(i + 1);
    };
    Window_EquipSlot.prototype.cursorUp = function() {
        var i = this.index();
        if (i % this.siRows() > 0) this.select(i - 1);
    };
    Window_EquipSlot.prototype.cursorRight = function() {
        var i = this.index(), rows = this.siRows();
        if (i + rows < this.maxItems()) this.select(i + rows);
        else if (i < rows && this.maxItems() > rows) this.select(this.maxItems() - 1);
    };
    Window_EquipSlot.prototype.cursorLeft = function() {
        var i = this.index(), rows = this.siRows();
        if (i - rows >= 0) this.select(i - rows);
    };

    //-------------------------------------------------------------------------
    // Status screen: everything that's equipped, two columns (slot, item)
    //-------------------------------------------------------------------------

    Window_Status.prototype.drawEquipments = function(x, y) {
        var actor = this._actor, rows = [];
        actor.equips().forEach(function(item, i) {
            if (!item) return;
            var slot = actor.equipSlotName ? actor.equipSlotName(i) : $dataSystem.equipTypes[actor.equipSlots()[i]];
            rows.push([slot, item]);
        });
        var lh = 31, perCol = Math.floor(this.lineHeight() * 6 / lh), colW = Math.floor((this.contentsWidth() - x) / 2);
        var shown = rows.length > perCol * 2 ? perCol * 2 - 1 : rows.length;
        this.contents.fontSize = 24;
        for (var k = 0; k < shown; k++) {
            var cx = x + Math.floor(k / perCol) * colW, cy = y + (k % perCol) * lh;
            this.changeTextColor(this.systemColor());
            this.drawText(rows[k][0], cx, cy, 136, 'left');
            this.resetTextColor();
            this.drawText(rows[k][1].name, cx + 140, cy, colW - 150, 'left');
        }
        if (shown < rows.length) {
            this.changeTextColor(this.systemColor());
            this.drawText('+ ' + (rows.length - shown) + ' more (see Equip)', x + colW, y + (perCol - 1) * lh, colW - 10, 'left');
        }
        if (!rows.length) { this.changeTextColor(this.systemColor()); this.drawText('Nothing equipped.', x, y, colW, 'left'); }
        this.resetFontSettings();
    };

})(SmokingIsle.Layout);
