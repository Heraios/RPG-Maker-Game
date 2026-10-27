//=============================================================================
// SI_BattleHud.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: the battle screen (somewhere between EarthBound
 * and the SNES Shin Megami Tensei games).
 * @author Smoking Isle
 *
 * @help
 * Place last (after SI_Screen). Layout only; no rules change.
 *
 *  +--------------------------------------------------------------+
 *  | Turn: Sib > Yoon > Patience > Boar-Man > ...                 |
 *  +------------------------------------------+-------------------+
 *  | [Day 3 - Dusk]                           | Fight             |
 *  |                                          | Talk              |
 *  |       the battlefield, in a frame        | Tactics           |
 *  |                                          | (skill, item and  |
 *  |                                          |  target lists,    |
 *  |                                          |  help underneath) |
 *  +------------------------------------------+-------------------+
 *  | Boar-Man takes 12 damage!   /   Sib's move?                  |
 *  +--------------------------------------------------------------+
 *  | [face] Sib | [face] Yoon | [face] Lasa | [face] Pada | Allies |
 *  |  HT / MN / FT on each card                           | strip  |
 *  +--------------------------------------------------------------+
 *
 * - Battle windows have plain dark green backs and a single rounded orange
 *   border, with small gaps between them; the battle background shows only
 *   inside the battlefield's frame. Sizes and colours follow the mock-up
 *   ($.FONT and $.COLORS at the top of the plugin).
 * - A pointer (img/system/Cursor2, $.ARROW) marks the chosen command or line.
 * - Lists open in the column under a title, skills without icons, and
 *   the help sits under a divider at the column's foot.
 * - The card of whoever is acting lifts and gets a gold frame (a friend being
 *   picked for a skill, a blue one). A hit shakes the card and pops its
 *   number (or Miss) over it, as over enemies; the ally strip shows them too.
 *   With SI_RollingHealth, Health still to roll away shows as a red stretch
 *   of the bar (and healing still to come, green).
 * - The ally strip (AI allies such as Patience; up to four, compact rows for
 *   the fourth) only appears while one is
 *   in the battle; the cards spread out when it isn't there.
 * - The box in the battlefield's corner shows the day, time and place.
 * - State icons over enemies are copied out of the iconset one at a time
 *   (the whole sheet is too tall for some graphics cards).
 */

var Imported = Imported || {};
Imported.SI_BattleHud = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.BattleHud = SmokingIsle.BattleHud || {};

