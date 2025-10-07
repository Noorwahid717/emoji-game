import Phaser from 'phaser';

type ButtonVariant = 'primary' | 'secondary';

type ButtonOptions = {
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
  width?: number;
};

const VARIANT_COLORS: Record<
  ButtonVariant,
  { base: number; hover: number; press: number; stroke: number }
> = {
  primary: { base: 0xf97316, hover: 0xfb923c, press: 0xea580c, stroke: 0x7c2d12 },
  secondary: { base: 0x38bdf8, hover: 0x0ea5e9, press: 0x0284c7, stroke: 0x0c4a6e },
};

export class PrimaryButton extends Phaser.GameObjects.Container {
  private readonly background: Phaser.GameObjects.Rectangle;

  private readonly label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, options: ButtonOptions) {
    super(scene, x, y);

    const variant = options.variant ?? 'primary';
    const palette = VARIANT_COLORS[variant];
    const width = options.width ?? 248;
    const height = 60;

    const shadow = scene.add.rectangle(0, 8, width + 18, height + 16, 0x0f172a, 0.25);
    shadow.setOrigin(0.5, 0.5);
    shadow.setAngle(1.4);

    this.background = scene.add.rectangle(0, 0, width, height, palette.base, 0.98);
    this.background.setStrokeStyle(3, palette.stroke, 0.9);
    this.background.setOrigin(0.5, 0.5);

    this.label = scene.add.text(0, 0, options.label, {
      fontFamily: '"Poppins", "Segoe UI", sans-serif',
      fontSize: '22px',
      fontStyle: '600',
      color: '#f8fafc',
      align: 'center',
    });
    this.label.setOrigin(0.5, 0.5);
    this.label.setShadow(0, 3, 'rgba(15, 23, 42, 0.45)', 6, false, true);

    this.add([shadow, this.background, this.label]);
    scene.add.existing(this);

    this.setSize(width + 18, height + 18);
    this.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        this.background.setFillStyle(palette.hover, 1);
        this.scene.tweens.add({ targets: this, scale: 1.04, duration: 140, ease: 'Sine.easeOut' });
      })
      .on('pointerout', () => {
        this.background.setFillStyle(palette.base, 0.98);
        this.scene.tweens.add({ targets: this, scale: 1, duration: 140, ease: 'Sine.easeInOut' });
      })
      .on('pointerdown', () => {
        this.background.setFillStyle(palette.press, 1);
        this.scene.tweens.add({
          targets: this,
          scale: 0.96,
          duration: 90,
          yoyo: true,
          ease: 'Quad.easeInOut',
        });
        options.onClick();
      })
      .on('pointerup', () => {
        this.background.setFillStyle(palette.hover, 0.98);
      });
  }
}

export default PrimaryButton;
