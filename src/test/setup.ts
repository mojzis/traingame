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
    Events: {
      EventEmitter: class MockEventEmitter {
        private listeners: Map<string, ((...args: any[]) => void)[]> =
          new Map();

        on(event: string, callback: (...args: any[]) => void) {
          if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
          }
          this.listeners.get(event)!.push(callback);
          return this;
        }

        once(event: string, callback: (...args: any[]) => void) {
          const wrappedCallback = (...args: any[]) => {
            callback(...args);
            this.off(event, wrappedCallback);
          };
          return this.on(event, wrappedCallback);
        }

        off(event: string, callback?: (...args: any[]) => void) {
          if (!callback) {
            this.listeners.delete(event);
          } else {
            const callbacks = this.listeners.get(event);
            if (callbacks) {
              const index = callbacks.indexOf(callback);
              if (index !== -1) {
                callbacks.splice(index, 1);
              }
            }
          }
          return this;
        }

        emit(event: string, ...args: any[]) {
          const callbacks = this.listeners.get(event);
          if (callbacks) {
            callbacks.forEach((callback) => callback(...args));
          }
          return this;
        }

        removeAllListeners() {
          this.listeners.clear();
          return this;
        }
      },
    },
  },
}));
