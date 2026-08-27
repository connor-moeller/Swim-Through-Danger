const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const finalScoreEl = document.getElementById('finalScore');
const statusText = document.getElementById('statusText');
const statusDot = document.getElementById('statusDot');
const seaState = document.getElementById('seaState');
const powerupHud = document.getElementById('powerupHud');
const powerupTimer = document.getElementById('powerupTimer');
const instructionOverlay = document.getElementById('instructionOverlay');
const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const newRecordEl = document.getElementById('newRecord');
const recordDistanceEl = document.getElementById('recordDistance');
const player = { x: 155, y: 300, radius: 18, vy: 0, tilt: 0 };
const keys = new Set();
let obstacles = [];
let hooks = [];
let food = null;
let bubbles = [];
let particles = [];
let running = false;
let paused = false;
let lastTime = 0;
let distance = 0;
let best = Number(localStorage.getItem('swim-danger-best') || 0);
let spawnTimer = 0;
let hookTimer = 0;
let foodTimer = 0;
let foodCooldown = 18;
let powerupRemaining = 0;
let draggingHook = null;
let animationId;
const rivalColors = [
  { body: '#ee8959', edge: '#ffb26a' },
  { body: '#d96e9a', edge: '#f6a8c5' },
  { body: '#6b9be8', edge: '#a9c8ff' },
  { body: '#a875d1', edge: '#d8adf4' },
  { body: '#54b99a', edge: '#9be1b9' }
];

bestEl.textContent = String(best).padStart(4, '0');

function resetGame() {
  player.y = canvas.height / 2;
  player.vy = 0;
  player.tilt = 0;
  obstacles = [];
  hooks = [];
  food = null;
  particles = [];
  distance = 0;
  spawnTimer = 0;
  hookTimer = 0;
  foodTimer = 0;
  foodCooldown = 18 + Math.random() * 12;
  powerupRemaining = 0;
  draggingHook = null;
  powerupHud.classList.add('hidden');
  for (let i = 0; i < 26; i++) bubbles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: 1 + Math.random() * 3, speed: .2 + Math.random() * .7, alpha: .15 + Math.random() * .3 });
}

function startGame() {
  resetGame();
  running = true;
  paused = false;
  startOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  statusText.textContent = 'CURRENT IS CALM';
  statusDot.style.background = '#5adea1';
  statusDot.style.boxShadow = '0 0 12px #5adea1';
  lastTime = performance.now();
  cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(loop);
}

function endGame() {
  running = false;
  const runDistance = Math.floor(distance);
  const isNewRecord = runDistance > best;
  finalScoreEl.textContent = runDistance;
  recordDistanceEl.textContent = isNewRecord ? runDistance : best;
  newRecordEl.classList.toggle('hidden', !isNewRecord);
  gameOverOverlay.classList.remove('hidden');
  statusText.textContent = draggingHook ? 'HOOKED BY THE SURFACE' : 'CONTACT DETECTED';
  statusDot.style.background = '#f07658';
  statusDot.style.boxShadow = '0 0 12px #f07658';
  if (isNewRecord) {
    best = runDistance;
    localStorage.setItem('swim-danger-best', best);
    bestEl.textContent = String(best).padStart(4, '0');
  }
}

function spawnObstacle() {
  const gap = Math.max(145, 205 - distance * .12);
  const center = 90 + Math.random() * (canvas.height - 180);
  const type = Math.random() > .42 ? 'seaweed' : 'fish';
  const color = rivalColors[Math.floor(Math.random() * rivalColors.length)];
  obstacles.push({ x: canvas.width + 70, center, gap, type, color, speed: 3.4 + Math.min(distance / 110, 4.4), phase: Math.random() * 10 });
}

function spawnHook() {
  hooks.push({ x: 100 + Math.random() * (canvas.width - 200), y: -24, speed: 2.2 + Math.min(distance / 120, 2.5), phase: Math.random() * 10 });
}

function spawnFood() {
  food = { x: canvas.width + 36, y: 80 + Math.random() * (canvas.height - 160), phase: Math.random() * 10 };
}

function getFishCenter(obstacle) {
  return obstacle.center + Math.sin(obstacle.phase) * 36;
}

function hitsFish(obstacle) {
  const fishY = getFishCenter(obstacle);
  const horizontal = (player.x - obstacle.x) / 36;
  const vertical = (player.y - fishY) / 20;
  return horizontal * horizontal + vertical * vertical < 1;
}

function hitsSeaweed(obstacle) {
  const horizontal = Math.abs(player.x - obstacle.x) < 27 + player.radius;
  const vertical = Math.abs(player.y - obstacle.center) < 58 + player.radius;
  return horizontal && vertical;
}

function hitsHook(hook) {
  const tipX = hook.x + 6;
  const tipY = hook.y + 10;
  return Math.abs(player.x - tipX) < player.radius + 8 && Math.abs(player.y - tipY) < player.radius + 8;
}

function hitsFood() {
  return food && Math.hypot(player.x - food.x, player.y - food.y) < player.radius + 18;
}

