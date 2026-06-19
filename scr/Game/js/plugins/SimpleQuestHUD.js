//=============================================================================
// SimpleQuestHUD.js
//=============================================================================

/*:
 * @plugindesc Displays a small quest tracker window on the map screen.
 * @author Antigravity
 *
 * @param Show/Hide Switch ID
 * @desc The ID of the switch that controls the HUD visibility.
 * @type switch
 * @default 10
 *
 * @param Quest Text Variable ID
 * @desc The ID of the variable that stores the quest text string.
 * @type variable
 * @default 10
 *
 * @param Title Text
 * @desc The title shown at the top of the quest window.
 * @default Nhiệm Vụ:
 *
 * @param Window Width
 * @desc Width of the quest tracker window.
 * @type number
 * @default 260
 *
 * @param Window Height
 * @desc Height of the quest tracker window.
 * @type number
 * @default 150
 *
 * @param Window X
 * @desc X coordinate of the window.
 * @type number
 * @default 20
 *
 * @param Window Y
 * @desc Y coordinate of the window.
 * @type number
 * @default 80
 *
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 * This plugin creates a simple and clean Quest HUD window on the map screen.
 * You can control its visibility using a Switch, and update its text using
 * a Game Variable.
 *
 * ============================================================================
 * How to Use
 * ============================================================================
 * 1. Enable the plugin in the Plugin Manager.
 * 2. Set the Switch ID (default 10) to ON in your event to show the HUD.
 *    Set it to OFF to hide the HUD (useful during cutscenes).
 * 3. Update the content of the Quest Tracker by setting the Variable ID
 *    (default 10) to a string text.
 *
 * Example of updating quest text in an Event Command (Script...):
 *   $gameVariables.setValue(10, "1. Xuống sân trường\n2. Mua đồ ăn");
 *
 * You can also use standard text codes in the variable string:
 *   $gameVariables.setValue(10, "\\C[6]Chạy trốn\\C[0] khỏi zombie!");
 */

(function() {
    var parameters = PluginManager.parameters('SimpleQuestHUD');
    var switchId = Number(parameters['Show/Hide Switch ID'] || 10);
    var variableId = Number(parameters['Quest Text Variable ID'] || 10);
    var titleText = String(parameters['Title Text'] || 'Nhiệm Vụ:');
    var winWidth = Number(parameters['Window Width'] || 260);
    var winHeight = Number(parameters['Window Height'] || 150);
    var winX = Number(parameters['Window X'] || 20);
    var winY = Number(parameters['Window Y'] || 80);

    // Define the Window class
    function Window_QuestHUD() {
        this.initialize.apply(this, arguments);
    }

    Window_QuestHUD.prototype = Object.create(Window_Base.prototype);
    Window_QuestHUD.prototype.constructor = Window_QuestHUD;

    Window_QuestHUD.prototype.initialize = function() {
        Window_Base.prototype.initialize.call(this, winX, winY, winWidth, winHeight);
        this.opacity = 180; // slightly semi-transparent
        this._lastValue = '';
        this.refresh();
    };

    Window_QuestHUD.prototype.refresh = function() {
        this.contents.clear();
        
        // Draw Title
        this.changeTextColor(this.systemColor());
        this.drawText(titleText, 0, 0, this.contentsWidth(), 'left');
        this.resetTextColor();
        
        // Draw Quest Content
        var questText = $gameVariables.value(variableId);
        if (questText) {
            this.drawTextEx(String(questText), 0, this.lineHeight() - 10);
        }
        this._lastValue = questText;
    };

    Window_QuestHUD.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        
        // Handle Visibility via Switch
        var isVisible = $gameSwitches.value(switchId);
        if (this.visible !== isVisible) {
            this.visible = isVisible;
        }
        
        // Refresh if text changed
        if (this.visible && this._lastValue !== $gameVariables.value(variableId)) {
            this.refresh();
        }
    };

    // Inject into Scene_Map
    var _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows;
    Scene_Map.prototype.createAllWindows = function() {
        _Scene_Map_createAllWindows.call(this);
        this.createQuestHUDWindow();
    };

    Scene_Map.prototype.createQuestHUDWindow = function() {
        this._questHUDWindow = new Window_QuestHUD();
        this._questHUDWindow.visible = $gameSwitches.value(switchId);
        this.addChild(this._questHUDWindow);
    };
})();
