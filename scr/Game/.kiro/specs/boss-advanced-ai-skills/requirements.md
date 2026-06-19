# Requirements Document

## Introduction

This document specifies requirements for a Boss AI and Advanced Skills system for an RPG Maker MV game using the QABS (Quasi Action Battle System). The system enables the final boss to exhibit intelligent behavior patterns, execute advanced combat skills with visual effects, and transition through multiple combat phases based on HP thresholds. The system integrates with existing QABS combat, QSprite animations, and QMovement pathfinding for a climactic end-game boss fight.

## Glossary

- **Boss**: The final enemy character with advanced AI patterns and phase-based behavior
- **QABS**: Quasi Action Battle System - the real-time combat system plugin
- **QSprite**: Animation system for character sprites
- **QMovement**: Movement plugin that handles pixel-based movement
- **QPathfind**: Pathfinding plugin for intelligent navigation
- **AI_Pattern**: A behavior mode that determines how the boss selects and executes skills (aggressive, defensive, phase-based)
- **Phase**: A stage of boss behavior defined by HP percentage thresholds
- **Telegraph**: A visual warning indicator displayed before a powerful skill executes
- **Skill_Sequence**: A series of QABS actions that define skill behavior
- **AOE**: Area of Effect - skills that affect targets within a defined area
- **Projectile_Pattern**: The trajectory and arrangement of projectiles (single, multi-shot, circular)
- **Event_Note**: RPG Maker MV event note field for configuration
- **Boss1**: The primary boss enemy sprite with jump animations configured
- **Collider**: The collision shape used by QMovement and QABS for hit detection
- **Minion**: A weaker enemy summoned by the boss during combat

## Requirements

### Requirement 1: Boss AI Pattern System

**User Story:** As a game designer, I want bosses to exhibit different AI behavior patterns, so that each boss feels unique and challenging.

#### Acceptance Criteria

1. THE AI_System SHALL support three AI_Pattern types: aggressive, defensive, and phase-based
2. WHEN an aggressive pattern is active, THE Boss SHALL prioritize offensive skills and maintain close distance to the Player
3. WHEN a defensive pattern is active, THE Boss SHALL prioritize defensive skills and maintain medium distance from the Player
4. WHEN a phase-based pattern is active, THE Boss SHALL change behavior based on current HP percentage
5. THE Boss SHALL evaluate skill selection every frame based on the active AI_Pattern
6. THE AI_System SHALL support distance-based decision making using QPathfind for distance calculations
7. THE Boss SHALL select skills based on distance thresholds defined in the AI_Pattern configuration
8. WHERE the Boss is within melee range (0-100 pixels), THE Boss SHALL prioritize melee skills
9. WHERE the Boss is at medium range (100-300 pixels), THE Boss SHALL prioritize ranged skills
10. WHERE the Boss is at far range (300+ pixels), THE Boss SHALL move closer or use gap-closing skills

### Requirement 2: Boss Phase Transition System

**User Story:** As a game designer, I want the boss to transition through combat phases as HP decreases, so that the battle becomes progressively more challenging.

#### Acceptance Criteria

1. THE Phase_System SHALL support three HP threshold phases: Phase 1 (100-60%), Phase 2 (60-30%), and Phase 3 (<30%)
2. WHEN the Boss HP crosses a phase threshold, THE Phase_System SHALL trigger a phase transition
3. WHEN a phase transition occurs, THE Boss SHALL execute a transition animation sequence
4. WHEN Phase 1 is active (100-60% HP), THE Boss SHALL use basic attack skills with moderate attack speed
5. WHEN Phase 2 is active (60-30% HP), THE Boss SHALL use faster attacks and add jump attack and charge attack to the skill rotation
6. WHEN Phase 3 is active (<30% HP), THE Boss SHALL activate all available skills including summon minions and increase attack frequency
7. THE Phase_System SHALL prevent phase transitions from triggering multiple times for the same threshold
8. WHEN entering a new phase, THE Boss SHALL play a phase transition sound effect
9. THE phase transition animation SHALL last 60 frames before normal combat resumes
10. THE Boss SHALL be invulnerable to damage during phase transition animations

### Requirement 3: Jump Attack Skill with QSprite Animation

**User Story:** As a game designer, I want the boss to perform a jump attack using the jumpstart/jumpend animations, so that the attack feels dynamic and telegraphed.

#### Acceptance Criteria

1. THE Jump_Skill SHALL play the Boss1 jumpstart animation in the current direction before jumping
2. WHEN the jumpstart animation completes, THE Boss SHALL move to the target location over 30 frames
3. WHEN the Boss reaches the target location, THE Jump_Skill SHALL play the Boss1 jumpend animation
4. THE Jump_Skill SHALL deal AOE damage within a 100-pixel radius of the landing location
5. THE Jump_Skill SHALL trigger QABS damage calculation for all characters within the AOE collider
6. THE Jump_Skill SHALL apply knockback effect moving hit characters 50 pixels away from the landing center
7. WHEN the Jump_Skill is used, THE Boss SHALL be invulnerable to damage during the jump animation
8. THE Jump_Skill SHALL have a 180-frame cooldown period after execution
9. THE Jump_Skill SHALL display a warning indicator at the target location for 30 frames before landing
10. WHERE the target location is beyond jump range (400 pixels), THE Boss SHALL select the maximum range location toward the target

