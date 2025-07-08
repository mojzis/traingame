# Train Switch Game - Development Plan

## Original Prompt

"I would like to create a little javascript browser based game where there will be train tracks from left to right with switches on them and the users task will be to switch them so that the trains dont collide. I would like the graphics to be more symbolic, maybe to resemble hand drawing more then anything else. User should be able to enable the switch by clicking on it and thus sending the train to another rail. Let's start simple so that we have something quickly and be able to improve it later. Please pick some simple open source game engine. Please start by writing a detailed plan into the dir plans, divided into files per phases of the implementation. Feel free to ask any questions necessary. Also kindly store the prompt at the beginning of the plan. Please let's use the most modern yet practical approach possible, with tests, proper code architecture, clever tech stack. Also please make sure to follow MVP principle, don't add any extra features, let's start super simple and improve later."

## Game Concept

A minimalist train switching game where:
- Trains move from left to right on parallel tracks
- Players click switches to redirect trains between tracks
- Goal: Prevent train collisions
- Hand-drawn/sketch aesthetic

## Tech Stack

### Game Engine: Phaser 3
- Modern, well-documented, lightweight
- Excellent for 2D browser games
- Strong community and ecosystem
- Built-in physics, input handling, and asset management

### Core Technologies
- **Language**: TypeScript (type safety, modern ES features)
- **Build Tool**: Vite (fast, modern, minimal config)
- **Testing**: Vitest + Playwright (unit + e2e tests)
- **Code Quality**: ESLint + Prettier
- **Version Control**: Git
- **Package Manager**: npm

### Architecture Principles
- Component-based game objects
- Event-driven communication
- Separation of concerns (rendering, logic, state)
- Testable modules
- Progressive enhancement

## MVP Features

1. **Two parallel tracks** (top and bottom)
2. **One switch** in the middle
3. **Trains spawn** from left at intervals
4. **Click switch** to toggle track connection
5. **Collision detection** - game over on crash
6. **Simple score** - trains successfully passed

## Development Phases

### Phase 1: Foundation (01-foundation.md)
- Project setup with Vite + TypeScript
- Phaser 3 integration
- Basic game scene structure
- Development environment

### Phase 2: Core Mechanics (02-core-mechanics.md)
- Track rendering system
- Train entities and movement
- Basic collision detection
- Game loop

### Phase 3: Interaction (03-interaction.md)
- Switch component and rendering
- Click handling
- Track switching logic
- Visual feedback

### Phase 4: Game Flow (04-game-flow.md)
- Start/game over states
- Score tracking
- Train spawning system
- Difficulty progression

### Phase 5: Polish & Deploy (05-polish-deploy.md)
- Hand-drawn graphics
- Sound effects (optional)
- Testing suite
- Build and deployment

## Project Structure

```
traingame/
├── src/
│   ├── scenes/         # Phaser scenes
│   ├── entities/       # Game objects (Train, Track, Switch)
│   ├── systems/        # Game systems (collision, spawning)
│   ├── utils/          # Helper functions
│   ├── types/          # TypeScript types
│   └── main.ts         # Entry point
├── public/
│   └── assets/         # Graphics and sounds
├── tests/
│   ├── unit/          # Unit tests
│   └── e2e/           # End-to-end tests
├── plans/             # Documentation
└── package.json
```

## Success Criteria

- Playable game in browser
- No build errors or TypeScript warnings
- Core gameplay loop functional
- At least 80% test coverage
- Deployed to GitHub Pages or similar