//=============================================================================
// SI_Outfits.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: armor sets with bonuses, and charm effects
 * (caves, first hits, ranged, criticals, crumbling wards, whispers...).
 * @author Smoking Isle
 *
 * @param Set Evasion Cap
 * @desc Most evasion all set bonuses together can give (0.15 = 15%).
 * @default 0.15
 *
 * @help
 * Place last, after every other SI_ plugin (including SI_Layout).
 *
 * ============================================================================
 * Armor sets
 * ============================================================================
 * Armor note:   <Set: Tapa>
 *
 * A set's bonuses are states in the database (the "Set Bonuses" category).
 * They are never really inflicted: while enough pieces are worn, the state
 * simply counts as one of the actor's states (traits and note tags work; it
 * has no icon). State note:
 *   <Set Bonus: Tapa 2>     active with 2 or more Tapa pieces worn
 *   <Set Bonus: Tapa all>   active with every Tapa piece worn
 *   <Set Text: +5% evasion> shown in the equip screen's help box
 * Evasion from all set bonuses together is capped (Set Evasion Cap).
 *
 * ============================================================================
 * Charm and set tags (armor or set-bonus state)
 * ============================================================================
 *   <Cave Hit: 10>           +10% hit in caves (map note <Cave>)
 *   <Cave Evasion: 10>       +10% evasion in caves
 *   <Evasion While: Wet 10>  +10% evasion while the named state is on
 *   <Evasion Vs Flying: 15>  +15% evasion against <Flying> attackers
 *   <First Hit Evasion: 25>  +25% evasion against the first attack on the
 *                            wearer each battle
 *   <First Hit Guard: 50>    the first physical hit on the wearer each battle
 *                            deals 50% less
 *   <Ranged Boost: 10>       ranged skills deal 10% more
 *   <Crit Vs Wounded: 15>    +15% critical against targets below half HP
 *   <Battle Start Enemy State: Disoriented>
 *                            every enemy gets that state when battle starts
 *                            (resistances apply)
 *   <Battle Start Charge: 1> restores 1 Voltaic charge when battle starts
 *   <Crumbling Mental Ward>  blocks one mental ailment, then the item is gone
 *   <Whisper: Despair 10>    10% chance at the end of each turn to get that
 *                            state
 *   <Escape Bonus: 20>       escaping is 20 points likelier (whole party)
 *
 * Item tags:
 *   <Only Vs: sea>           only hits enemies of that kind (Talk Type/Tags)
 *   <Lure: animal 15>        raises an enemy of that kind's mood by 15
 *   <Needs Escape>           can only be used where escaping is allowed
 *
 * Elsewhere: <Talk Start Mood>, <Talk Bonus ... vs kind>, <Insight Bonus>
 * (SI_Talk), <Steal Proof> (SI_Pranks), <Extra Charge>, <Metal> (SI_Voltaic),
 * <Wear Rate>, <Wear Reduce> (SI_Gear), <Battle Start State> (SI_Ailments).
 */

