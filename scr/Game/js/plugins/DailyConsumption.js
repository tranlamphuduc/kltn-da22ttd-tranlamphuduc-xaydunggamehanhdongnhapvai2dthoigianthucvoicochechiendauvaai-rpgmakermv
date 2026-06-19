//=============================================================================
// DailyConsumption.js
//=============================================================================

/*:
 * @plugindesc Hệ thống tiêu hao vật phẩm hàng ngày và hồi phục HP
 * @author YourName
 * 
 * @param Raw Vegetable Item ID
 * @desc ID của vật phẩm Rau sống
 * @type number
 * @default 10
 * 
 * @param Water Item ID
 * @desc ID của vật phẩm Nước uống
 * @type number
 * @default 11
 * 
 * @param Cooking Ingredient Item ID
 * @desc ID của vật phẩm Nguyên liệu nấu ăn
 * @type number
 * @default 12
 * 
 * @param Stove Switch ID
 * @desc Switch ID đánh dấu có bếp hay chưa (kích hoạt bởi Key Item)
 * @type switch
 * @default 20
 * 
 * @param Gas Switch ID
 * @desc Switch ID đánh dấu có xăng hay chưa (kích hoạt bởi Key Item)
 * @type switch
 * @default 23
 * 
 * @param Chef Character Switch ID
 * @desc Switch ID đánh dấu có nhân vật nấu ăn hay chưa
 * @type switch
 * @default 21
 * 
 * @param HP Recovery - Raw Only
 * @desc HP hồi khi chỉ ăn rau sống
 * @type number
 * @default 50
 * 
 * @param HP Recovery - Raw + Water
 * @desc HP hồi khi ăn rau sống + nước
 * @type number
 * @default 100
 * 
 * @param HP Recovery - Cooked
 * @desc HP hồi khi có bếp và nấu ăn (% of max HP)
 * @type number
 * @min 1
 * @max 100
 * @default 50
 * 
 * @param HP Recovery - Chef Cooked
 * @desc HP hồi khi có đầu bếp nấu (% of max HP, 100 = full)
 * @type number
 * @min 1
 * @max 100
 * @default 100
 * 
 * @param HP Loss - No Food
 * @desc HP mất khi không có thức ăn (% of max HP)
 * @type number
 * @min 0
 * @max 100
 * @default 30
 * 
 * @param Enable Auto Consume
 * @desc Tự động tiêu hao khi endDay (true/false)
 * @type boolean
 * @default true
 * 
 * @param Show Consumption Log
 * @desc Hiển thị thông báo tiêu hao trong console
 * @type boolean
 * @default true
 * 
 * @help
 * ============================================================================
 * DAILY CONSUMPTION SYSTEM
 * ============================================================================
 * 
 * Plugin này tự động tiêu hao vật phẩm mỗi ngày và hồi HP cho người chơi
 * dựa trên những gì họ có trong inventory.
 * 
 * ============================================================================
 * CÁC CẤP ĐỘ ĂN UỐNG
 * ============================================================================
 * 
 * 1. SỐNG CÒN (Raw Vegetable Only):
 *    - Cần: 1x Rau sống
 *    - Hồi: 50 HP
 * 
 * 2. CƠ BẢN (Raw + Water):
 *    - Cần: 1x Rau sống + 1x Nước
 *    - Hồi: 100 HP
 * 
 * 3. NẤU ĂN (With Stove):
 *    - Cần: 1x Rau + 1x Nước + 1x Nguyên liệu + 1x Xăng + Bếp (Switch ON)
 *    - Hồi: 50% Max HP
 * 
 * 4. ĐẦU BẾP (With Chef):
 *    - Cần: 1x Rau + 1x Nước + 1x Nguyên liệu + 1x Xăng + Bếp + Đầu bếp
 *    - Hồi: 100% Max HP (Full)
 * 
 * ============================================================================
 * PLUGIN COMMANDS
 * ============================================================================
 * 
 * DailyConsumption process
 *   - Xử lý tiêu hao vật phẩm và hồi HP ngay lập tức
 *   - Sử dụng khi người chơi ngủ/nghỉ ngơi
 * 
 * DailyConsumption check
 *   - Kiểm tra xem có đủ vật phẩm để tiêu hao không
 *   - Lưu kết quả vào Switch ID 22 (true = đủ, false = không đủ)
 * 
 * DailyConsumption enable
 *   - Bật tính năng tự động tiêu hao khi endDay
 * 
 * DailyConsumption disable
 *   - Tắt tính năng tự động tiêu hao khi endDay
 * 
 * DailyConsumption setStove [on/off]
 *   - Bật/tắt switch bếp
 *   - Ví dụ: DailyConsumption setStove on
 * 
 * DailyConsumption setChef [on/off]
 *   - Bật/tắt switch đầu bếp
 *   - Ví dụ: DailyConsumption setChef off
 * 
 * DailyConsumption resetEvents
 *   - Reset tất cả events có <dailyReset> trên map hiện tại
 *   - Turn off tất cả Self Switches (A, B, C, D)
 * 
 * ============================================================================
 * ITEM NOTE TAGS
 * ============================================================================
 * 
 * <dailyLimit: X>
 *   - Giới hạn loot item này tối đa X lần mỗi ngày
 *   - Reset khi gọi DayNight endDay
 *   - Áp dụng cho items trên map (loot drops)
 * 
 * Ví dụ trong Item Note:
 * <dailyLimit: 5>
 * 
 * ============================================================================
 * EVENT NOTE TAGS (Cho loot items trên map)
 * ============================================================================
 * 
 * <dailyLimit: X>
 * 
 * Ví dụ trong Event Note:
 * <dailyLimit: 5>
 * 
 * Nghĩa: Event này chỉ được loot tối đa 5 lần/ngày
 * Sau 5 lần loot, sẽ không thể loot thêm cho đến ngày mới
 * 
 * CÁCH SỬ DỤNG TRONG EVENT:
 * 
 * Page 1 (Conditional Branch):
 *   ◆Conditional Branch: Script: $gameMap.event(this._eventId).canLootToday()
 *     ◆Script: $gameMap.event(this._eventId).recordLoot();
 *     ◆Change Items: [Rau sống] + 1
 *     ◆Text: Bạn đã nhặt được Rau sống!
 *     ◆Control Self Switch: A = ON
 *   : Else
 *     ◆Text: Hôm nay bạn đã nhặt đủ rồi!
 *   : Branch End
 * 
 * Page 2 (Conditions: Self Switch A = ON):
 *   (Để trống - event biến mất)
 * 
 * ---
 * 
 * <dailyReset>
 * 
 * Nghĩa: Event này reset (Self Switch OFF) mỗi ngày
 * Dùng cho events cần hiện lại mỗi ngày
 * 
 * KẾT HỢP <dailyLimit> + <dailyReset>:
 * 
 * Event Note:
 * <dailyLimit: 3>
 * <dailyReset>
 * 
 * Nghĩa:
 * - Loot được tối đa 3 lần/ngày
 * - Mỗi lần loot → Self Switch A = ON (biến mất)
 * - Qua ngày mới → Self Switch A = OFF (hiện lại)
 * - Loot được thêm 3 lần nữa
 * 
 * KHI HẾT LIMIT VĨNH VIỄN:
 * 
 * Page 1:
 *   ◆Conditional Branch: Script: $gameMap.event(this._eventId).canLootToday()
 *     ◆Script: $gameMap.event(this._eventId).recordLoot();
 *     ◆Change Items: [Rau sống] + 1
 *     
 *     ◆Script: var ev = $gameMap.event(this._eventId);
 *     ◆Script: if (ev.getLootCount() >= ev.getDailyLimit()) {
 *     ◆Erase Event
 *     ◆Script: } else {
 *     ◆Control Self Switch: A = ON
 *     ◆Script: }
 *   : Else
 *     ◆Text: Hôm nay đã lấy đủ rồi!
 *   : Branch End
 * 
 * Nghĩa: Sau khi loot đủ tổng số lần (VD: 3 lần), Erase Event vĩnh viễn
 * 
 * ============================================================================
 * TÍCH HỢP VỚI DAYNIGHTCYCLE
 * ============================================================================
 * 
 * Plugin tự động hook vào "DayNight endDay" command.
 * Khi endDay được gọi, plugin sẽ:
 * 1. Tự động tiêu hao vật phẩm (nếu enable)
 * 2. Hồi HP cho player
 * 3. Reset daily loot limits
 * 4. Hiển thị message về kết quả
 * 
 * ============================================================================
 */