function update(dt) {
  const move = (keys.has('ArrowUp') ? -1 : 0) + (keys.has('ArrowDown') ? 1 : 0);
  const boostFactor = powerupRemaining > 0 ? 1.55 : 1;
  player.vy += move * 0.7 * boostFactor;
  player.vy *= .9;
  player.vy += (canvas.height / 2 - player.y) * .0009;
  if (draggingHook) {
    player.y -= dt * 190;
    draggingHook.y = player.y;
    if (player.y <= 30) { player.y = 30; endGame(); return; }
  } else {
    player.y += player.vy * dt * 60 * boostFactor;
  }
  player.y = Math.max(28, Math.min(canvas.height - 28, player.y));
  player.tilt = player.vy * .04;
  distance += dt * 9 * boostFactor;
  scoreEl.textContent = String(Math.floor(distance)).padStart(4, '0');
  spawnTimer += dt;
  const spawnEvery = Math.max(.82, 1.35 - distance / 850);
  if (spawnTimer > spawnEvery) { spawnTimer = 0; spawnObstacle(); }
  hookTimer += dt;
  if (hookTimer > Math.max(3.8, 6.5 - distance / 80)) { hookTimer = 0; spawnHook(); }
  foodTimer += dt;
  if (!food && foodTimer > foodCooldown) { foodTimer = 0; foodCooldown = 18 + Math.random() * 12; spawnFood(); }
  obstacles.forEach(obstacle => { obstacle.x -= obstacle.speed * dt * 60 * boostFactor; obstacle.phase += dt * 3; });
  hooks.forEach(hook => { if (hook !== draggingHook) hook.y += hook.speed * dt * 60; });
  obstacles = obstacles.filter(obstacle => obstacle.x > -100);
  hooks = hooks.filter(hook => hook.y < canvas.height + 60 || hook === draggingHook);
  if (food) { food.x -= (2.4 + Math.min(distance / 200, 1.8)) * dt * 60 * boostFactor; food.phase += dt * 4; if (food.x < -40) food = null; }
  bubbles.forEach(bubble => { bubble.x -= bubble.speed * dt * 60; if (bubble.x < -10) { bubble.x = canvas.width + 10; bubble.y = Math.random() * canvas.height; } });
  if (powerupRemaining > 0) {
    powerupRemaining = Math.max(0, powerupRemaining - dt);
    powerupTimer.textContent = powerupRemaining.toFixed(1);
    powerupHud.classList.remove('hidden');
    statusText.textContent = 'BOOSTED CURRENT';
  } else {
    powerupHud.classList.add('hidden');
    if (distance > 45) { statusText.textContent = 'CURRENT IS QUICKENING'; seaState.textContent = 'RESTLESS'; }
  }
  if (!draggingHook && powerupRemaining <= 0) {
    for (const hook of hooks) {
      if (hitsHook(hook)) { draggingHook = hook; hook.y = player.y; statusText.textContent = 'HOOKED BY THE SURFACE'; break; }
    }
  }
  if (!draggingHook && hitsFood()) {
    food = null;
    powerupRemaining = 5;
    powerupTimer.textContent = powerupRemaining.toFixed(1);
    powerupHud.classList.remove('hidden');
  }
  if (draggingHook || powerupRemaining > 0) return;
  for (const obstacle of obstacles) {
    const collision = obstacle.type === 'fish' ? hitsFish(obstacle) : hitsSeaweed(obstacle);
    if (collision) { explode(); endGame(); break; }
  }
}

function explode() {
  for (let i = 0; i < 18; i++) particles.push({ x: player.x, y: player.y, vx: (Math.random() - .5) * 7, vy: (Math.random() - .5) * 7, life: 1 });
}

function drawBackground(time) {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#0b5264'); gradient.addColorStop(.52, '#0b7380'); gradient.addColorStop(1, '#063e51');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(175, 238, 224, .09)'; ctx.lineWidth = 1;
  for (let y = 55; y < canvas.height; y += 82) { ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(220, y - 20, 370, y + 20, canvas.width, y - 8); ctx.stroke(); }
  bubbles.forEach(bubble => { ctx.beginPath(); ctx.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2); ctx.strokeStyle = `rgba(207, 250, 237, ${bubble.alpha})`; ctx.stroke(); });
  ctx.fillStyle = 'rgba(3, 36, 47, .24)'; ctx.fillRect(0, canvas.height - 22, canvas.width, 22);
  ctx.fillStyle = 'rgba(16, 104, 102, .5)';
  for (let x = 0; x < canvas.width; x += 24) { ctx.beginPath(); ctx.moveTo(x, canvas.height); ctx.lineTo(x + 6, canvas.height - 37 - Math.sin(time / 700 + x) * 8); ctx.lineTo(x + 14, canvas.height); ctx.fill(); }
  drawBorderReef(time, 0, 1);
  drawBorderReef(time, canvas.height, -1);
}

