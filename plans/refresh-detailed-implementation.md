# Train Game Refresh - Detailed Implementation Plan

**Created**: 2025-11-17
**Branch**: `claude/implement-refresh-plan-01UoZVwCReLKeabL8JeXxonp`
**Status**: Planning Phase

## Overview
This document provides a detailed implementation plan for refreshing the Train Switching Game based on `plans/refresh.md`. The plan is organized into 5 phases with clear priorities, task breakdowns, and subagent assignments.

## Subagent Strategy

### When to Use Subagents
- **Exploration Tasks**: Use `Explore` agents for codebase investigation
- **Complex Multi-Step Tasks**: Use `general-purpose` agents for implementations requiring 5+ steps
- **Parallel Execution**: Launch multiple agents concurrently for independent tasks

### Subagent Assignments by Phase
Each phase below documents which tasks benefit from subagent delegation vs. direct execution.

---

## Phase 1: Code Quality & Security (HIGH PRIORITY)

### 1.1 Fix Security Vulnerabilities
**Priority**: CRITICAL
**Estimated Time**: 30 minutes
**Approach**: Direct execution

**Tasks**:
- [ ] Run `npm audit` to identify vulnerabilities
- [ ] Run `npm audit fix` to auto-fix vulnerabilities
- [ ] Manually review any remaining vulnerabilities
- [ ] Update Vite to latest stable version
- [ ] Test build after updates
- [ ] Run full test suite

**Pre-commit checks**:
```bash
npm run lint
npm run test:run
npm run build
```

### 1.2 Resolve TypeScript Type Issues
**Priority**: HIGH
**Estimated Time**: 1-2 hours
**Approach**: Explore agent + direct fixes

**Tasks**:
- [ ] **Subagent (Explore)**: Identify all `any` types and type gaps
  - Search pattern: `: any` in TypeScript files
  - Document locations and contexts
- [ ] Create proper interfaces for layout structures
  - `LayoutConfig` interface
  - `TrackConfig` interface
  - `ElementConfig` interface
- [ ] Replace `any` types with proper types
  - Phaser types from `@types/phaser`
  - Custom game types
- [ ] Add type definitions for Phaser interactions
  - Scene types
  - Sprite/Graphics types
  - Input types
- [ ] Verify with `npm run lint`

**Files to Review** (from explore agent):
- `src/config/game.config.ts`
- `src/scenes/MainScene.ts`
- `src/entities/*.ts`
- `src/systems/*.ts`

### 1.3 Re-enable Disabled Tests
**Priority**: HIGH
**Estimated Time**: 2-3 hours
**Approach**: Explore agent + general-purpose agent for implementation

**Tasks**:
- [ ] **Subagent (Explore)**: Find all disabled tests
  - Search for `.skip`, `xit`, commented test blocks
  - Document why each test is disabled
- [ ] Improve Phaser mocking in test setup
  - Create comprehensive Phaser mock utilities
  - Mock Phaser.Scene properly
  - Mock Graphics, Sprite, Input systems
- [ ] **Subagent (general-purpose)**: Fix Switch entity tests (6 tests)
  - Enable tests one by one
  - Update mocks as needed
  - Ensure all 6 pass
- [ ] **Subagent (general-purpose)**: Fix Train entity tests (3 tests)
  - Enable tests one by one
  - Update mocks as needed
  - Ensure all 3 pass
- [ ] Run full test suite: `npm run test:run`
- [ ] Verify coverage: `npm run test:coverage`

**Success Criteria**:
- All 37+ tests passing
- No skipped/disabled tests
- Coverage maintained or improved

---

## Phase 2: Missing Core Features (MEDIUM PRIORITY)

### 2.1 Add High Score Persistence
**Priority**: MEDIUM
**Estimated Time**: 1-2 hours
**Approach**: Direct implementation

**Tasks**:
- [ ] Create `src/systems/StorageManager.ts`
  - LocalStorage wrapper
  - High score save/load
  - Error handling for storage quota
- [ ] Integrate with MainScene
  - Load high score on init
  - Save when score exceeds high score
  - Update display
- [ ] Add high score display on game over
  - Show current score vs. high score
  - "New High Score!" message
- [ ] Add tests for StorageManager
  - Mock localStorage
  - Test save/load/error scenarios

**Files to Create**:
- `src/systems/StorageManager.ts`
- `test/systems/StorageManager.test.ts`

**Files to Modify**:
- `src/scenes/MainScene.ts`

### 2.2 Implement Proper State Management
**Priority**: MEDIUM
**Estimated Time**: 2-3 hours
**Approach**: General-purpose agent

**Tasks**:
- [ ] **Subagent (general-purpose)**: Create GameStateManager
  - Extract state logic from MainScene
  - Define states: MENU, PLAYING, PAUSED, GAME_OVER
  - State transition methods
  - Event emissions for state changes