(function() {
    'use strict';
    
    var parameters = PluginManager.parameters('DailyConsumption');
    
    var rawVegetableId = Number(parameters['Raw Vegetable Item ID'] || 10);
    var waterId = Number(parameters['Water Item ID'] || 11);
    var cookingIngredientId = Number(parameters['Cooking Ingredient Item ID'] || 12);
    
    var stoveSwitchId = Number(parameters['Stove Switch ID'] || 20);
    var gasSwitchId = Number(parameters['Gas Switch ID'] || 23);
    var chefSwitchId = Number(parameters['Chef Character Switch ID'] || 21);
    
    var hpRecoveryRaw = Number(parameters['HP Recovery - Raw Only'] || 50);
    var hpRecoveryRawWater = Number(parameters['HP Recovery - Raw + Water'] || 100);
    var hpRecoveryCooked = Number(parameters['HP Recovery - Cooked'] || 50);
    var hpRecoveryChef = Number(parameters['HP Recovery - Chef Cooked'] || 100);
    var hpLossNoFood = Number(parameters['HP Loss - No Food'] || 30);
    
    var autoConsumeEnabled = parameters['Enable Auto Consume'] === 'true';
    var showLog = parameters['Show Consumption Log'] === 'true';
    
    // ============================================================================
    // Game_System - Initialize Daily Consumption Data
    // ============================================================================
    
    var _Game_System_initialize = Game_System.prototype.initialize;
    Game_System.prototype.initialize = function() {
        _Game_System_initialize.call(this);
        this.initDailyConsumptionData();
    };
    
    Game_System.prototype.initDailyConsumptionData = function() {
        if (!this._dailyConsumption) {
            this._dailyConsumption = {
                enabled: autoConsumeEnabled,
                dailyLootCounts: {},  // {mapId_eventId_itemId: count}
                lastConsumptionDay: 0
            };
        }
    };
    
    Game_System.prototype.getDailyConsumptionData = function() {
        if (!this._dailyConsumption) {
            this.initDailyConsumptionData();
        }
        return this._dailyConsumption;
    };
    
    Game_System.prototype.setConsumptionEnabled = function(enabled) {
        this.getDailyConsumptionData().enabled = enabled;
    };
    
    Game_System.prototype.isConsumptionEnabled = function() {
        return this.getDailyConsumptionData().enabled;
    };
    
    Game_System.prototype.resetDailyLootCounts = function() {
        this.getDailyConsumptionData().dailyLootCounts = {};
        
        // Reset daily reset events ACROSS ALL MAPS
        this.resetAllDailyEvents();
        
        if (showLog) {
            console.log('Daily loot counts reset');
        }
    };
    
    Game_System.prototype.resetAllDailyEvents = function() {
        // Reset Self Switches for all events with <dailyReset> across all maps
        if (!this._dailyResetEvents) {
            this._dailyResetEvents = {};
        }
        
        var resetCount = 0;
        for (var mapId in this._dailyResetEvents) {
            var eventIds = this._dailyResetEvents[mapId];
            for (var i = 0; i < eventIds.length; i++) {
                var eventId = eventIds[i];
                
                // Reset all self switches for this event
                var key = [parseInt(mapId), eventId, 'A'];
                $gameSelfSwitches.setValue(key, false);
                
                key = [parseInt(mapId), eventId, 'B'];
                $gameSelfSwitches.setValue(key, false);
                
                key = [parseInt(mapId), eventId, 'C'];
                $gameSelfSwitches.setValue(key, false);
                
                key = [parseInt(mapId), eventId, 'D'];
                $gameSelfSwitches.setValue(key, false);
                
                resetCount++;
            }
        }
        
        if (showLog) {
            console.log('[DailyConsumption] Reset', resetCount, 'daily events across all maps');
        }
    };
    
    Game_System.prototype.resetDailyEvents = function() {
        // Legacy function - now calls resetAllDailyEvents
        this.resetAllDailyEvents();
    };
    
    // Register events with <dailyReset> when map loads
    Game_System.prototype.registerDailyResetEvents = function(mapId) {
        if (!this._dailyResetEvents) {
            this._dailyResetEvents = {};
        }
        
        this._dailyResetEvents[mapId] = [];
        
        var events = $gameMap.events();
        for (var i = 0; i < events.length; i++) {
            var event = events[i];
            if (event && event.hasDailyReset()) {
                this._dailyResetEvents[mapId].push(event.eventId());
            }
        }
        
        if (showLog && this._dailyResetEvents[mapId].length > 0) {
            console.log('[DailyConsumption] Registered', this._dailyResetEvents[mapId].length, 'daily reset events on map', mapId);
        }
    };
    
    Game_System.prototype.canLootToday = function(mapId, eventId, itemId, limit) {
        var data = this.getDailyConsumptionData();
        var key = mapId + '_' + eventId + '_' + itemId;
        var currentCount = data.dailyLootCounts[key] || 0;
        return currentCount < limit;
    };
    
    Game_System.prototype.incrementLootCount = function(mapId, eventId, itemId) {
        var data = this.getDailyConsumptionData();
        var key = mapId + '_' + eventId + '_' + itemId;
        data.dailyLootCounts[key] = (data.dailyLootCounts[key] || 0) + 1;
    };
    
    Game_System.prototype.getLootCount = function(mapId, eventId, itemId) {
        var data = this.getDailyConsumptionData();
        var key = mapId + '_' + eventId + '_' + itemId;
        return data.dailyLootCounts[key] || 0;
    };
    
    // ============================================================================
    // Daily Consumption Logic
    // ============================================================================
    
    Game_System.prototype.processDailyConsumption = function() {
        var party = $gameParty;
        var leader = party.leader();
        
        if (!leader) {
            if (showLog) console.log('No party leader found');
            return {
                success: false,
                tier: 'none',
                message: 'Không có người chơi',
                hpRecovered: 0
            };
        }
        
        var hasStove = $gameSwitches.value(stoveSwitchId);
        var hasGas = $gameSwitches.value(gasSwitchId);
        var hasChef = $gameSwitches.value(chefSwitchId);
        
        var hasRaw = party.numItems($dataItems[rawVegetableId]) > 0;
        var hasWater = party.numItems($dataItems[waterId]) > 0;
        var hasIngredient = party.numItems($dataItems[cookingIngredientId]) > 0;
        
        var tier = 'none';
        var hpRecovered = 0;
        var consumed = [];
        
        // TIER 4: Đầu bếp (Full HP) - Cần: Rau, Nước, Nguyên liệu, Bếp (Switch), Xăng (Switch), Đầu bếp (Switch)
        if (hasChef && hasStove && hasGas && hasRaw && hasWater && hasIngredient) {
            tier = 'chef';
            party.loseItem($dataItems[rawVegetableId], 1);
            party.loseItem($dataItems[waterId], 1);
            party.loseItem($dataItems[cookingIngredientId], 1);
            
            consumed = ['Rau', 'Nước', 'Nguyên liệu'];
            
            var recoverPercent = hpRecoveryChef / 100;
            hpRecovered = Math.floor(leader.mhp * recoverPercent);
            leader.gainHp(hpRecovered);
            
            if (showLog) {
                console.log('TIER 4: Đầu bếp nấu ăn - Full HP');
            }
        }
        // TIER 3: Nấu ăn với bếp (50% HP) - Cần: Rau, Nước, Nguyên liệu, Bếp, Xăng
        else if (hasStove && hasGas && hasRaw && hasWater && hasIngredient) {
            tier = 'cooked';
            party.loseItem($dataItems[rawVegetableId], 1);
            party.loseItem($dataItems[waterId], 1);
            party.loseItem($dataItems[cookingIngredientId], 1);
            
            consumed = ['Rau', 'Nước', 'Nguyên liệu'];
            
            var recoverPercent = hpRecoveryCooked / 100;
            hpRecovered = Math.floor(leader.mhp * recoverPercent);
            leader.gainHp(hpRecovered);
            
            if (showLog) {
                console.log('TIER 3: Nấu ăn với bếp - ' + hpRecoveryCooked + '% HP');
            }
        }
        // TIER 2: Rau + Nước (100 HP)
        else if (hasRaw && hasWater) {
            tier = 'raw_water';
            party.loseItem($dataItems[rawVegetableId], 1);
            party.loseItem($dataItems[waterId], 1);
            
            consumed = ['Rau sống', 'Nước'];
            
            hpRecovered = hpRecoveryRawWater;
            leader.gainHp(hpRecovered);
            
            if (showLog) {
                console.log('TIER 2: Rau sống + Nước - ' + hpRecovered + ' HP');
            }
        }
        // TIER 1: Chỉ rau (50 HP)
        else if (hasRaw) {
            tier = 'raw_only';
            party.loseItem($dataItems[rawVegetableId], 1);
            
            consumed = ['Rau sống'];
            
            hpRecovered = hpRecoveryRaw;
            leader.gainHp(hpRecovered);
            
            if (showLog) {
                console.log('TIER 1: Chỉ rau sống - ' + hpRecovered + ' HP');
            }
        }
        // NO FOOD
        else {
            tier = 'none';
            
            // Trừ HP khi không có thức ăn
            var lossPercent = hpLossNoFood / 100;
            var hpLoss = Math.floor(leader.mhp * lossPercent);
            hpRecovered = -hpLoss; // Negative value for loss
            
            leader.gainHp(-hpLoss); // Trừ HP
            
            if (showLog) {
                console.log('TIER 0: Không có thức ăn - Mất ' + hpLoss + ' HP (' + hpLossNoFood + '% Max HP)');
            }
        }
        
        var result = {
            success: tier !== 'none',
            tier: tier,
            consumed: consumed,
            hpRecovered: hpRecovered,
            message: this.getConsumptionMessage(tier, consumed, hpRecovered)
        };
        
        return result;
    };
    
    Game_System.prototype.getConsumptionMessage = function(tier, consumed, hpRecovered) {
        var msg = '';
        
        // Header
        msg += '\\C[6]═══ KẾT THÚC NGÀY ═══\\C[0]\n';
        
        if (tier === 'none') {
            msg += '\\C[18]Không có thức ăn!\\C[0]\n';
            msg += '\n\\C[18]Thiệt hại:\\C[0]\n';
            msg += '  \\I[1] HP ' + hpRecovered + ' \\C[18](Đói!)\\C[0]';
            return msg;
        }
        
        // Consumed items
        msg += '\\C[24]Đã tiêu hao:\\C[0]\n';
        for (var i = 0; i < consumed.length; i++) {
            msg += '  \\I[' + this.getItemIcon(consumed[i]) + '] ' + consumed[i] + ' x1\n';
        }
        
        // HP Recovery
        msg += '\n\\C[3]Hồi phục:\\C[0]\n';
        msg += '  \\I[176] HP +' + hpRecovered;
        
        // Tier description
        if (tier === 'chef') {
            msg += ' \\C[3](Full HP!)\\C[0]';
        } else if (tier === 'cooked') {
            msg += ' \\C[2](50% Max HP)\\C[0]';
        }
        
        return msg;
    };
    
    Game_System.prototype.getItemIcon = function(itemName) {
        // Map item names to icon indices
        var iconMap = {
            'Rau': 278,
            'Rau sống': 278,
            'Nước': 275,
            'Nguyên liệu': 259
        };
        return iconMap[itemName] || 0;
    };
    
    Game_System.prototype.checkCanConsume = function() {
        var party = $gameParty;
        
        var hasRaw = party.numItems($dataItems[rawVegetableId]) > 0;
        var hasWater = party.numItems($dataItems[waterId]) > 0;
        var hasIngredient = party.numItems($dataItems[cookingIngredientId]) > 0;
        
        var hasStove = $gameSwitches.value(stoveSwitchId);
        var hasGas = $gameSwitches.value(gasSwitchId);
        var hasChef = $gameSwitches.value(chefSwitchId);
        
        // At minimum, need raw vegetable
        if (!hasRaw) {
            return {
                canConsume: false,
                tier: 'none',
                missing: ['Rau sống']
            };
        }
        
        // Determine best tier possible
        if (hasChef && hasStove && hasGas && hasRaw && hasWater && hasIngredient) {
            return { canConsume: true, tier: 'chef', missing: [] };
        } else if (hasStove && hasGas && hasRaw && hasWater && hasIngredient) {
            return { canConsume: true, tier: 'cooked', missing: [] };
        } else if (hasRaw && hasWater) {
            return { canConsume: true, tier: 'raw_water', missing: [] };
        } else if (hasRaw) {
            return { canConsume: true, tier: 'raw_only', missing: [] };
        }
        
        return { canConsume: false, tier: 'none', missing: ['Rau sống'] };
    };
    
    // ============================================================================
    // Plugin Command
    // ============================================================================
    
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        
        if (command === 'DailyConsumption') {
            var subCommand = args[0];
            
            if (subCommand === 'process') {
                // Process consumption immediately
                var result = $gameSystem.processDailyConsumption();
                
                // Show message
                if (result.message) {
                    $gameMessage.add(result.message);
                }
                
                // Store result in variables (optional)
                // Variable 50 = HP recovered
                $gameVariables.setValue(50, result.hpRecovered);
                
            } else if (subCommand === 'check') {
                // Check if can consume
                var check = $gameSystem.checkCanConsume();
                
                // Store result in Switch 22
                $gameSwitches.setValue(22, check.canConsume);
                
                if (showLog) {
                    console.log('Can consume:', check.canConsume, 'Tier:', check.tier);
                }
                
            } else if (subCommand === 'enable') {
                $gameSystem.setConsumptionEnabled(true);
                if (showLog) console.log('Auto consumption enabled');
                
            } else if (subCommand === 'disable') {
                $gameSystem.setConsumptionEnabled(false);
                if (showLog) console.log('Auto consumption disabled');
                
            } else if (subCommand === 'setStove') {
                var state = args[1];
                $gameSwitches.setValue(stoveSwitchId, state === 'on');
                if (showLog) console.log('Stove switch:', state);
                
            } else if (subCommand === 'setGas') {
                var state = args[1];
                $gameSwitches.setValue(gasSwitchId, state === 'on');
                if (showLog) console.log('Gas switch:', state);
                
            } else if (subCommand === 'setChef') {
                var state = args[1];
                $gameSwitches.setValue(chefSwitchId, state === 'on');
                if (showLog) console.log('Chef switch:', state);
                
            } else if (subCommand === 'resetEvents') {
                // Manual reset daily events on current map
                $gameSystem.resetDailyEvents();
                if (showLog) console.log('Daily events reset manually');
            }
        }
    };
    
    // ============================================================================
    // Hook into DayNight endDay
    // ============================================================================
    
    var _Game_Interpreter_pluginCommand_DayNight = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand_DayNight.call(this, command, args);
        
        if (command === 'DayNight' && args[0] === 'endDay') {
            // Reset daily loot counts
            $gameSystem.resetDailyLootCounts();
            
            // Auto consume if enabled
            if ($gameSystem.isConsumptionEnabled()) {
                var result = $gameSystem.processDailyConsumption();
                
                // Show detailed message about consumption
                if (result.message) {
                    $gameMessage.add(result.message);
                }
                
                if (showLog) {
                    console.log('Auto daily consumption processed:', result);
                }
            }
        }
    };
    
    // ============================================================================
    // Daily Loot Event Integration
    // ============================================================================
    
    // Register daily reset events when map loads
    var _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        
        // Register events with <dailyReset> on this map
        if ($gameSystem) {
            $gameSystem.registerDailyResetEvents(mapId);
        }
    };
    
    // Parse dailyLimit from Event Note
    Game_Event.prototype.getDailyLimit = function() {
        if (!this.event()) return 0;
        
        var note = this.event().note || '';
        
        // Check <dailyLimit: X> tag
        var match = note.match(/<dailyLimit:\s*(\d+)>/i);
        if (match) {
            return parseInt(match[1]);
        }
        
        // Check <dailyLoot> block
        var lootMatch = note.match(/<dailyLoot>([\s\S]*?)<\/dailyLoot>/i);
        if (lootMatch) {
            var content = lootMatch[1];
            var limitMatch = content.match(/limit:\s*(\d+)/i);
            if (limitMatch) {
                return parseInt(limitMatch[1]);
            }
        }
        
        return 0; // No limit
    };
    
    // Check if event has <dailyReset> tag
    Game_Event.prototype.hasDailyReset = function() {
        if (!this.event()) return false;
        
        var note = this.event().note || '';
        return note.match(/<dailyReset>/i) !== null;
    };
    
    // Get item ID from <dailyLoot> block (optional)
    Game_Event.prototype.getDailyLootItemId = function() {
        if (!this.event()) return 0;
        
        var note = this.event().note || '';
        var lootMatch = note.match(/<dailyLoot>([\s\S]*?)<\/dailyLoot>/i);
        if (lootMatch) {
            var content = lootMatch[1];
            var itemMatch = content.match(/item:\s*(\d+)/i);
            if (itemMatch) {
                return parseInt(itemMatch[1]);
            }
        }
        
        return 0;
    };
    
    // Check if can loot this event today
    Game_Event.prototype.canLootToday = function() {
        var limit = this.getDailyLimit();
        if (limit === 0) return true; // No limit
        
        var mapId = $gameMap.mapId();
        var eventId = this.eventId();
        var itemId = this.getDailyLootItemId() || 0; // 0 for generic event trigger
        
        return $gameSystem.canLootToday(mapId, eventId, itemId, limit);
    };
    
    // Record that this event was looted
    Game_Event.prototype.recordLoot = function() {
        var mapId = $gameMap.mapId();
        var eventId = this.eventId();
        var itemId = this.getDailyLootItemId() || 0;
        
        $gameSystem.incrementLootCount(mapId, eventId, itemId);
    };
    
    // Get current loot count
    Game_Event.prototype.getLootCount = function() {
        var mapId = $gameMap.mapId();
        var eventId = this.eventId();
        var itemId = this.getDailyLootItemId() || 0;
        
        return $gameSystem.getLootCount(mapId, eventId, itemId);
    };
    
    // ============================================================================
    
    Game_System.prototype.canLootDailyItem = function(eventId, itemId, limit) {
        var mapId = $gameMap.mapId();
        return this.canLootToday(mapId, eventId, itemId, limit);
    };
    
    Game_System.prototype.recordDailyLoot = function(eventId, itemId) {
        var mapId = $gameMap.mapId();
        this.incrementLootCount(mapId, eventId, itemId);
    };
    
})();
