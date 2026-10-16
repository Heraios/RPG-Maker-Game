//=============================================================================
// SI_Talk.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: talking to enemies (mood, approaches, outcomes, Insight EXP).
 * @author Smoking Isle
 *
 * @param Talk Skill Type
 * @type number
 * @desc Skill type id of Talk approaches (System > Skill Types).
 * @default 4
 *
 * @param Enraged State
 * @type state
 * @default 12
 *
 * @param Hunted State
 * @type state
 * @default 13
 *
 * @param Mood Insight
 * @type number
 * @desc Yoon's Insight needed to see enemy moods as words.
 * @default 2
 *
 * @param Specialty Bonus
 * @desc Extra effect (0.5 = +50%) when the speaker's specialty matches.
 * @default 0.5
 *
 * @param Insight Bonus
 * @desc Extra effect per point of the speaker's Insight (0.03 = +3%).
 * @default 0.03
 *
 * @param Wait Skill
 * @type skill
 * @desc Used by an enemy with nothing it is willing to do (e.g. Calm).
 * @default 7
 *
 * @param Patience Actor
 * @type actor
 * @desc Pseudo party member whose presence helps with animals.
 * @default 12
 *
 * @param Patience Bonus
 * @default 0.25
 *
 * @param Hit Mood Change
 * @desc Mood change when the party hits an enemy (any HP damage).
 * Override per enemy with <Talk Hit: -20>.
 * @default -10
 *
 * @param Approach Insight
 * @type number
 * @desc Yoon's Insight needed to see which approaches an enemy responds to
 * (and which offend it) when choosing a Talk target.
 * @default 4
 *
 * @param Tell Insight
 * @type number
 * @desc Default Insight needed to notice an enemy's tells.
 * @default 3
 *
 * @param Question Chance
 * @desc % chance an enemy with unasked questions asks one after it is
 * talked to (each question at most once per battle).
 * @default 40
 *
 * @param Repeat EXP Rate
 * @desc Share of EXP for succeeding again with an enemy type (0.2 = 20%).
 * @default 0.2
 *
 * @param Party EXP Rate
 * @desc Share of EXP for other active party members.
 * @default 0.5
 *
 * @param Reserve EXP Rate
 * @desc Share of EXP for reserve party members.
 * @default 0.25
 *
 * @help
 * Requires SI_CombatCore, SI_TurnOrder and SI_BattleMenu (place below them).
 *
 * ============================================================================
 * Approaches (skills)
 * ============================================================================
 * Each Talk approach is a skill of the Talk skill type, learned through
 * classes like any skill. Talk is its own battle command. Each use takes the
 * speaker's turn and adds the skill's Fatigue.
 *
 * Skill note:
 *   <Talk Approach: soothe>     soothe, offer, ask, rite, threaten, plead, stalk
 *   <Talk Rite: ash>            (rite only) which rite this is
 *
 * Offer asks for an item before choosing the target; the item is given away.
 *
 * ============================================================================
 * Enemies
 * ============================================================================
 *   <Talk Type: animal>         animal, spirit or sapient. Without this the
 *                               enemy doesn't respond to Talk.
 *   <Talk Tags: forest, sea>    extra kinds, matched against specialties.
 *   <Talk Mood: 25>             starting mood, 0-100 (default 25), or a
 *                               word: Hostile, Wary, Calm.
 *   <Talk Instant: 9>           actor ids whose Talk always succeeds at once
 *                               (e.g. Stonemen surrender to Tou).
 *   <Talk Soothe: 15>           mood change for an approach, overriding the
 *                               type default (any approach name works).
 *   <Talk Hit: -20>             mood change when the party hits it (default:
 *                               the Hit Mood Change parameter).
 *   <Talk Likes: 1, 5>          item ids it loves being offered (x2).
 *   <Talk Hates: 3>             item ids it hates being offered (-30).
 *   <Talk Rite: ash>            the rite it wants; other rites anger it.
 *   <Talk Info: text>           what Ask reveals once it is Calm.
 *   <Talk Switch: 12>           switch turned ON when it gives its info.
 *   <Talk Outcome: ...>         what happens when it is Pacified, comma
 *                               separated (default: pacify):
 *        pacify                 it just leaves
 *        item 5 [2]             gives item #5 (x2)
 *        weapon 5 / armor 5     gives that weapon / armor
 *        heal 30 / mp 30        restores 30% HP / MP to the party
 *        buff atk 3             party gets an ATK buff for 3 turns
 *        debuff agi 3           the remaining enemies get an AGI debuff
 *        info                   shows its <Talk Info> (and sets the switch)
 *        event 7                runs common event #7 (scripted moments)
 *   <Talk Flees: threaten>      these approaches scare it off at once: it
 *                               leaves with no outcome and no EXP
 *                               (line: <Talk Line Flee: text>).
 *   <Talk Line Hostile: text>   lines shown when its mood changes to
 *   <Talk Line Wary: text>      that level (also Calm, Pacified, Enraged).
 *
 * ============================================================================
 * Reactions, results and questions
 * ============================================================================
 *   <Talk Soothe+: line | line>   what it does when that approach works (+),
 *   <Talk Soothe-: line>          backfires (-) or does nothing (0). Several
 *   <Talk Soothe0: line>          lines separated by | : one is picked at
 *                                 random. %1 = its name, %2 = the speaker.
 *                                 Without these, defaults for its talk type.
 *
 *   <Talk Offer Results: 80 normal | 20 leave "It grabs it and runs.">
 *      Weighted results for an approach (default: always normal). Kinds:
 *        normal              the usual mood change and reaction
 *        leave               it takes what it's given and wanders off
 *                            (no outcome, no EXP)
 *        flee                it runs off
 *        lash                it lashes out at the speaker
 *        gift item 6         it gives you something (item/weapon/armor)
 *        demand item 6       it wants (another) item 6: a yes/no prompt
 *                            (yes: +20 mood, no: -10)
 *        info                it tells you its <Talk Info>
 *        event 7             runs common event 7
 *      A "quoted line" after a kind is shown when that result happens.
 *      Lash, flee and leave are bad results: twice as likely when it is
 *      Hostile, half as likely when the speaker's specialty matches.
 *
 *   <Talk Question>
 *   Why do you walk our forest?
 *   - We need something. We'll take only that. | +20 | Hrm. Honest.
 *   - [5] I hunt here, by the agreement. | +25 | Pada. Good.
 *   - The forest belongs to everyone. | -15 | It belongs to the Lady!
 *   </Talk Question>
 *      It may ask this (Question Chance) after it's talked to, at most
 *      once per battle. Each answer: text | mood change | its reply |
 *      optional result (leave, flee, lash, gift item 6, steal 10). [5] means
 *      only shown when actor 5 is in the battle party. Up to 6 answers.
 *
 * ============================================================================
 * What Yoon can read (Insight)
 * ============================================================================
 * When choosing a Talk target, a hint box shows what Yoon can tell:
 *   Mood Insight      its mood, as a word
 *   Approach Insight  which approaches it responds to, and which offend it
 *   its tells         <Talk Tell: It keeps sniffing toward your bag.>
 *                     <Talk Tell 5: ...>  (needs Insight 5; default: Tell
 *                     Insight). Several tells: one is picked per battle.
 * At the start of a battle Yoon also points out any tell they can read.
 *
 * Mood: Enraged (0) - Hostile - Wary (35+) - Calm (70+) - Pacified (100).
 * An Enraged enemy gets the Enraged state and won't listen until it wears
 * off, then calms back down to Hostile.
 *
 * Hitting an enemy (any HP damage from the party, Patience included) angers
 * it; at 0 it becomes Enraged.
 *
 * Calm (and calmer) enemies don't use damaging actions; with nothing else
 * to do they use the Wait Skill.
 *
 * ============================================================================
 * Enemy talk
 * ============================================================================
 * Enemies can have their own talk skills (e.g. offering to let the party
 * leave, demanding surrender): give the skill a Common Event effect and
 * write the conversation there (Show Choices, Abort Battle, switches...).
 *
 * Skill note (enemy actions only):
 *   <Talk Min Mood: 35>   only used when its mood is at least 35
 *   <Talk Max Mood: 69>   only used when its mood is at most 69
 *
 * Stalk only works on animals and builds toward the Hunted state instead
 * of calm. Use b.isHunted() in a finishing skill's damage formula.
 *
 * ============================================================================
 * Speakers
 * ============================================================================
 *   <Talk Specialty: animal, sea>   (actor or class) matches Talk Type/Tags.
 *
 * Positive mood changes grow with the speaker's specialty and Insight
 * (level), and with Patience in the battle party for animals.
 *
 * ============================================================================
 * Insight EXP
 * ============================================================================
 * The enemy's EXP (database) is given on a successful conversation
 * (pacified, hunted, or info from Ask): full to the speaker, a share to the
 * other active members and reserve, less after the first success with that
 * enemy type. Winning a battle gives no EXP.
 */

