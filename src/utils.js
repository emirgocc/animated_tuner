export const centsOffToPercentage = (cents) =>
  cents ? 0.5 + cents / 100 : 0.5

export const getColorsArray = () => {
  // CSS değişkenlerini al
  const primaryColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary').trim();
  
  // Açık pembe ton oluştur (primary color'ın açık versiyonu)
  const lightPink = "#e89eac"; // Beyaza yakın pembe
  
  const baseColors = new Array(31).fill(lightPink);
  
  // Orta 5 çubuğu primary color yap
  baseColors[13] = primaryColor;
  baseColors[14] = primaryColor;
  baseColors[15] = primaryColor;
  baseColors[16] = primaryColor;
  baseColors[17] = primaryColor;
  
  return baseColors;
} 