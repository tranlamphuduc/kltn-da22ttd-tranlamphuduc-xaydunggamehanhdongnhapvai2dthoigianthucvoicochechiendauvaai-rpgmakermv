//=============================================================================
// FixVersionId.js
// Fix for versionId and QABS save/load crash
//=============================================================================

/*:
 * @plugindesc CRITICAL FIX for QABS save/load - MUST BE LAST PLUGIN
 * @author KiroAssistant
 * 
 * @help
 * This plugin MUST be placed LAST in the plugin list to work properly.
 * It fixes the "$gameSystem.versionId is not a function" and similar errors.
 * 
 * This is a known issue with QABS - functions get serialized as properties
 * during save/load, breaking the game.
 */

(function() {
    'use strict';
    
    console.log('FixVersionId: Starting critical save/load fix...');
    
    // =========================================================================
    // FIX 1: DataManager - Clean up serialized functions on save/load
    // =========================================================================
    
    var _DataManager_makeSaveContents = DataManager.makeSaveContents;
    var _DataManager_extractSaveContents = DataManager.extractSaveContents;
    
    // Helper: restore prototype functions for any game object
    function restorePrototypeFunctions(obj, proto) {
        if (!obj || !proto) return 0;
        var count = 0;
        for (var key in proto) {
            if (typeof proto[key] === 'function' && obj.hasOwnProperty(key)) {
                try {
                    delete obj[key];
                    count++;
                } catch (e) {
                    console.warn('FixVersionId: Could not delete ' + key + ' from object');
                }
            }
        }
        return count;
    }
    
    // Override makeSaveContents to save function references properly
    DataManager.makeSaveContents = function() {
        var contents = _DataManager_makeSaveContents.call(this);
        
        // Store a marker to identify saves made with this fix
        if (contents.system) {
            contents.system._fixVersionIdApplied = true;
        }
        
        return contents;
    };
    
    // Override extractSaveContents to restore functions from prototype
    DataManager.extractSaveContents = function(contents) {
        _DataManager_extractSaveContents.call(this, contents);
        
        // Fix $gameSystem functions
        if ($gameSystem) {
            var count = restorePrototypeFunctions($gameSystem, Game_System.prototype);
            console.log('FixVersionId: Restored ' + count + ' Game_System functions from prototype');
        }
        
        // Fix $gameMap functions (QABS modifies Game_Map)
        if ($gameMap) {
            var count2 = restorePrototypeFunctions($gameMap, Game_Map.prototype);
            if (count2 > 0) console.log('FixVersionId: Restored ' + count2 + ' Game_Map functions');
        }
        
        // Fix $gamePlayer functions
        if ($gamePlayer) {
            var count3 = restorePrototypeFunctions($gamePlayer, Game_Player.prototype);
            if (count3 > 0) console.log('FixVersionId: Restored ' + count3 + ' Game_Player functions');
        }
    };
    
    // =========================================================================
    // FIX 2: Scene_Load.reloadMapIfUpdated - safe versionId check
    // =========================================================================
    // The crash happens at rpg_scenes.js line ~1784 inside reloadMapIfUpdated
    // because $gameSystem.versionId is saved as a plain value (not function)
    // after deserialization. We patch it to be safe.
    
    var _Scene_Load_onLoadSuccess = Scene_Load.prototype.onLoadSuccess;
    Scene_Load.prototype.onLoadSuccess = function() {
        // Before calling the original, ensure versionId is a function on $gameSystem
        if ($gameSystem && typeof $gameSystem.versionId !== 'function') {
            var savedVersionId = $gameSystem.versionId;
            // Remove the property so prototype function is used
            try {
                delete $gameSystem.versionId;
                console.log('FixVersionId: Patched $gameSystem.versionId before onLoadSuccess');
            } catch (e) {
                // If delete fails, override with a function
                $gameSystem.versionId = function() {
                    return typeof savedVersionId === 'number' ? savedVersionId : $dataSystem.versionId;
                };
                console.log('FixVersionId: Replaced $gameSystem.versionId with function');
            }
        }
        
        _Scene_Load_onLoadSuccess.call(this);
    };
    
    // Also patch reloadMapIfUpdated directly for extra safety
    var _Scene_Load_reloadMapIfUpdated = Scene_Load.prototype.reloadMapIfUpdated;
    if (_Scene_Load_reloadMapIfUpdated) {
        Scene_Load.prototype.reloadMapIfUpdated = function() {
            try {
                // Ensure versionId is callable
                if ($gameSystem && typeof $gameSystem.versionId !== 'function') {
                    delete $gameSystem.versionId;
                }
                _Scene_Load_reloadMapIfUpdated.call(this);
            } catch (e) {
                console.warn('FixVersionId: reloadMapIfUpdated error caught and suppressed:', e.message);
                // Fallback: just reload the map without version check
                if ($gamePlayer) {
                    $gamePlayer.reserveTransfer(
                        $gameMap.mapId(),
                        $gamePlayer.x,
                        $gamePlayer.y,
                        $gamePlayer.direction(),
                        0
                    );
                }
            }
        };
    }
    
    console.log('FixVersionId plugin loaded successfully');
    
})();
