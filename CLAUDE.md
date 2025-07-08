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
- **Tracks**: 5 horizontal tracks (y: 100, 200, 300, 400, 500)
- **Train Speeds**: 4 variants (80, 100, 120, 140) with color coding
- **Switches**: Unidirectional, track-specific, diamond-shaped
- **Stops**: Orange squares that temporarily pause trains

## Key Game Mechanics
1. **Unidirectional Switches**: Only affect trains coming from source track
2. **Safe Spawning**: Layout-aware algorithm prevents unavoidable crashes  
3. **Curved Movement**: Trains follow quadratic curves when switching
4. **Speed Variants**: Gray=slow, Blue=normal, Red=fast, Purple=very fast
5. **Strategic Gameplay**: Every collision is preventable with proper switching

## Important Files
- `src/config/game.config.ts` - Central game configuration and layout generator
- `src/entities/Train.ts` - Train physics with 10ms velocity delay fix
- `src/entities/Switch.ts` - Unidirectional switch implementation
- `src/systems/TrainManager.ts` - Safe spawning and train lifecycle
- `src/systems/CollisionManager.ts` - Collision detection and game over
- `.github/workflows/deploy.yml` - GitHub Pages deployment

## Testing
34 tests covering:
- Game configuration and layout generation
- Core game logic (scoring, distance, speed classification)
- Train management and safe spawning
- Switch behavior and track interactions

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