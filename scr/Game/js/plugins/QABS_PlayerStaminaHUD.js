//=============================================================================
// QABS_PlayerStaminaHUD.js
// Thêm HP + Stamina HUD cho Player ở góc màn hình
// Không ảnh hưởng đến HP bar của quái (vẫn hiển thị trên đầu)
//=============================================================================

/*:
 * @plugindesc Hiển thị HP + Stamina bar cho player ở góc màn hình, tự động ẩn khi hội thoại
 * @author KiroAssistant
 * 
 * @param Max Stamina
 * @desc Thể lực tối đa
 * @default 100
 * 
 * @param Stamina Variable
 * @desc ID của Variable lưu stamina hiện tại
 * @default 10
 * 
 * @param Drain Rate
 * @desc Stamina giảm mỗi frame khi chạy (dash)
 * @default 0.5
 * 
 * @param Regen Rate
 * @desc Stamina hồi mỗi frame khi không chạy
 * @default 1.5
 * 
 * @param Regen Delay
 * @desc Số frame đợi trước khi bắt đầu hồi stamina
 * @default 30
 * 
 * @param Window X
 * @desc Vị trí X của HUD (góc trái)
 * @default 20
 * 
 * @param Window Y
 * @desc Vị trí Y của HUD (góc trên)
 * @default 20
 * 
 * @param Window Width
 * @desc Chiều rộng của HUD window
 * @default 280
 * 
 * @param Window Height
 * @desc Chiều cao của HUD window
 * @default 100
 * 
 * @param Show Character Name
 * @desc Hiển thị tên nhân vật (true/false)
 * @default true
 * 
 * @param Stamina Color 1
 * @desc Màu gradient 1 của stamina bar (hex)
 * @default #4080c0
 * 
 * @param Stamina Color 2
 * @desc Màu gradient 2 của stamina bar (hex)
 * @default #40c0f0
 */

