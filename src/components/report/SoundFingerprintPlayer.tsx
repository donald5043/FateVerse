import { Pause, Play, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { SoundFingerprint } from '../../engines/sound-fingerprint-engine';

interface AudioGraph {
  context: AudioContext;
  master: GainNode;
  nodes: OscillatorNode[];
}

/** 用 Web Audio 播放命盤的聲音指紋：多個振盪器組成柔和的環境和弦，隨機微顫添生氣。 */
export default function SoundFingerprintPlayer({ fingerprint }: { fingerprint: SoundFingerprint }) {
  const [playing, setPlaying] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const graphRef = useRef<AudioGraph | undefined>(undefined);

  const stop = () => {
    const graph = graphRef.current;
    if (!graph) return;
    const now = graph.context.currentTime;
    graph.master.gain.cancelScheduledValues(now);
    graph.master.gain.setValueAtTime(graph.master.gain.value, now);
    graph.master.gain.linearRampToValueAtTime(0, now + 0.4);
    graph.nodes.forEach((node) => node.stop(now + 0.5));
    window.setTimeout(() => { void graph.context.close(); }, 600);
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
    const master = context.createGain();
    master.gain.setValueAtTime(0, context.currentTime);
    master.gain.linearRampToValueAtTime(0.85, context.currentTime + 1.2);
    master.connect(context.destination);

    const nodes: OscillatorNode[] = [];
    const makeVoice = (freq: number, gain: number, pan: number, type: OscillatorType, detune: number) => {
      const osc = context.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, context.currentTime);
      osc.detune.setValueAtTime(detune, context.currentTime);
      const voiceGain = context.createGain();
      voiceGain.gain.setValueAtTime(gain, context.currentTime);
      // 緩慢的音量起伏，讓和弦有呼吸感。
      const lfo = context.createOscillator();
      lfo.frequency.setValueAtTime(0.08 + Math.random() * 0.12, context.currentTime);
      const lfoGain = context.createGain();
      lfoGain.gain.setValueAtTime(gain * 0.4, context.currentTime);
      lfo.connect(lfoGain).connect(voiceGain.gain);
      osc.connect(voiceGain);
      // 部分舊版行動瀏覽器沒有 StereoPanner；缺少時直接連到主控。
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

    makeVoice(fingerprint.droneFreq, 0.12, 0, 'sine', 0);
    fingerprint.voices.forEach((voice) => makeVoice(voice.freq, voice.gain, voice.pan, voice.type, (Math.random() - 0.5) * 8));

    graphRef.current = { context, master, nodes };
    setPlaying(true);
  };

  return (
    <div className="rounded-2xl border border-gold/[0.16] bg-white/[0.03] p-5">
      <div className="flex items-center gap-2.5 text-gold"><Volume2 size={18} /><h3 className="font-serif text-base font-bold text-cream">聲音指紋</h3></div>
      <p className="mt-2 text-sm leading-6 text-mist">把你的命盤映射成一段環境音：以日主{fingerprint.rootNote}為根音的五聲音階和弦，五行占比決定和聲的層次。同一份命盤永遠是同一段聲音。</p>
      <button className="btn-secondary mt-4" type="button" onClick={() => (playing ? stop() : start())} disabled={unsupported}>
        {playing ? <><Pause size={16} />停止</> : <><Play size={16} />播放你的聲音</>}
      </button>
      {unsupported && <p className="mt-3 text-xs text-rose-200">這個瀏覽器不支援即時音訊合成。</p>}
      <p className="mt-3 text-xs leading-5 text-mist">聲音在你的裝置上即時合成，不會播放任何錄音檔，也不會上傳。建議戴上耳機。<span className="text-mist/80">iPhone 若沒聲音，請把側邊的靜音（響鈴）開關關掉，並調高音量。</span></p>
    </div>
  );
}
