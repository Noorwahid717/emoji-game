# Emoji Match Game 🎮

A modernized emoji matching game built with [Phaser 3](https://phaser.io/), TypeScript, and Vite. Match all pairs before the timer expires, chain combos to push your score higher, and challenge yourself to beat the saved high score.

## ✨ Highlights

- **TypeScript-first Phaser setup** with strict typing for safer refactors.
- **Modular architecture** that separates gameplay logic, scenes, UI, and assets.
- **Tree-shaken Vite build** for fast development reloads and optimized production bundles.
- **Generated visuals & emoji atlas** so the game runs without external CDN dependencies while minimizing texture swaps.
- **Config-driven gameplay** – tweak grid size, scoring, and timer settings in one place.
- **Responsive rendering** with DPR-aware scaling that keeps the canvas sharp on mobile without overworking the GPU.
- **Preloading with audio warm-up** – the progress bar surfaces load status and keeps the Web Audio context responsive with a HUD mute toggle.
- **Accessible & localized UI** with keyboard navigation, screen reader live regions, haptic feedback, and English/Bahasa Indonesia text.
- **Automated quality checks** via ESLint, Prettier, Vitest, Husky, and GitHub Actions.

## 🚀 Quick start

```bash
npm install
npm run dev
```

The game opens automatically at <http://localhost:5173>. To create a production bundle use `npm run build`, and preview it locally with `npm run preview`.

## 🧱 Project structure

```
emoji-game/
├── src/
│   ├── assets/            # Runtime generated textures + static asset staging
│   ├── config/            # Centralized game configuration (timing, scoring, etc.)
│   ├── core/              # Pure game logic (board generation, storage, audio utils)
│   ├── scenes/            # Phaser scenes (Boot, Preloader, Menu, Game, GameOver)
│   ├── ui/                # HUD and reusable UI components
│   └── main.ts            # Vite entry point
├── tests/                 # Vitest suites for deterministic game logic
├── public/                # Static assets copied verbatim to the build output
├── index.html             # Vite HTML entrypoint
└── vite.config.ts         # Build configuration + static asset pipeline
```

Key configuration lives in [`src/config/GameConfig.ts`](src/config/GameConfig.ts). It validates the grid size, timer, and scoring to ensure playable combinations. Update the config to experiment with larger boards, different time limits, or alternative scoring rules.

## 🕹️ Gameplay basics

1. Press **Start Game** from the menu.
2. Flip two cards at a time to reveal their emoji.
3. Find matching pairs to earn points and time bonuses.
4. Clear the board before the countdown reaches zero for an extra completion bonus.
5. Your best score is saved locally between sessions.

## ♿ Accessibility & controls

- **Keyboard**: Use the arrow keys (or WASD) to move the focus between cards and press **Enter**/**Space** to flip them.
- **Pointer & touch**: Tap or click cards to reveal them. Buttons support pointer and touch interactions.
- **Audio & haptics**: Toggle sound effects from the HUD. Supported devices vibrate on matches and mismatches.
- **Screen readers**: Score and timer updates are announced via `aria-live` regions, and the game container exposes an `aria-label`.
- **Colour blind mode**: Switch palettes from the HUD to increase contrast for red/green colour blindness.
- **Localization**: Cycle between English and Bahasa Indonesia from the menu; the choice persists between sessions.

## 🧪 Tooling & scripts

| Command                | Description                                                    |
| ---------------------- | -------------------------------------------------------------- |
| `npm run dev`          | Start the Vite development server with hot-module replacement. |
| `npm run build`        | Generate a production build with source maps.                  |
| `npm run preview`      | Serve the production build locally.                            |
| `npm run lint`         | Run ESLint with the strict TypeScript ruleset.                 |
| `npm run format`       | Check formatting with Prettier.                                |
| `npm run format:write` | Auto-format supported files.                                   |
| `npm run test`         | Execute Vitest in CI mode.                                     |
| `npm run test:watch`   | Run Vitest in watch mode.                                      |

Git hooks via Husky ensure staged files pass linting and formatting before every commit.

## 🧰 Development notes

- **Board generation** lives in [`src/core/board/BoardGenerator.ts`](src/core/board/BoardGenerator.ts). It produces shuffled card pairs from the available emoji texture pool and is covered by unit tests.
- **HUD & UI** components are in [`src/ui`](src/ui). Scenes interact with UI helpers instead of drawing text directly, which keeps rendering concerns isolated.
- **Audio** feedback uses a lightweight Web Audio helper (`src/core/audio/SimpleAudio.ts`) that synthesizes cues on demand, persists mute preference, and gracefully degrades if the API is unavailable.
- **Preloader** (`src/scenes/PreloaderScene.ts`) shows a determinate progress bar while preparing the emoji atlas and warming up audio to avoid first-interaction delays.
- **Static assets** can be dropped into `src/assets/static`. They are copied into the build output by `vite-plugin-static-copy` so the game no longer depends on third-party CDNs.

## 🤝 Contributing

1. Fork the repository and create a feature branch.
2. Install dependencies with `npm install`.
3. Run `npm run lint` and `npm run test` before opening a pull request.
4. For UI changes, include a screenshot of the updated screen states when possible.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for more details about branching and coding conventions.

## 📄 License

Released under the MIT License. See [`LICENSE`](LICENSE) for full details.

Happy matching! 🎉
