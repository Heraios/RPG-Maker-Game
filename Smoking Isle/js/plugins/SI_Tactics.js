//=============================================================================
// SI_Tactics.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: enemy tactics. Enemies score every move against
 * every target (damage, states, the elemental cycle, heals, buffs, combos)
 * and choose by tier, instead of rolling dice.
 * @author Smoking Isle
 *
 * @param Ghost Actor
 * @desc The Ghost's actor id (animals can't single it out).
 * @default 1
 *
 * @param Yoon Actors
 * @desc Actors whose Insight decides what plans Yoon can read.
 * @default 1, 2
 *
 * @param Telegraph Insight
 * @desc Yoon's Insight needed to read a tier 1, 2 and 3 enemy's plan.
 * @default 5, 10, 15
 *
 * @param Default Intent
 * @desc Plan line when a skill has no <Intent>. %1 enemy, %2 target.
 * @default %1 is watching %2.
 *
 * @help
 * Place after SI_BattleTraits (and SI_Talk, SI_ElementalStates, SI_Time).
 * Design: docs/concept.md, "Enemy tactics". Creature plans: docs/bestiary.md.
 *
 * ============================================================================
 * How an enemy chooses
 * ============================================================================
 * 1. The usual rules decide which moves are allowed (conditions, MP, Calm,
 *    sparing children, Call for Help, <Not While>...).
 * 2. Every allowed move is scored against every target it could take:
 *      rating x 4                      the database rating, as a base
 *    + damage                          the real damage formula, as a share of
 *                                      the target's Health (x its hit chance);
 *                                      + a bonus if it would knock them out
 *    + states                          worth more where they matter; nothing
 *                                      (a penalty) if already there or resisted
 *    + elements                        <Source> against the cycle: clearing a
 *                                      tier-2 state (an extra turn) scores high
 *    + heals, buffs, cures             only what they'd actually do
 *    + situation                       combos, preferences, grudges (below)
 * 3. It picks by tier: 0 today's dice (minus wasted moves), 1 from its best
 *    half, 2 usually the best, 3 almost always the best.
 *
 * Default tier: bosses (the strongest enemy in a troop named "Boss: ...") 3;
 * Talk type spirit or sapient 2; animals and everything else 1.
 *
 * ============================================================================
 * Enemy notes
 * ============================================================================
 *   <Tactics: 2>                 its tier (0-3)
 *   <Tactics Style: cunning>     aggressive (damage), cautious (heals, guards),
 *                                cunning (states, elements, combos), support
 *                                (allies first)
 *   <Grudge>                     prefers whoever hurt it most
 *   <Flock>                      prefers whoever hurt any of its troop
 *   <Pack>                       prefers whoever its allies just hit
 *   <Sticky>                     keeps on whoever it hit last (a leech)
 *   <Reluctant>                  hates hurting children: their damage counts
 *                                for little until it's below half Health
 *   <Patient: 50%>               circles (its <Circle> skill, else Wait) until
 *                                someone is at or below 50% Health or Bleeding
 *   <Prefers: Wet, child>        favours targets with those states (or the
 *                                words ghost / child)
 *   <Follow Up: Wet +40>         cashes in on targets with that state (more
 *                                if an ally set it up). Several: comma
 *   <Flees When: alone, 30%>     escapes when any is true: alone (last one
 *                                standing), 30% (Health), half (half its troop
 *                                gone). Join with & for "both": alone & 50%
 *   <Ignores: ghost>             won't single out the Ghost
 *   <Sees: ghost>                can (overrides the default)
 * Who sees the Ghost by default: spirits, and anyone with priest or fae in
 * its <Talk Tags>. Animals and ordinary people don't. Party-wide moves still
 * hit everyone.
 *
 * ============================================================================
 * Skill notes
 * ============================================================================
 *   <Intent: %1 eyes %2's wet clothes.>   its plan line (see Telegraphing)
 *   <Needs: day, outdoors>      usable only by day / outdoors (Bask)
 *   <Circle>                    the move a <Patient> enemy waits with
 *   <Steal Food>                on a hit, takes one <Meal> item from the bag
 *
 * ============================================================================
 * Troop combos
 * ============================================================================
 * Troops have no Note box: write these in a Comment on the troop's first
 * event page. Names are enemy names from the database.
 *   <Combo: Seafarer Priest buffs Seafarer Axeman>
 *        the Priest's buffs and heals favour the Axeman; a buffed Axeman
 *        favours its heaviest blows.
 *   <Combo: Marsh Frog sets Wet, Heron follows>
 *        the Frog favours wetting people; the Heron cashes in on Wet targets.
 *
 * ============================================================================
 * Telegraphing
 * ============================================================================
 * When an enemy commits to a setup or a combo (or a skill with <Intent>), its
 * plan shows before it acts, if Yoon's Insight is high enough for its tier.
 */

