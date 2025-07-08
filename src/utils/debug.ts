export class DebugUtils {
  static drawCollisionBoxes(scene: Phaser.Scene, enabled: boolean): void {
    if (enabled && scene.physics.world) {
      scene.physics.world.drawDebug = true;
    }
  }

  static logTrainCount(trains: any[]): void {
    console.log(`Active trains: ${trains.length}`);
  }

  static showFPS(scene: Phaser.Scene): void {
    const fpsText = scene.add.text(10, 10, '', {
      fontSize: '16px',
      color: '#00ff00',
    });

    scene.events.on('update', () => {
      fpsText.setText(`FPS: ${Math.round(scene.game.loop.actualFps)}`);
    });
  }
}
