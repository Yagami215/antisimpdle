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
    practiceIsWon: false,
    selectedDropdownIndex: -1,
    currentMatches: [],
    activeView: 'home' // 'home' | 'classic'
  };

  // --- Active Mode Helpers (Scoping Guesses to Daily vs Practice) ---
  function getActiveGuessedIds() {
    return state.gameMode === 'daily' ? state.guessedIds : state.practiceGuessedIds;
  }

  function getActiveHistory() {
    return state.gameMode === 'daily' ? state.guessesHistory : state.practiceHistory;
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
    solvedCountdownClock: document.getElementById('solvedCountdownClock'),
    viewSolvedSummaryBtn: document.getElementById('viewSolvedSummaryBtn'),
    switchPracticeBtn: document.getElementById('switchPracticeBtn'),

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
    bindEvents();

    // Start 1-second midnight timer
    setInterval(handleSecondTick, 1000);
    handleSecondTick();

    // Check hash for direct mode linking
    if (window.location.hash === '#classic') {
      showView('classic', false);
    } else {
      showView('home', false);
    }
  }

  // --- View Switcher ---
  function showView(viewName, playSound = true) {
    state.activeView = viewName;

    if (viewName === 'classic') {
      DOM.homeView.style.display = 'none';
      DOM.classicView.style.display = 'flex';
      window.location.hash = '#classic';
      setTimeout(() => {
        if (DOM.input && !DOM.input.disabled) DOM.input.focus();
      }, 50);
    } else {
      DOM.homeView.style.display = 'flex';
      DOM.classicView.style.display = 'none';
      if (window.location.hash === '#classic') {
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
    if (DOM.solvedCountdownClock) DOM.solvedCountdownClock.textContent = dayInfo.countdownStr;
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

    if (!state.practiceTargetMember) {
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
    const pool = state.members.filter(m => 
      (!state.dailyTargetMember || m.id !== state.dailyTargetMember.id) &&
      (!state.practiceTargetMember || m.id !== state.practiceTargetMember.id)
    );
    const chosen = pool[Math.floor(Math.random() * pool.length)] || state.members[0];

    state.practiceTargetMember = chosen;
    state.targetMember = chosen;
    state.practiceGuessedIds.clear();
    state.practiceHistory = [];
    state.practiceIsWon = false;

    renderBoardFromState([]);
    updatePracticeUI();

    DOM.input.disabled = false;
    DOM.input.placeholder = 'Type member name or alias... (Practice Mode)';
    DOM.guessBtn.disabled = false;

    if (DOM.alreadySolvedBanner) DOM.alreadySolvedBanner.style.display = 'none';
    if (DOM.victoryModal) DOM.victoryModal.style.display = 'none';
    VictoryCelebration.stop();
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

    setDailySolvedUI(state.isWon);
    SoundFX.playSelect();
  }

  function updatePracticeUI() {
    if (DOM.classicHeaderTitle) DOM.classicHeaderTitle.textContent = 'CLASSIC • PRACTICE';
    if (DOM.classicDailyBadge) {
      DOM.classicDailyBadge.textContent = '🎲 PRACTICE';
      DOM.classicDailyBadge.style.background = 'linear-gradient(135deg, #ff1744, #b71c1c)';
      DOM.classicDailyBadge.style.color = '#ffffff';
    }
    if (DOM.classicHeaderHint) DOM.classicHeaderHint.textContent = 'Unlimited Practice • Guess random members';
    if (DOM.classicCountdownWrap) DOM.classicCountdownWrap.style.display = 'none';
    if (DOM.practiceToggleText) DOM.practiceToggleText.textContent = 'Back to Daily';
    if (DOM.practiceToggleIcon) DOM.practiceToggleIcon.textContent = '🎯';
    if (DOM.alreadySolvedBanner) DOM.alreadySolvedBanner.style.display = 'none';

    DOM.input.disabled = false;
    DOM.input.placeholder = 'Type member name or alias... (Practice Mode)';
    DOM.guessBtn.disabled = false;
  }

  function resetGame() {
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
      if (confirm('Start a new practice member?')) {
        pickNewPracticeTarget();
        SoundFX.playTone(440, 'sine', 0.12);
      }
    }
  }

  // --- Statistics Modal ---
  function updateStatsUI(stats) {
    if (DOM.topStatsStreak) {
      DOM.topStatsStreak.textContent = '🔥 ' + stats.currentStreak;
    }
  }

  function openStatsModal() {
    const stats = StatsManager.get();
    if (DOM.statsValPlayed) DOM.statsValPlayed.textContent = stats.played;
    if (DOM.statsValWinPct) {
      const pct = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
      DOM.statsValWinPct.textContent = pct + '%';
    }
    if (DOM.statsValCurrentStreak) DOM.statsValCurrentStreak.textContent = stats.currentStreak;
    if (DOM.statsValMaxStreak) DOM.statsValMaxStreak.textContent = stats.maxStreak;

    renderGuessDistribution(stats);

    if (DOM.statsShareBtn) {
      DOM.statsShareBtn.style.display = state.isWon ? 'flex' : 'none';
    }

    if (DOM.statsModal) DOM.statsModal.style.display = 'flex';
    SoundFX.playSelect();
  }

  function closeStatsModal() {
    if (DOM.statsModal) DOM.statsModal.style.display = 'none';
  }

  function renderGuessDistribution(stats) {
    if (!DOM.guessDistributionContainer) return;
    const dist = stats.distribution || {};
    const maxVal = Math.max(...Object.values(dist), 1);
    const keys = ['1', '2', '3', '4', '5', '6', '7+'];

    const todayTries = state.isWon ? state.guessesHistory.length : -1;
    const todayBucket = todayTries >= 7 ? '7+' : String(todayTries);

    let html = '';
    keys.forEach(k => {
      const count = dist[k] || 0;
      const widthPct = Math.max(8, Math.round((count / maxVal) * 100));
      const isHighlight = state.isWon && todayBucket === k;

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
   * General Category Matcher:
   * Returns: 'correct' (green), 'partial' (orange), or 'incorrect' (red)
   */
  function compareGeneral(guessVal, targetVal) {
    const g = String(guessVal || '').trim().toLowerCase();
    const t = String(targetVal || '').trim().toLowerCase();

    if (!g && !t) return { status: 'correct', arrow: null };
    if (!g || !t) return { status: 'incorrect', arrow: null };
    if (g === t) return { status: 'correct', arrow: null };

    // Split on comma or slash for multiple tags
    const gParts = g.split(/[,/]+/).map(s => s.trim()).filter(Boolean);
    const tParts = t.split(/[,/]+/).map(s => s.trim()).filter(Boolean);

    const overlap = gParts.filter(p => tParts.includes(p));
    if (overlap.length > 0) {
      return { status: 'partial', arrow: null };
    }

    if (t.includes(g) || g.includes(t)) {
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

    if (DOM.backToHomeBtn) {
      DOM.backToHomeBtn.addEventListener('click', () => showView('home'));
    }

    if (DOM.homeLogoBtn) {
      DOM.homeLogoBtn.addEventListener('click', () => showView('home'));
    }

    if (DOM.browseRosterBtn) {
      DOM.browseRosterBtn.addEventListener('click', openMembersModal);
    }

    // Input handling
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

    // Click outside to close dropdown
    document.addEventListener('click', (e) => {
      if (!DOM.input.contains(e.target) && !DOM.dropdown.contains(e.target)) {
        closeDropdown();
      }
    });

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
        if (state.targetMember) {
          shareResult(state.targetMember, state.guessesHistory.length, false);
        }
      });
    }

    // Victory modal buttons & share action
    if (DOM.victoryPracticeBtn) {
      DOM.victoryPracticeBtn.addEventListener('click', () => {
        VictoryCelebration.stop();
        if (state.gameMode === 'daily') {
          switchToPracticeMode();
        } else {
          pickNewPracticeTarget();
        }
      });
    }

    if (DOM.shareResultBtn) {
      DOM.shareResultBtn.addEventListener('click', () => {
        const lastMember = state.targetMember;
        const tries = getActiveHistory().length;
        if (lastMember) {
          shareResult(lastMember, tries, state.gameMode === 'practice');
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
        closeMembersModal();
        closeStatsModal();
        if (DOM.victoryModal) DOM.victoryModal.style.display = 'none';
      }
    });

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

  function findMatches(query) {
    const results = [];
    const activeGuessed = getActiveGuessedIds();

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
    if (DOM.dropdown.style.display === 'none') {
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

    // Comparisons
    const cmpSpol = compareGeneral(guessCats.spol, targetCats.spol);
    const cmpLokacija = compareGeneral(guessCats.lokacija, targetCats.lokacija);
    const cmpStatus = compareGeneral(guessCats.status, targetCats.status);
    const cmpDolazak = compareYear(guessCats.dolazak_na_server, targetCats.dolazak_na_server);
    const cmpKilaza = compareKilaza(guessCats.kilaza, targetCats.kilaza);
    const cmpOkupacija = compareGeneral(guessCats.okupacija, targetCats.okupacija);
    const cmpAktivnost = compareGeneral(guessCats.aktivnost, targetCats.aktivnost);

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

      const cmpSpol = compareGeneral(gCats.spol, tCats.spol);
      const cmpLok = compareGeneral(gCats.lokacija, tCats.lokacija);
      const cmpStat = compareGeneral(gCats.status, tCats.status);
      const cmpDol = compareYear(gCats.dolazak_na_server, tCats.dolazak_na_server);
      const cmpKil = compareKilaza(gCats.kilaza, tCats.kilaza);
      const cmpOkup = compareGeneral(gCats.okupacija, tCats.okupacija);
      const cmpAkt = compareGeneral(gCats.aktivnost, tCats.aktivnost);

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

  // Expose for testing & celebration controls
  window.VictoryCelebration = VictoryCelebration;
  window.AntisimpdleState = state;

  // Bootstrap when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
