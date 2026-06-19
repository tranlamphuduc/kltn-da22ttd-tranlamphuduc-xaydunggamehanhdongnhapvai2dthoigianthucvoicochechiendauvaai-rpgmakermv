# Tasks

## Phase 1: Core Infrastructure Setup

### Task 1.1: Create QABS_Boss Plugin Structure
- [ ] Create `js/plugins/QABS_Boss.js` file
- [ ] Add plugin metadata and parameters
- [ ] Set up plugin dependency check for QABS, QSprite, QMovement
- [ ] Create namespace `QABS.Boss = {}`
- [ ] Add plugin registration in Plugin Manager
- [ ] Add console logging for plugin initialization

**Acceptance**: Plugin loads without errors, appears in Plugin Manager, logs initialization message

### Task 1.2: Implement Event Note Parser
- [ ] Create `ConfigParser` class in QABS_Boss.js
- [ ] Implement `parseEventNote(noteString)` method
- [ ] Parse `<bossAI:>`, `<bossSkills:>`, `<bossPhases:>` tags
- [ ] Parse skill configuration tags (skillType_, skillRange_, cooldown_, etc.)
- [ ] Return structured configuration object
- [ ] Add validation for required tags
- [ ] Add default value fallback for missing tags
- [ ] Log configuration errors to console

**Acceptance**: Parser extracts all tag types from event notes, returns valid configuration object, logs errors for invalid tags

### Task 1.3: Create Boss_AI_Manager Class
- [ ] Create `Boss_AI_Manager` class in QABS_Boss.js
- [ ] Add constructor accepting character and config parameters
- [ ] Initialize properties: _character, _config, _aiPattern, _aiEvalCounter
- [ ] Implement `update()` method called every frame
- [ ] Implement AI evaluation throttling (every 5 frames)
- [ ] Add `evaluateAI()` method skeleton
- [ ] Add `_isExecutingSkill` flag to prevent concurrent skill execution
- [ ] Add `_cachedDistance` and `_distanceCacheCounter` properties

**Acceptance**: Boss_AI_Manager instantiates correctly, update() runs every frame, evaluateAI() runs every 5 frames


### Task 1.4: Integrate Boss AI with QABS Character System
- [ ] Override `Game_CharacterBase.prototype.setupBattler` to detect boss events
- [ ] Check for `<bossAI:>` tag in event notes
- [ ] Parse boss configuration using ConfigParser
- [ ] Instantiate Boss_AI_Manager for boss events
- [ ] Store Boss_AI_Manager reference in `character._bossAI`
- [ ] Call `character._bossAI.update()` from `Game_CharacterBase.prototype.update`
- [ ] Add `_isBoss` flag to character for identification

**Acceptance**: Boss events initialize Boss_AI_Manager on setup, update() is called every frame during gameplay

## Phase 2: Phase Management System

### Task 2.1: Create Phase_Manager Class
- [ ] Create `Phase_Manager` class in QABS_Boss.js
- [ ] Add constructor accepting character and phase thresholds
- [ ] Initialize properties: _currentPhase = 1, _phaseThresholds, _triggeredPhases array
- [ ] Add _isTransitioning flag and _transitionTimer property
- [ ] Implement `update()` method
- [ ] Implement `getCurrentPhase()` getter method
- [ ] Implement `isTransitioning()` getter method
- [ ] Implement `getHPPercent()` helper method

**Acceptance**: Phase_Manager initializes with correct thresholds, tracks current phase, calculates HP percentage

### Task 2.2: Implement Phase Transition Logic
- [ ] Implement `checkPhaseTransition()` method in Phase_Manager
- [ ] Check HP percentage against phase thresholds
- [ ] Check _triggeredPhases array to prevent duplicate transitions
- [ ] Implement `transitionToPhase(phase)` method
- [ ] Set _isTransitioning = true and _transitionTimer = 60
- [ ] Add invulnerability state to boss battler (state ID 99)
- [ ] Set `character._bossTransitioning` lock flag
- [ ] Implement `completeTransition()` method
- [ ] Remove invulnerability state after 60 frames
- [ ] Unlock character movement
- [ ] Increment _currentPhase

**Acceptance**: Boss transitions to Phase 2 at 60% HP, transitions to Phase 3 at 30% HP, is invulnerable for 60 frames during transition


