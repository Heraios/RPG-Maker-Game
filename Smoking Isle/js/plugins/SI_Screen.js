//=============================================================================
// SI_Screen.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: widescreen fixes, turn order strip, word
 * wrap for dialogue and the battle log, and a Battle Text speed option.
 * @author Smoking Isle
 *
 * @param Battle Text Speeds
 * @desc Frames each battle message stays up: Slow, Normal, Fast.
 * @default 72,48,24
 *
 * @help
 * Place last. The screen size itself is set in Community_Basic
 * (1280 x 720).
 *
 * - The title image is scaled to fill the screen (the default art is made
 *   for 816 x 624). The battle screen's layout is in SI_BattleHud.
 * - The turn order is drawn as a strip: Turn: Lasa > Yoon > Boar-Man...
 *   (AI allies in green, enemies in red).
 * - Dialogue wraps at word boundaries (long lines continue on the next line,
 *   then the next page). Battle log lines wrap too.
 * - Options > Battle Text: Slow / Normal / Fast. Holding OK still speeds the
 *   log up.
 */

var Imported = Imported || {};
Imported.SI_Screen = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Screen = SmokingIsle.Screen || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_Screen');
    $.speeds = String(params['Battle Text Speeds'] || '72,48,24').split(',').map(Number);
    $.SPEED_NAMES = ['Slow', 'Normal', 'Fast'];

    //-------------------------------------------------------------------------
    // Art made for 816 x 624: scale to cover the screen
    //-------------------------------------------------------------------------

    $.cover = function(sprite) {
        var bitmap = sprite.bitmap;
        if (!bitmap || !bitmap.width) return;
        var scale = Math.max(Graphics.width / bitmap.width, Graphics.height / bitmap.height);
        sprite.scale.x = sprite.scale.y = scale;
        sprite.x = (Graphics.width - bitmap.width * scale) / 2;
        sprite.y = (Graphics.height - bitmap.height * scale) / 2;
    };

    var _Scene_Title_createBackground = Scene_Title.prototype.createBackground;
    Scene_Title.prototype.createBackground = function() {
        _Scene_Title_createBackground.call(this);
        [this._backSprite1, this._backSprite2].forEach(function(sprite) {
            if (sprite.bitmap) sprite.bitmap.addLoadListener(function() { $.cover(sprite); });
        });
    };

    //-------------------------------------------------------------------------
    // Turn order strip (laid out by SI_BattleHud)
    //-------------------------------------------------------------------------

    // The turn order as a strip: Turn: Lasa > Yoon > Sib > Boar-Man > ...
    var TO = SmokingIsle.TurnOrder && SmokingIsle.TurnOrder.Window_TurnOrder;
    if (TO) {
        TO.prototype.isStrip = function() {
            return this.width > this.height * 3;
        };

        var _TO_maxEntries = TO.prototype.maxEntries;
        TO.prototype.maxEntries = function() {
            return this.isStrip() ? 12 : _TO_maxEntries.call(this);
        };

        var _TO_drawEntries = TO.prototype.drawEntries;
        TO.prototype.drawEntries = function(entries) {
            if (!this.isStrip()) return _TO_drawEntries.call(this, entries);
            this.contents.clear();
            var lh = this.lineHeight(), x = 0, w = this.contentsWidth();
            this.changeTextColor(this.systemColor());
            var label = 'Turn:';
            this.drawText(label, x, 0, this.textWidth(label));
            x += this.textWidth(label) + 12;
            for (var i = 0; i < entries.length; i++) {
                var e = entries[i], name = e.battler.name();
                var nw = this.textWidth(name) + 16;
                var arrow = i > 0 ? this.textWidth(' › ') : 0;
                if (x + arrow + nw > w) break;
                if (i > 0) {
                    this.changeTextColor(this.systemColor());
                    this.drawText(' › ', x, 0, arrow);
                    x += arrow;
                }
                if (e.current) {
                    this.contents.paintOpacity = 96;
                    this.contents.fillRect(x, 2, nw, lh - 4, this.textColor(6));
                    this.contents.paintOpacity = 255;
                }
                if (e.preview) {
                    this.contents.paintOpacity = 160;
                    this.contents.fillRect(x, lh - 4, nw, 3, this.textColor(6));
                    this.contents.paintOpacity = 255;
                }
                this.changeTextColor(!e.battler.isActor() ? this.textColor(2) :
                    e.battler.isPseudoMember && e.battler.isPseudoMember() ? this.textColor(3) : this.normalColor());
                this.drawText(name, x + 8, 0, nw - 16);
                x += nw;
            }
            this.resetTextColor();
        };
    }

    //-------------------------------------------------------------------------
    // Word wrap: dialogue
    //-------------------------------------------------------------------------

    var _Window_Message_processNormalCharacter = Window_Message.prototype.processNormalCharacter;
    Window_Message.prototype.processNormalCharacter = function(textState) {
        var text = textState.text, i = textState.index;
        var wordStart = text[i] !== ' ' && (i === 0 || text[i - 1] === ' ');
        if (wordStart && textState.x > textState.left) {
            var word = /^[^\s\x1b]+/.exec(text.slice(i));
            if (word && textState.x + this.textWidth(word[0]) > this.contentsWidth()) {
                this.processNewLine(textState);
                textState.index--;   // no '\n' was consumed
                return;              // the word is drawn next, on the new line (or page)
            }
        }
        _Window_Message_processNormalCharacter.call(this, textState);
    };

    //-------------------------------------------------------------------------
    // Word wrap and pacing: battle log
    //-------------------------------------------------------------------------

    $.wrap = function(win, text, width) {
        var lines = [], line = '';
        String(text).split(' ').forEach(function(word) {
            var next = line ? line + ' ' + word : word;
            if (line && win.textWidth(next) > width) {
                lines.push(line);
                line = word;
            } else {
                line = next;
            }
        });
        lines.push(line);
        return lines;
    };

    var _Window_BattleLog_addText = Window_BattleLog.prototype.addText;
    Window_BattleLog.prototype.addText = function(text) {
        if (/\\/.test(text)) return _Window_BattleLog_addText.call(this, text);
        var width = this.contentsWidth() - this.textPadding() * 2;
        $.wrap(this, text, width).forEach(function(line) {
            this._lines.push(line);
        }, this);
        this.refresh();
        this.wait();
    };

    Window_BattleLog.prototype.messageSpeed = function() {
        var i = ConfigManager.battleTextSpeed;
        return $.speeds[i === undefined ? 1 : i] || $.speeds[1];
    };

    //-------------------------------------------------------------------------
    // Options: Battle Text
    //-------------------------------------------------------------------------

    ConfigManager.battleTextSpeed = 1;

    var _ConfigManager_makeData = ConfigManager.makeData;
    ConfigManager.makeData = function() {
        var config = _ConfigManager_makeData.call(this);
        config.battleTextSpeed = this.battleTextSpeed;
        return config;
    };

    var _ConfigManager_applyData = ConfigManager.applyData;
    ConfigManager.applyData = function(config) {
        _ConfigManager_applyData.call(this, config);
        var v = config.battleTextSpeed;
        this.battleTextSpeed = (v === undefined ? 1 : Number(v)).clamp(0, 2);
    };

    var _Window_Options_addGeneralOptions = Window_Options.prototype.addGeneralOptions;
    Window_Options.prototype.addGeneralOptions = function() {
        _Window_Options_addGeneralOptions.call(this);
        this.addCommand('Battle Text', 'battleTextSpeed');
    };

    var _Window_Options_statusText = Window_Options.prototype.statusText;
    Window_Options.prototype.statusText = function(index) {
        if (this.commandSymbol(index) === 'battleTextSpeed') return $.SPEED_NAMES[this.getConfigValue('battleTextSpeed')];
        return _Window_Options_statusText.call(this, index);
    };

    $.cycleSpeed = function(win, delta, wrap) {
        var v = win.getConfigValue('battleTextSpeed') + delta;
        v = wrap ? (v + 3) % 3 : v.clamp(0, 2);
        win.changeValue('battleTextSpeed', v);
    };

    var _Window_Options_processOk = Window_Options.prototype.processOk;
    Window_Options.prototype.processOk = function() {
        if (this.commandSymbol(this.index()) === 'battleTextSpeed') return $.cycleSpeed(this, 1, true);
        _Window_Options_processOk.call(this);
    };

    var _Window_Options_cursorRight = Window_Options.prototype.cursorRight;
    Window_Options.prototype.cursorRight = function(wrap) {
        if (this.commandSymbol(this.index()) === 'battleTextSpeed') return $.cycleSpeed(this, 1, false);
        _Window_Options_cursorRight.call(this, wrap);
    };

    var _Window_Options_cursorLeft = Window_Options.prototype.cursorLeft;
    Window_Options.prototype.cursorLeft = function(wrap) {
        if (this.commandSymbol(this.index()) === 'battleTextSpeed') return $.cycleSpeed(this, -1, false);
        _Window_Options_cursorLeft.call(this, wrap);
    };

})(SmokingIsle.Screen);
