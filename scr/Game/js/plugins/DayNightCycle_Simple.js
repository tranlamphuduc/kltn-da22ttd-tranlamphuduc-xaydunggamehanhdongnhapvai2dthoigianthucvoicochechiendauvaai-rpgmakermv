//=============================================================================
// DayNightCycle_Simple.js
// Hệ thống ngày đêm đơn giản sử dụng Self Switch
//=============================================================================

/*:
 * @plugindesc Hệ thống ngày/đêm với zombie corpse sử dụng Event Pages
 * @author KiroAssistant
 * 
 * @param Cycle Enabled Switch
 * @desc Switch ID để bật/tắt day/night cycle
 * @default 15
 * 
 * @param Time Variable
 * @desc Variable lưu thời gian (0=Sáng, 1=Trưa, 2=Chiều, 3=Hoàng hôn, 4=Tối)
 * @default 11
 * 
 * @param Day Count Variable
 * @desc Variable lưu số ngày đã qua
 * @default 12
 * 
 * @param Map Transition Variable
 * @desc Variable đếm số lần chuyển map trong ngày
 * @default 13
 * 
 * @param Noon to Afternoon Maps
 * @desc Số lần chuyển map từ Trưa sang Chiều
 * @default 4
 * 
 * @param Afternoon to Evening Maps
 * @desc Số lần chuyển map từ Chiều sang Hoàng hôn
 * @default 4
 * 
 * @param Evening to Night Maps
 * @desc Số lần chuyển map từ Hoàng hôn sang Tối
 * @default 2
 * 
 * @param Evening Zombie Boost
 * @desc % tăng stats zombie lúc Hoàng hôn (0.2 = +20%)
 * @default 0.2
 * 
 * @param Night Zombie Boost
 * @desc % tăng stats zombie lúc Tối (0.5 = +50%)
 * @default 0.5
 * 
 * @param Show Time HUD
 * @desc Hiển thị thời gian trên màn hình
 * @default true
 * 
 * @help
 * ============================================================================
 * HƯỚNG DẪN ZOMBIE CORPSE SYSTEM
 * ============================================================================
 * 
 * QUAN TRỌNG: Event Note chỉ có 1 cho cả event (không phải mỗi page).
 * Plugin sẽ tự động skip setup battler cho Page 2 khi Self Switch D = ON.
 * 
 * SETUP ZOMBIE EVENT:
 * 
 * Event Note (chung cho cả event):
 *   <respawnDaily>
 *   <enemy:X>
 * 
 * Page 1 (Zombie sống):
 *   - Conditions: None (hoặc Self Switch D = OFF)
 *   - Image: Zombie character (ví dụ: $Zombie1, index 0)
 *   - Movement: Random hoặc Approach
 *   - Priority: Same as characters
 *   - Through: OFF
 * 
 * Page 2 (Zombie chết/corpse):
 *   - Conditions: Self Switch D = ON
 *   - Image: Corpse character
 *     * Có thể dùng cùng file với Page 1
 *     * Hoặc tạo file riêng cho corpse
 *     * Hoặc dùng QSprite die pose nếu có setup
 *   - Movement: Fixed (không di chuyển)
 *   - Priority: Below characters
 *   - Through: ON
 *   - Direction Fix: ON (để giữ hướng)
 *   - Contents: (empty) - Không cần event commands
 * 
 * CÁCH HOẠT ĐỘNG:
 * 1. Zombie chết → Self Switch D = ON → Chuyển sang Page 2 (giữ hướng)
 * 2. Page 2 = corpse (không di chuyển, đi qua được, KHÔNG có battler)
 * 3. Chuyển map → Corpse vẫn còn (Self Switch D vẫn ON, hướng được restore)
 * 4. Gọi "DayNight endDay" → Self Switch D = OFF → Về Page 1 → Zombie sống
 * 
 * ============================================================================
 * PLUGIN COMMANDS
 * ============================================================================
 * 
 * DayNight startDay
 *   - Bắt đầu ngày mới (Sáng → Trưa)
 *   - Set Variable #11 = 1, Variable #13 = 0
 *   - Dùng khi nói chuyện với NPC để bắt đầu đi
 * 
 * DayNight endDay
 *   - Kết thúc ngày, về Sáng, tăng số ngày
 *   - Set Variable #11 = 0, Variable #13 = 0
 *   - Tăng Variable #12 (day count)
 *   - Reset tất cả Self Switch D về OFF
 *   - Tất cả zombie respawn
 * 
 * DayNight setTime X
 *   - Set thời gian thành X (0=Sáng, 1=Trưa, 2=Chiều, 3=Hoàng hôn, 4=Tối)
 *   - Ví dụ: DayNight setTime 3 (set thành Hoàng hôn)
 * 
 * DayNight addDay
 *   - Tăng số ngày lên 1 (Variable #12)
 * 
 * DayNight respawnAll
 *   - Reset tất cả Self Switch D về OFF
 *   - Tất cả zombie respawn (không tăng ngày)
 * 
 * ============================================================================
 * VARIABLES & SWITCHES
 * ============================================================================
 * 
 * Switch #15: Cycle Enabled Switch
 *   - ON = HUD hiển thị, time tracking active
 *   - OFF = HUD ẩn, không track time
 * 
 * Variable #11: Time Variable (0-4)
 *   - 0 = Sáng (không tự động tăng)
 *   - 1 = Trưa (bắt đầu đếm map transitions)
 *   - 2 = Chiều
 *   - 3 = Hoàng hôn
 *   - 4 = Tối
 * 
 * Variable #12: Day Count Variable
 *   - Số ngày đã qua (bắt đầu từ 0)
 * 
 * Variable #13: Map Transition Variable
 *   - Đếm số lần chuyển map trong ngày
 * 
 * ============================================================================
 * EVENT TAGS
 * ============================================================================
 * 
 * <respawnDaily>
 *   - Zombie respawn mỗi ngày khi gọi endDay
 *   - Hiển thị corpse khi chết (Self Switch D)
 * 
 * <noRespawn>
 *   - Zombie KHÔNG respawn (corpse vĩnh viễn)
 *   - Hiển thị corpse khi chết (Self Switch D)
 *   - Dùng cho Boss zombie hoặc quest zombie
 * 
 * <dailyNPC>
 *   - NPC reset Self Switch A mỗi ngày
 *   - Dùng để tạo NPC cho item/nhiệm vụ hằng ngày
 *   - Setup: Page 1 (A=OFF) cho item, Page 2 (A=ON) nói đã lấy rồi
 * 
 * <respawnLimit:X>
 *   - Item chỉ lấy được X lần mỗi ngày
 *   - Ví dụ: <respawnLimit:3> = lấy tối đa 3 lần/ngày
 *   - Reset khi endDay
 * 
 * <questItem>
 *   - Item nhiệm vụ, không respawn (dành cho tương lai)
 * 
 * ============================================================================
 * AUTO TIME PROGRESSION
 * ============================================================================
 * 
 * Khi Switch #15 = ON và thời gian KHÔNG phải Sáng (0):
 * - Mỗi lần chuyển map → Variable #13 tăng 1
 * - Khi đủ số lần:
 *   - Trưa → Chiều: 4 lần chuyển map
 *   - Chiều → Hoàng hôn: 4 lần
 *   - Hoàng hôn → Tối: 2 lần
 *   - Tối: Tiếp tục đếm nhưng không chuyển time
 * 
 * ZOMBIE STATS BOOST:
 * - Hoàng hôn (time=3): +20% tất cả stats
 * - Tối (time=4): +50% tất cả stats
 * 
 * SCREEN TINT:
 * - Sáng/Trưa/Chiều: Bình thường
 * - Hoàng hôn: Màu cam
 * - Tối: Màu xanh đen
 * 
 * ============================================================================
 */

