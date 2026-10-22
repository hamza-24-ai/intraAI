// lib/audio/player.ts
export class AudioPlayer {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioBufferSourceNode | null = null;

  /** Call synchronously inside a click handler (browser autoplay policy, Safari included). */
  unlock() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.connect(this.ctx.destination);
    }
    void this.ctx.resume();
  }

  /** For a waveform/level visual later. */
  getAnalyser() {
    return this.analyser;
  }

  async play(data: ArrayBuffer): Promise<void> {
    if (!this.ctx) this.unlock();
    const ctx = this.ctx!;
    await ctx.resume();
    const buffer = await ctx.decodeAudioData(data.slice(0));
    this.stop();

    await new Promise<void>((resolve) => {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.analyser!);
      source.onended = () => resolve();
      this.source = source;
      source.start();
    });
  }

  stop() {
    try {
      this.source?.stop();
    } catch {
      /* already stopped */
    }
    this.source = null;
  }

  close() {
    this.stop();
    void this.ctx?.close();
    this.ctx = null;
    this.analyser = null;
  }
}