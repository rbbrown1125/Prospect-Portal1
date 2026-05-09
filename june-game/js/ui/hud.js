export class HUD {
  constructor() {
    this._container = null;
    this._arrowCanvas = null;
    this._destLabel = null;
    this._speedCanvas = null;
    this._powerBar = null;
    this._powerBarBg = null;
    this._powerLabel = null;
    this._levelLabel = null;
    this._timerLabel = null;
    this._meatballCount = null;

    this._create();
  }

  _create() {
    // Main HUD container (full screen, pointer-events: none)
    this._container = document.createElement('div');
    this._container.id = 'hud';
    this._container.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 100; font-family: 'Arial', sans-serif;
    `;
    document.body.appendChild(this._container);

    this._createDirectionArrow();
    this._createPowerUpBar();
    this._createLevelInfo();
    this._createSpeedometer();
    this._createTimer();
    this._createMeatballCounter();
  }

  _createDirectionArrow() {
    // Top-center: destination name + arrow canvas
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
      display: flex; flex-direction: column; align-items: center; gap: 6px;
    `;

    this._destLabel = document.createElement('div');
    this._destLabel.style.cssText = `
      color: #FFD700; font-size: 16px; font-weight: bold;
      text-shadow: 0 0 8px rgba(255,215,0,0.8), 2px 2px 4px rgba(0,0,0,0.9);
      white-space: nowrap;
    `;
    this._destLabel.textContent = 'HEAD TO YOUR DESTINATION';

    this._arrowCanvas = document.createElement('canvas');
    this._arrowCanvas.width = 60;
    this._arrowCanvas.height = 60;
    this._arrowCanvas.style.cssText = 'filter: drop-shadow(0 0 6px rgba(255,215,0,0.8));';

    panel.appendChild(this._destLabel);
    panel.appendChild(this._arrowCanvas);
    this._container.appendChild(panel);
  }

  _createPowerUpBar() {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: absolute; top: 16px; left: 16px;
      display: flex; flex-direction: column; gap: 6px; width: 200px;
    `;

    this._powerLabel = document.createElement('div');
    this._powerLabel.style.cssText = `
      color: white; font-size: 13px; font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.9); display: none;
    `;

    const barBg = document.createElement('div');
    barBg.style.cssText = `
      width: 200px; height: 10px; background: rgba(0,0,0,0.5);
      border-radius: 5px; overflow: hidden; display: none;
    `;
    this._powerBarBg = barBg;

    this._powerBar = document.createElement('div');
    this._powerBar.style.cssText = `
      height: 100%; width: 100%; border-radius: 5px; transition: width 0.1s;
    `;
    barBg.appendChild(this._powerBar);

    panel.appendChild(this._powerLabel);
    panel.appendChild(barBg);
    this._container.appendChild(panel);
  }

  _createLevelInfo() {
    this._levelLabel = document.createElement('div');
    this._levelLabel.style.cssText = `
      position: absolute; top: 16px; right: 16px;
      color: white; font-size: 14px; font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.9);
      text-align: right;
    `;
    this._container.appendChild(this._levelLabel);
  }

  _createSpeedometer() {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: absolute; bottom: 140px; right: 16px;
      display: flex; flex-direction: column; align-items: center; gap: 4px;
    `;

    const speedCanvas = document.createElement('canvas');
    speedCanvas.width = 80;
    speedCanvas.height = 80;
    this._speedCanvas = speedCanvas;

    const speedLabel = document.createElement('div');
    speedLabel.style.cssText = `color: white; font-size: 11px; text-shadow: 1px 1px 3px black;`;
    speedLabel.textContent = 'SPEED';

    panel.appendChild(speedCanvas);
    panel.appendChild(speedLabel);
    this._container.appendChild(panel);
  }

  _createTimer() {
    this._timerLabel = document.createElement('div');
    this._timerLabel.style.cssText = `
      position: absolute; bottom: 20px; right: 16px;
      color: white; font-size: 20px; font-weight: bold; font-variant-numeric: tabular-nums;
      text-shadow: 2px 2px 6px rgba(0,0,0,0.9);
    `;
    this._container.appendChild(this._timerLabel);
  }

  _createMeatballCounter() {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: absolute; bottom: 20px; left: 16px;
      display: flex; align-items: center; gap: 8px;
      color: white; font-size: 16px; font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.9);
    `;

    const icon = document.createElement('span');
    icon.style.cssText = `font-size: 22px;`;
    icon.textContent = '\u{1F35D}'; // spaghetti emoji

    this._meatballCount = document.createElement('span');
    this._meatballCount.textContent = '0';

    panel.appendChild(icon);
    panel.appendChild(this._meatballCount);
    this._container.appendChild(panel);
  }

  update(junePos, destPos, gameState, camera) {
    // Update direction arrow
    this._updateArrow(junePos, destPos, camera);

    // Update power bar
    this._updatePowerBar(gameState);

    // Update level info
    this._levelLabel.textContent = `Level ${gameState.level}`;

    // Update timer — gameState.elapsedTime is incremented in main.js AND in gameState.update(dt),
    // so we read it directly from gameState here (main.js increments it before calling hud.update)
    const t = gameState.elapsedTime;
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    this._timerLabel.textContent = `${m}:${s}`;

    // Update meatball count
    this._meatballCount.textContent = gameState.meatballsCollected;

    // Update speedometer
    this._updateSpeedometer(gameState.getSpeed());
  }

  _updateArrow(junePos, destPos, camera) {
    if (!destPos || !camera) return;

    const dx = destPos.x - junePos.x;
    const dz = destPos.z - junePos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    // Angle from June to destination in world space
    const worldAngle = Math.atan2(dx, dz);

    // Camera yaw from its rotation
    const cameraYaw = camera.rotation.y;

    // Relative angle: how far clockwise from camera's forward direction
    const relAngle = worldAngle - cameraYaw;

    const ctx = this._arrowCanvas.getContext('2d');
    ctx.clearRect(0, 0, 60, 60);

    ctx.save();
    ctx.translate(30, 30);
    ctx.rotate(relAngle);

    // Draw arrow
    const arrowColor = dist < 5 ? '#00FF88' : '#FFD700';
    ctx.fillStyle = arrowColor;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(10, 8);
    ctx.lineTo(0, 2);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Distance label color
    this._destLabel.style.color = dist < 5 ? '#00FF88' : '#FFD700';
  }

  _updatePowerBar(gameState) {
    const state = gameState.juneState;

    if (state === 'boosted') {
      this._powerLabel.style.display = 'block';
      this._powerBarBg.style.display = 'block';
      this._powerLabel.textContent = '⚡ SPEED BOOST!';
      this._powerLabel.style.color = '#FFD700';
      // boostTimer counts down from TIMERS.BOOST_DURATION (5)
      const pct = Math.max(0, (gameState.boostTimer / 5) * 100);
      this._powerBar.style.width = `${pct}%`;
      this._powerBar.style.background = 'linear-gradient(90deg, #FFD700, #FFA500)';
    } else if (state === 'sick') {
      this._powerLabel.style.display = 'block';
      this._powerBarBg.style.display = 'block';
      this._powerLabel.textContent = '🤢 FEELING SICK...';
      this._powerLabel.style.color = '#5DBB63';
      // sickTimer counts down from TIMERS.SICK_DURATION (3)
      const pct = Math.max(0, (gameState.sickTimer / 3) * 100);
      this._powerBar.style.width = `${pct}%`;
      this._powerBar.style.background = 'linear-gradient(90deg, #5DBB63, #3A8A3A)';
    } else {
      this._powerLabel.style.display = 'none';
      this._powerBarBg.style.display = 'none';
    }
  }

  _updateSpeedometer(speed) {
    const ctx = this._speedCanvas.getContext('2d');
    ctx.clearRect(0, 0, 80, 80);

    const maxSpeed = 18;
    const pct = Math.min(speed / maxSpeed, 1);
    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 2.25;
    const currentAngle = startAngle + pct * (endAngle - startAngle);

    // Background arc
    ctx.beginPath();
    ctx.arc(40, 40, 30, startAngle, endAngle);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Speed arc
    const color = pct > 0.8 ? '#FFD700' : pct > 0.5 ? '#FFA500' : '#44FF88';
    ctx.beginPath();
    ctx.arc(40, 40, 30, startAngle, currentAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(40, 40, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Speed number
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(speed), 40, 40);
  }

  setDestinationLabel(name) {
    this._destLabel.textContent = `→ ${name}`;
  }

  show() {
    this._container.style.display = 'block';
  }

  hide() {
    this._container.style.display = 'none';
  }

  dispose() {
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
    this._container = null;
  }
}