(function() {
    'use strict';
    
    // ========================
    // Plugin Parameters
    // ========================
    var parameters = PluginManager.parameters('DayNightCycle_Simple');
    var cycleSwitch = Number(parameters['Cycle Enabled Switch'] || 15);
    var timeVar = Number(parameters['Time Variable'] || 11);
    var dayCountVar = Number(parameters['Day Count Variable'] || 12);
    var mapTransitionVar = Number(parameters['Map Transition Variable'] || 13);
    
    var noonMaps = Number(parameters['Noon to Afternoon Maps'] || 4);
    var afternoonMaps = Number(parameters['Afternoon to Evening Maps'] || 4);
    var eveningMaps = Number(parameters['Evening to Night Maps'] || 2);
    
    var eveningBoost = Number(parameters['Evening Zombie Boost'] || 0.2);
    var nightBoost = Number(parameters['Night Zombie Boost'] || 0.5);
    
    var showHUD = String(parameters['Show Time HUD'] || 'true') === 'true';
    
    // Time names
    var timeNames = ['Sáng', 'Trưa', 'Chiều', 'Hoàng hôn', 'Tối'];
    
    // Screen tints for each time
    var screenTints = [
        [0, 0, 0, 0],           // Sáng
        [0, 0, 0, 0],           // Trưa
        [0, 0, 0, 0],           // Chiều
        [68, -34, -68, 0],      // Hoàng hôn - cam
        [-68, -68, 0, 170]      // Tối - xanh đen
    ];
    
    // Calculate current hour
    function getCurrentHour() {
        var currentTime = $gameVariables.value(timeVar);
        var transitions = $gameVariables.value(mapTransitionVar);
        
        if (currentTime === 0) return 8;  // Morning: fixed at 8:00
        
        if (currentTime === 1) {
            // Noon: 9-13h (1 hour per map)
            return 9 + transitions;
        }
        
        if (currentTime === 2) {
            // Afternoon: 13-16h
            return 13 + Math.floor(transitions * 3 / 4);
        }
        
        if (currentTime === 3) {
            // Evening: 16-18h (2 maps total = 2 hours)
            // When entering Evening, transitions starts at 1
            // Map 1 (transitions=1): 16h
            // Map 2 (transitions=2): 17h
            // Map 3 (transitions=3->switch to Night): 18h
            var hour = 16 + (transitions - 1);
            console.log('[DEBUG] Evening hour calculation: transitions=' + transitions + ', hour=' + hour);
            return hour;
        }
        
        if (currentTime === 4) {
            // Night: 18-24h
            if (transitions <= 1) return 18;
            var hour = 18 + (transitions - 1);
            return Math.min(hour, 24);
        }
        
        return 0;
    }
    
    // ========================
    // Game_System - Initialize Data
    // ========================
    var _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this.initDayNightData();
    };
    
    Game_System.prototype.initDayNightData = function() {
        this._dayNightData = {
            corpsePositions: {},  // {mapId_eventId: {x, y, dir}}
            itemPickupCount: {},  // {mapId_eventId_day: count}
            noRespawnCorpses: {}  // {mapId_eventId: true} for permanent corpses
        };
    };
    
    // ========================
    // Game_Event - Set Self Switch D and save position
    // ========================
    var _Game_Event_onDeath = Game_Event.prototype.onDeath;
    Game_Event.prototype.onDeath = function() {
        var note = this.event().note || '';
        var shouldShowCorpse = note.match(/<respawnDaily>/i) || note.match(/<noRespawn>/i);
        var isNoRespawn = note.match(/<noRespawn>/i);
        
        // BEFORE calling original death, save position and set switch
        if (shouldShowCorpse) {
            // Save death position AND direction
            if (!$gameSystem._dayNightData) {
                $gameSystem.initDayNightData();
            }
            var key = $gameMap.mapId() + '_' + this.eventId();
            $gameSystem._dayNightData.corpsePositions[key] = {
                x: this._x,
                y: this._y,
                dir: this._direction
            };
            
            // Mark as noRespawn if tagged
            if (isNoRespawn) {
                $gameSystem._dayNightData.noRespawnCorpses[key] = true;
                console.log('Marked as permanent corpse (noRespawn):', key);
            }
            
            // Set Self Switch D BEFORE QABS erases
            var switchKey = [$gameMap.mapId(), this.eventId(), 'D'];
            $gameSelfSwitches.setValue(switchKey, true);
            
            // Prevent QABS from erasing
            this._dontErase = true;
            
            console.log('Zombie died at', this._x, this._y, 'direction:', this._direction, 'set Self Switch D:', this.eventId());
        }
        
        // Call original death
        if (_Game_Event_onDeath) {
            _Game_Event_onDeath.call(this);
        }
        
        // Force refresh to show corpse page immediately
        if (shouldShowCorpse) {
            var self = this;
            setTimeout(function() {
                self.refresh();
            }, 10);
        }
    };
    
    // ========================
    // Override setupPage to restore corpse position
    // ========================
    var _Game_Event_setupPage = Game_Event.prototype.setupPage;
    Game_Event.prototype.setupPage = function() {
        // Check if this is corpse BEFORE setupPage
        var switchKey = [$gameMap.mapId(), this.eventId(), 'D'];
        var isCorpse = $gameSelfSwitches.value(switchKey);
        var savedDirection = null;
        
        // Get saved direction before setupPage changes it
        if (isCorpse && $gameSystem._dayNightData && $gameSystem._dayNightData.corpsePositions) {
            var posKey = $gameMap.mapId() + '_' + this.eventId();
            var pos = $gameSystem._dayNightData.corpsePositions[posKey];
            if (pos) {
                savedDirection = pos.dir;
            }
        }
        
        // Call original setupPage
        _Game_Event_setupPage.call(this);
        
        // AFTER setupPage, restore corpse position and direction
        if (isCorpse && savedDirection !== null) {
            if ($gameSystem._dayNightData && $gameSystem._dayNightData.corpsePositions) {
                var posKey = $gameMap.mapId() + '_' + this.eventId();
                var pos = $gameSystem._dayNightData.corpsePositions[posKey];
                if (pos) {
                    // Restore position
                    this.locate(pos.x, pos.y);
                    
                    // Force direction AFTER page setup
                    this._direction = savedDirection;
                    this._directionFix = true;
                    this._locked = true;
                    this._moveType = 0; // Fixed movement type
                    
                    // Set die pose for QSprite characters
                    if (this.qSprite && this.qSprite()) {
                        this._walkAnime = false;
                        this._stepAnime = false;
                        this.setWalkAnime(false); // Force disable
                        this.setStepAnime(false); // Force disable
                        
                        // Clear QSprite cache to force reload
                        this._cacheFrames = {};
                        this._isQChara = undefined; // Force recheck character name
                        
                        // playPose(pose, lock, pause, looping, canBreak)
                        this.playPose('die', true, false, false, false);
                        
                        // Force pattern to die frame
                        this._pattern = 0;
                        
                        console.log('Restored corpse with die pose:', this.eventId(), 'pose:', this._pose);
                    }
                    
                    console.log('Restored corpse:', this.eventId(), 'at', pos.x, pos.y, 'direction:', savedDirection);
                }
            }
        }
    };
    
    // ========================
    // Override setupBattler to skip if Self Switch D = ON (corpse)
    // ========================
    var _Game_Event_setupBattler = Game_Event.prototype.setupBattler;
    Game_Event.prototype.setupBattler = function() {
        // Check if Self Switch D is ON (corpse state)
        var key = [$gameMap.mapId(), this.eventId(), 'D'];
        if ($gameSelfSwitches.value(key)) {
            console.log('Skipping setupBattler for corpse (Self Switch D = ON):', this.eventId());
            // Don't setup battler for corpse
            return;
        }
        
        // Normal setup for living zombie
        _Game_Event_setupBattler.call(this);
    };
    
    // ========================
    // Plugin Commands
    // ========================
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        
        if (command === 'DayNight' || command === 'daynight') {
            var subCommand = args[0];
            
            if (subCommand === 'startDay') {
                // Bắt đầu ngày: Sáng (0) → Trưa (1)
                $gameVariables.setValue(timeVar, 1);
                $gameVariables.setValue(mapTransitionVar, 0);
                
                // Apply tint immediately
                if (SceneManager._scene && SceneManager._scene.applyTimeOfDayTint) {
                    SceneManager._scene.applyTimeOfDayTint();
                }
                
                console.log('Started day - switched to Noon');
                
            } else if (subCommand === 'endDay') {
                // Kết thúc ngày
                $gameVariables.setValue(timeVar, 0);
                $gameVariables.setValue(mapTransitionVar, 0);
                var currentDay = $gameVariables.value(dayCountVar);
                $gameVariables.setValue(dayCountVar, currentDay + 1);
                
                // Apply morning tint immediately
                if (SceneManager._scene && SceneManager._scene.applyTimeOfDayTint) {
                    SceneManager._scene.applyTimeOfDayTint();
                }
                
                this.respawnZombies();
                console.log('Ended day - incremented to day', currentDay + 2);
                
            } else if (subCommand === 'setTime') {
                // Set thời gian
                var newTime = Number(args[1]);
                if (newTime >= 0 && newTime <= 4) {
                    $gameVariables.setValue(timeVar, newTime);
                    $gameVariables.setValue(mapTransitionVar, 0);
                    
                    // Apply tint immediately
                    if (SceneManager._scene && SceneManager._scene.applyTimeOfDayTint) {
                        SceneManager._scene.applyTimeOfDayTint();
                    }
                    
                    console.log('Set time to', newTime);
                }
                
            } else if (subCommand === 'addDay') {
                // Tăng ngày
                var currentDay = $gameVariables.value(dayCountVar);
                $gameVariables.setValue(dayCountVar, currentDay + 1);
                console.log('Added day - now day', currentDay + 2);
                
            } else if (subCommand === 'respawnAll') {
                // Respawn zombies
                this.respawnZombies();
            }
        }
    };
    
    Game_Interpreter.prototype.respawnZombies = function() {
        console.log('Respawning all zombies...');
        
        // Clear item pickup counts
        if ($gameSystem._dayNightData) {
            $gameSystem._dayNightData.itemPickupCount = {};
        }
        
        // Reset daily NPC Self Switch A on current map
        var currentMapId = $gameMap.mapId();
        var events = $gameMap.events();
        
        for (var i = 0; i < events.length; i++) {
            var event = events[i];
            if (!event) continue;
            
            var note = event.event().note || '';
            
            // Reset daily NPC
            if (note.match(/<dailyNPC>/i)) {
                var key = [currentMapId, event.eventId(), 'A'];
                $gameSelfSwitches.setValue(key, false);
                console.log('Reset dailyNPC Self Switch A:', event.eventId());
            }
        }
        
        // Scan all self switches for Self Switch D (zombie corpses)
        var switches = $gameSelfSwitches._data;
        var count = 0;
        
        for (var key in switches) {
            if (switches[key] === true) {
                var parts = key.split(',');
                if (parts.length === 3 && parts[2].trim() === 'D') {
                    var mapId = parseInt(parts[0]);
                    var eventId = parseInt(parts[1]);
                    var posKey = mapId + '_' + eventId;
                    
                    // Check if this is a permanent corpse (noRespawn)
                    var isPermanent = $gameSystem._dayNightData && 
                                     $gameSystem._dayNightData.noRespawnCorpses && 
                                     $gameSystem._dayNightData.noRespawnCorpses[posKey];
                    
                    if (isPermanent) {
                        console.log('Skipped respawn for noRespawn zombie:', mapId, eventId);
                        continue;
                    }
                    
                    // Reset Self Switch D for respawnable zombies
                    var switchKey = [mapId, eventId, 'D'];
                    $gameSelfSwitches.setValue(switchKey, false);
                    
                    // Clear corpse position
                    if ($gameSystem._dayNightData && $gameSystem._dayNightData.corpsePositions) {
                        delete $gameSystem._dayNightData.corpsePositions[posKey];
                    }
                    
                    count++;
                    console.log('Respawned zombie on map', mapId, 'event', eventId);
                }
            }
        }
        
        console.log('Respawned', count, 'zombies total');
        
        // Refresh current map events
        $gameMap.requestRefresh();
    };
    
    // ========================
    // Map Transfer - Auto Advance Time
    // ========================
    var _Game_Player_performTransfer = Game_Player.prototype.performTransfer;
    Game_Player.prototype.performTransfer = function() {
        var wasTransferring = this.isTransferring();
        
        _Game_Player_performTransfer.call(this);
        
        // Only process if transfer actually happened
        if (!wasTransferring) return;
        
        // Check if cycle is enabled
        if (!$gameSwitches || !$gameSwitches.value(cycleSwitch)) return;
        
        var currentTime = $gameVariables.value(timeVar);
        
        // Don't advance time in Morning (0) only
        if (currentTime === 0) return;
        
        // Increment map transition counter FIRST
        var transitions = $gameVariables.value(mapTransitionVar);
        transitions++;
        $gameVariables.setValue(mapTransitionVar, transitions);
        
        console.log('[MAP TRANSFER] Time:', currentTime, 'Transitions:', transitions);
        
        // Check if time should advance
        var shouldAdvance = false;
        
        if (currentTime === 1 && transitions >= noonMaps) {
            // Trưa → Chiều
            $gameVariables.setValue(timeVar, 2);
            $gameVariables.setValue(mapTransitionVar, 1);
            shouldAdvance = true;
            console.log('Time advanced: Noon → Afternoon');
            
        } else if (currentTime === 2 && transitions >= afternoonMaps) {
            // Chiều → Hoàng hôn
            $gameVariables.setValue(timeVar, 3);
            $gameVariables.setValue(mapTransitionVar, 1);
            shouldAdvance = true;
            console.log('Time advanced: Afternoon → Evening (transitions reset to 1)');
            
        } else if (currentTime === 3 && transitions > eveningMaps) {
            // Hoàng hôn → Tối
            // eveningMaps=2 means 2 transfers DURING evening (transitions 1,2,3)
            // So switch to Night when transitions > 2 (i.e., transitions=3)
            $gameVariables.setValue(timeVar, 4);
            $gameVariables.setValue(mapTransitionVar, 1);
            shouldAdvance = true;
            console.log('Time advanced: Evening → Night (transitions=' + transitions + ', eveningMaps=' + eveningMaps + ')');
        }
        
        // Apply screen tint if time changed
        if (shouldAdvance && SceneManager._scene && SceneManager._scene.applyTimeOfDayTint) {
            setTimeout(function() {
                if ($gameSwitches && $gameSwitches.value(cycleSwitch)) {
                    SceneManager._scene.applyTimeOfDayTint();
                }
            }, 100);
        }
    };
    
    // ========================
    // Zombie Stats Boost
    // ========================
    var _Game_Enemy_setup = Game_Enemy.prototype.setup;
    Game_Enemy.prototype.setup = function(enemyId, x, y) {
        _Game_Enemy_setup.call(this, enemyId, x, y);
        this.applyTimeOfDayBoost();
    };
    
    Game_Enemy.prototype.applyTimeOfDayBoost = function() {
        if (!$gameSwitches || !$gameSwitches.value(cycleSwitch)) return;
        
        var currentTime = $gameVariables.value(timeVar);
        var boost = 0;
        
        if (currentTime === 3) {
            // Hoàng hôn: +20%
            boost = eveningBoost;
        } else if (currentTime === 4) {
            // Tối: +50%
            boost = nightBoost;
        }
        
        if (boost > 0) {
            // Boost all params
            for (var i = 0; i < 8; i++) {
                this._paramPlus[i] = Math.floor(this.param(i) * boost);
            }
            
            // Heal to full HP after boosting MaxHP
            this._hp = this.mhp;
            this._mp = this.mmp;
            
            console.log('Applied time boost to enemy:', this._enemyId, 'boost:', boost, 'HP:', this._hp + '/' + this.mhp);
        }
    };
    
    // ========================
    // Item Pickup Limits
    // ========================
    var _Game_Event_start = Game_Event.prototype.start;
    Game_Event.prototype.start = function() {
        // Check if this is a limited pickup item
        var note = this.event().note || '';
        var limitMatch = note.match(/<respawnLimit:\s*(\d+)>/i);
        
        if (limitMatch) {
            var limit = Number(limitMatch[1]);
            var currentDay = $gameVariables.value(dayCountVar);
            var key = $gameMap.mapId() + '_' + this.eventId() + '_' + currentDay;
            
            if (!$gameSystem._dayNightData) {
                $gameSystem.initDayNightData();
            }
            
            var count = $gameSystem._dayNightData.itemPickupCount[key] || 0;
            
            if (count >= limit) {
                // Already picked up max times today
                console.log('Item pickup limit reached:', this.eventId(), count + '/' + limit);
                return;
            }
            
            // Increment count
            $gameSystem._dayNightData.itemPickupCount[key] = count + 1;
            console.log('Item picked up:', this.eventId(), (count + 1) + '/' + limit);
        }
        
        _Game_Event_start.call(this);
    };
    
    // ========================
    // Scene_Map - Create Day HUD & Screen Tint
    // ========================
    var _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_start.call(this);
        
        // Apply screen tint if cycle enabled
        if ($gameSwitches && $gameSwitches.value(cycleSwitch)) {
            this.applyTimeOfDayTint();
        }
        
        // Create HUD
        if (showHUD) {
            this.createTimeHUD();
        }
    };
    
    Scene_Map.prototype.applyTimeOfDayTint = function() {
        // Double check cycle is enabled
        if (!$gameSwitches || !$gameSwitches.value(cycleSwitch)) {
            return;
        }
        
        var currentTime = $gameVariables.value(timeVar);
        var tint = screenTints[currentTime] || [0, 0, 0, 0];
        $gameScreen.startTint(tint, 60);
    };
    
    Scene_Map.prototype.createTimeHUD = function() {
        this._timeHUD = new Window_TimeHUD();
        this.addChild(this._timeHUD);
    };
    
    var _Scene_Map_terminate = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        if (this._timeHUD) {
            this.removeChild(this._timeHUD);
            this._timeHUD = null;
        }
        _Scene_Map_terminate.call(this);
    };
    
    // ========================
    // Window_TimeHUD
    // ========================
    function Window_TimeHUD() {
        this.initialize.apply(this, arguments);
    }
    
    Window_TimeHUD.prototype = Object.create(Window_Base.prototype);
    Window_TimeHUD.prototype.constructor = Window_TimeHUD;
    
    Window_TimeHUD.prototype.initialize = function() {
        var width = 150;
        var height = 96;
        var x = Graphics.width - width - 20;
        var y = 20;
        Window_Base.prototype.initialize.call(this, x, y, width, height);
        this.opacity = 0;
        this._lastTime = -1;
        this._lastDay = -1;
        this._lastHour = -1;
        this.refresh();
    };
    
    Window_TimeHUD.prototype.standardPadding = function() {
        return 8;
    };
    
    Window_TimeHUD.prototype.standardFontSize = function() {
        return 18;
    };
    
    Window_TimeHUD.prototype.lineHeight = function() {
        return 24;
    };
    
    Window_TimeHUD.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        
        // Check if cycle is enabled
        if (!$gameSwitches || !$gameSwitches.value(cycleSwitch)) {
            this.visible = false;
            return;
        }
        
        this.visible = true;
        
        var currentTime = $gameVariables.value(timeVar);
        var currentDay = $gameVariables.value(dayCountVar);
        var currentHour = getCurrentHour();
        
        if (currentTime !== this._lastTime || currentDay !== this._lastDay || currentHour !== this._lastHour) {
            this._lastTime = currentTime;
            this._lastDay = currentDay;
            this._lastHour = currentHour;
            this.refresh();
        }
    };
    
    Window_TimeHUD.prototype.refresh = function() {
        this.contents.clear();
        this.contents.fontSize = 18;
        
        var currentTime = $gameVariables.value(timeVar);
        var currentDay = $gameVariables.value(dayCountVar);
        var currentHour = getCurrentHour();
        
        var timeName = timeNames[currentTime] || 'Unknown';
        
        // Draw "Ngày: X"
        this.changeTextColor(this.systemColor());
        var dayText = 'Ngày: ' + (currentDay + 1);
        this.drawText(dayText, 0, 0, this.contentsWidth(), 'center');
        
        // Draw time name (Sáng, Trưa, etc)
        this.changeTextColor(this.normalColor());
        this.drawText(timeName, 0, this.lineHeight(), this.contentsWidth(), 'center');
        
        // Draw hour (e.g., "10:00")
        var hourText = currentHour + ':00';
        this.drawText(hourText, 0, this.lineHeight() * 2, this.contentsWidth(), 'center');
    };
    
    console.log('DayNightCycle_Simple plugin loaded');
    
})();
