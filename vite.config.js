import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ["**/*.riv"], // .riv dosyalarını varlık olarak ekle
});
