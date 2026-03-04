# daily-classic-game-2026-03-04-achievement-unlocked-challenge-list

<div align="center">
  <h3>Achievement Unlocked, rebuilt as a deterministic browser MVP with a visible challenge-list twist.</h3>
  <p>Complete movement, jump, badge collection, survival, and pacing challenges to unlock the exit.</p>
</div>

<div align="center">
  <strong>Media</strong><br/>
  Gameplay capture artifacts are generated under <code>artifacts/playwright/</code> during verification.
</div>

## Quick Start
- `pnpm install`
- `pnpm dev`
- `pnpm test`
- `pnpm build`

## How To Play
- Press `Enter` to start.
- Move with `ArrowLeft` / `ArrowRight` or `A` / `D`.
- Jump with `Space`, `W`, or `ArrowUp`.
- Hold `Shift` while moving to dash.
- Press `P` to pause/resume.
- Press `R` to reset the run.
- After unlocking enough achievements, enter the green exit door.

## Rules
- The run begins from a menu state and transitions to active play.
- Gravity and platform collision are deterministic under fixed-step updates.
- Badges are collectible once per run.
- Exit door activates once all prerequisite achievements are unlocked.
- Win state requires crossing the exit door hitbox.

## Scoring
- Each unlocked challenge grants fixed points.
- Badge pickups add bonus points.
- Survival time provides a small passive score stream.

## Twist
- **Challenge List**: 12 visible achievements (movement, jump, dash, pause, badges, survival, finish) govern progression and scoring.

## Verification
- Deterministic hooks:
  - `window.advanceTime(ms)`
  - `window.render_game_to_text()`
- Validation steps:
  - `pnpm test`
  - `pnpm build`
  - Playwright action bursts + screenshot/state capture in `artifacts/playwright/`

## Project Layout
- `src/` game loop, logic, rendering
- `assets/` static assets placeholder
- `docs/plans/` implementation plan
- `scripts/self-check.mjs` deterministic self-check
- `progress.md` run log + outstanding tasks

## GIF Captures
- `Clip 1 - Start Menu To First Achievement` (`artifacts/playwright/clip-start-to-mover.gif`)
- `Clip 2 - Platform Route And Badge Collection` (`artifacts/playwright/clip-badge-route.gif`)
- `Clip 3 - Final Door Unlock And Win` (`artifacts/playwright/clip-win-door.gif`)
