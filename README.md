# Train Switching Game 🚂

A JavaScript browser-based train switching game where players prevent train collisions by strategically operating track switches.

## 🎮 How to Play

- **Objective**: Prevent trains from colliding by switching them between tracks
- **Controls**: Click the diamond-shaped switches to toggle them between straight (red) and connected (green) states
- **Scoring**: Earn 10 points for each train that safely reaches the end
- **Trains**: Different colored trains have different speeds:
  - Gray = Slow trains (80 speed)
  - Blue = Normal trains (100 speed) 
  - Red = Fast trains (120 speed)
  - Purple = Very fast trains (140 speed)
- **Stops**: Orange squares on tracks cause trains to pause temporarily
- **Switches**: Work unidirectionally - trains can only be diverted FROM the switch's source track TO its destination track

## 🚀 Play Online

[Play the game here!](https://mojzis.github.io/traingame/)

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm

### Setup
```bash
# Clone the repository
git clone https://github.com/mojzis/traingame.git
cd traingame

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Generate New Layout
Press **R** during gameplay to regenerate the track layout with new switch and stop positions.

## 🏗️ Architecture

### Tech Stack
- **TypeScript** - Type safety and better development experience
- **Phaser 3** - 2D game engine for rendering and physics
- **Vite** - Fast build tool and development server
- **Vitest** - Testing framework
- **ESLint + Prettier** - Code quality and formatting

### Key Features
- **Dynamic Layout Generation** - Each game generates balanced switch and stop positions
- **Safe Train Spawning** - Intelligent spawning system prevents unavoidable collisions
- **Realistic Physics** - Trains follow curved paths when switching tracks
- **Strategic Gameplay** - Multiple train speeds and temporary stops create collision opportunities

### Game Systems
- **TrainManager** - Handles train spawning, movement, and lifecycle
- **TrackSystem** - Manages track layout, switches, and stops generation
- **CollisionManager** - Detects and handles train collisions
- **Switch** - Interactive track switching with unidirectional behavior
- **Train** - Individual train entities with speed-based colors and stop detection

## 🧪 Testing

The project includes comprehensive tests for:
- Game configuration and layout generation
- Core game logic (scoring, distance calculation, speed classification)
- Train management and safe spawning algorithms
- Switch behavior and track interactions

Run tests with: `npm run test:coverage`

## 📦 Deployment

The game automatically deploys to GitHub Pages via GitHub Actions on every push to the main branch.

## 🎯 Game Design

### Switch Mechanics
- Switches belong to a specific source track
- When activated, they divert trains TO a destination track
- Only trains coming from the source track are affected
- Switches work unidirectionally (like real railway switches)

### Collision Avoidance
- Smart spawning prevents unavoidable crashes
- Players must use switches strategically to route faster trains around slower ones
- Temporary stops create additional timing challenges
- Every collision is preventable with proper switch usage

## 📝 License

ISC License - Feel free to use and modify!