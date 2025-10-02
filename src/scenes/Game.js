export default class MainGame extends Phaser.Scene
{
    constructor ()
    {
        super('MainGame');

        this.emojis;

        this.circle1;
        this.circle2;

        this.child1;
        this.child2;

        this.selectedEmoji = null;
        this.matched = false;

        this.score = 0;
        this.highscore = 0;
        this.scoreText;

        this.timer;
        this.timerText;
        this.gameTimer = 60; // Default timer duration
    }

    create ()
    {
        this.add.image(400, 300, 'background');

        // Use colors from config (hardcoded for now, can be parameterized later)
        this.circle1 = this.add.circle(0, 0, 42).setStrokeStyle(3, 0xf8960e);
        this.circle2 = this.add.circle(0, 0, 42).setStrokeStyle(3, 0x00ff00);

        this.circle1.setVisible(false);
        this.circle2.setVisible(false);

        //  Create a 4x4 grid aligned group to hold our sprites
        this.createEmojiGrid();

        const fontStyle = {
            fontFamily: 'Arial',
            fontSize: 48,
            color: '#ffffff',
            fontStyle: 'bold',
            padding: 16,
            shadow: {
                color: '#000000',
                fill: true,
                offsetX: 2,
                offsetY: 2,
                blur: 4
            }
        };

        this.timerText = this.add.text(20, 20, '30:00', fontStyle);
        this.scoreText = this.add.text(530, 20, 'Found: 0', fontStyle);

        let children = this.emojis.getChildren();

        children.forEach((child) => {

            child.setInteractive();

        });

        this.input.on('gameobjectdown', this.selectEmoji, this);
        this.input.once('pointerdown', this.start, this);

        this.highscore = this.registry.get('highscore');

        this.createEmojiGrid();
    }

    start ()
    {
        this.score = 0;
        this.matched = false;

        this.timer = this.time.addEvent({ delay: 30000, callback: this.gameOver, callbackScope: this });

        // Play countdown sound using SimpleAudio
        const simpleAudio = this.registry.get('simpleAudio');
        if (simpleAudio) {
            setTimeout(() => {
                simpleAudio.playCountdown();
            }, 27000); // 27 second delay like original
        }
    }
    
    /**
     * Create emoji grid manually for better control
     */
    createEmojiGrid() {
        this.emojis = this.add.group();
        
        // Choose random emoji type for the PAIR (0-7)
        const pairType = Math.floor(Math.random() * 8);
        
        // Create array with exactly the distribution we want:
        // 1 pair (2 emojis of same type) + 14 unique single emojis
        const emojiTypes = [];
        
        // Add the pair first (same emoji appears twice)
        emojiTypes.push(pairType, pairType);
        
        // We need 14 more unique emojis, but we only have 7 other emoji types (0-7 excluding pairType)
        // So we need to use additional emoji types. Let's expand to use more emoji variations.
        // For now, let's use types 0-15 (we'll generate more emojis in Preloader if needed)
        
        const usedTypes = new Set([pairType]); // Track used types
        
        // Add 14 unique single emojis
        for (let i = 0; i < 14; i++) {
            let newType;
            do {
                newType = Math.floor(Math.random() * 16); // Use 0-15 for more variety
            } while (usedTypes.has(newType)); // Make sure it's not already used
            
            usedTypes.add(newType);
            emojiTypes.push(newType);
        }
        
        // Shuffle the array so pair positions are random
        this.shuffleArray(emojiTypes);
        
        // Validate array
        if (emojiTypes.length !== 16) {
            console.error(`❌ Array length is ${emojiTypes.length}, should be 16!`);
        }
        
        // Create grid 4x4
        const gridWidth = 4;
        const gridHeight = 4;
        const cellWidth = 90;
        const cellHeight = 90;
        const startX = 280;
        const startY = 200;
        
        for (let row = 0; row < gridHeight; row++) {
            for (let col = 0; col < gridWidth; col++) {
                const index = row * gridWidth + col;
                const emojiType = emojiTypes[index];
                
                if (emojiType === undefined) {
                    console.error(`❌ Emoji type is undefined at index ${index}!`);
                    continue;
                }
                
                const textureKey = `emoji-${emojiType}`;
                
                const x = startX + (col * cellWidth);
                const y = startY + (row * cellHeight);
                
                // Create emoji sprite using individual texture
                const emoji = this.add.image(x, y, textureKey);
                emoji.setInteractive();
                emoji.on('pointerdown', this.selectEmoji, this);
                
                // Store emoji type for matching
                emoji.emojiType = emojiType;
                
                this.emojis.add(emoji);
            }
        }
        
        // Clear the currently selected emojis (if any)
        this.selectedEmoji = null;

        // Stagger tween them all in with animation
        this.tweens.add({
            targets: this.emojis.getChildren(),
            scale: { start: 0, from: 0, to: 1 },
            ease: 'bounce.out',
            duration: 600,
            delay: this.tweens.stagger(100, { grid: [ 4, 4 ], from: 'center' })
        });
    }
    
    /**
     * Shuffle array using Fisher-Yates algorithm
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    selectEmoji (pointer, emoji)
    {
        // Make sure we only handle emoji objects with emojiType
        if (emoji.emojiType === undefined) {
            return;
        }
        
        if (this.matched)
        {
            return;
        }

        //  Is this the first or second selection?
        if (!this.selectedEmoji)
        {
            //  Our first emoji
            this.circle1.setPosition(emoji.x, emoji.y);
            this.circle1.setVisible(true);

            this.selectedEmoji = emoji;
        }
        else if (emoji !== this.selectedEmoji)
        {
            //  Our second emoji
            //  Is it a match?
            if (emoji.emojiType === this.selectedEmoji.emojiType)
            {
                this.circle1.setStrokeStyle(3, 0x00ff00);
                this.circle2.setPosition(emoji.x, emoji.y);
                this.circle2.setVisible(true);

                this.tweens.add({
                    targets: [ this.selectedEmoji, emoji ],
                    scale: 1.4,
                    angle: '-=30',
                    yoyo: true,
                    ease: 'sine.inout',
                    duration: 200,
                    completeDelay: 200,
                    onComplete: () => this.newRound()
                });
        
                // Play match sound using SimpleAudio
                const simpleAudio = this.registry.get('simpleAudio');
                if (simpleAudio) {
                    simpleAudio.playMatch();
                }
            }
            else
            {
                // No match - show both selections briefly, then reset
                console.log('❌ No match - showing mismatch feedback');
                
                this.circle2.setPosition(emoji.x, emoji.y);
                this.circle2.setStrokeStyle(3, 0xff0000); // Red for mismatch
                this.circle2.setVisible(true);
                
                // Flash both emojis red to indicate mismatch
                this.tweens.add({
                    targets: [this.selectedEmoji, emoji],
                    tint: 0xff6666, // Light red tint
                    duration: 300,
                    yoyo: true,
                    onComplete: () => {
                        // Reset selection after showing mismatch
                        this.circle1.setVisible(false);
                        this.circle2.setVisible(false);
                        this.circle2.setStrokeStyle(3, 0x00ff00); // Reset to green
                        this.selectedEmoji = null;
                    }
                });
            }
        }
    }

    newRound ()
    {
        this.matched = false;

        this.score++;

        this.scoreText.setText('Found: ' + this.score);

        this.circle1.setStrokeStyle(3, 0xf8960e);

        this.circle1.setVisible(false);
        this.circle2.setVisible(false);

        //  Stagger tween them all out
        this.tweens.add({
            targets: this.emojis.getChildren(),
            scale: 0,
            ease: 'power2',
            duration: 600,
            delay: this.tweens.stagger(100, { grid: [ 4, 4 ], from: 'center' }),
            onComplete: () => {
                // Clear existing emojis
                this.emojis.clear(true, true);
                // Create new grid with new random pair
                this.createEmojiGrid();
            }
        });
    }

    update ()
    {
        if (this.timer)
        {
            if (this.timer.getProgress() === 1)
            {
                this.timerText.setText('00:00');
            }
            else
            {
                const remaining = (30 - this.timer.getElapsedSeconds()).toPrecision(4);
                const pos = remaining.indexOf('.');

                let seconds = remaining.substring(0, pos);
                let ms = remaining.substr(pos + 1, 2);

                seconds = Phaser.Utils.String.Pad(seconds, 2, '0', 1);

                this.timerText.setText(seconds + ':' + ms);
            }
        }
    }

    gameOver ()
    {
        // Hide the circles since we don't track the exact pair anymore
        this.circle1.setVisible(false);
        this.circle2.setVisible(false);

        this.input.off('gameobjectdown', this.selectEmoji, this);

        console.log(this.score, this.highscore);

        if (this.score > this.highscore)
        {
            console.log('high set');

            this.registry.set('highscore', this.score);
        }

        // Show game over message
        const gameOverText = this.add.text(400, 300, 'TIME UP!\nClick to return to menu', {
            fontSize: '32px',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('MainMenu');
        }, this);
    }
}