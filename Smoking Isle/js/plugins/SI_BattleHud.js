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
 * - Battle windows have plain dark green backs; the battle background shows
 *   only inside the battlefield's frame.
 * - Lists open in the column under a small title, skills without icons, and
 *   the help sits under a divider at the column's foot.
 * - The card of whoever is acting lifts and gets a gold frame (a friend being
 *   picked for a skill, a blue one); a card shakes when its
 *   Health drops. With SI_RollingHealth, Health still to roll away shows
 *   as a red stretch of the bar (and healing still to come, green).
 * - The ally strip (AI allies such as Patience) only appears while one is
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

    $.STRIP_HEIGHT = 60;
    $.COLUMN_WIDTH = 400;
    $.BAR_HEIGHT = 84;
    $.CARD_HEIGHT = 176;
    $.LIFT = 20;
    $.ALLY_WIDTH = 248;
    $.GAP = 8;
    $.INSET = 6;           // lists and commands sit inside the column's frame
    $.TITLE_HEIGHT = 30;
    $.HELP_HEIGHT = 72;
    $.COLORS = {
        back: '#1f2a14', screen: '#111111', label: '#8fd3ff', prompt: '#ffd76b', place: '#9be36b',
        cost: '#bbbbbb', divider: '#d98c1f'
    };
    // Frame tints for a card: gold for whoever is acting, blue for a friend being picked.
    $.SKIN_TONES = { active: [30, 75, 60], target: [-100, 40, 200] };
    // Troop positions in the database are laid out for the old 816 x 624 screen.
    $.BASE_WIDTH = 816;
    $.BASE_HEIGHT = 624;

    $.rects = function() {
        var W = Graphics.boxWidth, H = Graphics.boxHeight;
        var cardsY = H - $.CARD_HEIGHT - $.LIFT;
        var barY = cardsY - $.BAR_HEIGHT;
        var viewH = barY - $.STRIP_HEIGHT;
        return {
            strip: { x: 0, y: 0, width: W, height: $.STRIP_HEIGHT },
            view: { x: 0, y: $.STRIP_HEIGHT, width: W - $.COLUMN_WIDTH, height: viewH },
            column: { x: W - $.COLUMN_WIDTH, y: $.STRIP_HEIGHT, width: $.COLUMN_WIDTH, height: viewH },
            bar: { x: 0, y: barY, width: W, height: $.BAR_HEIGHT },
            cards: { x: 0, y: cardsY, width: W, height: H - cardsY }
        };
    };

    // Battle windows get a plain dark green back instead of the windowskin's.
    var _Window_refreshBack = Window.prototype._refreshBack;
    Window.prototype._refreshBack = function() {
        if (!this._siSolid) return _Window_refreshBack.call(this);
        // Frameless ones fill their whole rect, so panels side by side leave no seam.
        var m = this._siFrameless ? 0 : this._margin, w = this._width - m * 2, h = this._height - m * 2;
        var bitmap = new Bitmap(w, h);
        this._windowBackSprite.bitmap = bitmap;
        this._windowBackSprite.setFrame(0, 0, w, h);
        this._windowBackSprite.move(m, m);
        if (w > 0 && h > 0) {
            bitmap.fillAll($.COLORS.back);
            var tone = this._colorTone;
            bitmap.adjustTone(tone[0], tone[1], tone[2]);
        }
    };

    $.makeSolid = function(win, frameless) {
        win._siSolid = true;
        win._siFrameless = !!frameless;
        win.backOpacity = 255;
        win._refreshBack();
        if (frameless) win._windowFrameSprite.visible = false;
    };

    // The windowskin with its frame tinted ('' for the plain one).
    $._skins = {};
    $.skin = function(kind) {
        var base = ImageManager.loadSystem('Window');
        if (!kind || !base.isReady()) return base;
        if (!$._skins[kind]) {
            // Only the frame (96..192 x 0..96); text colours and the cursor stay as they are.
            var bitmap = new Bitmap(base.width, base.height), frame = new Bitmap(96, 96), tone = $.SKIN_TONES[kind];
            bitmap.blt(base, 0, 0, base.width, base.height, 0, 0);
            frame.blt(base, 96, 0, 96, 96, 0, 0);
            frame.adjustTone(tone[0], tone[1], tone[2]);
            bitmap.clearRect(96, 0, 96, 96);
            bitmap.blt(frame, 0, 0, 96, 96, 96, 0);
            $._skins[kind] = bitmap;
        }
        return $._skins[kind];
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
        var c = win.contents, h = 8;
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

    $.drawFace = function(win, actor, x, y, size) {
        var bitmap = ImageManager.loadFace(actor.faceName());
        var pw = Window_Base._faceWidth, ph = Window_Base._faceHeight, i = actor.faceIndex();
        if (!bitmap.isReady()) return;
        if (actor.isDead()) win.contents.paintOpacity = 110;
        win.contents.blt(bitmap, i % 4 * pw, Math.floor(i / 4) * ph, pw, ph, x, y, size, size);
        win.contents.paintOpacity = 255;
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
        if (!actor) return;
        var mark = $.highlight(actor);
        this._lift = (this._lift + (mark ? 4 : -4)).clamp(0, $.LIFT);
        if (this._lastHp !== null && actor.hp < this._lastHp) this._shake = 12;
        this._lastHp = actor.hp;
        var dx = this._shake > 0 ? Math.round(Math.sin(this._shake-- * 1.7) * 4) : 0;
        this.x = this._baseX + dx;
        this.y = this._baseY - this._lift;
        var skin = $.skin(mark);
        if (this.windowskin !== skin) this.windowskin = skin;
        if (actor.isDead()) this.setTone(-40, -40, -40);
        else this.setTone(0, 0, 0);
        var sig = [actor.actorId(), actor.hp, $.target(actor), actor.mhp, actor.mp, actor.mmp, actor.tp,
            actor.states().map(function(s) { return s.id; }).join(), this.width,
            ImageManager.loadFace(actor.faceName()).isReady()].join('|');
        if (sig !== this._signature) {
            this._signature = sig;
            this.refresh();
        }
    };

    Window_SICard.prototype.refresh = function() {
        var actor = this.actor(), c = this.contents;
        c.clear();
        if (!actor) return;
        var w = this.contentsWidth(), face = 72;
        $.drawFace(this, actor, 0, 0, face);
        this.resetFontSettings();
        c.fontSize = 24;
        this.changeTextColor(this.hpColor(actor));
        this.drawText(actor.name(), face + 10, 0, w - face - 10);
        this.drawActorIcons(actor, face + 10, 38, w - face - 10);
        c.fontSize = 15;
        var y = 76;
        this.drawStat(TextManager.hpA, actor.hp + '/' + actor.mhp, 0, y, w, this.hpColor(actor));
        $.drawBar(this, 0, y + 24, w, actor.hpRate(), this.hpGaugeColor1(), this.hpGaugeColor2(),
            actor.mhp > 0 ? $.target(actor) / actor.mhp : 0);
        var half = Math.floor((w - 12) / 2);
        y += 38;
        this.drawStat(TextManager.mpA, actor.mp, 0, y, half, this.mpColor(actor));
        $.drawBar(this, 0, y + 24, half, actor.mpRate(), this.mpGaugeColor1(), this.mpGaugeColor2());
        this.drawStat(TextManager.tpA, actor.tp, half + 12, y, half, this.tpColor(actor));
        $.drawBar(this, half + 12, y + 24, half, actor.tpRate(), this.tpGaugeColor1(), this.tpGaugeColor2());
        this.resetFontSettings();
    };

    // "HT 28/40" in light blue (the number turns yellow or red when it's low).
    Window_SICard.prototype.drawStat = function(label, value, x, y, width, color) {
        var text = label + ' ' + value;
        this.changeTextColor(color === this.normalColor() ? $.COLORS.label : color);
        this.contents.drawText(text, x, y, width, 24);
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
    };

    Window_SIAllies.prototype.standardPadding = function() {
        return 12;
    };

    Window_SIAllies.prototype.members = function() {
        return $gameParty.pseudoBattleMembers().slice(0, 3);
    };

    Window_SIAllies.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        var members = this.members();
        this.visible = members.length > 0;
        var sig = members.map(function(a) {
            return [a.actorId(), a.hp, $.target(a), a.mhp, $.highlight(a), a.states().map(function(s) { return s.id; }).join(),
                ImageManager.loadFace(a.faceName()).isReady()].join(',');
        }).join('|');
        if (sig !== this._signature) {
            this._signature = sig;
            this.refresh();
        }
    };

    Window_SIAllies.prototype.refresh = function() {
        var c = this.contents, w = this.contentsWidth();
        c.clear();
        this.resetFontSettings();
        c.fontSize = 14;
        this.changeTextColor($.COLORS.place);
        c.drawText('Allies', 0, 0, w, 20);
        this.members().forEach(function(actor, i) {
            var y = 22 + i * 44, mark = $.highlight(actor);
            if (mark) {
                c.paintOpacity = 72;
                c.fillRect(0, y, w, 42, mark === 'target' ? this.textColor(4) : this.textColor(6));
                c.paintOpacity = 255;
            }
            $.drawFace(this, actor, 0, y + 3, 36);
            c.fontSize = 16;
            this.changeTextColor(this.hpColor(actor));
            c.drawText(actor.name(), 44, y, w - 44, 22);
            c.fontSize = 13;
            this.changeTextColor($.COLORS.label);
            c.drawText(actor.hp + '/' + actor.mhp, 44, y, w - 44, 22, 'right');
            $.drawBar(this, 44, y + 28, w - 44, actor.hpRate(), this.hpGaugeColor1(), this.hpGaugeColor2(),
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

    // The battle log becomes the bar: a framed window showing its two newest
    // lines, or the prompt when there's nothing to say.
    $.LOG_LINES = 2;

    $.styleLog = function(log, rect) {
        $.restyle(log, 12, 22, 30);
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
                this.changeTextColor($.COLORS.prompt);
                this.contents.drawText(this._siPrompt, 4, 0, this.contentsWidth() - 8, this.lineHeight());
                this.resetTextColor();
                return;
            }
            var start = Math.max(0, this._lines.length - $.LOG_LINES);
            for (var i = start; i < this._lines.length; i++) {
                this.drawTextEx(this._lines[i], 4, (i - start) * this.lineHeight(), this.contentsWidth() - 8);
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
        Window_Base.prototype.initialize.call(this, x, y, 260, 20 + Math.max(lines.length, 1) * 28);
        $.makeSolid(this);
        this.backOpacity = 220;
        this.visible = lines.length > 0;
        this.contents.fontSize = 18;
        lines.forEach(function(line, i) {
            this.changeTextColor(i === 0 ? this.normalColor() : $.COLORS.place);
            this.contents.drawText(line, 0, i * 28, this.contentsWidth(), 28);
        }, this);
    };

    Window_SIBattleInfo.prototype.standardPadding = function() {
        return 10;
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
            if (show) this.contents.fillRect(8, this._dividerY, this.contentsWidth() - 16, 2, $.COLORS.divider);
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
            this.contents.fontSize = 16;
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
            this.drawText(skill.name, rect.x + 8, rect.y, Math.floor(rect.width * 0.62));
            this.drawSkillCost(skill, rect.x, rect.y, rect.width);
            this.changePaintOpacity(1);
        };
        win.tpCostColor = function() { return $.COLORS.cost; };
        win.refresh();
    };

    //-------------------------------------------------------------------------
    // The battlefield, framed
    //-------------------------------------------------------------------------

    var _Spriteset_Battle_createBattleField = Spriteset_Battle.prototype.createBattleField;
    Spriteset_Battle.prototype.createBattleField = function() {
        _Spriteset_Battle_createBattleField.call(this);
        var v = $.rects().view, mask = new PIXI.Graphics();
        mask.beginFill(0xffffff);
        mask.drawRect(v.x + 4, v.y + 4, v.width - 8, v.height - 8);
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
        frame.backOpacity = 0;
        this._windowLayer.addChildAt(frame, 0);
        this._hudInfoWindow = new Window_SIBattleInfo(r.view.x + 12, r.view.y + 12);
        this._windowLayer.addChildAt(this._hudInfoWindow, 1);
        // Turn order across the top.
        var order = this._turnOrderWindow;
        if (order) {
            $.restyle(order, 12, 20);
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
        $.restyle(help, 10, 18, 26);
        $.place(help, { x: inner.x, y: helpY, width: inner.width, height: $.HELP_HEIGHT });
        var commandRect = { x: inner.x, y: inner.y, width: inner.width, height: helpY - 6 - inner.y };
        [this._partyCommandWindow, this._actorCommandWindow, this._skillTypeWindow, this._tacticsWindow].forEach(function(win) {
            if (!win) return;
            $.restyle(win, 12, 26, 46);
            win.windowWidth = function() { return commandRect.width; };
            win.numVisibleRows = function() { return Math.floor((commandRect.height - this.standardPadding() * 2) / this.lineHeight()); };
            $.place(win, commandRect);
        });
        var listRect = { x: inner.x, y: listY, width: inner.width, height: helpY - 6 - listY };
        [this._skillWindow, this._itemWindow, this._swapWindow, this._reserveWindow, this._enemyWindow, this._actorWindow].forEach(function(win) {
            if (!win) return;
            $.restyle(win, 8, 20, 32);
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
        var allyY = Graphics.boxHeight - $.CARD_HEIGHT;
        this._pseudoStatusWindow = new Window_SIAllies(Graphics.boxWidth - $.ALLY_WIDTH - $.GAP / 2, allyY,
            $.ALLY_WIDTH, $.CARD_HEIGHT);
        $.addUnderMessages(this, this._pseudoStatusWindow);
        this.layoutCards();
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
        var area = Graphics.boxWidth - (allies ? $.ALLY_WIDTH + $.GAP : 0);
        var n = Math.max(members, 1), gap = $.GAP;
        var width = Math.min(320, Math.floor((area - gap * (n + 1)) / n));
        var start = Math.floor((area - (n * width + (n - 1) * gap)) / 2);
        var y = Graphics.boxHeight - $.CARD_HEIGHT;
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
