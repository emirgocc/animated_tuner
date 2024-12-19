import React, { useEffect, useRef, useState } from "react";
import { Rive } from "@rive-app/canvas-single";
import autoCorrelate from "./autocorrelate"; // Otokorelasyon fonksiyonu
import "./App.css"; // Tema CSS'i dahil
import "./styles/home.css"; // Tema değişkenleri
import TunerRive from "./assets/tuner.riv"; // Yeni dosya yolu

const audioCtx = new window.AudioContext();
let analyserNode = audioCtx.createAnalyser();

const noteStrings = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

function getNoteFromPitchFrequency(freq) {
  return Math.round(12 * (Math.log(freq / 440) / Math.log(2))) + 69;
}

function getPitchFrequencyFromNote(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function centsOffPitch(frequencyPlayed, correctFrequency) {
  return Math.floor(
    (1200 * Math.log(frequencyPlayed / correctFrequency)) / Math.log(2)
  );
}

async function setupMic() {
  const mic = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });
  return mic;
}

function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end;
}

function App() {
  const canvasRef = useRef(null);
  const [playingNote, setPlayingNote] = useState("");
  const [frequency, setFrequency] = useState(0); // Frekansı saklamak için state
  const riveRef = useRef(null);

  useEffect(() => {
    let tuningValueInput;
    const buffer = new Float32Array(analyserNode.fftSize);

    const start = async () => {
      const mediaStream = await setupMic();
      const mediaSource = audioCtx.createMediaStreamSource(mediaStream);
      mediaSource.connect(analyserNode);

      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      riveRef.current = new Rive({
        src: TunerRive,
        canvas: canvasRef.current,
        autoplay: true,
        stateMachines: "State Machine 1",
        onLoad: () => {
          const inputs = riveRef.current.stateMachineInputs("State Machine 1");
          tuningValueInput = inputs[0];
          tuningValueInput.value = 50;
        },
      });

      const getSoundData = () => {
        analyserNode.getFloatTimeDomainData(buffer);
        const frequency = autoCorrelate(buffer, audioCtx.sampleRate);
        if (frequency > -1) {
          setFrequency(frequency); // Frekans değerini güncelle
          const midiPitch = getNoteFromPitchFrequency(frequency);
          const currentNote = noteStrings[midiPitch % 12];
          setPlayingNote(currentNote);

          const hzOffPitch = centsOffPitch(
            frequency,
            getPitchFrequencyFromNote(midiPitch)
          );
          tuningValueInput.value = lerp(
            tuningValueInput.value,
            hzOffPitch + 50,
            0.1
          );
        }
      };

      const intervalId = setInterval(getSoundData, 1);

      return () => clearInterval(intervalId);
    };

    start();
  }, []);

  return (
    <div
      className="App"
      style={{
        background: "var(--color-background)",
        color: "var(--color-text-normal)",
        fontFamily: "var(--font-sans)",
        padding: "var(--space-large)",
        textAlign: "center",
      }}
    >
      {/* Animasyon container'ı */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "var(--boxShadow-containers)",
          borderRadius: "var(--borderRadius-medium)",
          padding: "var(--space-small)", // Daha küçük padding
          background: "var(--gradient-inner)",
          marginTop: "var(--space-small)", // Container'ın üst boşluğunu daha da küçülttük
          marginBottom: "var(--space-small)", // Alt boşluğu da küçülttük
        }}
      >
        {/* Rive Animasyonu */}
        <canvas
          ref={canvasRef}
          id="rive-canvas"
          width="400"
          height="400"
          style={{
            marginBottom: "var(--space-small)", // Canvas ile nota arasındaki boşluk
          }}
        ></canvas>

        {/* Nota ve Frekans bilgileri */}
        <p
          style={{
            fontSize: "var(--fontSize-large)",
            marginBottom: "var(--space-small)", // Nota ile frekans arasındaki boşluk
          }}
        >
          {playingNote}
        </p>
        <p
          style={{
            fontSize: "var(--fontSize-medium)",
            color: "var(--color-grey)",
          }}
        >
          {frequency.toFixed(2)} Hz
        </p>
      </div>
    </div>
  );
}

export default App;