### Task 2.3: Add Phase Transition Visual Effects
- [ ] Implement `playTransitionEffect(phase)` in Phase_Manager
- [ ] Play animation on boss using `character.requestAnimation(100)`
- [ ] Create phase transition animation in RPG Maker database (ID 100)
- [ ] Play phase transition sound effect using AudioManager.playSe
- [ ] Add `audio/se/phase_transition.ogg` sound file
- [ ] Test animation and sound play correctly during transition

**Acceptance**: Boss plays animation and sound effect when transitioning phases, effects sync with 60-frame transition duration

## Phase 3: Skill Management System

### Task 3.1: Create Skill_Manager Class
- [ ] Create `Skill_Manager` class in QABS_Boss.js
- [ ] Add constructor accepting configuration object
- [ ] Initialize properties: _skillList, _cooldowns object, _cooldownConfigs
- [ ] Initialize _phaseSkills object mapping phase to skill IDs
- [ ] Initialize _cachedAvailableSkills array and _cachedPhase
- [ ] Implement `update()` method to decrement cooldowns
- [ ] Implement `isOnCooldown(skillId)` method
- [ ] Implement `startCooldown(skillId)` method

**Acceptance**: Skill_Manager tracks cooldowns, decrements each frame, reports accurate cooldown status

### Task 3.2: Implement Skill Availability System
- [ ] Implement `buildAvailableSkills(phase)` method
- [ ] Add Phase 1 skills to available list
- [ ] Add Phase 2 skills when phase >= 2
- [ ] Add Phase 3 skills when phase >= 3
- [ ] Implement `getAvailableSkills(phase)` method
- [ ] Cache available skills per phase
- [ ] Filter out skills currently on cooldown
- [ ] Return final available skill list

**Acceptance**: Phase 1 returns basic skills, Phase 2 adds jump/charge, Phase 3 adds summon, cooldown skills are excluded

### Task 3.3: Implement Skill Selection Logic
- [ ] Implement `selectSkill()` in Boss_AI_Manager
- [ ] Call `_skillManager.getAvailableSkills(currentPhase)`
- [ ] If no skills available, return defaultSkillId
- [ ] Implement `filterSkillsByDistance(skills)` method
- [ ] Filter skills by configured min/max range
- [ ] Add gap-closing skills if distance > 300px
- [ ] Implement `weightedRandomSelect(skills)` method
- [ ] Use skill priority weights from configuration
- [ ] Return selected skill ID

**Acceptance**: Boss selects appropriate skills based on phase, distance, and cooldowns, respects priority weights


## Phase 4: Telegraph System

### Task 4.1: Create Sprite_BossIndicator Class
- [ ] Create `Sprite_BossIndicator` class extending Sprite
- [ ] Implement `initialize(graphicName, x, y, size)` constructor
- [ ] Load picture graphic using ImageManager.loadPicture
- [ ] Set anchor to center (0.5, 0.5)
- [ ] Set initial position and size
- [ ] Implement `show(duration)` method
- [ ] Implement `fadeIn(frames)` method with opacity animation
- [ ] Implement `pulse(duration)` method with scale oscillation
- [ ] Implement `scaleAnimation(startScale, endScale, duration)` method
- [ ] Implement `update()` method to handle all animations
- [ ] Implement `remove()` method to clean up sprite

**Acceptance**: Sprite_BossIndicator displays picture graphic, animates fade-in, pulse, and scale correctly

### Task 4.2: Create Telegraph_System
- [ ] Create `Telegraph_System` static class in QABS_Boss.js
- [ ] Implement `Telegraph_System.show(character, skillConfig, onComplete)` method
- [ ] Create Sprite_BossIndicator with configured graphic
- [ ] Add indicator sprite to scene spriteset
- [ ] Lock character with `_telegraphing` flag
- [ ] Play charge-up animation (attack pose)
- [ ] Play charge-up sound effect (audio/se/charge_up.ogg)
- [ ] Start scale animation from 0.5 to 1.0
- [ ] Set timeout for telegraph duration
- [ ] Call onComplete callback after duration
- [ ] Remove indicator sprite
- [ ] Unlock character

**Acceptance**: Telegraph displays indicator at skill location, animates for configured duration, executes callback on completion

