import { Pause, Play, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { SoundFingerprint } from '../../engines/sound-fingerprint-engine';
import { hashString, mulberry32 } from '../../utils/seeded-random';

interface AudioGraph {
  context: AudioContext;
  master: GainNode;
  nodes: OscillatorNode[];
  timer?: number; // 旋律排程用的 setInterval id。
}

/** 以命盤種子生成殘響用的脈衝響應（指數衰減的噪音尾），讓聲音有空間感而非乾硬。 */
function createImpulseResponse(context: AudioContext, seconds: number, decay: number, random: () => number): AudioBuffer {
  const length = Math.max(1, Math.floor(context.sampleRate * seconds));
  const impulse = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      data[i] = (random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

/**
 * 用 Web Audio 播放命盤的聲音指紋。混音走「空靈」路線：
 * 低頻鼓音只作為極淡的地基（避免根音過重），和弦與旋律大量送進殘響與節拍延遲，
 * harsh 的波形（鋸齒、方波）各自再經一層低通削掉刺耳泛音，
 * 旋律採緩起緩落的長包絡而非撥弦，整體音量偏低、留白多。
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
    // 收尾放慢，讓殘響尾巴自然消散而不是被切斷。
    graph.master.gain.linearRampToValueAtTime(0, now + 1.4);
    graph.nodes.forEach((node) => node.stop(now + 1.5));
    window.setTimeout(() => { void graph.context.close(); }, 2200);
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
    const random = mulberry32(hashString(`${fingerprint.seed}:mix`));
    const t0 = context.currentTime;

    // 主控音量偏低，並以長淡入緩緩浮現。
    const master = context.createGain();
    master.gain.setValueAtTime(0, t0);
    master.gain.linearRampToValueAtTime(0.38, t0 + 3.2);
    master.connect(context.destination);

    // 整體柔化：低通削高頻刺耳感，高通清掉低頻轟隆，讓聲音清透而不厚重。
    const warmth = context.createBiquadFilter();
    warmth.type = 'lowpass';
    warmth.frequency.setValueAtTime(1150, t0);
    warmth.Q.setValueAtTime(0.4, t0);
    const clarity = context.createBiquadFilter();
    clarity.type = 'highpass';
    clarity.frequency.setValueAtTime(90, t0);
    warmth.connect(clarity).connect(master);

    // 極緩慢的濾波器起伏，讓音色像呼吸一樣明暗流動（神秘感的來源）。
    const filterLfo = context.createOscillator();
    filterLfo.frequency.setValueAtTime(0.035, t0);
    const filterLfoGain = context.createGain();
    filterLfoGain.gain.setValueAtTime(320, t0);
    filterLfo.connect(filterLfoGain).connect(warmth.frequency);
    filterLfo.start();

    // 空間：大殘響 + 與節拍對齊的延遲，是「空靈」的主要來源。
    const reverb = context.createConvolver();
    reverb.buffer = createImpulseResponse(context, 5, 2.6, random);
    const wet = context.createGain();
    wet.gain.setValueAtTime(1, t0);
    reverb.connect(wet).connect(warmth);

    const secPerBeat = 60 / fingerprint.bpm;
    const echo = context.createDelay(2);
    echo.delayTime.setValueAtTime(Math.min(1.9, secPerBeat * 0.75), t0); // 附點感的回聲
    const echoFeedback = context.createGain();
    echoFeedback.gain.setValueAtTime(0.32, t0);
    const echoLevel = context.createGain();
    echoLevel.gain.setValueAtTime(0.5, t0);
    echo.connect(echoFeedback).connect(echo);
    echo.connect(echoLevel).connect(reverb);

    const nodes: OscillatorNode[] = [];

    // 諧波豐富的波形（鋸齒／方波）各自再經一層低通，保留五行音色差異但不刺耳。
    const softCutoff = (type: OscillatorType): number => (type === 'sawtooth' || type === 'square' ? 620 : 1400);

    const makePad = (freq: number, gain: number, pan: number, type: OscillatorType, detune: number, lfoHz: number, sendWet: number) => {
      const osc = context.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      osc.detune.setValueAtTime(detune, t0);

      const tame = context.createBiquadFilter();
      tame.type = 'lowpass';
      tame.frequency.setValueAtTime(softCutoff(type), t0);
      tame.Q.setValueAtTime(0.3, t0);

      const voiceGain = context.createGain();
      voiceGain.gain.setValueAtTime(0, t0);
      voiceGain.gain.linearRampToValueAtTime(gain, t0 + 2.4 + random() * 1.6); // 各聲部錯開淡入

      // 緩慢的音量起伏，讓和弦有呼吸感；速率取自命盤種子。
      const lfo = context.createOscillator();
      lfo.frequency.setValueAtTime(lfoHz * 0.7, t0);
      const lfoGain = context.createGain();
      lfoGain.gain.setValueAtTime(gain * 0.45, t0);
      lfo.connect(lfoGain).connect(voiceGain.gain);

      osc.connect(tame).connect(voiceGain);

      let tail: AudioNode = voiceGain;
      if (typeof context.createStereoPanner === 'function') {
        const panner = context.createStereoPanner();
        panner.pan.setValueAtTime(pan, t0);
        voiceGain.connect(panner);
        tail = panner;
      }
      // 乾濕分送：濕的比例高，聲音才會飄。
      const dry = context.createGain();
      dry.gain.setValueAtTime(1 - sendWet, t0);
      tail.connect(dry).connect(warmth);
      const send = context.createGain();
      send.gain.setValueAtTime(sendWet, t0);
      tail.connect(send).connect(reverb);

      osc.start();
      lfo.start();
      nodes.push(osc, lfo);
    };

    // 鼓音：只留極淡的地基。原本 0.09 讓根音過重，這裡大幅壓低並幾乎全濕。
    makePad(fingerprint.droneFreq, 0.035, 0, 'sine', 0, 0.05, 0.85);

    // 和弦聲部：整體再壓低；且與根音同音高的聲部額外衰減，避免根音疊成兩層而突出。
    const rootHz = fingerprint.droneFreq * 2;
    fingerprint.voices.forEach((voice) => {
      const doublesRoot = Math.abs(voice.freq - rootHz) < 1.5;
      const level = voice.gain * (doublesRoot ? 0.18 : 0.4);
      makePad(voice.freq, level, voice.pan, voice.type, voice.detune, voice.lfoHz, 0.7);
    });

    // 旋律：緩起緩落的長包絡（像遠處的鐘聲），而非撥弦；大量送進延遲與殘響。
    const playNote = (freq: number, at: number, duration: number) => {
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, at);
      osc.detune.setValueAtTime((random() - 0.5) * 6, at);

      const env = context.createGain();
      const peak = 0.075;
      const attack = Math.min(0.5, duration * 0.35); // 緩緩浮現
      env.gain.setValueAtTime(0.0001, at);
      env.gain.exponentialRampToValueAtTime(peak, at + attack);
      env.gain.exponentialRampToValueAtTime(0.0001, at + duration * 1.9); // 長尾，音與音之間相互交疊

      const place = context.createGain();
      osc.connect(env).connect(place);

      const dry = context.createGain();
      dry.gain.setValueAtTime(0.28, at);
      place.connect(dry).connect(warmth);
      const send = context.createGain();
      send.gain.setValueAtTime(0.72, at);
      place.connect(send).connect(reverb);
      place.connect(echo);

      osc.start(at);
      osc.stop(at + duration * 2 + 0.3);
    };

    // 前瞻式排程：每 60ms 檢查一次，把接下來 0.35 秒內要響的旋律音先排進音訊時鐘，
    // 循環播放。用音訊時鐘而非 setTimeout 對齊，節奏才穩定。
    const steps = fingerprint.melody;
    let noteTime = t0 + 1.6; // 先讓和弦鋪開，旋律再進來
    let index = 0;
    const scheduleAhead = () => {
      if (!steps.length) return;
      while (noteTime < context.currentTime + 0.35) {
        const step = steps[index % steps.length];
        // 拍長放慢一倍，讓旋律從容、留白更多。
        const duration = step.beats * secPerBeat * 2;
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
      <p className="mt-2 text-sm leading-6 text-mist">把你的命盤映射成一段空靈的環境音樂：以日主{fingerprint.rootNote}為根音的五聲音階，遠處是呼吸般的和弦，上層飄著一段專屬你命盤的旋律，緩慢流動約每分鐘 {fingerprint.bpm} 拍。同一份命盤永遠是同一段音樂。</p>
      <button className="btn-secondary mt-4" type="button" onClick={() => (playing ? stop() : start())} disabled={unsupported}>
        {playing ? <><Pause size={16} />停止</> : <><Play size={16} />播放你的聲音</>}
      </button>
      {unsupported && <p className="mt-3 text-xs text-rose-200">這個瀏覽器不支援即時音訊合成。</p>}
      <p className="mt-3 text-xs leading-5 text-mist">聲音在你的裝置上即時合成，不會播放任何錄音檔，也不會上傳。建議戴上耳機，音量可以放心開大。<span className="text-mist/80">iPhone 若沒聲音，請把側邊的靜音（響鈴）開關關掉。</span></p>
    </div>
  );
}
