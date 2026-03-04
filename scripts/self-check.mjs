import assert from "node:assert/strict";
import { createInitialState, createInputState, updateState } from "../src/game-core.js";

function runFrames(state, input, frames, mutate) {
  for (let i = 0; i < frames; i += 1) {
    if (mutate) mutate(i, input);
    state = updateState(state, input, 1 / 60);
    input.jumpPressed = false;
    input.pauseToggle = false;
    input.reset = false;
    input.start = false;
  }
  return state;
}

let state = createInitialState();
let input = createInputState();

input.start = true;
state = updateState(state, input, 1 / 60);
assert.equal(state.mode, "playing");

input.right = true;
state = runFrames(state, input, 260);
assert.ok(state.stats.steps >= 30, "expected steps challenge progress");
assert.equal(state.unlocks.mover, true);

input.right = false;
state = runFrames(state, input, 2, (i, io) => {
  if (i === 0) io.pauseToggle = true;
});
assert.equal(state.paused, true);
assert.equal(state.unlocks.calm, true);

input.pauseToggle = true;
state = updateState(state, input, 1 / 60);
assert.equal(state.paused, false);

input.reset = true;
state = updateState(state, input, 1 / 60);
assert.equal(state.mode, "menu");
assert.equal(state.resetCount, 1);

console.log("self-check passed");
