import Phaser from 'phaser';

type ButtonOptions = {
  label: string;
  onClick: () => void;
};

export class PrimaryButton extends Phaser.GameObjects.Container {
  private readonly background: Phaser.GameObjects.Rectangle;

  private readonly label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, options: ButtonOptions) {
    super(scene, x, y);

    this.background = scene.add.rectangle(0, 0, 260, 72, 0x2563eb, 0.94);
    this.background.setStrokeStyle(4, 0x172554, 0.9);
    this.background.setOrigin(0.5, 0.5);

    this.label = scene.add.text(0, 0, options.label, {
      fontFamily: '"Segoe UI", Arial, sans-serif',
      fontSize: '28px',
      color: '#ffffff',
    });
    this.label.setOrigin(0.5, 0.5);

    this.add([this.background, this.label]);
    scene.add.existing(this);

    this.setSize(this.background.width, this.background.height);
    this.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        this.background.setFillStyle(0x1d4ed8);
        this.scene.tweens.add({ targets: this, scale: 1.05, duration: 120 });
      })
      .on('pointerout', () => {
        this.background.setFillStyle(0x2563eb);
        this.scene.tweens.add({ targets: this, scale: 1, duration: 120 });
      })
      .on('pointerdown', () => {
        this.scene.tweens.add({ targets: this, scale: 0.96, duration: 80, yoyo: true });
        options.onClick();
      });
  }
}

export default PrimaryButton;
