'use strict';
// Звуки и музыка — всё синтезируется на лету (WebAudio), файлов нет.
const Snd = {
  ctx: null, on: true, musicOn: true, mTimer: null, step: 0, master: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = .6; this.master.connect(this.ctx.destination);
      if (this.musicOn && this.on) this.startMusic();
    } catch (e) { }
  },
  tone(f, d, type, vol, delay, slide) {
    if (!this.ctx || !this.on) return;
    const t = this.ctx.currentTime + (delay || 0), o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || .2, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + d + .03);
  },
  play(n) {
    if (!this.on) return;
    switch (n) {
      case 'click': this.tone(660, .06, 'triangle', .12); break;
      case 'ok': this.tone(660, .1, 'triangle', .2); this.tone(880, .14, 'triangle', .2, .08); break;
      case 'fast': this.tone(660, .08, 'triangle', .2); this.tone(880, .08, 'triangle', .2, .07); this.tone(1175, .18, 'triangle', .22, .14); break;
      case 'bad': this.tone(220, .22, 'sawtooth', .16, 0, 120); break;
      case 'late': this.tone(330, .16, 'square', .1, 0, 200); break;
      case 'coin': this.tone(1320, .07, 'square', .08); this.tone(1760, .12, 'square', .08, .06); break;
      case 'card': [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, .16, 'sine', .15, i * .07)); break;
      case 'level': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, .22, 'triangle', .2, i * .09)); break;
      case 'door': this.tone(140, .18, 'sine', .22, 0, 70); break;
      case 'tick': this.tone(900, .04, 'square', .06); break;
      case 'hit': this.tone(180, .14, 'sawtooth', .2, 0, 60); this.tone(520, .1, 'square', .1, .02, 200); break;
      case 'win': [523, 659, 784, 659, 784, 1047].forEach((f, i) => this.tone(f, .2, 'triangle', .22, i * .12)); break;
      case 'lose': [392, 349, 311, 262].forEach((f, i) => this.tone(f, .26, 'sawtooth', .13, i * .16)); break;
      case 'step': this.tone(120 + Math.random() * 30, .04, 'sine', .04); break;
    }
  },
  startMusic() {
    if (!this.ctx || this.mTimer) return;
    const prog = [[261.6, 329.6, 392], [220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 392]], pent = [523.3, 587.3, 659.3, 784, 880, 1046.5];
    const bar = () => {
      if (!this.on || !this.musicOn || document.hidden) return;
      const ch = prog[this.step++ % 4];
      ch.forEach((f, i) => this.tone(f, 1.9, 'triangle', .028, i * .02));
      for (let i = 0; i < 4; i++) if (Math.random() < .7) this.tone(pent[Math.floor(Math.random() * pent.length)], .5, 'sine', .035, i * .5 + (Math.random() < .3 ? .25 : 0));
    };
    bar(); this.mTimer = setInterval(bar, 2000);
  },
  stopMusic() { if (this.mTimer) { clearInterval(this.mTimer); this.mTimer = null; } },
  setOn(v) { this.on = v; if (!v) this.stopMusic(); else if (this.musicOn) this.startMusic(); },
  setMusic(v) { this.musicOn = v; if (!v) this.stopMusic(); else if (this.on) this.startMusic(); },
};
function vibe(ms) { try { if (S && S.settings && S.settings.vibe && navigator.vibrate) navigator.vibrate(ms); } catch (e) { } }
