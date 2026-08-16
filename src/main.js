import { weddingConfig } from './config.js';

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

// Background ambient audio
const music = document.querySelector('#ambient-music');
if (music) {
  music.src = weddingConfig.music.src;
  music.loop = true;
  music.volume = 0.14;
  const startMusic = () => {
    music.play().catch(() => {});
    window.removeEventListener('scroll', startMusic);
    window.removeEventListener('click', startMusic);
  };
  window.addEventListener('scroll', startMusic, { once: true, passive: true });
  window.addEventListener('click', startMusic, { once: true, passive: true });
}

const envelopeTrack = document.querySelector('.envelope-track');
const videoEnvelopeFrame = document.querySelector('#video-envelope-frame');
const envelopeVideo = document.querySelector('#envelope-video');
const invitationLetter = document.querySelector('#invitation-letter');
const envelopeHeading = document.querySelector('#envelope-heading');
const stagePrompt = document.querySelector('#stage-prompt');
const celebrationTrack = document.querySelector('.celebration-track');
const celebrationCards = [...document.querySelectorAll('[data-celebration]')];
const celebrationProgress = document.querySelector('#celebration-progress');

// Ensure video is ready for seeking
if (envelopeVideo) {
  envelopeVideo.pause();
  envelopeVideo.currentTime = 0;
  // Load metadata to have accurate duration
  envelopeVideo.addEventListener('loadedmetadata', () => {
    onScroll();
  });
}

function getTrackProgress(track) {
  const rect = track.getBoundingClientRect();
  return clamp(-rect.top / Math.max(1, track.offsetHeight - window.innerHeight));
}

function updateEnvelope() {
  if (!envelopeTrack) return;
  const progress = getTrackProgress(envelopeTrack);

  // 1. Scrub Envelope Video (0% -> 48% progress opens the envelope completely)
  if (envelopeVideo && envelopeVideo.duration) {
    const videoProgress = clamp(progress / 0.48);
    const targetTime = videoProgress * (envelopeVideo.duration - 0.05);
    // Only update if difference is meaningful for silky smooth 60fps render
    if (Math.abs(envelopeVideo.currentTime - targetTime) > 0.02) {
      envelopeVideo.currentTime = targetTime;
    }
  }

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

    // Subtle luxury depth on video frame behind the card
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
// Trigger initial frame
onScroll();
