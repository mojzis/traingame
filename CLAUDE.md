# Train Switching Game - Claude Context

## Project Overview
A JavaScript browser-based train switching game where players prevent train collisions by strategically operating track switches. Built with TypeScript, Phaser 3, and modern tooling.

## Key Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## ⚠️ IMPORTANT: Pre-Commit Workflow
**ALWAYS run these commands before every commit to match GitHub Actions:**
1. `npm run lint` - Must pass with no errors
2. `npm run test:run` - All tests must pass
3. `npm run build` - Build must succeed

These are the exact steps that GitHub Actions runs, so running them locally prevents CI failures.

## Architecture
- **Tech Stack**: TypeScript, Phaser 3, Vite, Vitest, ESLint, Prettier
- **Game Size**: 1200x600 pixels
- **Tracks**: Up to 6 horizontal tracks (y: 100, 200, 300, 400, 500, 580)
- **Train Speeds**: 4 variants (80, 100, 120, 140) with color coding
- **Switches**: Unidirectional, track-specific, diamond-shaped
- **Stops**: Orange squares that temporarily pause trains

## Key Game Mechanics
1. **Level System**:
   - Level 0 (Beginner): 3 tracks only (track2, track3, track4) - starts at 0 points
   - Level 1 (Basic): 5 tracks (track1-5) - unlocks at 222 points
   - Level 2 (Advanced): 6 tracks (all) - unlocks at 444 points
2. **Unidirectional Switches**: Only affect trains coming from source track
3. **Enhanced Safe Spawning**: 
   - GUARANTEES at least 1 switch per track
   - Validates reachable switches before spawning
   - Blocks spawning when no escape route exists
   - Ensures every collision is preventable  
4. **Curved Movement**: Trains follow quadratic curves when switching
5. **Speed Variants**: Gray=slow, Blue=normal, Red=fast, Purple=very fast
6. **Strategic Gameplay**: Every collision is preventable with proper switching
7. **Pause Feature**: Press SPACE to pause/unpause the game

## Important Files
- `src/config/game.config.ts` - Central game configuration and dynamic layout generator (clean config with no hardcoded switches/stops)
- `src/entities/Train.ts` - Train physics with 10ms velocity delay fix
- `src/entities/Switch.ts` - Unidirectional switch implementation
- `src/systems/TrainManager.ts` - Safe spawning and train lifecycle
- `src/systems/CollisionManager.ts` - Collision detection and game over
- `.github/workflows/deploy.yml` - GitHub Pages deployment

## Testing
37 tests covering:
- Game configuration and layout generation
- Core game logic (scoring, distance, speed classification)
- Train management and safe spawning
- Switch behavior and track interactions
- Level progression system (Level 0 → 1 → 2)
- Track availability per level

## ⚠️ IMPORTANT: Testing Strategy
**ALWAYS update tests when changing or adding features:**

### Testing Guidelines:
1. **Feature Development** - When adding/changing features, update corresponding tests
2. **Focus on Critical Parts** - Don't aim for 80% coverage, prioritize:
   - Core game logic (scoring, collision detection, spawning)
   - Layout generation algorithms
   - Safe spawning and train management
   - Switch behavior and track switching
3. **Prefer Real Tests** - Minimize mocking, test actual behavior:
   - Use real game configuration objects
   - Test actual algorithms with real inputs/outputs
   - Mock only external dependencies (Phaser scene objects)
   - Avoid over-mocking internal game logic

### Current Test Status:
- ✅ **Passing**: Config, game logic, core TrainManager functionality
- ⚠️ **Disabled**: Switch/Train entity tests (require better Phaser mocking)
- 🎯 **Focus**: Keep existing tests working, add tests for new features

### Test Maintenance:
- Re-enable disabled tests when improving Phaser mocks
- Add integration tests for complete game workflows
- Test edge cases in spawning and collision scenarios

## Deployment
- GitHub repository: `traingame`
- Auto-deploys to GitHub Pages via Actions on main branch push
- Live URL: https://mojzis.github.io/traingame/

## Known Issues & Fixes
- **Train movement**: Fixed with 10ms velocity delay in Train.ts:constructor
- **Rendering**: Fixed tracks visibility with graphics.lineStyle() calls
- **ESLint v9**: Uses eslint.config.js format instead of .eslintrc.json
- **Git auth**: Use `gh auth status` and `gh` CLI for push if HTTPS fails

## Current Status
Game is feature-complete and ready for deployment. All major mechanics implemented:
- Balanced layout generation
- Safe train spawning
- Realistic switch behavior
- Comprehensive testing
- GitHub Actions deployment pipeline