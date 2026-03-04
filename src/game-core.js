const ARENA = { width: 960, height: 540 };
const FLOOR_Y = 490;
const PLAYER = { width: 28, height: 42, speed: 220, jump: 420 };
const GRAVITY = 980;

const CHALLENGES = [
  { id: "mover", label: "Take 30 steps", points: 50 },
  { id: "jumper", label: "Jump 6 times", points: 75 },
  { id: "high_jump", label: "Reach the top bridge", points: 120 },
  { id: "coin_1", label: "Collect Left Badge", points: 140 },
  { id: "coin_2", label: "Collect Mid Badge", points: 160 },
  { id: "coin_3", label: "Collect Right Badge", points: 180 },
  { id: "wall_tap", label: "Touch the right wall", points: 70 },
  { id: "dash", label: "Dash for 2 seconds", points: 90 },
  { id: "calm", label: "Pause and resume", points: 40 },
  { id: "survivor", label: "Stay alive for 50 sec", points: 210 },
  { id: "combo", label: "Collect all badges", points: 220 },
  { id: "finisher", label: "Enter Exit Door", points: 300 }
];

const PLATFORMS = [
  { x: 110, y: 420, width: 160, height: 14 },
  { x: 330, y: 358, width: 170, height: 14 },
  { x: 560, y: 305, width: 190, height: 14 },
  { x: 710, y: 230, width: 120, height: 14 }
];

const BADGES = [
  { id: "left", x: 170, y: 383, radius: 10, collected: false },
  { id: "middle", x: 414, y: 321, radius: 10, collected: false },
  { id: "right", x: 650, y: 268, radius: 10, collected: false }
];

const EXIT_DOOR = { x: 804, y: 188, width: 44, height: 42 };