### Task 4.3: Integrate Telegraph with Skill Execution
- [ ] Modify `Boss_AI_Manager.executeSkill()` method
- [ ] Check if skill has telegraphDuration > 0
- [ ] If telegraphed, call Telegraph_System.show()
- [ ] Pass skill configuration and completion callback
- [ ] Set `_isExecutingSkill = true` during telegraph
- [ ] Execute skill handler in completion callback
- [ ] If not telegraphed, execute skill immediately

**Acceptance**: Telegraphed skills display warning before execution, non-telegraphed skills execute immediately

## Phase 5: Skill Handler Implementation

### Task 5.1: Create QABS_Boss_Skills Plugin
- [ ] Create `js/plugins/QABS_Boss_Skills.js` file
- [ ] Add plugin metadata and QABS_Boss dependency
- [ ] Create namespace `QABS.Boss.Skills = {}`
- [ ] Create base `Skill_Handler` class with execute() interface
- [ ] Add plugin to Plugin Manager list
- [ ] Verify plugin loads after QABS_Boss

**Acceptance**: QABS_Boss_Skills plugin loads correctly, base Skill_Handler class defined


### Task 5.2: Implement Jump_Skill_Handler
- [ ] Create `Jump_Skill_Handler` class in QABS_Boss_Skills.js
- [ ] Implement `execute(character, config, callback)` method
- [ ] Implement `calculateLandingPosition(fromX, fromY, toX, toY, maxRange)` helper
- [ ] Clamp landing position to 400px max range
- [ ] Implement `playJumpStart(character, callback)` method
- [ ] Play boss1 jumpstart{direction} pose using character.playPose()
- [ ] Wait 28 frames for animation completion
- [ ] Implement `showWarningIndicator(x, y)` method
- [ ] Create Sprite_BossIndicator at landing location
- [ ] Display for 30 frames
- [ ] Implement `moveTo(character, targetX, targetY, duration, callback)` method
- [ ] Interpolate position over 30 frames with ease-out curve
- [ ] Add invulnerability state during jump
- [ ] Implement `playJumpEnd(character, callback)` method
- [ ] Play boss1 jumpend{direction} pose
- [ ] Implement `dealAOEDamage(centerX, centerY, radius, skillId)` method
- [ ] Get all targets in 100px radius
- [ ] Apply QABS damage calculation for each target
- [ ] Implement `applyKnockback(target, fromX, fromY, distance)` method
- [ ] Calculate knockback direction and apply 50px displacement
- [ ] Remove invulnerability state
- [ ] Call completion callback

**Acceptance**: Boss jumps to target location with correct animations, deals AOE damage in 100px radius, applies knockback, 180-frame cooldown

### Task 5.3: Implement Projectile_Skill_Handler
- [ ] Create `Projectile_Skill_Handler` class in QABS_Boss_Skills.js
- [ ] Implement `execute(character, config, callback)` method
- [ ] Implement `getProjectileAngles(pattern, character)` method
- [ ] Calculate single-shot angle toward player
- [ ] Calculate multi-shot angles (3 projectiles, 15° separation)
- [ ] Calculate circular angles (8 projectiles, 45° separation)
- [ ] Implement `spawnProjectile(character, config, angle)` method
- [ ] Call character.forceSkill() with projectile skill ID
- [ ] Pass radian angle in forced options
- [ ] Set projectile moveSpeed to 10 pixels/frame
- [ ] Set lifespan to 300 frames
- [ ] Rotate projectile picture graphic to match angle
- [ ] Override skill.update() to track lifespan and despawn
- [ ] Implement `getAngleToPlayer(character)` helper
- [ ] Call callback immediately (projectiles are fire-and-forget)

**Acceptance**: Boss fires projectiles in configured patterns (single/multi/circular), projectiles move at correct speed, despawn after 300 frames

### Task 5.4: Implement AOE_Skill_Handler
- [ ] Create `AOE_Skill_Handler` class in QABS_Boss_Skills.js
- [ ] Implement `execute(character, config, callback)` method
- [ ] Implement `getTargetLocation(config, character)` method
- [ ] Handle 'player', 'self', and 'custom' target types
- [ ] Create Sprite_BossIndicator at target location
- [ ] Call fadeIn(10) for 10-frame fade-in
- [ ] Call pulse(telegraphDuration) for pulsing effect
- [ ] Add indicator to scene spriteset
- [ ] Set timeout for telegraph duration
- [ ] Play damage animation at target location using character.requestAnimation()
- [ ] Implement `dealAOEDamage(centerX, centerY, config)` method
- [ ] Create QABS collider (circle or box) at target
- [ ] Get all targets using ColliderManager.getCharactersNear()
- [ ] Check collider intersection for each target
- [ ] Apply damage using QABS damage calculation
- [ ] Remove indicator sprite
- [ ] Call completion callback

