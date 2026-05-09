export class InputManager {
  constructor() {
    this._keys = {};
    this._touchDir = { x: 0, z: 0 };
    this._boundKeyDown = this._onKeyDown.bind(this);
    this._boundKeyUp = this._onKeyUp.bind(this);
    this._dpadEl = null;
    this._setupKeyboard();
    this._setupTouch();
  }

  // Returns { x, z } where each component is -1, 0, or 1
  getMovement() {
    let x = 0;
    let z = 0;

    // Keyboard input takes priority over touch
    const keys = this._keys;
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) x -= 1;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) x += 1;
    if (keys['ArrowUp'] || keys['w'] || keys['W']) z -= 1;
    if (keys['ArrowDown'] || keys['s'] || keys['S']) z += 1;

    // If no keyboard input, use touch
    if (x === 0 && z === 0) {
      x = this._touchDir.x;
      z = this._touchDir.z;
    }

    // Clamp to -1/0/1
    x = Math.sign(x);
    z = Math.sign(z);

    return { x, z };
  }

  _onKeyDown(e) {
    this._keys[e.key] = true;
  }

  _onKeyUp(e) {
    this._keys[e.key] = false;
  }

  _setupKeyboard() {
    window.addEventListener('keydown', this._boundKeyDown);
    window.addEventListener('keyup', this._boundKeyUp);
  }

  _setupTouch() {
    const dpad = document.createElement('div');
    dpad.id = 'june-dpad';
    dpad.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'left:24px',
      'width:120px',
      'height:120px',
      'display:grid',
      'grid-template-columns:repeat(3,1fr)',
      'grid-template-rows:repeat(3,1fr)',
      'gap:4px',
      'z-index:1000',
      'user-select:none',
      '-webkit-user-select:none',
      'touch-action:none',
    ].join(';');

    const btnStyle = [
      'background:rgba(255,255,255,0.25)',
      'border:2px solid rgba(255,255,255,0.5)',
      'border-radius:8px',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'font-size:18px',
      'cursor:pointer',
      'touch-action:none',
      'user-select:none',
      '-webkit-user-select:none',
    ].join(';');

    const makeBtn = (label, col, row, dx, dz) => {
      const btn = document.createElement('div');
      btn.style.cssText = btnStyle;
      btn.style.gridColumn = col;
      btn.style.gridRow = row;
      btn.textContent = label;

      const activate = () => {
        this._touchDir.x = dx;
        this._touchDir.z = dz;
        btn.style.background = 'rgba(255,255,255,0.5)';
      };
      const deactivate = () => {
        // Only clear this direction if this button owns it
        if (this._touchDir.x === dx && this._touchDir.z === dz) {
          this._touchDir.x = 0;
          this._touchDir.z = 0;
        }
        btn.style.background = 'rgba(255,255,255,0.25)';
      };

      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        btn.setPointerCapture(e.pointerId);
        activate();
      });
      btn.addEventListener('pointerup', (e) => {
        e.preventDefault();
        deactivate();
      });
      btn.addEventListener('pointercancel', (e) => {
        e.preventDefault();
        deactivate();
      });
      btn.addEventListener('pointerleave', (e) => {
        // Only deactivate if pointer is no longer captured
        deactivate();
      });

      return btn;
    };

    // Up button: col 2, row 1
    const upBtn = makeBtn('▲', '2', '1', 0, -1);
    // Left button: col 1, row 2
    const leftBtn = makeBtn('◀', '1', '2', -1, 0);
    // Center placeholder: col 2, row 2
    const center = document.createElement('div');
    center.style.cssText = btnStyle;
    center.style.background = 'rgba(255,255,255,0.08)';
    center.style.gridColumn = '2';
    center.style.gridRow = '2';
    // Right button: col 3, row 2
    const rightBtn = makeBtn('▶', '3', '2', 1, 0);
    // Down button: col 2, row 3
    const downBtn = makeBtn('▼', '2', '3', 0, 1);

    dpad.appendChild(upBtn);
    dpad.appendChild(leftBtn);
    dpad.appendChild(center);
    dpad.appendChild(rightBtn);
    dpad.appendChild(downBtn);

    document.body.appendChild(dpad);
    this._dpadEl = dpad;
  }

  destroy() {
    window.removeEventListener('keydown', this._boundKeyDown);
    window.removeEventListener('keyup', this._boundKeyUp);
    if (this._dpadEl && this._dpadEl.parentNode) {
      this._dpadEl.parentNode.removeChild(this._dpadEl);
    }
    this._dpadEl = null;
    this._keys = {};
    this._touchDir = { x: 0, z: 0 };
  }
}
