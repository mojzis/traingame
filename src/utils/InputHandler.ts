export class InputHandler {
  static addHoverEffect(
    gameObject: Phaser.GameObjects.GameObject & {
      setScale: (scale: number) => void;
    },
    scaleAmount: number = 1.1,
  ): void {
    gameObject.setInteractive();

    gameObject.on('pointerover', () => {
      gameObject.setScale(scaleAmount);
    });

    gameObject.on('pointerout', () => {
      gameObject.setScale(1);
    });
  }

  static addClickAnimation(
    scene: Phaser.Scene,
    gameObject: Phaser.GameObjects.GameObject,
  ): void {
    gameObject.on('pointerdown', () => {
      scene.tweens.add({
        targets: gameObject,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        ease: 'Quad.easeInOut',
      });
    });
  }
}
