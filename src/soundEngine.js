/**
 * Sound Engine for Minimalist Wedding Invitation
 * Web Audio API for organic paper flutter, card unfold, and delicate chimes
 */

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.bgMusic = null;
    this.isPlaying = false;
    this.volume = 0.45;
    this.isMuted = false;
  }

  initAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setupBgMusic(url) {
    if (this.bgMusic) return;
    this.bgMusic = new Audio(url);
    this.bgMusic.loop = true;
    this.bgMusic.volume = this.volume;
    this.bgMusic.preload = 'auto';

    this.bgMusic.addEventListener('play', () => {
      this.isPlaying = true;
      this.notifyListeners();
    });

    this.bgMusic.addEventListener('pause', () => {
      this.isPlaying = false;
      this.notifyListeners();
    });
  }

  playBgMusic() {
    this.initAudioContext();
    if (this.bgMusic) {
      this.bgMusic.play().then(() => {
        this.isPlaying = true;
        this.notifyListeners();
      }).catch(err => {
        console.log("Autoplay waiting for interaction:", err);
      });
    }
  }

  toggleBgMusic() {
    this.initAudioContext();
    if (!this.bgMusic) return;
    if (this.isPlaying) {
      this.bgMusic.pause();
    } else {
      this.bgMusic.play().catch(e => console.log(e));
    }
  }

  // Organic Paper Unfolding / Rustle sound
  playPaperTurnSound() {
    this.initAudioContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const bufferSize = this.audioCtx.sampleRate * 0.12;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(2.5, now);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioCtx.destination);

    noise.start(now);

    // Add subtle warm bell harmonic
    this.playSoftNote(now + 0.05, 523.25); // C5
  }

  playSoftNote(time, freq) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.08, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.8);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(time);
    osc.stop(time + 0.8);
  }

  onStateChange(cb) {
    this.listener = cb;
  }

  notifyListeners() {
    if (this.listener) {
      this.listener({
        isPlaying: this.isPlaying,
        isMuted: this.isMuted,
      });
    }
  }
}

export const soundEngine = new SoundEngine();
