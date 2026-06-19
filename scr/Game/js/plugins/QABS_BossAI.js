//=============================================================================
// QABS_BossAI.js
// Plugin Boss AI nâng cao cho RPG Maker MV
//=============================================================================

/*:
 * @plugindesc Boss AI System với skills nâng cao và phase transitions
 * @author YourName
 * 
 * @param AI Update Interval
 * @desc Số frames giữa mỗi lần update AI (càng cao càng tiết kiệm hiệu suất)
 * @type number
 * @default 5
 * 
 * @param Default Jump Range
 * @desc Khoảng cách nhảy tối đa (pixels)
 * @type number
 * @default 400
 * 
 * @param Jump AOE Radius
 * @desc Bán kính AOE damage khi nhảy (pixels)
 * @type number
 * @default 100
 * 
 * @param Minion Limit
 * @desc Số lượng minion tối đa có thể triệu hồi cùng lúc
 * @type number
 * @default 5
 * 
 * @help
 * ============================================================================
 * HƯỚNG DẪN BOSS AI SYSTEM
 * ============================================================================
 * 
 * ============================================================================
 * SETUP BOSS - 2 BƯỚC ĐƠN GIẢN
 * ============================================================================
 * 
 * BƯỚC 1: Tạo Enemy trong Database > Enemies
 * 
 * Vào Database > Enemies > Note, thêm các tags sau:
 * 
 * <bossAI: phase-based>
 *   - AI pattern: aggressive, defensive, hoặc phase-based
 * 
 * <bossSkills>
 * attack: 7
 * jumpAttack: 8
 * </bossSkills>
 *   - Danh sách skill IDs boss có thể dùng
 * 
 * <skillPhase: jumpAttack, 1>
 *   - Skill unlock từ phase nào (1, 2, hoặc 3)
 * 
 * <skillCooldown: jumpAttack, 180>
 * <skillCooldown: attack, 180>
 *   - Cooldown cho mỗi skill (frames, 60 frames = 1 giây)
 * 
 * <skillTelegraph: jumpAttack, 20>
 *   - Warning time trước khi dùng skill (frames)
 * 
 * ============================================================================
 * JUMP ATTACK FLOW
 * ============================================================================
 * 1. Boss dừng di chuyển
 * 2. Boss chạy animation "jumpstart{direction}"
 * 3. Hiện warning.png tại vị trí player (img/pictures/warning.png)
 * 4. Boss teleport đến player
 * 5. QABS chạy absSequence của skill (animation + trigger damage + knockback)
 * 6. Boss chạy animation "jumpend" (do absSequence handle)
 * 7. Boss di chuyển bình thường trở lại
 *
 * NOTE: Damage do QABS absSequence xử lý qua lệnh "trigger".
 *       BossAI KHÔNG tự tính damage thủ công để tránh double damage.
 * ============================================================================
 */

