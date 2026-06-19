//=============================================================================
// DayNightCycle.js
// Hệ thống ngày đêm cho game zombie survival
//=============================================================================

/*:
 * @plugindesc Hệ thống ngày/đêm với zombie mạnh lên theo thời gian
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
 * @param Morning to Noon Maps
 * @desc Số lần chuyển map từ Sáng sang Trưa (trigger bằng event)
 * @default 0
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
 * @default 3
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
 * @param HUD X Position
 * @desc Vị trí X của Time HUD
 * @default 20
 * 
 * @param HUD Y Position
 * @desc Vị trí Y của Time HUD (từ dưới lên)
 * @default 80
 * 
 * @help
 * ============================================================================
 * HƯỚNG DẪN SỬ DỤNG
 * ============================================================================
 * 
 * ## KÍCH HOẠT HỆ THỐNG:
 * - Bật Switch #15 để kích hoạt day/night cycle
 * - Tắt Switch #15 để dừng hệ thống
 * 
 * ## THỜI GIAN:
 * Variable #11 lưu thời gian hiện tại:
 *   0 = Sáng (không tự động tăng thời gian)
 *   1 = Trưa (bắt đầu đếm)
 *   2 = Chiều
 *   3 = Hoàng hôn (zombie +20% mạnh hơn)
 *   4 = Tối (zombie +50% mạnh hơn)
 * 
 * ## CHUYỂN THỜI GIAN:
 * - Sáng → Trưa: Dùng Plugin Command: DayNight startDay
 * - Trưa → Tối: Tự động khi chuyển map đủ số lần
 * - Kết thúc ngày: Plugin Command: DayNight endDay
 * 
 * ## ZOMBIE CORPSE SYSTEM:
 * 
 * **YÊU CẦU**: QSprite plugin phải được cài đặt
 * 
 * Để zombie hiển thị xác khi chết:
 * 1. Thêm tag <respawnDaily> vào Event Note
 * 2. Trong QSprite Editor, tạo poses cho zombie:
 *    - die2 (zombie chết hướng xuống)
 *    - die4 (zombie chết hướng trái)
 *    - die6 (zombie chết hướng phải)
 *    - die8 (zombie chết hướng lên)
 * 3. Các pose này nằm trong CÙNG FILE character với zombie sống
 * 
 * Khi zombie chết:
 * - Hiển thị pose chết (die2/die4/die6/die8) tự động
 * - Xác nằm tại vị trí chết (không về spawn)
 * - Player có thể đi qua
 * - Không thể tấn công
 * - Xác vẫn còn khi chuyển map
 * - Respawn khi gọi DayNight endDay
 * 
 * ## PLUGIN COMMANDS:
 * 
 * DayNight startDay
 *   - Bắt đầu ngày mới (Sáng → Trưa)
 *   - Dùng khi nói chuyện với NPC để bắt đầu đi
 * 
 * DayNight endDay
 *   - Kết thúc ngày, về Sáng, tăng số ngày
 *   - Dùng khi về căn cứ
 * 
 * DayNight setTime X
 *   - Set thời gian thành X (0-4)
 *   - Ví dụ: DayNight setTime 3 (set thành Hoàng hôn)
 * 
 * DayNight addDay
 *   - Tăng số ngày lên 1
 * 
 * DayNight respawnAll
 *   - Respawn tất cả quái và items theo tag
 * 
 * ## EVENT TAGS (trong Note):
 * 
 * <noRespawn>
 *   - Zombie/Event này KHÔNG respawn mỗi ngày
 * 
 * <respawnDaily>
 *   - Item này respawn mỗi ngày
 * 
 * <respawnLimit:X>
 *   - Item này respawn tối đa X lần mỗi ngày
 *   - Ví dụ: <respawnLimit:3> = chỉ lấy được 3 lần/ngày
 * 
 * <questItem>
 *   - Item nhiệm vụ, chỉ xuất hiện 1 lần
 * 
 * <dailyNPC>
 *   - NPC reset Self Switch A mỗi ngày
 * 
 * ============================================================================
 */

