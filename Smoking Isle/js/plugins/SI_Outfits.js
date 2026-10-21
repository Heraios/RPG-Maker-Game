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
 *               <Set: Goat-Skin>  <Set: Mouflon Wool>   (one piece, two sets)
 *               <Set: First Sailor Regalia (eye)>       (a named part)
 *
 * A set is made of parts. A piece's part is its equipment type unless it
 * names one, so pieces for the same slot are substitutes (Tapa Wrap or the
 * Ochre-Stamped Wrap), and three charms of one set still count as one part
 * unless they name different parts (the Coral Eye and Scoria Pupil).
 *
 * A set's bonuses are states in the database (the "Set Bonuses" category).
 * They are never really inflicted: while enough pieces are worn, the state
 * simply counts as one of the actor's states (traits and note tags work; it
 * has no icon). State note:
 *   <Set Bonus: Tapa 2>     active with 2 or more Tapa parts worn
 *   <Set Bonus: Tapa all>   active with every Tapa part worn
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
 *   <Party Param: agi 5>     everyone in the battle party gets +5% AGI
 *                            (hp, mp, atk, def, mat, mdf, agi, luk)
 *   <Spikes: 30>             an enemy that lands a physical hit on the wearer
 *                            takes 30% of that damage back (Spiked Collar)
 *   <Guard Vs: spirit 30>    30% less damage from enemies of that kind
 *   <Damage Vs: spirit 30, demon 30>
 *                            the wearer's attacks deal 30% more to enemies of
 *                            those kinds (silver ritual weapons)
 *   <Drag Back>              once a battle, the first fallen ally is pulled
 *                            back up at 1 HP (Patience's Medicine Pack)
 *   <Quiets Whisper: Coral Eye Fragment, Grown-Coral Helm>
 *                            worn together, those items' whispers stay silent
 *   <Call Protector>         the first enemy attack on the wearer each battle
 *                            is taken by the toughest adult in the party
 *                            (Gourd Whistle)
 *   <Ailment Ward>           the first ailment (Elemental, Ailment or Mental
 *                            state) each battle is shrugged off
 *                            (Grandmother's Knot-Cord)
 *
 * A set's "all" bonus needs one piece in every slot the set covers, so a set
 * can have two pieces for the same slot (Tapa Wrap, Ochre-Stamped Wrap).
 *
 * Item tags:
 *   <Only Vs: sea>           only hits enemies of that kind (Talk Type/Tags)
 *   <Lure: animal 15>        raises an enemy of that kind's mood by 15
 *                            (several tags for several kinds)
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
        t.spikes = $.num(note, 'Spikes') / 100;
        var gv = /<Guard Vs:\s*([\w-]+)\s+(\d+)>/i.exec(note);
        t.guardVs = gv ? { kind: gv[1].toLowerCase(), rate: Number(gv[2]) / 100 } : null;
        t.dragBack = /<Drag Back>/i.test(note);
        var q = /<Quiets Whisper:\s*([^>]+)>/i.exec(note);
        t.quiets = q ? q[1].split(',').map(function(n) { return n.trim(); }) : null;
        t.callProtector = /<Call Protector>/i.test(note);
        t.ailmentWard = /<Ailment Ward>/i.test(note);
        var setRe = /<Set:\s*([^>(]+?)\s*(?:\(([^)]+)\))?\s*>/gi, sm;
        t.sets = [];
        while ((sm = setRe.exec(note))) t.sets.push({ name: sm[1].trim(), part: sm[2] ? sm[2].trim().toLowerCase() : 'slot ' + obj.etypeId });
        t.set = t.sets.length ? t.sets[0].name : null;
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
            // A set's size is the number of parts its pieces cover.
            var parts = {};
            $dataArmors.forEach(function(a) {
                if (a) a.siOutfit.sets.forEach(function(s) { (parts[s.name] = parts[s.name] || {})[s.part] = true; });
            });
            $.sets = {};
            Object.keys(parts).forEach(function(set) { $.sets[set] = Object.keys(parts[set]).length; });
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

    // <Party Param: agi 5>: worn or set-bonus states that lift the whole party.
    $.PARAMS = ['hp', 'mp', 'atk', 'def', 'mat', 'mdf', 'agi', 'luk'];
    var _Game_Actor_paramRate = Game_Actor.prototype.paramRate;
    Game_Actor.prototype.paramRate = function(paramId) {
        var rate = _Game_Actor_paramRate.call(this, paramId);
        if (!$gameParty.inBattle() || $._partyParamBusy) return rate;
        $._partyParamBusy = true;   // reading the party can create actors, whose stats come back here
        try {
            var bonus = $gameParty.battleMembers().reduce(function(sum, member) {
                return sum + member.equips().concat(member.states()).reduce(function(s, o) {
                    var re = /<Party Param:\s*(\w+)\s+(\d+)>/gi, m;
                    while (o && (m = re.exec(o.note || ''))) if ($.PARAMS.indexOf(m[1].toLowerCase()) === paramId) s += Number(m[2]);
                    return s;
                }, 0);
            }, 0);
        } finally {
            $._partyParamBusy = false;
        }
        return rate * (1 + bonus / 100);
    };

    //-------------------------------------------------------------------------
    // Sets
    //-------------------------------------------------------------------------

    // Parts worn per set (substitutes for the same part count once).
    Game_Actor.prototype.setPieceCounts = function() {
        var worn = {};
        this.armors().forEach(function(a) {
            (a.siOutfit ? a.siOutfit.sets : []).forEach(function(s) { (worn[s.name] = worn[s.name] || {})[s.part] = true; });
        });
        var counts = {};
        Object.keys(worn).forEach(function(set) { counts[set] = Object.keys(worn[set]).length; });
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
        if (value > 0 && target.isActor() && this.subject().isEnemy()) {
            var kinds = $.kinds(this.subject());
            var cut = $.objects(target, 'guardVs').reduce(function(sum, obj) {
                var g = obj.siOutfit.guardVs;
                return kinds.indexOf(g.kind) >= 0 ? sum + g.rate : sum;
            }, 0);
            if (cut > 0) value = Math.round(value * (1 - Math.min(cut, 1)));
        }
        return value;
    };

    // <Spikes>: biting the wearer hurts.
    var _Game_Action_executeHpDamage = Game_Action.prototype.executeHpDamage;
    Game_Action.prototype.executeHpDamage = function(target, value) {
        _Game_Action_executeHpDamage.call(this, target, value);
        var subject = this.subject();
        var spikes = $.sum(target, 'spikes');
        if (spikes > 0 && value > 0 && this.isPhysical() && subject.isEnemy() && subject.isAlive()) {
            var back = Math.max(Math.round(value * spikes), 1);
            subject.gainHp(-back);
            if (subject.isDead()) subject.performCollapse();
            target._siCommandMessages = (target._siCommandMessages || []).concat(['%1 is hurt by the spikes! (%2)'.format(subject.name(), back)]);
        }
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
        var re = /<Lure:\s*([\w-]+)\s+(\d+)>/gi, lure, note = this.item() ? this.item().note || '' : '';
        while ((lure = re.exec(note))) {
            if (target.isEnemy() && target.result().isHit() && $.kinds(target).indexOf(lure[1].toLowerCase()) >= 0) {
                target._siMood = (target.talkMood() + Number(lure[2])).clamp(0, 100);
                target.result().success = true;
            }
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
        this._siDragBackUsed = false;
        this._siCalledProtector = false;
        this._siAilmentWarded = false;
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
        var quiet = [].concat.apply([], $.objects(this, 'quiets').map(function(obj) { return obj.siOutfit.quiets; }));
        $.objects(this, 'whisper').forEach(function(obj) {
            if (quiet.indexOf(obj.name) >= 0) return;
            var w = obj.siOutfit.whisper;
            if (w.state && Math.random() < w.chance) this.addState(w.state);
        }, this);
    };

    // <Damage Vs: spirit 30>: more damage to enemies of those kinds.
    var _Game_Action_makeDamageValue_vs = Game_Action.prototype.makeDamageValue;
    Game_Action.prototype.makeDamageValue = function(target, critical) {
        var value = _Game_Action_makeDamageValue_vs.call(this, target, critical);
        var subject = this.subject();
        if (subject.isActor() && target.isEnemy() && target.talkData && value > 0) {
            var kinds = target.talkData().kinds || [], bonus = 0;
            subject.equips().forEach(function(e) {
                var m = e && /<Damage Vs:\s*([^>]+)>/i.exec(e.note || '');
                if (m) m[1].split(',').forEach(function(part) {
                    var p = /([\w-]+)\s+(\d+)/.exec(part);
                    if (p && kinds.indexOf(p[1].toLowerCase()) >= 0) bonus = Math.max(bonus, Number(p[2]));
                });
            });
            if (bonus) value = Math.round(value * (1 + bonus / 100));
        }
        return value;
    };

    // <Drag Back>: after an action, the wearer pulls the first fallen ally back up (once a battle).
    var _BattleManager_endAction = BattleManager.endAction;
    BattleManager.endAction = function() {
        var members = $gameParty.battleMembers();
        members.forEach(function(rescuer) {
            if (rescuer.isDead() || rescuer._siDragBackUsed || $.objects(rescuer, 'dragBack').length === 0) return;
            var fallen = members.filter(function(m) { return m !== rescuer && m.isDead(); })[0];
            if (!fallen) return;
            rescuer._siDragBackUsed = true;
            fallen.removeState(fallen.deathStateId());
            fallen.setHp(1);
            this._logWindow.push('addText', '%1 drags %2 back to their feet!'.format(rescuer.name(), fallen.name()));
            this._logWindow.push('wait');
        }, this);
        _BattleManager_endAction.call(this);
    };

    var _BattleManager_makeEscapeRatio = BattleManager.makeEscapeRatio;
    BattleManager.makeEscapeRatio = function() {
        _BattleManager_makeEscapeRatio.call(this);
        this._escapeRatio += $gameParty.battleMembers().reduce(function(sum, a) { return sum + $.sum(a, 'escape'); }, 0);
    };

    // <Call Protector>: the first enemy attack on the wearer each battle goes
    // to the toughest adult in the party instead.
    var _BattleManager_applySubstitute = BattleManager.applySubstitute;
    BattleManager.applySubstitute = function(target) {
        var action = this._action;
        if (target.isActor() && !target._siCalledProtector && $.objects(target, 'callProtector').length > 0 &&
                action && action.subject().isEnemy() && action.isForOne() && action.isDamage()) {
            var adults = $gameParty.battleMembers().filter(function(a) {
                return a !== target && a.isAlive() && a.canMove() && a.isChild && !a.isChild() && !(a.isPseudoMember && a.isPseudoMember());
            }).sort(function(a, b) { return b.hp - a.hp; });
            target._siCalledProtector = true;
            if (adults.length) {
                this._logWindow.displaySubstitute(adults[0], target);
                return adults[0];
            }
        }
        return _BattleManager_applySubstitute.call(this, target);
    };

    // Elemental (71-110), Ailment (111-150) and Mental (151-190) states.
    $.isAilment = function(stateId) {
        return stateId >= 71 && stateId <= 190 && !!$dataStates[stateId] && !!$dataStates[stateId].name;
    };

    // A prayer strip takes one mental ailment for its wearer, then crumbles.
    // A knot-cord shrugs off the first ailment each battle.
    var _Game_Battler_addState = Game_Battler.prototype.addState;
    Game_Battler.prototype.addState = function(stateId) {
        var A = SmokingIsle.Ailments;
        if (this.isActor() && $gameParty.inBattle() && !this._siAilmentWarded && $.isAilment(stateId) &&
                this.isStateAddable(stateId) && !this.isStateAffected(stateId)) {
            var ward = $.objects(this, 'ailmentWard')[0];
            if (ward) {
                this._siAilmentWarded = true;
                this._siWearMessages = (this._siWearMessages || []).concat(
                    ['%1\'s %2 wards off %3!'.format(this.name(), ward.name, $dataStates[stateId].name)]);
                return;
            }
        }
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
        var sets = item && DataManager.isArmor(item) && item.siOutfit ? item.siOutfit.sets : [];
        if (!sets.length || !actor) return '';
        var counts = actor.setPieceCounts();
        return sets.map(function(entry) {
            var set = entry.name, have = counts[set] || 0, total = $.sets[set];
            var parts = $.bonusStates.filter(function(s) { return s.siOutfit.setBonus.set === set; }).map(function(s) {
                var need = s.siOutfit.setBonus.need === 'all' ? total : s.siOutfit.setBonus.need;
                return (have >= need ? '✓' : '') + need + ': ' + s.siOutfit.setText;
            });
            return set + ' set ' + have + '/' + total + ' — ' + parts.join(' · ');
        }).join('  |  ');
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
