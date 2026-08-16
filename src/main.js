import { weddingConfig } from './config.js';

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

// ==========================================================================
// Background Ambient Audio & Luxury Toggle Button
// ==========================================================================
const music = document.querySelector('#ambient-music');
const musicToggle = document.querySelector('#music-toggle');

function updateMusicState() {
  if (!music || !musicToggle) return;
  if (music.paused) {
    musicToggle.classList.remove('is-playing');
    musicToggle.classList.add('is-paused');
    musicToggle.setAttribute('aria-pressed', 'false');
    musicToggle.title = 'Play ambient music';
  } else {
    musicToggle.classList.remove('is-paused');
    musicToggle.classList.add('is-playing');
    musicToggle.setAttribute('aria-pressed', 'true');
    musicToggle.title = 'Pause ambient music';
  }
}

if (music) {
  music.src = weddingConfig.music.src;
  music.loop = true;
  music.volume = 0.16;

  const startMusic = () => {
    music.play().then(updateMusicState).catch(() => {});
    window.removeEventListener('scroll', startMusic);
    window.removeEventListener('click', startMusic);
  };
  window.addEventListener('scroll', startMusic, { once: true, passive: true });
  window.addEventListener('click', startMusic, { once: true, passive: true });

  if (musicToggle) {
    musicToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (music.paused) {
        music.play().then(updateMusicState).catch(() => {});
      } else {
        music.pause();
        updateMusicState();
      }
    });
  }
}

const envelopeTrack = document.querySelector('.envelope-track');
const videoEnvelopeFrame = document.querySelector('#video-envelope-frame');
const envelopeCanvas = document.querySelector('#envelope-canvas');
const invitationLetter = document.querySelector('#invitation-letter');
const envelopeHeading = document.querySelector('#envelope-heading');
const stagePrompt = document.querySelector('#stage-prompt');
const celebrationTrack = document.querySelector('.celebration-track');
const celebrationCards = [...document.querySelectorAll('[data-celebration]')];
const celebrationProgress = document.querySelector('#celebration-progress');

// ==========================================================================
// Adaptive Resolution Canvas Engine (Ultra-Lite Mobile / High-Res Desktop)
// ==========================================================================
const TOTAL_FRAMES = 62;
const isDesktop = window.innerWidth >= 768;
const frameFolder = isDesktop ? 'envelope_frames_hd' : 'envelope_frames_lite';

if (envelopeCanvas) {
  envelopeCanvas.width = isDesktop ? 1440 : 800;
  envelopeCanvas.height = isDesktop ? 810 : 450;
}

const frames = [];
let lastDrawnIndex = -1;
let ctx = null;

if (envelopeCanvas) {
  ctx = envelopeCanvas.getContext('2d', { alpha: false });
}

function renderFrame(index) {
  if (!ctx || !envelopeCanvas || !frames[index] || !frames[index].complete) return;
  if (index === lastDrawnIndex) return;
  
  ctx.drawImage(frames[index], 0, 0, envelopeCanvas.width, envelopeCanvas.height);
  lastDrawnIndex = index;
}

// Preload adaptive frame sequence
for (let i = 1; i <= TOTAL_FRAMES; i++) {
  const img = new Image();
  const frameNum = String(i).padStart(3, '0');
  img.src = `/assets/${frameFolder}/f_${frameNum}.webp`;
  img.onload = () => {
    if (i === 1 && lastDrawnIndex === -1) {
      renderFrame(0);
    }
  };
  frames.push(img);
}

function getTrackProgress(track) {
  const rect = track.getBoundingClientRect();
  return clamp(-rect.top / Math.max(1, track.offsetHeight - window.innerHeight));
}

function updateEnvelope() {
  if (!envelopeTrack) return;
  const progress = getTrackProgress(envelopeTrack);

  // 1. Instant 60fps/120fps Canvas Frame Scrubbing (0% -> 48% progress)
  const videoProgress = clamp(progress / 0.48);
  const targetFrameIndex = Math.min(TOTAL_FRAMES - 1, Math.floor(videoProgress * (TOTAL_FRAMES - 1)));
  renderFrame(targetFrameIndex);

  // 2. Grand HTML Invitation Card Reveal (38% -> 85% progress)
  if (invitationLetter) {
    const cardRaw = clamp((progress - 0.38) / 0.44);
    const cardEased = easeOutCubic(cardRaw);
    
    // Smooth lift & scale
    const cardY = (1 - cardEased) * 70;
    const cardScale = 0.93 + cardEased * 0.07;
    
    invitationLetter.style.opacity = String(cardEased);
    invitationLetter.style.transform = `translateY(${cardY}px) scale(${cardScale})`;
    invitationLetter.style.pointerEvents = cardEased > 0.7 ? 'auto' : 'none';
    invitationLetter.style.boxShadow = `0 ${20 + cardEased * 25}px ${40 + cardEased * 45}px rgba(35, 24, 16, ${0.15 + cardEased * 0.22})`;

    // Subtle luxury depth of field on envelope background behind the card
    if (videoEnvelopeFrame) {
      const depthScale = 1 - cardEased * 0.04;
      const depthBlur = cardEased * 4;
      const depthDim = 1 - cardEased * 0.18;
      videoEnvelopeFrame.style.transform = `scale(${depthScale})`;
      videoEnvelopeFrame.style.filter = `blur(${depthBlur}px) brightness(${depthDim})`;
    }
  }

  // 3. Stage heading & prompt fades
  if (envelopeHeading) {
    const headFade = clamp(progress / 0.22);
    envelopeHeading.style.opacity = String(1 - headFade);
    envelopeHeading.style.transform = `translateY(${-22 * headFade}px)`;
  }

  if (stagePrompt) {
    stagePrompt.style.opacity = String(1 - clamp(progress / 0.18));
  }
}

function updateCelebrations() {
  if (!celebrationTrack) return;
  const progress = getTrackProgress(celebrationTrack);
  const active = progress * (celebrationCards.length - 1);
  
  celebrationCards.forEach((card, index) => {
    const distance = Math.abs(active - index);
    const opacity = clamp(1 - distance * 1.3);
    const translate = (index - active) * 64;
    card.style.opacity = String(opacity);
    card.style.transform = `translateY(${translate}px) scale(${0.94 + opacity * 0.06})`;
    card.style.pointerEvents = opacity > 0.9 ? 'auto' : 'none';
  });

  if (celebrationProgress) {
    celebrationProgress.style.transform = `scaleX(${0.08 + progress * 0.92})`;
  }
}

let ticking = false;
function onScroll() {
  if (ticking) return;
  requestAnimationFrame(() => {
    updateEnvelope();
    updateCelebrations();
    ticking = false;
  });
  ticking = true;
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });
onScroll();
