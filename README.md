# Emoji Match

> EN: A responsive Phaser 3 memory game with local assets, power-ups, and polished UX.
>
> ID: Gim mencocokkan emoji berbasis Phaser 3 dengan aset lokal, power-up, dan UX yang halus.

## Highlights

- Local-only textures and audio (no CDN); generated assets live in `src/assets/images` and `src/assets/audio`.
- Fisher–Yates shuffling, guarded state machine for flips, and cleaned-up timer lifecycle (no leaks).
- Power-ups (hint, freeze, shuffle) with safe cooldown handling and persistent preferences (audio, difficulty, colour blind mode).
- Responsive layout (safe-area padding, larger touch hit areas, `Phaser.Scale.FIT`) and mobile audio unlock on first interaction.
- Accessibility features: keyboard navigation, focus rings, live HUD updates, and bilingual menu copy.
- Vite 5 toolchain with TypeScript, ESLint/Prettier, Vitest, Husky hooks, and reproducible builds for GitHub Pages.

## Project Structure

```
emoji-match/
├── public/                  # Favicon and static files shipped as-is
├── scripts/                 # Asset (PNG/WAV) generation helpers
├── src/
│   ├── assets/
│   │   ├── audio/           # Prebuilt WAV cues (match, mismatch, success, countdown)
│   │   └── images/          # Background, cards, emoji atlas (+ JSON)
│   ├── config/              # GameConfig.ts (timer, scoring, layout)
│   ├── data/                # Emoji catalog (src/data/emojis.ts)
│   ├── scenes/              # Boot, Preloader, MainMenu, Game, GameOver
│   ├── ui/                  # HUD components, buttons, live regions
│   ├── utils/               # shuffle, state machine, scoring + card helpers
│   └── main.ts              # Vite entry point (Phaser bootstrapping)
├── tests/                   # Vitest specs (board, missions, utils)
├── index.html               # Minimal root template with `#game` container
└── vite.config.ts           # Vite base + build settings
```

## Quick Start

```bash
npm install
npm run dev
```

- Development server: <http://localhost:5173>
- Production build: `npm run build`
- Local preview of the `dist/` output: `npm run preview`

## Gameplay & Systems

### Power-ups

- **Hint** reveals a guaranteed pair briefly.
- **Freeze** pauses the timer for the configured duration.
- **Shuffle** rearranges unmatched cards; input is locked until the animation completes.

### Scoring & Timer

- Configurable per-mode scoring/penalties via `GameConfig.ts`.
- Deterministic daily seed support (`daily` mode) using `createSeededRandom`.
- Match scoring now depends on `utils/scoring.calculateMatchScore`; mismatch penalties use `applyMismatchPenalty` (unit-tested).

### Accessibility & Responsiveness

- Keyboard support (Arrow/WASD + Enter/Space) and focus-ring feedback.
- Enlarged hit areas (`refreshCardInteractivity`) for small screens.
- Safe-area aware layout (`src/styles/global.css`) to avoid notch clipping.
- Audio unlock handled on first pointer/keyboard interaction (Main Menu + Game scenes).

## Configuration

- `src/config/GameConfig.ts` — levels, timers, scoring, power-up counts, layout sizing.
- `src/data/emojis.ts` — emoji catalog (`id`, `char`, `label`) consumed by the generated atlas.
- Utility helpers: `src/utils/stateMachine.ts` (flip FSM), `src/utils/cards.ts`, `src/utils/scoring.ts`.

## Testing

Vitest runs deterministic unit tests:

| Command              | Purpose                                                          |
| -------------------- | ---------------------------------------------------------------- |
| `npm run test`       | Run full suite (shuffle, cards, scoring, board, missions, time). |
| `npm run test:watch` | Watch mode for TDD.                                              |

New specs cover the Fisher–Yates shuffle, scoring helpers, matching logic, and BoardGenerator metadata.

## Deployment (GitHub Pages)

1. Build the site: `npm run build` (outputs to `dist/`).
2. Option A – **GitHub Actions**: use the official [Pages Deploy](https://github.com/actions/deploy-pages) workflow targeting `dist/`.
3. Option B – **Manual branch**:
   - `git checkout --orphan gh-pages`
   - `npm run build`
   - Copy contents of `dist/` to the branch root, commit, and push.
   - In _Repository Settings → Pages_, choose **Deploy from branch** using `gh-pages / (root)`.
4. Set `VITE_BASE_URL` (or `BASE_URL`) if you deploy under a subdirectory, e.g. `VITE_BASE_URL=/emoji-game/ npm run build`.

## Assets

- Images are generated via `scripts/generate-assets.ps1` (Windows PowerShell, uses `System.Drawing`).
- Audio cues are synthesised via `scripts/generate-audio.mjs` (Node script producing simple sine-wave WAV files).
- Replace any PNG/WAV in `src/assets/images|audio` as needed; imports use Vite’s `?url` suffix so the bundler rewrites paths automatically.

## QA Checklist

- ✅ Assets load from local `/assets/...` paths with `import.meta.env.BASE_URL` awareness.
- ✅ Input lock prevents tapping a third card while two are resolving.
- ✅ Timer uses `this.time.addEvent`; events/tweens are cleaned in `shutdown`.
- ✅ Mobile: hit areas enlarged, audio unlock on first tap.
- ✅ High scores persist via `localStorage` with safe numeric parsing and only write when higher.
- ✅ Unit tests cover shuffle, scoring math, and match detection.

## License

Released under the [MIT License](LICENSE). Kontribusi sangat diterima — silakan buka pull request setelah lulus lint/test.
