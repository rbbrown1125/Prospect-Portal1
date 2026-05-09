export class Screens {
  constructor(onStart, onNextLevel, onRestart) {
    this._onStart = onStart;
    this._onNextLevel = onNextLevel;
    this._onRestart = onRestart;

    this._menuEl = null;
    this._victoryEl = null;

    this._createMenu();
    this._createVictory();
  }

  _createMenu() {
    this._menuEl = document.createElement('div');
    this._menuEl.id = 'menu-screen';
    this._menuEl.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      z-index: 200; font-family: Arial, sans-serif; color: white;
    `;

    this._menuEl.innerHTML = `
      <div style="text-align: center; max-width: 600px; padding: 40px;">
        <div style="font-size: 72px; margin-bottom: 10px;">&#x1F43E;</div>
        <h1 style="font-size: 52px; margin: 0; color: #FFD700;
                   text-shadow: 0 0 20px rgba(255,215,0,0.5);
                   font-weight: 900; letter-spacing: 2px;">
          JUNE'S NYC
        </h1>
        <h2 style="font-size: 32px; margin: 5px 0 30px; color: #C8780A;
                   text-shadow: 0 0 10px rgba(200,120,10,0.5);">
          ADVENTURE
        </h2>
        <p style="font-size: 16px; color: #aaa; margin-bottom: 30px; line-height: 1.6;">
          Help June the dachshund navigate NYC streets!<br>
          Collect &#x1F35D; <strong style="color:#FFD700">meatballs</strong> for a speed boost.<br>
          Avoid obstacles &mdash; or she'll get sick! &#x1F922;<br>
          Reach the destination to complete each level!
        </p>

        <div style="background: rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; margin-bottom: 30px; text-align: left;">
          <div style="font-size: 13px; color: #ccc; line-height: 1.8;">
            <strong style="color: white;">Controls:</strong><br>
            &#x1F3AE; Arrow Keys or WASD to move June<br>
            &#x1F4F1; Touch D-pad on mobile
          </div>
        </div>

        <button id="start-btn" style="
          background: linear-gradient(135deg, #C8780A, #FFD700);
          color: #1a1a1a; border: none; border-radius: 50px;
          padding: 18px 60px; font-size: 22px; font-weight: 900;
          cursor: pointer; letter-spacing: 1px;
          box-shadow: 0 0 30px rgba(255,215,0,0.4);
          transition: transform 0.1s, box-shadow 0.1s;
        ">
          &#x1F415; START GAME
        </button>

        <p style="margin-top: 24px; font-size: 12px; color: #555;">
          Add Taylor Swift MP3s to music/playlist.js for background music!
        </p>
      </div>
    `;

    document.body.appendChild(this._menuEl);

    const btn = this._menuEl.querySelector('#start-btn');
    btn.addEventListener('mouseover', () => {
      btn.style.transform = 'scale(1.05)';
      btn.style.boxShadow = '0 0 40px rgba(255,215,0,0.6)';
    });
    btn.addEventListener('mouseout', () => {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '0 0 30px rgba(255,215,0,0.4)';
    });
    btn.addEventListener('click', () => {
      this.hideMenu();
      this._onStart();
    });
  }

  _createVictory() {
    this._victoryEl = document.createElement('div');
    this._victoryEl.id = 'victory-screen';
    this._victoryEl.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.85);
      display: none; flex-direction: column; align-items: center; justify-content: center;
      z-index: 200; font-family: Arial, sans-serif; color: white;
    `;

    this._victoryEl.innerHTML = `
      <div style="text-align: center; max-width: 500px; padding: 40px;
                  background: linear-gradient(135deg, rgba(200,120,10,0.15), rgba(255,215,0,0.1));
                  border-radius: 20px; border: 2px solid rgba(255,215,0,0.3);">
        <div style="font-size: 60px; margin-bottom: 10px;">&#x1F3C6;</div>
        <h1 id="victory-title" style="font-size: 38px; color: #FFD700; margin: 0 0 10px;
                                       text-shadow: 0 0 15px rgba(255,215,0,0.6);">
          GOOD BOY, JUNE!
        </h1>
        <p id="victory-subtitle" style="font-size: 18px; color: #aaa; margin-bottom: 6px;">
          Destination reached!
        </p>
        <p id="victory-stats" style="font-size: 14px; color: #888; margin-bottom: 30px;"></p>

        <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
          <button id="next-level-btn" style="
            background: linear-gradient(135deg, #C8780A, #FFD700);
            color: #1a1a1a; border: none; border-radius: 50px;
            padding: 14px 40px; font-size: 18px; font-weight: bold;
            cursor: pointer; display: none;
          ">NEXT LEVEL &#x2192;</button>

          <button id="play-again-btn" style="
            background: rgba(255,255,255,0.1); color: white;
            border: 2px solid rgba(255,255,255,0.3); border-radius: 50px;
            padding: 14px 40px; font-size: 18px; font-weight: bold;
            cursor: pointer;
          ">PLAY AGAIN</button>
        </div>
      </div>
    `;

    document.body.appendChild(this._victoryEl);

    this._victoryEl.querySelector('#next-level-btn').addEventListener('click', () => {
      this.hideVictory();
      this._onNextLevel();
    });
    this._victoryEl.querySelector('#play-again-btn').addEventListener('click', () => {
      this.hideVictory();
      this._onRestart();
    });
  }

  showMenu() {
    this._menuEl.style.display = 'flex';
  }

  hideMenu() {
    this._menuEl.style.display = 'none';
  }

  showVictory(levelData, time, meatballs, hasNextLevel) {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60).toString().padStart(2, '0');

    this._victoryEl.querySelector('#victory-title').textContent = '\u{1F43E} GOOD BOY, JUNE!';
    this._victoryEl.querySelector('#victory-subtitle').textContent =
      `Reached: ${levelData.destinationLabel}`;
    this._victoryEl.querySelector('#victory-stats').textContent =
      `Time: ${m}:${s} | Meatballs collected: ${meatballs} \u{1F35D}`;

    const nextBtn = this._victoryEl.querySelector('#next-level-btn');
    nextBtn.style.display = hasNextLevel ? 'block' : 'none';

    this._victoryEl.style.display = 'flex';
  }

  hideVictory() {
    this._victoryEl.style.display = 'none';
  }

  dispose() {
    if (this._menuEl && this._menuEl.parentNode) {
      this._menuEl.parentNode.removeChild(this._menuEl);
    }
    if (this._victoryEl && this._victoryEl.parentNode) {
      this._victoryEl.parentNode.removeChild(this._victoryEl);
    }
    this._menuEl = null;
    this._victoryEl = null;
  }
}