function createChallengeMap() {
  const unlocked = {};
  for (const challenge of CHALLENGES) unlocked[challenge.id] = false;
  return unlocked;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function playerRect(player) {
  return { x: player.x, y: player.y, width: PLAYER.width, height: PLAYER.height };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createInitialState() {
  return {
    mode: "menu",
    paused: false,
    resetCount: 0,
    timeSec: 0,
    score: 0,
    frame: 0,
    stats: {
      steps: 0,
      jumps: 0,
      highestY: FLOOR_Y,
      dashSec: 0,
      touchedRightWall: false,
      pauseUsed: false
    },
    player: {
      x: 64,
      y: FLOOR_Y - PLAYER.height,
      vx: 0,
      vy: 0,
      onGround: true,
      moveAccumulator: 0
    },
    unlocks: createChallengeMap(),
    badges: BADGES.map((badge) => ({ ...badge })),
    message: "Press Enter to Start"
  };
}

function unlock(state, id) {
  if (state.unlocks[id]) return;
  const challenge = CHALLENGES.find((entry) => entry.id === id);
  if (!challenge) return;
  state.unlocks[id] = true;
  state.score += challenge.points;
  state.message = `Achievement: ${challenge.label}`;
}

function countUnlocked(state) {
  return Object.values(state.unlocks).filter(Boolean).length;
}

function handleCollision(player, platform) {
  const playerBottom = player.y + PLAYER.height;
  const previousBottom = player.y - player.vy * (1 / 60) + PLAYER.height;
  if (previousBottom <= platform.y && playerBottom >= platform.y && player.vy >= 0) {
    player.y = platform.y - PLAYER.height;
    player.vy = 0;
    player.onGround = true;
    return true;
  }
  return false;
}

export function updateState(state, input, dt) {
  const fixedDt = Math.min(dt, 1 / 30);

  if (input.start && state.mode === "menu") {
    state.mode = "playing";
    state.message = "Run the challenge list";
  }

  if (input.reset) {
    const resetCount = state.resetCount + 1;
    const next = createInitialState();
    next.resetCount = resetCount;
    next.message = "Run reset";
    return next;
  }

  if (input.pauseToggle && state.mode !== "menu") {
    state.paused = !state.paused;
    state.stats.pauseUsed = true;
    unlock(state, "calm");
    state.message = state.paused ? "Paused" : "Resumed";
  }

  if (state.paused || state.mode === "menu") {
    state.frame += 1;
    return state;
  }

  if (state.mode === "won") {
    if (input.start) {
      const resetCount = state.resetCount + 1;
      const next = createInitialState();
      next.resetCount = resetCount;
      next.mode = "playing";
      next.message = "Fresh run";
      return next;
    }
    state.frame += 1;
    return state;
  }

  state.timeSec += fixedDt;
  const player = state.player;
  const moveDir = (input.left ? -1 : 0) + (input.right ? 1 : 0);
  const sprint = input.shift ? 1.5 : 1;
  player.vx = moveDir * PLAYER.speed * sprint;

  if (moveDir !== 0) {
    player.moveAccumulator += Math.abs(player.vx) * fixedDt;
    const gainedSteps = Math.floor(player.moveAccumulator / 8);
    if (gainedSteps > 0) {
      state.stats.steps += gainedSteps;
      player.moveAccumulator -= gainedSteps * 8;
    }
  }

  if (input.jumpPressed && player.onGround) {
    player.vy = -PLAYER.jump;
    player.onGround = false;
    state.stats.jumps += 1;
  }

  if (input.shift && moveDir !== 0) {
    state.stats.dashSec += fixedDt;
  }

  player.vy += GRAVITY * fixedDt;
  player.x += player.vx * fixedDt;
  player.y += player.vy * fixedDt;

  if (player.x + PLAYER.width >= ARENA.width) {
    state.stats.touchedRightWall = true;
  }

  player.x = clamp(player.x, 0, ARENA.width - PLAYER.width);

  const floor = { x: 0, y: FLOOR_Y, width: ARENA.width, height: ARENA.height - FLOOR_Y };
  player.onGround = false;

  if (handleCollision(player, floor)) {
    player.onGround = true;
  }

  for (const platform of PLATFORMS) {
    if (handleCollision(player, platform)) {
      player.onGround = true;
    }
  }

  if (player.y + PLAYER.height > FLOOR_Y) {
    player.y = FLOOR_Y - PLAYER.height;
    player.vy = 0;
    player.onGround = true;
  }

  state.stats.highestY = Math.min(state.stats.highestY, player.y);

  for (const badge of state.badges) {
    if (badge.collected) continue;
    const dx = player.x + PLAYER.width / 2 - badge.x;
    const dy = player.y + PLAYER.height / 2 - badge.y;
    if (Math.hypot(dx, dy) <= badge.radius + 16) {
      badge.collected = true;
      state.score += 30;
    }
  }

  if (state.badges[0].collected) unlock(state, "coin_1");
  if (state.badges[1].collected) unlock(state, "coin_2");
  if (state.badges[2].collected) unlock(state, "coin_3");

  if (state.stats.steps >= 30) unlock(state, "mover");
  if (state.stats.jumps >= 6) unlock(state, "jumper");
  if (state.stats.highestY <= 250) unlock(state, "high_jump");
  if (state.stats.touchedRightWall) unlock(state, "wall_tap");
  if (state.stats.dashSec >= 2) unlock(state, "dash");
  if (state.timeSec >= 50) unlock(state, "survivor");

  if (state.badges.every((badge) => badge.collected)) unlock(state, "combo");

  const doorRect = { ...EXIT_DOOR };
  if (countUnlocked(state) >= CHALLENGES.length - 1 && rectsOverlap(playerRect(player), doorRect)) {
    unlock(state, "finisher");
    state.mode = "won";
    state.message = "All achievements unlocked";
  }

  state.score += fixedDt * 4;
  state.frame += 1;
  return state;
}

export function createInputState() {
  return {
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
    shift: false,
    start: false,
    reset: false,
    pauseToggle: false
  };
}

export function consumeOneShotInput(input) {
  input.jumpPressed = false;
  input.start = false;
  input.reset = false;
  input.pauseToggle = false;
}

export function getConfig() {
  return {
    arena: ARENA,
    floorY: FLOOR_Y,
    player: PLAYER,
    platforms: PLATFORMS,
    challenges: CHALLENGES,
    exitDoor: EXIT_DOOR
  };
}