var Imported = Imported || {};
Imported.SI_Tactics = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Tactics = SmokingIsle.Tactics || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_Tactics');
    var list = function(s) { return String(s || '').split(',').map(function(x) { return Number(x.trim()); }).filter(function(n) { return !isNaN(n) && n > 0; }); };
    $.ghostActorId = Number(params['Ghost Actor'] || 1);
    $.yoonActors = list(params['Yoon Actors'] || '1, 2');
    $.telegraphInsight = list(params['Telegraph Insight'] || '5, 10, 15');
    $.defaultIntent = String(params['Default Intent'] || '%1 is watching %2.');
    $.enabled = true;

    // Scoring weights (placeholders, tuned with the balance sims).
    $.W = { rating: 4, damage: 1, ko: 30, waste: 12, state: 20, stateBonus: 10, extraTurn: 60, upgrade: 25,
            inflict: 6, buff: 15, cure: 20, followUpAlly: 15, prefers: 30, grudge: 25, pack: 20, sticky: 40,
            setup: 20, comboBuff: 30, comboDamage: 1.3 };

    //-------------------------------------------------------------------------
    // Notes
    //-------------------------------------------------------------------------

    $.note = function(enemy, re) { return re.exec(enemy.enemy().note || ''); };
    $.has = function(enemy, tag) { return new RegExp('<' + tag + '>', 'i').test(enemy.enemy().note || ''); };
    $.stateId = function(name) {
        if (SmokingIsle.Ailments && SmokingIsle.Ailments.stateByName) { var id = SmokingIsle.Ailments.stateByName(name); if (id) return id; }
        var s = $dataStates.find(function(x) { return x && x.name.toLowerCase() === String(name).toLowerCase(); });
        return s ? s.id : 0;
    };
    $.names = function(text) { return String(text || '').split(',').map(function(s) { return s.trim(); }).filter(Boolean); };

    $.isBoss = function(enemy) {
        var troop = $dataTroops[$gameTroop._troopId];
        if (!troop || !/^Boss:/i.test(troop.name)) return false;
        return $gameTroop.members().every(function(m) { return m.mhp <= enemy.mhp; });
    };

    $.tier = function(enemy) {
        var m = $.note(enemy, /<Tactics:\s*(\d)>/i);
        if (m) return Number(m[1]);
        if ($.isBoss(enemy)) return 3;
        var type = enemy.talkData ? enemy.talkData().type : null;
        return type === 'spirit' || type === 'sapient' ? 2 : 1;
    };

    $.style = function(enemy) {
        var m = $.note(enemy, /<Tactics Style:\s*(\w+)>/i);
        return m ? m[1].toLowerCase() : '';
    };

    $.isGhost = function(b) { return !!b && b.isActor() && b.actorId() === $.ghostActorId; };

    $.seesGhost = function(enemy) {
        if ($.has(enemy, 'Ignores: ghost')) return false;
        if ($.has(enemy, 'Sees: ghost')) return true;
        var data = enemy.talkData ? enemy.talkData() : { type: null, kinds: [] };
        if (data.type === 'spirit') return true;
        return (data.kinds || []).some(function(k) { return k === 'priest' || k === 'fae'; });
    };

    $.yoonInsight = function() {
        return $.yoonActors.reduce(function(m, id) { var a = $gameActors.actor(id); return a ? Math.max(m, a.level) : m; }, 0);
    };

    //-------------------------------------------------------------------------
    // Who an enemy may single out
    //-------------------------------------------------------------------------

    var BT = function() { return SmokingIsle.BattleTraits || {}; };

    $.opponentPool = function(enemy, skill) {
        var pool = enemy.opponentsUnit().aliveMembers();
        var harmful = BT().isHarmful ? BT().isHarmful(skill) : true;
        if (harmful && enemy.sparesChildren && enemy.sparesChildren() && BT().spareablePool) pool = BT().spareablePool(enemy.opponentsUnit());
        if (!$.seesGhost(enemy)) {
            var seen = pool.filter(function(b) { return !$.isGhost(b); });
            if (seen.length) pool = seen;
        }
        return pool;
    };

    //-------------------------------------------------------------------------
    // What a move would do (an estimate: no randomness used, no side effects)
    //-------------------------------------------------------------------------

    $.estimate = function(action, target) {
        var rnd = Math.random, ward = target._siWardBroken, value = 0;
        Math.random = function() { return 0.5; };
        try {
            value = action.makeDamageValue(target, false);
            var hit = action.itemHit(target) * (1 - action.itemEva(target));
            value = value > 0 ? value * hit : value;
        } catch (e) { value = 0; }
        Math.random = rnd; target._siWardBroken = ward;
        return value;
    };

    $.avg = function(list, f) { return list.length ? list.reduce(function(s, b) { return s + f(b); }, 0) / list.length : 0; };

    // How much a state is worth on a target (party side, from an enemy).
    $.stateWorth = function(state, target, opponents) {
        if (!state) return 0;
        var w = $.W.state, name = state.name;
        var slows = ['Entangled', 'Held', 'Chilled', 'Mired', 'Burdened', 'Stunned', 'Sleep', 'Hypnotized', 'Dragged Below'];
        var blinds = ['Dazzled', 'Disoriented', 'Grounded', 'Steam', 'Feverish'];
        var minds = ['Despair', 'Panicked', 'Enraged', 'Confused'];
        var sealsMagic = state.traits.some(function(t) { return t.code === 41 || t.code === 42; });
        if (slows.indexOf(name) >= 0 && target.agi >= $.avg(opponents, function(b) { return b.agi; })) w += $.W.stateBonus;
        if (blinds.indexOf(name) >= 0 && target.atk >= $.avg(opponents, function(b) { return b.atk; })) w += $.W.stateBonus;
        if ((minds.indexOf(name) >= 0 || sealsMagic) && target.mat > target.atk) w += $.W.stateBonus;
        return w;
    };

    $.elementValue = function(item, target) {
        var ES = SmokingIsle.ElementalStates, el = item && item.siElemental;
        if (!ES || !ES.RULES || !el || !ES.RULES[el]) return { value: 0, setup: false };
        var rule = ES.RULES[el], S = ES.S, UP = ES.UPGRADE || {};
        var has = function(n) { return !!S[n] && target.isStateAffected(S[n]); };
        if (has(UP[rule.remove])) return { value: $.W.extraTurn, setup: true };
        var v = 0, setup = false;
        if (has(rule.remove)) v += 10;
        if (has(rule.upgrade)) { v += $.W.upgrade; setup = true; }
        if (!has(rule.inflict) && !has(UP[rule.inflict])) v += $.W.inflict;
        return { value: v, setup: setup };
    };

    //-------------------------------------------------------------------------
    // Situation: preferences, grudges, combos
    //-------------------------------------------------------------------------

    $.troopCombos = function() {
        var troop = $dataTroops[$gameTroop._troopId];
        if (!troop) return [];
        if (troop._siCombos) return troop._siCombos;
        var text = (troop.pages[0] ? troop.pages[0].list : []).filter(function(c) { return c.code === 108 || c.code === 408; })
            .map(function(c) { return c.parameters[0]; }).join('\n');
        var combos = [], re = /<Combo:\s*([^>]+)>/gi, m;
        while ((m = re.exec(text))) {
            var body = m[1].trim(), b;
            if ((b = /^(.+?)\s+buffs\s+(.+)$/i.exec(body))) combos.push({ type: 'buff', a: b[1].trim(), b: b[2].trim() });
            else if ((b = /^(.+?)\s+sets\s+([^,]+),\s*(.+?)\s+follows$/i.exec(body))) combos.push({ type: 'state', a: b[1].trim(), state: b[2].trim(), b: b[3].trim() });
        }
        troop._siCombos = combos;
        return combos;
    };

    $.followUps = function(enemy) {
        var out = [], re = /<Follow Up:\s*([^>]+)>/gi, m, note = enemy.enemy().note || '';
        while ((m = re.exec(note))) {
            m[1].split(',').forEach(function(part) {
                var p = /^\s*(.+?)\s*\+?\s*(\d+)\s*$/.exec(part);
                if (p) out.push({ state: $.stateId(p[1]), bonus: Number(p[2]) });
            });
        }
        $.troopCombos().forEach(function(c) {
            if (c.type === 'state' && c.b === enemy.enemy().name) out.push({ state: $.stateId(c.state), bonus: 40 });
        });
        return out.filter(function(f) { return f.state; });
    };

    $.preferTokens = function(enemy) {
        var m = $.note(enemy, /<Prefers:\s*([^>]+)>/i);
        return m ? $.names(m[1]) : [];
    };

    $.matchesToken = function(target, token) {
        var t = token.toLowerCase();
        if (t === 'ghost') return $.isGhost(target);
        if (t === 'child') return target.isActor() && target.isChild && target.isChild();
        var id = $.stateId(token);
        return !!id && target.isStateAffected(id);
    };

    $.recentlyMarked = function(target, stateId, enemy) {
        var mark = target._siMarks && target._siMarks[stateId];
        return !!mark && mark.by !== enemy && $gameTroop.turnCount() - mark.turn <= 1;
    };

    //-------------------------------------------------------------------------
    // Scoring
    //-------------------------------------------------------------------------

    $.isTalkSkill = function(skill) { return BT().isEnemyTalkSkill ? BT().isEnemyTalkSkill(skill) : false; };
    $.isCallForHelp = function(skill) { return BT().isCallForHelp ? BT().isCallForHelp(skill) : false; };

    // Scores one action against one target (or a whole group). Returns {score, setup}.
    $.score = function(enemy, data, targets, group) {
        var skill = $dataSkills[data.skillId], action = new Game_Action(enemy);
        action.setEnemyAction(data);
        var style = $.style(enemy), score = data.rating * $.W.rating, setup = false;
        if ($.isCallForHelp(skill)) return { score: 1e6, setup: true };
        if ($.isTalkSkill(skill)) return { score: -1e6, setup: false };
        var opponents = enemy.opponentsUnit().aliveMembers();
        var friendly = action.isForFriend();
        var combos = $.troopCombos(), myName = enemy.enemy().name;
        var buffedByComboPartner = combos.some(function(c) {
            return c.type === 'buff' && c.b === myName && (enemy._buffs || []).some(function(x) { return x > 0; });
        });
        var hurtBy = enemy._siHurtBy || {}, flockHurt = $gameTroop._siHurtBy || {};
        var maxHurt = Math.max.apply(null, [1].concat(Object.keys(hurtBy).map(function(k) { return hurtBy[k]; })));
        var maxFlock = Math.max.apply(null, [1].concat(Object.keys(flockHurt).map(function(k) { return flockHurt[k]; })));
        var follow = friendly ? [] : $.followUps(enemy), prefers = friendly ? [] : $.preferTokens(enemy);
        var total = 0;
        targets.forEach(function(target) {
            var v = 0, damage = 0, stateV = 0;
            // damage and healing
            if (skill.damage.type > 0) {
                var d = $.estimate(action, target);
                if (d > 0 && !friendly) {
                    damage = Math.min(d, target.hp) / Math.max(target.mhp, 1) * 100 * $.W.damage;
                    if (d >= target.hp) damage += $.W.ko;
                    if ($.has(enemy, 'Reluctant') && target.isActor() && target.isChild && target.isChild() && enemy.hpRate() > 0.5) damage *= 0.3;
                    if (buffedByComboPartner) damage *= $.W.comboDamage;
                } else if (d < 0 && friendly) {
                    damage = Math.min(-d, target.mhp - target.hp) / Math.max(target.mhp, 1) * 100;
                }
            }
            // effects
            skill.effects.forEach(function(e) {
                if (e.code === Game_Action.EFFECT_RECOVER_HP && friendly) {
                    v += Math.min(target.mhp * e.value1 + e.value2, target.mhp - target.hp) / Math.max(target.mhp, 1) * 100;
                } else if (e.code === Game_Action.EFFECT_ADD_STATE && e.dataId > 0) {
                    var state = $dataStates[e.dataId];
                    if (target.isStateAffected(e.dataId) || target.isStateResist(e.dataId) || target.stateRate(e.dataId) === 0) { stateV -= $.W.waste; return; }
                    if (friendly) { stateV += $.W.state * e.value1; return; }
                    stateV += e.value1 * target.stateRate(e.dataId) * $.stateWorth(state, target, opponents);
                    setup = true;
                    combos.forEach(function(c) { if (c.type === 'state' && c.a === myName && $.stateId(c.state) === e.dataId) stateV += $.W.setup; });
                } else if (e.code === Game_Action.EFFECT_REMOVE_STATE) {
                    if (target.isStateAffected(e.dataId)) v += $.W.cure;
                } else if (e.code === Game_Action.EFFECT_ADD_BUFF) {
                    v += target.isMaxBuffAffected(e.dataId) || target._buffs[e.dataId] > 0 ? -$.W.waste : $.W.buff;
                } else if (e.code === Game_Action.EFFECT_ADD_DEBUFF) {
                    v += target._buffs[e.dataId] < 0 ? -$.W.waste : $.W.buff;
                }
            });
            if (!friendly) {
                var el = $.elementValue(skill, target);
                stateV += el.value; if (el.setup) setup = true;
                // Haul In and other moves that need a state on the target
                var needs = /<Needs State:\s*([^>]+)>/i.exec(skill.note || '');
                if (needs && !$.matchesToken(target, needs[1].trim())) { damage = 0; v -= $.W.waste * 3; }
                // Follow-ups cash in with damage; they never reward re-applying the same state.
                var deals = skill.damage.type === 1 || skill.damage.type === 5;
                follow.forEach(function(f) {
                    var reapplies = skill.effects.some(function(e) { return e.code === Game_Action.EFFECT_ADD_STATE && e.dataId === f.state; });
                    if (deals && !reapplies && target.isStateAffected(f.state)) { v += f.bonus + ($.recentlyMarked(target, f.state, enemy) ? $.W.followUpAlly : 0); setup = true; }
                });
                prefers.forEach(function(tok) { if ($.matchesToken(target, tok)) v += $.W.prefers; });
                if (target.isActor()) {
                    var id = target.actorId();
                    if ($.has(enemy, 'Grudge') && hurtBy[id]) v += $.W.grudge * hurtBy[id] / maxHurt;
                    if ($.has(enemy, 'Flock') && flockHurt[id]) v += $.W.grudge * flockHurt[id] / maxFlock;
                    if ($.has(enemy, 'Pack') && $gameTroop._siLastTarget === target) v += $.W.pack;
                    if ($.has(enemy, 'Sticky') && enemy._siLastHit === target) v += $.W.sticky;
                }
                if (/<Targets Weakest>/i.test(enemy.enemy().note)) v += (1 - target.hpRate()) * 80;
                if (/<Steal>/i.test(skill.note || '') && target.isActor()) v += 15 * target.equips().filter(function(x) { return x && x.siShiny; }).length;
                if (/<Steal Food>/i.test(skill.note || '')) v += $.foodInBag().length ? 25 : -$.W.waste;
            } else {
                combos.forEach(function(c) { if (c.type === 'buff' && c.a === myName && target.enemy && target.enemy().name === c.b) v += $.W.comboBuff; });
            }
            // style
            if (style === 'aggressive') damage *= 1.3;
            if (style === 'cunning') stateV *= 1.4;
            if (style === 'cautious' && friendly) v *= 1.4;
            if (style === 'support' && friendly && target !== enemy) v *= 1.4;
            total += damage + v + stateV;
        });
        if (group && targets.length) total = action.isForRandom() ? total / targets.length * action.numTargets() : total;
        return { score: score + total, setup: setup };
    };

    // Every (action, target) option for an enemy.
    $.options = function(enemy, actionList) {
        var out = [];
        actionList.forEach(function(data) {
            var skill = $dataSkills[data.skillId];
            if (!skill) return;
            var action = new Game_Action(enemy);
            action.setEnemyAction(data);
            if (action.isForUser()) {
                var r = $.score(enemy, data, [enemy], false);
                out.push({ data: data, target: null, score: r.score, setup: r.setup });
            } else if (action.isForFriend()) {
                var friends = action.isForDeadFriend() ? enemy.friendsUnit().deadMembers() : enemy.friendsUnit().aliveMembers();
                if (action.isForOne()) friends.forEach(function(f) { var r = $.score(enemy, data, [f], false); out.push({ data: data, target: f, score: r.score, setup: r.setup }); });
                else { var g = $.score(enemy, data, friends, true); out.push({ data: data, target: null, score: g.score, setup: g.setup }); }
            } else if (action.isForOpponent()) {
                var pool = $.opponentPool(enemy, skill);
                if (action.isForOne() && !action.isForRandom()) pool.forEach(function(t) { var r = $.score(enemy, data, [t], false); out.push({ data: data, target: t, score: r.score, setup: r.setup }); });
                else { var h = $.score(enemy, data, pool, true); out.push({ data: data, target: null, score: h.score, setup: h.setup }); }
            } else {
                out.push({ data: data, target: null, score: data.rating * $.W.rating, setup: false });
            }
        });
        return out;
    };

    $.pickWeighted = function(opts, weights) {
        var sum = weights.reduce(function(s, w) { return s + w; }, 0), roll = Math.random() * sum;
        for (var i = 0; i < opts.length; i++) { roll -= weights[i]; if (roll <= 0) return opts[i]; }
        return opts[opts.length - 1];
    };

    $.choose = function(options, tier) {
        var sorted = options.slice().sort(function(a, b) { return b.score - a.score; });
        if (sorted[0].score >= 1e5) return sorted[0];
        var top;
        if (tier >= 3) { top = sorted.slice(0, 2); return $.pickWeighted(top, [17, 3].slice(0, top.length)); }
        if (tier === 2) { top = sorted.slice(0, 3).filter(function(o) { return o.score >= sorted[0].score - 40; }); return $.pickWeighted(top, [6, 3, 1].slice(0, top.length)); }
        top = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)));
        var min = top[top.length - 1].score;
        return $.pickWeighted(top, top.map(function(o) { return o.score - min + 1; }));
    };

    //-------------------------------------------------------------------------
    // Fleeing and waiting
    //-------------------------------------------------------------------------

    $.wantsToFlee = function(enemy) {
        var m = $.note(enemy, /<Flees When:\s*([^>]+)>/i);
        if (!m) return false;
        var troop = $gameTroop.members().filter(function(e) { return !(e.isHidden() && !e._siWasSeen); });
        var gone = troop.filter(function(e) { return e.isDead() || e.isHidden(); }).length;
        var test = function(tok) {
            tok = tok.trim().toLowerCase();
            if (tok === 'alone') return enemy.friendsUnit().aliveMembers().length === 1;
            if (tok === 'half') return troop.length > 1 && gone * 2 >= troop.length;
            var p = /^(\d+)%$/.exec(tok);
            return !!p && enemy.hpRate() <= Number(p[1]) / 100;
        };
        return m[1].split(',').some(function(part) { return part.split('&').every(test); });
    };

    $.patientWaits = function(enemy) {
        var m = $.note(enemy, /<Patient:\s*(\d+)%?>/i);
        if (!m) return false;
        var bleed = $.stateId('Bleed');
        return !enemy.opponentsUnit().aliveMembers().some(function(b) {
            return b.hpRate() <= Number(m[1]) / 100 || (bleed && b.isStateAffected(bleed));
        });
    };

    $.circleData = function(enemy) {
        var a = enemy.enemy().actions.find(function(x) { var s = $dataSkills[x.skillId]; return s && /<Circle>/i.test(s.note || ''); });
        return a || { skillId: 5, rating: 1, conditionType: 0, conditionParam1: 0, conditionParam2: 0 };
    };

    //-------------------------------------------------------------------------
    // Choosing actions
    //-------------------------------------------------------------------------

    var _Game_Enemy_selectAllActions = Game_Enemy.prototype.selectAllActions;
    Game_Enemy.prototype.selectAllActions = function(actionList) {
        if (!$.enabled || !$gameParty.inBattle()) return _Game_Enemy_selectAllActions.call(this, actionList);
        var tier = $.tier(this);
        for (var i = 0; i < this.numActions(); i++) {
            var act = this.action(i);
            act._siTacticTarget = null; act._siTacticPlan = null;
            if ($.wantsToFlee(this)) { act.setSkill(4); continue; }
            if ($.patientWaits(this)) { act.setEnemyAction($.circleData(this)); continue; }
            var options = $.options(this, actionList);
            if (tier === 0 || !options.length) {
                // Today's dice, minus moves that would only be wasted.
                var useful = actionList.filter(function(data) {
                    var mine = options.filter(function(o) { return o.data === data; });
                    return !mine.length || mine.some(function(o) { return o.score >= data.rating * $.W.rating; });
                });
                var ratingMax = Math.max.apply(null, (useful.length ? useful : actionList).map(function(a) { return a.rating; }));
                var pool = (useful.length ? useful : actionList).filter(function(a) { return a.rating > ratingMax - 3; });
                act.setEnemyAction(this.selectAction(pool, ratingMax - 3));
                continue;
            }
            var pick = $.choose(options, tier);
            act.setEnemyAction(pick.data);
            if (pick.target) {
                act._siTacticTarget = pick.target;
                act.setTarget(pick.target.index());
            }
            act._siTacticPlan = { target: pick.target, setup: pick.setup, tier: tier };
        }
    };

    // Honour the chosen target (within the usual rules), and keep animals off the Ghost.
    var _Game_Action_targetsForOpponents = Game_Action.prototype.targetsForOpponents;
    Game_Action.prototype.targetsForOpponents = function() {
        var subject = this.subject();
        if (!subject.isEnemy() || !$gameParty.inBattle()) return _Game_Action_targetsForOpponents.call(this);
        var chosen = this._siTacticTarget, pool = $.opponentPool(subject, this.item());
        if (chosen && this.isForOne() && !this.isForRandom() && chosen.isAlive() && pool.indexOf(chosen) >= 0) return [chosen];
        var targets = _Game_Action_targetsForOpponents.call(this);
        if (!$.seesGhost(subject) && !this.isForAll()) {
            var others = pool.filter(function(b) { return !$.isGhost(b); });
            if (others.length) targets = targets.map(function(t) { return $.isGhost(t) ? others[Math.randomInt(others.length)] : t; });
        }
        return targets;
    };

    //-------------------------------------------------------------------------
    // Memory: who hurt whom, who was just hit, which states an ally set up
    //-------------------------------------------------------------------------

    var _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        var before = target.states().map(function(s) { return s.id; });
        _Game_Action_apply.call(this, target);
        if (!$gameParty.inBattle()) return;
        var subject = this.subject(), result = target.result();
        if (subject.isActor() && target.isEnemy() && result.hpDamage > 0) {
            target._siHurtBy = target._siHurtBy || {};
            target._siHurtBy[subject.actorId()] = (target._siHurtBy[subject.actorId()] || 0) + result.hpDamage;
            $gameTroop._siHurtBy = $gameTroop._siHurtBy || {};
            $gameTroop._siHurtBy[subject.actorId()] = ($gameTroop._siHurtBy[subject.actorId()] || 0) + result.hpDamage;
        }
        if (subject.isEnemy() && target.isActor() && result.isHit()) {
            $gameTroop._siLastTarget = target;
            subject._siLastHit = target;
            target._siMarks = target._siMarks || {};
            target.states().forEach(function(s) {
                if (before.indexOf(s.id) < 0) target._siMarks[s.id] = { by: subject, turn: $gameTroop.turnCount() };
            });
            if (/<Steal Food>/i.test((this.item() && this.item().note) || '')) $.stealFood(subject, target);
        }
    };

    var _Game_Troop_setup = Game_Troop.prototype.setup;
    Game_Troop.prototype.setup = function(troopId) {
        _Game_Troop_setup.call(this, troopId);
        this._siHurtBy = {}; this._siLastTarget = null;
        this.members().forEach(function(e) { e._siWasSeen = !e.isHidden(); });
        $gameParty.members().forEach(function(a) { a._siMarks = {}; });
    };

    var _Game_Enemy_appear = Game_Enemy.prototype.appear;
    Game_Enemy.prototype.appear = function() {
        _Game_Enemy_appear.call(this);
        this._siWasSeen = true;
    };

    //-------------------------------------------------------------------------
    // Telegraphing (gated by Yoon's Insight)
    //-------------------------------------------------------------------------

    $.intentLine = function(subject, action) {
        var plan = action._siTacticPlan, item = action.item();
        if (!plan || plan.tier < 1 || !item) return null;
        var intent = /<Intent:\s*([^>]+)>/i.exec(item.note || '');
        if (!intent && !plan.setup) return null;
        var need = $.telegraphInsight[Math.min(plan.tier, $.telegraphInsight.length) - 1] || 99;
        if ($.yoonInsight() < need) return null;
        var target = plan.target ? plan.target.name() : 'you';
        return (intent ? intent[1] : $.defaultIntent).format(subject.name(), target);
    };

    var _BattleManager_startAction = BattleManager.startAction;
    BattleManager.startAction = function() {
        var subject = this._subject, action = subject && subject.currentAction();
        var line = subject && subject.isEnemy() && action ? $.intentLine(subject, action) : null;
        if (line && this._logWindow) { this._logWindow.push('addText', line); this._logWindow.push('wait'); }
        _BattleManager_startAction.call(this);
    };

    //-------------------------------------------------------------------------
    // Small mechanics from the bestiary
    //-------------------------------------------------------------------------

    // <Needs: day, outdoors> (Bask: the sun)
    $.needsMet = function(skill) {
        var m = /<Needs:\s*([^>]+)>/i.exec((skill && skill.note) || '');
        if (!m) return true;
        var T = SmokingIsle.Time;
        return $.names(m[1]).every(function(n) {
            n = n.toLowerCase();
            if (n === 'day') return !(T && T.isNight && T.isNight());
            if (n === 'outdoors') return !$dataMap || !T || !T.isOutdoors || T.isOutdoors();
            return true;
        });
    };

    var _Game_BattlerBase_meetsSkillConditions = Game_BattlerBase.prototype.meetsSkillConditions;
    Game_BattlerBase.prototype.meetsSkillConditions = function(skill) {
        return _Game_BattlerBase_meetsSkillConditions.call(this, skill) && $.needsMet(skill);
    };

    // <Steal Food>: one <Meal> item from the bag.
    $.foodInBag = function() {
        return $gameParty.items().filter(function(i) { return /<Meal>/i.test(i.note || ''); });
    };

    $.stealFood = function(thief, target) {
        var food = $.foodInBag();
        var line = food.length ? '%1 snatches the %2!' : '%1 finds no food.';
        var item = food.length ? food[Math.randomInt(food.length)] : null;
        if (item) $gameParty.loseItem(item, 1);
        target._siCommandMessages = (target._siCommandMessages || []).concat([line.format(thief.name(), item ? item.name : '')]);
    };

})(SmokingIsle.Tactics);
