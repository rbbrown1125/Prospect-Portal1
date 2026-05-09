# June's NYC Adventure 🐾

A 3D browser-based game starring **June** — a long-haired golden Dachshund navigating the streets of New York City.

## How to Play

Navigate June through NYC streets to reach famous landmarks. Collect meatballs for a speed boost, and dodge obstacles!

| Control | Action |
|---------|--------|
| Arrow Keys / WASD | Move June |
| Mobile | Touch D-pad (bottom-right) |

### Power-ups & Hazards

- 🍝 **Meatball** — Collect for 5-second speed boost + invincibility  
- 🐦 **Pigeon** — Bumps into June, causes vomiting + 3s slow  
- 👥 **Tourists** — Slow-moving groups block your path  
- 🚴 **Cyclists** — Fast! Very dangerous if not boosted  
- 💧 **Puddle** — Slows June down  
- 🚧 **Construction** — Wide barrier, hard to avoid  
- 🚒 **Fire Hydrant** — Small but solid obstacle  

### Levels

1. **Empire State Building** — Midtown Manhattan
2. **Washington Square Park** — Greenwich Village  
3. **Brooklyn Bridge** — Lower Manhattan

---

## Running the Game

Serve the files with any static HTTP server. Do **not** open `index.html` directly as a `file://` URL — ES modules require an HTTP server.

```bash
# Option 1: Python (built-in)
cd june-nyc-game
python3 -m http.server 8080
# Then open http://localhost:8080

# Option 2: Node.js serve
npx serve .
# Then open the URL shown in terminal

# Option 3: VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

---

## Adding Taylor Swift Music 🎵

The game is built to play your Taylor Swift songs as background music!

**Step 1:** Add your MP3 files to the `music/` folder:
```
june-nyc-game/
└── music/
    ├── shake-it-off.mp3
    ├── anti-hero.mp3
    ├── 22.mp3
    └── ...
```

**Step 2:** Edit `music/playlist.js` and add the file paths:
```js
window.junePlaylist = [
  "music/shake-it-off.mp3",
  "music/anti-hero.mp3",
  "music/22.mp3",
  "music/blank-space.mp3",
  // Add as many as you like!
];
```

**Step 3:** Click **Start Game** on the menu — music plays automatically on shuffle!

> **Note:** If no MP3s are configured, the game uses a built-in synthesized upbeat melody as a fallback.

> **Copyright reminder:** Taylor Swift's music is copyrighted. Only use MP3s you own for personal use. Do not redistribute this game with copyrighted audio files.

---

## Tech Stack

- **[Three.js r160](https://threejs.org/)** — 3D rendering (WebGL)
- **[Cannon-es 0.20](https://github.com/pmndrs/cannon-es)** — Physics engine
- **[Howler.js 2.2](https://howlerjs.com/)** — Audio/music playback
- **Web Audio API** — Sound effects (synthesized, no files needed)
- Pure vanilla JavaScript ES modules — no build step required

## Browser Requirements

- Chrome 89+ / Edge 89+
- Firefox 108+
- Safari 16.4+

(Requires ES Module importmap support)

---

*Built with ❤️ for June — the best NYC Dachshund*
