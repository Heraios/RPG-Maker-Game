//=============================================================================
// SI_Placeholders.js
//=============================================================================

/*:
 * @plugindesc Smoking Isle: keeps the game running while art and sound are
 * being replaced. Missing files become invisible/silent stand-ins.
 * @author Smoking Isle
 *
 * @param Image Name Fixes
 * @desc The engine's fixed image names mapped to your files:
 * folder/EngineName=YourName, separated by commas.
 * @default system/IconSet=Iconset, system/Balloon=balloon, system/Shadow1=Shadow
 *
 * @help
 * Place right after Community_Basic.
 *
 * - An image that fails to load becomes a transparent 1x1 stand-in instead
 *   of stopping the game with "Failed to load". A sound that fails to load
 *   is skipped. Each missing file is reported once in the console (press
 *   F8 in a test play to see it).
 * - Image Name Fixes: RPG Maker always loads some system images by fixed
 *   names (IconSet, Balloon, Shadow1, States, Weapons1-3...). If your files
 *   are named differently, map them here. Remove an entry once the file is
 *   renamed to the engine's name.
 *
 * Script: SmokingIsle.Placeholders.missing   list of files reported missing
 */

var Imported = Imported || {};
Imported.SI_Placeholders = true;

var SmokingIsle = SmokingIsle || {};
SmokingIsle.Placeholders = SmokingIsle.Placeholders || {};

(function($) {
    'use strict';

    var params = PluginManager.parameters('SI_Placeholders');
    $.nameFixes = {};
    String(params['Image Name Fixes'] || '').split(',').forEach(function(pair) {
        var parts = pair.split('=');
        if (parts.length === 2) $.nameFixes[parts[0].trim()] = parts[1].trim();
    });
    $.missing = [];
    $.TRANSPARENT = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    $.report = function(url) {
        if ($.missing.indexOf(url) >= 0) return;
        $.missing.push(url);
        console.warn('[Smoking Isle] Missing file (using a placeholder): ' + url);
    };

    // img/folder/EngineName.png -> img/folder/YourName.png (every way images are loaded).
    $.fixPath = function(path) {
        var m = /^img\/(.+)\/([^\/]+)\.png$/.exec(String(path));
        if (!m) return path;
        var fix = $.nameFixes[m[1] + '/' + decodeURIComponent(m[2])];
        return fix ? 'img/' + m[1] + '/' + encodeURIComponent(fix) + '.png' : path;
    };

    ['loadNormalBitmap', 'reserveNormalBitmap', 'requestNormalBitmap'].forEach(function(name) {
        var original = ImageManager[name];
        ImageManager[name] = function(path) {
            var args = Array.prototype.slice.call(arguments);
            args[0] = $.fixPath(path);
            return original.apply(this, args);
        };
    });

    // A failed image load swaps in a transparent pixel, which then "loads".
    var _Bitmap_requestImage = Bitmap.prototype._requestImage;
    Bitmap.prototype._requestImage = function(url) {
        _Bitmap_requestImage.call(this, url);
        var image = this._image, bitmap = this;
        if (!image || this._loadingState !== 'requesting' || url.indexOf('data:') === 0) return;
        image.removeEventListener('error', this._errorListener);
        this._loader = null;
        image.addEventListener('error', this._errorListener = function() {
            image.removeEventListener('error', bitmap._errorListener);
            $.report(url);
            image.src = $.TRANSPARENT;
        });
    };

    // Missing sounds: skip them instead of stopping the game.
    AudioManager.checkWebAudioError = function(webAudio) {
        if (webAudio && webAudio.isError()) $.report(webAudio.url);
    };

})(SmokingIsle.Placeholders);
