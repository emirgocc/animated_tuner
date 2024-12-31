import React from 'react';
import { GaugeComponent } from 'react-gauge-component';
import { getColorsArray } from '../../utils';
import './Tuner.css';

const Tuner = ({ centsOff, frequency, isRecording, playingNote }) => {
  const isInTune = isRecording && centsOff >= -5 && centsOff <= 5;

  React.useEffect(() => {
    const paths = document.querySelectorAll('.doughnut g.subArc:nth-child(n+14):nth-child(-n+18) path');
    paths.forEach(path => {
      if (isInTune) {
        path.classList.add('in-tune');
      } else {
        path.classList.remove('in-tune');
      }
    });
  }, [isInTune, centsOff]);

  return (
    <>
      <div style={{ position: 'relative' }}>
        <GaugeComponent
          value={centsOff}
          type="semicircle"
          arc={{
            width: 0.18,
            padding: 0.02,
            cornerRadius: 0,
            subArcs: Array.from({ length: 31 }, (_, index) => ({
              limit: -50 + (index + 1) * (100/31),
              color: getColorsArray()[index],
              showTick: false,
              length: index >= 13 && index <= 17 ? 0.7 : 0.65,
              showSegmentValue: false,
              radius: 0
            }))
          }}
          pointer={{
            color: '#161719',
            length: 0.85,
            width: 15,
            baseWidth: 25,
            elastic: false
          }}
          labels={{
            valueLabel: { display: 'none', fontSize: 0 },
            tickLabels: { display: 'none', fontSize: 0 },
            markLabel: { display: 'none', fontSize: 0 }
          }}
          minValue={-50}
          maxValue={50}
          style={{ 
            width: '320px', 
            height: '180px',
            marginTop: '0px',
          }}
          arcsLength={[0.3]}
          needleTransitionDuration={0}
          needleTransition="none"
          formatTextValue={() => ''}
          currentValueText=""
          hideText={true}
          textColor="transparent"
          arcPadding={0}
          cornerRadius={0}
          tickLength={0}
        />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          background: 'transparent'
        }} />
      </div>
      
      <p className="note-display">
        {isRecording ? (playingNote || "--") : "--"}
      </p>
      <p className="frequency-display">
        {isRecording ? `${frequency.toFixed(2)} Hz` : "--"}
      </p>
    </>
  );
};

export default Tuner; 