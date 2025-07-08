import '@testing-library/jest-dom';

// Mock Phaser globally before any imports
vi.mock('phaser', () => ({
  default: {
    Scene: class MockScene {},
    GameObjects: {
      Rectangle: class MockRectangle {
        constructor(scene: any, x: number, y: number, width: number, height: number, color: number) {
          this.scene = scene;
          this.x = x;
          this.y = y;
          this.width = width;
          this.height = height;
          this.fillColor = color;
        }
        setStrokeStyle = vi.fn();
        setRotation = vi.fn();
        setData = vi.fn();
        getData = vi.fn();
        setAlpha = vi.fn();
        destroy = vi.fn();
        isOffScreen = vi.fn();
        getCurrentTrack = vi.fn();
        getSpeed = vi.fn();
        setTrack = vi.fn();
        update = vi.fn();
      },
      Container: class MockContainer {
        constructor(scene: any, x: number, y: number) {
          this.scene = scene;
          this.x = x;
          this.y = y;
        }
        add = vi.fn();
        setOrigin = vi.fn();
        setInteractive = vi.fn();
        on = vi.fn();
        getState = vi.fn();
        toggle = vi.fn();
        setSwitchState = vi.fn();
        getTargetTrack = vi.fn();
      },
    },
    Physics: {
      Arcade: {
        Group: class MockGroup {
          add = vi.fn();
          remove = vi.fn();
          clear = vi.fn();
        },
      },
    },
    Math: {
      Between: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
    },
  },
}));