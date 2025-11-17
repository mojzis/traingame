import '@testing-library/jest-dom';

// Mock Phaser globally before any imports
vi.mock('phaser', () => ({
  default: {
    Scene: class MockScene {},
    GameObjects: {
      Rectangle: class MockRectangle {
        scene: any;
        x: number;
        y: number;
        width: number;
        height: number;
        fillColor: number;
        body: any;

        constructor(
          scene: any,
          x: number,
          y: number,
          width: number,
          height: number,
          color: number,
        ) {
          this.scene = scene;
          this.x = x;
          this.y = y;
          this.width = width;
          this.height = height;
          this.fillColor = color;
          this.body = null;
        }
        setStrokeStyle = vi.fn().mockReturnThis();
        setRotation = vi.fn().mockReturnThis();
        setData = vi.fn().mockReturnThis();
        getData = vi.fn();
        setAlpha = vi.fn().mockReturnThis();
        destroy = vi.fn();
      },
      Container: class MockContainer {
        x: number;
        y: number;
        scene: any;
        scaleX: number = 1;
        scaleY: number = 1;

        constructor(scene: any, x: number, y: number) {
          this.scene = scene;
          this.x = x;
          this.y = y;
        }
        add = vi.fn().mockReturnThis();
        setOrigin = vi.fn().mockReturnThis();
        setInteractive = vi.fn().mockReturnThis();
        on = vi.fn().mockReturnThis();
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
      Between: (min: number, max: number) =>
        Math.floor(Math.random() * (max - min + 1)) + min,
    },
  },
}));