(function($) {
    'use strict';

    // Measurements from the mock-up (1280 x 720).
    $.MARGIN = 8;          // round the screen's edge, and between windows
    $.STRIP_HEIGHT = 48;
    $.VIEW_HEIGHT = 370;
    $.COLUMN_WIDTH = 356;
    $.BAR_HEIGHT = 58;
    $.CARD_HEIGHT = 168;
    $.CARD_MAX_WIDTH = 290;
    $.LIFT = 24;
    $.ALLY_WIDTH = 242;
    $.INSET = 6;           // lists and commands sit inside the column's frame
    $.TITLE_HEIGHT = 40;
    $.HELP_HEIGHT = 84;
    $.COLORS = {
        back: '#1f2a14', screen: '#111111', frame: '#d98c1f', outline: '#3b2a0c', active: '#ffd76b',
        target: '#8fd3ff', label: '#8fd3ff', prompt: '#ffd76b', place: '#9be36b', cost: '#bbbbbb',
        divider: '#d98c1f', faceBorder: '#777777', faceBack: '#4a5a3a'
    };
    // Font sizes (the game's pixel font draws smaller than the mock-up's).
    $.FONT = { strip: 22, info: 24, command: 32, bar: 26, name: 32, stat: 20, allyTitle: 18, allyName: 20,
        allyHp: 18, list: 24, title: 28, help: 20 };
    // The pointer beside the chosen command or list line: any image in img/system
    // (Cursor1-4 are 24 x 24 arrows; CursorTall1-4 are 24 x 48).
    $.ARROW = 'Cursor2';
    $.ARROW_INDENT = 34;
    // Troop positions in the database are laid out for the old 816 x 624 screen.
    $.BASE_WIDTH = 816;
    $.BASE_HEIGHT = 624;

    $.rects = function() {
        var W = Graphics.boxWidth, H = Graphics.boxHeight, M = $.MARGIN;
        var viewY = 6 + $.STRIP_HEIGHT + M, barY = viewY + $.VIEW_HEIGHT + M;
        var cardsY = barY + $.BAR_HEIGHT + M;
        return {
            strip: { x: M, y: 6, width: W - M * 2, height: $.STRIP_HEIGHT },
            view: { x: M, y: viewY, width: W - M * 3 - $.COLUMN_WIDTH, height: $.VIEW_HEIGHT },
            column: { x: W - M - $.COLUMN_WIDTH, y: viewY, width: $.COLUMN_WIDTH, height: $.VIEW_HEIGHT },
            bar: { x: M, y: barY, width: W - M * 2, height: $.BAR_HEIGHT },
            cards: { x: M, y: cardsY, width: W - M * 2, height: H - cardsY }
        };
    };

    // A rounded rectangle path on a bitmap's canvas.
    $.roundRect = function(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    };

    // Battle windows get a plain dark green back, and a single rounded orange
    // border with a dark outline, instead of the windowskin's.
    var _Window_refreshBack = Window.prototype._refreshBack;
    Window.prototype._refreshBack = function() {
        if (!this._siSolid) return _Window_refreshBack.call(this);
        var w = this._width, h = this._height, bitmap = new Bitmap(Math.max(w, 1), Math.max(h, 1));
        this._windowBackSprite.bitmap = bitmap;
        this._windowBackSprite.setFrame(0, 0, w, h);
        this._windowBackSprite.move(0, 0);
        if (w <= 0 || h <= 0) return;
        if (this._siFrameless) {
            // Panels inside the column fill their whole rect, so side by side they leave no seam.
            bitmap.fillAll($.COLORS.back);
        } else {
            var ctx = bitmap._context;
            $.roundRect(ctx, 2, 2, w - 4, h - 4, 7);
            ctx.fillStyle = $.COLORS.back;
            ctx.fill();
            bitmap._setDirty();
        }
        var tone = this._colorTone;
        bitmap.adjustTone(tone[0], tone[1], tone[2]);
    };

    var _Window_refreshFrame = Window.prototype._refreshFrame;
    Window.prototype._refreshFrame = function() {
        if (!this._siFrame) return _Window_refreshFrame.call(this);
        var w = this._width, h = this._height, bitmap = new Bitmap(Math.max(w, 1), Math.max(h, 1));
        this._windowFrameSprite.bitmap = bitmap;
        this._windowFrameSprite.setFrame(0, 0, w, h);
        if (w <= 8 || h <= 8) return;
        var ctx = bitmap._context;
        $.roundRect(ctx, 1, 1, w - 2, h - 2, 9);
        ctx.lineWidth = 2;
        ctx.strokeStyle = $.COLORS.outline;
        ctx.stroke();
        $.roundRect(ctx, 4, 4, w - 8, h - 8, 6);
        ctx.lineWidth = 4;
        ctx.strokeStyle = this._siFrameColor || $.COLORS.frame;
        ctx.stroke();
        bitmap._setDirty();
    };

    // frameless: no border of its own (it sits inside the column's).
    $.makeSolid = function(win, frameless) {
        win._siSolid = true;
        win._siFrameless = !!frameless;
        win._siFrame = !frameless;
        win.backOpacity = 255;
        win._refreshBack();
        win._refreshFrame();
        if (frameless) win._windowFrameSprite.visible = false;
    };

    $.setFrameColor = function(win, color) {
        if (win._siFrameColor === color) return;
        win._siFrameColor = color;
        win._refreshFrame();
    };

    // Give one window its own padding, font size and line height.
    $.restyle = function(win, padding, fontSize, lineHeight) {
        if (padding !== undefined) {
            win.standardPadding = function() { return padding; };
            win.updatePadding();
        }
        if (fontSize) win.standardFontSize = function() { return fontSize; };
        if (lineHeight) win.lineHeight = function() { return lineHeight; };
    };

    $.place = function(win, rect) {
        win.move(rect.x, rect.y, rect.width, rect.height);
        win.createContents();
        if (win.refresh) win.refresh();
    };

    // HUD windows sit under the message window, so dialogue covers them.
    $.addUnderMessages = function(scene, win) {
        var layer = scene._windowLayer, index = layer.children.indexOf(scene._messageWindow);
        if (index < 0) scene.addWindow(win);
        else layer.addChildAt(win, index);
    };

    $.drawBar = function(win, x, y, width, rate, c1, c2, target) {
        var c = win.contents, h = 6;
        c.fillRect(x, y, width, h, win.gaugeBackColor());
        var low = Math.min(rate, target === undefined ? rate : target);
        c.gradientFillRect(x, y, Math.floor(width * low), h, c1, c2);
        if (target !== undefined && target !== rate) {
            var from = Math.floor(width * low), to = Math.floor(width * Math.max(rate, target));
            c.fillRect(x + from, y, to - from, h, target < rate ? '#ff4040' : '#a0ffa0');
        }
    };

    $.target = function(actor) {
        return actor.hpTarget ? actor.hpTarget() : actor.hp;
    };

    // 'active' (acting or choosing), 'target' (being picked for a skill) or ''.
    $.highlight = function(actor) {
        var scene = SceneManager._scene, pick = scene && scene._actorWindow;
        if (pick && pick.active && pick.actor() === actor) return 'target';
        if (BattleManager.actor() === actor) return 'active';
        if (BattleManager._subject === actor && BattleManager._phase === 'action') return 'active';
        return '';
    };

    // A portrait in a grey-bordered box (an empty box until there's art).
    $.drawFace = function(win, actor, x, y, size) {
        var c = win.contents, bitmap = actor.faceName() ? ImageManager.loadFace(actor.faceName()) : null;
        var pw = Window_Base._faceWidth, ph = Window_Base._faceHeight, i = actor.faceIndex();
        c.fillRect(x, y, size, size, $.COLORS.faceBorder);
        c.fillRect(x + 2, y + 2, size - 4, size - 4, $.COLORS.faceBack);
        if (!bitmap || !bitmap.isReady()) return;
        if (actor.isDead()) c.paintOpacity = 110;
        c.blt(bitmap, i % 4 * pw, Math.floor(i / 4) * ph, pw, ph, x + 2, y + 2, size - 4, size - 4);
        c.paintOpacity = 255;
    };

    $.faceReady = function(actor) {
        return !actor.faceName() || ImageManager.loadFace(actor.faceName()).isReady();
    };

    //-------------------------------------------------------------------------
    // Damage numbers on the cards
    //-------------------------------------------------------------------------

    // The party has no sprites on the battlefield, so each popup's result is kept
    // for the card (or ally strip) to show.
    var _Game_Battler_startDamagePopup = Game_Battler.prototype.startDamagePopup;
    Game_Battler.prototype.startDamagePopup = function() {
        _Game_Battler_startDamagePopup.call(this);
        if (!this.isActor() || !$gameParty.inBattle()) return;
        var result = JsonEx.makeDeepCopy(this.result()), alive = this.isAlive();
        this._siPopups = this._siPopups || [];
        this._siPopups.push({ result: function() { return result; }, isAlive: function() { return alive; } });
    };

    // Shows any waiting numbers for actor at (x, y) in win, and clears finished ones.
    $.updatePopups = function(win, actor, x, y) {
        (actor._siPopups || []).forEach(function(target) {
            var sprite = new Sprite_Damage();
            sprite.x = x;
            sprite.y = y;
            sprite.setup(target);
            win._siDamageSprites.push(sprite);
            win.addChild(sprite);
        });
        actor._siPopups = [];
    };

    $.clearFinishedPopups = function(win) {
        win._siDamageSprites = (win._siDamageSprites || []).filter(function(sprite) {
            if (sprite.isPlaying()) return true;
            win.removeChild(sprite);
            return false;
        });
    };

    //-------------------------------------------------------------------------
    // Party cards
    //-------------------------------------------------------------------------

    function Window_SICard() {
        this.initialize.apply(this, arguments);
    }

    Window_SICard.prototype = Object.create(Window_Base.prototype);
    Window_SICard.prototype.constructor = Window_SICard;

    Window_SICard.prototype.initialize = function(index) {
        Window_Base.prototype.initialize.call(this, 0, 0, 240, $.CARD_HEIGHT);
        this._index = index;
        this._signature = '';
        this._lift = 0;
        this._shake = 0;
        this._lastHp = null;
        this._baseX = 0;
        this._baseY = 0;
        this._siDamageSprites = [];
    };

    Window_SICard.prototype.standardPadding = function() {
        return 12;
    };

    Window_SICard.prototype.actor = function() {
        return $gameParty.regularBattleMembers()[this._index] || null;
    };

    Window_SICard.prototype.setBase = function(x, y, width) {
        this._baseX = x;
        this._baseY = y;
        if (this.width !== width) {
            this.width = width;
            this.createContents();
            this._signature = '';
        }
    };

    Window_SICard.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        var actor = this.actor();
        this.visible = !!actor;
        $.clearFinishedPopups(this);
        if (!actor) return;
        $.updatePopups(this, actor, this.width / 2 + 20, 124);
        var mark = $.highlight(actor);
        this._lift = (this._lift + (mark ? 4 : -4)).clamp(0, $.LIFT);
        if (this._lastHp !== null && actor.hp < this._lastHp) this._shake = 12;
        this._lastHp = actor.hp;
        var dx = this._shake > 0 ? Math.round(Math.sin(this._shake-- * 1.7) * 4) : 0;
        this.x = this._baseX + dx;
        this.y = this._baseY - this._lift;
        $.setFrameColor(this, mark === 'active' ? $.COLORS.active : mark === 'target' ? $.COLORS.target : null);
        if (actor.isDead()) this.setTone(-40, -40, -40);
        else this.setTone(0, 0, 0);
        var sig = [actor.actorId(), actor.hp, $.target(actor), actor.mhp, actor.mp, actor.mmp, actor.tp,
            actor.states().map(function(s) { return s.id; }).join(), this.width,
            $.faceReady(actor)].join('|');
        if (sig !== this._signature) {
            this._signature = sig;
            this.refresh();
        }
    };

    Window_SICard.prototype.refresh = function() {
        var actor = this.actor(), c = this.contents;
        c.clear();
        if (!actor) return;
        var w = this.contentsWidth(), face = 72, F = $.FONT;
        $.drawFace(this, actor, 0, 0, face);
        this.resetFontSettings();
        c.fontSize = F.name;
        this.changeTextColor(this.hpColor(actor));
        var icons = actor.allIcons().length > 0;
        c.drawText(actor.name(), face + 12, icons ? 2 : 18, w - face - 12, 36);
        if (icons) this.drawActorIcons(actor, face + 12, 38, w - face - 12);
        c.fontSize = F.stat;
        var y = 78;
        this.drawStat(TextManager.hpA, actor.hp + '/' + actor.mhp, 0, y, w, this.hpColor(actor));
        $.drawBar(this, 0, y + 24, w, actor.hpRate(), this.hpGaugeColor1(), this.hpGaugeColor2(),
            actor.mhp > 0 ? $.target(actor) / actor.mhp : 0);
        var half = Math.floor((w - 14) / 2);
        y += 34;
        this.drawStat(TextManager.mpA, actor.mp, 0, y, half, this.mpColor(actor));
        $.drawBar(this, 0, y + 24, half, actor.mpRate(), this.mpGaugeColor1(), this.mpGaugeColor2());
        this.drawStat(TextManager.tpA, actor.tp, half + 14, y, half, this.tpColor(actor));
        $.drawBar(this, half + 14, y + 24, half, actor.tpRate(), this.tpGaugeColor1(), this.tpGaugeColor2());
        this.resetFontSettings();
    };

    // "HT 28/40" in light blue (the number turns yellow or red when it's low).
    Window_SICard.prototype.drawStat = function(label, value, x, y, width, color) {
        var text = label + ' ' + value;
        this.changeTextColor(color === this.normalColor() ? $.COLORS.label : color);
        this.contents.drawText(text, x, y, width, 22);
        this.resetTextColor();
    };

    $.Window_SICard = Window_SICard;

    //-------------------------------------------------------------------------
    // Ally strip (AI allies: Patience, the spearwives...)
    //-------------------------------------------------------------------------

    function Window_SIAllies() {
        this.initialize.apply(this, arguments);
    }

    Window_SIAllies.prototype = Object.create(Window_Base.prototype);
    Window_SIAllies.prototype.constructor = Window_SIAllies;

    Window_SIAllies.prototype.initialize = function(x, y, width, height) {
        Window_Base.prototype.initialize.call(this, x, y, width, height);
        this._signature = '';
        this._siDamageSprites = [];
    };

    Window_SIAllies.prototype.standardPadding = function() {
        return 12;
    };

    Window_SIAllies.prototype.members = function() {
        return $gameParty.pseudoBattleMembers().slice(0, 4);
    };

    // Up to three allies get roomy rows; a fourth (Patience and a squad of
    // three) squeezes them into compact ones.
    Window_SIAllies.prototype.rowLayout = function() {
        var F = $.FONT;
        return this.members().length > 3 ?
            { top: 22, height: 40, face: 34, name: F.allyName - 2, hp: F.allyHp - 2, bar: 30 } :
            { top: 26, height: 52, face: 40, name: F.allyName, hp: F.allyHp, bar: 32 };
    };

    Window_SIAllies.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        var members = this.members();
        this.visible = members.length > 0;
        $.clearFinishedPopups(this);
        var row = this.rowLayout();
        members.forEach(function(actor, i) {
            $.updatePopups(this, actor, this.width / 2 + 24, this.padding + row.top + i * row.height + row.height + 6);
        }, this);
        var sig = members.map(function(a) {
            return [a.actorId(), a.hp, $.target(a), a.mhp, $.highlight(a), a.states().map(function(s) { return s.id; }).join(),
                $.faceReady(a)].join(',');
        }).join('|');
        if (sig !== this._signature) {
            this._signature = sig;
            this.refresh();
        }
    };

    Window_SIAllies.prototype.refresh = function() {
        var c = this.contents, w = this.contentsWidth(), F = $.FONT;
        c.clear();
        this.resetFontSettings();
        c.fontSize = F.allyTitle;
        this.changeTextColor($.COLORS.place);
        c.drawText('Allies', 0, 0, w, 24);
        var row = this.rowLayout(), x = row.face + 8;
        this.members().forEach(function(actor, i) {
            var y = row.top + i * row.height, mark = $.highlight(actor);
            if (mark) {
                c.paintOpacity = 72;
                c.fillRect(0, y, w, row.height - 4, mark === 'target' ? $.COLORS.target : $.COLORS.active);
                c.paintOpacity = 255;
            }
            $.drawFace(this, actor, 0, y + 2, row.face);
            c.fontSize = row.name;
            this.changeTextColor(this.hpColor(actor));
            c.drawText(actor.name(), x, y + 2, w - x, 24);
            c.fontSize = row.hp;
            this.changeTextColor($.COLORS.label);
            c.drawText(actor.hp + '/' + actor.mhp, x, y + 2, w - x, 24, 'right');
            $.drawBar(this, x, y + row.bar, w - x, actor.hpRate(), this.hpGaugeColor1(), this.hpGaugeColor2(),
                actor.mhp > 0 ? $.target(actor) / actor.mhp : 0);
        }, this);
        this.resetFontSettings();
    };

    $.Window_SIAllies = Window_SIAllies;

    //-------------------------------------------------------------------------
    // The bar under the battlefield: battle text, or what to choose
    //-------------------------------------------------------------------------

    // What the player is choosing, shown in the bar while there's no battle text.
    $.prompt = function() {
        var scene = SceneManager._scene;
        if (!scene || !BattleManager.isInputting()) return '';
        var actor = BattleManager.actor();
        if (!actor) return '';
        var action = BattleManager.inputtingAction(), item = action && action.item();
        if (scene._enemyWindow && scene._enemyWindow.active) return (item ? item.name + ': ' : '') + 'which enemy?';
        if (scene._actorWindow && scene._actorWindow.active) return (item ? item.name + ': ' : '') + 'on whom?';
        return actor.name() + '\'s move?';
    };

    // The enemies still standing: "Boar-Man × 1!" or "Gannet × 2, Shore Crab × 1!"
    $.enemyCount = function() {
        var counts = [], names = [];
        $gameTroop.aliveMembers().forEach(function(enemy) {
            var name = enemy.originalName(), i = names.indexOf(name);
            if (i < 0) {
                names.push(name);
                counts.push(1);
            } else {
                counts[i]++;
            }
        });
        return names.length ? names.map(function(n, i) { return n + ' \u00d7 ' + counts[i]; }).join(', ') + '!' : '';
    };

    // The battle log becomes the bar: a framed window showing its newest line,
    // or (while choosing) the enemies still up and the prompt.
    $.LOG_LINES = 1;

    $.styleLog = function(log, rect) {
        $.restyle(log, 12, $.FONT.bar, $.BAR_HEIGHT - 24);
        $.place(log, rect);
        log.opacity = 255;
        log._siPrompt = '';
        log.drawBackground = function() {
            this._backBitmap.clear();
        };
        log.refresh = function() {
            this.drawBackground();
            this.contents.clear();
            if (!this._lines.length && this._siPrompt) {
                var count = $.enemyCount(), x = 8, lh = this.lineHeight();
                if (count) {
                    this.resetTextColor();
                    this.contents.drawText(count, x, 0, this.contentsWidth() - x, lh);
                    x += this.textWidth(count) + 36;
                }
                this.changeTextColor($.COLORS.prompt);
                this.contents.drawText(this._siPrompt, x, 0, this.contentsWidth() - x - 8, lh);
                this.resetTextColor();
                return;
            }
            var start = Math.max(0, this._lines.length - $.LOG_LINES);
            for (var i = start; i < this._lines.length; i++) {
                this.drawTextEx(this._lines[i], 8, (i - start) * this.lineHeight(), this.contentsWidth() - 16);
            }
        };
        var update = log.update;
        log.update = function() {
            update.call(this);
            var prompt = $.prompt();
            if (prompt !== this._siPrompt) {
                this._siPrompt = prompt;
                if (!this._lines.length) this.refresh();
            }
        };
        log.refresh();
    };

    //-------------------------------------------------------------------------
    // Day, time and place, in the battlefield's corner
    //-------------------------------------------------------------------------

    function Window_SIBattleInfo() {
        this.initialize.apply(this, arguments);
    }

    Window_SIBattleInfo.prototype = Object.create(Window_Base.prototype);
    Window_SIBattleInfo.prototype.constructor = Window_SIBattleInfo;

    Window_SIBattleInfo.prototype.initialize = function(x, y) {
        var lines = this.lines();
        Window_Base.prototype.initialize.call(this, x, y, 230, 32 + Math.max(lines.length, 1) * 30);
        $.makeSolid(this);
        this.backOpacity = 217;
        this.visible = lines.length > 0;
        this.contents.fontSize = $.FONT.info;
        lines.forEach(function(line, i) {
            this.changeTextColor(i === 0 ? this.normalColor() : $.COLORS.place);
            this.contents.drawText(line, 4, i * 30, this.contentsWidth() - 4, 30);
        }, this);
    };

    Window_SIBattleInfo.prototype.standardPadding = function() {
        return 16;
    };

    Window_SIBattleInfo.prototype.lines = function() {
        var lines = [], T = SmokingIsle.Time;
        if (T && T.state && T.periodName) {
            try {
                var period = T.periodName();
                lines.push('Day ' + T.day() + ' \u00b7 ' + period.charAt(0).toUpperCase() + period.slice(1));
            } catch (e) { /* no clock yet */ }
        }
        var place = $gameMap && $gameMap.mapId() > 0 ? $gameMap.displayName() : '';
        if (place) lines.push(place);
        return lines;
    };

    $.Window_SIBattleInfo = Window_SIBattleInfo;

    //-------------------------------------------------------------------------
    // The command column
    //-------------------------------------------------------------------------

    // The panel's frame and back, with the divider above the help when it's up.
    function Window_SIColumn() {
        this.initialize.apply(this, arguments);
    }

    Window_SIColumn.prototype = Object.create(Window_Base.prototype);
    Window_SIColumn.prototype.constructor = Window_SIColumn;

    Window_SIColumn.prototype.initialize = function(rect, dividerY) {
        Window_Base.prototype.initialize.call(this, rect.x, rect.y, rect.width, rect.height);
        this._dividerY = dividerY;
        this._divider = null;
    };

    Window_SIColumn.prototype.standardPadding = function() {
        return $.INSET;
    };

    Window_SIColumn.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        var help = SceneManager._scene._helpWindow, show = !!(help && help.visible);
        if (show !== this._divider) {
            this._divider = show;
            this.contents.clear();
            if (show) this.contents.fillRect(10, this._dividerY, this.contentsWidth() - 20, 2, $.COLORS.divider);
        }
    };

    $.Window_SIColumn = Window_SIColumn;

    // The list's title ("Physical", "Items") above it.
    function Window_SIColumnTitle() {
        this.initialize.apply(this, arguments);
    }

    Window_SIColumnTitle.prototype = Object.create(Window_Base.prototype);
    Window_SIColumnTitle.prototype.constructor = Window_SIColumnTitle;

    Window_SIColumnTitle.prototype.initialize = function(x, y, width) {
        Window_Base.prototype.initialize.call(this, x, y, width, $.TITLE_HEIGHT);
        this._text = null;
    };

    Window_SIColumnTitle.prototype.standardPadding = function() {
        return 4;
    };

    Window_SIColumnTitle.prototype.title = function() {
        var s = SceneManager._scene;
        if (s._skillWindow && s._skillWindow.visible) return $dataSystem.skillTypes[s._skillWindow._stypeId] || '';
        if (s._itemWindow && s._itemWindow.visible) return TextManager.item;
        if (s._swapWindow && s._swapWindow.visible) return 'Weapon Swap';
        if (s._reserveWindow && s._reserveWindow.visible) return 'Party Swap';
        if (s._enemyWindow && s._enemyWindow.visible) return 'Enemies';
        if (s._actorWindow && s._actorWindow.visible) return 'Party';
        return null;
    };

    Window_SIColumnTitle.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        var text = this.title();
        this.visible = text !== null;
        if (text !== this._text) {
            this._text = text;
            this.contents.clear();
            this.contents.fontSize = $.FONT.title;
            this.changeTextColor($.COLORS.label);
            this.contents.drawText(text || '', 8, 0, this.contentsWidth() - 8, this.contentsHeight());
            this.resetFontSettings();
        }
    };

    $.Window_SIColumnTitle = Window_SIColumnTitle;

    // Skill names without icons; costs in grey on the right.
    $.styleSkillList = function(win) {
        win.drawItem = function(index) {
            var skill = this._data[index];
            if (!skill) return;
            var rect = this.itemRect(index);
            rect.width -= this.textPadding();
            this.changePaintOpacity(this.isEnabled(skill));
            this.resetTextColor();
            this.drawText(skill.name, rect.x, rect.y, rect.width - this.costTextWidth(skill));
            this.drawSkillCost(skill, rect.x, rect.y, rect.width);
            this.changePaintOpacity(1);
        };
        win.tpCostColor = function() { return $.COLORS.cost; };
        // How wide drawSkillCost's text will be (measured by drawing it nowhere).
        win.costTextWidth = function(skill) {
            var left = Infinity, drawText = this.drawText;
            this.drawText = function(text, x) { left = Math.min(left, x); };
            this.drawSkillCost(skill, 0, 0, 1000);
            this.drawText = drawText;
            return left === Infinity ? 0 : 1000 - left + 12;
        };
        win.refresh();
    };

    // The pointer: the window's text moves right to leave room for it, and the
    // highlight box stretches back over it.
    $.addArrow = function(win) {
        var indent = $.ARROW_INDENT;
        win.contentsWidth = function() {
            return this.width - this.standardPadding() * 2 - indent;
        };
        var itemWidth = win.itemWidth;
        win.itemWidth = function() {
            return itemWidth.call(this) - indent;
        };
        var refreshContents = win._refreshContents;
        win._refreshContents = function() {
            refreshContents.call(this);
            this._windowContentsSprite.x += indent;
        };
        var setCursorRect = win.setCursorRect;
        win.setCursorRect = function(x, y, width, height) {
            setCursorRect.call(this, x, y, width ? width + indent : 0, height);
        };
        var arrow = new Sprite(ImageManager.loadSystem($.ARROW));
        arrow.anchor.y = 0.5;
        win._siArrow = arrow;
        win.addChild(arrow);
        var update = win.update;
        win.update = function() {
            update.call(this);
            var r = this._cursorRect;
            arrow.visible = this.isOpen() && this.active && r.height > 0;
            arrow.x = this.padding + 5;
            arrow.y = this.padding + r.y + r.height / 2;
        };
        win.createContents();
        win._refreshAllParts();
        if (win.refresh) win.refresh();
    };

    //-------------------------------------------------------------------------
    // The battlefield, framed
    //-------------------------------------------------------------------------

    var _Spriteset_Battle_createBattleField = Spriteset_Battle.prototype.createBattleField;
    Spriteset_Battle.prototype.createBattleField = function() {
        _Spriteset_Battle_createBattleField.call(this);
        var v = $.rects().view, mask = new PIXI.Graphics();
        mask.beginFill(0xffffff);
        mask.drawRoundedRect(v.x + 6, v.y + 6, v.width - 12, v.height - 12, 4);
        mask.endFill();
        this._baseSprite.addChild(mask);
        this._battleField.mask = mask;
    };

    // Plain sprites (not tiling ones), scaled once their art has loaded. Outside
    // the battlefield the screen is plain dark.
    Spriteset_Battle.prototype.createBattleback = function() {
        this._back1Sprite = new Sprite(this.battleback1Bitmap());
        this._back2Sprite = new Sprite(this.battleback2Bitmap());
        this._battleField.addChild(this._back1Sprite);
        this._battleField.addChild(this._back2Sprite);
        var dark = new Sprite(new Bitmap(Graphics.width, Graphics.height));
        dark.bitmap.fillAll($.COLORS.screen);
        this._baseSprite.addChildAt(dark, this._baseSprite.children.indexOf(this._battleField));
    };

    Spriteset_Battle.prototype.updateBattleback = function() {
        if (!this._battlebackLocated && this._back1Sprite.bitmap.isReady() && this._back2Sprite.bitmap.isReady()) {
            this.locateBattleback();
            this._battlebackLocated = true;
        }
    };

    Spriteset_Battle.prototype.locateBattleback = function() {
        var v = $.rects().view;
        [this._back1Sprite, this._back2Sprite].forEach(function(sprite) {
            var bitmap = sprite.bitmap;
            if (!bitmap || !bitmap.width) return;
            var scale = Math.max(v.width / bitmap.width, v.height / bitmap.height);
            sprite.scale.x = sprite.scale.y = scale;
            sprite.x = v.x + (v.width - bitmap.width * scale) / 2 - this._battleField.x;
            sprite.y = v.y + (v.height - bitmap.height * scale) / 2 - this._battleField.y;
        }, this);
    };

    var _Sprite_Enemy_setBattler = Sprite_Enemy.prototype.setBattler;
    Sprite_Enemy.prototype.setBattler = function(battler) {
        _Sprite_Enemy_setBattler.call(this, battler);
        var v = $.rects().view;
        this._homeX = Math.round(v.x + this._homeX / $.BASE_WIDTH * v.width);
        this._homeY = Math.round(v.y + v.height * (0.2 + 0.8 * this._homeY / $.BASE_HEIGHT));
    };

    // State icons over enemies: copy the one icon into a small bitmap. Iconset.png
    // is taller than some graphics cards can hold as one texture (it showed as a
    // black square).
    Sprite_StateIcon.prototype.loadBitmap = function() {
        this._siIconset = ImageManager.loadSystem('IconSet');
        this.bitmap = new Bitmap(Sprite_StateIcon._iconWidth, Sprite_StateIcon._iconHeight);
        this._siDrawn = -1;
    };

    Sprite_StateIcon.prototype.updateFrame = function() {
        if (this._siDrawn === this._iconIndex || !this._siIconset.isReady()) return;
        var pw = Sprite_StateIcon._iconWidth, ph = Sprite_StateIcon._iconHeight, i = this._iconIndex;
        this.bitmap.clear();
        if (i > 0) this.bitmap.blt(this._siIconset, i % 16 * pw, Math.floor(i / 16) * ph, pw, ph, 0, 0);
        this._siDrawn = i;
    };

    //-------------------------------------------------------------------------
    // Scene_Battle
    //-------------------------------------------------------------------------

    var _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        _Scene_Battle_createAllWindows.call(this);
        this.createHud();
    };

    Scene_Battle.prototype.createHud = function() {
        var r = $.rects(), col = r.column;
        // The frame round the battlefield, under everything.
        var frame = new Window_Base(r.view.x, r.view.y, r.view.width, r.view.height);
        frame._siFrame = true;
        frame._refreshFrame();
        frame.backOpacity = 0;
        this._windowLayer.addChildAt(frame, 0);
        this._hudInfoWindow = new Window_SIBattleInfo(r.view.x + 12, r.view.y + 12);
        this._windowLayer.addChildAt(this._hudInfoWindow, 1);
        // Turn order across the top.
        var order = this._turnOrderWindow;
        if (order) {
            $.restyle(order, 8, $.FONT.strip, $.STRIP_HEIGHT - 16);
            $.place(order, r.strip);
            order._signature = '';
        }
        // The command column: one framed panel. Commands, or a list with its title
        // above and the help (description) below a divider, sit inside it.
        var I = $.INSET, inner = { x: col.x + I, y: col.y + I, width: col.width - I * 2, height: col.height - I * 2 };
        var listY = inner.y + $.TITLE_HEIGHT, helpY = inner.y + inner.height - $.HELP_HEIGHT;
        this._hudColumnWindow = new Window_SIColumn(col, helpY - inner.y - 4);
        this._windowLayer.addChildAt(this._hudColumnWindow, 2);
        this._hudTitleWindow = new Window_SIColumnTitle(inner.x, inner.y, inner.width);
        var help = this._helpWindow;
        $.restyle(help, 10, $.FONT.help, 30);
        $.place(help, { x: inner.x, y: helpY, width: inner.width, height: $.HELP_HEIGHT });
        var commandRect = { x: inner.x, y: inner.y, width: inner.width, height: helpY - 6 - inner.y };
        [this._partyCommandWindow, this._actorCommandWindow, this._skillTypeWindow, this._tacticsWindow].forEach(function(win) {
            if (!win) return;
            $.restyle(win, 12, $.FONT.command, 46);
            win.windowWidth = function() { return commandRect.width; };
            win.numVisibleRows = function() { return Math.floor((commandRect.height - this.standardPadding() * 2) / this.lineHeight()); };
            $.place(win, commandRect);
        });
        var listRect = { x: inner.x, y: listY, width: inner.width, height: helpY - 6 - listY };
        [this._skillWindow, this._itemWindow, this._swapWindow, this._reserveWindow, this._enemyWindow, this._actorWindow].forEach(function(win) {
            if (!win) return;
            $.restyle(win, 8, $.FONT.list, 34);
            $.place(win, listRect);
        });
        $.styleSkillList(this._skillWindow);
        // The old party list stays for the engine's bookkeeping, out of sight.
        var status = this._statusWindow;
        status.update = function() {
            Window_BattleStatus.prototype.update.call(this);
            this.visible = false;
        };
        status.visible = false;
        // Commands sit low in the window stack, so lists open over them (a later
        // window hides what's under it).
        [this._partyCommandWindow, this._actorCommandWindow, this._skillTypeWindow, this._tacticsWindow].forEach(function(win, i) {
            if (!win) return;
            this._windowLayer.removeChild(win);
            this._windowLayer.addChildAt(win, 3 + i);
        }, this);
        // Lists, help and the HUD go just under the message window.
        [this._hudTitleWindow, this._skillWindow, this._itemWindow, this._swapWindow, this._reserveWindow, this._enemyWindow,
            this._actorWindow, this._helpWindow].forEach(function(win) {
            if (!win) return;
            this._windowLayer.removeChild(win);
            $.addUnderMessages(this, win);
        }, this);
        // The bar under the battlefield is the battle log.
        $.styleLog(this._logWindow, r.bar);
        this._windowLayer.removeChild(this._logWindow);
        $.addUnderMessages(this, this._logWindow);
        // Party cards, and the allies strip on the right.
        this._hudCards = [];
        for (var i = 0; i < $gameParty.maxBattleMembers(); i++) {
            var card = new Window_SICard(i);
            this._hudCards.push(card);
            $.addUnderMessages(this, card);
        }
        var cardsTop = r.cards.y;
        this._pseudoStatusWindow = new Window_SIAllies(r.cards.x + r.cards.width - $.ALLY_WIDTH, cardsTop,
            $.ALLY_WIDTH, Graphics.boxHeight - $.MARGIN - cardsTop);
        $.addUnderMessages(this, this._pseudoStatusWindow);
        this.layoutCards();
        [this._partyCommandWindow, this._actorCommandWindow, this._skillTypeWindow, this._tacticsWindow, this._skillWindow,
            this._itemWindow, this._swapWindow, this._reserveWindow, this._enemyWindow, this._actorWindow].forEach(function(win) {
            if (win) $.addArrow(win);
        });
        // Plain green backs; inside the column, no frames of their own.
        var inColumn = [this._hudTitleWindow, this._helpWindow, this._partyCommandWindow, this._actorCommandWindow,
            this._skillTypeWindow, this._tacticsWindow, this._skillWindow, this._itemWindow, this._swapWindow,
            this._reserveWindow, this._enemyWindow, this._actorWindow];
        this._windowLayer.children.forEach(function(win) {
            if (win._isWindow && win !== frame && win !== this._hudInfoWindow) $.makeSolid(win, inColumn.indexOf(win) >= 0);
        }, this);
    };

    Scene_Battle.prototype.layoutCards = function() {
        var members = $gameParty.regularBattleMembers().length;
        var allies = $gameParty.pseudoBattleMembers().length > 0;
        var key = members + '|' + allies;
        if (key === this._hudCardKey) return;
        this._hudCardKey = key;
        var r = $.rects().cards, gap = $.MARGIN;
        var area = r.width - (allies ? $.ALLY_WIDTH + gap : 0);
        var n = Math.max(members, 1);
        var width = Math.min($.CARD_MAX_WIDTH, Math.floor((area - gap * (n - 1)) / n));
        var start = r.x + Math.floor((area - (n * width + (n - 1) * gap)) / 2);
        var y = r.y + $.LIFT;
        this._hudCards.forEach(function(card, i) {
            card.setBase(start + i * (width + gap), y, width);
        });
    };

    var _Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function() {
        if (this._hudCards) this.layoutCards();
        _Scene_Battle_update.call(this);
    };

    // Picking a friend for a skill: one line each (name, state icons, Health).
    Window_BattleActor.prototype.drawItem = function(index) {
        var actor = $gameParty.battleMembers()[index];
        if (!actor) return;
        var rect = this.itemRectForText(index);
        this.changeTextColor(this.hpColor(actor));
        this.drawText(actor.name(), rect.x, rect.y, 150);
        this.drawActorIcons(actor, rect.x + 154, rect.y, rect.width - 154 - 110);
        this.changeTextColor(this.systemColor());
        this.drawText(actor.hp + '/' + actor.mhp, rect.x, rect.y, rect.width, 'right');
        this.resetTextColor();
    };

})(SmokingIsle.BattleHud);
