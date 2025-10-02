# Emoji Match Game - Development Guide

## 📋 Development Setup

### Local Development Environment

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   This will start a live-server on port 8080 with auto-reload.

3. **Alternative Static Server**:
   ```bash
   npm start
   ```

## 🏗️ Architecture Overview

### Scene Flow
```
Boot → Preloader → MainMenu → Game
  ↑                               ↓
  └─────────── (Game Over) ───────┘
```

### Key Components

#### Scenes
- **Boot**: Initializes game registry and basic setup
- **Preloader**: Handles all asset loading with progress display
- **MainMenu**: Displays title, high score, and game start
- **Game**: Main gameplay loop with emoji matching logic

#### Configuration
- **GameConfig.js**: Centralized configuration for all game settings
  - Phaser settings
  - Game mechanics
  - Asset paths
  - Styling options

## 🎮 Game Mechanics

### Emoji Matching System
1. 16 emojis arranged in a 4x4 grid
2. 8 unique emoji types, each appearing twice
3. Player clicks to select emojis
4. Two selections create a match attempt
5. Successful matches remove emojis and award points
6. Game ends when all matches found or timer expires

### Scoring System
- **Base Points**: 100 points per match
- **Time Bonus**: Additional points for quick matches
- **Perfect Game Bonus**: Extra points for completing without mistakes

### Timer System
- Default: 60 seconds per game
- Warning state at 10 seconds remaining
- Game ends when timer reaches zero

## 🔧 Customization Guide

### Modifying Game Settings

Edit `src/config/GameConfig.js`:

```javascript
// Change grid size
gridSize: {
    width: 6,  // More columns
    height: 4  // Same rows
}

// Adjust timer
timer: {
    duration: 90,    // 90 seconds instead of 60
    warningTime: 15  // Warning at 15 seconds
}

// Modify scoring
scoring: {
    matchPoints: 150,     // More points per match
    timeBonus: 15,        // Higher time bonus
    perfectMatchBonus: 750 // Higher perfect bonus
}
```

### Adding New Features

#### New Scene Creation
1. Create new scene file in `src/scenes/`
2. Extend `Phaser.Scene`
3. Add to scene array in `main.js`

#### Custom Assets
1. Add assets to appropriate `assets/` subfolder
2. Update asset paths in `GameConfig.js`
3. Load assets in `Preloader.js`

### Performance Optimization

#### Asset Loading
- Use asset atlases for multiple images
- Compress audio files
- Optimize image sizes

#### Code Optimization
- Use object pooling for frequent objects
- Minimize garbage collection
- Efficient event handling

## 🧪 Testing

### Manual Testing Checklist
- [ ] Game loads without errors
- [ ] All assets load properly
- [ ] Audio plays correctly
- [ ] Touch/click input works
- [ ] Score tracking functions
- [ ] High score persistence
- [ ] Timer countdown works
- [ ] Game over conditions trigger
- [ ] Scene transitions smooth

### Browser Compatibility
- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## 📊 Performance Monitoring

### Key Metrics
- Frame rate (target: 60 FPS)
- Memory usage
- Asset loading time
- Scene transition smoothness

### Debug Mode
Enable debug mode in `GameConfig.js`:
```javascript
physics: {
    default: 'arcade',
    arcade: {
        debug: true  // Shows physics bodies
    }
}
```

## 🚀 Deployment

### Static Hosting
This game can be deployed to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting

### Build Process
Currently no build process required - all files are served directly.

Future enhancements could include:
- Asset bundling
- Code minification
- Progressive Web App features

## 🔍 Troubleshooting

### Common Issues

**Game doesn't load**:
- Check browser console for errors
- Ensure all file paths are correct
- Verify Phaser.js CDN is accessible

**Assets not loading**:
- Check network tab for failed requests
- Verify asset URLs in GameConfig.js
- Ensure CORS policies allow asset loading

**Audio not playing**:
- Check browser audio policies
- Ensure user interaction before audio playback
- Verify audio file formats supported

**Performance issues**:
- Monitor browser performance tools
- Check for memory leaks
- Optimize asset sizes

## 📝 Code Style Guide

### JavaScript Conventions
- Use ES6+ features
- Prefer `const` and `let` over `var`
- Use arrow functions where appropriate
- Follow camelCase naming convention

### Scene Structure
```javascript
export default class SceneName extends Phaser.Scene {
    constructor() {
        super('SceneName');
        // Initialize properties
    }

    preload() {
        // Load assets
    }

    create() {
        // Create game objects
    }

    update() {
        // Game loop logic
    }
}
```

## 🔮 Future Enhancements

### Planned Features
- [ ] Multiple difficulty levels
- [ ] Power-ups and special abilities
- [ ] Leaderboard system
- [ ] Achievement system
- [ ] Mobile-optimized controls
- [ ] Customizable themes
- [ ] Multiplayer support

### Technical Improvements
- [ ] Asset bundling system
- [ ] Unit testing framework
- [ ] Continuous integration
- [ ] Progressive Web App features
- [ ] Offline support
- [ ] Analytics integration

---

Happy coding! 🚀
