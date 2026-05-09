export class SoundManager {
  constructor() {
    this._audioCtx = null;
    this._bgMusic = null;
    this._musicEnabled = true;
    this._sfxEnabled = true;
    this._initialized = false;
  }

  init() {
    // Must be called after user interaction (for autoplay policy)
    if (this._initialized) return;
    this._initialized = true;

    try {
      this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio not supported:', e);
    }

    // Load playlist from music/playlist.js (loaded as script tag)
    const playlist = window.junePlaylist || [];
    if (playlist.length > 0 && typeof Howl !== 'undefined') {
      this._loadPlaylist(playlist);
    } else {
      // Generate fallback music with Web Audio
      this._startGenerativeMusic();
    }
  }

  _loadPlaylist(files) {
    // Shuffle
    const shuffled = [...files].sort(() => Math.random() - 0.5);

    const loadNext = (index) => {
      if (index >= shuffled.length) {
        loadNext(0); // loop
        return;
      }
      this._bgMusic = new Howl({
        src: [shuffled[index]],
        volume: 0.4,
        onend: () => loadNext(index + 1),
        onloaderror: () => {
          console.warn(`Could not load ${shuffled[index]}, skipping`);
          loadNext(index + 1);
        },
      });
      if (this._musicEnabled) this._bgMusic.play();
    };

    loadNext(0);
  }

  _startGenerativeMusic() {
    if (!this._audioCtx) return;

    // Simple upbeat C major pentatonic loop using Web Audio oscillators
    const ctx = this._audioCtx;
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C D E G A C5
    const rhythm = [0.25, 0.25, 0.5, 0.25, 0.25, 0.25, 0.25, 0.5]; // note durations

    let time = ctx.currentTime + 0.1;
    let noteIdx = 0;
    let rhythmIdx = 0;
    this._genMusicRunning = true;

    const scheduleNotes = () => {
      if (!this._genMusicRunning) return;
      const lookahead = 1.5; // schedule 1.5s ahead
      while (time < ctx.currentTime + lookahead) {
        const freq = notes[noteIdx % notes.length];
        const duration = rhythm[rhythmIdx % rhythm.length] * 0.6;

        // Melody oscillator
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.08, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration + 0.05);

        // Bass note (octave down, every 4 beats)
        if (rhythmIdx % 4 === 0) {
          const bass = ctx.createOscillator();
          const bassGain = ctx.createGain();
          bass.type = 'sine';
          bass.frequency.value = freq / 2;
          bassGain.gain.setValueAtTime(0.06, time);
          bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
          bass.connect(bassGain);
          bassGain.connect(ctx.destination);
          bass.start(time);
          bass.stop(time + 0.45);
        }

        time += rhythm[rhythmIdx % rhythm.length] * 0.6;
        noteIdx++;
        rhythmIdx++;
      }
      this._genMusicTimeout = setTimeout(scheduleNotes, 500);
    };

    if (this._musicEnabled) scheduleNotes();
  }

  // --- SFX using Web Audio API ---

  _playTone(freq, duration, type = 'square', volume = 0.15) {
    if (!this._audioCtx || !this._sfxEnabled) return;
    const ctx = this._audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.05);
  }

  playFootstep() {
    if (!this._audioCtx || !this._sfxEnabled) return;
    // Short filtered noise click
    const ctx = this._audioCtx;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.04), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() - 0.5) * 0.3;
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    src.buffer = buf;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }

  playMeatballCollect() {
    if (!this._audioCtx || !this._sfxEnabled) return;
    // Ascending arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, 0.15, 'sine', 0.2), i * 70);
    });
  }

  playVomit() {
    if (!this._audioCtx || !this._sfxEnabled) return;
    const ctx = this._audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.55);
  }

  playBoostActivate() {
    if (!this._audioCtx || !this._sfxEnabled) return;
    const ctx = this._audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }

  playLevelComplete() {
    if (!this._audioCtx || !this._sfxEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    const durations = [0.15, 0.15, 0.15, 0.15, 0.4];
    let t = 0;
    notes.forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, durations[i], 'sine', 0.25), t * 1000);
      t += durations[i] * 0.8;
    });
  }

  setMusicEnabled(val) {
    this._musicEnabled = val;
    if (this._bgMusic) {
      if (val) this._bgMusic.play();
      else this._bgMusic.pause();
    }
    // For generative music, just toggle the flag; next scheduling iteration checks it
    if (!val && this._genMusicTimeout) {
      clearTimeout(this._genMusicTimeout);
      this._genMusicRunning = false;
    } else if (val && this._audioCtx && !this._bgMusic) {
      this._genMusicRunning = true;
      this._startGenerativeMusic();
    }
  }

  setSfxEnabled(val) {
    this._sfxEnabled = val;
  }

  dispose() {
    if (this._bgMusic) {
      this._bgMusic.stop();
      this._bgMusic.unload();
      this._bgMusic = null;
    }
    this._genMusicRunning = false;
    if (this._genMusicTimeout) {
      clearTimeout(this._genMusicTimeout);
      this._genMusicTimeout = null;
    }
    if (this._audioCtx) {
      this._audioCtx.close();
      this._audioCtx = null;
    }
  }
}
