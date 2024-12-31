import React, { useEffect, useRef, useState } from "react";
import autoCorrelate from "./autocorrelate";
import "./App.css";
import "./styles/home.css";
import RecordButton from "./components/RecordButton/recordbutton";
import Footer from "./components/Footer/footer";
import Tuner from "./components/Tuner/Tuner";

const audioCtx = new window.AudioContext();
let analyserNode = audioCtx.createAnalyser();

const noteStrings = [
  "C", "C#", "D", "D#", "E", "F",
  "F#", "G", "G#", "A", "A#", "B"
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
    try {
      const mic = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
      return mic;
    } catch(error) {
        console.error("Mic erişim hatası", error)
        return null
    }
}

function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end;
}

function App() {
  const [playingNote, setPlayingNote] = useState("");
  const [frequency, setFrequency] = useState(0);
  const [centsOff, setCentsOff] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const intervalIdRef = useRef(null);
  const [prevCentsOff, setPrevCentsOff] = useState(0);
  const MAX_CENTS_JUMP = 8;

  const handleRecordToggle = async () => {
        if (!isRecording) {
        try {
            const stream = await setupMic();
             if (stream) {
                  setMediaStream(stream);
                  const mediaSource = audioCtx.createMediaStreamSource(stream);
                    mediaSource.connect(analyserNode);

                      if (audioCtx.state === "suspended") {
                          await audioCtx.resume();
                      }
                      startAnalysis();
                       setIsRecording(true);
             }
        } catch (error) {
            console.error("Error accessing microphone:", error);
        }
    } else {
      stopAnalysis();
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      setMediaStream(null);
      setIsRecording(false);
      setPlayingNote("");
      setFrequency(0);
    }
  };

  const startAnalysis = () => {
    const buffer = new Float32Array(analyserNode.fftSize);
    const getSoundData = () => {
      analyserNode.getFloatTimeDomainData(buffer);
      
      // Ses seviyesi kontrolü
      const volumeCheck = buffer.some(v => Math.abs(v) > 0.03);
      
      if (!volumeCheck) {
        return;
      }

      const frequency = autoCorrelate(buffer, audioCtx.sampleRate);
      if (frequency > -1 && frequency < 1000) {
        setFrequency(frequency);
        const midiPitch = getNoteFromPitchFrequency(frequency);
        const currentNote = noteStrings[midiPitch % 12];
        setPlayingNote(currentNote);

        const cents = centsOffPitch(
          frequency,
          getPitchFrequencyFromNote(midiPitch)
        );

        // Ani değişimleri kontrol et
        const centsDiff = Math.abs(cents - prevCentsOff);
        if (centsDiff > MAX_CENTS_JUMP) {
          // Ani değişim varsa, yumuşat
          const smoothedCents = prevCentsOff + (Math.sign(cents - prevCentsOff) * MAX_CENTS_JUMP);
          setCentsOff(smoothedCents);
          setPrevCentsOff(smoothedCents);
        } else {
          // Normal değişim
          setCentsOff(cents);
          setPrevCentsOff(cents);
        }
      }
    };

    intervalIdRef.current = setInterval(getSoundData, 1);
  };

  const stopAnalysis = () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    setPrevCentsOff(0);
  };

  const centsToPercentage = (cents) => {
    return (cents + 50) / 100;
  };

  return (
    <div className="App" style={{
      background: "var(--color-background)",
      color: "var(--color-text-normal)",
      fontFamily: "var(--font-sans)",
      padding: "var(--space-small)",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      maxWidth: "1280px",
      margin: "0 auto",
    }}>
      <div className="header" style={{
        alignSelf: "flex-start",
        width: "100%",
        marginBottom: "var(--space-none)",
        padding: "var(--space-none) calc(var(--space-small) * 6)",
        position: "relative",
        left: "0",
      }}>
        <h1 style={{
          fontFamily: "var(--font-sans)",
          fontSize: "1.40rem",
          userSelect: "none",
          margin: 0,
          display: "inline-block"
        }}>
          <span style={{ 
            color: "var(--color-text-dimmed)",
            display: "inline-block",
            fontSize: "1.20rem" 
          }}>
            emirgocc's{" "}
          </span>
          <span style={{ 
            color: "var(--color-primary)",
            display: "inline-block",
            transition: "var(--transition)",
            cursor: "pointer"
          }}
          onMouseEnter={(e) => e.target.style.color = "var(--color-text-normal)"}
          onMouseLeave={(e) => e.target.style.color = "var(--color-primary)"}
          >
            Tuner
          </span>
        </h1>
      </div>
      
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "var(--boxShadow-containers)",
        borderRadius: "var(--borderRadius-medium)",
        padding: "var(--space-medium) var(--space-small)",
        background: "var(--gradient-inner)",
        marginTop: "var(--space-none)",
        marginBottom: "var(--space-small)",
        flex: 1,
        border: `var(--border-width) solid var(--border-color)`,
        width: "100%",
        maxWidth: "350px", // Genişliği artırdık
        gap: "var(--space-large)" // Tuner ve button arası mesafe
      }}>
        <Tuner 
          centsOff={centsOff}
          frequency={frequency}
          isRecording={isRecording}
          playingNote={playingNote}
        />
        
        <RecordButton
          onClick={handleRecordToggle}
          pressed={isRecording}
          style={{
            outline: "none",
            WebkitTapHighlightColor: "transparent",
            marginTop: "var(--space-medium)"
          }}
        />
      </div>
      
      <Footer />
    </div>
  );
}

export default App;