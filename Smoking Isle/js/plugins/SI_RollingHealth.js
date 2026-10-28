//=============================================================================
// SI_RollingHealth.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: EarthBound-style rolling Health for the party.
 * @author Smoking Isle
 *
 * @param Roll Seconds
 * @type number
 * @desc Seconds the Health counter takes to roll from full to nothing.
 * @default 15
 *
 * @help
 * Place after SI_Ailments and SI_TurnOrder, before SI_BattleHud.
 *
 * In battle, damage to the party doesn't land all at once: the Health
 * counter rolls down towards it. A fighter only falls when the counter
 * reaches 0, so a quick heal can save someone who took a mortal blow.
 * Healing rolls the counter up (twice as fast).
 *
 * - The counter keeps rolling while you choose commands, and pauses while
 *   a message is on screen.
 * - Win (or run) before it reaches 0 and the rest of the damage is
 *   forgotten; healing still owed lands at once.
 * - Enemies take their damage at once, as before.
 * - Options > Rolling Health: ON / OFF (OFF takes damage at once).
 *
 * For other plugins: battler.hpTarget() is where the counter is heading.
 */

var Imported = Imported || {};
Imported.SI_RollingHealth = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.RollingHealth = SmokingIsle.RollingHealth || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_RollingHealth');
    $.seconds = Number(params['Roll Seconds'] || 15);

    $.isOn = function() {
        return ConfigManager.rollingHealth !== false;
    };

    $.rolls = function(battler) {
        return $.isOn() && battler.isActor() && $gameParty.inBattle();
    };

    //-------------------------------------------------------------------------
    // The counter
    //-------------------------------------------------------------------------

    Game_BattlerBase.prototype.hpRoll = function() {
        return this._siRoll || 0;
    };

    Game_BattlerBase.prototype.hpTarget = function() {
        return this.hp + this.hpRoll();
    };

    Game_BattlerBase.prototype.clearHpRoll = function() {
        this._siRoll = 0;
        this._siRollCarry = 0;
    };

    var _Game_Battler_gainHp = Game_Battler.prototype.gainHp;
    Game_Battler.prototype.gainHp = function(value) {
        if (!$.rolls(this) || this.isDead() || !value) return _Game_Battler_gainHp.call(this, value);
        this._result.hpDamage = -value;
        this._result.hpAffected = true;
        var target = (this.hpTarget() + value).clamp(0, this.mhp);
        this._siRoll = target - this.hp;
    };

    // Called every frame in battle. Returns true if the battler just fell.
    Game_Battler.prototype.updateHpRoll = function() {
        var roll = this.hpRoll();
        if (!roll) return false;
        if (this.isDead()) {
            this.clearHpRoll();
            return false;
        }
        var rate = this.mhp / ($.seconds * 60) * (roll > 0 ? 2 : 1);
        this._siRollCarry = (this._siRollCarry || 0) + rate;
        var step = Math.floor(this._siRollCarry);
        if (step < 1) return false;
        this._siRollCarry -= step;
        step = Math.min(step, Math.abs(roll));
        var delta = roll > 0 ? step : -step;
        this._siRoll = roll - delta;
        this.setHp(this.hp + delta);
        if (this.hp <= 0 || this.isDead()) {
            this.clearHpRoll();
            return this.isDead();
        }
        return false;
    };

    // A battler who dies, revives or is fully healed by other means starts afresh.
    ['die', 'revive', 'recoverAll'].forEach(function(name) {
        var original = Game_BattlerBase.prototype[name];
        Game_BattlerBase.prototype[name] = function() {
            this.clearHpRoll();
            return original.apply(this, arguments);
        };
    });

    // Game_Actor's own (other plugins wrap the actor version).
    var _Game_Actor_onBattleEnd = Game_Actor.prototype.onBattleEnd;
    Game_Actor.prototype.onBattleEnd = function() {
        var owed = this.hpRoll();
        this.clearHpRoll();
        if (owed > 0 && this.isAlive()) this.setHp(this.hp + owed);
        _Game_Actor_onBattleEnd.call(this);
    };

    var _Game_Actor_onBattleStart = Game_Actor.prototype.onBattleStart;
    Game_Actor.prototype.onBattleStart = function() {
        this.clearHpRoll();
        _Game_Actor_onBattleStart.call(this);
    };

    //-------------------------------------------------------------------------
    // Rolling in battle
    //-------------------------------------------------------------------------

    $.isPaused = function() {
        return $gameMessage.isBusy() || BattleManager.isBattleEnd() || BattleManager.isAborting() ||
            BattleManager._phase === 'init' || BattleManager._phase === 'start';
    };

    $.update = function(scene) {
        if ($.isPaused()) return;
        var fallen = $gameParty.battleMembers().filter(function(actor) {
            return actor.updateHpRoll();
        });
        if (fallen.length) $.onFallen(scene, fallen);
    };

    $.onFallen = function(scene, fallen) {
        var log = BattleManager._logWindow;
        fallen.forEach(function(actor) {
            actor.performCollapse();
            var state = $dataStates[actor.deathStateId()];
            if (log && state && state.message1) log.push('addText', actor.name() + state.message1);
        });
        BattleManager.refreshStatus();
        // The one choosing a command fell: their turn is over.
        var choosing = BattleManager.isInputting() ? BattleManager.actor() : null;
        if (choosing && fallen.indexOf(choosing) >= 0) {
            choosing.clearActions();
            $.closeInputWindows(scene);
            BattleManager.startTurn();
        }
        if ($gameParty.isAllDead() && BattleManager.isInputting()) {
            $.closeInputWindows(scene);
            BattleManager.checkBattleEnd();
        }
    };

    $.closeInputWindows = function(scene) {
        ['_partyCommandWindow', '_actorCommandWindow', '_skillTypeWindow', '_tacticsWindow', '_skillWindow',
            '_itemWindow', '_actorWindow', '_enemyWindow', '_swapWindow', '_reserveWindow'].forEach(function(name) {
            var w = scene[name];
            if (!w) return;
            w.deactivate();
            if (name === '_actorCommandWindow' || name === '_partyCommandWindow') w.close();
            else w.hide();
        });
        if (scene._helpWindow) scene._helpWindow.hide();
    };

    var _Scene_Battle_update = Scene_Battle.prototype.update;
    Scene_Battle.prototype.update = function() {
        $.update(this);
        _Scene_Battle_update.call(this);
    };

    //-------------------------------------------------------------------------
    // Options: Rolling Health
    //-------------------------------------------------------------------------

    ConfigManager.rollingHealth = true;

    var _ConfigManager_makeData = ConfigManager.makeData;
    ConfigManager.makeData = function() {
        var config = _ConfigManager_makeData.call(this);
        config.rollingHealth = this.rollingHealth;
        return config;
    };

    var _ConfigManager_applyData = ConfigManager.applyData;
    ConfigManager.applyData = function(config) {
        _ConfigManager_applyData.call(this, config);
        this.rollingHealth = config.rollingHealth !== false;
    };

    var _Window_Options_addGeneralOptions = Window_Options.prototype.addGeneralOptions;
    Window_Options.prototype.addGeneralOptions = function() {
        _Window_Options_addGeneralOptions.call(this);
        this.addCommand('Rolling Health', 'rollingHealth');
    };

})(SmokingIsle.RollingHealth);
