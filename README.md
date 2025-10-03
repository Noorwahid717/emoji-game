# Emoji Match Game 🎮

A modernized emoji matching game built with [Phaser 3](https://phaser.io/), TypeScript, and Vite. Match all pairs before the timer expires, chain combos to push your score higher, and challenge yourself to beat the saved high score.

## ✨ Highlights

- **TypeScript-first Phaser setup** with strict typing for safer refactors.
- **Modular architecture** that separates gameplay logic, scenes, UI, and assets.
- **Tree-shaken Vite build** for fast development reloads and optimized production bundles.
- **Generated visuals & emoji atlas** so the game runs without external CDN dependencies while minimizing texture swaps.
- **Config-driven gameplay** – tweak level layouts, scoring rules, and timer behaviour from one TypeScript file.
- **Dynamic difficulty** with escalating board sizes, streak multipliers, and multiple play styles (Classic, Zen, Hard, Daily Challenge).
- **Power-ups & missions** introduce quick strategy boosts (hint, freeze, shuffle) alongside rotating daily/weekly goals.
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

Key configuration lives in [`src/config/GameConfig.ts`](src/config/GameConfig.ts). It validates the level progression, mode-specific timers, streak multipliers, and available power-ups to ensure playable combinations. Update the config to experiment with larger boards, alternative time bonuses, or different power-up inventories.

## 🕹️ Gameplay basics

1. Pick a mode from the main menu – Classic, Zen, Hard, or the Daily Challenge seed.
2. Flip two cards at a time to reveal their emoji, chaining matches to build streak multipliers.
3. Spend limited-use power-ups (hint, freeze, shuffle) when the board gets tricky.
4. Beat the timer (or minimise moves in Zen) as the grid grows from 4×3 to 6×5 and beyond.
5. Complete daily/weekly missions to keep returning and compete for local high scores.

## 🎮 Game modes

- **Classic** – balanced timers, generous power-ups, and time bonuses for match streaks.
- **Zen** – no timer; the HUD tracks moves so you can chase a perfect clear.
- **Hard** – tighter timers, heavier mismatch penalties, and higher scoring for expert play.
- **Daily Challenge** – a deterministic seeded run that resets each day for bragging-rights leaderboards.

## 🛠️ Power-ups & missions

- **Hint** briefly reveals a matching pair.
- **Freeze Time** pauses the countdown for a few seconds to catch your breath.
- **Shuffle** rearranges all unmatched cards.
- **Missions** track progress for “no hint” clears, high streaks, and weekly board completions. They reset automatically each day/week and persist in local storage.

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