**Acceptance**: Boss displays AOE warning indicator, waits for telegraph duration, deals damage in configured area shape


### Task 5.5: Implement Charge_Skill_Handler
- [ ] Create `Charge_Skill_Handler` class in QABS_Boss_Skills.js
- [ ] Implement `execute(character, config, callback)` method
- [ ] Implement `showChargeIndicator(character, duration)` method
- [ ] Create directional arrow sprite pointing in charge direction
- [ ] Display for telegraph duration (30 frames)
- [ ] Implement `performCharge(character, radian, config, callback)` method
- [ ] Lock character direction
- [ ] Play move pose animation
- [ ] Create rectangular charge collider (48px wide, 200px long)
- [ ] Start charge loop at 15 pixels/frame
- [ ] Implement terrain collision check using character.canPass()
- [ ] Implement `checkChargeCollisions(character, collider, config)` method
- [ ] Get characters near charge collider
- [ ] Check collider intersection
- [ ] Apply damage to hit targets
- [ ] Mark targets as hit to prevent duplicate damage
- [ ] Stop charge on terrain collision or 400px distance
- [ ] Implement `stopCharge(character, interval, callback)` method
- [ ] Clear charge interval
- [ ] Play idle pose
- [ ] Wait 20 frames for recovery
- [ ] Call completion callback
- [ ] Implement `directionToRadian(direction)` helper

**Acceptance**: Boss charges forward in current direction, deals damage to all collided targets, stops on terrain or max distance

### Task 5.6: Implement Summon_Skill_Handler
- [ ] Create `Summon_Skill_Handler` class in QABS_Boss_Skills.js
- [ ] Implement `execute(character, config, callback)` method
- [ ] Implement `countActiveMinions(character)` method
- [ ] Count living minion events with matching _bossMasterId
- [ ] Check if current minions >= maxMinions, return early if at limit
- [ ] Play casting animation (attack pose) for 60 frames
- [ ] Calculate spawn count (min of summonCount and remaining capacity)
- [ ] Implement `getMinionSpawnPositions(character, count, radius)` method
- [ ] Calculate circular positions around boss at configured radius
- [ ] Distribute evenly with 360° / count angle separation
- [ ] Implement `spawnMinionAt(x, y, enemyId, boss)` method
- [ ] Create new Game_Event with minion data
- [ ] Add to $gameMap._events array
- [ ] Initialize QABS battler with enemy ID
- [ ] Set _teamId to match boss team
- [ ] Set _bossMinion = true and _bossMasterId
- [ ] Add sprite to scene spriteset
- [ ] Call completion callback

**Acceptance**: Boss summons configured number of minions around itself, respects 5-minion maximum, minions have correct team and enemy stats

## Phase 6: Visual Assets and UI

### Task 6.1: Create Telegraph Indicator Graphics
- [ ] Create `img/pictures/aoe_warning_circle.png` (256x256, red circle outline)
- [ ] Create `img/pictures/aoe_warning_box.png` (256x256, red rectangle outline)
- [ ] Create `img/pictures/jump_warning.png` (200x200, red target marker)
- [ ] Create `img/pictures/charge_arrow.png` (128x256, directional arrow)
- [ ] Create `img/pictures/projectile_orb.png` (48x48, energy orb sprite)
- [ ] Ensure all images have transparency
- [ ] Test images load correctly in game

**Acceptance**: All indicator graphics display correctly, are visible against various backgrounds


### Task 6.2: Create Sound Effects
- [ ] Create or source `audio/se/phase_transition.ogg` (dramatic sting)
- [ ] Create or source `audio/se/charge_up.ogg` (energy charging sound)
- [ ] Create or source `audio/se/boss_jump.ogg` (heavy impact sound)
- [ ] Create or source `audio/se/boss_charge.ogg` (rushing wind sound)
- [ ] Normalize audio levels to match existing game sounds
- [ ] Test all sound effects play correctly at correct timing

