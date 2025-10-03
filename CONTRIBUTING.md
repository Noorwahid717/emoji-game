# Contributing to Emoji Match Game

Thank you for your interest in improving the Emoji Match Game! This guide highlights the workflow, coding standards, and quality checks that keep the project healthy.

## 🤝 How to contribute

### Reporting issues

- Use the GitHub issue tracker and search for existing tickets first.
- Describe the problem, reproduction steps, and expected vs actual behaviour.
- Add screenshots or screen recordings for visual or UX bugs.

### Suggesting features

- Open an issue with the **feature request** label.
- Explain the value for players or maintainers and include mockups when possible.
- Scope ideas so they can be delivered in incremental pull requests.

### Code contributions

1. Fork the repository and clone your fork locally.
2. Create a feature branch: `git checkout -b feature/amazing-improvement`.
3. Install dependencies with `npm install`.
4. Run `npm run dev` for a live-reloading playground during development.
5. Add or update tests alongside your changes (`npm run test`).
6. Ensure linting and formatting succeed: `npm run lint` and `npm run format`.
7. Commit using meaningful messages and push the branch to your fork.
8. Open a pull request that links the relevant issue and summarises the change.

## 🧰 Project conventions

- **Language & tooling**: The codebase is TypeScript-first, bundled with Vite. Prefer TypeScript over plain JS for new modules.
- **Architecture**: Keep gameplay logic inside `src/core`, rendering inside `src/ui`, and state orchestration within `src/scenes`.
- **Localization**: Add new copy to `src/core/locale/translations.ts`, updating every supported locale and keeping placeholders consistent.
- **Formatting**: Prettier enforces formatting. ESLint runs with the strict TypeScript ruleset; fix warnings before committing.
- **Git hooks**: Husky + lint-staged automatically run ESLint/Prettier on staged files. Do not bypass hooks unless absolutely necessary.
- **Testing**: Vitest covers deterministic logic (board generation, scoring, utilities). Add or update specs when behaviour changes.

## 📦 Useful scripts

| Command                | Purpose                                      |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Start the hot-reloading development server.  |
| `npm run build`        | Produce an optimized production bundle.      |
| `npm run preview`      | Preview the production bundle locally.       |
| `npm run lint`         | Run ESLint with `--max-warnings=0`.          |
| `npm run format`       | Check formatting using Prettier.             |
| `npm run format:write` | Apply Prettier formatting fixes.             |
| `npm run test`         | Execute Vitest suites in CI mode.            |
| `npm run test:watch`   | Run Vitest in watch mode during development. |

## 🧪 Testing checklist

Before submitting a pull request:

- [ ] All Vitest suites pass (`npm run test`).
- [ ] Linting succeeds (`npm run lint`).
- [ ] UI changes include updated screenshots (attach to the PR).
- [ ] Accessibility impacts have been considered (focus states, keyboard input, colour contrast).

## 📚 Documentation

- Update [`README.md`](README.md) for new features or workflows.
- Document architectural changes in dedicated markdown files inside `docs/` when appropriate.
- Keep inline comments concise and focused on _why_ rather than _what_.

## 🚀 Release notes

- Follow semantic versioning (`major.minor.patch`).
- Update [`CHANGELOG.md`](CHANGELOG.md) with a summary of user-facing changes.
- Ensure GitHub Actions pipelines (lint, test, build, deploy) succeed before merging into `main`.

We appreciate your time and creativity—happy building! 💙
