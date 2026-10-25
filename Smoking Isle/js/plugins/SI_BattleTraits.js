//=============================================================================
// SI_BattleTraits.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: character-specific battle rules (adult protection, Tou's revival, sparing children).
 * @author Smoking Isle
 *
 * @param Protection Threshold
 * @desc A child at or below this share of max HP can be protected (0.3 = 30%).
 * @default 0.3
 *
 * @param Revival Message
 * @desc Shown when a remote body revives. %1 = name.
 * @default %1's body stirs back to life!
 *
 * @help
 * Requires SI_TurnOrder (place below it).
 *
 * ============================================================================
 * Adult protection
 * ============================================================================
 * Actor note (on the adult):
 *   <Protects: 2:100, 3:80>     actor id : % chance
 *
 * When an enemy's single-target attack would hit a protected child who is
 * at or below the Protection Threshold of their max HP, a protecting adult
 * in the battle party may take the hit instead (MV's "X protected Y!"
 * message). The adult must be able to move. Adults are tried from the
 * highest chance down; only one protects per hit.
 *
 * ============================================================================
 * Sparing children
 * ============================================================================
 * Actor note:   <Child>             counts as a child for these rules.
 * Enemy note:   <Targets Weakest>   single-target attacks go for whoever has
 *                                   the lowest share of Health left (vultures)
 * Enemy note:   <Stings: Venom 30>  hitting it with a physical attack may give
 *                                   the attacker that state (30%; their
 *                                   resistance applies) (jellyfish)
 * Enemy note:   <Spares Children>   won't use harmful actions on children
 *                                   unless it is Enraged (SI_Talk). With only
 *                                   children left, it uses non-harmful
 *                                   actions (talk, waiting) instead.
 *
 * ============================================================================
 * Remote body (Tou)
 * ============================================================================
 * Actor note:
 *   <Remote Body: 2, 50>   When knocked out in battle, revives after 2 turns
 *                          (anyone's turns) at 50% HP with Fatigue reset.
 */

var Imported = Imported || {};
Imported.SI_BattleTraits = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.BattleTraits = SmokingIsle.BattleTraits || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_BattleTraits');
    $.threshold = Number(params['Protection Threshold'] || 0.3);
    $.revivalMessage = String(params['Revival Message'] || '%1\'s body stirs back to life!');

    //-------------------------------------------------------------------------
    // Adult protection
    //-------------------------------------------------------------------------

    Game_Actor.prototype.protectChances = function() {
        var m = /<Protects:\s*([^>]*)>/i.exec(this.actor().note);
        var result = {};
        if (m) {
            m[1].split(',').forEach(function(pair) {
                var p = pair.split(':');
                var id = Number(p[0]);
                if (id > 0) result[id] = Number(p[1] || 100);
            });
        }
        return result;
    };

    $.findProtector = function(target, action) {
        if (!target.isActor() || !action.subject().isEnemy() || !action.isForOne()) return null;
        if (!action.isDamage() || target.hpRate() > $.threshold) return null;
        var candidates = $gameParty.battleMembers().filter(function(actor) {
            return actor !== target && actor.isAlive() && actor.canMove() &&
                actor.protectChances()[target.actorId()] > 0;
        }).sort(function(a, b) {
            return b.protectChances()[target.actorId()] - a.protectChances()[target.actorId()];
        });
        for (var i = 0; i < candidates.length; i++) {
            if (Math.random() * 100 < candidates[i].protectChances()[target.actorId()]) {
                return candidates[i];
            }
        }
        return null;
    };

    var _BattleManager_applySubstitute = BattleManager.applySubstitute;
    BattleManager.applySubstitute = function(target) {
        var protector = $.findProtector(target, this._action);
        if (protector) {
            this._logWindow.displaySubstitute(protector, target);
            return protector;
        }
        return _BattleManager_applySubstitute.call(this, target);
    };

    //-------------------------------------------------------------------------
    // Sparing children
    //-------------------------------------------------------------------------

    Game_Actor.prototype.isChild = function() {
        return /<Child>/i.test(this.actor().note);
    };

    Game_Enemy.prototype.sparesChildren = function() {
        if (!/<Spares Children>/i.test(this.enemy().note)) return false;
        return !(this.isEnraged && this.isEnraged());
    };

    $.spareablePool = function(unit) {
        return unit.aliveMembers().filter(function(member) {
            return !(member.isActor() && member.isChild());
        });
    };

    $.isHarmful = function(item) {
        return SmokingIsle.Talk ? SmokingIsle.Talk.isHostileSkill(item)
                                : !!item && [1, 2, 5, 6].indexOf(item.damage.type) >= 0;
    };

    var _Game_Enemy_isActionValid = Game_Enemy.prototype.isActionValid;
    Game_Enemy.prototype.isActionValid = function(action) {
        if (!_Game_Enemy_isActionValid.call(this, action)) return false;
        var skill = $dataSkills[action.skillId];
        if (this.sparesChildren() && $.isHarmful(skill) &&
                $.spareablePool(this.opponentsUnit()).length === 0) {
            return false;
        }
        return true;
    };

    $.pickByTgr = function(pool) {
        var sum = pool.reduce(function(r, m) { return r + m.tgr; }, 0);
        var roll = Math.random() * sum;
        for (var i = 0; i < pool.length; i++) {
            roll -= pool[i].tgr;
            if (roll <= 0) return pool[i];
        }
        return pool[pool.length - 1];
    };

    var _Game_Action_targetsForOpponents = Game_Action.prototype.targetsForOpponents;
    Game_Action.prototype.targetsForOpponents = function() {
        var subject = this.subject();
        if (!subject.isEnemy() || !subject.sparesChildren() || !$.isHarmful(this.item())) {
            return _Game_Action_targetsForOpponents.call(this);
        }
        var pool = $.spareablePool(this.opponentsUnit());
        if (pool.length === 0) return [];
        if (this.isForRandom()) {
            var targets = [];
            for (var i = 0; i < this.numTargets(); i++) targets.push($.pickByTgr(pool));
            return targets;
        }
        if (this.isForOne()) return [$.pickByTgr(pool)];
        return pool;
    };

    // <Targets Weakest> (enemy note): single-target attacks go for the party member with the
    // lowest share of Health left (vultures).
    var _Game_Action_targetsForOpponents_weakest = Game_Action.prototype.targetsForOpponents;
    Game_Action.prototype.targetsForOpponents = function() {
        var targets = _Game_Action_targetsForOpponents_weakest.call(this);
        var subject = this.subject();
        if (!subject.isEnemy() || !this.isForOne() || this.isForRandom() || targets.length !== 1 ||
            !/<Targets Weakest>/i.test(subject.enemy().note)) return targets;
        var below = SmokingIsle.Ailments ? SmokingIsle.Ailments.stateByName('Dragged Below') : 0;
        var pool = subject.sparesChildren() && $.isHarmful(this.item()) ? $.spareablePool(this.opponentsUnit()) : this.opponentsUnit().aliveMembers();
        pool = pool.filter(function(m) { return !m.isStateAffected(below); });
        return pool.length ? [pool.reduce(function(a, b) { return b.hpRate() < a.hpRate() ? b : a; })] : targets;
    };

    // <Stings: Venom 30> (enemy note): a physical hit on it may give the attacker that state (jellyfish).
    var _Game_Action_apply_stings = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _Game_Action_apply_stings.call(this, target);
        var subject = this.subject();
        var m = target.isEnemy() && /<Stings:\s*(.+?)\s+(\d+)>/i.exec(target.enemy().note);
        if (!m || !this.isPhysical() || !target.result().isHit() || !subject.isActor() || !subject.isAlive()) return;
        var stateId = SmokingIsle.Ailments ? SmokingIsle.Ailments.stateByName(m[1]) : 0;
        if (!stateId || subject.isStateAffected(stateId) || Math.random() >= Number(m[2]) / 100 * subject.stateRate(stateId) || subject.isStateResist(stateId)) return;
        subject.addState(stateId);
        target._siCommandMessages = (target._siCommandMessages || []).concat(['%1 is stung! (%2)'.format(subject.name(), $dataStates[stateId].name)]);
    };

    //-------------------------------------------------------------------------
    // Remote body (Tou)
    //-------------------------------------------------------------------------

    Game_Actor.prototype.remoteBody = function() {
        var m = /<Remote Body:\s*(\d+)\s*,\s*(\d+)>/i.exec(this.actor().note);
        return m ? { turns: Number(m[1]), hpRate: Number(m[2]) / 100 } : null;
    };

    var _Game_Actor_die = Game_Actor.prototype.die;
    Game_Actor.prototype.die = function() {
        _Game_Actor_die.call(this);
        var remote = this.remoteBody();
        this._siReviveIn = remote && $gameParty.inBattle() ? remote.turns : 0;
    };

    var _Game_Battler_onBattleEnd = Game_Battler.prototype.onBattleEnd;
    Game_Battler.prototype.onBattleEnd = function() {
        _Game_Battler_onBattleEnd.call(this);
        this._siReviveIn = 0;
    };

    // Counts down after every battler's turn.
    var _BattleManager_endTurn = BattleManager.endTurn;
    BattleManager.endTurn = function() {
        _BattleManager_endTurn.call(this);
        $gameParty.battleMembers().forEach(function(actor) {
            if (!actor._siReviveIn || !actor.isDead()) return;
            actor._siReviveIn--;
            if (actor._siReviveIn <= 0) {
                var remote = actor.remoteBody();
                actor.removeState(actor.deathStateId());
                actor.setHp(Math.max(Math.floor(actor.mhp * remote.hpRate), 1));
                actor.setTp(0);
                this._logWindow.push('addText', $.revivalMessage.format(actor.name()));
                this._logWindow.push('wait');
                this.refreshStatus();
            }
        }, this);
    };

})(SmokingIsle.BattleTraits);
