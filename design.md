# Design

This MVP recreates a compact `Achievement Unlocked`-style platform arena with a visible challenge list as the central twist.

## Goals
- Deterministic update loop for reproducible automated checks.
- Simple platformer movement + collisions + collectible badges.
- Achievement checklist that drives score and win state.
- Hooks for unattended browser verification (`window.advanceTime(ms)`, `window.render_game_to_text()`).

## Core Loop
1. Start run with Enter.
2. Move, jump, dash, collect badges, and trigger challenge conditions.
3. Unlock achievements to gain points.
4. Enter exit door after 11 prior achievements are unlocked.
5. Restart with Enter in win screen or reset immediately with `R`.
