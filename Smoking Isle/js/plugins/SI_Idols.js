//=============================================================================
// SI_Idols.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: the idols of resting areas. Red Bowl saves,
 * Sooty Bird flies you to other idols, Star Mother lets you rest and share a meal.
 * @author Smoking Isle
 *
 * @help
 * Place after SI_Meals, SI_Time and SI_Crafting.
 *
 * A resting area has some of these, as map events (each calls a common
 * event):
 *   Red Bowl Idol     Common Event "Red Bowl Idol": the only place to save.
 *                     (The menu has no Save command.)
 *   Sooty Bird Idol   Common Event "Sooty Bird Idol". Event note:
 *                       <Sooty Bird: Zonfahare>
 *                     Touching one remembers it; from any Sooty Bird idol
 *                     you can fly to any other you've touched. Flying takes
 *                     a period of the day (dawn -> day...). Sooty Bird
 *                     doesn't fly at night. You land on the tile below the
 *                     idol.
 *   Star Mother Idol  Common Event "Star Mother Idol": rest until dawn, or
 *                     share a meal.
 *   Campfire / Earth Oven   crafting (SI_Crafting).
 *
 * Resting (SmokingIsle.Idols.rest()) sleeps until the next dawn. It restores
 * Fatigue and Mana and clears lingering ailments, but NOT Health; anyone
 * knocked out wakes with 1 Health. Everyone is hungry again.
 *
 * Health comes back by eating. Sharing a meal (SmokingIsle.Idols.openMeal())
 * lets you pick one food for each party member (Patience too). Taboo foods
 * can't be picked for someone who won't eat them. Everyone's food goes in
 * one pot: the Health (and Mana) of all of it heals every party member; a
 * "Full Health" food fills everyone. Tou's "meal" can be laying remains to
 * rest (item note <Rite Text: %1 lays ...>). Each eater still gets their own food's
 * lasting stat gain (up to its cap). One meal per rest. Meals can't be eaten
 * from the menu.
 *
 * Auto-pick (on the meal screen, and SmokingIsle.Idols.autoPlan(plan)) fills
 * everyone without a pick: the food that still grows them most (the pickiest
 * eaters choose first, so scarce foods go where they're needed), and once
 * nothing grows anyone, only enough extra food to heal the party. Picks you
 * made yourself are kept.
 */

var Imported = Imported || {};
Imported.SI_Idols = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Idols = SmokingIsle.Idols || {};

(function($) {
    'use strict';

    var Meals = SmokingIsle.Meals, Time = SmokingIsle.Time;

    //-------------------------------------------------------------------------
    // Red Bowl: saving only at its idols
    //-------------------------------------------------------------------------

    Window_MenuCommand.prototype.addSaveCommand = function() {};

    //-------------------------------------------------------------------------
    // Sooty Bird: fast travel between idols you've touched
    //-------------------------------------------------------------------------

    $.idols = function() {
        if (!$gameSystem._siIdols) $gameSystem._siIdols = {};
        return $gameSystem._siIdols;
    };

    $.idolName = function(event) {
        var m = event && /<Sooty Bird:\s*([^>]+)>/i.exec(event.event().note || '');
        return m ? m[1].trim() : '';
    };

    $.remember = function(name, mapId, x, y) {
        $.idols()[name] = { mapId: mapId, x: x, y: y + 1 };
    };

    $.destinations = function(here) {
        return Object.keys($.idols()).filter(function(n) { return n !== here; });
    };

    // Fly to a remembered idol: time passes by one period.
    $.fly = function(name) {
        var d = $.idols()[name];
        if (!d || (Time && Time.isNight())) return false;
        if (Time) Time.advance();
        $gamePlayer.reserveTransfer(d.mapId, d.x, d.y, 2, 0);
        return true;
    };

    $.sootyBird = function(interpreter) {
        var eventId = interpreter.eventId ? interpreter.eventId() : interpreter._eventId;
        var event = $gameMap.event(eventId), here = $.idolName(event);
        $.pendingFlight = null;
        if (here) $.remember(here, $gameMap.mapId(), event.x, event.y);
        var places = $.destinations(here);
        if (Time && Time.isNight()) $gameMessage.add('Sooty Bird doesn\'t fly at night. Come back by day.');
        else if (places.length === 0) $gameMessage.add('Sooty Bird knows this place now. Touch another of its idols, and it will carry you between them.');
        else {
            $.pendingFlight = { places: places, choice: -1 };
            $gameMessage.add('Where will Sooty Bird carry you?');
            $gameMessage.setChoices(places.concat(['Stay']), 0, places.length);
            $gameMessage.setChoiceCallback(function(n) { $.pendingFlight.choice = n; });
        }
        interpreter.setWaitMode('message');
    };

    $.sootyBirdFly = function() {
        var p = $.pendingFlight;
        $.pendingFlight = null;
        if (!p || p.choice < 0 || p.choice >= p.places.length) return false;
        return $.fly(p.places[p.choice]);
    };

    //-------------------------------------------------------------------------
    // Star Mother: rest until dawn
    //-------------------------------------------------------------------------

    $.rest = function() {
        if (Time) Time.sleep();
        $gameParty.allMembers().forEach(function(a) {
            var dead = a.isDead();
            a.clearStates();
            if (dead) a.setHp(1);
            a.setMp(a.mmp);
            a.setTp(0);
            a._siFed = false;
        });
        $gameSystem._siTiredWarned = false;
    };

    //-------------------------------------------------------------------------
    // Star Mother: share a meal
    //-------------------------------------------------------------------------

    // Can this actor eat this food? Returns '' or the reason.
    $.mealProblem = function(actor, item) {
        if (actor.mealRefusal() !== null) return actor.mealRefusalText();
        if (item && actor.tabooRefusal(item)) return actor.tabooRefusalText(item);
        return '';
    };

    $.hasEaten = function() {
        return $gameParty.allMembers().some(function(a) { return a.isFed(); });
    };

    // What a food puts in the pot: { hp, mp, full }.
    $.potValue = function(item) {
        var v = { hp: 0, mp: 0, full: false };
        item.effects.forEach(function(e) {
            if (e.code === Game_Action.EFFECT_RECOVER_HP) { v.hp += e.value2; if (e.value1 >= 1) v.full = true; }
            if (e.code === Game_Action.EFFECT_RECOVER_MP) v.mp += e.value2;
        });
        return v;
    };

    // plan: { actorId: item }. Returns a summary line, or null if nothing was eaten.
    $.shareMeal = function(plan) {
        if ($.hasEaten()) return null;
        var members = $gameParty.allMembers(), pot = { hp: 0, mp: 0, full: false }, eaters = [], rites = [];
        members.forEach(function(a) {
            var item = plan[a.actorId()];
            if (!item || $.mealProblem(a, item) || $gameParty.numItems(item) < 1) return;
            $gameParty.loseItem(item, 1);
            var v = $.potValue(item);
            pot.hp += v.hp; pot.mp += v.mp; pot.full = pot.full || v.full;
            if (a.mealsEaten(item) < item.siMealCap) {
                item.effects.forEach(function(e) {
                    if (e.code === Game_Action.EFFECT_GROW) a.addParam(e.dataId, Math.floor(e.value1));
                });
            }
            a._siMeals = a._siMeals || {};
            a._siMeals[item.id] = a.mealsEaten(item) + 1;
            eaters.push(a.name());
            var rite = /<Rite Text:\s*([^>]+)>/i.exec(item.note || '');
            if (rite) rites.push(rite[1].replace(/%1/g, a.name()));
        });
        if (eaters.length === 0) return null;
        members.forEach(function(a) {
            a._siFed = true;
            if (a.isDead()) return;
            a.gainHp(pot.full ? a.mhp : pot.hp);
            if (pot.mp > 0) a.gainMp(pot.mp);
        });
        var shared = pot.hp > 0 || pot.mp > 0 || pot.full ? 'Everyone shares the meal: ' + (pot.full ? 'full Health' : '+' + pot.hp + ' Health') +
               (pot.mp > 0 ? ', +' + pot.mp + ' Mana' : '') + ' each.' : '';
        return rites.concat(shared ? [shared] : []).join(' ');
    };

    // How much a food still grows this actor (0 once it's past its cap).
    $.growthValue = function(actor, item) {
        if (actor.mealsEaten(item) >= item.siMealCap) return 0;
        return item.effects.reduce(function(sum, e) {
            return e.code === Game_Action.EFFECT_GROW ? sum + e.value1 * (e.dataId <= 1 ? 0.2 : 1) : sum;
        }, 0);
    };

    // Fills the plan ({ actorId: item }) for everyone without a pick. Returns the plan.
    $.autoPlan = function(plan) {
        var foods = $gameParty.items().filter(function(i) { return Meals.isMeal(i); });
        var left = function(item) {
            var used = Object.keys(plan).filter(function(id) { return plan[id] === item; }).length;
            return $gameParty.numItems(item) - used;
        };
        var eaters = $gameParty.allMembers().filter(function(a) { return a.mealRefusal() === null && !plan[a.actorId()]; });
        var options = function(a) { return foods.filter(function(i) { return left(i) > 0 && !$.mealProblem(a, i); }); };
        eaters.sort(function(a, b) { return options(a).length - options(b).length; });
        var waiting = [];
        eaters.forEach(function(a) {
            var best = null, bestV = 0;
            options(a).forEach(function(i) { var v = $.growthValue(a, i); if (v > bestV) { bestV = v; best = i; } });
            if (best) plan[a.actorId()] = best; else waiting.push(a);
        });
        // Nobody grows from what's left: add food only while the pot can't yet heal the party.
        var need = Math.max.apply(null, $gameParty.allMembers().map(function(a) { return a.isDead() ? 0 : a.mhp - a.hp; }).concat([0]));
        var pot = 0, full = false;
        Object.keys(plan).forEach(function(id) { var v = $.potValue(plan[id]); pot += v.hp; full = full || v.full; });
        waiting.forEach(function(a) {
            if (full || pot >= need) return;
            var pick = options(a).sort(function(x, y) { return $.potValue(y).hp - $.potValue(x).hp; })[0];
            if (!pick) return;
            plan[a.actorId()] = pick;
            var v = $.potValue(pick); pot += v.hp; full = full || v.full;
        });
        return plan;
    };

    $.openMeal = function() {
        if ($.hasEaten()) { $gameMessage.add('You\'ve already eaten. Rest first.'); return; }
        SceneManager.push(Scene_SIMeal);
    };

    // Meals are eaten at a Star Mother idol, not from the menu.
    var _Window_ItemList_isEnabled = Window_ItemList.prototype.isEnabled;
    Window_ItemList.prototype.isEnabled = function(item) {
        if (SceneManager._scene instanceof Scene_Item && Meals.isMeal(item)) return false;
        return _Window_ItemList_isEnabled.call(this, item);
    };

    //-------------------------------------------------------------------------
    // The meal screen
    //-------------------------------------------------------------------------

    function Window_SIMealMembers() { this.initialize.apply(this, arguments); }
    Window_SIMealMembers.prototype = Object.create(Window_Selectable.prototype);
    Window_SIMealMembers.prototype.constructor = Window_SIMealMembers;

    Window_SIMealMembers.prototype.initialize = function(x, y, width, height, plan) {
        this._plan = plan;
        Window_Selectable.prototype.initialize.call(this, x, y, width, height);
        this.refresh();
        this.select(0);
    };
    Window_SIMealMembers.prototype.members = function() { return $gameParty.allMembers(); };
    Window_SIMealMembers.prototype.maxItems = function() { return this.members().length + 3; };
    Window_SIMealMembers.prototype.actor = function() { return this.members()[this.index()] || null; };
    Window_SIMealMembers.prototype.command = function() {
        var i = this.index() - this.members().length;
        return i === 0 ? 'auto' : i === 1 ? 'eat' : i === 2 ? 'leave' : null;
    };
    Window_SIMealMembers.prototype.drawItem = function(index) {
        var rect = this.itemRectForText(index), members = this.members();
        this.resetTextColor();
        if (index >= members.length) {
            this.drawText(['Auto-pick', 'Eat together', 'Leave'][index - members.length], rect.x, rect.y, rect.width);
            return;
        }
        var a = members[index], item = this._plan[a.actorId()];
        this.drawText(a.name(), rect.x, rect.y, 140);
        var right = a.mealRefusal() !== null ? '(won\'t eat)' : item ? item.name : '-';
        this.changePaintOpacity(!!item);
        this.drawText(right, rect.x + 150, rect.y, rect.width - 150);
        this.changePaintOpacity(true);
    };

    function Window_SIMealFoods() { this.initialize.apply(this, arguments); }
    Window_SIMealFoods.prototype = Object.create(Window_Selectable.prototype);
    Window_SIMealFoods.prototype.constructor = Window_SIMealFoods;

    Window_SIMealFoods.prototype.initialize = function(x, y, width, height, plan) {
        this._plan = plan;
        this._actor = null;
        Window_Selectable.prototype.initialize.call(this, x, y, width, height);
        this.refresh();
    };
    Window_SIMealFoods.prototype.setActor = function(actor) { this._actor = actor; this.refresh(); };
    Window_SIMealFoods.prototype.foods = function() {
        return [null].concat($gameParty.items().filter(function(i) { return Meals.isMeal(i); }));
    };
    Window_SIMealFoods.prototype.maxItems = function() { return this.foods().length; };
    Window_SIMealFoods.prototype.item = function() { return this.foods()[this.index()]; };
    // How many are left once the rest of the plan is set aside.
    Window_SIMealFoods.prototype.left = function(item) {
        var plan = this._plan, actor = this._actor, used = 0;
        Object.keys(plan).forEach(function(id) { if (plan[id] === item && (!actor || Number(id) !== actor.actorId())) used++; });
        return $gameParty.numItems(item) - used;
    };
    Window_SIMealFoods.prototype.isEnabledItem = function(item) {
        if (!item) return true;
        return !!this._actor && this.left(item) > 0 && !$.mealProblem(this._actor, item);
    };
    Window_SIMealFoods.prototype.isCurrentItemEnabled = function() { return this.isEnabledItem(this.item()); };
    Window_SIMealFoods.prototype.drawItem = function(index) {
        var item = this.foods()[index], rect = this.itemRectForText(index);
        this.changePaintOpacity(this.isEnabledItem(item));
        if (!item) this.drawText('(nothing)', rect.x, rect.y, rect.width);
        else {
            this.drawItemName(item, rect.x, rect.y, rect.width - 60);
            this.drawText('x' + Math.max(this.left(item), 0), rect.x, rect.y, rect.width, 'right');
        }
        this.changePaintOpacity(true);
    };
    Window_SIMealFoods.prototype.updateHelp = function() {
        var item = this.item();
        if (!item) { this._helpWindow.setText('Skip this one.'); return; }
        var why = this._actor ? $.mealProblem(this._actor, item) : '';
        var v = $.potValue(item);
        this._helpWindow.setText(why || item.description + '\nInto the pot: ' + (v.full ? 'full Health' : v.hp + ' Health') + (v.mp ? ', ' + v.mp + ' Mana' : '') + '.');
    };

    function Scene_SIMeal() { this.initialize.apply(this, arguments); }
    Scene_SIMeal.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_SIMeal.prototype.constructor = Scene_SIMeal;
    window.Scene_SIMeal = Scene_SIMeal;

    Scene_SIMeal.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        this._plan = {};
        this.createHelpWindow();
        this._helpWindow.setText('Share a meal: pick a food for each of you. All of it goes in one pot, and the pot heals everyone.');
        var y = this._helpWindow.height, h = Graphics.boxHeight - y, w = Math.floor(Graphics.boxWidth * 0.45);
        this._memberWindow = new Window_SIMealMembers(0, y, w, h, this._plan);
        this._memberWindow.setHandler('ok', this.onMemberOk.bind(this));
        this._memberWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(this._memberWindow);
        this._foodWindow = new Window_SIMealFoods(w, y, Graphics.boxWidth - w, h, this._plan);
        this._foodWindow.setHelpWindow(this._helpWindow);
        this._foodWindow.setHandler('ok', this.onFoodOk.bind(this));
        this._foodWindow.setHandler('cancel', this.onFoodCancel.bind(this));
        this.addWindow(this._foodWindow);
        this._memberWindow.activate();
    };

    Scene_SIMeal.prototype.onMemberOk = function() {
        var cmd = this._memberWindow.command();
        if (cmd === 'leave') { this.popScene(); return; }
        if (cmd === 'auto') {
            $.autoPlan(this._plan);
            this._memberWindow.refresh();
            this._helpWindow.setText('Picked what still makes each of you stronger, and enough to heal. Change any pick, then Eat together.');
            this._memberWindow.activate();
            return;
        }
        if (cmd === 'eat') {
            var text = $.shareMeal(this._plan);
            if (text) { $gameMessage.add(text); this.popScene(); return; }
            SoundManager.playBuzzer();
            this._helpWindow.setText('Nobody has anything to eat yet.');
            this._memberWindow.activate();
            return;
        }
        var actor = this._memberWindow.actor();
        if (actor.mealRefusal() !== null) {
            SoundManager.playBuzzer();
            this._helpWindow.setText(actor.mealRefusalText());
            this._memberWindow.activate();
            return;
        }
        this._foodWindow.setActor(actor);
        this._foodWindow.select(0);
        this._foodWindow.activate();
    };

    Scene_SIMeal.prototype.onFoodOk = function() {
        var actor = this._foodWindow._actor, item = this._foodWindow.item();
        if (item) this._plan[actor.actorId()] = item; else delete this._plan[actor.actorId()];
        this.onFoodCancel();
    };

    Scene_SIMeal.prototype.onFoodCancel = function() {
        this._foodWindow.deselect();
        this._foodWindow.setActor(null);
        this._memberWindow.refresh();
        this._memberWindow.activate();
    };
})(SmokingIsle.Idols);
