//=============================================================================
// SI_Yoon.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: Yoon's gender (boy, girl or the priestly third
 * gender), pronoun text codes, and its flavor and small effects.
 * @author Smoking Isle
 *
 * @param Gender Variable
 * @type variable
 * @desc Variable holding Yoon's gender: 1 boy, 2 girl, 3 third gender.
 * 0 (not chosen yet) counts as third gender (they/them).
 * @default 4
 *
 * @param Yoon Actors
 * @desc Actor ids that are Yoon (the Ghost and Human Yoon).
 * @default 1, 2
 *
 * @param Passive States
 * @desc State ids always on Yoon, by gender: boy, girl, third gender.
 * @default 210, 211, 212
 *
 * @param Boy Look
 * @desc Human Yoon's look as a boy: character file, index, face file, index.
 * Leave empty to keep the database look.
 * @default
 *
 * @param Girl Look
 * @desc Human Yoon's look as a girl: character file, index, face file, index.
 * @default
 *
 * @param Third Look
 * @desc Human Yoon's look as third gender: character file, index, face
 * file, index.
 * @default
 *
 * @help
 * Place after SI_Talk.
 *
 * ============================================================================
 * Choosing
 * ============================================================================
 * The "Choose Yoon" common event asks once at the start of the game. Script
 * call: SmokingIsle.Yoon.setGender(2)   (1 boy, 2 girl, 3 third gender)
 * It sets the Gender Variable and Human Yoon's look. Event conditions can
 * use the variable directly.
 *
 * ============================================================================
 * Text codes (Show Text, choices, Talk lines, item descriptions...)
 * ============================================================================
 *   \YP[they]        he / she / they     (write the "they" form)
 *   \YP[them]        him / her / them
 *   \YP[their]       his / her / their
 *   \YP[theirs]      his / hers / theirs
 *   \YP[themself]    himself / herself / themself
 *   \YP[they're]     he's / she's / they're   (also they've, they'll, they'd)
 *   \YP[They]        a capital letter in the code gives a capital in the text
 *   \YV[are|is]      verb agreement: the first for they, the second for
 *                    he and she ("\YP[they] \YV[are|is] back", "\YV[were|was]",
 *                    "\YV[have|has]", "\YV[go|goes]")
 *   \YG[boy|girl|third]   any words by gender: "\YG[son|daughter|child]"
 *
 * Sib is always they/them: write it plainly. Use \N[2] for Yoon's name and
 * \N[n] for anyone the player may have renamed.
 *
 * ============================================================================
 * Flavor and small effects (SmokingIsle.Yoon)
 * ============================================================================
 *   expectedJob()    'hunter' / 'herbalist' / 'priest' (what the village
 *                    expected Yoon to grow up to be)
 *   closerParent()   'Pada' / 'Mada' / 'both'
 *   isBoy(), isGirl(), isThird()
 * Each gender keeps one passive state on Yoon (Passive States): its traits
 * and note tags (e.g. <Talk Bonus: stalk 20>) apply, but it shows no icon
 * and can't be removed.
 */

var Imported = Imported || {};
Imported.SI_Yoon = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Yoon = SmokingIsle.Yoon || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_Yoon');
    var list = function(s) { return String(s || '').split(',').map(function(x) { return x.trim(); }).filter(Boolean); };
    $.variable = Number(params['Gender Variable'] || 4);
    $.actorIds = list(params['Yoon Actors'] || '1, 2').map(Number);
    $.passiveStates = list(params['Passive States'] || '210, 211, 212').map(Number);
    $.looks = [null, list(params['Boy Look']), list(params['Girl Look']), list(params['Third Look'])];

    $.BOY = 1; $.GIRL = 2; $.THIRD = 3;

    $.gender = function() {
        var g = $gameVariables ? $gameVariables.value($.variable) : 0;
        return g === $.BOY || g === $.GIRL ? g : $.THIRD;
    };
    $.isBoy = function() { return $.gender() === $.BOY; };
    $.isGirl = function() { return $.gender() === $.GIRL; };
    $.isThird = function() { return $.gender() === $.THIRD; };
    $.pick = function(boy, girl, third) { return [null, boy, girl, third][$.gender()]; };

    $.expectedJob = function() { return $.pick('hunter', 'herbalist', 'priest'); };
    $.closerParent = function() { return $.pick('Pada', 'Mada', 'both'); };

    $.setGender = function(g) {
        $gameVariables.setValue($.variable, g);
        var look = $.looks[g] || [];
        if (look.length >= 4) {
            var yoon = $gameActors.actor($.actorIds[$.actorIds.length - 1]);
            yoon.setCharacterImage(look[0], Number(look[1]));
            yoon.setFaceImage(look[2], Number(look[3]));
            $gamePlayer.refresh();
        }
    };

    //-------------------------------------------------------------------------
    // Pronouns
    //-------------------------------------------------------------------------

    $.PRONOUNS = {
        "they":       ['he', 'she', 'they'],
        "them":       ['him', 'her', 'them'],
        "their":      ['his', 'her', 'their'],
        "theirs":     ['his', 'hers', 'theirs'],
        "themself":   ['himself', 'herself', 'themself'],
        "themselves": ['himself', 'herself', 'themself'],
        "they're":    ["he's", "she's", "they're"],
        "they've":    ["he's", "she's", "they've"],
        "they'll":    ["he'll", "she'll", "they'll"],
        "they'd":     ["he'd", "she'd", "they'd"]
    };

    $.pronoun = function(word) {
        var forms = $.PRONOUNS[String(word).toLowerCase().replace('’', "'")];
        if (!forms) return word;
        var out = forms[$.gender() - 1];
        return /^[A-Z]/.test(word) ? out.charAt(0).toUpperCase() + out.slice(1) : out;
    };

    $.convert = function(text) {
        return text
            .replace(/\x1bYP\[([^\]]+)\]/gi, function(m, w) { return $.pronoun(w); })
            .replace(/\x1bYV\[([^\]|]*)\|([^\]]*)\]/gi, function(m, they, other) { return $.isThird() ? they : other; })
            .replace(/\x1bYG\[([^\]|]*)\|([^\]|]*)\|([^\]]*)\]/gi, function(m, boy, girl, third) { return $.pick(boy, girl, third); });
    };

    var _Window_Base_convertEscapeCharacters = Window_Base.prototype.convertEscapeCharacters;
    Window_Base.prototype.convertEscapeCharacters = function(text) {
        text = _Window_Base_convertEscapeCharacters.call(this, text);
        return $.convert(text);
    };

    //-------------------------------------------------------------------------
    // The passive state
    //-------------------------------------------------------------------------

    $.passiveState = function() {
        return $dataStates[$.passiveStates[$.gender() - 1]] || null;
    };

    var _Game_Actor_states = Game_Actor.prototype.states;
    Game_Actor.prototype.states = function() {
        var states = _Game_Actor_states.call(this);
        var passive = $.actorIds.indexOf(this.actorId()) >= 0 ? $.passiveState() : null;
        return passive ? states.concat([passive]) : states;
    };

})(SmokingIsle.Yoon);