### Requirement 4: Projectile Pattern Skills

**User Story:** As a game designer, I want the boss to fire projectiles in different patterns, so that players must dodge varied attack types.

#### Acceptance Criteria

1. THE Projectile_System SHALL support three Projectile_Pattern types: single-shot, multi-shot, and circular
2. WHEN single-shot pattern is used, THE Boss SHALL fire one projectile toward the Player direction
3. WHEN multi-shot pattern is used, THE Boss SHALL fire three projectiles with 15-degree angle separation
4. WHEN circular pattern is used, THE Boss SHALL fire eight projectiles in a 360-degree circle with 45-degree separation
5. THE Projectile SHALL use a QABS skill sequence with move action and trigger on collision
6. THE Projectile SHALL move at 10 pixels per frame toward its initial direction
7. WHEN a Projectile collides with a character or terrain, THE Projectile SHALL trigger damage and despawn
8. THE Projectile SHALL use the configured picture graphic rotated to match movement direction
9. THE Projectile_System SHALL apply the skill's configured through setting to determine collision behavior
10. THE Projectile SHALL despawn after 300 frames if no collision occurs

### Requirement 5: Area of Effect (AOE) Skills with Visual Indicators

**User Story:** As a game designer, I want AOE skills to display visual warnings before dealing damage, so that players have a chance to react.

#### Acceptance Criteria

1. THE AOE_Skill SHALL display a warning indicator at the target location before activation
2. THE AOE_Warning SHALL use a picture graphic showing the affected area shape and size
3. THE AOE_Warning SHALL be visible for a configured telegraph duration (minimum 30 frames)
4. WHEN the telegraph duration completes, THE AOE_Skill SHALL trigger damage to all characters within the collider
5. THE AOE_Skill SHALL support circular, rectangular, and custom collider shapes via QABS collider configuration
6. THE AOE_Skill SHALL play an animation at the center point when damage triggers
7. THE AOE_Skill SHALL use QABS trigger action to execute damage calculation
8. WHERE the AOE_Skill is ground-targeted, THE Boss SHALL use the Player's current position as the target location
9. THE AOE_Skill SHALL have a configured cooldown period after execution
10. THE AOE_Indicator SHALL fade in over 10 frames and pulse during the telegraph duration

### Requirement 6: Summon Minions Skill

**User Story:** As a game designer, I want the boss to summon weaker enemies during combat, so that battles become more chaotic in later phases.

#### Acceptance Criteria

1. THE Summon_Skill SHALL spawn configured Minion enemies at designated spawn points relative to the Boss position
2. THE Summon_Skill SHALL support summoning 1 to 5 Minions per skill use
3. WHEN Summon_Skill is executed, THE Boss SHALL play a casting animation for 60 frames
4. WHEN the casting completes, THE Boss SHALL spawn Minions at positions offset from Boss center by configured distances
5. THE Summon_Skill SHALL use QABS `forceSkill` or map event spawning to create Minion events
6. THE Minion SHALL be configured with an enemy ID from the database
7. THE Minion SHALL inherit the Boss's team value to prevent friendly fire
8. THE Summon_Skill SHALL have a 600-frame cooldown period after execution
9. THE Boss SHALL limit total active Minions to a configured maximum (default 5)
10. WHEN the maximum Minion count is reached, THE Boss SHALL not execute Summon_Skill until Minions are defeated

### Requirement 7: Skill Telegraphing System

**User Story:** As a game designer, I want powerful boss skills to display charge-up warnings, so that players can prepare defensive actions.

#### Acceptance Criteria

1. THE Telegraph_System SHALL support associating a telegraph duration with any Boss skill
2. WHEN a telegraphed skill is selected, THE Boss SHALL play a charge-up animation before skill execution
3. THE Telegraph_System SHALL lock the Boss in place during the telegraph duration
4. THE Telegraph_System SHALL display a visual warning indicator at the skill target location
5. THE Telegraph_Indicator SHALL use a configured picture graphic that matches the skill type
6. THE Telegraph_Indicator SHALL scale from 50% to 100% size during the telegraph duration
7. WHEN the telegraph duration completes, THE Boss SHALL execute the skill sequence normally
8. THE Telegraph_System SHALL play a charge-up sound effect during the telegraph duration
9. WHERE a telegraphed skill is the Jump_Skill, THE Telegraph_Indicator SHALL display at the landing location
10. THE Telegraph_System SHALL allow cancellation if the Boss is interrupted by a cancel-type skill during charging

### Requirement 8: Boss Configuration via Event Notes

**User Story:** As a game designer, I want to configure boss AI and skills through event notes, so that I can create multiple bosses without code changes.

#### Acceptance Criteria