- [ ] Integrate with MainScene
  - Replace inline state management
  - Use GameStateManager methods
  - Listen to state change events
- [ ] Add comprehensive tests
  - State transitions
  - Invalid transition handling
  - Event emissions

**Files to Create**:
- `src/systems/GameStateManager.ts`
- `test/systems/GameStateManager.test.ts`

**Files to Modify**:
- `src/scenes/MainScene.ts`

### 2.3 Add Start Menu Screen
**Priority**: MEDIUM
**Estimated Time**: 2-3 hours
**Approach**: Direct implementation

**Tasks**:
- [ ] Create `src/scenes/MenuScene.ts`
  - Title text
  - Instructions text
  - Start button
  - High score display
  - Credits
- [ ] Update game initialization
  - Start with MenuScene
  - Transition to MainScene on start
- [ ] Style and layout
  - Center-aligned content
  - Consistent fonts/colors
  - Responsive positioning
- [ ] Add tests for MenuScene
  - Scene creation
  - Button interactions
  - Scene transitions

**Files to Create**:
- `src/scenes/MenuScene.ts`
- `test/scenes/MenuScene.test.ts`

**Files to Modify**:
- `src/main.ts` (add MenuScene to config)

---

## Phase 3: Performance & Polish (MEDIUM PRIORITY)

### 3.1 Optimize Bundle Size
**Priority**: MEDIUM
**Estimated Time**: 2-3 hours
**Approach**: Explore agent + direct implementation

**Tasks**:
- [ ] **Subagent (Explore)**: Analyze current bundle size
  - Run build and analyze output
  - Identify large chunks
  - Document findings
- [ ] Implement code splitting
  - Dynamic import for Phaser
  - Lazy load scenes
  - Split vendor chunks
- [ ] Update Vite config
  - Configure rollupOptions
  - Set up manualChunks
  - Optimize build settings
- [ ] Verify bundle size < 500KB
  - Run production build
  - Check dist/ folder sizes
  - Test loading performance

**Files to Modify**:
- `vite.config.ts`
- `src/main.ts`

### 3.2 Add Sound Effects
**Priority**: MEDIUM
**Estimated Time**: 3-4 hours
**Approach**: General-purpose agent

**Tasks**:
- [ ] **Subagent (general-purpose)**: Create SoundManager system
  - Sound loading and caching
  - Play/stop/volume controls
  - Mute toggle persistence
- [ ] Find or create sound assets
  - Switch toggle sound
  - Collision sound
  - Score increase sound
  - Level up sound
- [ ] Integrate with game
  - Add sounds to appropriate events
  - Add mute button to UI
  - Load mute preference from storage
- [ ] Add tests for SoundManager
  - Mock Phaser sound system
  - Test play/stop/mute logic

**Files to Create**:
- `src/systems/SoundManager.ts`
- `test/systems/SoundManager.test.ts`
- `public/sounds/*.mp3` or `.ogg`

**Files to Modify**:
- `src/scenes/MainScene.ts`
- `src/entities/Switch.ts`
- `src/systems/CollisionManager.ts`

### 3.3 Hand-Drawn Graphics
**Priority**: LOW-MEDIUM
**Estimated Time**: 4-5 hours
**Approach**: Direct implementation

**Tasks**:
- [ ] Create `src/graphics/HandDrawnGraphics.ts`
  - Wobble effect utility
  - Hand-drawn line rendering
  - Sketch-style shapes
- [ ] Apply to game elements
  - Tracks with wobble
  - Switches with sketch style
  - Trains with hand-drawn look
  - Stops with rough edges
- [ ] Add configuration option
  - Enable/disable hand-drawn mode
  - Fallback to geometric mode
- [ ] Performance testing
  - Ensure no FPS drops
  - Optimize rendering if needed

**Files to Create**:
- `src/graphics/HandDrawnGraphics.ts`
- `test/graphics/HandDrawnGraphics.test.ts`

**Files to Modify**:
- `src/scenes/MainScene.ts`
- `src/entities/*.ts`

---

## Phase 4: Enhanced Testing (LOW PRIORITY)

### 4.1 Add E2E Tests
**Priority**: LOW
**Estimated Time**: 4-5 hours
**Approach**: General-purpose agent

**Tasks**:
- [ ] **Subagent (general-purpose)**: Set up Playwright
  - Install dependencies
  - Create playwright config
  - Set up test structure
- [ ] Write E2E test scenarios
  - Game launch and menu
  - Start game and basic play
  - Switch interaction
  - Train collision and game over
  - Score persistence
- [ ] Add to CI/CD pipeline
  - Update GitHub Actions
  - Run E2E in deploy workflow

**Files to Create**:
- `playwright.config.ts`
- `e2e/game.spec.ts`

