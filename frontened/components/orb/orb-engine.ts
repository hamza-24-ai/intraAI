import {
  CANVAS_OVERSCAN,
  FALLBACK_RAY_COUNT,
  HEARTBEAT_MS,
  ORB_COLORS,
  SPEAKING_SETTLE_MS,
  STATE_BLEND_MS,
  WRAPUP_MS,
  type OrbState,
} from "@/components/orb/orb-types";

const HEARTBEAT_T = [0, 0.12, 0.25, 0.42, 0.56, 1];
const HEARTBEAT_SCALE = [1, 1.08, 1, 1.045, 1, 1];
const HEARTBEAT_RAY = [1, 1.35, 1, 1.15, 1, 1];
const HEARTBEAT_GLOW = [1, 1.25, 1, 1.12, 1, 1];

const SEGMENTS = 6;
const PARTICLE_COUNT = 60;
const LISTENING_RIPPLE_MS = 1100;

export interface OrbFrameInfo {
  bobY: number;
  glowMul: number;
  dissolved: boolean;
  countdownActive: boolean;
  countdownRatio: number;
  countdownWarning: boolean;
}

interface Ray {
  angle0: number;
  rest: number;
  longArc: boolean;
  flickerPhase: number;
  morphPhase: number;
  morphSpeed: number;
  ptsX: Float32Array;
  ptsY: Float32Array;
}

interface Ripple {
  born: number;
  duration: number;
  r0: number;
  r1: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  mid: boolean;
}

interface Visual {
  breathPeriod: number;
  breathAmp: number;
  scaleBase: number;
  rayLength: number;
  rotatePeriod: number;
  plasmaPeriod: number;
  brightness: number;
  opacity: number;
  shimmer: number;
  glow: number;
}

const REST: Visual = {
  breathPeriod: 4,
  breathAmp: 0.03,
  scaleBase: 1,
  rayLength: 0.72,
  rotatePeriod: 40,
  plasmaPeriod: 18,
  brightness: 1,
  opacity: 1,
  shimmer: 0,
  glow: 0.94,
};