var Imported = Imported || {};
Imported.SI_Outfits = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Outfits = SmokingIsle.Outfits || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_Outfits');
    $.evasionCap = Number(params['Set Evasion Cap'] || 0.15);

    //-------------------------------------------------------------------------
    // Note tags
    //-------------------------------------------------------------------------

    $.num = function(note, tag) {
        var m = new RegExp('<' + tag + ':\\s*(\\d+)>', 'i').exec(note || '');
        return m ? Number(m[1]) : 0;
    };

    $.stateByName = function(name) {
        return SmokingIsle.Ailments ? SmokingIsle.Ailments.stateByName(name) : 0;
    };

    $.parse = function(obj) {
        var note = obj.note || '';
        var t = {};
        t.caveHit = $.num(note, 'Cave Hit') / 100;
        t.caveEva = $.num(note, 'Cave Evasion') / 100;
        var w = /<Evasion While:\s*([^>]+?)\s+(\d+)>/i.exec(note);
        t.evaWhile = w ? { state: $.stateByName(w[1]), value: Number(w[2]) / 100 } : null;
        t.evaFlying = $.num(note, 'Evasion Vs Flying') / 100;
        t.firstHitEva = $.num(note, 'First Hit Evasion') / 100;
        t.firstHitGuard = $.num(note, 'First Hit Guard') / 100;
        t.rangedBoost = $.num(note, 'Ranged Boost') / 100;
        t.critWounded = $.num(note, 'Crit Vs Wounded') / 100;
        var es = /<Battle Start Enemy State:\s*([^>]+)>/i.exec(note);
        t.enemyStartState = es ? $.stateByName(es[1]) : 0;
        t.startCharge = $.num(note, 'Battle Start Charge');
        t.crumblingWard = /<Crumbling Mental Ward>/i.test(note);
        var wh = /<Whisper:\s*([^>]+?)\s+(\d+)>/i.exec(note);
        t.whisper = wh ? { state: $.stateByName(wh[1]), chance: Number(wh[2]) / 100 } : null;
        t.escape = $.num(note, 'Escape Bonus') / 100;
        var set = /<Set:\s*([^>]+)>/i.exec(note);
        t.set = set ? set[1].trim() : null;
        var bonus = /<Set Bonus:\s*(.+?)\s+(\d+|all)>/i.exec(note);
        t.setBonus = bonus ? { set: bonus[1].trim(), need: bonus[2].toLowerCase() === 'all' ? 'all' : Number(bonus[2]) } : null;
        var text = /<Set Text:\s*([^>]+)>/i.exec(note);
        t.setText = text ? text[1].trim() : '';
        obj.siOutfit = t;
    };

    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        if (!_DataManager_isDatabaseLoaded.call(this)) return false;
        if (!$._loaded) {
            [$dataWeapons, $dataArmors, $dataStates].forEach(function(list) {
                list.forEach(function(obj) { if (obj) $.parse(obj); });
            });
            $.sets = {};
            $dataArmors.forEach(function(a) {
                if (a && a.siOutfit.set) $.sets[a.siOutfit.set] = ($.sets[a.siOutfit.set] || 0) + 1;
            });
            $.bonusStates = $dataStates.filter(function(s) { return s && s.siOutfit.setBonus; });
            $._loaded = true;
        }
        return true;
    };

    $.isCave = function() {
        return !!($dataMap && /<Cave>/i.test($dataMap.note || ''));
    };

    // Sum of a parsed tag over an actor's gear and states (set bonuses included).
    $.sum = function(battler, key) {
        if (!battler || !battler.isActor()) return 0;
        return battler.traitObjects().reduce(function(sum, obj) {
            return sum + (obj && obj.siOutfit ? obj.siOutfit[key] || 0 : 0);
        }, 0);
    };

    $.objects = function(battler, key) {
        if (!battler || !battler.isActor()) return [];
        return battler.traitObjects().filter(function(obj) { return obj && obj.siOutfit && obj.siOutfit[key]; });
    };

    //-------------------------------------------------------------------------
    // Sets
    //-------------------------------------------------------------------------

    Game_Actor.prototype.setPieceCounts = function() {
        var counts = {};
        this.armors().forEach(function(a) {
            var set = a.siOutfit && a.siOutfit.set;
            if (set) counts[set] = (counts[set] || 0) + 1;
        });
        return counts;
    };

    Game_Actor.prototype.updateSetBonuses = function() {
        if (!$.bonusStates) return;
        var counts = this.setPieceCounts();
        this._siSetStates = $.bonusStates.filter(function(s) {
            var b = s.siOutfit.setBonus, have = counts[b.set] || 0;
            return have > 0 && have >= (b.need === 'all' ? $.sets[b.set] : b.need);
        }).map(function(s) { return s.id; });
    };

    Game_Actor.prototype.setBonusStates = function() {
        if (!this._siSetStates) this.updateSetBonuses();
        return (this._siSetStates || []).map(function(id) { return $dataStates[id]; });
    };

    var _Game_Actor_refresh = Game_Actor.prototype.refresh;
    Game_Actor.prototype.refresh = function() {
        this.updateSetBonuses();
        _Game_Actor_refresh.call(this);
        this.updateSetBonuses();   // gear may have been released
    };

    var _Game_Actor_states = Game_Actor.prototype.states;
    Game_Actor.prototype.states = function() {
        var states = _Game_Actor_states.call(this);
        return $.bonusStates ? states.concat(this.setBonusStates()) : states;
    };

    // Evasion: conditional bonuses, and the cap on everything sets give.
    var _Game_Actor_xparam = Game_Actor.prototype.xparam;
    Game_Actor.prototype.xparam = function(xparamId) {
        var value = _Game_Actor_xparam.call(this, xparamId);
        if (xparamId !== 1) return value;
        var cave = $.isCave();
        var fromSets = 0, extra = 0;
        this.traitObjects().forEach(function(obj) {
            var t = obj && obj.siOutfit;
            if (!t) return;
            var cond = (cave ? t.caveEva : 0) + (t.evaWhile && this.isStateAffected(t.evaWhile.state) ? t.evaWhile.value : 0);
            if (t.setBonus) {
                fromSets += cond + obj.traits.reduce(function(s, tr) {
                    return s + (tr.code === Game_BattlerBase.TRAIT_XPARAM && tr.dataId === 1 ? tr.value : 0);
                }, 0);
                extra += cond;
            } else {
                extra += cond;
            }
        }, this);
        value += extra;
        if (fromSets > $.evasionCap) value -= fromSets - $.evasionCap;
        return value;
    };

    //-------------------------------------------------------------------------
    // Hit, evasion, criticals, damage
    //-------------------------------------------------------------------------

    $.kinds = function(battler) {
        return battler.isEnemy() && battler.talkData ? battler.talkData().kinds || [] : [];
    };

    var _Game_Action_itemHit = Game_Action.prototype.itemHit;
    Game_Action.prototype.itemHit = function(target) {
        var only = this.item() && /<Only Vs:\s*([\w-]+)>/i.exec(this.item().note || '');
        if (only && $.kinds(target).indexOf(only[1].toLowerCase()) < 0) return 0;
        var hit = _Game_Action_itemHit.call(this, target);
        if ($.isCave()) hit += $.sum(this.subject(), 'caveHit');
        return hit;
    };

    var _Game_Action_itemEva = Game_Action.prototype.itemEva;
    Game_Action.prototype.itemEva = function(target) {
        var eva = _Game_Action_itemEva.call(this, target);
        if (!target.isActor() || !this.subject().isEnemy()) return eva;
        if (SmokingIsle.Ranged && SmokingIsle.Ranged.isFlying(this.subject())) eva += $.sum(target, 'evaFlying');
        if (!target._siFirstHitDone) eva += $.sum(target, 'firstHitEva');
        return eva;
    };

    var _Game_Action_itemCri = Game_Action.prototype.itemCri;
    Game_Action.prototype.itemCri = function(target) {
        var cri = _Game_Action_itemCri.call(this, target);
        if (target.hpRate() < 0.5) cri += $.sum(this.subject(), 'critWounded');
        return cri;
    };

    var _Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;
    Game_Action.prototype.makeDamageValue = function(target, critical) {
        var value = _Game_Action_makeDamageValue.call(this, target, critical);
        var item = this.item();
        if (value > 0 && item && item.siRanged) value = Math.round(value * (1 + $.sum(this.subject(), 'rangedBoost')));
        if (value > 0 && target.isActor() && this.isPhysical() && !target._siFirstPhysicalDone) {
            var guard = Math.min($.sum(target, 'firstHitGuard'), 1);
            if (guard > 0) value = Math.round(value * (1 - guard));
        }
        return value;
    };

    var _Game_Action_testApply = Game_Action.prototype.testApply;
    Game_Action.prototype.testApply = function(target) {
        var item = this.item();
        if (item && /<Needs Escape>/i.test(item.note || '') && !($gameParty.inBattle() && BattleManager.canEscape())) return false;
        return _Game_Action_testApply.call(this, target);
    };

    var _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _Game_Action_apply.call(this, target);
        var lure = this.item() && /<Lure:\s*([\w-]+)\s+(\d+)>/i.exec(this.item().note || '');
        if (lure && target.isEnemy() && target.result().isHit() && $.kinds(target).indexOf(lure[1].toLowerCase()) >= 0) {
            target._siMood = (target.talkMood() + Number(lure[2])).clamp(0, 100);
            target.result().success = true;
        }
        if (target.isActor() && this.subject().isEnemy() && $gameParty.inBattle()) {
            target._siFirstHitDone = true;
            if (this.isPhysical() && target.result().isHit()) target._siFirstPhysicalDone = true;
        }
    };

    //-------------------------------------------------------------------------
    // Battle start, turn end, escaping
    //-------------------------------------------------------------------------

    var _Game_Battler_onBattleStart = Game_Battler.prototype.onBattleStart;
    Game_Battler.prototype.onBattleStart = function() {
        _Game_Battler_onBattleStart.call(this);
        this._siFirstHitDone = false;
        this._siFirstPhysicalDone = false;
        if (this.isActor() && this.gainCharge && this.pile && this.pile()) {
            var charge = $.sum(this, 'startCharge');
            if (charge > 0) this.gainCharge(charge);
        }
    };

    var _BattleManager_startBattle = BattleManager.startBattle;
    BattleManager.startBattle = function() {
        _BattleManager_startBattle.call(this);
        $gameParty.battleMembers().forEach(function(actor) {
            $.objects(actor, 'enemyStartState').forEach(function(obj) {
                var stateId = obj.siOutfit.enemyStartState;
                $gameTroop.aliveMembers().forEach(function(enemy) {
                    if (Math.random() < enemy.stateRate(stateId)) enemy.addState(stateId);
                    enemy.clearResult();
                });
                $gameMessage.add('%1\'s %2 rings out!'.format(actor.name(), obj.name));
            });
        });
    };

    var _Game_Battler_onTurnEnd = Game_Battler.prototype.onTurnEnd;
    Game_Battler.prototype.onTurnEnd = function() {
        _Game_Battler_onTurnEnd.call(this);
        if (!this.isActor() || !this.isAlive() || !$gameParty.inBattle()) return;
        $.objects(this, 'whisper').forEach(function(obj) {
            var w = obj.siOutfit.whisper;
            if (w.state && Math.random() < w.chance) this.addState(w.state);
        }, this);
    };

    var _BattleManager_makeEscapeRatio = BattleManager.makeEscapeRatio;
    BattleManager.makeEscapeRatio = function() {
        _BattleManager_makeEscapeRatio.call(this);
        this._escapeRatio += $gameParty.battleMembers().reduce(function(sum, a) { return sum + $.sum(a, 'escape'); }, 0);
    };

    // A prayer strip takes one mental ailment for its wearer, then crumbles.
    var _Game_Battler_addState = Game_Battler.prototype.addState;
    Game_Battler.prototype.addState = function(stateId) {
        var A = SmokingIsle.Ailments;
        if (this.isActor() && A && A.isMental(stateId) && this.isStateAddable(stateId) && !this.isStateAffected(stateId)) {
            var slotId = this.equips().findIndex(function(e) { return e && e.siOutfit && e.siOutfit.crumblingWard; });
            if (slotId >= 0) {
                var item = this.equips()[slotId];
                this._equips[slotId].setObject(null);
                this.refresh();
                this._siWearMessages = (this._siWearMessages || []).concat(
                    ['%1\'s %2 crumbles away, warding off %3!'.format(this.name(), item.name, $dataStates[stateId].name)]);
                return;
            }
        }
        _Game_Battler_addState.call(this, stateId);
    };

    //-------------------------------------------------------------------------
    // Equip screen: set progress in the help box
    //-------------------------------------------------------------------------

    $.setLine = function(actor, item) {
        var set = item && DataManager.isArmor(item) && item.siOutfit ? item.siOutfit.set : null;
        if (!set || !actor) return '';
        var have = actor.setPieceCounts()[set] || 0, total = $.sets[set];
        var parts = $.bonusStates.filter(function(s) { return s.siOutfit.setBonus.set === set; }).map(function(s) {
            var need = s.siOutfit.setBonus.need === 'all' ? total : s.siOutfit.setBonus.need;
            return (have >= need ? '✓' : '') + need + ': ' + s.siOutfit.setText;
        });
        return set + ' set ' + have + '/' + total + ' — ' + parts.join(' · ');
    };

    var _Window_Help_setItem = Window_Help.prototype.setItem;
    Window_Help.prototype.setItem = function(item) {
        var scene = SceneManager._scene;
        var actor = scene instanceof Scene_Equip && scene.actor ? scene.actor() : null;
        var line = $.setLine(actor, item);
        if (line) {
            var proxy = Object.create(item);
            proxy.description = item.description + ' ' + line;
            _Window_Help_setItem.call(this, proxy);
        } else {
            _Window_Help_setItem.call(this, item);
        }
    };

})(SmokingIsle.Outfits);