1. THE Configuration_System SHALL read boss settings from the event's Event_Note field
2. THE Configuration_System SHALL support defining AI_Pattern type in Event_Note using `<bossAI: PATTERN>` tag
3. THE Configuration_System SHALL support defining skill list in Event_Note using `<bossSkills>` tag with skill IDs
4. THE Configuration_System SHALL support defining phase HP thresholds in Event_Note using `<bossPhases>` tag
5. THE Configuration_System SHALL support defining skill cooldowns in Event_Note using skill-specific cooldown tags
6. THE Configuration_System SHALL support defining telegraph durations in Event_Note for specific skills
7. THE Configuration_System SHALL support defining summon minion configuration with enemy IDs and spawn count
8. THE Configuration_System SHALL parse Event_Note tags when the boss event is initialized
9. WHERE an Event_Note tag is missing or invalid, THE Configuration_System SHALL use default values for that setting
10. THE Configuration_System SHALL log configuration errors to the console for debugging

### Requirement 9: Boss Corpse System (No Respawn)

**User Story:** As a game designer, I want the boss corpse to remain on the map permanently after defeat, so that the boss defeat is a permanent achievement.

#### Acceptance Criteria

1. THE Boss event SHALL include the `<noRespawn>` tag in Event_Note
2. WHEN the Boss is defeated, THE Boss SHALL activate Self Switch D to display the corpse page
3. THE corpse page SHALL use the Boss1 die pose animation if available via QSprite
4. THE corpse SHALL remain on the map permanently across map transfers and game saves
5. THE corpse position and direction SHALL be saved in `$gameSystem._dayNightData.corpsePositions`
6. THE Boss corpse SHALL be marked as through (passable) and non-interactive
7. THE Boss corpse SHALL have direction fix enabled to maintain death direction
8. THE Boss corpse SHALL not initialize a battler component when Self Switch D is ON
9. THE Boss event SHALL include both a living page (Switch D OFF) and corpse page (Switch D ON)
10. THE Boss SHALL never respawn even if day/night endDay command is executed

### Requirement 10: Boss Skill Rotation System

**User Story:** As a game designer, I want the boss to rotate through available skills intelligently, so that combat feels varied and strategic.

#### Acceptance Criteria

1. THE Skill_Rotation SHALL maintain a list of available skills for the current phase
2. THE Skill_Rotation SHALL check skill cooldown status before selecting a skill
3. WHEN selecting a skill, THE Skill_Rotation SHALL prioritize skills based on AI_Pattern and distance
4. THE Skill_Rotation SHALL not select a skill that is currently on cooldown
5. THE Skill_Rotation SHALL wait the configured AI Action Wait duration (30 frames default) between skill selections
6. THE Skill_Rotation SHALL re-evaluate skill selection after each skill completes
7. WHERE no skills are available due to cooldowns, THE Boss SHALL use a default basic attack skill
8. THE Skill_Rotation SHALL weight skill selection based on configured priority values in Event_Note
9. THE Skill_Rotation SHALL support random selection from equally weighted available skills
10. THE Skill_Rotation SHALL respect phase-specific skill unlock requirements

### Requirement 11: Advanced Skill - Charge Attack

**User Story:** As a game designer, I want the boss to charge forward in a straight line dealing damage to everything in its path, so that positional play is important.

#### Acceptance Criteria

1. THE Charge_Attack SHALL move the Boss forward in the current direction at 15 pixels per frame
2. THE Charge_Attack SHALL use a rectangular collider extending 48 pixels wide by 200 pixels long
3. THE Charge_Attack SHALL deal damage to all characters the Boss collides with during the charge
4. THE Charge_Attack SHALL stop when the Boss collides with impassable terrain
5. THE Charge_Attack SHALL stop when the Boss travels 400 pixels total distance
6. WHEN Charge_Attack is used, THE Boss SHALL play a charge animation using QSprite
7. THE Charge_Attack SHALL have a 150-frame cooldown period
8. THE Charge_Attack SHALL be unlocked in Phase 2 and available in all subsequent phases
9. THE Charge_Attack SHALL display a directional arrow indicator for 30 frames before execution
10. WHEN the charge completes or stops, THE Boss SHALL have a 20-frame recovery animation before resuming normal AI

### Requirement 12: Performance Optimization for Boss AI

**User Story:** As a developer, I want the boss AI to run efficiently, so that the game maintains smooth performance during boss battles.

#### Acceptance Criteria

1. THE AI_System SHALL limit AI evaluation to once per 5 frames (every 83ms at 60fps)
2. THE AI_System SHALL cache distance calculations between AI evaluation cycles
3. THE AI_System SHALL limit QPathfind usage to once per 30 frames when pathfinding to the Player
4. THE Skill_Rotation SHALL maintain a cached list of available skills updated only on phase transitions
5. THE Telegraph_System SHALL use a single sprite object per telegraph indicator, reusing it across skill uses
6. THE Projectile_System SHALL pool projectile skill objects to avoid creating new QABS skills each frame
7. THE AI_System SHALL disable complex calculations when the Boss is more than 600 pixels from the Player
8. THE Boss SHALL use the QABS built-in AI system for basic targeting and range detection
9. THE Phase_System SHALL trigger phase transition logic only once per threshold crossing
10. THE Performance_System SHALL maintain a minimum of 50 FPS during boss battles with 5 active Minions
