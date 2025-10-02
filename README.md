# Emoji Match Game 🎮

A fun and engaging emoji matching game built with Phaser.js. Players need to match emoji pairs within a time limit to achieve the highest score possible.

## 🎯 Game Features

- **Interactive Gameplay**: Click on emoji cards to find matching pairs
- **Timer Challenge**: Race against time to find all matches
- **Score System**: Earn points for each successful match
- **High Score Tracking**: Your best score is saved locally
- **Responsive Design**: Works on desktop and mobile devices
- **Audio Effects**: Immersive sound effects and background music

## 🚀 Getting Started

### Prerequisites
- Modern web browser with JavaScript support
- Node.js (optional, for development server)

### Installation

1. Clone or download this repository
2. Navigate to the project directory
3. Install dependencies (optional):
   ```bash
   npm install
   ```

### Running the Game

#### Option 1: Simple Local Server
```bash
npm start
```

#### Option 2: Development Server with Live Reload
```bash
npm run dev
```

#### Option 3: Direct File Access
Simply open `index.html` in your web browser.

## 📁 Project Structure

```
emojigame/
├── src/
│   ├── scenes/          # Game scenes (Boot, Preloader, MainMenu, Game)
│   ├── config/          # Configuration files
│   └── main.js          # Main entry point
├── assets/
│   ├── images/          # Game images and sprites
│   └── sounds/          # Audio files
├── docs/                # Documentation
├── index.html           # Main HTML file
├── package.json         # Project configuration
└── README.md           # This file
```

## 🎮 How to Play

1. **Start the Game**: Click on the logo or "Click to Start" button
2. **Find Matches**: Click on emoji cards to reveal them
3. **Make Pairs**: Find two matching emojis to score points
4. **Beat the Clock**: Match all pairs before time runs out
5. **High Score**: Try to beat your previous best score!

## 🛠️ Development

### File Structure Explanation

- **src/scenes/**: Contains all Phaser game scenes
  - `Boot.js`: Initial game setup and registry initialization
  - `Preloader.js`: Asset loading screen
  - `MainMenu.js`: Main menu with high score display
  - `Game.js`: Main gameplay scene
- **src/config/**: Configuration files for game settings
- **assets/**: Static assets (images, sounds) - currently loaded from CDN

### Customization

You can customize the game by modifying:
- `src/config/GameConfig.js`: Game settings, colors, timing, scoring
- Asset URLs and paths
- Game mechanics in individual scene files

## 🎨 Assets

This game uses assets from the Phaser.js examples repository. All assets are loaded from CDN for easy setup.

## 📝 License

This project is licensed under the MIT License - see the package.json file for details.

## 🙏 Credits

- Original game concept by Tom Miller
- Built with [Phaser.js](https://phaser.io/)
- Emoji assets from Phaser Examples

## 🐛 Issues and Contributions

Feel free to report issues or contribute to this project. This is a learning project and contributions are welcome!

---

**Enjoy playing! 🎮✨**