function drawBorderReef(time, base, direction) {
  ctx.fillStyle = 'rgba(190, 82, 69, .94)';
  ctx.strokeStyle = 'rgba(255, 164, 111, .72)';
  ctx.lineWidth = 2;
  for (let x = -18; x < canvas.width + 24; x += 30) {
    const height = 25 + (Math.sin(time / 800 + x * .08) + 1) * 11;
    ctx.beginPath();
    ctx.moveTo(x - 15, base);
    ctx.lineTo(x - 8, base + direction * height * .65);
    ctx.lineTo(x + 1, base + direction * height);
    ctx.lineTo(x + 8, base + direction * height * .48);
    ctx.lineTo(x + 17, base);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawSeaweed(x, center, time) {
  ctx.fillStyle = '#2b9b7d'; ctx.strokeStyle = '#8be0a7'; ctx.lineWidth = 3;
  for (let index = -1; index <= 1; index++) {
    const sway = Math.sin(time / 420 + index * 1.7) * 12;
    const stemX = x + index * 14;
    ctx.beginPath();
    ctx.moveTo(stemX - 6, center + 62);
    ctx.quadraticCurveTo(stemX - 14 + sway, center + 18, stemX + sway, center - 56);
    ctx.quadraticCurveTo(stemX + 8 + sway, center - 18, stemX + 8, center + 62);
    ctx.lineTo(stemX + 1, center + 78);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawHook(hook) {
  ctx.strokeStyle = 'rgba(232, 241, 224, .72)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(hook.x - 8, 0); ctx.lineTo(hook.x - 8, hook.y - 18); ctx.stroke();
  ctx.strokeStyle = '#dce7da'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hook.x - 8, hook.y - 18);
  ctx.lineTo(hook.x - 8, hook.y + 2);
  ctx.quadraticCurveTo(hook.x - 8, hook.y + 18, hook.x + 6, hook.y + 14);
  ctx.quadraticCurveTo(hook.x + 14, hook.y + 12, hook.x + 14, hook.y + 3);
  ctx.stroke();
  ctx.strokeStyle = '#f1f5df'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(hook.x + 14, hook.y + 3); ctx.lineTo(hook.x + 9, hook.y + 10); ctx.stroke();
}

function drawFood(time) {
  if (!food) return;
  const pulse = 1 + Math.sin(time / 130 + food.phase) * .12;
  ctx.save(); ctx.translate(food.x, food.y); ctx.scale(pulse, pulse);
  ctx.shadowColor = '#f5bd4d'; ctx.shadowBlur = 18; ctx.fillStyle = '#f5bd4d';
  ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = '#fff1ad'; ctx.beginPath(); ctx.arc(-4, -4, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

function drawFish(x, center, color) {
  ctx.save(); ctx.translate(x, center); ctx.scale(-1, 1); ctx.fillStyle = color.body; ctx.strokeStyle = color.edge; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-35, 0); ctx.lineTo(-55, -19); ctx.lineTo(-52, 19); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 0, 36, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#071f2b'; ctx.beginPath(); ctx.arc(20, -5, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

function drawPlayer() {
  ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.tilt); if (powerupRemaining > 0) { ctx.shadowColor = '#f5bd4d'; ctx.shadowBlur = 28; } ctx.fillStyle = '#f2b842'; ctx.strokeStyle = '#ffe18a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-40, -20); ctx.lineTo(-38, 20); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(2, 0, 28, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#09222b'; ctx.beginPath(); ctx.arc(16, -6, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

function draw(time) {
  drawBackground(time);
  hooks.forEach(drawHook);
  drawFood(time);
  obstacles.forEach(obstacle => obstacle.type === 'seaweed' ? drawSeaweed(obstacle.x, obstacle.center, time) : drawFish(obstacle.x, getFishCenter(obstacle), obstacle.color));
  particles.forEach(particle => { particle.x += particle.vx; particle.y += particle.vy; particle.life -= .03; ctx.fillStyle = `rgba(245, 189, 77, ${particle.life})`; ctx.fillRect(particle.x, particle.y, 4, 4); });
  if (running) drawPlayer();
}

function loop(time) {
  const dt = Math.min((time - lastTime) / 1000, .04); lastTime = time;
  if (!paused) update(dt);
  draw(time);
  if (running) animationId = requestAnimationFrame(loop);
}

window.addEventListener('keydown', event => {
  if (['ArrowUp', 'ArrowDown', ' '].includes(event.key)) event.preventDefault();
  if (event.key === ' ') { if (running) { paused = !paused; statusText.textContent = paused ? 'CURRENT PAUSED' : 'CURRENT IS QUICKENING'; } return; }
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') keys.add(event.key);
});
window.addEventListener('keyup', event => keys.delete(event.key));
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('restartButton').addEventListener('click', startGame);
document.getElementById('instructionButton').addEventListener('click', () => {
  localStorage.setItem('swim-danger-instructions-seen', 'true');
  instructionOverlay.classList.add('hidden');
  startOverlay.classList.remove('hidden');
});
if (localStorage.getItem('swim-danger-instructions-seen')) {
  instructionOverlay.classList.add('hidden');
  startOverlay.classList.remove('hidden');
} else {
  startOverlay.classList.add('hidden');
}
resetGame(); draw(0);