function visualFor(state: OrbState): Visual {
  switch (state) {
    case "idle":
      return { ...REST, breathPeriod: 4, breathAmp: 0.03, rayLength: 0.7, glow: 0.92 };
    case "speaking":
      return {
        ...REST,
        breathPeriod: 4,
        breathAmp: 0,
        rayLength: 1,
        brightness: 1.06,
        glow: 1,
      };
    case "listening":
      return {
        ...REST,
        breathPeriod: 3,
        breathAmp: 0.025,
        rayLength: 0.6,
        rotatePeriod: 20,
        glow: 0.94,
      };
    case "userSpeaking":
      return {
        ...REST,
        breathAmp: 0,
        rayLength: 1,
        brightness: 1.08,
        glow: 0.98,
        rotatePeriod: 28,
      };
    case "thinking":
      return {
        ...REST,
        breathAmp: 0,
        scaleBase: 0.97,
        rayLength: 0.55,
        rotatePeriod: 20 / 3,
        plasmaPeriod: 6,
        shimmer: 1,
        glow: 0.88,
        brightness: 0.96,
      };
    case "error":
      return {
        ...REST,
        breathAmp: 0,
        rayLength: 0,
        rotatePeriod: 80,
        glow: 0.9,
        opacity: 0.92,
      };
    case "wrapup":
      return {
        ...REST,
        breathAmp: 0,
        rayLength: 0,
        glow: 0.8,
        opacity: 0.2,
      };
  }
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

function easeOut(t: number): number {
  const x = clamp01(t);
  return 1 - (1 - x) * (1 - x);
}

function mixVisual(a: Visual, b: Visual, t: number): Visual {
  return {
    breathPeriod: lerp(a.breathPeriod, b.breathPeriod, t),
    breathAmp: lerp(a.breathAmp, b.breathAmp, t),
    scaleBase: lerp(a.scaleBase, b.scaleBase, t),
    rayLength: lerp(a.rayLength, b.rayLength, t),
    rotatePeriod: lerp(a.rotatePeriod, b.rotatePeriod, t),
    plasmaPeriod: lerp(a.plasmaPeriod, b.plasmaPeriod, t),
    brightness: lerp(a.brightness, b.brightness, t),
    opacity: lerp(a.opacity, b.opacity, t),
    shimmer: lerp(a.shimmer, b.shimmer, t),
    glow: lerp(a.glow, b.glow, t),
  };
}

/** Heartbeat sampler. `t` is the cycle fraction 0..1. */
export function sampleHeartbeat(t: number, values: readonly number[]): number {
  const u = t - Math.floor(t);
  for (let i = 0; i < HEARTBEAT_T.length - 1; i++) {
    const a = HEARTBEAT_T[i];
    const b = HEARTBEAT_T[i + 1];
    if (u <= b) {
      const p = easeOut((u - a) / (b - a));
      return lerp(values[i], values[i + 1], p);
    }
  }
  return values[values.length - 1];
}

export function smoothToward(current: number, target: number, dtMs: number, tauMs: number): number {
  if (tauMs <= 0) return target;
  const a = 1 - Math.exp(-dtMs / tauMs);
  return current + (target - current) * a;
}

function rgba(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export class OrbRenderer {
  private ctx: CanvasRenderingContext2D;
  private boxSize = 400;
  private rays: Ray[] = [];
  private ripples: Ripple[] = [];
  private particles: Particle[] = [];
  private state: OrbState = "idle";
  private fromVisual: Visual = visualFor("idle");
  private toVisual: Visual = visualFor("idle");
  private blendStart = 0;
  private origin = 0;
  private lastNow = 0;
  private angle = 0;
  private plasmaAngle = 0;
  private orbitAngle = 0;
  private levelSmoothed = 0;
  private beatOrigin = 0;
  private inSpeaking = false;
  private speakingWeight = 0;
  private lastBeatCycle = -1;
  private dubAt: number | null = null;
  private wrapupOrigin = 0;
  private wrapupStarted = false;
  private dissolved = false;
  private particlesSpawned = false;
  private lastListenRipple = 0;
  private errorT = 0;
  private canvasCss = 400 * CANVAS_OVERSCAN;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  get box(): number {
    return this.boxSize;
  }

  resize(boxSize: number, dpr: number): void {
    this.boxSize = boxSize;
    this.canvasCss = boxSize * CANVAS_OVERSCAN;
    const canvas = this.ctx.canvas;
    const pixel = Math.max(1, Math.round(this.canvasCss * dpr));
    if (canvas.width !== pixel || canvas.height !== pixel) {
      canvas.width = pixel;
      canvas.height = pixel;
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  setRayCount(count: number): void {
    const n = Math.max(8, count);
    if (this.rays.length === n) return;
    this.rays = buildRays(n);
  }

  setState(state: OrbState, now: number): void {
    if (state === this.state) return;
    const blended = this.currentVisual(now);
    this.fromVisual = blended;
    this.toVisual = visualFor(state);
    this.blendStart = now;
    const wasSpeaking = this.state === "speaking";
    this.state = state;

    if (state === "speaking") {
      this.beatOrigin = now;
      this.lastBeatCycle = -1;
      this.dubAt = null;
      this.inSpeaking = true;
      this.speakingWeight = 1;
    } else if (wasSpeaking) {
      this.inSpeaking = false;
    }

    if (state === "wrapup") {
      this.wrapupOrigin = now;
      this.wrapupStarted = true;
      this.dissolved = false;
      this.particlesSpawned = false;
      this.particles.length = 0;
    } else {
      this.wrapupStarted = false;
      this.particles.length = 0;
    }

    if (state === "error") this.errorT = now;
  }

  tick(
    now: number,
    level: number,
    countdownMs: number | null,
    countdownTotalMs = 20_000
  ): OrbFrameInfo {
    if (this.origin === 0) this.origin = now;
    const dt = this.lastNow === 0 ? 16 : Math.min(48, now - this.lastNow);
    this.lastNow = now;

    const tau = level > this.levelSmoothed ? 40 : 120;
    this.levelSmoothed = smoothToward(this.levelSmoothed, clamp01(level), dt, tau);

    if (this.inSpeaking) this.speakingWeight = 1;
    else this.speakingWeight = smoothToward(this.speakingWeight, 0, dt, SPEAKING_SETTLE_MS);

    const vis = this.currentVisual(now);
    this.angle += (dt / 1000) * ((Math.PI * 2) / Math.max(4, vis.rotatePeriod));
    this.plasmaAngle += (dt / 1000) * ((Math.PI * 2) / Math.max(2, vis.plasmaPeriod));
    this.orbitAngle += (dt / 1000) * ((Math.PI * 2) / 28);

    const elapsed = now - this.origin;
    const bobY = 3 * Math.sin((elapsed / 4000) * Math.PI * 2);

    this.updateHeartbeat(now);
    this.updateListeningRipples(now);
    this.updateWrapup(now, dt);

    const R = this.boxSize / 2;
    const scale = this.sphereScale(now, vis);
    this.draw(now, vis, bobY, scale, R, countdownMs);

    const countdownActive = countdownMs !== null;
    const remaining = countdownMs ?? 0;
    return {
      bobY,
      glowMul: vis.glow * (this.speakingWeight > 0 ? this.beatGlow(now) : 1),
      dissolved: this.dissolved,
      countdownActive,
      countdownRatio: countdownActive ? clamp01(remaining / Math.max(1, countdownTotalMs)) : 1,
      countdownWarning: countdownActive && remaining <= 5000,
    };
  }

  /** Single static frame for reduced-motion / context-less fallbacks drawn to canvas. */
  drawStatic(state: OrbState, countdownMs: number | null): OrbFrameInfo {
    this.state = state;
    this.fromVisual = visualFor(state);
    this.toVisual = this.fromVisual;
    this.speakingWeight = 0;
    this.ripples.length = 0;
    const vis = this.toVisual;
    const R = this.boxSize / 2;
    this.draw(0, vis, 0, vis.scaleBase, R, countdownMs);
    const countdownActive = countdownMs !== null;
    return {
      bobY: 0,
      glowMul: vis.glow,
      dissolved: state === "wrapup",
      countdownActive,
      countdownRatio: countdownActive ? clamp01((countdownMs ?? 0) / 20_000) : 1,
      countdownWarning: countdownActive && (countdownMs ?? 0) <= 5000,
    };
  }

  private currentVisual(now: number): Visual {
    const t = easeOut((now - this.blendStart) / STATE_BLEND_MS);
    if (t >= 1) return this.toVisual;
    return mixVisual(this.fromVisual, this.toVisual, t);
  }

  private beatT(now: number): number {
    const elapsed = Math.max(0, now - this.beatOrigin);
    return (elapsed % HEARTBEAT_MS) / HEARTBEAT_MS;
  }

  private beatGlow(now: number): number {
    if (this.speakingWeight <= 0.001) return 1;
    return lerp(1, sampleHeartbeat(this.beatT(now), HEARTBEAT_GLOW), this.speakingWeight);
  }

  private sphereScale(now: number, vis: Visual): number {
    const elapsed = now - this.origin;
    const breath =
      vis.breathAmp > 0
        ? 1 + vis.breathAmp * (0.5 + 0.5 * Math.sin((elapsed / (vis.breathPeriod * 1000)) * Math.PI * 2))
        : 1;
    let scale = vis.scaleBase * breath;
    if (vis.shimmer > 0) scale *= 1 + 0.008 * vis.shimmer * Math.sin(elapsed * 0.008);

    if (this.speakingWeight > 0) {
      const hb = sampleHeartbeat(this.beatT(now), HEARTBEAT_SCALE);
      scale = lerp(scale, vis.scaleBase * hb, this.speakingWeight);
    }

    if (this.wrapupStarted) {
      const u = clamp01((now - this.wrapupOrigin) / 220);
      const pulse = 1 + 0.1 * Math.sin(u * Math.PI);
      scale *= pulse;
    }
    return scale;
  }

  private updateHeartbeat(now: number): void {
    if (this.speakingWeight <= 0.001 || !this.inSpeaking) {
      this.dubAt = null;
      return;
    }
    const elapsed = Math.max(0, now - this.beatOrigin);
    const cycle = Math.floor(elapsed / HEARTBEAT_MS);
    if (cycle !== this.lastBeatCycle) {
      this.lastBeatCycle = cycle;
      const R = this.boxSize / 2;
      this.ripples.push({ born: now, duration: 700, r0: R, r1: R * 1.6 });
      this.dubAt = this.beatOrigin + cycle * HEARTBEAT_MS + HEARTBEAT_MS * 0.3;
    }
    if (this.dubAt !== null && now >= this.dubAt) {
      const R = this.boxSize / 2;
      this.ripples.push({ born: now, duration: 500, r0: R, r1: R * 1.3 });
      this.dubAt = null;
    }
  }

  private updateListeningRipples(now: number): void {
    if (this.state !== "listening" && this.state !== "userSpeaking") return;
    if (this.state === "userSpeaking") return;
    if (now - this.lastListenRipple < LISTENING_RIPPLE_MS) return;
    this.lastListenRipple = now;
    const R = this.boxSize / 2;
    this.ripples.push({ born: now, duration: 1400, r0: R * 1.55, r1: R * 1.02 });
  }

  private updateWrapup(now: number, dt: number): void {
    if (!this.wrapupStarted) return;
    const t = now - this.wrapupOrigin;
    if (!this.particlesSpawned && t >= 180) {
      this.spawnParticles();
      this.particlesSpawned = true;
    }
    if (this.particlesSpawned) {
      for (const p of this.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    }
    if (!this.dissolved && t >= WRAPUP_MS) this.dissolved = true;
  }

  private spawnParticles(): void {
    const rng = mulberry32(0xc0ffee);
    const R = this.boxSize / 2;
    const css = this.canvasCss;
    const cx = css / 2;
    const cy = css / 2;
    this.particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const a = rng() * Math.PI * 2;
      const sp = 0.04 + rng() * 0.12;
      this.particles.push({
        x: cx + Math.cos(a) * R * 0.7,
        y: cy + Math.sin(a) * R * 0.7,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 0.02,
        size: 1.4 + rng() * 2.4,
        mid: rng() > 0.45,
      });
    }
  }

  private draw(
    now: number,
    vis: Visual,
    bobY: number,
    scale: number,
    R: number,
    countdownMs: number | null
  ): void {
    const ctx = this.ctx;
    const css = this.canvasCss;
    ctx.clearRect(0, 0, css, css);

    const cx = css / 2;
    const cy = css / 2 + bobY;
    const radius = R * scale;
    const wrapT = this.wrapupStarted ? clamp01((now - this.wrapupOrigin) / WRAPUP_MS) : 0;
    const wrapFade = this.wrapupStarted ? 1 - easeOut(wrapT) : 1;
    const countSoft = countdownMs !== null ? 0.86 : 1;
    const alpha = vis.opacity * wrapFade * countSoft;

    ctx.save();
    ctx.globalAlpha = alpha;

    this.drawShadow(cx, cy, radius);
    this.drawRays(now, vis, cx, cy, radius, R);
    this.drawRipples(now, cx, cy);
    this.drawSphere(vis, cx, cy, radius);
    this.drawPlasma(vis, cx, cy, radius);
    this.drawOrbit(cx, cy, radius);
    if (this.state === "error") this.drawErrorRing(now, cx, cy, radius);

    ctx.restore();
    this.drawParticles(now, wrapT);
  }

  private drawShadow(cx: number, cy: number, radius: number): void {
    const ctx = this.ctx;
    const sy = cy + radius * 0.92;
    const rx = radius * 0.72;
    const ry = radius * 0.2;
    ctx.save();
    ctx.translate(cx, sy);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, rgba(ORB_COLORS.violet, 0.18));
    g.addColorStop(1, rgba(ORB_COLORS.violet, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawRays(now: number, vis: Visual, cx: number, cy: number, radius: number, R: number): void {
    const ctx = this.ctx;
    const voice =
      this.state === "speaking" || this.speakingWeight > 0.05
        ? 1 + 0.15 * this.levelSmoothed
        : this.state === "userSpeaking"
          ? 0.55 + 1.05 * this.levelSmoothed
          : 1;
    let rayMul = vis.rayLength * voice;
    if (this.speakingWeight > 0) {
      rayMul *= lerp(1, sampleHeartbeat(this.beatT(now), HEARTBEAT_RAY), this.speakingWeight);
    }
    if (this.state === "error") {
      const collapse = easeOut((now - this.errorT) / 400);
      rayMul *= 1 - collapse;
    }

    const elapsed = now - this.origin;
    const flickerHz = 1.6;

    for (let i = 0; i < this.rays.length; i++) {
      const ray = this.rays[i];
      const ang = ray.angle0 + this.angle;
      const morph = 0.65 + 0.35 * Math.sin(elapsed * ray.morphSpeed + ray.morphPhase);
      let len = ray.rest * R * rayMul * morph;
      if (ray.longArc) {
        const flick = 0.88 + 0.12 * (0.5 + 0.5 * Math.sin(Math.PI * 2 * flickerHz * (elapsed / 1000) + ray.flickerPhase));
        len *= 1.35 * flick;
      }
      const x0 = cx + Math.cos(ang) * (radius * 0.98);
      const y0 = cy + Math.sin(ang) * (radius * 0.98);
      const x1 = cx + Math.cos(ang) * (radius + len);
      const y1 = cy + Math.sin(ang) * (radius + len);
      const nx = -Math.sin(ang);
      const ny = Math.cos(ang);

      for (let s = 0; s <= SEGMENTS; s++) {
        const t = s / SEGMENTS;
        const px = lerp(x0, x1, t);
        const py = lerp(y0, y1, t);
        const edge = s === 0 || s === SEGMENTS ? 0 : 1;
        const n =
          edge *
          (6 + (ray.longArc ? 4 : 0)) *
          Math.sin(elapsed * 0.003 + ray.morphPhase + s * 1.2) *
          morph;
        ray.ptsX[s] = px + nx * n;
        ray.ptsY[s] = py + ny * n;
      }

      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      grad.addColorStop(0, rgba(ORB_COLORS.midpoint, ray.longArc ? 0.95 : 0.85));
      grad.addColorStop(1, rgba(ORB_COLORS.midpoint, 0));

      ctx.beginPath();
      ctx.moveTo(ray.ptsX[0], ray.ptsY[0]);
      for (let s = 1; s <= SEGMENTS; s++) ctx.lineTo(ray.ptsX[s], ray.ptsY[s]);
      ctx.strokeStyle = rgba(ORB_COLORS.midpoint, 0.16);
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(ray.ptsX[0], ray.ptsY[0]);
      for (let s = 1; s <= SEGMENTS; s++) ctx.lineTo(ray.ptsX[s], ray.ptsY[s]);
      ctx.strokeStyle = grad;
      ctx.lineWidth = ray.longArc ? 2.8 : 2.2;
      ctx.stroke();
    }
  }

  private drawRipples(now: number, cx: number, cy: number): void {
    const ctx = this.ctx;
    let w = 0;
    for (let i = 0; i < this.ripples.length; i++) {
      const r = this.ripples[i];
      const t = (now - r.born) / r.duration;
      if (t >= 1) continue;
      this.ripples[w++] = r;
      const rad = lerp(r.r0, r.r1, easeOut(t));
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(ORB_COLORS.violet, 0.4 * (1 - t));
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.stroke();
    }
    this.ripples.length = w;
  }

  private drawSphere(vis: Visual, cx: number, cy: number, radius: number): void {
    const ctx = this.ctx;
    const g = ctx.createRadialGradient(
      cx - radius * 0.32,
      cy - radius * 0.38,
      radius * 0.06,
      cx + radius * 0.12,
      cy + radius * 0.18,
      radius
    );
    const b = vis.brightness;
    g.addColorStop(0, rgba(ORB_COLORS.highlight, 0.95 * b));
    g.addColorStop(0.42, rgba(ORB_COLORS.violet, 1));
    g.addColorStop(1, rgba(ORB_COLORS.violetDeep, 1));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawPlasma(vis: Visual, cx: number, cy: number, radius: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.98, 0, Math.PI * 2);
    ctx.clip();
    ctx.translate(cx, cy);
    ctx.rotate(this.plasmaAngle);

    const blobs = [
      { x: -0.22, y: -0.18, s: 0.55, c: ORB_COLORS.midpoint, a: 0.42 },
      { x: 0.28, y: 0.12, s: 0.48, c: ORB_COLORS.violet, a: 0.38 },
      { x: 0.05, y: 0.3, s: 0.4, c: ORB_COLORS.midpoint, a: 0.32 },
      { x: -0.12, y: 0.08, s: 0.35, c: ORB_COLORS.highlight, a: 0.22 },
    ];
    for (const blob of blobs) {
      const px = blob.x * radius;
      const py = blob.y * radius;
      const rs = blob.s * radius;
      const g = ctx.createRadialGradient(px, py, 0, px, py, rs);
      g.addColorStop(0, rgba(blob.c, blob.a * vis.brightness));
      g.addColorStop(1, rgba(blob.c, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, rs, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    const specX = cx - radius * 0.2;
    const specY = cy - radius * 0.24;
    const spec = ctx.createRadialGradient(specX, specY, 0, specX, specY, radius * 0.38);
    spec.addColorStop(0, "rgba(255,255,255,0.35)");
    spec.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = spec;
    ctx.beginPath();
    ctx.ellipse(specX, specY, radius * 0.3, radius * 0.22, -0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = Math.max(1.5, radius * 0.025);
    ctx.stroke();
  }

  private drawOrbit(cx: number, cy: number, radius: number): void {
    const ctx = this.ctx;
    const rx = radius * 1.15;
    const ry = rx * Math.cos((65 * Math.PI) / 180);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.orbitAngle);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(ORB_COLORS.violet, 0.3);
    ctx.lineWidth = 1.25;
    ctx.setLineDash([]);
    ctx.stroke();
    ctx.restore();
  }

  private drawErrorRing(now: number, cx: number, cy: number, radius: number): void {
    const ctx = this.ctx;
    const appear = easeOut((now - this.errorT) / 400);
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.12, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(ORB_COLORS.warning, 0.95 * appear);
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawParticles(now: number, wrapT: number): void {
    if (!this.particlesSpawned || this.particles.length === 0) return;
    const ctx = this.ctx;
    const life = clamp01((wrapT - 180 / WRAPUP_MS) / (900 / WRAPUP_MS));
    for (const p of this.particles) {
      const a = 0.85 * (1 - life);
      ctx.fillStyle = rgba(p.mid ? ORB_COLORS.midpoint : ORB_COLORS.violet, a);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function buildRays(count: number): Ray[] {
  const rng = mulberry32(0x4f1a2b3c);
  const longCount = Math.min(12, Math.max(4, Math.round(count / 4)));
  const rays: Ray[] = [];
  const longIdx = new Set<number>();
  while (longIdx.size < longCount) longIdx.add(Math.floor(rng() * count));

  for (let i = 0; i < count; i++) {
    const longArc = longIdx.has(i);
    rays.push({
      angle0: (i / count) * Math.PI * 2 + (rng() - 0.5) * 0.12,
      rest: longArc ? 0.72 + rng() * 0.23 : 0.18 + rng() * 0.42,
      longArc,
      flickerPhase: rng() * Math.PI * 2,
      morphPhase: rng() * Math.PI * 2,
      morphSpeed: 0.0018 + rng() * 0.0012,
      ptsX: new Float32Array(SEGMENTS + 1),
      ptsY: new Float32Array(SEGMENTS + 1),
    });
  }
  return rays;
}

export function fallbackRayLayout(count = FALLBACK_RAY_COUNT): { angle: number; length: number }[] {
  const out: { angle: number; length: number }[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      angle: (i / count) * Math.PI * 2 + 0.11,
      length: 0.18 + ((i * 7) % 10) / 10 * 0.42,
    });
  }
  return out;
}