**Acceptance**: All sound effects play at appropriate moments, volume levels match existing game audio

### Task 6.3: Create Sprite_ChargeArrow Class
- [ ] Create `Sprite_ChargeArrow` class extending Sprite
- [ ] Implement constructor accepting character and direction
- [ ] Load charge_arrow.png graphic
- [ ] Position sprite in front of character based on direction
- [ ] Rotate sprite to match charge direction
- [ ] Implement `show(duration)` method with pulse animation
- [ ] Implement `update()` method to follow character position
- [ ] Implement `remove()` cleanup method

**Acceptance**: Charge arrow displays in front of boss, points in charge direction, pulses during telegraph

## Phase 7: Database Configuration

### Task 7.1: Create Boss Skills in Database
- [ ] Create Skill 50: Boss Basic Attack (melee, 100px range)
- [ ] Add note tags: `<collider:circle,48>`, `<range:100>`
- [ ] Set damage formula: `80 + a.atk * 2 - b.def`
- [ ] Create Skill 51: Boss Projectile (projectile type)
- [ ] Add note tags: `<type:projectile>`, `<collider:circle,24>`, `<through:0>`, `<speed:10>`, `<picture:projectile_orb>`
- [ ] Set damage formula: `100 + a.mat * 2`
- [ ] Create Skill 52: Boss Ground Slam (AOE)
- [ ] Add note tags: `<collider:circle,120>`, `<range:300>`
- [ ] Set damage formula: `120 + a.atk * 3`
- [ ] Create Skill 53: Boss Jump Attack
- [ ] Add note tags: `<collider:circle,100>`, `<range:400>`
- [ ] Set damage formula: `150 + a.atk * 3`
- [ ] Create Skill 54: Boss Charge
- [ ] Add note tags: `<collider:box,48,200>`, `<range:400>`
- [ ] Set damage formula: `130 + a.atk * 2.5`
- [ ] Create Skill 55: Summon Minions (non-damage)
- [ ] Set damage type to None
- [ ] Test all skills appear in database correctly

**Acceptance**: All 6 boss skills configured in database with correct damage formulas and note tags

### Task 7.2: Create Boss Enemy in Database
- [ ] Create Enemy 10: "Final Boss" in database
- [ ] Set appropriate stats (HP: 5000, ATK: 150, DEF: 100, MAT: 120)
- [ ] Add all boss skills (50-55) to skill list
- [ ] Set enemy graphic to boss1 sprite
- [ ] Test enemy data loads correctly

**Acceptance**: Boss enemy configured with correct stats and skill list


### Task 7.3: Create Boss Event Template
- [ ] Create test map for boss battle
- [ ] Create boss event on map
- [ ] Set event graphic to %boss1
- [ ] Configure Page 1 (Living Boss):
  - [ ] Priority: Same as characters
  - [ ] Trigger: Event Touch
  - [ ] Autonomous Movement: None
- [ ] Add Event_Note configuration to Page 1:
```
<enemy:10>
<noRespawn>
<bossAI: phase-based>
<bossSkills: 50,51,52,53,54,55>
<bossPhases: 60,30>
<defaultSkill: 50>
<skillType_50: basic>
<skillRange_50: 0,100>
<skillPriority_50: 2>
<cooldown_50: 60>
<skillType_51: projectile>
<projectilePattern_51: single>
<projectileSkillId_51: 51>
<skillRange_51: 100,400>
<skillPriority_51: 3>
<cooldown_51: 90>
<skillType_52: aoe>
<aoeRadius_52: 120>
<colliderShape_52: circle>
<colliderSize_52: 120>
<targetType_52: player>
<indicatorGraphic_52: aoe_warning_circle>
<animationId_52: 45>
<skillRange_52: 0,300>
<skillPriority_52: 2>
<telegraph_52: 45>
<cooldown_52: 150>
<skillType_53: jump>
<skillRange_53: 0,400>
<skillPriority_53: 4>
<telegraph_53: 30>
<cooldown_53: 180>
<phaseUnlock_53: 2>
<skillType_54: charge>
<chargeSpeed_54: 15>
<chargeDistance_54: 400>
<colliderWidth_54: 48>
<colliderLength_54: 200>
<skillRange_54: 0,600>
<skillPriority_54: 3>
<telegraph_54: 30>
<cooldown_54: 150>
<phaseUnlock_54: 2>
<skillType_55: summon>
<minionEnemyId_55: 5>
<summonCount_55: 3>
<maxMinions_55: 5>
<spawnRadius_55: 150>
<skillRange_55: 0,1000>
<skillPriority_55: 2>
<cooldown_55: 600>
<phaseUnlock_55: 3>
```
- [ ] Configure Page 2 (Corpse):
  - [ ] Condition: Self Switch D = ON
  - [ ] Priority: Below characters
  - [ ] Trigger: None
  - [ ] Direction Fix: ON
  - [ ] Through: ON
  - [ ] QSprite pose: die{direction}
