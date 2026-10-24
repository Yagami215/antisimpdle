/**
 * ANTISIMPDLE - Game Engine & Interaction Controller
 * LoLdle-Style Member Guessing Game with Category Comparison
 */

(function () {
  'use strict';

  // --- Sound FX Generator (Web Audio API) ---
  const SoundFX = {
    audioCtx: null,
    enabled: true,

    init() {
      const stored = localStorage.getItem('antisimpdle_sound');
      this.enabled = stored !== null ? stored === 'true' : true;
      this.updateUI();
    },

    getContext() {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.audioCtx = new AudioContext();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    },

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('antisimpdle_sound', this.enabled);
      this.updateUI();
      if (this.enabled) this.playTone(520, 'sine', 0.1);
    },

    updateUI() {
      const icon = document.getElementById('soundIcon');
      if (icon) {
        icon.textContent = this.enabled ? '🔊' : '🔇';
      }
    },

    playTone(freq, type = 'sine', duration = 0.12, volume = 0.08) {
      if (!this.enabled) return;
      try {
        const ctx = this.getContext();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch (e) {
        // Audio not allowed yet
      }
    },

    playGuessSuccess() {
      if (!this.enabled) return;
      this.playTone(440, 'triangle', 0.08, 0.06);
      setTimeout(() => this.playTone(660, 'triangle', 0.14, 0.08), 70);
    },

    playClueReveal() {
      if (!this.enabled) return;
      this.playTone(523.25, 'triangle', 0.09, 0.07); // C5
      setTimeout(() => this.playTone(659.25, 'triangle', 0.09, 0.07), 65); // E5
      setTimeout(() => this.playTone(783.99, 'triangle', 0.16, 0.09), 130); // G5
    },

    playSelect() {
      this.playTone(580, 'sine', 0.05, 0.04);
    },

    playError() {
      this.playTone(200, 'sawtooth', 0.18, 0.08);
    },

    playWin() {
      this.playEpicFanfare();
    },

    playEpicFanfare() {
      if (!this.enabled) return;
      try {
        const ctx = this.getContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        // 1. Sub-bass punch/impact drop
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(140, now);
        subOsc.frequency.exponentialRampToValueAtTime(36, now + 0.45);
        subGain.gain.setValueAtTime(0.35, now);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 0.5);

        // 2. Brass trumpet sequence (triumphant brass horns)
        const sequence = [
          { time: 0.00, freq: 261.63, dur: 0.14 }, // C4
          { time: 0.15, freq: 329.63, dur: 0.14 }, // E4
          { time: 0.30, freq: 392.00, dur: 0.14 }, // G4
          { time: 0.45, freq: 523.25, dur: 0.18 }, // C5
          { time: 0.65, freq: 392.00, dur: 0.12 }, // G4
          { time: 0.78, freq: 523.25, dur: 0.28 }  // C5
        ];

        sequence.forEach(item => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(item.freq, now + item.time);

          // Warm brass lowpass filter
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(item.freq * 3.5, now + item.time);

          gain.gain.setValueAtTime(0.12, now + item.time);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + item.time + item.dur);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + item.time);
          osc.stop(now + item.time + item.dur);
        });

        // 3. Grand Triumphant Major Chord (starts at 1.05s, sustains for 1.8s)
        const chordStartTime = now + 1.05;
        const chordDuration = 1.8;
        const chordNotes = [261.63, 523.25, 659.25, 783.99, 1046.50];

        chordNotes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = idx === 0 ? 'triangle' : 'sawtooth';
          osc.frequency.setValueAtTime(freq, chordStartTime);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(freq * 3.2, chordStartTime);

          const volume = idx === 0 ? 0.16 : 0.08;
          gain.gain.setValueAtTime(volume, chordStartTime);
          gain.gain.linearRampToValueAtTime(volume * 0.8, chordStartTime + 0.6);
          gain.gain.exponentialRampToValueAtTime(0.0001, chordStartTime + chordDuration);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(chordStartTime);
          osc.stop(chordStartTime + chordDuration);
        });

        // 4. Shimmering Stardust Chimes arpeggiating over the chord
        const chimeNotes = [1318.5, 1568.0, 2093.0, 2637.0, 3136.0];
        chimeNotes.forEach((f, idx) => {
          const cTime = chordStartTime + 0.15 + idx * 0.11;
          const cOsc = ctx.createOscillator();
          const cGain = ctx.createGain();

          cOsc.type = 'sine';
          cOsc.frequency.setValueAtTime(f, cTime);

          cGain.gain.setValueAtTime(0.06, cTime);
          cGain.gain.exponentialRampToValueAtTime(0.0001, cTime + 0.4);

          cOsc.connect(cGain);
          cGain.connect(ctx.destination);

          cOsc.start(cTime);
          cOsc.stop(cTime + 0.4);
        });

      } catch (e) {
        // Audio error or not permitted
      }
    },

    playNeedleTick() {
      if (!this.enabled) return;
      this.playTone(850, 'triangle', 0.03, 0.04);
    },

    playCaseUnlock() {
      if (!this.enabled) return;
      this.playTone(320, 'sine', 0.08, 0.06);
      setTimeout(() => this.playTone(480, 'triangle', 0.12, 0.07), 80);
    },

    playRarityReveal(rarity) {
      if (!this.enabled) return;
      if (rarity === 'hell') {
        this.playTone(110, 'sawtooth', 0.8, 0.18);
        setTimeout(() => this.playTone(85, 'sawtooth', 1.2, 0.22), 200);
      } else if (rarity === 'divine') {
        this.playTone(587.33, 'sine', 0.3, 0.1);
        setTimeout(() => this.playTone(880, 'triangle', 0.4, 0.12), 150);
        setTimeout(() => this.playTone(1174.66, 'sine', 0.6, 0.14), 300);
      } else if (rarity === 'rainbow') {
        this.playTone(523.25, 'triangle', 0.2, 0.1);
        setTimeout(() => this.playTone(659.25, 'sine', 0.25, 0.1), 100);
        setTimeout(() => this.playTone(783.99, 'triangle', 0.3, 0.12), 200);
        setTimeout(() => this.playTone(1046.50, 'sine', 0.45, 0.15), 320);
      } else if (rarity === 'album') {
        this.playTone(523.25, 'triangle', 0.2, 0.1);
        setTimeout(() => this.playTone(659.25, 'sine', 0.25, 0.1), 100);
        setTimeout(() => this.playTone(783.99, 'triangle', 0.3, 0.12), 200);
        setTimeout(() => this.playTone(1046.50, 'sine', 0.5, 0.15), 320);
      } else if (rarity === 'milestone') {
        this.playTone(659.25, 'triangle', 0.25, 0.1);
        setTimeout(() => this.playTone(830.61, 'sine', 0.35, 0.1), 100);
        setTimeout(() => this.playTone(987.77, 'triangle', 0.45, 0.12), 200);
        setTimeout(() => this.playTone(1318.51, 'sine', 0.6, 0.16), 320);
      } else if (rarity === 'secret') {
        this.playTone(493.88, 'sine', 0.25, 0.1);
        setTimeout(() => this.playTone(739.99, 'triangle', 0.35, 0.12), 140);
        setTimeout(() => this.playTone(987.77, 'sine', 0.45, 0.14), 280);
      } else if (rarity === 'mythic') {
        this.playTone(440, 'triangle', 0.2, 0.09);
        setTimeout(() => this.playTone(659.25, 'triangle', 0.25, 0.1), 120);
        setTimeout(() => this.playTone(880, 'sawtooth', 0.4, 0.12), 240);
      } else if (rarity === 'legendary') {
        this.playWin();
      } else if (rarity === 'epic') {
        this.playTone(440, 'triangle', 0.12, 0.08);
        setTimeout(() => this.playTone(554.37, 'triangle', 0.14, 0.08), 80);
        setTimeout(() => this.playTone(659.25, 'triangle', 0.22, 0.1), 160);
      } else if (rarity === 'verity') {
        this.playTone(392.00, 'triangle', 0.15, 0.09);
        setTimeout(() => this.playTone(493.88, 'triangle', 0.2, 0.09), 100);
        setTimeout(() => this.playTone(587.33, 'triangle', 0.28, 0.11), 200);
      } else {
        this.playGuessSuccess();
      }
    }
  };

  // --- Particle & Firework Celebration Engine ---
  const VictoryCelebration = {
    canvas: null,
    ctx: null,
    particles: [],
    fireworks: [],
    animId: null,
    spawnerTimer: null,
    isActive: false,

    init() {
      this.canvas = document.getElementById('victoryCanvas');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize());
    },

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    start() {
      if (!this.canvas) this.init();
      if (!this.canvas || !this.ctx) return;
      this.resize();
      this.stop(); // Clear any existing run
      this.isActive = true;
      this.particles = [];
      this.fireworks = [];

      // Launch initial dual firework salvos from bottom left and right
      this.launchSalvo();

      // Spawn rich falling confetti shower
      this.spawnConfettiBatch(80);

      // Schedule additional bursts over 10 seconds
      let burstCount = 0;
      this.spawnerTimer = setInterval(() => {
        if (!this.isActive) return;
        burstCount++;
        if (burstCount <= 7) {
          this.launchSalvo();
          this.spawnConfettiBatch(30);
        } else {
          clearInterval(this.spawnerTimer);
          this.spawnerTimer = null;
        }
      }, 1300);

      this.loop();
    },

    stop() {
      this.isActive = false;
      if (this.spawnerTimer) {
        clearInterval(this.spawnerTimer);
        this.spawnerTimer = null;
      }
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
      this.particles = [];
      this.fireworks = [];
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    },

    launchSalvo() {
      if (!this.canvas) return;
      const w = this.canvas.width;
      const h = this.canvas.height;
      // Launch 2 rockets from left and right towards upper center
      this.fireworks.push({
        x: w * 0.15 + (Math.random() - 0.5) * 80,
        y: h + 10,
        targetX: w * (0.28 + Math.random() * 0.22),
        targetY: h * (0.16 + Math.random() * 0.22),
        speed: 13 + Math.random() * 4,
        color: Math.random() > 0.5 ? '#ffd700' : '#ff1744',
        trail: []
      });
      this.fireworks.push({
        x: w * 0.85 + (Math.random() - 0.5) * 80,
        y: h + 10,
        targetX: w * (0.50 + Math.random() * 0.22),
        targetY: h * (0.16 + Math.random() * 0.22),
        speed: 13 + Math.random() * 4,
        color: Math.random() > 0.5 ? '#00e676' : '#ffd700',
        trail: []
      });
    },

    createExplosion(x, y, baseColor) {
      const sparkCount = 80;
      const colors = [
        '#ffd700', '#ffb700', '#fff3a8', // Gold
        '#ff1744', '#ff5252', '#ff80ab', // Crimson
        '#00e676', '#69f0ae',             // Emerald
        '#00e5ff', '#ffffff'              // Cyber cyan & Diamond
      ];
      for (let i = 0; i < sparkCount; i++) {
        const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.4;
        const speed = 2.5 + Math.random() * 7.5;
        const isStar = Math.random() < 0.25;
        this.particles.push({
          type: isStar ? 'star' : 'spark',
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          decay: 0.012 + Math.random() * 0.016,
          gravity: 0.12,
          friction: 0.965,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: isStar ? (4 + Math.random() * 4) : (2 + Math.random() * 2.5),
          rot: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 0.15
        });
      }
    },

    spawnConfettiBatch(count) {
      if (!this.canvas) return;
      const w = this.canvas.width;
      const palette = ['#ffd700', '#ffb700', '#ff1744', '#ff5252', '#00e676', '#ffffff', '#00e5ff', '#e040fb'];
      for (let i = 0; i < count; i++) {
        this.particles.push({
          type: 'confetti',
          x: Math.random() * w,
          y: -20 - Math.random() * 80,
          vx: (Math.random() - 0.5) * 4,
          vy: 2.5 + Math.random() * 4.5,
          gravity: 0.08,
          friction: 0.99,
          sizeW: 7 + Math.random() * 6,
          sizeH: 10 + Math.random() * 10,
          color: palette[Math.floor(Math.random() * palette.length)],
          rotX: Math.random() * Math.PI,
          rotY: Math.random() * Math.PI,
          vRotX: 0.04 + Math.random() * 0.08,
          vRotY: 0.03 + Math.random() * 0.06,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.05 + Math.random() * 0.05,
          alpha: 1,
          decay: 0.003 + Math.random() * 0.003
        });
      }
    },

    loop() {
      if (!this.isActive && this.particles.length === 0 && this.fireworks.length === 0) {
        if (this.ctx && this.canvas) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        return;
      }

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Update & draw fireworks
      for (let i = this.fireworks.length - 1; i >= 0; i--) {
        const fw = this.fireworks[i];
        const dx = fw.targetX - fw.x;
        const dy = fw.targetY - fw.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < fw.speed || dy >= 0) {
          this.createExplosion(fw.x, fw.y, fw.color);
          this.fireworks.splice(i, 1);
          continue;
        }

        const angle = Math.atan2(dy, dx);
        fw.x += Math.cos(angle) * fw.speed;
        fw.y += Math.sin(angle) * fw.speed;

        // Trail
        fw.trail.push({ x: fw.x, y: fw.y, alpha: 1 });
        if (fw.trail.length > 7) fw.trail.shift();

        // Draw rocket trail
        this.ctx.save();
        for (let t = 0; t < fw.trail.length; t++) {
          const pt = fw.trail[t];
          this.ctx.fillStyle = fw.color;
          this.ctx.globalAlpha = (t / fw.trail.length) * 0.8;
          this.ctx.beginPath();
          this.ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.ctx.restore();
      }

      // Update & draw particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];

        if (p.type === 'confetti') {
          p.wobble += p.wobbleSpeed;
          p.x += Math.sin(p.wobble) * 1.8 + p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.vx *= p.friction;
          p.rotX += p.vRotX;
          p.rotY += p.vRotY;
          p.alpha -= p.decay;

          if (p.alpha <= 0 || p.y > this.canvas.height + 40) {
            this.particles.splice(i, 1);
            continue;
          }

          this.ctx.save();
          this.ctx.translate(p.x, p.y);
          this.ctx.scale(Math.cos(p.rotX), Math.sin(p.rotY));
          this.ctx.fillStyle = p.color;
          this.ctx.globalAlpha = Math.max(0, p.alpha);
          this.ctx.fillRect(-p.sizeW / 2, -p.sizeH / 2, p.sizeW, p.sizeH);
          this.ctx.restore();

        } else if (p.type === 'star') {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.vx *= p.friction;
          p.rot += p.vRot;
          p.alpha -= p.decay;

          if (p.alpha <= 0 || p.y > this.canvas.height + 20) {
            this.particles.splice(i, 1);
            continue;
          }

          this.ctx.save();
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate(p.rot);
          this.ctx.fillStyle = p.color;
          this.ctx.globalAlpha = Math.max(0, p.alpha);
          this.drawStar(0, 0, 4, p.size, p.size / 2.5);
          this.ctx.fill();
          this.ctx.restore();

        } else { // spark
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.vx *= p.friction;
          p.alpha -= p.decay;

          if (p.alpha <= 0 || p.y > this.canvas.height + 20) {
            this.particles.splice(i, 1);
            continue;
          }

          this.ctx.save();
          this.ctx.fillStyle = p.color;
          this.ctx.globalAlpha = Math.max(0, p.alpha);
          this.ctx.shadowBlur = 6;
          this.ctx.shadowColor = p.color;
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.restore();
        }
      }

      this.animId = requestAnimationFrame(() => this.loop());
    },

    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
      let rot = Math.PI / 2 * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      this.ctx.beginPath();
      this.ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        this.ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        this.ctx.lineTo(x, y);
        rot += step;
      }
      this.ctx.lineTo(cx, cy - outerRadius);
      this.ctx.closePath();
    }
  };

  // --- Daily Configuration (Wordle-Style Midnight Reset) ---
  const DAILY_CONFIG = {
    // Launch Date: October 22, 2026. Day 1 starts here.
    epochYear: 2026,
    epochMonth: 9, // October (0-indexed)
    epochDay: 22,
    baseSeed: 133742
  };

  // Deterministic Mulberry32 32-bit PRNG
  function mulberry32(seed) {
    return function() {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Deterministic shuffle of indices [0, 1, ..., N-1]
  function getDeterministicPermutation(total, seed) {
    const arr = Array.from({ length: total }, (_, i) => i);
    const rng = mulberry32(seed);
    for (let i = total - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  }

  // Local calendar date and midnight calculation
  function getLocalDayInfo() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();

    const todayMidnight = new Date(y, m, d, 0, 0, 0, 0);
    const nextMidnight = new Date(y, m, d + 1, 0, 0, 0, 0);
    const epochMidnight = new Date(DAILY_CONFIG.epochYear, DAILY_CONFIG.epochMonth, DAILY_CONFIG.epochDay, 0, 0, 0, 0);

    const daysSinceEpoch = Math.max(0, Math.floor((todayMidnight.getTime() - epochMidnight.getTime()) / 86400000));
    const gameNumber = daysSinceEpoch + 1;
    const dateKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    const diffMs = Math.max(0, nextMidnight.getTime() - now.getTime());
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);

    return {
      now,
      dateKey,
      gameNumber,
      dayIndex: daysSinceEpoch,
      diffMs,
      countdownStr: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    };
  }

  // Deterministically selects today's member from members list
  function getDailyMember(dayIndex, members) {
    if (!members || members.length === 0) return null;
    const sorted = [...members].sort((a, b) => a.id.localeCompare(b.id));
    const N = sorted.length;
    const cycle = Math.floor(dayIndex / N);
    const cycleSeed = DAILY_CONFIG.baseSeed + cycle * 7919;
    const perm = getDeterministicPermutation(N, cycleSeed);
    const memberIndex = perm[dayIndex % N];
    return sorted[memberIndex];
  }

  // --- Statistics Persistence (Wordle Stats & Streaks) ---
  const StatsManager = {
    KEY: 'antisimpdle_stats',

    get() {
      try {
        const raw = localStorage.getItem(this.KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.played === 'number') {
            return parsed;
          }
        }
      } catch (e) {}
      return {
        played: 0,
        won: 0,
        currentStreak: 0,
        maxStreak: 0,
        lastWonDateKey: null,
        distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7+': 0 }
      };
    },

    recordWin(guessCount, dateKey) {
      const stats = this.get();
      if (stats.lastWonDateKey === dateKey) return stats;

      stats.played += 1;
      stats.won += 1;

      // Check if last win was yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      if (stats.lastWonDateKey === yKey) {
        stats.currentStreak += 1;
      } else {
        stats.currentStreak = 1;
      }

      stats.lastWonDateKey = dateKey;
      if (stats.currentStreak > stats.maxStreak) {
        stats.maxStreak = stats.currentStreak;
      }

      const bucket = guessCount >= 7 ? '7+' : String(guessCount);
      stats.distribution[bucket] = (stats.distribution[bucket] || 0) + 1;

      try {
        localStorage.setItem(this.KEY, JSON.stringify(stats));
      } catch (e) {}

      return stats;
    }
  };

  // --- Quote Statistics Persistence ---
  const QuoteStatsManager = {
    KEY: 'antisimpdle_quote_stats',

    get() {
      try {
        const raw = localStorage.getItem(this.KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.played === 'number') {
            return parsed;
          }
        }
      } catch (e) {}
      return {
        played: 0,
        won: 0,
        currentStreak: 0,
        maxStreak: 0,
        lastWonDateKey: null,
        distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7+': 0 }
      };
    },

    recordWin(guessCount, dateKey) {
      const stats = this.get();
      if (stats.lastWonDateKey === dateKey) return stats;

      stats.played += 1;
      stats.won += 1;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      if (stats.lastWonDateKey === yKey) {
        stats.currentStreak += 1;
      } else {
        stats.currentStreak = 1;
      }

      stats.lastWonDateKey = dateKey;
      if (stats.currentStreak > stats.maxStreak) {
        stats.maxStreak = stats.currentStreak;
      }

      const bucket = guessCount >= 7 ? '7+' : String(guessCount);
      stats.distribution[bucket] = (stats.distribution[bucket] || 0) + 1;

      try {
        localStorage.setItem(this.KEY, JSON.stringify(stats));
      } catch (e) {}

      return stats;
    }
  };

  // --- Daily Save Persistence ---
  const DailyStateManager = {
    KEY: 'antisimpdle_daily_save',

    load(currentDateKey) {
      try {
        const raw = localStorage.getItem(this.KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.dateKey === currentDateKey) {
            return parsed;
          }
        }
      } catch (e) {}
      return null;
    },

    save(dateKey, gameNumber, targetMember, guessesHistory, isWon) {
      try {
        const data = {
          dateKey,
          gameNumber,
          targetId: targetMember ? targetMember.id : null,
          guesses: guessesHistory,
          isWon: !!isWon
        };
        localStorage.setItem(this.KEY, JSON.stringify(data));
      } catch (e) {}
    },

    clear() {
      try {
        localStorage.removeItem(this.KEY);
      } catch (e) {}
    }
  };

  // --- Quote Daily Save Persistence ---
  const QuoteDailyStateManager = {
    KEY: 'antisimpdle_quote_daily_save',

    load(currentDateKey) {
      try {
        const raw = localStorage.getItem(this.KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.dateKey === currentDateKey) {
            return parsed;
          }
        }
      } catch (e) {}
      return null;
    },

    save(dateKey, gameNumber, quoteId, guesses, foundMemberIds, isWon, revealedClues) {
      try {
        const data = {
          dateKey,
          gameNumber,
          quoteId,
          guesses,
          foundMemberIds: Array.from(foundMemberIds || []),
          isWon: !!isWon,
          revealedClues: Array.from(revealedClues || [])
        };
        localStorage.setItem(this.KEY, JSON.stringify(data));
      } catch (e) {}
    },

    clear() {
      try {
        localStorage.removeItem(this.KEY);
      } catch (e) {}
    }
  };

  // Deterministically selects today's quote from quotes list
  function getDailyQuote(dayIndex, quotes) {
    if (!quotes || quotes.length === 0) return null;
    const N = quotes.length;
    const cycle = Math.floor(dayIndex / N);
    const cycleSeed = 67891 + cycle * 4397;
    const perm = getDeterministicPermutation(N, cycleSeed);
    const quoteIndex = perm[dayIndex % N];
    return quotes[quoteIndex];
  }

  // --- Emoji Statistics Persistence ---
  const EmojiStatsManager = {
    KEY: 'antisimpdle_emoji_stats',

    get() {
      try {
        const raw = localStorage.getItem(this.KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.played === 'number') {
            return parsed;
          }
        }
      } catch (e) {}
      return {
        played: 0,
        won: 0,
        currentStreak: 0,
        maxStreak: 0,
        lastWonDateKey: null,
        distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7+': 0 }
      };
    },

    recordWin(guessCount, dateKey) {
      const stats = this.get();
      if (stats.lastWonDateKey === dateKey) return stats;

      stats.played += 1;
      stats.won += 1;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      if (stats.lastWonDateKey === yKey) {
        stats.currentStreak += 1;
      } else {
        stats.currentStreak = 1;
      }

      stats.lastWonDateKey = dateKey;
      if (stats.currentStreak > stats.maxStreak) {
        stats.maxStreak = stats.currentStreak;
      }

      const bucket = guessCount >= 7 ? '7+' : String(guessCount);
      stats.distribution[bucket] = (stats.distribution[bucket] || 0) + 1;

      try {
        localStorage.setItem(this.KEY, JSON.stringify(stats));
      } catch (e) {}

      return stats;
    }
  };

  // --- Emoji Daily Save Persistence ---
  const EmojiDailyStateManager = {
    KEY: 'antisimpdle_emoji_daily_save',

    load(currentDateKey) {
      try {
        const raw = localStorage.getItem(this.KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.dateKey === currentDateKey) {
            return parsed;
          }
        }
      } catch (e) {}
      return null;
    },

    save(dateKey, gameNumber, emojiId, guesses, isWon, revealedClues) {
      try {
        const data = {
          dateKey,
          gameNumber,
          emojiId,
          guesses,
          isWon: !!isWon,
          revealedClues: Array.from(revealedClues || [])
        };
        localStorage.setItem(this.KEY, JSON.stringify(data));
      } catch (e) {}
    },

    clear() {
      try {
        localStorage.removeItem(this.KEY);
      } catch (e) {}
    }
  };

  // --- Picture Statistics Persistence ---
  const PictureStatsManager = {
    KEY: 'antisimpdle_picture_stats',

    get() {
      try {
        const raw = localStorage.getItem(this.KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.played === 'number') {
            return parsed;
          }
        }
      } catch (e) {}
      return {
        played: 0,
        won: 0,
        currentStreak: 0,
        maxStreak: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, '7+': 0 },
        lastWonDateKey: null
      };
    },

    save(stats) {
      try {
        localStorage.setItem(this.KEY, JSON.stringify(stats));
      } catch (e) {}
    },

    recordWin(guessCount, dateKey) {
      const stats = this.get();
      if (stats.lastWonDateKey === dateKey) return stats;

      stats.played += 1;
      stats.won += 1;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      if (stats.lastWonDateKey === yKey) {
        stats.currentStreak += 1;
      } else {
        stats.currentStreak = 1;
      }

      stats.lastWonDateKey = dateKey;
      if (stats.currentStreak > stats.maxStreak) {
        stats.maxStreak = stats.currentStreak;
      }

      const bucket = guessCount >= 7 ? '7+' : String(guessCount);
      stats.distribution[bucket] = (stats.distribution[bucket] || 0) + 1;

      try {
        localStorage.setItem(this.KEY, JSON.stringify(stats));
      } catch (e) {}

      return stats;
    }
  };

  // --- Picture Daily Save Persistence ---
  const PictureDailyStateManager = {
    KEY: 'antisimpdle_picture_daily_save',

    load(currentDateKey) {
      try {
        const raw = localStorage.getItem(this.KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.dateKey === currentDateKey) {
            return parsed;
          }
        }
      } catch (e) {}
      return null;
    },

    save(dateKey, gameNumber, pictureId, guesses, foundMemberIds, isWon) {
      try {
        const data = {
          dateKey,
          gameNumber,
          pictureId,
          guesses,
          foundMemberIds: Array.from(foundMemberIds || []),
          isWon: !!isWon
        };
        localStorage.setItem(this.KEY, JSON.stringify(data));
      } catch (e) {}
    },

    clear() {
      try {
        localStorage.removeItem(this.KEY);
      } catch (e) {}
    }
  };

  // Deterministically selects today's emoji puzzle from emojis list
  function getDailyEmoji(dayIndex, emojis) {
    if (!emojis || emojis.length === 0) return null;
    const N = emojis.length;
    const cycle = Math.floor(dayIndex / N);
    const cycleSeed = 83921 + cycle * 5147;
    const perm = getDeterministicPermutation(N, cycleSeed);
    const emojiIndex = perm[dayIndex % N];
    return emojis[emojiIndex];
  }

  // Deterministically selects today's picture puzzle from pictures list
  function getDailyPicture(dayIndex, pictures) {
    if (!pictures || pictures.length === 0) return null;
    const N = pictures.length;
    const cycle = Math.floor(dayIndex / N);
    const cycleSeed = 67291 + cycle * 4129;
    const perm = getDeterministicPermutation(N, cycleSeed);
    const picIndex = perm[dayIndex % N];
    return pictures[picIndex];
  }

  // Deterministic focus point near vertical center, not too much to the edges
  function getDailyPictureFocusPoint(dayIndex, pictureId) {
    const seed = (dayIndex * 9301 + pictureId * 49297 + 233280) % 1000;
    const fx = 32 + (seed % 37); // 32% to 68%
    const fy = 38 + (Math.floor(seed / 37) % 23); // 38% to 60%
    return { fx, fy };
  }

  function getRandomPictureFocusPoint() {
    const fx = 32 + Math.floor(Math.random() * 37); // 32% to 68%
    const fy = 38 + Math.floor(Math.random() * 23); // 38% to 60%
    return { fx, fy };
  }

  // --- Game State ---
  const state = {
    members: [],
    targetMember: null,
    dailyTargetMember: null,
    practiceTargetMember: null,
    gameMode: 'daily', // 'daily' | 'practice'
    currentDateKey: '',
    gameNumber: 1,
    dayIndex: 0,
    isWon: false,
    guessedIds: new Set(),
    guessesHistory: [],
    practiceHistory: [],
    practiceGuessedIds: new Set(),
    practiceSolvedIds: new Set(),
    practiceIsWon: false,
    selectedDropdownIndex: -1,
    currentMatches: [],
    activeView: 'home', // 'home' | 'classic' | 'quote' | 'emoji' | 'picture'

    // Quote Mode state
    quotes: [],
    quoteTarget: null,
    quoteDailyTarget: null,
    quotePracticeTarget: null,
    quoteGameMode: 'daily', // 'daily' | 'practice'
    quoteDailyGuesses: [],
    quoteDailyGuessedIds: new Set(),
    quoteDailyFoundMemberIds: new Set(),
    quoteDailyIsWon: false,
    quotePracticeGuesses: [],
    quotePracticeGuessedIds: new Set(),
    quotePracticeFoundMemberIds: new Set(),
    quotePracticeSolvedIds: new Set(),
    quotePracticeIsWon: false,
    quoteDailyRevealedClues: new Set(),
    quotePracticeRevealedClues: new Set(),
    quoteCurrentMatches: [],
    quoteSelectedDropdownIndex: -1,

    // Emoji Mode state
    emojis: [],
    emojiTarget: null,
    emojiDailyTarget: null,
    emojiPracticeTarget: null,
    emojiGameMode: 'daily', // 'daily' | 'practice'
    emojiDailyGuesses: [],
    emojiDailyGuessedIds: new Set(),
    emojiDailyIsWon: false,
    emojiPracticeGuesses: [],
    emojiPracticeGuessedIds: new Set(),
    emojiPracticeSolvedIds: new Set(),
    emojiPracticeIsWon: false,
    emojiDailyRevealedClues: new Set(),
    emojiPracticeRevealedClues: new Set(),
    emojiCurrentMatches: [],
    emojiSelectedDropdownIndex: -1,

    // Picture Mode state
    pictures: [],
    pictureTarget: null,
    pictureDailyTarget: null,
    picturePracticeTarget: null,
    pictureGameMode: 'daily', // 'daily' | 'practice'
    pictureDailyGuesses: [],
    pictureDailyGuessedIds: new Set(),
    pictureDailyFoundMemberIds: new Set(),
    pictureDailyIsWon: false,
    picturePracticeGuesses: [],
    picturePracticeGuessedIds: new Set(),
    picturePracticeFoundMemberIds: new Set(),
    picturePracticeSolvedIds: new Set(),
    picturePracticeIsWon: false,
    pictureDailyFocusPoint: { fx: 50, fy: 50 },
    picturePracticeFocusPoint: { fx: 50, fy: 50 },
    pictureCurrentMatches: [],
    pictureSelectedDropdownIndex: -1,

    lastVictoryMode: 'classic', // 'classic' | 'quote' | 'emoji' | 'picture'
    statsActiveTab: 'classic', // 'classic' | 'quote' | 'emoji' | 'picture'

    // Case Opening State
    caseIsSpinning: false,
    caseActiveFilter: 'all',
    oddsDisplayMode: 'normal',
    collectionActiveTab: 'all',
    activeAlbumId: null
  };

  // --- Active Mode Helpers (Scoping Guesses to Daily vs Practice) ---
  function getActiveGuessedIds() {
    return state.gameMode === 'daily' ? state.guessedIds : state.practiceGuessedIds;
  }

  function getActiveHistory() {
    return state.gameMode === 'daily' ? state.guessesHistory : state.practiceHistory;
  }

  function getActiveQuoteGuessedIds() {
    return state.quoteGameMode === 'daily' ? state.quoteDailyGuessedIds : state.quotePracticeGuessedIds;
  }

  function getActiveQuoteHistory() {
    return state.quoteGameMode === 'daily' ? state.quoteDailyGuesses : state.quotePracticeGuesses;
  }

  function getActiveQuoteFoundIds() {
    return state.quoteGameMode === 'daily' ? state.quoteDailyFoundMemberIds : state.quotePracticeFoundMemberIds;
  }

  function getActiveQuoteRevealedClues() {
    return state.quoteGameMode === 'daily' ? state.quoteDailyRevealedClues : state.quotePracticeRevealedClues;
  }

  function getActiveEmojiGuessedIds() {
    return state.emojiGameMode === 'daily' ? state.emojiDailyGuessedIds : state.emojiPracticeGuessedIds;
  }

  function getActiveEmojiHistory() {
    return state.emojiGameMode === 'daily' ? state.emojiDailyGuesses : state.emojiPracticeGuesses;
  }

  function getActiveEmojiRevealedClues() {
    return state.emojiGameMode === 'daily' ? state.emojiDailyRevealedClues : state.emojiPracticeRevealedClues;
  }

  function getActivePictureGuessedIds() {
    return state.pictureGameMode === 'daily' ? state.pictureDailyGuessedIds : state.picturePracticeGuessedIds;
  }

  function getActivePictureHistory() {
    return state.pictureGameMode === 'daily' ? state.pictureDailyGuesses : state.picturePracticeGuesses;
  }

  function getActivePictureFoundMemberIds() {
    return state.pictureGameMode === 'daily' ? state.pictureDailyFoundMemberIds : state.picturePracticeFoundMemberIds;
  }

  // --- Member Image Helper ---
  function getMemberImage(member) {
    if (!member) return '';
    if (member.image) return member.image;
    if (member.folder) return `${member.folder}/avatar.png`;
    return '';
  }

  // --- DOM Elements ---
  const DOM = {
    homeView: document.getElementById('homeView'),
    classicView: document.getElementById('classicView'),
    playClassicCard: document.getElementById('playClassicCard'),
    classicCardBadge: document.getElementById('classicCardBadge'),
    homeDailyNum: document.getElementById('homeDailyNum'),
    homeCountdown: document.getElementById('homeCountdown'),
    backToHomeBtn: document.getElementById('backToHomeBtn'),
    homeLogoBtn: document.getElementById('homeLogoBtn'),
    browseRosterBtn: document.getElementById('browseRosterBtn'),
    updateLogBtn: document.getElementById('updateLogBtn'),
    homeUpdateChipBtn: document.getElementById('homeUpdateChipBtn'),
    updateLogModal: document.getElementById('updateLogModal'),
    closeUpdateLogModalBtn: document.getElementById('closeUpdateLogModalBtn'),
    updateLogDoneBtn: document.getElementById('updateLogDoneBtn'),

    // Quote Mode Elements
    playQuoteCard: document.getElementById('playQuoteCard'),
    quoteCardBadge: document.getElementById('quoteCardBadge'),
    quoteView: document.getElementById('quoteView'),
    quoteHeaderTitle: document.getElementById('quoteHeaderTitle'),
    quoteDailyBadge: document.getElementById('quoteDailyBadge'),
    quoteDailyNum: document.getElementById('quoteDailyNum'),
    quoteHeaderHint: document.getElementById('quoteHeaderHint'),
    quoteCountdownWrap: document.getElementById('quoteCountdownWrap'),
    quoteCountdown: document.getElementById('quoteCountdown'),
    quotePracticeToggleBtn: document.getElementById('quotePracticeToggleBtn'),
    quotePracticeToggleIcon: document.getElementById('quotePracticeToggleIcon'),
    quotePracticeToggleText: document.getElementById('quotePracticeToggleText'),
    backToHomeFromQuoteBtn: document.getElementById('backToHomeFromQuoteBtn'),

    alreadySolvedQuoteBanner: document.getElementById('alreadySolvedQuoteBanner'),
    quotePracticeSolvedBanner: document.getElementById('quotePracticeSolvedBanner'),
    solvedQuoteCountdownClock: document.getElementById('solvedQuoteCountdownClock'),
    viewSolvedQuoteSummaryBtn: document.getElementById('viewSolvedQuoteSummaryBtn'),
    switchQuotePracticeBtn: document.getElementById('switchQuotePracticeBtn'),
    nextQuotePracticeBtn: document.getElementById('nextQuotePracticeBtn'),

    quoteTypePill: document.getElementById('quoteTypePill'),
    quoteTypeIcon: document.getElementById('quoteTypeIcon'),
    quoteTypeLabel: document.getElementById('quoteTypeLabel'),
    convSpeakersTracker: document.getElementById('convSpeakersTracker'),
    trackerProgress: document.getElementById('trackerProgress'),
    trackerChips: document.getElementById('trackerChips'),
    quoteContentArea: document.getElementById('quoteContentArea'),
    quoteAuthorReveal: document.getElementById('quoteAuthorReveal'),
    quoteCluesContainer: document.getElementById('quoteCluesContainer'),
    quoteCluesCounter: document.getElementById('quoteCluesCounter'),
    quoteClue1: document.getElementById('quoteClue1'),
    quoteClue2: document.getElementById('quoteClue2'),
    quoteClue3: document.getElementById('quoteClue3'),

    quoteMemberInput: document.getElementById('quoteMemberInput'),
    quoteClearInputBtn: document.getElementById('quoteClearInputBtn'),
    quoteAutocompleteDropdown: document.getElementById('quoteAutocompleteDropdown'),
    quoteGuessBtn: document.getElementById('quoteGuessBtn'),
    quoteGuessCountBadge: document.getElementById('quoteGuessCountBadge'),
    quoteGuessesList: document.getElementById('quoteGuessesList'),
    quoteEmptyGuessesState: document.getElementById('quoteEmptyGuessesState'),
    victoryMultiMembers: document.getElementById('victoryMultiMembers'),
    victoryQuoteBox: document.getElementById('victoryQuoteBox'),
    victoryMemberCard: document.getElementById('victoryMemberCard'),
    victoryAccuracyBadge: document.getElementById('victoryAccuracyBadge'),
    statsTabClassic: document.getElementById('statsTabClassic'),
    statsTabQuote: document.getElementById('statsTabQuote'),
    statsTabEmoji: document.getElementById('statsTabEmoji'),

    // Emoji Mode Elements
    playEmojiCard: document.getElementById('playEmojiCard'),
    emojiCardBadge: document.getElementById('emojiCardBadge'),
    emojiView: document.getElementById('emojiView'),
    emojiHeaderTitle: document.getElementById('emojiHeaderTitle'),
    emojiDailyBadge: document.getElementById('emojiDailyBadge'),
    emojiDailyNum: document.getElementById('emojiDailyNum'),
    emojiHeaderHint: document.getElementById('emojiHeaderHint'),
    emojiCountdownWrap: document.getElementById('emojiCountdownWrap'),
    emojiCountdown: document.getElementById('emojiCountdown'),
    emojiPracticeToggleBtn: document.getElementById('emojiPracticeToggleBtn'),
    emojiPracticeToggleIcon: document.getElementById('emojiPracticeToggleIcon'),
    emojiPracticeToggleText: document.getElementById('emojiPracticeToggleText'),
    backToHomeFromEmojiBtn: document.getElementById('backToHomeFromEmojiBtn'),

    alreadySolvedEmojiBanner: document.getElementById('alreadySolvedEmojiBanner'),
    emojiPracticeSolvedBanner: document.getElementById('emojiPracticeSolvedBanner'),
    solvedEmojiCountdownClock: document.getElementById('solvedEmojiCountdownClock'),
    viewSolvedEmojiSummaryBtn: document.getElementById('viewSolvedEmojiSummaryBtn'),
    switchEmojiPracticeBtn: document.getElementById('switchEmojiPracticeBtn'),
    nextEmojiPracticeBtn: document.getElementById('nextEmojiPracticeBtn'),

    emojiRevealProgress: document.getElementById('emojiRevealProgress'),
    emojiTokensContainer: document.getElementById('emojiTokensContainer'),
    emojiAuthorReveal: document.getElementById('emojiAuthorReveal'),
    emojiCluesContainer: document.getElementById('emojiCluesContainer'),
    emojiCluesCounter: document.getElementById('emojiCluesCounter'),
    emojiClue1: document.getElementById('emojiClue1'),
    emojiClue2: document.getElementById('emojiClue2'),
    emojiClue3: document.getElementById('emojiClue3'),

    emojiMemberInput: document.getElementById('emojiMemberInput'),
    emojiClearInputBtn: document.getElementById('emojiClearInputBtn'),
    emojiAutocompleteDropdown: document.getElementById('emojiAutocompleteDropdown'),
    emojiGuessBtn: document.getElementById('emojiGuessBtn'),
    emojiGuessCountBadge: document.getElementById('emojiGuessCountBadge'),
    emojiGuessesList: document.getElementById('emojiGuessesList'),
    emojiEmptyGuessesState: document.getElementById('emojiEmptyGuessesState'),
    victoryEmojiBox: document.getElementById('victoryEmojiBox'),

    // Picture Mode Elements
    playPictureCard: document.getElementById('playPictureCard'),
    pictureCardBadge: document.getElementById('pictureCardBadge'),
    pictureView: document.getElementById('pictureView'),
    pictureHeaderTitle: document.getElementById('pictureHeaderTitle'),
    pictureDailyBadge: document.getElementById('pictureDailyBadge'),
    pictureDailyNum: document.getElementById('pictureDailyNum'),
    pictureHeaderHint: document.getElementById('pictureHeaderHint'),
    pictureCountdownWrap: document.getElementById('pictureCountdownWrap'),
    pictureCountdown: document.getElementById('pictureCountdown'),
    picturePracticeToggleBtn: document.getElementById('picturePracticeToggleBtn'),
    picturePracticeToggleIcon: document.getElementById('picturePracticeToggleIcon'),
    picturePracticeToggleText: document.getElementById('picturePracticeToggleText'),
    backToHomeFromPictureBtn: document.getElementById('backToHomeFromPictureBtn'),

    alreadySolvedPictureBanner: document.getElementById('alreadySolvedPictureBanner'),
    picturePracticeSolvedBanner: document.getElementById('picturePracticeSolvedBanner'),
    solvedPictureCountdownClock: document.getElementById('solvedPictureCountdownClock'),
    viewSolvedPictureSummaryBtn: document.getElementById('viewSolvedPictureSummaryBtn'),
    switchPicturePracticeBtn: document.getElementById('switchPicturePracticeBtn'),
    nextPicturePracticeBtn: document.getElementById('nextPicturePracticeBtn'),

    pictureMembersTracker: document.getElementById('pictureMembersTracker'),
    pictureTrackerCount: document.getElementById('pictureTrackerCount'),
    pictureTrackerChips: document.getElementById('pictureTrackerChips'),
    pictureViewport: document.getElementById('pictureViewport'),
    pictureImg: document.getElementById('pictureImg'),
    pictureZoomBadge: document.getElementById('pictureZoomBadge'),
    pictureZoomBar: document.getElementById('pictureZoomBar'),
    pictureAuthorReveal: document.getElementById('pictureAuthorReveal'),

    pictureMemberInput: document.getElementById('pictureMemberInput'),
    pictureClearInputBtn: document.getElementById('pictureClearInputBtn'),
    pictureAutocompleteDropdown: document.getElementById('pictureAutocompleteDropdown'),
    pictureGuessBtn: document.getElementById('pictureGuessBtn'),
    pictureGuessCountBadge: document.getElementById('pictureGuessCountBadge'),
    pictureGuessesList: document.getElementById('pictureGuessesList'),
    pictureEmptyGuessesState: document.getElementById('pictureEmptyGuessesState'),
    victoryPictureBox: document.getElementById('victoryPictureBox'),
    statsTabPicture: document.getElementById('statsTabPicture'),

    // Cases Mode Elements
    playCasesCard: document.getElementById('playCasesCard'),
    casesCardBadge: document.getElementById('casesCardBadge'),
    casesView: document.getElementById('casesView'),
    casesHeaderHint: document.getElementById('casesHeaderHint'),
    casesTabOpenBtn: document.getElementById('casesTabOpenBtn'),
    casesTabCollectionBtn: document.getElementById('casesTabCollectionBtn'),
    backToHomeFromCasesBtn: document.getElementById('backToHomeFromCasesBtn'),
    casesNavUnlockedCount: document.getElementById('casesNavUnlockedCount'),
    casesUnboxPanel: document.getElementById('casesUnboxPanel'),
    casesCollectionPanel: document.getElementById('casesCollectionPanel'),
    casesRouletteViewport: document.getElementById('casesRouletteViewport'),
    casesRouletteTrack: document.getElementById('casesRouletteTrack'),
    openCaseBtn: document.getElementById('openCaseBtn'),
    quickOpenCaseBtn: document.getElementById('quickOpenCaseBtn'),
    casesOddsGrid: document.getElementById('casesOddsGrid'),
    casesOddsModeToggle: document.getElementById('casesOddsModeToggle'),
    oddsToggleNormalBtn: document.getElementById('oddsToggleNormalBtn'),
    oddsToggleFastBtn: document.getElementById('oddsToggleFastBtn'),
    casesNavTotalCount: document.getElementById('casesNavTotalCount'),
    casesCrateTotalCount: document.getElementById('casesCrateTotalCount'),
    cstatTotalOpened: document.getElementById('cstatTotalOpened'),
    cstatUniqueUnlocked: document.getElementById('cstatUniqueUnlocked'),
    cstatTotalItems: document.getElementById('cstatTotalItems'),
    cstatPercent: document.getElementById('cstatPercent'),
    collectionFilters: document.getElementById('collectionFilters'),
    casesCollectionGrid: document.getElementById('casesCollectionGrid'),
    resetCollectionBtn: document.getElementById('resetCollectionBtn'),
    collViewAllBtn: document.getElementById('collViewAllBtn'),
    collViewAlbumsBtn: document.getElementById('collViewAlbumsBtn'),
    collViewMilestonesBtn: document.getElementById('collViewMilestonesBtn'),
    cstatAlbumsCount: document.getElementById('cstatAlbumsCount'),
    cstatMilestonesCount: document.getElementById('cstatMilestonesCount'),
    casesAllItemsView: document.getElementById('casesAllItemsView'),
    casesAlbumsView: document.getElementById('casesAlbumsView'),
    casesMilestonesView: document.getElementById('casesMilestonesView'),
    casesMilestonesGrid: document.getElementById('casesMilestonesGrid'),
    milestonesCompletedBadge: document.getElementById('milestonesCompletedBadge'),
    lightboxMilestoneContainer: document.getElementById('lightboxMilestoneContainer'),
    albumsOverviewSection: document.getElementById('albumsOverviewSection'),
    casesAlbumsGrid: document.getElementById('casesAlbumsGrid'),
    albumsCompletedBadge: document.getElementById('albumsCompletedBadge'),
    albumDetailSection: document.getElementById('albumDetailSection'),
    backToAlbumsBtn: document.getElementById('backToAlbumsBtn'),
    albumDetailIcon: document.getElementById('albumDetailIcon'),
    albumDetailTitle: document.getElementById('albumDetailTitle'),
    albumDetailBadge: document.getElementById('albumDetailBadge'),
    albumDetailDesc: document.getElementById('albumDetailDesc'),
    albumDetailProgressFill: document.getElementById('albumDetailProgressFill'),
    albumDetailProgressText: document.getElementById('albumDetailProgressText'),
    albumDetailRewardTag: document.getElementById('albumDetailRewardTag'),
    albumItemsGrid: document.getElementById('albumItemsGrid'),
    casesRevealModal: document.getElementById('casesRevealModal'),
    casesRevealCardBox: document.getElementById('casesRevealCardBox'),
    casesRarityFxContainer: document.getElementById('casesRarityFxContainer'),
    casesRevealRays: document.getElementById('casesRevealRays'),
    casesRevealNewBadge: document.getElementById('casesRevealNewBadge'),
    casesRevealRarityTag: document.getElementById('casesRevealRarityTag'),
    casesRevealMediaWrap: document.getElementById('casesRevealMediaWrap'),
    casesRevealTitle: document.getElementById('casesRevealTitle'),
    casesRevealMeta: document.getElementById('casesRevealMeta'),
    casesRevealCountBadge: document.getElementById('casesRevealCountBadge'),
    casesOpenAnotherBtn: document.getElementById('casesOpenAnotherBtn'),
    casesViewInCollectionBtn: document.getElementById('casesViewInCollectionBtn'),
    casesCloseRevealBtn: document.getElementById('casesCloseRevealBtn'),
    casesLightboxModal: document.getElementById('casesLightboxModal'),
    lightboxRarityBadge: document.getElementById('lightboxRarityBadge'),
    lightboxItemTitle: document.getElementById('lightboxItemTitle'),
    closeLightboxBtn: document.getElementById('closeLightboxBtn'),
    lightboxMediaWrap: document.getElementById('lightboxMediaWrap'),
    lightboxMetaText: document.getElementById('lightboxMetaText'),
    lightboxDoneBtn: document.getElementById('lightboxDoneBtn'),
    csgoUnboxAudio: document.getElementById('csgoUnboxAudio'),
    itemObtainAudio: document.getElementById('itemObtainAudio'),
    caseStageArea: document.getElementById('caseStageArea'),
    caseStaticBoxImg: document.getElementById('caseStaticBoxImg'),
    caseOpenVideo: document.getElementById('caseOpenVideo'),
    crateMetaInfo: document.getElementById('crateMetaInfo'),

    // Classic Header & Mode elements
    classicHeaderTitle: document.getElementById('classicHeaderTitle'),
    classicDailyBadge: document.getElementById('classicDailyBadge'),
    classicDailyNum: document.getElementById('classicDailyNum'),
    classicHeaderHint: document.getElementById('classicHeaderHint'),
    classicCountdownWrap: document.getElementById('classicCountdownWrap'),
    classicCountdown: document.getElementById('classicCountdown'),
    practiceToggleBtn: document.getElementById('practiceToggleBtn'),
    practiceToggleIcon: document.getElementById('practiceToggleIcon'),
    practiceToggleText: document.getElementById('practiceToggleText'),

    // Solved Today Banner
    alreadySolvedBanner: document.getElementById('alreadySolvedBanner'),
    practiceSolvedBanner: document.getElementById('practiceSolvedBanner'),
    solvedCountdownClock: document.getElementById('solvedCountdownClock'),
    viewSolvedSummaryBtn: document.getElementById('viewSolvedSummaryBtn'),
    switchPracticeBtn: document.getElementById('switchPracticeBtn'),
    nextPracticeBtn: document.getElementById('nextPracticeBtn'),

    // Search and guess inputs
    input: document.getElementById('memberInput'),
    clearBtn: document.getElementById('clearInputBtn'),
    guessBtn: document.getElementById('guessBtn'),
    dropdown: document.getElementById('autocompleteDropdown'),
    categoryColumnsHeader: document.getElementById('categoryColumnsHeader'),
    guessesList: document.getElementById('guessesList'),
    emptyState: document.getElementById('emptyGuessesState'),
    guessCountBadge: document.getElementById('guessCountBadge'),
    totalMembersBadge: document.getElementById('totalMembersBadge'),
    viewMembersBtn: document.getElementById('viewMembersBtn'),
    membersModal: document.getElementById('membersModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    modalDoneBtn: document.getElementById('modalDoneBtn'),
    modalSearchInput: document.getElementById('modalSearchInput'),
    modalMembersGrid: document.getElementById('modalMembersGrid'),
    modalMemberCount: document.getElementById('modalMemberCount'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    resetGameBtn: document.getElementById('resetGameBtn'),

    colorIndicatorsBox: document.getElementById('colorIndicatorsBox'),
    closeLegendBtn: document.getElementById('closeLegendBtn'),
    openLegendBtn: document.getElementById('openLegendBtn'),

    // Top Bar Stats
    statsBtn: document.getElementById('statsBtn'),
    topStatsStreak: document.getElementById('topStatsStreak'),

    // Stats Modal
    statsModal: document.getElementById('statsModal'),
    closeStatsModalBtn: document.getElementById('closeStatsModalBtn'),
    statsDoneBtn: document.getElementById('statsDoneBtn'),
    statsValPlayed: document.getElementById('statsValPlayed'),
    statsValWinPct: document.getElementById('statsValWinPct'),
    statsValCurrentStreak: document.getElementById('statsValCurrentStreak'),
    statsValMaxStreak: document.getElementById('statsValMaxStreak'),
    guessDistributionContainer: document.getElementById('guessDistributionContainer'),
    statsCountdownClock: document.getElementById('statsCountdownClock'),
    statsShareBtn: document.getElementById('statsShareBtn'),

    // Victory Modal
    victoryModal: document.getElementById('victoryModal'),
    victoryHeading: document.getElementById('victoryHeading'),
    victorySubtitle: document.getElementById('victorySubtitle'),
    victoryAvatar: document.getElementById('victoryAvatar'),
    victoryMemberName: document.getElementById('victoryMemberName'),
    victoryAliases: document.getElementById('victoryAliases'),
    victoryGuessCount: document.getElementById('victoryGuessCount'),
    victoryCountdownCard: document.getElementById('victoryCountdownCard'),
    victoryCountdownClock: document.getElementById('victoryCountdownClock'),
    victoryStatsRow: document.getElementById('victoryStatsRow'),
    vstatPlayed: document.getElementById('vstatPlayed'),
    vstatWinPct: document.getElementById('vstatWinPct'),
    vstatStreak: document.getElementById('vstatStreak'),
    vstatMaxStreak: document.getElementById('vstatMaxStreak'),
    victoryPracticeBtn: document.getElementById('victoryPracticeBtn'),
    closeVictoryBtn: document.getElementById('closeVictoryBtn'),
    shareResultBtn: document.getElementById('shareResultBtn'),
    victoryFlash: document.getElementById('victoryFlash'),
    victoryCanvas: document.getElementById('victoryCanvas'),
    gameToast: document.getElementById('gameToast')
  };

  // --- Init Application ---
  function init() {
    SoundFX.init();
    VictoryCelebration.init();
    loadMembersData();
    loadQuotesData();
    loadEmojisData();
    loadPicturesData();
    bindEvents();
    updateCasesHomeBadge();

    // Start 1-second midnight timer
    setInterval(handleSecondTick, 1000);
    handleSecondTick();

    // Check hash for direct mode linking
    if (window.location.hash === '#classic') {
      showView('classic', false);
    } else if (window.location.hash === '#quote') {
      showView('quote', false);
    } else if (window.location.hash === '#emoji') {
      showView('emoji', false);
    } else if (window.location.hash === '#picture') {
      showView('picture', false);
    } else if (window.location.hash === '#cases') {
      showView('cases', false);
    } else {
      showView('home', false);
    }

    updateCasesCollectionUI();
  }

  // --- View Switcher ---
  function showView(viewName, playSound = true) {
    state.activeView = viewName;
    if (viewName !== 'cases' && typeof resetCaseOpeningStage === 'function') {
      resetCaseOpeningStage();
    }

    if (viewName === 'classic') {
      DOM.homeView.style.display = 'none';
      DOM.classicView.style.display = 'flex';
      if (DOM.quoteView) DOM.quoteView.style.display = 'none';
      if (DOM.emojiView) DOM.emojiView.style.display = 'none';
      if (DOM.pictureView) DOM.pictureView.style.display = 'none';
      if (DOM.casesView) DOM.casesView.style.display = 'none';
      window.location.hash = '#classic';
      setTimeout(() => {
        if (DOM.input && !DOM.input.disabled) DOM.input.focus();
      }, 50);
    } else if (viewName === 'quote') {
      DOM.homeView.style.display = 'none';
      DOM.classicView.style.display = 'none';
      if (DOM.quoteView) DOM.quoteView.style.display = 'flex';
      if (DOM.emojiView) DOM.emojiView.style.display = 'none';
      if (DOM.pictureView) DOM.pictureView.style.display = 'none';
      if (DOM.casesView) DOM.casesView.style.display = 'none';
      window.location.hash = '#quote';
      renderQuoteClues();
      setTimeout(() => {
        if (DOM.quoteMemberInput && !DOM.quoteMemberInput.disabled) DOM.quoteMemberInput.focus();
      }, 50);
    } else if (viewName === 'emoji') {
      DOM.homeView.style.display = 'none';
      DOM.classicView.style.display = 'none';
      if (DOM.quoteView) DOM.quoteView.style.display = 'none';
      if (DOM.emojiView) DOM.emojiView.style.display = 'flex';
      if (DOM.pictureView) DOM.pictureView.style.display = 'none';
      if (DOM.casesView) DOM.casesView.style.display = 'none';
      window.location.hash = '#emoji';
      renderEmojiClues();
      setTimeout(() => {
        if (DOM.emojiMemberInput && !DOM.emojiMemberInput.disabled) DOM.emojiMemberInput.focus();
      }, 50);
    } else if (viewName === 'picture') {
      DOM.homeView.style.display = 'none';
      DOM.classicView.style.display = 'none';
      if (DOM.quoteView) DOM.quoteView.style.display = 'none';
      if (DOM.emojiView) DOM.emojiView.style.display = 'none';
      if (DOM.pictureView) DOM.pictureView.style.display = 'flex';
      if (DOM.casesView) DOM.casesView.style.display = 'none';
      window.location.hash = '#picture';
      setTimeout(() => {
        if (DOM.pictureMemberInput && !DOM.pictureMemberInput.disabled) DOM.pictureMemberInput.focus();
      }, 50);
    } else if (viewName === 'cases') {
      DOM.homeView.style.display = 'none';
      DOM.classicView.style.display = 'none';
      if (DOM.quoteView) DOM.quoteView.style.display = 'none';
      if (DOM.emojiView) DOM.emojiView.style.display = 'none';
      if (DOM.pictureView) DOM.pictureView.style.display = 'none';
      if (DOM.casesView) DOM.casesView.style.display = 'block';
      window.location.hash = '#cases';
      renderCasesOddsGrid();
      initCasesRoulette();
      updateCasesCollectionUI(state.caseActiveFilter || 'all');
    } else {
      DOM.homeView.style.display = 'flex';
      DOM.classicView.style.display = 'none';
      if (DOM.quoteView) DOM.quoteView.style.display = 'none';
      if (DOM.emojiView) DOM.emojiView.style.display = 'none';
      if (DOM.pictureView) DOM.pictureView.style.display = 'none';
      if (DOM.casesView) DOM.casesView.style.display = 'none';
      if (window.location.hash === '#classic' || window.location.hash === '#quote' || window.location.hash === '#emoji' || window.location.hash === '#picture' || window.location.hash === '#cases') {
        history.replaceState(null, '', ' ');
      }
    }

    if (playSound) {
      SoundFX.playSelect();
    }
  }

  // --- Load Members Data ---
  function loadMembersData() {
    if (window.MEMBERS_DATA && Array.isArray(window.MEMBERS_DATA)) {
      setMembers(window.MEMBERS_DATA);
      return;
    }

    fetch('members.json')
      .then(res => res.json())
      .then(data => {
        setMembers(data);
      })
      .catch(err => {
        console.error('Error fetching members.json:', err);
      });
  }

  function setMembers(data) {
    state.members = data.map(m => {
      if (!m.categories) {
        m.categories = {
          spol: '',
          lokacija: '',
          status: '',
          dolazak_na_server: '',
          kilaza: '',
          okupacija: '',
          aktivnost: ''
        };
      }
      return m;
    });

    if (DOM.totalMembersBadge) {
      DOM.totalMembersBadge.textContent = data.length;
    }
    if (DOM.modalMemberCount) {
      DOM.modalMemberCount.textContent = data.length;
    }

    populateModalRoster(data);
    initDailyGame();
    updateStatsUI(StatsManager.get());
  }

  // --- Daily Game Setup & Session Restoration ---
  function initDailyGame() {
    if (!state.members || state.members.length === 0) return;

    const dayInfo = getLocalDayInfo();
    state.currentDateKey = dayInfo.dateKey;
    state.gameNumber = dayInfo.gameNumber;
    state.dayIndex = dayInfo.dayIndex;

    // Pick deterministic daily member
    state.dailyTargetMember = getDailyMember(dayInfo.dayIndex, state.members);
    state.targetMember = state.dailyTargetMember;

    // Update daily labels across UI
    if (DOM.homeDailyNum) DOM.homeDailyNum.textContent = dayInfo.gameNumber;
    if (DOM.classicDailyNum) DOM.classicDailyNum.textContent = dayInfo.gameNumber;
    if (DOM.classicCardBadge) DOM.classicCardBadge.textContent = 'DAILY #' + dayInfo.gameNumber;

    // Attempt to restore daily save
    const saved = DailyStateManager.load(dayInfo.dateKey);
    if (saved && Array.isArray(saved.guesses) && saved.guesses.length > 0) {
      state.guessesHistory = [];
      state.guessedIds.clear();
      state.isWon = !!saved.isWon;

      // Re-log guesses in order (oldest first so prepending produces correct board order)
      const inOrder = [...saved.guesses].reverse();
      inOrder.forEach(member => {
        logGuess(member, false);
      });

      if (state.isWon) {
        setDailySolvedUI(true);
      }
      console.log(`[Antisimpdle] Restored Daily #${dayInfo.gameNumber} (${saved.guesses.length} guesses). Solved: ${state.isWon}`);
    } else {
      // New day: clean slate
      state.guessesHistory = [];
      state.guessedIds.clear();
      state.isWon = false;
      renderBoardFromState([]);
      setDailySolvedUI(false);
      console.log(`[Antisimpdle] Starting Fresh Daily #${dayInfo.gameNumber}:`, state.targetMember.name);
    }
  }

  // --- Midnight Reset & Countdown Timer ---
  function handleSecondTick() {
    const dayInfo = getLocalDayInfo();

    // 1. Update countdown timer displays
    if (DOM.homeCountdown) DOM.homeCountdown.textContent = dayInfo.countdownStr;
    if (DOM.classicCountdown) DOM.classicCountdown.textContent = dayInfo.countdownStr;
    if (DOM.quoteCountdown) DOM.quoteCountdown.textContent = dayInfo.countdownStr;
    if (DOM.emojiCountdown) DOM.emojiCountdown.textContent = dayInfo.countdownStr;
    if (DOM.pictureCountdown) DOM.pictureCountdown.textContent = dayInfo.countdownStr;
    if (DOM.solvedCountdownClock) DOM.solvedCountdownClock.textContent = dayInfo.countdownStr;
    if (DOM.solvedQuoteCountdownClock) DOM.solvedQuoteCountdownClock.textContent = dayInfo.countdownStr;
    if (DOM.solvedEmojiCountdownClock) DOM.solvedEmojiCountdownClock.textContent = dayInfo.countdownStr;
    if (DOM.solvedPictureCountdownClock) DOM.solvedPictureCountdownClock.textContent = dayInfo.countdownStr;
    if (DOM.victoryCountdownClock) DOM.victoryCountdownClock.textContent = dayInfo.countdownStr;
    if (DOM.statsCountdownClock) DOM.statsCountdownClock.textContent = dayInfo.countdownStr;

    // 2. Midnight Rollover Check (auto resets exactly at midnight)
    if (state.currentDateKey && dayInfo.dateKey !== state.currentDateKey) {
      console.log('[Antisimpdle] Midnight rollover detected! Resetting for:', dayInfo.dateKey);
      handleMidnightRollover(dayInfo);
    }
  }

  function handleMidnightRollover(dayInfo) {
    state.currentDateKey = dayInfo.dateKey;
    state.gameNumber = dayInfo.gameNumber;
    state.dayIndex = dayInfo.dayIndex;

    // Pick new daily member for the new day
    state.dailyTargetMember = getDailyMember(dayInfo.dayIndex, state.members);

    // Update daily labels across UI
    if (DOM.homeDailyNum) DOM.homeDailyNum.textContent = dayInfo.gameNumber;
    if (DOM.classicDailyNum) DOM.classicDailyNum.textContent = dayInfo.gameNumber;
    if (DOM.classicCardBadge) DOM.classicCardBadge.textContent = 'DAILY #' + dayInfo.gameNumber;

    // Reset daily guesses
    DailyStateManager.clear();
    state.guessesHistory = [];
    state.guessedIds.clear();
    state.isWon = false;

    // If in daily mode, clear the board and restore inputs
    if (state.gameMode === 'daily') {
      state.targetMember = state.dailyTargetMember;
      renderBoardFromState([]);
      setDailySolvedUI(false);
      if (DOM.victoryModal) DOM.victoryModal.style.display = 'none';
      VictoryCelebration.stop();
      showToast(`☀️ Midnight reached! Antisimpdle #${dayInfo.gameNumber} is ready to play.`);
      SoundFX.playGuessSuccess();
    } else {
      showToast(`☀️ Midnight reached! Today's new Daily Member #${dayInfo.gameNumber} is now live.`);
    }

    updateStatsUI(StatsManager.get());
    handleQuoteMidnightRollover(dayInfo);
    handleEmojiMidnightRollover(dayInfo);
    handlePictureMidnightRollover(dayInfo);
  }

  // --- Board Renderer & Solved UI ---
  function renderBoardFromState(history) {
    DOM.guessesList.innerHTML = '';
    if (!history || history.length === 0) {
      if (DOM.emptyState) DOM.guessesList.appendChild(DOM.emptyState);
      if (DOM.categoryColumnsHeader) DOM.categoryColumnsHeader.style.display = 'none';
      updateGuessCounter();
      return;
    }

    if (DOM.categoryColumnsHeader) DOM.categoryColumnsHeader.style.display = 'grid';

    const inOrder = [...history].reverse();
    inOrder.forEach((member, idx) => {
      const card = createGuessCard(member, idx + 1);
      DOM.guessesList.prepend(card);
    });

    const target = state.targetMember;
    if (target && history.some(m => m.id === target.id)) {
      const winRow = DOM.guessesList.querySelector(`[data-id="${target.id}"]`);
      if (winRow) winRow.classList.add('winning-row-glow');
    }

    updateGuessCounter();
  }

  function setDailySolvedUI(isSolved) {
    if (state.gameMode !== 'daily') return;

    if (isSolved) {
      if (DOM.alreadySolvedBanner) DOM.alreadySolvedBanner.style.display = 'flex';
      DOM.input.disabled = true;
      DOM.input.placeholder = "👑 Today's member solved! Resets at midnight.";
      DOM.guessBtn.disabled = true;
      if (DOM.classicCardBadge) {
        DOM.classicCardBadge.textContent = '✅ SOLVED TODAY';
        DOM.classicCardBadge.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
        DOM.classicCardBadge.style.color = '#ffffff';
      }
    } else {
      if (DOM.alreadySolvedBanner) DOM.alreadySolvedBanner.style.display = 'none';
      DOM.input.disabled = false;
      DOM.input.placeholder = 'Type member name or alias... (e.g. lara, chudika, veronika)';
      DOM.guessBtn.disabled = false;
      if (DOM.classicCardBadge) {
        DOM.classicCardBadge.textContent = 'DAILY #' + state.gameNumber;
        DOM.classicCardBadge.style.background = '';
        DOM.classicCardBadge.style.color = '';
      }
    }
  }

  // --- Practice Mode / Unlimited Free Play ---
  function togglePracticeMode() {
    if (state.gameMode === 'daily') {
      switchToPracticeMode();
    } else {
      returnToDailyMode();
    }
  }

  function switchToPracticeMode() {
    state.gameMode = 'practice';

    if (!state.practiceTargetMember || state.practiceIsWon) {
      pickNewPracticeTarget();
    } else {
      state.targetMember = state.practiceTargetMember;
      renderBoardFromState(state.practiceHistory);
      updatePracticeUI();
    }
    SoundFX.playSelect();
  }

  function pickNewPracticeTarget() {
    if (!state.members || state.members.length === 0) return;
    let pool = state.members.filter(m => 
      (!state.dailyTargetMember || m.id !== state.dailyTargetMember.id) &&
      (!state.practiceTargetMember || m.id !== state.practiceTargetMember.id) &&
      !state.practiceSolvedIds.has(m.id)
    );

    // If all practice members have been solved in this session, reset the pool cycle
    if (pool.length === 0) {
      state.practiceSolvedIds.clear();
      pool = state.members.filter(m => 
        (!state.dailyTargetMember || m.id !== state.dailyTargetMember.id) &&
        (!state.practiceTargetMember || m.id !== state.practiceTargetMember.id)
      );
      showToast('🔁 All members solved! Resetting practice pool.');
    }

    const chosen = pool[Math.floor(Math.random() * pool.length)] || state.members[0];

    state.practiceTargetMember = chosen;
    state.targetMember = chosen;
    state.practiceGuessedIds.clear();
    state.practiceHistory = [];
    state.practiceIsWon = false;

    renderBoardFromState([]);
    updatePracticeUI();

    if (DOM.alreadySolvedBanner) DOM.alreadySolvedBanner.style.display = 'none';
    if (DOM.practiceSolvedBanner) DOM.practiceSolvedBanner.style.display = 'none';
    if (DOM.victoryModal) DOM.victoryModal.style.display = 'none';
    VictoryCelebration.stop();
  }

  function restartPractice() {
    state.practiceSolvedIds.clear();
    state.practiceTargetMember = null;
    pickNewPracticeTarget();
    showToast('🔁 Classic practice restarted!');
    SoundFX.playTone(440, 'sine', 0.12);
  }

  function returnToDailyMode() {
    state.gameMode = 'daily';
    state.targetMember = state.dailyTargetMember;

    renderBoardFromState(state.guessesHistory);

    if (DOM.classicHeaderTitle) DOM.classicHeaderTitle.textContent = 'CLASSIC MODE';
    if (DOM.classicDailyBadge) {
      DOM.classicDailyBadge.textContent = 'DAILY #' + state.gameNumber;
      DOM.classicDailyBadge.style.background = '';
      DOM.classicDailyBadge.style.color = '';
    }
    if (DOM.classicHeaderHint) DOM.classicHeaderHint.textContent = "Guess today's Discord member";
    if (DOM.classicCountdownWrap) DOM.classicCountdownWrap.style.display = 'inline-block';
    if (DOM.practiceToggleText) DOM.practiceToggleText.textContent = 'Practice Mode';
    if (DOM.practiceToggleIcon) DOM.practiceToggleIcon.textContent = '🎲';
    if (DOM.practiceSolvedBanner) DOM.practiceSolvedBanner.style.display = 'none';

    setDailySolvedUI(state.isWon);
    SoundFX.playSelect();
  }

  function updatePracticeUI() {
    if (DOM.classicHeaderTitle) DOM.classicHeaderTitle.textContent = 'CLASSIC • PRACTICE';
    if (DOM.classicDailyBadge) {
      const solvedCount = state.practiceSolvedIds.size;
      DOM.classicDailyBadge.textContent = solvedCount > 0 ? `🎲 PRACTICE (${solvedCount} SOLVED)` : '🎲 PRACTICE';
      DOM.classicDailyBadge.style.background = 'linear-gradient(135deg, #ff1744, #b71c1c)';
      DOM.classicDailyBadge.style.color = '#ffffff';
    }
    if (DOM.classicHeaderHint) DOM.classicHeaderHint.textContent = 'Unlimited Practice • Guess random members';
    if (DOM.classicCountdownWrap) DOM.classicCountdownWrap.style.display = 'none';
    if (DOM.practiceToggleText) DOM.practiceToggleText.textContent = 'Back to Daily';
    if (DOM.practiceToggleIcon) DOM.practiceToggleIcon.textContent = '🎯';
    if (DOM.alreadySolvedBanner) DOM.alreadySolvedBanner.style.display = 'none';

    if (state.practiceIsWon) {
      if (DOM.input) {
        DOM.input.disabled = true;
        DOM.input.placeholder = '🎉 Practice member solved! Click Next Practice to play again.';
      }
      if (DOM.guessBtn) DOM.guessBtn.disabled = true;
      if (DOM.practiceSolvedBanner) {
        const msg = DOM.practiceSolvedBanner.querySelector('.solved-banner-text p');
        if (msg) {
          const count = state.practiceSolvedIds.size;
          msg.textContent = `You guessed correctly! (${count} solved this session without repeats). Ready for another?`;
        }
        DOM.practiceSolvedBanner.style.display = 'flex';
      }
    } else {
      if (DOM.input) {
        DOM.input.disabled = false;
        DOM.input.placeholder = 'Type member name or alias... (Practice Mode)';
        setTimeout(() => {
          if (DOM.input && !DOM.input.disabled) DOM.input.focus();
        }, 50);
      }
      if (DOM.guessBtn) DOM.guessBtn.disabled = false;
      if (DOM.practiceSolvedBanner) DOM.practiceSolvedBanner.style.display = 'none';
    }
  }

  function resetGame() {
    if (state.activeView === 'picture') {
      resetPictureGame();
      return;
    }
    if (state.activeView === 'quote') {
      resetQuoteGame();
      return;
    }
    if (state.activeView === 'emoji') {
      resetEmojiGame();
      return;
    }

    if (state.gameMode === 'daily') {
      if (state.isWon) {
        showToast('👑 You already solved today! Play Practice Mode to guess more.');
        return;
      }
      if (state.guessesHistory.length === 0) return;
      if (confirm("Reset today's daily guesses and restart from 0?")) {
        state.guessedIds.clear();
        state.guessesHistory = [];
        state.isWon = false;
        DailyStateManager.clear();
        renderBoardFromState([]);
        setDailySolvedUI(false);
        SoundFX.playTone(320, 'sine', 0.15);
      }
    } else {
      if (confirm('Restart practice mode and reset your solved members?')) {
        restartPractice();
      }
    }
  }

  // --- Statistics Modal ---
  function updateStatsUI(stats) {
    if (DOM.topStatsStreak) {
      const activeStats = state.activeView === 'picture'
        ? PictureStatsManager.get()
        : (state.activeView === 'emoji'
            ? EmojiStatsManager.get()
            : (state.activeView === 'quote' ? QuoteStatsManager.get() : StatsManager.get()));
      DOM.topStatsStreak.textContent = '🔥 ' + activeStats.currentStreak;
    }
  }

  function openStatsModal() {
    if (state.activeView === 'picture') {
      state.statsActiveTab = 'picture';
    } else if (state.activeView === 'emoji') {
      state.statsActiveTab = 'emoji';
    } else if (state.activeView === 'quote') {
      state.statsActiveTab = 'quote';
    } else {
      state.statsActiveTab = 'classic';
    }
    renderStatsTab();
    if (DOM.statsModal) DOM.statsModal.style.display = 'flex';
    SoundFX.playSelect();
  }

  function setStatsActiveTab(tabName) {
    state.statsActiveTab = tabName;
    renderStatsTab();
    SoundFX.playSelect();
  }

  function renderStatsTab() {
    const isQuoteTab = state.statsActiveTab === 'quote';
    const isEmojiTab = state.statsActiveTab === 'emoji';
    const isPictureTab = state.statsActiveTab === 'picture';

    if (DOM.statsTabClassic) {
      DOM.statsTabClassic.classList.toggle('active', state.statsActiveTab === 'classic');
    }
    if (DOM.statsTabQuote) {
      DOM.statsTabQuote.classList.toggle('active', isQuoteTab);
    }
    if (DOM.statsTabEmoji) {
      DOM.statsTabEmoji.classList.toggle('active', isEmojiTab);
    }
    if (DOM.statsTabPicture) {
      DOM.statsTabPicture.classList.toggle('active', isPictureTab);
    }

    let stats, isWon, history;
    if (isPictureTab) {
      stats = PictureStatsManager.get();
      isWon = state.pictureDailyIsWon;
      history = state.pictureDailyGuesses;
    } else if (isEmojiTab) {
      stats = EmojiStatsManager.get();
      isWon = state.emojiDailyIsWon;
      history = state.emojiDailyGuesses;
    } else if (isQuoteTab) {
      stats = QuoteStatsManager.get();
      isWon = state.quoteDailyIsWon;
      history = state.quoteDailyGuesses;
    } else {
      stats = StatsManager.get();
      isWon = state.isWon;
      history = state.guessesHistory;
    }

    if (DOM.statsValPlayed) DOM.statsValPlayed.textContent = stats.played;
    if (DOM.statsValWinPct) {
      const pct = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
      DOM.statsValWinPct.textContent = pct + '%';
    }
    if (DOM.statsValCurrentStreak) DOM.statsValCurrentStreak.textContent = stats.currentStreak;
    if (DOM.statsValMaxStreak) DOM.statsValMaxStreak.textContent = stats.maxStreak;

    renderGuessDistribution(stats, isWon, history.length);

    if (DOM.statsShareBtn) {
      DOM.statsShareBtn.style.display = isWon ? 'flex' : 'none';
      const btnSpan = DOM.statsShareBtn.querySelector('span:last-child');
      if (btnSpan) {
        if (isPictureTab) {
          btnSpan.textContent = "SHARE TODAY'S PICTURE RESULT";
        } else if (isEmojiTab) {
          btnSpan.textContent = "SHARE TODAY'S EMOJI RESULT";
        } else if (isQuoteTab) {
          btnSpan.textContent = "SHARE TODAY'S QUOTE RESULT";
        } else {
          btnSpan.textContent = "SHARE TODAY'S RESULT";
        }
      }
    }
  }

  function closeStatsModal() {
    if (DOM.statsModal) DOM.statsModal.style.display = 'none';
  }

  function renderGuessDistribution(stats, isWon = false, guessCount = 0) {
    if (!DOM.guessDistributionContainer) return;
    const dist = stats.distribution || {};
    const maxVal = Math.max(...Object.values(dist), 1);
    const keys = ['1', '2', '3', '4', '5', '6', '7+'];

    const todayTries = isWon ? guessCount : -1;
    const todayBucket = todayTries >= 7 ? '7+' : String(todayTries);

    let html = '';
    keys.forEach(k => {
      const count = dist[k] || 0;
      const widthPct = Math.max(8, Math.round((count / maxVal) * 100));
      const isHighlight = isWon && todayBucket === k;

      html += `
        <div class="dist-row">
          <span class="dist-num">${k}</span>
          <div class="dist-bar-wrap">
            <div class="dist-bar ${isHighlight ? 'dist-highlight' : ''}" style="width: ${widthPct}%;">
              <span>${count}</span>
            </div>
          </div>
        </div>
      `;
    });

    DOM.guessDistributionContainer.innerHTML = html;
  }

  // --- Category Comparison Rules ---

  /**
   * Parse weight value into float.
   * Rule: '?' or missing or '-' counts as 0!
   * Supports ranges like '70-80 kg' (averages to 75) and '100+ kg' (100).
   */
  function parseWeight(val) {
    if (val === undefined || val === null) return 0;
    const s = String(val).trim().toLowerCase();
    if (!s || s === '?' || s === '-' || s === 'unknown' || s === 'none' || s === 'n/a') {
      return 0;
    }
    // Check range like "70-80 kg"
    const rangeMatch = s.match(/(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)/);
    if (rangeMatch) {
      const low = parseFloat(rangeMatch[1].replace(',', '.'));
      const high = parseFloat(rangeMatch[2].replace(',', '.'));
      return (low + high) / 2;
    }
    // Check "100+ kg"
    const plusMatch = s.match(/(\d+(?:[.,]\d+)?)\s*\+/);
    if (plusMatch) {
      return parseFloat(plusMatch[1].replace(',', '.'));
    }
    const match = s.match(/(\d+(?:[.,]\d+)?)/);
    if (match) {
      return parseFloat(match[1].replace(',', '.'));
    }
    return 0;
  }

  /**
   * Compare Kilaža:
   * ? counts as 0.
   * Target > Guess -> HIGHER (Arrow UP ⬆️)
   * Target < Guess -> LOWER (Arrow DOWN ⬇️)
   * Target === Guess -> CORRECT (Green)
   */
  function compareKilaza(guessVal, targetVal) {
    const g = parseWeight(guessVal);
    const t = parseWeight(targetVal);

    if (g === t) {
      return { status: 'correct', arrow: null };
    }
    if (t > g) {
      return { status: 'higher', arrow: 'up' };
    } else {
      return { status: 'lower', arrow: 'down' };
    }
  }

  /**
   * Compare Year for Dolazak:
   * If both are numeric years, provide higher/lower arrow indicator!
   */
  function compareYear(guessVal, targetVal) {
    const g = parseInt(guessVal, 10);
    const t = parseInt(targetVal, 10);

    if (!isNaN(g) && !isNaN(t) && g > 1900 && t > 1900) {
      if (g === t) return { status: 'correct', arrow: null };
      if (t > g) return { status: 'higher', arrow: 'up' };
      return { status: 'lower', arrow: 'down' };
    }
    return compareGeneral(guessVal, targetVal);
  }

  /**
   * Spol Matcher: Strictly 'Muško' or 'Žensko' (exact match only, never partial)
   */
  function compareSpol(guessVal, targetVal) {
    const g = String(guessVal || '').trim().toLowerCase();
    const t = String(targetVal || '').trim().toLowerCase();
    if (!g && !t) return { status: 'correct', arrow: null };
    if (!g || !t) return { status: 'incorrect', arrow: null };
    if (g === t) return { status: 'correct', arrow: null };
    return { status: 'incorrect', arrow: null };
  }

  /**
   * Status Matcher: Exact match only (e.g. "Nije na serveru" vs "Na serveru" is incorrect, never partial)
   */
  function compareStatus(guessVal, targetVal) {
    const g = String(guessVal || '').trim().toLowerCase();
    const t = String(targetVal || '').trim().toLowerCase();
    if (!g && !t) return { status: 'correct', arrow: null };
    if (!g || !t) return { status: 'incorrect', arrow: null };
    if (g === t) return { status: 'correct', arrow: null };
    return { status: 'incorrect', arrow: null };
  }

  /**
   * Aktivnost Matcher: Discrete tiers ('Neaktivan', 'Niska', 'Srednja', 'Visoka', 'Vrlo visoka')
   * "Vrlo visoka" and "Visoka" are distinct levels and must NEVER show as partial/yellow!
   */
  function compareAktivnost(guessVal, targetVal) {
    const g = String(guessVal || '').trim().toLowerCase();
    const t = String(targetVal || '').trim().toLowerCase();
    if (!g && !t) return { status: 'correct', arrow: null };
    if (!g || !t) return { status: 'incorrect', arrow: null };
    if (g === t) return { status: 'correct', arrow: null };
    return { status: 'incorrect', arrow: null };
  }

  /**
   * Okupacija Matcher:
   * Multi-tag matching (e.g. "Student, Zaposlen" vs "Zaposlen" is partial/yellow).
   * "Nezaposlen" and "Zaposlen" are distinct opposites and must NEVER match (neither full nor partial)!
   */
  function compareOkupacija(guessVal, targetVal) {
    const g = String(guessVal || '').trim().toLowerCase();
    const t = String(targetVal || '').trim().toLowerCase();

    if (!g && !t) return { status: 'correct', arrow: null };
    if (!g || !t) return { status: 'incorrect', arrow: null };
    if (g === t) return { status: 'correct', arrow: null };

    const gParts = g.split(/[,/]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
    const tParts = t.split(/[,/]+/).map(s => s.trim().toLowerCase()).filter(Boolean);

    const validG = gParts.filter(p => p !== '?' && p !== '-');
    const validT = tParts.filter(p => p !== '?' && p !== '-');
    if (validG.length === 0 || validT.length === 0) {
      return { status: 'incorrect', arrow: null };
    }

    // Exact set match
    if (validG.length === validT.length && validG.every(p => validT.includes(p))) {
      return { status: 'correct', arrow: null };
    }

    // Check individual token overlap:
    // Explicit rule: "nezaposlen" and "zaposlen" NEVER match each other!
    const overlap = validG.filter(gp => {
      return validT.some(tp => {
        if ((gp === 'nezaposlen' && tp === 'zaposlen') || (gp === 'zaposlen' && tp === 'nezaposlen')) {
          return false;
        }
        return gp === tp;
      });
    });

    if (overlap.length > 0) {
      return { status: 'partial', arrow: null };
    }

    return { status: 'incorrect', arrow: null };
  }

  /**
   * Lokacija Matcher: Multi-location token matching (e.g. "Zagreb, Rijeka" vs "Zagreb" is partial)
   */
  function compareLokacija(guessVal, targetVal) {
    const g = String(guessVal || '').trim().toLowerCase();
    const t = String(targetVal || '').trim().toLowerCase();

    if (!g && !t) return { status: 'correct', arrow: null };
    if (!g || !t) return { status: 'incorrect', arrow: null };
    if (g === t) return { status: 'correct', arrow: null };

    const gParts = g.split(/[,/]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
    const tParts = t.split(/[,/]+/).map(s => s.trim().toLowerCase()).filter(Boolean);

    if (gParts.length === tParts.length && gParts.every(p => tParts.includes(p))) {
      return { status: 'correct', arrow: null };
    }

    const overlap = gParts.filter(gp => tParts.includes(gp));
    if (overlap.length > 0) {
      return { status: 'partial', arrow: null };
    }

    return { status: 'incorrect', arrow: null };
  }

  /**
   * General Category Matcher: Safe fallback with exact token matching (no raw substring bugs)
   */
  function compareGeneral(guessVal, targetVal) {
    const g = String(guessVal || '').trim().toLowerCase();
    const t = String(targetVal || '').trim().toLowerCase();

    if (!g && !t) return { status: 'correct', arrow: null };
    if (!g || !t) return { status: 'incorrect', arrow: null };
    if (g === t) return { status: 'correct', arrow: null };

    // Split on comma or slash for multiple tags
    const gParts = g.split(/[,/]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
    const tParts = t.split(/[,/]+/).map(s => s.trim().toLowerCase()).filter(Boolean);

    const overlap = gParts.filter(p => tParts.includes(p));
    if (overlap.length > 0) {
      return { status: 'partial', arrow: null };
    }

    return { status: 'incorrect', arrow: null };
  }

  // --- Event Bindings ---
  function bindEvents() {
    // Navigation
    if (DOM.playClassicCard) {
      DOM.playClassicCard.addEventListener('click', () => showView('classic'));
      DOM.playClassicCard.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          showView('classic');
        }
      });
    }

    if (DOM.playQuoteCard) {
      DOM.playQuoteCard.addEventListener('click', () => showView('quote'));
      DOM.playQuoteCard.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          showView('quote');
        }
      });
    }

    if (DOM.playEmojiCard) {
      DOM.playEmojiCard.addEventListener('click', () => showView('emoji'));
      DOM.playEmojiCard.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          showView('emoji');
        }
      });
    }

    if (DOM.playPictureCard) {
      DOM.playPictureCard.addEventListener('click', () => showView('picture'));
      DOM.playPictureCard.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          showView('picture');
        }
      });
    }

    if (DOM.playCasesCard) {
      DOM.playCasesCard.addEventListener('click', () => showView('cases'));
      DOM.playCasesCard.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          showView('cases');
        }
      });
    }

    if (DOM.backToHomeBtn) {
      DOM.backToHomeBtn.addEventListener('click', () => showView('home'));
    }

    if (DOM.backToHomeFromQuoteBtn) {
      DOM.backToHomeFromQuoteBtn.addEventListener('click', () => showView('home'));
    }

    if (DOM.backToHomeFromEmojiBtn) {
      DOM.backToHomeFromEmojiBtn.addEventListener('click', () => showView('home'));
    }

    if (DOM.backToHomeFromPictureBtn) {
      DOM.backToHomeFromPictureBtn.addEventListener('click', () => showView('home'));
    }

    if (DOM.backToHomeFromCasesBtn) {
      DOM.backToHomeFromCasesBtn.addEventListener('click', () => showView('home'));
    }

    if (DOM.homeLogoBtn) {
      DOM.homeLogoBtn.addEventListener('click', () => showView('home'));
    }

    if (DOM.browseRosterBtn) {
      DOM.browseRosterBtn.addEventListener('click', openMembersModal);
    }

    // Update Log button & chip listeners
    if (DOM.updateLogBtn) {
      DOM.updateLogBtn.addEventListener('click', openUpdateLogModal);
    }
    if (DOM.homeUpdateChipBtn) {
      DOM.homeUpdateChipBtn.addEventListener('click', openUpdateLogModal);
    }
    if (DOM.closeUpdateLogModalBtn) {
      DOM.closeUpdateLogModalBtn.addEventListener('click', closeUpdateLogModal);
    }
    if (DOM.updateLogDoneBtn) {
      DOM.updateLogDoneBtn.addEventListener('click', closeUpdateLogModal);
    }
    if (DOM.updateLogModal) {
      DOM.updateLogModal.addEventListener('click', (e) => {
        if (e.target === DOM.updateLogModal) closeUpdateLogModal();
      });
    }

    // Classic Input handling
    DOM.input.addEventListener('input', handleInputChange);
    DOM.input.addEventListener('keydown', handleInputKeydown);
    DOM.input.addEventListener('focus', () => {
      if (DOM.input.value.trim().length > 0) {
        handleInputChange();
      }
    });

    // Clear input button
    DOM.clearBtn.addEventListener('click', () => {
      DOM.input.value = '';
      DOM.clearBtn.style.display = 'none';
      closeDropdown();
      DOM.input.focus();
    });

    // Guess button click
    DOM.guessBtn.addEventListener('click', handleGuessSubmit);

    // Click outside to close dropdowns
    document.addEventListener('click', (e) => {
      if (!DOM.input.contains(e.target) && !DOM.dropdown.contains(e.target)) {
        closeDropdown();
      }
      if (DOM.quoteMemberInput && DOM.quoteAutocompleteDropdown) {
        if (!DOM.quoteMemberInput.contains(e.target) && !DOM.quoteAutocompleteDropdown.contains(e.target)) {
          closeQuoteDropdown();
        }
      }
      if (DOM.emojiMemberInput && DOM.emojiAutocompleteDropdown) {
        if (!DOM.emojiMemberInput.contains(e.target) && !DOM.emojiAutocompleteDropdown.contains(e.target)) {
          closeEmojiDropdown();
        }
      }
      if (DOM.pictureMemberInput && DOM.pictureAutocompleteDropdown) {
        if (!DOM.pictureMemberInput.contains(e.target) && !DOM.pictureAutocompleteDropdown.contains(e.target)) {
          closePictureDropdown();
        }
      }
    });

    // Quote Input handling
    if (DOM.quoteMemberInput) {
      DOM.quoteMemberInput.addEventListener('input', handleQuoteInputChange);
      DOM.quoteMemberInput.addEventListener('keydown', handleQuoteInputKeydown);
      DOM.quoteMemberInput.addEventListener('focus', () => {
        if (DOM.quoteMemberInput.value.trim().length > 0) {
          handleQuoteInputChange();
        }
      });
    }

    if (DOM.quoteClearInputBtn) {
      DOM.quoteClearInputBtn.addEventListener('click', () => {
        DOM.quoteMemberInput.value = '';
        DOM.quoteClearInputBtn.style.display = 'none';
        closeQuoteDropdown();
        DOM.quoteMemberInput.focus();
      });
    }

    if (DOM.quoteGuessBtn) {
      DOM.quoteGuessBtn.addEventListener('click', handleQuoteGuessSubmit);
    }

    // Emoji Input handling
    if (DOM.emojiMemberInput) {
      DOM.emojiMemberInput.addEventListener('input', handleEmojiInputChange);
      DOM.emojiMemberInput.addEventListener('keydown', handleEmojiInputKeydown);
      DOM.emojiMemberInput.addEventListener('focus', () => {
        if (DOM.emojiMemberInput.value.trim().length > 0) {
          handleEmojiInputChange();
        }
      });
    }

    if (DOM.emojiClearInputBtn) {
      DOM.emojiClearInputBtn.addEventListener('click', () => {
        DOM.emojiMemberInput.value = '';
        DOM.emojiClearInputBtn.style.display = 'none';
        closeEmojiDropdown();
        DOM.emojiMemberInput.focus();
      });
    }

    if (DOM.emojiGuessBtn) {
      DOM.emojiGuessBtn.addEventListener('click', handleEmojiGuessSubmit);
    }

    // Picture Input handling
    if (DOM.pictureMemberInput) {
      DOM.pictureMemberInput.addEventListener('input', handlePictureInputChange);
      DOM.pictureMemberInput.addEventListener('keydown', handlePictureInputKeydown);
      DOM.pictureMemberInput.addEventListener('focus', () => {
        if (DOM.pictureMemberInput.value.trim().length > 0) {
          handlePictureInputChange();
        }
      });
    }

    if (DOM.pictureClearInputBtn) {
      DOM.pictureClearInputBtn.addEventListener('click', () => {
        DOM.pictureMemberInput.value = '';
        DOM.pictureClearInputBtn.style.display = 'none';
        closePictureDropdown();
        DOM.pictureMemberInput.focus();
      });
    }

    if (DOM.pictureGuessBtn) {
      DOM.pictureGuessBtn.addEventListener('click', handlePictureGuessSubmit);
    }

    // Quote Practice mode buttons
    if (DOM.quotePracticeToggleBtn) {
      DOM.quotePracticeToggleBtn.addEventListener('click', toggleQuotePracticeMode);
    }
    if (DOM.switchQuotePracticeBtn) {
      DOM.switchQuotePracticeBtn.addEventListener('click', switchToQuotePracticeMode);
    }
    if (DOM.nextQuotePracticeBtn) {
      DOM.nextQuotePracticeBtn.addEventListener('click', pickNewQuotePracticeTarget);
    }
    if (DOM.viewSolvedQuoteSummaryBtn) {
      DOM.viewSolvedQuoteSummaryBtn.addEventListener('click', () => {
        if (state.quoteDailyTarget) {
          triggerQuoteVictory(state.quoteDailyTarget, state.quoteDailyGuesses.length, false);
        }
      });
    }

    // Emoji Practice mode buttons
    if (DOM.emojiPracticeToggleBtn) {
      DOM.emojiPracticeToggleBtn.addEventListener('click', toggleEmojiPracticeMode);
    }
    if (DOM.switchEmojiPracticeBtn) {
      DOM.switchEmojiPracticeBtn.addEventListener('click', switchToEmojiPracticeMode);
    }
    if (DOM.nextEmojiPracticeBtn) {
      DOM.nextEmojiPracticeBtn.addEventListener('click', pickNewEmojiPracticeTarget);
    }
    if (DOM.viewSolvedEmojiSummaryBtn) {
      DOM.viewSolvedEmojiSummaryBtn.addEventListener('click', () => {
        if (state.emojiDailyTarget) {
          triggerEmojiVictory(state.emojiDailyTarget, state.emojiDailyGuesses.length, false);
        }
      });
    }

    // Picture Practice mode buttons
    if (DOM.picturePracticeToggleBtn) {
      DOM.picturePracticeToggleBtn.addEventListener('click', togglePicturePracticeMode);
    }
    if (DOM.switchPicturePracticeBtn) {
      DOM.switchPicturePracticeBtn.addEventListener('click', switchToPicturePracticeMode);
    }
    if (DOM.nextPicturePracticeBtn) {
      DOM.nextPicturePracticeBtn.addEventListener('click', pickNewPicturePracticeTarget);
    }
    if (DOM.viewSolvedPictureSummaryBtn) {
      DOM.viewSolvedPictureSummaryBtn.addEventListener('click', () => {
        if (state.pictureDailyTarget) {
          triggerPictureVictory(state.pictureDailyTarget, state.pictureDailyGuesses.length, false);
        }
      });
    }

    // Quote Clue cards interactive click & keyboard navigation
    [1, 2, 3].forEach(idx => {
      const el = document.getElementById(`quoteClue${idx}`);
      if (el) {
        el.addEventListener('click', () => handleQuoteClueClick(idx));
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleQuoteClueClick(idx);
          }
        });
      }
    });

    // Emoji Clue cards interactive click & keyboard navigation
    [1, 2, 3].forEach(idx => {
      const el = document.getElementById(`emojiClue${idx}`);
      if (el) {
        el.addEventListener('click', () => handleEmojiClueClick(idx));
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleEmojiClueClick(idx);
          }
        });
      }
    });

    // Stats tab switching
    if (DOM.statsTabClassic) {
      DOM.statsTabClassic.addEventListener('click', () => setStatsActiveTab('classic'));
    }
    if (DOM.statsTabQuote) {
      DOM.statsTabQuote.addEventListener('click', () => setStatsActiveTab('quote'));
    }
    if (DOM.statsTabEmoji) {
      DOM.statsTabEmoji.addEventListener('click', () => setStatsActiveTab('emoji'));
    }
    if (DOM.statsTabPicture) {
      DOM.statsTabPicture.addEventListener('click', () => setStatsActiveTab('picture'));
    }

    // Sound toggle
    DOM.soundToggleBtn.addEventListener('click', () => SoundFX.toggle());

    // Reset game
    DOM.resetGameBtn.addEventListener('click', resetGame);

    // Modal controls
    DOM.viewMembersBtn.addEventListener('click', openMembersModal);
    DOM.closeModalBtn.addEventListener('click', closeMembersModal);
    DOM.modalDoneBtn.addEventListener('click', closeMembersModal);
    DOM.membersModal.addEventListener('click', (e) => {
      if (e.target === DOM.membersModal) closeMembersModal();
    });
    DOM.modalSearchInput.addEventListener('input', handleModalSearch);

    // Color Indicators Legend toggling
    if (DOM.closeLegendBtn) {
      DOM.closeLegendBtn.addEventListener('click', () => {
        if (DOM.colorIndicatorsBox) DOM.colorIndicatorsBox.style.display = 'none';
        if (DOM.openLegendBtn) DOM.openLegendBtn.style.display = 'inline-block';
      });
    }

    if (DOM.openLegendBtn) {
      DOM.openLegendBtn.addEventListener('click', () => {
        if (DOM.colorIndicatorsBox) DOM.colorIndicatorsBox.style.display = 'block';
        DOM.openLegendBtn.style.display = 'none';
      });
    }

    // Practice mode toggle buttons
    if (DOM.practiceToggleBtn) {
      DOM.practiceToggleBtn.addEventListener('click', togglePracticeMode);
    }
    if (DOM.switchPracticeBtn) {
      DOM.switchPracticeBtn.addEventListener('click', switchToPracticeMode);
    }
    if (DOM.nextPracticeBtn) {
      DOM.nextPracticeBtn.addEventListener('click', pickNewPracticeTarget);
    }
    if (DOM.viewSolvedSummaryBtn) {
      DOM.viewSolvedSummaryBtn.addEventListener('click', () => {
        if (state.targetMember) {
          triggerVictory(state.targetMember, state.guessesHistory.length, false);
        }
      });
    }

    // Stats modal triggers
    if (DOM.statsBtn) {
      DOM.statsBtn.addEventListener('click', openStatsModal);
    }
    if (DOM.closeStatsModalBtn) {
      DOM.closeStatsModalBtn.addEventListener('click', closeStatsModal);
    }
    if (DOM.statsDoneBtn) {
      DOM.statsDoneBtn.addEventListener('click', closeStatsModal);
    }
    if (DOM.statsModal) {
      DOM.statsModal.addEventListener('click', (e) => {
        if (e.target === DOM.statsModal) closeStatsModal();
      });
    }
    if (DOM.statsShareBtn) {
      DOM.statsShareBtn.addEventListener('click', () => {
        if (state.statsActiveTab === 'picture') {
          if (state.pictureDailyTarget) {
            sharePictureResult(state.pictureDailyTarget, state.pictureDailyGuesses.length, false);
          }
        } else if (state.statsActiveTab === 'emoji') {
          if (state.emojiDailyTarget) {
            shareEmojiResult(state.emojiDailyTarget, state.emojiDailyGuesses.length, false);
          }
        } else if (state.statsActiveTab === 'quote') {
          if (state.quoteDailyTarget) {
            shareQuoteResult(state.quoteDailyTarget, state.quoteDailyGuesses.length, false);
          }
        } else {
          if (state.targetMember) {
            shareResult(state.targetMember, state.guessesHistory.length, false);
          }
        }
      });
    }

    // Victory modal buttons & share action
    if (DOM.victoryPracticeBtn) {
      DOM.victoryPracticeBtn.addEventListener('click', () => {
        VictoryCelebration.stop();
        if (state.lastVictoryMode === 'picture') {
          if (state.pictureGameMode === 'daily') {
            switchToPicturePracticeMode();
          } else {
            pickNewPicturePracticeTarget();
          }
        } else if (state.lastVictoryMode === 'emoji') {
          if (state.emojiGameMode === 'daily') {
            switchToEmojiPracticeMode();
          } else {
            pickNewEmojiPracticeTarget();
          }
        } else if (state.lastVictoryMode === 'quote') {
          if (state.quoteGameMode === 'daily') {
            switchToQuotePracticeMode();
          } else {
            pickNewQuotePracticeTarget();
          }
        } else {
          if (state.gameMode === 'daily') {
            switchToPracticeMode();
          } else {
            pickNewPracticeTarget();
          }
        }
      });
    }

    if (DOM.shareResultBtn) {
      DOM.shareResultBtn.addEventListener('click', () => {
        if (state.lastVictoryMode === 'picture') {
          const lastPic = state.pictureTarget;
          const tries = getActivePictureHistory().length;
          if (lastPic) {
            sharePictureResult(lastPic, tries, state.pictureGameMode === 'practice');
          }
        } else if (state.lastVictoryMode === 'emoji') {
          const lastEmoji = state.emojiTarget;
          const tries = getActiveEmojiHistory().length;
          if (lastEmoji) {
            shareEmojiResult(lastEmoji, tries, state.emojiGameMode === 'practice');
          }
        } else if (state.lastVictoryMode === 'quote') {
          const lastQuote = state.quoteTarget;
          const tries = getActiveQuoteHistory().length;
          if (lastQuote) {
            shareQuoteResult(lastQuote, tries, state.quoteGameMode === 'practice');
          }
        } else {
          const lastMember = state.targetMember;
          const tries = getActiveHistory().length;
          if (lastMember) {
            shareResult(lastMember, tries, state.gameMode === 'practice');
          }
        }
      });
    }

    if (DOM.closeVictoryBtn) {
      DOM.closeVictoryBtn.addEventListener('click', () => {
        if (DOM.victoryModal) DOM.victoryModal.style.display = 'none';
      });
    }

    // Escape key closes modal or dropdown
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDropdown();
        closeQuoteDropdown();
        closeEmojiDropdown();
        closePictureDropdown();
        closeMembersModal();
        closeStatsModal();
        closeUpdateLogModal();
        if (DOM.victoryModal) DOM.victoryModal.style.display = 'none';
        if (DOM.casesRevealModal) closeCasesRevealModal();
        if (DOM.casesLightboxModal) closeCasesLightbox();
      }
    });

    // Cases Tab Switchers
    if (DOM.casesTabOpenBtn) {
      DOM.casesTabOpenBtn.addEventListener('click', () => {
        DOM.casesTabOpenBtn.classList.add('active-tab-btn');
        DOM.casesTabCollectionBtn.classList.remove('active-tab-btn');
        if (DOM.casesUnboxPanel) DOM.casesUnboxPanel.style.display = 'block';
        if (DOM.casesCollectionPanel) DOM.casesCollectionPanel.style.display = 'none';
        SoundFX.playSelect();
      });
    }

    if (DOM.casesTabCollectionBtn) {
      DOM.casesTabCollectionBtn.addEventListener('click', () => {
        DOM.casesTabCollectionBtn.classList.add('active-tab-btn');
        DOM.casesTabOpenBtn.classList.remove('active-tab-btn');
        if (DOM.casesUnboxPanel) DOM.casesUnboxPanel.style.display = 'none';
        if (DOM.casesCollectionPanel) DOM.casesCollectionPanel.style.display = 'block';
        updateCasesCollectionUI(state.caseActiveFilter || 'all');
        SoundFX.playSelect();
      });
    }

    // Open Case Buttons
    if (DOM.openCaseBtn) {
      DOM.openCaseBtn.addEventListener('click', () => startCaseOpening(false));
    }
    if (DOM.quickOpenCaseBtn) {
      DOM.quickOpenCaseBtn.addEventListener('click', () => startCaseOpening(true));
    }

    // Odds Grid Mode Toggle Buttons (Normal Open vs Fast Open)
    if (DOM.oddsToggleNormalBtn) {
      DOM.oddsToggleNormalBtn.addEventListener('click', () => {
        renderCasesOddsGrid('normal');
        SoundFX.playSelect();
      });
    }
    if (DOM.oddsToggleFastBtn) {
      DOM.oddsToggleFastBtn.addEventListener('click', () => {
        renderCasesOddsGrid('fast');
        SoundFX.playSelect();
      });
    }

    // Reveal Modal Actions
    if (DOM.casesOpenAnotherBtn) {
      DOM.casesOpenAnotherBtn.addEventListener('click', () => {
        closeCasesRevealModal();
        startCaseOpening(false);
      });
    }
    if (DOM.casesViewInCollectionBtn) {
      DOM.casesViewInCollectionBtn.addEventListener('click', () => {
        closeCasesRevealModal();
        if (DOM.casesTabCollectionBtn) DOM.casesTabCollectionBtn.click();
      });
    }
    if (DOM.casesCloseRevealBtn) {
      DOM.casesCloseRevealBtn.addEventListener('click', closeCasesRevealModal);
    }
    if (DOM.casesRevealModal) {
      DOM.casesRevealModal.addEventListener('click', (e) => {
        if (e.target === DOM.casesRevealModal) closeCasesRevealModal();
      });
    }

    // Lightbox Modal Actions
    if (DOM.closeLightboxBtn) {
      DOM.closeLightboxBtn.addEventListener('click', closeCasesLightbox);
    }
    if (DOM.lightboxDoneBtn) {
      DOM.lightboxDoneBtn.addEventListener('click', closeCasesLightbox);
    }
    if (DOM.casesLightboxModal) {
      DOM.casesLightboxModal.addEventListener('click', (e) => {
        if (e.target === DOM.casesLightboxModal) closeCasesLightbox();
      });
    }

    // Reset Collection
    if (DOM.resetCollectionBtn) {
      DOM.resetCollectionBtn.addEventListener('click', resetCasesCollection);
    }

    // Collection Sub-Tabs (All Items vs Albums)
    if (DOM.collViewAllBtn) {
      DOM.collViewAllBtn.addEventListener('click', () => {
        switchCollectionViewTab('all');
        SoundFX.playSelect();
      });
    }
    if (DOM.collViewAlbumsBtn) {
      DOM.collViewAlbumsBtn.addEventListener('click', () => {
        switchCollectionViewTab('albums');
        SoundFX.playSelect();
      });
    }
    if (DOM.collViewMilestonesBtn) {
      DOM.collViewMilestonesBtn.addEventListener('click', () => {
        switchCollectionViewTab('milestones');
        SoundFX.playSelect();
      });
    }
    if (DOM.backToAlbumsBtn) {
      DOM.backToAlbumsBtn.addEventListener('click', () => {
        state.activeAlbumId = null;
        if (DOM.albumDetailSection) DOM.albumDetailSection.style.display = 'none';
        if (DOM.albumsOverviewSection) DOM.albumsOverviewSection.style.display = 'block';
        renderAlbumsOverview();
        SoundFX.playSelect();
      });
    }

    // Quick example click buttons
    document.querySelectorAll('.quick-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        const name = tag.getAttribute('data-name');
        if (name) {
          DOM.input.value = name;
          DOM.clearBtn.style.display = 'block';
          DOM.input.focus();
          handleInputChange();
        }
      });
    });
  }

  // --- Autocomplete Search & Filtering ---
  function handleInputChange() {
    const query = DOM.input.value.trim().toLowerCase();
    
    DOM.clearBtn.style.display = query.length > 0 ? 'block' : 'none';

    if (query.length === 0) {
      closeDropdown();
      return;
    }

    const matches = findMatches(query);
    state.currentMatches = matches;
    state.selectedDropdownIndex = matches.length > 0 ? 0 : -1;
    renderDropdown(matches, query);
  }

  function findMatches(query, isQuoteMode = null) {
    const results = [];
    const useQuoteMode = isQuoteMode !== null ? isQuoteMode : (state.activeView === 'quote');
    const activeGuessed = useQuoteMode ? getActiveQuoteGuessedIds() : getActiveGuessedIds();

    state.members.forEach(member => {
      const primary = member.name.toLowerCase();
      const aliases = (member.aliases || []).map(a => a.toLowerCase());

      let score = 0;
      let matchedAlias = null;

      if (primary === query) {
        score = 100;
      } else if (aliases.includes(query)) {
        score = 90;
        matchedAlias = member.aliases[aliases.indexOf(query)];
      } else if (primary.startsWith(query)) {
        score = 80;
      } else {
        const matchedPrefixAlias = member.aliases.find(a => a.toLowerCase().startsWith(query));
        if (matchedPrefixAlias) {
          score = 70;
          matchedAlias = matchedPrefixAlias;
        } else if (primary.includes(query)) {
          score = 60;
        } else {
          const matchedContainsAlias = member.aliases.find(a => a.toLowerCase().includes(query));
          if (matchedContainsAlias) {
            score = 50;
            matchedAlias = matchedContainsAlias;
          }
        }
      }

      if (score > 0) {
        results.push({
          member,
          score,
          matchedAlias,
          isGuessed: activeGuessed.has(member.id)
        });
      }
    });

    results.sort((a, b) => {
      if (a.isGuessed !== b.isGuessed) {
        return a.isGuessed ? 1 : -1;
      }
      return b.score - a.score;
    });

    return results.slice(0, 12);
  }

  function renderDropdown(matches, query) {
    if (matches.length === 0) {
      DOM.dropdown.innerHTML = `
        <div class="no-match-item">
          <span>No Discord member found matching "<strong>${escapeHtml(query)}</strong>"</span>
        </div>
      `;
      DOM.dropdown.style.display = 'block';
      return;
    }

    let html = '';
    matches.forEach((item, idx) => {
      const { member, matchedAlias, isGuessed } = item;
      const isActive = idx === state.selectedDropdownIndex ? 'active-item' : '';
      const guessedClass = isGuessed ? 'already-guessed' : '';
      const imgSrc = getMemberImage(member);

      const highlightedName = highlightQuery(member.name, query);

      let aliasesHtml = '';
      if (member.aliases && member.aliases.length > 0) {
        const aliasItems = member.aliases.map(a => {
          if (matchedAlias && a.toLowerCase() === matchedAlias.toLowerCase()) {
            return `<span class="alias-match-tag">AKA: ${highlightQuery(a, query)}</span>`;
          }
          return `<span>${escapeHtml(a)}</span>`;
        }).join(', ');
        aliasesHtml = `<div class="item-aliases">${aliasItems}</div>`;
      }

      const statusBadge = isGuessed 
        ? `<span class="item-badge" style="opacity:0.6; color:#888;">GUESSED</span>` 
        : `<span class="item-badge">#${member.index || idx + 1}</span>`;

      html += `
        <div class="dropdown-item ${isActive} ${guessedClass}" data-index="${idx}" data-id="${member.id}">
          <div class="item-left">
            <div class="item-avatar">
              <img src="${escapeHtml(imgSrc)}" class="item-avatar-img" alt="" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='inline';" />
              <span class="item-avatar-fallback" style="display:none;">👤</span>
            </div>
            <div class="item-details">
              <span class="item-primary-name">${highlightedName}</span>
              ${aliasesHtml}
            </div>
          </div>
          <div class="item-right">
            ${statusBadge}
          </div>
        </div>
      `;
    });

    DOM.dropdown.innerHTML = html;
    DOM.dropdown.style.display = 'block';

    DOM.dropdown.querySelectorAll('.dropdown-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-index'), 10);
        selectMatchByIndex(idx);
      });
      el.addEventListener('mouseenter', () => {
        const idx = parseInt(el.getAttribute('data-index'), 10);
        updateActiveDropdownItem(idx);
      });
    });
  }

  function highlightQuery(text, query) {
    if (!query) return escapeHtml(text);
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return escapeHtml(text).replace(regex, '<span class="highlight-match">$1</span>');
  }

  function updateActiveDropdownItem(index) {
    state.selectedDropdownIndex = index;
    const items = DOM.dropdown.querySelectorAll('.dropdown-item');
    items.forEach((item, idx) => {
      if (idx === index) {
        item.classList.add('active-item');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('active-item');
      }
    });
  }

  function closeDropdown() {
    DOM.dropdown.style.display = 'none';
    state.selectedDropdownIndex = -1;
  }

  // --- Keyboard Navigation ---
  function handleInputKeydown(e) {
    const isDropdownVisible = DOM.dropdown && DOM.dropdown.style.display === 'block';
    if (!isDropdownVisible) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleGuessSubmit();
      }
      return;
    }

    const matchesCount = state.currentMatches.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (matchesCount === 0) return;
      const nextIndex = (state.selectedDropdownIndex + 1) % matchesCount;
      updateActiveDropdownItem(nextIndex);
      SoundFX.playSelect();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (matchesCount === 0) return;
      const prevIndex = (state.selectedDropdownIndex - 1 + matchesCount) % matchesCount;
      updateActiveDropdownItem(prevIndex);
      SoundFX.playSelect();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (state.selectedDropdownIndex >= 0 && state.selectedDropdownIndex < matchesCount) {
        selectMatchByIndex(state.selectedDropdownIndex);
      } else {
        handleGuessSubmit();
      }
    } else if (e.key === 'Tab') {
      if (state.selectedDropdownIndex >= 0 && state.selectedDropdownIndex < matchesCount) {
        e.preventDefault();
        selectMatchByIndex(state.selectedDropdownIndex);
      }
    }
  }

  function selectMatchByIndex(index) {
    const item = state.currentMatches[index];
    if (!item) return;

    DOM.input.value = item.member.name;
    closeDropdown();
    handleGuessSubmit();
  }

  // --- Handle Guess Submission ---
  function handleGuessSubmit() {
    const isDaily = state.gameMode === 'daily';
    if (isDaily ? state.isWon : state.practiceIsWon) {
      return;
    }

    const query = DOM.input.value.trim().toLowerCase();
    if (!query) {
      shakeInput();
      return;
    }

    const matchedMember = state.members.find(m => {
      if (m.name.toLowerCase() === query) return true;
      if (m.aliases && m.aliases.some(a => a.toLowerCase() === query)) return true;
      return false;
    });

    if (!matchedMember) {
      shakeInput();
      SoundFX.playError();
      return;
    }

    const activeGuessed = getActiveGuessedIds();
    if (activeGuessed.has(matchedMember.id)) {
      pulseAlreadyGuessed(matchedMember.id);
      SoundFX.playError();
      DOM.input.value = '';
      DOM.clearBtn.style.display = 'none';
      closeDropdown();
      return;
    }

    logGuess(matchedMember, true);

    DOM.input.value = '';
    DOM.clearBtn.style.display = 'none';
    closeDropdown();
    DOM.input.focus();
  }

  function logGuess(member, playSound = true) {
    const isDaily = state.gameMode === 'daily';

    if (isDaily) {
      state.guessedIds.add(member.id);
      state.guessesHistory.unshift(member);
    } else {
      state.practiceGuessedIds.add(member.id);
      state.practiceHistory.unshift(member);
    }

    updateGuessCounter();

    if (DOM.categoryColumnsHeader) {
      DOM.categoryColumnsHeader.style.display = 'grid';
    }

    if (DOM.emptyState && DOM.emptyState.parentNode) {
      DOM.emptyState.parentNode.removeChild(DOM.emptyState);
    }

    const currentHistory = isDaily ? state.guessesHistory : state.practiceHistory;
    const guessNumber = currentHistory.length;
    const card = createGuessCard(member, guessNumber);
    DOM.guessesList.prepend(card);

    const target = state.targetMember || member;
    const isTarget = member.id === target.id;

    if (isDaily) {
      DailyStateManager.save(state.currentDateKey, state.gameNumber, state.dailyTargetMember, state.guessesHistory, isTarget || state.isWon);
    }

    // Win condition check
    if (isTarget) {
      if (isDaily) {
        state.isWon = true;
        const stats = StatsManager.recordWin(guessNumber, state.currentDateKey);
        updateStatsUI(stats);
        setDailySolvedUI(true);
      } else {
        state.practiceIsWon = true;
        if (target) {
          state.practiceSolvedIds.add(target.id);
        }
        updatePracticeUI();
      }

      if (playSound) {
        setTimeout(() => triggerVictory(member, guessNumber, true), 1300);
      } else {
        setTimeout(() => {
          const winRow = DOM.guessesList ? DOM.guessesList.querySelector(`[data-id="${member.id}"]`) : null;
          if (winRow) winRow.classList.add('winning-row-glow');
        }, 100);
      }
    } else if (playSound) {
      SoundFX.playGuessSuccess();
    }
  }

  // --- Create LoLdle Square Tiles Row ---
  function createGuessCard(member, guessNumber) {
    const row = document.createElement('div');
    row.className = 'guess-card-row';
    row.setAttribute('data-id', member.id);

    const target = state.targetMember || member;
    const isTarget = member.id === target.id;

    const guessCats = member.categories || {};
    const targetCats = target.categories || {};

    const avatarImgSrc = getMemberImage(member);
    const isCorrectChampion = isTarget ? 'correct-champion' : '';

    // Category-specific comparison rules
    const cmpSpol = compareSpol(guessCats.spol, targetCats.spol);
    const cmpLokacija = compareLokacija(guessCats.lokacija, targetCats.lokacija);
    const cmpStatus = compareStatus(guessCats.status, targetCats.status);
    const cmpDolazak = compareYear(guessCats.dolazak_na_server, targetCats.dolazak_na_server);
    const cmpKilaza = compareKilaza(guessCats.kilaza, targetCats.kilaza);
    const cmpOkupacija = compareOkupacija(guessCats.okupacija, targetCats.okupacija);
    const cmpAktivnost = compareAktivnost(guessCats.aktivnost, targetCats.aktivnost);

    function buildTile(val, cmpResult, label) {
      const displayVal = (val && String(val).trim().length > 0) ? escapeHtml(String(val).trim()) : '-';
      const statusClass = `tile-${cmpResult.status}`;
      let arrowHtml = '';

      if (cmpResult.arrow === 'up') {
        arrowHtml = `
          <svg class="tile-arrow-bg" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 4l-8 8h5v8h6v-8h5z"/>
          </svg>
        `;
      } else if (cmpResult.arrow === 'down') {
        arrowHtml = `
          <svg class="tile-arrow-bg" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 20l8-8h-5V4h-6v8H4z"/>
          </svg>
        `;
      }

      return `
        <div class="guess-tile ${statusClass}" title="${label}: ${displayVal}">
          ${arrowHtml}
          <span class="tile-content-text">${displayVal}</span>
        </div>
      `;
    }

    row.innerHTML = `
      <!-- 1. Champion / Member Portrait Square -->
      <div class="guess-tile tile-avatar-square ${isCorrectChampion}" title="Member: ${escapeHtml(member.name)}">
        <div class="tile-avatar-fallback">
          <img 
            src="${escapeHtml(avatarImgSrc)}" 
            alt="${escapeHtml(member.name)}" 
            class="tile-avatar-img"
            onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='flex';"
          />
          <div style="display:none; width:100%; height:100%; flex-direction:column; align-items:center; justify-content:center;">
            <span class="tile-avatar-silhouette">👤</span>
            <span class="tile-avatar-caption">${escapeHtml(member.name)}</span>
          </div>
        </div>
      </div>

      <!-- 2. Spol -->
      ${buildTile(guessCats.spol, cmpSpol, 'Spol')}

      <!-- 3. Lokacija -->
      ${buildTile(guessCats.lokacija, cmpLokacija, 'Lokacija')}

      <!-- 4. Status -->
      ${buildTile(guessCats.status, cmpStatus, 'Status')}

      <!-- 5. Dolazak na server -->
      ${buildTile(guessCats.dolazak_na_server, cmpDolazak, 'Dolazak')}

      <!-- 6. Kilaža (Higher / Lower Arrow) -->
      ${buildTile(guessCats.kilaza, cmpKilaza, 'Kilaža')}

      <!-- 7. Okupacija -->
      ${buildTile(guessCats.okupacija, cmpOkupacija, 'Okupacija')}

      <!-- 8. Aktivnost -->
      ${buildTile(guessCats.aktivnost, cmpAktivnost, 'Aktivnost')}
    `;

    return row;
  }

  // --- Floating Toast Notifications ---
  let toastTimeout = null;
  function showToast(message) {
    const toast = DOM.gameToast || document.getElementById('gameToast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('toast-visible');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('toast-visible');
    }, 2800);
  }

  // --- Share Result Generator (Wordle Style Emojis) ---
  function shareResult(member, tries, isPractice = false) {
    const dayInfo = getLocalDayInfo();
    const title = isPractice 
      ? `🎯 ANTISIMPDLE #Practice` 
      : `🎯 ANTISIMPDLE #${dayInfo.gameNumber}`;

    const currentHistory = isPractice ? state.practiceHistory : state.guessesHistory;
    let gridEmojis = '';
    // Reverse guesses history so oldest is on top, winning guess is at bottom
    const inOrder = [...currentHistory].reverse();

    inOrder.forEach(g => {
      const isTarget = g.id === state.targetMember.id;
      const gCats = g.categories || {};
      const tCats = state.targetMember.categories || {};

      const cmpSpol = compareSpol(gCats.spol, tCats.spol);
      const cmpLok = compareLokacija(gCats.lokacija, tCats.lokacija);
      const cmpStat = compareStatus(gCats.status, tCats.status);
      const cmpDol = compareYear(gCats.dolazak_na_server, tCats.dolazak_na_server);
      const cmpKil = compareKilaza(gCats.kilaza, tCats.kilaza);
      const cmpOkup = compareOkupacija(gCats.okupacija, tCats.okupacija);
      const cmpAkt = compareAktivnost(gCats.aktivnost, tCats.aktivnost);

      function toEmoji(res) {
        if (res.arrow === 'up') return '⬆️';
        if (res.arrow === 'down') return '⬇️';
        if (res.status === 'correct') return '🟩';
        if (res.status === 'partial') return '🟨';
        return '🟥';
      }

      const row = [
        isTarget ? '🟩' : '⬛',
        toEmoji(cmpSpol),
        toEmoji(cmpLok),
        toEmoji(cmpStat),
        toEmoji(cmpDol),
        toEmoji(cmpKil),
        toEmoji(cmpOkup),
        toEmoji(cmpAkt)
      ].join('');

      gridEmojis += row + '\n';
    });

    const webUrl = (window.location.origin && !window.location.origin.startsWith('file'))
      ? `${window.location.origin}${window.location.pathname}`
      : 'Antisimpdle';

    const shareText = `${title}\n👑 Member: ${member.name}\n🔥 Solved in ${tries} ${tries === 1 ? 'try' : 'tries'}!\n\n${gridEmojis.trim()}\nPlay: ${webUrl}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText)
        .then(() => {
          showToast('📋 Copied victory result to clipboard!');
          SoundFX.playTone(880, 'sine', 0.12, 0.08);
        })
        .catch(() => fallbackCopy(shareText));
    } else {
      fallbackCopy(shareText);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      showToast('📋 Copied victory result to clipboard!');
      SoundFX.playTone(880, 'sine', 0.12, 0.08);
    } catch (e) {
      showToast('⚠️ Could not copy result');
    }
    document.body.removeChild(ta);
  }

  // --- Epic Victory Celebration Trigger ---
  function triggerVictory(member, tries, playFanfare = true) {
    if (playFanfare) {
      // 1. Play epic multi-voice audio fanfare
      SoundFX.playWin();

      // 2. Screen flash & visceral camera rumble
      if (DOM.victoryFlash) {
        DOM.victoryFlash.classList.remove('flash-active');
        void DOM.victoryFlash.offsetWidth; // Force CSS reflow
        DOM.victoryFlash.classList.add('flash-active');
        setTimeout(() => {
          if (DOM.victoryFlash) DOM.victoryFlash.classList.remove('flash-active');
        }, 900);
      }
      document.body.classList.add('screen-rumble');
      setTimeout(() => document.body.classList.remove('screen-rumble'), 450);

      // 3. Start Firework & Confetti Canvas particle system
      VictoryCelebration.start();
    }

    // 4. Highlight winning row on the guess board
    const winningRow = DOM.guessesList ? DOM.guessesList.querySelector(`[data-id="${member.id}"]`) : null;
    if (winningRow) {
      winningRow.classList.add('winning-row-glow');
    }

    // 5. Populate and show Victory Modal
    state.lastVictoryMode = 'classic';
    if (DOM.victoryQuoteBox) DOM.victoryQuoteBox.style.display = 'none';
    if (DOM.victoryEmojiBox) DOM.victoryEmojiBox.style.display = 'none';
    if (DOM.victoryPictureBox) DOM.victoryPictureBox.style.display = 'none';
    if (DOM.victoryMultiMembers) DOM.victoryMultiMembers.style.display = 'none';
    if (DOM.victoryMemberCard) DOM.victoryMemberCard.style.display = 'flex';
    if (DOM.victoryCountdownCard) {
      const label = DOM.victoryCountdownCard.querySelector('.countdown-card-label');
      if (label) label.textContent = 'NEXT DAILY MEMBER IN';
    }

    const isDaily = state.gameMode === 'daily';
    if (DOM.victoryHeading) {
      DOM.victoryHeading.textContent = isDaily ? `VICTORY! DAILY #${state.gameNumber}` : 'PRACTICE SOLVED!';
    }
    if (DOM.victorySubtitle) {
      DOM.victorySubtitle.textContent = isDaily 
        ? "You correctly guessed today's secret Discord member!" 
        : 'You solved this practice member!';
    }
    if (DOM.victoryAvatar) {
      const imgSrc = getMemberImage(member);
      DOM.victoryAvatar.innerHTML = `
        <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(member.name)}" class="victory-avatar-img" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='inline';" />
        <span class="victory-avatar-fallback" style="display:none;">👑</span>
      `;
    }
    if (DOM.victoryMemberName) {
      DOM.victoryMemberName.textContent = member.name;
    }
    if (DOM.victoryAliases) {
      const aliasStr = member.aliases && member.aliases.length > 0 ? member.aliases.join(', ') : 'None';
      DOM.victoryAliases.textContent = `Aliases: ${aliasStr}`;
    }
    if (DOM.victoryGuessCount) {
      DOM.victoryGuessCount.textContent = `Guessed in ${tries} ${tries === 1 ? 'try' : 'tries'}!`;
    }

    // Wordle Countdown & Stats in Victory Modal
    if (DOM.victoryCountdownCard) {
      DOM.victoryCountdownCard.style.display = isDaily ? 'block' : 'none';
    }
    if (DOM.victoryStatsRow) {
      DOM.victoryStatsRow.style.display = isDaily ? 'grid' : 'none';
      if (isDaily) {
        const stats = StatsManager.get();
        if (DOM.vstatPlayed) DOM.vstatPlayed.textContent = stats.played;
        if (DOM.vstatWinPct) {
          const pct = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
          DOM.vstatWinPct.textContent = pct + '%';
        }
        if (DOM.vstatStreak) DOM.vstatStreak.textContent = '🔥 ' + stats.currentStreak;
        if (DOM.vstatMaxStreak) DOM.vstatMaxStreak.textContent = '⭐ ' + stats.maxStreak;
      }
    }

    if (DOM.victoryPracticeBtn) {
      DOM.victoryPracticeBtn.innerHTML = isDaily 
        ? '<span>🎲 PRACTICE MODE (UNLIMITED)</span>' 
        : '<span>🔄 NEXT PRACTICE MEMBER</span>';
    }

    if (DOM.victoryModal) {
      DOM.victoryModal.style.display = 'flex';
    }
  }

  function updateGuessCounter() {
    const count = state.gameMode === 'daily' ? state.guessesHistory.length : state.practiceHistory.length;
    if (DOM.guessCountBadge) {
      DOM.guessCountBadge.textContent = `${count} ${count === 1 ? 'Guess' : 'Guesses'}`;
    }
  }

  function shakeInput() {
    DOM.input.style.animation = 'none';
    DOM.input.offsetHeight;
    DOM.input.style.borderColor = '#ff2a55';
    DOM.input.style.boxShadow = '0 0 20px #ff2a55';

    setTimeout(() => {
      DOM.input.style.borderColor = '';
      DOM.input.style.boxShadow = '';
    }, 400);
  }

  function pulseAlreadyGuessed(id) {
    const card = DOM.guessesList.querySelector(`[data-id="${id}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.style.transition = 'all 0.2s ease';
      card.style.transform = 'scale(1.03)';
      card.style.borderColor = '#f7d57f';
      card.style.boxShadow = '0 0 25px rgba(247, 213, 127, 0.8)';

      setTimeout(() => {
        card.style.transform = '';
        card.style.borderColor = '';
        card.style.boxShadow = '';
      }, 700);
    }
  }

  // ==========================================================================
  // QUOTE GAME MODE ENGINE (Server Quotes & Conversations)
  // ==========================================================================

  // --- Quote Mode Data Loading ---
  function loadQuotesData() {
    if (window.QUOTES_DATA && Array.isArray(window.QUOTES_DATA)) {
      setQuotes(window.QUOTES_DATA);
      return;
    }

    fetch('quotes.json')
      .then(res => res.json())
      .then(data => {
        setQuotes(data);
      })
      .catch(err => {
        console.error('Error fetching quotes.json:', err);
      });
  }

  function setQuotes(data) {
    state.quotes = data;
    initDailyQuoteGame();
  }

  // --- Daily Quote Game Setup & Session Restoration ---
  function initDailyQuoteGame() {
    if (!state.quotes || state.quotes.length === 0) return;

    const dayInfo = getLocalDayInfo();
    state.quoteDailyTarget = getDailyQuote(dayInfo.dayIndex, state.quotes);
    state.quoteTarget = state.quoteDailyTarget;

    if (DOM.quoteDailyNum) DOM.quoteDailyNum.textContent = dayInfo.gameNumber;
    if (DOM.quoteCardBadge) DOM.quoteCardBadge.textContent = 'DAILY #' + dayInfo.gameNumber;

    // Attempt to restore quote daily save
    const saved = QuoteDailyStateManager.load(dayInfo.dateKey);
    if (saved && Array.isArray(saved.guesses) && saved.guesses.length > 0) {
      state.quoteDailyGuesses = [];
      state.quoteDailyGuessedIds.clear();
      state.quoteDailyFoundMemberIds = new Set(saved.foundMemberIds || []);
      state.quoteDailyRevealedClues = new Set(saved.revealedClues || []);
      state.quoteDailyIsWon = !!saved.isWon;

      // Re-log guesses in order (oldest first)
      const inOrder = [...saved.guesses].reverse();
      inOrder.forEach(item => {
        logQuoteGuess(item.member, item.result, false);
      });

      renderQuoteDisplay(state.quoteDailyTarget, state.quoteDailyFoundMemberIds, state.quoteDailyIsWon);

      if (state.quoteDailyIsWon) {
        setQuoteDailySolvedUI(true);
      }
    } else {
      state.quoteDailyGuesses = [];
      state.quoteDailyGuessedIds.clear();
      state.quoteDailyFoundMemberIds = new Set();
      state.quoteDailyRevealedClues = new Set();
      state.quoteDailyIsWon = false;
      renderQuoteBoardFromState([]);
      renderQuoteDisplay(state.quoteDailyTarget, state.quoteDailyFoundMemberIds, false);
      setQuoteDailySolvedUI(false);
    }
  }

  function handleQuoteMidnightRollover(dayInfo) {
    if (!state.quotes || state.quotes.length === 0) return;
    state.quoteDailyTarget = getDailyQuote(dayInfo.dayIndex, state.quotes);

    if (DOM.quoteDailyNum) DOM.quoteDailyNum.textContent = dayInfo.gameNumber;
    if (DOM.quoteCardBadge) DOM.quoteCardBadge.textContent = 'DAILY #' + dayInfo.gameNumber;

    QuoteDailyStateManager.clear();
    state.quoteDailyGuesses = [];
    state.quoteDailyGuessedIds.clear();
    state.quoteDailyFoundMemberIds = new Set();
    state.quoteDailyRevealedClues = new Set();
    state.quoteDailyIsWon = false;

    if (state.quoteGameMode === 'daily') {
      state.quoteTarget = state.quoteDailyTarget;
      renderQuoteBoardFromState([]);
      renderQuoteDisplay(state.quoteDailyTarget, state.quoteDailyFoundMemberIds, false);
      setQuoteDailySolvedUI(false);
    }
  }

  // --- Render Central Quote Display Card ---
  function renderQuoteDisplay(quote, foundMemberIds, isSolved) {
    if (!quote) return;
    const isConv = quote.type === 'conversation';
    foundMemberIds = foundMemberIds || new Set();

    // Type pill
    if (DOM.quoteTypePill) {
      if (isConv) {
        DOM.quoteTypePill.className = 'quote-type-pill conversation-pill';
        if (DOM.quoteTypeIcon) DOM.quoteTypeIcon.textContent = '💬';
        if (DOM.quoteTypeLabel) DOM.quoteTypeLabel.textContent = `CONVERSATION (${quote.requiredMemberIds.length} SPEAKERS)`;
      } else {
        DOM.quoteTypePill.className = 'quote-type-pill';
        if (DOM.quoteTypeIcon) DOM.quoteTypeIcon.textContent = '❝';
        if (DOM.quoteTypeLabel) DOM.quoteTypeLabel.textContent = 'SERVER QUOTE';
      }
    }

    // Header hint
    if (DOM.quoteHeaderHint) {
      DOM.quoteHeaderHint.textContent = isConv 
        ? `Who are in this conversation? Guess all ${quote.requiredMemberIds.length} members!` 
        : 'Who said this quote? Guess the server member!';
    }

    // Conversation Speaker Tracker
    if (DOM.convSpeakersTracker) {
      if (isConv) {
        DOM.convSpeakersTracker.style.display = 'block';
        const foundCount = quote.requiredMemberIds.filter(id => foundMemberIds.has(id)).length;
        const totalCount = quote.requiredMemberIds.length;
        if (DOM.trackerProgress) {
          DOM.trackerProgress.textContent = `${foundCount} / ${totalCount} FOUND`;
        }

        if (DOM.trackerChips) {
          let chipsHtml = '';
          quote.requiredMemberIds.forEach((mid, idx) => {
            const member = state.members.find(m => m.id === mid) || { id: mid, name: quote.requiredMemberNames[idx] || mid };
            const isFound = foundMemberIds.has(mid);
            const imgSrc = getMemberImage(member);

            if (isFound) {
              chipsHtml += `
                <div class="tracker-chip found" title="${escapeHtml(member.name)}">
                  <div class="tracker-chip-avatar">
                    <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(member.name)}" onerror="this.style.display='none';" />
                  </div>
                  <span class="tracker-chip-name">${escapeHtml(member.name)} ✓</span>
                </div>
              `;
            } else {
              chipsHtml += `
                <div class="tracker-chip" title="Speaker ${idx + 1} not yet found">
                  <div class="tracker-chip-avatar">?</div>
                  <span class="tracker-chip-name">Speaker ${idx + 1}</span>
                </div>
              `;
            }
          });
          DOM.trackerChips.innerHTML = chipsHtml;
        }
      } else {
        DOM.convSpeakersTracker.style.display = 'none';
      }
    }

    // Main Content Area
    if (DOM.quoteContentArea) {
      if (isConv) {
        // Conversation Dialogue Stream
        let dialogueHtml = '<div class="dialogue-stream">';
        
        // Map unique member ID to speaker number for consistency
        const speakerNumbers = {};
        quote.requiredMemberIds.forEach((mid, i) => {
          speakerNumbers[mid] = i + 1;
        });

        quote.dialogue.forEach(line => {
          const isLineFound = foundMemberIds.has(line.authorId) || isSolved;
          const member = state.members.find(m => m.id === line.authorId) || { id: line.authorId, name: line.authorName, image: line.authorImage };
          const imgSrc = getMemberImage(member);
          const speakerNum = speakerNumbers[line.authorId] || 1;

          dialogueHtml += `
            <div class="dialogue-bubble ${isLineFound ? 'revealed' : ''}">
              <div class="dialogue-avatar">
                ${isLineFound 
                  ? `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(member.name)}" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='inline';" /><span style="display:none;">👤</span>` 
                  : `<span>?</span>`}
              </div>
              <div class="dialogue-body">
                <div class="dialogue-header">
                  <span class="dialogue-speaker-name">${isLineFound ? escapeHtml(member.name) : `Speaker ${speakerNum}`}</span>
                  ${isLineFound ? `<span class="dialogue-verified-badge">✓ FOUND</span>` : ''}
                </div>
                <div class="dialogue-text">"${escapeHtml(line.text)}"</div>
              </div>
            </div>
          `;
        });
        dialogueHtml += '</div>';
        DOM.quoteContentArea.innerHTML = dialogueHtml;
      } else {
        // Single Quote
        const quoteText = quote.dialogue[0] ? quote.dialogue[0].text : '';
        DOM.quoteContentArea.innerHTML = `
          <div class="single-quote-wrap">
            <p class="single-quote-text">"${escapeHtml(quoteText)}"</p>
          </div>
        `;
      }
    }

    // Author Reveal Area (Single Quote)
    if (DOM.quoteAuthorReveal) {
      if (!isConv) {
        DOM.quoteAuthorReveal.style.display = 'block';
        if (isSolved) {
          const authorId = quote.requiredMemberIds[0];
          const member = state.members.find(m => m.id === authorId) || { id: authorId, name: quote.dialogue[0].authorName, image: quote.dialogue[0].authorImage };
          const imgSrc = getMemberImage(member);
          DOM.quoteAuthorReveal.innerHTML = `
            <div class="quote-author-revealed">
              <img src="${escapeHtml(imgSrc)}" class="revealed-avatar" alt="${escapeHtml(member.name)}" onerror="this.style.display='none';" />
              <span class="revealed-name">— ${escapeHtml(member.name)}</span>
            </div>
          `;
        } else {
          DOM.quoteAuthorReveal.innerHTML = `
            <div class="quote-author-mystery">
              <span class="mystery-avatar">?</span>
              <span class="mystery-name">Who said this?</span>
            </div>
          `;
        }
      } else {
        DOM.quoteAuthorReveal.style.display = 'none';
      }
    }

    renderQuoteClues();
  }

  // --- Quote Clues & Hints Logic ---
  function renderQuoteClues() {
    if (!DOM.quoteCluesContainer) return;
    const quote = state.quoteTarget;
    if (!quote) {
      DOM.quoteCluesContainer.style.display = 'none';
      return;
    }
    DOM.quoteCluesContainer.style.display = 'block';

    const history = getActiveQuoteHistory();
    const guessCount = history.length;
    const revealedClues = getActiveQuoteRevealedClues();
    const foundIds = getActiveQuoteFoundIds();

    const cluesConfig = [
      { index: 1, reqGuesses: 5, icon: '📍', label: 'LOCATION' },
      { index: 2, reqGuesses: 7, icon: '📅', label: 'JOINED SERVER' },
      { index: 3, reqGuesses: 10, icon: '🔤', label: 'FIRST LETTER' }
    ];

    const speakerMembers = quote.requiredMemberIds.map(id => {
      return state.members.find(m => m.id === id) || { 
        id, 
        name: id, 
        categories: { lokacija: '?', dolazak_na_server: '?' } 
      };
    });

    function getClueValue(clueIndex) {
      if (quote.type === 'conversation') {
        return speakerMembers.map((m, idx) => {
          const speakerTag = foundIds.has(m.id) ? m.name : `Speaker ${idx + 1}`;
          if (clueIndex === 1) {
            return `${speakerTag}: ${m.categories?.lokacija || '?'}`;
          } else if (clueIndex === 2) {
            return `${speakerTag}: ${m.categories?.dolazak_na_server || '?'}`;
          } else {
            const letter = (m.name || '').trim().charAt(0).toUpperCase() || '?';
            return `${speakerTag}: '${letter}'`;
          }
        }).join(' • ');
      } else {
        const m = speakerMembers[0] || { categories: {}, name: '' };
        if (clueIndex === 1) {
          return m.categories?.lokacija || 'Unknown';
        } else if (clueIndex === 2) {
          return m.categories?.dolazak_na_server || 'Unknown';
        } else {
          const letter = (m.name || '').trim().charAt(0).toUpperCase() || '?';
          return `Starts with '${letter}'`;
        }
      }
    }

    let unlockedCount = 0;

    cluesConfig.forEach(cfg => {
      const card = document.getElementById(`quoteClue${cfg.index}`);
      if (!card) return;

      const isAvailable = guessCount >= cfg.reqGuesses;
      const isRevealed = revealedClues.has(cfg.index);
      if (isAvailable) unlockedCount++;

      card.classList.remove('locked', 'available', 'revealed');

      if (isRevealed) {
        card.classList.add('revealed');
        const val = getClueValue(cfg.index);
        card.innerHTML = `
          <div class="clue-card-content">
            <div class="clue-header-badge">
              <span class="clue-icon">${cfg.icon}</span>
              <span class="clue-tag">${cfg.label}</span>
            </div>
            <div class="clue-value-text" title="${escapeHtml(val)}">${escapeHtml(val)}</div>
          </div>
        `;
      } else if (isAvailable) {
        card.classList.add('available');
        card.innerHTML = `
          <div class="clue-card-content">
            <div class="clue-header-badge">
              <span class="clue-icon">${cfg.icon}</span>
              <span class="clue-tag">${cfg.label}</span>
            </div>
            <div class="clue-cta-text">
              <span class="clue-tap-icon">✨</span>
              <span>CLICK TO REVEAL</span>
            </div>
          </div>
        `;
      } else {
        card.classList.add('locked');
        card.innerHTML = `
          <div class="clue-card-content">
            <div class="clue-header-badge">
              <span class="clue-lock-icon">🔒</span>
              <span class="clue-tag">${cfg.label}</span>
            </div>
            <div class="clue-lock-sub">
              <span>Unlocks at ${cfg.reqGuesses} guesses</span>
              <span class="clue-progress-tag">${guessCount}/${cfg.reqGuesses}</span>
            </div>
          </div>
        `;
      }
    });

    if (DOM.quoteCluesCounter) {
      DOM.quoteCluesCounter.textContent = `${unlockedCount} / 3 Available`;
    }
  }

  function handleQuoteClueClick(clueIndex) {
    const quote = state.quoteTarget;
    if (!quote) return;

    const history = getActiveQuoteHistory();
    const guessCount = history.length;
    const revealedClues = getActiveQuoteRevealedClues();

    const thresholds = { 1: 5, 2: 7, 3: 10 };
    const reqGuesses = thresholds[clueIndex];

    const card = document.getElementById(`quoteClue${clueIndex}`);

    if (guessCount < reqGuesses) {
      if (card) {
        card.classList.remove('clue-shake');
        void card.offsetWidth;
        card.classList.add('clue-shake');
        setTimeout(() => card.classList.remove('clue-shake'), 400);
      }
      SoundFX.playError();
      const need = reqGuesses - guessCount;
      showToast(`🔒 Clue ${clueIndex} unlocks after ${reqGuesses} guesses! (${need} more needed)`);
      return;
    }

    if (revealedClues.has(clueIndex)) {
      SoundFX.playSelect();
      return;
    }

    revealedClues.add(clueIndex);
    SoundFX.playClueReveal();

    if (state.quoteGameMode === 'daily') {
      QuoteDailyStateManager.save(
        state.currentDateKey,
        state.gameNumber,
        quote.id,
        state.quoteDailyGuesses,
        state.quoteDailyFoundMemberIds,
        state.quoteDailyIsWon,
        state.quoteDailyRevealedClues
      );
    }

    renderQuoteClues();

    const updatedCard = document.getElementById(`quoteClue${clueIndex}`);
    if (updatedCard) {
      updatedCard.classList.add('clue-just-revealed');
      setTimeout(() => updatedCard.classList.remove('clue-just-revealed'), 700);
    }
  }

  // --- Render Quote Guesses Board ---
  function renderQuoteBoardFromState(history) {
    if (!DOM.quoteGuessesList) return;
    DOM.quoteGuessesList.innerHTML = '';

    if (!history || history.length === 0) {
      if (DOM.quoteEmptyGuessesState) DOM.quoteGuessesList.appendChild(DOM.quoteEmptyGuessesState);
      updateQuoteGuessCounter();
      return;
    }

    const inOrder = [...history].reverse();
    inOrder.forEach(item => {
      const card = createQuoteGuessCard(item.member, item.result, item.detail);
      DOM.quoteGuessesList.prepend(card);
    });

    updateQuoteGuessCounter();
  }

  function createQuoteGuessCard(member, result, detail) {
    const card = document.createElement('div');
    card.className = `quote-guess-card status-${result}`;
    card.setAttribute('data-id', member.id);

    const imgSrc = getMemberImage(member);
    const aliasStr = member.aliases && member.aliases.length > 0 ? member.aliases.join(', ') : '';

    let badgeClass = 'badge-incorrect';
    let badgeText = 'INCORRECT ✕';

    if (result === 'correct') {
      badgeClass = 'badge-correct';
      badgeText = 'CORRECT! ✓';
    } else if (result === 'speaker-found') {
      badgeClass = 'badge-found';
      badgeText = detail ? `SPEAKER FOUND! (${detail}) ✓` : 'SPEAKER FOUND! ✓';
    } else if (result === 'already-found') {
      badgeClass = 'badge-already';
      badgeText = 'ALREADY FOUND';
    }

    card.innerHTML = `
      <div class="quote-guess-left">
        <div class="quote-guess-avatar">
          <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(member.name)}" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='inline';" />
          <span style="display:none;">👤</span>
        </div>
        <div class="quote-guess-meta">
          <span class="quote-guess-name">${escapeHtml(member.name)}</span>
          ${aliasStr ? `<span class="quote-guess-sub">AKA: ${escapeHtml(aliasStr)}</span>` : ''}
        </div>
      </div>
      <div class="quote-guess-right">
        <span class="quote-guess-badge ${badgeClass}">${badgeText}</span>
      </div>
    `;

    return card;
  }

  function updateQuoteGuessCounter() {
    const history = getActiveQuoteHistory();
    if (DOM.quoteGuessCountBadge) {
      DOM.quoteGuessCountBadge.textContent = `${history.length} ${history.length === 1 ? 'Guess' : 'Guesses'}`;
    }
  }

  function setQuoteDailySolvedUI(isSolved) {
    if (state.quoteGameMode !== 'daily') return;

    if (isSolved) {
      if (DOM.alreadySolvedQuoteBanner) DOM.alreadySolvedQuoteBanner.style.display = 'flex';
      if (DOM.quoteMemberInput) {
        DOM.quoteMemberInput.disabled = true;
        DOM.quoteMemberInput.placeholder = "👑 Today's quote solved! Resets at midnight.";
      }
      if (DOM.quoteGuessBtn) DOM.quoteGuessBtn.disabled = true;
      if (DOM.quoteCardBadge) {
        DOM.quoteCardBadge.textContent = '✅ SOLVED TODAY';
        DOM.quoteCardBadge.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
        DOM.quoteCardBadge.style.color = '#ffffff';
      }
    } else {
      if (DOM.alreadySolvedQuoteBanner) DOM.alreadySolvedQuoteBanner.style.display = 'none';
      if (DOM.quoteMemberInput) {
        DOM.quoteMemberInput.disabled = false;
        DOM.quoteMemberInput.placeholder = 'Guess who said it... (e.g. lara, vito, krof, lean)';
      }
      if (DOM.quoteGuessBtn) DOM.quoteGuessBtn.disabled = false;
      if (DOM.quoteCardBadge) {
        DOM.quoteCardBadge.textContent = 'DAILY #' + state.gameNumber;
        DOM.quoteCardBadge.style.background = '';
        DOM.quoteCardBadge.style.color = '';
      }
    }
  }

  // --- Quote Practice Mode ---
  function toggleQuotePracticeMode() {
    if (state.quoteGameMode === 'daily') {
      switchToQuotePracticeMode();
    } else {
      returnToQuoteDailyMode();
    }
  }

  function switchToQuotePracticeMode() {
    state.quoteGameMode = 'practice';
    if (!state.quotePracticeTarget || state.quotePracticeIsWon) {
      pickNewQuotePracticeTarget();
    } else {
      state.quoteTarget = state.quotePracticeTarget;
      renderQuoteBoardFromState(state.quotePracticeGuesses);
      renderQuoteDisplay(state.quotePracticeTarget, state.quotePracticeFoundMemberIds, state.quotePracticeIsWon);
      updateQuotePracticeUI();
    }
    SoundFX.playSelect();
  }

  function pickNewQuotePracticeTarget() {
    if (!state.quotes || state.quotes.length === 0) return;
    let pool = state.quotes.filter(q => 
      (!state.quoteDailyTarget || q.id !== state.quoteDailyTarget.id) &&
      (!state.quotePracticeTarget || q.id !== state.quotePracticeTarget.id) &&
      !state.quotePracticeSolvedIds.has(q.id)
    );

    // If all practice quotes have been solved in this session, reset the pool cycle
    if (pool.length === 0) {
      state.quotePracticeSolvedIds.clear();
      pool = state.quotes.filter(q => 
        (!state.quoteDailyTarget || q.id !== state.quoteDailyTarget.id) &&
        (!state.quotePracticeTarget || q.id !== state.quotePracticeTarget.id)
      );
      showToast('🔁 All quotes solved! Resetting practice pool.');
    }

    const chosen = pool[Math.floor(Math.random() * pool.length)] || state.quotes[0];

    state.quotePracticeTarget = chosen;
    state.quoteTarget = chosen;
    state.quotePracticeGuesses = [];
    state.quotePracticeGuessedIds.clear();
    state.quotePracticeFoundMemberIds.clear();
    state.quotePracticeRevealedClues.clear();
    state.quotePracticeIsWon = false;

    renderQuoteBoardFromState([]);
    renderQuoteDisplay(chosen, state.quotePracticeFoundMemberIds, false);
    updateQuotePracticeUI();

    if (DOM.alreadySolvedQuoteBanner) DOM.alreadySolvedQuoteBanner.style.display = 'none';
    if (DOM.quotePracticeSolvedBanner) DOM.quotePracticeSolvedBanner.style.display = 'none';
    if (DOM.victoryModal) DOM.victoryModal.style.display = 'none';
    VictoryCelebration.stop();
  }

  function restartQuotePractice() {
    state.quotePracticeSolvedIds.clear();
    state.quotePracticeTarget = null;
    pickNewQuotePracticeTarget();
    showToast('🔁 Quote practice restarted!');
    SoundFX.playTone(440, 'sine', 0.12);
  }

  function returnToQuoteDailyMode() {
    state.quoteGameMode = 'daily';
    state.quoteTarget = state.quoteDailyTarget;

    renderQuoteBoardFromState(state.quoteDailyGuesses);
    renderQuoteDisplay(state.quoteDailyTarget, state.quoteDailyFoundMemberIds, state.quoteDailyIsWon);

    if (DOM.quoteHeaderTitle) DOM.quoteHeaderTitle.textContent = 'QUOTE MODE';
    if (DOM.quoteDailyBadge) {
      DOM.quoteDailyBadge.textContent = 'DAILY #' + state.gameNumber;
      DOM.quoteDailyBadge.style.background = '';
      DOM.quoteDailyBadge.style.color = '';
    }
    if (DOM.quoteCountdownWrap) DOM.quoteCountdownWrap.style.display = 'inline-block';
    if (DOM.quotePracticeToggleText) DOM.quotePracticeToggleText.textContent = 'Practice Mode';
    if (DOM.quotePracticeToggleIcon) DOM.quotePracticeToggleIcon.textContent = '🎲';
    if (DOM.quotePracticeSolvedBanner) DOM.quotePracticeSolvedBanner.style.display = 'none';

    setQuoteDailySolvedUI(state.quoteDailyIsWon);
    SoundFX.playSelect();
  }

  function updateQuotePracticeUI() {
    if (DOM.quoteHeaderTitle) DOM.quoteHeaderTitle.textContent = 'QUOTE • PRACTICE';
    if (DOM.quoteDailyBadge) {
      const solvedCount = state.quotePracticeSolvedIds.size;
      DOM.quoteDailyBadge.textContent = solvedCount > 0 ? `🎲 PRACTICE (${solvedCount} SOLVED)` : '🎲 PRACTICE';
      DOM.quoteDailyBadge.style.background = 'linear-gradient(135deg, #e6b43a, #996e14)';
      DOM.quoteDailyBadge.style.color = '#000000';
    }
    if (DOM.quoteCountdownWrap) DOM.quoteCountdownWrap.style.display = 'none';
    if (DOM.quotePracticeToggleText) DOM.quotePracticeToggleText.textContent = 'Back to Daily';
    if (DOM.quotePracticeToggleIcon) DOM.quotePracticeToggleIcon.textContent = '🎯';
    if (DOM.alreadySolvedQuoteBanner) DOM.alreadySolvedQuoteBanner.style.display = 'none';

    if (state.quotePracticeIsWon) {
      if (DOM.quoteMemberInput) {
        DOM.quoteMemberInput.disabled = true;
        DOM.quoteMemberInput.placeholder = '🎉 Practice quote solved! Click Next Practice to play again.';
      }
      if (DOM.quoteGuessBtn) DOM.quoteGuessBtn.disabled = true;
      if (DOM.quotePracticeSolvedBanner) {
        const msg = DOM.quotePracticeSolvedBanner.querySelector('.solved-banner-text p');
        if (msg) {
          const count = state.quotePracticeSolvedIds.size;
          msg.textContent = `You guessed correctly! (${count} solved this session without repeats). Ready for another?`;
        }
        DOM.quotePracticeSolvedBanner.style.display = 'flex';
      }
    } else {
      if (DOM.quoteMemberInput) {
        DOM.quoteMemberInput.disabled = false;
        DOM.quoteMemberInput.placeholder = 'Guess who said it... (Practice Mode)';
        setTimeout(() => {
          if (DOM.quoteMemberInput && !DOM.quoteMemberInput.disabled) DOM.quoteMemberInput.focus();
        }, 50);
      }
      if (DOM.quoteGuessBtn) DOM.quoteGuessBtn.disabled = false;
      if (DOM.quotePracticeSolvedBanner) DOM.quotePracticeSolvedBanner.style.display = 'none';
    }
  }

  // --- Quote Autocomplete & Keyboard Navigation ---
  function handleQuoteInputChange() {
    const query = DOM.quoteMemberInput.value.trim().toLowerCase();
    DOM.quoteClearInputBtn.style.display = query.length > 0 ? 'block' : 'none';

    if (query.length === 0) {
      closeQuoteDropdown();
      return;
    }

    const matches = findMatches(query, true);
    state.quoteCurrentMatches = matches;
    state.quoteSelectedDropdownIndex = matches.length > 0 ? 0 : -1;
    renderQuoteDropdown(matches, query);
  }

  function renderQuoteDropdown(matches, query) {
    if (!DOM.quoteAutocompleteDropdown) return;

    if (matches.length === 0) {
      DOM.quoteAutocompleteDropdown.innerHTML = `
        <div class="no-match-item">
          <span>No Discord member found matching "<strong>${escapeHtml(query)}</strong>"</span>
        </div>
      `;
      DOM.quoteAutocompleteDropdown.style.display = 'block';
      return;
    }

    const activeGuessed = getActiveQuoteGuessedIds();

    let html = '';
    matches.forEach((item, idx) => {
      const { member, matchedAlias } = item;
      const isGuessed = activeGuessed.has(member.id);
      const isActive = idx === state.quoteSelectedDropdownIndex ? 'active-item' : '';
      const guessedClass = isGuessed ? 'already-guessed' : '';
      const imgSrc = getMemberImage(member);
      const highlightedName = highlightQuery(member.name, query);

      let aliasesHtml = '';
      if (member.aliases && member.aliases.length > 0) {
        const aliasItems = member.aliases.map(a => {
          if (matchedAlias && a.toLowerCase() === matchedAlias.toLowerCase()) {
            return `<span class="alias-match-tag">AKA: ${highlightQuery(a, query)}</span>`;
          }
          return `<span>${escapeHtml(a)}</span>`;
        }).join(', ');
        aliasesHtml = `<div class="item-aliases">${aliasItems}</div>`;
      }

      const statusBadge = isGuessed 
        ? `<span class="item-badge" style="opacity:0.6; color:#888;">GUESSED</span>` 
        : `<span class="item-badge">#${member.index || idx + 1}</span>`;

      html += `
        <div class="dropdown-item ${isActive} ${guessedClass}" data-index="${idx}" data-id="${member.id}">
          <div class="item-left">
            <div class="item-avatar">
              <img src="${escapeHtml(imgSrc)}" class="item-avatar-img" alt="" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='inline';" />
              <span class="item-avatar-fallback" style="display:none;">👤</span>
            </div>
            <div class="item-details">
              <span class="item-primary-name">${highlightedName}</span>
              ${aliasesHtml}
            </div>
          </div>
          <div class="item-right">${statusBadge}</div>
        </div>
      `;
    });

    DOM.quoteAutocompleteDropdown.innerHTML = html;
    DOM.quoteAutocompleteDropdown.style.display = 'block';

    DOM.quoteAutocompleteDropdown.querySelectorAll('.dropdown-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-index'), 10);
        selectQuoteMatchByIndex(idx);
      });
      el.addEventListener('mouseenter', () => {
        const idx = parseInt(el.getAttribute('data-index'), 10);
        updateActiveQuoteDropdownItem(idx);
      });
    });
  }

  function updateActiveQuoteDropdownItem(index) {
    state.quoteSelectedDropdownIndex = index;
    const items = DOM.quoteAutocompleteDropdown.querySelectorAll('.dropdown-item');
    items.forEach((item, idx) => {
      if (idx === index) {
        item.classList.add('active-item');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('active-item');
      }
    });
  }

  function selectQuoteMatchByIndex(index) {
    if (!state.quoteCurrentMatches || !state.quoteCurrentMatches[index]) return;
    const { member } = state.quoteCurrentMatches[index];
    DOM.quoteMemberInput.value = member.name;
    closeQuoteDropdown();
    handleQuoteGuessSubmit();
  }

  function closeQuoteDropdown() {
    if (DOM.quoteAutocompleteDropdown) DOM.quoteAutocompleteDropdown.style.display = 'none';
    state.quoteSelectedDropdownIndex = -1;
  }

  function handleQuoteInputKeydown(e) {
    const isDropdownVisible = DOM.quoteAutocompleteDropdown && DOM.quoteAutocompleteDropdown.style.display === 'block';
    if (!isDropdownVisible) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleQuoteGuessSubmit();
      }
      return;
    }

    const items = state.quoteCurrentMatches;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length === 0) return;
      state.quoteSelectedDropdownIndex = (state.quoteSelectedDropdownIndex + 1) % items.length;
      updateActiveQuoteDropdownItem(state.quoteSelectedDropdownIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length === 0) return;
      state.quoteSelectedDropdownIndex = (state.quoteSelectedDropdownIndex - 1 + items.length) % items.length;
      updateActiveQuoteDropdownItem(state.quoteSelectedDropdownIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (state.quoteSelectedDropdownIndex >= 0 && items[state.quoteSelectedDropdownIndex]) {
        selectQuoteMatchByIndex(state.quoteSelectedDropdownIndex);
      } else {
        handleQuoteGuessSubmit();
      }
    } else if (e.key === 'Escape') {
      closeQuoteDropdown();
    }
  }

  function shakeQuoteInput() {
    DOM.quoteMemberInput.style.animation = 'none';
    DOM.quoteMemberInput.offsetHeight;
    DOM.quoteMemberInput.style.borderColor = '#ff2a55';
    DOM.quoteMemberInput.style.boxShadow = '0 0 20px #ff2a55';

    setTimeout(() => {
      DOM.quoteMemberInput.style.borderColor = '';
      DOM.quoteMemberInput.style.boxShadow = '';
    }, 400);
  }

  function pulseAlreadyGuessedQuote(id) {
    const card = DOM.quoteGuessesList.querySelector(`[data-id="${id}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.style.transition = 'all 0.2s ease';
      card.style.transform = 'scale(1.03)';
      card.style.borderColor = '#f7d57f';
      card.style.boxShadow = '0 0 25px rgba(247, 213, 127, 0.8)';

      setTimeout(() => {
        card.style.transform = '';
        card.style.borderColor = '';
        card.style.boxShadow = '';
      }, 700);
    }
  }

  function handleQuoteGuessSubmit() {
    const isDaily = state.quoteGameMode === 'daily';
    if (isDaily ? state.quoteDailyIsWon : state.quotePracticeIsWon) {
      return;
    }

    const query = DOM.quoteMemberInput.value.trim().toLowerCase();
    if (!query) {
      shakeQuoteInput();
      return;
    }

    const matchedMember = state.members.find(m => {
      if (m.name.toLowerCase() === query) return true;
      if (m.aliases && m.aliases.some(a => a.toLowerCase() === query)) return true;
      return false;
    });

    if (!matchedMember) {
      shakeQuoteInput();
      SoundFX.playError();
      return;
    }

    const activeGuessed = getActiveQuoteGuessedIds();
    if (activeGuessed.has(matchedMember.id)) {
      pulseAlreadyGuessedQuote(matchedMember.id);
      SoundFX.playError();
      DOM.quoteMemberInput.value = '';
      DOM.quoteClearInputBtn.style.display = 'none';
      closeQuoteDropdown();
      return;
    }

    logQuoteGuess(matchedMember, null, true);

    DOM.quoteMemberInput.value = '';
    DOM.quoteClearInputBtn.style.display = 'none';
    closeQuoteDropdown();
    DOM.quoteMemberInput.focus();
  }

  function logQuoteGuess(member, explicitResult = null, playSound = true) {
    const isDaily = state.quoteGameMode === 'daily';
    const targetQuote = state.quoteTarget;
    if (!targetQuote) return;

    const isConv = targetQuote.type === 'conversation';
    const foundIds = getActiveQuoteFoundIds();

    let result = explicitResult;
    let detail = '';

    if (!result) {
      if (isConv) {
        if (targetQuote.requiredMemberIds.includes(member.id)) {
          foundIds.add(member.id);
          const foundCount = targetQuote.requiredMemberIds.filter(id => foundIds.has(id)).length;
          const totalCount = targetQuote.requiredMemberIds.length;
          result = 'speaker-found';
          detail = `${foundCount}/${totalCount}`;
        } else {
          result = 'incorrect';
        }
      } else {
        const targetAuthorId = targetQuote.requiredMemberIds[0];
        if (member.id === targetAuthorId) {
          result = 'correct';
          foundIds.add(member.id);
        } else {
          result = 'incorrect';
        }
      }
    }

    const guessItem = { member, result, detail };

    if (isDaily) {
      state.quoteDailyGuessedIds.add(member.id);
      state.quoteDailyGuesses.unshift(guessItem);
    } else {
      state.quotePracticeGuessedIds.add(member.id);
      state.quotePracticeGuesses.unshift(guessItem);
    }

    updateQuoteGuessCounter();

    if (DOM.quoteEmptyGuessesState && DOM.quoteEmptyGuessesState.parentNode) {
      DOM.quoteEmptyGuessesState.parentNode.removeChild(DOM.quoteEmptyGuessesState);
    }

    const card = createQuoteGuessCard(member, result, detail);
    DOM.quoteGuessesList.prepend(card);

    // Check win condition
    let isWonNow = false;
    if (isConv) {
      isWonNow = targetQuote.requiredMemberIds.every(id => foundIds.has(id));
    } else {
      isWonNow = result === 'correct';
    }

    renderQuoteDisplay(targetQuote, foundIds, isWonNow);

    if (isDaily) {
      QuoteDailyStateManager.save(
        state.currentDateKey, 
        state.gameNumber, 
        targetQuote.id, 
        state.quoteDailyGuesses, 
        state.quoteDailyFoundMemberIds, 
        isWonNow || state.quoteDailyIsWon,
        state.quoteDailyRevealedClues
      );
    }

    if (isWonNow) {
      const currentHistory = isDaily ? state.quoteDailyGuesses : state.quotePracticeGuesses;
      const guessNumber = currentHistory.length;

      if (isDaily) {
        state.quoteDailyIsWon = true;
        const stats = QuoteStatsManager.recordWin(guessNumber, state.currentDateKey);
        updateStatsUI(stats);
        setQuoteDailySolvedUI(true);
      } else {
        state.quotePracticeIsWon = true;
        if (targetQuote) {
          state.quotePracticeSolvedIds.add(targetQuote.id);
        }
        updateQuotePracticeUI();
      }

      if (playSound) {
        setTimeout(() => triggerQuoteVictory(targetQuote, guessNumber, true), 1000);
      }
    } else if (playSound) {
      if (result === 'speaker-found' || result === 'correct') {
        SoundFX.playGuessSuccess();
      } else {
        SoundFX.playError();
      }
    }
  }

  // --- Quote Victory Modal ---
  function triggerQuoteVictory(quote, tries, withFanfare = true) {
    state.lastVictoryMode = 'quote';
    const isDaily = state.quoteGameMode === 'daily';
    const isConv = quote.type === 'conversation';

    if (withFanfare) {
      SoundFX.playWin();
      if (DOM.victoryFlash) {
        DOM.victoryFlash.classList.remove('flash-active');
        void DOM.victoryFlash.offsetWidth; // Force CSS reflow
        DOM.victoryFlash.classList.add('flash-active');
        setTimeout(() => {
          if (DOM.victoryFlash) DOM.victoryFlash.classList.remove('flash-active');
        }, 900);
      }
      document.body.classList.add('screen-rumble');
      setTimeout(() => document.body.classList.remove('screen-rumble'), 450);
      VictoryCelebration.start();
    }

    // Modal Titles
    if (DOM.victoryHeading) {
      DOM.victoryHeading.textContent = isDaily 
        ? `QUOTE SOLVED! DAILY #${state.gameNumber}` 
        : 'PRACTICE QUOTE SOLVED!';
    }
    if (DOM.victorySubtitle) {
      DOM.victorySubtitle.textContent = isConv 
        ? 'You identified all speakers in the conversation!' 
        : 'You correctly identified who said this quote!';
    }

    // Single vs Multi-member layout
    if (DOM.victoryMemberCard && DOM.victoryMultiMembers) {
      if (isConv) {
        DOM.victoryMemberCard.style.display = 'none';
        DOM.victoryMultiMembers.style.display = 'flex';

        let chipsHtml = '';
        quote.requiredMemberIds.forEach(mid => {
          const m = state.members.find(x => x.id === mid) || { id: mid, name: mid };
          const imgSrc = getMemberImage(m);
          chipsHtml += `
            <div class="victory-speaker-chip">
              <img src="${escapeHtml(imgSrc)}" class="victory-speaker-avatar" alt="${escapeHtml(m.name)}" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='inline';" />
              <span class="victory-speaker-fallback" style="display:none;">👤</span>
              <span class="victory-speaker-name">${escapeHtml(m.name)}</span>
            </div>
          `;
        });
        DOM.victoryMultiMembers.innerHTML = chipsHtml;
      } else {
        DOM.victoryMemberCard.style.display = 'flex';
        DOM.victoryMultiMembers.style.display = 'none';

        const authorId = quote.requiredMemberIds[0];
        const member = state.members.find(m => m.id === authorId) || { id: authorId, name: quote.dialogue[0].authorName };
        const imgSrc = getMemberImage(member);

        if (DOM.victoryAvatar) {
          DOM.victoryAvatar.innerHTML = `
            <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(member.name)}" class="victory-avatar-img" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='inline';" />
            <span class="victory-avatar-fallback" style="display:none;">👑</span>
          `;
        }
        if (DOM.victoryMemberName) DOM.victoryMemberName.textContent = member.name;
        if (DOM.victoryAliases) {
          const aliasStr = member.aliases && member.aliases.length > 0 ? member.aliases.join(', ') : 'None';
          DOM.victoryAliases.textContent = `Aliases: ${aliasStr}`;
        }
      }
    }

    // Solved Quote Box in Victory Modal
    if (DOM.victoryEmojiBox) DOM.victoryEmojiBox.style.display = 'none';
    if (DOM.victoryPictureBox) DOM.victoryPictureBox.style.display = 'none';
    if (DOM.victoryQuoteBox) {
      DOM.victoryQuoteBox.style.display = 'block';
      if (isConv) {
        let convHtml = '<div style="display:flex; flex-direction:column; gap:8px; text-align:left;">';
        quote.dialogue.forEach(line => {
          convHtml += `<div><strong style="color:var(--text-gold); font-family:var(--font-display); font-size:1.05rem;">${escapeHtml(line.authorName)}:</strong> <span style="color:#ffffff;">"${escapeHtml(line.text)}"</span></div>`;
        });
        convHtml += '</div>';
        DOM.victoryQuoteBox.innerHTML = convHtml;
      } else {
        DOM.victoryQuoteBox.innerHTML = `"${escapeHtml(quote.dialogue[0].text)}"`;
      }
    }

    if (DOM.victoryGuessCount) {
      DOM.victoryGuessCount.textContent = `Solved in ${tries} ${tries === 1 ? 'try' : 'tries'}!`;
    }

    // Countdown Card
    if (DOM.victoryCountdownCard) {
      DOM.victoryCountdownCard.style.display = isDaily ? 'block' : 'none';
      const label = DOM.victoryCountdownCard.querySelector('.countdown-card-label');
      if (label) label.textContent = 'NEXT DAILY QUOTE IN';
    }

    // Stats Row
    if (DOM.victoryStatsRow) {
      DOM.victoryStatsRow.style.display = isDaily ? 'grid' : 'none';
      if (isDaily) {
        const stats = QuoteStatsManager.get();
        if (DOM.vstatPlayed) DOM.vstatPlayed.textContent = stats.played;
        if (DOM.vstatWinPct) {
          const pct = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
          DOM.vstatWinPct.textContent = pct + '%';
        }
        if (DOM.vstatStreak) DOM.vstatStreak.textContent = '🔥 ' + stats.currentStreak;
        if (DOM.vstatMaxStreak) DOM.vstatMaxStreak.textContent = '⭐ ' + stats.maxStreak;
      }
    }

    if (DOM.victoryPracticeBtn) {
      DOM.victoryPracticeBtn.innerHTML = isDaily 
        ? '<span>🎲 PRACTICE MODE (UNLIMITED)</span>' 
        : '<span>🔄 NEXT PRACTICE QUOTE</span>';
    }

    if (DOM.victoryModal) {
      DOM.victoryModal.style.display = 'flex';
    }
  }

  function shareQuoteResult(quote, tries, isPractice = false) {
    const dayInfo = getLocalDayInfo();
    const isConv = quote.type === 'conversation';
    const title = isPractice 
      ? `❝ ANTISIMPDLE QUOTE #Practice` 
      : `❝ ANTISIMPDLE QUOTE #${dayInfo.gameNumber}`;
    const sub = isConv ? `💬 Conversation (${quote.requiredMemberIds.length} speakers)` : `👤 Single Quote`;

    const history = isPractice ? state.quotePracticeGuesses : state.quoteDailyGuesses;
    const inOrder = [...history].reverse();
    const emojis = inOrder.map(g => (g.result === 'correct' || g.result === 'speaker-found') ? '🟩' : '🟥').join('');

    const webUrl = (window.location.origin && !window.location.origin.startsWith('file'))
      ? `${window.location.origin}${window.location.pathname}`
      : 'Antisimpdle';

    const text = `${title}\n${sub}\n🎯 Solved in ${tries} ${tries === 1 ? 'try' : 'tries'}!\n${emojis}\n\nPlay: ${webUrl}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('📋 Copied quote result to clipboard!');
        SoundFX.playTone(880, 'sine', 0.12, 0.08);
      }).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function resetQuoteGame() {
    if (state.quoteGameMode === 'daily') {
      if (state.quoteDailyIsWon) {
        showToast('👑 You already solved today! Play Practice Mode to guess more.');
        return;
      }
      if (state.quoteDailyGuesses.length === 0) return;
      if (confirm("Reset today's daily quote guesses and restart from 0?")) {
        state.quoteDailyGuessedIds.clear();
        state.quoteDailyFoundMemberIds.clear();
        state.quoteDailyRevealedClues.clear();
        state.quoteDailyGuesses = [];
        state.quoteDailyIsWon = false;
        QuoteDailyStateManager.clear();
        renderQuoteBoardFromState([]);
        renderQuoteDisplay(state.quoteDailyTarget, state.quoteDailyFoundMemberIds, false);
        setQuoteDailySolvedUI(false);
        SoundFX.playTone(320, 'sine', 0.15);
      }
    } else {
      if (confirm('Restart practice mode and reset your solved quotes?')) {
        restartQuotePractice();
      }
    }
  }

  // ========================================================
  // EMOJI MODE GAME LOGIC
  // ========================================================

  // --- Emoji Data Loading ---
  function loadEmojisData() {
    if (window.EMOJIS_DATA && Array.isArray(window.EMOJIS_DATA)) {
      setEmojis(window.EMOJIS_DATA);
      return;
    }

    fetch('emojis.json')
      .then(res => res.json())
      .then(data => {
        setEmojis(data);
      })
      .catch(err => {
        console.error('Error fetching emojis.json:', err);
      });
  }

  function setEmojis(data) {
    state.emojis = data;
    initDailyEmojiGame();
    if (window.location.hash === '#emoji') {
      showView('emoji', false);
    }
  }

  // --- Daily Emoji Game Setup & Session Restoration ---
  function initDailyEmojiGame() {
    if (!state.emojis || state.emojis.length === 0) return;

    const dayInfo = getLocalDayInfo();
    state.emojiDailyTarget = getDailyEmoji(dayInfo.dayIndex, state.emojis);
    state.emojiTarget = state.emojiDailyTarget;

    if (DOM.emojiDailyNum) DOM.emojiDailyNum.textContent = dayInfo.gameNumber;
    if (DOM.emojiCardBadge) DOM.emojiCardBadge.textContent = 'DAILY #' + dayInfo.gameNumber;

    // Attempt to restore emoji daily save
    const saved = EmojiDailyStateManager.load(dayInfo.dateKey);
    if (saved && Array.isArray(saved.guesses) && saved.guesses.length > 0) {
      state.emojiDailyGuesses = [];
      state.emojiDailyGuessedIds.clear();
      state.emojiDailyRevealedClues = new Set(saved.revealedClues || []);
      state.emojiDailyIsWon = !!saved.isWon;

      // Re-log guesses in order (oldest first)
      const inOrder = [...saved.guesses].reverse();
      inOrder.forEach(item => {
        logEmojiGuess(item.member, item.result, false);
      });

      renderEmojiDisplay(state.emojiDailyTarget, state.emojiDailyIsWon);

      if (state.emojiDailyIsWon) {
        setEmojiDailySolvedUI(true);
      }
    } else {
      state.emojiDailyGuesses = [];
      state.emojiDailyGuessedIds.clear();
      state.emojiDailyRevealedClues = new Set();
      state.emojiDailyIsWon = false;
      renderEmojiBoardFromState([]);
      renderEmojiDisplay(state.emojiDailyTarget, false);
      setEmojiDailySolvedUI(false);
    }
  }

  function handleEmojiMidnightRollover(dayInfo) {
    if (!state.emojis || state.emojis.length === 0) return;
    state.emojiDailyTarget = getDailyEmoji(dayInfo.dayIndex, state.emojis);

    if (DOM.emojiDailyNum) DOM.emojiDailyNum.textContent = dayInfo.gameNumber;
    if (DOM.emojiCardBadge) DOM.emojiCardBadge.textContent = 'DAILY #' + dayInfo.gameNumber;

    EmojiDailyStateManager.clear();
    state.emojiDailyGuesses = [];
    state.emojiDailyGuessedIds.clear();
    state.emojiDailyRevealedClues = new Set();
    state.emojiDailyIsWon = false;

    if (state.emojiGameMode === 'daily') {
      state.emojiTarget = state.emojiDailyTarget;
      renderEmojiBoardFromState([]);
      renderEmojiDisplay(state.emojiDailyTarget, false);
      setEmojiDailySolvedUI(false);
    }
  }

  // --- Render Central Emoji Display Card ---
  function renderEmojiDisplay(target, isSolved, justRevealedIndex = -1) {
    if (!target) return;
    const emojis = target.emojis || [];
    const N = emojis.length;
    const history = getActiveEmojiHistory();
    const guessCount = history.length;

    // At start (0 guesses), exactly 1 emoji is offered. Each guess reveals 1 extra emoji.
    // If solved, all emojis are revealed.
    const revealedCount = isSolved ? N : Math.min(1 + guessCount, N);

    // Progress badge
    if (DOM.emojiRevealProgress) {
      if (revealedCount >= N) {
        DOM.emojiRevealProgress.textContent = `All ${N} Emojis Revealed ✨`;
        DOM.emojiRevealProgress.style.borderColor = '#f7d57f';
        DOM.emojiRevealProgress.style.color = '#f7d57f';
      } else {
        DOM.emojiRevealProgress.textContent = `${revealedCount} / ${N} Emojis Revealed`;
        DOM.emojiRevealProgress.style.borderColor = 'rgba(255, 255, 255, 0.14)';
        DOM.emojiRevealProgress.style.color = 'var(--text-gold)';
      }
    }

    // Render emoji tokens
    if (DOM.emojiTokensContainer) {
      let tokensHtml = '';
      for (let i = 0; i < N; i++) {
        if (i < revealedCount) {
          const isJustRevealed = i === justRevealedIndex;
          tokensHtml += `
            <div class="emoji-token revealed ${isJustRevealed ? 'just-revealed' : ''}" title="Emoji #${i + 1}">
              <span>${escapeHtml(emojis[i])}</span>
            </div>
          `;
        } else {
          tokensHtml += `
            <div class="emoji-token mystery" title="Emoji #${i + 1} (Unlocks on guess ${i})">
              <span>?</span>
            </div>
          `;
        }
      }
      DOM.emojiTokensContainer.innerHTML = tokensHtml;
    }

    // Solved Author Reveal Area
    if (DOM.emojiAuthorReveal) {
      if (isSolved) {
        DOM.emojiAuthorReveal.style.display = 'block';
        const member = state.members.find(m => m.id === target.memberId) || { id: target.memberId, name: target.memberName, image: target.memberImage };
        const imgSrc = getMemberImage(member);
        DOM.emojiAuthorReveal.innerHTML = `
          <div class="quote-author-revealed">
            <img src="${escapeHtml(imgSrc)}" class="revealed-avatar" alt="${escapeHtml(member.name)}" onerror="this.style.display='none';" />
            <span class="revealed-name">— ${escapeHtml(member.name)}</span>
          </div>
        `;
      } else {
        DOM.emojiAuthorReveal.style.display = 'none';
      }
    }

    renderEmojiClues();
  }

  // --- Emoji Clues & Hints Logic ---
  // "after all emojies have been revealed the same hitns and clue boxes shows up as in quotes
  // and it starts couting only guesses after all the emojies have been revealed"
  function renderEmojiClues() {
    if (!DOM.emojiCluesContainer) return;
    const target = state.emojiTarget;
    if (!target) {
      DOM.emojiCluesContainer.style.display = 'none';
      return;
    }

    const emojis = target.emojis || [];
    const N = emojis.length;
    const history = getActiveEmojiHistory();
    const guessCount = history.length;
    const isWon = state.emojiGameMode === 'daily' ? state.emojiDailyIsWon : state.emojiPracticeIsWon;

    // All emojis are revealed once guessCount >= N - 1 (or won)
    const allEmojisRevealed = (guessCount >= N - 1) || isWon;

    if (!allEmojisRevealed) {
      DOM.emojiCluesContainer.style.display = 'none';
      return;
    }

    // Show hints & clues box!
    DOM.emojiCluesContainer.style.display = 'block';

    // "it starts couting only guesses after all the emojies have been revealed"
    // G_post = Math.max(0, guessCount - (N - 1))
    const postGuesses = Math.max(0, guessCount - (N - 1));
    const revealedClues = getActiveEmojiRevealedClues();

    const cluesConfig = [
      { index: 1, reqGuesses: 5, icon: '📍', label: 'LOCATION' },
      { index: 2, reqGuesses: 7, icon: '📅', label: 'JOINED SERVER' },
      { index: 3, reqGuesses: 10, icon: '🔤', label: 'FIRST LETTER' }
    ];

    const member = state.members.find(m => m.id === target.memberId) || { 
      id: target.memberId, 
      name: target.memberName, 
      categories: { lokacija: '?', dolazak_na_server: '?' } 
    };

    function getClueValue(clueIndex) {
      if (clueIndex === 1) {
        return member.categories?.lokacija || 'Unknown';
      } else if (clueIndex === 2) {
        return member.categories?.dolazak_na_server || 'Unknown';
      } else {
        const letter = (member.name || target.memberName || '').trim().charAt(0).toUpperCase() || '?';
        return `Starts with '${letter}'`;
      }
    }

    let unlockedCount = 0;

    cluesConfig.forEach(cfg => {
      const card = document.getElementById(`emojiClue${cfg.index}`);
      if (!card) return;

      const isAvailable = postGuesses >= cfg.reqGuesses || isWon;
      const isRevealed = revealedClues.has(cfg.index) || isWon;
      if (isAvailable) unlockedCount++;

      card.classList.remove('locked', 'available', 'revealed');

      if (isRevealed) {
        card.classList.add('revealed');
        const val = getClueValue(cfg.index);
        card.innerHTML = `
          <div class="clue-card-content">
            <div class="clue-header-badge">
              <span class="clue-icon">${cfg.icon}</span>
              <span class="clue-tag">${cfg.label}</span>
            </div>
            <div class="clue-value-text" title="${escapeHtml(val)}">${escapeHtml(val)}</div>
          </div>
        `;
      } else if (isAvailable) {
        card.classList.add('available');
        card.innerHTML = `
          <div class="clue-card-content">
            <div class="clue-header-badge">
              <span class="clue-icon">${cfg.icon}</span>
              <span class="clue-tag">${cfg.label}</span>
            </div>
            <div class="clue-cta-text">
              <span class="clue-tap-icon">✨</span>
              <span>CLICK TO REVEAL</span>
            </div>
          </div>
        `;
      } else {
        card.classList.add('locked');
        card.innerHTML = `
          <div class="clue-card-content">
            <div class="clue-header-badge">
              <span class="clue-lock-icon">🔒</span>
              <span class="clue-tag">${cfg.label}</span>
            </div>
            <div class="clue-lock-sub">
              <span>Unlocks in ${cfg.reqGuesses} post-emoji tries</span>
              <span class="clue-progress-tag">${postGuesses}/${cfg.reqGuesses}</span>
            </div>
          </div>
        `;
      }
    });

    if (DOM.emojiCluesCounter) {
      DOM.emojiCluesCounter.textContent = `${unlockedCount} / 3 Available`;
    }
  }

  function handleEmojiClueClick(clueIndex) {
    const target = state.emojiTarget;
    if (!target) return;

    const emojis = target.emojis || [];
    const N = emojis.length;
    const history = getActiveEmojiHistory();
    const guessCount = history.length;
    const isWon = state.emojiGameMode === 'daily' ? state.emojiDailyIsWon : state.emojiPracticeIsWon;

    if (guessCount < N - 1 && !isWon) {
      SoundFX.playError();
      showToast('🔒 Hints unlock after all emojis have been revealed!');
      return;
    }

    const postGuesses = Math.max(0, guessCount - (N - 1));
    const revealedClues = getActiveEmojiRevealedClues();

    const thresholds = { 1: 5, 2: 7, 3: 10 };
    const reqGuesses = thresholds[clueIndex];

    const card = document.getElementById(`emojiClue${clueIndex}`);

    if (postGuesses < reqGuesses && !isWon) {
      if (card) {
        card.classList.remove('clue-shake');
        void card.offsetWidth;
        card.classList.add('clue-shake');
        setTimeout(() => card.classList.remove('clue-shake'), 400);
      }
      SoundFX.playError();
      const need = reqGuesses - postGuesses;
      showToast(`🔒 Clue ${clueIndex} unlocks after ${reqGuesses} guesses after all emojis are revealed! (${need} more needed)`);
      return;
    }

    if (revealedClues.has(clueIndex)) {
      SoundFX.playSelect();
      return;
    }

    revealedClues.add(clueIndex);
    SoundFX.playClueReveal();

    if (state.emojiGameMode === 'daily') {
      EmojiDailyStateManager.save(
        state.currentDateKey,
        state.gameNumber,
        target.id,
        state.emojiDailyGuesses,
        state.emojiDailyIsWon,
        state.emojiDailyRevealedClues
      );
    }

    renderEmojiClues();

    const updatedCard = document.getElementById(`emojiClue${clueIndex}`);
    if (updatedCard) {
      updatedCard.classList.add('clue-just-revealed');
      setTimeout(() => updatedCard.classList.remove('clue-just-revealed'), 700);
    }
  }

  // --- Render Emoji Guesses Board ---
  function renderEmojiBoardFromState(history) {
    if (!DOM.emojiGuessesList) return;
    DOM.emojiGuessesList.innerHTML = '';

    if (!history || history.length === 0) {
      if (DOM.emojiEmptyGuessesState) DOM.emojiGuessesList.appendChild(DOM.emojiEmptyGuessesState);
      updateEmojiGuessCounter();
      return;
    }

    const inOrder = [...history].reverse();
    inOrder.forEach(item => {
      const card = createEmojiGuessCard(item.member, item.result);
      DOM.emojiGuessesList.prepend(card);
    });

    updateEmojiGuessCounter();
  }

  function createEmojiGuessCard(member, result) {
    const card = document.createElement('div');
    card.className = `quote-guess-card status-${result}`;
    card.setAttribute('data-id', member.id);

    const imgSrc = getMemberImage(member);
    const aliasStr = member.aliases && member.aliases.length > 0 ? member.aliases.join(', ') : '';

    let badgeClass = 'badge-incorrect';
    let badgeText = 'INCORRECT ✕';

    if (result === 'correct') {
      badgeClass = 'badge-correct';
      badgeText = 'CORRECT! ✓';
    }

    card.innerHTML = `
      <div class="quote-guess-left">
        <div class="quote-guess-avatar">
          <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(member.name)}" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='inline';" />
          <span style="display:none;">👤</span>
        </div>
        <div class="quote-guess-meta">
          <span class="quote-guess-name">${escapeHtml(member.name)}</span>
          ${aliasStr ? `<span class="quote-guess-sub">AKA: ${escapeHtml(aliasStr)}</span>` : ''}
        </div>
      </div>
      <div class="quote-guess-right">
        <span class="quote-guess-badge ${badgeClass}">${badgeText}</span>
      </div>
    `;

    return card;
  }

  function updateEmojiGuessCounter() {
    const history = getActiveEmojiHistory();
    if (DOM.emojiGuessCountBadge) {
      DOM.emojiGuessCountBadge.textContent = `${history.length} ${history.length === 1 ? 'Guess' : 'Guesses'}`;
    }
  }

  function setEmojiDailySolvedUI(isSolved) {
    if (state.emojiGameMode !== 'daily') return;

    if (isSolved) {
      if (DOM.alreadySolvedEmojiBanner) DOM.alreadySolvedEmojiBanner.style.display = 'flex';
      if (DOM.emojiMemberInput) {
        DOM.emojiMemberInput.disabled = true;
        DOM.emojiMemberInput.placeholder = "👑 Today's emoji solved! Resets at midnight.";
      }
      if (DOM.emojiGuessBtn) DOM.emojiGuessBtn.disabled = true;
      if (DOM.emojiCardBadge) {
        DOM.emojiCardBadge.textContent = '✅ SOLVED TODAY';
        DOM.emojiCardBadge.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
        DOM.emojiCardBadge.style.color = '#ffffff';
      }
    } else {
      if (DOM.alreadySolvedEmojiBanner) DOM.alreadySolvedEmojiBanner.style.display = 'none';
      if (DOM.emojiMemberInput) {
        DOM.emojiMemberInput.disabled = false;
        DOM.emojiMemberInput.placeholder = 'Guess who this represents... (e.g. lara, vito, krof, dineks)';
      }
      if (DOM.emojiGuessBtn) DOM.emojiGuessBtn.disabled = false;
      if (DOM.emojiCardBadge) {
        DOM.emojiCardBadge.textContent = 'DAILY #' + state.gameNumber;
        DOM.emojiCardBadge.style.background = '';
        DOM.emojiCardBadge.style.color = '';
      }
    }
  }

  // --- Emoji Practice Mode ---
  function toggleEmojiPracticeMode() {
    if (state.emojiGameMode === 'daily') {
      switchToEmojiPracticeMode();
    } else {
      returnToEmojiDailyMode();
    }
  }

  function switchToEmojiPracticeMode() {
    state.emojiGameMode = 'practice';
    if (!state.emojiPracticeTarget || state.emojiPracticeIsWon) {
      pickNewEmojiPracticeTarget();
    } else {
      state.emojiTarget = state.emojiPracticeTarget;
      renderEmojiBoardFromState(state.emojiPracticeGuesses);
      renderEmojiDisplay(state.emojiPracticeTarget, state.emojiPracticeIsWon);
      updateEmojiPracticeUI();
    }
    SoundFX.playSelect();
  }

  function pickNewEmojiPracticeTarget() {
    if (!state.emojis || state.emojis.length === 0) return;
    let pool = state.emojis.filter(e => 
      (!state.emojiDailyTarget || e.id !== state.emojiDailyTarget.id) &&
      (!state.emojiPracticeTarget || e.id !== state.emojiPracticeTarget.id) &&
      !state.emojiPracticeSolvedIds.has(e.id)
    );

    // If all practice emojis have been solved in this session, reset the pool cycle
    if (pool.length === 0) {
      state.emojiPracticeSolvedIds.clear();
      pool = state.emojis.filter(e => 
        (!state.emojiDailyTarget || e.id !== state.emojiDailyTarget.id) &&
        (!state.emojiPracticeTarget || e.id !== state.emojiPracticeTarget.id)
      );
      showToast('🔁 All emoji puzzles solved! Resetting practice pool.');
    }

    const chosen = pool[Math.floor(Math.random() * pool.length)] || state.emojis[0];

    state.emojiPracticeTarget = chosen;
    state.emojiTarget = chosen;
    state.emojiPracticeGuesses = [];
    state.emojiPracticeGuessedIds.clear();
    state.emojiPracticeRevealedClues.clear();
    state.emojiPracticeIsWon = false;

    renderEmojiBoardFromState([]);
    renderEmojiDisplay(chosen, false);
    updateEmojiPracticeUI();

    if (DOM.alreadySolvedEmojiBanner) DOM.alreadySolvedEmojiBanner.style.display = 'none';
    if (DOM.emojiPracticeSolvedBanner) DOM.emojiPracticeSolvedBanner.style.display = 'none';
    if (DOM.victoryModal) DOM.victoryModal.style.display = 'none';
    VictoryCelebration.stop();
  }

  function restartEmojiPractice() {
    state.emojiPracticeSolvedIds.clear();
    state.emojiPracticeTarget = null;
    pickNewEmojiPracticeTarget();
    showToast('🔁 Emoji practice restarted!');
    SoundFX.playTone(440, 'sine', 0.12);
  }

  function returnToEmojiDailyMode() {
    state.emojiGameMode = 'daily';
    state.emojiTarget = state.emojiDailyTarget;

    renderEmojiBoardFromState(state.emojiDailyGuesses);
    renderEmojiDisplay(state.emojiDailyTarget, state.emojiDailyIsWon);

    if (DOM.emojiHeaderTitle) DOM.emojiHeaderTitle.textContent = 'EMOJI MODE';
    if (DOM.emojiDailyBadge) {
      DOM.emojiDailyBadge.textContent = 'DAILY #' + state.gameNumber;
      DOM.emojiDailyBadge.style.background = '';
      DOM.emojiDailyBadge.style.color = '';
    }
    if (DOM.emojiCountdownWrap) DOM.emojiCountdownWrap.style.display = 'inline-block';
    if (DOM.emojiPracticeToggleText) DOM.emojiPracticeToggleText.textContent = 'Practice Mode';
    if (DOM.emojiPracticeToggleIcon) DOM.emojiPracticeToggleIcon.textContent = '🎲';
    if (DOM.emojiPracticeSolvedBanner) DOM.emojiPracticeSolvedBanner.style.display = 'none';

    setEmojiDailySolvedUI(state.emojiDailyIsWon);
    SoundFX.playSelect();
  }

  function updateEmojiPracticeUI() {
    if (DOM.emojiHeaderTitle) DOM.emojiHeaderTitle.textContent = 'EMOJI • PRACTICE';
    if (DOM.emojiDailyBadge) {
      const solvedCount = state.emojiPracticeSolvedIds.size;
      DOM.emojiDailyBadge.textContent = solvedCount > 0 ? `🎲 PRACTICE (${solvedCount} SOLVED)` : '🎲 PRACTICE';
      DOM.emojiDailyBadge.style.background = 'linear-gradient(135deg, #e6b43a, #996e14)';
      DOM.emojiDailyBadge.style.color = '#000000';
    }
    if (DOM.emojiCountdownWrap) DOM.emojiCountdownWrap.style.display = 'none';
    if (DOM.emojiPracticeToggleText) DOM.emojiPracticeToggleText.textContent = 'Back to Daily';
    if (DOM.emojiPracticeToggleIcon) DOM.emojiPracticeToggleIcon.textContent = '🎯';
    if (DOM.alreadySolvedEmojiBanner) DOM.alreadySolvedEmojiBanner.style.display = 'none';

    if (state.emojiPracticeIsWon) {
      if (DOM.emojiMemberInput) {
        DOM.emojiMemberInput.disabled = true;
        DOM.emojiMemberInput.placeholder = '🎉 Practice emoji solved! Click Next Practice to play again.';
      }
      if (DOM.emojiGuessBtn) DOM.emojiGuessBtn.disabled = true;
      if (DOM.emojiPracticeSolvedBanner) {
        const msg = DOM.emojiPracticeSolvedBanner.querySelector('.solved-banner-text p');
        if (msg) {
          const count = state.emojiPracticeSolvedIds.size;
          msg.textContent = `You guessed correctly! (${count} solved this session without repeats). Ready for another?`;
        }
        DOM.emojiPracticeSolvedBanner.style.display = 'flex';
      }
    } else {
      if (DOM.emojiMemberInput) {
        DOM.emojiMemberInput.disabled = false;
        DOM.emojiMemberInput.placeholder = 'Guess who this represents... (Practice Mode)';
        setTimeout(() => {
          if (DOM.emojiMemberInput && !DOM.emojiMemberInput.disabled) DOM.emojiMemberInput.focus();
        }, 50);
      }
      if (DOM.emojiGuessBtn) DOM.emojiGuessBtn.disabled = false;
      if (DOM.emojiPracticeSolvedBanner) DOM.emojiPracticeSolvedBanner.style.display = 'none';
    }
  }

  // --- Emoji Autocomplete & Keyboard Navigation ---
  function handleEmojiInputChange() {
    const query = DOM.emojiMemberInput.value.trim().toLowerCase();
    DOM.emojiClearInputBtn.style.display = query.length > 0 ? 'block' : 'none';

    if (query.length === 0) {
      closeEmojiDropdown();
      return;
    }

    const matches = findMatches(query, true);
    state.emojiCurrentMatches = matches;
    state.emojiSelectedDropdownIndex = matches.length > 0 ? 0 : -1;
    renderEmojiDropdown(matches, query);
  }

  function renderEmojiDropdown(matches, query) {
    if (!DOM.emojiAutocompleteDropdown) return;

    if (matches.length === 0) {
      DOM.emojiAutocompleteDropdown.innerHTML = `
        <div class="no-match-item">
          <span>No Discord member found matching "<strong>${escapeHtml(query)}</strong>"</span>
        </div>
      `;
      DOM.emojiAutocompleteDropdown.style.display = 'block';
      return;
    }

    const activeGuessed = getActiveEmojiGuessedIds();

    let html = '';
    matches.forEach((item, idx) => {
      const { member, matchedAlias } = item;
      const isGuessed = activeGuessed.has(member.id);
      const isActive = idx === state.emojiSelectedDropdownIndex ? 'active-item' : '';
      const guessedClass = isGuessed ? 'already-guessed' : '';
      const imgSrc = getMemberImage(member);
      const highlightedName = highlightQuery(member.name, query);

      let aliasesHtml = '';
      if (member.aliases && member.aliases.length > 0) {
        const aliasItems = member.aliases.map(a => {
          if (matchedAlias && a.toLowerCase() === matchedAlias.toLowerCase()) {
            return `<span class="alias-match-tag">AKA: ${highlightQuery(a, query)}</span>`;
          }
          return `<span>${escapeHtml(a)}</span>`;
        }).join(', ');
        aliasesHtml = `<div class="item-aliases">${aliasItems}</div>`;
      }

      const statusBadge = isGuessed 
        ? `<span class="item-badge" style="opacity:0.6; color:#888;">GUESSED</span>` 
        : `<span class="item-badge">#${member.index || idx + 1}</span>`;

      html += `
        <div class="dropdown-item ${isActive} ${guessedClass}" data-index="${idx}" data-id="${member.id}">
          <div class="item-left">
            <div class="item-avatar">
              <img src="${escapeHtml(imgSrc)}" class="item-avatar-img" alt="" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='inline';" />
              <span class="item-avatar-fallback" style="display:none;">👤</span>
            </div>
            <div class="item-details">
              <span class="item-primary-name">${highlightedName}</span>
              ${aliasesHtml}
            </div>
          </div>
          <div class="item-right">${statusBadge}</div>
        </div>
      `;
    });

    DOM.emojiAutocompleteDropdown.innerHTML = html;
    DOM.emojiAutocompleteDropdown.style.display = 'block';

    DOM.emojiAutocompleteDropdown.querySelectorAll('.dropdown-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-index'), 10);
        selectEmojiMatchByIndex(idx);
      });
      el.addEventListener('mouseenter', () => {
        const idx = parseInt(el.getAttribute('data-index'), 10);
        updateActiveEmojiDropdownItem(idx);
      });
    });
  }

  function updateActiveEmojiDropdownItem(index) {
    state.emojiSelectedDropdownIndex = index;
    const items = DOM.emojiAutocompleteDropdown.querySelectorAll('.dropdown-item');
    items.forEach((item, idx) => {
      if (idx === index) {
        item.classList.add('active-item');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('active-item');
      }
    });
  }

  function selectEmojiMatchByIndex(index) {
    if (!state.emojiCurrentMatches || !state.emojiCurrentMatches[index]) return;
    const { member } = state.emojiCurrentMatches[index];
    DOM.emojiMemberInput.value = member.name;
    closeEmojiDropdown();
    handleEmojiGuessSubmit();
  }

  function closeEmojiDropdown() {
    if (DOM.emojiAutocompleteDropdown) DOM.emojiAutocompleteDropdown.style.display = 'none';
    state.emojiSelectedDropdownIndex = -1;
  }

  function handleEmojiInputKeydown(e) {
    const isDropdownVisible = DOM.emojiAutocompleteDropdown && DOM.emojiAutocompleteDropdown.style.display === 'block';
    if (!isDropdownVisible) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleEmojiGuessSubmit();
      }
      return;
    }

    const items = state.emojiCurrentMatches;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length === 0) return;
      state.emojiSelectedDropdownIndex = (state.emojiSelectedDropdownIndex + 1) % items.length;
      updateActiveEmojiDropdownItem(state.emojiSelectedDropdownIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length === 0) return;
      state.emojiSelectedDropdownIndex = (state.emojiSelectedDropdownIndex - 1 + items.length) % items.length;
      updateActiveEmojiDropdownItem(state.emojiSelectedDropdownIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (state.emojiSelectedDropdownIndex >= 0 && items[state.emojiSelectedDropdownIndex]) {
        selectEmojiMatchByIndex(state.emojiSelectedDropdownIndex);
      } else {
        handleEmojiGuessSubmit();
      }
    } else if (e.key === 'Escape') {
      closeEmojiDropdown();
    }
  }

  function shakeEmojiInput() {
    DOM.emojiMemberInput.style.animation = 'none';
    DOM.emojiMemberInput.offsetHeight;
    DOM.emojiMemberInput.style.borderColor = '#ff2a55';
    DOM.emojiMemberInput.style.boxShadow = '0 0 20px #ff2a55';

    setTimeout(() => {
      DOM.emojiMemberInput.style.borderColor = '';
      DOM.emojiMemberInput.style.boxShadow = '';
    }, 400);
  }

  function pulseAlreadyGuessedEmoji(id) {
    const card = DOM.emojiGuessesList.querySelector(`[data-id="${id}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.style.transition = 'all 0.2s ease';
      card.style.transform = 'scale(1.03)';
      card.style.borderColor = '#f7d57f';
      card.style.boxShadow = '0 0 25px rgba(247, 213, 127, 0.8)';

      setTimeout(() => {
        card.style.transform = '';
        card.style.borderColor = '';
        card.style.boxShadow = '';
      }, 700);
    }
  }

  function handleEmojiGuessSubmit() {
    const isDaily = state.emojiGameMode === 'daily';
    if (isDaily ? state.emojiDailyIsWon : state.emojiPracticeIsWon) {
      return;
    }

    const query = DOM.emojiMemberInput.value.trim().toLowerCase();
    if (!query) {
      shakeEmojiInput();
      return;
    }

    const matchedMember = state.members.find(m => {
      if (m.name.toLowerCase() === query) return true;
      if (m.aliases && m.aliases.some(a => a.toLowerCase() === query)) return true;
      return false;
    });

    if (!matchedMember) {
      shakeEmojiInput();
      SoundFX.playError();
      return;
    }

    const activeGuessed = getActiveEmojiGuessedIds();
    if (activeGuessed.has(matchedMember.id)) {
      pulseAlreadyGuessedEmoji(matchedMember.id);
      SoundFX.playError();
      DOM.emojiMemberInput.value = '';
      DOM.emojiClearInputBtn.style.display = 'none';
      closeEmojiDropdown();
      return;
    }

    logEmojiGuess(matchedMember, null, true);

    DOM.emojiMemberInput.value = '';
    DOM.emojiClearInputBtn.style.display = 'none';
    closeEmojiDropdown();
    DOM.emojiMemberInput.focus();
  }

  function logEmojiGuess(member, explicitResult = null, playSound = true) {
    const isDaily = state.emojiGameMode === 'daily';
    const target = state.emojiTarget;
    if (!target) return;

    let result = explicitResult;
    if (!result) {
      result = (member.id === target.memberId) ? 'correct' : 'incorrect';
    }

    const guessItem = { member, result };

    if (isDaily) {
      state.emojiDailyGuessedIds.add(member.id);
      state.emojiDailyGuesses.unshift(guessItem);
    } else {
      state.emojiPracticeGuessedIds.add(member.id);
      state.emojiPracticeGuesses.unshift(guessItem);
    }

    updateEmojiGuessCounter();

    if (DOM.emojiEmptyGuessesState && DOM.emojiEmptyGuessesState.parentNode) {
      DOM.emojiEmptyGuessesState.parentNode.removeChild(DOM.emojiEmptyGuessesState);
    }

    const card = createEmojiGuessCard(member, result);
    DOM.emojiGuessesList.prepend(card);

    const isWonNow = (result === 'correct');
    const history = isDaily ? state.emojiDailyGuesses : state.emojiPracticeGuesses;
    const guessCount = history.length;
    const justRevealedIdx = Math.min(guessCount, target.emojis.length - 1);

    renderEmojiDisplay(target, isWonNow, justRevealedIdx);

    if (isDaily) {
      EmojiDailyStateManager.save(
        state.currentDateKey,
        state.gameNumber,
        target.id,
        state.emojiDailyGuesses,
        isWonNow || state.emojiDailyIsWon,
        state.emojiDailyRevealedClues
      );
    }

    if (isWonNow) {
      const tries = guessCount;

      if (isDaily) {
        state.emojiDailyIsWon = true;
        const stats = EmojiStatsManager.recordWin(tries, state.currentDateKey);
        updateStatsUI(stats);
        setEmojiDailySolvedUI(true);
      } else {
        state.emojiPracticeIsWon = true;
        if (target) {
          state.emojiPracticeSolvedIds.add(target.id);
        }
        updateEmojiPracticeUI();
      }

      if (playSound) {
        setTimeout(() => triggerEmojiVictory(target, tries, true), 1000);
      }
    } else if (playSound) {
      SoundFX.playError();
    }
  }

  // --- Emoji Victory Modal ---
  function triggerEmojiVictory(target, tries, withFanfare = true) {
    state.lastVictoryMode = 'emoji';
    const isDaily = state.emojiGameMode === 'daily';

    if (withFanfare) {
      SoundFX.playWin();
      if (DOM.victoryFlash) {
        DOM.victoryFlash.classList.remove('flash-active');
        void DOM.victoryFlash.offsetWidth;
        DOM.victoryFlash.classList.add('flash-active');
        setTimeout(() => {
          if (DOM.victoryFlash) DOM.victoryFlash.classList.remove('flash-active');
        }, 900);
      }
      document.body.classList.add('screen-rumble');
      setTimeout(() => document.body.classList.remove('screen-rumble'), 450);
      VictoryCelebration.start();
    }

    // Modal Titles
    if (DOM.victoryHeading) {
      DOM.victoryHeading.textContent = isDaily 
        ? `EMOJI SOLVED! DAILY #${state.gameNumber}` 
        : 'PRACTICE EMOJI SOLVED!';
    }
    if (DOM.victorySubtitle) {
      DOM.victorySubtitle.textContent = 'You correctly identified who this set of emojis represents!';
    }

    // Single member layout
    if (DOM.victoryMemberCard) {
      DOM.victoryMemberCard.style.display = 'flex';
      const member = state.members.find(m => m.id === target.memberId) || { id: target.memberId, name: target.memberName, image: target.memberImage };
      const imgSrc = getMemberImage(member);

      if (DOM.victoryAvatar) {
        DOM.victoryAvatar.innerHTML = `
          <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(member.name)}" class="victory-avatar-img" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='inline';" />
          <span class="victory-avatar-fallback" style="display:none;">👑</span>
        `;
      }
      if (DOM.victoryMemberName) DOM.victoryMemberName.textContent = member.name;
      if (DOM.victoryAliases) {
        const aliasStr = member.aliases && member.aliases.length > 0 ? member.aliases.join(', ') : 'None';
        DOM.victoryAliases.textContent = `Aliases: ${aliasStr}`;
      }
    }

    if (DOM.victoryMultiMembers) {
      DOM.victoryMultiMembers.style.display = 'none';
    }
    if (DOM.victoryQuoteBox) {
      DOM.victoryQuoteBox.style.display = 'none';
    }
    if (DOM.victoryPictureBox) {
      DOM.victoryPictureBox.style.display = 'none';
    }

    // Solved Emojis Box in Victory Modal
    if (DOM.victoryEmojiBox) {
      DOM.victoryEmojiBox.style.display = 'flex';
      DOM.victoryEmojiBox.innerHTML = (target.emojis || []).map(em => `<span>${escapeHtml(em)}</span>`).join(' ');
    }

    if (DOM.victoryGuessCount) {
      DOM.victoryGuessCount.textContent = `Solved in ${tries} ${tries === 1 ? 'try' : 'tries'}!`;
    }

    // Countdown Card
    if (DOM.victoryCountdownCard) {
      DOM.victoryCountdownCard.style.display = isDaily ? 'block' : 'none';
      const label = DOM.victoryCountdownCard.querySelector('.countdown-card-label');
      if (label) label.textContent = 'NEXT DAILY EMOJI IN';
    }

    // Stats Row
    if (DOM.victoryStatsRow) {
      DOM.victoryStatsRow.style.display = isDaily ? 'grid' : 'none';
      if (isDaily) {
        const stats = EmojiStatsManager.get();
        if (DOM.vstatPlayed) DOM.vstatPlayed.textContent = stats.played;
        if (DOM.vstatWinPct) {
          const pct = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
          DOM.vstatWinPct.textContent = pct + '%';
        }
        if (DOM.vstatStreak) DOM.vstatStreak.textContent = '🔥 ' + stats.currentStreak;
        if (DOM.vstatMaxStreak) DOM.vstatMaxStreak.textContent = '⭐ ' + stats.maxStreak;
      }
    }

    if (DOM.victoryPracticeBtn) {
      DOM.victoryPracticeBtn.innerHTML = isDaily 
        ? '<span>🎲 PRACTICE MODE (UNLIMITED)</span>' 
        : '<span>🔄 NEXT PRACTICE EMOJI</span>';
    }

    if (DOM.victoryModal) {
      DOM.victoryModal.style.display = 'flex';
    }
  }

  function shareEmojiResult(target, tries, isPractice = false) {
    const dayInfo = getLocalDayInfo();
    const title = isPractice 
      ? `😀 ANTISIMPDLE EMOJI #Practice` 
      : `😀 ANTISIMPDLE EMOJI #${dayInfo.gameNumber}`;
    const sub = `👤 Target: ${target.memberName}`;

    const history = isPractice ? state.emojiPracticeGuesses : state.emojiDailyGuesses;
    const inOrder = [...history].reverse();
    const emojis = inOrder.map(g => (g.result === 'correct') ? '🟩' : '🟥').join('');

    const webUrl = (window.location.origin && !window.location.origin.startsWith('file'))
      ? `${window.location.origin}${window.location.pathname}`
      : 'Antisimpdle';

    const text = `${title}\n${sub}\n🎯 Solved in ${tries} ${tries === 1 ? 'try' : 'tries'}!\n${emojis}\n\nPlay: ${webUrl}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('📋 Copied emoji result to clipboard!');
        SoundFX.playTone(880, 'sine', 0.12, 0.08);
      }).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function resetEmojiGame() {
    if (state.emojiGameMode === 'daily') {
      if (state.emojiDailyIsWon) {
        showToast('👑 You already solved today! Play Practice Mode to guess more.');
        return;
      }
      if (state.emojiDailyGuesses.length === 0) return;
      if (confirm("Reset today's daily emoji guesses and restart from 0?")) {
        state.emojiDailyGuessedIds.clear();
        state.emojiDailyRevealedClues.clear();
        state.emojiDailyGuesses = [];
        state.emojiDailyIsWon = false;
        EmojiDailyStateManager.clear();
        renderEmojiBoardFromState([]);
        renderEmojiDisplay(state.emojiDailyTarget, false);
        setEmojiDailySolvedUI(false);
        SoundFX.playTone(320, 'sine', 0.15);
      }
    } else {
      if (confirm('Restart practice mode and reset your solved emoji puzzles?')) {
        restartEmojiPractice();
      }
    }
  }

  // ========================================================
  // PICTURE MODE IMPLEMENTATION
  // ========================================================

  function loadPicturesData() {
    if (window.PICTURES_DATA && Array.isArray(window.PICTURES_DATA)) {
      setPictures(window.PICTURES_DATA);
      return;
    }

    fetch('pictures.json')
      .then(res => res.json())
      .then(data => {
        setPictures(data);
      })
      .catch(err => {
        console.error('Error fetching pictures.json:', err);
      });
  }

  function setPictures(data) {
    state.pictures = data;
    initDailyPictureGame();
    if (window.location.hash === '#picture') {
      showView('picture', false);
    }
  }

  // --- Daily Picture Game Setup & Session Restoration ---
  function initDailyPictureGame() {
    if (!state.pictures || state.pictures.length === 0) return;

    const dayInfo = getLocalDayInfo();
    state.pictureDailyTarget = getDailyPicture(dayInfo.dayIndex, state.pictures);
    state.pictureDailyFocusPoint = getDailyPictureFocusPoint(dayInfo.dayIndex, state.pictureDailyTarget.id);
    state.picturePracticeFocusPoint = getRandomPictureFocusPoint();
    state.pictureTarget = state.pictureDailyTarget;

    if (DOM.pictureDailyNum) DOM.pictureDailyNum.textContent = dayInfo.gameNumber;
    if (DOM.pictureCardBadge) DOM.pictureCardBadge.textContent = 'DAILY #' + dayInfo.gameNumber;

    // Attempt to restore picture daily save
    const saved = PictureDailyStateManager.load(dayInfo.dateKey);
    if (saved && Array.isArray(saved.guesses) && saved.guesses.length > 0) {
      state.pictureDailyGuesses = [];
      state.pictureDailyGuessedIds.clear();
      state.pictureDailyFoundMemberIds = new Set(saved.foundMemberIds || []);
      state.pictureDailyIsWon = !!saved.isWon;

      // Re-log guesses in order (oldest first)
      const inOrder = [...saved.guesses].reverse();
      inOrder.forEach(item => {
        logPictureGuess(item.member, item.result, false);
      });

      renderPictureDisplay(state.pictureDailyTarget, state.pictureDailyFoundMemberIds, state.pictureDailyIsWon);

      if (state.pictureDailyIsWon) {
        setPictureDailySolvedUI(true);
      }
    } else {
      state.pictureDailyGuesses = [];
      state.pictureDailyGuessedIds.clear();
      state.pictureDailyFoundMemberIds = new Set();
      state.pictureDailyIsWon = false;
      renderPictureBoardFromState([]);
      renderPictureDisplay(state.pictureDailyTarget, state.pictureDailyFoundMemberIds, false);
      setPictureDailySolvedUI(false);
    }
  }

  function handlePictureMidnightRollover(dayInfo) {
    if (!state.pictures || state.pictures.length === 0) return;
    state.pictureDailyTarget = getDailyPicture(dayInfo.dayIndex, state.pictures);
    state.pictureDailyFocusPoint = getDailyPictureFocusPoint(dayInfo.dayIndex, state.pictureDailyTarget.id);

    if (DOM.pictureDailyNum) DOM.pictureDailyNum.textContent = dayInfo.gameNumber;
    if (DOM.pictureCardBadge) DOM.pictureCardBadge.textContent = 'DAILY #' + dayInfo.gameNumber;

    PictureDailyStateManager.clear();
    state.pictureDailyGuesses = [];
    state.pictureDailyGuessedIds.clear();
    state.pictureDailyFoundMemberIds = new Set();
    state.pictureDailyIsWon = false;

    if (state.pictureGameMode === 'daily') {
      state.pictureTarget = state.pictureDailyTarget;
      renderPictureBoardFromState([]);
      renderPictureDisplay(state.pictureDailyTarget, state.pictureDailyFoundMemberIds, false);
      setPictureDailySolvedUI(false);
    }
  }

  // --- Render Central Picture Display Card & Zoom ---
  function renderPictureDisplay(picture, foundMemberIds, isSolved) {
    if (!picture || !DOM.pictureViewport) return;

    const history = getActivePictureHistory();
    const wrongGuesses = history.filter(g => g.result === 'incorrect').length;

    // Zoom progression levels (initial 5.0x, reaches 1.0x / full view after 10 guesses)
    const zoomLevels = [5.0, 4.3, 3.6, 3.1, 2.6, 2.2, 1.9, 1.6, 1.4, 1.2, 1.0];
    const step = isSolved ? zoomLevels.length - 1 : Math.min(wrongGuesses, zoomLevels.length - 1);
    const scale = isSolved ? 1.0 : zoomLevels[step];

    const focus = (state.pictureGameMode === 'daily') 
      ? state.pictureDailyFocusPoint 
      : state.picturePracticeFocusPoint;

    if (DOM.pictureImg) {
      if (DOM.pictureImg.src !== picture.image && !DOM.pictureImg.src.endsWith(picture.image)) {
        DOM.pictureImg.src = picture.image;
      }
      if (isSolved || scale <= 1.0) {
        DOM.pictureImg.style.objectFit = 'contain';
        DOM.pictureImg.style.transformOrigin = '50% 50%';
        DOM.pictureImg.style.transform = 'scale(1)';
      } else {
        DOM.pictureImg.style.objectFit = 'cover';
        DOM.pictureImg.style.transformOrigin = `${focus.fx}% ${focus.fy}%`;
        DOM.pictureImg.style.transform = `scale(${scale})`;
      }
    }

    // Zoom badge
    if (DOM.pictureZoomBadge) {
      DOM.pictureZoomBadge.textContent = isSolved 
        ? 'FULL VIEW' 
        : (step >= zoomLevels.length - 1 ? 'FULL VIEW (1.0x)' : `ZOOM ${scale.toFixed(1)}x`);
    }

    // Zoom progress bar
    if (DOM.pictureZoomBar) {
      const progress = isSolved ? 100 : Math.min(100, Math.round(((step + 1) / zoomLevels.length) * 100));
      DOM.pictureZoomBar.style.width = `${progress}%`;
    }

    const isMulti = picture.type === 'multi' && picture.requiredMemberIds.length > 1;

    // Multi-member picture tracker
    if (DOM.pictureMembersTracker) {
      if (isMulti) {
        DOM.pictureMembersTracker.style.display = 'block';
        const foundCount = picture.requiredMemberIds.filter(id => foundMemberIds.has(id)).length;
        const totalCount = picture.requiredMemberIds.length;
        if (DOM.pictureTrackerCount) {
          DOM.pictureTrackerCount.textContent = `${foundCount} / ${totalCount} FOUND`;
        }

        if (DOM.pictureTrackerChips) {
          let chipsHtml = '';
          picture.requiredMemberIds.forEach((mid, idx) => {
            const member = state.members.find(m => m.id === mid) || { id: mid, name: picture.requiredMemberNames[idx] || mid };
            const isFound = foundMemberIds.has(mid);
            const imgSrc = getMemberImage(member);

            if (isFound) {
              chipsHtml += `
                <div class="tracker-chip found" title="${escapeHtml(member.name)} (Found!)">
                  <div class="tracker-chip-avatar">
                    <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(member.name)}" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='inline';" />
                    <span style="display:none;">👤</span>
                  </div>
                  <span class="tracker-chip-name">${escapeHtml(member.name)}</span>
                  <span class="tracker-chip-badge">✓</span>
                </div>
              `;
            } else {
              chipsHtml += `
                <div class="tracker-chip" title="Member #${idx + 1} (Not found yet)">
                  <div class="tracker-chip-avatar">
                    <span>?</span>
                  </div>
                  <span class="tracker-chip-name">Member #${idx + 1}</span>
                </div>
              `;
            }
          });
          DOM.pictureTrackerChips.innerHTML = chipsHtml;
        }
      } else {
        DOM.pictureMembersTracker.style.display = 'none';
      }
    }

    // Header hint
    if (DOM.pictureHeaderHint) {
      DOM.pictureHeaderHint.textContent = isMulti 
        ? `Who is in this picture? Guess all ${picture.requiredMemberIds.length} members!` 
        : 'Who is in this picture? Guess the member!';
    }

    // Solved reveal area
    if (DOM.pictureAuthorReveal) {
      if (isSolved) {
        DOM.pictureAuthorReveal.style.display = 'block';
        if (isMulti) {
          let membersHtml = '<div style="display:flex; flex-wrap:wrap; justify-content:center; gap:16px;">';
          picture.requiredMemberIds.forEach((mid, idx) => {
            const member = state.members.find(m => m.id === mid) || { id: mid, name: picture.requiredMemberNames[idx] || mid };
            const imgSrc = getMemberImage(member);
            membersHtml += `
              <div class="quote-author-revealed">
                <img src="${escapeHtml(imgSrc)}" class="revealed-avatar" alt="${escapeHtml(member.name)}" onerror="this.style.display='none';" />
                <div class="revealed-meta">
                  <span class="revealed-label">MEMBER #${idx + 1}</span>
                  <h4 class="revealed-name">${escapeHtml(member.name)}</h4>
                </div>
              </div>
            `;
          });
          membersHtml += '</div>';
          DOM.pictureAuthorReveal.innerHTML = membersHtml;
        } else {
          const mid = picture.requiredMemberIds[0];
          const member = state.members.find(m => m.id === mid) || { id: mid, name: picture.requiredMemberNames[0] || mid };
          const imgSrc = getMemberImage(member);
          DOM.pictureAuthorReveal.innerHTML = `
            <div class="quote-author-revealed">
              <img src="${escapeHtml(imgSrc)}" class="revealed-avatar" alt="${escapeHtml(member.name)}" onerror="this.style.display='none';" />
              <div class="revealed-meta">
                <span class="revealed-label">MEMBER IN PICTURE</span>
                <h4 class="revealed-name">${escapeHtml(member.name)}</h4>
              </div>
            </div>
          `;
        }
      } else {
        DOM.pictureAuthorReveal.style.display = 'none';
      }
    }
  }

  // --- Render Picture Guesses Board ---
  function renderPictureBoardFromState(history) {
    if (!DOM.pictureGuessesList) return;
    DOM.pictureGuessesList.innerHTML = '';

    if (!history || history.length === 0) {
      if (DOM.pictureEmptyGuessesState) DOM.pictureGuessesList.appendChild(DOM.pictureEmptyGuessesState);
      updatePictureGuessCounter();
      return;
    }

    const inOrder = [...history].reverse();
    inOrder.forEach(item => {
      const card = createPictureGuessCard(item.member, item.result, item.detail);
      DOM.pictureGuessesList.prepend(card);
    });

    updatePictureGuessCounter();
  }

  function createPictureGuessCard(member, result, detail) {
    const card = document.createElement('div');
    card.className = `quote-guess-card status-${result}`;
    card.setAttribute('data-id', member.id);

    const imgSrc = getMemberImage(member);
    const aliasStr = member.aliases && member.aliases.length > 0 ? member.aliases.join(', ') : '';

    let badgeClass = 'badge-incorrect';
    let badgeText = 'INCORRECT ✕';

    if (result === 'correct') {
      badgeClass = 'badge-correct';
      badgeText = 'CORRECT! ✓';
    } else if (result === 'member-found') {
      badgeClass = 'badge-found';
      badgeText = detail ? `MEMBER FOUND! (${detail}) ✓` : 'MEMBER FOUND! ✓';
    }

    card.innerHTML = `
      <div class="quote-guess-left">
        <div class="quote-guess-avatar">
          <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(member.name)}" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='inline';" />
          <span style="display:none;">👤</span>
        </div>
        <div class="quote-guess-meta">
          <span class="quote-guess-name">${escapeHtml(member.name)}</span>
          ${aliasStr ? `<span class="quote-guess-sub">AKA: ${escapeHtml(aliasStr)}</span>` : ''}
        </div>
      </div>
      <div class="quote-guess-right">
        <span class="quote-guess-badge ${badgeClass}">${badgeText}</span>
      </div>
    `;

    return card;
  }

  function updatePictureGuessCounter() {
    const history = getActivePictureHistory();
    if (DOM.pictureGuessCountBadge) {
      DOM.pictureGuessCountBadge.textContent = `${history.length} ${history.length === 1 ? 'Guess' : 'Guesses'}`;
    }
  }

  function setPictureDailySolvedUI(isSolved) {
    if (state.pictureGameMode !== 'daily') return;

    if (isSolved) {
      if (DOM.alreadySolvedPictureBanner) DOM.alreadySolvedPictureBanner.style.display = 'flex';
      if (DOM.pictureMemberInput) {
        DOM.pictureMemberInput.disabled = true;
        DOM.pictureMemberInput.placeholder = "👑 Today's picture solved! Resets at midnight.";
      }
      if (DOM.pictureGuessBtn) DOM.pictureGuessBtn.disabled = true;
      if (DOM.pictureCardBadge) {
        DOM.pictureCardBadge.textContent = '✅ SOLVED TODAY';
        DOM.pictureCardBadge.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
        DOM.pictureCardBadge.style.color = '#ffffff';
      }
    } else {
      if (DOM.alreadySolvedPictureBanner) DOM.alreadySolvedPictureBanner.style.display = 'none';
      if (DOM.pictureMemberInput) {
        DOM.pictureMemberInput.disabled = false;
        DOM.pictureMemberInput.placeholder = 'Guess who is in this picture... (e.g. krof, bindi, lean, dineks)';
      }
      if (DOM.pictureGuessBtn) DOM.pictureGuessBtn.disabled = false;
      if (DOM.pictureCardBadge) {
        DOM.pictureCardBadge.textContent = 'DAILY #' + state.gameNumber;
        DOM.pictureCardBadge.style.background = '';
        DOM.pictureCardBadge.style.color = '';
      }
    }
  }

  function updatePicturePracticeUI() {
    if (state.pictureGameMode !== 'practice') return;

    if (DOM.pictureHeaderTitle) DOM.pictureHeaderTitle.textContent = 'PRACTICE PICTURE';
    if (DOM.pictureDailyBadge) {
      const solvedCount = state.picturePracticeSolvedIds.size;
      DOM.pictureDailyBadge.textContent = solvedCount > 0 ? `🎲 PRACTICE (${solvedCount} SOLVED)` : 'PRACTICE';
      DOM.pictureDailyBadge.style.background = 'linear-gradient(135deg, #9b59b6, #8e44ad)';
      DOM.pictureDailyBadge.style.color = '#ffffff';
    }
    if (DOM.pictureCountdownWrap) DOM.pictureCountdownWrap.style.display = 'none';
    if (DOM.picturePracticeToggleText) DOM.picturePracticeToggleText.textContent = 'Back to Daily';
    if (DOM.picturePracticeToggleIcon) DOM.picturePracticeToggleIcon.textContent = '🎯';
    if (DOM.alreadySolvedPictureBanner) DOM.alreadySolvedPictureBanner.style.display = 'none';

    if (state.picturePracticeIsWon) {
      if (DOM.pictureMemberInput) {
        DOM.pictureMemberInput.disabled = true;
        DOM.pictureMemberInput.placeholder = '🎉 Practice picture solved! Click Next Practice to play again.';
      }
      if (DOM.pictureGuessBtn) DOM.pictureGuessBtn.disabled = true;
      if (DOM.picturePracticeSolvedBanner) {
        const msg = DOM.picturePracticeSolvedBanner.querySelector('.solved-banner-text p');
        if (msg) {
          const count = state.picturePracticeSolvedIds.size;
          msg.textContent = `You guessed correctly! (${count} solved this session without repeats). Ready for another?`;
        }
        DOM.picturePracticeSolvedBanner.style.display = 'flex';
      }
    } else {
      if (DOM.pictureMemberInput) {
        DOM.pictureMemberInput.disabled = false;
        DOM.pictureMemberInput.placeholder = 'Guess who is in this picture... (Practice Mode)';
        setTimeout(() => {
          if (DOM.pictureMemberInput && !DOM.pictureMemberInput.disabled) DOM.pictureMemberInput.focus();
        }, 50);
      }
      if (DOM.pictureGuessBtn) DOM.pictureGuessBtn.disabled = false;
      if (DOM.picturePracticeSolvedBanner) DOM.picturePracticeSolvedBanner.style.display = 'none';
    }
  }

  // --- Picture Autocomplete & Keyboard Navigation ---
  function handlePictureInputChange() {
    const query = DOM.pictureMemberInput.value.trim().toLowerCase();
    DOM.pictureClearInputBtn.style.display = query.length > 0 ? 'block' : 'none';

    if (query.length === 0) {
      closePictureDropdown();
      return;
    }

    const matches = findMatches(query, true);
    state.pictureCurrentMatches = matches;
    state.pictureSelectedDropdownIndex = matches.length > 0 ? 0 : -1;
    renderPictureDropdown(matches, query);
  }

  function renderPictureDropdown(matches, query) {
    if (!DOM.pictureAutocompleteDropdown) return;

    if (matches.length === 0) {
      DOM.pictureAutocompleteDropdown.innerHTML = `
        <div class="no-match-item">
          <span>No Discord member found matching "<strong>${escapeHtml(query)}</strong>"</span>
        </div>
      `;
      DOM.pictureAutocompleteDropdown.style.display = 'block';
      return;
    }

    const activeGuessed = getActivePictureGuessedIds();

    let html = '';
    matches.forEach((item, idx) => {
      const { member, matchedAlias } = item;
      const isGuessed = activeGuessed.has(member.id);
      const isActive = idx === state.pictureSelectedDropdownIndex ? 'active-item' : '';
      const guessedClass = isGuessed ? 'already-guessed' : '';
      const imgSrc = getMemberImage(member);
      const highlightedName = highlightQuery(member.name, query);

      let aliasesHtml = '';
      if (member.aliases && member.aliases.length > 0) {
        const aliasItems = member.aliases.map(a => {
          if (matchedAlias && a.toLowerCase() === matchedAlias.toLowerCase()) {
            return `<span class="alias-match-tag">AKA: ${highlightQuery(a, query)}</span>`;
          }
          return `<span>${escapeHtml(a)}</span>`;
        }).join(', ');
        aliasesHtml = `<div class="item-aliases">${aliasItems}</div>`;
      }

      const statusBadge = isGuessed 
        ? `<span class="item-badge" style="opacity:0.6; color:#888;">GUESSED</span>` 
        : `<span class="item-badge">#${member.index || idx + 1}</span>`;

      html += `
        <div class="dropdown-item ${isActive} ${guessedClass}" data-index="${idx}" data-id="${member.id}">
          <div class="item-left">
            <div class="item-avatar">
              <img src="${escapeHtml(imgSrc)}" class="item-avatar-img" alt="" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='inline';" />
              <span class="item-avatar-fallback" style="display:none;">👤</span>
            </div>
            <div class="item-details">
              <span class="item-primary-name">${highlightedName}</span>
              ${aliasesHtml}
            </div>
          </div>
          <div class="item-right">${statusBadge}</div>
        </div>
      `;
    });

    DOM.pictureAutocompleteDropdown.innerHTML = html;
    DOM.pictureAutocompleteDropdown.style.display = 'block';

    DOM.pictureAutocompleteDropdown.querySelectorAll('.dropdown-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-index'), 10);
        selectPictureMatchByIndex(idx);
      });
      el.addEventListener('mouseenter', () => {
        const idx = parseInt(el.getAttribute('data-index'), 10);
        updateActivePictureDropdownItem(idx);
      });
    });
  }

  function updateActivePictureDropdownItem(index) {
    if (!DOM.pictureAutocompleteDropdown) return;
    const items = DOM.pictureAutocompleteDropdown.querySelectorAll('.dropdown-item');
    items.forEach((item, i) => {
      item.classList.toggle('active-item', i === index);
      if (i === index) item.scrollIntoView({ block: 'nearest' });
    });
    state.pictureSelectedDropdownIndex = index;
  }

  function selectPictureMatchByIndex(index) {
    if (!state.pictureCurrentMatches || !state.pictureCurrentMatches[index]) return;
    const { member } = state.pictureCurrentMatches[index];
    DOM.pictureMemberInput.value = member.name;
    closePictureDropdown();
    handlePictureGuessSubmit();
  }

  function closePictureDropdown() {
    if (DOM.pictureAutocompleteDropdown) {
      DOM.pictureAutocompleteDropdown.style.display = 'none';
      DOM.pictureAutocompleteDropdown.innerHTML = '';
    }
    state.pictureSelectedDropdownIndex = -1;
  }

  function handlePictureInputKeydown(e) {
    const items = DOM.pictureAutocompleteDropdown 
      ? DOM.pictureAutocompleteDropdown.querySelectorAll('.dropdown-item') 
      : [];

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length === 0) return;
      state.pictureSelectedDropdownIndex = (state.pictureSelectedDropdownIndex + 1) % items.length;
      updateActivePictureDropdownItem(state.pictureSelectedDropdownIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length === 0) return;
      state.pictureSelectedDropdownIndex = (state.pictureSelectedDropdownIndex - 1 + items.length) % items.length;
      updateActivePictureDropdownItem(state.pictureSelectedDropdownIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (state.pictureSelectedDropdownIndex >= 0 && items[state.pictureSelectedDropdownIndex]) {
        selectPictureMatchByIndex(state.pictureSelectedDropdownIndex);
      } else {
        handlePictureGuessSubmit();
      }
    } else if (e.key === 'Escape') {
      closePictureDropdown();
    }
  }

  function shakePictureInput() {
    DOM.pictureMemberInput.style.animation = 'none';
    DOM.pictureMemberInput.offsetHeight;
    DOM.pictureMemberInput.style.borderColor = '#ff2a55';
    DOM.pictureMemberInput.style.boxShadow = '0 0 20px #ff2a55';

    setTimeout(() => {
      DOM.pictureMemberInput.style.borderColor = '';
      DOM.pictureMemberInput.style.boxShadow = '';
    }, 400);
  }

  function pulseAlreadyGuessedPicture(id) {
    const card = DOM.pictureGuessesList.querySelector(`[data-id="${id}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.style.transition = 'all 0.2s ease';
      card.style.transform = 'scale(1.03)';
      card.style.borderColor = '#f7d57f';
      card.style.boxShadow = '0 0 25px rgba(247, 213, 127, 0.8)';

      setTimeout(() => {
        card.style.transform = '';
        card.style.borderColor = '';
        card.style.boxShadow = '';
      }, 700);
    }
  }

  function handlePictureGuessSubmit() {
    const isDaily = state.pictureGameMode === 'daily';
    if (isDaily ? state.pictureDailyIsWon : state.picturePracticeIsWon) {
      return;
    }

    const query = DOM.pictureMemberInput.value.trim().toLowerCase();
    if (!query) {
      shakePictureInput();
      return;
    }

    const matchedMember = state.members.find(m => {
      if (m.name.toLowerCase() === query) return true;
      if (m.aliases && m.aliases.some(a => a.toLowerCase() === query)) return true;
      return false;
    });

    if (!matchedMember) {
      shakePictureInput();
      SoundFX.playError();
      return;
    }

    const activeGuessed = getActivePictureGuessedIds();
    if (activeGuessed.has(matchedMember.id)) {
      pulseAlreadyGuessedPicture(matchedMember.id);
      SoundFX.playError();
      DOM.pictureMemberInput.value = '';
      DOM.pictureClearInputBtn.style.display = 'none';
      closePictureDropdown();
      return;
    }

    logPictureGuess(matchedMember, null, true);

    DOM.pictureMemberInput.value = '';
    DOM.pictureClearInputBtn.style.display = 'none';
    closePictureDropdown();
    DOM.pictureMemberInput.focus();
  }

  function logPictureGuess(member, explicitResult = null, playSound = true) {
    const isDaily = state.pictureGameMode === 'daily';
    const target = state.pictureTarget;
    if (!target) return;

    const isMulti = target.type === 'multi' && target.requiredMemberIds.length > 1;
    const foundIds = isDaily ? state.pictureDailyFoundMemberIds : state.picturePracticeFoundMemberIds;

    let result = explicitResult;
    let detail = null;

    if (!result) {
      if (isMulti) {
        if (target.requiredMemberIds.includes(member.id)) {
          foundIds.add(member.id);
          const foundCount = target.requiredMemberIds.filter(id => foundIds.has(id)).length;
          const totalCount = target.requiredMemberIds.length;
          result = 'member-found';
          detail = `${foundCount}/${totalCount}`;
        } else {
          result = 'incorrect';
        }
      } else {
        const targetMemberId = target.requiredMemberIds[0];
        if (member.id === targetMemberId) {
          result = 'correct';
          foundIds.add(member.id);
        } else {
          result = 'incorrect';
        }
      }
    }

    const guessItem = { member, result, detail };

    if (isDaily) {
      state.pictureDailyGuessedIds.add(member.id);
      state.pictureDailyGuesses.unshift(guessItem);
    } else {
      state.picturePracticeGuessedIds.add(member.id);
      state.picturePracticeGuesses.unshift(guessItem);
    }

    updatePictureGuessCounter();

    if (DOM.pictureEmptyGuessesState && DOM.pictureEmptyGuessesState.parentNode) {
      DOM.pictureEmptyGuessesState.parentNode.removeChild(DOM.pictureEmptyGuessesState);
    }

    const card = createPictureGuessCard(member, result, detail);
    DOM.pictureGuessesList.prepend(card);

    // Win condition check
    let isWonNow = false;
    if (isMulti) {
      isWonNow = target.requiredMemberIds.every(id => foundIds.has(id));
    } else {
      isWonNow = result === 'correct';
    }

    renderPictureDisplay(target, foundIds, isWonNow);

    if (isDaily) {
      PictureDailyStateManager.save(
        state.currentDateKey,
        state.gameNumber,
        target.id,
        state.pictureDailyGuesses,
        state.pictureDailyFoundMemberIds,
        isWonNow || state.pictureDailyIsWon
      );
    }

    if (isWonNow) {
      const currentHistory = isDaily ? state.pictureDailyGuesses : state.picturePracticeGuesses;
      const guessNumber = currentHistory.length;

      if (isDaily) {
        state.pictureDailyIsWon = true;
        const stats = PictureStatsManager.recordWin(guessNumber, state.currentDateKey);
        updateStatsUI(stats);
        setPictureDailySolvedUI(true);
      } else {
        state.picturePracticeIsWon = true;
        if (target) {
          state.picturePracticeSolvedIds.add(target.id);
        }
        updatePicturePracticeUI();
      }

      if (playSound) {
        setTimeout(() => triggerPictureVictory(target, guessNumber, true), 900);
      }
    } else if (playSound) {
      if (result === 'member-found' || result === 'correct') {
        SoundFX.playGuessSuccess();
      } else {
        SoundFX.playError();
      }
    }
  }

  // --- Picture Victory Modal ---
  function triggerPictureVictory(picture, tries, withFanfare = true) {
    state.lastVictoryMode = 'picture';
    const isDaily = state.pictureGameMode === 'daily';
    const isMulti = picture.type === 'multi' && picture.requiredMemberIds.length > 1;

    if (withFanfare) {
      SoundFX.playWin();
      VictoryCelebration.start();
      flashVictoryScreen();
    }

    if (DOM.victoryQuoteBox) DOM.victoryQuoteBox.style.display = 'none';
    if (DOM.victoryEmojiBox) DOM.victoryEmojiBox.style.display = 'none';

    // Solved Picture Box
    if (DOM.victoryPictureBox) {
      DOM.victoryPictureBox.style.display = 'flex';
      DOM.victoryPictureBox.innerHTML = `<img src="${escapeHtml(picture.image)}" alt="Solved picture" />`;
    }

    if (DOM.victoryHeading) DOM.victoryHeading.textContent = 'VICTORY!';
    if (DOM.victorySubtitle) {
      DOM.victorySubtitle.textContent = isMulti 
        ? 'You identified all members in this picture!' 
        : 'You correctly identified who is in this picture!';
    }

    // Single vs Multi member presentation in victory modal
    if (DOM.victoryMemberCard && DOM.victoryMultiMembers) {
      if (isMulti) {
        DOM.victoryMemberCard.style.display = 'none';
        DOM.victoryMultiMembers.style.display = 'flex';

        let chipsHtml = '';
        picture.requiredMemberIds.forEach(mid => {
          const m = state.members.find(x => x.id === mid) || { id: mid, name: mid };
          const imgSrc = getMemberImage(m);
          chipsHtml += `
            <div class="victory-speaker-chip">
              <img src="${escapeHtml(imgSrc)}" class="victory-speaker-avatar" alt="${escapeHtml(m.name)}" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='inline';" />
              <span class="victory-speaker-fallback" style="display:none;">👤</span>
              <span class="victory-speaker-name">${escapeHtml(m.name)}</span>
            </div>
          `;
        });
        DOM.victoryMultiMembers.innerHTML = chipsHtml;
      } else {
        DOM.victoryMemberCard.style.display = 'flex';
        DOM.victoryMultiMembers.style.display = 'none';

        const authorId = picture.requiredMemberIds[0];
        const member = state.members.find(m => m.id === authorId) || { id: authorId, name: picture.requiredMemberNames[0] || authorId };
        const imgSrc = getMemberImage(member);

        if (DOM.victoryAvatar) {
          DOM.victoryAvatar.innerHTML = `
            <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(member.name)}" class="victory-avatar-img" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='inline';" />
            <span class="victory-avatar-fallback" style="display:none;">👑</span>
          `;
        }
        if (DOM.victoryMemberName) DOM.victoryMemberName.textContent = member.name;
        if (DOM.victoryAliases) {
          const aliasStr = member.aliases && member.aliases.length > 0 ? member.aliases.join(', ') : 'None';
          DOM.victoryAliases.textContent = `Aliases: ${aliasStr}`;
        }
      }
    }

    if (DOM.victoryGuessCount) {
      DOM.victoryGuessCount.textContent = `Solved in ${tries} ${tries === 1 ? 'try' : 'tries'}!`;
    }

    // Countdown Card
    if (DOM.victoryCountdownCard) {
      DOM.victoryCountdownCard.style.display = isDaily ? 'block' : 'none';
      const label = DOM.victoryCountdownCard.querySelector('.countdown-card-label');
      if (label) label.textContent = 'NEXT DAILY PICTURE IN';
    }

    // Stats Row
    if (DOM.victoryStatsRow) {
      DOM.victoryStatsRow.style.display = isDaily ? 'grid' : 'none';
      if (isDaily) {
        const stats = PictureStatsManager.get();
        if (DOM.vstatPlayed) DOM.vstatPlayed.textContent = stats.played;
        if (DOM.vstatWinPct) {
          const pct = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
          DOM.vstatWinPct.textContent = pct + '%';
        }
        if (DOM.vstatStreak) DOM.vstatStreak.textContent = '🔥 ' + stats.currentStreak;
        if (DOM.vstatMaxStreak) DOM.vstatMaxStreak.textContent = '⭐ ' + stats.maxStreak;
      }
    }

    if (DOM.victoryPracticeBtn) {
      DOM.victoryPracticeBtn.innerHTML = isDaily 
        ? '<span>🎲 PRACTICE MODE (UNLIMITED)</span>' 
        : '<span>🔄 NEXT PRACTICE PICTURE</span>';
    }

    if (DOM.victoryModal) {
      DOM.victoryModal.style.display = 'flex';
    }
  }

  function sharePictureResult(picture, tries, isPractice = false) {
    const dayInfo = getLocalDayInfo();
    const title = isPractice 
      ? `🖼️ ANTISIMPDLE PICTURE #Practice` 
      : `🖼️ ANTISIMPDLE PICTURE #${dayInfo.gameNumber}`;
    const sub = `👥 Member(s): ${picture.requiredMemberNames.join(' & ')}`;

    const history = isPractice ? state.picturePracticeGuesses : state.pictureDailyGuesses;
    const inOrder = [...history].reverse();
    const emojis = inOrder.map(g => (g.result === 'correct' || g.result === 'member-found') ? '🟩' : '🟥').join('');

    const webUrl = (window.location.origin && !window.location.origin.startsWith('file'))
      ? `${window.location.origin}${window.location.pathname}`
      : 'Antisimpdle';

    const text = `${title}\n${sub}\n🎯 Solved in ${tries} ${tries === 1 ? 'try' : 'tries'}!\n${emojis}\n\nPlay: ${webUrl}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('📋 Copied picture result to clipboard!');
        SoundFX.playTone(880, 'sine', 0.12, 0.08);
      }).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  // --- Picture Practice Mode Switching ---
  function togglePicturePracticeMode() {
    if (state.pictureGameMode === 'daily') {
      switchToPicturePracticeMode();
    } else {
      returnToPictureDailyMode();
    }
  }

  function switchToPicturePracticeMode() {
    state.pictureGameMode = 'practice';
    if (!state.picturePracticeTarget || state.picturePracticeIsWon) {
      pickNewPicturePracticeTarget();
    } else {
      state.pictureTarget = state.picturePracticeTarget;
      renderPictureBoardFromState(state.picturePracticeGuesses);
      renderPictureDisplay(state.picturePracticeTarget, state.picturePracticeFoundMemberIds, state.picturePracticeIsWon);
      updatePicturePracticeUI();
    }
    SoundFX.playSelect();
  }

  function pickNewPicturePracticeTarget() {
    if (!state.pictures || state.pictures.length === 0) return;
    let pool = state.pictures.filter(p => 
      (!state.pictureDailyTarget || p.id !== state.pictureDailyTarget.id) &&
      (!state.picturePracticeTarget || p.id !== state.picturePracticeTarget.id) &&
      !state.picturePracticeSolvedIds.has(p.id)
    );

    // If all practice pictures have been solved in this session, reset the pool cycle
    if (pool.length === 0) {
      state.picturePracticeSolvedIds.clear();
      pool = state.pictures.filter(p => 
        (!state.pictureDailyTarget || p.id !== state.pictureDailyTarget.id) &&
        (!state.picturePracticeTarget || p.id !== state.picturePracticeTarget.id)
      );
      showToast('🔁 All pictures solved! Resetting practice pool.');
    }

    const chosen = pool[Math.floor(Math.random() * pool.length)] || state.pictures[0];

    state.picturePracticeTarget = chosen;
    state.pictureTarget = chosen;
    state.picturePracticeGuesses = [];
    state.picturePracticeGuessedIds.clear();
    state.picturePracticeFoundMemberIds.clear();
    state.picturePracticeFocusPoint = getRandomPictureFocusPoint();
    state.picturePracticeIsWon = false;

    renderPictureBoardFromState([]);
    renderPictureDisplay(chosen, state.picturePracticeFoundMemberIds, false);
    updatePicturePracticeUI();

    if (DOM.alreadySolvedPictureBanner) DOM.alreadySolvedPictureBanner.style.display = 'none';
    if (DOM.picturePracticeSolvedBanner) DOM.picturePracticeSolvedBanner.style.display = 'none';
    if (DOM.victoryModal) DOM.victoryModal.style.display = 'none';
    VictoryCelebration.stop();
  }

  function restartPicturePractice() {
    state.picturePracticeSolvedIds.clear();
    state.picturePracticeTarget = null;
    pickNewPicturePracticeTarget();
    showToast('🔁 Picture practice restarted!');
    SoundFX.playTone(440, 'sine', 0.12);
  }

  function returnToPictureDailyMode() {
    state.pictureGameMode = 'daily';
    state.pictureTarget = state.pictureDailyTarget;

    renderPictureBoardFromState(state.pictureDailyGuesses);
    renderPictureDisplay(state.pictureDailyTarget, state.pictureDailyFoundMemberIds, state.pictureDailyIsWon);

    if (DOM.pictureHeaderTitle) DOM.pictureHeaderTitle.textContent = 'PICTURE MODE';
    if (DOM.pictureDailyBadge) {
      DOM.pictureDailyBadge.textContent = 'DAILY #' + state.gameNumber;
      DOM.pictureDailyBadge.style.background = '';
      DOM.pictureDailyBadge.style.color = '';
    }
    if (DOM.pictureCountdownWrap) DOM.pictureCountdownWrap.style.display = 'inline-block';
    if (DOM.picturePracticeToggleText) DOM.picturePracticeToggleText.textContent = 'Practice Mode';
    if (DOM.picturePracticeToggleIcon) DOM.picturePracticeToggleIcon.textContent = '🎲';
    if (DOM.picturePracticeSolvedBanner) DOM.picturePracticeSolvedBanner.style.display = 'none';

    setPictureDailySolvedUI(state.pictureDailyIsWon);
    SoundFX.playSelect();
  }

  function resetPictureGame() {
    if (state.pictureGameMode === 'daily') {
      if (state.pictureDailyIsWon) {
        showToast('👑 You already solved today! Play Practice Mode to guess more.');
        return;
      }
      if (state.pictureDailyGuesses.length === 0) return;
      if (confirm("Reset today's daily picture guesses and restart from 0?")) {
        state.pictureDailyGuessedIds.clear();
        state.pictureDailyFoundMemberIds.clear();
        state.pictureDailyGuesses = [];
        state.pictureDailyIsWon = false;
        PictureDailyStateManager.clear();
        renderPictureBoardFromState([]);
        renderPictureDisplay(state.pictureDailyTarget, state.pictureDailyFoundMemberIds, false);
        setPictureDailySolvedUI(false);
        SoundFX.playTone(320, 'sine', 0.15);
      }
    } else {
      if (confirm('Restart practice mode and reset your solved picture puzzles?')) {
        restartPicturePractice();
      }
    }
  }

  // --- Members Modal Roster ---
  function openMembersModal() {
    DOM.membersModal.style.display = 'flex';
    DOM.modalSearchInput.value = '';
    filterModalGrid('');
    DOM.modalSearchInput.focus();
    SoundFX.playSelect();
  }

  function closeMembersModal() {
    DOM.membersModal.style.display = 'none';
  }

  // --- Update Log Modal ---
  function openUpdateLogModal() {
    if (DOM.updateLogModal) {
      DOM.updateLogModal.style.display = 'flex';
      SoundFX.playSelect();
    }
  }

  function closeUpdateLogModal() {
    if (DOM.updateLogModal) {
      DOM.updateLogModal.style.display = 'none';
      SoundFX.playClick();
    }
  }

  function populateModalRoster(members) {
    renderModalGrid(members);
  }

  function handleModalSearch() {
    const query = DOM.modalSearchInput.value.trim().toLowerCase();
    filterModalGrid(query);
  }

  function filterModalGrid(query) {
    if (!query) {
      renderModalGrid(state.members);
      return;
    }

    const filtered = state.members.filter(m => {
      if (m.name.toLowerCase().includes(query)) return true;
      if (m.aliases && m.aliases.some(a => a.toLowerCase().includes(query))) return true;
      return false;
    });

    renderModalGrid(filtered);
  }

  function renderModalGrid(members) {
    if (!DOM.modalMembersGrid) return;

    if (members.length === 0) {
      DOM.modalMembersGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:30px; color:var(--text-dim);">
          No members found matching your filter.
        </div>
      `;
      return;
    }

    const activeGuessed = getActiveGuessedIds();

    let html = '';
    members.forEach(member => {
      const imgSrc = getMemberImage(member);
      const aliasStr = member.aliases && member.aliases.length > 0 
        ? member.aliases.join(', ') 
        : 'None';

      const isGuessed = activeGuessed.has(member.id);
      const opacity = isGuessed ? 'style="opacity: 0.55;"' : '';

      html += `
        <div class="grid-member-card" data-name="${escapeHtml(member.name)}" ${opacity}>
          <div class="grid-avatar">
            <img src="${escapeHtml(imgSrc)}" class="grid-avatar-img" alt="" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='inline';" />
            <span class="grid-avatar-fallback" style="display:none;">👤</span>
          </div>
          <div class="grid-info">
            <span class="grid-name">${escapeHtml(member.name)}</span>
            <span class="grid-aliases" title="Aliases: ${escapeHtml(aliasStr)}">AKA: ${escapeHtml(aliasStr)}</span>
          </div>
        </div>
      `;
    });

    DOM.modalMembersGrid.innerHTML = html;

    DOM.modalMembersGrid.querySelectorAll('.grid-member-card').forEach(card => {
      card.addEventListener('click', () => {
        const name = card.getAttribute('data-name');
        if (name) {
          if (state.activeView === 'quote') {
            DOM.quoteMemberInput.value = name;
            DOM.quoteClearInputBtn.style.display = 'block';
            closeMembersModal();
            DOM.quoteMemberInput.focus();
            handleQuoteInputChange();
            SoundFX.playSelect();
          } else if (state.activeView === 'emoji') {
            DOM.emojiMemberInput.value = name;
            DOM.emojiClearInputBtn.style.display = 'block';
            closeMembersModal();
            DOM.emojiMemberInput.focus();
            handleEmojiInputChange();
            SoundFX.playSelect();
          } else if (state.activeView === 'picture') {
            DOM.pictureMemberInput.value = name;
            DOM.pictureClearInputBtn.style.display = 'block';
            closeMembersModal();
            DOM.pictureMemberInput.focus();
            handlePictureInputChange();
            SoundFX.playSelect();
          } else {
            if (state.activeView !== 'classic') {
              showView('classic', false);
            }
            DOM.input.value = name;
            DOM.clearBtn.style.display = 'block';
            closeMembersModal();
            DOM.input.focus();
            handleInputChange();
            SoundFX.playSelect();
          }
        }
      });
    });
  }

  // --- Utility Helpers ---
  function getInitials(name) {
    if (!name) return '?';
    const clean = name.replace(/[^a-zA-Z0-9 ]/g, '').trim();
    const parts = clean.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ==========================================================================
  // CASES & CS:GO LOOTBOX UNBOXING ENGINE
  // ==========================================================================

  const CaseCollectionManager = {
    KEY: 'antisimpdle_case_inventory',
    SCHEMA_VERSION: 2,

    // Mapping table from original 25-item launch on https://antisimp.online/ to the expanded 106-item roster
    V1_TO_V2_ITEM_MAP: {
      'loot_1': 'loot_1',   // Chomnk I Big Yahu (common -> common)
      'loot_2': 'loot_8',   // Kifle (common -> common)
      'loot_3': 'loot_10',  // Mjau (common -> common)
      'loot_4': 'loot_19',  // Dino Jede Kekse (uncommon -> uncommon)
      'loot_5': 'loot_26',  // Og Gang Incident (uncommon -> uncommon)
      'loot_6': 'loot_29',  // Roko Milkovic Zlatna Medalja (uncommon -> uncommon)
      'loot_7': 'loot_32',  // Wyz Guza (uncommon -> uncommon)
      'loot_8': 'loot_35',  // Bindi Gooner (rare -> rare)
      'loot_9': 'loot_37',  // Dino Gooner (rare -> rare)
      'loot_10': 'loot_40', // Lean (rare -> rare)
      'loot_11': 'loot_42', // Mladi Geoloki (rare -> rare)
      'loot_12': 'loot_43', // Mladi Riza (rare -> rare)
      'loot_13': 'loot_53', // Bindi Gets Slapped (epic -> epic)
      'loot_14': 'loot_54', // Bindi Rizz (epic -> epic)
      'loot_15': 'loot_60', // Kuhanje (epic -> epic)
      'loot_16': 'loot_62', // Og Jajce (epic -> epic)
      'loot_17': 'loot_65', // Dinina Cura (legendary -> legendary)
      'loot_18': 'loot_68', // Kola Incident (legendary -> legendary)
      'loot_19': 'loot_70', // Nikola Cummanje U Hlace Incident (legendary -> legendary)
      'loot_20': 'loot_72', // Slika Dinine Kuce (legendary -> legendary)
      'loot_21': 'loot_74', // Chomnk Ko Dijete (mythic -> mythic)
      'loot_22': 'loot_78', // Kaneki Login Info (mythic -> mythic)
      'loot_23': 'loot_79', // Krof I Madison (mythic -> mythic)
      'loot_24': 'loot_88', // Sara Borko Sise (divine -> divine)
      'loot_25': 'loot_89'  // Sara Borko Sise Prime (hell -> hell)
    },

    get() {
      try {
        const raw = localStorage.getItem(this.KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return this.migrateIfNeeded(parsed, raw);
        }
      } catch (e) {
        console.error('[CaseCollectionManager] Failed to load inventory:', e);
      }
      return {
        schemaVersion: this.SCHEMA_VERSION,
        totalOpened: 0,
        unlockedItems: {},
        rarityCounts: {}
      };
    },

    migrateIfNeeded(data, raw) {
      if (!data || typeof data !== 'object') {
        return {
          schemaVersion: this.SCHEMA_VERSION,
          totalOpened: 0,
          unlockedItems: {},
          rarityCounts: {}
        };
      }

      // If already at schemaVersion 2 or higher, it's fully up-to-date!
      if (data.schemaVersion && data.schemaVersion >= this.SCHEMA_VERSION) {
        return data;
      }

      const unlocked = data.unlockedItems || {};
      const keys = Object.keys(unlocked);

      // If inventory is empty, simply stamp schemaVersion 2
      if (keys.length === 0) {
        data.schemaVersion = this.SCHEMA_VERSION;
        this.save(data);
        return data;
      }

      // If inventory contains any ID > 25, it was already created on the 106-item roster
      const hasV2OnlyIds = keys.some(id => {
        const num = parseInt(id.replace('loot_', ''), 10);
        return !isNaN(num) && num > 25;
      });

      if (hasV2OnlyIds) {
        data.schemaVersion = this.SCHEMA_VERSION;
        this.save(data);
        return data;
      }

      // --- AUTOMATIC SMOOTH IMPORT FROM V1 (25 ITEMS) TO V2 (106 ITEMS) ---
      // 1. Create a safe raw backup in localStorage so user data is never lost
      try {
        if (raw && !localStorage.getItem('antisimpdle_case_inventory_v1_backup')) {
          localStorage.setItem('antisimpdle_case_inventory_v1_backup', raw);
        }
      } catch (e) {
        console.warn('[CaseCollectionManager] Backup warning:', e);
      }

      const newUnlocked = {};
      let migratedCount = 0;

      for (const [oldId, record] of Object.entries(unlocked)) {
        const newId = this.V1_TO_V2_ITEM_MAP[oldId];
        if (newId) {
          newUnlocked[newId] = {
            ...record,
            id: newId,
            count: (record.count && record.count > 0) ? record.count : 1,
            token: record.token || null,
            firstUnlocked: record.firstUnlocked || Date.now(),
            lastUnlocked: record.lastUnlocked || Date.now()
          };
          migratedCount++;
        } else {
          newUnlocked[oldId] = record;
        }
      }

      data.unlockedItems = newUnlocked;
      data.schemaVersion = this.SCHEMA_VERSION;
      data.migratedAt = Date.now();
      data.migratedFrom = 'v1_25_items';

      // 2. Recompute accurate rarityCounts based on new items definition
      const casesData = window.CASES_DATA;
      const newRarityCounts = {};
      if (casesData && Array.isArray(casesData.items)) {
        for (const [itemId, rec] of Object.entries(newUnlocked)) {
          const it = casesData.items.find(x => x.id === itemId);
          if (it && it.rarity) {
            newRarityCounts[it.rarity] = (newRarityCounts[it.rarity] || 0) + (rec.count || 1);
          }
        }
      }
      data.rarityCounts = newRarityCounts;

      // 3. Save the migrated inventory seamlessly
      this.save(data);

      console.log(`[CaseCollectionManager] 🎉 Automatically migrated ${migratedCount} item(s) from v1 to v2!`);

      // 4. Set session notice for a polite toast
      try {
        sessionStorage.setItem('antisimpdle_imported_v1_notice', String(migratedCount));
      } catch (e) {}

      return data;
    },

    save(data) {
      try {
        if (data && typeof data === 'object') {
          data.schemaVersion = this.SCHEMA_VERSION;
        }
        localStorage.setItem(this.KEY, JSON.stringify(data));
      } catch (e) {}
    },

    recordItem(item, token = null) {
      const data = this.get();
      data.totalOpened = (data.totalOpened || 0) + 1;
      const now = Date.now();
      const existing = data.unlockedItems[item.id];
      const isNew = !existing;

      if (!existing) {
        data.unlockedItems[item.id] = {
          id: item.id,
          count: 1,
          token: token,
          firstUnlocked: now,
          lastUnlocked: now
        };
      } else {
        existing.count = (existing.count || 0) + 1;
        existing.lastUnlocked = now;
        if (token) existing.token = token;
      }

      if (!data.rarityCounts) data.rarityCounts = {};
      data.rarityCounts[item.rarity] = (data.rarityCounts[item.rarity] || 0) + 1;

      this.save(data);
      return { isNew, count: data.unlockedItems[item.id].count, totalOpened: data.totalOpened };
    },

    recordRewardItem(item) {
      const data = this.get();
      const now = Date.now();
      const existing = data.unlockedItems[item.id];
      const isNew = !existing;

      if (!existing) {
        data.unlockedItems[item.id] = {
          id: item.id,
          count: 1,
          token: null,
          firstUnlocked: now,
          lastUnlocked: now
        };
      } else {
        existing.count = (existing.count || 0) + 1;
        existing.lastUnlocked = now;
      }

      if (!data.rarityCounts) data.rarityCounts = {};
      data.rarityCounts[item.rarity] = (data.rarityCounts[item.rarity] || 0) + 1;

      this.save(data);
      return { isNew, count: data.unlockedItems[item.id].count, totalOpened: data.totalOpened || 0 };
    },

    clear() {
      try {
        localStorage.removeItem(this.KEY);
      } catch (e) {}
    }
  };

  // Roll item based on exact rarity probabilities:
  // Normal Open: HELL 0.001%, Divine 0.1%, Rainbow 0.2%, Secret 0.5%, Mythic 1%, Legendary 2%, Epic 5%, Verity 10%, Rare 15%, Uncommon 26%, Common 40.199%
  // Fast Open: HELL 0.001%, Divine 0.1%, Secret 0.5%, Mythic 1%, Legendary 2%, Epic 5%, Rare 15%, Uncommon 30%, Common 46.399% (Verity & Rainbow = 0%)
  function rollCaseItem(mode = 'normal') {
    const data = window.CASES_DATA;
    if (!data || !data.items || data.items.length === 0) return null;

    const r = Math.random() * 100;
    let chosenRarity = 'common';

    if (mode === 'normal') {
      if (r < 0.001) {
        chosenRarity = 'hell';        // 0.001%
      } else if (r < 0.101) {
        chosenRarity = 'divine';      // 0.1%
      } else if (r < 0.301) {
        chosenRarity = 'rainbow';     // 0.2%
      } else if (r < 0.801) {
        chosenRarity = 'secret';      // 0.5%
      } else if (r < 1.801) {
        chosenRarity = 'mythic';      // 1.0%
      } else if (r < 3.801) {
        chosenRarity = 'legendary';   // 2.0%
      } else if (r < 8.801) {
        chosenRarity = 'epic';        // 5.0%
      } else if (r < 18.801) {
        chosenRarity = 'verity';      // 10.0%
      } else if (r < 33.801) {
        chosenRarity = 'rare';        // 15.0%
      } else if (r < 59.801) {
        chosenRarity = 'uncommon';    // 26.0%
      } else {
        chosenRarity = 'common';      // 40.199%
      }
    } else {
      // Fast mode: Verity & Rainbow CANNOT drop (0%)
      if (r < 0.001) {
        chosenRarity = 'hell';        // 0.001%
      } else if (r < 0.101) {
        chosenRarity = 'divine';      // 0.1%
      } else if (r < 0.601) {
        chosenRarity = 'secret';      // 0.5%
      } else if (r < 1.601) {
        chosenRarity = 'mythic';      // 1.0%
      } else if (r < 3.601) {
        chosenRarity = 'legendary';   // 2.0%
      } else if (r < 8.601) {
        chosenRarity = 'epic';        // 5.0%
      } else if (r < 23.601) {
        chosenRarity = 'rare';        // 15.0%
      } else if (r < 53.601) {
        chosenRarity = 'uncommon';    // 30.0%
      } else {
        chosenRarity = 'common';      // 46.399%
      }
    }

    const pool = data.items.filter(item => item.rarity === chosenRarity && (mode === 'normal' || item.exclusiveMode !== 'normal'));
    if (!pool || pool.length === 0) {
      const fallbackPool = data.items.filter(item => (mode === 'normal' || item.exclusiveMode !== 'normal') && item.rarity !== 'album' && item.rarity !== 'milestone');
      return fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Format rarity drop chance for display based on active odds mode
  function formatRarityChance(r, mode = state.oddsDisplayMode || 'normal') {
    if (!r) return '';
    if (mode === 'normal') {
      if (r.key === 'common') return '40%';
      if (r.key === 'uncommon') return '26%';
      if (r.key === 'verity') return '10%';
      if (r.key === 'rainbow') return '0.2%';
      if (r.displayChance) return r.displayChance;
      return `${r.chance}%`;
    } else {
      if (r.key === 'common') return '46%';
      if (r.key === 'uncommon') return '30%';
      if (r.key === 'verity') return '0%';
      if (r.key === 'rainbow') return '0%';
      if (r.fastDisplayChance) return r.fastDisplayChance;
      if (r.fastChance != null) return `${r.fastChance}%`;
      return `${r.chance}%`;
    }
  }

  // Render interactive Odds Grid in Cases view (with Normal Open vs Fast Open toggle)
  function renderCasesOddsGrid(mode = state.oddsDisplayMode || 'normal') {
    if (!DOM.casesOddsGrid || !window.CASES_DATA) return;
    state.oddsDisplayMode = mode;

    // Update toggle buttons active state
    if (DOM.oddsToggleNormalBtn && DOM.oddsToggleFastBtn) {
      if (mode === 'normal') {
        DOM.oddsToggleNormalBtn.classList.add('active');
        DOM.oddsToggleFastBtn.classList.remove('active');
      } else {
        DOM.oddsToggleFastBtn.classList.add('active');
        DOM.oddsToggleNormalBtn.classList.remove('active');
      }
    }

    // Only include rarities that can actually drop from cases (exclude reward-only tiers like Album and Milestone)
    const rarities = window.CASES_DATA.rarities.filter(r => !r.isRewardOnly);

    // Row 1: Common, Uncommon, Rare, Verity, Epic, Legendary (6 items)
    const row1Rarities = rarities.slice(0, 6);
    // Row 2: Mythic, Secret, Rainbow, Divine, HELL (5 items)
    const row2Rarities = rarities.slice(6);

    const renderItem = (r) => {
      const isLockedInFast = mode === 'fast' && (r.key === 'verity' || r.key === 'rainbow');
      const lockedClass = isLockedInFast ? 'odds-item-locked' : '';
      const chanceText = formatRarityChance(r, mode);
      const lockedBadge = isLockedInFast ? `<span class="odds-locked-badge">🔒 NORMAL ONLY</span>` : '';

      const isRainbow = r.key === 'rainbow';
      return `
        <div class="odds-item ${lockedClass} rarity-${r.key}" data-rarity="${r.key}" title="${escapeHtml(r.name)} (${chanceText})${isLockedInFast ? ' - Normal Open Only' : ''}" style="${isRainbow ? '' : `border-color:${r.color}66; box-shadow:0 0 8px ${r.glow};`}">
          <div class="odds-orb-thumb-wrap">
            <img src="${escapeHtml(r.orbImage)}" alt="${escapeHtml(r.name)} Orb" class="odds-orb-img" style="${isRainbow ? '' : `filter: drop-shadow(0 0 8px ${r.glow});`}" loading="lazy" />
          </div>
          <div class="odds-rarity-header">
            <span class="odds-color-dot" style="${isRainbow ? '' : `background:${r.color}; box-shadow:0 0 8px ${r.glow};`}"></span>
            <span class="odds-rarity-name" style="${isRainbow ? '' : `color:${r.color};`}">${escapeHtml(r.name)}</span>
          </div>
          <span class="odds-chance">${chanceText}</span>
          ${lockedBadge}
        </div>
      `;
    };

    let html = `<div class="odds-row odds-row-1">`;
    row1Rarities.forEach(r => { html += renderItem(r); });
    html += `</div><div class="odds-row odds-row-2">`;
    row2Rarities.forEach(r => { html += renderItem(r); });
    html += `</div>`;

    DOM.casesOddsGrid.innerHTML = html;
  }

  // Serverless backend API base URL (Vercel)
  // When running locally on localhost, use relative '' to hit local server.py
  // When running on Vercel itself, use relative ''
  // When running on GitHub Pages (antisimp.online or *.github.io), point to Vercel backend!
  const CASE_API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? ''
    : (window.location.hostname.includes('vercel.app')
      ? ''
      : 'https://antisimpdle.vercel.app');

  // ========================================================
  // CASE VAULT MEDIA MANAGER (WebAssembly + Vercel Server-Gated API)
  // ========================================================
  const CaseVaultManager = (() => {
    const mediaCache = new Map(); // itemId -> mediaUrl

    function setMediaUrl(itemId, url) {
      if (itemId && url) {
        mediaCache.set(itemId, url);
      }
    }

    function getCachedUrl(itemId) {
      if (!itemId) return null;
      if (mediaCache.has(itemId)) return mediaCache.get(itemId);

      // 1. For unencrypted items (Common to Secret), use the static file path directly
      const data = window.CASES_DATA;
      const itObj = data && data.items ? data.items.find(x => x.id === itemId) : null;
      if (itObj && !itObj.isEncrypted && itObj.path) {
        mediaCache.set(itemId, itObj.path);
        return itObj.path;
      }

      // 2. Server-gated items (Verity & Rainbow): check if unlocked in inventory with token
      if (itObj && itObj.serverGated) {
        const inv = CaseCollectionManager.get();
        const record = inv && inv.unlockedItems ? inv.unlockedItems[itemId] : null;
        if (record && record.token) {
          const mediaUrl = `${CASE_API_BASE}/api/media?id=${encodeURIComponent(itemId)}&token=${encodeURIComponent(record.token)}`;
          mediaCache.set(itemId, mediaUrl);
          return mediaUrl;
        }
        return null;
      }

      return null;
    }

    // Decrypts encrypted items through WebAssembly (Divine/HELL/Milestones) or Vercel server API (Verity/Rainbow)
    async function getItemMediaUrl(item) {
      if (!item) return null;
      if (mediaCache.has(item.id)) return mediaCache.get(item.id);

      // 1. Unencrypted items (Common to Secret)
      if (!item.isEncrypted && item.path) {
        mediaCache.set(item.id, item.path);
        return item.path;
      }

      // 2. WebAssembly Client-Side Encrypted items (Divine, HELL & Milestones): Decrypt purely in browser memory
      if (item.isEncrypted && item.vaultFile && item.itemCode && window.WasmVault) {
        try {
          if (item.isYouTube || item.mimeType === 'application/json') {
            const decJson = await window.WasmVault.decryptJson(item.vaultFile, item.itemCode);
            if (decJson) {
              item.youtubeUrl = decJson.url;
              item.youtubeEmbedUrl = decJson.embedUrl;
              const resultUrl = item.youtubeEmbedUrl || item.youtubeUrl || item.thumbPath || item.path;
              mediaCache.set(item.id, resultUrl);
              return resultUrl;
            }
          }
          const blobUrl = await window.WasmVault.decryptFile(item.vaultFile, item.itemCode, item.mimeType || 'image/jpeg');
          if (blobUrl) {
            mediaCache.set(item.id, blobUrl);
            return blobUrl;
          }
        } catch (err) {
          console.error('[CaseVaultManager] WebAssembly decryption error:', err);
        }
      }

      // 3. Server-Gated Encrypted items (Verity & Rainbow): Decrypt via Vercel Server API
      if (item.serverGated) {
        const inv = CaseCollectionManager.get();
        const record = inv && inv.unlockedItems ? inv.unlockedItems[item.id] : null;
        if (record && record.token) {
          const mediaUrl = `${CASE_API_BASE}/api/media?id=${encodeURIComponent(item.id)}&token=${encodeURIComponent(record.token)}`;
          mediaCache.set(item.id, mediaUrl);
          return mediaUrl;
        }
        return null;
      }

      // 4. Fallback for unencrypted static items
      if (!item.isEncrypted && item.path) {
        mediaCache.set(item.id, item.path);
        return item.path;
      }

      return null;
    }

    function hasDecrypted(itemId) {
      return !!getCachedUrl(itemId);
    }

    return {
      setMediaUrl,
      getItemMediaUrl,
      getCachedUrl,
      hasDecrypted
    };
  })();

  // Generate a card DOM element for the roulette reel (Generic mystery image while rolling)
  function createRouletteCard(item, isRevealed = false) {
    const card = document.createElement('div');
    card.className = `roulette-card rarity-${item.rarity}`;
    card.style.borderColor = `${item.rarityColor}55`;
    card.dataset.itemId = item.id;
    card.dataset.rarity = item.rarity;

    if (isRevealed) {
      const cachedUrl = CaseVaultManager.getCachedUrl(item.id);
      const vidBadge = item.isVideo ? `<span class="roulette-card-vid-tag">▶ VID</span>` : '';
      const thumbSrc = item.thumbPath || cachedUrl || '';
      const isThumbVideo = item.isVideo && !item.thumbPath;
      card.innerHTML = `
        <div class="roulette-card-thumb-wrap">
          ${isThumbVideo 
            ? `<video src="${cachedUrl ? escapeHtml(cachedUrl) : ''}" data-vault-item="${item.id}" muted playsinline class="roulette-card-thumb" preload="metadata"></video>`
            : `<img src="${thumbSrc ? escapeHtml(thumbSrc) : ''}" data-vault-item="${item.id}" alt="${escapeHtml(item.name)}" class="roulette-card-thumb" loading="lazy" />`
          }
          ${vidBadge}
        </div>
        <div class="roulette-card-details">
          <span class="roulette-card-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
          <span class="roulette-card-rarity" style="color:${item.rarityColor};">${escapeHtml(item.rarityName.toUpperCase())}</span>
        </div>
        <div class="roulette-card-strip" style="background:${item.rarityColor}; box-shadow:0 0 8px ${item.rarityGlow};"></div>
      `;
      if (!cachedUrl && !item.thumbPath) {
        CaseVaultManager.getItemMediaUrl(item).then(url => {
          if (!url) return;
          const el = card.querySelector(`[data-vault-item="${item.id}"]`);
          if (el) el.src = url;
        });
      }
    } else {
      // Mystery orb placeholder for each rarity while rolling
      const orbSrc = item.orbImage || `case opening/orbs/orb_${item.rarity}.png`;
      card.innerHTML = `
        <div class="roulette-card-thumb-wrap">
          <img src="${escapeHtml(orbSrc)}" alt="${escapeHtml(item.rarityName)} Orb" class="roulette-card-thumb roulette-mystery-thumb roulette-orb-thumb" loading="lazy" />
        </div>
        <div class="roulette-card-details">
          <span class="roulette-card-name">???</span>
          <span class="roulette-card-rarity" style="color:${item.rarityColor};">${escapeHtml(item.rarityName.toUpperCase())}</span>
        </div>
        <div class="roulette-card-strip" style="background:${item.rarityColor}; box-shadow:0 0 8px ${item.rarityGlow};"></div>
      `;
    }
    return card;
  }

  // Reveal winning card on landing
  async function revealWinnerCard(winCardEl, item) {
    if (!winCardEl) return;
    winCardEl.classList.add('card-winner', 'card-winner-revealed');
    winCardEl.style.borderColor = item.rarityColor;
    winCardEl.style.boxShadow = `0 0 30px ${item.rarityGlow}, inset 0 0 15px ${item.rarityGlow}`;
    
    const thumbWrap = winCardEl.querySelector('.roulette-card-thumb-wrap');
    const nameEl = winCardEl.querySelector('.roulette-card-name');
    
    if (nameEl) {
      nameEl.textContent = item.name;
      nameEl.title = item.name;
      nameEl.style.color = '#fff';
      nameEl.style.fontWeight = '800';
    }

    const mediaUrl = await CaseVaultManager.getItemMediaUrl(item);

    if (thumbWrap && mediaUrl) {
      const vidBadge = item.isVideo ? `<span class="roulette-card-vid-tag">▶ VID</span>` : '';
      thumbWrap.innerHTML = `
        ${item.isVideo 
          ? `<video src="${escapeHtml(mediaUrl)}" autoplay muted loop playsinline class="roulette-card-thumb"></video>`
          : `<img src="${escapeHtml(mediaUrl)}" alt="${escapeHtml(item.name)}" class="roulette-card-thumb" />`
        }
        ${vidBadge}
      `;
    }
  }

  // Populate Initial Reel with Mystery Cards
  function initCasesRoulette() {
    if (!DOM.casesRouletteTrack || !window.CASES_DATA) return;
    DOM.casesRouletteTrack.style.transition = 'none';
    DOM.casesRouletteTrack.style.transform = 'translateX(0px)';
    DOM.casesRouletteTrack.innerHTML = '';

    // Create 15 initial preview mystery items
    const items = window.CASES_DATA.items;
    for (let i = 0; i < 15; i++) {
      const it = items[i % items.length];
      DOM.casesRouletteTrack.appendChild(createRouletteCard(it, false));
    }
  }

  // Reset stage to idle state
  let reelEntranceTimer = null;
  let spinStartTimer = null;
  let spinAnimationTimer = null;
  let tickRafId = null;

  function resetCaseOpeningStage() {
    clearTimeout(reelEntranceTimer);
    clearTimeout(spinStartTimer);
    clearTimeout(spinAnimationTimer);
    if (tickRafId) cancelAnimationFrame(tickRafId);
    state.caseIsSpinning = false;

    if (DOM.openCaseBtn) {
      DOM.openCaseBtn.disabled = false;
      const btnText = DOM.openCaseBtn.querySelector('.btn-text');
      if (btnText) btnText.textContent = 'OPEN CASE';
    }
    if (DOM.quickOpenCaseBtn) DOM.quickOpenCaseBtn.disabled = false;

    if (DOM.caseStageArea) {
      DOM.caseStageArea.classList.remove('is-opening');
    }
    if (DOM.caseOpenVideo) {
      DOM.caseOpenVideo.pause();
      DOM.caseOpenVideo.currentTime = 0;
      DOM.caseOpenVideo.style.display = 'none';
    }
    if (DOM.caseStaticBoxImg) {
      DOM.caseStaticBoxImg.style.display = 'block';
    }
    if (DOM.casesRouletteViewport) {
      DOM.casesRouletteViewport.classList.remove('reel-active');
    }
  }

  // Start Case Opening (Normal synced to video or Instant Quick Open with NO animation)
  async function startCaseOpening(isFast = false) {
    if (state.caseIsSpinning) return;
    if (!window.CASES_DATA || !window.CASES_DATA.items) return;

    state.caseIsSpinning = true;
    if (DOM.openCaseBtn) {
      DOM.openCaseBtn.disabled = true;
      const btnText = DOM.openCaseBtn.querySelector('.btn-text');
      if (btnText) btnText.textContent = 'OPENING...';
    }
    if (DOM.quickOpenCaseBtn) DOM.quickOpenCaseBtn.disabled = true;

    // QUICK OPEN: Instant unbox with NO animation (Verity & Rainbow CANNOT drop!)
    if (isFast) {
      const winner = rollCaseItem('fast');
      if (!winner) {
        resetCaseOpeningStage();
        return;
      }

      const mediaPromise = CaseVaultManager.getItemMediaUrl(winner);

      // Record immediately to collection
      const result = CaseCollectionManager.recordItem(winner);
      updateCasesCollectionUI();
      checkMilestoneUnlockTrigger(winner, result);

      // Play Item Obtain Audio immediately!
      if (SoundFX.enabled) {
        const obtainAudio = DOM.itemObtainAudio || document.getElementById('itemObtainAudio');
        if (obtainAudio) {
          obtainAudio.currentTime = 0;
          obtainAudio.volume = 0.95;
          obtainAudio.play().catch(() => {});
        }
        SoundFX.playRarityReveal(winner.rarity);
      }

      // Await media if decrypting
      const mediaUrl = await mediaPromise;

      // Open Reveal Modal immediately without any delay or animation!
      openCasesRevealModal(winner, result, mediaUrl);
      resetCaseOpeningStage();
      return;
    }

    // NORMAL MODE OPENING:
    // Rate-limited to ~1 request per 10s via server API (matches ~9.75s animation)
    let winner = null;
    let serverToken = null;
    let serverMediaUrl = null;

    try {
      const resp = await fetch(`${CASE_API_BASE}/api/open-case`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'normal' })
      });

      if (resp.status === 429) {
        const errJson = await resp.json().catch(() => ({}));
        const waitSec = errJson.retryAfter || 10;
        showToast(`⏳ Opening too fast! Please wait ${waitSec}s for the animation to finish.`);
        resetCaseOpeningStage();
        return;
      }

      if (resp.ok) {
        const data = await resp.json();
        if (data && data.item) {
          const localItem = window.CASES_DATA.items.find(x => x.id === data.item.id);
          winner = localItem || data.item;
          serverToken = data.token || null;
          // Server media URL is ONLY for server-gated encrypted rarities (Verity & Rainbow)
          if (winner && winner.serverGated && data.mediaUrl) {
            serverMediaUrl = data.mediaUrl.startsWith('http')
              ? data.mediaUrl
              : `${CASE_API_BASE}${data.mediaUrl.startsWith('/') ? '' : '/'}${data.mediaUrl}`;
          } else {
            serverMediaUrl = null;
          }
        }
      }
    } catch (apiErr) {
      console.warn('[CaseOpening] Server API request failed, fallback to local roll:', apiErr);
    }

    if (!winner) {
      winner = rollCaseItem('normal');
    }

    if (!winner) {
      resetCaseOpeningStage();
      return;
    }

    if (serverMediaUrl && winner.serverGated) {
      CaseVaultManager.setMediaUrl(winner.id, serverMediaUrl);
    }

    const mediaPromise = CaseVaultManager.getItemMediaUrl(winner);

    // Normal full cinematic opening with video and rolling over the box
    // 2. Prepare roulette track: 65 mystery cards with winner at index 45
    const winnerIndex = 45;
    const totalStripCount = 65;
    if (DOM.casesRouletteTrack) {
      DOM.casesRouletteTrack.innerHTML = '';
      DOM.casesRouletteTrack.style.transition = 'none';
      DOM.casesRouletteTrack.style.transform = 'translateX(0px)';

      const stripItems = [];
      for (let i = 0; i < totalStripCount; i++) {
        if (i === winnerIndex) {
          stripItems.push(winner);
        } else {
          stripItems.push(rollCaseItem('normal'));
        }
      }

      // Preload winner media in memory during spin
      mediaPromise.then(url => {
        if (!url) return;
        if (winner.isVideo) {
          const v = document.createElement('video');
          v.src = url;
          v.preload = 'auto';
        } else {
          const img = new Image();
          img.src = url;
        }
      }).catch(() => {});

      const frag = document.createDocumentFragment();
      stripItems.forEach((it, idx) => {
        // Generic mystery card during spin
        const card = createRouletteCard(it, false);
        card.setAttribute('data-index', idx);
        if (idx === winnerIndex) card.classList.add('target-winner');
        frag.appendChild(card);
      });
      DOM.casesRouletteTrack.appendChild(frag);

      // Force reflow
      void DOM.casesRouletteTrack.offsetWidth;
    }

    // 3. Calculate stop position
    const isMobile = window.innerWidth <= 600;
    const cardStep = isMobile ? 115 : 135; // card width (125px on desktop, 105px on mobile) + 10px gap
    const viewportWidth = DOM.casesRouletteViewport ? DOM.casesRouletteViewport.offsetWidth : 680;
    const winnerCenter = (winnerIndex * cardStep) + (cardStep / 2);
    const jitter = (Math.random() - 0.5) * (cardStep * 0.52);
    const stopX = -(winnerCenter - (viewportWidth / 2) + jitter);

    // 4. Activate Video Stage & Play Opening Video
    const video = DOM.caseOpenVideo || document.getElementById('caseOpenVideo');
    if (DOM.caseStageArea) DOM.caseStageArea.classList.add('is-opening');
    if (DOM.caseStaticBoxImg) DOM.caseStaticBoxImg.style.display = 'none';

    if (video) {
      video.style.display = 'block';
      video.currentTime = 0;
      video.muted = !SoundFX.enabled;
      video.volume = 0.95;
      video.play().catch(e => console.warn('Case open video play prevented:', e));
    }

    const startSpinPhysics = (durationSec) => {
      if (!DOM.casesRouletteTrack) return;
      const btnText = DOM.openCaseBtn ? DOM.openCaseBtn.querySelector('.btn-text') : null;
      if (btnText) btnText.textContent = 'ROLLING...';

      const bezier = 'cubic-bezier(0.12, 0.8, 0.25, 1)';

      DOM.casesRouletteTrack.style.transition = `transform ${durationSec}s ${bezier}`;
      DOM.casesRouletteTrack.style.transform = `translateX(${stopX}px)`;

      // Needle tick bouncing
      let lastTickCardIndex = -1;
      const topNeedle = DOM.casesRouletteViewport ? DOM.casesRouletteViewport.querySelector('.roulette-needle-top') : null;

      function trackTicks() {
        if (!state.caseIsSpinning || !DOM.casesRouletteTrack) return;
        try {
          const style = window.getComputedStyle(DOM.casesRouletteTrack);
          const matrix = new DOMMatrix(style.transform);
          const currentX = -matrix.m41;
          const currentCenterCard = Math.floor((currentX + (viewportWidth / 2)) / cardStep);

          if (currentCenterCard !== lastTickCardIndex && currentCenterCard >= 0) {
            lastTickCardIndex = currentCenterCard;
            if (topNeedle) {
              topNeedle.classList.add('needle-tick-active');
              setTimeout(() => topNeedle.classList.remove('needle-tick-active'), 40);
            }
          }
        } catch (e) {}

        tickRafId = requestAnimationFrame(trackTicks);
      }
      tickRafId = requestAnimationFrame(trackTicks);

      // Finish spin when stopped
      clearTimeout(spinAnimationTimer);
      spinAnimationTimer = setTimeout(() => {
        cancelAnimationFrame(tickRafId);
        state.caseIsSpinning = false;

        // Reveal the winning card in the reel!
        const winCardEl = DOM.casesRouletteTrack ? DOM.casesRouletteTrack.querySelector(`[data-index="${winnerIndex}"]`) : null;
        if (winCardEl) {
          revealWinnerCard(winCardEl, winner);
        }

        // Play Item Obtain Audio!
        if (SoundFX.enabled) {
          const obtainAudio = DOM.itemObtainAudio || document.getElementById('itemObtainAudio');
          if (obtainAudio) {
            obtainAudio.currentTime = 0;
            obtainAudio.volume = 0.95;
            obtainAudio.play().catch(e => console.warn('Obtain audio error:', e));
          }
          SoundFX.playRarityReveal(winner.rarity);
        }

        // Record to inventory (saving HMAC token for server-gated items)
        const result = CaseCollectionManager.recordItem(winner, serverToken);
        updateCasesCollectionUI();
        checkMilestoneUnlockTrigger(winner, result);

        // Open Reveal Modal after 420ms
        setTimeout(async () => {
          const mediaUrl = await mediaPromise;
          openCasesRevealModal(winner, result, mediaUrl);
        }, 420);

      }, durationSec * 1000 + 40);
    };

    // Normal full cinematic opening:
    // 0.0s - 3.2s: Crate unlocks and lid opens in video
    // 3.2s: Roulette reel activates over the opened box
    // 4.45s: Rolling starts in sync with video ticking audio
    clearTimeout(reelEntranceTimer);
    reelEntranceTimer = setTimeout(() => {
      if (!state.caseIsSpinning) return;
      if (DOM.casesRouletteViewport) DOM.casesRouletteViewport.classList.add('reel-active');
    }, 3200);

    clearTimeout(spinStartTimer);
    spinStartTimer = setTimeout(() => {
      if (!state.caseIsSpinning) return;
      startSpinPhysics(5.3); // 4.45s + 5.3s = 9.75s!
    }, 4450);
  }

  // Check if unboxing an item crossed a milestone reward threshold
  function checkMilestoneUnlockTrigger(winner, result) {
    if (!winner || !window.CASES_DATA || !Array.isArray(window.CASES_DATA.milestones)) return;
    const ms = window.CASES_DATA.milestones.find(m => m.targetItemId === winner.id);
    if (ms && result.count >= ms.threshold) {
      const inv = CaseCollectionManager.get();
      if (!inv.unlockedItems || !inv.unlockedItems[ms.rewardItemId]) {
        setTimeout(() => {
          showToast(`🎯 MILESTONE ACHIEVED! You reached ${ms.threshold.toLocaleString()}x ${winner.name}! Claim "${ms.rewardItemName}" in Collection > Milestones!`);
          SoundFX.playTone(587.33, 'triangle', 0.25, 0.1);
        }, 1200);
      }
    }
  }

  // Open the Spectacular Unboxing Reveal Modal
  function openCasesRevealModal(item, result, mediaUrl = null) {
    if (!DOM.casesRevealModal) return;

    // Remove any previous tier animation classes
    DOM.casesRevealModal.className = 'modal-backdrop cases-reveal-backdrop';
    DOM.casesRevealModal.classList.add(`anim-tier-${item.rarity}`);

    // Update tags
    if (DOM.casesRevealNewBadge) {
      if (result.isNew) {
        DOM.casesRevealNewBadge.textContent = '✨ NEW ITEM UNLOCKED! ✨';
        DOM.casesRevealNewBadge.style.display = 'inline-block';
        DOM.casesRevealNewBadge.style.background = 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)';
        DOM.casesRevealNewBadge.style.boxShadow = '0 0 12px rgba(46, 204, 113, 0.7)';
      } else {
        DOM.casesRevealNewBadge.textContent = `DUPLICATE (${result.count}x OWNED)`;
        DOM.casesRevealNewBadge.style.display = 'inline-block';
        DOM.casesRevealNewBadge.style.background = 'rgba(255, 255, 255, 0.12)';
        DOM.casesRevealNewBadge.style.boxShadow = 'none';
      }
    }

    if (DOM.casesRevealRarityTag) {
      DOM.casesRevealRarityTag.textContent = item.rarityName.toUpperCase();
      if (item.rarity === 'rainbow') {
        DOM.casesRevealRarityTag.style.background = 'linear-gradient(90deg, #ff0055, #ff7700, #ffea00, #00e676, #00d4ff, #8b00ff, #ff007f)';
        DOM.casesRevealRarityTag.style.borderColor = 'transparent';
        DOM.casesRevealRarityTag.style.color = '#000';
        DOM.casesRevealRarityTag.style.boxShadow = '0 0 16px rgba(255, 0, 128, 0.8), 0 0 25px rgba(0, 212, 255, 0.6)';
      } else {
        DOM.casesRevealRarityTag.style.background = `${item.rarityColor}28`;
        DOM.casesRevealRarityTag.style.borderColor = item.rarityColor;
        DOM.casesRevealRarityTag.style.color = item.rarityColor;
        DOM.casesRevealRarityTag.style.boxShadow = `0 0 12px ${item.rarityGlow}`;
      }
    }

    if (DOM.casesRevealTitle) {
      DOM.casesRevealTitle.textContent = item.name;
    }

    if (DOM.casesRevealMeta) {
      const rObj = window.CASES_DATA.rarities.find(r => r.key === item.rarity);
      const chanceStr = rObj ? formatRarityChance(rObj, 'normal') : '';
      if (item.rarity === 'album') {
        DOM.casesRevealMeta.textContent = `${item.rarityName} • ${item.albumName ? `Reward for: ${item.albumName}` : 'Album Completion Reward'}`;
      } else if (item.rarity === 'milestone') {
        DOM.casesRevealMeta.textContent = `Milestone Reward • Unlocked by collecting ${item.milestoneThreshold ? item.milestoneThreshold.toLocaleString() : ''} ${item.milestoneTargetName || ''}`;
      } else {
        DOM.casesRevealMeta.textContent = `${item.rarityName} • Drop Chance: ${chanceStr}`;
      }
    }

    if (DOM.casesRevealCountBadge) {
      if (item.rarity === 'album') {
        DOM.casesRevealCountBadge.textContent = `Album Reward • Total Claimed: ${result.count}`;
      } else if (item.rarity === 'milestone') {
        DOM.casesRevealCountBadge.textContent = `Milestone Reward • Claimed: ${result.count}`;
      } else {
        DOM.casesRevealCountBadge.textContent = `Total Owned: ${result.count} • Collection Total: ${result.totalOpened} opened`;
      }
    }

    // Media element
    const activeMediaUrl = mediaUrl || CaseVaultManager.getCachedUrl(item.id);
    if (DOM.casesRevealMediaWrap) {
      if (activeMediaUrl) {
        if (item.isYouTube || item.youtubeUrl) {
          const ytUrl = item.youtubeUrl || activeMediaUrl;
          const embedUrl = item.youtubeEmbedUrl || (ytUrl ? ytUrl.replace('watch?v=', 'embed/') : '');
          DOM.casesRevealMediaWrap.innerHTML = `
            <div class="reveal-youtube-player">
              <iframe src="${escapeHtml(embedUrl)}" class="lightbox-youtube-iframe" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
              <a href="${escapeHtml(ytUrl)}" target="_blank" rel="noopener noreferrer" class="youtube-external-btn">
                <span>▶ Open on YouTube</span>
              </a>
            </div>
          `;
        } else if (item.isAudio) {
          const thumb = item.thumbPath || 'case opening/orbs/orb_secret.png';
          DOM.casesRevealMediaWrap.innerHTML = `
            <div class="reveal-audio-player">
              <img src="${escapeHtml(thumb)}" alt="${escapeHtml(item.name)}" class="reveal-audio-art" />
              <audio src="${escapeHtml(activeMediaUrl)}" controls autoplay style="width:90%; margin-top:8px;"></audio>
            </div>
          `;
        } else if (item.isVideo) {
          DOM.casesRevealMediaWrap.innerHTML = `
            <video src="${escapeHtml(activeMediaUrl)}" autoplay loop controls playsinline></video>
          `;
        } else {
          DOM.casesRevealMediaWrap.innerHTML = `
            <img src="${escapeHtml(activeMediaUrl)}" alt="${escapeHtml(item.name)}" />
          `;
        }
      } else {
        DOM.casesRevealMediaWrap.innerHTML = `
          <div class="cases-reveal-decrypting" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:${item.rarityColor};">
            <span style="font-size:1.8rem; margin-bottom:8px;">🔒</span>
            <span style="font-family:var(--font-display); font-weight:700;">Decrypting Vault Asset...</span>
          </div>
        `;
        CaseVaultManager.getItemMediaUrl(item).then(url => {
          if (url && DOM.casesRevealModal && DOM.casesRevealModal.style.display !== 'none' && DOM.casesRevealMediaWrap) {
            if (item.isYouTube || item.youtubeUrl) {
              const ytUrl = item.youtubeUrl || url;
              const embedUrl = item.youtubeEmbedUrl || (ytUrl ? ytUrl.replace('watch?v=', 'embed/') : '');
              DOM.casesRevealMediaWrap.innerHTML = `
                <div class="reveal-youtube-player">
                  <iframe src="${escapeHtml(embedUrl)}" class="lightbox-youtube-iframe" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                  <a href="${escapeHtml(ytUrl)}" target="_blank" rel="noopener noreferrer" class="youtube-external-btn">
                    <span>▶ Open on YouTube</span>
                  </a>
                </div>
              `;
            } else if (item.isAudio) {
              const thumb = item.thumbPath || 'case opening/orbs/orb_secret.png';
              DOM.casesRevealMediaWrap.innerHTML = `
                <div class="reveal-audio-player">
                  <img src="${escapeHtml(thumb)}" alt="${escapeHtml(item.name)}" class="reveal-audio-art" />
                  <audio src="${escapeHtml(url)}" controls autoplay style="width:90%; margin-top:8px;"></audio>
                </div>
              `;
            } else if (item.isVideo) {
              DOM.casesRevealMediaWrap.innerHTML = `
                <video src="${escapeHtml(url)}" autoplay loop controls playsinline></video>
              `;
            } else {
              DOM.casesRevealMediaWrap.innerHTML = `
                <img src="${escapeHtml(url)}" alt="${escapeHtml(item.name)}" />
              `;
            }
          }
        }).catch(err => {
          console.warn('[RevealModal] Failed to decrypt media in background:', err);
        });
      }
    }

    // Special screen FX for high rarities
    if (item.rarity === 'hell') {
      document.body.classList.add('screen-rumble');
      setTimeout(() => document.body.classList.remove('screen-rumble'), 1200);
      showToast('🔥 UNBELIEVABLE! You unboxed a 0.001% HELL item! 🔥');
    } else if (item.rarity === 'divine') {
      flashVictoryScreen();
      showToast('🌟 DIVINE DROP! 0.1% Heavenly rarity unboxed!');
    } else if (item.rarity === 'milestone') {
      VictoryCelebration.start();
      setTimeout(() => VictoryCelebration.stop(), 4000);
      showToast(`🎯 MILESTONE REWARD UNLOCKED: ${item.name}! 🎯`);
    } else if (item.rarity === 'album') {
      VictoryCelebration.start();
      setTimeout(() => VictoryCelebration.stop(), 3500);
      showToast(`🎁 ALBUM REWARD UNLOCKED: ${item.name}! 🎁`);
    } else if (item.rarity === 'rainbow') {
      flashVictoryScreen();
      showToast('🌈 CHROMATIC RAINBOW DROP! 0.2% Ultra Rare item unboxed!');
    } else if (item.rarity === 'secret') {
      VictoryCelebration.start();
      setTimeout(() => VictoryCelebration.stop(), 3500);
      showToast('✨ SECRET ITEM UNBOXED! ✨');
    } else if (item.rarity === 'verity') {
      VictoryCelebration.start();
      setTimeout(() => VictoryCelebration.stop(), 3000);
      showToast('☀️ VERITY UNBOXED! 10% Radiant Amber drop!');
    } else if (item.rarity === 'mythic' || item.rarity === 'legendary') {
      VictoryCelebration.start();
      setTimeout(() => VictoryCelebration.stop(), 4000);
    }

    DOM.casesRevealModal.style.display = 'flex';
  }

  function closeCasesRevealModal() {
    if (DOM.casesRevealModal) {
      DOM.casesRevealModal.style.display = 'none';
      if (DOM.casesRevealMediaWrap) {
        DOM.casesRevealMediaWrap.innerHTML = '';
      }
    }
    resetCaseOpeningStage();
  }

  // Update Home Page Badge with current collection status in golden style
  function updateCasesHomeBadge() {
    if (!DOM.casesCardBadge) return;
    const inv = CaseCollectionManager.get();
    const data = window.CASES_DATA;
    const totalItems = (data && data.items) ? data.items.length : 106;
    const unlockedCount = Object.keys(inv.unlockedItems || {}).length;
    DOM.casesCardBadge.textContent = `${unlockedCount}/${totalItems} UNLOCKED`;
    DOM.casesCardBadge.classList.add('badge-cases-gold');
  }

  // Update Collection UI & Tab
  function updateCasesCollectionUI(filter = 'all') {
    state.caseActiveFilter = filter;
    const inv = CaseCollectionManager.get();
    const data = window.CASES_DATA;
    if (!data || !data.items) return;

    const totalItems = data.items.length; // 106 Total items
    const droppableCount = data.items.filter(it => it.rarity !== 'album' && it.rarity !== 'milestone').length; // 89
    const unlockedCount = Object.keys(inv.unlockedItems || {}).length;
    const percent = Math.round((unlockedCount / totalItems) * 100);

    const totalAlbums = data.albums ? data.albums.length : 12;
    let completedAlbumsCount = 0;
    if (data.albums) {
      data.albums.forEach(album => {
        if (getAlbumProgress(album, inv).isCompleted) completedAlbumsCount++;
      });
    }

    const totalMilestones = data.milestones ? data.milestones.length : 5;
    let completedMilestonesCount = 0;
    if (data.milestones) {
      data.milestones.forEach(ms => {
        if (inv.unlockedItems && inv.unlockedItems[ms.rewardItemId]) completedMilestonesCount++;
      });
    }

    // Update Home Page Badge
    updateCasesHomeBadge();

    // Nav and Stats
    if (DOM.casesNavUnlockedCount) DOM.casesNavUnlockedCount.textContent = unlockedCount;
    if (DOM.casesNavTotalCount) DOM.casesNavTotalCount.textContent = totalItems;
    if (DOM.casesCrateTotalCount) DOM.casesCrateTotalCount.textContent = droppableCount;
    if (DOM.cstatTotalOpened) DOM.cstatTotalOpened.textContent = inv.totalOpened || 0;
    if (DOM.cstatUniqueUnlocked) DOM.cstatUniqueUnlocked.textContent = unlockedCount;
    if (DOM.cstatTotalItems) DOM.cstatTotalItems.textContent = totalItems;
    if (DOM.cstatPercent) DOM.cstatPercent.textContent = `${percent}%`;

    // Sub-tab counts in parentheses: (unlocked / total)
    if (DOM.cstatAllItemsCount) {
      DOM.cstatAllItemsCount.textContent = `${unlockedCount}/${totalItems}`;
    }
    if (DOM.cstatAlbumsCount) {
      DOM.cstatAlbumsCount.textContent = `${completedAlbumsCount}/${totalAlbums}`;
    }
    if (DOM.cstatMilestonesCount) {
      DOM.cstatMilestonesCount.textContent = `${completedMilestonesCount}/${totalMilestones}`;
    }

    // Show polite toast notification if old items were smoothly imported
    try {
      const importNotice = sessionStorage.getItem('antisimpdle_imported_v1_notice');
      if (importNotice) {
        sessionStorage.removeItem('antisimpdle_imported_v1_notice');
        setTimeout(() => {
          showToast(`🎉 Collection Updated! Automatically imported ${importNotice} previously collected item(s) to the new expanded cases!`);
        }, 800);
      }
    } catch (e) {}

    // Refresh Active Sub-View
    if (state.collectionActiveTab === 'albums') {
      if (state.activeAlbumId) {
        renderAlbumDetail(state.activeAlbumId);
      } else {
        renderAlbumsOverview();
      }
    } else if (state.collectionActiveTab === 'milestones') {
      renderMilestonesOverview();
    }

    // Filter pills
    if (DOM.collectionFilters) {
      let filterHtml = `<button class="cfilter-pill ${filter === 'all' ? 'active' : ''}" data-rarity="all">ALL (${totalItems})</button>`;
      data.rarities.forEach(r => {
        const count = data.items.filter(it => it.rarity === r.key).length;
        const isActive = filter === r.key ? 'active' : '';
        filterHtml += `<button class="cfilter-pill ${isActive}" data-rarity="${r.key}">${escapeHtml(r.name.toUpperCase())} (${count})</button>`;
      });
      DOM.collectionFilters.innerHTML = filterHtml;

      // Add click listeners to filter pills
      DOM.collectionFilters.querySelectorAll('.cfilter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          const rKey = btn.getAttribute('data-rarity');
          updateCasesCollectionUI(rKey);
          SoundFX.playSelect();
        });
      });
    }

    // Grid rendering
    if (DOM.casesCollectionGrid) {
      let filteredItems = data.items;
      if (filter !== 'all') {
        filteredItems = data.items.filter(it => it.rarity === filter);
      }

      let gridHtml = '';
      filteredItems.forEach(item => {
        const record = inv.unlockedItems[item.id];
        const isUnlocked = !!record;
        const count = isUnlocked ? record.count : 0;

        if (isUnlocked) {
          const cachedUrl = CaseVaultManager.getCachedUrl(item.id);
          let vidTag = '';
          if (item.isYouTube) {
            vidTag = '<span class="collection-vid-indicator" style="background:#ff0000;">▶ YOUTUBE</span>';
          } else if (item.isAudio) {
            vidTag = '<span class="collection-vid-indicator" style="background:#ffa6dd; color:#1a0515;">🎵 AUDIO</span>';
          } else if (item.isVideo) {
            vidTag = '<span class="collection-vid-indicator">▶ VIDEO</span>';
          }

          const thumbSrc = item.thumbPath || cachedUrl || '';
          const isThumbVideo = item.isVideo && !item.thumbPath;

          gridHtml += `
            <div class="collection-card unlocked rarity-${item.rarity}" data-item-id="${item.id}" style="border-color:${item.rarityColor}; box-shadow:0 0 12px ${item.rarityGlow};">
              <div class="collection-card-thumb-wrap">
                ${isThumbVideo 
                  ? `<video src="${cachedUrl ? escapeHtml(cachedUrl) : ''}" data-vault-item="${item.id}" muted playsinline class="collection-card-thumb" preload="metadata"></video>`
                  : `<img src="${thumbSrc ? escapeHtml(thumbSrc) : ''}" data-vault-item="${item.id}" alt="${escapeHtml(item.name)}" class="collection-card-thumb" loading="lazy" />`
                }
                ${vidTag}
                <span class="collection-count-badge">x${count}</span>
              </div>
              <div class="collection-card-meta">
                <span class="collection-card-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
                <span class="collection-card-rarity" style="color:${item.rarityColor};">${escapeHtml(item.rarityName)}</span>
              </div>
            </div>
          `;
          if (!cachedUrl && !item.thumbPath) {
            CaseVaultManager.getItemMediaUrl(item).then(mediaUrl => {
              if (!mediaUrl || !DOM.casesCollectionGrid) return;
              const el = DOM.casesCollectionGrid.querySelector(`[data-vault-item="${item.id}"]`);
              if (el) el.src = mediaUrl;
            });
          }
        } else {
          const isAlbumReward = item.rarity === 'album';
          const isMilestoneReward = item.rarity === 'milestone';
          let lockedBadgeText = 'LOCKED';
          let lockedHint = '';
          let isClaimable = false;
          let targetCount = 0;
          let threshold = 0;

          if (isAlbumReward) {
            lockedBadgeText = 'ALBUM REWARD';
            if (item.albumName) {
              lockedHint = `<span style="font-size:0.62rem; line-height:1.15; color:#00e5ff; margin-top:3px; font-weight:700; text-align:center;">Complete "${escapeHtml(item.albumName)}"</span>`;
            }
          } else if (isMilestoneReward) {
            const ms = (data.milestones || []).find(m => m.rewardItemId === item.id);
            const targetRecord = ms ? inv.unlockedItems[ms.targetItemId] : null;
            targetCount = targetRecord ? targetRecord.count : 0;
            threshold = item.milestoneThreshold || (ms ? ms.threshold : 100);
            isClaimable = targetCount >= threshold;

            if (isClaimable) {
              lockedBadgeText = '✨ CLAIM';
              lockedHint = `<span style="font-size:0.70rem; line-height:1.15; color:#2ecc71; margin-top:3px; font-weight:800; text-align:center;">READY TO CLAIM!</span>`;
            } else {
              lockedBadgeText = 'MILESTONE';
              lockedHint = `<span style="font-size:0.62rem; line-height:1.15; color:#ffa6dd; margin-top:3px; font-weight:700; text-align:center;">${targetCount.toLocaleString()} / ${threshold.toLocaleString()} ${escapeHtml(item.milestoneTargetName || '')}</span>`;
            }
          }

          gridHtml += `
            <div class="collection-card locked rarity-${item.rarity} ${isClaimable ? 'pulse' : ''}" 
                 data-item-id="${item.id}" 
                 data-item-name="${escapeHtml(item.name)}" 
                 data-is-album="${isAlbumReward}" 
                 data-album-name="${escapeHtml(item.albumName || '')}"
                 data-is-milestone="${isMilestoneReward}"
                 data-milestone-id="${item.milestoneId || ''}"
                 data-is-claimable="${isClaimable}"
                 data-target-name="${escapeHtml(item.milestoneTargetName || '')}"
                 data-threshold="${threshold}"
                 data-curr-count="${targetCount}"
                 style="border-color:${item.rarityColor}; box-shadow:0 0 10px ${item.rarityGlow};">
              <div class="collection-card-thumb-wrap">
                <div class="collection-card-locked-icon" style="color:${item.rarityColor}; text-shadow:0 0 10px ${item.rarityGlow};">🔒</div>
                <span class="collection-locked-badge">${lockedBadgeText}</span>
              </div>
              <div class="collection-card-meta">
                <span class="collection-card-name" title="${escapeHtml(item.name)}" style="color:#ffffff; font-weight:700;">${escapeHtml(item.name)}</span>
                <span class="collection-card-rarity" style="color:${item.rarityColor}; font-weight:800; text-shadow:0 0 6px ${item.rarityGlow};">${escapeHtml(item.rarityName.toUpperCase())}</span>
                ${lockedHint}
              </div>
            </div>
          `;
        }
      });

      DOM.casesCollectionGrid.innerHTML = gridHtml;

      // Click card to open Lightbox
      DOM.casesCollectionGrid.querySelectorAll('.collection-card.unlocked').forEach(card => {
        card.addEventListener('click', () => {
          const itId = card.getAttribute('data-item-id');
          const it = data.items.find(x => x.id === itId);
          if (it) openCasesLightbox(it);
        });
      });

      // Click locked card to show guidance toast or claim
      DOM.casesCollectionGrid.querySelectorAll('.collection-card.locked').forEach(card => {
        card.addEventListener('click', () => {
          const isMilestone = card.getAttribute('data-is-milestone') === 'true';
          const isAlbum = card.getAttribute('data-is-album') === 'true';
          const isClaimable = card.getAttribute('data-is-claimable') === 'true';
          const itId = card.getAttribute('data-item-id');
          const itName = card.getAttribute('data-item-name');
          const albName = card.getAttribute('data-album-name');

          if (isMilestone) {
            const msId = card.getAttribute('data-milestone-id');
            if (isClaimable) {
              claimMilestoneReward(msId);
            } else {
              const tName = card.getAttribute('data-target-name');
              const th = parseInt(card.getAttribute('data-threshold') || '0', 10);
              const curr = parseInt(card.getAttribute('data-curr-count') || '0', 10);
              showToast(`🔒 "${itName}" is a Milestone Reward! Collect ${th.toLocaleString()} ${tName} to unlock it! (Currently: ${curr.toLocaleString()} / ${th.toLocaleString()})`);
              SoundFX.playTone(280, 'sine', 0.12);
            }
          } else if (isAlbum) {
            showToast(`🔒 "${itName}" is an Album Reward! Complete "${albName}" to claim it!`);
            SoundFX.playTone(280, 'sine', 0.12);
          } else {
            showToast(`🔒 "${itName}" is locked. Unbox it from cases!`);
            SoundFX.playTone(280, 'sine', 0.12);
          }
        });
      });
    }
  }

  // Switch Collection Sub-Tabs: 'all' vs 'albums' vs 'milestones'
  function switchCollectionViewTab(tab = 'all') {
    state.collectionActiveTab = tab;
    if (tab === 'all') {
      if (DOM.collViewAllBtn) DOM.collViewAllBtn.classList.add('active');
      if (DOM.collViewAlbumsBtn) DOM.collViewAlbumsBtn.classList.remove('active');
      if (DOM.collViewMilestonesBtn) DOM.collViewMilestonesBtn.classList.remove('active');
      if (DOM.casesAllItemsView) DOM.casesAllItemsView.style.display = 'block';
      if (DOM.casesAlbumsView) DOM.casesAlbumsView.style.display = 'none';
      if (DOM.casesMilestonesView) DOM.casesMilestonesView.style.display = 'none';
    } else if (tab === 'albums') {
      if (DOM.collViewAlbumsBtn) DOM.collViewAlbumsBtn.classList.add('active');
      if (DOM.collViewAllBtn) DOM.collViewAllBtn.classList.remove('active');
      if (DOM.collViewMilestonesBtn) DOM.collViewMilestonesBtn.classList.remove('active');
      if (DOM.casesAllItemsView) DOM.casesAllItemsView.style.display = 'none';
      if (DOM.casesAlbumsView) DOM.casesAlbumsView.style.display = 'block';
      if (DOM.casesMilestonesView) DOM.casesMilestonesView.style.display = 'none';

      if (state.activeAlbumId) {
        renderAlbumDetail(state.activeAlbumId);
      } else {
        renderAlbumsOverview();
      }
    } else if (tab === 'milestones') {
      if (DOM.collViewMilestonesBtn) DOM.collViewMilestonesBtn.classList.add('active');
      if (DOM.collViewAllBtn) DOM.collViewAllBtn.classList.remove('active');
      if (DOM.collViewAlbumsBtn) DOM.collViewAlbumsBtn.classList.remove('active');
      if (DOM.casesAllItemsView) DOM.casesAllItemsView.style.display = 'none';
      if (DOM.casesAlbumsView) DOM.casesAlbumsView.style.display = 'none';
      if (DOM.casesMilestonesView) DOM.casesMilestonesView.style.display = 'block';

      renderMilestonesOverview();
    }
  }

  // Calculate unlock progress for an album
  function getAlbumProgress(album, inv) {
    if (!album || !Array.isArray(album.itemIds)) {
      return { total: 0, owned: 0, percent: 0, isCompleted: false };
    }
    const unlocked = inv && inv.unlockedItems ? inv.unlockedItems : {};
    const total = album.itemIds.length;
    let owned = 0;
    album.itemIds.forEach(id => {
      if (unlocked[id]) owned++;
    });
    const percent = total > 0 ? Math.round((owned / total) * 100) : 0;
    const isCompleted = total > 0 && owned === total;
    return { total, owned, percent, isCompleted };
  }

  // Render Albums Overview Grid (1 in each row, large preview pictures, fewest on top)
  function renderAlbumsOverview() {
    const data = window.CASES_DATA;
    if (!data || !Array.isArray(data.albums)) return;
    const inv = CaseCollectionManager.get();

    if (DOM.albumsOverviewSection) DOM.albumsOverviewSection.style.display = 'block';
    if (DOM.albumDetailSection) DOM.albumDetailSection.style.display = 'none';

    let completedAlbumsCount = 0;
    const totalAlbumsCount = data.albums.length;

    let gridHtml = '';
    data.albums.forEach(album => {
      const prog = getAlbumProgress(album, inv);
      if (prog.isCompleted) completedAlbumsCount++;

      // Render all pictures in the album (large, crisp, clear cards)
      let itemsHtml = '';
      album.itemIds.forEach(itId => {
        const item = data.items.find(x => x.id === itId);
        if (!item) return;
        const record = inv.unlockedItems ? inv.unlockedItems[itId] : null;
        const isUnlocked = !!record;
        const count = isUnlocked ? record.count : 0;

        if (isUnlocked) {
          const cachedUrl = CaseVaultManager.getCachedUrl(item.id);
          const vidTag = item.isVideo ? `<span class="collection-vid-indicator">▶ VIDEO</span>` : '';
          const thumbSrc = item.thumbPath || cachedUrl || '';
          const isThumbVideo = item.isVideo && !item.thumbPath;
          itemsHtml += `
            <div class="album-preview-card unlocked" data-item-id="${item.id}" title="${escapeHtml(item.name)} (${escapeHtml(item.rarityName)}) • Click to view">
              <div class="album-preview-thumb-wrap is-unlocked" style="--rarity-color:${item.rarityColor}; border-color:${item.rarityColor}; box-shadow:0 0 10px ${item.rarityGlow};">
                ${isThumbVideo
                  ? `<video src="${cachedUrl ? escapeHtml(cachedUrl) : ''}" data-vault-item="${item.id}" muted playsinline class="album-preview-thumb" preload="metadata"></video>`
                  : `<img src="${thumbSrc ? escapeHtml(thumbSrc) : ''}" data-vault-item="${item.id}" alt="${escapeHtml(item.name)}" class="album-preview-thumb" loading="lazy" />`
                }
                ${vidTag}
                <span class="collection-count-badge">x${count}</span>
              </div>
              <span class="album-preview-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
              <span class="album-preview-rarity" style="color:${item.rarityColor}; font-weight:800; text-shadow:0 0 4px ${item.rarityGlow};">${escapeHtml(item.rarityName.toUpperCase())}</span>
            </div>
          `;
          if (!cachedUrl && !item.thumbPath) {
            CaseVaultManager.getItemMediaUrl(item).then(mediaUrl => {
              if (!mediaUrl) return;
              const els = document.querySelectorAll(`[data-vault-item="${item.id}"]`);
              els.forEach(el => { el.src = mediaUrl; });
            });
          }
        } else {
          itemsHtml += `
            <div class="album-preview-card locked" data-item-id="${item.id}" data-item-name="${escapeHtml(item.name)}" title="${escapeHtml(item.name)} (Locked)">
              <div class="album-preview-thumb-wrap" style="border-color:${item.rarityColor}44; box-shadow:0 0 6px ${item.rarityGlow}33;">
                <span class="album-preview-locked-icon" style="color:${item.rarityColor}; text-shadow:0 0 8px ${item.rarityGlow};">🔒</span>
                <span class="album-preview-locked-label">LOCKED</span>
              </div>
              <span class="album-preview-name" style="color:#ffffff; font-weight:700;" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
              <span class="album-preview-rarity" style="color:${item.rarityColor}; font-weight:800; text-shadow:0 0 4px ${item.rarityGlow};">${escapeHtml(item.rarityName.toUpperCase())}</span>
            </div>
          `;
        }
      });

      const isRewardClaimed = inv.unlockedItems && !!inv.unlockedItems[album.rewardItemId];
      const rewardName = album.rewardItemName || 'Album Reward';

      const statusBadge = prog.isCompleted
        ? `<span class="album-status-badge completed">✓ COMPLETED</span>`
        : `<span class="album-status-badge">${prog.owned}/${prog.total}</span>`;

      let rewardTag = '';
      if (prog.isCompleted && !isRewardClaimed) {
        rewardTag = `<button class="album-claim-reward-btn pulse" data-claim-album="${album.id}">🎁 CLAIM: ${escapeHtml(rewardName)}</button>`;
      } else if (prog.isCompleted && isRewardClaimed) {
        rewardTag = `<div class="album-reward-tag completed clickable-reward" data-view-reward="${album.rewardItemId}" title="Click to view reward in Lightbox"><span>🎁</span> <span>Unlocked: ${escapeHtml(rewardName)}</span></div>`;
      } else {
        rewardTag = `<div class="album-reward-tag" title="Complete album to unlock"><span>🎁</span> <span>Reward: ${escapeHtml(rewardName)} (Locked)</span></div>`;
      }

      gridHtml += `
        <div class="album-card ${prog.isCompleted ? 'is-completed' : ''}" data-album-id="${album.id}">
          <div class="album-card-header">
            <div class="album-card-icon-title">
              <span class="album-card-icon">${album.icon || '📁'}</span>
              <div class="album-card-title-group">
                <h4 class="album-card-title">${escapeHtml(album.name)}</h4>
              </div>
            </div>
            <div class="album-card-header-actions">
              ${statusBadge}
              ${rewardTag}
            </div>
          </div>
          <div class="album-progress-wrap">
            <div class="album-progress-track">
              <div class="album-progress-fill" style="width: ${prog.percent}%;"></div>
            </div>
            <span class="album-progress-text">${prog.percent}%</span>
          </div>
          <div class="album-pictures-section">
            <span class="album-pictures-label">Album Pictures (${prog.owned}/${prog.total}):</span>
            <div class="album-preview-items-grid">
              ${itemsHtml}
            </div>
          </div>
        </div>
      `;
    });

    if (DOM.casesAlbumsGrid) {
      DOM.casesAlbumsGrid.innerHTML = gridHtml;
      DOM.casesAlbumsGrid.querySelectorAll('.album-card').forEach(card => {
        // Claim reward button click
        card.querySelectorAll('.album-claim-reward-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const aId = btn.getAttribute('data-claim-album');
            claimAlbumReward(aId);
          });
        });

        // Clickable claimed reward tag click -> open lightbox
        card.querySelectorAll('.clickable-reward').forEach(tag => {
          tag.addEventListener('click', (e) => {
            e.stopPropagation();
            const rewId = tag.getAttribute('data-view-reward');
            const rewItem = data.items.find(x => x.id === rewId);
            if (rewItem) openCasesLightbox(rewItem);
          });
        });

        // Unlocked picture click -> open lightbox
        card.querySelectorAll('.album-preview-card.unlocked').forEach(pCard => {
          pCard.addEventListener('click', (e) => {
            e.stopPropagation();
            const itId = pCard.getAttribute('data-item-id');
            const it = data.items.find(x => x.id === itId);
            if (it) openCasesLightbox(it);
          });
        });

        // Locked picture click -> show toast
        card.querySelectorAll('.album-preview-card.locked').forEach(pCard => {
          pCard.addEventListener('click', (e) => {
            e.stopPropagation();
            const itName = pCard.getAttribute('data-item-name');
            showToast(`🔒 "${itName}" is locked. Unbox it from cases to add it to your album!`);
            SoundFX.playTone(280, 'sine', 0.12);
          });
        });

        // Clicking the album card opens album detail view
        card.addEventListener('click', () => {
          const aId = card.getAttribute('data-album-id');
          state.activeAlbumId = aId;
          renderAlbumDetail(aId);
          SoundFX.playSelect();
        });
      });
    }

    if (DOM.albumsCompletedBadge) {
      DOM.albumsCompletedBadge.textContent = `${completedAlbumsCount}/${totalAlbumsCount} COMPLETED`;
      if (DOM.cstatAlbumsCount) {
        DOM.cstatAlbumsCount.textContent = `${completedAlbumsCount}/${totalAlbumsCount}`;
      }
      if (completedAlbumsCount === totalAlbumsCount && totalAlbumsCount > 0) {
        DOM.albumsCompletedBadge.style.background = 'linear-gradient(135deg, rgba(46, 204, 113, 0.3), rgba(39, 174, 96, 0.3))';
        DOM.albumsCompletedBadge.style.borderColor = '#2ecc71';
        DOM.albumsCompletedBadge.style.color = '#a8ff78';
      } else {
        DOM.albumsCompletedBadge.style.background = '';
        DOM.albumsCompletedBadge.style.borderColor = '';
        DOM.albumsCompletedBadge.style.color = '';
      }
    }
  }

  // Render Single Album Detail View (Items sorted by rarity)
  function renderAlbumDetail(albumId) {
    const data = window.CASES_DATA;
    if (!data || !Array.isArray(data.albums)) return;
    const album = data.albums.find(a => a.id === albumId);
    if (!album) return;

    const inv = CaseCollectionManager.get();
    const prog = getAlbumProgress(album, inv);

    if (DOM.albumsOverviewSection) DOM.albumsOverviewSection.style.display = 'none';
    if (DOM.albumDetailSection) DOM.albumDetailSection.style.display = 'block';

    if (DOM.albumDetailIcon) DOM.albumDetailIcon.textContent = album.icon || '📁';
    if (DOM.albumDetailTitle) DOM.albumDetailTitle.textContent = album.name;

    if (DOM.albumDetailBadge) {
      DOM.albumDetailBadge.textContent = prog.isCompleted ? '✓ COMPLETED' : `${prog.owned}/${prog.total}`;
      if (prog.isCompleted) {
        DOM.albumDetailBadge.classList.add('completed');
      } else {
        DOM.albumDetailBadge.classList.remove('completed');
      }
    }

    if (DOM.albumDetailProgressFill) {
      DOM.albumDetailProgressFill.style.width = `${prog.percent}%`;
      if (prog.isCompleted) {
        DOM.albumDetailProgressFill.classList.add('is-completed');
      } else {
        DOM.albumDetailProgressFill.classList.remove('is-completed');
      }
    }

    if (DOM.albumDetailProgressText) {
      DOM.albumDetailProgressText.textContent = `${prog.percent}% Complete (${prog.owned}/${prog.total})`;
    }

    if (DOM.albumDetailRewardTag) {
      const isRewardClaimed = inv.unlockedItems && !!inv.unlockedItems[album.rewardItemId];
      const rewardName = album.rewardItemName || 'Album Reward';

      if (prog.isCompleted && !isRewardClaimed) {
        DOM.albumDetailRewardTag.className = 'album-reward-container';
        DOM.albumDetailRewardTag.onclick = null;
        DOM.albumDetailRewardTag.innerHTML = `
          <button class="album-claim-reward-btn pulse" data-claim-album="${album.id}">
            🎁 CLAIM ALBUM REWARD: ${escapeHtml(rewardName)}
          </button>
        `;
        const claimBtn = DOM.albumDetailRewardTag.querySelector('.album-claim-reward-btn');
        if (claimBtn) {
          claimBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            claimAlbumReward(album.id);
          });
        }
      } else if (prog.isCompleted && isRewardClaimed) {
        DOM.albumDetailRewardTag.className = 'album-reward-tag completed clickable-reward';
        DOM.albumDetailRewardTag.innerHTML = `
          <span class="reward-icon">🎁</span>
          <span class="reward-text">Reward Unlocked: ${escapeHtml(rewardName)} (Click to view)</span>
        `;
        DOM.albumDetailRewardTag.onclick = (e) => {
          e.stopPropagation();
          const rewItem = data.items.find(x => x.id === album.rewardItemId);
          if (rewItem) openCasesLightbox(rewItem);
        };
      } else {
        DOM.albumDetailRewardTag.className = 'album-reward-tag';
        DOM.albumDetailRewardTag.onclick = null;
        DOM.albumDetailRewardTag.innerHTML = `
          <span class="reward-icon">🎁</span>
          <span class="reward-text">Reward: ${escapeHtml(rewardName)} (Collect all ${prog.total} items to unlock)</span>
        `;
      }
    }

    // Render items pre-sorted by rarity
    if (DOM.albumItemsGrid) {
      let gridHtml = '';
      album.itemIds.forEach(itId => {
        const item = data.items.find(x => x.id === itId);
        if (!item) return;

        const record = inv.unlockedItems ? inv.unlockedItems[item.id] : null;
        const isUnlocked = !!record;
        const count = isUnlocked ? record.count : 0;

        if (isUnlocked) {
          const cachedUrl = CaseVaultManager.getCachedUrl(item.id);
          const vidTag = item.isVideo ? `<span class="collection-vid-indicator">▶ VIDEO</span>` : '';
          const thumbSrc = item.thumbPath || cachedUrl || '';
          const isThumbVideo = item.isVideo && !item.thumbPath;
          gridHtml += `
            <div class="collection-card unlocked rarity-${item.rarity}" data-item-id="${item.id}" style="border-color:${item.rarityColor}; box-shadow:0 0 12px ${item.rarityGlow};">
              <div class="collection-card-thumb-wrap">
                ${isThumbVideo 
                  ? `<video src="${cachedUrl ? escapeHtml(cachedUrl) : ''}" data-vault-item="${item.id}" muted playsinline class="collection-card-thumb" preload="metadata"></video>`
                  : `<img src="${thumbSrc ? escapeHtml(thumbSrc) : ''}" data-vault-item="${item.id}" alt="${escapeHtml(item.name)}" class="collection-card-thumb" loading="lazy" />`
                }
                ${vidTag}
                <span class="collection-count-badge">x${count}</span>
              </div>
              <div class="collection-card-meta">
                <span class="collection-card-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
                <span class="collection-card-rarity" style="color:${item.rarityColor};">${escapeHtml(item.rarityName)}</span>
              </div>
            </div>
          `;
          if (!cachedUrl && !item.thumbPath) {
            CaseVaultManager.getItemMediaUrl(item).then(mediaUrl => {
              if (!mediaUrl) return;
              const els = document.querySelectorAll(`[data-vault-item="${item.id}"]`);
              els.forEach(el => { el.src = mediaUrl; });
            });
          }
        } else {
          gridHtml += `
            <div class="collection-card locked rarity-${item.rarity}" style="border-color:${item.rarityColor}; box-shadow:0 0 10px ${item.rarityGlow};">
              <div class="collection-card-thumb-wrap">
                <div class="collection-card-locked-icon" style="color:${item.rarityColor}; text-shadow:0 0 10px ${item.rarityGlow};">🔒</div>
                <span class="collection-locked-badge">LOCKED</span>
              </div>
              <div class="collection-card-meta">
                <span class="collection-card-name" title="${escapeHtml(item.name)}" style="color:#ffffff; font-weight:700;">${escapeHtml(item.name)}</span>
                <span class="collection-card-rarity" style="color:${item.rarityColor}; font-weight:800; text-shadow:0 0 6px ${item.rarityGlow};">${escapeHtml(item.rarityName.toUpperCase())}</span>
              </div>
            </div>
          `;
        }
      });

      DOM.albumItemsGrid.innerHTML = gridHtml;

      // Click card to open Lightbox
      DOM.albumItemsGrid.querySelectorAll('.collection-card.unlocked').forEach(card => {
        card.addEventListener('click', () => {
          const itId = card.getAttribute('data-item-id');
          const it = data.items.find(x => x.id === itId);
          if (it) openCasesLightbox(it);
        });
      });
    }
  }

  // Render Media in Lightbox (supports Image, Video, Audio, YouTube)
  function renderLightboxMedia(item, url) {
    if (item.isYouTube || item.youtubeUrl) {
      const ytUrl = item.youtubeUrl || url;
      const embedUrl = item.youtubeEmbedUrl || (ytUrl ? ytUrl.replace('watch?v=', 'embed/') : '');
      return `
        <div class="lightbox-youtube-player">
          <iframe src="${escapeHtml(embedUrl)}" class="lightbox-youtube-iframe" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          <a href="${escapeHtml(ytUrl)}" target="_blank" rel="noopener noreferrer" class="youtube-external-btn">
            <span>▶ Open on YouTube: ${escapeHtml(item.name)}</span>
          </a>
        </div>
      `;
    }
    if (item.isAudio) {
      const thumb = item.thumbPath || 'case opening/orbs/orb_secret.png';
      return `
        <div class="lightbox-audio-player">
          <img src="${escapeHtml(thumb)}" alt="${escapeHtml(item.name)}" class="lightbox-audio-art" />
          <div class="lightbox-audio-controls-wrap">
            <div class="audio-title" style="font-family:var(--font-display); font-size:1.25rem; font-weight:800; color:#fff;">${escapeHtml(item.name)}</div>
            <audio src="${escapeHtml(url)}" controls autoplay class="lightbox-audio-elem"></audio>
          </div>
        </div>
      `;
    }
    if (item.isVideo) {
      return `<video src="${escapeHtml(url)}" controls autoplay loop playsinline></video>`;
    }
    return `<img src="${escapeHtml(url)}" alt="${escapeHtml(item.name)}" />`;
  }

  // Open Lightbox for full picture, video, audio or YouTube playback
  function openCasesLightbox(item) {
    if (!DOM.casesLightboxModal) return;
    const inv = CaseCollectionManager.get();
    const record = inv.unlockedItems[item.id] || { count: 1, firstUnlocked: Date.now() };

    if (DOM.lightboxRarityBadge) {
      DOM.lightboxRarityBadge.textContent = item.rarityName.toUpperCase();
      DOM.lightboxRarityBadge.style.background = `${item.rarityColor}28`;
      DOM.lightboxRarityBadge.style.borderColor = item.rarityColor;
      DOM.lightboxRarityBadge.style.color = item.rarityColor;
    }

    if (DOM.lightboxItemTitle) {
      DOM.lightboxItemTitle.textContent = item.name;
    }

    if (DOM.lightboxMetaText) {
      const rObj = window.CASES_DATA.rarities.find(r => r.key === item.rarity);
      const chanceStr = rObj ? formatRarityChance(rObj, 'normal') : '';
      const dateStr = new Date(record.firstUnlocked).toLocaleDateString();
      if (item.rarity === 'album') {
        DOM.lightboxMetaText.textContent = `Rarity: ${item.rarityName} (Album Reward) • Reward for: ${item.albumName || 'Album'} • Unlocked: ${record.count}x • First obtained: ${dateStr}`;
      } else if (item.rarity === 'milestone') {
        DOM.lightboxMetaText.textContent = `Rarity: Milestone Reward • Unlocked by collecting ${item.milestoneThreshold ? item.milestoneThreshold.toLocaleString() : ''} ${item.milestoneTargetName || ''} • First obtained: ${dateStr}`;
      } else {
        DOM.lightboxMetaText.textContent = `Rarity: ${item.rarityName} (${chanceStr}) • Unboxed: ${record.count} times • First found: ${dateStr}`;
      }
    }

    const activeMediaUrl = CaseVaultManager.getCachedUrl(item.id);
    if (DOM.lightboxMediaWrap) {
      if (activeMediaUrl) {
        DOM.lightboxMediaWrap.innerHTML = renderLightboxMedia(item, activeMediaUrl);
      } else {
        DOM.lightboxMediaWrap.innerHTML = `
          <div class="lightbox-decrypting" style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:200px; color:${item.rarityColor};">
            <span style="font-size:2rem; margin-bottom:8px;">🔒</span>
            <span style="font-family:var(--font-display); font-weight:700;">Decrypting Vault Asset...</span>
          </div>
        `;
        CaseVaultManager.getItemMediaUrl(item).then(url => {
          if (url && DOM.casesLightboxModal && DOM.casesLightboxModal.style.display !== 'none') {
            if (DOM.lightboxMediaWrap) {
              DOM.lightboxMediaWrap.innerHTML = renderLightboxMedia(item, url);
            }
          }
        });
      }
    }

    // Milestone Challenge Container in Lightbox
    if (DOM.lightboxMilestoneContainer) {
      const ms = (window.CASES_DATA.milestones || []).find(m => m.targetItemId === item.id);
      if (ms) {
        const currCount = record.count || 0;
        const threshold = ms.threshold;
        const pct = Math.min(100, Math.round((currCount / threshold) * 100));
        const isClaimed = inv.unlockedItems && !!inv.unlockedItems[ms.rewardItemId];
        const isClaimable = !isClaimed && currCount >= threshold;

        DOM.lightboxMilestoneContainer.style.display = 'block';
        DOM.lightboxMilestoneContainer.innerHTML = `
          <div class="lightbox-milestone-challenge">
            <div class="milestone-challenge-header">
              <span class="milestone-icon">🎯</span>
              <span>MILESTONE CHALLENGE</span>
            </div>
            <div class="milestone-challenge-desc">
              Collect <strong>${threshold.toLocaleString()}</strong> copies to unlock <strong>${escapeHtml(ms.rewardItemName)}</strong>!
            </div>
            <div class="milestone-progress-bar-wrap">
              <div class="milestone-progress-bar" style="width:${pct}%;"></div>
            </div>
            <div class="milestone-progress-text">
              <span>${currCount.toLocaleString()} / ${threshold.toLocaleString()} (${pct}%)</span>
              ${isClaimable ? `<button class="milestone-claim-btn pulse" data-lb-claim-milestone="${ms.id}">✨ CLAIM REWARD!</button>` : ''}
              ${isClaimed ? `<span class="milestone-claimed-tag" data-lb-view-reward="${ms.rewardItemId}">🏆 Reward Unlocked (Click to view)</span>` : ''}
            </div>
          </div>
        `;

        const claimBtn = DOM.lightboxMilestoneContainer.querySelector('[data-lb-claim-milestone]');
        if (claimBtn) {
          claimBtn.addEventListener('click', () => {
            claimMilestoneReward(ms.id);
          });
        }
        const viewTag = DOM.lightboxMilestoneContainer.querySelector('[data-lb-view-reward]');
        if (viewTag) {
          viewTag.addEventListener('click', () => {
            const rew = window.CASES_DATA.items.find(x => x.id === ms.rewardItemId);
            if (rew) openCasesLightbox(rew);
          });
        }
      } else {
        DOM.lightboxMilestoneContainer.style.display = 'none';
        DOM.lightboxMilestoneContainer.innerHTML = '';
      }
    }

    DOM.casesLightboxModal.classList.remove('rarity-rainbow', 'rarity-milestone', 'rarity-album');
    if (item.rarity === 'rainbow') DOM.casesLightboxModal.classList.add('rarity-rainbow');
    if (item.rarity === 'milestone') DOM.casesLightboxModal.classList.add('rarity-milestone');
    if (item.rarity === 'album') DOM.casesLightboxModal.classList.add('rarity-album');

    DOM.casesLightboxModal.style.display = 'flex';
    SoundFX.playSelect();
  }

  function closeCasesLightbox() {
    if (DOM.casesLightboxModal) {
      DOM.casesLightboxModal.classList.remove('rarity-rainbow', 'rarity-milestone', 'rarity-album');
      DOM.casesLightboxModal.style.display = 'none';
      if (DOM.lightboxMediaWrap) {
        DOM.lightboxMediaWrap.innerHTML = '';
      }
      if (DOM.lightboxMilestoneContainer) {
        DOM.lightboxMilestoneContainer.style.display = 'none';
        DOM.lightboxMilestoneContainer.innerHTML = '';
      }
    }
  }

  function resetCasesCollection() {
    if (confirm('Reset your entire cases collection, unboxed loot history, and counters?')) {
      CaseCollectionManager.clear();
      updateCasesCollectionUI(state.caseActiveFilter || 'all');
      showToast('🗑️ Cases collection has been reset to 0.');
      SoundFX.playTone(320, 'sine', 0.15);
    }
  }

  // Claim an Album Completion Reward
  function claimAlbumReward(albumId) {
    const data = window.CASES_DATA;
    if (!data || !Array.isArray(data.albums)) return;
    const album = data.albums.find(a => a.id === albumId);
    if (!album) return;

    const inv = CaseCollectionManager.get();
    const prog = getAlbumProgress(album, inv);
    if (!prog.isCompleted) {
      showToast(`🔒 Complete "${album.name}" (${prog.owned}/${prog.total}) to claim the reward!`);
      SoundFX.playTone(280, 'sine', 0.12);
      return;
    }

    const rewardItem = data.items.find(x => x.id === album.rewardItemId);
    if (!rewardItem) {
      showToast('⚠️ Reward item not found.');
      return;
    }

    const alreadyClaimed = inv.unlockedItems && !!inv.unlockedItems[rewardItem.id];
    if (alreadyClaimed) {
      showToast(`🏆 You already claimed "${rewardItem.name}"!`);
      if (DOM.casesLightboxModal) {
        DOM.casesLightboxModal.style.display = 'none';
        if (DOM.lightboxMediaWrap) DOM.lightboxMediaWrap.innerHTML = '';
      }
      openCasesLightbox(rewardItem);
      return;
    }

    const result = CaseCollectionManager.recordRewardItem(rewardItem);

    // Close lightbox if it was open
    if (DOM.casesLightboxModal) {
      DOM.casesLightboxModal.style.display = 'none';
      if (DOM.lightboxMediaWrap) DOM.lightboxMediaWrap.innerHTML = '';
    }

    if (SoundFX.enabled) {
      SoundFX.playRarityReveal('album');
    }

    // Refresh UI
    updateCasesCollectionUI(state.caseActiveFilter || 'all');

    // Decrypt & open reveal modal
    return CaseVaultManager.getItemMediaUrl(rewardItem).then(mediaUrl => {
      openCasesRevealModal(rewardItem, result, mediaUrl);
      return { rewardItem, result, mediaUrl };
    });
  }

  // Claim an Item Quantity Milestone Reward
  function claimMilestoneReward(milestoneId) {
    const data = window.CASES_DATA;
    if (!data || !Array.isArray(data.milestones)) return;
    const ms = data.milestones.find(m => m.id === milestoneId);
    if (!ms) return;

    const inv = CaseCollectionManager.get();
    const targetRecord = inv.unlockedItems[ms.targetItemId];
    const targetCount = targetRecord ? targetRecord.count : 0;

    if (targetCount < ms.threshold) {
      showToast(`🔒 Collect ${ms.threshold.toLocaleString()} ${ms.targetItemName} to claim this reward! (${targetCount.toLocaleString()}/${ms.threshold.toLocaleString()})`);
      SoundFX.playTone(280, 'sine', 0.12);
      return;
    }

    const rewardItem = data.items.find(x => x.id === ms.rewardItemId);
    if (!rewardItem) {
      showToast('⚠️ Milestone reward item not found.');
      return;
    }

    const alreadyClaimed = inv.unlockedItems && !!inv.unlockedItems[rewardItem.id];
    if (alreadyClaimed) {
      showToast(`🏆 You already claimed "${rewardItem.name}"!`);
      if (DOM.casesLightboxModal) {
        DOM.casesLightboxModal.style.display = 'none';
        if (DOM.lightboxMediaWrap) DOM.lightboxMediaWrap.innerHTML = '';
      }
      openCasesLightbox(rewardItem);
      return;
    }

    const result = CaseCollectionManager.recordRewardItem(rewardItem);

    // Close lightbox if it was open
    if (DOM.casesLightboxModal) {
      DOM.casesLightboxModal.style.display = 'none';
      if (DOM.lightboxMediaWrap) DOM.lightboxMediaWrap.innerHTML = '';
    }

    if (SoundFX.enabled) {
      SoundFX.playRarityReveal('milestone');
    }

    // Refresh UI
    updateCasesCollectionUI(state.caseActiveFilter || 'all');
    if (state.collectionActiveTab === 'milestones') {
      renderMilestonesOverview();
    }

    // Decrypt locally via WebAssembly and open reveal modal
    return CaseVaultManager.getItemMediaUrl(rewardItem).then(mediaUrl => {
      openCasesRevealModal(rewardItem, result, mediaUrl);
      return { rewardItem, result, mediaUrl };
    });
  }

  // Render Milestones Overview Section
  function renderMilestonesOverview() {
    const data = window.CASES_DATA;
    if (!DOM.casesMilestonesGrid || !data || !Array.isArray(data.milestones)) return;

    const inv = CaseCollectionManager.get();
    let completedCount = 0;
    let html = '';

    data.milestones.forEach(ms => {
      const targetRecord = inv.unlockedItems[ms.targetItemId];
      const targetCount = targetRecord ? targetRecord.count : 0;
      const threshold = ms.threshold;
      const isCompleted = targetCount >= threshold;
      const isClaimed = inv.unlockedItems && !!inv.unlockedItems[ms.rewardItemId];
      if (isClaimed) completedCount++;
      const pct = Math.min(100, Math.round((targetCount / threshold) * 100));

      const targetItem = data.items.find(x => x.id === ms.targetItemId);
      const rewardItem = data.items.find(x => x.id === ms.rewardItemId);
      const targetThumb = targetItem ? targetItem.path : '';
      const rewardThumb = rewardItem ? (rewardItem.thumbPath || rewardItem.path) : '';

      let actionBtn = '';
      if (isClaimed) {
        actionBtn = `<button class="gold-action-btn small-btn view-reward-btn" data-view-reward="${ms.rewardItemId}">🏆 View Reward</button>`;
      } else if (isCompleted) {
        actionBtn = `<button class="milestone-claim-btn pulse" data-claim-milestone="${ms.id}">✨ CLAIM REWARD!</button>`;
      } else {
        actionBtn = `<span class="milestone-locked-pill" style="font-size:0.75rem; color:#8e9bb0; padding:5px 12px; background:rgba(255,255,255,0.06); border-radius:6px; font-weight:700;">🔒 ${pct}% PROGRESS</span>`;
      }

      html += `
        <div class="milestone-overview-card ${isClaimed ? 'completed' : ''}">
          <div class="milestone-card-left">
            <div class="milestone-card-thumb-wrap" style="border-color:${targetItem ? targetItem.rarityColor : '#fff'};">
              <img src="${escapeHtml(targetThumb)}" alt="${escapeHtml(ms.targetItemName)}" class="milestone-card-thumb" />
            </div>
            <div class="milestone-card-info">
              <div class="milestone-card-title">${escapeHtml(ms.rewardItemName)}</div>
              <div class="milestone-card-req">
                Collect <strong>${threshold.toLocaleString()}x ${escapeHtml(ms.targetItemName)}</strong>
              </div>
              <div class="milestone-progress-bar-wrap" style="margin-top:4px;">
                <div class="milestone-progress-bar" style="width:${pct}%;"></div>
              </div>
              <div class="milestone-progress-text">
                <span>${targetCount.toLocaleString()} / ${threshold.toLocaleString()} (${pct}%)</span>
                ${isClaimed ? '<span style="color:#2ecc71; font-weight:700;">Claimed</span>' : ''}
              </div>
            </div>
          </div>
          <div class="milestone-card-right">
            ${actionBtn}
          </div>
        </div>
      `;
    });

    DOM.casesMilestonesGrid.innerHTML = html;

    if (DOM.milestonesCompletedBadge) {
      DOM.milestonesCompletedBadge.textContent = `${completedCount}/${data.milestones.length} COMPLETED`;
    }
    if (DOM.cstatMilestonesCount) {
      DOM.cstatMilestonesCount.textContent = `${completedCount}/${data.milestones.length}`;
    }

    // Bind claim button clicks
    DOM.casesMilestonesGrid.querySelectorAll('[data-claim-milestone]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const msId = btn.getAttribute('data-claim-milestone');
        claimMilestoneReward(msId);
      });
    });

    // Bind view reward button clicks
    DOM.casesMilestonesGrid.querySelectorAll('[data-view-reward]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const rewId = btn.getAttribute('data-view-reward');
        const rewItem = data.items.find(x => x.id === rewId);
        if (rewItem) openCasesLightbox(rewItem);
      });
    });
  }

  // Expose for testing & celebration controls
  window.VictoryCelebration = VictoryCelebration;
  window.AntisimpdleState = state;
  window.AntisimpdleEmoji = {
    renderEmojiDisplay,
    renderEmojiBoardFromState,
    renderEmojiClues,
    pickNewEmojiPracticeTarget
  };
  window.AntisimpdlePicture = {
    renderPictureDisplay,
    renderPictureBoardFromState,
    pickNewPicturePracticeTarget,
    logPictureGuess
  };
  window.AntisimpdleCases = {
    startCaseOpening,
    resetCaseOpeningStage,
    rollCaseItem,
    createRouletteCard,
    updateCasesCollectionUI,
    updateCasesHomeBadge,
    switchCollectionViewTab,
    renderAlbumsOverview,
    renderAlbumDetail,
    claimAlbumReward,
    claimMilestoneReward,
    renderMilestonesOverview,
    CaseCollectionManager,
    CaseVaultManager,
    openCasesRevealModal,
    openCasesLightbox
  };

  // Bootstrap when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