(function() {
    'use strict';
    
    // ========================
    // Plugin Parameters
    // ========================
    var parameters = PluginManager.parameters('QABS_PlayerStaminaHUD');
    var maxStamina = Number(parameters['Max Stamina'] || 100);
    var staminaVar = Number(parameters['Stamina Variable'] || 10);
    var drainRate = Number(parameters['Drain Rate'] || 0.5);
    var regenRate = Number(parameters['Regen Rate'] || 1.5);
    var regenDelay = Number(parameters['Regen Delay'] || 30);
    var windowX = Number(parameters['Window X'] || 20);
    var windowY = Number(parameters['Window Y'] || 20);
    var windowWidth = Number(parameters['Window Width'] || 280);
    var windowHeight = Number(parameters['Window Height'] || 100);
    var showCharName = String(parameters['Show Character Name'] || 'true') === 'true';
    var staminaColor1 = String(parameters['Stamina Color 1'] || '#4080c0');
    var staminaColor2 = String(parameters['Stamina Color 2'] || '#40c0f0');
    
    // Stamina regen delay counter
    var _staminaRegenDelay = 0;
    
    // ========================
    // Dynamic Max Stamina System
    // ========================
    
    // Get current max stamina (can be increased permanently)
    function getMaxStamina() {
        if (!$gameSystem._maxStaminaBonus) {
            $gameSystem._maxStaminaBonus = 0;
        }
        return maxStamina + $gameSystem._maxStaminaBonus;
    }
    
    // Increase max stamina permanently
    function increaseMaxStamina(amount) {
        if (!$gameSystem._maxStaminaBonus) {
            $gameSystem._maxStaminaBonus = 0;
        }
        $gameSystem._maxStaminaBonus += amount;
        console.log('[Stamina] Max Stamina increased by', amount, '-> New Max:', getMaxStamina());
    }
    
    // ========================
    // Initialize Stamina
    // ========================
    var _DataManager_createGameObjects = DataManager.createGameObjects;
    DataManager.createGameObjects = function() {
        _DataManager_createGameObjects.call(this);
        // Force initialize stamina on new game
        if ($gameVariables) {
            $gameVariables.setValue(staminaVar, getMaxStamina());
        }
        // Initialize HUD hidden flag
        if ($gameSystem && $gameSystem._hudHidden === undefined) {
            $gameSystem._hudHidden = false;
        }
    };
    
    var _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_start.call(this);
        // Initialize stamina variable if not set or zero
        var currentStamina = $gameVariables.value(staminaVar);
        if (currentStamina === undefined || currentStamina === 0) {
            $gameVariables.setValue(staminaVar, getMaxStamina());
        }
        // Ensure HUD hidden flag exists (KHÔNG reset về false)
        if ($gameSystem._hudHidden === undefined) {
            $gameSystem._hudHidden = false;
        }
    };
    
    // ========================
    // Window_PlayerHUD
    // ========================
    function Window_PlayerHUD() {
        this.initialize.apply(this, arguments);
    }
    
    Window_PlayerHUD.prototype = Object.create(Window_Base.prototype);
    Window_PlayerHUD.prototype.constructor = Window_PlayerHUD;
    
    Window_PlayerHUD.prototype.initialize = function() {
        Window_Base.prototype.initialize.call(this, windowX, windowY, windowWidth, windowHeight);
        this.opacity = 0; // Transparent background
        this.contentsOpacity = 255;
        this._lastHp = -1;
        this._lastStamina = -1;
        this.refresh();
    };
    
    Window_PlayerHUD.prototype.standardPadding = function() {
        return 8;
    };
    
    Window_PlayerHUD.prototype.standardFontSize = function() {
        return 18; // Giảm font size từ 28 xuống 18
    };
    
    Window_PlayerHUD.prototype.lineHeight = function() {
        return 24; // Giảm line height
    };
    
    Window_PlayerHUD.prototype.refresh = function() {
        var actor = $gameParty.leader();
        if (!actor) return;
        
        var hp = actor.hp;
        var maxHp = actor.mhp;
        var stamina = $gameVariables.value(staminaVar);
        
        // Force display stamina even if 0
        if (stamina === undefined || stamina === null) {
            stamina = getMaxStamina();
            $gameVariables.setValue(staminaVar, getMaxStamina());
        }
        
        // Only refresh if values changed
        if (hp === this._lastHp && stamina === this._lastStamina) return;
        
        this._lastHp = hp;
        this._lastStamina = stamina;
        
        this.contents.clear();
        this.contents.fontSize = 18; // Set font size nhỏ hơn
        
        var y = 0;
        var gaugeWidth = this.contentsWidth() - 60;
        var textX = 50;
        
        // Character Name
        if (showCharName) {
            this.contents.fontSize = 20; // Name hơi to hơn
            this.changeTextColor(this.normalColor());
            this.drawText(actor.name(), 0, y, this.contentsWidth(), 'left');
            y += this.lineHeight();
            this.contents.fontSize = 18; // Back to normal
        }
        
        // HP Bar (Xanh lá)
        this.changeTextColor(this.systemColor());
        this.drawText('HP', 0, y, 45);
        this.resetTextColor();
        
        var hpRate = hp / maxHp;
        // Đổi sang màu xanh lá
        var hpColor1 = '#20c040'; // Xanh lá đậm
        var hpColor2 = '#60e080'; // Xanh lá sáng
        this.drawGauge(textX, y, gaugeWidth, hpRate, hpColor1, hpColor2);
        
        this.changeTextColor(this.normalColor());
        this.drawText(hp + ' / ' + maxHp, textX, y, gaugeWidth, 'right');
        
        y += this.lineHeight() + 2;
        
        // Stamina Bar (Cam - giống màu HP cũ)
        this.changeTextColor(this.systemColor());
        this.drawText('SP', 0, y, 45);
        this.resetTextColor();
        
        var spRate = Math.max(0, Math.min(1, stamina / getMaxStamina()));
        // Đổi sang màu cam (màu HP cũ của RPG Maker)
        var spColor1 = '#e08040'; // Cam đậm
        var spColor2 = '#f0c040'; // Vàng cam sáng
        this.drawGauge(textX, y, gaugeWidth, spRate, spColor1, spColor2);
        
        this.changeTextColor(this.normalColor());
        var displayStamina = Math.floor(stamina);
        this.drawText(displayStamina + ' / ' + getMaxStamina(), textX, y, gaugeWidth, 'right');
    };
    
    // Custom drawGauge with hex color support (smaller gauge)
    Window_PlayerHUD.prototype.drawGauge = function(x, y, width, rate, color1, color2) {
        var fillW = Math.floor(width * rate);
        var gaugeY = y + this.lineHeight() - 6;
        var gaugeH = 8; // Tăng từ 6 lên 8 để dễ nhìn hơn
        
        // Background
        this.contents.fillRect(x, gaugeY, width, gaugeH, this.gaugeBackColor());
        
        // Gradient fill
        this.contents.gradientFillRect(x, gaugeY, fillW, gaugeH, color1, color2);
    };
    
    // ========================
    // Add HUD to Scene_Map
    // ========================
    var _Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
    Scene_Map.prototype.createDisplayObjects = function() {
        _Scene_Map_createDisplayObjects.call(this);
        this.createPlayerHUD();
    };
    
    Scene_Map.prototype.createPlayerHUD = function() {
        this._playerHUD = new Window_PlayerHUD();
        this.addChild(this._playerHUD);
        // DON'T save reference to $gameSystem - causes save/load issues
        // ONLY initialize flag if it doesn't exist - DON'T reset it!
        if ($gameSystem._hudHidden === undefined) {
            $gameSystem._hudHidden = false;
        }
    };
    
    // ========================
    // Update Stamina Logic
    // ========================
    Scene_Map.prototype.updatePlayerStamina = function() {
        if (!$gamePlayer) return;
        
        var stamina = $gameVariables.value(staminaVar);
        var isDashing = $gamePlayer.isDashing() && $gamePlayer.isMoving();
        
        if (isDashing && stamina > 0) {
            // Drain stamina when dashing
            stamina = Math.max(0, stamina - drainRate);
            _staminaRegenDelay = regenDelay; // Reset regen delay
            
            // Stop dashing if stamina depleted
            if (stamina <= 0) {
                stamina = 0;
                $gamePlayer._dashing = false;
            }
        } else {
            // Regen stamina when not dashing
            if (_staminaRegenDelay > 0) {
                _staminaRegenDelay--;
            } else if (stamina < getMaxStamina()) {
                stamina = Math.min(getMaxStamina(), stamina + regenRate);
            }
        }
        
        $gameVariables.setValue(staminaVar, stamina);
    };
    
    // Prevent dashing if no stamina
    var _Game_Player_updateDashing = Game_Player.prototype.updateDashing;
    Game_Player.prototype.updateDashing = function() {
        var stamina = $gameVariables.value(staminaVar);
        if (stamina <= 0) {
            this._dashing = false;
            return;
        }
        _Game_Player_updateDashing.call(this);
    };
    
    // ========================
    // Update Loop (Check flag để ẩn/hiện bằng opacity)
    // ========================
    var _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        this.updatePlayerStamina();
        this.updateHUDOpacity(); // Update opacity dựa trên flag
        if (this._playerHUD && $gameSystem._hudHidden === false) {
            this._playerHUD.refresh();
        }
    };
    
    // Update HUD opacity dựa trên flag
    Scene_Map.prototype.updateHUDOpacity = function() {
        if (!this._playerHUD) return;
        
        if ($gameSystem._hudHidden) {
            // Ẩn dần HUD
            if (this._playerHUD.contentsOpacity > 0) {
                this._playerHUD.contentsOpacity -= 30;
            }
        } else {
            // Hiện dần HUD
            if (this._playerHUD.contentsOpacity < 255) {
                this._playerHUD.contentsOpacity += 30;
            }
        }
    };
    
    // ========================
    // Plugin Commands (MANUAL CONTROL)
    // ========================
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        
        if (command === 'PlayerHUD' || command === 'playerhud') {
            if (args[0] === 'show') {
                if ($gameSystem._playerHUD) {
                    $gameSystem._playerHUD.visible = true;
                    $gameSystem._playerHUD.open();
                }
            } else if (args[0] === 'hide') {
                if ($gameSystem._playerHUD) {
                    $gameSystem._playerHUD.visible = false;
                    $gameSystem._playerHUD.close();
                }
            }
        }
        
        if (command === 'Stamina' || command === 'stamina') {
            var value = Number(args[1]);
            if (args[0] === 'set') {
                $gameVariables.setValue(staminaVar, value);
            } else if (args[0] === 'add') {
                var current = $gameVariables.value(staminaVar);
                $gameVariables.setValue(staminaVar, Math.min(getMaxStamina(), current + value));
            } else if (args[0] === 'remove') {
                var current = $gameVariables.value(staminaVar);
                $gameVariables.setValue(staminaVar, Math.max(0, current - value));
            } else if (args[0] === 'refill') {
                $gameVariables.setValue(staminaVar, getMaxStamina());
            } else if (args[0] === 'increaseMax' || args[0] === 'addMax') {
                // NEW: Increase Max Stamina permanently
                increaseMaxStamina(value);
                // Also increase current stamina by the same amount
                var current = $gameVariables.value(staminaVar);
                $gameVariables.setValue(staminaVar, Math.min(getMaxStamina(), current + value));
            }
        }
    };
    
})();