**Files to Modify**:
- `.github/workflows/deploy.yml`
- `package.json`

### 4.2 Add Integration Tests
**Priority**: LOW
**Estimated Time**: 3-4 hours
**Approach**: Direct implementation

**Tasks**:
- [ ] Create integration test suite
  - MainScene full lifecycle
  - Multi-train scenarios
  - Complex collision cases
  - Level progression flows
- [ ] Mock Phaser properly for integration
  - Use real game config
  - Minimal mocking approach
  - Test actual game logic

**Files to Create**:
- `test/integration/MainScene.integration.test.ts`
- `test/integration/gameplay.integration.test.ts`

---

## Phase 5: Nice-to-Have Features (FUTURE)

### 5.1 Additional Gameplay Features
**Priority**: FUTURE
**Estimated Time**: TBD
**Approach**: TBD

**Ideas**:
- Multiple game modes (endless, time attack, puzzle)
- Different track configurations (layouts)
- Power-ups (slow time, clear track)
- Special train types (express, cargo)
- Online leaderboard

### 5.2 Accessibility
**Priority**: FUTURE
**Estimated Time**: TBD
**Approach**: TBD

**Ideas**:
- Keyboard navigation for menus
- Color blind mode options
- Screen reader support
- Adjustable game speed
- High contrast mode

### 5.3 Mobile Optimization
**Priority**: FUTURE
**Estimated Time**: TBD
**Approach**: TBD

**Ideas**:
- Touch controls optimization
- Responsive layout for mobile
- PWA support (offline play)
- Mobile-friendly UI scaling

---

## Implementation Order (Recommended)

### Week 1: Foundation
1. Phase 1.1: Fix security vulnerabilities (Day 1)
2. Phase 1.2: Resolve TypeScript issues (Day 1-2)
3. Phase 1.3: Re-enable tests (Day 2-3)

### Week 2: Core Features
4. Phase 2.1: High score persistence (Day 4)
5. Phase 2.2: State management (Day 4-5)
6. Phase 2.3: Start menu (Day 5)

### Week 3: Polish
7. Phase 3.1: Bundle optimization (Day 6)
8. Phase 3.2: Sound effects (Day 6-7)
9. Phase 3.3: Hand-drawn graphics (Day 7-8, optional)

### Week 4: Testing
10. Phase 4.1: E2E tests (Day 9-10, optional)
11. Phase 4.2: Integration tests (Day 10, optional)

---

## Subagent Execution Plan

### Parallel Execution Groups

**Group 1: Investigation Phase** (Can run in parallel)
- Explore agent: Find all `any` types
- Explore agent: Find disabled tests
- Explore agent: Analyze bundle size

**Group 2: Test Fixes** (Can run in parallel after Phase 1.2)
- General-purpose agent: Fix Switch tests
- General-purpose agent: Fix Train tests

**Group 3: Feature Implementation** (Sequential)
- General-purpose agent: GameStateManager
- General-purpose agent: SoundManager
- General-purpose agent: Playwright setup

### Subagent Communication Protocol

Each subagent task should return:
1. **Summary**: What was found/implemented
2. **Files Changed**: List of modified/created files
3. **Test Status**: Did tests pass?
4. **Next Steps**: What needs to happen next
5. **Blockers**: Any issues encountered

---

## Success Metrics

### Phase 1 Complete When:
- ✅ No security vulnerabilities
- ✅ No `any` types (or documented exceptions)
- ✅ All tests enabled and passing
- ✅ Lint passes
- ✅ Build succeeds

### Phase 2 Complete When:
- ✅ High scores persist across sessions
- ✅ Clean state management pattern
- ✅ Functional menu screen
- ✅ All new features tested

### Phase 3 Complete When:
- ✅ Bundle size < 500KB
- ✅ Sound effects on all actions
- ✅ Mute toggle works
- ✅ (Optional) Hand-drawn mode available

### Phase 4 Complete When:
- ✅ E2E tests cover main flows
- ✅ Integration tests pass
- ✅ CI/CD includes E2E tests

---

## Notes

- **Always run pre-commit checks**: lint, test:run, build
- **Commit frequently**: After each completed task
- **Push to branch**: `claude/implement-refresh-plan-01UoZVwCReLKeabL8JeXxonp`
- **Document decisions**: Update this plan with findings
- **Test incrementally**: Don't wait until the end

## Risk Assessment

**High Risk**:
- TypeScript refactoring breaking existing code
- Test mocking complexity causing delays

**Medium Risk**:
- Bundle size optimization breaking lazy loading
- Sound assets increasing bundle size significantly

**Low Risk**:
- Menu scene implementation
- High score persistence

**Mitigation**:
- Commit after each working change
- Run full test suite frequently
- Test in actual browser, not just unit tests
