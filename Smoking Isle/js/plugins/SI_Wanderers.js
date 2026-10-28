//=============================================================================
// SI_Wanderers.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: enemies you can see on the map. They wander,
 * spot you, chase you, run from a party far stronger, and fight on contact.
 * @author Smoking Isle
 *
 * @param Wander Speed
 * @type number
 * @default 3
 *
 * @param Chase Speed
 * @type number
 * @default 4
 *
 * @param Flee Speed
 * @type number
 * @desc Faster than the party (4), so catching one takes cornering.
 * @default 5
 *
 * @param Default Sight
 * @type number
 * @desc Tiles a wanderer can see in front of it, unless <Sight: n>.
 * @default 5
 *
 * @param Leash
 * @type number
 * @desc A chaser gives up once it is this many tiles from where it started.
 * @default 8
 *
 * @param Weak Rounds
 * @desc A troop is weak if the party would beat it within this many rounds...
 * @default 1
 *
 * @param Weak Loss
 * @desc ...losing at most this % of the party's total max Health.
 * @default 10
 *
 * @param Grace Frames
 * @type number
 * @desc After an escape or a loss, the wanderer leaves the party alone this long.
 * @default 120
 *
 * @param Defeat Common Event
 * @type common_event
 * @desc Run after losing to a wanderer. 0 = the usual Game Over.
 * @default 0
 *
 * @help
 * Place after SI_Time and SI_CombatCore.
 *
 * Make an event with the enemy's sprite (any trigger, any movement; the
 * plugin takes over), and put this in the EVENT's note box:
 *
 *   <Wanderer: 12>    the troop it fights (troop 12)
 *   <Sight: 5>        how many tiles it sees, in a cone in front of it
 *   <Night Only>      only out at night (SI_Time)
 *   <Day Only>        only out by day
 *   <Never Flees>     never runs, however strong the party (bosses, demons)
 *   <Bold>            runs only from a party twice as overwhelming
 *   <Timid>           runs from a party half as overwhelming
 *
 * What it does:
 * - Wanders near where it was placed. When the party steps into its sight
 *   cone it chases them, until it is Leash tiles from its start, then goes
 *   back.
 * - Touching it always starts a battle (Talk happens inside the battle).
 *   Touch it from behind and the party strikes first; if it touches the
 *   party from behind, it strikes first (unless a "Cancel Surprise" item,
 *   like the Copper Bell, is worn).
 * - A troop the party would beat in about a round (Weak Rounds), losing
 *   little Health (Weak Loss), runs away instead, faster than the party. It
 *   can still be caught and fought. Once it gets away, it is gone until the
 *   next day.
 * - Beaten or talked down: gone until the next day. Escaped from, or lost
 *   to: it stays, and leaves the party alone for a moment.
 *
 * The "weak" check uses the real stats (food and gear raise them): the
 * troop's total Health against the party's damage per round, and the
 * troop's damage against the party's Health.
 */