- [ ] Add `<noRespawn>` tag to Page 2 notes
- [ ] Test event pages switch correctly

**Acceptance**: Boss event configured with living and corpse pages, all configuration tags present


## Phase 8: Corpse System Integration

### Task 8.1: Implement Boss Death Handler
- [ ] Override `Game_Battler.prototype.die` in QABS_Boss.js
- [ ] Check if battler belongs to boss character (_isBoss flag)
- [ ] Initialize `$gameSystem._dayNightData.corpsePositions` if needed
- [ ] Create corpse key: `${mapId}_${eventId}`
- [ ] Save corpse data: position (x, y) and direction
- [ ] Activate Self Switch D using character.setSelfSwitch('D', true)
- [ ] Play die pose: `character.playPose('die' + character.direction())`
- [ ] Test corpse persists across map transfers
- [ ] Test corpse persists after save/load

**Acceptance**: Boss activates corpse page on death, displays die pose, corpse persists permanently

### Task 8.2: Prevent Boss Respawn
- [ ] Verify `<noRespawn>` tag in event notes prevents respawn
- [ ] Test boss does not respawn on day/night cycle if implemented
- [ ] Test boss does not respawn on map re-entry
- [ ] Verify Self Switch D remains ON after save/load
- [ ] Test corpse remains non-interactive

**Acceptance**: Boss never respawns after defeat, corpse remains permanently on map

## Phase 9: Performance Optimization

### Task 9.1: Implement Distance-Based Optimization
- [ ] Add distance check in Boss_AI_Manager.update()
- [ ] Calculate distance to player every 30 frames
- [ ] If distance > 600px, skip evaluateAI() call
- [ ] Use simple chase behavior when beyond threshold
- [ ] Resume full AI when player approaches within 600px
- [ ] Test performance improvement when boss is far from player

**Acceptance**: Boss AI skips complex calculations when >600px from player, resumes when player approaches

### Task 9.2: Implement Projectile Object Pooling
- [ ] Create projectile pool array in Projectile_Skill_Handler
- [ ] Limit active projectiles to 20 maximum
- [ ] Reuse despawned projectile objects instead of creating new ones
- [ ] Add projectile counter to track active count
- [ ] Block new projectile spawning when at max count
- [ ] Test memory usage remains stable during extended battles

**Acceptance**: Maximum 20 projectiles on screen, no memory leaks during prolonged projectile usage

### Task 9.3: Add Performance Monitoring
- [ ] Add performance.now() timing to Boss_AI_Manager.evaluateAI()
- [ ] Log warning if evaluation exceeds 2ms
- [ ] Add FPS counter to test map
- [ ] Monitor FPS during boss battle with 5 minions
- [ ] Profile frame time during complex skill combinations
- [ ] Optimize any bottlenecks found

**Acceptance**: AI evaluation completes in <2ms, battle maintains 50+ FPS with 5 minions and multiple projectiles


## Phase 10: Testing and Validation

### Task 10.1: Unit Test Boss_AI_Manager
- [ ] Test Boss_AI_Manager initialization with valid config
- [ ] Test AI evaluation throttling (runs every 5 frames)
- [ ] Test skill selection with different AI patterns (aggressive, defensive, phase-based)
- [ ] Test distance-based skill filtering
- [ ] Test weighted random skill selection
- [ ] Test _isExecutingSkill flag prevents concurrent execution
- [ ] Test distance caching (updates every 30 frames)
- [ ] Verify all tests pass

**Acceptance**: All Boss_AI_Manager unit tests pass

