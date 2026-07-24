import { Pause, Play, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { SoundFingerprint } from '../../engines/sound-fingerprint-engine';

interface AudioGraph {
  context: AudioContext;
  master: GainNode;
  nodes: OscillatorNode[];
  timer?: number; // 旋律排程用的 setInterval id。
}

/**
 * 用 Web Audio 播放命盤的聲音指紋：底層是柔和的環境和弦（pad）與低頻鼓音，
 * 上層疊一段依命盤決定的五聲音階旋律，配合 bpm 形成節奏。整體經過低通濾波，
 * 音量偏低、起落平緩，聽起來溫柔不刺耳。
 */
export default function SoundFingerprintPlayer({ fingerprint }: { fingerprint: SoundFingerprint }) {
  const [playing, setPlaying] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const graphRef = useRef<AudioGraph | undefined>(undefined);

  const stop = () => {
    const graph = graphRef.current;
    if (!graph) return;
    if (graph.timer !== undefined) window.clearInterval(graph.timer);
    const now = graph.context.currentTime;
    graph.master.gain.cancelScheduledValues(now);
    graph.master.gain.setValueAtTime(graph.master.gain.value, now);
    graph.master.gain.linearRampToValueAtTime(0, now + 0.6);
    graph.nodes.forEach((node) => node.stop(now + 0.7));
    window.setTimeout(() => { void graph.context.close(); }, 900);
    graphRef.current = undefined;
    setPlaying(false);
  };

  useEffect(() => () => { if (graphRef.current) stop(); }, []);

  const start = () => {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) { setUnsupported(true); return; }
    const context = new AudioCtx();
    // iOS/行動裝置的 AudioContext 常以 suspended 起始，必須在使用者手勢中 resume 才會出聲。
    void context.resume();

    // 主控音量偏低、緩慢淡入，讓整體更溫柔。
    const master = context.createGain();
    master.gain.setValueAtTime(0, context.currentTime);
    master.gain.linearRampToValueAtTime(0.5, context.currentTime + 1.8);

    // 低通濾波器修掉方波／鋸齒波的尖銳高頻，是「柔和」的關鍵。
    const warmth = context.createBiquadFilter();
    warmth.type = 'lowpass';
    warmth.frequency.setValueAtTime(1600, context.currentTime);
    warmth.Q.setValueAtTime(0.6, context.currentTime);
    master.connect(warmth).connect(context.destination);

    const nodes: OscillatorNode[] = [];

    // 底層 pad：延續原本的和弦，但音量調小、只作為柔和襯底。
    const makePad = (freq: number, gain: number, pan: number, type: OscillatorType, detune: number, lfoHz: number) => {
      const osc = context.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, context.currentTime);
      osc.detune.setValueAtTime(detune, context.currentTime);
      const voiceGain = context.createGain();
      voiceGain.gain.setValueAtTime(gain, context.currentTime);
      // 緩慢的音量起伏，讓和弦有呼吸感；速率取自命盤種子。
      const lfo = context.createOscillator();
      lfo.frequency.setValueAtTime(lfoHz, context.currentTime);
      const lfoGain = context.createGain();
      lfoGain.gain.setValueAtTime(gain * 0.4, context.currentTime);
      lfo.connect(lfoGain).connect(voiceGain.gain);
      osc.connect(voiceGain);
      if (typeof context.createStereoPanner === 'function') {
        const panner = context.createStereoPanner();
        panner.pan.setValueAtTime(pan, context.currentTime);
        voiceGain.connect(panner).connect(master);
      } else {
        voiceGain.connect(master);
      }
      osc.start();
      lfo.start();
      nodes.push(osc, lfo);
    };

    makePad(fingerprint.droneFreq, 0.09, 0, 'sine', 0, 0.07);
    fingerprint.voices.forEach((voice) => makePad(voice.freq, voice.gain * 0.55, voice.pan, voice.type, voice.detune, voice.lfoHz));

    // 上層旋律：每個音是一顆柔和的三角波，帶快起慢落的包絡（像撥弦），依 bpm 排程。
    const playNote = (freq: number, at: number, duration: number) => {
      const osc = context.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, at);
      const env = context.createGain();
      const peak = 0.16;
      env.gain.setValueAtTime(0, at);
      env.gain.linearRampToValueAtTime(peak, at + 0.03); // 快起
      env.gain.exponentialRampToValueAtTime(0.0001, at + Math.max(0.18, duration * 0.95)); // 慢落
      osc.connect(env).connect(master);
      osc.start(at);
      osc.stop(at + duration + 0.05);
    };

    // 前瞻式排程：每 60ms 檢查一次，把接下來 0.35 秒內要響的旋律音先排進音訊時鐘，
    // 循環播放。用音訊時鐘而非 setTimeout 對齊，節奏才穩定。
    const secPerBeat = 60 / fingerprint.bpm;
    const steps = fingerprint.melody;
    let noteTime = context.currentTime + 0.4;
    let index = 0;
    const scheduleAhead = () => {
      if (!steps.length) return;
      while (noteTime < context.currentTime + 0.35) {
        const step = steps[index % steps.length];
        const duration = step.beats * secPerBeat;
        if (step.freq) playNote(step.freq, noteTime, duration);
        noteTime += duration;
        index += 1;
      }
    };
    scheduleAhead();
    const timer = window.setInterval(scheduleAhead, 60);

    graphRef.current = { context, master, nodes, timer };
    setPlaying(true);
  };

  return (
    <div className="rounded-2xl border border-gold/[0.16] bg-white/[0.03] p-5">
      <div className="flex items-center gap-2.5 text-gold"><Volume2 size={18} /><h3 className="font-serif text-base font-bold text-cream">聲音指紋</h3></div>
      <p className="mt-2 text-sm leading-6 text-mist">把你的命盤映射成一段柔和的環境音樂：以日主{fingerprint.rootNote}為根音的五聲音階，下層是呼吸般的和弦襯底，上層流動著一段專屬你命盤的旋律，節奏約每分鐘 {fingerprint.bpm} 拍。同一份命盤永遠是同一段音樂。</p>
      <button className="btn-secondary mt-4" type="button" onClick={() => (playing ? stop() : start())} disabled={unsupported}>
        {playing ? <><Pause size={16} />停止</> : <><Play size={16} />播放你的聲音</>}
      </button>
      {unsupported && <p className="mt-3 text-xs text-rose-200">這個瀏覽器不支援即時音訊合成。</p>}
      <p className="mt-3 text-xs leading-5 text-mist">聲音在你的裝置上即時合成，不會播放任何錄音檔，也不會上傳。建議戴上耳機。<span className="text-mist/80">iPhone 若沒聲音，請把側邊的靜音（響鈴）開關關掉，並調高音量。</span></p>
    </div>
  );
}
