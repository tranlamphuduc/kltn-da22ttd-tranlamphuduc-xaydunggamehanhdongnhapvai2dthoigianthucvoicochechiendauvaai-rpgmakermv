//=============================================================================
// QSprite_AutoInit.js
// Auto-initialize QSprite for all % characters
//=============================================================================

/*:
 * @plugindesc Auto-initialize QSprite for all events with % character names
 * @author YourName
 * 
 * @help
 * This plugin automatically initializes QSprite for all events that use
 * % character names, including enemies and regular events.
 * 
 * Place this plugin BELOW QSprite in the plugin list.
 */

(function() {
    'use strict';
    
    // Hook into Game_Event initialization
    var _Game_Event_initialize = Game_Event.prototype.initialize;
    Game_Event.prototype.initialize = function(mapId, eventId) {
        _Game_Event_initialize.call(this, mapId, eventId);
        this.initQSpriteIfNeeded();
    };
    
    // Auto-init QSprite for % characters
    Game_Event.prototype.initQSpriteIfNeeded = function() {
        if (!this._characterName) return;
        
        // Check if character name starts with %
        if (this._characterName.charAt(0) === '%') {
            var name = this._characterName.substring(1);
            
            // Check if QSprite config exists for this character
            if (QSprite && QSprite.json && QSprite.json[name]) {
                if (!this._qSprite) {
                    this._qSprite = QSprite.json[name];
                    this._cacheFrames = {};
                    console.log('[QSprite_AutoInit] Loaded QSprite for:', name);
                }
            }
        }
    };
    
    // Also hook into setImage (when character changes)
    var _Game_CharacterBase_setImage = Game_CharacterBase.prototype.setImage;
    Game_CharacterBase.prototype.setImage = function(characterName, characterIndex) {
        _Game_CharacterBase_setImage.call(this, characterName, characterIndex);
        
        if (this instanceof Game_Event) {
            this.initQSpriteIfNeeded();
        }
    };
    
    // Hook into QABS battler death
    if (typeof Game_CharacterBase.prototype.battler === 'function') {
        var _Game_CharacterBase_battler_die = Game_Battler.prototype.die;
        Game_Battler.prototype.die = function() {
            _Game_Battler_die.call(this);
            
            // Find the character associated with this battler
            if (this._charaId !== undefined) {
                var chara = $gameMap.event(this._charaId);
                if (chara && chara.qSprite && chara.qSprite()) {
                    // Lock and set die pose immediately
                    chara._locked = true;
                    chara._walkAnime = false;
                    chara._stepAnime = false;
                    chara._directionFix = true;
                    chara.playPose('die', true);
                    
                    console.log('[QSprite_AutoInit] Locked die pose for event:', chara._eventId);
                }
            }
        };
    }
    
    // Also check on page refresh for events with Self Switch D
    var _Game_Event_refresh = Game_Event.prototype.refresh;
    Game_Event.prototype.refresh = function() {
        _Game_Event_refresh.call(this);
        
        // After page refresh, check if died (Self Switch D)
        var key = [this._mapId, this._eventId, 'D'];
        if ($gameSelfSwitches && $gameSelfSwitches.value(key)) {
            if (this.qSprite && this.qSprite()) {
                // Force lock pose on page 2
                var self = this;
                setTimeout(function() {
                    self._locked = true;
                    self._walkAnime = false;
                    self._stepAnime = false;
                    self._directionFix = true;
                    self.playPose('die', true);
                }, 10);
            }
        }
    };
    
})();