### Task 10.2: Unit Test Phase_Manager
- [ ] Test phase transition at 60% HP threshold
- [ ] Test phase transition at 30% HP threshold
- [ ] Test _triggeredPhases prevents duplicate transitions
- [ ] Test 60-frame transition duration
- [ ] Test invulnerability during transition
- [ ] Test phase unlocks correct skills
- [ ] Verify all tests pass

**Acceptance**: All Phase_Manager unit tests pass

### Task 10.3: Unit Test Skill_Manager
- [ ] Test cooldown tracking and decrement
- [ ] Test getAvailableSkills filters by phase
- [ ] Test getAvailableSkills excludes cooldown skills
- [ ] Test skill list caching per phase
- [ ] Test minion limit enforcement
- [ ] Verify all tests pass

**Acceptance**: All Skill_Manager unit tests pass

### Task 10.4: Integration Test Jump Attack
- [ ] Start boss battle
- [ ] Reduce boss HP to trigger Phase 2
- [ ] Wait for boss to select jump attack
- [ ] Verify telegraph indicator appears at target location
- [ ] Verify jumpstart animation plays
- [ ] Verify boss becomes invulnerable during jump
- [ ] Verify boss moves to landing location over 30 frames
- [ ] Verify jumpend animation plays on landing
- [ ] Verify AOE damage dealt in 100px radius
- [ ] Verify knockback applied to player
- [ ] Verify 180-frame cooldown starts
- [ ] Verify skill becomes available after cooldown

**Acceptance**: Jump attack executes complete sequence correctly with all visual and gameplay effects

### Task 10.5: Integration Test Projectile Patterns
- [ ] Test single-shot projectile fires toward player
- [ ] Test multi-shot fires 3 projectiles with 15° separation
- [ ] Test circular fires 8 projectiles in 360°
- [ ] Verify all projectiles move at 10 pixels/frame
- [ ] Verify projectiles despawn on collision
- [ ] Verify projectiles despawn after 300 frames
- [ ] Verify projectiles deal damage on collision
- [ ] Test with multiple projectile waves

**Acceptance**: All projectile patterns execute correctly, despawn properly, deal correct damage


### Task 10.6: Integration Test AOE Skills
- [ ] Trigger boss AOE skill
- [ ] Verify telegraph indicator appears at target location
- [ ] Verify indicator fades in over 10 frames
- [ ] Verify indicator pulses during telegraph duration
- [ ] Wait for telegraph duration to complete
- [ ] Verify damage animation plays at center
- [ ] Verify damage dealt to player if in AOE area
- [ ] Verify no damage if player outside AOE
- [ ] Test with circular and box collider shapes

**Acceptance**: AOE skills display telegraphs, deal damage in configured area shapes

### Task 10.7: Integration Test Charge Attack
- [ ] Trigger boss charge attack
- [ ] Verify directional arrow indicator appears
- [ ] Wait for 30-frame telegraph
- [ ] Verify boss charges forward at 15 pixels/frame
- [ ] Verify boss deals damage to player on collision
- [ ] Verify boss stops on terrain collision
- [ ] Verify boss stops after 400px distance
- [ ] Verify 20-frame recovery animation plays
- [ ] Verify 150-frame cooldown starts

**Acceptance**: Charge attack executes correctly, stops on terrain/distance, deals collision damage

### Task 10.8: Integration Test Summon Minions
- [ ] Reduce boss HP to <30% (Phase 3)
- [ ] Wait for boss to select summon skill
- [ ] Verify casting animation plays for 60 frames
- [ ] Verify 3 minions spawn around boss
- [ ] Verify minions have correct enemy stats
- [ ] Verify minions are on boss team (no friendly fire)
- [ ] Verify minions attack player
- [ ] Kill all minions
- [ ] Boss summons again
- [ ] Verify max 5 minions enforced
- [ ] Boss at 5 minions attempts summon
- [ ] Verify summon blocked

**Acceptance**: Boss summons minions correctly, respects 5-minion maximum, minions function as enemies

### Task 10.9: Integration Test Phase Transitions
- [ ] Start boss battle at 100% HP (Phase 1)
- [ ] Verify boss uses basic attack, single projectile, AOE
- [ ] Verify jump and charge are NOT available
- [ ] Reduce boss HP to 59%
- [ ] Verify phase transition animation plays
- [ ] Verify boss invulnerable for 60 frames
- [ ] Verify phase transition sound plays
- [ ] After transition, verify Phase 2 active
- [ ] Verify jump and charge attacks now available
- [ ] Reduce boss HP to 29%
- [ ] Verify Phase 3 transition
- [ ] Verify summon skill now available
- [ ] Verify both Phase 2 and Phase 3 skills available

