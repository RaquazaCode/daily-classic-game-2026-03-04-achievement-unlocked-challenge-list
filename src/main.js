import {
  consumeOneShotInput,
  createInitialState,
  createInputState,
  getConfig,
  updateState
} from "./game-core.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const config = getConfig();
const input = createInputState();
let state = createInitialState();
let lastTs = performance.now();
let accumulator = 0;
const step = 1 / 60;

function mapKeyToInput(code, value) {
  if (code === "ArrowLeft" || code === "KeyA") input.left = value;
  if (code === "ArrowRight" || code === "KeyD") input.right = value;
  if (code === "ShiftLeft" || code === "ShiftRight") input.shift = value;
  if ((code === "ArrowUp" || code === "KeyW" || code === "Space") && value) {
    input.jumpPressed = true;
  }
  if ((code === "ArrowUp" || code === "KeyW" || code === "Space") && !value) {
    input.jump = false;
  }
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Enter") {
    input.start = true;
  }
  if (event.code === "KeyR") {
    input.reset = true;
  }
  if (event.code === "KeyP") {
    input.pauseToggle = true;
  }
  mapKeyToInput(event.code, true);
});

window.addEventListener("keyup", (event) => {
  mapKeyToInput(event.code, false);
});

function drawPlatform(platform) {
  ctx.fillStyle = "#334155";
  ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  ctx.strokeStyle = "#475569";
  ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
}

function drawBadge(badge) {
  if (badge.collected) {
    ctx.fillStyle = "#64748b";
  } else {
    ctx.fillStyle = "#f59e0b";
  }
  ctx.beginPath();
  ctx.arc(badge.x, badge.y, badge.radius, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#0b1f3b");
  gradient.addColorStop(1, "#0f172a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#1e293b";
  ctx.fillRect(0, config.floorY, canvas.width, canvas.height - config.floorY);

  for (const platform of config.platforms) {
    drawPlatform(platform);
  }

  const exit = config.exitDoor;
  ctx.fillStyle = "#166534";
  ctx.fillRect(exit.x, exit.y, exit.width, exit.height);
  ctx.fillStyle = "#dcfce7";
  ctx.fillRect(exit.x + 8, exit.y + 10, exit.width - 18, exit.height - 16);

  for (const badge of state.badges) {
    drawBadge(badge);
  }

  const p = state.player;
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(p.x, p.y, config.player.width, config.player.height);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "16px Trebuchet MS, sans-serif";
  ctx.fillText(`Score ${Math.floor(state.score)}`, 18, 24);
  ctx.fillText(`Mode ${state.mode}${state.paused ? " (paused)" : ""}`, 18, 46);
  ctx.fillText(`Achievements ${Object.values(state.unlocks).filter(Boolean).length}/12`, 18, 68);
  ctx.fillText("Controls: arrows/AD move, space jump, shift dash, P pause, R reset, Enter start/restart", 18, 90);
  ctx.fillStyle = "#cbd5e1";
  ctx.fillText(state.message, 18, 112);

  const panelX = 610;
  ctx.fillStyle = "#020617cc";
  ctx.fillRect(panelX, 10, 340, 195);
  ctx.fillStyle = "#e2e8f0";
  ctx.fillText("Challenge List Twist", panelX + 12, 30);

  const labels = [
    "Take 30 steps",
    "Jump 6 times",
    "Reach top bridge",
    "Collect left badge",
    "Collect mid badge",
    "Collect right badge",
    "Touch right wall",
    "Dash 2 seconds",
    "Pause and resume",
    "Survive 50 sec",
    "Collect all badges",
    "Enter exit door"
  ];

  labels.forEach((label, idx) => {
    const y = 52 + idx * 12.5;
    const unlocked = Object.values(state.unlocks)[idx];
    ctx.fillStyle = unlocked ? "#22c55e" : "#94a3b8";
    ctx.fillText(`${unlocked ? "[x]" : "[ ]"} ${label}`, panelX + 12, y);
  });

  if (state.mode === "menu") {
    ctx.fillStyle = "#000a";
    ctx.fillRect(240, 180, 480, 160);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "24px Trebuchet MS, sans-serif";
    ctx.fillText("Achievement Unlocked", 330, 238);
    ctx.font = "18px Trebuchet MS, sans-serif";
    ctx.fillText("Press Enter to start", 382, 276);
  }

  if (state.mode === "won") {
    ctx.fillStyle = "#052e16dd";
    ctx.fillRect(220, 170, 520, 180);
    ctx.fillStyle = "#bbf7d0";
    ctx.font = "30px Trebuchet MS, sans-serif";
    ctx.fillText("All Achievements Unlocked", 254, 238);
    ctx.font = "18px Trebuchet MS, sans-serif";
    ctx.fillText("Press Enter for a new run", 364, 282);
  }
}

function stepFrame(dt = step) {
  state = updateState(state, input, dt);
  draw();
  consumeOneShotInput(input);
}

function gameLoop(ts) {
  const delta = Math.min((ts - lastTs) / 1000, 0.1);
  lastTs = ts;
  accumulator += delta;
  while (accumulator >= step) {
    stepFrame(step);
    accumulator -= step;
  }
  requestAnimationFrame(gameLoop);
}

window.advanceTime = (ms) => {
  const frames = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < frames; i += 1) {
    stepFrame(1 / 60);
  }
};

window.render_game_to_text = () => {
  const payload = {
    coordinate_system: "origin top-left, x right, y down, units pixels",
    mode: state.mode,
    paused: state.paused,
    time_sec: Number(state.timeSec.toFixed(2)),
    score: Math.floor(state.score),
    player: {
      x: Number(state.player.x.toFixed(1)),
      y: Number(state.player.y.toFixed(1)),
      vx: Number(state.player.vx.toFixed(1)),
      vy: Number(state.player.vy.toFixed(1)),
      on_ground: state.player.onGround
    },
    exit: config.exitDoor,
    badges: state.badges.map((badge) => ({ id: badge.id, x: badge.x, y: badge.y, collected: badge.collected })),
    unlocked: state.unlocks,
    totals: {
      unlocked_count: Object.values(state.unlocks).filter(Boolean).length,
      steps: state.stats.steps,
      jumps: state.stats.jumps,
      dash_seconds: Number(state.stats.dashSec.toFixed(2)),
      highest_y: Number(state.stats.highestY.toFixed(1)),
      pause_used: state.stats.pauseUsed
    }
  };
  return JSON.stringify(payload);
};

draw();
requestAnimationFrame(gameLoop);
