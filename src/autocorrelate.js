/**
 * AutoCorrelate function to analyze audio buffer and calculate pitch frequency.
 * @param {Float32Array} buf - The audio buffer.
 * @param {number} sampleRate - The sample rate of the audio context.
 * @returns {number} - The pitch frequency in Hz or -1 if no signal is detected.
 */
export default function autoCorrelate(buf, sampleRate) {
    let SIZE = buf.length;
    let rms = 0;
  
    // Calculate root mean square (RMS) to check for signal presence.
    for (let i = 0; i < SIZE; i++) {
      const val = buf[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
  
    // If the signal is too weak, return -1.
    if (rms < 0.005) return -1;
  
    // Trim the buffer to ignore low signal regions.
    let r1 = 0,
      r2 = SIZE - 1;
    const threshold = 0.1;
  
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buf[i]) < threshold) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buf[SIZE - i]) < threshold) {
        r2 = SIZE - i;
        break;
      }
    }
  
    buf = buf.slice(r1, r2);
    SIZE = buf.length;
  
    // Perform autocorrelation.
    const correlation = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE - i; j++) {
        correlation[i] += buf[j] * buf[j + i];
      }
    }
  
    // Find the first positive slope point in the autocorrelation.
    let d = 0;
    while (correlation[d] > correlation[d + 1]) d++;
  
    // Find the maximum correlation value after the first positive slope.
    let maxval = -1,
      maxpos = -1;
    for (let i = d; i < SIZE; i++) {
      if (correlation[i] > maxval) {
        maxval = correlation[i];
        maxpos = i;
      }
    }
  
    // Refine the period (T0) using quadratic interpolation.
    let T0 = maxpos;
    
    // Daha hassas interpolasyon için kontrol ekleyelim
    if (T0 > 0 && T0 < correlation.length - 1) {
      const x1 = correlation[T0 - 1],
            x2 = correlation[T0],
            x3 = correlation[T0 + 1];
      
      const a = (x1 + x3 - 2 * x2) / 2;
      const b = (x3 - x1) / 2;
      
      // a değeri çok küçükse interpolasyon yapmayalım
      if (Math.abs(a) > 0.0001) {
        const adjustedT0 = T0 - b / (2 * a);
        // Interpolasyon sonucu makul bir aralıktaysa kullanalım
        if (Math.abs(adjustedT0 - T0) < 1) {
          T0 = adjustedT0;
        }
      }
    }
  
    // Return the pitch frequency.
    return sampleRate / T0;
  }
  