var Imported = Imported || {};
Imported.SI_Talk = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Talk = SmokingIsle.Talk || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_Talk');
    $.stypeId = Number(params['Talk Skill Type'] || 4);
    $.enragedStateId = Number(params['Enraged State'] || 0);
    $.huntedStateId = Number(params['Hunted State'] || 0);
    $.moodInsight = Number(params['Mood Insight'] || 0);
    $.specialtyBonus = Number(params['Specialty Bonus'] || 0.5);
    $.insightBonus = Number(params['Insight Bonus'] || 0.03);
    $.waitSkillId = Number(params['Wait Skill'] || 0);
 $.approachInsight = Number(params['Approach Insight'] || 4);
    $.tellInsight = Number(params['Tell Insight'] || 3);
    $.questionChance = Number(params['Question Chance'] !== undefined && params['Question Chance'] !== '' ? params['Question Chance'] : 40);
    $.hitMood = Number(params['Hit Mood Change'] !== undefined && params['Hit Mood Change'] !== '' ? params['Hit Mood Change'] : -10);
    $.patienceActorId = Number(params['Patience Actor'] || 0);
    $.patienceBonus = Number(params['Patience Bonus'] || 0.25);
    $.repeatExpRate = Number(params['Repeat EXP Rate'] || 0.2);
    $.partyExpRate = Number(params['Party EXP Rate'] || 0.5);
    $.reserveExpRate = Number(params['Reserve EXP Rate'] || 0.25);

    $.CALM_AFTER_RAGE = 20;
    $.HATED_OFFER = -30;

    // Default mood change per approach and talk type. Stalk is hunt progress.
    $.defaults = {
        animal:  { soothe: 15, offer: 15, ask: 0,  rite: 0,  threaten: -10, plead: 5,  stalk: 35 },
        spirit:  { soothe: 5,  offer: 10, ask: 5,  rite: 30, threaten: -15, plead: 10, stalk: 0 },
        sapient: { soothe: 10, offer: 15, ask: 5,  rite: 5,  threaten: 10,  plead: 15, stalk: 0 }
    };

    $.PARAMS = { mhp: 0, mmp: 1, atk: 2, def: 3, mat: 4, mdf: 5, agi: 6, luk: 7 };

    //-------------------------------------------------------------------------
    // Note tags
    //-------------------------------------------------------------------------

    $.tag = function(note, name) {
        var m = new RegExp('<' + name + ':\\s*([^>]*)>', 'i').exec(note || '');
        return m ? m[1].trim() : null;
    };

    // "80 normal | 20 leave \"line\" | 10 gift item 6"
    $.parseResults = function(text) {
        return text.split('|').map(function(part) {
            var line = null;
            part = part.replace(/"([^"]*)"/, function(_, l) { line = l; return ''; }).trim();
            var words = part.split(/\s+/);
            var weight = parseFloat(words.shift()) || 0;
            return { weight: weight, kind: (words.shift() || 'normal').toLowerCase(), args: words, line: line };
        }).filter(function(r) { return r.weight > 0; });
    };

    $.parseQuestion = function(block) {
        var lines = block.split(/\r?\n/).map(function(l) { return l.trim(); }).filter(function(l) { return l; });
        var text = lines.shift();
        if (!text) return null;
        var answers = lines.filter(function(l) { return l.charAt(0) === '-'; }).map(function(l) {
            var f = l.slice(1).split('|').map(function(x) { return x.trim(); });
            var actorId = 0;
            var label = (f[0] || '').replace(/^\[(\d+)\]\s*/, function(_, id) { actorId = Number(id); return ''; });
            return { text: label, actorId: actorId, mood: Number(f[1] || 0), reply: f[2] || '', result: (f[3] || '').trim() };
        });
        return { text: text, answers: answers };
    };

    $.pick = function(list) {
        return list && list.length ? list[Math.randomInt(list.length)] : null;
    };

    $.list = function(text) {
        return text ? text.split(',').map(function(s) {
            return s.trim().toLowerCase();
        }).filter(function(s) { return s; }) : [];
    };

    var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
    DataManager.isDatabaseLoaded = function() {
        if (!_DataManager_isDatabaseLoaded.call(this)) return false;
        if (!$._notesParsed) {
            $dataSkills.forEach(function(skill) {
                if (!skill) return;
                skill.siApproach = ($.tag(skill.note, 'Talk Approach') || '').toLowerCase() || null;
                skill.siRite = ($.tag(skill.note, 'Talk Rite') || '').toLowerCase() || null;
                var minMood = $.tag(skill.note, 'Talk Min Mood');
                var maxMood = $.tag(skill.note, 'Talk Max Mood');
                skill.siMinMood = minMood !== null ? Number(minMood) : null;
                skill.siMaxMood = maxMood !== null ? Number(maxMood) : null;
            });
            $dataEnemies.forEach(function(enemy) {
                if (enemy) $.parseEnemy(enemy);
            });
            [$dataActors, $dataClasses].forEach(function(list) {
                list.forEach(function(obj) {
                    if (obj) obj.siSpecialties = $.list($.tag(obj.note, 'Talk Specialty'));
                });
            });
            $._notesParsed = true;
        }
        return true;
    };

    $.parseEnemy = function(enemy) {
        var note = enemy.note;
        var t = {};
        t.type = ($.tag(note, 'Talk Type') || '').toLowerCase() || null;
        t.kinds = (t.type ? [t.type] : []).concat($.list($.tag(note, 'Talk Tags')));
        var mood = $.tag(note, 'Talk Mood');
        var words = { hostile: 20, wary: 50, calm: 80 };
        t.mood = mood === null ? 25 : (words[mood.toLowerCase()] !== undefined ? words[mood.toLowerCase()] : Number(mood));
        t.instant = $.list($.tag(note, 'Talk Instant')).map(Number);
        t.overrides = {};
        ['soothe', 'offer', 'ask', 'rite', 'threaten', 'plead', 'stalk', 'hit'].forEach(function(a) {
            var v = $.tag(note, 'Talk ' + a);
            if (v !== null) t.overrides[a] = Number(v);
        });
        t.likes = $.list($.tag(note, 'Talk Likes')).map(Number);
        t.hates = $.list($.tag(note, 'Talk Hates')).map(Number);
        t.rite = ($.tag(note, 'Talk Rite') || '').toLowerCase() || null;
        t.info = $.tag(note, 'Talk Info');
        t.switchId = Number($.tag(note, 'Talk Switch') || 0);
        t.outcomes = ($.tag(note, 'Talk Outcome') || 'pacify').split(',').map(function(s) {
            return s.trim().split(/\s+/);
        });
        t.lines = {};
        t.flees = $.list($.tag(note, 'Talk Flees')).map(function(a) { return a.toLowerCase(); });
        t.reactions = {};
        var re = /<Talk (\w+)([+\-0]):\s*([^>]*)>/gi, m;
        while ((m = re.exec(note))) {
            t.reactions[m[1].toLowerCase() + m[2]] = m[3].split('|').map(function(x) { return x.trim(); }).filter(function(x) { return x; });
        }
        t.results = {};
        var rr = /<Talk (\w+) Results:\s*([^>]*)>/gi;
        while ((m = rr.exec(note))) t.results[m[1].toLowerCase()] = $.parseResults(m[2]);
        t.tells = [];
        var tr = /<Talk Tell(?:\s+(\d+))?:\s*([^>]*)>/gi;
        while ((m = tr.exec(note))) t.tells.push({ insight: m[1] ? Number(m[1]) : $.tellInsight, text: m[2].trim() });
        t.questions = [];
        var qr = /<Talk Question>([\s\S]*?)<\/Talk Question>/gi;
        while ((m = qr.exec(note))) {
            var q = $.parseQuestion(m[1]);
            if (q) t.questions.push(q);
        }
        ['Enraged', 'Hostile', 'Wary', 'Calm', 'Pacified', 'Flee'].forEach(function(level) {
            var line = $.tag(note, 'Talk Line ' + level);
            if (line) t.lines[level] = line;
        });
        enemy.siTalk = t;
    };

    //-------------------------------------------------------------------------
    // Helpers
    //-------------------------------------------------------------------------

    // Default reactions per talk type: approach + "+" (worked), "-" (backfired), "0" (nothing).
    $.DEFAULT_REACTIONS = {
        animal: {
            'soothe+': ['%1\'s ears flick toward the voice.', '%1 stops pawing the ground.'],
            'soothe-': ['%1 doesn\'t trust the voice.'],
            'offer+': ['%1 sniffs the offering and gulps it down.', '%1 noses at the offering, then eats.'],
            'offer-': ['%1 bats the offering away.'],
            'ask-': ['%1 just stares.', '%1 doesn\'t understand.'],
            'rite-': ['%1 shies away from the strange chanting.'],
            'threaten+': ['%1 backs off a step.'],
            'threaten-': ['%1 bares its teeth.', '%1 bristles.'],
            'plead+': ['%1 tilts its head.'],
            'plead-': ['%1 ignores the plea.']
        },
        spirit: {
            'soothe+': ['%1 grows still, listening.'],
            'soothe-': ['%1 flickers, unmoved.'],
            'offer+': ['%1 accepts the offering.'],
            'offer-': ['%1 recoils from the offering.'],
            'ask+': ['%1 seems to consider the question.'],
            'ask-': ['%1 won\'t answer. Not yet.'],
            'rite+': ['%1 sways with the rite.', 'The rite settles over %1 like a cloak.'],
            'rite-': ['%1 hisses at the wrong rite!'],
            'threaten+': ['%1 shrinks back.'],
            'threaten-': ['%1\'s anger rises like smoke.'],
            'plead+': ['%1 softens at the plea.'],
            'plead-': ['%1 is unmoved.']
        },
        sapient: {
            'soothe+': ['%1 lowers their guard a little.', '%1 listens, wary.'],
            'soothe-': ['%1 scoffs.'],
            'offer+': ['%1 takes the gift with a nod.'],
            'offer-': ['%1 is insulted by the offer!'],
            'ask+': ['%1 thinks about it.'],
            'ask-': ['"Why should I tell you anything?"'],
            'rite+': ['%1 respects the old ways.'],
            'rite-': ['%1 finds the rite strange.'],
            'threaten+': ['%1 takes the threat seriously.'],
            'threaten-': ['%1 is provoked!'],
            'plead+': ['%1 hesitates.'],
            'plead-': ['%1 is unmoved by begging.']
        }
    };

    Game_Enemy.prototype.talkReaction = function(approach, sign, speaker) {
        var data = this.talkData();
        var key = approach + sign;
        var line = $.pick(data.reactions && data.reactions[key]) ||
            $.pick(($.DEFAULT_REACTIONS[data.type] || {})[key]) ||
            (sign === '+' ? '%1 seems calmer.' : sign === '-' ? '%1 bristles.' : '%1 doesn\'t react.');
        return line.format(this.name(), speaker ? speaker.name() : '');
    };

    $.isTalkSkill = function(item) {
        return DataManager.isSkill(item) && !!item.siApproach;
    };

    $.moodLevel = function(mood) {
        if (mood <= 0) return 'Enraged';
        if (mood >= 100) return 'Pacified';
        if (mood >= 70) return 'Calm';
        if (mood >= 35) return 'Wary';
        return 'Hostile';
    };

    // Yoon's Insight: the higher of Ghost Yoon (1) and Human Yoon (2) in the party.
    $.yoonInsight = function() {
        return $gameParty.allMembers().filter(function(a) {
            return a.actorId() === 1 || a.actorId() === 2;
        }).reduce(function(max, a) {
            return Math.max(max, a.level);
        }, 0);
    };

    $.canSeeMood = function() {
        return $.yoonInsight() >= $.moodInsight;
    };

    Game_Actor.prototype.talkSpecialties = function() {
        return (this.actor().siSpecialties || []).concat(this.currentClass().siSpecialties || []);
    };

    Game_Battler.prototype.isHunted = function() {
        return $.huntedStateId > 0 && this.isStateAffected($.huntedStateId);
    };

    Game_Enemy.prototype.talkData = function() {
        return this.enemy().siTalk || { type: null, kinds: [], overrides: {}, outcomes: [] };
    };

    Game_Enemy.prototype.talkMood = function() {
        if (this._siMood === undefined) this._siMood = this.talkData().mood;
        return this._siMood;
    };

    Game_Enemy.prototype.isEnraged = function() {
        return $.enragedStateId > 0 && this.isStateAffected($.enragedStateId);
    };

    //-------------------------------------------------------------------------
    // Talking
    //-------------------------------------------------------------------------

    var _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        if (!$.isTalkSkill(this.item())) {
            _Game_Action_apply.call(this, target);
            if (target.isEnemy() && this.subject().isActor() && target.result().hpDamage > 0) {
                target.angerFromHit();
            }
            return;
        }
        var result = target.result();
        result.clear();
        result.used = true;
        result.success = true;
        target._siTalkMessages = [];
        if (target.isEnemy()) {
            this.applyTalk(target);
        }
    };

    // Being hit sours the mood; at 0 the enemy becomes Enraged.
    Game_Enemy.prototype.angerFromHit = function() {
        var data = this.talkData();
        if (!data.type || this.isEnraged() || !this.isAlive()) return;
        var delta = data.overrides.hit !== undefined ? data.overrides.hit : $.hitMood;
        if (!delta) return;
        var before = $.moodLevel(this.talkMood());
        this._siMood = (this.talkMood() + delta).clamp(0, 100);
        var after = $.moodLevel(this._siMood);
        if (after === before) return;
        this._siTalkMessages = this._siTalkMessages || [];
        if (data.lines[after]) this._siTalkMessages.push('%1: "%2"'.format(this.name(), data.lines[after]));
        if ($.canSeeMood()) this._siTalkMessages.push('%1 is now %2.'.format(this.name(), after));
        if (after === 'Enraged') this.addState($.enragedStateId);
    };

    Game_Action.prototype.talkSay = function(target, text) {
        target._siTalkMessages.push(text);
    };

    Game_Action.prototype.talkMultiplier = function(enemy) {
        var speaker = this.subject();
        var m = 1;
        if (speaker.isActor()) {
            var kinds = enemy.talkData().kinds;
            if (speaker.talkSpecialties().some(function(k) { return kinds.indexOf(k) >= 0; })) {
                m += $.specialtyBonus;
            }
            m += speaker.level * $.insightBonus;
        }
        if (enemy.talkData().type === 'animal' && $.patienceActorId > 0 &&
                $gameParty.battleMembers().some(function(a) { return a.actorId() === $.patienceActorId; })) {
            m += $.patienceBonus;
        }
        return m;
    };

    Game_Action.prototype.talkDelta = function(enemy, approach) {
        var data = enemy.talkData();
        var delta;
        if (data.overrides[approach] !== undefined) {
            delta = data.overrides[approach];
        } else {
            delta = ($.defaults[data.type] || {})[approach] || 0;
        }
        if (approach === 'offer') {
            var itemId = this._siOfferItemId || 0;
            if (data.hates.indexOf(itemId) >= 0) return $.HATED_OFFER;
            if (data.likes.indexOf(itemId) >= 0) delta *= 2;
        }
        if (approach === 'rite' && data.rite && this.item().siRite !== data.rite) {
            return -10;
        }
        if (delta > 0) {
            delta *= this.talkMultiplier(enemy) * (0.85 + Math.random() * 0.3);
        }
        return Math.round(delta);
    };

    Game_Action.prototype.applyTalk = function(enemy) {
        var name = enemy.name();
        var data = enemy.talkData();
        var approach = this.item().siApproach;

        if (approach === 'offer' && this._siOfferItemId) {
            var gift = $dataItems[this._siOfferItemId];
            if (gift && $gameParty.hasItem(gift)) {
                $gameParty.loseItem(gift, 1);
                this.talkSay(enemy, '%1 is offered %2.'.format(name, gift.name));
            }
        }
        if (!data.type) {
            this.talkSay(enemy, '%1 doesn\'t respond.'.format(name));
            return;
        }
        if (enemy.isEnraged()) {
            this.talkSay(enemy, '%1 is too enraged to listen!'.format(name));
            return;
        }
        if (enemy.talkMood() <= 0) {
            enemy._siMood = $.CALM_AFTER_RAGE;
        }

        var speaker = this.subject();
        if (speaker.isActor() && data.instant && data.instant.indexOf(speaker.actorId()) >= 0 &&
                approach !== 'stalk') {
            this.talkSay(enemy, '%1 yields to %2 at once.'.format(name, speaker.name()));
            if (data.lines.Pacified) this.talkSay(enemy, '%1: "%2"'.format(name, data.lines.Pacified));
            enemy._siMood = 100;
            this.applyOutcomes(enemy);
            this.talkSuccess(enemy);
            this.talkLeave(enemy);
            return;
        }
        if (data.flees && data.flees.indexOf(approach) >= 0) {
            if (data.lines.Flee) this.talkSay(enemy, '%1: "%2"'.format(name, data.lines.Flee));
            this.talkSay(enemy, '%1 flees!'.format(name));
            enemy.escape();
            return;
        }
        if (approach === 'stalk') {
            this.applyStalk(enemy);
            return;
        }
        if (approach === 'ask' && enemy.talkMood() >= 70 && data.info) {
            this.talkSay(enemy, '%1: "%2"'.format(name, data.info));
            if (data.switchId > 0) $gameSwitches.setValue(data.switchId, true);
            this.talkSuccess(enemy);
            this.talkLeave(enemy);
            return;
        }

        var result = this.rollTalkResult(enemy, approach);
        if (result && result.kind !== 'normal') {
            if (this.applyTalkResult(enemy, result)) return;
        }
        var delta = this.talkDelta(enemy, approach);
        if (approach === 'ask' && enemy.talkMood() < 70) delta = Math.min(delta, -5);
        this.talkSay(enemy, enemy.talkReaction(approach, delta > 0 ? '+' : delta < 0 ? '-' : '0', this.subject()));
        this.talkChangeMood(enemy, delta);
        if (enemy.isAppeared() && !enemy.isEnraged()) $.maybeAsk(enemy, this.subject());
    };

    // Picks a weighted result for this approach (null: the normal result).
    Game_Action.prototype.rollTalkResult = function(enemy, approach) {
        var list = enemy.talkData().results[approach];
        if (!list || list.length === 0) return null;
        var speaker = this.subject();
        var kinds = enemy.talkData().kinds;
        var specialist = speaker.isActor() && speaker.talkSpecialties().some(function(k) { return kinds.indexOf(k) >= 0; });
        var hostile = enemy.talkMood() < 35;
        var weights = list.map(function(r) {
            var bad = ['lash', 'flee', 'leave'].indexOf(r.kind) >= 0;
            return r.weight * (bad && hostile ? 2 : 1) * (bad && specialist ? 0.5 : 1);
        });
        var total = weights.reduce(function(a, b) { return a + b; }, 0);
        var roll = Math.random() * total;
        for (var i = 0; i < list.length; i++) {
            roll -= weights[i];
            if (roll < 0) return list[i];
        }
        return list[list.length - 1];
    };

    // Applies a special result. Returns true if the normal mood change is skipped.
    Game_Action.prototype.applyTalkResult = function(enemy, r) {
        var name = enemy.name();
        if (r.line) this.talkSay(enemy, r.line.format(name, this.subject().name()));
        switch (r.kind) {
        case 'leave':
            if (!r.line) this.talkSay(enemy, '%1 takes it and wanders off.'.format(name));
            enemy.escape();
            return true;
        case 'flee':
            if (!r.line) this.talkSay(enemy, '%1 runs off!'.format(name));
            enemy.escape();
            return true;
        case 'lash':
            $.lashOut(enemy, this.subject(), this.talkSay.bind(this, enemy));
            this.talkChangeMood(enemy, -5);
            return true;
        case 'gift':
            $.giveFrom(enemy, r.args, this.talkSay.bind(this, enemy));
            return false;
        case 'demand':
            $.queuePrompt($.demandPrompt(enemy, this.subject(), r.args));
            return true;
        case 'info':
            var info = enemy.talkData().info;
            if (info) this.talkSay(enemy, '%1: "%2"'.format(name, info));
            return false;
        case 'event':
            $gameTemp.reserveCommonEvent(Number(r.args[0]));
            return false;
        }
        return false;
    };

    // Changes mood and handles the consequences (level lines, Enraged, Pacified).
    Game_Action.prototype.talkChangeMood = function(enemy, delta) {
        var name = enemy.name();
        var data = enemy.talkData();
        var before = $.moodLevel(enemy.talkMood());
        enemy._siMood = (enemy.talkMood() + delta).clamp(0, 100);
        var after = $.moodLevel(enemy.talkMood());
        if (after !== before) {
            if (data.lines[after]) this.talkSay(enemy, '%1: "%2"'.format(name, data.lines[after]));
            if ($.canSeeMood() && after !== 'Pacified') this.talkSay(enemy, '%1 is now %2.'.format(name, after));
        }
        if (after === 'Enraged') {
            enemy.addState($.enragedStateId);
        } else if (after === 'Pacified') {
            this.applyOutcomes(enemy);
            this.talkSuccess(enemy);
            this.talkLeave(enemy);
        }
    };

    //-------------------------------------------------------------------------
    // Prompts: enemy questions and demands (shown between actions)
    //-------------------------------------------------------------------------

    $.prompts = [];
    $.currentPrompt = null;

    $.queuePrompt = function(prompt) {
        if (prompt && prompt.answers.length > 0) $.prompts.push(prompt);
    };

    // A stand-in action so prompt answers can reuse the talk helpers.
    $.promptAction = function(speaker) {
        var action = new Game_Action(speaker);
        action.setSkill($dataSkills.findIndex(function(s) { return s && s.siApproach === 'soothe'; }) || 0);
        return action;
    };

    $.flush = function(enemy, lines) {
        (lines || []).concat(enemy._siTalkMessages || []).forEach(function(line) {
            if (line) $gameMessage.add(line);
        });
        enemy._siTalkMessages = [];
    };

    $.lashOut = function(enemy, speaker, say) {
        var action = new Game_Action(enemy);
        action.setSkill(enemy.attackSkillId());
        var value = Math.max(action.makeDamageValue(speaker, false), 1);
        speaker.clearResult();
        action.executeHpDamage(speaker, value);
        speaker.startDamagePopup();
        say('%1 lashes out at %2! (%3 damage)'.format(enemy.name(), speaker.name(), value));
        if (speaker.isDead()) {
            speaker.performCollapse();
            say('%1 falls!'.format(speaker.name()));
        }
    };

    $.giveFrom = function(enemy, args, say) {
        var kind = (args[0] || 'item').toLowerCase();
        var list = kind === 'weapon' ? $dataWeapons : kind === 'armor' ? $dataArmors : $dataItems;
        var obj = list[Number(args[1])];
        if (obj) {
            $gameParty.gainItem(obj, 1);
            say('%1 gives you %2.'.format(enemy.name(), obj.name));
        }
    };

    // Applies a prompt answer's result word ("leave", "flee", "lash", "gift item 6", "steal 10").
    $.applyAnswerResult = function(enemy, speaker, result, say) {
        var words = result.split(/\s+/);
        switch ((words[0] || '').toLowerCase()) {
        case 'leave':
            say('%1 wanders off.'.format(enemy.name()));
            enemy.escape();
            break;
        case 'flee':
            say('%1 runs off!'.format(enemy.name()));
            enemy.escape();
            break;
        case 'lash':
            $.lashOut(enemy, speaker, say);
            break;
        case 'gift':
            $.giveFrom(enemy, words.slice(1), say);
            break;
        case 'steal':
            var gold = Math.min($gameParty.gold(), Number(words[1] || 10));
            if (gold > 0) {
                $gameParty.loseGold(gold);
                if (SmokingIsle.Pranks) $gameSystem.siHoard().gold += gold;
                say('%1 helps itself to %2 %3!'.format(enemy.name(), gold, TextManager.currencyUnit));
            }
            break;
        }
    };

    $.questionPrompt = function(enemy, speaker, q) {
        var members = $gameParty.battleMembers();
        var answers = q.answers.filter(function(a) {
            return !a.actorId || members.some(function(m) { return m.actorId() === a.actorId; });
        }).slice(0, 6);
        return {
            enemy: enemy, speaker: speaker,
            text: '%1: "%2"'.format(enemy.name(), q.text),
            answers: answers.map(function(a) {
                return {
                    label: a.text,
                    apply: function() {
                        var action = $.promptAction(speaker);
                        var lines = a.reply ? ['%1: "%2"'.format(enemy.name(), a.reply)] : [];
                        var say = function(t) { lines.push(t); };
                        if (a.result) $.applyAnswerResult(enemy, speaker, a.result, say);
                        $.flush(enemy, lines);
                        if (a.mood && enemy.isAppeared()) {
                            enemy._siTalkMessages = [];
                            action.talkChangeMood(enemy, a.mood);
                            $.flush(enemy);
                        }
                    }
                };
            })
        };
    };

    $.demandPrompt = function(enemy, speaker, args) {
        var kind = (args[0] || 'item').toLowerCase();
        var list = kind === 'weapon' ? $dataWeapons : kind === 'armor' ? $dataArmors : $dataItems;
        var item = list[Number(args[1])];
        if (!item) return null;
        var change = function(delta, approach) {
            var action = $.promptAction(speaker);
            enemy._siTalkMessages = [];
            action.talkSay(enemy, enemy.talkReaction(approach, delta > 0 ? '+' : '-', speaker));
            action.talkChangeMood(enemy, delta);
            $.flush(enemy);
        };
        var answers = $gameParty.hasItem(item) ? [
            { label: 'Give ' + item.name, apply: function() { $gameParty.loseItem(item, 1); change(20, 'offer'); } },
            { label: 'Refuse', apply: function() { change(-10, 'offer'); } }
        ] : [
            { label: 'You have none', apply: function() { change(-5, 'offer'); } }
        ];
        return { enemy: enemy, speaker: speaker, text: '%1 wants %2.'.format(enemy.name(), item.name), answers: answers };
    };

    // After being talked to, an enemy may ask one of its questions.
    $.maybeAsk = function(enemy, speaker) {
        var data = enemy.talkData();
        if (!data.questions || data.questions.length === 0 || !speaker.isActor()) return;
        enemy._siAsked = enemy._siAsked || [];
        var open = data.questions.filter(function(q, i) { return enemy._siAsked.indexOf(i) < 0; });
        if (open.length === 0 || Math.random() * 100 >= $.questionChance) return;
        var q = open[Math.randomInt(open.length)];
        enemy._siAsked.push(data.questions.indexOf(q));
        $.queuePrompt($.questionPrompt(enemy, speaker, q));
    };

    $.promptList = function(prompt) {
        var list = [
            { code: 101, indent: 0, parameters: ['', 0, 0, 2] },
            { code: 401, indent: 0, parameters: [prompt.text] },
            { code: 102, indent: 0, parameters: [prompt.answers.map(function(a) { return a.label; }), -1, 0, 0, 0] }
        ];
        prompt.answers.forEach(function(a, i) {
            list.push({ code: 402, indent: 0, parameters: [i, a.label] });
            list.push({ code: 355, indent: 1, parameters: ['SmokingIsle.Talk.answer(' + i + ')'] });
            list.push({ code: 0, indent: 1, parameters: [] });
        });
        list.push({ code: 404, indent: 0, parameters: [] });
        list.push({ code: 0, indent: 0, parameters: [] });
        return list;
    };

    $.answer = function(index) {
        var prompt = $.currentPrompt;
        $.currentPrompt = null;
        if (prompt && prompt.answers[index]) prompt.answers[index].apply();
    };

    var _Game_Troop_setupBattleEvent = Game_Troop.prototype.setupBattleEvent;
    Game_Troop.prototype.setupBattleEvent = function() {
        if (!this._interpreter.isRunning()) {
            while ($.prompts.length > 0) {
                var prompt = $.prompts.shift();
                if (prompt.enemy.isAlive() && !prompt.enemy.isHidden()) {
                    $.currentPrompt = prompt;
                    this._interpreter.setup($.promptList(prompt));
                    return;
                }
            }
        }
        _Game_Troop_setupBattleEvent.call(this);
    };

    var _BattleManager_setup = BattleManager.setup;
    BattleManager.setup = function(troopId, canEscape, canLose) {
        $.prompts = [];
        $.currentPrompt = null;
        _BattleManager_setup.call(this, troopId, canEscape, canLose);
    };

    //-------------------------------------------------------------------------
    // What Yoon can read
    //-------------------------------------------------------------------------

    $.APPROACHES = ['soothe', 'offer', 'ask', 'rite', 'threaten', 'plead'];

    // Base mood change of an approach on this enemy (before speaker bonuses).
    Game_Enemy.prototype.talkBaseDelta = function(approach) {
        var data = this.talkData();
        if (data.overrides[approach] !== undefined) return data.overrides[approach];
        return ($.defaults[data.type] || {})[approach] || 0;
    };

    // The tell Yoon notices this battle (picked once), or null.
    Game_Enemy.prototype.talkTell = function() {
        if (!this._siTell) {   // picked once per battle; keeps looking until one is readable
            var insight = $.yoonInsight();
            var readable = (this.talkData().tells || []).filter(function(t) { return insight >= t.insight; });
            this._siTell = readable.length ? readable[Math.randomInt(readable.length)].text : null;
        }
        return this._siTell;
    };

    $.cap = function(word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    };

    // Up to two lines for the Talk target hint box.
    Game_Enemy.prototype.talkHint = function() {
        var data = this.talkData();
        var insight = $.yoonInsight();
        var first = this.name();
        if (!data.type) {
            first += ' doesn\'t respond to talk.';
        } else {
            if ($.canSeeMood()) first += ': ' + (this.isEnraged() ? 'Enraged' : $.moodLevel(this.talkMood())) + '.';
            if (insight >= $.approachInsight) {
                var likes = [], dislikes = [];
                $.APPROACHES.forEach(function(a) {
                    var d = this.talkBaseDelta(a);
                    if (d >= 15) likes.push($.cap(a));
                    else if (d < 0) dislikes.push($.cap(a));
                }, this);
                if (data.type === 'animal') likes.push('Stalk');
                if (likes.length) first += ' Responds to ' + likes.join(', ') + '.';
                if (dislikes.length) first += ' Not ' + dislikes.join(', ') + '.';
            }
        }
        return [first, this.talkTell() || ''];
    };

    $.yoonName = function() {
        var yoon = $gameParty.battleMembers().filter(function(a) {
            return a.actorId() === 1 || a.actorId() === 2;
        })[0];
        return yoon ? yoon.name() : null;
    };

    // At the start of a battle, Yoon points out what they notice (once per kind of enemy).
    var _BattleManager_displayStartMessages = BattleManager.displayStartMessages;
    BattleManager.displayStartMessages = function() {
        _BattleManager_displayStartMessages.call(this);
        var name = $.yoonName();
        if (!name) return;
        var seen = {};
        $gameTroop.members().forEach(function(enemy) {
            if (seen[enemy.enemyId()] || !enemy.isAppeared()) return;
            seen[enemy.enemyId()] = true;
            var tell = enemy.talkTell();
            if (tell) $gameMessage.add('%1 notices: %2'.format(name, tell));
        });
    };

    // The hint box while choosing a Talk target.
    var _Scene_Battle_createEnemyWindow = Scene_Battle.prototype.createEnemyWindow;
    Scene_Battle.prototype.createEnemyWindow = function() {
        _Scene_Battle_createEnemyWindow.call(this);
        this._enemyWindow.setHelpWindow(this._helpWindow);
    };

    // Help text whose lines shrink to fit instead of running off the edge.
    Window_Help.prototype.setFittedLines = function(lines) {
        var text = lines.join('\n');
        if (this._siFitLines && this._text === text) return;
        this._siFitLines = lines;
        this._text = text;
        this.refresh();
    };

    var _Window_Help_setText = Window_Help.prototype.setText;
    Window_Help.prototype.setText = function(text) {
        if (this._siFitLines) {
            this._siFitLines = null;
            this._text = null;
        }
        _Window_Help_setText.call(this, text);
    };

    var _Window_Help_refresh = Window_Help.prototype.refresh;
    Window_Help.prototype.refresh = function() {
        if (!this._siFitLines) {
            _Window_Help_refresh.call(this);
            return;
        }
        this.contents.clear();
        var width = this.contentsWidth() - this.textPadding() * 2;
        this._siFitLines.forEach(function(line, i) {
            var size = this.standardFontSize();
            this.contents.fontSize = size;
            while (size > 18 && this.textWidth(line) > width) this.contents.fontSize = --size;
            this.drawText(line, this.textPadding(), i * this.lineHeight(), width);
        }, this);
        this.resetFontSettings();
    };

    Window_BattleEnemy.prototype.isTalkTargeting = function() {
        var action = BattleManager.inputtingAction();
        return !!action && $.isTalkSkill(action.item());
    };

    var _Window_BattleEnemy_show = Window_BattleEnemy.prototype.show;
    Window_BattleEnemy.prototype.show = function() {
        _Window_BattleEnemy_show.call(this);
        if (this.isTalkTargeting()) this.showHelpWindow();
    };

    var _Window_BattleEnemy_hide = Window_BattleEnemy.prototype.hide;
    Window_BattleEnemy.prototype.hide = function() {
        if (this.visible) this.hideHelpWindow();
        _Window_BattleEnemy_hide.call(this);
    };

    Window_BattleEnemy.prototype.updateHelp = function() {
        if (!this._helpWindow) return;
        var enemy = this.enemy();
        if (this.isTalkTargeting() && enemy) {
            this._helpWindow.setFittedLines(enemy.talkHint());
            this._helpWindow.show();
        } else {
            this._helpWindow.hide();
        }
    };

    Game_Action.prototype.applyStalk = function(enemy) {
        var name = enemy.name();
        if (enemy.talkData().type !== 'animal') {
            this.talkSay(enemy, '%1 can\'t be stalked.'.format(name));
            return;
        }
        if (enemy.isHunted()) {
            this.talkSay(enemy, '%1 is already cornered.'.format(name));
            return;
        }
        enemy._siHunt = (enemy._siHunt || 0) + this.talkDelta(enemy, 'stalk');
        if (enemy._siHunt >= 100) {
            enemy._siHunt = 0;
            enemy.addState($.huntedStateId);
            this.talkSay(enemy, '%1 is cornered!'.format(name));
            this.talkSuccess(enemy);
        } else {
            this.talkSay(enemy, '%1 is being tracked...'.format(name));
        }
    };

    Game_Action.prototype.applyOutcomes = function(enemy) {
        var name = enemy.name();
        var data = enemy.talkData();
        data.outcomes.forEach(function(o) {
            var kind = (o[0] || '').toLowerCase();
            var a = o[1], b = o[2];
            switch (kind) {
            case 'item':
            case 'weapon':
            case 'armor':
                var list = kind === 'item' ? $dataItems : (kind === 'weapon' ? $dataWeapons : $dataArmors);
                var obj = list[Number(a)];
                var n = Number(b || 1);
                if (obj) {
                    $gameParty.gainItem(obj, n);
                    this.talkSay(enemy, '%1 gives you %2%3.'.format(name, obj.name, n > 1 ? ' x' + n : ''));
                }
                break;
            case 'heal':
            case 'mp':
                var rate = Number(a || 0) / 100;
                $gameParty.aliveMembers().forEach(function(actor) {
                    if (kind === 'heal') actor.gainHp(Math.floor(actor.mhp * rate));
                    else actor.gainMp(Math.floor(actor.mmp * rate));
                });
                this.talkSay(enemy, kind === 'heal' ? '%1 tends to your wounds.'.format(name)
                                                    : '%1 restores your spirit.'.format(name));
                break;
            case 'buff':
                var bid = $.PARAMS[(a || '').toLowerCase()];
                if (bid !== undefined) {
                    $gameParty.aliveMembers().forEach(function(actor) {
                        actor.addBuff(bid, Number(b || 3));
                    });
                    this.talkSay(enemy, '%1 lends you its strength.'.format(name));
                }
                break;
            case 'debuff':
                var did = $.PARAMS[(a || '').toLowerCase()];
                if (did !== undefined) {
                    $gameTroop.aliveMembers().forEach(function(foe) {
                        if (foe !== enemy) foe.addDebuff(did, Number(b || 3));
                    });
                    this.talkSay(enemy, '%1 turns on the others!'.format(name));
                }
                break;
            case 'info':
                if (data.info) this.talkSay(enemy, '%1: "%2"'.format(name, data.info));
                if (data.switchId > 0) $gameSwitches.setValue(data.switchId, true);
                break;
            case 'event':
                $gameTemp.reserveCommonEvent(Number(a));
                break;
            }
        }, this);
    };

    Game_Action.prototype.talkLeave = function(enemy) {
        this.talkSay(enemy, '%1 leaves peacefully.'.format(enemy.name()));
        enemy.escape();
    };

    Game_Action.prototype.talkSuccess = function(enemy) {
        var speaker = this.subject();
        var exp = enemy.exp();
        var record = $gameSystem.siTalkRecord();
        if (record[enemy.enemyId()]) exp = Math.floor(exp * $.repeatExpRate);
        record[enemy.enemyId()] = true;
        if (exp <= 0) return;
        var active = $gameParty.battleMembers();
        $gameParty.allMembers().forEach(function(actor) {
            var rate = actor === speaker ? 1 : (active.indexOf(actor) >= 0 ? $.partyExpRate : $.reserveExpRate);
            var gain = Math.floor(exp * rate);
            if (gain > 0) actor.gainExp(gain);
        });
    };

    Game_System.prototype.siTalkRecord = function() {
        if (!this._siTalkRecord) this._siTalkRecord = {};
        return this._siTalkRecord;
    };

    //-------------------------------------------------------------------------
    // Enemy behaviour by mood
    //-------------------------------------------------------------------------

    $.isHarmful = function(skill) {
        if (!skill || [1, 2, 5, 6].indexOf(skill.damage.type) >= 0) return !!skill;
        return skill.effects.some(function(e) {
            return e.code === Game_Action.EFFECT_ADD_STATE || e.code === Game_Action.EFFECT_ADD_DEBUFF;
        });
    };

    $.isHostileSkill = function(skill) {
        return !!skill && [1, 2, 3, 4, 5, 6].indexOf(skill.scope) >= 0 && $.isHarmful(skill);
    };

    Game_Enemy.prototype.isCalm = function() {
        return !!this.talkData().type && this.talkMood() >= 70 && !this.isEnraged();
    };

    var _Game_Enemy_isActionValid = Game_Enemy.prototype.isActionValid;
    Game_Enemy.prototype.isActionValid = function(action) {
        if (!_Game_Enemy_isActionValid.call(this, action)) return false;
        var skill = $dataSkills[action.skillId];
        if (skill.siMinMood !== null && skill.siMinMood !== undefined && this.talkMood() < skill.siMinMood) return false;
        if (skill.siMaxMood !== null && skill.siMaxMood !== undefined && this.talkMood() > skill.siMaxMood) return false;
        if (this.isCalm() && $.isHostileSkill(skill)) return false;
        return true;
    };

    // An enemy with nothing it is willing to do waits instead of silently skipping.
    var _Game_Enemy_makeActions = Game_Enemy.prototype.makeActions;
    Game_Enemy.prototype.makeActions = function() {
        _Game_Enemy_makeActions.call(this);
        if ($.waitSkillId > 0 && this.numActions() > 0 && !this.action(0).item()) {
            this.action(0).setSkill($.waitSkillId);
        }
    };

    // Insight only comes from talking.
    Game_Troop.prototype.expTotal = function() {
        return 0;
    };

    var _Window_BattleLog_displayActionResults = Window_BattleLog.prototype.displayActionResults;
    Window_BattleLog.prototype.displayActionResults = function(subject, target) {
        _Window_BattleLog_displayActionResults.call(this, subject, target);
        if (target._siTalkMessages && target._siTalkMessages.length > 0) {
            target._siTalkMessages.forEach(function(text) {
                this.push('addText', text);
                this.push('wait');
            }, this);
            target._siTalkMessages = [];
        }
    };

    //-------------------------------------------------------------------------
    // Battle menu
    //-------------------------------------------------------------------------

    var _Window_ActorCommand_addGuardCommand = Window_ActorCommand.prototype.addGuardCommand;
    Window_ActorCommand.prototype.addGuardCommand = function() {
        if (this._actor.addedSkillTypes().indexOf($.stypeId) >= 0) {
            this.addCommand($dataSystem.skillTypes[$.stypeId] || 'Talk', 'talk',
                !this._actor.isSkillTypeSealed($.stypeId));
        }
        _Window_ActorCommand_addGuardCommand.call(this);
    };

    var _Scene_Battle_createActorCommandWindow = Scene_Battle.prototype.createActorCommandWindow;
    Scene_Battle.prototype.createActorCommandWindow = function() {
        _Scene_Battle_createActorCommandWindow.call(this);
        this._actorCommandWindow.setHandler('talk', this.commandTalk.bind(this));
    };

    Scene_Battle.prototype.commandTalk = function() {
        this._siOffering = false;
        this.openSkillList($.stypeId);
    };

    // Offer: choose the item to give before choosing the target.
    var _Scene_Battle_onSkillOk = Scene_Battle.prototype.onSkillOk;
    Scene_Battle.prototype.onSkillOk = function() {
        var skill = this._skillWindow.item();
        if (skill && skill.siApproach === 'offer') {
            BattleManager.inputtingAction().setSkill(skill.id);
            BattleManager.actor().setLastBattleSkill(skill);
            this._siOffering = true;
            this._skillWindow.hide();
            this._itemWindow.refresh();
            this._itemWindow.show();
            this._itemWindow.select(0);
            this._itemWindow.activate();
            return;
        }
        _Scene_Battle_onSkillOk.call(this);
    };

    var _Scene_Battle_onItemOk = Scene_Battle.prototype.onItemOk;
    Scene_Battle.prototype.onItemOk = function() {
        if (this._siOffering) {
            var action = BattleManager.inputtingAction();
            action._siOfferItemId = this._itemWindow.item().id;
            this._itemWindow.hide();
            this.selectEnemySelection();
            return;
        }
        _Scene_Battle_onItemOk.call(this);
    };

    var _Scene_Battle_onItemCancel = Scene_Battle.prototype.onItemCancel;
    Scene_Battle.prototype.onItemCancel = function() {
        if (this._siOffering) {
            this._siOffering = false;
            this._itemWindow.hide();
            this._skillWindow.show();
            this._skillWindow.activate();
            return;
        }
        _Scene_Battle_onItemCancel.call(this);
    };

    // Any regular item can be offered, not only ones usable in battle.
    var _Window_BattleItem_includes = Window_BattleItem.prototype.includes;
    Window_BattleItem.prototype.includes = function(item) {
        var scene = SceneManager._scene;
        if (scene && scene._siOffering) {
            return DataManager.isItem(item) && item.itypeId === 1;
        }
        return _Window_BattleItem_includes.call(this, item);
    };

    var _Window_BattleItem_isEnabled = Window_BattleItem.prototype.isEnabled;
    Window_BattleItem.prototype.isEnabled = function(item) {
        var scene = SceneManager._scene;
        if (scene && scene._siOffering) return !!item;
        return _Window_BattleItem_isEnabled.call(this, item);
    };

    // Cancelling target selection returns to the Talk (or Offer item) list.
    var _Scene_Battle_onEnemyCancel = Scene_Battle.prototype.onEnemyCancel;
    Scene_Battle.prototype.onEnemyCancel = function() {
        if (this._actorCommandWindow.currentSymbol() === 'talk') {
            this._enemyWindow.hide();
            if (this._siOffering) {
                this._itemWindow.show();
                this._itemWindow.activate();
            } else {
                this._skillWindow.show();
                this._skillWindow.activate();
            }
            return;
        }
        _Scene_Battle_onEnemyCancel.call(this);
    };

    var _Scene_Battle_onEnemyOk = Scene_Battle.prototype.onEnemyOk;
    Scene_Battle.prototype.onEnemyOk = function() {
        this._siOffering = false;
        _Scene_Battle_onEnemyOk.call(this);
    };

    // Show the mood next to each enemy while picking who to talk to.
    var _Window_BattleEnemy_drawItem = Window_BattleEnemy.prototype.drawItem;
    Window_BattleEnemy.prototype.drawItem = function(index) {
        var action = BattleManager.inputtingAction();
        var enemy = this._enemies[index];
        if (action && $.isTalkSkill(action.item()) && $.canSeeMood() && enemy.talkData().type) {
            this.resetTextColor();
            var rect = this.itemRectForText(index);
            var mood = enemy.isHunted() ? 'Cornered' : $.moodLevel(enemy.talkMood());
            this.drawText(enemy.name(), rect.x, rect.y, rect.width);
            this.changeTextColor(this.systemColor());
            this.drawText(mood, rect.x, rect.y, rect.width, 'right');
            this.resetTextColor();
            return;
        }
        _Window_BattleEnemy_drawItem.call(this, index);
    };

})(SmokingIsle.Talk);
