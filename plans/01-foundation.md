# Phase 1: Foundation & Setup

## Goals
- Set up modern TypeScript development environment
- Integrate Phaser 3 game engine
- Create basic game structure
- Implement hot reload for development

## Tasks

### 1.1 Project Initialization
```bash
# Initialize project
npm init -y

# Install dependencies
npm install phaser@3.70.0
npm install -D typescript vite @types/node
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

### 1.2 TypeScript Configuration
Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM"],
    "jsx": "react",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 1.3 Vite Configuration
Create `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 3000,
    open: true,
  },
});
```

### 1.4 ESLint & Prettier Setup
Create `.eslintrc.json`:
```json
{
  "env": {
    "browser": true,
    "es2022": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint", "prettier"],
  "rules": {
    "prettier/prettier": "error"
  }
}
```

Create `.prettierrc`:
```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### 1.5 Basic HTML Entry Point
Create `index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Train Switch Game</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f0f0f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    #game-container {
      border: 2px solid #333;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

### 1.6 Game Configuration
Create `src/config/game.config.ts`:
```typescript
export const GAME_CONFIG = {
  width: 800,
  height: 400,
  backgroundColor: '#ffffff',
  
  physics: {
    tracks: {
      top: 100,
      bottom: 300,
    },
    trainSpeed: 100, // pixels per second
  },
  
  graphics: {
    trackWidth: 4,
    trainWidth: 60,
    trainHeight: 30,
    switchSize: 40,
  },
  
  colors: {
    track: 0x333333,
    train: 0x4a90e2,
    switch: 0xe74c3c,
    switchActive: 0x27ae60,
  },
} as const;
```

### 1.7 Main Entry Point
Create `src/main.ts`:
```typescript
import Phaser from 'phaser';
import { GAME_CONFIG } from './config/game.config';
import { MainScene } from './scenes/MainScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  backgroundColor: GAME_CONFIG.backgroundColor,
  parent: 'game-container',
  scene: [MainScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: import.meta.env.DEV,
    },
  },
};

new Phaser.Game(config);
```

### 1.8 Basic Scene Structure
Create `src/scenes/MainScene.ts`:
```typescript
import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/game.config';

export class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  preload(): void {
    // Assets will be loaded here
  }

  create(): void {
    this.drawTracks();
    this.setupDebugInfo();
  }

  update(): void {
    // Game loop logic
  }

  private drawTracks(): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(GAME_CONFIG.graphics.trackWidth, GAME_CONFIG.colors.track);
    
    // Top track
    graphics.moveTo(0, GAME_CONFIG.physics.tracks.top);
    graphics.lineTo(GAME_CONFIG.width, GAME_CONFIG.physics.tracks.top);
    
    // Bottom track
    graphics.moveTo(0, GAME_CONFIG.physics.tracks.bottom);
    graphics.lineTo(GAME_CONFIG.width, GAME_CONFIG.physics.tracks.bottom);
    
    graphics.strokePath();
  }

  private setupDebugInfo(): void {
    if (import.meta.env.DEV) {
      this.add.text(10, 10, 'Train Switch Game - Dev Mode', {
        fontSize: '14px',
        color: '#666',
      });
    }
  }
}
```

### 1.9 Package.json Scripts
Update `package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  }
}
```

### 1.10 Type Definitions
Create `src/types/index.ts`:
```typescript
export type TrackPosition = 'top' | 'bottom';

export interface Position {
  x: number;
  y: number;
}

export interface GameState {
  score: number;
  isGameOver: boolean;
  isPaused: boolean;
}
```

## Verification Steps

1. Run `npm install` to install all dependencies
2. Run `npm run dev` to start development server
3. Verify browser opens with game canvas
4. Verify two horizontal tracks are rendered
5. Check console for no errors
6. Verify hot reload works by changing track colors

## Success Criteria

- [x] Vite dev server runs without errors
- [x] TypeScript compiles without warnings
- [x] Phaser renders basic scene
- [x] Tracks visible on canvas
- [x] ESLint/Prettier configured
- [x] Basic project structure established

## Next Phase
With foundation complete, Phase 2 will implement:
- Train entity class
- Basic train movement
- Train spawning system
- Collision detection basics