import React, { useEffect, useRef, useState } from "react";
import { Rive } from "@rive-app/canvas-single";
import autoCorrelate from "./autocorrelate";
import "./App.css";
import "./styles/home.css";
import TunerRive from "./assets/tuner.riv";
import RecordButton from "./components/RecordButton/recordbutton";
import Footer from "./components/Footer/footer";

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
  const canvasRef = useRef(null);
  const [playingNote, setPlayingNote] = useState("");
  const [frequency, setFrequency] = useState(0);
  const riveRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const intervalIdRef = useRef(null);

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
      const frequency = autoCorrelate(buffer, audioCtx.sampleRate);
      if (frequency > -1) {
        setFrequency(frequency);
        const midiPitch = getNoteFromPitchFrequency(frequency);
        const currentNote = noteStrings[midiPitch % 12];
        setPlayingNote(currentNote);

        const hzOffPitch = centsOffPitch(
          frequency,
          getPitchFrequencyFromNote(midiPitch)
        );
        
        if (riveRef.current) {
          const inputs = riveRef.current.stateMachineInputs("State Machine 1");
          const tuningValueInput = inputs[0];
          tuningValueInput.value = lerp(
            tuningValueInput.value,
            hzOffPitch + 50,
            0.1
          );
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
  };

  useEffect(() => {
    riveRef.current = new Rive({
      src: TunerRive,
      canvas: canvasRef.current,
      autoplay: true,
      stateMachines: "State Machine 1",
      onLoad: () => {
        const inputs = riveRef.current.stateMachineInputs("State Machine 1");
        const tuningValueInput = inputs[0];
        tuningValueInput.value = 50;
      },
    });

    return () => {
      stopAnalysis();
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
       if(riveRef.current) {
            riveRef.current.cleanup()
        }
    };
  }, []);

  return (

    <div className="App" style={{
      background: "var(--color-background)",
      color: "var(--color-text-normal)",
      fontFamily: "var(--font-sans)",
      padding: "var(--space-small)",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",  // İçeriği yatayda ortala
      maxWidth: "1280px",   // Maksimum genişlik
      margin: "0 auto",     // Sayfada ortala
  }}>
    <div className="header" style={{
    alignSelf: "flex-start",
    width: "100%",
    marginBottom: "var(--space-none)",
    padding: "var(--space-none) calc(var(--space-small) * 6)", // Sağ padding'i biraz artırıyoruz
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
          padding: "var(--space-small)",
          background: "var(--gradient-inner)",
          marginTop: "var(--space-extraSmall)",
          marginBottom: "var(--space-small)",
          flex: 1,
          border: `var(--border-width) solid var(--border-color)`,
          width: "100%",      // Container genişliği
          maxWidth: "350px"   // Maksimum container genişliği
      }}>
            <canvas
                ref={canvasRef}
                id="rive-canvas"
                width="320"
                height="320"
                style={{
                  marginBottom: "var(--space-small)",
                }}
            />
            <p style={{
                fontSize: "var(--fontSize-large)",
                marginBottom: "var(--space-small)",
                userSelect: "none",
            }}>
                 {isRecording ? (playingNote || "--") : "--"}
           </p>
            <p style={{
                fontSize: "var(--fontSize-small)",
                 color: "var(--color-grey)",
                  userSelect: "none",
            }}>
                {isRecording ? `${frequency.toFixed(2)} Hz` : "--"}
            </p>
           <RecordButton
              onClick={handleRecordToggle}
              pressed={isRecording}
              style={{
                outline: "none",
                WebkitTapHighlightColor: "transparent",
              }}
             />
       </div>
       <Footer />
    </div>
  );
}

export default App;