(function() {
    'use strict';
    
    var parameters = PluginManager.parameters('QABS_BossAI');
    var aiUpdateInterval = Number(parameters['AI Update Interval'] || 5);
    var defaultJumpRange = Number(parameters['Default Jump Range'] || 400);
    var jumpAOERadius = Number(parameters['Jump AOE Radius'] || 100);
    var minionLimit = Number(parameters['Minion Limit'] || 5);
    
    // ========================
    // Boss AI Manager
    // ========================
    function BossAI() {
        throw new Error('This is a static class');
    }
    
    BossAI._bosses = {};
    BossAI._frameCount = 0;
    
    BossAI.register = function(eventId, bossData) {
        this._bosses[eventId] = bossData;
    };
    
    BossAI.getBoss = function(eventId) {
        return this._bosses[eventId];
    };
    
    BossAI.update = function() {
        this._frameCount++;
        if (this._frameCount % aiUpdateInterval !== 0) return;
        
        for (var eventId in this._bosses) {
            var boss = this._bosses[eventId];
            if (boss && boss.event && !boss.event._erased) {
                this.updateBoss(boss);
            }
        }
    };
    
    BossAI.updateBoss = function(boss) {
        if (!boss.event.battler() || boss.event.battler().isDead()) return;
        if (boss.isTransitioning) return;
        if (boss.isTelegraphing) return;
        if (boss.isExecutingSkill) return; // Block any skill while one is running
        
        // FORCE DISABLE RETURN - even when off-screen
        var battler = boss.event.battler();
        if (battler) {
            battler._aiReturn = false;
            battler._returnAfter = 999999;
        }
        
        // Prevent event from resetting position
        if (boss.event._locked) {
            boss.event._locked = false;
        }
        
        // Debug: Check QSprite availability once
        if (!boss._qspriteChecked) {
            boss._qspriteChecked = true;
            var sprite = boss.event.qSprite ? boss.event.qSprite() : null;
            console.log('Boss QSprite check:', !!sprite, 'Character:', boss.event.characterName());
        }
        
        // Update phase
        this.checkPhaseTransition(boss);
        
        // Update cooldowns
        this.updateCooldowns(boss);
        
        // Select and execute skill
        if (boss.actionWait <= 0) {
            this.selectAndExecuteSkill(boss);
            boss.actionWait = 60; // Wait 60 frames (1 second) before next action check
        } else {
            boss.actionWait = Math.max(0, boss.actionWait - aiUpdateInterval);
        }
    };
    
    BossAI.checkPhaseTransition = function(boss) {
        var battler = boss.event.battler();
        var hpPercent = (battler.hp / battler.mhp) * 100;
        
        var newPhase = boss.currentPhase;
        
        if (hpPercent > 60) {
            newPhase = 1;
        } else if (hpPercent > 30) {
            newPhase = 2;
        } else {
            newPhase = 3;
        }
        
        if (newPhase !== boss.currentPhase && !boss.phaseTransitioned[newPhase]) {
            this.transitionToPhase(boss, newPhase);
        }
    };
    
    BossAI.transitionToPhase = function(boss, newPhase) {
        console.log('Boss transitioning to Phase', newPhase);
        boss.currentPhase = newPhase;
        boss.phaseTransitioned[newPhase] = true;
        boss.isTransitioning = true;
        
        // Play transition animation if QSprite is available
        var event = boss.event;
        var sprite = event.qSprite ? event.qSprite() : null;
        if (sprite && sprite.changeAnimation) {
            sprite.changeAnimation('idle' + event.direction());
        }
        
        // End transition after 1 second
        setTimeout(function() {
            boss.isTransitioning = false;
        }, 1000);
    };
    
    BossAI.updateCooldowns = function(boss) {
        for (var skillKey in boss.cooldowns) {
            if (boss.cooldowns[skillKey] > 0) {
                boss.cooldowns[skillKey] = Math.max(0, boss.cooldowns[skillKey] - aiUpdateInterval);
            }
        }
    };
    
    BossAI.selectAndExecuteSkill = function(boss) {
        var player = $gamePlayer;
        var distance = $gameMap.distance(boss.event.x, boss.event.y, player.x, player.y);
        var pixelDistance = distance * $gameMap.tileWidth();
        
        // Boss needs to be aware of player first
        var battler = boss.event.battler();
        if (battler) {
            if (battler._aiTarget !== player) {
                battler._aiTarget = player;
                console.log('Boss locked onto player');
            }
            
            // UNLIMITED sight range - boss can see player anywhere on map
            battler._sightRange = 9999;
            battler._attackRange = 9999;
        }
        
        console.log('Boss selecting skill, Distance:', Math.floor(pixelDistance) + 'px');
        
        var availableSkills = this.getAvailableSkills(boss);
        if (availableSkills.length === 0) {
            // All skills are on cooldown - wait for next cycle
            console.log('No available skills, all on cooldown');
            return;
        }
        
        console.log('Available skills:', availableSkills.length, 'Distance:', Math.floor(pixelDistance) + 'px');
        
        // Select skill based on AI pattern and distance
        var targetSkill = this.selectBestSkill(boss, availableSkills);
        if (targetSkill) {
            console.log('Selected skill:', targetSkill.key, 'for distance:', Math.floor(pixelDistance) + 'px');
            this.executeSkill(boss, targetSkill);
        } else {
            console.log('No suitable skill selected for current distance');
        }
    };
    
    BossAI.getAvailableSkills = function(boss) {
        var available = [];
        
        console.log('Checking available skills for phase', boss.currentPhase);
        
        for (var skillKey in boss.skills) {
            var skillId = boss.skills[skillKey];
            var phaseReq = boss.skillPhases[skillKey] || 1;
            var cooldown = boss.cooldowns[skillKey] || 0;
            
            console.log('  Skill:', skillKey, 'Phase req:', phaseReq, 'Cooldown:', cooldown);
            
            // Check phase requirement
            if (boss.currentPhase < phaseReq) {
                console.log('    -> Locked (need phase ' + phaseReq + ')');
                continue;
            }
            
            // STRICT COOLDOWN CHECK
            if (cooldown > 0) {
                console.log('    -> On cooldown (' + cooldown + ' frames left)');
                continue;
            }
            
            // Block basic attack while boss is executing jump attack
            if (skillKey === 'attack' && boss.isJumping) {
                console.log('    -> Attack blocked: boss is jumping');
                continue;
            }
            
            // Check minion limit for summon skill
            if (skillKey === 'summonMinions' && boss.minionCount >= minionLimit) {
                console.log('    -> Minion limit reached');
                continue;
            }
            
            console.log('    -> Available!');
            available.push({
                key: skillKey,
                id: skillId
            });
        }
        
        console.log('Total available skills:', available.length);
        return available;
    };
    
    BossAI.selectBestSkill = function(boss, availableSkills) {
        if (availableSkills.length === 0) return null;
        
        var player = $gamePlayer;
        var dx = player.cx() - boss.event.cx();
        var dy = player.cy() - boss.event.cy();
        var pixelDistance = Math.sqrt(dx * dx + dy * dy);
        var distance = pixelDistance / $gameMap.tileWidth();
        
        // Force jump attack if available and distance >= 9
        var hasJumpAttack = availableSkills.some(function(s) { return s.key === 'jumpAttack'; });
        if (hasJumpAttack && distance >= 9) {
            var jumpSkill = availableSkills.find(function(s) { return s.key === 'jumpAttack'; });
            console.log('Forced jump attack due to distance >= 9 tiles');
            return jumpSkill;
        }
        
        // Select skill based on AI pattern and distance
        var weighted = [];
        
        for (var i = 0; i < availableSkills.length; i++) {
            var skill = availableSkills[i];
            var weight = 0;
            
            // Skip jumpAttack if it wasn't forced above
            if (skill.key === 'jumpAttack') {
                continue;
            }
            
            if (skill.key === 'attack') {
                // Melee attack: only if close enough to hit (pixel distance <= 80 / ~1.6 tiles)
                if (pixelDistance <= 80) {
                    weight = 10;
                }
            } else if (skill.key === 'chargeAttack') {
                // Charge attack: only at medium-long range (120px to 350px)
                if (pixelDistance >= 120 && pixelDistance <= 350) {
                    weight = 4;
                }
            } else if (skill.key === 'projectile') {
                // Projectile: only at medium-long range (>= 120px)
                if (pixelDistance >= 120) {
                    weight = 5;
                }
            }
            
            // Add to weighted array
            for (var j = 0; j < weight; j++) {
                weighted.push(skill);
            }
        }
        
        if (weighted.length === 0) {
            console.log('No skills meet distance requirements');
            return null;
        }
        
        // Random select from weighted array
        var selected = weighted[Math.floor(Math.random() * weighted.length)];
        return selected;
    };
    
    BossAI.executeSkill = function(boss, skill) {
        var event = boss.event;
        var telegraph = boss.skillTelegraphs[skill.key] || 0;
        
        // CHECK COOLDOWN AGAIN before execute
        if (boss.cooldowns[skill.key] && boss.cooldowns[skill.key] > 0) {
            console.warn('✗ Skill', skill.key, 'still on cooldown:', boss.cooldowns[skill.key]);
            return;
        }
        
        if (telegraph > 0) {
            // Telegraph skill
            this.telegraphSkill(boss, skill, telegraph);
        } else {
            // Execute immediately
            this.performSkill(boss, skill);
        }
    };
    
    BossAI.telegraphSkill = function(boss, skill, duration) {
        console.log('Telegraphing skill:', skill.key);
        boss.isTelegraphing = true;
        
        var event = boss.event;
        
        // Play idle animation during telegraph
        var sprite = event.qSprite ? event.qSprite() : null;
        if (sprite && sprite.changeAnimation) {
            sprite.changeAnimation('idle' + event.direction());
        }
        
        // Execute skill after telegraph
        setTimeout(function() {
            boss.isTelegraphing = false;
            BossAI.performSkill(boss, skill);
        }, duration * 16.67); // Convert frames to ms
    };
    
    // =========================================================================
    // performSkill - Core skill execution
    // NOTE: For jumpAttack, damage is handled ENTIRELY by QABS absSequence
    //       via the "trigger" command. BossAI only handles movement/animation.
    //       Do NOT add manual damage here to avoid double damage.
    // =========================================================================
    BossAI.performSkill = function(boss, skill) {
        console.log('Boss executing skill:', skill.key, 'ID:', skill.id);
        
        // FINAL CHECK before execute
        if (boss.cooldowns[skill.key] > 0) {
            console.error('✗✗✗ BLOCKED:', skill.key, 'cooldown:', boss.cooldowns[skill.key]);
            return;
        }
        
        var event = boss.event;
        var battler = event.battler();
        
        if (!battler) return;
        
        // LOCK boss to prevent multiple skills
        boss.isExecutingSkill = true;
        
        // Set cooldown IMMEDIATELY to prevent re-entry
        var cooldown = boss.skillCooldowns[skill.key] || 180;
        boss.cooldowns[skill.key] = cooldown;
        console.log('Cooldown set:', skill.key, '→', cooldown + ' frames');
        
        // =====================================================================
        // JUMP ATTACK - Special handling
        // Flow: stop movement → jumpstart pose → show warning → teleport → 
        //       useSkill (QABS handles animation+damage via absSequence) →
        //       restore movement
        // =====================================================================
        if (skill.key === 'jumpAttack') {
            var player = $gamePlayer;
            
            // Mark boss as jumping to block basic attack
            boss.isJumping = true;
            
            // Save original speed and STOP MOVEMENT immediately
            var originalSpeed = event.moveSpeed();
            event.setMoveSpeed(0);
            event._moveRouteForcing = false;
            event._moveRoute = null;
            
            // STEP 1: Play jumpstart animation (~0ms)
            setTimeout(function() {
                var dir = event.direction();
                var poseName = 'jumpstart' + dir;
                
                if (event.playPose) {
                    event.playPose(poseName);
                    console.log('Playing jumpstart via event.playPose:', poseName);
                } else {
                    var sprite = event.qSprite ? event.qSprite() : null;
                    if (sprite && sprite.changeAnimation) {
                        sprite.changeAnimation(poseName);
                        console.log('Playing jumpstart via sprite.changeAnimation:', poseName);
                    } else {
                        console.log('⚠ Cannot play jumpstart - no method available');
                    }
                }
                
                // Play jump sound
                AudioManager.playSe({name: 'Jump1', volume: 90, pitch: 100, pan: 0});
            }, 50);
            
            // STEP 2: Show warning image at player position (~800ms into animation)
            // warning.png is in img/pictures/
            setTimeout(function() {
                if ($gameScreen && $gameScreen.showPicture) {
                    // Picture ID 90 (use a high ID to avoid conflicts)
                    // Show centered at player's screen position (origin = 1)
                    var pw = $gameMap.tileWidth();
                    var ph = $gameMap.tileHeight();
                    var sx = $gamePlayer.screenX();
                    var sy = $gamePlayer.screenY() - ph / 2;
                    $gameScreen.showPicture(90, 'warning', 1, sx, sy, 100, 100, 128, 0);
                    console.log('Warning shown at player position:', sx, sy);
                    
                    // Hide warning after 700ms (before impact)
                    setTimeout(function() {
                        $gameScreen.erasePicture(90);
                        console.log('Warning hidden');
                    }, 700);
                }
            }, 800);
            
            // STEP 3: Teleport boss to player position (~1500ms)
            setTimeout(function() {
                var targetX = player.x;
                var targetY = player.y;
                event.locate(targetX, targetY);
                // Jump arc effect
                event._jumpPeak = 48;
                event._jumpCount = 48;
                console.log('Boss teleported to player at:', targetX, targetY);
            }, 1500);
            
            // STEP 4: Trigger QABS skill at new position (~1600ms)
            // absSequence of skill 8 will handle:
            //   - user animation 118 (impact effect)
            //   - user pose jumpend true
            //   - se Earth4 (landing sound)
            //   - trigger (damage type None in database)
            //   - user pose idle true
            setTimeout(function() {
                if (event.useSkill) {
                    var qabsSkill = event.useSkill(skill.id);
                    if (qabsSkill) {
                        qabsSkill._target = player;
                        console.log('✓ Jump skill triggered via QABS at new position');
                    } else {
                        console.warn('✗ useSkill returned null for skill:', skill.id);
                    }
                }
            }, 1600);
            
            // STEP 4b: Force manual damage check when boss lands (~2430ms)
            setTimeout(function() {
                var battler = event.battler();
                var playerChar = $gamePlayer;
                var playerBattler = playerChar.battler ? playerChar.battler() : null;
                
                if (!playerBattler) {
                    console.log('✗ Player battler not found');
                    return;
                }
                
                if (battler && playerBattler) {
                    var dx = playerChar.cx() - event.cx();
                    var dy = playerChar.cy() - event.cy();
                    var distance = Math.sqrt(dx * dx + dy * dy);
                    
                    console.log('Distance check:', distance, 'AOE radius: 72');
                    
                    if (distance <= 72) {
                        // Apply damage: atk * 6 - def * 2
                        var damage = Math.max(0, battler.atk * 6 - playerBattler.def * 2);
                        playerBattler.gainHp(-damage);
                        
                        console.log('✓ Damage applied:', damage, 'HP:', playerBattler.hp, '/', playerBattler.mhp);
                        
                        // Knockback - push AWAY from boss (not backward from player)
                        if (distance > 0) {
                            var angle = Math.atan2(dy, dx); // Angle FROM boss TO player
                            var knockbackDist = 1.5; // 1.5 tiles push back
                            var newX = playerChar.x + Math.cos(angle) * knockbackDist;
                            var newY = playerChar.y + Math.sin(angle) * knockbackDist;
                            playerChar.locate(Math.round(newX), Math.round(newY));
                        }
                        
                        // Animation
                        if (playerChar.requestAnimation) {
                            playerChar.requestAnimation(1); // Play hit physical animation on player
                        }
                    } else {
                        console.log('✗ Player out of range');
                    }
                }
            }, 2430);
            
            // STEP 5: Restore movement after all animations complete (~3800ms)
            setTimeout(function() {
                event.setMoveSpeed(originalSpeed);
                boss.isJumping = false;
                boss.isExecutingSkill = false;
                console.log('Boss jump attack complete, movement restored. Speed:', originalSpeed);
            }, 3800);
            
            return;
        }
        
        // =====================================================================
        // DEFAULT SKILL EXECUTION (attack, projectile, etc.)
        // Let QABS handle everything via useSkill → absSequence
        // =====================================================================
        if (event.useSkill) {
            var qabsSkill = event.useSkill(skill.id);
            if (qabsSkill) {
                var player = $gamePlayer;
                qabsSkill._target = player;
                console.log('✓ Skill executed:', skill.id, 'Target:', player.characterName());
            } else {
                console.warn('✗ useSkill returned null for skill:', skill.id);
            }
        } else {
            console.warn('Event does not have useSkill method');
        }
        
        // UNLOCK after absSequence has time to run (based on Skill 7 absSequence timing)
        // Skill 7: lock → pose → move forward → wait5 → trigger → wait10 → unlock
        // ≈ (5+10) frames × 16.67ms + buffer = ~500ms is safe
        setTimeout(function() {
            boss.isExecutingSkill = false;
        }, 500);
    };
    
    // ========================
    // Game_Event - Boss Setup
    // ========================
    var _Game_Event_setupBattler = Game_Event.prototype.setupBattler;
    Game_Event.prototype.setupBattler = function() {
        _Game_Event_setupBattler.call(this);
        
        // Check Event Note for <bossAI> trigger
        var eventNote = this.event().note || '';
        if (eventNote.match(/<bossAI>/i)) {
            // Delay setup to ensure battler and QSprite are ready
            var self = this;
            setTimeout(function() {
                if (self.battler() && !self.battler().isDead()) {
                    self.setupBossAI();
                }
            }, 500);
        }
    };
    
    Game_Event.prototype.setupBossAI = function() {
        var battler = this.battler();
        if (!battler) {
            console.warn('Boss AI: No battler found for event', this.eventId());
            return;
        }
        
        // OVERRIDE isNearTheScreen for this boss - always return true
        this.isNearTheScreen = function() {
            return true;
        };
        
        // OVERRIDE findRespawnLocation - prevent position reset
        this.findRespawnLocation = function() {
            console.log('Boss findRespawnLocation blocked');
        };
        
        // OVERRIDE respawn to prevent any position change
        this.respawn = function() {
            console.log('Boss respawn blocked');
        };
        
        // DISABLE RETURN BEHAVIOR
        battler._aiReturn = false;
        battler._returnAfter = 999999;
        battler._aiNoReturn = true;
        
        // SET UNLIMITED RANGES
        battler._sightRange = 9999;
        battler._attackRange = 9999;
        battler._chaseRange = 9999;
        this._aiRange = 99999; // Infinite QABS simple AI chase/agro range
        
        // DISABLE HOME POSITION
        if (this._homeX !== undefined) {
            this._homeX = null;
            this._homeY = null;
        }
        if (this._originX !== undefined) {
            this._originX = null;
            this._originY = null;
        }
        
        var enemyId = battler._enemyId;
        var enemy = $dataEnemies[enemyId];
        if (!enemy) {
            console.warn('Boss AI: No enemy data found for ID', enemyId);
            return;
        }
        
        var note = enemy.note || '';
        
        // Check if this enemy has boss AI configured
        if (!note.match(/<bossAI:/i)) {
            console.warn('Boss AI: Enemy', enemyId, 'does not have <bossAI> tag');
            return;
        }
        
        var bossData = {
            event: this,
            enemyId: enemyId,
            aiPattern: 'phase-based',
            currentPhase: 1,
            phaseTransitioned: {},
            skills: {},
            skillPhases: {},
            skillCooldowns: {},
            skillTelegraphs: {},
            cooldowns: {},
            actionWait: 0,
            minionCount: 0,
            minionConfig: { enemyId: 0, count: 1 },
            isTransitioning: false,
            isTelegraphing: false,
            isExecutingSkill: false,
            isJumping: false  // NEW: tracks jump attack state to block basic attack
        };
        
        // Parse AI pattern from Enemy Note
        var aiMatch = note.match(/<bossAI:\s*(\w+)>/i);
        if (aiMatch) {
            bossData.aiPattern = aiMatch[1].toLowerCase();
        }
        
        // Parse skills from Enemy Note
        var skillsMatch = note.match(/<bossSkills>([\s\S]*?)<\/bossSkills>/i);
        if (skillsMatch) {
            var skillLines = skillsMatch[1].trim().split('\n');
            for (var i = 0; i < skillLines.length; i++) {
                var line = skillLines[i].trim();
                if (!line) continue;
                var parts = line.split(':');
                if (parts.length === 2) {
                    var key = parts[0].trim();
                    var id = parseInt(parts[1].trim());
                    if (!isNaN(id)) {
                        bossData.skills[key] = id;
                        bossData.cooldowns[key] = 0; // Initialize cooldown to 0
                    }
                }
            }
        }
        
        // Parse skill phases from Enemy Note
        var phaseMatches = note.match(/<skillPhase:\s*(\w+),\s*(\d+)>/gi);
        if (phaseMatches) {
            for (var i = 0; i < phaseMatches.length; i++) {
                var match = phaseMatches[i].match(/<skillPhase:\s*(\w+),\s*(\d+)>/i);
                if (match) {
                    bossData.skillPhases[match[1]] = parseInt(match[2]);
                }
            }
        }
        
        // Parse skill cooldowns from Enemy Note
        var cdMatches = note.match(/<skillCooldown:\s*(\w+),\s*(\d+)>/gi);
        if (cdMatches) {
            for (var i = 0; i < cdMatches.length; i++) {
                var match = cdMatches[i].match(/<skillCooldown:\s*(\w+),\s*(\d+)>/i);
                if (match) {
                    bossData.skillCooldowns[match[1]] = parseInt(match[2]);
                }
            }
        }
        
        // Parse skill telegraphs from Enemy Note
        var telMatches = note.match(/<skillTelegraph:\s*(\w+),\s*(\d+)>/gi);
        if (telMatches) {
            for (var i = 0; i < telMatches.length; i++) {
                var match = telMatches[i].match(/<skillTelegraph:\s*(\w+),\s*(\d+)>/i);
                if (match) {
                    bossData.skillTelegraphs[match[1]] = parseInt(match[2]);
                }
            }
        }
        
        // Parse minion config from Enemy Note
        var minionMatch = note.match(/<minionConfig>([\s\S]*?)<\/minionConfig>/i);
        if (minionMatch) {
            var minionLines = minionMatch[1].trim().split('\n');
            for (var i = 0; i < minionLines.length; i++) {
                var line = minionLines[i].trim();
                if (!line) continue;
                var parts = line.split(':');
                if (parts.length === 2) {
                    var key = parts[0].trim();
                    var value = parseInt(parts[1].trim());
                    if (key === 'enemyId') bossData.minionConfig.enemyId = value;
                    if (key === 'count') bossData.minionConfig.count = value;
                }
            }
        }
        
        console.log('Boss AI initialized for Enemy ID', enemyId, ':', bossData);
        BossAI.register(this.eventId(), bossData);
        
        // Add boss skills to enemy's usable skills list
        var battlerRef = this.battler();
        if (battlerRef && battlerRef._skills) {
            for (var skillKey in bossData.skills) {
                var skillId = bossData.skills[skillKey];
                if (!battlerRef._skills.contains(skillId)) {
                    battlerRef._skills.push(skillId);
                    console.log('Added skill to boss battler:', skillId);
                }
            }
        }
    };
    
    // ========================
    // Scene_Map - Update Boss AI
    // ========================
    var _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        BossAI.update();
    };

    // =========================================================================
    // Overrides to integrate with QABS and disable default simple AI for Boss
    // =========================================================================
    var _QABSManager_bestAction = QABSManager.bestAction;
    QABSManager.bestAction = function(userId) {
        var chara = QPlus.getCharacter(userId);
        if (chara && typeof chara.eventId === 'function') {
            if (BossAI.getBoss(chara.eventId())) {
                return null; // Return null so simple AI doesn't execute skills for the Boss
            }
        }
        return _QABSManager_bestAction.call(this, userId);
    };

    var _Game_Event_canMove = Game_Event.prototype.canMove;
    Game_Event.prototype.canMove = function() {
        var boss = BossAI.getBoss(this.eventId());
        if (boss && (boss.isExecutingSkill || boss.isJumping || boss.isTelegraphing || boss.isTransitioning)) {
            return false;
        }
        return _Game_Event_canMove.call(this);
    };
    
    console.log('QABS_BossAI plugin loaded');
    
})();