var Imported = Imported || {};
Imported.SI_Wanderers = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Wanderers = SmokingIsle.Wanderers || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_Wanderers');
    $.wanderSpeed = Number(params['Wander Speed'] || 3);
    $.chaseSpeed = Number(params['Chase Speed'] || 4);
    $.fleeSpeed = Number(params['Flee Speed'] || 5);
    $.defaultSight = Number(params['Default Sight'] || 5);
    $.leash = Number(params['Leash'] || 8);
    $.weakRounds = Number(params['Weak Rounds'] || 1);
    $.weakLoss = Number(params['Weak Loss'] || 10);
    $.graceFrames = Number(params['Grace Frames'] || 120);
    $.defeatCommonEvent = Number(params['Defeat Common Event'] || 0);

    //-------------------------------------------------------------------------
    // Who's gone for the day
    //-------------------------------------------------------------------------

    $.day = function() {
        return SmokingIsle.Time ? SmokingIsle.Time.day() : 0;
    };

    $.gone = function() {
        if (!$gameSystem._siWanderers) $gameSystem._siWanderers = {};
        return $gameSystem._siWanderers;
    };

    $.key = function(mapId, eventId) { return mapId + ':' + eventId; };

    //-------------------------------------------------------------------------
    // Is the party far stronger than this troop?
    //-------------------------------------------------------------------------

    $.reduce = function(power, defense) {
        var C = SmokingIsle.Combat;
        return C && C.reduce ? C.reduce(power, defense) : Math.max(power * 2 - defense, 0);
    };

    $.mean = function(list) {
        return list.length ? list.reduce(function(a, b) { return a + b; }, 0) / list.length : 0;
    };

    // How the party would fare: rounds to win, and the share of its Health it would lose.
    $.estimate = function(troopId) {
        var troop = $dataTroops[troopId];
        var enemies = (troop ? troop.members : []).filter(function(m) { return !m.hidden; })
            .map(function(m) { return $dataEnemies[m.enemyId]; }).filter(Boolean);
        var party = $gameParty.battleMembers().filter(function(a) { return a.isAlive(); });
        if (!enemies.length || !party.length) return { rounds: Infinity, loss: 1 };
        var eDef = $.mean(enemies.map(function(e) { return e.params[3]; }));
        var eMdf = $.mean(enemies.map(function(e) { return e.params[5]; }));
        var pDef = $.mean(party.map(function(a) { return a.def; }));
        var partyDamage = party.reduce(function(sum, a) {
            return sum + Math.max($.reduce(a.atk, eDef), $.reduce(a.mat * 1.2, eMdf));
        }, 0);
        var enemyHealth = enemies.reduce(function(sum, e) { return sum + e.params[0]; }, 0);
        var enemyDamage = enemies.reduce(function(sum, e) { return sum + $.reduce(e.params[2], pDef); }, 0);
        var partyHealth = party.reduce(function(sum, a) { return sum + a.mhp; }, 0);
        var rounds = enemyHealth / Math.max(partyDamage, 1);
        return { rounds: rounds, loss: enemyDamage * Math.max(Math.ceil(rounds), 1) / Math.max(partyHealth, 1) };
    };

    $.isWeak = function(troopId, nerve) {
        var est = $.estimate(troopId), f = nerve || 1;
        return est.rounds <= $.weakRounds * f && est.loss * 100 <= $.weakLoss * f;
    };

    //-------------------------------------------------------------------------
    // The wanderer
    //-------------------------------------------------------------------------

    Game_Event.prototype.wanderer = function() {
        if (this._siWanderer === undefined) {
            var note = (this.event() && this.event().note) || '';
            var m = /<Wanderer:\s*(\d+)>/i.exec(note);
            var sight = /<Sight:\s*(\d+)>/i.exec(note);
            this._siWanderer = m ? {
                troopId: Number(m[1]),
                sight: sight ? Number(sight[1]) : $.defaultSight,
                nightOnly: /<Night Only>/i.test(note),
                dayOnly: /<Day Only>/i.test(note),
                neverFlees: /<Never Flees>/i.test(note),
                nerve: /<Bold>/i.test(note) ? 0.5 : /<Timid>/i.test(note) ? 2 : 1,
                homeX: this.event().x, homeY: this.event().y
            } : null;
            this._siMode = 'wander';
            this._siGrace = 0;
        }
        return this._siWanderer;
    };

    Game_Event.prototype.wanderKey = function() {
        return $.key(this._mapId, this._eventId);
    };

    // Gone for today (beaten, talked down or fled), or the wrong time of day.
    Game_Event.prototype.isWanderAway = function() {
        var w = this.wanderer();
        if (!w) return false;
        var day = $.gone()[this.wanderKey()];
        if (day !== undefined && day >= $.day()) return true;
        var night = SmokingIsle.Time && SmokingIsle.Time.isNight ? SmokingIsle.Time.isNight() : false;
        return (w.nightOnly && !night) || (w.dayOnly && night);
    };

    Game_Event.prototype.sendAwayForToday = function() {
        $.gone()[this.wanderKey()] = $.day();
        this._siMode = 'wander';
    };

    Game_Event.prototype.homeDistance = function() {
        var w = this.wanderer();
        return Math.abs(this.x - w.homeX) + Math.abs(this.y - w.homeY);
    };

    // The party is in the cone in front of it, within its sight.
    Game_Event.prototype.canSeeParty = function() {
        var w = this.wanderer(), dx = $gamePlayer.x - this.x, dy = $gamePlayer.y - this.y;
        if (Math.abs(dx) + Math.abs(dy) > w.sight) return false;
        switch (this.direction()) {
        case 2: return dy > 0 && Math.abs(dx) <= dy;
        case 8: return dy < 0 && Math.abs(dx) <= -dy;
        case 4: return dx < 0 && Math.abs(dy) <= -dx;
        case 6: return dx > 0 && Math.abs(dy) <= dx;
        }
        return false;
    };

    Game_Event.prototype.updateWanderMode = function() {
        var w = this.wanderer();
        if (this._siGrace > 0) this._siGrace--;
        if ($gameMap.isEventRunning()) return;
        switch (this._siMode) {
        case 'wander':
            if (this._siGrace <= 0 && this.canSeeParty()) {
                this._siMode = !w.neverFlees && $.isWeak(w.troopId, w.nerve) ? 'flee' : 'chase';
            }
            break;
        case 'chase':
            if (this.homeDistance() > $.leash) this._siMode = 'return';
            break;
        case 'return':
            if (this.homeDistance() <= 1) this._siMode = 'wander';
            break;
        case 'flee':
            var far = Math.abs($gamePlayer.x - this.x) + Math.abs($gamePlayer.y - this.y) > w.sight + 3;
            if (far || !this.isNearTheScreen()) this.sendAwayForToday();
            break;
        }
    };

    var _Game_Event_update = Game_Event.prototype.update;
    Game_Event.prototype.update = function() {
        if (this.wanderer()) {
            var away = this.isWanderAway();
            if (away !== this._siAway) {
                this._siAway = away;
                if (away) { this.setThrough(true); this.setTransparent(true); } else { this.setTransparent(false); if (this.page()) this.setupPageSettings(); }
            }
            if (away) return;
            this.updateWanderMode();
        }
        _Game_Event_update.call(this);
    };

    // A page refresh resets through/transparency; keep a wanderer that's away hidden.
    var _Game_Event_setupPageSettings = Game_Event.prototype.setupPageSettings;
    Game_Event.prototype.setupPageSettings = function() {
        _Game_Event_setupPageSettings.call(this);
        if (this.wanderer()) {
            this._siAway = this.isWanderAway();
            if (this._siAway) { this.setThrough(true); this.setTransparent(true); }
        }
    };

    var _Game_Event_updateSelfMovement = Game_Event.prototype.updateSelfMovement;
    Game_Event.prototype.updateSelfMovement = function() {
        var w = this.wanderer();
        if (!w) return _Game_Event_updateSelfMovement.call(this);
        if (this._locked || this.isMoving()) return;
        var speed = { wander: $.wanderSpeed, chase: $.chaseSpeed, 'return': $.chaseSpeed, flee: $.fleeSpeed }[this._siMode];
        this.setMoveSpeed(speed);
        this.setMoveFrequency(this._siMode === 'wander' ? 3 : 5);
        if (!this.checkStop(this.stopCountThreshold())) return;
        switch (this._siMode) {
        case 'chase':
            this.moveTowardPlayer();
            break;
        case 'flee':
            this.moveAwayFromPlayer();
            break;
        case 'return':
            this.moveStraight(this.findDirectionTo(w.homeX, w.homeY));
            break;
        default:
            if (this.homeDistance() >= Math.ceil($.leash / 2)) this.moveStraight(this.findDirectionTo(w.homeX, w.homeY));
            else this.moveRandom();
        }
    };

    //-------------------------------------------------------------------------
    // Contact
    //-------------------------------------------------------------------------

    var _Game_Event_isTriggerIn = Game_Event.prototype.isTriggerIn;
    Game_Event.prototype.isTriggerIn = function(triggers) {
        if (this.wanderer()) return triggers.contains(1) || triggers.contains(2) || triggers.contains(0);
        return _Game_Event_isTriggerIn.call(this, triggers);
    };

    var _Game_Event_isNormalPriority = Game_Event.prototype.isNormalPriority;
    Game_Event.prototype.isNormalPriority = function() {
        return this.wanderer() ? true : _Game_Event_isNormalPriority.call(this);
    };

    // It walked into the party.
    var _Game_Event_checkEventTriggerTouch = Game_Event.prototype.checkEventTriggerTouch;
    Game_Event.prototype.checkEventTriggerTouch = function(x, y) {
        if (!this.wanderer()) return _Game_Event_checkEventTriggerTouch.call(this, x, y);
        if (!$gameMap.isEventRunning() && $gamePlayer.pos(x, y) && !this.isJumping()) {
            this._siTouchedParty = true;
            this.start();
            this._siTouchedParty = false;
        }
    };

    // The direction from one character to a neighbouring one.
    $.dirTo = function(from, to) {
        var dx = to.x - from.x, dy = to.y - from.y;
        if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 6 : 4;
        return dy > 0 ? 2 : 8;
    };

    $.reverse = function(d) { return 10 - d; };

    var _Game_Event_start = Game_Event.prototype.start;
    Game_Event.prototype.start = function() {
        if (!this.wanderer()) return _Game_Event_start.call(this);
        if (this._siAway || this._siGrace > 0 || $gameMap.isEventRunning() || SceneManager.isSceneChanging()) return;
        var byParty = !this._siTouchedParty;
        // From behind: the toucher stands where the touched one isn't looking.
        var preemptive = byParty && $.dirTo(this, $gamePlayer) === $.reverse(this.direction());
        var surprise = !byParty && $.dirTo($gamePlayer, this) === $.reverse($gamePlayer.direction()) &&
            !$gameParty.hasCancelSurprise();
        $.startBattle(this, preemptive, surprise);
    };

    $.startBattle = function(event, preemptive, surprise) {
        var w = event.wanderer();
        if (!$dataTroops[w.troopId]) return;
        BattleManager.setup(w.troopId, true, $.defeatCommonEvent > 0);
        BattleManager._preemptive = preemptive;
        BattleManager._surprise = surprise;
        BattleManager.setEventCallback(function(result) { $.onBattleEnd(event, result); });
        $gamePlayer.makeEncounterCount();
        SceneManager.push(Scene_Battle);
        $._lastBattle = { troopId: w.troopId, preemptive: preemptive, surprise: surprise };
    };

    // 0 won (or talked down), 1 escaped, 2 lost.
    $.onBattleEnd = function(event, result) {
        if (result === 0) {
            event.sendAwayForToday();
        } else {
            event._siGrace = $.graceFrames;
            event._siMode = 'return';
            if (result === 2 && $.defeatCommonEvent > 0) $gameTemp.reserveCommonEvent($.defeatCommonEvent);
        }
    };

})(SmokingIsle.Wanderers);