(function() {
    'use strict';
    
    // ========================
    // Plugin Parameters
    // ========================
    var parameters = PluginManager.parameters('DayNightCycle');
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
    var hudX = Number(parameters['HUD X Position'] || 20);
    var hudY = Number(parameters['HUD Y Position'] || 80);
    
    // Time names
    var timeNames = ['Sáng', 'Trưa', 'Chiều', 'Hoàng hôn', 'Tối'];
    var timeColors = ['#FFFFaa', '#FFFFaa', '#FFcc66', '#FF8844', '#6666aa'];
    
    // Time ranges (start hour for each period)
    var timeRanges = [
        [6, 9],     // Sáng: 6h-9h (hiển thị 8h)
        [9, 13],    // Trưa: 9h-13h (4 giờ, 4 maps)
        [13, 16],   // Chiều: 13h-16h (3 giờ, 4 maps)
        [16, 18],   // Hoàng hôn: 16h-18h (2 giờ, 2 maps)
        [18, 24]    // Tối: 18h-24h (6 giờ, 2 maps)
    ];
    
    // Map transfers per period
    var mapsPerPeriod = [0, noonMaps, afternoonMaps, eveningMaps, 2];
    
    // Calculate current hour based on time and map transitions
    function getCurrentHour() {
        var currentTime = $gameVariables.value(timeVar);
        var transitions = $gameVariables.value(mapTransitionVar);
        
        if (currentTime === 0) {
            // Morning - fixed at 8:00
            return 8;
        }
        
        if (currentTime === 1) {
            // Noon: 9h-13h, 4 maps, 1 hour per map
            // transitions: 0->9h, 1->10h, 2->11h, 3->12h, 4->13h
            return 9 + transitions;
        }
        
        if (currentTime === 2) {
            // Afternoon: 13h-16h, 4 maps, 0.75 hour per map
            // transitions: 0->13h, 1->13h, 2->14h, 3->15h, 4->16h
            return 13 + Math.floor(transitions * 3 / 4);
        }
        
        if (currentTime === 3) {
            // Evening: 16h-18h, 2 maps, 1 hour per map
            // transitions: 0->16h, 1->16h, 2->17h, 3->18h
            // FIXED: Start at 16h when transitions = 1
            if (transitions <= 1) return 16;
            return 16 + (transitions - 1);
        }
        
        if (currentTime === 4) {
            // Night: 18h-24h, continues incrementing until 24:00
            // transitions: 1->18h, 2->19h, 3->20h, 4->21h, 5->22h, 6->23h, 7->24h
            // After 24h, stay at 24h
            if (transitions <= 1) return 18;
            var hour = 18 + (transitions - 1);
            return Math.min(hour, 24);
        }
        
        return 0;
    };
    
    // Screen tints for each time
    var screenTints = [
        [0, 0, 0, 0],           // Sáng
        [0, 0, 0, 0],           // Trưa
        [0, 0, 0, 0],           // Chiều - bình thường
        [68, -34, -68, 0],      // Hoàng hôn - cam đậm
        [-68, -68, 0, 170]      // Tối - xanh đen
    ];
    
    // ========================
    // Game_System - Initialize Data
    // ========================
    var _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this.initDayNightData();
    };
    
    Game_System.prototype.initDayNightData = function() {
        // ONLY save simple data - safe for save/load
        this._dayNightData = {
            itemPickupCount: {},  // {mapId_eventId_day: count}
            enemiesKilled: {}     // {mapId_eventId_day: true/false}
        };
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
                SceneManager._scene.applyTimeOfDayTint();
                
            } else if (subCommand === 'endDay') {
                // Kết thúc ngày: về Sáng, tăng số ngày
                $gameVariables.setValue(timeVar, 0);
                $gameVariables.setValue(mapTransitionVar, 0);
                var currentDay = $gameVariables.value(dayCountVar);
                $gameVariables.setValue(dayCountVar, currentDay + 1);
                SceneManager._scene.applyTimeOfDayTint();
                // Respawn all
                this.respawnDayNightEvents();
                
            } else if (subCommand === 'setTime') {
                var newTime = Number(args[1]);
                if (newTime >= 0 && newTime <= 4) {
                    $gameVariables.setValue(timeVar, newTime);
                    $gameVariables.setValue(mapTransitionVar, 0);
                    SceneManager._scene.applyTimeOfDayTint();
                }
                
            } else if (subCommand === 'addDay') {
                var currentDay = $gameVariables.value(dayCountVar);
                $gameVariables.setValue(dayCountVar, currentDay + 1);
                
            } else if (subCommand === 'respawnAll') {
                this.respawnDayNightEvents();
            }
        }
    };
    
    Game_Interpreter.prototype.respawnDayNightEvents = function() {
        console.log('respawnDayNightEvents called');
        
        // Reset item pickup counts for new day
        if ($gameSystem._dayNightData) {
            $gameSystem._dayNightData.itemPickupCount = {};
            $gameSystem._dayNightData.enemiesKilled = {};
        }
        
        // Get all maps that have corpses (Self Switch D = true)
        var allMaps = {};
        
        // Scan all self switches for corpses (Self Switch D)
        var switches = $gameSelfSwitches._data;
        for (var key in switches) {
            if (switches[key] === true) {
                var parts = key.split(',');
                if (parts.length === 3 && parts[2] === 'D') {
                    var mapId = parseInt(parts[0]);
                    var eventId = parseInt(parts[1]);
                    
                    if (!allMaps[mapId]) {
                        allMaps[mapId] = [];
                    }
                    allMaps[mapId].push(eventId);
                }
            }
        }
        
        // Reset Self Switch D for all corpses
        for (var mapId in allMaps) {
            var eventIds = allMaps[mapId];
            console.log('Resetting', eventIds.length, 'corpses on map', mapId);
            
            for (var i = 0; i < eventIds.length; i++) {
                var eventId = eventIds[i];
                var key = [parseInt(mapId), eventId, 'D'];
                $gameSelfSwitches.setValue(key, false);
                console.log('Reset corpse Self Switch D:', mapId, eventId);
            }
        }
        
        // Reset daily NPC Self Switch A
        var currentMapId = $gameMap.mapId();
        var events = $gameMap.events();
        
        for (var i = 0; i < events.length; i++) {
            var event = events[i];
            if (!event) continue;
            
            var note = event.event().note || '';
            
            if (note.match(/<dailyNPC>/i)) {
                var key = [currentMapId, event.eventId(), 'A'];
                $gameSelfSwitches.setValue(key, false);
                console.log('Reset dailyNPC:', event.eventId());
            }
        }
        
        console.log('respawnDayNightEvents complete');
    };
    
    // ========================
    // Scene_Map - No longer need to restore corpses manually
    // ========================
    var _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() {
        if (_Scene_Map_onMapLoaded) {
            _Scene_Map_onMapLoaded.call(this);
        }
        // Corpses are now handled by Event Pages with Self Switch D
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
        // Night (4) can still increment transitions for hour display
        if (currentTime === 0) return;
        
        // Increment map transition counter FIRST
        var transitions = $gameVariables.value(mapTransitionVar);
        transitions++;
        $gameVariables.setValue(mapTransitionVar, transitions);
        
        // Check if time should advance (but not from Night)
        var shouldAdvance = false;
        
        if (currentTime === 1 && transitions >= noonMaps) {
            // Trưa → Chiều
            $gameVariables.setValue(timeVar, 2);
            $gameVariables.setValue(mapTransitionVar, 1); // Start at 1 instead of 0
            shouldAdvance = true;
            
        } else if (currentTime === 2 && transitions >= afternoonMaps) {
            // Chiều → Hoàng hôn
            $gameVariables.setValue(timeVar, 3);
            $gameVariables.setValue(mapTransitionVar, 1); // Start at 1 instead of 0
            shouldAdvance = true;
            
        } else if (currentTime === 3 && transitions >= eveningMaps) {
            // Hoàng hôn → Tối
            $gameVariables.setValue(timeVar, 4);
            $gameVariables.setValue(mapTransitionVar, 1); // Start at 1 instead of 0
            shouldAdvance = true;
        }
        // Note: When currentTime === 4 (Night), we don't advance to next period
        // but we still increment transitions so hour can increase to 24:00
        
        if (shouldAdvance) {
            // Apply screen tint in next frame (only if cycle still enabled)
            if (SceneManager._scene && SceneManager._scene.applyTimeOfDayTint) {
                if ($gameSwitches && $gameSwitches.value(cycleSwitch)) {
                    setTimeout(function() {
                        SceneManager._scene.applyTimeOfDayTint();
                    }, 100);
                }
            }
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
        }
    };
    
    // ========================
    // Game_Event - Override QABS onDeath to set Self Switch
    // ========================
    var _Game_Event_onDeath = Game_Event.prototype.onDeath;
    Game_Event.prototype.onDeath = function() {
        var note = this.event().note || '';
        var shouldShowCorpse = note.match(/<respawnDaily>/i);
        
        console.log('onDeath called for event:', this.eventId(), 'shouldShowCorpse:', shouldShowCorpse);
        
        // Call original death
        if (_Game_Event_onDeath) {
            _Game_Event_onDeath.call(this);
        }
        
        // If this enemy should show corpse, set Self Switch D
        if (shouldShowCorpse) {
            var key = [$gameMap.mapId(), this.eventId(), 'D'];
            $gameSelfSwitches.setValue(key, true);
            console.log('Set Self Switch D for corpse:', this.eventId());
        }
    };
    
    // Show corpse (dead pose)
    Game_Event.prototype.showCorpse = function() {
        console.log('showCorpse called for event:', this.eventId());
        
        // Store dead state
        this._isDead = true;
        
        // Get current position and direction
        var currentX = this._x;
        var currentY = this._y;
        var dir = this._direction;
        
        console.log('Current position:', currentX, currentY, 'direction:', dir);
        console.log('Character:', this._characterName, 'Index:', this._characterIndex);
        console.log('QSprite check - Imported:', Imported.QSprite, 'qSprite():', this.qSprite ? this.qSprite() : 'no qSprite method');
        
        // Save corpse state to $gameSystem for persistence
        if (!$gameSystem._dayNightData) {
            $gameSystem.initDayNightData();
        }
        var key = $gameMap.mapId() + '_' + this.eventId();
        $gameSystem._dayNightData.corpses[key] = {
            x: currentX,
            y: currentY,
            dir: dir
        };
        
        // Try QSprite first if available
        var usedQSprite = false;
        if (Imported.QSprite && this.qSprite && this.qSprite()) {
            var diePose = 'die' + dir;
            // Check if die pose exists
            if (this.hasPose && this.hasPose(diePose)) {
                console.log('Using QSprite die pose:', diePose);
                this._pose = diePose;
                this._posePlaying = {
                    lock: true,
                    pause: true,
                    loop: false,
                    canBreak: false
                };
                this._pattern = 0;
                this._animationCount = 0;
                usedQSprite = true;
            }
        }
        
        // Fallback to standard pattern if QSprite not used
        if (!usedQSprite) {
            console.log('Using standard death pattern 2');
            this.setDirection(dir);
            this._pattern = 2; // Use pattern 2 as death pose
            this._animationCount = 0; // Stop animation
            this._stopCount = 999999; // Never reset
        }
        
        // Make passable (player can walk through)
        this._through = true;
        
        // Stop all movement
        this._moveType = 0;
        this._moveRouteForcing = false;
        this.resetStopCount();
        
        // Clear battler so it can't be attacked (CRITICAL)
        this._battler = null;
        this._battlerId = null;
        
        // Mark as not erased (visible on map)
        this._erased = false;
        
        // Lock position (don't move back to spawn)
        this._locked = true;
        
        // Prevent pattern updates
        this._corpseMode = true;
        
        // Refresh sprite
        this.refresh();
        
        console.log('Corpse setup complete at:', currentX, currentY);
    };
    
    // Override character pattern for dead enemies
    var _Game_Event_pattern = Game_Event.prototype.pattern;
    Game_Event.prototype.pattern = function() {
        if (this._isDead) {
            return this._pattern; // Keep current pattern (QSprite handles this)
        }
        return _Game_Event_pattern.call(this);
    };
    
    // Override updatePattern to freeze corpse animation
    var _Game_Event_updatePattern = Game_Event.prototype.updatePattern;
    Game_Event.prototype.updatePattern = function() {
        if (this._corpseMode || this._isDead) {
            // Don't update pattern for corpses
            return;
        }
        _Game_Event_updatePattern.call(this);
    };
    
    // Override setupPage to prevent corpse from resetting position
    var _Game_Event_setupPage = Game_Event.prototype.setupPage;
    Game_Event.prototype.setupPage = function() {
        _Game_Event_setupPage.call(this);
        
        // If this is a corpse, restore die pose
        if (this._isDead && $gameSystem._dayNightData && $gameSystem._dayNightData.corpses) {
            var key = $gameMap.mapId() + '_' + this.eventId();
            var corpseData = $gameSystem._dayNightData.corpses[key];
            if (corpseData) {
                // Restore death pattern
                this.setDirection(corpseData.dir);
                this._pattern = 2; // Death pattern
                this._animationCount = 0;
                this._stopCount = 999999;
                this._corpseMode = true;
                this._through = true;
                this._moveType = 0;
                this._locked = true;
            }
        }
    };
    
    // Revive zombie (remove corpse)
    Game_Event.prototype.revive = function() {
        console.log('Reviving zombie:', this.eventId());
        
        // Clear dead state
        this._isDead = false;
        this._deadPose = null;
        this._through = false;
        this._dontErase = false;
        this._locked = false;
        this._corpseMode = false;
        
        // Clear QSprite pose lock
        if (Imported.QSprite && this.qSprite && this.qSprite()) {
            this._pose = null;
            this._posePlaying = null;
        }
        
        // Restore original move type
        this._moveType = this.event().moveType;
        
        // Reset animation
        this._pattern = 0;
        this._animationCount = 0;
        this._stopCount = 0;
        
        // Remove corpse state from $gameSystem
        if ($gameSystem._dayNightData && $gameSystem._dayNightData.corpses) {
            var key = $gameMap.mapId() + '_' + this.eventId();
            delete $gameSystem._dayNightData.corpses[key];
        }
        
        // CRITICAL: Clear QABS dead flag and respawn timer
        this._respawn = -1;
        
        // Re-setup battler (recreate enemy)
        this.setupBattler();
        
        // Make visible and enable again
        this._erased = false;
        
        // Reset AI
        if (this._aiType) {
            this._aiWait = 0;
        }
        
        // Reset QABS collision box
        if (this.makeHitbox) {
            this.makeHitbox();
        }
        
        this.refresh();
        
        console.log('Zombie revived:', this.eventId(), 'battler:', this._battler ? 'exists' : 'null', 'moveType:', this._moveType);
    };
    
    // ========================
    // Scene_Map - Screen Tint & HUD
    // ========================
    var _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_start.call(this);
        // ONLY apply tint if cycle is enabled
        if ($gameSwitches && $gameSwitches.value(cycleSwitch)) {
            this.applyTimeOfDayTint();
        }
        if (showHUD) {
            this.createTimeHUD();
        }
    };
    
    Scene_Map.prototype.applyTimeOfDayTint = function() {
        // Double check cycle is enabled
        if (!$gameSwitches || !$gameSwitches.value(cycleSwitch)) {
            // Don't touch screen tint if cycle is disabled
            return;
        }
        
        var currentTime = $gameVariables.value(timeVar);
        var tint = screenTints[currentTime] || [0, 0, 0, 0];
        $gameScreen.startTint(tint, 60); // 1 second transition
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
        var height = 96; // Tăng height để chứa thêm giờ
        var x = Graphics.width - width - 20; // Góc phải, cách mép 20px
        var y = 20; // Góc trên, cách mép 20px
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
        return 18; // Giảm font size
    };
    
    Window_TimeHUD.prototype.lineHeight = function() {
        return 24; // Giảm line height
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
        this.contents.fontSize = 18; // Set font size nhỏ hơn
        
        var currentTime = $gameVariables.value(timeVar);
        var currentDay = $gameVariables.value(dayCountVar);
        
        // Calculate hour (will use transitions from Variable #13)
        var currentHour = getCurrentHour();
        
        var timeName = timeNames[currentTime] || 'Unknown';
        var color = timeColors[currentTime] || '#FFFFFF';
        
        // Draw "Ngày: X" trên cùng 1 dòng
        this.changeTextColor(this.systemColor());
        var dayText = 'Ngày: ' + (currentDay + 1);
        this.drawText(dayText, 0, 0, this.contentsWidth(), 'center');
        
        // Draw time name
        this.contents.textColor = color;
        this.drawText(timeName, 0, this.lineHeight(), this.contentsWidth(), 'center');
        
        // Draw hour (e.g., "10:00" or "24:00")
        this.changeTextColor(this.normalColor());
        var hourText = currentHour + ':00';
        this.drawText(hourText, 0, this.lineHeight() * 2, this.contentsWidth(), 'center');
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
                return;
            }
            
            // Increment count
            $gameSystem._dayNightData.itemPickupCount[key] = count + 1;
        }
        
        _Game_Event_start.call(this);
    };
    
    console.log('DayNightCycle plugin loaded');
    
})();
