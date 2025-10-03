# Emoji Match Game – Development Guide

This document expands on the tooling, architecture, and workflows introduced in the README. Use it as a reference when working on new features or debugging issues.

## 🖥️ Environment setup

```bash
npm install
npm run dev
```

Vite serves the game at <http://localhost:5173> with hot module replacement. Update source files in `src/` and the browser reloads instantly.

### Recommended tools

- Node.js 18+
- A TypeScript-aware IDE (VS Code with the official TypeScript + ESLint extensions works well)
- Browser dev tools (Phaser offers a robust debug overlay when needed)

## 🏗️ Architecture overview

```
Boot → Preloader → Menu → Game → GameOver
  ↑                         ↓
  └────────── restart ──────┘
```

### Key directories

- `src/config` – Validated configuration objects (grid size, timer, scoring, etc.).
- `src/core` – Pure logic. Avoid Phaser APIs here so the code remains easily testable.
  - `board/BoardGenerator.ts` handles deck creation and shuffling.
  - `audio/SimpleAudio.ts` wraps Web Audio for match/mismatch cues.
  - `storage/highScoreStorage.ts` persists high scores via `localStorage`.
  - `locale/` provides translation helpers, locale detection, and change notifications.
  - `haptics/` centralises vibration helpers and ensures graceful fallbacks on unsupported devices.
- `src/scenes` – Phaser scenes orchestrating state transitions.
- `src/ui` – HUD, buttons, and overlays built with Phaser game objects.
- `src/assets` – Generated textures and the `static/` folder copied into the production build.
- `tests/` – Vitest suites covering core logic modules.

## 🎮 Gameplay systems

### Card lifecycle

1. `BoardGenerator` selects unique emoji indices and duplicates them into pairs.
2. `GameScene` renders interactive card sprites backed by those texture keys.
3. Card state (`isFaceUp`, `isMatched`) lives on the sprite instance, keeping checks lightweight.
4. Matching updates the score using `GameConfig.game.scoring` and triggers celebratory tweens/audio.

### Timer & scoring

- Base duration and warning thresholds are configured in `GameConfig`.
- The countdown runs via a Phaser timed event that updates the HUD every second.
- Matches award `matchPoints + remainingTime * timeBonus`.
- Mismatches deduct `mismatchPenalty` but never drop the score below zero.
- Clearing the board grants `completionBonus` before transitioning to `GameOver`.

### High score persistence

`BootScene` loads the saved score from `localStorage`, storing it in the scene registry. `GameScene` compares the final score after each match, updates the registry, and persists via `persistHighScore`.

## ♿ Accessibility, input, and localisation

- The HUD announces score/timer updates through `aria-live` helpers in [`src/ui/accessibility/liveRegions.ts`](../src/ui/accessibility/liveRegions.ts).
- Keyboard navigation lives inside `GameScene`. Arrow keys or WASD move the focus ring; **Enter**/**Space** flips the focused card.
- HUD toggles persist audio mute and colour-blind mode via [`preferencesStorage`](../src/core/storage/preferencesStorage.ts).
- Locale switching happens in `MenuScene` and uses the localisation helpers (`src/core/locale`). Restarting the scene reloads translated copy and saves the preference.
- `src/core/haptics/vibration.ts` wraps `navigator.vibrate` to provide match/mismatch feedback without breaking unsupported browsers.

## 🧪 Testing strategy

- **Vitest** focuses on deterministic logic: shuffling, formatting, scoring helpers, etc.
- Tests live alongside the domain they cover (`tests/core/...`).
- Run `npm run test` in CI mode or `npm run test:watch` while iterating.

Future ideas: add snapshot tests for UI overlays (Menu/GameOver) using Phaser's DOM-to-canvas rendering.

## 🔍 Debugging tips

- Enable Phaser debug output via `this.add.graphics()` overlays inside scenes or by logging registry values.
- Use the browser dev tools performance tab to inspect tween timelines and memory usage.
- Temporarily lower `GameConfig.game.timer.duration` for faster repros of time-based flows.

## 📦 Build & deployment

- `npm run build` outputs the game into `dist/` with sourcemaps enabled.
- Assets from `public/` and `src/assets/static/` are copied as-is; generated textures are produced at runtime.
- The project is ready for static hosting (GitHub Pages, Netlify, Cloudflare Pages). The provided GitHub Actions workflow publishes the `dist/` directory to `gh-pages` on pushes to `main`.

## ✅ Pre-merge checklist

- [ ] All lint and test commands succeed.
- [ ] Scenes remain navigable via keyboard and pointer input.
- [ ] No regression in frame pacing (target 60 FPS on a mid-range laptop).
- [ ] Documentation updated where behaviour or tooling changed.

Happy hacking! 🧑‍💻