**Acceptance**: Phase transitions trigger at correct HP thresholds, unlock appropriate skills, play effects

### Task 10.10: Integration Test Boss Corpse System
- [ ] Defeat boss
- [ ] Verify boss plays die animation
- [ ] Verify Self Switch D activates
- [ ] Verify corpse page displays
- [ ] Verify corpse shows die pose in death direction
- [ ] Verify corpse is passable (through ON)
- [ ] Verify corpse is non-interactive
- [ ] Leave map and return
- [ ] Verify corpse still present
- [ ] Save game and reload
- [ ] Verify corpse persists after load
- [ ] Verify boss never respawns

**Acceptance**: Boss corpse displays correctly, persists permanently, never respawns


### Task 10.11: Performance Testing
- [ ] Start boss battle with max settings (5 minions, circular projectiles)
- [ ] Monitor FPS throughout battle
- [ ] Verify FPS stays above 50 during intense moments
- [ ] Monitor AI evaluation time in console
- [ ] Verify evaluations complete in <2ms
- [ ] Test distance-based optimization
- [ ] Move player >600px from boss
- [ ] Verify AI skips complex calculations
- [ ] Move player back within 600px
- [ ] Verify AI resumes full behavior
- [ ] Run battle for 10 minutes
- [ ] Check for memory leaks
- [ ] Verify projectile count never exceeds 20

**Acceptance**: Boss battle maintains 50+ FPS with all systems active, no memory leaks, performance targets met

### Task 10.12: Configuration Testing
- [ ] Test boss with aggressive AI pattern
- [ ] Verify boss prioritizes offensive skills
- [ ] Test boss with defensive AI pattern
- [ ] Verify boss maintains distance, uses ranged skills
- [ ] Test boss with phase-based pattern
- [ ] Verify behavior changes per phase
- [ ] Test with invalid configuration tags
- [ ] Verify defaults used and errors logged
- [ ] Test with missing skill configuration
- [ ] Verify fallback to default skill
- [ ] Test with custom skill priorities
- [ ] Verify weighted selection respects priorities

**Acceptance**: All AI patterns work correctly, invalid configs handled gracefully with defaults

## Phase 11: Documentation and Finalization

### Task 11.1: Create Plugin Documentation
- [ ] Write QABS_Boss.js header documentation
- [ ] Document all configuration tags and parameters
- [ ] Document skill handler interface
- [ ] Provide example event configurations
- [ ] Document integration with QABS, QSprite, QMovement
- [ ] Add troubleshooting section
- [ ] Document performance optimization settings

**Acceptance**: Complete plugin documentation available in plugin file header

### Task 11.2: Create Configuration Guide
- [ ] Create guide for setting up boss events
- [ ] Provide step-by-step event note configuration
- [ ] Document skill database setup
- [ ] Explain phase threshold configuration
- [ ] Provide example configurations for different boss types
- [ ] Document visual asset requirements
- [ ] Create checklist for boss setup

**Acceptance**: Configuration guide enables designers to create new bosses without code changes

### Task 11.3: Create Example Boss Templates
- [ ] Create "Aggressive Melee Boss" template
- [ ] Create "Defensive Ranged Boss" template
- [ ] Create "Phase-Based Final Boss" template
- [ ] Export template events to separate file
- [ ] Document how to import and customize templates
- [ ] Test templates work correctly when imported

**Acceptance**: Three boss templates available for quick setup of common boss types

### Task 11.4: Final System Verification
- [ ] Run all unit tests - verify all pass
- [ ] Run all integration tests - verify all pass
- [ ] Complete full boss battle playthrough
- [ ] Verify no console errors during battle
- [ ] Verify all 12 requirements satisfied
- [ ] Test on fresh game project
- [ ] Verify plugin dependencies load correctly
- [ ] Create final release package

**Acceptance**: All tests pass, all requirements met, system ready for production use

---

**Total Estimated Tasks**: 64 tasks across 11 phases
**Critical Path**: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 10
**Estimated Completion**: 3-4 weeks for full implementation and testing
